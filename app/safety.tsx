import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { copy } from '@/copy';
import { colors, spacing, type } from '@/theme';

export default function SafetyRulesScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.body}>{copy.safety.intro}</Text>
      {copy.onboarding.rules.map((rule) => (
        <View key={rule.text} style={styles.rule}>
          <Ionicons name={rule.icon} size={28} color={colors.midnight} />
          <Text style={styles.ruleText}>{rule.text}</Text>
        </View>
      ))}
      {copy.safety.extra.map((text) => (
        <View key={text} style={styles.rule}>
          <Ionicons name="checkmark-circle-outline" size={28} color={colors.fern} />
          <Text style={styles.ruleText}>{text}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.parchment,
  },
  body: {
    ...type.body,
    color: colors.ink,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  ruleText: {
    ...type.body,
    color: colors.ink,
    flex: 1,
  },
});
