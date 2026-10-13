/**
 * Original illustrated map of the whole park (720 × 900), drawn like a page
 * from a storybook atlas: the train loop on a tree-lined berm, the street
 * running north to the central plaza, and each land around it with its own
 * ground color and little landmarks. Layout is loosely geographic, not to
 * scale. Generic shapes only — no castle (the plaza's north side is a bridge
 * and banners), no characters, no copied map art, no three-circle shapes.
 * Text labels, progress medallions and the moving pieces (train, riverboat,
 * balloon, rocket spinner) are added on top by ParkMap.
 */
import type { Shape } from './shapes';

type Hex = `#${string}`;
type Pt = { x: number; y: number };

export const PARK_CANVAS = { width: 720, height: 900 } as const;

const M = {
  paper: '#F3E9D2',
  aged: '#E6D5B0',
  edge: '#C9A86A',
  ink: '#1B2340',
  ground: '#EFE6CC',
  walk: '#F7F0DE',
  lawn: '#B7CD9E',
  lawnDark: '#9FBE86',
  tree: '#86AE77',
  treeDark: '#6E9A63',
  jungle: '#5E8E5A',
  water: '#9CC6D9',
  waterDeep: '#86B6CC',
  waterLight: '#D6ECF4',
  gold: '#E2B04A',
  glow: '#F6D58E',
  rose: '#D9677A',
  red: '#C8475A',
  white: '#FFFDF7',
  lilac: '#B79AD3',
  roof: '#7D6A86',
  wood: '#9A6A44',
  woodDark: '#6E4A30',
  rock: '#C9774E',
  rockDark: '#A65A3A',
  straw: '#D9B56E',
  steel: '#B8C2D2',
  blue: '#6F8FD0',
  snow: '#FBFCFF',
  stone: '#A7A2A8',
} as const;

// ---------------------------------------------------------------------------
// Curves
// ---------------------------------------------------------------------------

/** Smooth closed loop through the points (Catmull-Rom), sampled `steps` times per segment. */
function smoothLoop(points: Pt[], steps: number): Pt[] {
  const out: Pt[] = [];
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: +f(p0.x, p1.x, p2.x, p3.x).toFixed(1), y: +f(p0.y, p1.y, p2.y, p3.y).toFixed(1) });
    }
  }
  out.push(out[0]);
  return out;
}

function ellipsePoints(cx: number, cy: number, rx: number, ry: number, count: number): Pt[] {
  return Array.from({ length: count + 1 }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    return { x: +(cx + rx * Math.cos(a)).toFixed(1), y: +(cy + ry * Math.sin(a)).toFixed(1) };
  });
}

const toPath = (pts: Pt[], close = false) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ') + (close ? ' Z' : '');

/** The train loop on the berm, clockwise from the street's station. */
export const TRAIN_PATH: Pt[] = smoothLoop(
  [
    { x: 360, y: 832 }, { x: 470, y: 826 }, { x: 570, y: 806 }, { x: 640, y: 762 }, { x: 678, y: 690 },
    { x: 690, y: 600 }, { x: 690, y: 480 }, { x: 678, y: 380 }, { x: 650, y: 280 }, { x: 610, y: 190 },
    { x: 560, y: 112 }, { x: 490, y: 64 }, { x: 400, y: 50 }, { x: 310, y: 66 }, { x: 230, y: 104 },
    { x: 160, y: 150 }, { x: 100, y: 212 }, { x: 56, y: 296 }, { x: 40, y: 390 }, { x: 46, y: 480 },
    { x: 70, y: 562 }, { x: 110, y: 634 }, { x: 160, y: 702 }, { x: 222, y: 764 }, { x: 290, y: 808 },
  ],
  4,
);

const RIVER = { cx: 165, cy: 362, rx: 96, ry: 80 } as const;

/** The riverboat's loop around the island, clockwise. */
export const RIVERBOAT_PATH: Pt[] = ellipsePoints(RIVER.cx, RIVER.cy, 78, 63, 36);

/** Hot-air balloon in the margin, rocket spinner hub and plaza fountain. */
export const PARK_BALLOON: Pt = { x: 70, y: 92 };
export const ROCKET_SPINNER: Pt = { x: 474, y: 584 };
export const PARK_FOUNTAIN: Pt = { x: 360, y: 522 };
/** Painted sparkles that twinkle. */
export const PARK_TWINKLES: Pt[] = [
  { x: 640, y: 64 }, { x: 34, y: 640 }, { x: 590, y: 858 }, { x: 214, y: 34 }, { x: 452, y: 420 },
];

// ---------------------------------------------------------------------------
// Little drawings
// ---------------------------------------------------------------------------

function tree(cx: number, cy: number, r = 7, color: Hex = M.tree): Shape[] {
  return [
    { kind: 'circle', cx: cx + 1.5, cy: cy + 2, r, fill: M.treeDark, opacity: 0.35 },
    { kind: 'circle', cx, cy, r, fill: color },
    { kind: 'circle', cx: cx - r * 0.3, cy: cy - r * 0.3, r: r * 0.42, fill: M.lawn, opacity: 0.55 },
  ];
}

/** Palm seen from above: a star of fronds. */
function palmTop(cx: number, cy: number, r: number): Shape[] {
  const out: Shape[] = [];
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    const tx = cx + r * Math.cos(a);
    const ty = cy + r * Math.sin(a);
    const lx = cx + r * 0.5 * Math.cos(a + 0.5);
    const ly = cy + r * 0.5 * Math.sin(a + 0.5);
    out.push({ kind: 'path', d: `M${cx} ${cy} Q${lx.toFixed(1)} ${ly.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`, fill: 'none', stroke: M.jungle, strokeWidth: 3.5 });
  }
  out.push({ kind: 'circle', cx, cy, r: 2.5, fill: M.woodDark });
  return out;
}

function sparkle(cx: number, cy: number, r: number, fill: Hex = M.gold): Shape {
  const s = r * 0.28;
  return {
    kind: 'polygon',
    points: `${cx},${cy - r} ${cx + s},${cy - s} ${cx + r},${cy} ${cx + s},${cy + s} ${cx},${cy + r} ${cx - s},${cy + s} ${cx - r},${cy} ${cx - s},${cy - s}`,
    fill,
  };
}

