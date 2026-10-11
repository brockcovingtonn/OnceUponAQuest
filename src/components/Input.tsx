import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, minTouchTarget, radius, spacing, type } from '@/theme';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  prefix?: string;
  error?: string;
  /** Status line under the field (e.g. "Available"), shown when there's no error. */
  status?: { text: string; tone: 'neutral' | 'success' };
};

export function Input({ label, prefix, error, status, ...inputProps }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, error ? styles.fieldError : null]}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.inkMuted}
          style={styles.input}
          {...inputProps}
        />
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : status ? (
        <Text
          style={[styles.status, status.tone === 'success' && styles.success]}
          accessibilityLiveRegion="polite">
          {status.text}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    ...type.label,
    color: colors.ink,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: minTouchTarget + 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
  },
  fieldError: {
    borderColor: colors.rose,
  },
  prefix: {
    ...type.body,
    color: colors.inkMuted,
    marginRight: spacing.xs,
  },
  input: {
    ...type.body,
    flex: 1,
    color: colors.ink,
    paddingVertical: spacing.sm,
  },
  error: {
    ...type.label,
    color: colors.rose,
  },
  status: {
    ...type.label,
    color: colors.inkMuted,
  },
  success: {
    color: colors.fern,
  },
});
