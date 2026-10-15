import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, RadialGradient, Stop } from 'react-native-svg';

import { colors } from '@/theme';

export type Shell = {
  /** Where it bursts, as fractions of the screen. */
  x: number;
  y: number;
  /** Burst radius in points. */
  radius: number;
  color: string;
  /** Milliseconds after the show starts. */
  delay: number;
};

const RISE = 0.28; // share of a shell's time spent climbing
const DURATION = 1900;
const RAYS = 16;

/** A night fireworks show: shells climb from the skyline, then bloom and drift down. Decorative. */
export function FireworkShow({ shells, launchY = 0.66 }: { shells: Shell[]; launchY?: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {shells.map((s, i) => (
        <FireworkShell key={i} id={i} shell={s} launchY={launchY} />
      ))}
    </View>
  );
}

function FireworkShell({ id, shell, launchY }: { id: number; shell: Shell; launchY: number }) {
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(shell.delay, withTiming(1, { duration: DURATION, easing: Easing.linear })));
  }, [shell.delay, t]);

  const x = shell.x * width;
  const y = shell.y * height;
  const fromY = launchY * height;
  const r = shell.radius;

  const trail = useAnimatedStyle(() => {
    const p = Math.min(1, t.get() / RISE);
    const eased = 1 - (1 - p) * (1 - p);
    return {
      opacity: t.get() > 0 && p < 1 ? 1 : 0,
      transform: [{ translateY: (fromY - y) * (1 - eased) }],
    };
  });
  const burst = useAnimatedStyle(() => {
    const q = Math.max(0, (t.get() - RISE) / (1 - RISE));
    const e = 1 - Math.pow(1 - q, 3);
    return {
      opacity: q <= 0 ? 0 : q < 0.45 ? 1 : 1 - (q - 0.45) / 0.55,
      transform: [{ translateY: 16 * q * q }, { scale: 0.15 + 0.85 * e }],
    };
  });
  const flash = useAnimatedStyle(() => {
    const q = Math.max(0, (t.get() - RISE) / (1 - RISE));
    return { opacity: q <= 0 ? 0 : Math.max(0, 0.7 - q * 2.2), transform: [{ scale: 0.6 + q }] };
  });

  return (
    <>
      <Animated.View style={[styles.trail, { left: x - 2, top: y - 6, backgroundColor: shell.color }, trail]} />
      <Animated.View style={[{ position: 'absolute', left: x - r * 1.4, top: y - r * 1.4, width: r * 2.8, height: r * 2.8 }, flash]}>
        <Svg width={r * 2.8} height={r * 2.8}>
          <Defs>
            <RadialGradient id={`flash${id}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={shell.color} stopOpacity={0.55} />
              <Stop offset="1" stopColor={shell.color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={r * 1.4} cy={r * 1.4} r={r * 1.4} fill={`url(#flash${id})`} />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2 }, burst]}>
        <Svg width={r * 2} height={r * 2}>
          {Array.from({ length: RAYS }, (_, i) => {
            const a = (i / RAYS) * Math.PI * 2;
            const c = Math.cos(a);
            const s = Math.sin(a);
            return (
              <Line
                key={`r${i}`}
                x1={r + c * r * 0.4}
                y1={r + s * r * 0.4}
                x2={r + c * r * 0.86}
                y2={r + s * r * 0.86}
                stroke={shell.color}
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}
          {Array.from({ length: RAYS }, (_, i) => {
            const a = (i / RAYS) * Math.PI * 2;
            return <Circle key={`d${i}`} cx={r + Math.cos(a) * r * 0.95} cy={r + Math.sin(a) * r * 0.95} r={2.4} fill={shell.color} />;
          })}
          {Array.from({ length: 10 }, (_, i) => {
            const a = ((i + 0.5) / 10) * Math.PI * 2;
            return <Circle key={`g${i}`} cx={r + Math.cos(a) * r * 0.55} cy={r + Math.sin(a) * r * 0.55} r={1.6} fill={colors.parchment} />;
          })}
        </Svg>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  trail: {
    position: 'absolute',
    width: 4,
    height: 12,
    borderRadius: 2,
  },
});
