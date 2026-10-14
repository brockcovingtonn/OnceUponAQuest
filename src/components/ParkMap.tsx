import Ionicons from '@expo/vector-icons/Ionicons';
import { type ReactNode, useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';

import { Artwork } from '@/art/Artwork';
import { lockedPalette } from '@/art/palettes';
import {
  PARK_BALLOON,
  PARK_CANVAS,
  PARK_FOUNTAIN,
  PARK_TWINKLES,
  type ParkLand,
  parkMap,
  parkMapLabels,
  RIVERBOAT_PATH,
  ROCKET_SPINNER,
  TRAIN_PATH,
} from '@/art/parkMap';
import { MapStamp, MeDot, StoryMarker, type StoryMapStamp, type StoryMarkerData } from '@/components/StoryMap';
import { Twinkle } from '@/components/Twinkle';
import { copy } from '@/copy';
import type { MapPoint } from '@/lib/mapGeometry';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, fonts } from '@/theme';

export type LandMedallion = { landId: string; name: string; found: number; total: number };

type Props = {
  width: number;
  /** Zoom into one land; null shows the whole park with a medallion per land. */
  land: ParkLand | null;
  lands: ParkLand[];
  medallions: LandMedallion[];
  stamps: StoryMapStamp[];
  showRoute: boolean;
  me: MapPoint | null;
  onSelect: (id: string) => void;
  onSelectLand: (landId: string) => void;
  stories?: StoryMarkerData[];
  onSelectStory?: (id: string) => void;
};

const WHOLE = { x: 0, y: 0, w: PARK_CANVAS.width, h: PARK_CANVAS.height };
const MEDALLION_WIDTH = 100;

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
 * The illustrated park map: a train circling the berm, a riverboat looping the
 * island, a spinning rocket ride, a bobbing balloon and twinkles. The whole
 * park shows a progress medallion per land; a land view zooms in and shows
 * tappable spot stamps.
 */
