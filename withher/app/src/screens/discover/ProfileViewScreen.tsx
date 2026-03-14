import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { swipeOnUser } from '../../store/slices/matchSlice';
import { apiClient } from '../../services/api';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import type { AppUser, DiscoverStackParamList } from '../../types';

const { height: SCREEN_H } = Dimensions.get('window');

type RouteProps = RouteProp<DiscoverStackParamList, 'ProfileView'>;

export default function ProfileViewScreen(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<DiscoverStackParamList>>();
  const { userId } = route.params;

  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const currentUserId = useAppSelector((s) => s.auth.appUser?.id);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get<{ data: AppUser }>(`/users/${userId}/full-profile`);
        setUser(res.data.data);
      } catch {
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, navigation]);

  async function handleSwipe(direction: 'right' | 'left'): Promise<void> {
    if (!user) return;
    setActionLoading(true);
    try {
      await dispatch(swipeOnUser({ targetUserId: user.id, direction })).unwrap();
      navigation.goBack();
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!user) return <SafeAreaView style={styles.center}><Text>Not found</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimaryLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero photo */}
        <View style={styles.heroContainer}>
          {user.profile?.photoURL ? (
            <Image source={{ uri: user.profile.photoURL }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Ionicons name="person" size={72} color={Colors.textDisabledLight} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.gradient}
          />
          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
              {user.isVerified && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} style={{ marginLeft: 6 }} />
              )}
            </View>
            {user.profile?.careerLevel && (
              <View style={styles.careerBadge}>
                <Text style={styles.careerBadgeText}>{user.profile.careerLevel.replace('_', ' ')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick facts */}
        <View style={styles.section}>
          {(user.profile?.position || user.profile?.currentTeam) && (
            <View style={styles.factRow}>
              <Ionicons name="football" size={18} color={Colors.primary} />
              <Text style={styles.factText}>
                {[user.profile.position, user.profile.currentTeam].filter(Boolean).join(' · ')}
              </Text>
            </View>
          )}
          {user.profile?.yearsExperience != null && (
            <View style={styles.factRow}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <Text style={styles.factText}>{user.profile.yearsExperience} years experience</Text>
            </View>
          )}
          {user.profile?.location && (
            <View style={styles.factRow}>
              <Ionicons name="location-outline" size={18} color={Colors.primary} />
              <Text style={styles.factText}>{user.profile.location}</Text>
            </View>
          )}
        </View>

        {/* Bio */}
        {user.profile?.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{user.profile.bio}</Text>
          </View>
        ) : null}

        {/* Goals */}
        {user.profile?.goals && user.profile.goals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Goals</Text>
            <View style={styles.chipRow}>
              {user.profile.goals.map((g, i) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipText}>{g}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Role */}
        {user.profile?.mentorshipRole && currentUserId !== userId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Looking to</Text>
            <Text style={styles.roleText}>
              {user.profile.mentorshipRole === 'MENTOR' && 'Mentor others'}
              {user.profile.mentorshipRole === 'MENTEE' && 'Find a mentor'}
              {user.profile.mentorshipRole === 'BOTH' && 'Mentor and be mentored'}
            </Text>
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>

      {currentUserId !== userId && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.passBtn]}
            onPress={() => handleSwipe('left')}
            disabled={actionLoading}
          >
            <Ionicons name="close" size={28} color={Colors.error} />
            <Text style={[styles.actionBtnText, { color: Colors.error }]}>Pass</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.connectBtn]}
            onPress={() => handleSwipe('right')}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="heart" size={28} color={Colors.white} />
                <Text style={[styles.actionBtnText, { color: Colors.white }]}>Connect</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.backgroundLight },
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
  scroll: { paddingBottom: Spacing.xxxl },
  heroContainer: { height: SCREEN_H * 0.45, position: 'relative' },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' },
  heroInfo: { position: 'absolute', bottom: Spacing.lg, left: Spacing.lg, right: Spacing.lg },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  name: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.white },
  careerBadge: {
    backgroundColor: 'rgba(124,77,255,0.9)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  careerBadgeText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  section: { marginHorizontal: Spacing.lg, marginTop: Spacing.lg },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondaryLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.xs },
  factRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  factText: { fontSize: FontSize.md, color: Colors.textPrimaryLight },
  bio: { fontSize: FontSize.md, color: Colors.textSecondaryLight, lineHeight: 22 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: { backgroundColor: `${Colors.primary}18`, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm },
  chipText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  roleText: { fontSize: FontSize.md, color: Colors.textPrimaryLight },
  spacer: { height: 80 },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.md,
    backgroundColor: Colors.surfaceLight,
  },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, gap: Spacing.xs },
  passBtn: { borderWidth: 2, borderColor: Colors.error, backgroundColor: 'transparent' },
  connectBtn: { backgroundColor: Colors.primary },
  actionBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
