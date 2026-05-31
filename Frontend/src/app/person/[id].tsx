import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Calendar, MapPin, Film } from 'lucide-react-native';
import { moviesService } from '@/services/api/movies.service';
import { useThemeStore } from '@/stores/theme.store';
import { Colors } from '@/constants/theme';
import { PersonDetail, Movie } from '@/types/movie.types';

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
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.cardGradient} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>{movie.title}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useThemeStore();
  const c = Colors[theme];

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const data = await moviesService.getPersonById(Number(id));
        setPerson(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading || !person) {
    return (
      <LinearGradient colors={[c.background, c.backgroundSecondary]} style={styles.loading}>
        <ActivityIndicator color={c.primary} size="large" />
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <SafeAreaView style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color={c.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.text }]} numberOfLines={1}>
            {person.name}
          </Text>
          <View style={{ width: 40 }} />
        </SafeAreaView>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          {person.profile_url ? (
            <Image source={{ uri: person.profile_url }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, styles.profilePlaceholder]}>
              <User size={60} color={c.icon} />
            </View>
          )}
          <Text style={[styles.name, { color: c.text }]}>{person.name}</Text>
          <Text style={[styles.department, { color: c.primary }]}>{person.known_for_department}</Text>
          
          <View style={styles.metaRow}>
            {person.birthday ? (
              <View style={styles.metaItem}>
                <Calendar size={14} color={c.textSecondary} />
                <Text style={[styles.metaText, { color: c.textSecondary }]}>{person.birthday}</Text>
              </View>
            ) : null}
            {person.place_of_birth ? (
              <View style={styles.metaItem}>
                <MapPin size={14} color={c.textSecondary} />
                <Text style={[styles.metaText, { color: c.textSecondary }]} numberOfLines={1}>
                  {person.place_of_birth}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Biography */}
        {person.biography ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Biografia</Text>
            <Text style={[styles.biography, { color: c.textSecondary }]}>{person.biography}</Text>
          </View>
        ) : null}

        {/* Filmography */}
        {person.movies && person.movies.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: 0 }]}>
            <Text style={[styles.sectionTitle, { color: c.text, paddingHorizontal: 20 }]}>Filmografia</Text>
            <View style={styles.grid}>
              {person.movies.map(movie => (
                <MovieCard
                  key={movie.tmdb_id}
                  movie={movie}
                  onPress={() => router.push(`/movie/${movie.tmdb_id}`)}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800' },
  profileSection: { alignItems: 'center', paddingHorizontal: 20, marginBottom: 32 },
  profileImage: { width: 140, height: 140, borderRadius: 70, marginBottom: 16, borderWidth: 3, borderColor: 'rgba(190,18,60,0.3)' },
  profilePlaceholder: { backgroundColor: '#27272a', justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  department: { fontSize: 14, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  metaRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  metaText: { fontSize: 12, fontWeight: '500' },
  section: { paddingHorizontal: 20, marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  biography: { fontSize: 15, lineHeight: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 16 },
  card: { width: CARD_WIDTH, height: CARD_WIDTH * 1.5, borderRadius: 16, overflow: 'hidden', backgroundColor: '#27272a' },
  cardImage: { ...StyleSheet.absoluteFillObject },
  cardPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  cardGradient: { ...StyleSheet.absoluteFillObject },
  cardInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});
