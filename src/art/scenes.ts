/**
 * Original storybook scenes (400 × 240 canvas): a turn-of-the-century small-town
 * main street at night — pastel Victorian shopfronts with white trim, roofline
 * lights, bunting, scalloped awnings, gas lamps and streetcar rails — plus one
 * vignette per quest (quest covers + placeholder hint photos).
 *
 * Hard rule: no castles, characters, three-circle shapes, or copies of any
 * specific real building or sign. The street ends in open sky on purpose.
 */
import type { Shape } from '@/art/shapes';

export const SCENE = { width: 400, height: 240 } as const;

type Hex = `#${string}`;

const C = {
  skyTop: '#121833',
  skyLow: '#2C3768',
  moon: '#F7E4A8',
  gold: '#E2B04A',
  glow: '#F6D58E',
  bulb: '#FFF4CF',
  parchment: '#FAF5EA',
  trim: '#F4EEDF',
  red: '#C8475A',
  blue: '#3F5FA8',
  green: '#4F9D7A',
  dark: '#1A1F38',
  windowDark: '#2D3866',
  roof: '#3A3352',
  street: '#4A3439',
  sidewalk: '#6B5A63',
  rail: '#8C7A80',
} as const;

/** Pastel facades, toned for night. */
const FACADE = {
  salmon: '#D28C76',
  butter: '#D9B86A',
  mint: '#7FAE9B',
  lavender: '#A58FBF',
  sky: '#7F9BCB',
  rose: '#C9849A',
} as const;

const GROUND = 196;

// ---------------------------------------------------------------------------
// Sky
// ---------------------------------------------------------------------------

function sparkle(cx: number, cy: number, r: number, fill: Hex, opacity = 1): Shape {
  const s = r * 0.28;
  return {
    kind: 'polygon',
    points: `${cx},${cy - r} ${cx + s},${cy - s} ${cx + r},${cy} ${cx + s},${cy + s} ${cx},${cy + r} ${cx - s},${cy + s} ${cx - r},${cy} ${cx - s},${cy - s}`,
    fill,
    opacity,
  };
}

/** A generic firework burst: rays with bright tips. */
function firework(cx: number, cy: number, r: number, color: Hex): Shape[] {
  const shapes: Shape[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const x2 = cx + Math.cos(a) * r;
    const y2 = cy + Math.sin(a) * r;
    shapes.push({
      kind: 'line',
      x1: cx + Math.cos(a) * r * 0.35,
      y1: cy + Math.sin(a) * r * 0.35,
      x2,
      y2,
      stroke: color,
      strokeWidth: 1.4,
      opacity: 0.85,
    });
    shapes.push({ kind: 'circle', cx: x2, cy: y2, r: 1.3, fill: C.bulb, opacity: 0.9 });
  }
  return shapes;
}

function sky(withFireworks: boolean): Shape[] {
  const dots: [number, number][] = [
    [22, 26], [64, 14], [108, 40], [150, 12], [196, 30], [238, 18], [282, 42], [366, 22], [388, 58], [40, 66], [130, 70], [256, 64],
  ];
  return [
    { kind: 'gradient', x: 0, y: 0, w: 400, h: 240, from: C.skyTop, to: C.skyLow },
    ...dots.map(([x, y]): Shape => ({ kind: 'circle', cx: x, cy: y, r: 1.3, fill: C.parchment, opacity: 0.75 })),
    sparkle(86, 26, 5, C.glow),
    sparkle(214, 50, 3.5, C.parchment, 0.9),
    sparkle(318, 24, 4.5, C.glow),
    ...(withFireworks ? [...firework(158, 40, 19, C.gold), ...firework(292, 36, 13, '#E58FA0')] : []),
  ];
}

function moon(cx: number, cy: number, r: number): Shape[] {
  return [
    { kind: 'circle', cx, cy, r: r + 10, fill: C.moon, opacity: 0.1 },
    { kind: 'circle', cx, cy, r, fill: C.moon },
    { kind: 'circle', cx: cx + r * 0.45, cy: cy - r * 0.2, r: r * 0.85, fill: C.skyTop },
  ];
}

// ---------------------------------------------------------------------------
// Buildings
// ---------------------------------------------------------------------------

type Top = 'pediment' | 'arch' | 'mansard' | 'balustrade';

