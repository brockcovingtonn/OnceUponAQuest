import { useMemo } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { logoSvg } from '@/art/logoMark';

type Props = {
  accessibilityLabel: string;
  size?: number;
  /**
   * 'tile' (default): the app icon's rounded square with the night sky, for light screens.
   * 'bare': the keyhole and book alone, for dark backgrounds like the intro.
   */
  variant?: 'tile' | 'bare';
};

/** The logo mark: a golden keyhole on an open storybook, with fireworks and a wishing star. */
export function Logo({ accessibilityLabel, size = 96, variant = 'tile' }: Props) {
  const xml = useMemo(() => logoSvg(variant), [variant]);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={variant === 'tile' ? { width: size, height: size, borderRadius: size * 0.2237, overflow: 'hidden' } : undefined}>
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
}
