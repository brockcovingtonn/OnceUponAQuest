import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ParadeModeToggle } from '@/components/ParadeModeToggle';
import { QuestCard } from '@/components/QuestCard';
import { StateView } from '@/components/StateView';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { type QuestSummary, useMyProgress, useProfile, useQuests } from '@/lib/queries';
import { colors, spacing, type } from '@/theme';

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
        {profile.data ? (
          <Text style={styles.greeting} accessibilityRole="header">
            {copy.quests.greeting(new Date().getHours(), profile.data.username)}
          </Text>
        ) : null}

        <ParadeModeToggle />

        {sections.length === 0 ? <Text style={styles.empty}>{copy.quests.empty}</Text> : null}

        {sections.map((land) => (
          <View key={land.id} style={styles.section}>
            <Text style={styles.landHeader} accessibilityRole="header">
              {land.name.toUpperCase()}
            </Text>
            {land.quests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
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
  greeting: {
    ...type.title,
    color: colors.midnight,
  },
  section: {
    gap: spacing.md,
  },
  landHeader: {
    ...type.label,
    color: colors.inkMuted,
    letterSpacing: 1,
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
