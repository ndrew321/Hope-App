import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList, MentorshipRole } from '../../types';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { useAppDispatch } from '../../store/hooks';
import { updateUserProfile } from '../../store/slices/userSlice';
import OnboardingStep from './OnboardingStep';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingRole'>;
};

const ROLES: { value: MentorshipRole; label: string; description: string; emoji: string }[] = [
  { value: 'MENTOR', label: 'Mentor', description: 'I want to share my experience and guide others', emoji: '🌟' },
  { value: 'MENTEE', label: 'Mentee', description: "I'm looking for guidance and support", emoji: '📚' },
  { value: 'BOTH', label: 'Both', description: 'I want to mentor and be mentored', emoji: '🤝' },
];

export default function OnboardingRoleScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState<MentorshipRole | null>(null);

  async function handleNext(): Promise<void> {
    if (!selected) return;
    await dispatch(updateUserProfile({ mentorshipRole: selected }));
    navigation.navigate('OnboardingCareerLevel');
  }

  return (
    <OnboardingStep
      step={1}
      totalSteps={6}
      title="What's your role?"
      subtitle="Choose how you want to participate in the with/her community."
      onNext={handleNext}
      nextDisabled={!selected}
    >
      <View style={styles.options}>
        {ROLES.map((role) => (
          <TouchableOpacity
            key={role.value}
            style={[styles.card, selected === role.value && styles.cardSelected]}
            onPress={() => setSelected(role.value)}
            activeOpacity={0.8}
          >
            <Text style={styles.emoji}>{role.emoji}</Text>
            <View style={styles.cardText}>
              <Text style={[styles.cardLabel, selected === role.value && styles.cardLabelSelected]}>
                {role.label}
              </Text>
              <Text style={styles.cardDesc}>{role.description}</Text>
            </View>
            {selected === role.value && (
              <View style={styles.check}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  options: { gap: Spacing.md },
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
  emoji: { fontSize: 32 },
  cardText: { flex: 1 },
  cardLabel: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight, marginBottom: 4 },
  cardLabelSelected: { color: Colors.primary },
  cardDesc: { fontSize: FontSize.sm, color: Colors.textSecondaryLight, lineHeight: 20 },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
