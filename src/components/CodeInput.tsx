import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, minTouchTarget, radius, spacing, type } from '@/theme';

type Props = {
  value: string;
  onChange: (value: string) => void;
  length: number;
  accessibilityLabel: string;
  hasError?: boolean;
  autoFocus?: boolean;
  testID?: string;
};

/** One real text field drawn as separate digit boxes (supports iOS/Android code autofill). */
export function CodeInput({ value, onChange, length, accessibilityLabel, hasError, autoFocus, testID }: Props) {
  const inputRef = useRef<TextInput>(null);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      accessible={false}
      style={styles.container}>
      <View style={styles.boxes} importantForAccessibility="no-hide-descendants">
        {digits.map((digit, i) => (
          <View
            key={i}
            style={[
              styles.box,
              i === value.length && styles.boxActive,
              hasError && styles.boxError,
            ]}>
            <Text style={styles.digit}>{digit}</Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        accessibilityLabel={accessibilityLabel}
        caretHidden
        testID={testID}
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  boxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  box: {
    flex: 1,
    minHeight: minTouchTarget + 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: {
    borderColor: colors.midnight,
  },
  boxError: {
    borderColor: colors.rose,
  },
  digit: {
    ...type.title,
    color: colors.ink,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.02,
    color: 'transparent',
  },
});