function cloud(x: number, y: number, w: number): Shape {
  const h = w * 0.38;
  return {
    kind: 'path',
    d: `M${x} ${y + h} Q${x - w * 0.08} ${y + h * 0.35} ${x + w * 0.22} ${y + h * 0.45} Q${x + w * 0.3} ${y - h * 0.2} ${x + w * 0.58} ${y + h * 0.25} Q${x + w * 0.85} ${y} ${x + w * 0.95} ${y + h * 0.55} Q${x + w * 1.1} ${y + h} ${x + w} ${y + h} Z`,
    fill: M.white,
    stroke: M.edge,
    strokeWidth: 1,
    opacity: 0.9,
  };
}

function bird(x: number, y: number): Shape {
  return { kind: 'path', d: `M${x - 5} ${y} Q${x - 2.5} ${y - 4} ${x} ${y} Q${x + 2.5} ${y - 4} ${x + 5} ${y}`, fill: 'none', stroke: M.ink, strokeWidth: 1.2, opacity: 0.6 };
}

function curl(x: number, y: number, sx: 1 | -1, sy: 1 | -1): Shape {
  return {
    kind: 'path',
    d: `M${x} ${y + 30 * sy} Q${x} ${y} ${x + 30 * sx} ${y} M${x + 9 * sx} ${y + 18 * sy} Q${x + 9 * sx} ${y + 9 * sy} ${x + 18 * sx} ${y + 9 * sy}`,
    fill: 'none',
    stroke: M.edge,
    strokeWidth: 2,
  };
}

/** Rounded land patch with a dashed storybook border. */
function patch(d: string, fill: Hex): Shape[] {
  return [
    { kind: 'path', d, fill },
    { kind: 'path', d, fill: 'none', stroke: M.edge, strokeWidth: 1.5, dash: '5 5' },
  ];
}

function walkway(d: string, width = 12): Shape[] {
  return [
    { kind: 'path', d, fill: 'none', stroke: M.edge, strokeWidth: width + 3, opacity: 0.6 },
    { kind: 'path', d, fill: 'none', stroke: M.walk, strokeWidth: width },
  ];
}

/** Little building from above: a roof with a ridge line and a lit skylight. */
function house(x: number, y: number, w: number, h: number, fill: Hex): Shape[] {
  return [
    { kind: 'rect', x: x + 1.5, y: y + 2, w, h, rx: 2, fill: M.ink, opacity: 0.15 },
    { kind: 'rect', x, y, w, h, rx: 2, fill, stroke: M.edge, strokeWidth: 1 },
    { kind: 'line', x1: x + 3, y1: y + h / 2, x2: x + w - 3, y2: y + h / 2, stroke: M.roof, strokeWidth: 1, opacity: 0.4 },
    { kind: 'rect', x: x + w / 2 - 2.5, y: y + h / 2 - 5, w: 5, h: 3, rx: 1, fill: M.glow },
  ];
}

function station(x: number, y: number, w: number, roof: Hex): Shape[] {
  return [
    { kind: 'rect', x: x - w / 2, y: y - 9, w, h: 18, rx: 2, fill: M.white, stroke: M.ink, strokeWidth: 1.2 },
    { kind: 'polygon', points: `${x - w / 2 - 3},${y - 9} ${x},${y - 18} ${x + w / 2 + 3},${y - 9}`, fill: roof, stroke: M.ink, strokeWidth: 1 },
    { kind: 'rect', x: x - 3, y: y - 4, w: 6, h: 9, rx: 1, fill: M.glow },
  ];
}

function torch(x: number, y: number): Shape[] {
  return [
    { kind: 'circle', cx: x, cy: y, r: 5, fill: M.glow, opacity: 0.5 },
    { kind: 'circle', cx: x, cy: y, r: 1.8, fill: M.red },
  ];
}

// ---------------------------------------------------------------------------
// The map
// ---------------------------------------------------------------------------

const frame: Shape[] = [
  { kind: 'rect', x: 0, y: 0, w: 720, h: 900, fill: M.paper },
  { kind: 'rect', x: 6, y: 6, w: 708, h: 888, rx: 16, fill: 'none', stroke: M.aged, strokeWidth: 10 },
  { kind: 'rect', x: 12, y: 12, w: 696, h: 876, rx: 12, fill: 'none', stroke: M.edge, strokeWidth: 2 },
  { kind: 'rect', x: 20, y: 20, w: 680, h: 860, rx: 8, fill: 'none', stroke: M.edge, strokeWidth: 1, dash: '3 5' },
  curl(26, 26, 1, 1),
  curl(694, 26, -1, 1),
  curl(26, 874, 1, -1),
  curl(694, 874, -1, -1),
  cloud(560, 28, 70),
  cloud(250, 18, 54),
  cloud(470, 856, 46),
  bird(150, 50),
  bird(166, 42),
  bird(690, 300),
  ...PARK_TWINKLES.map((p) => sparkle(p.x, p.y, 5)),
  // Title cartouche (bottom left) and compass rose (bottom right).
  { kind: 'path', d: 'M40 806 Q40 790 56 790 L196 790 Q212 790 212 806 L212 838 Q212 854 196 854 L56 854 Q40 854 40 838 Z', fill: M.white, stroke: M.edge, strokeWidth: 2 },
  { kind: 'path', d: 'M48 812 Q48 798 62 798 L190 798 Q204 798 204 812 L204 832 Q204 846 190 846 L62 846 Q48 846 48 832 Z', fill: 'none', stroke: M.gold, strokeWidth: 1, dash: '2 3' },
  { kind: 'circle', cx: 662, cy: 840, r: 22, fill: M.white, stroke: M.edge, strokeWidth: 1.5 },
  { kind: 'polygon', points: '662,814 667,840 662,866 657,840', fill: M.ink, opacity: 0.85 },
  { kind: 'polygon', points: '636,840 662,835 688,840 662,845', fill: M.edge },
  { kind: 'polygon', points: '662,814 667,840 657,840', fill: M.red },
  { kind: 'circle', cx: 662, cy: 840, r: 3, fill: M.gold },
];

