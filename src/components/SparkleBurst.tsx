import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors } from '@/theme';

const PARTICLES = 14;
const PALETTE = [colors.storybookGold, colors.parchment, colors.storybookGold, colors.rose];

type Props = {
  /** How far the sparkles travel from the center, in points. */
  radius?: number;
  delay?: number;
};

/** Gold sparkles that burst outward from the center of the parent and fade. Decorative. */
export function SparkleBurst({ radius = 120, delay = 0 }: Props) {
  const reduced = useReducedMotion();
  const progress = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (reduced) return;
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(progress, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [reduced, delay, progress]);

  if (reduced) return null;
  return (
    <View pointerEvents="none" style={styles.layer} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: PARTICLES }, (_, i) => {
        const angle = (i / PARTICLES) * Math.PI * 2 + (i % 2) * 0.2;
        const distance = radius * (0.65 + ((i * 37) % 10) / 28);
        const size = 8 + ((i * 13) % 4) * 3;
        const k = (size / 2) * 0.28;
        const s = size / 2;
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width: size,
              height: size,
              opacity: progress.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 0.9, 0] }),
              transform: [
                { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * distance] }) },
                { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * distance] }) },
                { scale: progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.2, 1.1, 0.6] }) },
              ],
            }}>
            <Svg width={size} height={size}>
              <Polygon
                points={`${s},0 ${s + k},${s - k} ${size},${s} ${s + k},${s + k} ${s},${size} ${s - k},${s + k} 0,${s} ${s - k},${s - k}`}
                fill={PALETTE[i % PALETTE.length]}
              />
            </Svg>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
