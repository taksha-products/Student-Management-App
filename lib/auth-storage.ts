import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { AuthUser } from "./types";

const ACCESS_KEY = "taksha_access_token";
const REFRESH_KEY = "taksha_refresh_token";
const USER_KEY = "taksha_user";

/** SecureStore has no working native implementation on web. */
const useWebStorage =
  Platform.OS === "web" || typeof document !== "undefined";

/** iOS: readable only while device is unlocked; not restored to another device from backup. */
const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
};

const webGet = (key: string): string | null => {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const webSet = (key: string, value: string): void => {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
};

const webRemove = (key: string): void => {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    // ignore
  }
};

const setItem = async (key: string, value: string): Promise<void> => {
  if (useWebStorage) {
    webSet(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value, SECURE_OPTIONS);
};

const getItem = async (key: string): Promise<string | null> => {
  if (useWebStorage) {
    return webGet(key);
  }
  return SecureStore.getItemAsync(key, SECURE_OPTIONS);
};

const deleteItem = async (key: string): Promise<void> => {
  if (useWebStorage) {
    webRemove(key);
    return;
  }
  await SecureStore.deleteItemAsync(key, SECURE_OPTIONS);
};

export const saveSession = async (
  accessToken: string,
  refreshToken: string,
  user: AuthUser
): Promise<void> => {
  await setItem(ACCESS_KEY, accessToken);
  await setItem(REFRESH_KEY, refreshToken);
  await setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = async (): Promise<void> => {
  await deleteItem(ACCESS_KEY);
  await deleteItem(REFRESH_KEY);
  await deleteItem(USER_KEY);
};

export const getAccessToken = (): Promise<string | null> => getItem(ACCESS_KEY);

export const getRefreshToken = (): Promise<string | null> => getItem(REFRESH_KEY);

export const getStoredUser = async (): Promise<AuthUser | null> => {
  const raw = await getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const updateStoredTokens = async (
  accessToken: string,
  refreshToken: string
): Promise<void> => {
  await setItem(ACCESS_KEY, accessToken);
  await setItem(REFRESH_KEY, refreshToken);
};
