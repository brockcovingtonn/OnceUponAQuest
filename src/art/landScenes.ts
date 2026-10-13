/**
 * Original storybook vignettes (400 × 240) for the quests outside Main Street:
 * one per quest, each land with its own sky — jungle dusk, French Quarter
 * night, firefly bayou, frontier sunset, Fantasyland twilight, a sunny cartoon
 * town and a starry tomorrow. Covers crop to the middle band (about y 70–175),
 * so each vignette keeps its focal point there.
 *
 * Hard rule: no castles, characters, three-circle shapes, or copies of any
 * specific real building or sign.
 */
import type { Shape } from './shapes';

type Hex = `#${string}`;

const INK: Hex = '#1A1F38';
const PARCHMENT: Hex = '#FAF5EA';
const GOLD: Hex = '#E2B04A';
const GLOW: Hex = '#F6D58E';
const BULB: Hex = '#FFF4CF';
const RED: Hex = '#C8475A';

// ---------------------------------------------------------------------------
// Little helpers
// ---------------------------------------------------------------------------

function sky(from: Hex, to: Hex): Shape {
  return { kind: 'gradient', x: 0, y: 0, w: 400, h: 240, from, to };
}

function sparkle(cx: number, cy: number, r: number, fill: Hex = BULB, opacity = 1): Shape {
  const s = r * 0.28;
  return {
    kind: 'polygon',
    points: `${cx},${cy - r} ${cx + s},${cy - s} ${cx + r},${cy} ${cx + s},${cy + s} ${cx},${cy + r} ${cx - s},${cy + s} ${cx - r},${cy} ${cx - s},${cy - s}`,
    fill,
    opacity,
  };
}

const STAR_FIELD: [number, number, number][] = [
  [24, 22, 3], [70, 48, 2], [112, 16, 2.5], [156, 40, 2], [198, 14, 3], [236, 44, 2],
  [282, 20, 2.5], [330, 52, 2], [372, 18, 3], [52, 80, 1.8], [262, 78, 1.8], [384, 84, 2],
];

function stars(opacity = 0.9, fill: Hex = BULB): Shape[] {
  return STAR_FIELD.map(([x, y, r]) => sparkle(x, y, r * 1.6, fill, opacity));
}

function moon(cx: number, cy: number, r: number): Shape[] {
  return [
    { kind: 'circle', cx, cy, r: r * 1.9, fill: '#F7E4A8', opacity: 0.12 },
    { kind: 'circle', cx, cy, r, fill: '#F7E4A8' },
    { kind: 'circle', cx: cx - r * 0.3, cy: cy - r * 0.2, r: r * 0.18, fill: '#E6CF8E' },
    { kind: 'circle', cx: cx + r * 0.32, cy: cy + r * 0.3, r: r * 0.12, fill: '#E6CF8E' },
  ];
}

function ellipse(cx: number, cy: number, rx: number, ry: number, paint: Omit<Extract<Shape, { kind: 'path' }>, 'kind' | 'd'>): Shape {
  return {
    kind: 'path',
    d: `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`,
    ...paint,
  };
}

function water(top: number, color: Hex, shine: Hex): Shape[] {
  return [
    { kind: 'rect', x: 0, y: top, w: 400, h: 240 - top, fill: color },
    { kind: 'line', x1: 30, y1: top + 12, x2: 74, y2: top + 12, stroke: shine, strokeWidth: 2, opacity: 0.5 },
    { kind: 'line', x1: 170, y1: top + 22, x2: 230, y2: top + 22, stroke: shine, strokeWidth: 2, opacity: 0.45 },
    { kind: 'line', x1: 300, y1: top + 14, x2: 352, y2: top + 14, stroke: shine, strokeWidth: 2, opacity: 0.5 },
    { kind: 'line', x1: 90, y1: top + 34, x2: 128, y2: top + 34, stroke: shine, strokeWidth: 2, opacity: 0.35 },
    { kind: 'line', x1: 260, y1: top + 40, x2: 300, y2: top + 40, stroke: shine, strokeWidth: 2, opacity: 0.35 },
  ];
}

function palm(x: number, base: number, h: number, color: Hex): Shape[] {
  const top = base - h;
  return [
    { kind: 'path', d: `M${x - 5} ${base} C${x - 2} ${base - h * 0.5} ${x + 6} ${top + 20} ${x + 4} ${top} L${x + 9} ${top} C${x + 12} ${top + 22} ${x + 4} ${base - h * 0.5} ${x + 5} ${base} Z`, fill: color },
    { kind: 'path', d: `M${x + 6} ${top} C${x - 10} ${top - 16} ${x - 34} ${top - 12} ${x - 44} ${top + 6} C${x - 28} ${top - 4} ${x - 12} ${top - 2} ${x + 6} ${top + 4} Z`, fill: color },
    { kind: 'path', d: `M${x + 6} ${top} C${x + 22} ${top - 16} ${x + 46} ${top - 12} ${x + 56} ${top + 6} C${x + 40} ${top - 4} ${x + 24} ${top - 2} ${x + 6} ${top + 4} Z`, fill: color },
    { kind: 'path', d: `M${x + 6} ${top + 2} C${x - 14} ${top + 4} ${x - 30} ${top + 18} ${x - 34} ${top + 34} C${x - 22} ${top + 18} ${x - 8} ${top + 10} ${x + 6} ${top + 6} Z`, fill: color },
    { kind: 'path', d: `M${x + 6} ${top + 2} C${x + 26} ${top + 4} ${x + 42} ${top + 18} ${x + 46} ${top + 34} C${x + 34} ${top + 18} ${x + 20} ${top + 10} ${x + 6} ${top + 6} Z`, fill: color },
    { kind: 'path', d: `M${x + 6} ${top} C${x + 2} ${top - 14} ${x + 8} ${top - 26} ${x + 20} ${top - 30} C${x + 14} ${top - 20} ${x + 10} ${top - 10} ${x + 9} ${top} Z`, fill: color },
  ];
}

function torch(x: number, top: number, base: number): Shape[] {
  return [
    { kind: 'rect', x: x - 2.5, y: top, w: 5, h: base - top, fill: '#5A3E2A' },
    { kind: 'path', d: `M${x - 6} ${top} L${x + 6} ${top} L${x + 4} ${top + 8} L${x - 4} ${top + 8} Z`, fill: '#8E6A3A' },
    { kind: 'circle', cx: x, cy: top - 8, r: 14, fill: GLOW, opacity: 0.18 },
    { kind: 'path', d: `M${x} ${top - 20} C${x + 8} ${top - 10} ${x + 7} ${top - 2} ${x} ${top} C${x - 7} ${top - 2} ${x - 8} ${top - 10} ${x} ${top - 20} Z`, fill: '#F2A04A' },
    { kind: 'path', d: `M${x} ${top - 12} C${x + 4} ${top - 7} ${x + 3} ${top - 2} ${x} ${top - 1} C${x - 3} ${top - 2} ${x - 4} ${top - 7} ${x} ${top - 12} Z`, fill: BULB },
  ];
}

function firefly(x: number, y: number): Shape[] {
  return [
    { kind: 'circle', cx: x, cy: y, r: 6, fill: '#F6E27A', opacity: 0.2 },
    { kind: 'circle', cx: x, cy: y, r: 2, fill: '#FFF7B0' },
  ];
}

function puffs(x: number, y: number, color: Hex = PARCHMENT, opacity = 0.35): Shape[] {
  return [
    { kind: 'circle', cx: x, cy: y, r: 7, fill: color, opacity },
    { kind: 'circle', cx: x + 9, cy: y - 9, r: 9, fill: color, opacity: opacity * 0.85 },
    { kind: 'circle', cx: x + 22, cy: y - 16, r: 11, fill: color, opacity: opacity * 0.7 },
  ];
}

function cloud(x: number, y: number, s = 1): Shape[] {
  return [
    { kind: 'circle', cx: x, cy: y, r: 12 * s, fill: '#FFFFFF' },
    { kind: 'circle', cx: x + 14 * s, cy: y - 7 * s, r: 14 * s, fill: '#FFFFFF' },
    { kind: 'circle', cx: x + 30 * s, cy: y, r: 11 * s, fill: '#FFFFFF' },
    { kind: 'rect', x: x, y: y, w: 30 * s, h: 11 * s, fill: '#FFFFFF' },
  ];
}

function note(x: number, y: number, color: Hex): Shape[] {
  return [
    ellipse(x, y, 5, 3.6, { fill: color }),
    { kind: 'rect', x: x + 3.2, y: y - 18, w: 2, h: 18, fill: color },
    { kind: 'path', d: `M${x + 5.2} ${y - 18} C${x + 10} ${y - 15} ${x + 12} ${y - 12} ${x + 10} ${y - 8}`, fill: 'none', stroke: color, strokeWidth: 2 },
  ];
}

