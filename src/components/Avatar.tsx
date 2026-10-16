import { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { AVATAR_CANVAS, type AvatarLook, avatarSvg, type Pose } from '@/art/avatar';
import { colors } from '@/theme';

type FigureProps = {
  look: AvatarLook;
  /** Width in points; the height follows the 120 × 168 canvas. */
  size: number;
  pose?: Pose;
  shadow?: boolean;
  /** Label it when it stands alone; leave it out when the parent is labeled. */
  accessibilityLabel?: string;
  style?: ViewStyle;
};

/** The explorer avatar, head to toe. */
export function AvatarFigure({ look, size, pose = 'stand', shadow = true, accessibilityLabel, style }: FigureProps) {
  // Small figures (map markers, wardrobe grids) skip the finest texture.
  const detail = size < 90 ? 'lite' : 'full';
  const xml = useMemo(() => avatarSvg(look, { pose, shadow, detail }), [look, pose, shadow, detail]);
  const height = (size * AVATAR_CANVAS.height) / AVATAR_CANVAS.width;
  return (
    <View
      style={[{ width: size, height }, style]}
      accessible={Boolean(accessibilityLabel)}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}>
      <SvgXml xml={xml} width={size} height={height} />
    </View>
  );
}

/** Head and shoulders in a gold-ringed circle: the explorer as a profile picture. Decorative. */
export function AvatarBust({ look, size }: { look: AvatarLook; size: number }) {
  const detail = size < 64 ? 'lite' : 'full';
  const xml = useMemo(() => avatarSvg(look, { crop: 'bust', detail }), [look, detail]);
  const inner = size - 6;
  return (
    <View
      style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View style={{ width: inner, height: inner, borderRadius: inner / 2, overflow: 'hidden', backgroundColor: colors.parchment }}>
        <SvgXml xml={xml} width={inner} height={inner} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 3,
    borderColor: colors.storybookGold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.parchment,
  },
});
