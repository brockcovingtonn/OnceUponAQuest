import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { copy } from '@/copy';
import { colors, radius, spacing, type } from '@/theme';

/** "A new version is ready" with a Restart button. */
export function UpdateBanner({ onRestart }: { onRestart: () => void }) {
  return (
    <View style={styles.box} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.text}>{copy.appUpdate.ready}</Text>
      <Button label={copy.appUpdate.restart} onPress={onRestart} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.storybookGold,
    backgroundColor: colors.white,
  },
  text: {
    ...type.bodyStrong,
    color: colors.midnight,
  },
});
