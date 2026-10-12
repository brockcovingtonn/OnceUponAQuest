import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { colors, minTouchTarget, spacing, type } from '@/theme';

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

/** A Settings row with an on/off switch. */
export function SettingsSwitchRow({ icon, label, hint, value, onChange }: Props) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={22} color={colors.midnight} />
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        accessibilityHint={hint}
        trackColor={{ false: colors.border, true: colors.storybookGold }}
        thumbColor={colors.white}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: minTouchTarget + 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  text: {
    flex: 1,
  },
  label: {
    ...type.body,
    color: colors.ink,
  },
  hint: {
    ...type.caption,
    color: colors.inkMuted,
  },
});
