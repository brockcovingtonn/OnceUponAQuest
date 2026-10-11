import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { mainStreetNight } from '@/art/scenes';
import { Logo } from '@/components/Logo';
import { Scene } from '@/components/Scene';
import { SparkleBurst } from '@/components/SparkleBurst';
import { Twinkle } from '@/components/Twinkle';
import { copy } from '@/copy';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, spacing, type } from '@/theme';

// Same size as the native splash image (app.json → expo-splash-screen imageWidth),
// so the hand-off from the native splash is seamless.
const SPLASH_LOGO = 200;

/** Storybook intro that plays once per launch over the first screen. Tap to skip. */
export function IntroAnimation({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const { height } = useWindowDimensions();
  const [burst, setBurst] = useState(false);
  const [v] = useState(() => ({
    logo: new Animated.Value(0),
    scene: new Animated.Value(0),
    title: new Animated.Value(0),
    tagline: new Animated.Value(0),
    exit: new Animated.Value(1),
  }));

  useEffect(() => {
    const finish = Animated.timing(v.exit, { toValue: 0, duration: reduced ? 200 : 450, useNativeDriver: true });
    const ease = Easing.out(Easing.cubic);
    const animation = reduced
      ? Animated.sequence([Animated.delay(600), finish])
      : Animated.sequence([
          Animated.delay(250),
          Animated.parallel([
            Animated.timing(v.logo, { toValue: 1, duration: 650, easing: ease, useNativeDriver: true }),
            Animated.timing(v.scene, { toValue: 1, duration: 800, easing: ease, useNativeDriver: true }),
          ]),
          Animated.timing(v.title, { toValue: 1, duration: 450, easing: ease, useNativeDriver: true }),
          Animated.timing(v.tagline, { toValue: 1, duration: 400, easing: ease, useNativeDriver: true }),
          Animated.delay(700),
          finish,
        ]);
    const burstTimer = setTimeout(() => setBurst(true), 700);
    animation.start(({ finished }) => finished && onDone());
    return () => {
      clearTimeout(burstTimer);
      animation.stop();
    };
  }, [reduced, v, onDone]);

  function skip() {
    Animated.timing(v.exit, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => onDone());
  }

  const lift = -height * 0.14;
  return (
    <Animated.View style={[styles.overlay, { opacity: v.exit }]}>
      <Pressable
        style={styles.fill}
        onPress={skip}
        accessibilityRole="button"
        accessibilityLabel={`${copy.appName}. ${copy.intro.skip}`}>
        <Animated.View
          style={[
            styles.sceneWrap,
            {
              opacity: v.scene,
              transform: [{ translateY: v.scene.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }],
            },
          ]}>
          <Scene shapes={mainStreetNight} height={height * 0.42} />
        </Animated.View>

        {!reduced ? (
          <>
            <Twinkle size={14} delay={0} style={{ top: height * 0.12, left: '14%' }} />
            <Twinkle size={10} delay={400} style={{ top: height * 0.2, right: '18%' }} />
            <Twinkle size={18} delay={800} style={{ top: height * 0.08, right: '32%' }} color={colors.parchment} />
            <Twinkle size={8} delay={1200} style={{ top: height * 0.26, left: '28%' }} color={colors.parchment} />
          </>
        ) : null}

        <View style={styles.center}>
          <Animated.View
            style={{
              transform: [
                { translateY: v.logo.interpolate({ inputRange: [0, 1], outputRange: [0, lift] }) },
                { scale: v.logo.interpolate({ inputRange: [0, 1], outputRange: [1, 0.62] }) },
              ],
            }}>
            <Logo accessibilityLabel={copy.signIn.logoLabel} size={SPLASH_LOGO} />
            {burst ? <SparkleBurst radius={170} /> : null}
          </Animated.View>
          <Animated.Text
            style={[
              styles.title,
              {
                opacity: v.title,
                transform: [
                  { translateY: v.title.interpolate({ inputRange: [0, 1], outputRange: [lift + 30, lift + 6] }) },
                ],
              },
            ]}>
            {copy.appName}
          </Animated.Text>
          <Animated.Text style={[styles.tagline, { opacity: v.tagline, transform: [{ translateY: lift + 6 }] }]}>
            {copy.tagline}
          </Animated.Text>
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
  sceneWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...type.display,
    color: colors.parchment,
    textAlign: 'center',
  },
  tagline: {
    ...type.body,
    color: colors.storybookGold,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
