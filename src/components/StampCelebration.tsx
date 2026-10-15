import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';

import type { AvatarLook } from '@/art/avatar';
import { AvatarFigure } from '@/components/Avatar';
import { SparkleBurst } from '@/components/SparkleBurst';
import { Stamp } from '@/components/Stamp';
import { copy } from '@/copy';
import { colors, spacing, type } from '@/theme';

/** Full-screen "stamped!" moment after a successful check-in. */
type Props = {
  /** Shown under the stamp; defaults to "Stamped! Spot found." */
  label?: string;
  icon?: 'star' | 'hourglass-outline';
  /** Your explorer, cheering beside the stamp. */
  look?: AvatarLook | null;
  /** Wishing Stars just earned, and the dress-the-part bonus (if any). */
  stars?: number;
  bonus?: number;
};

export function StampCelebration({ label = copy.spot.stampedLabel, icon = 'star', look, stars, bonus }: Props) {
  const scale = useState(() => new Animated.Value(2.4))[0];
  const opacity = useState(() => new Animated.Value(0))[0];

  const starText = stars ? [copy.stars.earned(stars), bonus ? copy.stars.dressBonus(bonus) : null].filter(Boolean).join('. ') : '';

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(starText ? `${label}. ${starText}` : label);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity, label, starText]);

  return (
    <Animated.View style={[styles.overlay, { opacity }]} accessibilityViewIsModal>
      <View style={styles.row}>
        {look ? <AvatarFigure look={look} size={96} pose="cheer" /> : null}
        <View>
          <Animated.View style={{ transform: [{ scale }, { rotate: '-8deg' }] }}>
            <Stamp icon={icon} inked size={look ? 120 : 140} />
          </Animated.View>
          <SparkleBurst radius={150} delay={120} />
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
      {stars ? (
        <View style={styles.stars}>
          <Text style={styles.starText}>★ {copy.stars.earned(stars)}</Text>
          {bonus ? <Text style={styles.bonusText}>{copy.stars.dressBonus(bonus)}</Text> : null}
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    backgroundColor: 'rgba(250, 245, 234, 0.94)',
  },
  label: {
    ...type.title,
    color: colors.midnight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stars: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  starText: {
    ...type.heading,
    color: colors.midnight,
  },
  bonusText: {
    ...type.bodyStrong,
    color: colors.fernText,
  },
});
