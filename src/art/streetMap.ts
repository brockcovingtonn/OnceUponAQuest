/**
 * Original illustrated map of the street (360 × 640), drawn like a page from a
 * storybook atlas: Town Square with a bandstand at the bottom, the street with
 * shops, lamps and streetcar rails, a cross street, and a round central plaza
 * with a fountain at the top. Generic small-town layout — no castle, no copied
 * map art, no three-circle shapes. Text labels and the moving pieces
 * (streetcar, balloon, sparkles) are added on top by StoryMap.
 */
import type { Shape } from '@/art/shapes';

type Hex = `#${string}`;

const M = {
  paper: '#F3E9D2',
  aged: '#E6D5B0',
  edge: '#C9A86A',
  ink: '#1B2340',
  walk: '#EDE3CC',
  brick: '#D4AE8C',
  cobble: '#C29A78',
  rail: '#A9846A',
  lawn: '#B7CD9E',
  lawnDark: '#9FBE86',
  tree: '#86AE77',
  treeDark: '#6E9A63',
  water: '#9CC6D9',
  waterLight: '#D6ECF4',
  gold: '#E2B04A',
  glow: '#F6D58E',
  rose: '#D9677A',
  red: '#C8475A',
  white: '#FFFDF7',
  lilac: '#B79AD3',
  roof: '#7D6A86',
  smoke: '#B9AFA2',
  shops: ['#E3B9A9', '#E9D39A', '#B9D3C5', '#CDBEDF', '#B9C8E4', '#E6B8C6'] as Hex[],
} as const;

function tree(cx: number, cy: number, r = 7): Shape[] {
  return [
    { kind: 'circle', cx: cx + 1.5, cy: cy + 2, r, fill: M.treeDark, opacity: 0.35 },
    { kind: 'circle', cx, cy, r, fill: M.tree },
    { kind: 'circle', cx: cx - r * 0.3, cy: cy - r * 0.3, r: r * 0.42, fill: M.lawn, opacity: 0.55 },
  ];
}

/** A row of tiny flowers. */
function flowers(x: number, y: number, count: number, gap = 6, horizontal = true): Shape[] {
  const colors: Hex[] = [M.rose, M.gold, M.white, M.lilac];
  return Array.from({ length: count }, (_, i): Shape => ({
    kind: 'circle',
    cx: horizontal ? x + i * gap : x,
    cy: horizontal ? y : y + i * gap,
    r: 1.8,
    fill: colors[i % colors.length],
  }));
}

/** A little gas lamp seen from above: a warm glow with a dark cap. */
function lamp(cx: number, cy: number): Shape[] {
  return [
    { kind: 'circle', cx, cy, r: 6, fill: M.glow, opacity: 0.45 },
    { kind: 'circle', cx, cy, r: 2.2, fill: M.ink },
  ];
}

function sparkle(cx: number, cy: number, r: number, fill: Hex = M.gold): Shape {
  const s = r * 0.28;
  return {
    kind: 'polygon',
    points: `${cx},${cy - r} ${cx + s},${cy - s} ${cx + r},${cy} ${cx + s},${cy + s} ${cx},${cy + r} ${cx - s},${cy + s} ${cx - r},${cy} ${cx - s},${cy - s}`,
    fill,
  };
}

/** A puffy cloud drawn as one path (no clustered circles). */
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

/** Corner flourish for the border. */
function curl(x: number, y: number, sx: 1 | -1, sy: 1 | -1): Shape {
  return {
    kind: 'path',
    d: `M${x} ${y + 26 * sy} Q${x} ${y} ${x + 26 * sx} ${y} M${x + 8 * sx} ${y + 16 * sy} Q${x + 8 * sx} ${y + 8 * sy} ${x + 16 * sx} ${y + 8 * sy}`,
    fill: 'none',
    stroke: M.edge,
    strokeWidth: 2,
  };
}

