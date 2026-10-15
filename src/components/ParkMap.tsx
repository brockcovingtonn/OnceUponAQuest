import Ionicons from '@expo/vector-icons/Ionicons';
import { type ReactNode, useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Polyline, Rect, SvgXml } from 'react-native-svg';

import { Artwork } from '@/art/Artwork';
import { lockedPalette } from '@/art/palettes';
import {
  PARK_BALLOON,
  PARK_CANVAS,
  PARK_FOUNTAIN,
  PARK_KEEP,
  PARK_TWINKLES,
  type ParkLand,
  parkMap,
  parkMapLabels,
  RIVERBOAT_PATH,
  ROCKET_SPINNER,
  TRAIN_PATH,
} from '@/art/parkMap';
import type { AvatarLook } from '@/art/avatar';
import { LANTERN_KEEP_BOX, lanternKeepSvg } from '@/art/lanternKeep';
import { MapStamp, ME_BOX, MeAvatar, MeDot, StoryMarker, type StoryMapStamp, type StoryMarkerData } from '@/components/MapMarkers';
import { CounterScaled } from '@/components/ZoomableCanvas';
import { Twinkle } from '@/components/Twinkle';
import { copy } from '@/copy';
import type { MapPoint } from '@/lib/mapGeometry';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, fonts } from '@/theme';

export type LandMedallion = { landId: string; name: string; found: number; total: number };

type Props = {
  /** Pixels per map meter to draw at (the zoomable canvas scales it from there). */
  renderScale: number;
  /** The chosen land, or null for the whole park (medallions instead of stamps). */
  land: ParkLand | null;
  lands: ParkLand[];
  medallions: LandMedallion[];
  stamps: StoryMapStamp[];
  showRoute: boolean;
  me: MapPoint | null;
  /** Your explorer, drawn at your position (a plain dot if you haven't made one). */
  myLook?: AvatarLook | null;
  /** Compass heading, for the arrow at your feet. */
  heading?: number | null;
  onSelect: (id: string) => void;
  onSelectLand: (landId: string) => void;
  stories?: StoryMarkerData[];
  onSelectStory?: (id: string) => void;
};

const MEDALLION_WIDTH = 100;
const MEDALLION_HEIGHT = 40;
/** Room for a stamp or story marker, including its larger selected size. */
const MARKER_BOX = 48;

/** Repeats 0 → 1 forever at a steady pace (still at 0 with Reduce Motion). */
function useCycle(durationMs: number, reduced: boolean) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: durationMs, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [durationMs, reduced, v]);
  return v;
}

/** Loops 0 → 1 → 0 forever (still at 0.5 with Reduce Motion). */
function useBob(durationMs: number, reduced: boolean) {
  const [v] = useState(() => new Animated.Value(0.5));
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: durationMs, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: durationMs, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [durationMs, reduced, v]);
  return v;
}

/** Heading in degrees along a path, unwrapped so it never spins the long way round. */
function headings(path: { x: number; y: number }[]): number[] {
  const out: number[] = [];
  let prev = 0;
  for (let i = 0; i < path.length; i++) {
    // The last point repeats the first, so it takes the first segment's heading.
    const last = i === path.length - 1;
    const a = last ? path[0] : path[i];
    const b = last ? path[1] : path[i + 1];
    let deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    if (i > 0) {
      while (deg - prev > 180) deg -= 360;
      while (deg - prev < -180) deg += 360;
    }
    out.push(deg);
    prev = deg;
  }
  return out;
}