type Facade = {
  x: number;
  w: number;
  h: number;
  color: Hex;
  top: Top;
  awning: Hex;
  /** Which upper windows glow (cycled). */
  lit?: boolean[];
  bunting?: boolean;
  /** Space per upper window; wide facades read better with more (default 16). */
  windowSpacing?: number;
};

/** Small warm bulbs along a line — the roofline lights of a main street at night. */
function bulbs(x1: number, y1: number, x2: number, y2: number, spacing = 6): Shape[] {
  const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / spacing));
  return Array.from({ length: n + 1 }, (_, i): Shape => ({
    kind: 'circle',
    cx: x1 + ((x2 - x1) * i) / n,
    cy: y1 + ((y2 - y1) * i) / n,
    r: 1.15,
    fill: C.bulb,
  }));
}

/** Striped awning with a scalloped edge. */
function awning(x: number, w: number, y: number, stripe: Hex): Shape[] {
  const stripes = Math.max(4, Math.round(w / 8));
  const sw = w / stripes;
  const shapes: Shape[] = [];
  for (let s = 0; s < stripes; s++) {
    const sx = x + s * sw;
    shapes.push({
      kind: 'path',
      d: `M${sx} ${y} L${sx + sw} ${y} L${sx + sw + 1.5} ${y + 9} Q${sx + sw / 2 + 0.75} ${y + 14} ${sx + 1.5} ${y + 9} Z`,
      fill: s % 2 === 0 ? stripe : C.parchment,
    });
  }
  return shapes;
}

/** Red-white-blue bunting swags hung across a facade. */
function bunting(x: number, w: number, y: number): Shape[] {
  const swags = Math.max(1, Math.round(w / 34));
  const sw = w / swags;
  const shapes: Shape[] = [];
  for (let i = 0; i < swags; i++) {
    const x0 = x + i * sw;
    const x1 = x0 + sw;
    const xm = (x0 + x1) / 2;
    [C.red, C.parchment, C.blue].forEach((stroke, band) => {
      shapes.push({
        kind: 'path',
        d: `M${x0} ${y + band * 2} Q${xm} ${y + 9 + band * 2} ${x1} ${y + band * 2}`,
        fill: 'none',
        stroke,
        strokeWidth: 2,
      });
    });
    shapes.push({ kind: 'circle', cx: x0, cy: y, r: 1.8, fill: C.gold });
  }
  shapes.push({ kind: 'circle', cx: x + w, cy: y, r: 1.8, fill: C.gold });
  return shapes;
}