/** A row of shopfronts seen from above: roofs, lit windows, chimneys, a hanging sign and a striped awning. */
function shopRow(x: number, w: number, y0: number, y1: number, facingRight: boolean, seed: number): Shape[] {
  const shapes: Shape[] = [];
  const heights = [34, 28, 40, 30, 36, 26, 32];
  let y = y0;
  let i = seed;
  while (y < y1 - 12) {
    const h = Math.min(heights[i % heights.length], y1 - y);
    const fill = M.shops[i % M.shops.length];
    shapes.push({ kind: 'rect', x, y: y + 1, w, h: h - 2, rx: 2, fill, stroke: M.edge, strokeWidth: 1 });
    // Roof ridge
    shapes.push({ kind: 'line', x1: x + 6, y1: y + h / 2, x2: x + w - 12, y2: y + h / 2, stroke: M.roof, strokeWidth: 1, opacity: 0.35 });
    // Lit skylights
    for (let k = 0; k < 2; k++) {
      shapes.push({ kind: 'rect', x: x + 12 + k * 16, y: y + h / 2 - 7, w: 6, h: 4, rx: 1, fill: M.glow });
    }
    // Chimney with a curl of smoke on every other shop
    if (i % 2 === 0) {
      const cx = facingRight ? x + 6 : x + w - 12;
      shapes.push({ kind: 'rect', x: cx, y: y + 4, w: 6, h: 6, fill: M.roof });
      shapes.push({
        kind: 'path',
        d: `M${cx + 3} ${y + 4} q-4 -5 0 -9 q4 -4 0 -9`,
        fill: 'none',
        stroke: M.smoke,
        strokeWidth: 1.4,
        opacity: 0.8,
      });
    }
    // Striped awning on the street side
    const ax = facingRight ? x + w - 6 : x;
    for (let s = 0; s < Math.floor((h - 8) / 4); s++) {
      shapes.push({ kind: 'rect', x: ax, y: y + 4 + s * 4, w: 6, h: 4, fill: s % 2 === 0 ? M.red : M.white, opacity: 0.85 });
    }
    // Hanging sign over the sidewalk
    const sx = facingRight ? x + w + 1 : x - 7;
    shapes.push({ kind: 'rect', x: sx, y: y + h / 2 - 4, w: 6, h: 8, rx: 1.5, fill: M.ink });
    shapes.push({ kind: 'circle', cx: sx + 3, cy: y + h / 2, r: 1.3, fill: M.gold });
    y += h;
    i++;
  }
  return shapes;
}

