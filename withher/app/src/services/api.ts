import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { store } from '../store';
import { refreshIdToken, resetAuth } from '../store/slices/authSlice';
import { resetUser } from '../store/slices/userSlice';
import { resetMatches } from '../store/slices/matchSlice';
import { resetMessages } from '../store/slices/messageSlice';
import { resetCommunity } from '../store/slices/communitySlice';
import type { ApiResponse } from '../types';
import { tokenStorage } from './tokenStorage';

const DEFAULT_PROD_API_URL = 'https://withher-api.onrender.com/api';
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_PROD_API_URL;

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from SecureStore or Redux state
axiosInstance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  let token = store.getState().auth.idToken;
  if (!token) {
    token = await tokenStorage.get();
  }
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

// Auto-refresh token on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const result = await store.dispatch(refreshIdToken());
        if (refreshIdToken.fulfilled.match(result)) {
          const newToken = result.payload as string;
          await tokenStorage.set(newToken);
          processQueue(null, newToken);
          if (originalRequest.headers)
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear all state and redirect to auth
        store.dispatch(resetAuth());
        store.dispatch(resetUser());
        store.dispatch(resetMatches());
        store.dispatch(resetMessages());
        store.dispatch(resetCommunity());
        await tokenStorage.remove();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

function extractData<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data;
}

export const apiService = {
  get<T>(url: string): Promise<T> {
    return axiosInstance.get<ApiResponse<T>>(url).then(extractData);
  },
  post<T>(url: string, data: unknown): Promise<T> {
    return axiosInstance.post<ApiResponse<T>>(url, data).then(extractData);
  },
  patch<T>(url: string, data: unknown): Promise<T> {
    return axiosInstance.patch<ApiResponse<T>>(url, data).then(extractData);
  },
  put<T>(url: string, data: unknown): Promise<T> {
    return axiosInstance.put<ApiResponse<T>>(url, data).then(extractData);
  },
  delete<T = void>(url: string): Promise<T> {
    return axiosInstance.delete<ApiResponse<T>>(url).then(extractData);
  },
  postForm<T>(url: string, formData: FormData): Promise<T> {
    return axiosInstance
      .post<ApiResponse<T>>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(extractData);
  },
};
