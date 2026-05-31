import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ticket as TicketIcon, MapPin, Calendar, Smartphone, X, CheckCircle, PartyPopper } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTicketsStore } from '@/stores/tickets.store';
import { useThemeStore } from '@/stores/theme.store';
import { Colors } from '@/constants/theme';
import { Ticket } from '@/types/ticket.types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const { width } = Dimensions.get('window');

function TicketCard({ ticket, onPress, c }: { ticket: Ticket; onPress: () => void; c: any }) {
  const statusColors: Record<string, string> = {
    confirmed: '#4CAF50',
    pending: '#FF9800',
    used: '#9E9E9E',
    expired: '#F44336',
  };

  const statusLabels: Record<string, string> = {
    confirmed: 'Confirmado',
    pending: 'Pendente',
    used: 'Utilizado',
    expired: 'Expirado',
  };

  return (
    <TouchableOpacity style={styles.ticketCard} onPress={onPress} activeOpacity={0.85}>
      <LinearGradient colors={['#27272a', '#3f3f46']} style={styles.ticketGradient}>
        {/* Movie Info */}
        <View style={styles.ticketHeader}>
          {ticket.movie.poster_url && (
            <Image source={{ uri: ticket.movie.poster_url }} style={styles.ticketPoster} />
          )}
          <View style={styles.ticketInfo}>
            <Text style={[styles.ticketTitle, { color: c.text }]} numberOfLines={2}>{ticket.movie.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} color={c.textSecondary} />
              <Text style={[styles.ticketCinema, { color: c.textSecondary }]}>{ticket.cinema_name}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} color={c.primary} />
              <Text style={[styles.ticketDate, { color: c.textSecondary }]}>
                {format(new Date(ticket.session_datetime), "dd 'de' MMM, HH:mm", { locale: ptBR })}
              </Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerCircleLeft} />
          <View style={styles.dividerLine} />
          <View style={styles.dividerCircleRight} />
        </View>

        {/* Footer */}
        <View style={styles.ticketFooter}>
          <View>
            <Text style={[styles.priceLabel, { color: c.textSecondary }]}>Desconto {ticket.discount_percent}%</Text>
            <Text style={[styles.price, { color: c.text }]}>
              R$ {ticket.discounted_price ? Number(ticket.discounted_price).toFixed(2).replace('.', ',') : '0,00'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: statusColors[ticket.status] }]}>
            <Text style={[styles.statusText, { color: statusColors[ticket.status] }]}>
              {statusLabels[ticket.status]}
            </Text>
          </View>
          {ticket.status === 'confirmed' && (
            <View style={[styles.qrHint, { backgroundColor: c.primary + '22' }]}>
              <Smartphone size={10} color={c.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.qrHintText, { color: c.primary }]}>Toque para ver QR</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function WalletScreen() {
  const { tickets, isLoading, fetchTickets, checkin } = useTicketsStore();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [checkinDone, setCheckinDone] = useState(false);
  const { theme } = useThemeStore();
  const c = Colors[theme];

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCheckin = async () => {
    if (!selectedTicket) return;
    try {
      const result = await checkin(selectedTicket.id);
      setCheckinDone(true);
    } catch {
      // error handled in store
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <LinearGradient colors={[c.background, c.backgroundSecondary]} style={styles.header}>
        <SafeAreaView>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8 }}>
            <TicketIcon size={24} color={c.text} />
            <Text style={[styles.headerTitle, { color: c.text }]}>Minha Carteira</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: c.textSecondary }]}>{tickets.length} ingresso{tickets.length !== 1 ? 's' : ''}</Text>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={tickets}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={fetchTickets}
        renderItem={({ item }) => (
          <TicketCard ticket={item} onPress={() => { setSelectedTicket(item); setCheckinDone(false); }} c={c} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <TicketIcon size={60} color={c.icon} style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyTitle, { color: c.text }]}>Nenhum ingresso ainda</Text>
            <Text style={[styles.emptySubtitle, { color: c.textSecondary }]}>
              Explore filmes e garanta ingressos com desconto!
            </Text>
          </View>
        }
      />

      {/* QR Code Modal */}
      <Modal visible={!!selectedTicket} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <LinearGradient colors={[c.backgroundSecondary, c.background]} style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedTicket(null)}>
              <X size={20} color={c.icon} />
            </TouchableOpacity>

            {selectedTicket && (
              <>
                <Text style={[styles.modalTitle, { color: c.text }]}>{selectedTicket.movie.title}</Text>
                <Text style={[styles.modalCinema, { color: c.textSecondary }]}>{selectedTicket.cinema_name}</Text>

                {/* QR Code */}
                <View style={styles.qrContainer}>
                  {selectedTicket.qr_code ? (
                    <View style={styles.qrWrapper}>
                      <QRCode
                        value={selectedTicket.qr_code && selectedTicket.qr_code.length < 500 ? selectedTicket.qr_code : JSON.stringify({ ticket_id: selectedTicket.id, movie: selectedTicket.movie.title })}
                        size={200}
                        backgroundColor="white"
                        color="black"
                      />
                    </View>
                  ) : (
                    <View style={[styles.qrPlaceholder, { backgroundColor: c.backgroundSecondary }]}>
                      <Smartphone size={60} color={c.icon} />
                      <Text style={[styles.qrPlaceholderText, { color: c.textSecondary }]}>QR Code do Ingresso</Text>
                    </View>
                  )}
                  <Text style={styles.qrInstruction}>
                    Apresente este QR Code na entrada do cinema
                  </Text>
                </View>

                {selectedTicket.can_checkin && !checkinDone && (
                  <TouchableOpacity style={styles.checkinButton} onPress={handleCheckin}>
                    <LinearGradient colors={[c.success, c.success]} style={styles.checkinGradient}>
                      <CheckCircle size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.checkinText}>Fazer Check-in (+50 pts)</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {checkinDone && (
                  <View style={[styles.checkinSuccess, { backgroundColor: c.success + '22' }]}>
                    <PartyPopper size={16} color={c.success} style={{ marginRight: 8 }} />
                    <Text style={[styles.checkinSuccessText, { color: c.success }]}>Check-in realizado! +50 pontos</Text>
                  </View>
                )}
              </>
            )}
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontSize: 26, fontWeight: '800' },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
  ticketCard: { marginBottom: 16, borderRadius: 20, overflow: 'hidden' },
  ticketGradient: { padding: 16, borderRadius: 20 },
  ticketHeader: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  ticketPoster: { width: 64, height: 96, borderRadius: 10 },
  ticketInfo: { flex: 1, gap: 6, justifyContent: 'center' },
  ticketTitle: { fontSize: 15, fontWeight: '800' },
  ticketCinema: { fontSize: 12, fontWeight: '600' },
  ticketDate: { fontSize: 12 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  dividerCircleLeft: { width: 16, height: 16, borderRadius: 8, marginLeft: -24 },
  dividerLine: { flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  dividerCircleRight: { width: 16, height: 16, borderRadius: 8, marginRight: -24 },
  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceContainer: { alignItems: 'flex-end', justifyContent: 'center' },
  priceLabel: { fontSize: 11, marginBottom: 2 },
  price: { fontSize: 18, fontWeight: '900' },
  statusBadge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
  qrHint: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  qrHintText: { fontSize: 10, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: 48, borderWidth: 1, borderColor: 'rgba(190,18,60,0.2)' },
  modalClose: { alignSelf: 'flex-end', padding: 4 },
  modalCloseText: { color: 'rgba(255,255,255,0.5)', fontSize: 18 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginTop: 8 },
  modalCinema: { fontSize: 14, marginTop: 4, marginBottom: 24 },
  qrContainer: { alignItems: 'center', gap: 16 },
  qrWrapper: { padding: 16, backgroundColor: '#FFFFFF', borderRadius: 20 },
  qrPlaceholder: { width: 220, height: 220, borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 12 },
  qrPlaceholderText: { fontSize: 14 },
  qrInstruction: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center' },
  checkinButton: { marginTop: 24, borderRadius: 16, overflow: 'hidden' },
  checkinGradient: { paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  checkinText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  checkinSuccess: { marginTop: 16, padding: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  checkinSuccessText: { fontWeight: '700', fontSize: 15 },
});
