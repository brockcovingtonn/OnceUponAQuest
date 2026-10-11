import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, minTouchTarget, radius, spacing, type } from '@/theme';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Plain label used for screen readers. */
  accessibilityLabel: string;
  children: ReactNode;
};

export function Checkbox({ checked, onChange, accessibilityLabel, children }: Props) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked }}
      style={styles.row}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Ionicons name="checkmark" size={18} color={colors.midnight} /> : null}
      </View>
      <View style={styles.label}>
        {typeof children === 'string' ? <Text style={styles.text}>{children}</Text> : children}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: minTouchTarget,
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.midnight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  boxChecked: {
    backgroundColor: colors.storybookGold,
    borderColor: colors.storybookGold,
  },
  label: {
    flex: 1,
  },
  text: {
    ...type.body,
    color: colors.ink,
  },
});
