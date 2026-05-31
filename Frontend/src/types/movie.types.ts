// ─── Movie Types ────────────────────────────────────────────────────────────

export interface Genre {
  id: number;
  name: string;
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_url: string | null;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_url: string | null;
}

export interface Movie {
  tmdb_id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_url: string | null;
  backdrop_url: string | null;
  vote_average: number;
  genre_ids?: number[];
  is_upcoming?: boolean;
  is_favorited?: boolean;
}

export interface MovieDetail extends Movie {
  runtime: number | null;
  genres: Genre[];
  cast: CastMember[];
  trailer_url: string | null;
  tagline: string | null;
  status: string;
  watch_providers?: WatchProvider[];
  similar?: Movie[];
}

export interface PersonDetail {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  place_of_birth: string | null;
  known_for_department: string;
  profile_url: string | null;
  movies: Movie[];
}

export interface MovieListResponse {
  results: Movie[];
  total_pages: number;
  total_results: number;
}
