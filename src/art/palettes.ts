import type { Palette } from '@/art/shapes';
import { colors } from '@/theme';

const muted = '#B9B2A3';

/** Earned badge: gold stamp, midnight ink. */
export const inkedPalette: Palette = {
  bg: colors.storybookGold,
  frame: colors.midnight,
  line: colors.midnight,
  soft: colors.parchment,
  accent: colors.rose,
};

/** Not earned yet: faded outline. */
export const lockedPalette: Palette = {
  bg: colors.parchment,
  frame: muted,
  line: muted,
  soft: colors.parchment,
  accent: muted,
};

/** Logo and app icon: midnight stamp with gold and parchment. */
export const logoPalette: Palette = {
  bg: colors.midnight,
  frame: colors.storybookGold,
  line: colors.parchment,
  soft: colors.midnight,
  accent: colors.storybookGold,
};

export function avatarPalette(frame: string, accent: string): Palette {
  return { bg: colors.parchment, frame, line: colors.midnight, soft: colors.white, accent };
}
