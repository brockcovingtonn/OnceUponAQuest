import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Polyline, Rect } from 'react-native-svg';

import { Artwork } from '@/art/Artwork';
import { lockedPalette } from '@/art/palettes';
import { BALLOON_SPOT, STREETCAR_TRACK, streetMap, streetMapLabels } from '@/art/streetMap';
import { Twinkle } from '@/components/Twinkle';
import { copy } from '@/copy';
import { MAP_CANVAS, type MapPoint } from '@/lib/mapGeometry';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, fonts } from '@/theme';

/** A Storybook Lens landmark marker. */
export type StoryMarkerData = {
  id: string;
  title: string;
  point: MapPoint;
  stamped: boolean;
  selected: boolean;
};

export type StoryMapStamp = {
  id: string;
  order: number;
  name: string;
  point: MapPoint;
  state: 'found' | 'open' | 'paused';
  selected: boolean;
};

type Props = {
  width: number;
  stamps: StoryMapStamp[];
  /** Connect stamps in walking order with a dotted line (one quest at a time). */
  showRoute: boolean;
  me: MapPoint | null;
  onSelect: (id: string) => void;
  stories?: StoryMarkerData[];
  onSelectStory?: (id: string) => void;
};

const STAMP = 34;

/** Loops 0 → 1 → 0 forever (still at 0.5 with Reduce Motion). */
function useLoop(durationMs: number, reduced: boolean) {
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

/** The illustrated street map: a little streetcar on the rails, a bobbing balloon, twinkles, and tappable spot stamps. */
export function StoryMap({ width, stamps, showRoute, me, onSelect, stories = [], onSelectStory }: Props) {
  const reduced = useReducedMotion();
  const scale = width / MAP_CANVAS.width;
  const height = MAP_CANVAS.height * scale;
  const route = [...stamps].sort((a, b) => a.order - b.order);
  const trip = useLoop(16000, reduced);
  const bob = useLoop(2600, reduced);
  const shimmer = useLoop(1400, reduced);

  const car = { w: 14 * scale, h: 30 * scale };
  const balloon = { w: 28 * scale, h: 36 * scale };

  return (
    <View style={{ width, height }}>
      <Artwork shapes={streetMap} palette={lockedPalette} size={width} canvas={MAP_CANVAS} />

      {/* Fountain shimmer */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shimmer,
          {
            left: (180 - 9) * scale,
            top: (92 - 9) * scale,
            width: 18 * scale,
            height: 18 * scale,
            borderRadius: 9 * scale,
            opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.7] }),
            transform: [{ scale: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.25] }) }],
          },
        ]}
      />

      {/* Streetcar trundling up and down the rails */}
      <Animated.View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={{
          position: 'absolute',
          left: STREETCAR_TRACK.x * scale - car.w / 2,
          top: 0,
          transform: [
            {
              translateY: trip.interpolate({
                inputRange: [0, 1],
                outputRange: [STREETCAR_TRACK.bottom * scale - car.h / 2, STREETCAR_TRACK.top * scale - car.h / 2],
              }),
            },
          ],
        }}>
        <Svg width={car.w} height={car.h} viewBox="0 0 14 30">
          <Rect x={0.75} y={0.75} width={12.5} height={28.5} rx={5} fill={colors.rose} stroke={colors.midnight} strokeWidth={1.5} />
          <Rect x={3.5} y={5} width={7} height={20} rx={2} fill="#F6D58E" />
          <Rect x={6} y={2} width={2} height={2} rx={1} fill={colors.white} />
        </Svg>
      </Animated.View>

      {/* Hot-air balloon bobbing in the margin */}
      <Animated.View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={{
          position: 'absolute',
          left: BALLOON_SPOT.x * scale - balloon.w / 2,
          top: BALLOON_SPOT.y * scale - balloon.h / 2,
          transform: [
            { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [-5 * scale, 5 * scale] }) },
            { rotate: bob.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] }) },
          ],
        }}>
        <Svg width={balloon.w} height={balloon.h} viewBox="-14 -18 28 36">
          <Path d="M0 -16 C11 -16 13 -4 7 4 L3 9 L-3 9 L-7 4 C-13 -4 -11 -16 0 -16 Z" fill={colors.rose} stroke={colors.midnight} strokeWidth={1} />
          <Path d="M0 -16 C4 -12 4 0 2 9 M0 -16 C-4 -12 -4 0 -2 9" fill="none" stroke={colors.parchment} strokeWidth={1} opacity={0.8} />
          <Path d="M-3 9 L-3 12 M3 9 L3 12" stroke={colors.midnight} strokeWidth={0.8} />
          <Rect x={-3.5} y={12} width={7} height={5} rx={1} fill="#8A6A4A" />
        </Svg>
      </Animated.View>

      {/* Twinkles on the map's painted sparkles */}
      {!reduced ? (
        <>
          <Twinkle size={10 * scale} style={{ left: 113 * scale, top: 35 * scale }} />
          <Twinkle size={8 * scale} delay={600} style={{ left: 42 * scale, top: 466 * scale }} />
          <Twinkle size={9 * scale} delay={1200} style={{ left: 329 * scale, top: 155 * scale }} />
          <Twinkle size={8 * scale} delay={300} style={{ left: 147 * scale, top: 556 * scale }} />
        </>
      ) : null}

      {streetMapLabels.map((label) => (
        <Text
          key={label.text}
          style={[
            styles.label,
            label.style === 'title' ? styles.titleLabel : label.style === 'place' ? styles.placeLabel : null,
            { left: label.x * scale - 60, top: label.y * scale - 8, fontSize: label.size * Math.max(scale, 0.9) },
          ]}
          importantForAccessibility="no"
          accessibilityElementsHidden>
          {label.text}
        </Text>
      ))}

      {showRoute && route.length > 1 ? (
        <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Polyline
            points={route.map((s) => `${s.point.x * scale},${s.point.y * scale}`).join(' ')}
            fill="none"
            stroke={colors.midnight}
            strokeWidth={2}
            strokeDasharray="2 6"
            strokeLinecap="round"
            opacity={0.55}
          />
        </Svg>
      ) : null}

      {stories.map((st) => (
        <StoryMarker key={st.id} story={st} x={st.point.x * scale} y={st.point.y * scale} onPress={() => onSelectStory?.(st.id)} />
      ))}

      {stamps.map((s) => (
        <MapStamp key={s.id} stamp={s} x={s.point.x * scale} y={s.point.y * scale} onPress={() => onSelect(s.id)} />
      ))}

      {me ? <MeDot x={me.x * scale} y={me.y * scale} /> : null}
    </View>
  );
}

