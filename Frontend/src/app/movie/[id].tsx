import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { User, ArrowLeft, Heart, Star, Clock, Calendar, Play, Ticket, PartyPopper, MapPin, Banknote, Film, Bell } from 'lucide-react-native';
import { useMoviesStore } from '@/stores/movies.store';
import { useAuthStore } from '@/stores/auth.store';
import { useTicketsStore } from '@/stores/tickets.store';
import { useThemeStore } from '@/stores/theme.store';
import { Colors } from '@/constants/theme';
import { CastMember, Movie } from '@/types/movie.types';

const { width, height } = Dimensions.get('window');

function CastCard({ member, onPress }: { member: CastMember; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.castCard} onPress={onPress} activeOpacity={0.85}>
      {member.profile_url ? (
        <Image source={{ uri: member.profile_url }} style={styles.castPhoto} />
      ) : (
        <View style={[styles.castPhoto, styles.castPlaceholder]}>
          <User size={24} color="rgba(255,255,255,0.2)" />
        </View>
      )}
      <Text style={[styles.castName, { color: Colors.dark.text }]} numberOfLines={2}>{member.name}</Text>
      <Text style={[styles.castChar, { color: Colors.dark.textSecondary }]} numberOfLines={1}>{member.character}</Text>
    </TouchableOpacity>
  );
}

