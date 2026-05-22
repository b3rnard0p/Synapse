import { create } from 'zustand';
import { Movie, MovieDetail, MovieListResponse } from '@/types/movie.types';
import { moviesService } from '@/services/api/movies.service';

interface MoviesState {
  upcoming: Movie[];
  nowPlaying: Movie[];
  favorites: Movie[];
  currentMovie: MovieDetail | null;
  searchResults: Movie[];
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
  upcomingPage: number;
  nowPlayingPage: number;
  hasMoreUpcoming: boolean;
  hasMoreNowPlaying: boolean;

  // Actions
  fetchUpcoming: (page?: number) => Promise<void>;
  fetchNowPlaying: (page?: number) => Promise<void>;
  fetchMovieDetails: (tmdbId: number) => Promise<void>;
  searchMovies: (query: string) => Promise<void>;
  clearSearch: () => void;
  fetchFavorites: (userId: number) => Promise<void>;
  toggleFavorite: (userId: number, movie: Movie) => Promise<void>;
  clearError: () => void;
}

export const useMoviesStore = create<MoviesState>((set, get) => ({
  upcoming: [],
  nowPlaying: [],
  favorites: [],
  currentMovie: null,
  searchResults: [],
  isLoading: false,
  isSearching: false,
  error: null,
  upcomingPage: 1,
  nowPlayingPage: 1,
  hasMoreUpcoming: true,
  hasMoreNowPlaying: true,

  fetchUpcoming: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const data = await moviesService.getUpcoming(page);
      set((state) => ({
        upcoming: page === 1 ? data.results : [...state.upcoming, ...data.results],
        upcomingPage: page,
        hasMoreUpcoming: page < data.total_pages,
      }));
    } catch {
      set({ error: 'Erro ao carregar próximas estreias' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchNowPlaying: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const data = await moviesService.getNowPlaying(page);
      set((state) => ({
        nowPlaying: page === 1 ? data.results : [...state.nowPlaying, ...data.results],
        nowPlayingPage: page,
        hasMoreNowPlaying: page < data.total_pages,
      }));
    } catch {
      set({ error: 'Erro ao carregar filmes em cartaz' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMovieDetails: async (tmdbId: number) => {
    set({ isLoading: true, error: null, currentMovie: null });
    try {
      const movie = await moviesService.getById(tmdbId);
      set({ currentMovie: movie });
    } catch {
      set({ error: 'Erro ao carregar detalhes do filme' });
    } finally {
      set({ isLoading: false });
    }
  },

  searchMovies: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    set({ isSearching: true });
    try {
      const data = await moviesService.search(query);
      set({ searchResults: data.results });
    } catch {
      set({ searchResults: [] });
    } finally {
      set({ isSearching: false });
    }
  },

  clearSearch: () => set({ searchResults: [] }),

  fetchFavorites: async (userId: number) => {
    try {
      const favorites = await moviesService.getFavorites(userId);
      set({ favorites });
    } catch {
      set({ error: 'Erro ao carregar favoritos' });
    }
  },

  toggleFavorite: async (userId: number, movie: Movie) => {
    const { favorites } = get();
    const isFav = favorites.some((f) => f.tmdb_id === movie.tmdb_id);

    // Optimistic update
    if (isFav) {
      set({ favorites: favorites.filter((f) => f.tmdb_id !== movie.tmdb_id) });
      try {
        await moviesService.removeFavorite(userId, movie.tmdb_id);
      } catch {
        set({ favorites }); // revert
      }
    } else {
      set({ favorites: [...favorites, { ...movie, is_favorited: true }] });
      try {
        await moviesService.addFavorite(userId, movie.tmdb_id);
      } catch {
        set({ favorites }); // revert
      }
    }
  },

  clearError: () => set({ error: null }),
}));