function bulbRow(x1: number, x2: number, y: number, step = 10): Shape[] {
  const out: Shape[] = [];
  for (let x = x1; x <= x2; x += step) out.push({ kind: 'circle', cx: x, cy: y, r: 2, fill: BULB });
  return out;
}

/** A simple carrousel horse facing right, standing on (x, y) at the hooves. */
function horse(x: number, y: number, body: Hex, saddle: Hex): Shape[] {
  return [
    { kind: 'path', d: `M${x} ${y - 14} C${x + 4} ${y - 18} ${x + 18} ${y - 18} ${x + 22} ${y - 15} L${x + 27} ${y - 26} C${x + 30} ${y - 28} ${x + 34} ${y - 26} ${x + 34} ${y - 22} L${x + 30} ${y - 20} L${x + 27} ${y - 12} C${x + 25} ${y - 8} ${x + 22} ${y - 7} ${x + 20} ${y - 7} L${x + 22} ${y} L${x + 18} ${y} L${x + 15} ${y - 7} L${x + 6} ${y - 7} L${x + 2} ${y} L${x - 2} ${y} L${x + 1} ${y - 8} C${x - 3} ${y - 9} ${x - 4} ${y - 12} ${x} ${y - 14} Z`, fill: body, stroke: INK, strokeWidth: 1 },
    { kind: 'rect', x: x + 8, y: y - 18, w: 9, h: 5, rx: 2, fill: saddle },
    { kind: 'path', d: `M${x} ${y - 13} C${x - 6} ${y - 12} ${x - 8} ${y - 6} ${x - 6} ${y - 2}`, fill: 'none', stroke: saddle, strokeWidth: 2 },
  ];
}

// ---------------------------------------------------------------------------
// Adventureland
// ---------------------------------------------------------------------------

const jungleExpedition: Shape[] = [
  sky('#2A1E4A', '#D07A5A'),
  ...stars(0.6).slice(0, 6),
  { kind: 'circle', cx: 300, cy: 128, r: 44, fill: '#F2B05E', opacity: 0.25 },
  { kind: 'circle', cx: 300, cy: 128, r: 30, fill: '#F2B05E' },
  { kind: 'path', d: 'M0 132 C30 112 50 122 70 110 C95 98 120 116 140 106 C170 92 190 112 220 102 C250 92 270 110 300 100 C330 90 360 108 400 98 L400 160 L0 160 Z', fill: '#3A5A44' },
  ...palm(40, 160, 100, '#1E3B30'),
  ...palm(352, 164, 118, '#1E3B30'),
  ...water(152, '#2F5B63', '#9FD0C8'),
  { kind: 'rect', x: 0, y: 144, w: 120, h: 8, fill: '#6B4A33' },
  ...[8, 40, 72, 104].map((x): Shape => ({ kind: 'rect', x, y: 144, w: 6, h: 26, fill: '#4E3424' })),
  // A striped-canopy launch on the river.
  ...[164, 202, 240, 276].map((x): Shape => ({ kind: 'line', x1: x, y1: 162, x2: x, y2: 128, stroke: '#4E3424', strokeWidth: 3 })),
  { kind: 'path', d: 'M152 130 L288 130 L282 118 L158 118 Z', fill: RED },
  ...[164, 188, 212, 236, 260].map((x): Shape => ({ kind: 'rect', x, y: 118, w: 12, h: 12, fill: PARCHMENT })),
  { kind: 'path', d: 'M152 130 L288 130 L282 118 L158 118 Z', fill: 'none', stroke: INK, strokeWidth: 1.5 },
  { kind: 'path', d: 'M146 162 L294 162 L284 180 L160 180 Z', fill: '#E9DDC4', stroke: INK, strokeWidth: 2 },
  { kind: 'rect', x: 152, y: 167, w: 136, h: 4, fill: '#3F6B52' },
  { kind: 'line', x1: 220, y1: 118, x2: 220, y2: 104, stroke: INK, strokeWidth: 1.5 },
  { kind: 'polygon', points: '220,104 234,108 220,112', fill: GOLD },
  { kind: 'path', d: 'M150 186 C180 182 260 182 290 186', fill: 'none', stroke: '#9FD0C8', strokeWidth: 2, opacity: 0.5 },
  { kind: 'path', d: 'M0 240 L0 200 C14 196 30 206 36 220 C24 214 12 216 0 240 Z', fill: '#16302A' },
  { kind: 'path', d: 'M400 240 L400 196 C384 194 368 204 362 220 C374 214 388 216 400 240 Z', fill: '#16302A' },
];

const tikiGarden: Shape[] = [
  sky('#1B1838', '#5A3A6A'),
  ...stars(0.8),
  ...moon(64, 40, 14),
  { kind: 'rect', x: 0, y: 186, w: 400, h: 54, fill: '#3A2E28' },
  // Thatched hut.
  { kind: 'rect', x: 124, y: 118, w: 152, h: 72, fill: '#7A5236' },
  { kind: 'path', d: 'M180 190 L180 152 C180 140 220 140 220 152 L220 190 Z', fill: '#2A1E1A' },
  { kind: 'rect', x: 140, y: 140, w: 24, h: 20, rx: 2, fill: GLOW, opacity: 0.85 },
  { kind: 'rect', x: 236, y: 140, w: 24, h: 20, rx: 2, fill: GLOW, opacity: 0.85 },
  { kind: 'polygon', points: '100,124 200,58 300,124', fill: '#C9A060' },
  ...[[84, 162.5, 237.5], [100, 138.5, 261.5], [116, 114.5, 285.5]].map(([y, a, b]): Shape => ({
    kind: 'line', x1: a, y1: y, x2: b, y2: y, stroke: '#8E6A3A', strokeWidth: 2, dash: '5 3',
  })),
  { kind: 'path', d: 'M100 124 L108 132 L116 124 L124 132 L132 124 L140 132 L148 124 L156 132 L164 124 L172 132 L180 124 L188 132 L196 124 L204 132 L212 124 L220 132 L228 124 L236 132 L244 124 L252 132 L260 124 L268 132 L276 124 L284 132 L292 124 L300 124', fill: '#B88A4A' },
  { kind: 'line', x1: 200, y1: 58, x2: 200, y2: 44, stroke: '#5A3E2A', strokeWidth: 3 },
  sparkle(200, 40, 6, GLOW),
  ...bulbRow(112, 288, 136, 16),
  // Carved storytellers.
  ...[[30, 130], [334, 124]].flatMap(([x, top]): Shape[] => [
    { kind: 'polygon', points: `${x - 2},${top} ${x + 38},${top} ${x + 33},${top - 10} ${x + 26},${top - 4} ${x + 18},${top - 14} ${x + 10},${top - 4} ${x + 3},${top - 10}`, fill: RED },
    { kind: 'rect', x, y: top, w: 36, h: 190 - top, rx: 4, fill: '#9A7246', stroke: INK, strokeWidth: 1.5 },
    { kind: 'circle', cx: x + 11, cy: top + 16, r: 5.5, fill: PARCHMENT, stroke: INK, strokeWidth: 1.5 },
    { kind: 'circle', cx: x + 25, cy: top + 16, r: 5.5, fill: PARCHMENT, stroke: INK, strokeWidth: 1.5 },
    { kind: 'circle', cx: x + 11, cy: top + 17, r: 2.2, fill: INK },
    { kind: 'circle', cx: x + 25, cy: top + 17, r: 2.2, fill: INK },
    { kind: 'path', d: `M${x + 8} ${top + 30} C${x + 14} ${top + 34} ${x + 22} ${top + 34} ${x + 28} ${top + 30} C${x + 26} ${top + 40} ${x + 10} ${top + 40} ${x + 8} ${top + 30} Z`, fill: INK },
    { kind: 'line', x1: x + 4, y1: top + 48, x2: x + 32, y2: top + 48, stroke: INK, strokeWidth: 1.5, dash: '3 3' },
  ]),
  ...torch(96, 122, 190),
  ...torch(304, 122, 190),
  ...[[60, 206, '#E86A8A'], [120, 214, '#F2C14E'], [250, 210, '#E86A8A'], [330, 216, '#F2C14E'], [180, 222, '#F28A5A']].flatMap(
    ([x, y, c]): Shape[] => [
      { kind: 'circle', cx: x as number, cy: y as number, r: 5, fill: c as Hex },
      { kind: 'circle', cx: x as number, cy: y as number, r: 1.8, fill: BULB },
    ],
  ),
];

// ---------------------------------------------------------------------------
// New Orleans Square
// ---------------------------------------------------------------------------