// The berm, park ground and the train loop.
const berm: Shape[] = [
  { kind: 'path', d: toPath(TRAIN_PATH, true), fill: M.ground },
  { kind: 'path', d: toPath(TRAIN_PATH, true), fill: 'none', stroke: M.lawnDark, strokeWidth: 34 },
  ...TRAIN_PATH.filter((_, i) => i % 3 === 1).flatMap((p): Shape[] => {
    const dx = p.x - 360;
    const dy = p.y - 450;
    const len = Math.hypot(dx, dy) || 1;
    return tree(+(p.x + (dx / len) * 12).toFixed(1), +(p.y + (dy / len) * 12).toFixed(1), 6.5, M.tree);
  }),
  { kind: 'path', d: toPath(TRAIN_PATH, true), fill: 'none', stroke: M.woodDark, strokeWidth: 6, opacity: 0.8 },
  { kind: 'path', d: toPath(TRAIN_PATH, true), fill: 'none', stroke: M.walk, strokeWidth: 2.5, dash: '1.5 4' },
  // Stations: the street, the river, the cartoon town and tomorrow.
  ...station(360, 846, 60, M.red),
  ...station(96, 616, 34, M.blue),
  ...station(440, 40, 34, M.gold),
  ...station(706, 560, 26, M.steel),
];

// Entrance, street and plaza.
const mainStreet: Shape[] = [
  { kind: 'path', d: 'M300 900 L300 870 Q360 852 420 870 L420 900 Z', fill: M.walk, stroke: M.edge, strokeWidth: 1 },
  { kind: 'circle', cx: 360, cy: 878, r: 12, fill: M.lawn },
  ...[0, 1, 2, 3, 4, 5].map((k): Shape => ({ kind: 'circle', cx: 360 + 8 * Math.cos(k), cy: 878 + 8 * Math.sin(k), r: 2, fill: k % 2 ? M.rose : M.gold })),
  { kind: 'path', d: 'M318 840 Q318 828 330 828 Q342 828 342 840 Z', fill: M.ink, opacity: 0.7 },
  { kind: 'path', d: 'M378 840 Q378 828 390 828 Q402 828 402 840 Z', fill: M.ink, opacity: 0.7 },
  // Town square.
  { kind: 'rect', x: 312, y: 760, w: 96, h: 56, rx: 10, fill: M.walk, stroke: M.edge, strokeWidth: 1 },
  { kind: 'circle', cx: 360, cy: 788, r: 18, fill: M.lawn, stroke: M.lawnDark, strokeWidth: 1 },
  { kind: 'circle', cx: 360, cy: 788, r: 3, fill: M.ink },
  { kind: 'line', x1: 360, y1: 788, x2: 360, y2: 772, stroke: M.ink, strokeWidth: 1.2 },
  { kind: 'polygon', points: '360,772 370,775 360,778', fill: M.red },
  // The street with shops on both sides.
  { kind: 'rect', x: 344, y: 556, w: 32, h: 206, fill: M.walk, stroke: M.edge, strokeWidth: 1 },
  { kind: 'line', x1: 357, y1: 560, x2: 357, y2: 760, stroke: M.edge, strokeWidth: 1 },
  { kind: 'line', x1: 363, y1: 560, x2: 363, y2: 760, stroke: M.edge, strokeWidth: 1 },
  ...[564, 594, 620, 652, 680, 712, 736].flatMap((y, i): Shape[] => [
    ...house(318, y, 24, i % 2 ? 26 : 30, (['#E3B9A9', '#E9D39A', '#B9D3C5', '#CDBEDF'] as Hex[])[i % 4]),
    ...house(378, y + 4, 24, i % 2 ? 30 : 24, (['#B9C8E4', '#E6B8C6', '#E9D39A', '#B9D3C5'] as Hex[])[i % 4]),
  ]),
  ...[580, 640, 700].flatMap((y): Shape[] => [
    { kind: 'circle', cx: 348, cy: y, r: 3.5, fill: M.glow, opacity: 0.6 },
    { kind: 'circle', cx: 372, cy: y + 14, r: 3.5, fill: M.glow, opacity: 0.6 },
  ]),
  // Central plaza with lawn ring and fountain.
  { kind: 'circle', cx: 360, cy: 522, r: 52, fill: M.walk, stroke: M.edge, strokeWidth: 1.5 },
  { kind: 'circle', cx: 360, cy: 522, r: 40, fill: M.lawn },
  { kind: 'circle', cx: 360, cy: 522, r: 24, fill: M.walk },
  { kind: 'circle', cx: 360, cy: 522, r: 10, fill: M.water, stroke: M.edge, strokeWidth: 1 },
  { kind: 'circle', cx: 360, cy: 522, r: 3, fill: M.waterLight },
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((k): Shape => ({
    kind: 'circle', cx: +(360 + 32 * Math.cos((k * Math.PI) / 4 + 0.4)).toFixed(1), cy: +(522 + 32 * Math.sin((k * Math.PI) / 4 + 0.4)).toFixed(1), r: 2, fill: k % 2 ? M.rose : M.gold,
  })),
  { kind: 'rect', x: 352, y: 470, w: 16, h: 90, fill: M.walk },
  { kind: 'rect', x: 312, y: 514, w: 96, h: 16, fill: M.walk },
  { kind: 'circle', cx: 360, cy: 522, r: 10, fill: M.water, stroke: M.edge, strokeWidth: 1 },
  { kind: 'circle', cx: 360, cy: 522, r: 3, fill: M.waterLight },
  // North side of the plaza: a moat, a little bridge and two banners (no castle).
  { kind: 'path', d: 'M300 470 Q360 446 420 470', fill: 'none', stroke: M.water, strokeWidth: 10 },
  { kind: 'rect', x: 350, y: 448, w: 20, h: 22, rx: 2, fill: M.wood, stroke: M.woodDark, strokeWidth: 1 },
  ...[338, 382].flatMap((x): Shape[] => [
    { kind: 'line', x1: x, y1: 470, x2: x, y2: 446, stroke: M.ink, strokeWidth: 1.5 },
    { kind: 'path', d: `M${x} 446 L${x + 10} 449 L${x} 453 Z`, fill: M.red },
  ]),
];

const walkways: Shape[] = [
  ...walkway('M330 548 C300 580 270 610 240 640'),
  ...walkway('M318 498 C300 480 292 460 286 420'),
  ...walkway('M360 446 C360 420 380 405 400 390'),
  ...walkway('M398 548 C430 570 470 590 520 610'),
  ...walkway('M286 470 C260 490 220 510 190 530'),
  ...walkway('M190 540 C200 570 215 600 230 630'),
  ...walkway('M300 320 C320 300 345 290 372 284'),
  ...walkway('M470 220 C474 196 476 170 476 150'),
  ...walkway('M120 520 C56 470 46 360 84 302 C112 262 172 250 236 268', 10),
  ...walkway('M466 446 C480 470 494 488 508 508'),
];

