import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../types';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { useAppDispatch } from '../../store/hooks';
import { updateUserPreferences } from '../../store/slices/userSlice';
import OnboardingStep from './OnboardingStep';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingAvailability'>;
};

interface ToggleOption {
  key: string;
  label: string;
  emoji: string;
}

const DAY_OPTIONS: ToggleOption[] = [
  { key: 'availabilityWeekdays', label: 'Weekdays', emoji: '📅' },
  { key: 'availabilityWeekends', label: 'Weekends', emoji: '🏖️' },
];

const TIME_OPTIONS: ToggleOption[] = [
  { key: 'availabilityMornings', label: 'Mornings', emoji: '☀️' },
  { key: 'availabilityAfternoons', label: 'Afternoons', emoji: '🌤️' },
  { key: 'availabilityEvenings', label: 'Evenings', emoji: '🌙' },
];

export default function OnboardingAvailabilityScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState<Record<string, boolean>>({
    availabilityWeekdays: false,
    availabilityWeekends: false,
    availabilityMornings: false,
    availabilityAfternoons: false,
    availabilityEvenings: false,
  });

  function toggle(key: string): void {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const hasSelection = Object.values(selected).some(Boolean);

  async function handleNext(): Promise<void> {
    if (!hasSelection) return;
    await dispatch(updateUserPreferences(selected));
    navigation.navigate('OnboardingPreferences');
  }

  return (
    <OnboardingStep
      step={5}
      totalSteps={6}
      title="Your availability"
      subtitle="When are you generally free for mentorship sessions?"
      onBack={() => navigation.goBack()}
      onNext={handleNext}
      nextDisabled={!hasSelection}
    >
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Days</Text>
        <View style={styles.row}>
          {DAY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.card, selected[opt.key] && styles.cardSelected]}
              onPress={() => toggle(opt.key)}
              activeOpacity={0.8}
            >
              <Text style={styles.optEmoji}>{opt.emoji}</Text>
              <Text style={[styles.optLabel, selected[opt.key] && styles.optLabelSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Time of Day</Text>
        <View style={styles.row}>
          {TIME_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.card, selected[opt.key] && styles.cardSelected]}
              onPress={() => toggle(opt.key)}
              activeOpacity={0.8}
            >
              <Text style={styles.optEmoji}>{opt.emoji}</Text>
              <Text style={[styles.optLabel, selected[opt.key] && styles.optLabelSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: Spacing.xl },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondaryLight, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  card: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceLight,
    gap: 4,
  },
  cardSelected: { borderColor: Colors.primary, backgroundColor: '#F3EEFF' },
  optEmoji: { fontSize: 28 },
  optLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondaryLight },
  optLabelSelected: { color: Colors.primary },
});
