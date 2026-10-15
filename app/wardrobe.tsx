import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type AvatarLook, DEFAULT_LOOK, parseLook, type Slot, SLOTS } from '@/art/avatar';
import { ITEM_ART } from '@/art/avatarItems';
import { AvatarBust, AvatarFigure } from '@/components/Avatar';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { StarCount } from '@/components/StarCount';
import { StateView } from '@/components/StateView';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { useFeedback } from '@/lib/feedback';
import {
  type Profile,
  useBuyItem,
  useProfile,
  useQuests,
  useSaveLook,
  useStarHistory,
  useWardrobe,
  type Wardrobe,
  type WardrobeItem,
} from '@/lib/queries';
import { colors, minTouchTarget, radius, spacing, type } from '@/theme';

export default function WardrobeScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const profile = useProfile(userId);
  const wardrobe = useWardrobe(userId);

  if (profile.isPending || wardrobe.isPending) return <StateView kind="loading" />;
  if (profile.isError || wardrobe.isError || !profile.data || !userId) {
    return (
      <StateView
        kind="error"
        message={copy.wardrobe.loadError}
        onRetry={() => {
          profile.refetch();
          wardrobe.refetch();
        }}
      />
    );
  }
  return <WardrobeView profile={profile.data} wardrobe={wardrobe.data} userId={userId} />;
}

