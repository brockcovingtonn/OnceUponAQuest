import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, SvgXml } from 'react-native-svg';

import { logoSvg } from '@/art/logoMark';
import { SKYLINE, skylineSvg, TRAIN, TRAIN_TRACK_Y, trainSvg } from '@/art/skyline';
import { FireworkShow, type Shell } from '@/components/FireworkShow';
import { copy } from '@/copy';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, spacing, type } from '@/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Same size as the native splash image (app.json → expo-splash-screen imageWidth),
// so the hand-off from the native splash is seamless.
const SPLASH_LOGO = 200;
const U = SPLASH_LOGO / 100; // points per logo unit
// The camera flies at this point of the logo (in its 100 × 100 units), just
// below the keyhole's round top, so the round top and the slot both open up.
const FX = 50;
const FY = 40;
/** How far the camera pushes in: the keyhole ends up this many times bigger. */
const PUSH = 16;
// The logo layers are drawn this many times bigger than the splash, then shrunk,
// so they stay crisp as the camera gets close.
const SHARP = 3;

// Timeline, in milliseconds.
const HOLD = 350;
const PUSH_MS = 1600;
const SHOW_AT = 1150;
const TITLE_AT = 1750;
const TAGLINE_AT = 2100;
const EXIT_AT = 3800;
const EXIT_MS = 450;

const SHELLS: Shell[] = [
  { x: 0.5, y: 0.31, radius: 112, color: colors.storybookGold, delay: 0 },
  { x: 0.23, y: 0.37, radius: 70, color: '#E98AA0', delay: 300 },
  { x: 0.78, y: 0.34, radius: 80, color: '#9FC4F0', delay: 560 },
  { x: 0.36, y: 0.22, radius: 58, color: colors.parchment, delay: 850 },
  { x: 0.67, y: 0.23, radius: 64, color: '#8FD3B0', delay: 1050 },
  { x: 0.5, y: 0.4, radius: 86, color: colors.storybookGold, delay: 1350 },
  { x: 0.17, y: 0.25, radius: 52, color: '#9FC4F0', delay: 1600 },
  { x: 0.84, y: 0.47, radius: 48, color: '#E98AA0', delay: 1750 },
];

/** The keyhole outline, scaled k times about the camera point (ox, oy) on screen. */
function keyholePath(k: number, ox: number, oy: number): string {
  'worklet';
  const m = (x: number, y: number) => `${(ox + (x - FX) * U * k).toFixed(1)} ${(oy + (y - FY) * U * k).toFixed(1)}`;
  const r = (16 * U * k).toFixed(1);
  return `M${m(50, 15)}A${r} ${r} 0 0 1 ${m(58.9, 44.3)}L${m(65, 69)}L${m(35, 69)}L${m(41.1, 44.3)}A${r} ${r} 0 0 1 ${m(50, 15)}Z`;
}

function between(v: number, from: number, to: number) {
  'worklet';
  return Math.min(1, Math.max(0, (v - from) / (to - from)));
}

/**
 * Storybook intro that plays once per launch over the first screen: the
 * camera pushes through the logo's keyhole into a night skyline, and
 * fireworks go up over the park. Tap to skip.
 */
