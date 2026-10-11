import { View } from 'react-native';

import { logoGlyph } from '@/art/shapes';
import { Artwork } from '@/art/Artwork';
import { logoPalette } from '@/art/palettes';

/** Original logo mark: an open storybook with a star, on a midnight stamp. */
export function Logo({ accessibilityLabel, size = 96 }: { accessibilityLabel: string; size?: number }) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Artwork shapes={logoGlyph} palette={logoPalette} size={size} frame="solid" />
    </View>
  );
}
