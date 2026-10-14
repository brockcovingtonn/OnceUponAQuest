import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { copy } from '@/copy';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, fonts } from '@/theme';

const SIZE = 64;

/** The glowing button that opens the Storybook Lens. */
export function LensButton({ onPress, style }: { onPress: () => void; style?: ViewStyle }) {
  const reduced = useReducedMotion();
  const [glow] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(600),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, glow]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={copy.lens.open}
      accessibilityHint={copy.lens.openHint}
      style={({ pressed }) => [styles.wrap, style, pressed && styles.pressed]}>
      {!reduced ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
              transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
            },
          ]}
        />
      ) : null}
      <Animated.View style={styles.button}>
        <Ionicons name="aperture" size={30} color={colors.midnight} />
      </Animated.View>
      <Text style={styles.label}>{copy.lens.buttonLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  ring: {
    position: 'absolute',
    top: 0,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 3,
    borderColor: colors.storybookGold,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.storybookGold,
    borderWidth: 3,
    borderColor: colors.midnight,
    shadowColor: colors.midnight,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  label: {
    marginTop: 2,
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.midnight,
    backgroundColor: 'rgba(250, 245, 234, 0.9)',
    paddingHorizontal: 6,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
