import api from './api';
import * as SecureStore from 'expo-secure-store';
import { User, LoginCredentials, RegisterData, AuthTokens, ApiResponse } from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await api.post('/auth/login', credentials);
    if (response.data.success && response.data.data?.tokens) {
      await SecureStore.setItemAsync('bigstarz_tokens', JSON.stringify(response.data.data.tokens));
      await SecureStore.setItemAsync('bigstarz_user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  async register(data: RegisterData): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await api.post('/auth/register', data);
    if (response.data.success && response.data.data?.tokens) {
      await SecureStore.setItemAsync('bigstarz_tokens', JSON.stringify(response.data.data.tokens));
      await SecureStore.setItemAsync('bigstarz_user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      await SecureStore.deleteItemAsync('bigstarz_tokens');
      await SecureStore.deleteItemAsync('bigstarz_user');
    }
  },

  async refreshToken(): Promise<ApiResponse<AuthTokens>> {
    const tokensJson = await SecureStore.getItemAsync('bigstarz_tokens');
    if (!tokensJson) {
      throw new Error('No refresh token found');
    }
    const tokens: AuthTokens = JSON.parse(tokensJson);
    const response = await api.post('/auth/refresh', {
      refreshToken: tokens.refreshToken,
    });
    if (response.data.success && response.data.data) {
      await SecureStore.setItemAsync('bigstarz_tokens', JSON.stringify(response.data.data));
    }
    return response.data;
  },

  async getStoredUser(): Promise<User | null> {
    const userJson = await SecureStore.getItemAsync('bigstarz_user');
    return userJson ? JSON.parse(userJson) : null;
  },

  async getStoredTokens(): Promise<AuthTokens | null> {
    const tokensJson = await SecureStore.getItemAsync('bigstarz_tokens');
    return tokensJson ? JSON.parse(tokensJson) : null;
  },

  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
};
