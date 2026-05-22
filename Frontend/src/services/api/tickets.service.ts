import apiClient from './client';
import { Ticket, CreateTicketPayload, CheckinResponse, Reward, PointsHistory } from '@/types/ticket.types';

export const ticketsService = {
  /**
   * Get all user tickets (wallet)
   */
  getAll: async (): Promise<Ticket[]> => {
    const response = await apiClient.get<Ticket[]>('/tickets');
    return response.data;
  },

  /**
   * Get single ticket by ID
   */
  getById: async (id: number): Promise<Ticket> => {
    const response = await apiClient.get<Ticket>(`/tickets/${id}`);
    return response.data;
  },

  /**
   * Purchase a ticket (simulated payment)
   */
  purchase: async (payload: CreateTicketPayload): Promise<Ticket> => {
    const response = await apiClient.post<Ticket>('/tickets', { ticket: payload });
    return response.data;
  },

  /**
   * Perform check-in for a ticket
   */
  checkin: async (ticketId: number): Promise<CheckinResponse> => {
    const response = await apiClient.post<CheckinResponse>(`/tickets/${ticketId}/checkin`);
    return response.data;
  },
};

export const pointsService = {
  /**
   * Get points balance and history
   */
  getPoints: async (): Promise<{ balance: number; history: PointsHistory[] }> => {
    const response = await apiClient.get('/points');
    return response.data;
  },

  /**
   * Get available rewards
   */
  getRewards: async (): Promise<{ balance: number; rewards: Reward[] }> => {
    const response = await apiClient.get('/points/rewards');
    return response.data;
  },
};

export const notificationsService = {
  /**
   * Get all user notifications
   */
  getAll: async (userId: number) => {
    const response = await apiClient.get(`/users/${userId}/notifications`);
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markRead: async (userId: number, notificationId: number): Promise<void> => {
    await apiClient.patch(`/users/${userId}/notifications/${notificationId}`);
  },
};
