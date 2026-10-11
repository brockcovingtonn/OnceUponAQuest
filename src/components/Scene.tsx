import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View, type ViewStyle } from 'react-native';

import { Artwork } from '@/art/Artwork';
import { SCENE } from '@/art/scenes';
import type { Shape } from '@/art/shapes';
import { lockedPalette } from '@/art/palettes';

type Props = {
  shapes: Shape[];
  /** Box height; the scene fills the width and is cropped to fit. */
  height: number;
  style?: ViewStyle;
};

/** A storybook scene that fills its container's width. Decorative. */
export function Scene({ shapes, height, style }: Props) {
  const [width, setWidth] = useState(0);
  return (
    <View
      style={[styles.box, { height }, style]}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {width > 0 ? (
        <Artwork shapes={shapes} palette={lockedPalette} size={width} height={height} canvas={SCENE} crop />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
    width: '100%',
  },
});
