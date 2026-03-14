import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import type { Session, MatchesStackParamList } from '../../types';

type RouteProps = RouteProp<MatchesStackParamList, 'SessionDetail'>;

interface SessionNotesDraft {
  topicsDiscussed: string;
  goalsSet: string;
  challenges: string;
  nextSteps: string;
  rating: number | null;
}

export default function SessionDetailScreen(): React.JSX.Element {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MatchesStackParamList>>();
  const { sessionId } = route.params;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState<SessionNotesDraft>({
    topicsDiscussed: '',
    goalsSet: '',
    challenges: '',
    nextSteps: '',
    rating: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get<{ data: Session }>(`/sessions/${sessionId}`);
        const s = res.data.data;
        setSession(s);
        if (s.notes) {
          setNotes({
            topicsDiscussed: s.notes.topicsDiscussed ?? '',
            goalsSet: s.notes.goalsSet ?? '',
            challenges: s.notes.challenges ?? '',
            nextSteps: s.notes.nextSteps ?? '',
            rating: s.notes.rating ?? null,
          });
        }
      } catch {
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId, navigation]);

  async function handleSubmitNotes(): Promise<void> {
    if (!notes.topicsDiscussed.trim()) {
      Alert.alert('Required', 'Please enter the topics discussed.');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(`/sessions/${sessionId}/notes`, notes);
      Alert.alert('Saved', 'Session notes submitted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Could not save notes. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(): Promise<void> {
    Alert.alert('Cancel Session', 'Are you sure you want to cancel this session?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.patch(`/sessions/${sessionId}/cancel`, {});
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'Could not cancel session.');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!session) return <SafeAreaView style={styles.center}><Text>Not found</Text></SafeAreaView>;

  const canSubmitNotes = session.status === 'COMPLETED' || session.status === 'IN_PROGRESS';
  const isCancellable = session.status === 'SCHEDULED';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimaryLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Detail</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Session info card */}
        <View style={styles.card}>
          <View style={styles.statusBadgeRow}>
            <Text style={[styles.statusBadge, session.status === 'COMPLETED' && styles.statusCompleted]}>
              {session.status}
            </Text>
          </View>
          {session.scheduledAt && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
              <Text style={styles.infoText}>
                {new Date(session.scheduledAt).toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                })}
              </Text>
            </View>
          )}
          {session.duration && (
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <Text style={styles.infoText}>{session.duration} minutes</Text>
            </View>
          )}
          {session.meetingLink && (
            <View style={styles.infoRow}>
              <Ionicons name="videocam-outline" size={18} color={Colors.primary} />
              <Text style={styles.infoText} numberOfLines={1}>{session.meetingLink}</Text>
            </View>
          )}
        </View>

        {/* Notes form */}
        {canSubmitNotes && (
          <>
            <Text style={styles.sectionTitle}>Session Notes</Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Topics Discussed *</Text>
              <TextInput
                style={styles.textArea}
                value={notes.topicsDiscussed}
                onChangeText={(v) => setNotes((p) => ({ ...p, topicsDiscussed: v }))}
                placeholder="What did you discuss?"
                placeholderTextColor={Colors.textDisabledLight}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Goals Set</Text>
              <TextInput
                style={styles.textArea}
                value={notes.goalsSet}
                onChangeText={(v) => setNotes((p) => ({ ...p, goalsSet: v }))}
                placeholder="Goals established this session"
                placeholderTextColor={Colors.textDisabledLight}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Challenges</Text>
              <TextInput
                style={styles.textArea}
                value={notes.challenges}
                onChangeText={(v) => setNotes((p) => ({ ...p, challenges: v }))}
                placeholder="Any challenges discussed?"
                placeholderTextColor={Colors.textDisabledLight}
                multiline
                numberOfLines={2}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Next Steps</Text>
              <TextInput
                style={styles.textArea}
                value={notes.nextSteps}
                onChangeText={(v) => setNotes((p) => ({ ...p, nextSteps: v }))}
                placeholder="Action items for next time"
                placeholderTextColor={Colors.textDisabledLight}
                multiline
                numberOfLines={2}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Rating</Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setNotes((p) => ({ ...p, rating: star }))}>
                    <Ionicons
                      name={notes.rating != null && notes.rating >= star ? 'star' : 'star-outline'}
                      size={32}
                      color={Colors.accent}
                      style={{ marginRight: Spacing.xs }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitNotes} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>Save Notes</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {isCancellable && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>Cancel Session</Text>
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statusBadgeRow: { marginBottom: Spacing.sm },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.borderLight,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondaryLight,
    overflow: 'hidden',
  },
  statusCompleted: { backgroundColor: `${Colors.success}18`, color: Colors.success },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  infoText: { fontSize: FontSize.md, color: Colors.textPrimaryLight, flex: 1 },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight, marginBottom: Spacing.md },
  formGroup: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondaryLight, marginBottom: Spacing.xs },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.textPrimaryLight,
    backgroundColor: Colors.surfaceLight,
    textAlignVertical: 'top',
  },
  ratingRow: { flexDirection: 'row' },
  submitBtn: { backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', marginTop: Spacing.md },
  submitBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  cancelBtn: { marginTop: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.error },
  cancelBtnText: { color: Colors.error, fontSize: FontSize.md, fontWeight: FontWeight.medium },
});