// Adventureland: jungle, a winding river, a giant tree and a thatched hut.
const adventureland: Shape[] = [
  ...patch('M240 560 Q240 544 260 544 L304 548 Q336 552 336 580 L332 700 Q330 726 300 726 L200 726 Q172 724 172 700 L174 640 Q176 620 200 620 L222 620 Q240 618 240 600 Z', '#A9C98F'),
  { kind: 'path', d: 'M196 706 C186 666 222 652 246 670 C266 686 296 690 306 662 C314 636 292 620 268 630', fill: 'none', stroke: M.waterDeep, strokeWidth: 14 },
  { kind: 'path', d: 'M196 706 C186 666 222 652 246 670 C266 686 296 690 306 662 C314 636 292 620 268 630', fill: 'none', stroke: M.water, strokeWidth: 9 },
  { kind: 'rect', x: 286, y: 690, w: 26, h: 7, rx: 1.5, fill: M.wood },
  { kind: 'rect', x: 238, y: 672, w: 16, h: 7, rx: 2, fill: M.white, stroke: M.ink, strokeWidth: 0.8 },
  ...[240, 246, 252].map((x): Shape => ({ kind: 'rect', x, y: 672, w: 3, h: 7, fill: M.red })),
  // The giant tree with a house in its branches.
  { kind: 'circle', cx: 264, cy: 600, r: 22, fill: M.jungle },
  { kind: 'circle', cx: 257, cy: 592, r: 11, fill: M.tree, opacity: 0.8 },
  { kind: 'rect', x: 258, y: 598, w: 14, h: 10, rx: 1.5, fill: M.wood, stroke: M.woodDark, strokeWidth: 1 },
  { kind: 'line', x1: 272, y1: 608, x2: 284, y2: 622, stroke: M.woodDark, strokeWidth: 1.5, dash: '2 2' },
  // Thatched hut, torches and a palm older than the park.
  { kind: 'circle', cx: 298, cy: 570, r: 15, fill: M.straw, stroke: M.woodDark, strokeWidth: 1 },
  ...[0, 1, 2, 3, 4, 5].map((k): Shape => ({ kind: 'line', x1: 298, y1: 570, x2: +(298 + 15 * Math.cos(k * 1.05)).toFixed(1), y2: +(570 + 15 * Math.sin(k * 1.05)).toFixed(1), stroke: M.woodDark, strokeWidth: 0.8, opacity: 0.6 })),
  { kind: 'circle', cx: 298, cy: 570, r: 3, fill: M.woodDark },
  ...torch(278, 556),
  ...torch(318, 556),
  ...torch(278, 588),
  ...palmTop(318, 614, 12),
  ...palmTop(214, 668, 10),
  ...palmTop(310, 676, 9),
  // Stepped stone temple in the trees.
  { kind: 'rect', x: 180, y: 628, w: 30, h: 26, fill: M.stone, stroke: M.woodDark, strokeWidth: 1 },
  { kind: 'rect', x: 186, y: 633, w: 18, h: 16, fill: '#BDB7BB' },
  { kind: 'rect', x: 191, y: 638, w: 8, h: 6, fill: M.ink, opacity: 0.6 },
  ...[[186, 700], [214, 714], [274, 712], [324, 704], [254, 560], [326, 650], [228, 632]].flatMap(([x, y]) => tree(x, y, 7, M.jungle)),
];

// New Orleans Square: pastel rooftops, iron-lace balconies, a ship at the riverfront.
const newOrleans: Shape[] = [
  ...patch('M70 470 Q68 452 90 452 L218 458 Q238 460 236 480 L234 586 Q232 608 210 608 L120 608 Q74 604 70 580 Z', '#EAD9C6'),
  ...[[86, 486, '#E6B8C6'], [124, 482, '#E9D39A'], [162, 482, '#B9D3C5'], [200, 486, '#CDBEDF'],
      [86, 530, '#B9D3C5'], [124, 540, '#CDBEDF'], [196, 538, '#E3B9A9'], [100, 574, '#E9D39A'], [150, 576, '#E6B8C6']].flatMap(
    ([x, y, c]): Shape[] => [
      ...house(x as number, y as number, 32, 28, c as Hex),
      { kind: 'line', x1: (x as number) + 2, y1: (y as number) + 29.5, x2: (x as number) + 30, y2: (y as number) + 29.5, stroke: M.ink, strokeWidth: 1.4, dash: '1 2' },
    ],
  ),
  // A tiny courtyard fountain.
  { kind: 'circle', cx: 168, cy: 548, r: 9, fill: M.walk, stroke: M.edge, strokeWidth: 1 },
  { kind: 'circle', cx: 168, cy: 548, r: 4.5, fill: M.water },
  ...[[220, 592], [84, 600], [222, 520]].flatMap(([x, y]) => tree(x, y, 6)),
  { kind: 'circle', cx: 146, cy: 524, r: 3.2, fill: M.glow, opacity: 0.7 },
  { kind: 'circle', cx: 190, cy: 576, r: 3.2, fill: M.glow, opacity: 0.7 },
];

