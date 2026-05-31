import apiClient, { saveToken, clearToken } from './client';
import { AuthResponse, User } from '@/types/user.types';

export const authService = {
  /**
   * Authenticate with Google OAuth ID token
   */
  googleLogin: async (idToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/google', { id_token: idToken });
    await saveToken(response.data.token);
    return response.data;
  },

  /**
   * Get current authenticated user
   */
  me: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Logout and clear stored token
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.delete('/auth/logout');
    } finally {
      await clearToken();
    }
  },

  /**
   * Update user push notification token
   */
  updatePushToken: async (userId: number, pushToken: string): Promise<void> => {
    await apiClient.patch(`/users/${userId}`, { user: { push_token: pushToken } });
  },

  /**
   * Update user preferences (including genres)
   */
  updatePreferences: async (userId: number, preferences: any): Promise<void> => {
    await apiClient.put(`/users/${userId}/preferences`, { preferences });
  },
};