export function ParkMap({ width, land, lands, medallions, stamps, showRoute, me, onSelect, onSelectLand, stories = [], onSelectStory }: Props) {
  const reduced = useReducedMotion();
  const view = land?.view ?? WHOLE;
  const scale = width / view.w;
  const height = view.h * scale;
  const project = (p: { x: number; y: number }) => ({ x: (p.x - view.x) * scale, y: (p.y - view.y) * scale });
  const train = useCycle(60000, reduced);
  const boat = useCycle(36000, reduced);
  const spin = useCycle(9000, reduced);
  const bob = useBob(2600, reduced);
  const shimmer = useBob(1400, reduced);
  const route = [...stamps].sort((a, b) => a.order - b.order);
  // Sprites keep a readable size on the whole-park view.
  const s = Math.max(scale, 0.7);
  const engine = { w: 18 * s, h: 10 * s };
  const car = { w: 15 * s, h: 9 * s };
  const riverboat = { w: 20 * s, h: 11 * s };
  const balloon = { w: 28 * s, h: 36 * s };
  const spinner = 64 * scale;
  const fountain = project(PARK_FOUNTAIN);
  const balloonAt = project(PARK_BALLOON);
  const spinnerAt = project(ROCKET_SPINNER);
  const key = `${view.x},${view.y},${view.w},${width}`;

  return (
    <View style={{ width, height, overflow: 'hidden', borderRadius: 12 }}>
      <Artwork shapes={parkMap} palette={lockedPalette} size={width} canvas={PARK_CANVAS} view={view} />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.shimmer,
          {
            left: fountain.x - 10 * scale,
            top: fountain.y - 10 * scale,
            width: 20 * scale,
            height: 20 * scale,
            borderRadius: 10 * scale,
            opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.7] }),
            transform: [{ scale: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.25] }) }],
          },
        ]}
      />

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
      <PathRider key={`boat${key}`} progress={boat} path={RIVERBOAT_PATH} project={project} w={riverboat.w} h={riverboat.h}>
        <Svg width={riverboat.w} height={riverboat.h} viewBox="0 0 20 11">
          <Path d="M1 3 L16 3 L19 5.5 L16 8 L1 8 Z" fill={colors.white} stroke={colors.midnight} strokeWidth={0.8} />
          <Rect x={4} y={4} width={8} height={3} fill="#F6D58E" />
          <Rect x={0} y={2} width={2.5} height={7} rx={1} fill={colors.rose} />
          <Circle cx={9} cy={5.5} r={1.2} fill={colors.midnight} />
        </Svg>
      </PathRider>

      {/* Train: an engine and two cars on the berm. */}
      {[2, 1].map((k) => (
        <PathRider key={`car${k}${key}`} progress={train} path={TRAIN_PATH} lag={k * 0.012} project={project} w={car.w} h={car.h}>
          <Svg width={car.w} height={car.h} viewBox="0 0 15 9">
            <Rect x={0.5} y={0.5} width={14} height={8} rx={2} fill={k === 1 ? '#F6D58E' : colors.rose} stroke={colors.midnight} strokeWidth={0.8} />
            <Rect x={3} y={2.5} width={9} height={4} rx={1} fill={colors.white} opacity={0.8} />
          </Svg>
        </PathRider>
      ))}
      <PathRider key={`engine${key}`} progress={train} path={TRAIN_PATH} project={project} w={engine.w} h={engine.h}>
        <Svg width={engine.w} height={engine.h} viewBox="0 0 18 10">
          <Rect x={0.5} y={0.5} width={17} height={9} rx={2.5} fill={colors.midnight} />
          <Rect x={1.5} y={2} width={6} height={6} rx={1} fill={colors.rose} />
          <Circle cx={14} cy={5} r={2} fill="#F6D58E" />
        </Svg>
      </PathRider>

      {/* Balloon bobbing in the margin. */}
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          left: balloonAt.x - balloon.w / 2,
          top: balloonAt.y - balloon.h / 2,
          transform: [
            { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [-5 * s, 5 * s] }) },
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
            return <Twinkle key={`${p.x},${p.y}`} size={10 * s} delay={i * 450} style={{ left: at.x - 5 * s, top: at.y - 5 * s }} />;
          })
        : null}

      {land === null
        ? parkMapLabels.map((label) => {
            const at = project(label);
            return (
              <Text
                key={label.text}
                style={[styles.label, label.style === 'title' && styles.titleLabel, { left: at.x - 70, top: at.y - 9, fontSize: label.size * Math.max(scale * 1.6, 0.8) }]}
                importantForAccessibility="no"
                accessibilityElementsHidden>
                {label.text}
              </Text>
            );
          })
        : null}

      {land === null
        ? medallions.map((m) => {
            const spot = lands.find((l) => l.id === m.landId);
            if (!spot) return null;
            const at = project(spot.label);
            const complete = m.total > 0 && m.found >= m.total;
            return (
              <Pressable
                key={m.landId}
                onPress={() => onSelectLand(m.landId)}
                accessibilityRole="button"
                accessibilityLabel={copy.map.landLabel(m.name, m.found, m.total)}
                accessibilityHint={copy.map.landHint}
                hitSlop={4}
                style={({ pressed }) => [
                  styles.medallion,
                  complete && styles.medallionComplete,
                  { left: at.x - MEDALLION_WIDTH / 2, top: at.y - 18 },
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.medallionName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {m.name}
                </Text>
                <View style={styles.medallionRow}>
                  {complete ? <Ionicons name="checkmark-circle" size={12} color={colors.midnight} /> : null}
                  <Text style={styles.medallionCount}>{copy.map.landCount(m.found, m.total)}</Text>
                </View>
              </Pressable>
            );
          })
        : null}

      {showRoute && route.length > 1 ? (
        <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Polyline
            points={route.map((r) => project(r.point)).map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={colors.midnight}
            strokeWidth={2}
            strokeDasharray="2 6"
            strokeLinecap="round"
            opacity={0.55}
          />
        </Svg>
      ) : null}

      {stories.map((story) => {
        const at = project(story.point);
        return <StoryMarker key={story.id} story={story} x={at.x} y={at.y} onPress={() => onSelectStory?.(story.id)} />;
      })}

      {stamps.map((st) => {
        const at = project(st.point);
        return <MapStamp key={st.id} stamp={st} x={at.x} y={at.y} onPress={() => onSelect(st.id)} />;
      })}

      {me ? <MeDot {...project(me)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shimmer: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.white,
  },
  label: {
    position: 'absolute',
    width: 140,
    textAlign: 'center',
    fontFamily: fonts.headingSemiBold,
    color: colors.midnight,
  },
  titleLabel: {
    fontFamily: fonts.heading,
  },
  medallion: {
    position: 'absolute',
    width: MEDALLION_WIDTH,
    minHeight: 36,
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
