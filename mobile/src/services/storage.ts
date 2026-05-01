/**
 * Unified storage abstraction.
 * - SecureStore: for sensitive data (tokens, user credentials)
 * - AsyncStorage: for non-sensitive app data (balances, preferences)
 */
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const secureStorage = {
  get: (key: string) => SecureStore.getItemAsync(key),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  delete: (key: string) => SecureStore.deleteItemAsync(key),
};

export const appStorage = {
  get: (key: string) => AsyncStorage.getItem(key),
  set: (key: string, value: string) => AsyncStorage.setItem(key, value),
  delete: (key: string) => AsyncStorage.removeItem(key),
};