/** Octagonal bandstand seen from above, with a striped roof. */
function bandstand(cx: number, cy: number, r: number): Shape[] {
  const pts = (rad: number) =>
    Array.from({ length: 8 }, (_, k) => {
      const a = (Math.PI / 8) * (2 * k + 1);
      return `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
  const shapes: Shape[] = [
    { kind: 'polygon', points: pts(r + 3), fill: M.walk, stroke: M.edge, strokeWidth: 1 },
    { kind: 'polygon', points: pts(r), fill: M.white, stroke: M.red, strokeWidth: 1.5 },
  ];
  for (let k = 0; k < 8; k += 2) {
    const a1 = (Math.PI / 8) * (2 * k + 1);
    const a2 = (Math.PI / 8) * (2 * k + 3);
    shapes.push({
      kind: 'polygon',
      points: `${cx},${cy} ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} ${cx + r * Math.cos(a2)},${cy + r * Math.sin(a2)}`,
      fill: M.red,
      opacity: 0.8,
    });
  }
  shapes.push(sparkle(cx, cy, 4));
  return shapes;
}

export const streetMap: Shape[] = [
  // Paper, aged corners and border
  { kind: 'rect', x: 0, y: 0, w: 360, h: 640, fill: M.paper },
  { kind: 'circle', cx: 0, cy: 0, r: 70, fill: M.aged, opacity: 0.5 },
  { kind: 'circle', cx: 360, cy: 640, r: 80, fill: M.aged, opacity: 0.5 },
  { kind: 'circle', cx: 360, cy: 0, r: 40, fill: M.aged, opacity: 0.35 },
  { kind: 'circle', cx: 0, cy: 640, r: 45, fill: M.aged, opacity: 0.35 },
  { kind: 'rect', x: 8, y: 8, w: 344, h: 624, rx: 10, fill: 'none', stroke: M.edge, strokeWidth: 3 },
  { kind: 'rect', x: 14, y: 14, w: 332, h: 612, rx: 7, fill: 'none', stroke: M.edge, strokeWidth: 1, dash: '4 4' },
  curl(20, 20, 1, 1), curl(340, 20, -1, 1), curl(20, 620, 1, -1), curl(340, 620, -1, -1),

  // Sky details in the margins
  cloud(232, 30, 46), cloud(26, 132, 34), cloud(296, 600, 40),
  bird(270, 120), bird(282, 112), bird(58, 584),
  sparkle(118, 40, 4), sparkle(250, 168, 3, M.white), sparkle(46, 470, 3.5), sparkle(324, 400, 3), sparkle(334, 160, 4),

  // Title ribbon (text drawn on top)
  { kind: 'polygon', points: '22,34 32,30 32,52 22,48 27,41', fill: M.red },
  { kind: 'polygon', points: '142,34 132,30 132,52 142,48 137,41', fill: M.red },
  { kind: 'rect', x: 30, y: 26, w: 104, h: 30, rx: 4, fill: M.white, stroke: M.edge, strokeWidth: 1.5 },

  // Central plaza: lawn, flower ring, paths and a fountain
  { kind: 'circle', cx: 180, cy: 92, r: 60, fill: M.walk, stroke: M.edge, strokeWidth: 1.5 },
  { kind: 'circle', cx: 180, cy: 92, r: 44, fill: M.lawn },
  { kind: 'circle', cx: 180, cy: 92, r: 38, fill: 'none', stroke: M.lawnDark, strokeWidth: 1, dash: '2 3' },
  ...Array.from({ length: 24 }, (_, k): Shape => {
    const a = (k / 24) * Math.PI * 2;
    const colors: Hex[] = [M.rose, M.gold, M.white, M.lilac];
    return { kind: 'circle', cx: 180 + Math.cos(a) * 41, cy: 92 + Math.sin(a) * 41, r: 1.8, fill: colors[k % 4] };
  }),
  ...[30, 150, 210, 330].map((deg): Shape => {
    const a = (deg * Math.PI) / 180;
    return { kind: 'line', x1: 180, y1: 92, x2: 180 + Math.cos(a) * 60, y2: 92 + Math.sin(a) * 60, stroke: M.walk, strokeWidth: 8 };
  }),
  { kind: 'line', x1: 180, y1: 92, x2: 180, y2: 152, stroke: M.walk, strokeWidth: 30 },
  { kind: 'circle', cx: 180, cy: 92, r: 15, fill: M.walk, stroke: M.edge, strokeWidth: 1.5 },
  { kind: 'circle', cx: 180, cy: 92, r: 11, fill: M.water },
  { kind: 'circle', cx: 180, cy: 92, r: 7, fill: 'none', stroke: M.waterLight, strokeWidth: 1.5 },
  { kind: 'circle', cx: 180, cy: 92, r: 2.5, fill: M.white },
  ...tree(146, 70), ...tree(214, 70), ...tree(144, 116), ...tree(216, 116),
  ...lamp(126, 92), ...lamp(234, 92),

  // Sidewalks, street, cobbles and rails
  { kind: 'rect', x: 136, y: 150, w: 88, h: 372, fill: M.walk },
  { kind: 'rect', x: 150, y: 150, w: 60, h: 372, fill: M.brick },
  ...Array.from({ length: 46 }, (_, k): Shape => ({
    kind: 'rect',
    x: 154 + ((k * 13) % 50),
    y: 170 + ((k * 29) % 330),
    w: 4,
    h: 3,
    rx: 1,
    fill: M.cobble,
    opacity: 0.55,
  })),
  { kind: 'line', x1: 173, y1: 150, x2: 173, y2: 522, stroke: M.rail, strokeWidth: 1.5 },
  { kind: 'line', x1: 187, y1: 150, x2: 187, y2: 522, stroke: M.rail, strokeWidth: 1.5 },
  ...Array.from({ length: 37 }, (_, k): Shape => ({ kind: 'line', x1: 171, y1: 154 + k * 10, x2: 189, y2: 154 + k * 10, stroke: M.rail, strokeWidth: 1, opacity: 0.35 })),
  ...Array.from({ length: 6 }, (_, k): Shape => ({ kind: 'rect', x: 152 + k * 10, y: 156, w: 5, h: 10, fill: M.walk })),
  ...Array.from({ length: 6 }, (_, k): Shape => ({ kind: 'rect', x: 152 + k * 10, y: 506, w: 5, h: 10, fill: M.walk })),
  ...[180, 240, 290, 380, 440, 490].flatMap((y) => [...lamp(147, y), ...lamp(213, y)]),

  // Cross street
  { kind: 'rect', x: 30, y: 318, w: 300, h: 30, fill: M.brick },
  ...Array.from({ length: 22 }, (_, k): Shape => ({ kind: 'rect', x: 36 + ((k * 37) % 290), y: 324 + ((k * 7) % 18), w: 4, h: 3, rx: 1, fill: M.cobble, opacity: 0.55 })),
  { kind: 'rect', x: 30, y: 314, w: 106, h: 4, fill: M.walk },
  { kind: 'rect', x: 224, y: 314, w: 106, h: 4, fill: M.walk },
  { kind: 'rect', x: 30, y: 348, w: 106, h: 4, fill: M.walk },
  { kind: 'rect', x: 224, y: 348, w: 106, h: 4, fill: M.walk },

  // Shops on both sides
  ...shopRow(64, 72, 152, 314, true, 0),
  ...shopRow(64, 72, 352, 522, true, 3),
  ...shopRow(224, 72, 152, 314, false, 1),
  ...shopRow(224, 72, 352, 522, false, 4),

  // Back lots: hedges, flower beds and trees of different sizes
  { kind: 'rect', x: 22, y: 170, w: 34, h: 6, rx: 3, fill: M.lawnDark },
  { kind: 'rect', x: 304, y: 280, w: 34, h: 6, rx: 3, fill: M.lawnDark },
  { kind: 'rect', x: 22, y: 380, w: 34, h: 6, rx: 3, fill: M.lawnDark },
  { kind: 'rect', x: 304, y: 500, w: 34, h: 6, rx: 3, fill: M.lawnDark },
  ...flowers(26, 188, 5), ...flowers(308, 296, 5), ...flowers(26, 398, 5), ...flowers(308, 516, 5),
  ...tree(42, 220, 10), ...tree(30, 268, 6), ...tree(320, 220, 7), ...tree(318, 250, 10),
  ...tree(44, 432, 9), ...tree(28, 492, 7), ...tree(316, 440, 11), ...tree(330, 380, 6),

  // Town Square: lawn, bandstand, flower beds, benches, flag, trees
  { kind: 'rect', x: 64, y: 522, w: 232, h: 78, rx: 12, fill: M.walk, stroke: M.edge, strokeWidth: 1.5 },
  { kind: 'rect', x: 104, y: 536, w: 152, h: 50, rx: 18, fill: M.lawn },
  ...flowers(112, 540, 23, 6), ...flowers(112, 582, 23, 6),
  ...bandstand(152, 561, 13),
  { kind: 'line', x1: 214, y1: 548, x2: 214, y2: 576, stroke: '#5C5C66', strokeWidth: 2 },
  { kind: 'polygon', points: '215,548 230,553 215,558', fill: M.red },
  { kind: 'rect', x: 78, y: 556, w: 12, h: 4, rx: 1, fill: M.roof },
  { kind: 'rect', x: 270, y: 556, w: 12, h: 4, rx: 1, fill: M.roof },
  ...tree(84, 534), ...tree(276, 534), ...tree(84, 588), ...tree(276, 588),
  ...lamp(100, 600), ...lamp(260, 600),

  // Entrance path with a welcome arch of bulbs
  { kind: 'rect', x: 160, y: 600, w: 40, h: 26, fill: M.walk },
  ...Array.from({ length: 7 }, (_, k): Shape => ({ kind: 'circle', cx: 160 + k * (40 / 6), cy: 604 - Math.sin((k / 6) * Math.PI) * 6, r: 1.6, fill: M.gold })),

  // Compass rose (top right)
  { kind: 'circle', cx: 314, cy: 56, r: 20, fill: M.white, stroke: M.edge, strokeWidth: 1.5 },
  { kind: 'circle', cx: 314, cy: 56, r: 15, fill: 'none', stroke: M.edge, strokeWidth: 0.8, dash: '1.5 2.5' },
  { kind: 'polygon', points: '314,34 318,52 314,56 310,52', fill: M.ink },
  { kind: 'polygon', points: '314,78 318,60 314,56 310,60', fill: M.edge },
  { kind: 'polygon', points: '292,56 310,52 314,56 310,60', fill: M.edge },
  { kind: 'polygon', points: '336,56 318,52 314,56 318,60', fill: M.edge },
  sparkle(314, 56, 3, M.gold),
];

/** Text labels drawn over the map (canvas coordinates). */
export const streetMapLabels = [
  { text: 'Main Street, U.S.A.', x: 82, y: 41, size: 10, style: 'title' },
  { text: 'Central Plaza', x: 180, y: 166, size: 10, style: 'place' },
  { text: 'Town Square', x: 180, y: 612, size: 10, style: 'place' },
  { text: 'N', x: 314, y: 22, size: 9, style: 'plain' },
] as const;

/** The streetcar runs on the rails between these points (canvas y). */
export const STREETCAR_TRACK = { x: 180, top: 176, bottom: 496 } as const;

/** Where the hot-air balloon floats (canvas coordinates). */
export const BALLOON_SPOT = { x: 34, y: 76 } as const;

/** Stand-in spots for Main Street's Storybook Lens landmarks without a pin, in landmark order. */
export const STREET_STORY_SPOTS = [
  { x: 180, y: 622 },
  { x: 180, y: 548 },
  { x: 304, y: 330 },
  { x: 62, y: 520 },
  { x: 180, y: 300 },
] as const;

