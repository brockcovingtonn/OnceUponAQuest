import Constants from 'expo-constants';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Logo } from '@/components/Logo';
import { copy } from '@/copy';
import { colors, spacing, type } from '@/theme';

export default function AboutScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Logo accessibilityLabel={copy.signIn.logoLabel} />
        <Text style={styles.appName}>{copy.appName}</Text>
        <Text style={styles.version}>{copy.about.version(version)}</Text>
      </View>
      <Text style={styles.body}>{copy.about.body}</Text>
      <Text style={styles.heading} accessibilityRole="header">
        {copy.about.disclaimerTitle}
      </Text>
      <Text style={styles.body}>{copy.disclaimer}</Text>
      <Text style={styles.body}>{copy.about.photosNote}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.parchment,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  appName: {
    ...type.title,
    color: colors.midnight,
  },
  version: {
    ...type.label,
    color: colors.inkMuted,
  },
  heading: {
    ...type.heading,
    color: colors.midnight,
  },
  body: {
    ...type.body,
    color: colors.ink,
  },
});
