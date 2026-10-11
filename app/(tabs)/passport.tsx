import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Stamp } from '@/components/Stamp';
import { StateView } from '@/components/StateView';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { badgeIcon } from '@/lib/badgeArt';
import { formatDate } from '@/lib/format';
import { useMyProgress, usePassportContent } from '@/lib/queries';
import { colors, minTouchTarget, spacing, type } from '@/theme';

const STAMP_SIZE = 56;

function openSpot(id: string) {
  router.push({ pathname: '/spot/[id]', params: { id } });
}

export default function PassportScreen() {
  const { session } = useAuth();
  const content = usePassportContent();
  const progress = useMyProgress(session?.user.id);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    await Promise.all([content.refetch(), progress.refetch()]);
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

    body = (
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <View>
          <Text style={styles.title} accessibilityRole="header">
            {copy.passport.title}
          </Text>
          <Text style={styles.summary}>
            {copy.passport.summary(foundSpots.size, earnedCount, snacks.length)}
          </Text>
          {foundSpots.size === 0 ? <Text style={styles.hint}>{copy.passport.firstStampHint}</Text> : null}
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
                  <Stamp icon={badgeIcon(badge.artKey)} inked={earned} size={64} />
                  <Text style={[styles.badgeTitle, !earned && styles.muted]} numberOfLines={2}>
                    {badge.title}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {lands.map((land) => (
          <View key={land.id} style={styles.section}>
            <Text style={styles.sectionHeader} accessibilityRole="header">
              {copy.passport.stamps(land.name)}
            </Text>
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
        ))}

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
