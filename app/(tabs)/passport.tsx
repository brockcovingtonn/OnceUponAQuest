import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { parseLook } from '@/art/avatar';
import { BadgeStamp } from '@/components/BadgeStamp';
import { Button } from '@/components/Button';
import { Flourish } from '@/components/Flourish';
import { LensStamp } from '@/components/LensStamp';
import { Stamp } from '@/components/Stamp';
import { PassportShareCard } from '@/components/share/PassportShareCard';
import { ShareSheet } from '@/components/share/ShareSheet';
import { StateView } from '@/components/StateView';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { useLandmarks, useMyLensStamps } from '@/lib/landmarks';
import { computeMilestones, countParkDays } from '@/lib/milestones';
import { useMyProgress, usePassportContent, useProfile } from '@/lib/queries';
import { colors, minTouchTarget, spacing, type } from '@/theme';

const STAMP_SIZE = 56;

function openSpot(id: string) {
  router.push({ pathname: '/spot/[id]', params: { id } });
}

export default function PassportScreen() {
  const { session } = useAuth();
  const content = usePassportContent();
  const progress = useMyProgress(session?.user.id);
  const landmarks = useLandmarks();
  const lensStamps = useMyLensStamps(session?.user.id);
  const profile = useProfile(session?.user.id);
  const [sharing, setSharing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    await Promise.all([content.refetch(), progress.refetch(), landmarks.refetch(), lensStamps.refetch()]);
    setRefreshing(false);
  }

  let body;
  if (content.isPending || progress.isPending) {
    body = <StateView kind="loading" />;
  } else if (content.isError || progress.isError) {
    body = <StateView kind="error" message={copy.passport.loadError} onRetry={refresh} />;
  } else {
    const { lands, badges } = content.data;
    const { foundSpots, badgeIds, snacks } = progress.data;
    const spotsById = new Map(lands.flatMap((land) => land.spots.map((spot) => [spot.id, spot] as const)));
    const earnedCount = badges.filter((b) => badgeIds.has(b.id)).length;
    const foundDates = [...foundSpots.values()];
    const lensCount = lensStamps.data?.size ?? 0;
    const milestones = computeMilestones({ foundAt: foundDates, snackCount: snacks.length, lensCount });
    const parkDays = countParkDays(foundDates);
    const landProgress = lands.map((land) => ({
      id: land.id,
      name: land.name,
      found: land.spots.filter((spot) => foundSpots.has(spot.id)).length,
      total: land.spots.length,
    }));

    body = (
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <View>
          <Text style={styles.title} accessibilityRole="header">
            {copy.passport.title}
          </Text>
          <Flourish width={160} style={styles.flourish} />
          <Text style={styles.summary}>
            {copy.passport.summary(foundSpots.size, earnedCount, snacks.length)}
          </Text>
          {foundSpots.size === 0 ? <Text style={styles.hint}>{copy.passport.firstStampHint}</Text> : null}
          <View style={styles.shareRow}>
            <Button variant="secondary" label={copy.passport.sharePassport} onPress={() => setSharing(true)} />
          </View>
          <ShareSheet visible={sharing} onClose={() => setSharing(false)} dialogTitle={copy.share.passportDialog}>
            <PassportShareCard
              name={profile.data?.display_name || profile.data?.username || copy.passport.title}
              spots={foundSpots.size}
              snacks={snacks.length}
              lensPages={lensCount}
              badges={badges.filter((b) => badgeIds.has(b.id)).map((b) => ({ id: b.id, artKey: b.artKey }))}
              milestones={milestones}
              lands={landProgress}
              look={parseLook(profile.data?.avatar)}
            />
          </ShareSheet>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader} accessibilityRole="header">
            {copy.passport.milestones}
          </Text>
          <View style={styles.badgeRow}>
            {milestones.map((m) => {
              const label = copy.passport.milestone[m.key];
              return (
                <View
                  key={m.key}
                  style={styles.badge}
                  accessible
                  accessibilityLabel={copy.passport.milestoneLabel(label.title, label.detail, m.earned)}>
                  <Stamp icon={m.icon} inked={m.earned} size={56} />
                  <Text style={[styles.badgeTitle, !m.earned && styles.muted]} numberOfLines={2}>
                    {label.title}
                  </Text>
                  {m.key === 'threeDays' && !m.earned ? (
                    <Text style={styles.milestoneProgress}>{copy.passport.daysProgress(parkDays)}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader} accessibilityRole="header">
            {copy.passport.badges}
          </Text>
          <View style={styles.badgeRow}>
            {badges.map((badge) => {
              const earned = badgeIds.has(badge.id);
              return (
                <View
                  key={badge.id}
                  style={styles.badge}
                  accessible
                  accessibilityLabel={copy.passport.badgeLabel(badge.title, earned)}>
                  <BadgeStamp artKey={badge.artKey} earned={earned} size={64} />
                  <Text style={[styles.badgeTitle, !earned && styles.muted]} numberOfLines={2}>
                    {badge.title}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {landmarks.data && landmarks.data.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeader} accessibilityRole="header">
              {copy.lens.passportTitle}
            </Text>
            <Text style={styles.hint}>
              {lensStamps.data && lensStamps.data.size > 0
                ? copy.lens.passportCount(lensStamps.data.size, landmarks.data.length)
                : copy.lens.passportEmpty}
            </Text>
            <View style={styles.grid}>
              {landmarks.data.map((l) => {
                const stamped = Boolean(lensStamps.data?.has(l.id));
                return (
                  <Pressable
                    key={l.id}
                    onPress={() => router.push({ pathname: '/landmark/[slug]', params: { slug: l.slug } })}
                    accessibilityRole="button"
                    accessibilityLabel={copy.lens.passportStamp(l.title, stamped)}
                    style={({ pressed }) => [styles.gridCell, pressed && styles.pressed]}>
                    <LensStamp stamped={stamped} size={STAMP_SIZE} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {lands.map((land) => {
          const progress = landProgress.find((l) => l.id === land.id);
          const found = progress?.found ?? 0;
          const total = progress?.total ?? 0;
          return (
          <View key={land.id} style={styles.section}>
            <View
              style={styles.landHeader}
              accessible
              accessibilityRole="header"
              accessibilityLabel={copy.passport.landProgressLabel(land.name, found, total)}>
              <Text style={styles.sectionHeader}>{copy.passport.stamps(land.name)}</Text>
              <Text style={styles.landCount}>{copy.passport.landProgress(found, total)}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${total ? (found / total) * 100 : 0}%` }]} />
            </View>
            <View style={styles.grid}>
              {land.spots.map((spot) => {
                const foundAt = foundSpots.get(spot.id);
                return foundAt ? (
                  <Pressable
                    key={spot.id}
                    onPress={() => openSpot(spot.id)}
                    accessibilityRole="button"
                    accessibilityLabel={copy.passport.foundStampLabel(spot.title, formatDate(foundAt))}
                    style={({ pressed }) => [styles.gridCell, pressed && styles.pressed]}>
                    <Stamp icon="star" inked size={STAMP_SIZE} />
                  </Pressable>
                ) : (
                  <View
                    key={spot.id}
                    style={styles.gridCell}
                    accessible
                    accessibilityLabel={copy.passport.lockedStampLabel(spot.teaser)}>
                    <Stamp icon="ellipse-outline" inked={false} size={STAMP_SIZE} />
                  </View>
                );
              })}
            </View>
          </View>
          );
        })}

        <View style={styles.section}>
          <Text style={styles.sectionHeader} accessibilityRole="header">
            {copy.passport.snackPassport}
          </Text>
          {snacks.length === 0 ? (
            <Text style={styles.hint}>{copy.passport.noSnacks}</Text>
          ) : (
            snacks.map((snack) => {
              const title = spotsById.get(snack.spotId)?.title ?? '';
              const date = formatDate(snack.foundAt);
              return (
                <Pressable
                  key={snack.spotId}
                  onPress={() => openSpot(snack.spotId)}
                  accessibilityRole="button"
                  accessibilityLabel={copy.passport.snackLabel(title, date)}
                  style={({ pressed }) => [styles.snackRow, pressed && styles.pressed]}>
                  <Ionicons name="restaurant-outline" size={20} color={colors.midnight} />
                  <Text style={styles.snackText}>
                    {title} · {date}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {body}
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
    gap: spacing.xl,
  },
  title: {
    ...type.title,
    color: colors.midnight,
  },
  flourish: {
    marginVertical: spacing.xs,
  },
  summary: {
    ...type.body,
    color: colors.ink,
  },
  hint: {
    ...type.label,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    ...type.label,
    color: colors.inkMuted,
    letterSpacing: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  badge: {
    width: 76,
    alignItems: 'center',
    gap: spacing.xs,
  },
  badgeTitle: {
    ...type.caption,
    color: colors.ink,
    textAlign: 'center',
  },
  muted: {
    color: colors.inkMuted,
  },
  shareRow: {
    marginTop: spacing.md,
  },
  milestoneProgress: {
    ...type.caption,
    color: colors.inkMuted,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  landHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  landCount: {
    ...type.label,
    color: colors.midnight,
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginTop: -spacing.xs,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.storybookGold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridCell: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  snackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: minTouchTarget,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  snackText: {
    ...type.body,
    color: colors.ink,
    flex: 1,
  },
});