/** A sprite that travels a closed path; `lag` (0–1) trails it behind the leader. */
function PathRider({
  progress,
  path,
  lag = 0,
  project,
  w,
  h,
  children,
}: {
  progress: Animated.Value;
  path: { x: number; y: number }[];
  lag?: number;
  project: (p: { x: number; y: number }) => { x: number; y: number };
  w: number;
  h: number;
  children: ReactNode;
}) {
  const [motion] = useState(() => {
    const n = path.length - 1;
    const shift = Math.round(lag * n);
    // Closed path: start `shift` samples behind the leader, wrapping round.
    const ring = path.slice(0, n);
    const pts = [...ring.slice(n - shift), ...ring.slice(0, n - shift)];
    pts.push(pts[0]);
    const projected = pts.map(project);
    const angles = headings(pts);
    const inputRange = pts.map((_, i) => i / n);
    return {
      x: progress.interpolate({ inputRange, outputRange: projected.map((p) => p.x - w / 2) }),
      y: progress.interpolate({ inputRange, outputRange: projected.map((p) => p.y - h / 2) }),
      rotate: progress.interpolate({ inputRange, outputRange: angles.map((d) => `${d.toFixed(1)}deg`) }),
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: w,
        height: h,
        transform: [{ translateX: motion.x }, { translateY: motion.y }, { rotate: motion.rotate }],
      }}>
      {children}
    </Animated.View>
  );
}

/**
 * The illustrated park map, drawn once at `renderScale` pixels per meter for
 * the zoomable canvas: a train circling the berm, a riverboat looping the
 * island, a spinning rocket ride, a bobbing balloon and twinkles. With no land
 * chosen it shows a progress medallion per land; with a land chosen it shows
 * that land's spot stamps and story markers. Markers keep their size at any zoom.
 */
