import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { copy } from '@/copy';
import { colors, minTouchTarget, radius, spacing, type } from '@/theme';

type Props = {
  count: number;
  /** Makes the chip a button (e.g. to open the wardrobe). */
  onPress?: () => void;
  accessibilityHint?: string;
  size?: 'small' | 'large';
  style?: ViewStyle;
};

/** A gold chip with a wishing star and your Wishing Star balance. */
export function StarCount({ count, onPress, accessibilityHint, size = 'small', style }: Props) {
  const large = size === 'large';
  const body = (
    <>
      <View style={[styles.star, large && styles.starLarge]}>
        <Ionicons name="star" size={large ? 18 : 13} color={colors.storybookGold} />
      </View>
      <Text style={[styles.text, large && styles.textLarge]}>{count}</Text>
    </>
  );
  if (!onPress) {
    return (
      <View style={[styles.chip, large && styles.chipLarge, style]} accessible accessibilityLabel={copy.stars.count(count)}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={copy.stars.count(count)}
      accessibilityHint={accessibilityHint}
      hitSlop={6}
      style={({ pressed }) => [styles.chip, large && styles.chipLarge, style, pressed && styles.pressed]}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    minHeight: 32,
    paddingLeft: 4,
    paddingRight: spacing.sm + 2,
    borderRadius: radius.round,
    backgroundColor: colors.midnight,
  },
  chipLarge: {
    minHeight: minTouchTarget,
    paddingLeft: 6,
    paddingRight: spacing.md,
  },
  star: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E3A63',
  },
  starLarge: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  text: {
    ...type.label,
    color: colors.parchment,
  },
  textLarge: {
    ...type.bodyStrong,
    color: colors.parchment,
  },
  pressed: {
    opacity: 0.8,
  },
});
