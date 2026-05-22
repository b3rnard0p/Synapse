import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Config from '@/constants/config';

const TOKEN_KEY = 'synapse_auth_token';

// ─── Create Axios Instance ────────────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: Config.API_URL,
  timeout: Config.REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request Interceptor: Attach JWT Token ────────────────────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Usando a função auxiliar que já trata o Platform.OS === 'web'
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── Response Interceptor: Handle 401 ────────────────────────────────────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Usando a função auxiliar que já trata a Web
      await clearToken();
    }
    return Promise.reject(error);
  },
);

// ─── Token Helpers ────────────────────────────────────────────────────────────
export const saveToken = (token: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token);
    return Promise.resolve();
  }
  return SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const clearToken = () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
    return Promise.resolve();
  }
  return SecureStore.deleteItemAsync(TOKEN_KEY);
};

export const getToken = () => {
  if (Platform.OS === 'web') {
    return Promise.resolve(localStorage.getItem(TOKEN_KEY));
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export default apiClient;
