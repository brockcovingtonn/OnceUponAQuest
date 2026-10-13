/**
 * Original badge glyphs for the quests outside Main Street, one per quest.
 * Same 100 × 100 canvas and semantic tones as src/art/shapes.ts.
 *
 * Hard rule: no characters, castles or three-circle "head and ears" shapes.
 */
import type { Shape, Tone } from './shapes';

function star(cx: number, cy: number, outer: number, inner: number, points = 5): string {
  const out: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    out.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
  }
  return out.join(' ');
}

function twinkle(cx: number, cy: number, size: number, tone: Tone = 'accent'): Shape[] {
  return [
    { kind: 'line', x1: cx - size, y1: cy, x2: cx + size, y2: cy, stroke: tone, strokeWidth: 2 },
    { kind: 'line', x1: cx, y1: cy - size, x2: cx, y2: cy + size, stroke: tone, strokeWidth: 2 },
  ];
}

function waves(y: number, x1: number, x2: number): Shape {
  let d = `M${x1} ${y}`;
  for (let x = x1; x < x2; x += 8) d += ` C${x + 2} ${y - 3} ${x + 6} ${y + 3} ${x + 8} ${y}`;
  return { kind: 'path', d, fill: 'none', stroke: 'line', strokeWidth: 2 };
}

