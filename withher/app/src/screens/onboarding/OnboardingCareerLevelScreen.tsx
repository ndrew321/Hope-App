import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList, CareerLevel } from '../../types';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { useAppDispatch } from '../../store/hooks';
import { updateUserProfile } from '../../store/slices/userSlice';
import OnboardingStep from './OnboardingStep';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingCareerLevel'>;
};

const LEVELS: { value: CareerLevel; label: string; description: string }[] = [
  { value: 'YOUTH', label: 'Youth', description: 'Middle school or younger, recreational to competitive' },
  { value: 'HIGH_SCHOOL', label: 'High School', description: 'High school varsity, club, or academy player' },
  { value: 'COLLEGE', label: 'College', description: 'NCAA, NAIA, or other collegiate program' },
  { value: 'PROFESSIONAL', label: 'Professional', description: 'NWSL, international leagues, or semi-professional' },
  { value: 'ALUM', label: 'Alumni / Post-Playing', description: 'Finished playing, now coaching or in soccer business' },
];

export default function OnboardingCareerLevelScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState<CareerLevel | null>(null);

  async function handleNext(): Promise<void> {
    if (!selected) return;
    await dispatch(updateUserProfile({ careerLevel: selected }));
    navigation.navigate('OnboardingPosition');
  }

  return (
    <OnboardingStep
      step={2}
      totalSteps={6}
      title="Your career level"
      subtitle="This helps us find the most relevant matches for you."
      onBack={() => navigation.goBack()}
      onNext={handleNext}
      nextDisabled={!selected}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.options}>
          {LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[styles.card, selected === level.value && styles.cardSelected]}
              onPress={() => setSelected(level.value)}
              activeOpacity={0.8}
            >
              <View style={styles.cardText}>
                <Text style={[styles.cardLabel, selected === level.value && styles.cardLabelSelected]}>
                  {level.label}
                </Text>
                <Text style={styles.cardDesc}>{level.description}</Text>
              </View>
              <View style={[styles.radio, selected === level.value && styles.radioSelected]}>
                {selected === level.value && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  options: { gap: Spacing.sm, paddingBottom: Spacing.xl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceLight,
    gap: Spacing.md,
  },
  cardSelected: { borderColor: Colors.primary, backgroundColor: '#F3EEFF' },
  cardText: { flex: 1 },
  cardLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight, marginBottom: 2 },
  cardLabelSelected: { color: Colors.primary },
  cardDesc: { fontSize: FontSize.sm, color: Colors.textSecondaryLight, lineHeight: 20 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: { borderColor: Colors.primary },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
});
