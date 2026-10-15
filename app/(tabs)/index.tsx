import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import { StarCount } from '@/components/StarCount';
import { copy } from '@/copy';
import { useAppUpdate } from '@/lib/appUpdates';
import { useIsOnline } from '@/lib/network';
import { useAuth } from '@/lib/auth';
import {
  type QuestSummary,
  useMyProgress,
  useProfile,
  useQuests,
  useSavedQuests,
  useToggleSavedQuest,
  useWardrobe,
} from '@/lib/queries';
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
  const wardrobe = useWardrobe(userId);
  const profile = useProfile(userId);
  const quests = useQuests();
  const progress = useMyProgress(userId);
  const saved = useSavedQuests(userId);
  const toggleSaved = useToggleSavedQuest(userId);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef(new Map<string, number>());
  const jumpHeight = useRef(0);
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
        ref={scrollRef}
        contentContainerStyle={styles.content}
        // Keep "Jump to a land" pinned to the top while scrolling.
        stickyHeaderIndices={[1]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <View style={styles.top}>
        {/* Greeting sits on plain parchment above the scene so it's always readable. */}
        <View style={styles.greetingRow}>
          <Text style={styles.greeting} accessibilityRole="header">
            {profile.data
              ? copy.quests.greeting(new Date().getHours(), profile.data.display_name ?? profile.data.username)
              : ''}
          </Text>
          {wardrobe.data ? (
            <StarCount
              count={wardrobe.data.balance}
              onPress={() => router.push('/wardrobe')}
              accessibilityHint={copy.wardrobe.openHint}
              style={styles.starChip}
            />
          ) : null}
          <Pressable
            onPress={() => router.push('/walkthrough')}
            accessibilityRole="button"
            accessibilityLabel={copy.walkthrough.open}
            accessibilityHint={copy.walkthrough.openHint}
            style={styles.help}>
            <Ionicons name="help-circle-outline" size={28} color={colors.midnight} />
          </Pressable>
        </View>
        <View style={styles.header}>
          <Scene shapes={mainStreetNight} height={150} />
          <Twinkle size={12} style={{ top: 58, right: '16%' }} />
          <Twinkle size={9} delay={700} style={{ top: 74, left: '46%' }} color={colors.parchment} />
        </View>

        {appUpdate.ready ? <UpdateBanner onRestart={appUpdate.restart} /> : null}
        <OfflineStatus />
        <ParadeModeToggle />
        {(() => {
          // Saved for your next visit (finished quests drop off on their own).
          const savedQuests = (saved.data ?? [])
            .map((id) => quests.data.find((q) => q.id === id))
            .filter((q): q is QuestSummary => {
              if (!q) return false;
              const earned = q.badge ? progress.data.badgeIds.has(q.badge.id) : false;
              return !earned && (progress.data.foundByQuest.get(q.id) ?? 0) < q.spotCount;
            });
          if (savedQuests.length === 0) return null;
          return (
            <View style={styles.section}>
              <View style={styles.savedHeading}>
                <Ionicons name="bookmark" size={16} color={colors.storybookGold} />
                <Text style={styles.landHeader} accessibilityRole="header">
                  {copy.quests.savedTitle}
                </Text>
              </View>
              {savedQuests.map((quest) => (
                <View key={quest.id} style={styles.savedItem}>
                  <QuestCard
                    quest={quest}
                    chapter={quests.data.indexOf(quest) + 1}
                    found={progress.data.foundByQuest.get(quest.id) ?? 0}
                    badgeEarned={false}
                    onPress={() => router.push({ pathname: '/quest/[slug]', params: { slug: quest.slug } })}
                  />
                  <Pressable
                    onPress={() => toggleSaved.mutate({ questId: quest.id, save: false })}
                    accessibilityRole="button"
                    accessibilityLabel={copy.quests.removeSavedLabel(quest.title)}
                    hitSlop={8}
                    style={styles.removeSaved}>
                    <Ionicons name="bookmark-outline" size={14} color={colors.inkMuted} />
                    <Text style={styles.removeSavedText}>{copy.quests.removeSaved}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          );
        })()}
        </View>

        {sections.length > 1 ? (
          <View style={styles.jump} onLayout={(e) => (jumpHeight.current = e.nativeEvent.layout.height)}>
            <Text style={styles.jumpTitle}>{copy.quests.jumpTo}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}>
              {sections.map((land) => (
                <Pressable
                  key={land.id}
                  onPress={() => {
                    const y = sectionY.current.get(land.id);
                    // Land just below the pinned chip row.
                    if (y !== undefined) scrollRef.current?.scrollTo({ y: y - jumpHeight.current - spacing.sm, animated: true });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={copy.quests.jumpToLabel(land.name)}
                  style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}>
                  <Text style={styles.chipText}>{land.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View />
        )}

        {sections.length === 0 ? <Text style={styles.empty}>{copy.quests.empty}</Text> : null}

        {sections.map((land) => (
          <View
            key={land.id}
            style={styles.section}
            onLayout={(e) => sectionY.current.set(land.id, e.nativeEvent.layout.y)}>
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
  starChip: {
    alignSelf: 'center',
  },
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
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: -spacing.sm,
  },
  greeting: {
    ...type.title,
    color: colors.midnight,
    flex: 1,
  },
  help: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: spacing.md,
  },
  top: {
    gap: spacing.lg,
  },
  savedHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  savedItem: {
    gap: spacing.xs,
  },
  removeSaved: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    minHeight: minTouchTarget - 12,
  },
  removeSavedText: {
    ...type.label,
    color: colors.inkMuted,
    textDecorationLine: 'underline',
  },
  jump: {
    gap: spacing.xs,
    marginHorizontal: -spacing.lg,
    paddingVertical: spacing.xs,
    backgroundColor: colors.parchment,
  },
  jumpTitle: {
    ...type.caption,
    color: colors.inkMuted,
    letterSpacing: 1.5,
    paddingHorizontal: spacing.lg,
  },
  chips: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  chip: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.storybookGold,
    backgroundColor: colors.white,
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipText: {
    ...type.label,
    color: colors.midnight,
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