/** A Victorian shopfront: ornate crown, cornice with brackets, framed windows, storefront, awning, lights. */
function facade(f: Facade): Shape[] {
  const { x, w, h, color, top: kind } = f;
  const lit = f.lit ?? [true, false, true];
  const top = GROUND - h;
  const shapes: Shape[] = [];

  // Crown above the cornice
  if (kind === 'pediment') {
    const peak = Math.min(18, w * 0.26);
    shapes.push({ kind: 'polygon', points: `${x + 4},${top} ${x + w / 2},${top - peak} ${x + w - 4},${top}`, fill: color, stroke: C.trim, strokeWidth: 2 });
    shapes.push(sparkle(x + w / 2, top - peak * 0.42, 3, C.gold));
    shapes.push(...bulbs(x + 4, top - 2, x + w / 2, top - peak - 2), ...bulbs(x + w / 2, top - peak - 2, x + w - 4, top - 2));
  } else if (kind === 'arch') {
    const aw = w * 0.56;
    shapes.push({ kind: 'path', d: `M${x + w / 2 - aw / 2} ${top} Q${x + w / 2} ${top - 28} ${x + w / 2 + aw / 2} ${top} Z`, fill: color, stroke: C.trim, strokeWidth: 2 });
    shapes.push({ kind: 'rect', x: x + w / 2 - 4, y: top - 10, w: 8, h: 7, rx: 3.5, fill: C.glow });
  } else if (kind === 'mansard') {
    shapes.push({ kind: 'polygon', points: `${x + 2},${top} ${x + 9},${top - 17} ${x + w - 9},${top - 17} ${x + w - 2},${top}`, fill: C.roof });
    shapes.push({ kind: 'rect', x: x + w / 2 - 5, y: top - 14, w: 10, h: 11, rx: 5, fill: C.glow });
    shapes.push({ kind: 'line', x1: x + w / 2, y1: top - 17, x2: x + w / 2, y2: top - 24, stroke: C.trim, strokeWidth: 1.5 });
    shapes.push(...bulbs(x + 9, top - 18, x + w - 9, top - 18));
  } else {
    for (let px = x + 3; px <= x + w - 3; px += 5) {
      shapes.push({ kind: 'rect', x: px - 0.8, y: top - 9, w: 1.6, h: 6, fill: C.trim });
    }
    shapes.push({ kind: 'rect', x, y: top - 11, w, h: 2.5, fill: C.trim });
  }

  // Body, cornice with brackets, corner pilasters
  shapes.push({ kind: 'rect', x, y: top, w, h, fill: color });
  shapes.push({ kind: 'rect', x: x - 3, y: top - 4, w: w + 6, h: 5, fill: C.trim });
  for (let bx = x + 3; bx < x + w - 3; bx += 7) {
    shapes.push({ kind: 'rect', x: bx, y: top + 1, w: 2.2, h: 4, fill: C.trim });
  }
  shapes.push({ kind: 'rect', x, y: top, w: 3, h, fill: C.trim, opacity: 0.85 });
  shapes.push({ kind: 'rect', x: x + w - 3, y: top, w: 3, h, fill: C.trim, opacity: 0.85 });

  // Upper windows: white-framed arches with sills, row by row
  const cols = Math.max(2, Math.floor((w - 8) / (f.windowSpacing ?? 16)));
  const gap = (w - 8) / cols;
  let i = 0;
  for (let wy = top + 13; wy + 22 <= GROUND - 62; wy += 30) {
    for (let col = 0; col < cols; col++) {
      const wx = x + 4 + col * gap + gap / 2 - 5;
      shapes.push({ kind: 'rect', x: wx - 1.6, y: wy - 1.6, w: 13.2, h: 23, rx: 6.6, fill: C.trim });
      shapes.push({ kind: 'rect', x: wx, y: wy, w: 10, h: 20, rx: 5, fill: lit[i++ % lit.length] ? C.glow : C.windowDark });
      shapes.push({ kind: 'rect', x: wx - 2.5, y: wy + 21, w: 15, h: 2, fill: C.trim });
    }
  }
  if (f.bunting) shapes.push(...bunting(x + 4, w - 8, GROUND - 68));

  // Storefront: sign band, display window with mullions, door with transom
  shapes.push({ kind: 'rect', x: x + 4, y: GROUND - 58, w: w - 8, h: 9, fill: C.dark });
  shapes.push({ kind: 'rect', x: x + w / 2 - w * 0.2, y: GROUND - 54.5, w: w * 0.4, h: 2, rx: 1, fill: C.gold });
  const shopW = (w - 12) * 0.64;
  shapes.push({ kind: 'rect', x: x + 5, y: GROUND - 34, w: shopW, h: 30, fill: C.glow, opacity: 0.92 });
  shapes.push({ kind: 'line', x1: x + 5 + shopW / 3, y1: GROUND - 34, x2: x + 5 + shopW / 3, y2: GROUND - 4, stroke: C.trim, strokeWidth: 1.5 });
  shapes.push({ kind: 'line', x1: x + 5 + (2 * shopW) / 3, y1: GROUND - 34, x2: x + 5 + (2 * shopW) / 3, y2: GROUND - 4, stroke: C.trim, strokeWidth: 1.5 });
  shapes.push({ kind: 'rect', x: x + 3, y: GROUND - 4, w: w - 6, h: 4, fill: C.trim });
  const doorX = x + 8 + shopW;
  const doorW = w - 13 - shopW;
  shapes.push({ kind: 'rect', x: doorX, y: GROUND - 36, w: doorW, h: 5, fill: C.glow, opacity: 0.8 });
  shapes.push({ kind: 'rect', x: doorX, y: GROUND - 30, w: doorW, h: 30, rx: 1.5, fill: C.dark });
  shapes.push(...awning(x + 3, w - 6, GROUND - 47, f.awning));

  // Roofline and corner lights
  shapes.push(...bulbs(x - 3, top - 5, x + w + 3, top - 5));
  shapes.push(...bulbs(x + 1.5, top + 6, x + 1.5, GROUND - 60, 7));
  shapes.push(...bulbs(x + w - 1.5, top + 6, x + w - 1.5, GROUND - 60, 7));
  return shapes;
}

