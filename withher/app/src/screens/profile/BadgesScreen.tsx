import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import type { UserBadge, ProfileStackParamList } from '../../types';

export default function BadgesScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<UserBadge | null>(null);

  async function loadBadges(): Promise<void> {
    try {
      const res = await apiClient.get<{ data: UserBadge[] }>('/gamification/badges');
      setBadges(res.data.data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadBadges();
  }, []);

  async function handleRefresh(): Promise<void> {
    setRefreshing(true);
    await loadBadges();
  }

  function renderBadge({ item }: { item: UserBadge }): React.JSX.Element {
    return (
      <TouchableOpacity style={styles.badgeCard} onPress={() => setSelected(item)} activeOpacity={0.8}>
        <View style={styles.badgeIconBox}>
          <Text style={styles.badgeEmoji}>{item.badge?.icon ?? '🏅'}</Text>
        </View>
        <Text style={styles.badgeName} numberOfLines={2}>{item.badge?.name}</Text>
        <Text style={styles.badgeDate}>
          {new Date(item.earnedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimaryLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Badges</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={badges}
          keyExtractor={(b) => b.id}
          renderItem={renderBadge}
          numColumns={3}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
          ListHeaderComponent={
            <Text style={styles.countLabel}>{badges.length} badge{badges.length !== 1 ? 's' : ''} earned</Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏅</Text>
              <Text style={styles.emptyTitle}>No badges yet</Text>
              <Text style={styles.emptySubtitle}>Complete sessions and engage with the community to earn badges.</Text>
            </View>
          }
        />
      )}

      {/* Badge detail modal */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelected(null)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>{selected?.badge?.icon ?? '🏅'}</Text>
            <Text style={styles.modalName}>{selected?.badge?.name}</Text>
            <Text style={styles.modalDesc}>{selected?.badge?.description}</Text>
            <Text style={styles.modalDate}>
              Earned: {selected ? new Date(selected.earnedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surfaceLight,
  },
  backBtn: { width: 40 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight },
  list: { padding: Spacing.md, paddingBottom: Spacing.xxxl },
  countLabel: { fontSize: FontSize.sm, color: Colors.textSecondaryLight, marginBottom: Spacing.md },
  columnWrapper: { gap: Spacing.sm, marginBottom: Spacing.sm },
  badgeCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  badgeIconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xs },
  badgeEmoji: { fontSize: 28 },
  badgeName: { fontSize: 11, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight, textAlign: 'center', marginBottom: 2 },
  badgeDate: { fontSize: 10, color: Colors.textDisabledLight },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondaryLight, textAlign: 'center', lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalCard: { backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', width: '100%' },
  modalEmoji: { fontSize: 64, marginBottom: Spacing.md },
  modalName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimaryLight, textAlign: 'center', marginBottom: Spacing.sm },
  modalDesc: { fontSize: FontSize.md, color: Colors.textSecondaryLight, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.md },
  modalDate: { fontSize: FontSize.sm, color: Colors.textDisabledLight },
});