// The river, its island and the boats.
const river: Shape[] = [
  { kind: 'path', d: toPath(ellipsePoints(RIVER.cx, RIVER.cy, RIVER.rx + 4, RIVER.ry + 4, 48), true), fill: M.edge, opacity: 0.5 },
  { kind: 'path', d: toPath(ellipsePoints(RIVER.cx, RIVER.cy, RIVER.rx, RIVER.ry, 48), true), fill: M.water },
  { kind: 'path', d: toPath(RIVERBOAT_PATH), fill: 'none', stroke: M.waterLight, strokeWidth: 1.5, dash: '6 8' },
  // The island.
  { kind: 'path', d: 'M112 350 C112 318 146 300 176 304 C212 308 228 334 222 362 C216 394 190 414 160 410 C128 406 112 380 112 350 Z', fill: M.lawn, stroke: M.lawnDark, strokeWidth: 1.5 },
  { kind: 'rect', x: 176, y: 326, w: 24, h: 24, fill: 'none', stroke: M.woodDark, strokeWidth: 3, dash: '2 1.5' },
  { kind: 'rect', x: 196, y: 322, w: 8, h: 8, fill: M.wood },
  { kind: 'line', x1: 200, y1: 322, x2: 200, y2: 312, stroke: M.ink, strokeWidth: 1 },
  { kind: 'polygon', points: '200,312 208,314 200,316', fill: M.red },
  ...[[134, 336], [150, 320], [130, 372], [156, 392], [186, 388], [208, 366], [148, 354]].flatMap(([x, y]) => tree(x, y, 7)),
  { kind: 'line', x1: 112, y1: 352, x2: 96, y2: 352, stroke: M.wood, strokeWidth: 3, dash: '3 2' },
  // A tall ship moored on the far side.
  { kind: 'path', d: 'M84 404 C88 396 106 394 112 402 C108 410 90 412 84 404 Z', fill: M.woodDark },
  ...[92, 100, 108].map((x): Shape => ({ kind: 'circle', cx: x - 2, cy: 402, r: 2, fill: M.white, stroke: M.ink, strokeWidth: 0.6 })),
  // Canoe landing and a riverboat dock.
  { kind: 'rect', x: 238, y: 300, w: 20, h: 6, rx: 1.5, fill: M.wood },
  { kind: 'path', d: 'M232 316 Q240 312 250 316 Q240 320 232 316 Z', fill: M.wood },
  { kind: 'rect', x: 256, y: 380, w: 10, h: 28, rx: 2, fill: M.wood },
];

// Bayou Country: cypress, lily pads, cabins and a hill with a flume.
const bayou: Shape[] = [
  ...patch('M110 200 Q118 176 146 174 L222 176 Q246 180 246 204 L242 260 Q238 284 210 282 L122 282 Q104 278 106 256 Z', '#9DBF94'),
  { kind: 'path', d: 'M150 200 C176 178 214 182 230 206 C240 222 236 246 220 254 C200 262 170 250 150 230 Z', fill: '#B08A62', stroke: M.woodDark, strokeWidth: 1.2 },
  { kind: 'path', d: 'M156 214 C178 196 214 202 222 224 C226 238 212 248 196 246', fill: 'none', stroke: M.water, strokeWidth: 4 },
  { kind: 'circle', cx: 196, cy: 246, r: 6, fill: M.waterLight },
  ...[[176, 206], [210, 214], [190, 230]].flatMap(([x, y]) => tree(x, y, 5, M.treeDark)),
  ...[[128, 222], [126, 256], [150, 268]].flatMap(([x, y]): Shape[] => [
    { kind: 'circle', cx: x, cy: y, r: 10, fill: '#557E58' },
    { kind: 'circle', cx: x + 2, cy: y + 2, r: 4, fill: '#7E9A74', opacity: 0.7 },
  ]),
  ...house(138, 184, 24, 18, '#C9A27A'),
  ...house(208, 262, 26, 16, '#C9A27A'),
  { kind: 'path', d: 'M114 276 Q132 268 150 278 Q170 290 196 282', fill: 'none', stroke: M.water, strokeWidth: 5 },
  ...[[160, 276], [176, 286], [130, 286]].map(([x, y]): Shape => ({ kind: 'circle', cx: x, cy: y, r: 3, fill: '#5E8E5A' })),
  ...[[140, 238], [168, 262], [124, 204], [232, 240]].flatMap(([x, y]): Shape[] => [
    { kind: 'circle', cx: x, cy: y, r: 4, fill: '#F6E27A', opacity: 0.4 },
    { kind: 'circle', cx: x, cy: y, r: 1.4, fill: '#FFF7B0' },
  ]),
];

// Frontierland: red-rock spires with a mine track, a log fort and a saloon.
const frontier: Shape[] = [
  ...patch('M256 262 Q256 246 276 246 L326 248 Q344 250 344 270 L340 494 Q338 512 318 512 L276 512 Q258 510 258 492 Z', '#E5C99A'),
  { kind: 'polygon', points: '266,300 276,270 290,262 302,276 316,260 332,284 336,322 318,338 296,340 272,330', fill: M.rock, stroke: M.rockDark, strokeWidth: 1.5 },
  { kind: 'polygon', points: '290,262 302,276 298,300 286,290', fill: M.rockDark, opacity: 0.6 },
  { kind: 'polygon', points: '316,260 332,284 322,296 312,282', fill: M.rockDark, opacity: 0.6 },
  { kind: 'path', d: 'M274 318 C290 296 318 326 330 300 C340 278 300 270 288 290', fill: 'none', stroke: M.woodDark, strokeWidth: 2, dash: '3 2' },
  ...[[280, 344], [334, 340]].flatMap(([x, y]) => tree(x, y, 5, M.treeDark)),
  // Log fort.
  { kind: 'rect', x: 278, y: 408, w: 46, h: 40, fill: M.wood, opacity: 0.25 },
  { kind: 'rect', x: 278, y: 408, w: 46, h: 40, fill: 'none', stroke: M.woodDark, strokeWidth: 4, dash: '3 1.5' },
  ...[[274, 404], [320, 404], [274, 444], [320, 444]].map(([x, y]): Shape => ({ kind: 'rect', x, y, w: 9, h: 9, fill: M.woodDark })),
  { kind: 'line', x1: 301, y1: 408, x2: 301, y2: 392, stroke: M.ink, strokeWidth: 1.2 },
  { kind: 'polygon', points: '301,392 312,395 301,398', fill: M.red },
  // Saloon and shops along the riverfront.
  ...house(270, 356, 34, 22, '#E3B9A9'),
  ...house(308, 360, 26, 20, '#E9D39A'),
  ...house(274, 466, 26, 20, '#C9A27A'),
  { kind: 'rect', x: 270, y: 356, w: 34, h: 4, fill: M.gold },
  ...[[330, 476], [262, 400]].flatMap(([x, y]): Shape[] => [
    { kind: 'rect', x: x - 1.5, y: y - 8, w: 3, h: 14, rx: 1.5, fill: '#6E9A63' },
    { kind: 'rect', x: x - 6, y: y - 4, w: 4, h: 2, rx: 1, fill: '#6E9A63' },
  ]),
];

