import { Artwork } from '@/art/Artwork';
import { lensPageGlyph } from '@/art/landBadges';
import { inkedPalette, lockedPalette } from '@/art/palettes';

/** A Storybook Lens page stamp: inked when stamped, a faded outline when not. Decorative: label the parent. */
export function LensStamp({ stamped, size = 56 }: { stamped: boolean; size?: number }) {
  return <Artwork shapes={lensPageGlyph} palette={stamped ? inkedPalette : lockedPalette} size={size} frame={stamped ? 'solid' : 'dashed'} />;
}
