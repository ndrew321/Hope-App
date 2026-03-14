import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { SwipeCandidate } from '../types';
import {
  Colors,
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
  SWIPE_THRESHOLD,
  SWIPE_OUT_DURATION,
} from '../constants/theme';

interface Props {
  candidate: SwipeCandidate;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onTap: () => void;
  isTop: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - Spacing.lg * 2, 420);
const CARD_HEIGHT = Math.min(CARD_WIDTH * 1.4, 580);
const ROTATION_FACTOR = 15;

const CAREER_LEVEL_LABELS: Record<string, string> = {
  YOUTH: 'Youth',
  HIGH_SCHOOL: 'High School',
  COLLEGE: 'College',
  PROFESSIONAL: 'Professional',
  ALUM: 'Alumni',
};

export default function SwipeCard({
  candidate,
  onSwipeLeft,
  onSwipeRight,
  onTap,
  isTop,
}: Props): React.JSX.Element {
  const position = useRef(new Animated.ValueXY()).current;
  const swipeLocked = useRef(false);

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [`-${ROTATION_FACTOR}deg`, '0deg', `${ROTATION_FACTOR}deg`],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD / 2],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD / 2, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const swipeOut = useCallback(
    (direction: 'left' | 'right') => {
      if (swipeLocked.current) return;
      swipeLocked.current = true;
      const x = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
      Animated.timing(position, {
        toValue: { x, y: 0 },
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: true,
      }).start(() => {
        position.setValue({ x: 0, y: 0 });
        swipeLocked.current = false;
        direction === 'right' ? onSwipeRight() : onSwipeLeft();
      });
    },
    [onSwipeLeft, onSwipeRight, position],
  );

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => isTop,
    onPanResponderMove: (_, gestureState) => {
      position.setValue({ x: gestureState.dx, y: gestureState.dy });
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > SWIPE_THRESHOLD) {
        swipeOut('right');
      } else if (gestureState.dx < -SWIPE_THRESHOLD) {
        swipeOut('left');
      } else {
        Animated.spring(position, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          friction: 8,
        }).start();
      }
    },
  });

  const animatedStyle = {
    transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }],
  };

  return (
    <Animated.View
      style={[styles.card, animatedStyle]}
      {...(isTop ? panResponder.panHandlers : {})}
    >
      <TouchableOpacity activeOpacity={0.95} onPress={onTap} style={styles.touchable}>
        {candidate.profilePhotoUrl ? (
          <Image
            source={{ uri: candidate.profilePhotoUrl }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Ionicons name="person" size={80} color={Colors.textDisabledLight} />
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.gradient}
          pointerEvents="none"
        />

        {/* LIKE stamp */}
        <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
          <Text style={styles.likeStampText}>CONNECT</Text>
        </Animated.View>

        {/* NOPE stamp */}
        <Animated.View style={[styles.stamp, styles.nopeStamp, { opacity: nopeOpacity }]}>
          <Text style={styles.nopeStampText}>PASS</Text>
        </Animated.View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {candidate.firstName} {candidate.lastName}
            </Text>
            {candidate.isVerified && (
              <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />
            )}
          </View>

          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>
              {CAREER_LEVEL_LABELS[candidate.careerLevel] ?? candidate.careerLevel}
            </Text>
          </View>

          {candidate.position && (
            <Text style={styles.position}>
              {candidate.position}
              {candidate.currentTeam ? ` · ${candidate.currentTeam}` : ''}
            </Text>
          )}

          {candidate.bio && (
            <Text style={styles.bio} numberOfLines={2}>
              {candidate.bio}
            </Text>
          )}

          {candidate.goals.length > 0 && (
            <View style={styles.goalsRow}>
              {candidate.goals.slice(0, 2).map((g) => (
                <View key={g} style={styles.goalChip}>
                  <Text style={styles.goalChipText} numberOfLines={1}>{g}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.scoreRow}>
            <Ionicons name="sparkles" size={14} color={Colors.secondary} />
            <Text style={styles.scoreText}>
              {Math.round(candidate.compatibilityScore * 100)}% match
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {isTop && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.passBtn]}
            onPress={() => swipeOut('left')}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={30} color={Colors.error} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.connectBtn]}
            onPress={() => swipeOut('right')}
            activeOpacity={0.8}
          >
            <Ionicons name="heart" size={30} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.cardLight,
  },
  touchable: { width: '100%' },
  photo: { width: '100%', height: CARD_HEIGHT },
  photoPlaceholder: {
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT * 0.6,
  },
  stamp: {
    position: 'absolute',
    top: 40,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 4,
    borderRadius: BorderRadius.md,
  },
  likeStamp: { right: Spacing.lg, borderColor: Colors.secondary },
  nopeStamp: { left: Spacing.lg, borderColor: Colors.error },
  likeStampText: { color: Colors.secondary, fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, letterSpacing: 2 },
  nopeStampText: { color: Colors.error, fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, letterSpacing: 2 },
  info: { position: 'absolute', bottom: 80, left: Spacing.md, right: Spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.xs },
  name: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.white },
  levelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xs,
  },
  levelBadgeText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  position: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  bio: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', lineHeight: 20, marginBottom: Spacing.xs },
  goalsRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap', marginBottom: Spacing.xs },
  goalChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    maxWidth: 160,
  },
  goalChipText: { color: Colors.white, fontSize: FontSize.xs },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scoreText: { fontSize: FontSize.sm, color: Colors.secondary, fontWeight: FontWeight.semibold },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceLight,
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  passBtn: { borderColor: Colors.error },
  connectBtn: { borderColor: Colors.primary },
});