// Fantasyland: a striped carrousel, teacups, a snowy peak, cottages and a clock-tower facade by a canal.
const fantasy: Shape[] = [
  ...patch('M336 190 Q336 168 360 168 L548 168 Q572 168 572 190 L570 420 Q568 444 544 444 L420 444 Q350 444 340 420 Z', '#E3D3EC'),
  // Clock-tower facade with a canal.
  { kind: 'path', d: 'M432 236 C432 252 560 252 560 236', fill: 'none', stroke: M.water, strokeWidth: 8 },
  { kind: 'rect', x: 438, y: 186, w: 116, h: 36, rx: 3, fill: M.white, stroke: M.gold, strokeWidth: 1.5 },
  ...[444, 466, 520, 540].map((x, i): Shape => (i % 2
    ? { kind: 'path', d: `M${x} 186 A8 8 0 0 1 ${x + 16} 186 Z`, fill: M.gold }
    : { kind: 'polygon', points: `${x},186 ${x + 8},174 ${x + 16},186`, fill: M.white, stroke: M.gold, strokeWidth: 1.2 })),
  { kind: 'rect', x: 486, y: 168, w: 28, h: 54, rx: 2, fill: M.white, stroke: M.gold, strokeWidth: 1.5 },
  { kind: 'circle', cx: 500, cy: 184, r: 9, fill: M.walk, stroke: M.gold, strokeWidth: 2 },
  { kind: 'line', x1: 500, y1: 184, x2: 500, y2: 178, stroke: M.ink, strokeWidth: 1.2 },
  { kind: 'line', x1: 500, y1: 184, x2: 504, y2: 186, stroke: M.ink, strokeWidth: 1.2 },
  ...[454, 474, 528, 546].map((x): Shape => ({ kind: 'circle', cx: x, cy: 206, r: 3, fill: M.gold })),
  ...[[430, 262], [446, 270], [552, 262], [536, 270]].flatMap(([x, y]) => tree(x, y, 5, M.treeDark)),
  // Cottages with half-timbered roofs.
  ...[[352, 186, '#F2D6A2'], [384, 176, '#E6B8C6'], [356, 230, '#B9D3C5'], [392, 220, '#CDBEDF']].flatMap(([x, y, c]): Shape[] => [
    ...house(x as number, y as number, 26, 22, c as Hex),
    { kind: 'line', x1: (x as number) + 13, y1: y as number, x2: (x as number) + 13, y2: (y as number) + 22, stroke: M.woodDark, strokeWidth: 1, opacity: 0.6 },
  ]),
  // Carrousel from above: striped canopy.
  { kind: 'circle', cx: 396, cy: 392, r: 24, fill: M.walk, stroke: M.edge, strokeWidth: 1 },
  ...Array.from({ length: 12 }, (_, k): Shape => {
    const a1 = (k * Math.PI) / 6;
    const a2 = ((k + 1) * Math.PI) / 6;
    return {
      kind: 'polygon',
      points: `396,392 ${(396 + 20 * Math.cos(a1)).toFixed(1)},${(392 + 20 * Math.sin(a1)).toFixed(1)} ${(396 + 20 * Math.cos(a2)).toFixed(1)},${(392 + 20 * Math.sin(a2)).toFixed(1)}`,
      fill: k % 2 ? M.gold : M.red,
    };
  }),
  { kind: 'circle', cx: 396, cy: 392, r: 20, fill: 'none', stroke: M.ink, strokeWidth: 1 },
  { kind: 'circle', cx: 396, cy: 392, r: 4, fill: M.white, stroke: M.ink, strokeWidth: 1 },
  // A sword in a stone.
  { kind: 'circle', cx: 368, cy: 420, r: 6, fill: M.stone },
  { kind: 'line', x1: 368, y1: 420, x2: 368, y2: 410, stroke: M.ink, strokeWidth: 1.5 },
  { kind: 'line', x1: 364, y1: 412, x2: 372, y2: 412, stroke: M.gold, strokeWidth: 1.5 },
  // Teacups.
  { kind: 'circle', cx: 474, cy: 330, r: 22, fill: M.walk, stroke: M.edge, strokeWidth: 1 },
  ...[[466, 322, M.rose], [484, 324, M.blue], [472, 340, M.gold], [488, 340, M.lilac]].flatMap(([x, y, c]): Shape[] => [
    { kind: 'circle', cx: x as number, cy: y as number, r: 6, fill: c as Hex, stroke: M.ink, strokeWidth: 0.8 },
    { kind: 'circle', cx: x as number, cy: y as number, r: 2.5, fill: M.white },
  ]),
  // A little hedge maze and a wishing well.
  { kind: 'rect', x: 356, y: 312, w: 44, h: 40, rx: 4, fill: M.lawn, stroke: M.lawnDark, strokeWidth: 3 },
  { kind: 'rect', x: 364, y: 320, w: 28, h: 24, rx: 3, fill: 'none', stroke: M.lawnDark, strokeWidth: 3, dash: '14 5' },
  { kind: 'rect', x: 372, y: 327, w: 12, h: 10, rx: 2, fill: 'none', stroke: M.lawnDark, strokeWidth: 3, dash: '8 4' },
  sparkle(378, 332, 3, M.gold),
  { kind: 'circle', cx: 532, cy: 300, r: 9, fill: M.stone, stroke: M.woodDark, strokeWidth: 1 },
  { kind: 'circle', cx: 532, cy: 300, r: 5, fill: M.waterDeep },
  { kind: 'line', x1: 522, y1: 292, x2: 542, y2: 292, stroke: M.woodDark, strokeWidth: 2 },
  // Hedges and flowers.
  ...[[424, 300], [446, 380], [548, 336], [540, 384], [430, 424], [520, 424]].flatMap(([x, y]) => tree(x, y, 6)),
  { kind: 'path', d: 'M350 270 Q380 262 410 270', fill: 'none', stroke: M.lawnDark, strokeWidth: 6 },
  ...[356, 368, 380, 392, 404].map((x, i): Shape => ({ kind: 'circle', cx: x, cy: 268, r: 2, fill: i % 2 ? M.rose : M.gold })),
];

