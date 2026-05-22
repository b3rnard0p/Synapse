import { create } from 'zustand';
import { User, GenrePreference } from '@/types/user.types';
import { authService } from '@/services/api/auth.service';
import { getToken } from '@/services/api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  /**
   * Called on app startup to restore session
   */
  initialize: async () => {
    set({ isLoading: true });
    try {
      const token = await getToken();
      if (token) {
        const user = await authService.me();
        set({ user, token, isAuthenticated: true });
      }
    } catch {
      // Token invalid or expired — clear state
      set({ user: null, token: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Login with Google OAuth ID token
   */
  loginWithGoogle: async (idToken: string) => {
    console.log('[AUTH_FLOW] store.loginWithGoogle iniciando...');
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await authService.googleLogin(idToken);
      console.log('[AUTH_FLOW] store.loginWithGoogle: Backend retornou 200 OK. Atualizando store...');
      set({ user, token, isAuthenticated: true });
    } catch (error: any) {
      console.error('[AUTH_FLOW] store.loginWithGoogle: Backend retornou ERRO!', error);
      const message = error?.response?.data?.error || 'Erro ao fazer login';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Logout and clear all state
   */
  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } finally {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (updates: Partial<User>) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...updates } });
    }
  },

  clearError: () => set({ error: null }),
}));
