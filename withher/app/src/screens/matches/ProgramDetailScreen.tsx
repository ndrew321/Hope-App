import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { startProgram } from '../../store/slices/matchSlice';
import { apiClient } from '../../services/api';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import type { MentorshipProgram, Session, MatchesStackParamList } from '../../types';

type RouteProps = RouteProp<MatchesStackParamList, 'ProgramDetail'>;

export default function ProgramDetailScreen(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MatchesStackParamList>>();
  const { programId } = route.params;

  const [program, setProgram] = useState<MentorshipProgram | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [progRes, sessRes] = await Promise.all([
          apiClient.get<{ data: MentorshipProgram }>(`/sessions/programs/${programId}`),
          apiClient.get<{ data: Session[] }>(`/sessions/programs/${programId}/sessions`),
        ]);
        setProgram(progRes.data.data);
        setSessions(sessRes.data.data ?? []);
      } catch {
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [programId, navigation]);

  const completedCount = sessions.filter((s) => s.status === 'COMPLETED').length;
  const progress = sessions.length > 0 ? completedCount / sessions.length : 0;

  async function handleStartProgram(): Promise<void> {
    if (!program) return;
    setActionLoading(true);
    try {
      await dispatch(startProgram(program.matchId)).unwrap();
      const refreshed = await apiClient.get<{ data: MentorshipProgram }>(`/sessions/programs/${programId}`);
      setProgram(refreshed.data.data);
    } finally {
      setActionLoading(false);
    }
  }

  function statusIcon(status: string): { name: string; color: string } {
    switch (status) {
      case 'COMPLETED': return { name: 'checkmark-circle', color: Colors.success };
      case 'IN_PROGRESS': return { name: 'ellipse', color: Colors.primary };
      case 'CANCELLED': return { name: 'close-circle', color: Colors.error };
      default: return { name: 'ellipse-outline', color: Colors.textDisabledLight };
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!program) return <SafeAreaView style={styles.center}><Text>Not found</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimaryLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mentorship Program</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Progress card */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, program.status === 'ACTIVE' && styles.statusActive]}>
              <Text style={[styles.statusText, program.status === 'ACTIVE' && styles.statusTextActive]}>
                {program.status}
              </Text>
            </View>
            <Text style={styles.progressLabel}>{completedCount}/{sessions.length} sessions</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressPct}>{Math.round(progress * 100)}% complete</Text>

          {program.startDate && (
            <Text style={styles.dateText}>
              Started: {new Date(program.startDate).toLocaleDateString()}
            </Text>
          )}
          {program.endDate && (
            <Text style={styles.dateText}>
              Ends: {new Date(program.endDate).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Sessions timeline */}
        <Text style={styles.sectionTitle}>Sessions</Text>
        {sessions.length === 0 && (
          <Text style={styles.emptyText}>No sessions scheduled yet.</Text>
        )}
        {sessions.map((session, index) => {
          const icon = statusIcon(session.status);
          return (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionRow}
              onPress={() => navigation.navigate('SessionDetail', { sessionId: session.id })}
            >
              <View style={styles.timelineLeft}>
                <Ionicons name={icon.name as any} size={22} color={icon.color} />
                {index < sessions.length - 1 && <View style={styles.connector} />}
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionLabel}>Session {index + 1}</Text>
                {session.scheduledAt && (
                  <Text style={styles.sessionDate}>
                    {new Date(session.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                )}
                <Text style={[styles.sessionStatus, { color: icon.color }]}>{session.status}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textDisabledLight} />
            </TouchableOpacity>
          );
        })}

        {/* Actions */}
        {program.status === 'PENDING' && (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleStartProgram} disabled={actionLoading}>
            {actionLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Start Program</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
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
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  card: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm, backgroundColor: Colors.borderLight },
  statusActive: { backgroundColor: `${Colors.primary}18` },
  statusText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondaryLight },
  statusTextActive: { color: Colors.primary },
  progressLabel: { fontSize: FontSize.sm, color: Colors.textSecondaryLight },
  progressTrack: { height: 8, backgroundColor: Colors.borderLight, borderRadius: 4, overflow: 'hidden', marginBottom: Spacing.xs },
  progressFill: { height: '100%', backgroundColor: Colors.secondary, borderRadius: 4 },
  progressPct: { fontSize: FontSize.sm, color: Colors.textSecondaryLight, marginBottom: Spacing.sm },
  dateText: { fontSize: FontSize.sm, color: Colors.textSecondaryLight },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight, marginBottom: Spacing.md },
  emptyText: { color: Colors.textSecondaryLight, fontSize: FontSize.md, textAlign: 'center', marginTop: Spacing.xl },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  timelineLeft: { alignItems: 'center', width: 28, marginRight: Spacing.sm },
  connector: { width: 2, flex: 1, backgroundColor: Colors.borderLight, marginTop: 4 },
  sessionInfo: { flex: 1 },
  sessionLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight },
  sessionDate: { fontSize: FontSize.sm, color: Colors.textSecondaryLight, marginTop: 2 },
  sessionStatus: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginTop: 2 },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  primaryBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
