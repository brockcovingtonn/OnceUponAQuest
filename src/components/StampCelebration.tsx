import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';

import { SparkleBurst } from '@/components/SparkleBurst';
import { Stamp } from '@/components/Stamp';
import { copy } from '@/copy';
import { colors, spacing, type } from '@/theme';

/** Full-screen "stamped!" moment after a successful check-in. */
type Props = {
  /** Shown under the stamp; defaults to "Stamped! Spot found." */
  label?: string;
  icon?: 'star' | 'hourglass-outline';
};

export function StampCelebration({ label = copy.spot.stampedLabel, icon = 'star' }: Props) {
  const scale = useState(() => new Animated.Value(2.4))[0];
  const opacity = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(label);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity, label]);

  return (
    <Animated.View style={[styles.overlay, { opacity }]} accessibilityViewIsModal>
      <View>
        <Animated.View style={{ transform: [{ scale }, { rotate: '-8deg' }] }}>
          <Stamp icon={icon} inked size={140} />
        </Animated.View>
        <SparkleBurst radius={150} delay={120} />
      </View>
      <Text style={styles.label}>{label}</Text>
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
});
