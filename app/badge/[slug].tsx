import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { Banner } from '@/components/Banner';
import { BadgeStamp } from '@/components/BadgeStamp';
import { Button } from '@/components/Button';
import { SparkleBurst } from '@/components/SparkleBurst';
import { StateView } from '@/components/StateView';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { useBadge, useMyProgress, useQuests } from '@/lib/queries';
import { colors, radius, spacing, type } from '@/theme';

export default function BadgeEarnedScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { session } = useAuth();
  const badge = useBadge(slug);
  const quests = useQuests();
  const progress = useMyProgress(session?.user.id);
  const shareCard = useRef<View>(null);
  const scale = useState(() => new Animated.Value(0.3))[0];
  const [shareError, setShareError] = useState<string>();
  const [sharing, setSharing] = useState(false);

  const loaded = Boolean(badge.data);
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

  // First quest (in order) that isn't finished yet, other than this one.
  const nextQuest = quests.data?.find(
    (q) =>
      q.slug !== quest?.slug &&
      !(q.badge && progress.data?.badgeIds.has(q.badge.id)) &&
      (progress.data?.foundByQuest.get(q.id) ?? 0) < q.spotCount,
  );

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
        {quest ? <Text style={styles.quest}>{quest.title}</Text> : null}
        {spotCount > 0 ? <Text style={styles.body}>{copy.badge.foundAll(spotCount)}</Text> : null}
        <Text style={styles.brand}>{copy.appName}</Text>
      </View>

      {shareError ? <Banner message={shareError} /> : null}

      <View style={styles.actions}>
        <Button label={copy.badge.share} onPress={share} loading={sharing} />
        {nextQuest ? (
          <Button
            variant="secondary"
            label={`${copy.badge.nextQuest}: ${nextQuest.title} ›`}
            onPress={() => router.replace({ pathname: '/quest/[slug]', params: { slug: nextQuest.slug } })}
          />
        ) : null}
        <Button variant="text" label={copy.badge.done} onPress={() => router.back()} />
      </View>
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
});
