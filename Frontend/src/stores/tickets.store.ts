import { create } from 'zustand';
import { Ticket, CreateTicketPayload, Reward, PointsHistory } from '@/types/ticket.types';
import { ticketsService, pointsService } from '@/services/api/tickets.service';

interface TicketsState {
  tickets: Ticket[];
  rewards: Reward[];
  pointsBalance: number;
  pointsHistory: PointsHistory[];
  isLoading: boolean;
  isCheckingIn: boolean;
  error: string | null;

  // Actions
  fetchTickets: () => Promise<void>;
  purchaseTicket: (payload: CreateTicketPayload) => Promise<Ticket>;
  checkin: (ticketId: number) => Promise<{ pointsEarned: number; totalPoints: number }>;
  fetchPoints: () => Promise<void>;
  fetchRewards: () => Promise<void>;
  clearError: () => void;
}

export const useTicketsStore = create<TicketsState>((set, get) => ({
  tickets: [],
  rewards: [],
  pointsBalance: 0,
  pointsHistory: [],
  isLoading: false,
  isCheckingIn: false,
  error: null,

  fetchTickets: async () => {
    set({ isLoading: true, error: null });
    try {
      const tickets = await ticketsService.getAll();
      set({ tickets });
    } catch {
      set({ error: 'Erro ao carregar ingressos' });
    } finally {
      set({ isLoading: false });
    }
  },

  purchaseTicket: async (payload: CreateTicketPayload) => {
    set({ isLoading: true, error: null });
    try {
      const ticket = await ticketsService.purchase(payload);
      set((state) => ({ tickets: [ticket, ...state.tickets] }));
      return ticket;
    } catch (error: any) {
      const message = error?.response?.data?.errors?.[0] || 'Erro ao comprar ingresso';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  checkin: async (ticketId: number) => {
    set({ isCheckingIn: true, error: null });
    try {
      const result = await ticketsService.checkin(ticketId);

      // Update the ticket status locally
      set((state) => ({
        tickets: state.tickets.map((t) =>
          t.id === ticketId ? { ...t, status: 'used' as const, is_checked_in: true } : t,
        ),
        pointsBalance: result.total_points,
      }));

      return { pointsEarned: result.points_earned, totalPoints: result.total_points };
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Erro ao realizar check-in';
      set({ error: message });
      throw error;
    } finally {
      set({ isCheckingIn: false });
    }
  },

  fetchPoints: async () => {
    try {
      const data = await pointsService.getPoints();
      set({ pointsBalance: data.balance, pointsHistory: data.history });
    } catch {
      set({ error: 'Erro ao carregar pontos' });
    }
  },

  fetchRewards: async () => {
    try {
      const data = await pointsService.getRewards();
      set({ rewards: data.rewards, pointsBalance: data.balance });
    } catch {
      set({ error: 'Erro ao carregar recompensas' });
    }
  },

  clearError: () => set({ error: null }),
}));
