import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Film, Calendar, Star, Heart, Search, X, Popcorn } from 'lucide-react-native';
import { useMoviesStore } from '@/stores/movies.store';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { Colors } from '@/constants/theme';
import { Movie } from '@/types/movie.types';

const { width } = Dimensions.get('window');

function MovieListItem({ movie, onPress, onFavorite, isFav, c }: {
  movie: Movie;
  onPress: () => void;
  onFavorite: () => void;
  isFav: boolean;
  c: any;
}) {
  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress} activeOpacity={0.85}>
      {movie.poster_url ? (
        <Image source={{ uri: movie.poster_url }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.posterPlaceholder]}>
          <Film size={32} color="rgba(255,255,255,0.2)" />
        </View>
      )}
      <View style={styles.itemInfo}>
        <Text style={[styles.itemTitle, { color: c.text }]} numberOfLines={2}>{movie.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Calendar size={12} color={c.textSecondary} />
          <Text style={[styles.itemDate, { color: c.textSecondary }]}>{movie.release_date || 'A confirmar'}</Text>
        </View>
        <View style={styles.itemMeta}>
          <View style={styles.ratingBadge}>
            <Star size={10} color="#FFD700" fill="#FFD700" />
            <Text style={styles.ratingText}>{movie.vote_average?.toFixed(1)}</Text>
          </View>
          {movie.is_upcoming && (
            <View style={styles.upcomingBadge}>
              <Text style={styles.upcomingText}>EM BREVE</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity style={styles.favoriteBtn} onPress={onFavorite}>
        <Heart size={20} color={isFav ? c.primary : c.icon} fill={isFav ? c.primary : 'transparent'} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    nowPlaying, upcoming, searchResults, isLoading, isSearching,
    fetchNowPlaying, fetchUpcoming, searchMovies, clearSearch,
    favorites, toggleFavorite,
  } = useMoviesStore();
  const { theme } = useThemeStore();
  const c = Colors[theme];

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'cartaz' | 'estreias'>('cartaz');

  useEffect(() => {
    fetchNowPlaying();
    fetchUpcoming();
  }, []);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (text.length >= 2) {
      searchMovies(text);
    } else {
      clearSearch();
    }
  }, []);

  const handleMoviePress = (tmdbId: number) => router.push(`/movie/${tmdbId}`);

  const displayData = query.length >= 2 ? searchResults : (activeTab === 'cartaz' ? nowPlaying : upcoming);
  const isFavorited = (movie: Movie) => favorites.some((f) => f.tmdb_id === movie.tmdb_id);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <LinearGradient colors={[c.background, c.backgroundSecondary]} style={styles.header}>
        <SafeAreaView>
          <Text style={[styles.headerTitle, { color: c.text }]}>Explorar Filmes</Text>
          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: c.card, borderColor: c.border }]}>
            <Search size={16} color={c.icon} />
            <TextInput
              style={[styles.searchInput, { color: c.text }]}
              placeholder="Buscar filmes..."
              placeholderTextColor={c.textSecondary}
              value={query}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); clearSearch(); }}>
                <X size={16} color={c.icon} />
              </TouchableOpacity>
            )}
          </View>

          {/* Tabs */}
          {query.length < 2 && (
            <View style={styles.tabs}>
              {(['cartaz', 'estreias'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, { backgroundColor: c.card }, activeTab === tab && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  {activeTab === tab && (
                    <LinearGradient colors={[c.primary, c.primaryDark]} style={StyleSheet.absoluteFillObject} />
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {tab === 'cartaz' ? (
                      <Popcorn size={16} color={activeTab === tab ? '#FFFFFF' : c.icon} />
                    ) : (
                      <Film size={16} color={activeTab === tab ? '#FFFFFF' : c.icon} />
                    )}
                    <Text style={[styles.tabText, { color: activeTab === tab ? '#FFFFFF' : c.textSecondary }]}>
                      {tab === 'cartaz' ? 'Em Cartaz' : 'Estreias'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>

      {(isLoading || isSearching) && !displayData.length ? (
        <ActivityIndicator color="#be123c" size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item) => String(item.tmdb_id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <MovieListItem
              movie={item}
              onPress={() => handleMoviePress(item.tmdb_id)}
              onFavorite={() => user && toggleFavorite(user.id, item)}
              isFav={isFavorited(item)}
              c={c}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: c.textSecondary }]}>
                {query.length >= 2 ? 'Nenhum filme encontrado' : 'Carregando filmes...'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: '800', paddingHorizontal: 20, paddingTop: 8, marginBottom: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15 },
  clearIcon: { fontSize: 14 },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    overflow: 'hidden',
  },
  tabActive: {},
  tabText: { fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#FFFFFF' },
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
  listItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    marginBottom: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  poster: { width: 72, height: 108, borderRadius: 12 },
  posterPlaceholder: { backgroundColor: '#27272a', justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1, justifyContent: 'center', gap: 6 },
  itemTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  itemDate: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  itemMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  ratingBadge: { backgroundColor: 'rgba(255,215,0,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  ratingText: { color: '#FFD700', fontSize: 11, fontWeight: '700' },
  upcomingBadge: { backgroundColor: 'rgba(190,18,60,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  upcomingText: { color: '#be123c', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  favoriteBtn: { justifyContent: 'center', paddingLeft: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 16 },
});