function quarterHouse(x: number, w: number, color: Hex, shutter: Hex): Shape[] {
  const out: Shape[] = [
    { kind: 'rect', x, y: 62, w, h: 134, fill: color },
    { kind: 'rect', x: x - 4, y: 56, w: w + 8, h: 8, fill: '#3A3352' },
    { kind: 'rect', x: x - 2, y: 64, w: w + 4, h: 3, fill: '#F4EEDF', opacity: 0.6 },
  ];
  const cols = Math.floor(w / 44);
  const gap = w / cols;
  for (let i = 0; i < cols; i++) {
    const cx = x + gap * (i + 0.5);
    out.push(
      { kind: 'rect', x: cx - 15, y: 74, w: 6, h: 28, fill: shutter },
      { kind: 'rect', x: cx + 9, y: 74, w: 6, h: 28, fill: shutter },
      { kind: 'path', d: `M${cx - 9} 102 L${cx - 9} 80 C${cx - 9} 72 ${cx + 9} 72 ${cx + 9} 80 L${cx + 9} 102 Z`, fill: i % 2 ? '#2D3866' : GLOW },
      { kind: 'rect', x: cx - 15, y: 134, w: 6, h: 40, fill: shutter },
      { kind: 'rect', x: cx + 9, y: 134, w: 6, h: 40, fill: shutter },
      { kind: 'path', d: `M${cx - 9} 196 L${cx - 9} 142 C${cx - 9} 132 ${cx + 9} 132 ${cx + 9} 142 L${cx + 9} 196 Z`, fill: i % 2 ? GLOW : '#2D3866' },
    );
  }
  // Iron-lace balcony.
  out.push(
    { kind: 'rect', x: x - 6, y: 118, w: w + 12, h: 4, fill: INK },
    { kind: 'line', x1: x - 6, y1: 104, x2: x + w + 6, y2: 104, stroke: INK, strokeWidth: 2 },
  );
  for (let bx = x; bx <= x + w; bx += 8) {
    out.push({ kind: 'circle', cx: bx, cy: 111, r: 3, fill: 'none', stroke: INK, strokeWidth: 1.2 });
  }
  for (let px = x - 4; px <= x + w + 4; px += gap) {
    out.push(
      { kind: 'rect', x: px - 1.5, y: 122, w: 3, h: 74, fill: INK },
      { kind: 'path', d: `M${px - 1} 128 C${px + 8} 128 ${px + 10} 134 ${px + 12} 140`, fill: 'none', stroke: INK, strokeWidth: 1.2 },
      { kind: 'circle', cx: px + 2, cy: 128, r: 5, fill: '#4F7A4A' },
      { kind: 'circle', cx: px - 2, cy: 131, r: 4, fill: '#3F6B52' },
    );
  }
  return out;
}

function gasLamp(x: number): Shape[] {
  return [
    { kind: 'rect', x: x - 2, y: 132, w: 4, h: 64, fill: INK },
    { kind: 'circle', cx: x, cy: 124, r: 16, fill: GLOW, opacity: 0.2 },
    { kind: 'path', d: `M${x - 7} 116 L${x + 7} 116 L${x + 5} 132 L${x - 5} 132 Z`, fill: GLOW, stroke: INK, strokeWidth: 1.5 },
    { kind: 'polygon', points: `${x - 9},116 ${x + 9},116 ${x},108`, fill: INK },
    { kind: 'rect', x: x - 10, y: 150, w: 20, h: 5, rx: 1, fill: '#3F6B52' },
  ];
}

const royalStreet: Shape[] = [
  sky('#121833', '#2C3768'),
  ...stars(),
  ...moon(352, 30, 12),
  ...quarterHouse(6, 176, '#C9849A', '#3F6B52'),
  ...quarterHouse(218, 176, '#D9B86A', '#3F5FA8'),
  { kind: 'rect', x: 0, y: 196, w: 400, h: 44, fill: '#4A3439' },
  { kind: 'rect', x: 0, y: 196, w: 400, h: 6, fill: '#6B5A63' },
  ...gasLamp(200),
  // A green door with a little brass plaque.
  { kind: 'rect', x: 192, y: 164, w: 16, h: 32, fill: '#2F6B4A', stroke: INK, strokeWidth: 1 },
  { kind: 'rect', x: 197, y: 170, w: 6, h: 4, fill: GOLD },
];

const riverfrontRails: Shape[] = [
  sky('#121833', '#2E4A6A'),
  ...stars(),
  ...moon(40, 34, 11),
  // Ship masts peeking over the rooftops.
  ...[86, 134].flatMap((x): Shape[] => [
    { kind: 'line', x1: x, y1: 26, x2: x, y2: 120, stroke: '#2A2440', strokeWidth: 4 },
    { kind: 'line', x1: x - 18, y1: 46, x2: x + 18, y2: 46, stroke: '#2A2440', strokeWidth: 3 },
    { kind: 'line', x1: x - 14, y1: 70, x2: x + 14, y2: 70, stroke: '#2A2440', strokeWidth: 3 },
    { kind: 'line', x1: x, y1: 26, x2: x + 40, y2: 100, stroke: '#2A2440', strokeWidth: 1 },
    { kind: 'polygon', points: `${x},22 ${x + 12},26 ${x},30`, fill: RED },
  ]),
  // Rooftops.
  { kind: 'rect', x: 0, y: 96, w: 110, h: 100, fill: '#A58FBF' },
  { kind: 'rect', x: 110, y: 108, w: 120, h: 88, fill: '#D28C76' },
  { kind: 'rect', x: -4, y: 90, w: 118, h: 7, fill: '#3A3352' },
  { kind: 'rect', x: 106, y: 102, w: 128, h: 7, fill: '#3A3352' },
  { kind: 'rect', x: 30, y: 78, w: 10, h: 14, fill: '#3A3352' },
  { kind: 'rect', x: 180, y: 90, w: 10, h: 14, fill: '#3A3352' },
  ...[18, 50, 82, 128, 160, 192].map((x, i): Shape => ({
    kind: 'path', d: `M${x} ${i < 3 ? 140 : 150} L${x} ${i < 3 ? 120 : 128} C${x} ${i < 3 ? 112 : 120} ${x + 16} ${i < 3 ? 112 : 120} ${x + 16} ${i < 3 ? 120 : 128} L${x + 16} ${i < 3 ? 140 : 150} Z`,
    fill: i % 2 ? GLOW : '#2D3866',
  })),
  // Station with a peaked roof.
  { kind: 'rect', x: 252, y: 120, w: 140, h: 52, fill: '#7FAE9B' },
  { kind: 'polygon', points: '242,122 322,90 402,122', fill: '#3A3352' },
  { kind: 'rect', x: 312, y: 104, w: 20, h: 12, rx: 2, fill: GLOW },
  ...[264, 296, 340, 372].map((x): Shape => ({ kind: 'rect', x, y: 132, w: 14, h: 22, rx: 2, fill: GLOW })),
  { kind: 'rect', x: 238, y: 170, w: 162, h: 8, fill: '#6B4A33' },
  ...bulbRow(250, 394, 124, 12),
  ...puffs(352, 74, PARCHMENT, 0.3),
  // Telegraph pole and a message in dots and dashes.
  { kind: 'rect', x: 228, y: 92, w: 4, h: 104, fill: '#4E3424' },
  { kind: 'rect', x: 216, y: 98, w: 28, h: 4, fill: '#4E3424' },
  { kind: 'path', d: 'M216 100 C180 112 140 112 110 104', fill: 'none', stroke: INK, strokeWidth: 1.2 },
  { kind: 'path', d: 'M244 100 C270 110 300 110 330 100', fill: 'none', stroke: INK, strokeWidth: 1.2 },
  ...[[150, 92, 3], [162, 92, 3], [176, 92, 12], [196, 92, 3]].map(([x, y, w]): Shape => ({
    kind: 'rect', x, y, w, h: 3, rx: 1.5, fill: GOLD,
  })),
  ...water(184, '#22344F', '#8FB0D8'),
];

// ---------------------------------------------------------------------------
// Bayou Country
// ---------------------------------------------------------------------------

function cypress(x: number, base: number, h: number): Shape[] {
  const top = base - h;
  return [
    { kind: 'path', d: `M${x - 10} ${base} C${x - 4} ${base - 10} ${x - 4} ${top + 30} ${x - 2} ${top + 10} L${x + 4} ${top + 10} C${x + 6} ${top + 30} ${x + 6} ${base - 10} ${x + 12} ${base} Z`, fill: '#2A2A24' },
    ellipse(x, top + 8, 34, 12, { fill: '#24402F' }),
    ellipse(x - 14, top + 24, 22, 9, { fill: '#2B4A36' }),
    ellipse(x + 16, top + 22, 20, 8, { fill: '#2B4A36' }),
    ...[-28, -16, -4, 10, 24, 32].map((dx, i): Shape => ({
      kind: 'path',
      d: `M${x + dx} ${top + 14 + (i % 2) * 8} C${x + dx - 2} ${top + 30} ${x + dx + 2} ${top + 40} ${x + dx} ${top + 52 + (i % 3) * 6}`,
      fill: 'none', stroke: '#7E9A74', strokeWidth: 2, opacity: 0.75,
    })),
  ];
}

