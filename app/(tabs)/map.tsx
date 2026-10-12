import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { StateView } from '@/components/StateView';
import { type StoryMapStamp, StoryMap } from '@/components/StoryMap';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { getCurrentCoords, getLocationPermission, requestLocationPermission } from '@/lib/location';
import { type MapPoint, placeholderPoint, STREET_REGION, toMapPoint } from '@/lib/mapGeometry';
import { useIsOnline } from '@/lib/network';
import { useParadeMode } from '@/lib/paradeMode';
import { type MapSpot, useMapSpots, useMyProgress } from '@/lib/queries';
import { colors, fonts, minTouchTarget, radius, spacing, type } from '@/theme';

type MapStyle = 'storybook' | 'real';
const ALL = 'all';

export default function MapScreen() {
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const spots = useMapSpots();
  const progress = useMyProgress(session?.user.id);
  const { paradeMode } = useParadeMode();
  const online = useIsOnline();
  const [view, setView] = useState<MapStyle>('storybook');
  const [chosenQuest, setChosenQuest] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [me, setMe] = useState<MapPoint | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateMessage, setLocateMessage] = useState<string>();
  const [showUserOnRealMap, setShowUserOnRealMap] = useState(false);

  const quests = useMemo(() => {
    const seen = new Map<string, MapSpot['quest']>();
    for (const s of spots.data ?? []) seen.set(s.quest.id, s.quest);
    return [...seen.values()].sort((a, b) => a.order - b.order);
  }, [spots.data]);

  if (spots.isPending || progress.isPending) return <StateView kind="loading" />;
  if (spots.isError || progress.isError) {
    return (
      <StateView
        kind="error"
        message={copy.map.loadError}
        onRetry={() => {
          spots.refetch();
          progress.refetch();
        }}
      />
    );
  }

  const { foundSpots } = progress.data;
  const all = spots.data;

  // Default to the quest you're partway through, else the first one not finished.
  const questFound = (questId: string) => all.filter((s) => s.quest.id === questId && foundSpots.has(s.id)).length;
  const questTotal = (questId: string) => all.filter((s) => s.quest.id === questId).length;
  const defaultQuest =
    quests.find((q) => questFound(q.id) > 0 && questFound(q.id) < questTotal(q.id))?.id ??
    quests.find((q) => questFound(q.id) < questTotal(q.id))?.id ??
    quests[0]?.id ??
    ALL;
  const questId = chosenQuest ?? defaultQuest;
  const shown = questId === ALL ? all : all.filter((s) => s.quest.id === questId);

  const stateOf = (s: MapSpot): StoryMapStamp['state'] =>
    foundSpots.has(s.id) ? 'found' : paradeMode && s.pauseDuringParades ? 'paused' : 'open';
  const nameOf = (s: MapSpot) => (foundSpots.has(s.id) ? s.title : s.teaser);

  const stamps: StoryMapStamp[] = shown.map((s) => {
    const qIndex = quests.findIndex((q) => q.id === s.quest.id);
    const pinned = s.lat !== null && s.lng !== null ? toMapPoint(s.lat, s.lng) : null;
    return {
      id: s.id,
      order: s.order,
      name: nameOf(s),
      point: pinned ?? placeholderPoint(qIndex, s.order, questTotal(s.quest.id)),
      state: stateOf(s),
      selected: s.id === selectedId,
    };
  });
  const anyApproximate = shown.some((s) => s.lat === null || s.lng === null);
  const pinnedShown = shown.filter((s) => s.lat !== null && s.lng !== null);
  const selected = all.find((s) => s.id === selectedId) ?? null;

  async function locate() {
    if (me) {
      setMe(null);
      return;
    }
    setLocateMessage(undefined);
    setLocating(true);
    try {
      if ((await getLocationPermission()) !== 'granted' && !(await requestLocationPermission())) {
        setLocateMessage(copy.location.off);
        return;
      }
      const coords = await getCurrentCoords();
      const point = toMapPoint(coords.lat, coords.lng);
      if (point) setMe(point);
      else setLocateMessage(copy.map.notOnStreet);
    } catch {
      setLocateMessage(copy.location.unavailable);
    } finally {
      setLocating(false);
    }
  }

  async function showMeOnRealMap() {
    if (showUserOnRealMap) {
      setShowUserOnRealMap(false);
      return;
    }
    if ((await getLocationPermission()) === 'granted' || (await requestLocationPermission())) setShowUserOnRealMap(true);
    else setLocateMessage(copy.location.off);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {copy.map.title}
        </Text>
        <View style={styles.segmented} accessibilityRole="tablist" accessibilityLabel={copy.map.viewLabel}>
          {(['storybook', 'real'] as const).map((v) => (
            <Pressable
              key={v}
              onPress={() => setView(v)}
              accessibilityRole="tab"
              accessibilityState={{ selected: view === v }}
              accessibilityLabel={v === 'storybook' ? copy.map.storybook : copy.map.real}
              style={[styles.segment, view === v && styles.segmentActive]}>
              <Text style={[styles.segmentText, view === v && styles.segmentTextActive]}>
                {v === 'storybook' ? copy.map.storybook : copy.map.real}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipBar}>
        {[...quests.map((q) => ({ id: q.id, label: q.title })), { id: ALL, label: copy.map.allSpots }].map((chip) => {
          const active = chip.id === questId;
          return (
            <Pressable
              key={chip.id}
              onPress={() => {
                setChosenQuest(chip.id);
                setSelectedId(null);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={chip.label}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {view === 'storybook' ? (
        <ScrollView contentContainerStyle={styles.mapContent}>
          {anyApproximate ? <Text style={styles.note}>{copy.map.approximate}</Text> : null}
          <StoryMap
            width={width - spacing.lg * 2}
            stamps={stamps}
            showRoute={questId !== ALL}
            me={me}
            onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
          />
          {pinnedShown.length > 0 ? (
            <Button
              variant="secondary"
              label={me ? copy.map.hideMe : copy.map.locateMe}
              onPress={locate}
              loading={locating}
            />
          ) : null}
          {locateMessage ? <Banner tone="info" message={locateMessage} /> : null}
        </ScrollView>
      ) : (
        <View style={styles.realWrap}>
          <MapView
            style={StyleSheet.absoluteFill}
            initialRegion={STREET_REGION}
            showsUserLocation={showUserOnRealMap}
            showsPointsOfInterests={false}
            showsCompass
            accessibilityLabel={copy.map.real}>
            {pinnedShown.map((s) => (
              <Marker
                key={s.id}
                coordinate={{ latitude: s.lat ?? 0, longitude: s.lng ?? 0 }}
                title={`${s.order} · ${nameOf(s)}`}
                description={s.quest.title}
                pinColor={foundSpots.has(s.id) ? colors.storybookGold : colors.midnight}
                onPress={() => setSelectedId(s.id)}
              />
            ))}
          </MapView>
          <View style={styles.realOverlay} pointerEvents="box-none">
            {pinnedShown.length === 0 ? <Banner tone="info" message={copy.map.noPins} /> : null}
            {!online ? <Banner tone="info" message={copy.map.tilesNeedSignal} /> : null}
            {locateMessage ? <Banner tone="info" message={locateMessage} /> : null}
            <Pressable
              onPress={showMeOnRealMap}
              accessibilityRole="button"
              accessibilityLabel={showUserOnRealMap ? copy.map.hideMe : copy.map.locateMe}
              style={styles.locateFab}>
              <Ionicons name={showUserOnRealMap ? 'navigate' : 'navigate-outline'} size={22} color={colors.midnight} />
            </Pressable>
          </View>
        </View>
      )}

      {selected ? (
        <View style={styles.card} accessibilityLiveRegion="polite">
          <View style={styles.cardText}>
            <Text style={styles.cardQuest}>{selected.quest.title}</Text>
            <Text style={styles.cardTitle}>{`${selected.order} · ${nameOf(selected)}`}</Text>
            <Text style={styles.cardState}>
              {stateOf(selected) === 'found' ? copy.map.found : stateOf(selected) === 'paused' ? copy.map.paused : copy.map.notFound}
            </Text>
          </View>
          <Button label={copy.map.openSpot} onPress={() => router.push({ pathname: '/spot/[id]', params: { id: selected.id } })} />
          <Pressable
            onPress={() => setSelectedId(null)}
            accessibilityRole="button"
            accessibilityLabel={copy.map.close}
            style={styles.cardClose}>
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  title: {
    ...type.title,
    color: colors.midnight,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: radius.round,
    borderWidth: 1.5,
    borderColor: colors.midnight,
    overflow: 'hidden',
  },
  segment: {
    minHeight: minTouchTarget - 6,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.midnight,
  },
  segmentText: {
    ...type.label,
    fontFamily: fonts.bodySemiBold,
    color: colors.midnight,
  },
  segmentTextActive: {
    color: colors.parchment,
  },
  chipBar: {
    flexGrow: 0,
  },
  chips: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  chip: {
    minHeight: minTouchTarget - 6,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.round,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: {
    backgroundColor: colors.storybookGold,
    borderColor: colors.storybookGold,
  },
  chipText: {
    ...type.label,
    color: colors.ink,
  },
  chipTextActive: {
    fontFamily: fonts.bodySemiBold,
    color: colors.midnight,
  },
  mapContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 140,
    gap: spacing.md,
  },
  note: {
    ...type.caption,
    color: colors.inkMuted,
  },
  realWrap: {
    flex: 1,
  },
  realOverlay: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  locateFab: {
    alignSelf: 'flex-end',
    width: minTouchTarget + 4,
    height: minTouchTarget + 4,
    borderRadius: radius.round,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.midnight,
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  card: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    paddingRight: spacing.xl + spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.storybookGold,
    shadowColor: colors.midnight,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  cardText: {
    flex: 1,
  },
  cardQuest: {
    ...type.caption,
    color: colors.inkMuted,
  },
  cardTitle: {
    ...type.bodyStrong,
    color: colors.midnight,
  },
  cardState: {
    ...type.label,
    color: colors.ink,
  },
  cardClose: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
