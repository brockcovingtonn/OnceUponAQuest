import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';

import { AVATAR_CANVAS, AVATAR_FEET_Y, type AvatarLook } from '@/art/avatar';
import { AvatarFigure } from '@/components/Avatar';
import { copy } from '@/copy';
import type { MapPoint } from '@/lib/mapGeometry';
import { colors, fonts } from '@/theme';

/**
 * Markers drawn over the storybook map. Each one is centered on its point by
 * the map (see CounterScaled in ZoomableCanvas), so it keeps the same size on
 * screen however far you zoom.
 */

export type StoryMapStamp = {
  id: string;
  order: number;
  name: string;
  point: MapPoint;
  state: 'found' | 'open' | 'paused';
  selected: boolean;
};

/** A Storybook Lens landmark marker. */
export type StoryMarkerData = {
  id: string;
  title: string;
  point: MapPoint;
  stamped: boolean;
  selected: boolean;
};

const STAMP = 34;
const STORY = 30;

/** A tappable, numbered spot stamp. */
export function MapStamp({ stamp, onPress }: { stamp: StoryMapStamp; onPress: () => void }) {
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
        { width: size, height: size, borderRadius: size / 2 },
        stamp.state === 'found' && styles.stampFound,
        stamp.selected && styles.selected,
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

/** A landmark story marker: a little lens in a diamond, gold once stamped. */
export function StoryMarker({ story, onPress }: { story: StoryMarkerData; onPress: () => void }) {
  const size = story.selected ? STORY + 6 : STORY;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={copy.lens.markerLabel(story.title, story.stamped)}
      accessibilityState={{ selected: story.selected }}
      hitSlop={7}
      style={[styles.story, { width: size, height: size }, story.stamped && styles.storyStamped, story.selected && styles.selected]}>
      <Ionicons name="aperture-outline" size={16} color={story.stamped ? colors.midnight : colors.storybookGold} />
    </Pressable>
  );
}

/** "You are here" dot. */
export function MeDot() {
  return <View style={styles.me} accessible accessibilityLabel={copy.map.youAreHere} />;
}

/** Size of the "you are here" avatar marker's box; your position is its center. */
export const ME_BOX = 124;
const C = ME_BOX / 2;
const TILT = 0.4; // squash for drawing on the ground

/** A point on the ground at distance r and compass angle a (degrees) from your feet. */
function ground(r: number, a: number): string {
  const rad = (a * Math.PI) / 180;
  return `${(C + r * Math.sin(rad)).toFixed(1)} ${(C - r * Math.cos(rad) * TILT).toFixed(1)}`;
}

/**
 * "You are here": your explorer standing on a gold ring, with a soft beam and
 * an arrow showing which way you're facing when the compass is available.
 */
export function MeAvatar({ look, heading }: { look: AvatarLook; heading: number | null }) {
  const figure = 44;
  const feet = (figure * AVATAR_FEET_Y) / AVATAR_CANVAS.width;
  return (
    <View
      style={{ width: ME_BOX, height: ME_BOX }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={heading === null ? copy.map.youAreHere : copy.map.youAreHereFacing(compassWord(heading))}>
      <Svg width={ME_BOX} height={ME_BOX} style={StyleSheet.absoluteFill}>
        {heading !== null ? (
          <Path d={`M${C} ${C}L${ground(40, heading - 28)}L${ground(42, heading)}L${ground(40, heading + 28)}Z`} fill="#E2B04A" opacity={0.28} />
        ) : null}
        <Ellipse cx={C} cy={C} rx={16} ry={16 * TILT} fill="#1B2340" opacity={0.18} />
        <Ellipse cx={C} cy={C} rx={16} ry={16 * TILT} fill="none" stroke="#E2B04A" strokeWidth={2.2} />
      </Svg>
      <AvatarFigure look={look} size={figure} shadow={false} style={{ position: 'absolute', left: C - figure / 2, top: C - feet }} />
      {heading !== null ? (
        <Svg width={ME_BOX} height={ME_BOX} style={StyleSheet.absoluteFill}>
          <Path
            d={`M${ground(23, heading)}L${ground(15, heading - 22)}L${ground(15, heading + 22)}Z`}
            fill="#E2B04A"
            stroke="#1B2340"
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </Svg>
      ) : null}
    </View>
  );
}

function compassWord(heading: number): string {
  return copy.map.compass[Math.round(heading / 45) % 8];
}

const styles = StyleSheet.create({
  stamp: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.parchment,
    borderWidth: 2.5,
    borderColor: colors.midnight,
  },
  stampFound: {
    backgroundColor: colors.storybookGold,
  },
  selected: {
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
  story: {
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
  me: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2A78D6',
    borderWidth: 3,
    borderColor: colors.white,
  },
});
