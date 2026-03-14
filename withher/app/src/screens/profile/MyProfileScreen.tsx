import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCurrentUser } from '../../store/slices/userSlice';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import type { ProfileStackParamList } from '../../types';

export default function MyProfileScreen(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { profile: currentUser, isLoading } = useAppSelector((s) => s.user);

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  async function handleRefresh(): Promise<void> {
    dispatch(fetchCurrentUser());
  }

  if (isLoading && !currentUser) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const profile = currentUser?.profile;
  const completeness = profile?.completenessScore ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>My Profile</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={24} color={Colors.textPrimaryLight} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.iconBtn}>
              <Ionicons name="settings-outline" size={24} color={Colors.textPrimaryLight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          {currentUser?.profilePhotoUrl ? (
            <Image source={{ uri: currentUser.profilePhotoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={48} color={Colors.textDisabledLight} />
            </View>
          )}
          <Text style={styles.fullName}>{currentUser?.firstName} {currentUser?.lastName}</Text>
          {profile?.careerLevel && (
            <Text style={styles.careerLevel}>{profile.careerLevel.replace('_', ' ')}</Text>
          )}
          {profile?.currentTeam && (
            <Text style={styles.team}>{profile.currentTeam}</Text>
          )}
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
            <Ionicons name="pencil" size={14} color={Colors.primary} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Completeness */}
        <View style={styles.card}>
          <View style={styles.completenessRow}>
            <Text style={styles.completenessLabel}>Profile Completeness</Text>
            <Text style={styles.completenessPct}>{completeness}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completeness}%` }]} />
          </View>
          {completeness < 100 && (
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
              <Text style={styles.completeHint}>Complete your profile to get better matches</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Connections</Text>
          </View>
        </View>

        {/* Badges preview */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent Badges</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Badges')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.emptyText}>Badge sync is coming soon on web.</Text>

        {/* Leaderboard link */}
        <TouchableOpacity style={styles.leaderboardBtn} onPress={() => navigation.navigate('Leaderboard')}>
          <Ionicons name="trophy-outline" size={20} color={Colors.accent} />
          <Text style={styles.leaderboardBtnText}>View Leaderboard</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textDisabledLight} />
        </TouchableOpacity>

        {/* Safety link */}
        <TouchableOpacity style={styles.safetyBtn} onPress={() => navigation.navigate('Safety')}>
          <Ionicons name="shield-checkmark-outline" size={20} color={Colors.secondary} />
          <Text style={styles.safetyBtnText}>Safety Center</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textDisabledLight} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.backgroundLight },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  screenTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimaryLight },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: { padding: 4 },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: Spacing.md },
  avatarPlaceholder: { backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
  fullName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimaryLight },
  careerLevel: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium, marginTop: 2 },
  team: { fontSize: FontSize.sm, color: Colors.textSecondaryLight, marginTop: 2 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.primary },
  editBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },
  card: { backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  completenessRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  completenessLabel: { fontSize: FontSize.sm, color: Colors.textSecondaryLight },
  completenessPct: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
  progressTrack: { height: 6, backgroundColor: Colors.borderLight, borderRadius: 3, overflow: 'hidden', marginBottom: Spacing.xs },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  completeHint: { fontSize: FontSize.xs, color: Colors.primary },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimaryLight },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondaryLight, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.borderLight },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight },
  seeAll: { fontSize: FontSize.sm, color: Colors.primary },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  badgeChip: { alignItems: 'center', width: 72, padding: Spacing.xs, backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.borderLight },
  badgeEmoji: { fontSize: 24 },
  badgeName: { fontSize: 10, color: Colors.textSecondaryLight, marginTop: 2, textAlign: 'center' },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondaryLight, fontStyle: 'italic', marginBottom: Spacing.xl },
  leaderboardBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.borderLight },
  leaderboardBtnText: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimaryLight },
  safetyBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.borderLight },
  safetyBtnText: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimaryLight },
});