/** A tappable spot stamp centered on (x, y) in screen points. */
export function MapStamp({ stamp, x, y, onPress }: { stamp: StoryMapStamp; x: number; y: number; onPress: () => void }) {
  const size = stamp.selected ? STAMP + 8 : STAMP;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={copy.map.stampLabel(stamp.order, stamp.name, stamp.state)}
      accessibilityState={{ selected: stamp.selected }}
      hitSlop={6}
      style={[
        styles.stamp,
        { width: size, height: size, borderRadius: size / 2, left: x - size / 2, top: y - size / 2 },
        stamp.state === 'found' && styles.stampFound,
        stamp.selected && styles.stampSelected,
      ]}>
      {stamp.state === 'found' ? (
        <Ionicons name="checkmark" size={18} color={colors.midnight} />
      ) : stamp.state === 'paused' ? (
        <Ionicons name="pause" size={16} color={colors.midnight} />
      ) : (
        <Text style={styles.number}>{stamp.order}</Text>
      )}
    </Pressable>
  );
}

const STORY = 30;

/** A landmark story marker: a little lens-in-a-frame, gold once stamped. */
export function StoryMarker({ story, x, y, onPress }: { story: StoryMarkerData; x: number; y: number; onPress: () => void }) {
  const size = story.selected ? STORY + 6 : STORY;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={copy.lens.markerLabel(story.title, story.stamped)}
      accessibilityState={{ selected: story.selected }}
      hitSlop={7}
      style={[
        styles.story,
        { width: size, height: size, left: x - size / 2, top: y - size / 2 },
        story.stamped && styles.storyStamped,
        story.selected && styles.stampSelected,
      ]}>
      <Ionicons name="aperture-outline" size={16} color={story.stamped ? colors.midnight : colors.storybookGold} />
    </Pressable>
  );
}

/** "You are here" dot centered on (x, y) in screen points. */
export function MeDot({ x, y }: { x: number; y: number }) {
  return <View style={[styles.me, { left: x - 9, top: y - 9 }]} accessible accessibilityLabel={copy.map.youAreHere} />;
}

const styles = StyleSheet.create({
  label: {
    position: 'absolute',
    width: 120,
    textAlign: 'center',
    fontFamily: fonts.headingSemiBold,
    color: colors.midnight,
  },
  titleLabel: {
    fontFamily: fonts.heading,
  },
  placeLabel: {
    backgroundColor: 'rgba(243, 233, 210, 0.92)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.white,
  },
  stamp: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.parchment,
    borderWidth: 2.5,
    borderColor: colors.midnight,
  },
  story: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: colors.midnight,
    borderWidth: 2,
    borderColor: colors.storybookGold,
    transform: [{ rotate: '45deg' }],
  },
  storyStamped: {
    backgroundColor: colors.storybookGold,
    borderColor: colors.midnight,
  },
  stampFound: {
    backgroundColor: colors.storybookGold,
  },
  stampSelected: {
    borderWidth: 3.5,
    shadowColor: colors.midnight,
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  number: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.midnight,
  },
  me: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2A78D6',
    borderWidth: 3,
    borderColor: colors.white,
  },
});
