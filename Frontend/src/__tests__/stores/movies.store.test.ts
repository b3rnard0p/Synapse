import { useMoviesStore } from '@/stores/movies.store';
import { moviesService } from '@/services/api/movies.service';

jest.mock('@/services/api/movies.service');

const mockMovieList = {
  results: [
    {
      tmdb_id: 1,
      title: 'Test Movie',
      overview: 'A test movie',
      release_date: '2026-01-01',
      poster_url: null,
      backdrop_url: null,
      vote_average: 7.5,
      is_upcoming: true,
    },
  ],
  total_pages: 3,
  total_results: 60,
};

describe('useMoviesStore', () => {
  beforeEach(() => {
    useMoviesStore.setState({
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
    });
    jest.clearAllMocks();
  });

  describe('fetchUpcoming', () => {
    it('populates upcoming movies', async () => {
      (moviesService.getUpcoming as jest.Mock).mockResolvedValue(mockMovieList);

      await useMoviesStore.getState().fetchUpcoming();

      expect(useMoviesStore.getState().upcoming).toHaveLength(1);
      expect(useMoviesStore.getState().upcoming[0].title).toBe('Test Movie');
      expect(useMoviesStore.getState().hasMoreUpcoming).toBe(true);
    });

    it('appends movies on page > 1', async () => {
      useMoviesStore.setState({ upcoming: [mockMovieList.results[0]], upcomingPage: 1 });
      (moviesService.getUpcoming as jest.Mock).mockResolvedValue(mockMovieList);

      await useMoviesStore.getState().fetchUpcoming(2);

      expect(useMoviesStore.getState().upcoming).toHaveLength(2);
    });

    it('sets error on failure', async () => {
      (moviesService.getUpcoming as jest.Mock).mockRejectedValue(new Error('Network error'));

      await useMoviesStore.getState().fetchUpcoming();

      expect(useMoviesStore.getState().error).toBe('Erro ao carregar próximas estreias');
    });
  });

  describe('toggleFavorite', () => {
    const movie = mockMovieList.results[0];

    it('adds movie to favorites', async () => {
      (moviesService.addFavorite as jest.Mock).mockResolvedValue(undefined);

      await useMoviesStore.getState().toggleFavorite(1, movie);

      expect(useMoviesStore.getState().favorites).toHaveLength(1);
    });

    it('removes movie from favorites', async () => {
      useMoviesStore.setState({ favorites: [movie] });
      (moviesService.removeFavorite as jest.Mock).mockResolvedValue(undefined);

      await useMoviesStore.getState().toggleFavorite(1, movie);

      expect(useMoviesStore.getState().favorites).toHaveLength(0);
    });
  });
});
