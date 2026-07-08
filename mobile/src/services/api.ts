import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/utils/constants';
import { AuthTokens } from '@/types';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const tokensJson = await SecureStore.getItemAsync('bigstarz_tokens');
      if (tokensJson) {
        const tokens: AuthTokens = JSON.parse(tokensJson);
        if (tokens.accessToken) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
      }
    } catch (error) {
      console.warn('Error reading tokens from secure store:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokensJson = await SecureStore.getItemAsync('bigstarz_tokens');
        if (tokensJson) {
          const tokens: AuthTokens = JSON.parse(tokensJson);
          
          const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: tokens.refreshToken,
          });

          if (refreshResponse.data.success) {
            const newTokens: AuthTokens = refreshResponse.data.data;
            await SecureStore.setItemAsync('bigstarz_tokens', JSON.stringify(newTokens));
            
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        await SecureStore.deleteItemAsync('bigstarz_tokens');
        await SecureStore.deleteItemAsync('bigstarz_user');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