const bayouBend: Shape[] = [
  sky('#0F2230', '#2E5A66'),
  ...stars(0.7),
  ...moon(310, 54, 20),
  { kind: 'path', d: 'M0 164 C40 150 80 158 120 150 C170 140 210 156 260 150 C310 144 350 158 400 150 L400 180 L0 180 Z', fill: '#18302C' },
  ...water(170, '#163240', '#7FB3C0'),
  { kind: 'rect', x: 296, y: 178, w: 28, h: 3, rx: 1.5, fill: '#F7E4A8', opacity: 0.55 },
  { kind: 'rect', x: 302, y: 188, w: 18, h: 3, rx: 1.5, fill: '#F7E4A8', opacity: 0.4 },
  { kind: 'rect', x: 306, y: 198, w: 10, h: 3, rx: 1.5, fill: '#F7E4A8', opacity: 0.3 },
  ...cypress(48, 182, 120),
  ...cypress(372, 178, 104),
  // Canoe and paddles.
  { kind: 'path', d: 'M110 176 C130 194 230 194 250 176 L240 180 C210 186 150 186 120 180 Z', fill: '#8A5A3A', stroke: INK, strokeWidth: 1.5 },
  { kind: 'line', x1: 122, y1: 180, x2: 238, y2: 180, stroke: GOLD, strokeWidth: 1.5 },
  { kind: 'line', x1: 150, y1: 150, x2: 166, y2: 196, stroke: '#5A3E2A', strokeWidth: 3 },
  ellipse(167, 198, 4, 7, { fill: '#5A3E2A' }),
  { kind: 'line', x1: 214, y1: 150, x2: 200, y2: 196, stroke: '#5A3E2A', strokeWidth: 3 },
  ellipse(199, 198, 4, 7, { fill: '#5A3E2A' }),
  // Dock pilings.
  ...[262, 278].map((x): Shape => ({ kind: 'rect', x, y: 160, w: 6, h: 40, rx: 2, fill: '#4E3424' })),
  { kind: 'rect', x: 256, y: 164, w: 34, h: 5, fill: '#6B4A33' },
  ...[[96, 112], [140, 96], [236, 120], [286, 104], [190, 84], [342, 132], [24, 140]].flatMap(([x, y]) => firefly(x, y)),
  ...[[60, 214], [330, 222]].flatMap(([x, y]): Shape[] => [
    { kind: 'path', d: `M${x} ${y} L${x + 14} ${y - 3} A14 6 0 1 1 ${x + 12} ${y - 6} Z`, fill: '#3F7A4A' },
  ]),
];

const bayouCritters: Shape[] = [
  sky('#0F2230', '#2E5A66'),
  ...stars(0.7),
  ...moon(70, 40, 12),
  // Earthen hill with a flume and a big drop.
  { kind: 'path', d: 'M196 196 C214 130 250 86 300 72 C340 62 380 64 400 66 L400 196 Z', fill: '#5A4634' },
  { kind: 'path', d: 'M260 104 C280 88 320 80 360 86 C380 90 392 100 400 108 L400 196 L230 196 Z', fill: '#4A3A2E' },
  ...[[300, 96], [340, 92], [376, 104]].flatMap(([x, y]): Shape[] => [
    ellipse(x, y, 16, 9, { fill: '#2B4A36' }),
  ]),
  { kind: 'path', d: 'M300 86 C276 110 252 150 232 184', fill: 'none', stroke: '#8A6A4A', strokeWidth: 12 },
  { kind: 'path', d: 'M300 86 C276 110 252 150 232 184', fill: 'none', stroke: '#6FA0B0', strokeWidth: 5, opacity: 0.7 },
  { kind: 'path', d: 'M290 90 L306 78 L314 86 L298 98 Z', fill: '#9A6A3E', stroke: INK, strokeWidth: 1.5 },
  // Splash!
  ...[[218, 176, 9], [232, 168, 11], [246, 176, 8], [226, 186, 10], [242, 188, 9]].map(([cx, cy, r]): Shape => ({
    kind: 'circle', cx, cy, r, fill: PARCHMENT, opacity: 0.8,
  })),
  ...[[206, 160], [254, 158], [214, 150], [248, 146]].map(([cx, cy]): Shape => ({ kind: 'circle', cx, cy, r: 2.5, fill: PARCHMENT })),
  // Little shop with a peaked roof.
  { kind: 'rect', x: 20, y: 120, w: 120, h: 72, fill: '#8A5A3A' },
  { kind: 'polygon', points: '10,124 80,84 150,124', fill: '#4A3A2E' },
  { kind: 'rect', x: 34, y: 136, w: 22, h: 18, rx: 2, fill: GLOW },
  { kind: 'rect', x: 104, y: 136, w: 22, h: 18, rx: 2, fill: GLOW },
  { kind: 'rect', x: 66, y: 146, w: 28, h: 46, fill: '#3A2A20' },
  { kind: 'rect', x: 14, y: 156, w: 132, h: 4, fill: '#5A3E2A' },
  ...[18, 50, 110, 140].map((x): Shape => ({ kind: 'rect', x, y: 160, w: 3, h: 32, fill: '#5A3E2A' })),
  ...water(192, '#163240', '#7FB3C0'),
  ...[[120, 206], [170, 220], [300, 214]].flatMap(([x, y]): Shape[] => [
    { kind: 'path', d: `M${x} ${y} L${x + 14} ${y - 3} A14 6 0 1 1 ${x + 12} ${y - 6} Z`, fill: '#3F7A4A' },
  ]),
  { kind: 'circle', cx: 168, cy: 216, r: 4, fill: '#E86A8A' },
  ...[[176, 90], [200, 120], [150, 72], [60, 100], [370, 140]].flatMap(([x, y]) => firefly(x, y)),
];

// ---------------------------------------------------------------------------
// Frontierland
// ---------------------------------------------------------------------------

function mesas(): Shape[] {
  return [
    { kind: 'polygon', points: '0,150 20,96 70,90 86,124 130,120 150,150', fill: '#A4553A' },
    { kind: 'polygon', points: '240,150 262,104 300,100 310,80 344,78 356,110 400,112 400,150', fill: '#8E4A34' },
    { kind: 'line', x1: 24, y1: 108, x2: 72, y2: 104, stroke: '#C8734E', strokeWidth: 3, opacity: 0.6 },
    { kind: 'line', x1: 268, y1: 116, x2: 352, y2: 112, stroke: '#B4603F', strokeWidth: 3, opacity: 0.6 },
  ];
}

function logWall(x1: number, x2: number, top: number): Shape[] {
  const out: Shape[] = [];
  for (let x = x1; x < x2; x += 12) {
    out.push(
      { kind: 'rect', x, y: top, w: 11, h: 196 - top, rx: 4, fill: x % 24 ? '#7A5236' : '#8A603E' },
      { kind: 'polygon', points: `${x},${top + 2} ${x + 5.5},${top - 8} ${x + 11},${top + 2}`, fill: '#7A5236' },
    );
  }
  return out;
}

