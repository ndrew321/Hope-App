import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../types';
import OnboardingRoleScreen from '../screens/onboarding/OnboardingRoleScreen';
import OnboardingCareerLevelScreen from '../screens/onboarding/OnboardingCareerLevelScreen';
import OnboardingPositionScreen from '../screens/onboarding/OnboardingPositionScreen';
import OnboardingGoalsScreen from '../screens/onboarding/OnboardingGoalsScreen';
import OnboardingAvailabilityScreen from '../screens/onboarding/OnboardingAvailabilityScreen';
import OnboardingPreferencesScreen from '../screens/onboarding/OnboardingPreferencesScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="OnboardingRole" component={OnboardingRoleScreen} />
      <Stack.Screen name="OnboardingCareerLevel" component={OnboardingCareerLevelScreen} />
      <Stack.Screen name="OnboardingPosition" component={OnboardingPositionScreen} />
      <Stack.Screen name="OnboardingGoals" component={OnboardingGoalsScreen} />
      <Stack.Screen name="OnboardingAvailability" component={OnboardingAvailabilityScreen} />
      <Stack.Screen name="OnboardingPreferences" component={OnboardingPreferencesScreen} />
    </Stack.Navigator>
  );
}
