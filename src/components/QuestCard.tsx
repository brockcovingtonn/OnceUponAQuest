import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressRing } from '@/components/ProgressRing';
import { QuestCover } from '@/components/QuestCover';
import { BadgeStamp } from '@/components/BadgeStamp';
import { copy } from '@/copy';
import type { QuestSummary } from '@/lib/queries';
import { colors, fonts, minTouchTarget, radius, spacing, type } from '@/theme';

type Props = {
  quest: QuestSummary;
  /** 1-based position among all quests, shown as "Chapter I". */
  chapter: number;
  found: number;
  badgeEarned: boolean;
  onPress: () => void;
};

export function QuestCard({ quest, chapter, found, badgeEarned, onPress }: Props) {
  const total = quest.spotCount;
  // A Quest Pass quest you don't have the Pass for: its spots stay hidden.
  const locked = quest.isPremium && total === 0;
  const complete = badgeEarned || (total > 0 && found >= total);
  const started = found > 0;

  const status = locked
    ? copy.pass.lockedTitle
    : complete
    ? copy.quests.statusComplete
    : started
      ? copy.quests.statusInProgress(found, total)
      : copy.quests.statusNotStarted(total, quest.estMinutes);
  const action = locked ? copy.pass.unlock : complete ? undefined : started ? copy.quests.continue : copy.quests.start;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${copy.quests.chapter(chapter)}: ${quest.title}. ${status}${
        quest.beingVerified ? ` ${copy.quests.beingVerified}.` : ''
      }`}
      accessibilityHint={action}
      style={({ pressed }) => [styles.card, complete && styles.cardComplete, pressed && styles.pressed]}>
      <QuestCover slug={quest.slug} coverPhotoPath={quest.coverPhotoPath} height={96} />
      <View style={styles.body}>
        <View style={styles.chapterRow}>
          <Text style={styles.chapter}>{copy.quests.chapter(chapter)}</Text>
          {quest.isPremium ? (
            <View style={styles.passChip}>
              <Ionicons name={locked ? 'lock-closed' : 'ribbon'} size={11} color={colors.midnight} />
              <Text style={styles.passChipText}>{copy.pass.chip}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{quest.title}</Text>
          {complete ? (
            <View style={styles.badge}>
              <BadgeStamp artKey={quest.badge?.artKey} earned size={28} />
              <Text style={styles.badgeText}>{copy.quests.badgeEarned}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.meta}>
          {locked ? copy.questDetail.minutes(quest.estMinutes) : copy.quests.spotsAndTime(total, quest.estMinutes)}
        </Text>
        {quest.beingVerified ? (
          <View style={styles.verifyTag}>
            <Ionicons name="compass-outline" size={14} color={colors.ink} />
            <Text style={styles.verifyText}>{copy.quests.beingVerified}</Text>
          </View>
        ) : null}

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
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  passChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.round,
    backgroundColor: colors.storybookGold,
  },
  passChipText: {
    ...type.caption,
    color: colors.midnight,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    minHeight: minTouchTarget,
  },
  body: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  chapter: {
    ...type.caption,
    fontFamily: fonts.bodySemiBold,
    color: colors.inkMuted,
    letterSpacing: 1.5,
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
  verifyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.round,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.inkMuted,
  },
  verifyText: {
    ...type.caption,
    color: colors.ink,
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
