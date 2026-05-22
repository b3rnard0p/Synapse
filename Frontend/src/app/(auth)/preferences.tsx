import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/stores/auth.store';
import { moviesService } from '@/services/api/movies.service';
import { Genre } from '@/types/movie.types';
import apiClient from '@/services/api/client';

export default function PreferencesScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selected, setSelected] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      const data = await moviesService.getGenres();
      setGenres(data);
    } catch {
      // Fallback genres
      setGenres([
        { id: 28, name: 'Ação' }, { id: 12, name: 'Aventura' },
        { id: 16, name: 'Animação' }, { id: 35, name: 'Comédia' },
        { id: 80, name: 'Crime' }, { id: 18, name: 'Drama' },
        { id: 27, name: 'Terror' }, { id: 878, name: 'Ficção Científica' },
        { id: 53, name: 'Suspense' }, { id: 10749, name: 'Romance' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (genre: Genre) => {
    setSelected((prev) =>
      prev.some((g) => g.id === genre.id)
        ? prev.filter((g) => g.id !== genre.id)
        : [...prev, genre],
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await apiClient.put(`/users/${user.id}/preferences`, {
        preferences: { genres: selected },
      });
      updateUser({
        genre_preferences: selected.map((g) => ({ id: g.id, name: g.name })),
      });
      router.replace('/(tabs)');
    } catch {
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={['#18181b', '#27272a']} style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Seus gêneros favoritos</Text>
        <Text style={styles.subtitle}>
          Selecione pelo menos 1 para receber notificações personalizadas
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#be123c" size="large" />
      ) : (
        <FlatList
          data={genres}
          numColumns={2}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => {
            const isSelected = selected.some((g) => g.id === item.id);
            return (
              <TouchableOpacity
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggleGenre(item)}
                activeOpacity={0.8}
              >
                {isSelected && (
                  <LinearGradient
                    colors={['#be123c', '#9f1239']}
                    style={StyleSheet.absoluteFillObject}
                  />
                )}
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, saving && styles.disabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#be123c', '#9f1239']} style={styles.buttonGradient}>
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {selected.length > 0 ? `Salvar (${selected.length} selecionados)` : 'Pular'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 12 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 22 },
  grid: { paddingHorizontal: 16, paddingBottom: 120 },
  row: { gap: 12, marginBottom: 12 },
  chip: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  chipSelected: { borderColor: '#be123c' },
  chipText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  chipTextSelected: { color: '#FFFFFF' },
  footer: { position: 'absolute', bottom: 40, left: 24, right: 24 },
  button: { borderRadius: 16, overflow: 'hidden' },
  buttonGradient: { paddingVertical: 18, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
