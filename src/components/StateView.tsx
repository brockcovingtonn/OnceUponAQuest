import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { copy } from '@/copy';
import { useIsOnline } from '@/lib/network';
import { colors, spacing, type } from '@/theme';

type Props =
  | { kind: 'loading' }
  | { kind: 'error'; message: string; onRetry: () => void }
  | { kind: 'empty'; message: string };

/** Full-area loading, error and empty states. Loading turns into an offline note when there's no signal. */
export function StateView(props: Props) {
  const online = useIsOnline();
  const offlineLoading = props.kind === 'loading' && !online;
  return (
    <View style={styles.container}>
      {offlineLoading ? (
        <>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.inkMuted} style={styles.icon} />
          <Text style={styles.message} accessibilityLiveRegion="polite">
            {copy.offline.notCached}
          </Text>
        </>
      ) : props.kind === 'loading' ? (
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
  icon: {
    alignSelf: 'center',
  },
  message: {
    ...type.body,
    color: colors.ink,
    textAlign: 'center',
  },
});