const frontierFort: Shape[] = [
  sky('#3A2A55', '#E08A55'),
  ...stars(0.6).slice(0, 5),
  { kind: 'circle', cx: 200, cy: 128, r: 40, fill: '#F6B05E', opacity: 0.5 },
  ...mesas(),
  { kind: 'rect', x: 0, y: 150, w: 400, h: 90, fill: '#8A5A3A' },
  ...logWall(30, 370, 112),
  // Blockhouses.
  ...[26, 310].flatMap((x): Shape[] => [
    { kind: 'rect', x, y: 72, w: 64, h: 52, fill: '#6B4A33' },
    { kind: 'polygon', points: `${x - 6},74 ${x + 32},56 ${x + 70},74`, fill: '#4E3424' },
    { kind: 'rect', x: x + 10, y: 90, w: 12, h: 4, fill: INK },
    { kind: 'rect', x: x + 42, y: 90, w: 12, h: 4, fill: INK },
    { kind: 'line', x1: x + 32, y1: 56, x2: x + 32, y2: 30, stroke: INK, strokeWidth: 2 },
    { kind: 'path', d: `M${x + 33} 30 C${x + 42} 27 ${x + 50} 33 ${x + 58} 30 L${x + 58} 42 C${x + 50} 45 ${x + 42} 39 ${x + 33} 42 Z`, fill: RED },
    { kind: 'rect', x: x + 33, y: 34, w: 25, h: 3, fill: PARCHMENT, opacity: 0.8 },
  ]),
  // The gate.
  { kind: 'rect', x: 166, y: 128, w: 68, h: 68, fill: '#3A2A20' },
  { kind: 'rect', x: 158, y: 116, w: 84, h: 14, rx: 2, fill: '#5A3E2A', stroke: GOLD, strokeWidth: 1.5 },
  { kind: 'line', x1: 170, y1: 123, x2: 230, y2: 123, stroke: GOLD, strokeWidth: 1.5, dash: '6 4' },
  { kind: 'rect', x: 166, y: 128, w: 4, h: 68, fill: '#5A3E2A' },
  { kind: 'rect', x: 230, y: 128, w: 4, h: 68, fill: '#5A3E2A' },
  { kind: 'path', d: 'M166 196 L196 196 L196 132 L170 132 Z', fill: '#7A5236', opacity: 0.6 },
  { kind: 'rect', x: 0, y: 196, w: 400, h: 44, fill: '#A4703E' },
  { kind: 'path', d: 'M0 214 C80 206 140 222 200 212 C260 202 320 220 400 210', fill: 'none', stroke: '#8A5A3A', strokeWidth: 2 },
];

const riverLife: Shape[] = [
  sky('#3A2A55', '#E08A55'),
  ...stars(0.5).slice(0, 5),
  // Red-rock spires.
  { kind: 'polygon', points: '296,150 300,90 312,70 318,96 330,60 342,92 352,74 364,110 376,96 392,150', fill: '#B4583A' },
  { kind: 'polygon', points: '330,60 342,92 336,150 324,150 324,90', fill: '#8E4A34', opacity: 0.7 },
  { kind: 'line', x1: 302, y1: 112, x2: 386, y2: 118, stroke: '#D9845C', strokeWidth: 3, opacity: 0.6 },
  { kind: 'line', x1: 300, y1: 132, x2: 390, y2: 136, stroke: '#D9845C', strokeWidth: 3, opacity: 0.5 },
  // Tall ship behind.
  { kind: 'path', d: 'M238 158 L298 158 L292 168 L244 168 Z', fill: '#3A2A20' },
  ...[252, 270, 286].flatMap((x, i): Shape[] => [
    { kind: 'line', x1: x, y1: 158, x2: x, y2: 94 + i * 6, stroke: '#3A2A20', strokeWidth: 2 },
    { kind: 'path', d: `M${x - 9} ${104 + i * 6} L${x + 9} ${104 + i * 6} L${x + 10} ${124 + i * 6} L${x - 10} ${124 + i * 6} Z`, fill: '#F4EEDF', opacity: 0.9 },
    { kind: 'path', d: `M${x - 10} ${128 + i * 4} L${x + 10} ${128 + i * 4} L${x + 11} ${148} L${x - 11} ${148} Z`, fill: '#F4EEDF', opacity: 0.9 },
  ]),
  ...water(162, '#2A4A5E', '#9FC4D8'),
  // Paddle-wheel riverboat.
  ...puffs(150, 64, '#E8E0D0', 0.4),
  { kind: 'rect', x: 146, y: 70, w: 7, h: 38, fill: INK },
  { kind: 'rect', x: 166, y: 70, w: 7, h: 38, fill: INK },
  { kind: 'polygon', points: '142,70 157,70 155,64 144,64', fill: GOLD },
  { kind: 'polygon', points: '162,70 177,70 175,64 164,64', fill: GOLD },
  { kind: 'rect', x: 138, y: 106, w: 44, h: 18, rx: 2, fill: '#F4EEDF', stroke: INK, strokeWidth: 1.2 },
  { kind: 'rect', x: 146, y: 111, w: 28, h: 8, fill: GLOW },
  { kind: 'rect', x: 92, y: 124, w: 136, h: 18, fill: '#F4EEDF', stroke: INK, strokeWidth: 1.2 },
  { kind: 'rect', x: 74, y: 142, w: 172, h: 18, fill: '#F4EEDF', stroke: INK, strokeWidth: 1.2 },
  { kind: 'line', x1: 96, y1: 130, x2: 224, y2: 130, stroke: INK, strokeWidth: 1, dash: '2 4' },
  { kind: 'line', x1: 78, y1: 148, x2: 242, y2: 148, stroke: INK, strokeWidth: 1, dash: '2 4' },
  ...bulbRow(98, 222, 136, 10),
  ...bulbRow(80, 240, 154, 10),
  { kind: 'path', d: 'M60 160 L262 160 L252 176 L72 176 Z', fill: '#F4EEDF', stroke: INK, strokeWidth: 1.5 },
  { kind: 'rect', x: 66, y: 164, w: 190, h: 3, fill: RED },
  { kind: 'rect', x: 248, y: 134, w: 34, h: 42, rx: 3, fill: RED, stroke: INK, strokeWidth: 1.5 },
  ...[140, 150, 160, 170].map((y): Shape => ({ kind: 'line', x1: 250, y1: y, x2: 280, y2: y, stroke: '#7E2A3A', strokeWidth: 2 })),
  { kind: 'polygon', points: '160,64 160,52 172,56', fill: RED },
];

// ---------------------------------------------------------------------------
// Fantasyland
// ---------------------------------------------------------------------------

function snowyPeak(): Shape[] {
  return [
    { kind: 'polygon', points: '0,170 40,120 70,64 92,96 110,84 150,170', fill: '#6F7EA6' },
    { kind: 'polygon', points: '56,90 70,64 84,86 78,82 72,92 64,86', fill: '#F4F6FB' },
    { kind: 'polygon', points: '102,92 110,84 118,100 112,96', fill: '#F4F6FB' },
    { kind: 'line', x1: 70, y1: 64, x2: 60, y2: 140, stroke: '#5A6A92', strokeWidth: 2, opacity: 0.6 },
  ];
}

const knightsCarrousel: Shape[] = [
  sky('#2A2050', '#9A72B4'),
  ...stars(0.8),
  ...snowyPeak(),
  { kind: 'rect', x: 0, y: 186, w: 400, h: 54, fill: '#4F7A4A' },
  { kind: 'rect', x: 0, y: 186, w: 400, h: 4, fill: '#3F6B52' },
  // Carrousel.
  { kind: 'polygon', points: '120,96 230,52 340,96', fill: GOLD },
  ...[0, 1, 2, 3, 4].map((i): Shape => {
    const x1 = 120 + i * 44;
    return { kind: 'polygon', points: `230,52 ${x1 + 11},96 ${x1 + 33},96`, fill: RED };
  }),
  { kind: 'line', x1: 230, y1: 52, x2: 230, y2: 34, stroke: INK, strokeWidth: 2 },
  { kind: 'polygon', points: '230,34 246,39 230,44', fill: RED },
  sparkle(230, 50, 6, BULB),
  { kind: 'rect', x: 118, y: 96, w: 224, h: 10, fill: '#F4EEDF' },
  ...Array.from({ length: 14 }, (_, i): Shape => ({ kind: 'circle', cx: 126 + i * 16, cy: 108, r: 6, fill: i % 2 ? GOLD : RED })),
  { kind: 'rect', x: 118, y: 96, w: 224, h: 10, fill: 'none', stroke: INK, strokeWidth: 1 },
  ...bulbRow(124, 336, 101, 8),
  { kind: 'rect', x: 128, y: 114, w: 204, h: 60, fill: '#3A2E5A', opacity: 0.55 },
  ...[148, 192, 230, 268, 312].map((x): Shape => ({ kind: 'line', x1: x, y1: 114, x2: x, y2: 174, stroke: GOLD, strokeWidth: 2 })),
  ...horse(136, 160, PARCHMENT, RED),
  ...horse(198, 152, '#F2E2C4', '#3F5FA8'),
  ...horse(274, 158, PARCHMENT, '#3F6B52'),
  { kind: 'rect', x: 120, y: 172, w: 220, h: 10, rx: 2, fill: '#F4EEDF', stroke: INK, strokeWidth: 1 },
  { kind: 'rect', x: 116, y: 182, w: 228, h: 6, fill: GOLD },
  // A sword stuck fast in an anvil on a stone.
  { kind: 'rect', x: 366, y: 160, w: 4, h: 26, fill: '#D8DEE8', stroke: INK, strokeWidth: 1 },
  { kind: 'rect', x: 358, y: 158, w: 20, h: 4, rx: 2, fill: GOLD },
  { kind: 'rect', x: 366, y: 148, w: 4, h: 10, fill: '#5A3E2A' },
  { kind: 'circle', cx: 368, cy: 147, r: 3, fill: GOLD },
  { kind: 'path', d: 'M354 186 L382 186 L378 192 L358 192 Z', fill: '#4A4E5E' },
  { kind: 'path', d: 'M342 208 C342 196 352 192 360 192 L376 192 C386 192 394 196 394 208 Z', fill: '#9A9AAA' },
  sparkle(352, 150, 4, BULB),
  sparkle(386, 160, 3, BULB),
  // Pennants.
  { kind: 'path', d: 'M0 30 C40 44 80 44 118 30', fill: 'none', stroke: PARCHMENT, strokeWidth: 1, opacity: 0.7 },
  ...[16, 40, 64, 88].map((x, i): Shape => ({ kind: 'polygon', points: `${x},${35 + (i % 2) * 3} ${x + 12},${36 + (i % 2) * 3} ${x + 6},${48 + (i % 2) * 3}`, fill: i % 2 ? GOLD : RED })),
];

