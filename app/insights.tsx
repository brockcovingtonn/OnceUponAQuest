import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Flourish } from '@/components/Flourish';
import { StateView } from '@/components/StateView';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { type ErrorGroup, type Ratio, useAdminMetrics, useIsAdmin, useRecentErrors } from '@/lib/queries';
import { colors, fonts, minTouchTarget, radius, spacing, type } from '@/theme';

const percent = (r: Ratio) => (r.of > 0 ? `${Math.round((r.part / r.of) * 100)}%` : copy.insights.noData);

function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** Big number with a caption — the spec's goals. */
function GoalTile({ value, label, detail }: { value: string; label: string; detail: string }) {
  return (
    <View style={styles.goal} accessible accessibilityLabel={`${label}: ${value}. ${detail}`}>
      <Text style={styles.goalValue}>{value}</Text>
      <Text style={styles.goalLabel}>{label}</Text>
      <Text style={styles.goalDetail}>{detail}</Text>
    </View>
  );
}

function SmallTile({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.small} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.smallValue}>{value}</Text>
      <Text style={styles.smallLabel}>{label}</Text>
    </View>
  );
}

/** One labeled horizontal bar (single series, so no legend; the value is printed beside it). */
function Bar({ label, value, max, detail }: { label: string; value: number; max: number; detail?: string }) {
  const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0;
  return (
    <View style={styles.barRow} accessible accessibilityLabel={`${label}: ${detail ?? value}`}>
      <View style={styles.barText}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue}>{detail ?? value}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${width}%` }]} />
      </View>
    </View>
  );
}

function ErrorRow({ error }: { error: ErrorGroup }) {
  const [open, setOpen] = useState(false);
  const where = [error.screen, error.appVersion && `v${error.appVersion}`, error.updateId?.slice(0, 8), error.platform]
    .filter(Boolean)
    .join(' · ');
  return (
    <View style={styles.errorCard}>
      <View style={styles.errorHead}>
        {error.fatal ? <Text style={styles.crash}>{copy.insights.crash}</Text> : null}
        <Text style={styles.errorMessage}>{error.message}</Text>
      </View>
      <Text style={styles.meta}>{copy.insights.errorMeta(error.occurrences, error.users, timeLabel(error.lastSeen))}</Text>
      {where ? <Text style={styles.meta}>{where}</Text> : null}
      {error.stack ? (
        <>
          <Pressable
            onPress={() => setOpen(!open)}
            accessibilityRole="button"
            accessibilityLabel={open ? copy.insights.hideStack : copy.insights.showStack}
            style={styles.toggle}>
            <Text style={styles.link}>{open ? copy.insights.hideStack : copy.insights.showStack}</Text>
          </Pressable>
          {open ? <Text style={styles.stack}>{error.stack}</Text> : null}
        </>
      ) : null}
    </View>
  );
}

/** Admin-only success metrics (PRODUCT_SPEC.md) and app errors. The database refuses non-admins. */
export default function InsightsScreen() {
  const { session } = useAuth();
  const isAdmin = useIsAdmin(session?.user.id);
  const enabled = isAdmin.data === true;
  const metrics = useAdminMetrics(enabled);
  const errors = useRecentErrors(enabled);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    await Promise.all([metrics.refetch(), errors.refetch()]);
    setRefreshing(false);
  }

  if (isAdmin.isPending || (enabled && (metrics.isPending || errors.isPending))) return <StateView kind="loading" />;
  if (!enabled || metrics.isError || errors.isError) {
    return <StateView kind="error" message={copy.insights.loadError} onRetry={refresh} />;
  }
  if (!metrics.data || !errors.data) return <StateView kind="loading" />;
  const m = metrics.data;
  const errorGroups = errors.data;
  const f = m.funnel;
  const funnelMax = Math.max(f.signedUp, 1);
  const questMax = Math.max(...m.quests.map((q) => q.started), 1);

  return (
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <Text style={styles.updated}>{copy.insights.updated(timeLabel(m.generatedAt))}</Text>

      <Text style={styles.section} accessibilityRole="header">
        {copy.insights.goals}
      </Text>
      <Flourish width={120} />
      <GoalTile
        value={percent(m.firstVisitFinish)}
        label={copy.insights.firstVisit}
        detail={copy.insights.ratio(m.firstVisitFinish.part, m.firstVisitFinish.of)}
      />
      <GoalTile value={percent(m.cameBack)} label={copy.insights.cameBack} detail={copy.insights.ratio(m.cameBack.part, m.cameBack.of)} />
      <GoalTile
        value={m.checkinsPerVisit === null ? copy.insights.noData : String(m.checkinsPerVisit)}
        label={copy.insights.perVisit}
        detail={copy.insights.visits(m.visits)}
      />

      <Text style={styles.section} accessibilityRole="header">
        {copy.insights.activity}
      </Text>
      <View style={styles.smallGrid}>
        <SmallTile value={m.activeToday} label={copy.insights.activeToday} />
        <SmallTile value={m.active7d} label={copy.insights.active7d} />
        <SmallTile value={m.newExplorers7d} label={copy.insights.new7d} />
        <SmallTile value={m.explorers} label={copy.insights.explorers} />
      </View>

      <Text style={styles.section} accessibilityRole="header">
        {copy.insights.funnel}
      </Text>
      <View style={styles.card}>
        <Bar label={copy.insights.funnelSteps.signedUp} value={f.signedUp} max={funnelMax} />
        <Bar label={copy.insights.funnelSteps.onboarded} value={f.onboarded} max={funnelMax} />
        <Bar label={copy.insights.funnelSteps.firstCheckin} value={f.firstCheckin} max={funnelMax} />
        <Bar label={copy.insights.funnelSteps.firstBadge} value={f.firstBadge} max={funnelMax} />
      </View>

      <Text style={styles.section} accessibilityRole="header">
        {copy.insights.quests}
      </Text>
      <View style={styles.card}>
        {m.quests.map((q) => (
          <Bar
            key={q.title}
            label={q.title}
            value={q.started}
            max={questMax}
            detail={copy.insights.startedFinished(q.started, q.finished)}
          />
        ))}
      </View>

      <Text style={styles.section} accessibilityRole="header">
        {copy.insights.spotReports}
      </Text>
      <View style={styles.card}>
        {m.spotReports.length === 0 ? <Text style={styles.body}>{copy.insights.noSpotReports}</Text> : null}
        {m.spotReports.map((r) => (
          <View key={`${r.quest}-${r.title}`} style={styles.listRow} accessible accessibilityLabel={`${r.title}, ${r.quest}: ${copy.insights.reportsCount(r.reports)}`}>
            <View style={styles.flex}>
              <Text style={styles.body}>{r.title}</Text>
              <Text style={styles.meta}>{r.quest}</Text>
            </View>
            <Text style={styles.count}>{copy.insights.reportsCount(r.reports)}</Text>
          </View>
        ))}
        {m.openUserReports > 0 ? (
          <Pressable onPress={() => router.push('/moderation')} accessibilityRole="link" style={styles.toggle}>
            <Text style={styles.link}>{copy.insights.userReports(m.openUserReports)}</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.section} accessibilityRole="header">
        {copy.insights.errors}
      </Text>
      {errorGroups.length === 0 ? <Text style={styles.body}>{copy.insights.noErrors}</Text> : null}
      {errorGroups.map((e) => (
        <ErrorRow key={e.message} error={e} />
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
  flex: {
    flex: 1,
  },
  updated: {
    ...type.caption,
    color: colors.inkMuted,
  },
  section: {
    ...type.label,
    color: colors.midnight,
    letterSpacing: 1.5,
    marginTop: spacing.md,
  },
  goal: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.midnight,
    gap: 2,
  },
  goalValue: {
    ...type.display,
    color: colors.storybookGold,
  },
  goalLabel: {
    ...type.bodyStrong,
    color: colors.parchment,
  },
  goalDetail: {
    ...type.label,
    color: colors.parchment,
    opacity: 0.85,
  },
  smallGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  small: {
    flexGrow: 1,
    flexBasis: '45%',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallValue: {
    ...type.title,
    color: colors.midnight,
  },
  smallLabel: {
    ...type.label,
    color: colors.inkMuted,
  },
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  barRow: {
    gap: spacing.xs,
  },
  barText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  barLabel: {
    ...type.label,
    color: colors.ink,
    flexShrink: 1,
  },
  barValue: {
    ...type.label,
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
  },
  track: {
    height: 10,
    borderRadius: 4,
    backgroundColor: colors.parchment,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.storybookGold,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  body: {
    ...type.body,
    color: colors.ink,
  },
  meta: {
    ...type.caption,
    color: colors.inkMuted,
  },
  count: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  link: {
    ...type.bodyStrong,
    color: colors.midnight,
    textDecorationLine: 'underline',
  },
  toggle: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
  },
  errorCard: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  crash: {
    ...type.caption,
    fontFamily: fonts.bodySemiBold,
    color: colors.white,
    backgroundColor: colors.roseText,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  errorMessage: {
    ...type.bodyStrong,
    color: colors.ink,
    flex: 1,
  },
  stack: {
    ...type.caption,
    color: colors.ink,
  },
});
