import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { OnboardingStackParamList } from '../../types';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { useAppDispatch } from '../../store/hooks';
import { updateUserProfile } from '../../store/slices/userSlice';
import OnboardingStep from './OnboardingStep';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingGoals'>;
};

const GOAL_SUGGESTIONS = [
  'Improve technical skills', 'Get college scholarship advice', 'Navigate professional contracts',
  'Build mental toughness', 'Learn leadership on and off the pitch', 'Career transition after playing',
  'Stay connected to the game', 'Find training partners', 'Understand nutrition & fitness',
  'Coaching certification guidance',
];

export default function OnboardingGoalsScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useAppDispatch();
  const [goals, setGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState('');

  function toggleGoal(goal: string): void {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    );
  }

  function addCustomGoal(): void {
    const trimmed = customGoal.trim();
    if (trimmed && !goals.includes(trimmed) && goals.length < 5) {
      setGoals((prev) => [...prev, trimmed]);
      setCustomGoal('');
    }
  }

  async function handleNext(): Promise<void> {
    if (goals.length === 0) return;
    await dispatch(updateUserProfile({ goals }));
    navigation.navigate('OnboardingAvailability');
  }

  return (
    <OnboardingStep
      step={4}
      totalSteps={6}
      title="Your goals"
      subtitle="Select up to 5 goals. This powers our AI matching algorithm."
      onBack={() => navigation.goBack()}
      onNext={handleNext}
      nextDisabled={goals.length === 0}
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.counter}>{goals.length}/5 selected</Text>
        <View style={styles.chips}>
          {GOAL_SUGGESTIONS.map((goal) => {
            const isSelected = goals.includes(goal);
            const isDisabled = !isSelected && goals.length >= 5;
            return (
              <TouchableOpacity
                key={goal}
                style={[styles.chip, isSelected && styles.chipSelected, isDisabled && styles.chipDisabled]}
                onPress={() => toggleGoal(goal)}
                disabled={isDisabled}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {goal}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            value={customGoal}
            onChangeText={setCustomGoal}
            placeholder="Add a custom goal..."
            placeholderTextColor={Colors.textDisabledLight}
            onSubmitEditing={addCustomGoal}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.addBtn, (!customGoal.trim() || goals.length >= 5) && styles.addBtnDisabled]}
            onPress={addCustomGoal}
            disabled={!customGoal.trim() || goals.length >= 5}
          >
            <Ionicons name="add" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {goals.filter((g) => !GOAL_SUGGESTIONS.includes(g)).map((g) => (
          <View key={g} style={styles.customGoalRow}>
            <Text style={styles.customGoalText}>{g}</Text>
            <TouchableOpacity onPress={() => toggleGoal(g)}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondaryLight} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  counter: { fontSize: FontSize.sm, color: Colors.textSecondaryLight, marginBottom: Spacing.sm, fontWeight: FontWeight.medium },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.lg },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surfaceLight,
  },
  chipSelected: { borderColor: Colors.primary, backgroundColor: '#F3EEFF' },
  chipDisabled: { opacity: 0.4 },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondaryLight, fontWeight: FontWeight.medium },
  chipTextSelected: { color: Colors.primary },
  customRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: FontSize.md,
    color: Colors.textPrimaryLight,
    backgroundColor: Colors.surfaceLight,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  customGoalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: '#F3EEFF',
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  customGoalText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium, flex: 1 },
});