function topiary(x: number, base: number, kind: 'ball' | 'cone' | 'tiers'): Shape[] {
  const trunk: Shape = { kind: 'rect', x: x - 2, y: base - 14, w: 4, h: 14, fill: '#5A3E2A' };
  if (kind === 'ball') return [trunk, { kind: 'circle', cx: x, cy: base - 26, r: 14, fill: '#3F7A4A' }, { kind: 'circle', cx: x - 4, cy: base - 30, r: 4, fill: '#5A9A5A', opacity: 0.7 }];
  if (kind === 'cone') return [trunk, { kind: 'polygon', points: `${x - 14},${base - 12} ${x},${base - 56} ${x + 14},${base - 12}`, fill: '#3F7A4A' }];
  return [
    trunk,
    { kind: 'circle', cx: x, cy: base - 22, r: 11, fill: '#3F7A4A' },
    { kind: 'circle', cx: x, cy: base - 40, r: 8, fill: '#3F7A4A' },
    { kind: 'circle', cx: x, cy: base - 53, r: 5, fill: '#3F7A4A' },
  ];
}

const clockworkWonders: Shape[] = [
  sky('#2A2050', '#C07AA8'),
  ...stars(0.7),
  // White-and-gold facade of playful geometric shapes.
  { kind: 'rect', x: 40, y: 112, w: 320, h: 84, fill: '#F4EEDF' },
  ...[40, 80, 120, 240, 280, 320].map((x, i): Shape =>
    i % 2
      ? { kind: 'path', d: `M${x} 112 A20 20 0 0 1 ${x + 40} 112 Z`, fill: GOLD }
      : { kind: 'polygon', points: `${x},112 ${x + 20},86 ${x + 40},112`, fill: '#F4EEDF', stroke: GOLD, strokeWidth: 2 },
  ),
  ...[56, 96, 136, 256, 296, 336].map((x): Shape => ({ kind: 'circle', cx: x + 4, cy: 140, r: 6, fill: GOLD })),
  { kind: 'line', x1: 40, y1: 160, x2: 360, y2: 160, stroke: GOLD, strokeWidth: 2 },
  ...[60, 100, 140, 260, 300, 340].map((x): Shape => ({ kind: 'rect', x: x - 6, y: 168, w: 12, h: 20, rx: 6, fill: '#E6D9B8' })),
  // The clock tower.
  { kind: 'rect', x: 164, y: 58, w: 72, h: 138, fill: '#FFFDF6', stroke: GOLD, strokeWidth: 2 },
  { kind: 'polygon', points: '158,60 200,26 242,60', fill: GOLD },
  sparkle(200, 22, 6, BULB),
  { kind: 'circle', cx: 200, cy: 92, r: 22, fill: GOLD },
  { kind: 'circle', cx: 200, cy: 92, r: 18, fill: PARCHMENT, stroke: INK, strokeWidth: 1.5 },
  ...[0, 3, 6, 9].map((h): Shape => {
    const a = (h * Math.PI) / 6;
    return { kind: 'line', x1: 200 + 13 * Math.sin(a), y1: 92 - 13 * Math.cos(a), x2: 200 + 16 * Math.sin(a), y2: 92 - 16 * Math.cos(a), stroke: INK, strokeWidth: 2 };
  }),
  { kind: 'line', x1: 200, y1: 92, x2: 200, y2: 79, stroke: INK, strokeWidth: 2.5 },
  { kind: 'line', x1: 200, y1: 92, x2: 209, y2: 96, stroke: INK, strokeWidth: 2 },
  // Little doors open and a parade of tiny shapes marches out.
  { kind: 'rect', x: 178, y: 124, w: 44, h: 26, rx: 3, fill: '#2D3866' },
  { kind: 'rect', x: 170, y: 124, w: 8, h: 26, fill: GOLD },
  { kind: 'rect', x: 222, y: 124, w: 8, h: 26, fill: GOLD },
  ...[[184, RED], [194, '#3F5FA8'], [204, '#F2C14E'], [214, '#4F9D7A']].map(([x, c]): Shape => ({
    kind: 'rect', x: x as number, y: 134, w: 7, h: 14, rx: 3.5, fill: c as Hex,
  })),
  ...note(150, 70, BULB),
  ...note(252, 60, BULB),
  { kind: 'path', d: 'M184 196 L184 168 C184 158 216 158 216 168 L216 196 Z', fill: '#2D3866' },
  // Lawn, topiaries and the canal.
  { kind: 'rect', x: 0, y: 190, w: 400, h: 20, fill: '#4F7A4A' },
  ...topiary(24, 196, 'cone'),
  ...topiary(70, 198, 'ball'),
  ...topiary(330, 198, 'tiers'),
  ...topiary(376, 196, 'ball'),
  ...water(208, '#3F6F8F', '#B4D8EC'),
  { kind: 'path', d: 'M150 214 L196 214 L190 224 L156 224 Z', fill: '#F4EEDF', stroke: INK, strokeWidth: 1.2 },
  { kind: 'rect', x: 158, y: 208, w: 30, h: 6, rx: 2, fill: RED },
];

// ---------------------------------------------------------------------------
// Toontown
// ---------------------------------------------------------------------------

function wobblyHouse(x: number, w: number, h: number, color: Hex, roof: Hex): Shape[] {
  const top = 196 - h;
  return [
    { kind: 'path', d: `M${x} 196 C${x - 6} ${top + h * 0.5} ${x + 8} ${top + 20} ${x + 2} ${top} L${x + w - 2} ${top + 4} C${x + w + 8} ${top + 30} ${x + w - 6} ${top + h * 0.6} ${x + w} 196 Z`, fill: color, stroke: INK, strokeWidth: 2 },
    { kind: 'path', d: `M${x - 10} ${top + 4} C${x + w * 0.3} ${top - 30} ${x + w * 0.7} ${top - 40} ${x + w + 10} ${top + 6} Z`, fill: roof, stroke: INK, strokeWidth: 2 },
    ellipse(x + w * 0.3, top + h * 0.35, 9, 12, { fill: '#FFF4CF', stroke: INK, strokeWidth: 1.5 }),
    ellipse(x + w * 0.7, top + h * 0.33, 9, 12, { fill: '#FFF4CF', stroke: INK, strokeWidth: 1.5 }),
    { kind: 'path', d: `M${x + w * 0.4} 196 L${x + w * 0.4} ${196 - h * 0.3} C${x + w * 0.4} ${186 - h * 0.35} ${x + w * 0.6} ${186 - h * 0.35} ${x + w * 0.6} ${196 - h * 0.3} L${x + w * 0.6} 196 Z`, fill: '#7A5236', stroke: INK, strokeWidth: 1.5 },
  ];
}

