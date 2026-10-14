import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