/** Ornate gas lamp with a warm glow, standing on the sidewalk. */
function lamp(x: number): Shape[] {
  const g = GROUND + 10;
  return [
    { kind: 'circle', cx: x, cy: g - 62, r: 10, fill: C.glow, opacity: 0.4 },
    { kind: 'rect', x: x - 6, y: g - 4, w: 12, h: 4, rx: 1, fill: C.dark },
    { kind: 'polygon', points: `${x - 4},${g - 4} ${x + 4},${g - 4} ${x + 2},${g - 14} ${x - 2},${g - 14}`, fill: C.dark },
    { kind: 'rect', x: x - 1.4, y: g - 52, w: 2.8, h: 40, fill: C.dark },
    { kind: 'rect', x: x - 3.5, y: g - 54, w: 7, h: 3, rx: 1, fill: C.dark },
    { kind: 'polygon', points: `${x - 6},${g - 70} ${x + 6},${g - 70} ${x + 4},${g - 55} ${x - 4},${g - 55}`, fill: C.glow },
    { kind: 'line', x1: x, y1: g - 70, x2: x, y2: g - 55, stroke: C.dark, strokeWidth: 1 },
    { kind: 'polygon', points: `${x - 7.5},${g - 70} ${x + 7.5},${g - 70} ${x},${g - 77}`, fill: C.dark },
    { kind: 'circle', cx: x, cy: g - 79, r: 1.6, fill: C.dark },
  ];
}

/** Sidewalk, brick-red street and streetcar rails. */
function street(): Shape[] {
  return [
    { kind: 'rect', x: 0, y: GROUND, w: 400, h: 12, fill: C.sidewalk },
    { kind: 'rect', x: 0, y: GROUND + 12, w: 400, h: 2, fill: C.trim, opacity: 0.5 },
    { kind: 'rect', x: 0, y: GROUND + 14, w: 400, h: 30, fill: C.street },
    ...Array.from({ length: 20 }, (_, i): Shape => ({ kind: 'rect', x: i * 20 + 4, y: GROUND + 22, w: 3, h: 13, fill: C.rail, opacity: 0.45 })),
    { kind: 'rect', x: 0, y: GROUND + 24, w: 400, h: 1.5, fill: C.rail },
    { kind: 'rect', x: 0, y: GROUND + 32, w: 400, h: 1.5, fill: C.rail },
  ];
}

// ---------------------------------------------------------------------------
// The main street at night (sign-in, intro, Quests header)
// ---------------------------------------------------------------------------

export const mainStreetNight: Shape[] = [
  ...sky(true),
  ...moon(354, 40, 14),
  ...facade({ x: -6, w: 66, h: 122, color: FACADE.mint, top: 'pediment', awning: C.red, lit: [true, false, true, true] }),
  ...facade({ x: 64, w: 76, h: 140, color: FACADE.salmon, top: 'mansard', awning: C.green, lit: [true, true, false], bunting: true }),
  ...facade({ x: 144, w: 58, h: 112, color: FACADE.butter, top: 'balustrade', awning: C.red, lit: [false, true, true] }),
  ...facade({ x: 206, w: 80, h: 146, color: FACADE.lavender, top: 'arch', awning: C.blue, lit: [true, false, true, true, false], bunting: true }),
  ...facade({ x: 290, w: 60, h: 118, color: FACADE.sky, top: 'pediment', awning: C.red, lit: [true, true, false] }),
  ...facade({ x: 354, w: 54, h: 128, color: FACADE.rose, top: 'balustrade', awning: C.green, lit: [false, true, true] }),
  ...street(),
  ...lamp(62),
  ...lamp(204),
  ...lamp(352),
];

// ---------------------------------------------------------------------------
// Quest vignettes (covers + placeholder hint photos)
// ---------------------------------------------------------------------------

/** Windows of Legends: one grand facade with names painted on glowing upper windows. */
const windowsFacade = facade({ x: 50, w: 300, h: 158, color: FACADE.lavender, top: 'pediment', awning: C.red, lit: [true], windowSpacing: 32 });
const windowsVignette: Shape[] = [
  ...sky(false),
  ...moon(358, 34, 11),
  ...windowsFacade,
  // Painted lettering across the glowing panes
  ...windowsFacade
    .filter((s): s is Extract<Shape, { kind: 'rect' }> => s.kind === 'rect' && s.fill === C.glow && s.w === 10)
    .flatMap((pane): Shape[] => [
      { kind: 'rect', x: pane.x + 2, y: pane.y + 9, w: 6, h: 1.4, rx: 0.7, fill: C.dark },
      { kind: 'rect', x: pane.x + 2.5, y: pane.y + 12, w: 5, h: 1.4, rx: 0.7, fill: C.dark },
    ]),
  ...street(),
  ...lamp(26),
  ...lamp(374),
];

