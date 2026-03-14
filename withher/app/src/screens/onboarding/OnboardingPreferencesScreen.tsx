import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../types';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateUserPreferences } from '../../store/slices/userSlice';
import { fetchCurrentUser } from '../../store/slices/userSlice';
import { setAppUser } from '../../store/slices/authSlice';
import { localDevMatching } from '../../services/localDevMatching';
import type { AppUser } from '../../types';
import OnboardingStep from './OnboardingStep';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingPreferences'>;
};

export default function OnboardingPreferencesScreen({ navigation: _navigation }: Props): React.JSX.Element {
  const dispatch = useAppDispatch();
  const appUser = useAppSelector((s) => s.auth.appUser);
  const [preferBipoc, setPreferBipoc] = useState(false);
  const [preferLgbtq, setPreferLgbtq] = useState(false);
  const [locationFlexible, setLocationFlexible] = useState(true);

  async function handleFinish(): Promise<void> {
    const prefsResult = await dispatch(
      updateUserPreferences({ preferBipoc, preferLgbtq, locationFlexible }),
    );

    if (updateUserPreferences.fulfilled.match(prefsResult)) {
      dispatch(setAppUser(prefsResult.payload));
    }

    // Reload profile so completeness score goes up and AppNavigator can redirect to Main.
    const userResult = await dispatch(fetchCurrentUser());
    if (fetchCurrentUser.fulfilled.match(userResult)) {
      dispatch(setAppUser(userResult.payload));
      return;
    }

    // Offline/local fallback so step 6 can complete even when API is unavailable.
    if (appUser) {
      const updatedUser = {
        ...appUser,
        preferences: appUser.preferences
          ? {
              ...appUser.preferences,
              preferBipoc,
              preferLgbtq,
              locationFlexible,
            }
          : {
              id: `local-prefs-${appUser.id}`,
              userId: appUser.id,
              preferredRoles: ['MENTOR', 'MENTEE', 'BOTH'],
              preferredCareerLevels: [],
              maxDistance: null,
              locationFlexible,
              preferBipoc,
              preferLgbtq,
              availabilityWeekdays: false,
              availabilityWeekends: false,
              availabilityMornings: false,
              availabilityAfternoons: false,
              availabilityEvenings: false,
            },
        profile: {
          ...(appUser.profile ?? {
            id: `local-profile-${appUser.id}`,
            userId: appUser.id,
            mentorshipRole: 'BOTH',
            careerLevel: 'HIGH_SCHOOL',
          }),
          completenessScore: 100,
        },
      };
      dispatch(setAppUser(updatedUser as AppUser));
      localDevMatching.upsertUser(updatedUser as AppUser);
      return;
    }

    Alert.alert('Setup not saved', 'Please try again.');
  }

  return (
    <OnboardingStep
      step={6}
      totalSteps={6}
      title="Final preferences"
      subtitle="These help us surface matches that align with your values."
      onBack={() => _navigation.goBack()}
      onNext={handleFinish}
      nextLabel="Finish Setup"
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.preferenceRow}>
          <View style={styles.preferenceText}>
            <Text style={styles.preferenceLabel}>Prefer BIPOC mentors/mentees</Text>
            <Text style={styles.preferenceDesc}>
              Prioritize matching with Black, Indigenous, and People of Color players
            </Text>
          </View>
          <Switch
            value={preferBipoc}
            onValueChange={setPreferBipoc}
            trackColor={{ false: Colors.borderLight, true: Colors.primaryLight }}
            thumbColor={preferBipoc ? Colors.primary : Colors.white}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceText}>
            <Text style={styles.preferenceLabel}>Prefer LGBTQ+ mentors/mentees</Text>
            <Text style={styles.preferenceDesc}>
              Prioritize matching with LGBTQ+ identifying players
            </Text>
          </View>
          <Switch
            value={preferLgbtq}
            onValueChange={setPreferLgbtq}
            trackColor={{ false: Colors.borderLight, true: Colors.primaryLight }}
            thumbColor={preferLgbtq ? Colors.primary : Colors.white}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceText}>
            <Text style={styles.preferenceLabel}>Open to remote mentorship</Text>
            <Text style={styles.preferenceDesc}>
              Match with players anywhere, not just in your area
            </Text>
          </View>
          <Switch
            value={locationFlexible}
            onValueChange={setLocationFlexible}
            trackColor={{ false: Colors.borderLight, true: Colors.primaryLight }}
            thumbColor={locationFlexible ? Colors.primary : Colors.white}
          />
        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            These preferences influence — but don't limit — your matches. You can update them any
            time in Settings.
          </Text>
        </View>
      </ScrollView>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  preferenceText: { flex: 1 },
  preferenceLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight, marginBottom: 4 },
  preferenceDesc: { fontSize: FontSize.sm, color: Colors.textSecondaryLight, lineHeight: 20 },
  divider: { height: 1, backgroundColor: Colors.borderLight },
  note: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: '#F3EEFF',
    borderRadius: BorderRadius.md,
  },
  noteText: { fontSize: FontSize.sm, color: Colors.primary, lineHeight: 20 },
});