function WardrobeView({ profile, wardrobe, userId }: { profile: Profile; wardrobe: Wardrobe; userId: string }) {
  const feedback = useFeedback();
  const quests = useQuests();
  const saveLook = useSaveLook(userId);
  const buy = useBuyItem(userId);
  const history = useStarHistory(userId);
  const look = parseLook(profile.avatar) ?? DEFAULT_LOOK;
  const [slot, setSlot] = useState<Slot>('outfit');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: 'info' | 'error' } | null>(null);

  const landNames = useMemo(() => new Map((quests.data ?? []).map((q) => [q.land.id, q.land.name])), [quests.data]);
  const questTitles = useMemo(() => new Map((quests.data ?? []).map((q) => [q.id, q.title])), [quests.data]);
  const items = wardrobe.items.filter((i) => i.slot === slot && ITEM_ART[i.id]);
  const selected = wardrobe.items.find((i) => i.id === selectedId) ?? null;
  // Try the selected item on (outfits can't be taken off, the rest can).
  const preview: AvatarLook = selected ? { ...look, [selected.slot]: selected.id } : look;
  const wearing = (item: WardrobeItem) => look[item.slot] === item.id;

  function select(item: WardrobeItem) {
    feedback.tap();
    setMessage(null);
    setSelectedId(item.id === selectedId ? null : item.id);
  }

  function wear(item: WardrobeItem | null, slotToClear?: Slot) {
    const next = item ? { ...look, [item.slot]: item.id } : { ...look, [slotToClear as Slot]: null };
    saveLook.mutate(next, {
      onSuccess: () => setSelectedId(null),
      onError: () => setMessage({ text: copy.wardrobe.saveFailed, tone: 'error' }),
    });
  }

  function purchase(item: WardrobeItem) {
    buy.mutate(item.id, {
      onSuccess: ({ status }) => {
        if (status === 'ok' || status === 'owned') {
          feedback.badge();
          setMessage({ text: copy.wardrobe.bought(item.name), tone: 'info' });
          wear(item);
        } else {
          setMessage({ text: copy.wardrobe.buyFailed, tone: 'error' });
        }
      },
      onError: () => setMessage({ text: copy.wardrobe.buyFailed, tone: 'error' }),
    });
  }

  function lockReason(item: WardrobeItem): string {
    if (item.unlockLandId) return copy.wardrobe.lockedLand(landNames.get(item.unlockLandId) ?? '');
    if (item.unlockQuestId) return copy.wardrobe.lockedQuest(questTitles.get(item.unlockQuestId) ?? '');
    return copy.wardrobe.locked;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.stage}>
          <AvatarFigure look={preview} size={150} pose={selected ? 'wave' : 'stand'} accessibilityLabel={copy.avatar.previewLabel} />
          <View style={styles.stageSide}>
            <StarCount count={wardrobe.balance} size="large" />
            {selected ? <Text style={styles.tryingOn}>{copy.wardrobe.tryingOn}</Text> : null}
            <Button variant="secondary" label={copy.editProfile.lookButton} onPress={() => router.push('/avatar')} />
          </View>
        </View>

        <View style={styles.tabs} accessibilityRole="tablist">
          {SLOTS.map((s) => (
            <Pressable
              key={s}
              onPress={() => {
                setSlot(s);
                setSelectedId(null);
              }}
              accessibilityRole="tab"
              accessibilityLabel={copy.wardrobe.slots[s]}
              accessibilityState={{ selected: slot === s }}
              style={[styles.tab, slot === s && styles.tabOn]}>
              <Text style={[styles.tabText, slot === s && styles.tabTextOn]}>{copy.wardrobe.slots[s]}</Text>
            </Pressable>
          ))}
        </View>

        {selected ? (
          <View style={styles.detail}>
            <Text style={styles.detailTitle}>{selected.name}</Text>
            <Text style={styles.detailBody}>{selected.description}</Text>
            {selected.story ? <Text style={styles.detailStory}>{copy.wardrobe.fromStory(selected.story)}</Text> : null}
            {selected.landId ? (
              <View style={styles.hintRow}>
                <Ionicons name="sparkles-outline" size={16} color={colors.fernText} />
                <Text style={styles.hint}>{copy.wardrobe.dressHint(landNames.get(selected.landId) ?? '')}</Text>
              </View>
            ) : null}
            {selected.owned ? (
              wearing(selected) ? (
                selected.slot === 'outfit' ? (
                  <Text style={styles.state}>{copy.wardrobe.wearing}</Text>
                ) : (
                  <Button variant="secondary" label={copy.wardrobe.takeOff} loading={saveLook.isPending} onPress={() => wear(null, selected.slot)} />
                )
              ) : (
                <Button label={copy.wardrobe.wear} loading={saveLook.isPending} onPress={() => wear(selected)} />
              )
            ) : !selected.unlocked ? (
              <View style={styles.hintRow}>
                <Ionicons name="lock-closed" size={16} color={colors.inkMuted} />
                <Text style={styles.locked}>{lockReason(selected)}</Text>
              </View>
            ) : wardrobe.balance < selected.price ? (
              <>
                <Button label={copy.wardrobe.buy(selected.price)} disabled onPress={() => {}} />
                <Text style={styles.locked}>{copy.wardrobe.short(selected.price - wardrobe.balance)}</Text>
              </>
            ) : (
              <Button label={copy.wardrobe.buy(selected.price)} loading={buy.isPending} onPress={() => purchase(selected)} />
            )}
          </View>
        ) : null}
        {message ? <Banner message={message.text} tone={message.tone} /> : null}

        <View style={styles.grid}>
          {items.map((item) => {
            const state = item.owned
              ? wearing(item)
                ? copy.wardrobe.wearing
                : copy.wardrobe.owned
              : !item.unlocked
                ? copy.wardrobe.locked
                : copy.wardrobe.price(item.price);
            const tryLook = { ...look, [item.slot]: item.id };
            return (
              <Pressable
                key={item.id}
                onPress={() => select(item)}
                accessibilityRole="button"
                accessibilityLabel={copy.wardrobe.itemLabel(item.name, state)}
                accessibilityState={{ selected: item.id === selectedId }}
                style={[styles.tile, item.id === selectedId && styles.tileOn, wearing(item) && styles.tileWearing]}>
                {item.slot === 'hat' ? (
                  <AvatarBust look={tryLook} size={72} />
                ) : (
                  <AvatarFigure look={{ ...tryLook, hat: null }} size={64} shadow={false} />
                )}
                <Text style={styles.tileName} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.tileState}>
                  {!item.owned && !item.unlocked ? <Ionicons name="lock-closed" size={12} color={colors.inkMuted} /> : null}
                  {!item.owned && item.unlocked ? <Ionicons name="star" size={12} color={colors.storybookGold} /> : null}
                  <Text style={[styles.tileStateText, wearing(item) && styles.wearingText]}>{state}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle} accessibilityRole="header">
            {copy.stars.howTitle}
          </Text>
          {copy.stars.how.map((h) => (
            <View key={h.text} style={styles.howRow}>
              <Ionicons name={h.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.midnight} />
              <Text style={styles.howText}>{h.text}</Text>
            </View>
          ))}
          <Text style={styles.note}>{copy.stars.noCash}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle} accessibilityRole="header">
            {copy.stars.historyTitle}
          </Text>
          {history.data && history.data.length === 0 ? <Text style={styles.note}>{copy.stars.historyEmpty}</Text> : null}
          {(history.data ?? []).map((h) => (
            <View key={h.id} style={styles.historyRow}>
              <Text style={styles.howText}>
                {h.reason === 'purchase'
                  ? `${copy.stars.reasons.purchase}: ${wardrobe.items.find((i) => i.id === h.ref)?.name ?? ''}`
                  : (copy.stars.reasons[h.reason] ?? h.reason)}
              </Text>
              <Text style={[styles.amount, h.amount < 0 && styles.spent]}>{h.amount > 0 ? `+${h.amount}` : h.amount}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
    gap: spacing.md,
  },
  stage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: '#F3E9D2',
  },
  stageSide: {
    flex: 1,
    gap: spacing.sm,
  },
  tryingOn: {
    ...type.label,
    color: colors.inkMuted,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tab: {
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.round,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  tabOn: {
    backgroundColor: colors.midnight,
    borderColor: colors.midnight,
  },
  tabText: {
    ...type.label,
    color: colors.ink,
  },
  tabTextOn: {
    color: colors.parchment,
  },
  detail: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.storybookGold,
    backgroundColor: colors.white,
  },
  detailTitle: {
    ...type.heading,
    color: colors.midnight,
  },
  detailBody: {
    ...type.body,
    color: colors.ink,
  },
  detailStory: {
    ...type.label,
    fontStyle: 'italic',
    color: colors.inkMuted,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  hint: {
    ...type.label,
    color: colors.fernText,
    flex: 1,
  },
  state: {
    ...type.bodyStrong,
    color: colors.fernText,
  },
  locked: {
    ...type.label,
    color: colors.inkMuted,
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: '31%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 2,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  tileOn: {
    borderColor: colors.storybookGold,
  },
  tileWearing: {
    backgroundColor: '#F6EED9',
  },
  tileName: {
    ...type.caption,
    color: colors.ink,
    textAlign: 'center',
    minHeight: 32,
  },
  tileState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  tileStateText: {
    ...type.caption,
    color: colors.inkMuted,
  },
  wearingText: {
    color: colors.fernText,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    ...type.heading,
    color: colors.midnight,
  },
  howRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  howText: {
    ...type.body,
    color: colors.ink,
    flex: 1,
  },
  note: {
    ...type.label,
    color: colors.inkMuted,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amount: {
    ...type.bodyStrong,
    color: colors.fernText,
  },
  spent: {
    color: colors.inkMuted,
  },
});
