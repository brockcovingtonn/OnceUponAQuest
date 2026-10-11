import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Stamp } from '@/components/Stamp';
import { copy } from '@/copy';
import { colors, fonts, minTouchTarget, spacing, type } from '@/theme';

export type SpotState = 'found' | 'open' | 'paused';

type Props = {
  order: number;
  /** Teaser until found; the full title after. */
  name: string;
  state: SpotState;
  onPress: () => void;
};

export function SpotRow({ order, name, state, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={copy.questDetail.spotLabel(order, name, state)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {state === 'found' ? (
        <Stamp icon="checkmark" inked size={32} />
      ) : state === 'paused' ? (
        <Stamp icon="pause" inked={false} size={32} />
      ) : (
        <Stamp icon="ellipse-outline" inked={false} size={32} />
      )}
      <Text style={styles.order}>{order}</Text>
      <View style={styles.text}>
        <Text style={[styles.name, state === 'paused' && styles.muted]}>{name}</Text>
        {state === 'paused' ? <Text style={styles.paused}>{copy.paradeMode.paused}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: minTouchTarget + 12,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  order: {
    ...type.bodyStrong,
    color: colors.inkMuted,
    minWidth: 16,
  },
  text: {
    flex: 1,
  },
  name: {
    ...type.body,
    color: colors.ink,
  },
  muted: {
    color: colors.inkMuted,
  },
  paused: {
    ...type.caption,
    color: colors.midnight,
    fontFamily: fonts.bodySemiBold,
  },
});