export const landBadgeGlyphs: Record<string, Shape[]> = {
  // Adventureland — a palm older than the park.
  badge_palm: [
    { kind: 'path', d: 'M46 76 C48 64 49 52 49 40 L54 40 C54 52 53 64 52 76 Z', fill: 'line' },
    { kind: 'path', d: 'M52 38 C44 29 33 29 26 36 C36 35 44 37 52 41 Z', fill: 'soft', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'path', d: 'M52 38 C60 29 71 29 76 36 C67 35 60 37 52 41 Z', fill: 'soft', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'path', d: 'M52 39 C42 40 34 46 30 55 C38 48 45 44 52 42 Z', fill: 'soft', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'path', d: 'M52 39 C62 40 70 46 73 55 C66 48 59 44 52 42 Z', fill: 'soft', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'path', d: 'M52 38 C49 31 51 25 57 22 C55 28 54 33 54 38 Z', fill: 'soft', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'circle', cx: 48.5, cy: 43, r: 3.2, fill: 'accent', stroke: 'line', strokeWidth: 1.2 },
    { kind: 'circle', cx: 55, cy: 43.5, r: 3.2, fill: 'accent', stroke: 'line', strokeWidth: 1.2 },
    { kind: 'path', d: 'M34 77 C42 73 58 73 66 77', fill: 'none', stroke: 'line', strokeWidth: 3 },
  ],

  // Adventureland — a carved garden storyteller.
  badge_drum: [
    { kind: 'polygon', points: '36,27 64,27 61,19 56,24 50,16 44,24 39,19', fill: 'accent', stroke: 'line', strokeWidth: 2 },
    { kind: 'rect', x: 38, y: 27, w: 24, h: 47, rx: 4, fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'path', d: 'M40 37 C44 33 48 35 50 37 C52 35 56 33 60 37', fill: 'none', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'circle', cx: 44.5, cy: 42, r: 4.5, fill: 'soft', stroke: 'line', strokeWidth: 2 },
    { kind: 'circle', cx: 55.5, cy: 42, r: 4.5, fill: 'soft', stroke: 'line', strokeWidth: 2 },
    { kind: 'circle', cx: 45, cy: 42.5, r: 2, fill: 'line' },
    { kind: 'circle', cx: 55, cy: 42.5, r: 2, fill: 'line' },
    { kind: 'path', d: 'M47.5 45 C46 50 44 53 50 53 C56 53 54 50 52.5 45', fill: 'soft', stroke: 'line', strokeWidth: 2 },
    { kind: 'path', d: 'M41 57 C45 59 55 59 59 57 C58 63 55 66 50 66 C45 66 42 63 41 57 Z', fill: 'accent', stroke: 'line', strokeWidth: 2 },
    { kind: 'line', x1: 43, y1: 59, x2: 57, y2: 59, stroke: 'soft', strokeWidth: 2 },
    { kind: 'line', x1: 41, y1: 69, x2: 59, y2: 69, stroke: 'line', strokeWidth: 1.5, dash: '2 2' },
    { kind: 'rect', x: 33, y: 73, w: 34, h: 5, rx: 1.5, fill: 'line' },
  ],

  // New Orleans Square — iron-lace flower.
  badge_fleur: [
    { kind: 'path', d: 'M50 22 C58 31 59 42 50 54 C41 42 42 31 50 22 Z', fill: 'accent', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'path', d: 'M47 52 C38 52 28 48 28 38 C28 31 36 29 40 34 C36 36 37 43 47 46 Z', fill: 'soft', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'path', d: 'M53 52 C62 52 72 48 72 38 C72 31 64 29 60 34 C64 36 63 43 53 46 Z', fill: 'soft', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'rect', x: 37, y: 51, w: 26, h: 6, rx: 2, fill: 'line' },
    { kind: 'path', d: 'M47 57 L53 57 L52 72 L48 72 Z', fill: 'soft', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'path', d: 'M47 58 C43 65 37 67 34 63', fill: 'none', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'path', d: 'M53 58 C57 65 63 67 66 63', fill: 'none', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'line', x1: 42, y1: 75, x2: 58, y2: 75, stroke: 'line', strokeWidth: 3 },
  ],

  // New Orleans Square — the station telegraph.
  badge_telegraph: [
    { kind: 'line', x1: 28, y1: 32, x2: 28.5, y2: 32, stroke: 'accent', strokeWidth: 5 },
    { kind: 'line', x1: 36, y1: 32, x2: 36.5, y2: 32, stroke: 'accent', strokeWidth: 5 },
    { kind: 'line', x1: 44, y1: 32, x2: 55, y2: 32, stroke: 'accent', strokeWidth: 5 },
    { kind: 'line', x1: 63, y1: 32, x2: 63.5, y2: 32, stroke: 'accent', strokeWidth: 5 },
    { kind: 'line', x1: 70, y1: 32, x2: 72, y2: 32, stroke: 'accent', strokeWidth: 5 },
    { kind: 'rect', x: 44, y: 51, w: 6, h: 10, fill: 'line' },
    { kind: 'rect', x: 60, y: 54, w: 3, h: 7, fill: 'line' },
    { kind: 'line', x1: 30, y1: 53, x2: 66, y2: 48, stroke: 'line', strokeWidth: 4 },
    { kind: 'circle', cx: 67, cy: 46.5, r: 6, fill: 'accent', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'rect', x: 24, y: 61, w: 52, h: 9, rx: 2, fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'circle', cx: 30, cy: 65.5, r: 1.6, fill: 'line' },
    { kind: 'circle', cx: 70, cy: 65.5, r: 1.6, fill: 'line' },
    { kind: 'path', d: 'M30 70 C30 76 36 76 38 74', fill: 'none', stroke: 'line', strokeWidth: 2 },
  ],

  // Bayou Country — a canoe on the river.
  badge_canoe: [
    { kind: 'line', x1: 38, y1: 28, x2: 57, y2: 64, stroke: 'line', strokeWidth: 3 },
    { kind: 'path', d: 'M21 47 C29 62 71 62 79 47 L73 50 C61 54 39 54 27 50 Z', fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'line', x1: 30, y1: 51.5, x2: 70, y2: 51.5, stroke: 'accent', strokeWidth: 2 },
    { kind: 'path', d: 'M55 61 C59 62 62 68 60 72 C56 73 53 67 55 61 Z', fill: 'accent', stroke: 'line', strokeWidth: 2 },
    waves(67, 26, 50),
    waves(75, 40, 72),
    ...twinkle(68, 32, 3.5),
  ],

  // Bayou Country — a lily pad, a flower and a firefly.
  badge_lilypad: [
    { kind: 'path', d: 'M50 54 L68 42 A22 22 0 1 1 58 34 Z', fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'path', d: 'M52 58 C55 64 56 68 55 71', fill: 'none', stroke: 'line', strokeWidth: 1.2, opacity: 0.6 },
    { kind: 'path', d: 'M54 56 C61 58 65 60 67 63', fill: 'none', stroke: 'line', strokeWidth: 1.2, opacity: 0.6 },
    { kind: 'path', d: 'M48 58 C44 64 40 67 36 68', fill: 'none', stroke: 'line', strokeWidth: 1.2, opacity: 0.6 },
    { kind: 'polygon', points: star(40, 47, 9, 4, 6), fill: 'accent', stroke: 'line', strokeWidth: 2 },
    { kind: 'circle', cx: 40, cy: 47, r: 2.5, fill: 'line' },
    { kind: 'circle', cx: 70, cy: 26, r: 3, fill: 'accent', stroke: 'line', strokeWidth: 1.5 },
    ...twinkle(70, 26, 7),
  ],

  // Frontierland — a lucky horseshoe.
  badge_horseshoe: [
    { kind: 'path', d: 'M34 28 L34 50 C34 66 42 74 50 74 C58 74 66 66 66 50 L66 28', fill: 'none', stroke: 'line', strokeWidth: 10 },
    { kind: 'path', d: 'M34 31 L34 50 C34 66 42 74 50 74 C58 74 66 66 66 50 L66 31', fill: 'none', stroke: 'soft', strokeWidth: 4 },
    { kind: 'circle', cx: 34, cy: 40, r: 1.6, fill: 'line' },
    { kind: 'circle', cx: 35.5, cy: 55, r: 1.6, fill: 'line' },
    { kind: 'circle', cx: 42, cy: 67, r: 1.6, fill: 'line' },
    { kind: 'circle', cx: 58, cy: 67, r: 1.6, fill: 'line' },
    { kind: 'circle', cx: 64.5, cy: 55, r: 1.6, fill: 'line' },
    { kind: 'circle', cx: 66, cy: 40, r: 1.6, fill: 'line' },
    { kind: 'polygon', points: star(50, 44, 9, 4), fill: 'accent', stroke: 'line', strokeWidth: 2 },
  ],

  // Frontierland — a paddle-wheel riverboat.
  badge_paddlewheel: [
    { kind: 'circle', cx: 42, cy: 19, r: 3, fill: 'accent' },
    { kind: 'circle', cx: 49, cy: 16, r: 2.4, fill: 'accent' },
    { kind: 'rect', x: 39, y: 24, w: 5, h: 16, fill: 'line' },
    { kind: 'rect', x: 49, y: 24, w: 5, h: 16, fill: 'line' },
    { kind: 'rect', x: 37, y: 22, w: 9, h: 3, rx: 1, fill: 'line' },
    { kind: 'rect', x: 47, y: 22, w: 9, h: 3, rx: 1, fill: 'line' },
    { kind: 'rect', x: 34, y: 39, w: 26, h: 9, rx: 1.5, fill: 'soft', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'rect', x: 28, y: 48, w: 36, h: 10, rx: 1.5, fill: 'soft', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'line', x1: 33, y1: 53, x2: 59, y2: 53, stroke: 'line', strokeWidth: 1.5, dash: '2 3' },
    { kind: 'circle', cx: 68, cy: 55, r: 9, fill: 'soft', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'line', x1: 59, y1: 55, x2: 77, y2: 55, stroke: 'line', strokeWidth: 2 },
    { kind: 'line', x1: 68, y1: 46, x2: 68, y2: 64, stroke: 'line', strokeWidth: 2 },
    { kind: 'line', x1: 61.6, y1: 48.6, x2: 74.4, y2: 61.4, stroke: 'line', strokeWidth: 2 },
    { kind: 'line', x1: 74.4, y1: 48.6, x2: 61.6, y2: 61.4, stroke: 'line', strokeWidth: 2 },
    { kind: 'path', d: 'M22 58 L70 58 L66 66 L26 66 Z', fill: 'accent', stroke: 'line', strokeWidth: 2.5 },
    waves(72, 26, 74),
  ],

  // Fantasyland — a sword stuck fast in an anvil on a stone.
  badge_sword: [
    { kind: 'rect', x: 48, y: 31, w: 4, h: 26, fill: 'soft', stroke: 'line', strokeWidth: 2 },
    { kind: 'path', d: 'M35 54 L65 54 L61 60 L39 60 Z', fill: 'line' },
    { kind: 'path', d: 'M23 77 C23 66 30 60 40 60 L60 60 C70 60 77 66 77 77 Z', fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'path', d: 'M33 69 C36 66 40 66 42 68', fill: 'none', stroke: 'line', strokeWidth: 1.5 },
    { kind: 'path', d: 'M58 71 C61 68 65 68 67 70', fill: 'none', stroke: 'line', strokeWidth: 1.5 },
    { kind: 'rect', x: 39, y: 28, w: 22, h: 4, rx: 2, fill: 'line' },
    { kind: 'rect', x: 48, y: 19, w: 4, h: 9, fill: 'line' },
    { kind: 'circle', cx: 50, cy: 18, r: 3.5, fill: 'accent', stroke: 'line', strokeWidth: 1.5 },
    ...twinkle(33, 38, 4),
    ...twinkle(68, 42, 3),
  ],

  // Fantasyland — a clock that comes alive every quarter hour.
  badge_clock: [
    { kind: 'polygon', points: '32,34 50,18 68,34', fill: 'accent', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'circle', cx: 50, cy: 52, r: 20, fill: 'soft', stroke: 'line', strokeWidth: 3 },
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i): Shape => {
      const a = (i * Math.PI) / 6;
      const r1 = i % 3 === 0 ? 13 : 15;
      return {
        kind: 'line',
        x1: +(50 + r1 * Math.sin(a)).toFixed(1),
        y1: +(52 - r1 * Math.cos(a)).toFixed(1),
        x2: +(50 + 17 * Math.sin(a)).toFixed(1),
        y2: +(52 - 17 * Math.cos(a)).toFixed(1),
        stroke: 'line',
        strokeWidth: i % 3 === 0 ? 2.5 : 1.5,
      };
    }),
    { kind: 'line', x1: 50, y1: 52, x2: 50, y2: 39, stroke: 'line', strokeWidth: 3 },
    { kind: 'line', x1: 50, y1: 52, x2: 59, y2: 56, stroke: 'line', strokeWidth: 2.5 },
    { kind: 'circle', cx: 50, cy: 52, r: 2.5, fill: 'accent' },
    { kind: 'circle', cx: 50, cy: 27, r: 2.5, fill: 'soft', stroke: 'line', strokeWidth: 1.5 },
  ],

  // Toontown — a mailbox with a surprise inside.
  badge_mailbox: [
    { kind: 'rect', x: 44, y: 58, w: 6, h: 18, fill: 'line' },
    { kind: 'rect', x: 36, y: 74, w: 22, h: 4, rx: 1.5, fill: 'line' },
    { kind: 'path', d: 'M27 58 L27 43 C27 35 33 31 40 31 L54 31 C61 31 67 35 67 43 L67 58 Z', fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'path', d: 'M27 43 C27 37 31 34 36 34 C41 34 45 37 45 43 L45 58', fill: 'none', stroke: 'line', strokeWidth: 2 },
    { kind: 'polygon', points: star(36, 47, 6, 2.6), fill: 'accent' },
    { kind: 'rect', x: 70, y: 30, w: 3, h: 22, fill: 'line' },
    { kind: 'polygon', points: '73,30 80,33.5 73,37', fill: 'accent', stroke: 'line', strokeWidth: 1.5 },
    { kind: 'line', x1: 67, y1: 50, x2: 70, y2: 50, stroke: 'line', strokeWidth: 2 },
  ],

  // Toontown — a spring-loaded gag crate.
  badge_spring: [
    { kind: 'path', d: 'M50 56 L42 52 L58 47 L42 42 L58 37 L50 34', fill: 'none', stroke: 'line', strokeWidth: 3 },
    { kind: 'polygon', points: star(50, 26, 9, 4), fill: 'accent', stroke: 'line', strokeWidth: 2 },
    { kind: 'rect', x: 31, y: 56, w: 38, h: 20, rx: 1.5, fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'line', x1: 31, y1: 62.5, x2: 69, y2: 62.5, stroke: 'line', strokeWidth: 1.5 },
    { kind: 'line', x1: 31, y1: 69.5, x2: 69, y2: 69.5, stroke: 'line', strokeWidth: 1.5 },
    { kind: 'line', x1: 34, y1: 59, x2: 66, y2: 73, stroke: 'line', strokeWidth: 2 },
    { kind: 'polygon', points: '31,56 23,45 27,43 35,54', fill: 'soft', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'line', x1: 62, y1: 24, x2: 68, y2: 21, stroke: 'accent', strokeWidth: 2 },
    { kind: 'line', x1: 63, y1: 31, x2: 70, y2: 31, stroke: 'accent', strokeWidth: 2 },
    { kind: 'line', x1: 38, y1: 24, x2: 32, y2: 21, stroke: 'accent', strokeWidth: 2 },
  ],

  // Tomorrowland — a retro rocket.
  badge_rocket: [
    { kind: 'path', d: 'M44 64 C45 71 50 78 50 78 C50 78 55 71 56 64 Z', fill: 'accent', stroke: 'line', strokeWidth: 2 },
    { kind: 'path', d: 'M40 49 L29 67 L41 63 Z', fill: 'accent', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'path', d: 'M60 49 L71 67 L59 63 Z', fill: 'accent', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'path', d: 'M50 19 C60 27 62 44 60 63 L40 63 C38 44 40 27 50 19 Z', fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'path', d: 'M43 28 C46 25 54 25 57 28', fill: 'none', stroke: 'accent', strokeWidth: 2.5 },
    { kind: 'circle', cx: 50, cy: 41, r: 5.5, fill: 'accent', stroke: 'line', strokeWidth: 2.5 },
    { kind: 'rect', x: 48.5, y: 54, w: 3, h: 13, rx: 1, fill: 'line' },
    ...twinkle(27, 32, 3.5),
    ...twinkle(72, 28, 3),
  ],

  // Tomorrowland — a ringed planet sprouting a garden.
  badge_planet: [
    { kind: 'path', d: 'M27 57 C26 47 73 41 74 49', fill: 'none', stroke: 'line', strokeWidth: 3 },
    { kind: 'circle', cx: 50, cy: 53, r: 15, fill: 'soft', stroke: 'line', strokeWidth: 3 },
    { kind: 'path', d: 'M42 47 C44 45 47 44 50 44', fill: 'none', stroke: 'line', strokeWidth: 1.5 },
    { kind: 'path', d: 'M27 57 C28 64 73 58 74 49', fill: 'none', stroke: 'accent', strokeWidth: 3.5 },
    { kind: 'line', x1: 50, y1: 38, x2: 50, y2: 29, stroke: 'line', strokeWidth: 2.5 },
    { kind: 'path', d: 'M50 33 C44 33 41 29 41 25 C46 25 50 28 50 33 Z', fill: 'accent', stroke: 'line', strokeWidth: 1.5 },
    { kind: 'path', d: 'M50 31 C55 31 58 27 59 23 C54 23 50 26 50 31 Z', fill: 'accent', stroke: 'line', strokeWidth: 1.5 },
    ...twinkle(30, 33, 3.5),
    ...twinkle(71, 33, 3),
  ],
};
