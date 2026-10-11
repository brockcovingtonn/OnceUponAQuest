import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { copy } from '@/copy';
import { colors, spacing, type } from '@/theme';

type Props =
  | { kind: 'loading' }
  | { kind: 'error'; message: string; onRetry: () => void }
  | { kind: 'empty'; message: string };

/** Full-area loading, error and empty states. */
export function StateView(props: Props) {
  return (
    <View style={styles.container}>
      {props.kind === 'loading' ? (
        <ActivityIndicator size="large" color={colors.midnight} accessibilityLabel="Loading" />
      ) : (
        <Text style={styles.message} accessibilityLiveRegion="polite">
          {props.message}
        </Text>
      )}
      {props.kind === 'error' ? <Button label={copy.common.retry} onPress={props.onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.parchment,
  },
  message: {
    ...type.body,
    color: colors.ink,
    textAlign: 'center',
  },
});
