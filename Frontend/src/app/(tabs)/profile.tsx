import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Star, Film, Gift, Receipt, Popcorn, CupSoda, Ticket, Moon, Sun, Edit2, X, Check } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth.store';
import { moviesService } from '@/services/api/movies.service';
import { useTicketsStore } from '@/stores/tickets.store';
import { useThemeStore } from '@/stores/theme.store';
import { Colors } from '@/constants/theme';
import { Reward } from '@/types/ticket.types';

function RewardCard({ reward, c }: { reward: Reward; c: any }) {
  const getRewardIcon = (iconStr: string) => {
    switch(iconStr) {
      case '🍿': return <Popcorn size={28} color={c.primary} />;
      case '🥤': return <CupSoda size={28} color={c.primary} />;
      case '🎟️': return <Ticket size={28} color={c.primary} />;
      default: return <Gift size={28} color={c.primary} />;
    }
  };

  return (
    <View style={[styles.rewardCard, { backgroundColor: c.card, borderColor: c.border }, !reward.can_redeem && styles.rewardCardDisabled]}>
      <View style={{ width: 40, alignItems: 'center' }}>
        {getRewardIcon(reward.icon)}
      </View>
      <View style={styles.rewardInfo}>
        <Text style={[styles.rewardName, { color: c.text }]}>{reward.name}</Text>
        <Text style={[styles.rewardDesc, { color: c.textSecondary }]}>{reward.description}</Text>
      </View>
      <View style={styles.rewardPoints}>
        <Text style={[styles.rewardPointsText, { color: reward.can_redeem ? c.primary : c.icon }]}>
          {reward.points_required} pts
        </Text>
        {reward.can_redeem && (
          <TouchableOpacity
            style={[styles.redeemBtn, { backgroundColor: c.primary }]}
            onPress={() => Alert.alert('Parabéns!', `Recompensa "${reward.name}" resgatada!`)}
          >
            <Text style={styles.redeemText}>Resgatar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout, updateUserGenres } = useAuthStore();
  const { pointsBalance, rewards, pointsHistory, fetchPoints, fetchRewards } = useTicketsStore();
  const { theme, toggleTheme } = useThemeStore();
  const c = Colors[theme];
  
  const [isGenreModalVisible, setIsGenreModalVisible] = useState(false);
  const [allGenres, setAllGenres] = useState<any[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<any[]>([]);

  useEffect(() => {
    fetchPoints();
    fetchRewards();
  }, []);

  const progressToNext = rewards.find((r) => !r.can_redeem);
  const progressPercent = progressToNext
    ? Math.min((pointsBalance / progressToNext.points_required) * 100, 100)
    : 100;

  const router = useRouter();

  const handleOpenGenreModal = async () => {
    setSelectedGenres(user?.genre_preferences || []);
    setIsGenreModalVisible(true);
    if (allGenres.length === 0) {
      try {
        const genres = await moviesService.getGenres();
        setAllGenres(genres);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSaveGenres = async () => {
    await updateUserGenres(selectedGenres);
    setIsGenreModalVisible(false);
  };

  const toggleGenre = (genre: any) => {
    if (selectedGenres.find((g) => g.id === genre.id)) {
      setSelectedGenres(selectedGenres.filter((g) => g.id !== genre.id));
    } else {
      setSelectedGenres([...selectedGenres, { id: genre.id, name: genre.name }]);
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('Deseja sair da sua conta?');
      if (confirm) {
        await logout();
        router.replace('/welcome');
      }
    } else {
      Alert.alert('Sair', 'Deseja sair da sua conta?', [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive', 
          onPress: async () => {
            await logout();
            router.replace('/welcome');
          } 
        },
      ]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <LinearGradient colors={[c.background, c.backgroundSecondary]} style={styles.header}>
          <SafeAreaView>
            <View style={styles.profileSection}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={[c.primary, c.primaryDark]} style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{user?.name?.[0]}</Text>
                </LinearGradient>
              )}
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: c.text }]}>{user?.name}</Text>
                <Text style={[styles.profileEmail, { color: c.textSecondary }]}>{user?.email}</Text>
              </View>
              {/* Theme Toggle Button */}
              <TouchableOpacity onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: c.card }]}>
                {theme === 'dark' ? <Sun size={20} color={c.text} /> : <Moon size={20} color={c.text} />}
              </TouchableOpacity>
            </View>

            {/* Points Card */}
            <LinearGradient
              colors={[c.primary + '33', c.primary + '11']}
              style={[styles.pointsCard, { borderColor: c.primary + '44' }]}
            >
              <View style={styles.pointsHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Star size={20} color={c.text} />
                  <Text style={[styles.pointsLabel, { color: c.text }]}>Seus Pontos</Text>
                </View>
                <Text style={[styles.pointsBalance, { color: c.primary }]}>{pointsBalance}</Text>
              </View>
              {progressToNext && (
                <>
                  <View style={[styles.progressBar, { backgroundColor: c.borderStrong }]}>
                    <LinearGradient
                      colors={[c.primary, c.primaryDark]}
                      style={[styles.progressFill, { width: `${progressPercent}%` as any }]}
                    />
                  </View>
                  <Text style={[styles.progressLabel, { color: c.textSecondary }]}>
                    {progressToNext.points_required - pointsBalance} pts para "{progressToNext.name}"
                  </Text>
                </>
              )}
            </LinearGradient>
          </SafeAreaView>
        </LinearGradient>

        {/* Genre Preferences */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Film size={20} color={c.text} />
              <Text style={[styles.sectionTitle, { color: c.text, marginBottom: 0 }]}>Seus Gêneros</Text>
            </View>
            <TouchableOpacity onPress={handleOpenGenreModal} style={{ padding: 4 }}>
              <Edit2 size={16} color={c.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.genreContainer}>
            {user?.genre_preferences?.map((g) => (
              <View key={g.id} style={[styles.genreChip, { backgroundColor: c.primary + '22', borderColor: c.primary + '44' }]}>
                <Text style={[styles.genreText, { color: c.primary }]}>{g.name}</Text>
              </View>
            ))}
            {(!user?.genre_preferences || user.genre_preferences.length === 0) && (
              <Text style={{ color: c.textSecondary, fontSize: 14 }}>Nenhum gênero selecionado</Text>
            )}
          </View>
        </View>

        {/* Rewards */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Gift size={20} color={c.text} />
            <Text style={[styles.sectionTitle, { color: c.text }]}>Trocar pontos por Descontos</Text>
          </View>
          {rewards.map((reward) => (
            <RewardCard key={reward.id} reward={reward} c={c} />
          ))}
        </View>

        {/* Points History */}
        {pointsHistory.length > 0 && (
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Receipt size={20} color={c.text} />
              <Text style={[styles.sectionTitle, { color: c.text }]}>Histórico</Text>
            </View>
            {pointsHistory.slice(0, 5).map((item) => (
              <View key={item.id} style={[styles.historyItem, { borderBottomColor: c.border }]}>
                <Text style={[styles.historyMovie, { color: c.text }]} numberOfLines={1}>{item.movie_title}</Text>
                <Text style={[styles.historyPoints, { color: c.success }]}>+{item.points_earned} pts</Text>
              </View>
            ))}
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: c.errorLight, borderColor: c.error + '44' }]} onPress={handleLogout}>
          <Text style={[styles.logoutText, { color: c.error }]}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Genre Selection Modal */}
      <Modal visible={isGenreModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <LinearGradient colors={[c.backgroundSecondary, c.background]} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Selecione seus Gêneros</Text>
              <TouchableOpacity onPress={() => setIsGenreModalVisible(false)}>
                <X size={24} color={c.icon} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.genreGrid}>
                {allGenres.map((genre) => {
                  const isSelected = !!selectedGenres.find((g) => g.id === genre.id);
                  return (
                    <TouchableOpacity
                      key={genre.id}
                      style={[
                        styles.genreSelectChip,
                        { borderColor: isSelected ? c.primary : c.border },
                        isSelected && { backgroundColor: c.primary + '22' }
                      ]}
                      onPress={() => toggleGenre(genre)}
                    >
                      <Text style={[styles.genreSelectText, { color: isSelected ? c.primary : c.textSecondary }]}>
                        {genre.name}
                      </Text>
                      {isSelected && <Check size={14} color={c.primary} style={{ marginLeft: 6 }} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: c.primary }]}
              onPress={handleSaveGenres}
            >
              <Text style={styles.saveBtnText}>Salvar Preferências</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 100 },
  header: { paddingBottom: 24 },
  profileSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, gap: 16, marginBottom: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 3 },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '800' },
  profileEmail: { fontSize: 13, marginTop: 2 },
  themeBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  pointsCard: { marginHorizontal: 16, borderRadius: 20, padding: 20, borderWidth: 1 },
  pointsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pointsLabel: { fontSize: 16, fontWeight: '700' },
  pointsBalance: { fontSize: 36, fontWeight: '900' },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabel: { fontSize: 12 },
  section: { paddingHorizontal: 20, paddingTop: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  genreContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genreChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, borderWidth: 1 },
  genreText: { fontWeight: '600', fontSize: 13 },
  rewardCard: { flexDirection: 'row', borderRadius: 16, padding: 16, marginBottom: 10, gap: 12, alignItems: 'center', borderWidth: 1 },
  rewardCardDisabled: { opacity: 0.5 },
  rewardInfo: { flex: 1 },
  rewardName: { fontSize: 14, fontWeight: '700' },
  rewardDesc: { fontSize: 12, marginTop: 2 },
  rewardPoints: { alignItems: 'flex-end', gap: 6 },
  rewardPointsText: { fontSize: 13, fontWeight: '700' },
  redeemBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  redeemText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  historyMovie: { fontSize: 14, flex: 1, marginRight: 12 },
  historyPoints: { fontSize: 14, fontWeight: '700' },
  logoutBtn: { marginHorizontal: 20, marginTop: 32, paddingVertical: 16, alignItems: 'center', borderRadius: 16, borderWidth: 1 },
  logoutText: { fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 48, maxHeight: '80%', borderWidth: 1, borderColor: 'rgba(190,18,60,0.2)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalScroll: { marginBottom: 20 },
  modalScrollContent: { paddingBottom: 20 },
  genreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  genreSelectChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  genreSelectText: { fontSize: 14, fontWeight: '600' },
  saveBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
