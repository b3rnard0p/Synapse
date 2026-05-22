import { useTicketsStore } from '@/stores/tickets.store';
import { ticketsService, pointsService } from '@/services/api/tickets.service';

jest.mock('@/services/api/tickets.service');

const mockTicket = {
  id: 1,
  cinema_name: 'Cinemark Test',
  status: 'confirmed' as const,
  discount_percent: 20,
  original_price: 35.0,
  discounted_price: 28.0,
  qr_code: 'test-qr-data',
  session_datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  is_checked_in: false,
  can_checkin: false,
  movie: { id: 1, tmdb_id: 123, title: 'Test Movie', poster_url: null, backdrop_url: null },
  created_at: new Date().toISOString(),
};

describe('useTicketsStore', () => {
  beforeEach(() => {
    useTicketsStore.setState({
      tickets: [],
      rewards: [],
      pointsBalance: 0,
      pointsHistory: [],
      isLoading: false,
      isCheckingIn: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  describe('fetchTickets', () => {
    it('loads tickets from API', async () => {
      (ticketsService.getAll as jest.Mock).mockResolvedValue([mockTicket]);

      await useTicketsStore.getState().fetchTickets();

      expect(useTicketsStore.getState().tickets).toHaveLength(1);
      expect(useTicketsStore.getState().tickets[0].id).toBe(1);
    });
  });

  describe('purchaseTicket', () => {
    it('adds purchased ticket to the list', async () => {
      (ticketsService.purchase as jest.Mock).mockResolvedValue(mockTicket);

      await useTicketsStore.getState().purchaseTicket({
        tmdb_id: 123,
        cinema_name: 'Cinemark Test',
        session_datetime: new Date().toISOString(),
        original_price: 35.0,
      });

      expect(useTicketsStore.getState().tickets).toHaveLength(1);
    });
  });

  describe('checkin', () => {
    it('updates ticket status to used and adds points', async () => {
      useTicketsStore.setState({ tickets: [mockTicket] });
      (ticketsService.checkin as jest.Mock).mockResolvedValue({
        message: 'Check-in realizado!',
        points_earned: 50,
        total_points: 50,
      });

      const result = await useTicketsStore.getState().checkin(1);

      expect(result.pointsEarned).toBe(50);
      expect(useTicketsStore.getState().pointsBalance).toBe(50);
      const updatedTicket = useTicketsStore.getState().tickets.find((t) => t.id === 1);
      expect(updatedTicket?.status).toBe('used');
    });
  });
});
