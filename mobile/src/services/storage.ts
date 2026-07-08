import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const storageService = {
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async setSecureItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async getSecureItem(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  },

  async removeSecureItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },

  async clearAll(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    for (const key of keys) {
      await AsyncStorage.removeItem(key);
    }
  },
};
