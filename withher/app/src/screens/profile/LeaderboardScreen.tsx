import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import type { ProfileStackParamList } from '../../types';

interface LeaderEntry {
  rank: number;
  userId: string;
  firstName: string;
  lastName: string;
  photoURL?: string;
  badgeCount: number;
  completedSessions: number;
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const currentUserId = useAppSelector((s) => s.auth.appUser?.id);
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(): Promise<void> {
    try {
      const res = await apiClient.get<{ data: LeaderEntry[] }>('/gamification/leaderboard');
      setEntries(res.data.data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRefresh(): Promise<void> {
    setRefreshing(true);
    await load();
  }

  function renderEntry({ item }: { item: LeaderEntry }): React.JSX.Element {
    const isMe = item.userId === currentUserId;
    return (
      <View style={[styles.row, isMe && styles.rowHighlight]}>
        <Text style={styles.rank}>{MEDAL[item.rank] ?? `#${item.rank}`}</Text>
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={18} color={Colors.textDisabledLight} />
          </View>
        )}
        <View style={styles.nameBlock}>
          <Text style={[styles.name, isMe && styles.nameMine]}>
            {item.firstName} {item.lastName}{isMe ? ' (You)' : ''}
          </Text>
          <Text style={styles.sessions}>{item.completedSessions} sessions</Text>
        </View>
        <View style={styles.badgeCount}>
          <Text style={styles.badgeEmoji}>🏅</Text>
          <Text style={styles.badgeNumber}>{item.badgeCount}</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimaryLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.userId}
          renderItem={renderEntry}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>Top Members</Text>
              <Text style={styles.listHeaderSub}>Ranked by badges earned</Text>
            </View>
          }
          ListEmptyComponent={<Text style={styles.emptyText}>No data yet.</Text>}
        />
      )}
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
  list: { paddingBottom: Spacing.xxxl },
  listHeader: { padding: Spacing.lg, paddingBottom: Spacing.sm },
  listHeaderTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimaryLight },
  listHeaderSub: { fontSize: FontSize.sm, color: Colors.textSecondaryLight, marginTop: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  rowHighlight: { backgroundColor: `${Colors.primary}08` },
  rank: { fontSize: FontSize.xl, width: 40, textAlign: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: Spacing.md },
  avatarPlaceholder: { backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
  nameBlock: { flex: 1 },
  name: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight },
  nameMine: { color: Colors.primary },
  sessions: { fontSize: FontSize.xs, color: Colors.textSecondaryLight, marginTop: 1 },
  badgeCount: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  badgeEmoji: { fontSize: 16 },
  badgeNumber: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimaryLight },
  emptyText: { textAlign: 'center', color: Colors.textSecondaryLight, marginTop: Spacing.xxxl },
});
