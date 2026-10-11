import { avatarGlyphs } from '@/art/shapes';
import { Artwork } from '@/art/Artwork';
import { avatarPalette } from '@/art/palettes';
import type { StampAvatar as StampAvatarData } from '@/lib/avatars';

/** Round "passport stamp" avatar with original art. Decorative: label the parent. */
export function StampAvatar({ avatar, size = 56 }: { avatar: StampAvatarData; size?: number }) {
  return (
    <Artwork
      shapes={avatarGlyphs[avatar.key] ?? []}
      palette={avatarPalette(avatar.color, avatar.accent)}
      size={size}
      frame="solid"
    />
  );
}
