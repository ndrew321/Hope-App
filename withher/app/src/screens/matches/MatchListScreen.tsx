import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMatches } from '../../store/slices/matchSlice';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import type { Match, MatchesStackParamList } from '../../types';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: Colors.warning },
  ACTIVE: { label: 'Active', color: Colors.success },
  COMPLETED: { label: 'Completed', color: Colors.textSecondaryLight },
  DECLINED: { label: 'Declined', color: Colors.error },
};

export default function MatchListScreen(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<MatchesStackParamList>>();
  const { matches, isLoadingMatches } = useAppSelector((s) => s.match);
  const currentUserId = useAppSelector((s) => s.auth.appUser?.id);

  useEffect(() => {
    dispatch(fetchMatches());
  }, [dispatch]);

  function renderMatch({ item }: { item: Match }): React.JSX.Element {
    const partner = item.mentorId === currentUserId ? item.mentee : item.mentor;
    const status = STATUS_LABELS[item.status] ?? { label: item.status, color: Colors.textSecondaryLight };

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          if (item.program) {
            navigation.navigate('ProgramDetail', { programId: item.program.id });
          }
        }}
        activeOpacity={0.8}
      >
        {partner?.profilePhotoUrl ? (
          <Image source={{ uri: partner.profilePhotoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={28} color={Colors.textDisabledLight} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name}>
            {partner?.firstName ?? '?'} {partner?.lastName ?? ''}
          </Text>
          <Text style={styles.role}>
            {item.mentorId === currentUserId ? 'Mentee' : 'Mentor'}
          </Text>
          {item.program && (
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${item.program.completionPercentage}%` as `${number}%` }]}
                />
              </View>
              <Text style={styles.progressLabel}>{item.program.completionPercentage}%</Text>
            </View>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${status.color}22` }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Matches</Text>
      </View>
      {isLoadingMatches ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderMatch}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={64} color={Colors.borderLight} />
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptySub}>Keep swiping on the Discover tab to find your match!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundLight },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimaryLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.lg, gap: Spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: { backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  name: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight },
  role: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium, marginBottom: 6 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressTrack: { flex: 1, height: 4, backgroundColor: Colors.borderLight, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  progressLabel: { fontSize: FontSize.xs, color: Colors.textSecondaryLight, fontWeight: FontWeight.medium },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight },
  emptySub: { fontSize: FontSize.md, color: Colors.textSecondaryLight, textAlign: 'center', lineHeight: 24 },
});
