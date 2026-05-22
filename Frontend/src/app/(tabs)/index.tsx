import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Film, Star, Calendar, Ticket, Popcorn } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth.store';
import { useMoviesStore } from '@/stores/movies.store';
import { useThemeStore } from '@/stores/theme.store';
import { Colors } from '@/constants/theme';
import { Movie } from '@/types/movie.types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

function MovieCard({ movie, onPress }: { movie: Movie; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {movie.poster_url ? (
        <Image source={{ uri: movie.poster_url }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.cardPlaceholder]}>
          <Film size={32} color="rgba(255,255,255,0.2)" />
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={styles.cardGradient}
      />
      <View style={styles.cardInfo}>
        <View style={styles.ratingBadge}>
          <Star size={10} color="#FFD700" fill="#FFD700" />
          <Text style={styles.ratingText}>{movie.vote_average?.toFixed(1)}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{movie.title}</Text>
      </View>
    </TouchableOpacity>
  );
}

function SectionHeader({ title, icon, onSeeAll, c }: { title: string; icon: React.ReactNode; onSeeAll?: () => void; c: any }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon}
        <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>Ver todos</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { upcoming, nowPlaying, isLoading, fetchUpcoming, fetchNowPlaying } = useMoviesStore();
  const { theme } = useThemeStore();
  const c = Colors[theme];

  useEffect(() => {
    fetchUpcoming();
    fetchNowPlaying();
  }, []);

  const onRefresh = useCallback(async () => {
    await Promise.all([fetchUpcoming(1), fetchNowPlaying(1)]);
  }, []);

  const handleMoviePress = (tmdbId: number) => {
    router.push(`/movie/${tmdbId}`);
  };

  const renderUpcomingItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={styles.upcomingCard}
      onPress={() => handleMoviePress(item.tmdb_id)}
      activeOpacity={0.85}
    >
      {item.poster_url && (
        <Image source={{ uri: item.poster_url }} style={styles.upcomingImage} />
      )}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} style={styles.upcomingGradient} />
      <View style={styles.upcomingInfo}>
        <View style={styles.upcomingBadge}>
          <Text style={styles.upcomingBadgeText}>EM BREVE</Text>
        </View>
        <Text style={styles.upcomingTitle} numberOfLines={2}>{item.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Calendar size={12} color="rgba(255,255,255,0.7)" />
          <Text style={styles.upcomingDate}>{item.release_date}</Text>
        </View>
        <TouchableOpacity style={styles.buyButton} onPress={() => handleMoviePress(item.tmdb_id)}>
          <LinearGradient colors={['#be123c', '#9f1239']} style={styles.buyButtonGradient}>
            <Ticket size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.buyButtonText}>Garantir ingresso</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <FlatList
        data={nowPlaying}
        keyExtractor={(item) => String(item.tmdb_id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={c.primary} />
        }
        ListHeaderComponent={() => (
          <View>
            {/* Header */}
            <LinearGradient colors={[c.background, c.backgroundSecondary]} style={styles.header}>
              <SafeAreaView>
                <View style={styles.headerContent}>
                  <View>
                    <Text style={[styles.greeting, { color: c.text }]}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
                    <Text style={[styles.subtitle, { color: c.textSecondary }]}>O que vamos assistir hoje?</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
                    {user?.avatar_url ? (
                      <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{user?.name?.[0]}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </LinearGradient>

            {/* Upcoming Section */}
            <SectionHeader title="Próximas Estreias" icon={<Film size={20} color={c.text} />} c={c} />
            <FlatList
              data={upcoming.slice(0, 5)}
              keyExtractor={(item) => `upcoming-${item.tmdb_id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.upcomingList}
              renderItem={renderUpcomingItem}
            />

            {/* Now Playing Section */}
            <SectionHeader
              title="Em Cartaz"
              icon={<Popcorn size={20} color={c.text} />}
              onSeeAll={() => router.push('/(tabs)/explore')}
              c={c}
            />
          </View>
        )}
        renderItem={({ item }) => (
          <MovieCard movie={item} onPress={() => handleMoviePress(item.tmdb_id)} />
        )}
        contentContainerStyle={styles.grid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 24 },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  greeting: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#be123c' },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#be123c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 18 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  seeAll: { fontSize: 14, color: '#be123c', fontWeight: '600' },
  upcomingList: { paddingHorizontal: 20, paddingBottom: 8, gap: 12 },
  upcomingCard: {
    width: width * 0.72,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#27272a',
  },
  upcomingImage: { ...StyleSheet.absoluteFillObject },
  upcomingGradient: { ...StyleSheet.absoluteFillObject },
  upcomingInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 },
  upcomingBadge: {
    backgroundColor: '#be123c',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  upcomingBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  upcomingTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  upcomingDate: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  buyButton: { borderRadius: 12, overflow: 'hidden' },
  buyButtonGradient: { paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  buyButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  grid: { paddingHorizontal: 16, paddingBottom: 100 },
  row: { gap: 12, marginBottom: 12 },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#27272a',
  },
  cardImage: { ...StyleSheet.absoluteFillObject },
  cardPlaceholder: { backgroundColor: '#27272a', justifyContent: 'center', alignItems: 'center' },
  cardPlaceholderText: { fontSize: 40 },
  cardGradient: { ...StyleSheet.absoluteFillObject },
  cardInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  ratingBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  ratingText: { color: '#FFD700', fontSize: 11, fontWeight: '700' },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});
