import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Film, Calendar, Star, Heart } from 'lucide-react-native';
import { useMoviesStore } from '@/stores/movies.store';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { Colors } from '@/constants/theme';
import { Movie } from '@/types/movie.types';

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

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { favorites, fetchFavorites, toggleFavorite } = useMoviesStore();
  const { theme } = useThemeStore();
  const c = Colors[theme];

  useEffect(() => {
    if (user) {
      fetchFavorites(user.id);
    }
  }, [user]);

  const handleMoviePress = (tmdbId: number) => router.push(`/movie/${tmdbId}`);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <LinearGradient colors={[c.background, c.backgroundSecondary]} style={styles.header}>
        <SafeAreaView>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, gap: 10, marginBottom: 16 }}>
            <Heart size={24} color={c.text} fill={c.text} />
            <Text style={[styles.headerTitle, { color: c.text }]}>Seus Favoritos</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={favorites}
        keyExtractor={(item) => String(item.tmdb_id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <MovieListItem
            movie={item}
            onPress={() => handleMoviePress(item.tmdb_id)}
            onFavorite={() => user && toggleFavorite(user.id, item)}
            isFav={true}
            c={c}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Heart size={60} color={c.icon} style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyTitle, { color: c.text }]}>Nenhum favorito</Text>
            <Text style={[styles.emptySubtitle, { color: c.textSecondary }]}>
              Os filmes que você curtir aparecerão aqui.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: '800' },
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
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
