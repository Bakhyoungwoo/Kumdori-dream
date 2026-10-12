import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const REFRESH_KEY = 'ourcut.refreshToken';
export const ACCESS_KEY = 'ourcut.accessToken';

// expo-secure-store는 웹을 지원하지 않으므로 웹(미리보기·테스트)에서는 localStorage로 대체한다
const web = Platform.OS === 'web';

export const tokenStore = {
  async get(key: string): Promise<string | null> {
    if (web) {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (web) {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {}
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (web) {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {}
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