// A snowy peak between Fantasyland and Tomorrowland, with a bobsled run.
const peak: Shape[] = [
  { kind: 'polygon', points: '446,432 462,408 476,414 490,398 506,420 514,446 498,470 470,474 448,458', fill: '#8E8AA0', stroke: '#6E6A82', strokeWidth: 1.5 },
  { kind: 'polygon', points: '470,430 478,414 490,398 496,420 488,436 476,440', fill: M.snow },
  { kind: 'polygon', points: '462,408 470,418 466,426 456,422', fill: M.snow },
  { kind: 'path', d: 'M452 452 C470 470 500 466 508 444 C514 426 492 410 478 426', fill: 'none', stroke: M.steel, strokeWidth: 2, dash: '3 2' },
  ...[[454, 470], [512, 462]].flatMap(([x, y]) => tree(x, y, 5, M.treeDark)),
];

// Toontown: wobbly round rooftops, a fountain and a fire truck.
const toontown: Shape[] = [
  ...patch('M378 96 Q380 74 404 72 L540 76 Q566 80 566 104 L562 140 Q558 160 536 160 L404 160 Q378 158 378 134 Z', '#F4E3A1'),
  ...[[404, 100, 13, '#E86A5A'], [440, 94, 11, '#7FA6E8'], [542, 104, 13, '#8ACB7A'], [550, 140, 9, '#E86A5A'], [418, 138, 11, '#F2C14E'], [516, 142, 11, '#7FA6E8']].flatMap(
    ([x, y, r, c]): Shape[] => [
      { kind: 'circle', cx: x as number, cy: (y as number) + 2, r: r as number, fill: M.ink, opacity: 0.15 },
      { kind: 'circle', cx: x as number, cy: y as number, r: r as number, fill: c as Hex, stroke: M.ink, strokeWidth: 1.2 },
      { kind: 'path', d: `M${(x as number) - (r as number) * 0.6} ${y} Q${x} ${(y as number) - (r as number) * 0.6} ${(x as number) + (r as number) * 0.6} ${y}`, fill: 'none', stroke: M.white, strokeWidth: 1.2, opacity: 0.7 },
      { kind: 'path', d: `M${(x as number) + (r as number) * 0.4} ${(y as number) - (r as number) * 0.7} q3 -5 -1 -9 q-3 -4 2 -7`, fill: 'none', stroke: M.ink, strokeWidth: 1.2 },
    ],
  ),
  // Town fountain with musical buttons.
  { kind: 'circle', cx: 484, cy: 118, r: 14, fill: M.walk, stroke: M.edge, strokeWidth: 1 },
  { kind: 'circle', cx: 484, cy: 118, r: 8, fill: M.water },
  ...[0, 1, 2, 3, 4, 5].map((k): Shape => ({ kind: 'circle', cx: +(484 + 18 * Math.cos(k * 1.05)).toFixed(1), cy: +(118 + 18 * Math.sin(k * 1.05)).toFixed(1), r: 2.4, fill: M.gold, stroke: M.ink, strokeWidth: 0.6 })),
  // Little fire truck.
  { kind: 'rect', x: 452, y: 146, w: 20, h: 8, rx: 2, fill: M.red, stroke: M.ink, strokeWidth: 0.8 },
  { kind: 'line', x1: 454, y1: 148, x2: 466, y2: 148, stroke: M.gold, strokeWidth: 1.2 },
  // Stacked gag crates.
  ...[[512, 84], [522, 84], [517, 76]].map(([x, y]): Shape => ({ kind: 'rect', x, y, w: 9, h: 8, fill: '#C99A5A', stroke: M.woodDark, strokeWidth: 0.8 })),
  sparkle(530, 72, 4, M.gold),
];

// Tomorrowland: a ribbed white spire, a rocket, a lagoon, little freeways, elevated tracks and a monorail.
const tomorrow: Shape[] = [
  ...patch('M426 494 Q426 468 452 468 L638 470 Q662 472 662 500 L658 700 Q650 746 610 754 L470 762 Q430 760 428 730 Z', '#D7DFEC'),
  // Lagoon with a little yellow sub.
  { kind: 'path', d: 'M520 506 C540 488 600 488 612 508 C622 526 600 544 572 542 C540 540 506 528 520 506 Z', fill: M.water, stroke: M.edge, strokeWidth: 1 },
  { kind: 'path', d: 'M556 514 Q566 506 578 514 Q566 522 556 514 Z', fill: '#F2C14E', stroke: M.ink, strokeWidth: 0.8 },
  { kind: 'line', x1: 567, y1: 510, x2: 567, y2: 505, stroke: M.ink, strokeWidth: 1 },
  // Little freeway loops with tiny cars.
  { kind: 'path', d: 'M600 600 C640 570 676 600 660 640 C648 670 610 660 610 630 C610 610 640 606 650 620', fill: 'none', stroke: '#9AA3B6', strokeWidth: 6 },
  { kind: 'path', d: 'M600 600 C640 570 676 600 660 640 C648 670 610 660 610 630 C610 610 640 606 650 620', fill: 'none', stroke: M.walk, strokeWidth: 1, dash: '3 3' },
  { kind: 'rect', x: 636, y: 583, w: 7, h: 4, rx: 1.5, fill: M.red },
  { kind: 'rect', x: 618, y: 655, w: 7, h: 4, rx: 1.5, fill: M.blue },
  // Ribbed white spire, seen from above.
  { kind: 'circle', cx: 592, cy: 712, r: 38, fill: M.white, stroke: M.steel, strokeWidth: 2 },
  ...Array.from({ length: 12 }, (_, k): Shape => ({
    kind: 'line', x1: 592, y1: 712, x2: +(592 + 38 * Math.cos((k * Math.PI) / 6)).toFixed(1), y2: +(712 + 38 * Math.sin((k * Math.PI) / 6)).toFixed(1), stroke: M.steel, strokeWidth: 1.5,
  })),
  { kind: 'circle', cx: 592, cy: 712, r: 10, fill: M.steel },
  { kind: 'circle', cx: 592, cy: 712, r: 4, fill: M.white },
  // Rocket spinner base (the spinning arms are drawn by ParkMap).
  { kind: 'circle', cx: ROCKET_SPINNER.x, cy: ROCKET_SPINNER.y, r: 30, fill: M.walk, stroke: M.edge, strokeWidth: 1 },
  { kind: 'circle', cx: ROCKET_SPINNER.x, cy: ROCKET_SPINNER.y, r: 30, fill: 'none', stroke: M.gold, strokeWidth: 1, dash: '2 4' },
  // A tall rocket, seen standing up.
  { kind: 'path', d: 'M520 660 L512 676 L520 672 Z', fill: M.red },
  { kind: 'path', d: 'M534 660 L542 676 L534 672 Z', fill: M.red },
  { kind: 'path', d: 'M527 620 C534 630 535 652 533 672 L521 672 C519 652 520 630 527 620 Z', fill: M.white, stroke: M.ink, strokeWidth: 1 },
  { kind: 'path', d: 'M527 620 C530 624 532 628 533 632 L521 632 C522 628 524 624 527 620 Z', fill: M.red },
  { kind: 'circle', cx: 527, cy: 642, r: 3, fill: M.blue },
  // Empty elevated track, and the monorail beam heading off the map.
  { kind: 'path', d: 'M450 520 C470 640 520 600 560 600 C600 600 600 560 640 540 C670 524 660 480 620 486', fill: 'none', stroke: M.steel, strokeWidth: 3, dash: '8 4' },
  { kind: 'path', d: 'M440 760 C480 740 520 760 560 768 C620 778 660 760 700 730', fill: 'none', stroke: '#8F9AB0', strokeWidth: 4 },
  { kind: 'path', d: 'M520 762 Q536 754 556 766 L552 770 Q536 762 522 768 Z', fill: M.blue, stroke: M.ink, strokeWidth: 0.8 },
  ...[[452, 640], [460, 700], [640, 690], [446, 744]].flatMap(([x, y]) => tree(x, y, 6)),
];

