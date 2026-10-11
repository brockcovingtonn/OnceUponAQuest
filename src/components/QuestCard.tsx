import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressRing } from '@/components/ProgressRing';
import { Stamp } from '@/components/Stamp';
import { copy } from '@/copy';
import { badgeIcon } from '@/lib/badgeArt';
import type { QuestSummary } from '@/lib/queries';
import { colors, minTouchTarget, radius, spacing, type } from '@/theme';

type Props = {
  quest: QuestSummary;
  found: number;
  badgeEarned: boolean;
  onPress: () => void;
};

export function QuestCard({ quest, found, badgeEarned, onPress }: Props) {
  const total = quest.spotCount;
  const complete = badgeEarned || (total > 0 && found >= total);
  const started = found > 0;

  const status = complete
    ? copy.quests.statusComplete
    : started
      ? copy.quests.statusInProgress(found, total)
      : copy.quests.statusNotStarted(total, quest.estMinutes);
  const action = complete ? undefined : started ? copy.quests.continue : copy.quests.start;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${quest.title}. ${status}`}
      accessibilityHint={action}
      style={({ pressed }) => [styles.card, complete && styles.cardComplete, pressed && styles.pressed]}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{quest.title}</Text>
        {complete ? (
          <View style={styles.badge}>
            <Stamp icon={badgeIcon(quest.badge?.artKey)} inked size={28} />
            <Text style={styles.badgeText}>{copy.quests.badgeEarned}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.meta}>{copy.quests.spotsAndTime(total, quest.estMinutes)}</Text>

      {!complete ? (
        <View style={styles.footer}>
          {started ? (
            <View style={styles.progress}>
              <ProgressRing found={found} total={total} accessibilityLabel={status} />
              <Text style={styles.progressText}>{copy.quests.foundOf(found, total)}</Text>
            </View>
          ) : (
            <View />
          )}
          <View style={styles.action}>
            <Text style={styles.actionText}>{action}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.midnight} />
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    minHeight: minTouchTarget,
  },
  cardComplete: {
    borderColor: colors.storybookGold,
    borderWidth: 2,
  },
  pressed: {
    opacity: 0.85,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...type.heading,
    color: colors.midnight,
    flexShrink: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badgeText: {
    ...type.label,
    color: colors.midnight,
  },
  meta: {
    ...type.label,
    color: colors.inkMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressText: {
    ...type.label,
    color: colors.ink,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    ...type.bodyStrong,
    color: colors.midnight,
  },
});