function SimilarMovieCard({ movie, onPress }: { movie: Movie; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.similarCard} onPress={onPress} activeOpacity={0.85}>
      {movie.poster_url ? (
        <Image source={{ uri: movie.poster_url }} style={styles.similarImage} />
      ) : (
        <View style={[styles.similarImage, styles.similarPlaceholder]}>
          <Film size={24} color="rgba(255,255,255,0.2)" />
        </View>
      )}
      <Text style={styles.similarTitle} numberOfLines={2}>{movie.title}</Text>
    </TouchableOpacity>
  );
}

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentMovie, isLoading, fetchMovieDetails, toggleFavorite, favorites } = useMoviesStore();
  const { purchaseTicket, isLoading: ticketLoading } = useTicketsStore();
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buying, setBuying] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const { theme } = useThemeStore();
  const c = Colors[theme];

  useEffect(() => {
    if (id) fetchMovieDetails(Number(id));
  }, [id]);

  const isFav = currentMovie
    ? favorites.some((f) => f.tmdb_id === currentMovie.tmdb_id)
    : false;

  const handlePurchase = async () => {
    if (!currentMovie || !user) return;
    setBuying(true);
    try {
      await purchaseTicket({
        tmdb_id: currentMovie.tmdb_id,
        cinema_name: 'Cinemark Paulista',
        session_datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        original_price: 35.0,
      });
      setPurchaseSuccess(true);
      
      // Schedule Session Reminder Notification
      if (Platform.OS === 'web') {
        setTimeout(() => {
          window.alert('🍿 É hoje! Sua sessão de ' + currentMovie.title + ' no Cinemark começa em breve. Acesse sua Carteira para ver o QR Code.');
        }, 10000);
      } else {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🍿 É hoje!',
            body: `Sua sessão de ${currentMovie.title} no Cinemark começa em breve. Acesse sua Carteira para ver o QR Code.`,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 10,
          },
        });
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível processar a compra. Tente novamente.');
    } finally {
      setBuying(false);
    }
  };

  const handleRemindMe = async () => {
    if (!currentMovie) return;
    
    if (Platform.OS === 'web') {
      window.alert('Lembrete ativado! Você será avisado quando ' + currentMovie.title + ' lançar.');
      setTimeout(() => {
        window.alert('🎟️ Lançamento Chegando! ' + currentMovie.title + ' estreia em breve! Garanta seu ingresso com desconto agora no Synapse.');
      }, 10000);
    } else {
      Alert.alert('Lembrete ativado!', `Você será avisado quando ${currentMovie.title} lançar.`);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎟️ Lançamento Chegando!',
          body: `${currentMovie.title} estreia em breve! Garanta seu ingresso com desconto agora no Synapse.`,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 10,
        },
      });
    }
  };

  const isUpcoming = currentMovie && new Date(currentMovie.release_date) > new Date();

  if (isLoading || !currentMovie) {
    return (
      <LinearGradient colors={[c.background, c.backgroundSecondary]} style={styles.loading}>
        <ActivityIndicator color={c.primary} size="large" />
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Backdrop */}
        <View style={styles.backdropContainer}>
          {currentMovie.backdrop_url ? (
            <Image source={{ uri: currentMovie.backdrop_url }} style={styles.backdrop} />
          ) : (
            <LinearGradient colors={[c.backgroundSecondary, c.background]} style={styles.backdrop} />
          )}
          <LinearGradient
            colors={[c.background + '44', c.background + 'B3', c.background]}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Back Button */}
          <SafeAreaView style={styles.backContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => user && toggleFavorite(user.id, currentMovie)}
            >
              <Heart size={20} color={isFav ? '#be123c' : '#FFFFFF'} fill={isFav ? '#be123c' : 'transparent'} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Poster + Info */}
          <View style={styles.infoRow}>
            {currentMovie.poster_url && (
              <Image source={{ uri: currentMovie.poster_url }} style={styles.poster} />
            )}
            <View style={styles.mainInfo}>
              <Text style={[styles.title, { color: c.text }]}>{currentMovie.title}</Text>
              {currentMovie.tagline ? (
                <Text style={[styles.tagline, { color: c.textSecondary }]}>"{currentMovie.tagline}"</Text>
              ) : null}
              <View style={styles.metaBadges}>
                <View style={styles.badge}>
                  <Star size={10} color="#FFD700" fill="#FFD700" />
                  <Text style={[styles.badgeText, { color: Colors.dark.text }]}>{currentMovie.vote_average?.toFixed(1)}</Text>
                </View>
                {currentMovie.runtime && (
                  <View style={styles.badge}>
                    <Clock size={10} color={Colors.dark.text} />
                    <Text style={[styles.badgeText, { color: Colors.dark.text }]}>{currentMovie.runtime}min</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Calendar size={12} color={c.textSecondary} />
                <Text style={[styles.releaseDate, { color: c.textSecondary }]}>{currentMovie.release_date}</Text>
              </View>
            </View>
          </View>

          {/* Genres */}
          <View style={styles.genreRow}>
            {currentMovie.genres?.map((g) => (
              <View key={g.id} style={[styles.genreChip, { backgroundColor: c.primary + '22', borderColor: c.primary + '44' }]}>
                <Text style={[styles.genreText, { color: c.primary }]}>{g.name}</Text>
              </View>
            ))}
          </View>

          {/* Overview */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Sinopse</Text>
            <Text style={[styles.overview, { color: c.textSecondary }]}>{currentMovie.overview || 'Sem sinopse disponível.'}</Text>
          </View>

          {/* Watch Providers */}
          {currentMovie.watch_providers && currentMovie.watch_providers.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Onde Assistir</Text>
              <View style={styles.providersRow}>
                {currentMovie.watch_providers.map((p) => (
                  <View key={p.provider_id} style={styles.providerBadge}>
                    <Image source={{ uri: p.logo_url || '' }} style={styles.providerLogo} />
                    <Text style={[styles.providerName, { color: c.textSecondary }]} numberOfLines={1}>{p.provider_name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Cast */}
          {currentMovie.cast && currentMovie.cast.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Elenco</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.castList}>
                {currentMovie.cast.map((member) => (
                  <CastCard key={member.id} member={member} onPress={() => router.push(`/person/${member.id}`)} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Trailer and Remind Me */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {currentMovie.trailer_url && (
              <TouchableOpacity
                style={[styles.trailerButton, { flex: 1 }]}
                onPress={() => Linking.openURL(currentMovie.trailer_url!)}
              >
                <LinearGradient colors={['rgba(255,0,0,0.2)', 'rgba(255,0,0,0.1)']} style={styles.trailerGradient}>
                  <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.trailerText}>Assistir Trailer Oficial</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {isUpcoming && (
              <TouchableOpacity
                style={[styles.trailerButton, { width: 60 }]}
                onPress={handleRemindMe}
              >
                <LinearGradient colors={[c.primary + '33', c.primary + '11']} style={styles.trailerGradient}>
                  <Bell size={24} color={c.primary} />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Similar Movies */}
          {currentMovie.similar && currentMovie.similar.length > 0 && (
            <View style={[styles.section, { marginTop: 32 }]}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Títulos Semelhantes</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.castList}>
                {currentMovie.similar.map((movie) => (
                  <SimilarMovieCard key={movie.tmdb_id} movie={movie} onPress={() => router.push(`/movie/${movie.tmdb_id}`)} />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Buy Button */}
      <View style={[styles.buyContainer, { backgroundColor: c.background, borderTopColor: c.border }]}>
        <View style={styles.priceInfo}>
          <Text style={[styles.originalPrice, { color: c.textSecondary }]}>R$ 35,00</Text>
          <Text style={[styles.discountedPrice, { color: c.text }]}>R$ 28,00</Text>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-20%</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => setShowBuyModal(true)}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#be123c', '#9f1239']} style={styles.buyGradient}>
            <Ticket size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.buyText}>Comprar Ingresso</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Purchase Confirmation Modal */}
      <Modal visible={showBuyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <LinearGradient colors={[c.backgroundSecondary, c.background]} style={styles.modalContent}>
            {purchaseSuccess ? (
              <View style={styles.successContainer}>
                <PartyPopper size={60} color={c.primary} />
                <Text style={[styles.successTitle, { color: c.text }]}>Ingresso garantido!</Text>
                <Text style={[styles.successSub, { color: c.textSecondary }]}>
                  Seu ingresso com 20% de desconto foi adicionado à carteira.
                </Text>
                <TouchableOpacity
                  style={styles.successButton}
                  onPress={() => { setShowBuyModal(false); setPurchaseSuccess(false); router.push('/(tabs)/wallet'); }}
                >
                  <LinearGradient colors={[c.primary, c.primaryDark]} style={styles.successGradient}>
                    <Text style={styles.successButtonText}>Ver minha carteira →</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[styles.modalTitle, { color: c.text }]}>Confirmar Compra</Text>
                <Text style={[styles.modalMovie, { color: c.primary }]}>{currentMovie.title}</Text>
                <View style={styles.modalDetails}>
                  <View style={styles.detailRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MapPin size={14} color={c.textSecondary} />
                      <Text style={[styles.detailLabel, { color: c.textSecondary }]}>Cinema</Text>
                    </View>
                    <Text style={[styles.detailValue, { color: c.text }]}>Cinemark Paulista</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Calendar size={14} color={c.textSecondary} />
                      <Text style={[styles.detailLabel, { color: c.textSecondary }]}>Sessão</Text>
                    </View>
                    <Text style={[styles.detailValue, { color: c.text }]}>Em 7 dias</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Banknote size={14} color={c.textSecondary} />
                      <Text style={[styles.detailLabel, { color: c.textSecondary }]}>Valor</Text>
                    </View>
                    <Text style={[styles.detailValue, { color: c.success }]}>R$ 28,00 (20% off)</Text>
                  </View>
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowBuyModal(false)}
                  >
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButton, buying && styles.disabled]}
                    onPress={handlePurchase}
                    disabled={buying}
                  >
                    <LinearGradient colors={[c.primary, c.primaryDark]} style={styles.confirmGradient}>
                      {buying ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.confirmText}>Confirmar Compra</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#18181b' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backdropContainer: { height: height * 0.4, position: 'relative' },
  backdrop: { width: '100%', height: '100%' },
  backContainer: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  backButton: { width: 44, height: 44, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  backText: { color: '#FFFFFF', fontSize: 20 },
  favoriteButton: { width: 44, height: 44, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  favoriteText: { fontSize: 20 },
  content: { paddingHorizontal: 20, paddingBottom: 120 },
  infoRow: { flexDirection: 'row', gap: 16, marginTop: -40, marginBottom: 16 },
  poster: { width: 100, height: 150, borderRadius: 16, borderWidth: 2 },
  mainInfo: { flex: 1, paddingTop: 40, gap: 6 },
  title: { fontSize: 20, fontWeight: '900' },
  tagline: { fontSize: 13, fontStyle: 'italic' },
  metaBadges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  releaseDate: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  genreChip: { backgroundColor: 'rgba(190,18,60,0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(190,18,60,0.3)' },
  genreText: { color: '#be123c', fontSize: 12, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 12 },
  overview: { fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 24 },
  castList: { paddingRight: 20, gap: 12 },
  castCard: { width: 80, alignItems: 'center', gap: 6 },
  castPhoto: { width: 72, height: 72, borderRadius: 36 },
  castPlaceholder: { backgroundColor: '#27272a', justifyContent: 'center', alignItems: 'center' },
  castName: { fontSize: 11, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  castChar: { fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  similarCard: { width: 110, gap: 8 },
  similarImage: { width: 110, height: 160, borderRadius: 12 },
  similarPlaceholder: { backgroundColor: '#27272a', justifyContent: 'center', alignItems: 'center' },
  similarTitle: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  providersRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  providerBadge: { alignItems: 'center', gap: 4, width: 64 },
  providerLogo: { width: 44, height: 44, borderRadius: 12 },
  providerName: { fontSize: 10, textAlign: 'center' },
  trailerButton: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,0,0,0.3)' },
  trailerGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 10 },
  trailerIcon: { fontSize: 20 },
  trailerText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  buyContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#18181b', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', gap: 16 },
  priceInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  originalPrice: { fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecorationLine: 'line-through' },
  discountedPrice: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  discountBadge: { backgroundColor: '#4CAF50', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  discountText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  buyButton: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  buyGradient: { paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  buyText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: 48, borderWidth: 1, borderColor: 'rgba(190,18,60,0.2)' },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', marginBottom: 4 },
  modalMovie: { fontSize: 15, color: '#be123c', marginBottom: 20 },
  modalDetails: { gap: 12, marginBottom: 28 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  detailValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  detailPrice: { color: '#4CAF50' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, paddingVertical: 16, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16 },
  cancelText: { color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
  confirmButton: { flex: 2, borderRadius: 16, overflow: 'hidden' },
  confirmGradient: { paddingVertical: 16, alignItems: 'center' },
  confirmText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  disabled: { opacity: 0.6 },
  successContainer: { alignItems: 'center', gap: 12, paddingVertical: 20 },
  successEmoji: { fontSize: 60 },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
  successSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22 },
  successButton: { borderRadius: 16, overflow: 'hidden', marginTop: 8, width: '100%' },
  successGradient: { paddingVertical: 16, alignItems: 'center' },
  successButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});
