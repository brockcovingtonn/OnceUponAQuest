import { colors } from '@/theme';

export type StampAvatar = {
  key: string;
  label: string;
  /** Frame color of the stamp. */
  color: string;
  /** Highlight color inside the drawing. */
  accent: string;
};

// Original stamp art lives in src/art/shapes.ts (avatarGlyphs).
// Keys are stored in profiles.avatar_key, so keep them stable.
export const stampAvatars: StampAvatar[] = [
  { key: 'stamp_lamp', label: 'Street lamp stamp', color: colors.storybookGold, accent: colors.storybookGold },
  { key: 'stamp_key', label: 'Key stamp', color: colors.rose, accent: colors.rose },
  { key: 'stamp_compass', label: 'Compass stamp', color: colors.fern, accent: colors.fern },
  { key: 'stamp_star', label: 'Star stamp', color: colors.midnight, accent: colors.storybookGold },
  { key: 'stamp_leaf', label: 'Leaf stamp', color: colors.fern, accent: colors.fern },
  { key: 'stamp_map', label: 'Map stamp', color: colors.midnight, accent: colors.rose },
  { key: 'stamp_bell', label: 'Bell stamp', color: colors.storybookGold, accent: colors.rose },
  { key: 'stamp_book', label: 'Storybook stamp', color: colors.rose, accent: colors.storybookGold },
];

/** The stamp avatar for a saved key, falling back to the first one. */
export function avatarFor(key: string | null | undefined): StampAvatar {
  return stampAvatars.find((a) => a.key === key) ?? stampAvatars[0];
}
