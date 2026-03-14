import React, { useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { useAppDispatch, useAppSelector } from './src/store/hooks';
import { setFirebaseUser, setIdToken, setAppUser } from './src/store/slices/authSlice';
import { fetchCurrentUser } from './src/store/slices/userSlice';
import { authService } from './src/services/authService';
import { localDevMatching } from './src/services/localDevMatching';
import type { AppUser } from './src/types';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors, FontSize, FontWeight, Spacing } from './src/constants/theme';

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage?: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: undefined };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; errorMessage: string } {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error): void {
    console.error('Root render error:', error);
  }

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <SafeAreaView style={styles.errorSafe}>
        <ScrollView contentContainerStyle={styles.errorContainer}>
          <Text style={styles.errorTitle}>App Failed To Render</Text>
          <Text style={styles.errorBody}>
            A runtime error occurred while rendering. This screen is shown instead of a blank page.
          </Text>
          <View style={styles.errorBox}>
            <Text style={styles.errorMessage}>{this.state.errorMessage ?? 'Unknown error'}</Text>
          </View>
          <Text style={styles.errorHint}>Open the browser dev console for full stack details.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

function AppInner(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        dispatch(setFirebaseUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        }));
        try {
          const token = await authService.getIdToken();
          dispatch(setIdToken(token));
          const userResult = await dispatch(fetchCurrentUser());
          if (fetchCurrentUser.fulfilled.match(userResult)) {
            dispatch(setAppUser(userResult.payload));
          } else {
            // Backend offline: restore saved profile or create a placeholder.
            const stored = localDevMatching.getUser(firebaseUser.uid);
            if (stored) {
              dispatch(setAppUser(stored));
            } else {
              // No stored profile yet — placeholder routes user through onboarding.
              dispatch(setAppUser({
                id: firebaseUser.uid,
                firebaseUid: firebaseUser.uid,
                email: firebaseUser.email ?? '',
                firstName: (firebaseUser.displayName ?? firebaseUser.email ?? 'Player').split(' ')[0],
                lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') ?? '',
                dateOfBirth: '2000-01-01',
                profilePhotoUrl: firebaseUser.photoURL ?? null,
                isActive: true,
                isVerified: firebaseUser.emailVerified,
                isSuspended: false,
                createdAt: new Date().toISOString(),
                profile: {
                  id: `local-profile-${firebaseUser.uid}`,
                  userId: firebaseUser.uid,
                  mentorshipRole: 'BOTH',
                  careerLevel: 'HIGH_SCHOOL',
                  completenessScore: 20,
                },
              } as AppUser));
            }
          }
        } catch {
          // token fetch failed — auth state will handle re-auth
        }
      } else {
        // User signed out — slices already reset via logoutUser thunk
      }
    });
    return unsubscribe;
  }, [dispatch]);

  return <AppNavigator />;
}

export default function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <RootErrorBoundary>
        <AppInner />
      </RootErrorBoundary>
    </Provider>
  );
}

const styles = StyleSheet.create({
  errorSafe: { flex: 1, backgroundColor: Colors.backgroundLight },
  errorContainer: { padding: Spacing.lg, gap: Spacing.md },
  errorTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.error,
  },
  errorBody: {
    fontSize: FontSize.md,
    color: Colors.textPrimaryLight,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceLight,
  },
  errorMessage: {
    fontSize: FontSize.sm,
    color: Colors.textPrimaryLight,
  },
  errorHint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondaryLight,
  },
});
