// ─── User Types ──────────────────────────────────────────────────────────────

export interface GenrePreference {
  id: number;
  name: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  region?: string;
  [key: string]: unknown;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  points_balance: number;
  active: boolean;
  push_token: string | null;
  genre_preferences: GenrePreference[];
  preferences: UserPreferences;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  movie_id: number | null;
  read: boolean;
  created_at: string;
}