export function IntroAnimation({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const { width: W, height: H } = useWindowDimensions();
  const [fireworks, setFireworks] = useState(false);
  const push = useSharedValue(0); // 0 = the logo, as on the splash; 1 = through the keyhole
  const title = useSharedValue(0);
  const tagline = useSharedValue(0);
  const exit = useSharedValue(1);
  const train = useSharedValue(0);

  // The camera point on screen (the logo is centered, like the native splash).
  const ox = W / 2 + (FX - 50) * U;
  const oy = H / 2 + (FY - 50) * U;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    if (reduced) {
      // No camera move: the park and the title simply appear, then fade.
      push.set(1);
      title.set(1);
      tagline.set(1);
      exit.set(withDelay(1300, withTiming(0, { duration: 300 })));
      later(1600, onDone);
    } else {
      push.set(withDelay(HOLD, withTiming(1, { duration: PUSH_MS, easing: Easing.bezier(0.55, 0, 0.3, 1) })));
      train.set(withTiming(1, { duration: EXIT_AT + EXIT_MS, easing: Easing.linear }));
      title.set(withDelay(TITLE_AT, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })));
      tagline.set(withDelay(TAGLINE_AT, withTiming(1, { duration: 500 })));
      exit.set(withDelay(EXIT_AT, withTiming(0, { duration: EXIT_MS })));
      later(SHOW_AT, () => setFireworks(true));
      later(EXIT_AT + EXIT_MS, onDone);
    }
    return () => timers.forEach(clearTimeout);
  }, [reduced, onDone, push, title, tagline, exit, train]);

  function skip() {
    exit.set(withTiming(0, { duration: 180 }));
    setTimeout(onDone, 180);
  }

  // Keyhole zoom (k) and the park behind it, which grows more slowly (parallax)
  // but always stays bigger than the opening.
  const sceneStyle = useAnimatedStyle(() => {
    const k = Math.pow(PUSH, push.get());
    const s = Math.min(1, 0.3 * Math.pow(k, 0.7));
    return { transform: [{ translateY: (oy - H / 2) * (1 - s) }, { scale: s }] };
  });
  const maskProps = useAnimatedProps(() => ({
    d: `M-20 -20H${W + 20}V${H + 20}H-20Z` + keyholePath(Math.pow(PUSH, push.get()), ox, oy),
  }));
  const maskStyle = useAnimatedStyle(() => ({ opacity: 1 - between(push.get(), 0.78, 1) }));
  const rimProps = useAnimatedProps(() => {
    const k = Math.pow(PUSH, push.get());
    return { d: keyholePath(k, ox, oy), strokeWidth: 2.2 * U * k };
  });
  const rimStyle = useAnimatedStyle(() => ({ opacity: 1 - between(push.get(), 0.7, 0.95) }));
  // The logo layers fly toward the camera from the same point. (Each style reads
  // push itself, so Reanimated knows to rerun it.)
  const logoLayer = (p: number, fadeFrom: number, fadeTo: number) => {
    'worklet';
    const k = Math.pow(PUSH, p);
    return {
      opacity: 1 - between(p, fadeFrom, fadeTo),
      transform: [
        { translateX: ox - W / 2 + (50 - FX) * U * k },
        { translateY: oy - H / 2 + (50 - FY) * U * k },
        { scale: k / SHARP },
      ],
    };
  };
  const insideStyle = useAnimatedStyle(() => logoLayer(push.get(), 0.02, 0.22));
  const coverStyle = useAnimatedStyle(() => logoLayer(push.get(), 0.3, 0.55));

  // The skyline fills the screen bottom-up ("slice"); the train rides its berm.
  const sk = Math.max(W / SKYLINE.width, H / SKYLINE.height);
  const skX = (W - SKYLINE.width * sk) / 2;
  const skY = H - SKYLINE.height * sk;
  const trainStyle = useAnimatedStyle(() => ({ transform: [{ translateX: (-100 + 290 * train.get()) * sk }] }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: title.get(),
    transform: [{ translateY: 14 * (1 - title.get()) }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: tagline.get() }));
  const exitStyle = useAnimatedStyle(() => ({ opacity: exit.get() }));

  const inside = useMemo(() => logoSvg('inside'), []);
  const cover = useMemo(() => logoSvg('cover'), []);
  const big = SPLASH_LOGO * SHARP;
  const logoBox = { left: W / 2 - big / 2, top: H / 2 - big / 2, width: big, height: big };

  return (
    <Animated.View style={[styles.overlay, exitStyle]}>
      <Pressable
        style={styles.fill}
        onPress={skip}
        accessibilityRole="button"
        accessibilityLabel={`${copy.appName}. ${copy.intro.skip}`}>
        <View style={styles.fill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Animated.View style={[styles.fill, sceneStyle]}>
            <SvgXml xml={skylineSvg} width={W} height={H} />
            <Animated.View
              style={[
                styles.abs,
                {
                  left: skX,
                  top: skY + (TRAIN_TRACK_Y - TRAIN.height + 1) * sk,
                  width: TRAIN.width * sk,
                  height: TRAIN.height * sk,
                },
                trainStyle,
              ]}>
              <SvgXml xml={trainSvg} width={TRAIN.width * sk} height={TRAIN.height * sk} />
            </Animated.View>
            {fireworks ? <FireworkShow shells={SHELLS} /> : null}
          </Animated.View>

          <Animated.View style={[StyleSheet.absoluteFill, maskStyle]}>
            <Svg width={W} height={H}>
              <AnimatedPath animatedProps={maskProps} fill={colors.midnight} fillRule="evenodd" />
            </Svg>
          </Animated.View>
          <Animated.View style={[styles.abs, logoBox, insideStyle]}>
            <SvgXml xml={inside} width={big} height={big} />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, rimStyle]}>
            <Svg width={W} height={H}>
              <AnimatedPath animatedProps={rimProps} fill="none" stroke={colors.storybookGold} strokeLinejoin="round" />
            </Svg>
          </Animated.View>
          <Animated.View style={[styles.abs, logoBox, coverStyle]}>
            <SvgXml xml={cover} width={big} height={big} />
          </Animated.View>
        </View>

        <View style={[styles.titleBox, { top: H * 0.1 }]} pointerEvents="none">
          <Animated.Text style={[styles.title, titleStyle]}>{copy.appName}</Animated.Text>
          <Animated.Text style={[styles.tagline, taglineStyle]}>{copy.tagline}</Animated.Text>
        </View>
      </Pressable>
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
    backgroundColor: colors.midnight,
  },
  fill: {
    flex: 1,
  },
  abs: {
    position: 'absolute',
  },
  titleBox: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...type.display,
    color: colors.parchment,
    textAlign: 'center',
    textShadowColor: 'rgba(14, 19, 48, 0.8)',
    textShadowRadius: 12,
  },
  tagline: {
    ...type.body,
    color: colors.storybookGold,
    textAlign: 'center',
    marginTop: spacing.xs,
    textShadowColor: 'rgba(14, 19, 48, 0.8)',
    textShadowRadius: 10,
  },
});
