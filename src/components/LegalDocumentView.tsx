import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { copy } from '@/copy';
import { type LegalDocument, legalInfo } from '@/legal/info';
import { colors, spacing, type } from '@/theme';

/** Renders a Terms / Privacy document with headings, paragraphs and bullet lists. */
export function LegalDocumentView({ doc }: { doc: LegalDocument }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.effective}>{copy.legal.effective(legalInfo.effectiveDate)}</Text>
      <Text style={styles.body}>{doc.intro}</Text>
      {doc.sections.map((section, i) => (
        <View key={`${section.heading}-${i}`} style={styles.section}>
          {section.heading ? (
            <Text style={styles.heading} accessibilityRole="header">
              {section.heading}
            </Text>
          ) : null}
          {section.paragraphs?.map((p) => (
            <Text key={p.slice(0, 40)} style={styles.body}>
              {p}
            </Text>
          ))}
          {section.bullets?.map((b) => (
            <View key={b.slice(0, 40)} style={styles.bullet}>
              <Text style={styles.body} importantForAccessibility="no" accessibilityElementsHidden>
                •
              </Text>
              <Text style={[styles.body, styles.bulletText]}>{b}</Text>
            </View>
          ))}
        </View>
      ))}
      <Text style={styles.disclaimer}>{copy.disclaimer}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.parchment,
  },
  effective: {
    ...type.label,
    color: colors.inkMuted,
  },
  section: {
    gap: spacing.sm,
  },
  heading: {
    ...type.heading,
    color: colors.midnight,
    marginTop: spacing.sm,
  },
  body: {
    ...type.body,
    color: colors.ink,
  },
  bullet: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bulletText: {
    flex: 1,
  },
  disclaimer: {
    ...type.caption,
    color: colors.inkMuted,
    marginTop: spacing.lg,
  },
});
