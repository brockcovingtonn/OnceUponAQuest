import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Banner } from '@/components/Banner';
import { copy } from '@/copy';
import { useFeedback } from '@/lib/feedback';
import { useParadeMode } from '@/lib/paradeMode';
import { colors, minTouchTarget, radius, spacing, type } from '@/theme';

export function ParadeModeToggle() {
  const { paradeMode, setParadeMode } = useParadeMode();
  const feedback = useFeedback();
  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Ionicons name="sparkles-outline" size={24} color={colors.storybookGold} />
        <View style={styles.text}>
          <Text style={styles.label}>{copy.paradeMode.label}</Text>
          <Text style={styles.hint}>{copy.paradeMode.hint}</Text>
        </View>
        <Switch
          value={paradeMode}
          onValueChange={(on) => {
            feedback.tap();
            setParadeMode(on);
          }}
          accessibilityLabel={copy.paradeMode.label}
          accessibilityHint={copy.paradeMode.hint}
          trackColor={{ false: colors.border, true: colors.storybookGold }}
          thumbColor={colors.white}
          ios_backgroundColor={colors.border}
        />
      </View>
      {paradeMode ? <Banner tone="warning" message={copy.paradeMode.banner} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: minTouchTarget + 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.midnight,
  },
  text: {
    flex: 1,
  },
  label: {
    ...type.bodyStrong,
    color: colors.parchment,
  },
  hint: {
    ...type.caption,
    color: colors.parchment,
    opacity: 0.8,
  },
});
