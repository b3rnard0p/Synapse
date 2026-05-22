import { useCallback } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useMoviesStore } from '@/stores/movies.store';
import { useTicketsStore } from '@/stores/tickets.store';

/**
 * Hook to get auth state and actions
 */
export function useAuth() {
  const { user, isLoading, isAuthenticated, error, loginWithGoogle, logout, clearError } =
    useAuthStore();

  return { user, isLoading, isAuthenticated, error, loginWithGoogle, logout, clearError };
}

/**
 * Hook for movie operations
 */
export function useMovies() {
  const {
    upcoming, nowPlaying, isLoading, error,
    fetchUpcoming, fetchNowPlaying,
    upcomingPage, nowPlayingPage, hasMoreUpcoming, hasMoreNowPlaying,
  } = useMoviesStore();

  const loadMoreUpcoming = useCallback(() => {
    if (hasMoreUpcoming && !isLoading) {
      fetchUpcoming(upcomingPage + 1);
    }
  }, [hasMoreUpcoming, isLoading, upcomingPage]);

  const loadMoreNowPlaying = useCallback(() => {
    if (hasMoreNowPlaying && !isLoading) {
      fetchNowPlaying(nowPlayingPage + 1);
    }
  }, [hasMoreNowPlaying, isLoading, nowPlayingPage]);

  return { upcoming, nowPlaying, isLoading, error, loadMoreUpcoming, loadMoreNowPlaying };
}

/**
 * Hook for ticket operations
 */
export function useTickets() {
  const { tickets, isLoading, error, fetchTickets, purchaseTicket, checkin } = useTicketsStore();
  const upcomingTickets = tickets.filter((t) => t.status === 'confirmed' && new Date(t.session_datetime) > new Date());
  const pastTickets = tickets.filter((t) => t.status === 'used' || new Date(t.session_datetime) < new Date());

  return { tickets, upcomingTickets, pastTickets, isLoading, error, fetchTickets, purchaseTicket, checkin };
}

/**
 * Hook for points and rewards
 */
export function usePoints() {
  const { pointsBalance, rewards, pointsHistory, fetchPoints, fetchRewards } = useTicketsStore();
  return { pointsBalance, rewards, pointsHistory, fetchPoints, fetchRewards };
}