const toontownTour: Shape[] = [
  sky('#6FB7E8', '#D8F0FA'),
  { kind: 'circle', cx: 352, cy: 38, r: 30, fill: '#FFE89A', opacity: 0.45 },
  { kind: 'circle', cx: 352, cy: 38, r: 20, fill: '#FFD95A' },
  ...cloud(40, 40),
  ...cloud(220, 28, 0.8),
  // Hills.
  { kind: 'path', d: 'M0 150 C60 110 120 120 170 140 C220 110 300 100 400 140 L400 200 L0 200 Z', fill: '#8ACB7A' },
  ...wobblyHouse(8, 92, 108, '#F2C14E', '#E86A5A'),
  ...wobblyHouse(290, 96, 120, '#7FA6E8', '#F2C14E'),
  { kind: 'rect', x: 0, y: 196, w: 400, h: 44, fill: '#E8D6A0' },
  ...[30, 110, 190, 270, 350].map((x): Shape => ({ kind: 'circle', cx: x, cy: 220, r: 5, fill: '#F2C14E', opacity: 0.6 })),
  // The town seal, balancing a ball on a pedestal.
  { kind: 'rect', x: 170, y: 160, w: 60, h: 36, rx: 3, fill: '#F4EEDF', stroke: INK, strokeWidth: 2 },
  { kind: 'rect', x: 162, y: 156, w: 76, h: 8, rx: 3, fill: GOLD, stroke: INK, strokeWidth: 1.5 },
  { kind: 'path', d: 'M180 156 C176 130 192 112 204 104 C212 98 220 100 220 108 C220 114 214 116 212 122 C218 130 222 142 222 156 Z', fill: '#5A6A80', stroke: INK, strokeWidth: 2 },
  { kind: 'path', d: 'M182 150 C176 146 168 148 166 152 L180 156 Z', fill: '#5A6A80', stroke: INK, strokeWidth: 1.5 },
  { kind: 'circle', cx: 212, cy: 108, r: 2, fill: INK },
  { kind: 'circle', cx: 221, cy: 112, r: 2.5, fill: INK },
  { kind: 'circle', cx: 222, cy: 86, r: 13, fill: RED, stroke: INK, strokeWidth: 2 },
  { kind: 'path', d: 'M209 86 C214 80 230 80 235 86', fill: 'none', stroke: PARCHMENT, strokeWidth: 3 },
  { kind: 'path', d: 'M211 92 C216 96 228 96 233 92', fill: 'none', stroke: '#F2C14E', strokeWidth: 3 },
  ...[[180, 70], [244, 64], [254, 98]].map(([x, y]): Shape => sparkle(x, y, 6, '#F2C14E')),
  // A little red fire truck.
  { kind: 'rect', x: 112, y: 172, w: 50, h: 18, rx: 4, fill: RED, stroke: INK, strokeWidth: 1.5 },
  { kind: 'path', d: 'M146 172 L146 160 L160 160 L164 172 Z', fill: RED, stroke: INK, strokeWidth: 1.5 },
  { kind: 'rect', x: 149, y: 163, w: 9, h: 7, rx: 1, fill: '#BFE0F2' },
  { kind: 'line', x1: 114, y1: 168, x2: 144, y2: 162, stroke: GOLD, strokeWidth: 3 },
  { kind: 'circle', cx: 124, cy: 192, r: 6, fill: INK },
  { kind: 'circle', cx: 152, cy: 192, r: 6, fill: INK },
  { kind: 'circle', cx: 124, cy: 192, r: 2, fill: '#D8DEE8' },
  { kind: 'circle', cx: 152, cy: 192, r: 2, fill: '#D8DEE8' },
  { kind: 'circle', cx: 156, cy: 157, r: 3, fill: GOLD },
];

const gagsGadgets: Shape[] = [
  sky('#6FB7E8', '#D8F0FA'),
  ...cloud(300, 36),
  ...cloud(60, 26, 0.7),
  { kind: 'path', d: 'M0 160 C80 130 160 150 220 140 C290 128 340 140 400 132 L400 200 L0 200 Z', fill: '#8ACB7A' },
  { kind: 'rect', x: 0, y: 196, w: 400, h: 44, fill: '#E8D6A0' },
  // Stacked gag crates, one popping open.
  ...[[16, 160], [64, 160], [40, 124]].flatMap(([x, y]): Shape[] => [
    { kind: 'rect', x, y, w: 46, h: 36, rx: 2, fill: '#C99A5A', stroke: INK, strokeWidth: 2 },
    { kind: 'line', x1: x + 4, y1: y + 4, x2: x + 42, y2: y + 32, stroke: '#8E6A3A', strokeWidth: 2 },
    { kind: 'line', x1: x, y1: y + 12, x2: x + 46, y2: y + 12, stroke: '#8E6A3A', strokeWidth: 1.5 },
  ]),
  { kind: 'polygon', points: '40,124 30,104 36,100 46,122', fill: '#C99A5A', stroke: INK, strokeWidth: 1.5 },
  { kind: 'path', d: 'M64 124 L56 116 L72 108 L56 100 L72 92 L64 86', fill: 'none', stroke: INK, strokeWidth: 3 },
  sparkle(64, 76, 12, '#F2C14E'),
  { kind: 'line', x1: 86, y1: 74, x2: 96, y2: 68, stroke: RED, strokeWidth: 2.5 },
  { kind: 'line', x1: 88, y1: 84, x2: 100, y2: 84, stroke: RED, strokeWidth: 2.5 },
  // Musical fountain.
  ellipse(220, 186, 64, 12, { fill: '#7FA6E8', stroke: INK, strokeWidth: 2 }),
  { kind: 'path', d: 'M156 186 L160 198 C190 206 250 206 280 198 L284 186', fill: '#F4EEDF', stroke: INK, strokeWidth: 2 },
  { kind: 'rect', x: 214, y: 140, w: 12, h: 46, rx: 3, fill: '#F4EEDF', stroke: INK, strokeWidth: 1.5 },
  ellipse(220, 140, 22, 6, { fill: '#F4EEDF', stroke: INK, strokeWidth: 1.5 }),
  { kind: 'path', d: 'M220 134 C200 100 176 110 170 150', fill: 'none', stroke: '#BFE0F2', strokeWidth: 4 },
  { kind: 'path', d: 'M220 134 C240 100 264 110 270 150', fill: 'none', stroke: '#BFE0F2', strokeWidth: 4 },
  { kind: 'path', d: 'M220 134 C220 116 220 106 220 96', fill: 'none', stroke: '#BFE0F2', strokeWidth: 4 },
  ...[[172, 206], [196, 210], [220, 211], [244, 210], [268, 206]].map(([x, y]): Shape => ({ kind: 'circle', cx: x, cy: y, r: 4, fill: GOLD, stroke: INK, strokeWidth: 1 })),
  ...note(180, 84, '#3F5FA8'),
  ...note(258, 74, RED),
  ...note(226, 64, '#4F9D7A'),
  // Mailbox with its flag up and a letter flying out.
  { kind: 'rect', x: 340, y: 160, w: 6, h: 36, fill: INK },
  { kind: 'path', d: 'M318 162 L318 140 C318 130 326 126 334 126 L352 126 C360 126 368 130 368 140 L368 162 Z', fill: '#7FA6E8', stroke: INK, strokeWidth: 2 },
  { kind: 'rect', x: 370, y: 122, w: 3, h: 26, fill: INK },
  { kind: 'polygon', points: '373,122 384,126 373,130', fill: RED },
  { kind: 'rect', x: 320, y: 98, w: 22, h: 14, rx: 1, fill: PARCHMENT, stroke: INK, strokeWidth: 1.2 },
  { kind: 'path', d: 'M320 98 L331 106 L342 98', fill: 'none', stroke: INK, strokeWidth: 1.2 },
  { kind: 'path', d: 'M336 116 C340 120 342 122 344 124', fill: 'none', stroke: INK, strokeWidth: 1, dash: '2 3' },
];

// ---------------------------------------------------------------------------
// Tomorrowland
// ---------------------------------------------------------------------------

function ringedPlanet(cx: number, cy: number, r: number, body: Hex, ring: Hex): Shape[] {
  return [
    { kind: 'path', d: `M${cx - r * 1.8} ${cy + r * 0.2} C${cx - r * 1.8} ${cy - r * 0.6} ${cx + r * 1.8} ${cy - r * 0.9} ${cx + r * 1.8} ${cy - r * 0.2}`, fill: 'none', stroke: ring, strokeWidth: 2.5 },
    { kind: 'circle', cx, cy, r, fill: body },
    { kind: 'path', d: `M${cx - r * 1.8} ${cy + r * 0.2} C${cx - r * 1.8} ${cy + r * 0.8} ${cx + r * 1.8} ${cy + r * 0.5} ${cx + r * 1.8} ${cy - r * 0.2}`, fill: 'none', stroke: ring, strokeWidth: 2.5 },
  ];
}

