import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Banner } from '@/components/Banner';
import { BadgeStamp } from '@/components/BadgeStamp';
import { Flourish } from '@/components/Flourish';
import { QuestFieldTools } from '@/components/FieldTools';
import { ProgressRing } from '@/components/ProgressRing';
import { QuestCover } from '@/components/QuestCover';
import { type SpotState, SpotRow } from '@/components/SpotRow';
import { StateView } from '@/components/StateView';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { fieldToolsEnabled } from '@/lib/fieldTools';
import { useParadeMode } from '@/lib/paradeMode';
import { useIsAdmin, useMyProgress, useQuest } from '@/lib/queries';
import { colors, radius, spacing, type } from '@/theme';

export default function QuestDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { session } = useAuth();
  const quest = useQuest(slug);
  const progress = useMyProgress(session?.user.id);
  const { paradeMode } = useParadeMode();
  const isAdmin = useIsAdmin(session?.user.id);

  if (quest.isPending || progress.isPending) return <StateView kind="loading" />;
  if (quest.isError || progress.isError) {
    return (
      <StateView
        kind="error"
        message={copy.questDetail.loadError}
        onRetry={() => {
          quest.refetch();
          progress.refetch();
        }}
      />
    );
  }
  if (!quest.data) return <StateView kind="empty" message={copy.questDetail.notFound} />;

  const { title, story, est_minutes: estMinutes, spots, badge, cover_photo_path: coverPhotoPath } = quest.data;
  const { foundSpots, badgeIds } = progress.data;

  const rows = spots.map((spot) => {
    const found = foundSpots.has(spot.id);
    const state: SpotState = found
      ? 'found'
      : paradeMode && spot.pause_during_parades
        ? 'paused'
        : 'open';
    return { spot, state, name: found ? spot.title : spot.teaser };
  });
  const foundCount = rows.filter((r) => r.state === 'found').length;
  const anyPaused = rows.some((r) => r.state === 'paused');
  const badgeEarned = badge ? badgeIds.has(badge.id) : false;

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <QuestCover slug={slug} coverPhotoPath={coverPhotoPath} height={180} style={styles.cover} />
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Flourish width={160} />
        {story ? <Text style={styles.story}>{story}</Text> : null}

        <View style={styles.progressRow}>
          <ProgressRing
            found={foundCount}
            total={spots.length}
            size={72}
            strokeWidth={7}
            accessibilityLabel={copy.quests.statusInProgress(foundCount, spots.length)}>
            <Text style={styles.ringText}>{copy.questDetail.progress(foundCount, spots.length)}</Text>
          </ProgressRing>
          <Text style={styles.minutes}>{copy.questDetail.minutes(estMinutes)}</Text>
        </View>

        {anyPaused ? <Banner tone="warning" message={copy.paradeMode.banner} /> : null}

        <View>
          {rows.map(({ spot, state, name }) => (
            <SpotRow
              key={spot.id}
              order={spot.sort_order}
              name={name}
              state={state}
              onPress={() => router.push({ pathname: '/spot/[id]', params: { id: spot.id } })}
            />
          ))}
        </View>

        {badge ? (
          <View
            style={styles.badgeRow}
            accessible
            accessibilityLabel={`${badgeEarned ? copy.questDetail.badgeEarned : copy.questDetail.badgeForFinishing} ${badge.title}`}>
            <BadgeStamp artKey={badge.art_key} earned={badgeEarned} size={56} />
            <View style={styles.badgeText}>
              <Text style={styles.badgeLabel}>
                {badgeEarned ? copy.questDetail.badgeEarned : copy.questDetail.badgeForFinishing}
              </Text>
              <Text style={styles.badgeTitle}>{badge.title}</Text>
            </View>
          </View>
        ) : null}

        {fieldToolsEnabled && isAdmin.data ? <QuestFieldTools questId={quest.data.id} /> : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.parchment,
  },
  cover: {
    borderRadius: radius.lg,
  },
  title: {
    ...type.title,
    fontSize: 26,
    lineHeight: 34,
    color: colors.midnight,
  },
  story: {
    ...type.body,
    color: colors.ink,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
  },
  ringText: {
    ...type.caption,
    color: colors.ink,
  },
  minutes: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  badgeText: {
    flex: 1,
  },
  badgeLabel: {
    ...type.label,
    color: colors.inkMuted,
  },
  badgeTitle: {
    ...type.heading,
    color: colors.midnight,
  },
});
