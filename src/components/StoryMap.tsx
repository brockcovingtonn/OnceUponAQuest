import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import { Artwork } from '@/art/Artwork';
import { lockedPalette } from '@/art/palettes';
import { streetMap, streetMapLabels } from '@/art/streetMap';
import { copy } from '@/copy';
import { MAP_CANVAS, type MapPoint } from '@/lib/mapGeometry';
import { colors, fonts } from '@/theme';

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
};

const STAMP = 34;

/** The illustrated street map with tappable spot stamps on top. */
export function StoryMap({ width, stamps, showRoute, me, onSelect }: Props) {
  const scale = width / MAP_CANVAS.width;
  const height = MAP_CANVAS.height * scale;
  const route = [...stamps].sort((a, b) => a.order - b.order);

  return (
    <View style={{ width, height }}>
      <Artwork shapes={streetMap} palette={lockedPalette} size={width} canvas={MAP_CANVAS} />

      {streetMapLabels.map((label) => (
        <Text
          key={label.text}
          style={[
            styles.label,
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

      {stamps.map((s) => {
        const size = s.selected ? STAMP + 8 : STAMP;
        return (
          <Pressable
            key={s.id}
            onPress={() => onSelect(s.id)}
            accessibilityRole="button"
            accessibilityLabel={copy.map.stampLabel(s.order, s.name, s.state)}
            accessibilityState={{ selected: s.selected }}
            hitSlop={6}
            style={[
              styles.stamp,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                left: s.point.x * scale - size / 2,
                top: s.point.y * scale - size / 2,
              },
              s.state === 'found' && styles.stampFound,
              s.selected && styles.stampSelected,
            ]}>
            {s.state === 'found' ? (
              <Ionicons name="checkmark" size={18} color={colors.midnight} />
            ) : s.state === 'paused' ? (
              <Ionicons name="pause" size={16} color={colors.midnight} />
            ) : (
              <Text style={styles.number}>{s.order}</Text>
            )}
          </Pressable>
        );
      })}

      {me ? (
        <View
          style={[styles.me, { left: me.x * scale - 9, top: me.y * scale - 9 }]}
          accessible
          accessibilityLabel={copy.map.youAreHere}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    position: 'absolute',
    width: 120,
    textAlign: 'center',
    fontFamily: fonts.headingSemiBold,
    color: colors.midnight,
  },
  stamp: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.parchment,
    borderWidth: 2.5,
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
