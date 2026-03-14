import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';
import { updateUserPreferences } from '../../store/slices/userSlice';
import { apiClient } from '../../services/api';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import type { ProfileStackParamList } from '../../types';

export default function SettingsScreen(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { currentUser } = useAppSelector((s) => s.user);
  const prefs = currentUser?.preferences;

  const [pushEnabled, setPushEnabled] = useState(prefs?.pushNotifications ?? true);
  const [emailEnabled, setEmailEnabled] = useState(prefs?.emailNotifications ?? true);
  const [weeklyDigest, setWeeklyDigest] = useState(prefs?.weeklyDigest ?? true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  async function handlePrefToggle(key: string, value: boolean): Promise<void> {
    dispatch(updateUserPreferences({ [key]: value }));
  }

  async function handleLogout(): Promise<void> {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await dispatch(logoutUser());
          setLoggingOut(false);
        },
      },
    ]);
  }

  function handleDeleteAccount(): void {
    Alert.alert(
      'Delete Account',
      'This is permanent. All your data including matches, messages, and progress will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'This action cannot be undone.',
              [
                { text: 'Keep Account', style: 'cancel' },
                {
                  text: 'Yes, Delete',
                  style: 'destructive',
                  onPress: async () => {
                    setDeletingAccount(true);
                    try {
                      await apiClient.delete('/users/me');
                      await dispatch(logoutUser());
                    } catch {
                      Alert.alert('Error', 'Could not delete account. Please contact support.');
                    } finally {
                      setDeletingAccount(false);
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }

  function renderRow(
    icon: string,
    label: string,
    right?: React.ReactNode,
    onPress?: () => void,
    destructive?: boolean,
  ): React.JSX.Element {
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <Ionicons name={icon as any} size={20} color={destructive ? Colors.error : Colors.primary} />
        <Text style={[styles.rowLabel, destructive && styles.destructiveText]}>{label}</Text>
        {right ?? (onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textDisabledLight} />)}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimaryLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Notifications */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.section}>
          {renderRow('notifications-outline', 'Push Notifications', (
            <Switch
              value={pushEnabled}
              onValueChange={(v) => { setPushEnabled(v); handlePrefToggle('pushNotifications', v); }}
              trackColor={{ true: Colors.primary }}
            />
          ))}
          {renderRow('mail-outline', 'Email Notifications', (
            <Switch
              value={emailEnabled}
              onValueChange={(v) => { setEmailEnabled(v); handlePrefToggle('emailNotifications', v); }}
              trackColor={{ true: Colors.primary }}
            />
          ))}
          {renderRow('calendar-outline', 'Weekly Digest', (
            <Switch
              value={weeklyDigest}
              onValueChange={(v) => { setWeeklyDigest(v); handlePrefToggle('weeklyDigest', v); }}
              trackColor={{ true: Colors.primary }}
            />
          ))}
        </View>

        {/* Account */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.section}>
          {renderRow('person-outline', 'Edit Profile', undefined, () => navigation.navigate('EditProfile'))}
          {renderRow('shield-outline', 'Safety Center', undefined, () => navigation.navigate('Safety'))}
        </View>

        {/* Danger zone */}
        <Text style={styles.sectionLabel}>Account Actions</Text>
        <View style={styles.section}>
          {renderRow(
            'log-out-outline',
            loggingOut ? 'Logging out...' : 'Log Out',
            loggingOut ? <ActivityIndicator size="small" color={Colors.error} /> : undefined,
            handleLogout,
            true,
          )}
          {renderRow(
            'trash-outline',
            deletingAccount ? 'Deleting...' : 'Delete Account',
            deletingAccount ? <ActivityIndicator size="small" color={Colors.error} /> : undefined,
            handleDeleteAccount,
            true,
          )}
        </View>

        <Text style={styles.version}>with/her v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundLight },
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
  sectionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondaryLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.xs, marginTop: Spacing.lg },
  section: { backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.lg, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, gap: Spacing.md },
  rowLabel: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimaryLight },
  destructiveText: { color: Colors.error },
  version: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textDisabledLight, marginTop: Spacing.xl },
});
