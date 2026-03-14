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
  FlatList,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import type { ProfileStackParamList } from '../../types';

interface BlockedUser {
  id: string;
  firstName: string;
  lastName: string;
  photoURL?: string;
}

const REPORT_REASONS = [
  'Inappropriate behavior',
  'Harassment or bullying',
  'Spam or fake account',
  'Hate speech or discrimination',
  'Other',
];

export default function SafetyScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const [tab, setTab] = useState<'report' | 'blocked'>('report');

  // Report form
  const [reportUserId, setReportUserId] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Blocked list
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  useEffect(() => {
    if (tab === 'blocked') loadBlocked();
  }, [tab]);

  async function loadBlocked(): Promise<void> {
    setLoadingBlocked(true);
    try {
      const res = await apiClient.get<{ data: BlockedUser[] }>('/safety/blocked');
      setBlockedUsers(res.data.data ?? []);
    } finally {
      setLoadingBlocked(false);
    }
  }

  async function handleReport(): Promise<void> {
    if (!reportReason) { Alert.alert('Required', 'Please select a reason.'); return; }
    if (!reportUserId.trim()) { Alert.alert('Required', 'Provide the User ID or username.'); return; }
    setSubmitting(true);
    try {
      await apiClient.post('/safety/report', {
        reportedUserId: reportUserId.trim(),
        reason: reportReason,
        details: reportDetails.trim(),
      });
      setReportUserId('');
      setReportReason('');
      setReportDetails('');
      Alert.alert('Report Submitted', 'Thank you. Our team will review this report within 24 hours.');
    } catch {
      Alert.alert('Error', 'Could not submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnblock(userId: string): Promise<void> {
    Alert.alert('Unblock User', 'This user will be able to see your profile and match with you again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: async () => {
          try {
            await apiClient.delete(`/safety/block/${userId}`);
            setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
          } catch {
            Alert.alert('Error', 'Could not unblock user.');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimaryLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Center</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'report' && styles.tabActive]}
          onPress={() => setTab('report')}
        >
          <Text style={[styles.tabText, tab === 'report' && styles.tabTextActive]}>Report</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'blocked' && styles.tabActive]}
          onPress={() => setTab('blocked')}
        >
          <Text style={[styles.tabText, tab === 'blocked' && styles.tabTextActive]}>Blocked Users</Text>
        </TouchableOpacity>
      </View>

      {tab === 'report' ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.secondary} />
            <Text style={styles.infoText}>
              Your safety is our priority. All reports are reviewed within 24 hours.
            </Text>
          </View>

          <Text style={styles.label}>User ID or username *</Text>
          <TextInput
            style={styles.input}
            value={reportUserId}
            onChangeText={setReportUserId}
            placeholder="Enter user ID"
            placeholderTextColor={Colors.textDisabledLight}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Reason for report *</Text>
          {REPORT_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={[styles.reasonRow, reportReason === reason && styles.reasonRowActive]}
              onPress={() => setReportReason(reason)}
            >
              <View style={[styles.radio, reportReason === reason && styles.radioActive]}>
                {reportReason === reason && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.reasonText, reportReason === reason && styles.reasonTextActive]}>{reason}</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.label}>Additional details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={reportDetails}
            onChangeText={setReportDetails}
            placeholder="Describe the issue (optional)"
            placeholderTextColor={Colors.textDisabledLight}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleReport} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <>
          {loadingBlocked ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.primary} size="large" />
            </View>
          ) : (
            <FlatList
              data={blockedUsers}
              keyExtractor={(u) => u.id}
              contentContainerStyle={styles.scroll}
              renderItem={({ item }) => (
                <View style={styles.blockedRow}>
                  {item.photoURL ? (
                    <Image source={{ uri: item.photoURL }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Ionicons name="person" size={16} color={Colors.textDisabledLight} />
                    </View>
                  )}
                  <Text style={styles.blockedName}>{item.firstName} {item.lastName}</Text>
                  <TouchableOpacity style={styles.unblockBtn} onPress={() => handleUnblock(item.id)}>
                    <Text style={styles.unblockBtnText}>Unblock</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>You haven't blocked anyone.</Text>}
            />
          )}
        </>
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
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.borderLight, backgroundColor: Colors.surfaceLight },
  tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: FontSize.md, color: Colors.textSecondaryLight, fontWeight: FontWeight.medium },
  tabTextActive: { color: Colors.primary },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: `${Colors.secondary}15`, padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.lg },
  infoText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondaryLight, lineHeight: 20 },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondaryLight, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: { borderWidth: 1, borderColor: Colors.borderLight, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.textPrimaryLight, backgroundColor: Colors.surfaceLight },
  textArea: { minHeight: 100, textAlignVertical: 'top', marginTop: Spacing.xs },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs, borderRadius: BorderRadius.sm },
  reasonRowActive: { backgroundColor: `${Colors.primary}08` },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  reasonText: { fontSize: FontSize.md, color: Colors.textPrimaryLight },
  reasonTextActive: { color: Colors.primary },
  submitBtn: { backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', marginTop: Spacing.xl },
  submitBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  blockedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: Spacing.md },
  avatarPlaceholder: { backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
  blockedName: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimaryLight },
  unblockBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.primary },
  unblockBtnText: { fontSize: FontSize.sm, color: Colors.primary },
  emptyText: { textAlign: 'center', color: Colors.textSecondaryLight, marginTop: Spacing.xxxl, fontSize: FontSize.md },
});
