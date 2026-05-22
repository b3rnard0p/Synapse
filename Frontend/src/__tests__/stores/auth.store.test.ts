import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/api/auth.service';

jest.mock('@/services/api/auth.service');
jest.mock('@/services/api/client', () => ({
  getToken: jest.fn().mockResolvedValue(null),
  saveToken: jest.fn(),
  clearToken: jest.fn(),
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  avatar_url: null,
  points_balance: 0,
  active: true,
  push_token: null,
  genre_preferences: [],
  preferences: {},
  created_at: new Date().toISOString(),
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('sets isAuthenticated to false when no token exists', async () => {
      const { result } = renderHook(() => useAuthStore());
      await act(async () => {
        await result.current.initialize();
      });
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('loginWithGoogle', () => {
    it('sets user and token on successful login', async () => {
      (authService.googleLogin as jest.Mock).mockResolvedValue({
        token: 'test-token',
        user: mockUser,
      });

      const { result } = renderHook(() => useAuthStore());
      await act(async () => {
        await result.current.loginWithGoogle('google-id-token');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('test-token');
    });

    it('sets error on failed login', async () => {
      const error = { response: { data: { error: 'Token inválido' } } };
      (authService.googleLogin as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());
      await act(async () => {
        try {
          await result.current.loginWithGoogle('bad-token');
        } catch {}
      });

      expect(result.current.error).toBe('Token inválido');
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('clears user state on logout', async () => {
      useAuthStore.setState({ user: mockUser, token: 'test', isAuthenticated: true });
      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
