import apiClient from './client';
import { Movie, MovieDetail, MovieListResponse, Genre } from '@/types/movie.types';

export const moviesService = {
  /**
   * Get upcoming movies (próximas estreias)
   */
  getUpcoming: async (page = 1): Promise<MovieListResponse> => {
    const response = await apiClient.get<MovieListResponse>('/movies/upcoming', {
      params: { page },
    });
    return response.data;
  },

  /**
   * Get now-playing movies (em cartaz)
   */
  getNowPlaying: async (page = 1): Promise<MovieListResponse> => {
    const response = await apiClient.get<MovieListResponse>('/movies/now_playing', {
      params: { page },
    });
    return response.data;
  },

  /**
   * Search movies by query
   */
  search: async (query: string, page = 1): Promise<MovieListResponse> => {
    const response = await apiClient.get<MovieListResponse>('/movies/search', {
      params: { q: query, page },
    });
    return response.data;
  },

  /**
   * Get movie details by TMDB ID
   */
  getById: async (tmdbId: number): Promise<MovieDetail> => {
    const response = await apiClient.get<MovieDetail>(`/movies/${tmdbId}`);
    return response.data;
  },

  /**
   * Get all available genres
   */
  getGenres: async (): Promise<Genre[]> => {
    const response = await apiClient.get<{ genres: Genre[] }>('/movies/genres');
    return response.data.genres;
  },

  /**
   * Toggle favorite status for a movie
   */
  addFavorite: async (userId: number, tmdbId: number): Promise<void> => {
    await apiClient.post(`/users/${userId}/favorites`, { tmdb_id: tmdbId });
  },

  removeFavorite: async (userId: number, movieId: number): Promise<void> => {
    await apiClient.delete(`/users/${userId}/favorites/${movieId}`);
  },

  getFavorites: async (userId: number): Promise<Movie[]> => {
    const response = await apiClient.get<{ favorites: Movie[] }>(`/users/${userId}/favorites`);
    return response.data.favorites;
  },
};