export function ParkMap({ renderScale: R, land, lands, medallions, stamps, showRoute, me, myLook, heading = null, onSelect, onSelectLand, stories = [], onSelectStory }: Props) {
  const reduced = useReducedMotion();
  const width = PARK_CANVAS.width * R;
  const height = PARK_CANVAS.height * R;
  const project = (p: { x: number; y: number }) => ({ x: p.x * R, y: p.y * R });
  const train = useCycle(60000, reduced);
  const boat = useCycle(36000, reduced);
  const spin = useCycle(9000, reduced);
  const bob = useBob(2600, reduced);
  const shimmer = useBob(1400, reduced);
  const route = [...stamps].sort((a, b) => a.order - b.order);
  // Sprite sizes are in meters, so they grow and shrink with the map.
  const engine = { w: 16 * R, h: 9 * R };
  const car = { w: 13 * R, h: 8 * R };
  const riverboat = { w: 22 * R, h: 12 * R };
  const balloon = { w: 34 * R, h: 44 * R };
  const spinner = 26 * R;
  const fountain = project(PARK_FOUNTAIN);
  const balloonAt = project(PARK_BALLOON);
  const spinnerAt = project(ROCKET_SPINNER);

  return (
    <View style={{ width, height }}>
      <Artwork shapes={parkMap} palette={lockedPalette} size={width} canvas={PARK_CANVAS} />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.shimmer,
          {
            left: fountain.x - 10 * R,
            top: fountain.y - 10 * R,
            width: 20 * R,
            height: 20 * R,
            borderRadius: 10 * R,
            borderWidth: Math.max(1, R),
            opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.7] }),
            transform: [{ scale: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.25] }) }],
          },
        ]}
      />

      {/* Lantern Keep, our own castle, standing on the castle footprint. */}
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          left: (PARK_KEEP.x - PARK_KEEP.width / 2) * R,
          top: (PARK_KEEP.y - (PARK_KEEP.width * LANTERN_KEEP_BOX.height) / LANTERN_KEEP_BOX.width) * R,
        }}>
        <SvgXml
          xml={lanternKeepSvg}
          width={PARK_KEEP.width * R}
          height={((PARK_KEEP.width * LANTERN_KEEP_BOX.height) / LANTERN_KEEP_BOX.width) * R}
        />
      </View>

      {/* Rocket ride: arms spin around the hub. */}
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          left: spinnerAt.x - spinner / 2,
          top: spinnerAt.y - spinner / 2,
          width: spinner,
          height: spinner,
          transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
        }}>
        <Svg width={spinner} height={spinner} viewBox="-32 -32 64 64">
          <Path d="M-24 0 L24 0 M0 -24 L0 24" stroke={colors.storybookGold} strokeWidth={2} />
          {[
            [24, 0, 90],
            [-24, 0, -90],
            [0, 24, 180],
            [0, -24, 0],
          ].map(([x, y, r]) => (
            <Path
              key={`${x},${y}`}
              d="M0 -6 C3 -3 3 3 2 5 L-2 5 C-3 3 -3 -3 0 -6 Z"
              fill={colors.white}
              stroke={colors.midnight}
              strokeWidth={0.8}
              transform={`translate(${x} ${y}) rotate(${r})`}
            />
          ))}
          <Circle r={7} fill={colors.storybookGold} stroke={colors.midnight} strokeWidth={1} />
          <Circle r={2.5} fill={colors.rose} />
        </Svg>
      </Animated.View>

      {/* Riverboat looping the island. */}
      <PathRider progress={boat} path={RIVERBOAT_PATH} project={project} w={riverboat.w} h={riverboat.h}>
        <Svg width={riverboat.w} height={riverboat.h} viewBox="0 0 20 11">
          <Path d="M1 3 L16 3 L19 5.5 L16 8 L1 8 Z" fill={colors.white} stroke={colors.midnight} strokeWidth={0.8} />
          <Rect x={4} y={4} width={8} height={3} fill="#F6D58E" />
          <Rect x={0} y={2} width={2.5} height={7} rx={1} fill={colors.rose} />
          <Circle cx={9} cy={5.5} r={1.2} fill={colors.midnight} />
        </Svg>
      </PathRider>

      {/* Train: an engine and two cars on the berm. */}
      {[2, 1].map((k) => (
        <PathRider key={`car${k}`} progress={train} path={TRAIN_PATH} lag={k * 0.008} project={project} w={car.w} h={car.h}>
          <Svg width={car.w} height={car.h} viewBox="0 0 15 9">
            <Rect x={0.5} y={0.5} width={14} height={8} rx={2} fill={k === 1 ? '#F6D58E' : colors.rose} stroke={colors.midnight} strokeWidth={0.8} />
            <Rect x={3} y={2.5} width={9} height={4} rx={1} fill={colors.white} opacity={0.8} />
          </Svg>
        </PathRider>
      ))}
      <PathRider progress={train} path={TRAIN_PATH} project={project} w={engine.w} h={engine.h}>
        <Svg width={engine.w} height={engine.h} viewBox="0 0 18 10">
          <Rect x={0.5} y={0.5} width={17} height={9} rx={2.5} fill={colors.midnight} />
          <Rect x={1.5} y={2} width={6} height={6} rx={1} fill={colors.rose} />
          <Circle cx={14} cy={5} r={2} fill="#F6D58E" />
        </Svg>
      </PathRider>

      {/* Balloon drifting in the corner. */}
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          left: balloonAt.x - balloon.w / 2,
          top: balloonAt.y - balloon.h / 2,
          transform: [
            { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [-5 * R, 5 * R] }) },
            { rotate: bob.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] }) },
          ],
        }}>
        <Svg width={balloon.w} height={balloon.h} viewBox="-14 -18 28 36">
          <Path d="M0 -16 C11 -16 13 -4 7 4 L3 9 L-3 9 L-7 4 C-13 -4 -11 -16 0 -16 Z" fill="#7FA6E8" stroke={colors.midnight} strokeWidth={1} />
          <Path d="M0 -16 C4 -12 4 0 2 9 M0 -16 C-4 -12 -4 0 -2 9" fill="none" stroke={colors.parchment} strokeWidth={1} opacity={0.8} />
          <Path d="M-3 9 L-3 12 M3 9 L3 12" stroke={colors.midnight} strokeWidth={0.8} />
          <Rect x={-3.5} y={12} width={7} height={5} rx={1} fill="#8A6A4A" />
        </Svg>
      </Animated.View>

      {!reduced
        ? PARK_TWINKLES.map((p, i) => {
            const at = project(p);
            return <Twinkle key={`${p.x},${p.y}`} size={12 * R} delay={i * 450} style={{ left: at.x - 6 * R, top: at.y - 6 * R }} />;
          })
        : null}

      {parkMapLabels.map((label) => {
        const at = project(label);
        return (
          <Text
            key={label.text}
            style={[
              styles.label,
              label.style === 'title' && styles.titleLabel,
              { width: 180 * R, left: at.x - 90 * R, top: at.y - label.size * 0.7 * R, fontSize: label.size * R },
            ]}
            importantForAccessibility="no"
            accessibilityElementsHidden>
            {label.text}
          </Text>
        );
      })}

      {showRoute && route.length > 1 ? (
        <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Polyline
            points={route.map((r) => project(r.point)).map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={colors.midnight}
            strokeWidth={1.4 * R}
            strokeDasharray={`${0.1 * R} ${4 * R}`}
            strokeLinecap="round"
            opacity={0.55}
          />
        </Svg>
      ) : null}

      {land === null
        ? medallions.map((m) => {
            const spot = lands.find((l) => l.id === m.landId);
            if (!spot) return null;
            const at = project(spot.label);
            const complete = m.total > 0 && m.found >= m.total;
            return (
              <CounterScaled key={m.landId} x={at.x} y={at.y} w={MEDALLION_WIDTH} h={MEDALLION_HEIGHT}>
                <Pressable
                  onPress={() => onSelectLand(m.landId)}
                  accessibilityRole="button"
                  accessibilityLabel={copy.map.landLabel(m.name, m.found, m.total)}
                  accessibilityHint={copy.map.landHint}
                  hitSlop={4}
                  style={({ pressed }) => [styles.medallion, complete && styles.medallionComplete, pressed && styles.pressed]}>
                  <Text style={styles.medallionName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                    {m.name}
                  </Text>
                  <View style={styles.medallionRow}>
                    {complete ? <Ionicons name="checkmark-circle" size={12} color={colors.midnight} /> : null}
                    <Text style={styles.medallionCount}>{copy.map.landCount(m.found, m.total)}</Text>
                  </View>
                </Pressable>
              </CounterScaled>
            );
          })
        : null}

      {stories.map((story) => {
        const at = project(story.point);
        return (
          <CounterScaled key={story.id} x={at.x} y={at.y} w={MARKER_BOX} h={MARKER_BOX}>
            <StoryMarker story={story} onPress={() => onSelectStory?.(story.id)} />
          </CounterScaled>
        );
      })}

      {stamps.map((st) => {
        const at = project(st.point);
        return (
          <CounterScaled key={st.id} x={at.x} y={at.y} w={MARKER_BOX} h={MARKER_BOX}>
            <MapStamp stamp={st} onPress={() => onSelect(st.id)} />
          </CounterScaled>
        );
      })}

      {me && myLook ? (
        <CounterScaled x={project(me).x} y={project(me).y} w={ME_BOX} h={ME_BOX}>
          <MeAvatar look={myLook} heading={heading} />
        </CounterScaled>
      ) : me ? (
        <CounterScaled x={project(me).x} y={project(me).y} w={24} h={24}>
          <MeDot />
        </CounterScaled>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shimmer: {
    position: 'absolute',
    borderColor: colors.white,
  },
  label: {
    position: 'absolute',
    textAlign: 'center',
    fontFamily: fonts.headingSemiBold,
    color: colors.midnight,
  },
  titleLabel: {
    fontFamily: fonts.heading,
  },
  medallion: {
    width: MEDALLION_WIDTH,
    height: MEDALLION_HEIGHT,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.storybookGold,
    backgroundColor: 'rgba(255, 253, 247, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.midnight,
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  medallionComplete: {
    backgroundColor: colors.storybookGold,
    borderColor: colors.midnight,
  },
  pressed: {
    opacity: 0.75,
  },
  medallionName: {
    fontFamily: fonts.headingSemiBold,
    fontSize: 11,
    color: colors.midnight,
  },
  medallionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  medallionCount: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: colors.ink,
  },
});
