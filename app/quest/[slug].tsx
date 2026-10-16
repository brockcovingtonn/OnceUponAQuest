import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { BadgeStamp } from '@/components/BadgeStamp';
import { OfflineStatus } from '@/components/OfflineStatus';
import { Flourish } from '@/components/Flourish';
import { QuestFieldTools } from '@/components/FieldTools';
import { ProgressRing } from '@/components/ProgressRing';
import { QuestCover } from '@/components/QuestCover';
import { type SpotState, SpotRow } from '@/components/SpotRow';
import { StateView } from '@/components/StateView';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { fieldToolsEnabled } from '@/lib/fieldTools';
import { useIsOnline } from '@/lib/network';
import { useOfflineQueue } from '@/lib/offlineQueue';
import { useParadeMode } from '@/lib/paradeMode';
import { useIsAdmin, useMyProgress, useQuest, useSavedQuests, useToggleSavedQuest } from '@/lib/queries';
import { prefetchStorageImages } from '@/lib/storageImage';
import { colors, fonts, minTouchTarget, radius, spacing, type } from '@/theme';

export default function QuestDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { session } = useAuth();
  const quest = useQuest(slug);
  const progress = useMyProgress(session?.user.id);
  const { paradeMode } = useParadeMode();
  const isAdmin = useIsAdmin(session?.user.id);
  const saved = useSavedQuests(session?.user.id);
  const toggleSaved = useToggleSavedQuest(session?.user.id);
  const { items: queuedItems } = useOfflineQueue();
  const online = useIsOnline();
  const accessToken = session?.access_token;
  const photoPaths = quest.data ? [quest.data.cover_photo_path, ...quest.data.spots.map((s) => s.photo_path)].join('|') : '';

  // Save this quest's cover and hint photos on the phone so they show without signal later.
  useEffect(() => {
    if (!online || !accessToken || !photoPaths) return;
    prefetchStorageImages('spot-photos', photoPaths.split('|'), accessToken);
  }, [online, accessToken, photoPaths]);

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

  const { id: questId, title, story, est_minutes: estMinutes, spots, badge, cover_photo_path: coverPhotoPath } = quest.data;
  const { foundSpots, badgeIds } = progress.data;

  const rows = spots.map((spot) => {
    const found = foundSpots.has(spot.id);
    const waiting = queuedItems.some((q) => q.spotId === spot.id && q.status === 'waiting');
    const state: SpotState = found
      ? 'found'
      : waiting
        ? 'pending'
        : paradeMode && spot.pause_during_parades
          ? 'paused'
          : 'open';
    return { spot, state, name: found ? spot.title : spot.teaser };
  });
  const foundCount = rows.filter((r) => r.state === 'found').length;
  const anyPaused = rows.some((r) => r.state === 'paused');
  const badgeEarned = badge ? badgeIds.has(badge.id) : false;
  const isSaved = Boolean(saved.data?.includes(questId));

  // A Quest Pass quest you can't open yet: show the story and how to unlock it.
  if (quest.data.is_premium && spots.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <ScrollView contentContainerStyle={styles.content}>
          <QuestCover slug={slug} coverPhotoPath={coverPhotoPath} height={180} style={styles.cover} />
          <View style={styles.passChip}>
            <Ionicons name="ribbon" size={14} color={colors.midnight} />
            <Text style={styles.passChipText}>{copy.pass.chip}</Text>
          </View>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Flourish width={160} />
          {story ? <Text style={styles.story}>{story}</Text> : null}
          <Text style={styles.minutes}>{copy.questDetail.minutes(estMinutes)}</Text>
          <Banner tone="info" message={copy.pass.lockedBody} />
          <Button label={copy.pass.unlock} onPress={() => router.push('/quest-pass')} />
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <OfflineStatus />
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

        {foundCount < spots.length && !badgeEarned ? (
          <Pressable
            onPress={() => toggleSaved.mutate({ questId, save: !isSaved })}
            accessibilityRole="button"
            accessibilityState={{ selected: isSaved }}
            accessibilityLabel={isSaved ? copy.questDetail.saved : copy.questDetail.save}
            style={({ pressed }) => [styles.saveButton, isSaved && styles.saveButtonOn, pressed && { opacity: 0.75 }]}>
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={18} color={colors.midnight} />
            <Text style={styles.saveText}>{isSaved ? copy.questDetail.saved : copy.questDetail.save}</Text>
          </Pressable>
        ) : null}

        {anyPaused ? <Banner tone="warning" message={copy.paradeMode.banner} /> : null}
        {spots.some((s) => !s.verified_on_site) ? (
          <Banner tone="info" message={copy.questDetail.beingVerified} />
        ) : null}

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

        {fieldToolsEnabled && isAdmin.data ? <QuestFieldTools quest={{ id: quest.data.id, title, story }} /> : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  passChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.round,
    backgroundColor: colors.storybookGold,
  },
  passChipText: {
    ...type.caption,
    color: colors.midnight,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.round,
    borderWidth: 1.5,
    borderColor: colors.storybookGold,
  },
  saveButtonOn: {
    backgroundColor: colors.storybookGold,
  },
  saveText: {
    ...type.label,
    fontFamily: fonts.bodySemiBold,
    color: colors.midnight,
  },
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
