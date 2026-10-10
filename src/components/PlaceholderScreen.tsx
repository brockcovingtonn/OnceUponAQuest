import { Link, type Href } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { copy } from '@/copy';
import { colors, minTouchTarget, radius, spacing, type } from '@/theme';

type PlaceholderLink = { label: string; href: Href };

type Props = {
  name: string;
  links?: PlaceholderLink[];
  showDisclaimer?: boolean;
};

/** Temporary screen that shows its route name. Replaced step by step. */
export function PlaceholderScreen({ name, links = [], showDisclaimer = false }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          {name}
        </Text>
        <Text style={styles.body}>{copy.placeholder.comingSoon}</Text>

        <View style={styles.links}>
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              style={styles.link}
              accessibilityRole="link"
              accessibilityLabel={link.label}>
              {link.label}
            </Link>
          ))}
        </View>

        {showDisclaimer && <Text style={styles.disclaimer}>{copy.disclaimer}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...type.title,
    color: colors.midnight,
  },
  body: {
    ...type.body,
    color: colors.ink,
  },
  links: {
    gap: spacing.sm,
  },
  link: {
    ...type.bodyStrong,
    color: colors.midnight,
    backgroundColor: colors.storybookGold,
    borderRadius: radius.md,
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    overflow: 'hidden',
    textAlign: 'center',
  },
  disclaimer: {
    ...type.caption,
    color: colors.inkMuted,
    marginTop: spacing.lg,
  },
});
