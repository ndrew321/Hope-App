import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../types';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { useAppDispatch } from '../../store/hooks';
import { updateUserProfile } from '../../store/slices/userSlice';
import OnboardingStep from './OnboardingStep';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingPosition'>;
};

const POSITIONS = [
  'Goalkeeper', 'Center Back', 'Right Back', 'Left Back', 'Defensive Midfielder',
  'Central Midfielder', 'Attacking Midfielder', 'Right Winger', 'Left Winger',
  'Striker', 'Forward', 'Coach', 'Technical Director',
];

export default function OnboardingPositionScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useAppDispatch();
  const [selectedPosition, setSelectedPosition] = useState('');
  const [currentTeam, setCurrentTeam] = useState('');
  const [yearsExp, setYearsExp] = useState('');

  const canContinue = selectedPosition.trim().length > 0;

  async function handleNext(): Promise<void> {
    if (!canContinue) return;
    await dispatch(
      updateUserProfile({
        position: selectedPosition,
        currentTeam: currentTeam.trim() || undefined,
        yearsExperience: yearsExp ? Number(yearsExp) : undefined,
      }),
    );
    navigation.navigate('OnboardingGoals');
  }

  return (
    <OnboardingStep
      step={3}
      totalSteps={6}
      title="Your position & team"
      subtitle="Tell us where you play and how long you've been playing."
      onBack={() => navigation.goBack()}
      onNext={handleNext}
      nextDisabled={!canContinue}
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>Position</Text>
        <View style={styles.chips}>
          {POSITIONS.map((pos) => (
            <TouchableOpacity
              key={pos}
              style={[styles.chip, selectedPosition === pos && styles.chipSelected]}
              onPress={() => setSelectedPosition(pos)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, selectedPosition === pos && styles.chipTextSelected]}>
                {pos}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputWrap}>
          <Text style={styles.label}>Current Team (optional)</Text>
          <TextInput
            style={styles.input}
            value={currentTeam}
            onChangeText={setCurrentTeam}
            placeholder="e.g. Portland Thorns, Stanford University"
            placeholderTextColor={Colors.textDisabledLight}
          />
        </View>

        <View style={styles.inputWrap}>
          <Text style={styles.label}>Years of Experience (optional)</Text>
          <TextInput
            style={styles.input}
            value={yearsExp}
            onChangeText={setYearsExp}
            placeholder="e.g. 10"
            placeholderTextColor={Colors.textDisabledLight}
            keyboardType="number-pad"
          />
        </View>
      </ScrollView>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondaryLight, marginBottom: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surfaceLight,
  },
  chipSelected: { borderColor: Colors.primary, backgroundColor: '#F3EEFF' },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondaryLight, fontWeight: FontWeight.medium },
  chipTextSelected: { color: Colors.primary },
  inputWrap: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondaryLight, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSize.md,
    color: Colors.textPrimaryLight,
    backgroundColor: Colors.surfaceLight,
  },
});