function retroRocket(x: number, base: number, h: number): Shape[] {
  const top = base - h;
  const w = h * 0.22;
  return [
    { kind: 'path', d: `M${x - w * 0.5} ${base - h * 0.3} L${x - w * 1.3} ${base} L${x - w * 0.4} ${base - h * 0.06} Z`, fill: RED, stroke: INK, strokeWidth: 1.5 },
    { kind: 'path', d: `M${x + w * 0.5} ${base - h * 0.3} L${x + w * 1.3} ${base} L${x + w * 0.4} ${base - h * 0.06} Z`, fill: RED, stroke: INK, strokeWidth: 1.5 },
    { kind: 'path', d: `M${x} ${top} C${x + w * 0.8} ${top + h * 0.2} ${x + w * 0.7} ${base - h * 0.3} ${x + w * 0.45} ${base - h * 0.06} L${x - w * 0.45} ${base - h * 0.06} C${x - w * 0.7} ${base - h * 0.3} ${x - w * 0.8} ${top + h * 0.2} ${x} ${top} Z`, fill: '#F4F6FB', stroke: INK, strokeWidth: 1.5 },
    { kind: 'path', d: `M${x} ${top} C${x + w * 0.35} ${top + h * 0.08} ${x + w * 0.5} ${top + h * 0.16} ${x + w * 0.56} ${top + h * 0.22} L${x - w * 0.56} ${top + h * 0.22} C${x - w * 0.5} ${top + h * 0.16} ${x - w * 0.35} ${top + h * 0.08} ${x} ${top} Z`, fill: RED },
    { kind: 'rect', x: x - w * 0.62, y: top + h * 0.5, w: w * 1.24, h: h * 0.06, fill: RED },
    { kind: 'circle', cx: x, cy: top + h * 0.36, r: w * 0.25, fill: '#BFE0F2', stroke: INK, strokeWidth: 1.5 },
  ];
}

function spaceSky(from: Hex, to: Hex): Shape[] {
  return [
    sky(from, to),
    ...stars(0.95),
    ...[[90, 30], [180, 58], [312, 36], [356, 70], [20, 60]].map(([x, y]): Shape => ({ kind: 'circle', cx: x, cy: y, r: 1.2, fill: BULB })),
  ];
}

const retroRockets: Shape[] = [
  ...spaceSky('#0B0F26', '#2A2F6A'),
  ...ringedPlanet(52, 44, 14, '#C9849A', '#F2C14E'),
  // Elevated track winding across the sky.
  { kind: 'path', d: 'M0 130 C60 112 120 140 190 128 C260 116 320 140 400 122', fill: 'none', stroke: '#C9D3E0', strokeWidth: 8 },
  { kind: 'path', d: 'M0 130 C60 112 120 140 190 128 C260 116 320 140 400 122', fill: 'none', stroke: '#8F9AB0', strokeWidth: 2 },
  ...[30, 150, 230, 370].map((x): Shape => ({ kind: 'rect', x: x - 3, y: 128, w: 6, h: 68, fill: '#8F9AB0' })),
  // Spinning planets on a tower, rockets in orbit.
  { kind: 'rect', x: 116, y: 76, w: 8, h: 120, fill: GOLD },
  { kind: 'circle', cx: 120, cy: 64, r: 14, fill: '#F2C14E', stroke: INK, strokeWidth: 1.5 },
  { kind: 'circle', cx: 98, cy: 86, r: 7, fill: '#7FA6E8' },
  { kind: 'circle', cx: 144, cy: 80, r: 9, fill: '#4F9D7A' },
  { kind: 'circle', cx: 136, cy: 100, r: 5, fill: RED },
  { kind: 'path', d: 'M56 112 C80 104 160 104 184 112', fill: 'none', stroke: GOLD, strokeWidth: 2 },
  ...[[54, 112], [186, 112]].flatMap(([x, y]): Shape[] => [
    ellipse(x, y, 11, 5, { fill: '#F4F6FB', stroke: INK, strokeWidth: 1.2 }),
    { kind: 'polygon', points: `${x - 11},${y} ${x - 16},${y - 5} ${x - 16},${y + 5}`, fill: RED },
  ]),
  // Monorail beam and train.
  { kind: 'rect', x: 0, y: 166, w: 400, h: 6, fill: '#C9D3E0' },
  { kind: 'path', d: 'M160 166 C160 156 168 150 180 150 L248 150 C256 150 262 158 262 166 Z', fill: '#3F5FA8', stroke: INK, strokeWidth: 1.5 },
  { kind: 'rect', x: 178, y: 154, w: 60, h: 6, rx: 3, fill: '#BFE0F2' },
  { kind: 'rect', x: 160, y: 162, w: 102, h: 3, fill: PARCHMENT },
  ...retroRocket(318, 196, 150),
  { kind: 'rect', x: 0, y: 196, w: 400, h: 44, fill: '#2C3150' },
  { kind: 'path', d: 'M0 206 L400 206', stroke: '#4A5280', strokeWidth: 2, dash: '10 8' },
];

const futureGarden: Shape[] = [
  ...spaceSky('#0F1A3A', '#3A4F8A'),
  ...retroRocket(352, 150, 92),
  ...ringedPlanet(70, 40, 10, '#7FA6E8', '#F4F6FB'),
  // Little freeway with a tiny car.
  { kind: 'path', d: 'M0 150 C80 136 160 160 240 146 C300 136 360 150 400 146 L400 160 C360 164 300 150 240 160 C160 174 80 150 0 164 Z', fill: '#4A5280' },
  { kind: 'path', d: 'M0 157 C80 143 160 167 240 153 C300 143 360 157 400 153', fill: 'none', stroke: GOLD, strokeWidth: 1.5, dash: '6 6' },
  { kind: 'path', d: 'M150 152 C150 144 156 140 166 140 L178 140 C186 140 190 146 192 152 Z', fill: RED, stroke: INK, strokeWidth: 1.2 },
  { kind: 'rect', x: 160, y: 143, w: 14, h: 5, rx: 2, fill: '#BFE0F2' },
  { kind: 'circle', cx: 158, cy: 153, r: 3.5, fill: INK },
  { kind: 'circle', cx: 184, cy: 153, r: 3.5, fill: INK },
  // Sleek planters full of things to eat.
  ...[[12, 120], [148, 104], [278, 116]].flatMap(([x, w]): Shape[] => [
    { kind: 'path', d: `M${x} 174 L${x + w} 174 L${x + w - 8} 196 L${x + 8} 196 Z`, fill: '#E6EBF2', stroke: '#8F9AB0', strokeWidth: 1.5 },
    { kind: 'rect', x: x + 4, y: 178, w: w - 8, h: 3, fill: '#7FA6E8', opacity: 0.6 },
  ]),
  // Citrus tree.
  { kind: 'rect', x: 56, y: 140, w: 5, h: 34, fill: '#5A3E2A' },
  { kind: 'circle', cx: 58, cy: 132, r: 22, fill: '#3F7A4A' },
  ...[[48, 124], [66, 128], [56, 142], [70, 140], [44, 138]].map(([x, y]): Shape => ({ kind: 'circle', cx: x, cy: y, r: 3.5, fill: '#F2A04A' })),
  // Herbs and leafy greens.
  ...[24, 32, 92, 100, 108].map((x, i): Shape => ({ kind: 'path', d: `M${x} 174 C${x - 4} ${164 - (i % 2) * 6} ${x + 2} ${156 - (i % 2) * 6} ${x + 3} ${152}`, fill: 'none', stroke: '#5A9A5A', strokeWidth: 3 })),
  ...[[170, 166], [190, 164], [210, 166], [230, 165]].map(([x, y]): Shape => ({ kind: 'circle', cx: x, cy: y, r: 9, fill: '#7E5AA8' })),
  ...[[170, 164], [190, 162], [210, 164], [230, 163]].map(([x, y]): Shape => ({ kind: 'circle', cx: x, cy: y, r: 4, fill: '#A88AD0' })),
  // Strange blue eggs.
  ...[[300, 166, 9, 12], [320, 168, 8, 10], [314, 156, 6, 8]].flatMap(([x, y, rx, ry]): Shape[] => [
    ellipse(x, y, rx, ry, { fill: '#6FA8DC', stroke: INK, strokeWidth: 1.2 }),
    { kind: 'circle', cx: x - 2, cy: y - 3, r: 1.4, fill: '#2D3866' },
    { kind: 'circle', cx: x + 3, cy: y + 2, r: 1.2, fill: '#2D3866' },
  ]),
  { kind: 'path', d: 'M354 174 C350 160 356 150 368 146', fill: 'none', stroke: '#5A9A5A', strokeWidth: 3 },
  ellipse(370, 150, 8, 5, { fill: '#5A9A5A' }),
  { kind: 'rect', x: 0, y: 196, w: 400, h: 44, fill: '#2C3150' },
];

/** Vignette per quest slug outside Main Street. */
export const landQuestScenes: Record<string, Shape[]> = {
  'jungle-expedition': jungleExpedition,
  'tiki-garden': tikiGarden,
  'royal-street-secrets': royalStreet,
  'riverfront-and-rails': riverfrontRails,
  'bayou-bend': bayouBend,
  'bayou-critters': bayouCritters,
  'frontier-fort': frontierFort,
  'river-life': riverLife,
  'knights-and-carrousel': knightsCarrousel,
  'clockwork-wonders': clockworkWonders,
  'toontown-town-tour': toontownTour,
  'gags-and-gadgets': gagsGadgets,
  'retro-rockets': retroRockets,
  'future-garden': futureGarden,
};
