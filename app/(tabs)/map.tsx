import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { parseLook } from '@/art/avatar';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { StateView } from '@/components/StateView';
import { LensButton } from '@/components/LensButton';
import type { StoryMapStamp, StoryMarkerData } from '@/components/MapMarkers';
import { ParkMap } from '@/components/ParkMap';
import { ZoomableCanvas } from '@/components/ZoomableCanvas';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { useLandmarks, useMyLensStamps } from '@/lib/landmarks';
import { getLocationPermission, requestLocationPermission } from '@/lib/location';
import { approxLandmarkCoords, parkPlaceholderPoint, parkRegion, regionForView, toParkPoint } from '@/lib/mapGeometry';
import { PARK_IDS, PARK_MAPS, parkOfLand } from '@/lib/parks';
import { usePreferences } from '@/lib/preferences';
import { useIsOnline } from '@/lib/network';
import { useParadeMode } from '@/lib/paradeMode';
import { type MapSpot, useMapSpots, useMyProgress, useProfile } from '@/lib/queries';
import { useHeading, useLivePosition } from '@/lib/useLiveLocation';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, fonts, minTouchTarget, radius, spacing, type } from '@/theme';

type MapStyle = 'storybook' | 'real';
const ALL = 'all';
const PARK = 'park';
/** Pixels per map meter the storybook map is drawn at (crisp up to about this zoom). */
const RENDER_SCALE = 2.2;

type Chip = { id: string; label: string };

