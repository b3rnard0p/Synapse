// ─── Ticket Types ────────────────────────────────────────────────────────────

export type TicketStatus = 'pending' | 'confirmed' | 'used' | 'expired';

export interface TicketMovie {
  id: number;
  tmdb_id: number;
  title: string;
  poster_url: string | null;
  backdrop_url: string | null;
}

export interface Ticket {
  id: number;
  cinema_name: string;
  status: TicketStatus;
  discount_percent: number;
  original_price: number;
  discounted_price: number;
  qr_code: string | null;
  session_datetime: string;
  is_checked_in: boolean;
  can_checkin: boolean;
  movie: TicketMovie;
  created_at: string;
}

export interface CheckinResponse {
  message: string;
  points_earned: number;
  total_points: number;
}

export interface CreateTicketPayload {
  tmdb_id: number;
  cinema_name: string;
  session_datetime: string;
  original_price: number;
}

export interface Reward {
  id: number;
  name: string;
  description: string;
  points_required: number;
  icon: string;
  can_redeem: boolean;
}

export interface PointsHistory {
  id: number;
  movie_title: string;
  points_earned: number;
  checked_in_at: string;
}
