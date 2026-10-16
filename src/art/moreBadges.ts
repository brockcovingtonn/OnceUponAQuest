/**
 * Badge glyphs for California Adventure and the Quest Pass quests, one per
 * quest. Same 100 × 100 canvas and semantic tones as src/art/shapes.ts.
 *
 * Hard rule: no characters, castles, film props or three-circle "head and
 * ears" shapes. Every glyph is a plain, generic object.
 */
import type { Shape } from './shapes';

const twinkle = (cx: number, cy: number, size: number): Shape[] => [
  { kind: 'line', x1: cx - size, y1: cy, x2: cx + size, y2: cy, stroke: 'accent', strokeWidth: 2 },
  { kind: 'line', x1: cx, y1: cy - size, x2: cx, y2: cy + size, stroke: 'accent', strokeWidth: 2 },
];

export const moreBadgeGlyphs: Record<string, Shape[]> = {
  // Buena Vista Street — a traveler's suitcase with a sticker.
  badge_suitcase: [
    { kind: 'path', d: 'M42 38 V32 C42 29 44 28 46 28 H54 C56 28 58 29 58 32 V38', fill: 'none', stroke: 'line', strokeWidth: 3 },
    { kind: 'rect', x: 28, y: 38, w: 44, h: 34, rx: 4, fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'line', x1: 38, y1: 38, x2: 38, y2: 72, stroke: 'line', strokeWidth: 2 },
    { kind: 'line', x1: 62, y1: 38, x2: 62, y2: 72, stroke: 'line', strokeWidth: 2 },
    { kind: 'circle', cx: 50, cy: 55, r: 7, fill: 'accent', stroke: 'line', strokeWidth: 1.5 },
    ...twinkle(76, 30, 4),
  ],
  // Buena Vista Street — a movie palace with an eight-sided tower.
  badge_marquee: [
    { kind: 'polygon', points: '44,22 56,22 60,30 60,44 40,44 40,30', fill: 'soft', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'rect', x: 26, y: 44, w: 48, h: 30, fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'rect', x: 32, y: 50, w: 36, h: 8, fill: 'accent', stroke: 'line', strokeWidth: 1.5 },
    { kind: 'path', d: 'M44 74 V64 C44 60 56 60 56 64 V74 Z', fill: 'line' },
    { kind: 'circle', cx: 50, cy: 34, r: 3, fill: 'accent' },
  ],
  // Hollywood Land — a clapperboard.
  badge_clapper: [
    { kind: 'rect', x: 28, y: 42, w: 44, h: 30, rx: 3, fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'polygon', points: '28,42 70,30 72,38 30,50', fill: 'line' },
    { kind: 'path', d: 'M36 39 L40 46 M46 36 L50 43 M56 33 L60 40', fill: 'none', stroke: 'soft', strokeWidth: 2.5 },
    { kind: 'line', x1: 34, y1: 58, x2: 66, y2: 58, stroke: 'line', strokeWidth: 2 },
    { kind: 'line', x1: 34, y1: 65, x2: 56, y2: 65, stroke: 'line', strokeWidth: 2 },
    ...twinkle(24, 30, 4),
  ],
  // Hollywood Land — a reel of film.
  badge_film: [
    { kind: 'circle', cx: 46, cy: 48, r: 20, fill: 'soft', stroke: 'line', strokeWidth: 3 },
    ...[0, 72, 144, 216, 288].map((a): Shape => {
      const r = (a * Math.PI) / 180;
      return { kind: 'circle', cx: 46 + Math.cos(r) * 11, cy: 48 + Math.sin(r) * 11, r: 4, fill: 'line' };
    }),
    { kind: 'circle', cx: 46, cy: 48, r: 3, fill: 'accent' },
    { kind: 'path', d: 'M62 60 C70 66 74 70 76 76', fill: 'none', stroke: 'line', strokeWidth: 5 },
  ],
  // Hero campus — a bubbling lab flask.
  badge_flask: [
    { kind: 'path', d: 'M44 26 H56 V42 L70 70 C72 74 70 76 66 76 H34 C30 76 28 74 30 70 L44 42 Z', fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'path', d: 'M36 62 H64 L68 70 C69 73 68 74 65 74 H35 C32 74 31 73 32 70 Z', fill: 'accent' },
    { kind: 'circle', cx: 48, cy: 54, r: 2.5, fill: 'line' },
    { kind: 'circle', cx: 55, cy: 48, r: 2, fill: 'line' },
    ...twinkle(72, 30, 4),
  ],
  // Hero campus — a food cart with an umbrella.
  badge_cart: [
    { kind: 'path', d: 'M30 40 C34 28 66 28 70 40 Z', fill: 'accent', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'line', x1: 50, y1: 40, x2: 50, y2: 48, stroke: 'line', strokeWidth: 2.5 },
    { kind: 'rect', x: 30, y: 48, w: 40, h: 20, rx: 3, fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'circle', cx: 38, cy: 72, r: 5, fill: 'line' },
    { kind: 'circle', cx: 62, cy: 72, r: 5, fill: 'line' },
    { kind: 'line', x1: 70, y1: 52, x2: 78, y2: 46, stroke: 'line', strokeWidth: 3 },
  ],
  // Route 66 town — a traffic cone.
  badge_cone: [
    { kind: 'polygon', points: '50,22 66,70 34,70', fill: 'accent', stroke: 'line', strokeWidth: 3 },
    { kind: 'polygon', points: '44,40 56,40 59,50 41,50', fill: 'soft' },
    { kind: 'polygon', points: '39,56 61,56 63,62 37,62', fill: 'soft' },
    { kind: 'rect', x: 26, y: 70, w: 48, h: 6, rx: 2, fill: 'line' },
  ],
  // Route 66 town — a glowing neon arrow.
  badge_neon: [
    { kind: 'path', d: 'M26 40 H58 V30 L76 50 L58 70 V60 H26 Z', fill: 'none', stroke: 'accent', strokeWidth: 4, opacity: 0.5 },
    { kind: 'path', d: 'M26 40 H58 V30 L76 50 L58 70 V60 H26 Z', fill: 'none', stroke: 'line', strokeWidth: 2.5 },
    ...[34, 42, 50].map((x): Shape => ({ kind: 'circle', cx: x, cy: 50, r: 2.5, fill: 'accent' })),
  ],
  // Harbor town — a gate bridge.
  badge_gate: [
    { kind: 'path', d: 'M24 30 C40 26 60 26 76 30 L74 36 C60 33 40 33 26 36 Z', fill: 'accent', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'rect', x: 30, y: 42, w: 40, h: 5, fill: 'line' },
    { kind: 'rect', x: 34, y: 34, w: 6, h: 40, fill: 'accent', stroke: 'line', strokeWidth: 2 },
    { kind: 'rect', x: 60, y: 34, w: 6, h: 40, fill: 'accent', stroke: 'line', strokeWidth: 2 },
    { kind: 'path', d: 'M22 76 C36 70 64 70 78 76', fill: 'none', stroke: 'line', strokeWidth: 3 },
  ],
  // Harbor town — a loaf of sourdough.
  badge_bread: [
    { kind: 'path', d: 'M26 62 C24 44 38 34 50 34 C62 34 76 44 74 62 C74 68 70 70 64 70 H36 C30 70 26 68 26 62 Z', fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'path', d: 'M38 46 L44 54 M48 42 L54 50 M58 44 L64 52', fill: 'none', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'path', d: 'M34 62 C42 64 58 64 66 62', fill: 'none', stroke: 'accent', strokeWidth: 2 },
    ...twinkle(74, 28, 4),
  ],
  // Boardwalk — a big wheel.
  badge_wheel: [
    { kind: 'circle', cx: 50, cy: 44, r: 22, fill: 'none', stroke: 'line', strokeWidth: 3 },
    ...[0, 45, 90, 135].map((a): Shape => {
      const r = (a * Math.PI) / 180;
      return { kind: 'line', x1: 50 - Math.cos(r) * 22, y1: 44 - Math.sin(r) * 22, x2: 50 + Math.cos(r) * 22, y2: 44 + Math.sin(r) * 22, stroke: 'line', strokeWidth: 1.5 };
    }),
    ...[0, 60, 120, 180, 240, 300].map((a): Shape => {
      const r = (a * Math.PI) / 180;
      return { kind: 'rect', x: 50 + Math.cos(r) * 22 - 3.5, y: 44 + Math.sin(r) * 22 - 2, w: 7, h: 6, rx: 1.5, fill: 'accent', stroke: 'line', strokeWidth: 1 };
    }),
    { kind: 'polygon', points: '50,44 38,76 62,76', fill: 'none', stroke: 'line', strokeWidth: 2.5 },
  ],
  // Boardwalk — a ticket stub.
  badge_ticket: [
    { kind: 'path', d: 'M26 36 H74 V44 C70 44 68 47 68 50 C68 53 70 56 74 56 V64 H26 V56 C30 56 32 53 32 50 C32 47 30 44 26 44 Z', fill: 'accent', stroke: 'line', strokeWidth: 3 },
    { kind: 'line', x1: 40, y1: 38, x2: 40, y2: 62, stroke: 'line', strokeWidth: 1.5, dash: '2 3' },
    { kind: 'polygon', points: '55,43 57,48 62,48 58,51 60,56 55,53 50,56 52,51 48,48 53,48', fill: 'soft' },
  ],
  // Seaside gardens — a swing under a bandstand roof.
  badge_swing: [
    { kind: 'path', d: 'M26 36 L50 22 L74 36 Z', fill: 'accent', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'rect', x: 28, y: 36, w: 44, h: 5, fill: 'soft', stroke: 'line', strokeWidth: 1.5 },
    { kind: 'line', x1: 42, y1: 41, x2: 36, y2: 64, stroke: 'line', strokeWidth: 1.5 },
    { kind: 'line', x1: 50, y1: 41, x2: 44, y2: 64, stroke: 'line', strokeWidth: 1.5 },
    { kind: 'rect', x: 32, y: 64, w: 16, h: 5, rx: 2, fill: 'line' },
    { kind: 'path', d: 'M58 52 C64 50 70 54 72 60', fill: 'none', stroke: 'line', strokeWidth: 2, dash: '2 3' },
  ],
  // Seaside gardens — a scallop shell.
  badge_shell: [
    { kind: 'path', d: 'M50 70 L28 46 C28 30 72 30 72 46 Z', fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'path', d: 'M50 70 L36 34 M50 70 L44 31 M50 70 V30 M50 70 L56 31 M50 70 L64 34', fill: 'none', stroke: 'line', strokeWidth: 1.8 },
    { kind: 'rect', x: 43, y: 68, w: 14, h: 6, rx: 2, fill: 'accent', stroke: 'line', strokeWidth: 1.5 },
  ],
  // Mountain — a pine in front of a peak.
  badge_pine: [
    { kind: 'polygon', points: '24,72 50,30 76,72', fill: 'soft', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'polygon', points: '44,40 50,30 56,40 52,38 50,41 48,38', fill: 'accent' },
    { kind: 'polygon', points: '62,74 62,68 54,68 62,56 57,56 64,44 71,56 66,56 74,68 66,68 66,74', fill: 'line' },
  ],
  // Mountain airfield — a little biplane.
  badge_plane: [
    { kind: 'rect', x: 26, y: 40, w: 48, h: 6, rx: 3, fill: 'accent', stroke: 'line', strokeWidth: 2 },
    { kind: 'rect', x: 30, y: 56, w: 40, h: 5, rx: 2.5, fill: 'accent', stroke: 'line', strokeWidth: 2 },
    { kind: 'path', d: 'M36 50 C36 46 64 46 68 50 C64 54 36 54 36 50 Z', fill: 'soft', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'line', x1: 40, y1: 46, x2: 40, y2: 56, stroke: 'line', strokeWidth: 1.5 },
    { kind: 'line', x1: 60, y1: 46, x2: 60, y2: 56, stroke: 'line', strokeWidth: 1.5 },
    { kind: 'line', x1: 70, y1: 42, x2: 70, y2: 58, stroke: 'line', strokeWidth: 2.5 },
    { kind: 'polygon', points: '36,50 26,44 28,50 26,56', fill: 'line' },
  ],
  // Lost lands — an old folded map.
  badge_oldmap: [
    { kind: 'polygon', points: '26,32 42,28 58,32 74,28 74,68 58,72 42,68 26,72', fill: 'soft', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'line', x1: 42, y1: 28, x2: 42, y2: 68, stroke: 'line', strokeWidth: 1.5 },
    { kind: 'line', x1: 58, y1: 32, x2: 58, y2: 72, stroke: 'line', strokeWidth: 1.5 },
    { kind: 'path', d: 'M32 60 C38 52 44 58 50 50 C56 42 60 48 64 42', fill: 'none', stroke: 'line', strokeWidth: 2, dash: '2 3' },
    { kind: 'path', d: 'M62 38 L68 44 M68 38 L62 44', fill: 'none', stroke: 'accent', strokeWidth: 3 },
  ],
  // Pier lights — a string of glowing bulbs.
  badge_bulbs: [
    { kind: 'path', d: 'M22 34 C36 50 64 50 78 34', fill: 'none', stroke: 'line', strokeWidth: 2 },
    ...[
      [30, 42],
      [42, 47],
      [54, 47],
      [66, 43],
    ].flatMap(([x, y]): Shape[] => [
      { kind: 'circle', cx: x, cy: y + 7, r: 8, fill: 'accent', opacity: 0.35 },
      { kind: 'path', d: `M${x - 4} ${y + 3} C${x - 5} ${y + 10} ${x + 5} ${y + 10} ${x + 4} ${y + 3} Z`, fill: 'accent', stroke: 'line', strokeWidth: 1.5 },
      { kind: 'rect', x: x - 2.5, y: y, w: 5, h: 3, fill: 'line' },
    ]),
    { kind: 'path', d: 'M30 66 C40 70 60 70 70 66', fill: 'none', stroke: 'line', strokeWidth: 2.5 },
  ],
  // Island treasure — a treasure chest.
  badge_chest: [
    { kind: 'path', d: 'M28 46 C28 34 72 34 72 46 Z', fill: 'accent', stroke: 'line', strokeWidth: 3 },
    { kind: 'rect', x: 28, y: 46, w: 44, h: 26, rx: 2, fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'rect', x: 45, y: 44, w: 10, h: 12, rx: 2, fill: 'accent', stroke: 'line', strokeWidth: 2 },
    { kind: 'line', x1: 38, y1: 36, x2: 38, y2: 72, stroke: 'line', strokeWidth: 2 },
    { kind: 'line', x1: 62, y1: 36, x2: 62, y2: 72, stroke: 'line', strokeWidth: 2 },
    ...twinkle(76, 30, 4),
    ...twinkle(24, 30, 3),
  ],
  // Grand circle — a little steam engine.
  badge_steam: [
    { kind: 'rect', x: 26, y: 44, w: 30, h: 20, rx: 6, fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'rect', x: 54, y: 34, w: 18, h: 30, rx: 2, fill: 'accent', stroke: 'line', strokeWidth: 3 },
    { kind: 'rect', x: 58, y: 38, w: 10, h: 8, rx: 1, fill: 'soft' },
    { kind: 'path', d: 'M32 44 V34 H40 V44', fill: 'line' },
    { kind: 'circle', cx: 36, cy: 28, r: 4, fill: 'soft', stroke: 'line', strokeWidth: 1.5 },
    { kind: 'circle', cx: 42, cy: 22, r: 3, fill: 'soft', stroke: 'line', strokeWidth: 1.5 },
    { kind: 'circle', cx: 36, cy: 68, r: 6, fill: 'line' },
    { kind: 'circle', cx: 62, cy: 68, r: 7, fill: 'line' },
    { kind: 'polygon', points: '26,58 18,66 26,66', fill: 'line' },
  ],
};
