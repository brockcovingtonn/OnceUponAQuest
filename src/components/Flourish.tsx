import { View, type ViewStyle } from 'react-native';
import Svg, { Line, Polygon } from 'react-native-svg';

import { colors } from '@/theme';

/** Storybook divider: a fine gold rule with a star in the middle. Decorative. */
export function Flourish({ width = 140, color = colors.storybookGold, style }: { width?: number; color?: string; style?: ViewStyle }) {
  const mid = width / 2;
  const s = 5;
  const k = s * 0.3;
  return (
    <View style={style} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={12}>
        <Line x1={0} y1={6} x2={mid - 10} y2={6} stroke={color} strokeWidth={1.2} />
        <Line x1={mid + 10} y1={6} x2={width} y2={6} stroke={color} strokeWidth={1.2} />
        <Polygon
          points={`${mid},${6 - s} ${mid + k},${6 - k} ${mid + s},6 ${mid + k},${6 + k} ${mid},${6 + s} ${mid - k},${6 + k} ${mid - s},6 ${mid - k},${6 - k}`}
          fill={color}
        />
        <Polygon points={`${mid - 16},6 ${mid - 13},4.5 ${mid - 10},6 ${mid - 13},7.5`} fill={color} />
        <Polygon points={`${mid + 10},6 ${mid + 13},4.5 ${mid + 16},6 ${mid + 13},7.5`} fill={color} />
      </Svg>
    </View>
  );
}
