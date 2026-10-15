import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Line, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { sceneForLand } from '@/art/scenes';
import { LensStamp } from '@/components/LensStamp';
import { Scene } from '@/components/Scene';
import { Twinkle } from '@/components/Twinkle';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { useFeedback } from '@/lib/feedback';
import { bearingDegrees, type Landmark, relativeAngle, useLandmarks, useMyLensStamps } from '@/lib/landmarks';
import { distanceMeters, getLocationPermission, openAppSettings, requestLocationPermission } from '@/lib/location';
import { approxLandmarkCoords } from '@/lib/mapGeometry';
import { useHeading, useLivePosition as usePosition } from '@/lib/useLiveLocation';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, fonts, minTouchTarget, radius, spacing, type } from '@/theme';

type Mode = 'point' | 'browse';

/** Landmarks farther than this aren't shown in Point mode. */
const NEARBY_M = 500;
/** Horizontal field of view, in degrees, for placing cards over the camera. */
const FOV = 50;
const MAX_FLOATING = 3;

export default function LensScreen() {
  const params = useLocalSearchParams<{ land?: string }>();
  const { width, height } = useWindowDimensions();
  const { session } = useAuth();
  const landmarks = useLandmarks();
  const stamps = useMyLensStamps(session?.user.id);
  const fx = useFeedback();
  const reduced = useReducedMotion();
  const [cameraPermission, requestCamera] = useCameraPermissions();
  const [locationOk, setLocationOk] = useState(false);
  const [focused, setFocused] = useState(true);
  const [chosenMode, setChosenMode] = useState<Mode | null>(null);
  const [chosenLand, setChosenLand] = useState<string | null>(params.land ?? null);
  const heading = useHeading(locationOk && focused);
  const position = usePosition(locationOk && focused);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  // Ask for the camera and location once, in context: the explorer just opened the lens.
  useEffect(() => {
    if (cameraPermission && !cameraPermission.granted && cameraPermission.canAskAgain) requestCamera();
  }, [cameraPermission, requestCamera]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const status = await getLocationPermission();
      const ok = status === 'granted' || (status === 'undetermined' && (await requestLocationPermission()));
      if (!cancelled) setLocationOk(ok);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const all = useMemo(() => landmarks.data ?? [], [landmarks.data]);
  const lands = useMemo(() => {
    const seen = new Map<string, Landmark['land']>();
    for (const l of all) seen.set(l.land.id, l.land);
    return [...seen.values()];
  }, [all]);

  const nearby = useMemo(() => {
    if (!position) return [];
    return all
      .map((l) => ({ l, to: l.lat !== null && l.lng !== null ? { lat: l.lat, lng: l.lng } : approxLandmarkCoords(l.slug) }))
      .filter((x): x is { l: Landmark; to: { lat: number; lng: number } } => x.to !== null)
      .map(({ l, to }) => {
        return { landmark: l, distance: distanceMeters(position, to), bearing: bearingDegrees(position, to) };
      })
      .filter((n) => n.distance <= NEARBY_M)
      .sort((a, b) => a.distance - b.distance);
  }, [all, position]);

  const canPoint = heading !== null && nearby.length > 0;
  const mode: Mode = chosenMode === 'point' && canPoint ? 'point' : chosenMode === 'browse' ? 'browse' : canPoint ? 'point' : 'browse';
  // Browse defaults to the land you're closest to, else the one you came from on the map, else the first.
  const land = chosenLand ?? nearby[0]?.landmark.land.id ?? lands[0]?.id ?? null;
  const inLand = all.filter((l) => l.land.id === land);
  const cameraOn = Boolean(cameraPermission?.granted);

  const open = (l: Landmark) => {
    fx.tap();
    router.push({ pathname: '/landmark/[slug]', params: { slug: l.slug } });
  };

  // Point mode: what's in front of you, and the nearest thing just out of view on each side.
  const ahead = canPoint && heading !== null
    ? nearby
        .map((n) => ({ ...n, rel: relativeAngle(n.bearing, heading) }))
        .filter((n) => Math.abs(n.rel) <= FOV / 2)
        .slice(0, MAX_FLOATING)
    : [];
  const sideHint = (side: 'left' | 'right') =>
    canPoint && heading !== null
      ? nearby
          .map((n) => ({ ...n, rel: relativeAngle(n.bearing, heading) }))
          .find((n) => (side === 'left' ? n.rel < -FOV / 2 : n.rel > FOV / 2))
      : undefined;
  const left = sideHint('left');
  const right = sideHint('right');

  const note =
    mode === 'browse'
      ? !cameraOn && cameraPermission && !cameraPermission.canAskAgain
        ? copy.lens.cameraOff
        : locationOk && position && heading === null
          ? copy.lens.noCompass
          : position && nearby.length === 0
            ? copy.lens.pinnedNone
            : copy.lens.browseHint
      : ahead.length === 0
        ? copy.lens.nothingAhead
        : copy.lens.pointHint;

  return (
    <View style={styles.root}>
      {/* What you see through the lens: the camera, or a storybook scene when the camera is off. */}
      {cameraOn ? (
        <CameraView style={StyleSheet.absoluteFill} facing="back" active={focused} animateShutter={false} />
      ) : (
        <View style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Scene shapes={sceneForLand(land)} height={height} />
          <View style={[StyleSheet.absoluteFill, styles.dim]} />
        </View>
      )}

      <LensFrame width={width} height={height} heading={mode === 'point' ? heading : null} />
      {!reduced ? (
        <>
          <Twinkle size={12} delay={0} style={{ top: height * 0.22, left: width * 0.12 }} />
          <Twinkle size={9} delay={700} style={{ top: height * 0.3, right: width * 0.1 }} color={colors.parchment} />
          <Twinkle size={10} delay={1300} style={{ top: height * 0.62, left: width * 0.18 }} />
        </>
      ) : null}

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom', 'left', 'right']} pointerEvents="box-none">
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={copy.lens.close}
            hitSlop={8}
            style={styles.roundButton}>
            <Ionicons name="close" size={24} color={colors.parchment} />
          </Pressable>
          <Text style={styles.title} accessibilityRole="header">
            {copy.lens.name}
          </Text>
          <View style={styles.segmented} accessibilityRole="tablist" accessibilityLabel={copy.lens.modeLabel}>
            {(['point', 'browse'] as const).map((m) => {
              const active = mode === m;
              const disabled = m === 'point' && !canPoint;
              return (
                <Pressable
                  key={m}
                  onPress={() => setChosenMode(m)}
                  disabled={disabled}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active, disabled }}
                  accessibilityLabel={m === 'point' ? copy.lens.modePoint : copy.lens.modeBrowse}
                  style={[styles.segment, active && styles.segmentActive, disabled && styles.segmentDisabled]}>
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {m === 'point' ? copy.lens.modePoint : copy.lens.modeBrowse}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.notePill} accessibilityLiveRegion="polite">
          <Text style={styles.noteText}>{landmarks.isPending ? copy.lens.findingYou : note}</Text>
        </View>
        {!cameraOn && cameraPermission && !cameraPermission.canAskAgain ? (
          <Pressable onPress={openAppSettings} accessibilityRole="button" style={styles.linkButton}>
            <Text style={styles.linkText}>{copy.lens.turnOnCamera}</Text>
          </Pressable>
        ) : null}

        {mode === 'point' ? (
          <View style={styles.pointArea} pointerEvents="box-none">
            {ahead.map((n, i) => {
              const x = width / 2 + (n.rel / (FOV / 2)) * (width / 2 - 100);
              return (
                <Pressable
                  key={n.landmark.id}
                  onPress={() => open(n.landmark)}
                  accessibilityRole="button"
                  accessibilityLabel={copy.lens.cardLabel(n.landmark.title, n.landmark.teaser)}
                  style={[styles.floatCard, { left: Math.max(spacing.md, Math.min(width - 200 - spacing.md, x - 100)), top: 40 + i * 104 }]}>
                  <Text style={styles.floatFacing}>{i === 0 ? copy.lens.facing : copy.lens.distance(n.distance)}</Text>
                  <Text style={styles.floatTitle} numberOfLines={2}>
                    {n.landmark.title}
                  </Text>
                  <Text style={styles.floatTeaser} numberOfLines={1}>
                    {i === 0 ? copy.lens.distance(n.distance) : n.landmark.teaser}
                  </Text>
                </Pressable>
              );
            })}
            {left ? (
              <Pressable
                onPress={() => open(left.landmark)}
                accessibilityRole="button"
                accessibilityLabel={copy.lens.toLeft(left.landmark.title)}
                style={[styles.edgeHint, styles.edgeLeft]}>
                <Ionicons name="chevron-back" size={18} color={colors.midnight} />
                <Text style={styles.edgeText} numberOfLines={1}>
                  {left.landmark.title}
                </Text>
              </Pressable>
            ) : null}
            {right ? (
              <Pressable
                onPress={() => open(right.landmark)}
                accessibilityRole="button"
                accessibilityLabel={copy.lens.toRight(right.landmark.title)}
                style={[styles.edgeHint, styles.edgeRight]}>
                <Text style={styles.edgeText} numberOfLines={1}>
                  {right.landmark.title}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.midnight} />
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.browseArea} pointerEvents="box-none">
            <Text style={styles.whichLand}>{copy.lens.whichLand}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.noGrow}
              contentContainerStyle={styles.chips}>
              {lands.map((l) => {
                const active = l.id === land;
                return (
                  <Pressable
                    key={l.id}
                    onPress={() => {
                      fx.tap();
                      setChosenLand(l.id);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={l.name}
                    style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{l.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <FlatList
              key={land ?? 'none'}
              data={inLand}
              horizontal
              style={styles.noGrow}
              showsHorizontalScrollIndicator={false}
              snapToInterval={width - 56 + spacing.sm}
              decelerationRate="fast"
              contentContainerStyle={styles.cards}
              keyExtractor={(l) => l.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => open(item)}
                  accessibilityRole="button"
                  accessibilityLabel={copy.lens.cardLabel(item.title, item.teaser)}
                  style={({ pressed }) => [styles.card, { width: width - 56 }, pressed && styles.pressed]}>
                  <View style={styles.cardTop}>
                    <LensStamp stamped={Boolean(stamps.data?.has(item.id))} size={44} />
                    <View style={styles.cardHeading}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.cardTeaser} numberOfLines={2}>
                        {item.teaser}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardLookFor} numberOfLines={3}>
                    <Text style={styles.cardLookForLabel}>{copy.lens.lookFor} </Text>
                    {item.lookFor}
                  </Text>
                  <View style={styles.cardAction}>
                    <Text style={styles.cardActionText}>{copy.lens.readStory}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.midnight} />
                  </View>
                </Pressable>
              )}
            />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

/** Decorative brass lens: a soft vignette and a compass bezel that turns with you in Point mode. */
function LensFrame({ width, height, heading }: { width: number; height: number; heading: number | null }) {
  const r = Math.min(width, height) * 0.46;
  const cx = width / 2;
  const cy = height * 0.42;
  const ticks = Array.from({ length: 36 }, (_, i) => i * 10);
  const rot = heading ?? 0;
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Defs>
        <RadialGradient id="vignette" cx={cx} cy={cy} r={Math.max(width, height) * 0.75} gradientUnits="userSpaceOnUse">
          <Stop offset="0.45" stopColor={colors.midnight} stopOpacity={0} />
          <Stop offset="1" stopColor={colors.midnight} stopOpacity={0.75} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#vignette)" />
      <Circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={colors.storybookGold} strokeOpacity={0.35} strokeWidth={10} />
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.storybookGold} strokeOpacity={0.9} strokeWidth={2} />
      {ticks.map((deg) => {
        const a = ((deg - rot - 90) * Math.PI) / 180;
        const long = deg % 90 === 0;
        const r1 = r - (long ? 14 : 7);
        return (
          <Line
            key={deg}
            x1={cx + r1 * Math.cos(a)}
            y1={cy + r1 * Math.sin(a)}
            x2={cx + r * Math.cos(a)}
            y2={cy + r * Math.sin(a)}
            stroke={colors.storybookGold}
            strokeOpacity={0.85}
            strokeWidth={long ? 2.5 : 1.2}
          />
        );
      })}
      {heading !== null
        ? (['N', 'E', 'S', 'W'] as const).map((label, i) => {
            const a = ((i * 90 - rot - 90) * Math.PI) / 180;
            return (
              <SvgText
                key={label}
                x={cx + (r - 26) * Math.cos(a)}
                y={cy + (r - 26) * Math.sin(a) + 5}
                fill={colors.storybookGold}
                fontSize={14}
                fontWeight="bold"
                textAnchor="middle">
                {label}
              </SvgText>
            );
          })
        : null}
      <Circle cx={cx} cy={cy} r={4} fill={colors.storybookGold} />
      <Line x1={cx - 14} y1={cy} x2={cx - 7} y2={cy} stroke={colors.storybookGold} strokeWidth={1.5} />
      <Line x1={cx + 7} y1={cy} x2={cx + 14} y2={cy} stroke={colors.storybookGold} strokeWidth={1.5} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.midnight,
  },
  dim: {
    backgroundColor: 'rgba(27, 35, 64, 0.35)',
  },
  overlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  roundButton: {
    width: minTouchTarget,
    height: minTouchTarget,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27, 35, 64, 0.7)',
  },
  title: {
    ...type.heading,
    flex: 1,
    color: colors.parchment,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: radius.round,
    borderWidth: 1.5,
    borderColor: colors.storybookGold,
    overflow: 'hidden',
    backgroundColor: 'rgba(27, 35, 64, 0.7)',
  },
  segment: {
    minHeight: minTouchTarget - 6,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.storybookGold,
  },
  segmentDisabled: {
    opacity: 0.45,
  },
  segmentText: {
    ...type.label,
    fontFamily: fonts.bodySemiBold,
    color: colors.parchment,
  },
  segmentTextActive: {
    color: colors.midnight,
  },
  notePill: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.round,
    backgroundColor: 'rgba(27, 35, 64, 0.8)',
  },
  noteText: {
    ...type.label,
    color: colors.parchment,
    textAlign: 'center',
  },
  linkButton: {
    alignSelf: 'center',
    minHeight: minTouchTarget,
    justifyContent: 'center',
  },
  linkText: {
    ...type.bodyStrong,
    color: colors.storybookGold,
    textDecorationLine: 'underline',
  },
  pointArea: {
    flex: 1,
  },
  floatCard: {
    position: 'absolute',
    width: 200,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.storybookGold,
    backgroundColor: 'rgba(250, 245, 234, 0.95)',
    shadowColor: colors.midnight,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  floatFacing: {
    ...type.caption,
    color: colors.inkMuted,
    letterSpacing: 1,
  },
  floatTitle: {
    ...type.bodyStrong,
    color: colors.midnight,
  },
  floatTeaser: {
    ...type.caption,
    color: colors.ink,
  },
  edgeHint: {
    position: 'absolute',
    bottom: spacing.xl,
    maxWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: colors.storybookGold,
  },
  edgeLeft: {
    left: spacing.md,
  },
  edgeRight: {
    right: spacing.md,
  },
  edgeText: {
    ...type.label,
    fontFamily: fonts.bodySemiBold,
    color: colors.midnight,
    flexShrink: 1,
  },
  browseArea: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  whichLand: {
    ...type.label,
    color: colors.parchment,
    paddingHorizontal: spacing.lg,
    letterSpacing: 1,
  },
  noGrow: {
    flexGrow: 0,
  },
  chips: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  chip: {
    minHeight: minTouchTarget - 6,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.round,
    borderWidth: 1.5,
    borderColor: colors.storybookGold,
    backgroundColor: 'rgba(27, 35, 64, 0.75)',
  },
  chipActive: {
    backgroundColor: colors.storybookGold,
  },
  chipText: {
    ...type.label,
    color: colors.parchment,
  },
  chipTextActive: {
    fontFamily: fonts.bodySemiBold,
    color: colors.midnight,
  },
  cards: {
    gap: spacing.sm,
    paddingHorizontal: 28,
    alignItems: 'flex-end',
  },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.storybookGold,
    backgroundColor: colors.parchment,
  },
  pressed: {
    opacity: 0.85,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardHeading: {
    flex: 1,
  },
  cardTitle: {
    ...type.heading,
    color: colors.midnight,
  },
  cardTeaser: {
    ...type.label,
    color: colors.ink,
    fontStyle: 'italic',
  },
  cardLookFor: {
    ...type.label,
    color: colors.ink,
  },
  cardLookForLabel: {
    fontFamily: fonts.bodySemiBold,
    color: colors.midnight,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: spacing.xs,
  },
  cardActionText: {
    ...type.bodyStrong,
    color: colors.midnight,
  },
});
