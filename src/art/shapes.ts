/**
 * Original stamp artwork for Once Upon a Quest, drawn as simple shapes on a
 * 100 × 100 canvas. Pure data (no React Native imports) so the same artwork
 * renders in the app (src/art/Artwork.tsx) and in preview/icon scripts.
 *
 * Hard rule: no characters, castles or three-circle "head and ears" shapes.
 */
import { landBadgeGlyphs } from './landBadges';

/** Semantic colors, resolved per variant at render time. */
export type Tone = 'bg' | 'frame' | 'line' | 'soft' | 'accent' | 'none';

/** A semantic tone, or an exact color for fixed-color scenes. */
export type Color = Tone | `#${string}`;

type Paint = { fill?: Color; stroke?: Color; strokeWidth?: number; dash?: string; opacity?: number };

export type Shape =
  | ({ kind: 'circle'; cx: number; cy: number; r: number } & Paint)
  | ({ kind: 'rect'; x: number; y: number; w: number; h: number; rx?: number } & Paint)
  | ({ kind: 'path'; d: string } & Paint)
  | ({ kind: 'polygon'; points: string } & Paint)
  | ({ kind: 'line'; x1: number; y1: number; x2: number; y2: number } & Paint)
  /** Rectangle filled with a top-to-bottom gradient (e.g. a night sky). */
  | { kind: 'gradient'; x: number; y: number; w: number; h: number; from: `#${string}`; to: `#${string}` };

export type Palette = Record<Exclude<Tone, 'none'>, string>;

/** Round passport-stamp frame drawn behind every glyph. */
export function stampFrame(dashed: boolean): Shape[] {
  return [
    { kind: 'circle', cx: 50, cy: 50, r: 46, fill: 'bg', stroke: 'frame', strokeWidth: 4, dash: dashed ? '6 5' : undefined },
    { kind: 'circle', cx: 50, cy: 50, r: 39, fill: 'none', stroke: 'frame', strokeWidth: 1.5, dash: '2.5 3' },
  ];
}

function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
  }
  return points.join(' ');
}

function sparkle(cx: number, cy: number, size: number, tone: Tone): Shape[] {
  return [
    { kind: 'line', x1: cx - size, y1: cy, x2: cx + size, y2: cy, stroke: tone, strokeWidth: 2 },
    { kind: 'line', x1: cx, y1: cy - size, x2: cx, y2: cy + size, stroke: tone, strokeWidth: 2 },
  ];
}

const streetLamp: Shape[] = [
  { kind: 'polygon', points: '37,31 63,31 50,21', fill: 'line' },
  { kind: 'path', d: 'M41 31 L59 31 L56 53 L44 53 Z', fill: 'soft', stroke: 'line', strokeWidth: 3 },
  { kind: 'path', d: 'M50 36 C54.5 41 54.5 46 50 49 C45.5 46 45.5 41 50 36 Z', fill: 'accent' },
  { kind: 'rect', x: 46, y: 53, w: 8, h: 4, fill: 'line' },
  { kind: 'rect', x: 48, y: 57, w: 4, h: 18, fill: 'line' },
  { kind: 'rect', x: 40, y: 74, w: 20, h: 5, rx: 1.5, fill: 'line' },
];

