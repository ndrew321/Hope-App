import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { AuthStackParamList } from '../../types';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'EmailVerification'>;
  route: RouteProp<AuthStackParamList, 'EmailVerification'>;
};

export default function EmailVerificationScreen({ navigation, route }: Props): React.JSX.Element {
  const { email } = route.params;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="mail" size={72} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.sub}>
          We sent a verification link to{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>
        <Text style={styles.instructions}>
          Click the link in your email to activate your account. Check your spam folder if you
          don't see it within a few minutes.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>I've verified my email</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.secondaryButtonText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundLight },
  container: { flex: 1, padding: Spacing.lg, justifyContent: 'center', alignItems: 'center' },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EDE7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.textPrimaryLight, textAlign: 'center', marginBottom: Spacing.md },
  sub: { fontSize: FontSize.lg, color: Colors.textSecondaryLight, textAlign: 'center', marginBottom: Spacing.md, lineHeight: 28 },
  email: { color: Colors.primary, fontWeight: FontWeight.semibold },
  instructions: { fontSize: FontSize.md, color: Colors.textSecondaryLight, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xl, paddingHorizontal: Spacing.md },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.md,
  },
  buttonText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  secondaryButton: { paddingVertical: Spacing.md },
  secondaryButtonText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.medium },
});