export const parkMap: Shape[] = [
  ...frame,
  ...berm,
  ...walkways,
  ...river,
  ...bayou,
  ...frontier,
  ...newOrleans,
  ...adventureland,
  ...fantasy,
  ...toontown,
  ...tomorrow,
  ...peak,
  ...mainStreet,
];

// ---------------------------------------------------------------------------
// Lands: where to label them, how to zoom in, and stand-in stamp routes
// ---------------------------------------------------------------------------

export type ParkLand = {
  /** lands.id */
  id: string;
  /** Where the land's medallion and label sit on the whole-park map. */
  label: Pt;
  /** The part of the canvas shown when the land is chosen. */
  view: { x: number; y: number; w: number; h: number };
  /** Walking routes used for spots that aren't pinned yet (one per quest in the land). */
  lanes: Pt[][];
};

export const PARK_LANDS: ParkLand[] = [
  {
    id: 'dlp-main-street',
    label: { x: 360, y: 800 },
    view: { x: 280, y: 450, w: 160, h: 420 },
    lanes: [[{ x: 330, y: 790 }, { x: 330, y: 580 }], [{ x: 390, y: 790 }, { x: 390, y: 580 }]],
  },
  {
    id: 'dlp-adventureland',
    label: { x: 236, y: 690 },
    view: { x: 160, y: 520, w: 200, h: 220 },
    lanes: [
      [{ x: 196, y: 690 }, { x: 214, y: 632 }, { x: 262, y: 584 }, { x: 320, y: 560 }],
      [{ x: 250, y: 712 }, { x: 290, y: 668 }, { x: 322, y: 626 }, { x: 336, y: 590 }],
    ],
  },
  {
    id: 'dlp-new-orleans-square',
    label: { x: 150, y: 470 },
    view: { x: 56, y: 430, w: 210, h: 230 },
    lanes: [
      [{ x: 88, y: 576 }, { x: 122, y: 522 }, { x: 178, y: 494 }, { x: 232, y: 482 }],
      [{ x: 120, y: 600 }, { x: 168, y: 578 }, { x: 214, y: 546 }, { x: 246, y: 512 }],
    ],
  },
  {
    id: 'dlp-bayou-country',
    label: { x: 176, y: 178 },
    view: { x: 70, y: 140, w: 200, h: 180 },
    lanes: [
      [{ x: 104, y: 238 }, { x: 128, y: 200 }, { x: 170, y: 184 }, { x: 214, y: 190 }],
      [{ x: 126, y: 276 }, { x: 166, y: 258 }, { x: 204, y: 236 }, { x: 238, y: 222 }],
    ],
  },
  {
    id: 'dlp-frontierland',
    label: { x: 296, y: 380 },
    view: { x: 210, y: 240, w: 180, h: 280 },
    lanes: [
      [{ x: 300, y: 504 }, { x: 266, y: 452 }, { x: 266, y: 384 }, { x: 282, y: 330 }, { x: 290, y: 280 }],
      [{ x: 334, y: 490 }, { x: 336, y: 430 }, { x: 330, y: 376 }, { x: 330, y: 318 }, { x: 318, y: 272 }],
    ],
  },
  {
    id: 'dlp-fantasyland',
    label: { x: 452, y: 268 },
    view: { x: 330, y: 146, w: 250, h: 310 },
    lanes: [
      [{ x: 368, y: 432 }, { x: 408, y: 360 }, { x: 400, y: 300 }, { x: 440, y: 284 }, { x: 470, y: 296 }],
      [{ x: 540, y: 410 }, { x: 520, y: 350 }, { x: 516, y: 286 }, { x: 494, y: 236 }],
    ],
  },
  {
    id: 'dlp-toontown',
    label: { x: 474, y: 126 },
    view: { x: 370, y: 40, w: 240, h: 140 },
    lanes: [
      [{ x: 392, y: 120 }, { x: 430, y: 116 }, { x: 466, y: 96 }, { x: 500, y: 92 }],
      [{ x: 460, y: 144 }, { x: 500, y: 146 }, { x: 540, y: 124 }, { x: 576, y: 112 }],
    ],
  },
  {
    id: 'dlp-tomorrowland',
    label: { x: 600, y: 470 },
    view: { x: 420, y: 460, w: 270, h: 330 },
    lanes: [
      [{ x: 444, y: 520 }, { x: 476, y: 630 }, { x: 520, y: 694 }, { x: 556, y: 746 }, { x: 610, y: 764 }],
      [{ x: 520, y: 560 }, { x: 572, y: 566 }, { x: 628, y: 556 }, { x: 650, y: 660 }, { x: 650, y: 740 }],
    ],
  },
];

/** Text labels drawn over the whole-park map (canvas coordinates). */
export const parkMapLabels = [
  { text: 'The Park Atlas', x: 126, y: 822, size: 12, style: 'title' },
  { text: 'N', x: 662, y: 802, size: 10, style: 'plain' },
] as const;
