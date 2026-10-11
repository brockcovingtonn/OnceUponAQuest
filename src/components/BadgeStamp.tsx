import { badgeGlyphs } from '@/art/shapes';
import { Artwork } from '@/art/Artwork';
import { inkedPalette, lockedPalette } from '@/art/palettes';

type Props = {
  /** badges.art_key, e.g. "badge_window". */
  artKey: string | null | undefined;
  earned: boolean;
  size?: number;
};

/** Original badge art: gold when earned, faded dashed outline when not. Decorative: label the parent. */
export function BadgeStamp({ artKey, earned, size = 64 }: Props) {
  return (
    <Artwork
      shapes={(artKey && badgeGlyphs[artKey]) || []}
      palette={earned ? inkedPalette : lockedPalette}
      size={size}
      frame={earned ? 'solid' : 'dashed'}
    />
  );
}