export default function MapScreen() {
  const { session } = useAuth();
  const reduced = useReducedMotion();
  const spots = useMapSpots();
  const progress = useMyProgress(session?.user.id);
  const { paradeMode } = useParadeMode();
  const online = useIsOnline();
  const [view, setView] = useState<MapStyle>('storybook');
  const [chosenLand, setChosenLand] = useState<string | null>(null);
  const [chosenQuest, setChosenQuest] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [storiesOn, setStoriesOn] = useState(true);
  const landmarks = useLandmarks();
  const lensStamps = useMyLensStamps(session?.user.id);
  // "Show me": your explorer follows you on the map (foreground only, and only while this tab is open).
  const [tracking, setTracking] = useState(false);
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  const live = useLivePosition(tracking && focused && view === 'storybook');
  const heading = useHeading(tracking && focused && view === 'storybook');
  const myCoords = tracking ? live : null;
  const locating = tracking && !live;
  const profile = useProfile(session?.user.id);
  const myLook = useMemo(() => parseLook(profile.data?.avatar), [profile.data?.avatar]);
  const [locateMessage, setLocateMessage] = useState<string>();
  const [showUserOnRealMap, setShowUserOnRealMap] = useState(false);

  // Which park: shared with the Quests tab and saved on the phone.
  const { park, setPreference } = usePreferences();
  const parkMap = PARK_MAPS[park];

  const { lands, quests } = useMemo(() => {
    const landMap = new Map<string, MapSpot['land']>();
    const questMap = new Map<string, MapSpot['quest'] & { landId: string }>();
    for (const s of spots.data ?? []) {
      if (s.land.parkId !== park) continue;
      landMap.set(s.land.id, s.land);
      questMap.set(s.quest.id, { ...s.quest, landId: s.land.id });
    }
    return {
      lands: [...landMap.values()].sort((a, b) => a.order - b.order),
      quests: [...questMap.values()].sort((a, b) => a.order - b.order),
    };
  }, [spots.data, park]);

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
  const all = spots.data.filter((s) => s.land.parkId === park);

  const questFound = (questId: string) => all.filter((s) => s.quest.id === questId && foundSpots.has(s.id)).length;
  const questTotal = (questId: string) => all.filter((s) => s.quest.id === questId).length;
  const inProgress = (q: { id: string }) => questFound(q.id) > 0 && questFound(q.id) < questTotal(q.id);

  // Open on the land of the quest you're partway through, else the whole park.
  const chosen = chosenLand === PARK || lands.some((l) => l.id === chosenLand) ? chosenLand : null;
  const landId = chosen ?? quests.find(inProgress)?.landId ?? PARK;
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
  const parkLand = parkMap.lands.find((l) => l.id === landId) ?? null;
  const focusView = parkLand?.view ?? { x: 0, y: 0, w: parkMap.canvas.width, h: parkMap.canvas.height };
  const me = myCoords ? toParkPoint(myCoords.lat, myCoords.lng, park) : null;

  const stateOf = (s: MapSpot): StoryMapStamp['state'] =>
    foundSpots.has(s.id) ? 'found' : paradeMode && s.pauseDuringParades ? 'paused' : 'open';
  const nameOf = (s: MapSpot) => (foundSpots.has(s.id) ? s.title : s.teaser);

  const stamps: StoryMapStamp[] = shown.map((s) => {
    const qIndex = landQuests.findIndex((q) => q.id === s.quest.id);
    const hasPin = s.lat !== null && s.lng !== null;
    const pinned = hasPin ? toParkPoint(s.lat ?? 0, s.lng ?? 0, park) : null;
    return {
      id: s.id,
      order: s.order,
      name: nameOf(s),
      point: pinned ?? parkPlaceholderPoint(landId, qIndex, s.order, questTotal(s.quest.id), park),
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

  // Storybook Lens landmarks in this land (pinned where they are, else at stand-in spots).
  const landStories = landId === PARK || !storiesOn ? [] : (landmarks.data ?? []).filter((l) => l.land.id === landId);
  const storyMarkers: StoryMarkerData[] = landStories.map((l) => {
    // Pinned on site, else its approximate real-world spot, else the middle of its land.
    const coords = l.lat !== null && l.lng !== null ? { lat: l.lat, lng: l.lng } : approxLandmarkCoords(l.slug);
    const pinned = coords ? toParkPoint(coords.lat, coords.lng, park) : null;
    return {
      id: l.id,
      title: l.title,
      point: pinned ?? parkLand?.label ?? { x: 0, y: 0 },
      stamped: Boolean(lensStamps.data?.has(l.id)),
      selected: l.id === selectedStoryId,
    };
  });
  const selectedStory = (landmarks.data ?? []).find((l) => l.id === selectedStoryId) ?? null;
  const pinnedStories = storiesOn
    ? (landmarks.data ?? []).filter(
        (l) => l.lat !== null && l.lng !== null && parkOfLand(l.land.id) === park && (landId === PARK || l.land.id === landId),
      )
    : [];
  const openLens = () => router.push({ pathname: '/lens', params: landId !== PARK ? { land: landId } : {} });
  const selectSpot = (id: string) => {
    setSelectedStoryId(null);
    setSelectedId(id === selectedId ? null : id);
  };
  const selectStory = (id: string) => {
    setSelectedId(null);
    setSelectedStoryId(id === selectedStoryId ? null : id);
  };

  async function locate() {
    if (tracking) {
      setTracking(false);
      return;
    }
    setLocateMessage(undefined);
    if ((await getLocationPermission()) !== 'granted' && !(await requestLocationPermission())) {
      setLocateMessage(copy.location.off);
      return;
    }
    setTracking(true);
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
        label={copy.parks.label}
        chips={PARK_IDS.map((id) => ({ id, label: copy.parks.names[id] }))}
        activeId={park}
        small
        onPick={(id) => {
          setPreference('park', id as typeof park);
          setChosenLand(null);
          setChosenQuest(null);
          setSelectedId(null);
          setSelectedStoryId(null);
          setLocateMessage(undefined);
        }}
      />
      <ChipRow
        label={copy.map.landsLabel}
        chips={landChips}
        activeId={landId}
        onPick={(id) => {
          setChosenLand(id);
          setChosenQuest(null);
          setSelectedId(null);
          setLocateMessage(undefined);
          setSelectedStoryId(null);
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

      <View style={styles.mapArea}>
        {view === 'storybook' ? (
          <ZoomableCanvas
            contentWidth={parkMap.canvas.width * RENDER_SCALE}
            contentHeight={parkMap.canvas.height * RENDER_SCALE}
            focus={{ x: focusView.x * RENDER_SCALE, y: focusView.y * RENDER_SCALE, w: focusView.w * RENDER_SCALE, h: focusView.h * RENDER_SCALE }}
            focusKey={`${park}:${landId}`}
            reduceMotion={reduced}>
            <ParkMap
              renderScale={RENDER_SCALE}
              land={landId === PARK ? null : parkLand}
              park={park}
              lands={parkMap.lands}
              medallions={medallions}
              stamps={stamps}
              showRoute={questId !== ALL}
              me={me}
              myLook={myLook}
              heading={heading}
              onSelect={selectSpot}
              stories={storyMarkers}
              onSelectStory={selectStory}
              onSelectLand={(id) => {
                setChosenLand(id);
                setChosenQuest(null);
                setSelectedId(null);
                setSelectedStoryId(null);
              }}
            />
          </ZoomableCanvas>
        ) : (
          <MapView
            key={`${park}:${landId}`}
            style={StyleSheet.absoluteFill}
            initialRegion={parkLand ? regionForView(parkLand.view, park) : parkRegion(park)}
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
                onPress={() => selectSpot(s.id)}
              />
            ))}
            {pinnedStories.map((l) => (
              <Marker
                key={l.id}
                coordinate={{ latitude: l.lat ?? 0, longitude: l.lng ?? 0 }}
                title={l.title}
                description={copy.lens.name}
                pinColor={colors.storybookGold}
                onPress={() => selectStory(l.id)}
              />
            ))}
          </MapView>
        )}

        {/* Floating controls over the map. */}
        <View style={styles.topOverlay} pointerEvents="box-none">
          <View style={styles.topRow} pointerEvents="box-none">
            {landId === PARK ? (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{view === 'storybook' ? copy.map.parkIntro : copy.map.real}</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  setChosenLand(PARK);
                  setSelectedId(null);
                  setSelectedStoryId(null);
                }}
                accessibilityRole="button"
                accessibilityLabel={copy.map.backToPark}
                hitSlop={6}
                style={({ pressed }) => [styles.pill, styles.pillButton, pressed && styles.pressed]}>
                <Ionicons name="chevron-back" size={16} color={colors.midnight} />
                <Text style={styles.pillButtonText}>{copy.map.wholePark}</Text>
              </Pressable>
            )}
            {landId !== PARK ? (
              <Pressable
                onPress={() => {
                  setStoriesOn((on) => !on);
                  setSelectedStoryId(null);
                }}
                accessibilityRole="switch"
                accessibilityState={{ checked: storiesOn }}
                accessibilityLabel={copy.lens.mapToggleLabel}
                hitSlop={6}
                style={[styles.pill, styles.pillButton, storiesOn && styles.pillOn]}>
                <Ionicons name="aperture-outline" size={14} color={colors.midnight} />
                <Text style={styles.pillButtonText}>{copy.lens.mapToggle}</Text>
              </Pressable>
            ) : null}
          </View>
          {view === 'storybook' && landId !== PARK && anyApproximate ? (
            <View style={[styles.pill, styles.notePill]}>
              <Text style={styles.noteText}>{copy.map.approximate}</Text>
            </View>
          ) : null}
          {view === 'real' && pinnedShown.length === 0 ? <Banner tone="info" message={copy.map.noPins} /> : null}
          {view === 'real' && !online ? <Banner tone="info" message={copy.map.tilesNeedSignal} /> : null}
          {locateMessage ? <Banner tone="info" message={locateMessage} /> : null}
          {view === 'storybook' && myCoords && !me ? <Banner tone="info" message={copy.map.notOnMap} /> : null}
        </View>

        {view === 'storybook' ? <Text style={styles.credit}>{copy.map.osmCredit}</Text> : null}

        {!selected && !selectedStory ? (
          <View style={styles.fabs} pointerEvents="box-none">
            <Pressable
              onPress={view === 'storybook' ? locate : showMeOnRealMap}
              accessibilityRole="button"
              accessibilityLabel={(view === 'storybook' ? tracking : showUserOnRealMap) ? copy.map.hideMe : copy.map.locateMe}
              accessibilityState={{ busy: locating }}
              style={({ pressed }) => [styles.locateFab, pressed && styles.pressed]}>
              <Ionicons
                name={(view === 'storybook' ? tracking : showUserOnRealMap) ? 'navigate' : 'navigate-outline'}
                size={22}
                color={colors.midnight}
              />
            </Pressable>
            <LensButton onPress={openLens} />
          </View>
        ) : null}

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
        ) : selectedStory ? (
          <View style={styles.card} accessibilityLiveRegion="polite">
            <View style={styles.cardText}>
              <Text style={styles.cardQuest}>{copy.lens.name}</Text>
              <Text style={styles.cardTitle}>{selectedStory.title}</Text>
              <Text style={styles.cardState}>{selectedStory.teaser}</Text>
            </View>
            <Button
              label={copy.lens.readStory}
              onPress={() => router.push({ pathname: '/landmark/[slug]', params: { slug: selectedStory.slug } })}
            />
            <Pressable
              onPress={() => setSelectedStoryId(null)}
              accessibilityRole="button"
              accessibilityLabel={copy.map.close}
              style={styles.cardClose}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>
        ) : null}
      </View>
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
  mapArea: {
    flex: 1,
    backgroundColor: '#F3E9D2',
  },
  topOverlay: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.md,
    right: spacing.md,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pill: {
    alignSelf: 'flex-start',
    flexShrink: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.round,
    backgroundColor: 'rgba(255, 253, 247, 0.94)',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.midnight,
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  pillText: {
    ...type.label,
    color: colors.ink,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: minTouchTarget - 8,
    borderColor: colors.storybookGold,
  },
  pillOn: {
    backgroundColor: colors.storybookGold,
  },
  pillButtonText: {
    ...type.label,
    fontFamily: fonts.bodySemiBold,
    color: colors.midnight,
  },
  notePill: {
    paddingVertical: 4,
  },
  noteText: {
    ...type.caption,
    color: colors.ink,
  },
  credit: {
    position: 'absolute',
    left: 8,
    bottom: 6,
    fontSize: 9,
    color: colors.ink,
    backgroundColor: 'rgba(250, 245, 234, 0.85)',
    paddingHorizontal: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fabs: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
  },
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
  pressed: {
    opacity: 0.7,
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
