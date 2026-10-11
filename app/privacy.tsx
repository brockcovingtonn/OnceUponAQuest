import { ScrollView, StyleSheet, Text } from 'react-native';

import { copy } from '@/copy';
import { colors, spacing, type } from '@/theme';

// Full text is written before launch (Step 8 links this from Settings too).
export default function PrivacyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.body}>{copy.legal.comingSoon}</Text>
      <Text style={styles.disclaimer}>{copy.disclaimer}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  body: {
    ...type.body,
    color: colors.ink,
  },
  disclaimer: {
    ...type.caption,
    color: colors.inkMuted,
  },
});
