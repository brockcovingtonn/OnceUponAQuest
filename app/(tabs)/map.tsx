import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { StateView } from '@/components/StateView';
import { ParkMap } from '@/components/ParkMap';
import { type StoryMapStamp, StoryMap } from '@/components/StoryMap';
import { PARK_LANDS } from '@/art/parkMap';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { getCurrentCoords, getLocationPermission, requestLocationPermission } from '@/lib/location';
import {
  PARK_REGION,
  parkPlaceholderPoint,
  placeholderPoint,
  STREET_REGION,
  toMapPoint,
  toParkPoint,
} from '@/lib/mapGeometry';
import { useIsOnline } from '@/lib/network';
import { useParadeMode } from '@/lib/paradeMode';
import { type MapSpot, useMapSpots, useMyProgress } from '@/lib/queries';
import { colors, fonts, minTouchTarget, radius, spacing, type } from '@/theme';

type MapStyle = 'storybook' | 'real';
const ALL = 'all';
const PARK = 'park';
const STREET_LAND = 'dlp-main-street';

type Chip = { id: string; label: string };

export default function MapScreen() {
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const spots = useMapSpots();
  const progress = useMyProgress(session?.user.id);
  const { paradeMode } = useParadeMode();
  const online = useIsOnline();
  const [view, setView] = useState<MapStyle>('storybook');
  const [chosenLand, setChosenLand] = useState<string | null>(null);
  const [chosenQuest, setChosenQuest] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateMessage, setLocateMessage] = useState<string>();
  const [showUserOnRealMap, setShowUserOnRealMap] = useState(false);

  const { lands, quests } = useMemo(() => {
    const landMap = new Map<string, MapSpot['land']>();
    const questMap = new Map<string, MapSpot['quest'] & { landId: string }>();
    for (const s of spots.data ?? []) {
      landMap.set(s.land.id, s.land);
      questMap.set(s.quest.id, { ...s.quest, landId: s.land.id });
    }
    return {
      lands: [...landMap.values()].sort((a, b) => a.order - b.order),
      quests: [...questMap.values()].sort((a, b) => a.order - b.order),
    };
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

  const questFound = (questId: string) => all.filter((s) => s.quest.id === questId && foundSpots.has(s.id)).length;
  const questTotal = (questId: string) => all.filter((s) => s.quest.id === questId).length;
  const inProgress = (q: { id: string }) => questFound(q.id) > 0 && questFound(q.id) < questTotal(q.id);

  // Open on the land of the quest you're partway through, else the whole park.
  const landId = chosenLand ?? quests.find(inProgress)?.landId ?? PARK;
  const landQuests = quests.filter((q) => q.landId === landId);
  // Within a land: the chosen quest, else the one you're partway through, else the first not finished.
  const questId =
    landId === PARK
      ? ALL
      : ((chosenQuest && landQuests.some((q) => q.id === chosenQuest) ? chosenQuest : null) ??
        landQuests.find(inProgress)?.id ??
        landQuests.find((q) => questFound(q.id) < questTotal(q.id))?.id ??
        ALL);
  const inLand = landId === PARK ? [] : all.filter((s) => s.land.id === landId);
  const shown = questId === ALL ? inLand : inLand.filter((s) => s.quest.id === questId);
  const onStreet = landId === STREET_LAND;
  const parkLand = PARK_LANDS.find((l) => l.id === landId) ?? null;
  const me = myCoords ? (onStreet ? toMapPoint(myCoords.lat, myCoords.lng) : toParkPoint(myCoords.lat, myCoords.lng)) : null;

  const stateOf = (s: MapSpot): StoryMapStamp['state'] =>
    foundSpots.has(s.id) ? 'found' : paradeMode && s.pauseDuringParades ? 'paused' : 'open';
  const nameOf = (s: MapSpot) => (foundSpots.has(s.id) ? s.title : s.teaser);

  const stamps: StoryMapStamp[] = shown.map((s) => {
    const qIndex = landQuests.findIndex((q) => q.id === s.quest.id);
    const hasPin = s.lat !== null && s.lng !== null;
    const pinned = hasPin ? (onStreet ? toMapPoint(s.lat ?? 0, s.lng ?? 0) : toParkPoint(s.lat ?? 0, s.lng ?? 0)) : null;
    return {
      id: s.id,
      order: s.order,
      name: nameOf(s),
      point:
        pinned ??
        (onStreet
          ? placeholderPoint(qIndex, s.order, questTotal(s.quest.id))
          : parkPlaceholderPoint(landId, qIndex, s.order, questTotal(s.quest.id))),
      state: stateOf(s),
      selected: s.id === selectedId,
    };
  });
  const medallions = lands.map((l) => {
    const inThisLand = all.filter((s) => s.land.id === l.id);
    return { landId: l.id, name: l.name, found: inThisLand.filter((s) => foundSpots.has(s.id)).length, total: inThisLand.length };
  });
  const anyApproximate = shown.some((s) => s.lat === null || s.lng === null);
  const pinnedShown = (landId === PARK ? all : shown).filter((s) => s.lat !== null && s.lng !== null);

  const landChips: Chip[] = [{ id: PARK, label: copy.map.wholePark }, ...lands.map((l) => ({ id: l.id, label: l.name }))];
  const questChips: Chip[] =
    landId === PARK ? [] : [...landQuests.map((q) => ({ id: q.id, label: q.title })), { id: ALL, label: copy.map.allInLand }];
  const selected = all.find((s) => s.id === selectedId) ?? null;

  async function locate() {
    if (myCoords) {
      setMyCoords(null);
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
      const point = onStreet ? toMapPoint(coords.lat, coords.lng) : toParkPoint(coords.lat, coords.lng);
      setMyCoords(coords);
      if (!point) setLocateMessage(onStreet ? copy.map.notOnStreet : copy.map.notOnMap);
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

      <ChipRow
        label={copy.map.landsLabel}
        chips={landChips}
        activeId={landId}
        onPick={(id) => {
          setChosenLand(id);
          setChosenQuest(null);
          setSelectedId(null);
          setLocateMessage(undefined);
        }}
      />
      {questChips.length > 0 ? (
        <ChipRow
          label={copy.map.questsLabel}
          chips={questChips}
          activeId={questId}
          small
          onPick={(id) => {
            setChosenQuest(id);
            setSelectedId(null);
          }}
        />
      ) : null}

      {view === 'storybook' ? (
        <ScrollView contentContainerStyle={styles.mapContent}>
          {landId === PARK ? (
            <Text style={styles.note}>{copy.map.parkIntro}</Text>
          ) : (
            <View style={styles.noteRow}>
              <Pressable
                onPress={() => {
                  setChosenLand(PARK);
                  setSelectedId(null);
                }}
                accessibilityRole="button"
                accessibilityLabel={copy.map.backToPark}
                hitSlop={8}
                style={({ pressed }) => [styles.backToPark, pressed && styles.pressed]}>
                <Ionicons name="map-outline" size={16} color={colors.midnight} />
                <Text style={styles.backToParkText}>{copy.map.backToPark}</Text>
              </Pressable>
              {anyApproximate ? <Text style={styles.note}>{copy.map.approximate}</Text> : null}
            </View>
          )}
          {onStreet ? (
            <StoryMap
              width={width - spacing.lg * 2}
              stamps={stamps}
              showRoute={questId !== ALL}
              me={me}
              onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
            />
          ) : (
            <ParkMap
              width={width - spacing.lg * 2}
              land={landId === PARK ? null : parkLand}
              lands={PARK_LANDS}
              medallions={medallions}
              stamps={stamps}
              showRoute={questId !== ALL}
              me={me}
              onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
              onSelectLand={(id) => {
                setChosenLand(id);
                setChosenQuest(null);
                setSelectedId(null);
              }}
            />
          )}
          <Button
            variant="secondary"
            label={myCoords ? copy.map.hideMe : copy.map.locateMe}
            onPress={locate}
            loading={locating}
          />
          {locateMessage ? <Banner tone="info" message={locateMessage} /> : null}
        </ScrollView>
      ) : (
        <View style={styles.realWrap}>
          <MapView
            key={onStreet ? 'street' : 'park'}
            style={StyleSheet.absoluteFill}
            initialRegion={onStreet ? STREET_REGION : PARK_REGION}
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

function ChipRow({
  label,
  chips,
  activeId,
  small = false,
  onPick,
}: {
  label: string;
  chips: Chip[];
  activeId: string;
  small?: boolean;
  onPick: (id: string) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const chipBox = useRef(new Map<string, { x: number; w: number }>());
  const scrollX = useRef(0);
  const viewW = useRef(0);
  // Bring the active chip into view if it's off screen (e.g. after tapping a land on the map).
  useEffect(() => {
    const box = chipBox.current.get(activeId);
    if (!box || !viewW.current) return;
    if (box.x < scrollX.current || box.x + box.w > scrollX.current + viewW.current) {
      scrollRef.current?.scrollTo({ x: Math.max(0, box.x - spacing.lg), animated: true });
    }
  }, [activeId]);
  return (
    <ScrollView
      ref={scrollRef}
      onLayout={(e) => (viewW.current = e.nativeEvent.layout.width)}
      onScroll={(e) => (scrollX.current = e.nativeEvent.contentOffset.x)}
      scrollEventThrottle={64}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.chips, small && styles.chipsSmall]}
      style={styles.chipBar}
      accessibilityLabel={label}>
      {chips.map((chip) => {
        const active = chip.id === activeId;
        return (
          <Pressable
            key={chip.id}
            onPress={() => onPick(chip.id)}
            onLayout={(e) => chipBox.current.set(chip.id, { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width })}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={chip.label}
            style={[styles.chip, small && styles.chipSmall, active && (small ? styles.chipActiveSmall : styles.chipActive)]}>
            <Text style={[styles.chipText, active && styles.chipTextActive, active && !small && styles.chipTextOnDark]}>
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  chipsSmall: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
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
  chipSmall: {
    borderStyle: 'dashed',
  },
  chipActive: {
    backgroundColor: colors.midnight,
    borderColor: colors.midnight,
  },
  chipActiveSmall: {
    backgroundColor: colors.storybookGold,
    borderColor: colors.storybookGold,
    borderStyle: 'solid',
  },
  chipText: {
    ...type.label,
    color: colors.ink,
  },
  chipTextActive: {
    fontFamily: fonts.bodySemiBold,
    color: colors.midnight,
  },
  chipTextOnDark: {
    color: colors.parchment,
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
  noteRow: {
    gap: spacing.xs,
  },
  backToPark: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    minHeight: minTouchTarget - 12,
  },
  backToParkText: {
    ...type.label,
    fontFamily: fonts.bodySemiBold,
    color: colors.midnight,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.7,
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
