import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, logoutUser, registerUser } from '../store/slices/authSlice';
import type { AuthState } from '../types';

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  firebaseUser: AuthState['firebaseUser'];
  appUser: AuthState['appUser'];
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  }) => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((s) => s.auth);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      await dispatch(loginUser({ email, password })).unwrap();
    },
    [dispatch],
  );

  const logout = useCallback(async (): Promise<void> => {
    await dispatch(logoutUser()).unwrap();
  }, [dispatch]);

  const register = useCallback(
    async (params: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      dateOfBirth: string;
    }): Promise<void> => {
      await dispatch(registerUser(params)).unwrap();
    },
    [dispatch],
  );

  return {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    firebaseUser: auth.firebaseUser,
    appUser: auth.appUser,
    login,
    logout,
    register,
  };
}
