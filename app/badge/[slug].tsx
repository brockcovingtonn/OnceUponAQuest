import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { Banner } from '@/components/Banner';
import { BadgeStamp } from '@/components/BadgeStamp';
import { Button } from '@/components/Button';
import { Fireworks } from '@/components/Fireworks';
import { Flourish } from '@/components/Flourish';
import { QuestCover } from '@/components/QuestCover';
import { SparkleBurst } from '@/components/SparkleBurst';
import { StateView } from '@/components/StateView';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { useFeedback } from '@/lib/feedback';
import { suggestNextQuest } from '@/lib/nextAdventure';
import { useBadge, useMyProgress, useQuests, useSavedQuests, useToggleSavedQuest } from '@/lib/queries';
import { colors, fonts, radius, spacing, type } from '@/theme';

export default function BadgeEarnedScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { session } = useAuth();
  const badge = useBadge(slug);
  const quests = useQuests();
  const progress = useMyProgress(session?.user.id);
  const saved = useSavedQuests(session?.user.id);
  const toggleSaved = useToggleSavedQuest(session?.user.id);
  const [saveError, setSaveError] = useState(false);
  const shareCard = useRef<View>(null);
  const scale = useState(() => new Animated.Value(0.3))[0];
  const [shareError, setShareError] = useState<string>();
  const [sharing, setSharing] = useState(false);

  const feedback = useFeedback();
  const loaded = Boolean(badge.data);
  // Chime once when the badge appears.
  useEffect(() => {
    if (loaded) feedback.badge();
  }, [loaded, feedback]);
  useEffect(() => {
    if (!loaded) return;
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }).start();
  }, [loaded, scale]);

  if (badge.isPending) return <StateView kind="loading" />;
  if (badge.isError) return <StateView kind="error" message={copy.common.networkError} onRetry={() => badge.refetch()} />;
  if (!badge.data) return <StateView kind="empty" message={copy.badge.notFound} />;

  const b = badge.data;
  const quest = b.quests[0];
  const spotCount = quest?.spots[0]?.count ?? 0;

  // Your next adventure: a quest you've started, else the next one nearby.
  const currentId = quests.data?.find((q) => q.slug === quest?.slug)?.id;
  const next =
    quests.data && progress.data
      ? suggestNextQuest(quests.data, currentId, progress.data.foundByQuest, progress.data.badgeIds)
      : null;
  const nextSaved = next ? Boolean(saved.data?.includes(next.quest.id)) : false;

  function toggleSave() {
    if (!next) return;
    setSaveError(false);
    feedback.tap();
    toggleSaved.mutate({ questId: next.quest.id, save: !nextSaved }, { onError: () => setSaveError(true) });
  }

  async function share() {
    setShareError(undefined);
    if (!(await Sharing.isAvailableAsync())) {
      setShareError(copy.badge.shareUnavailable);
      return;
    }
    setSharing(true);
    try {
      const uri = await captureRef(shareCard, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: copy.badge.shareDialogTitle });
    } catch {
      setShareError(copy.common.somethingWrong);
    } finally {
      setSharing(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View ref={shareCard} collapsable={false} style={styles.card}>
        {loaded ? <Fireworks /> : null}
        <Text style={styles.sparkles} importantForAccessibility="no" accessibilityElementsHidden>
          ✦ ✦ ✦
        </Text>
        <Animated.View
          style={{ transform: [{ scale }] }}
          accessible
          accessibilityRole="image"
          accessibilityLabel={copy.badge.stampLabel(b.title)}>
          <BadgeStamp artKey={b.art_key} earned size={140} />
        </Animated.View>
        {loaded ? <SparkleBurst radius={160} delay={250} /> : null}
        <Text style={styles.badgeTitle}>{b.title}</Text>
        <Text style={styles.title} accessibilityRole="header">
          {copy.badge.title}
        </Text>
        <Flourish width={180} />
        {quest ? <Text style={styles.quest}>{quest.title}</Text> : null}
        {spotCount > 0 ? <Text style={styles.body}>{copy.badge.foundAll(spotCount)}</Text> : null}
        <Text style={styles.brand}>{copy.appName}</Text>
      </View>

      {shareError ? <Banner message={shareError} /> : null}

      <View style={styles.actions}>
        <Button label={copy.badge.share} onPress={share} loading={sharing} />
      </View>

      {next ? (
        <View style={styles.next} accessibilityLabel={copy.badge.nextAdventure}>
          <Text style={styles.nextKicker}>{copy.badge.nextAdventure}</Text>
          <QuestCover slug={next.quest.slug} coverPhotoPath={next.quest.coverPhotoPath} height={110} style={styles.nextCover} />
          <Text style={styles.nextTitle}>{next.quest.title}</Text>
          <Text style={styles.nextReason}>
            {copy.badge.nextReason(
              next.reason,
              next.quest.land.name,
              progress.data?.foundByQuest.get(next.quest.id) ?? 0,
              next.quest.spotCount,
            )}
          </Text>
          <Text style={styles.nextMeta}>{copy.quests.spotsAndTime(next.quest.spotCount, next.quest.estMinutes)}</Text>
          <Button
            label={copy.badge.startNow}
            onPress={() => router.replace({ pathname: '/quest/[slug]', params: { slug: next.quest.slug } })}
          />
          <Button
            variant="secondary"
            label={nextSaved ? `✓ ${copy.badge.savedForNext}` : copy.badge.saveForNext}
            onPress={toggleSave}
          />
          {nextSaved ? <Text style={styles.nextHint}>{copy.badge.savedHint}</Text> : null}
          {saveError ? <Banner message={copy.badge.saveFailed} /> : null}
        </View>
      ) : quests.data && progress.data ? (
        <Text style={styles.allDone}>{copy.badge.allDone}</Text>
      ) : null}

      <Button variant="text" label={copy.badge.done} onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.lg,
    justifyContent: 'center',
    backgroundColor: colors.parchment,
  },
  card: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.midnight,
  },
  sparkles: {
    ...type.title,
    color: colors.storybookGold,
    letterSpacing: 8,
  },
  badgeTitle: {
    ...type.heading,
    color: colors.storybookGold,
    marginTop: spacing.sm,
  },
  title: {
    ...type.display,
    color: colors.parchment,
    textAlign: 'center',
  },
  quest: {
    ...type.heading,
    color: colors.parchment,
    textAlign: 'center',
  },
  body: {
    ...type.body,
    color: colors.parchment,
    textAlign: 'center',
  },
  brand: {
    ...type.caption,
    color: colors.parchment,
    opacity: 0.7,
    marginTop: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
  next: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.storybookGold,
    backgroundColor: colors.white,
  },
  nextKicker: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  nextCover: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  nextTitle: {
    ...type.title,
    color: colors.midnight,
    textAlign: 'center',
  },
  nextReason: {
    ...type.body,
    color: colors.ink,
    textAlign: 'center',
  },
  nextMeta: {
    ...type.label,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  nextHint: {
    ...type.caption,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  allDone: {
    ...type.heading,
    color: colors.midnight,
    textAlign: 'center',
  },
});
