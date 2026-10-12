import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { StateView } from '@/components/StateView';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { type FieldWalkSpot, useFieldWalk, useIsAdmin } from '@/lib/queries';
import { colors, fonts, minTouchTarget, radius, spacing, type } from '@/theme';

const f = copy.fieldWalk;

const isSpotDone = (s: FieldWalkSpot) => s.pinned && s.hasPhoto && s.verified;

function Mark({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={[styles.mark, ok && styles.markOk]}>
      <Ionicons name={ok ? 'checkmark' : 'ellipse-outline'} size={12} color={ok ? colors.white : colors.inkMuted} />
      <Text style={[styles.markText, ok && styles.markTextOk]}>{label}</Text>
    </View>
  );
}

/** Admin checklist for the field walk: every spot's pin, hint photo and verified status. */
export default function FieldWalkScreen() {
  const { session } = useAuth();
  const isAdmin = useIsAdmin(session?.user.id);
  const walk = useFieldWalk(isAdmin.data === true);
  const [onlyUnfinished, setOnlyUnfinished] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (isAdmin.isPending || (isAdmin.data && walk.isPending)) return <StateView kind="loading" />;
  if (!isAdmin.data || walk.isError || !walk.data) {
    return <StateView kind="error" message={f.loadError} onRetry={() => walk.refetch()} />;
  }

  const allSpots = walk.data.flatMap((q) => q.spots);
  const done = allSpots.filter(isSpotDone).length;

  async function refresh() {
    setRefreshing(true);
    await walk.refetch();
    setRefreshing(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <View style={styles.summary} accessible accessibilityLabel={f.summary(done, allSpots.length)}>
        <Text style={styles.summaryValue}>{f.summary(done, allSpots.length)}</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${allSpots.length ? (done / allSpots.length) * 100 : 0}%` }]} />
        </View>
        <Text style={styles.help}>{f.doneMeans}</Text>
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{f.onlyUnfinished}</Text>
        <Switch
          value={onlyUnfinished}
          onValueChange={setOnlyUnfinished}
          accessibilityLabel={f.onlyUnfinished}
          trackColor={{ false: colors.border, true: colors.storybookGold }}
          thumbColor={colors.white}
          ios_backgroundColor={colors.border}
        />
      </View>

      {done === allSpots.length ? <Text style={styles.allDone}>{f.allDone}</Text> : null}

      {walk.data.map((quest) => {
        const spots = onlyUnfinished ? quest.spots.filter((s) => !isSpotDone(s)) : quest.spots;
        if (onlyUnfinished && spots.length === 0 && quest.hasCover) return null;
        return (
          <View key={quest.id} style={styles.quest}>
            <Pressable
              onPress={() => router.push({ pathname: '/quest/[slug]', params: { slug: quest.slug } })}
              accessibilityRole="button"
              accessibilityLabel={`${quest.title}. ${f.cover} ${quest.hasCover ? 'set' : 'missing'}. Opens the quest.`}
              style={styles.questHeader}>
              <Text style={styles.questTitle}>{quest.title}</Text>
              <Mark ok={quest.hasCover} label={f.cover} />
            </Pressable>
            {spots.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => router.push({ pathname: '/spot/[id]', params: { id: s.id } })}
                accessibilityRole="button"
                accessibilityLabel={f.spotLabel(s.order, s.teaser, s.pinned, s.hasPhoto, s.verified)}
                style={({ pressed }) => [styles.spotRow, pressed && styles.pressed]}>
                <Text style={[styles.order, isSpotDone(s) && styles.orderDone]}>{s.order}</Text>
                <View style={styles.spotText}>
                  <Text style={styles.teaser}>{s.teaser}</Text>
                  <View style={styles.marks}>
                    <Mark ok={s.pinned} label={f.pin} />
                    <Mark ok={s.hasPhoto} label={f.photo} />
                    <Mark ok={s.verified} label={f.verified} />
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
              </Pressable>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.parchment,
  },
  summary: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.midnight,
  },
  summaryValue: {
    ...type.heading,
    color: colors.parchment,
  },
  track: {
    height: 10,
    borderRadius: 4,
    backgroundColor: 'rgba(250, 245, 234, 0.25)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.storybookGold,
  },
  help: {
    ...type.caption,
    color: colors.parchment,
    opacity: 0.85,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: minTouchTarget,
  },
  switchLabel: {
    ...type.body,
    color: colors.ink,
    flex: 1,
  },
  allDone: {
    ...type.bodyStrong,
    color: colors.fernText,
    textAlign: 'center',
  },
  quest: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  questHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    minHeight: minTouchTarget,
    backgroundColor: colors.parchment,
  },
  questTitle: {
    ...type.heading,
    color: colors.midnight,
    flex: 1,
  },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: minTouchTarget + 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  order: {
    ...type.bodyStrong,
    color: colors.inkMuted,
    width: 20,
    textAlign: 'center',
  },
  orderDone: {
    color: colors.fernText,
  },
  spotText: {
    flex: 1,
    gap: 4,
  },
  teaser: {
    ...type.body,
    color: colors.ink,
  },
  marks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  mark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
  },
  markOk: {
    backgroundColor: colors.fernText,
    borderColor: colors.fernText,
  },
  markText: {
    ...type.caption,
    fontFamily: fonts.bodySemiBold,
    color: colors.inkMuted,
  },
  markTextOk: {
    color: colors.white,
  },
});
