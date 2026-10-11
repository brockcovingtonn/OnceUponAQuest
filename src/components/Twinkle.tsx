import { useEffect, useState } from 'react';
import { Animated, Easing, type ViewStyle } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors } from '@/theme';

type Props = {
  size: number;
  color?: string;
  /** Stagger twinkles so they don't pulse together. */
  delay?: number;
  style?: ViewStyle;
};

/** A four-point star that softly twinkles. Decorative. */
export function Twinkle({ size, color = colors.storybookGold, delay = 0, style }: Props) {
  const reduced = useReducedMotion();
  const pulse = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, delay, pulse]);

  const s = size / 2;
  const k = s * 0.28;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { position: 'absolute', width: size, height: size },
        style,
        reduced
          ? { opacity: 0.8 }
          : {
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.1] }) }],
            },
      ]}>
      <Svg width={size} height={size}>
        <Polygon
          points={`${s},0 ${s + k},${s - k} ${size},${s} ${s + k},${s + k} ${s},${size} ${s - k},${s + k} 0,${s} ${s - k},${s - k}`}
          fill={color}
        />
      </Svg>
    </Animated.View>
  );
}