/** Walt Was Here: an upstairs window with a lamp left burning. */
const lampVignette: Shape[] = [
  ...sky(false),
  ...moon(356, 36, 11),
  ...facade({ x: 30, w: 340, h: 150, color: FACADE.sky, top: 'balustrade', awning: C.green, lit: [false], windowSpacing: 30 }),
  { kind: 'circle', cx: 200, cy: 96, r: 46, fill: C.glow, opacity: 0.2 },
  { kind: 'rect', x: 178, y: 68, w: 44, h: 58, rx: 22, fill: C.trim },
  { kind: 'rect', x: 182, y: 72, w: 36, h: 50, rx: 18, fill: C.gold },
  { kind: 'polygon', points: '193,104 207,104 205,116 195,116', fill: C.dark },
  { kind: 'polygon', points: '191,104 209,104 200,96', fill: C.dark },
  { kind: 'path', d: 'M200 106 C202.5 109 202.5 112 200 114 C197.5 112 197.5 109 200 106 Z', fill: C.bulb },
  ...street(),
  ...lamp(18),
];

/** Ears Everywhere: a magnifying glass sweeping over facade details. */
const magnifierVignette: Shape[] = [
  ...sky(false),
  ...moon(358, 34, 11),
  ...facade({ x: 18, w: 118, h: 146, color: FACADE.butter, top: 'pediment', awning: C.red, lit: [true, false, true, true], windowSpacing: 26 }),
  ...facade({ x: 140, w: 120, h: 132, color: FACADE.mint, top: 'mansard', awning: C.blue, lit: [false, true, true], bunting: true, windowSpacing: 26 }),
  ...facade({ x: 264, w: 118, h: 150, color: FACADE.salmon, top: 'arch', awning: C.green, lit: [true, true, false], windowSpacing: 26 }),
  ...street(),
  { kind: 'circle', cx: 212, cy: 104, r: 48, fill: C.parchment, opacity: 0.2 },
  { kind: 'line', x1: 246, y1: 138, x2: 284, y2: 176, stroke: C.dark, strokeWidth: 14 },
  { kind: 'line', x1: 246, y1: 138, x2: 284, y2: 176, stroke: C.gold, strokeWidth: 8 },
  { kind: 'circle', cx: 212, cy: 104, r: 48, fill: 'none', stroke: C.gold, strokeWidth: 8 },
  sparkle(212, 104, 12, C.glow),
  sparkle(188, 84, 5, C.parchment),
  sparkle(236, 122, 4, C.parchment),
];

/** Main Street Senses: candy-striped awnings, a mailbox and music in the air. */
const sensesVignette: Shape[] = [
  ...sky(true),
  ...moon(358, 34, 11),
  ...facade({ x: 14, w: 170, h: 136, color: FACADE.rose, top: 'balustrade', awning: C.red, lit: [true, true, false, true], bunting: true, windowSpacing: 26 }),
  ...facade({ x: 216, w: 170, h: 144, color: FACADE.butter, top: 'pediment', awning: C.red, lit: [true, false, true, true], windowSpacing: 26 }),
  { kind: 'rect', x: 188, y: 168, w: 24, h: 28, rx: 3, fill: C.red },
  { kind: 'path', d: 'M188 172 C188 160 212 160 212 172 Z', fill: C.red },
  { kind: 'rect', x: 193, y: 174, w: 14, h: 3, rx: 1.5, fill: C.dark },
  { kind: 'circle', cx: 120, cy: 34, r: 4.5, fill: C.glow },
  { kind: 'rect', x: 123.2, y: 14, w: 2.2, h: 20, fill: C.glow },
  { kind: 'polygon', points: '123.2,14 136,19 136,24 125.4,20', fill: C.glow },
  ...street(),
  ...lamp(6),
];

/** Vignette per quest slug; unknown quests fall back to the street scene. */
export const questScenes: Record<string, Shape[]> = {
  'windows-of-legends': windowsVignette,
  'walt-was-here': lampVignette,
  'ears-everywhere': magnifierVignette,
  'main-street-senses': sensesVignette,
};

export function sceneForQuest(slug: string | null | undefined): Shape[] {
  return (slug && questScenes[slug]) || mainStreetNight;
}
