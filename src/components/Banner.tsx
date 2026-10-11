import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, type } from '@/theme';

type Tone = 'error' | 'info' | 'warning';

export function Banner({ message, tone = 'error' }: { message: string; tone?: Tone }) {
  return (
    <View
      style={[styles.banner, styles[tone]]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite">
      <Text style={[styles.text, tone === 'error' && styles.errorText]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.md,
    padding: spacing.md,
  },
  error: {
    backgroundColor: colors.rose,
  },
  info: {
    backgroundColor: colors.border,
  },
  warning: {
    backgroundColor: colors.storybookGold,
  },
  text: {
    ...type.label,
    color: colors.ink,
  },
  errorText: {
    color: colors.white,
  },
});
