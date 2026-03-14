import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCandidates, swipeOnUser } from '../../store/slices/matchSlice';
import SwipeCard from '../../components/SwipeCard';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import type { DiscoverStackParamList, SwipeCandidate } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - Spacing.lg * 2, 420);
const CARD_HEIGHT = Math.min(CARD_WIDTH * 1.4, 580);
const DECK_INNER_HEIGHT = CARD_HEIGHT + 88;

export default function DiscoverFeedScreen(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<DiscoverStackParamList>>();
  const { candidates, currentCandidateIndex, isLoadingCandidates } = useAppSelector(
    (s) => s.match,
  );

  useEffect(() => {
    if (candidates.length === 0) {
      dispatch(fetchCandidates());
    }
  }, [dispatch, candidates.length]);

  const handleSwipeRight = useCallback(
    (userId: string) => {
      dispatch(swipeOnUser({ targetUserId: userId, direction: 'RIGHT' }));
    },
    [dispatch],
  );

  const handleSwipeLeft = useCallback(
    (userId: string) => {
      dispatch(swipeOnUser({ targetUserId: userId, direction: 'LEFT' }));
    },
    [dispatch],
  );

  const visibleCandidates = candidates.slice(currentCandidateIndex, currentCandidateIndex + 3);
  const isDone = !isLoadingCandidates && currentCandidateIndex >= candidates.length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.logo}>with/her</Text>
        <Text style={styles.tagline}>Discover your match</Text>
      </View>

      <View style={styles.deck}>
        {isLoadingCandidates && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Finding matches...</Text>
          </View>
        )}

        {!isLoadingCandidates && isDone && (
          <View style={styles.centerContent}>
            <Text style={styles.doneEmoji}>🎉</Text>
            <Text style={styles.doneTitle}>You&apos;re all caught up!</Text>
            <Text style={styles.doneSub}>Check back later for new matches.</Text>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => dispatch(fetchCandidates())}
            >
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoadingCandidates && !isDone && (
          <View style={styles.deckInner}>
            {visibleCandidates
              .slice()
              .reverse()
              .map((candidate: SwipeCandidate, reversedIndex: number) => {
                const stackIndex = visibleCandidates.length - 1 - reversedIndex;
                const isTop = stackIndex === 0;
                const scale = 1 - stackIndex * 0.04;
                const translateY = stackIndex * 10;

                return (
                  <View
                    key={candidate.userId}
                    style={[
                      styles.cardWrapper,
                      {
                        transform: [{ scale }, { translateY }],
                        zIndex: isTop ? 10 : 10 - stackIndex,
                      },
                    ]}
                  >
                    <SwipeCard
                      candidate={candidate}
                      isTop={isTop}
                      onSwipeRight={() => handleSwipeRight(candidate.userId)}
                      onSwipeLeft={() => handleSwipeLeft(candidate.userId)}
                      onTap={() =>
                        navigation.navigate('ProfileView', { userId: candidate.userId })
                      }
                    />
                  </View>
                );
              })}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundLight },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  logo: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  tagline: { fontSize: FontSize.sm, color: Colors.textSecondaryLight },
  deck: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  deckInner: {
    width: CARD_WIDTH,
    height: DECK_INNER_HEIGHT,
  },
  cardWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  centerContent: { alignItems: 'center', gap: Spacing.md },
  loadingText: { fontSize: FontSize.md, color: Colors.textSecondaryLight },
  doneEmoji: { fontSize: 64 },
  doneTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimaryLight },
  doneSub: { fontSize: FontSize.md, color: Colors.textSecondaryLight },
  refreshBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  refreshBtnText: { color: Colors.white, fontWeight: FontWeight.semibold },
});
