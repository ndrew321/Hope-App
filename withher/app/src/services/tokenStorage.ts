import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'idToken';

async function setNativeToken(token: string): Promise<void> {
  if (typeof SecureStore.setItemAsync !== 'function') return;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function getNativeToken(): Promise<string | null> {
  if (typeof SecureStore.getItemAsync !== 'function') return null;
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function deleteNativeToken(): Promise<void> {
  if (typeof SecureStore.deleteItemAsync !== 'function') return;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export const tokenStorage = {
  async set(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);
      }
      return;
    }
    await setNativeToken(token);
  },

  async get(): Promise<string | null> {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return null;
      return localStorage.getItem(TOKEN_KEY);
    }
    return getNativeToken();
  },

  async remove(): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
      }
      return;
    }
    await deleteNativeToken();
  },
};