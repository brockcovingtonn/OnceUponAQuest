import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Flourish } from '@/components/Flourish';
import { OfflineStatus } from '@/components/OfflineStatus';
import { ParadeModeToggle } from '@/components/ParadeModeToggle';
import { Scene } from '@/components/Scene';
import { Twinkle } from '@/components/Twinkle';
import { QuestCard } from '@/components/QuestCard';
import { UpdateBanner } from '@/components/UpdateBanner';
import { StateView } from '@/components/StateView';
import { mainStreetNight } from '@/art/scenes';
import { copy } from '@/copy';
import { useAppUpdate } from '@/lib/appUpdates';
import { useIsOnline } from '@/lib/network';
import { useAuth } from '@/lib/auth';
import { type QuestSummary, useMyProgress, useProfile, useQuests } from '@/lib/queries';
import { prefetchStorageImages } from '@/lib/storageImage';
import { hasSeenWalkthrough } from '@/lib/walkthrough';
import { colors, minTouchTarget, radius, spacing, type } from '@/theme';

type LandSection = { id: string; name: string; sortOrder: number; quests: QuestSummary[] };

function groupByLand(quests: QuestSummary[]): LandSection[] {
  const lands = new Map<string, LandSection>();
  for (const quest of quests) {
    const section = lands.get(quest.land.id) ?? { ...quest.land, quests: [] };
    section.quests.push(quest);
    lands.set(quest.land.id, section);
  }
  return [...lands.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

export default function QuestsScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const profile = useProfile(userId);
  const quests = useQuests();
  const progress = useMyProgress(userId);
  const [refreshing, setRefreshing] = useState(false);
  const appUpdate = useAppUpdate();
  const online = useIsOnline();
  const accessToken = session?.access_token;
  const coverPaths = (quests.data ?? []).map((q) => q.coverPhotoPath ?? '').join('|');

  // Save quest covers on the phone so the cards look right without signal.
  useEffect(() => {
    if (!online || !accessToken || !coverPaths.replaceAll('|', '')) return;
    prefetchStorageImages('spot-photos', coverPaths.split('|'), accessToken);
  }, [online, accessToken, coverPaths]);

  // First visit after onboarding: show "How quests work" once.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    hasSeenWalkthrough(userId).then((seen) => {
      if (!seen && !cancelled) router.push('/walkthrough');
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function refresh() {
    setRefreshing(true);
    await Promise.all([quests.refetch(), progress.refetch()]);
    setRefreshing(false);
  }

  let body;
  if (quests.isPending || progress.isPending) {
    body = <StateView kind="loading" />;
  } else if (quests.isError || progress.isError) {
    body = <StateView kind="error" message={copy.quests.loadError} onRetry={refresh} />;
  } else {
    const sections = groupByLand(quests.data);
    body = (
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <View style={styles.header}>
          <Scene shapes={mainStreetNight} height={150} />
          <Twinkle size={12} style={{ top: 58, right: '16%' }} />
          <Twinkle size={9} delay={700} style={{ top: 74, left: '46%' }} color={colors.parchment} />
          {profile.data ? (
            <Text style={styles.greeting} accessibilityRole="header">
              {copy.quests.greeting(new Date().getHours(), profile.data.display_name ?? profile.data.username)}
            </Text>
          ) : null}
          <Pressable
            onPress={() => router.push('/walkthrough')}
            accessibilityRole="button"
            accessibilityLabel={copy.walkthrough.open}
            accessibilityHint={copy.walkthrough.openHint}
            style={styles.help}>
            <Ionicons name="help-circle-outline" size={26} color={colors.parchment} />
          </Pressable>
        </View>

        {appUpdate.ready ? <UpdateBanner onRestart={appUpdate.restart} /> : null}
        <OfflineStatus />
        <ParadeModeToggle />

        {sections.length === 0 ? <Text style={styles.empty}>{copy.quests.empty}</Text> : null}

        {sections.map((land) => (
          <View key={land.id} style={styles.section}>
            <View style={styles.landHeading}>
              <Text style={styles.landHeader} accessibilityRole="header">
                {land.name.toUpperCase()}
              </Text>
              <Flourish width={160} />
            </View>
            {land.quests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                chapter={quests.data.indexOf(quest) + 1}
                found={progress.data.foundByQuest.get(quest.id) ?? 0}
                badgeEarned={quest.badge ? progress.data.badgeIds.has(quest.badge.id) : false}
                onPress={() =>
                  router.push({ pathname: '/quest/[slug]', params: { slug: quest.slug } })
                }
              />
            ))}
          </View>
        ))}

        {sections.length > 0 ? <Text style={styles.moreLands}>{copy.quests.moreLands}</Text> : null}
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
    gap: spacing.lg,
  },
  header: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  greeting: {
    ...type.title,
    color: colors.parchment,
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md + minTouchTarget,
  },
  help: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: spacing.md,
  },
  landHeading: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  landHeader: {
    ...type.label,
    color: colors.midnight,
    letterSpacing: 2,
    textAlign: 'center',
  },
  empty: {
    ...type.body,
    color: colors.ink,
    textAlign: 'center',
  },
  moreLands: {
    ...type.label,
    color: colors.inkMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
