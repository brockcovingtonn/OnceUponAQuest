import { type ReactNode, useEffect, useState } from 'react';
import { Animated, Easing, type ViewStyle } from 'react-native';

import { useReducedMotion } from '@/lib/useReducedMotion';

type Props = {
  children: ReactNode;
  delay?: number;
  /** Start bigger and "stamp" down instead of growing in. */
  stamp?: boolean;
  /** Slide in from this many points below. */
  rise?: number;
  style?: ViewStyle;
};

/** Fades and scales its children in when mounted. Re-mount (change `key`) to replay. */
export function PopIn({ children, delay = 0, stamp = false, rise = 0, style }: Props) {
  const reduced = useReducedMotion();
  const [v] = useState(() => new Animated.Value(reduced ? 1 : 0));

  useEffect(() => {
    if (reduced) return;
    Animated.sequence([
      Animated.delay(delay),
      stamp
        ? Animated.spring(v, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true })
        : Animated.timing(v, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [reduced, delay, stamp, v]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
          transform: [
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [stamp ? 1.8 : 0.85, 1] }) },
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [rise, 0] }) },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
}