/** Glyphs for the 8 stamp avatars. Keys match profiles.avatar_key. */
export const avatarGlyphs: Record<string, Shape[]> = {
  stamp_lamp: streetLamp,

  stamp_key: [
    { kind: 'circle', cx: 35, cy: 50, r: 11, fill: 'soft', stroke: 'line', strokeWidth: 4 },
    { kind: 'circle', cx: 35, cy: 50, r: 3.5, fill: 'accent' },
    { kind: 'line', x1: 46, y1: 50, x2: 74, y2: 50, stroke: 'line', strokeWidth: 5 },
    { kind: 'rect', x: 62, y: 50, w: 4, h: 10, fill: 'line' },
    { kind: 'rect', x: 69, y: 50, w: 4, h: 7, fill: 'line' },
  ],

  stamp_compass: [
    { kind: 'circle', cx: 50, cy: 50, r: 24, fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'line', x1: 27, y1: 50, x2: 32, y2: 50, stroke: 'line', strokeWidth: 2.5 },
    { kind: 'line', x1: 68, y1: 50, x2: 73, y2: 50, stroke: 'line', strokeWidth: 2.5 },
    { kind: 'line', x1: 50, y1: 68, x2: 50, y2: 73, stroke: 'line', strokeWidth: 2.5 },
    { kind: 'polygon', points: '50,29 56,50 44,50', fill: 'accent' },
    { kind: 'polygon', points: '50,71 56,50 44,50', fill: 'line' },
  ],

  stamp_star: [
    { kind: 'polygon', points: starPoints(50, 52, 24, 10), fill: 'accent', stroke: 'line', strokeWidth: 2.5 },
    ...sparkle(28, 30, 4, 'line'),
    ...sparkle(73, 32, 3, 'line'),
  ],

  stamp_leaf: [
    { kind: 'path', d: 'M30 68 C30 43 46 29 70 30 C70 54 55 69 30 68 Z', fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'path', d: 'M33 65 C44 54 54 45 64 36', fill: 'none', stroke: 'accent', strokeWidth: 2.5 },
    { kind: 'line', x1: 30, y1: 68, x2: 25, y2: 74, stroke: 'line', strokeWidth: 3 },
  ],

  stamp_map: [
    { kind: 'polygon', points: '26,35 40,30 40,67 26,72', fill: 'soft', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'polygon', points: '40,30 58,36 58,73 40,67', fill: 'soft', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'polygon', points: '58,36 74,31 74,68 58,73', fill: 'soft', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'path', d: 'M31 62 C38 52 46 59 52 49 C57 41 61 47 66 42', fill: 'none', stroke: 'accent', strokeWidth: 2.5, dash: '3 3' },
    { kind: 'line', x1: 65, y1: 36, x2: 71, y2: 42, stroke: 'accent', strokeWidth: 3 },
    { kind: 'line', x1: 71, y1: 36, x2: 65, y2: 42, stroke: 'accent', strokeWidth: 3 },
  ],

  stamp_bell: [
    { kind: 'rect', x: 47, y: 20, w: 6, h: 8, rx: 2, fill: 'line' },
    { kind: 'path', d: 'M50 27 C39 27 35 38 35 49 C35 57 31 61 28 65 L72 65 C69 61 65 57 65 49 C65 38 61 27 50 27 Z', fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'line', x1: 26, y1: 66, x2: 74, y2: 66, stroke: 'line', strokeWidth: 3.5 },
    { kind: 'path', d: 'M45 70 L55 70 L50 77 Z', fill: 'accent' },
    { kind: 'path', d: 'M42 37 C40 41 40 45 40 49', fill: 'none', stroke: 'accent', strokeWidth: 2.5 },
  ],

  stamp_book: [
    { kind: 'path', d: 'M50 38 C42 33 32 33 24 36 L24 69 C32 66 42 66 50 71 Z', fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'path', d: 'M50 38 C58 33 68 33 76 36 L76 69 C68 66 58 66 50 71 Z', fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'line', x1: 30, y1: 45, x2: 43, y2: 46, stroke: 'line', strokeWidth: 1.5 },
    { kind: 'line', x1: 30, y1: 52, x2: 43, y2: 53, stroke: 'line', strokeWidth: 1.5 },
    { kind: 'line', x1: 57, y1: 46, x2: 70, y2: 45, stroke: 'line', strokeWidth: 1.5 },
    { kind: 'line', x1: 57, y1: 53, x2: 70, y2: 52, stroke: 'line', strokeWidth: 1.5 },
    { kind: 'polygon', points: starPoints(50, 24, 7, 3), fill: 'accent' },
  ],
};

/** Glyphs for the quest badges. Keys match badges.art_key. */
export const badgeGlyphs: Record<string, Shape[]> = {
  badge_window: [
    { kind: 'path', d: 'M34 71 L34 45 C34 34 41 27 50 27 C59 27 66 34 66 45 L66 71 Z', fill: 'soft', stroke: 'line', strokeWidth: 3.5 },
    { kind: 'line', x1: 50, y1: 27, x2: 50, y2: 71, stroke: 'line', strokeWidth: 2.5 },
    { kind: 'line', x1: 34, y1: 50, x2: 66, y2: 50, stroke: 'line', strokeWidth: 2.5 },
    { kind: 'line', x1: 38, y1: 57, x2: 46, y2: 57, stroke: 'accent', strokeWidth: 2 },
    { kind: 'line', x1: 38, y1: 62, x2: 45, y2: 62, stroke: 'accent', strokeWidth: 2 },
    { kind: 'line', x1: 54, y1: 57, x2: 62, y2: 57, stroke: 'accent', strokeWidth: 2 },
    { kind: 'line', x1: 54, y1: 62, x2: 61, y2: 62, stroke: 'accent', strokeWidth: 2 },
    { kind: 'rect', x: 29, y: 71, w: 42, h: 5, rx: 1.5, fill: 'line' },
  ],

  badge_lamp: [
    ...streetLamp,
    { kind: 'line', x1: 30, y1: 40, x2: 35, y2: 41, stroke: 'accent', strokeWidth: 2 },
    { kind: 'line', x1: 70, y1: 40, x2: 65, y2: 41, stroke: 'accent', strokeWidth: 2 },
    { kind: 'line', x1: 33, y1: 30, x2: 37, y2: 33, stroke: 'accent', strokeWidth: 2 },
    { kind: 'line', x1: 67, y1: 30, x2: 63, y2: 33, stroke: 'accent', strokeWidth: 2 },
  ],

  badge_magnifier: [
    { kind: 'line', x1: 56, y1: 56, x2: 72, y2: 72, stroke: 'line', strokeWidth: 8 },
    { kind: 'circle', cx: 45, cy: 45, r: 16, fill: 'soft', stroke: 'line', strokeWidth: 4 },
    { kind: 'polygon', points: starPoints(45, 45, 8, 3.5), fill: 'accent' },
    { kind: 'path', d: 'M36 39 C37 36 39 34 42 33', fill: 'none', stroke: 'line', strokeWidth: 2 },
  ],

  badge_envelope: [
    { kind: 'rect', x: 25, y: 33, w: 50, h: 35, rx: 3, fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'path', d: 'M26 35 L50 54 L74 35', fill: 'none', stroke: 'line', strokeWidth: 3 },
    { kind: 'polygon', points: starPoints(50, 54, 7, 3), fill: 'accent', stroke: 'line', strokeWidth: 1 },
  ],

  ...landBadgeGlyphs,
};

/** The app's logo mark: an open storybook with a star. */
export const logoGlyph: Shape[] = avatarGlyphs.stamp_book;
