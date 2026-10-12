/**
 * Original illustrated map of the street (360 × 640): Town Square and the
 * entrance at the bottom, the street with shops on both sides and a cross
 * street, and a round central plaza at the top. Generic small-town layout —
 * no castle, no copied map art. Labels are drawn as text on top in the app.
 */
import type { Shape } from '@/art/shapes';

const M = {
  paper: '#F3E9D2',
  edge: '#C9A86A',
  walk: '#EDE3CC',
  brick: '#D4AE8C',
  rail: '#A9846A',
  lawn: '#B7CD9E',
  tree: '#86AE77',
  treeDark: '#6E9A63',
  roof: '#7D6A86',
  shops: ['#E3B9A9', '#E9D39A', '#B9D3C5', '#CDBEDF', '#B9C8E4', '#E6B8C6'],
} as const;

function tree(cx: number, cy: number, r = 7): Shape[] {
  return [
    { kind: 'circle', cx, cy, r, fill: M.tree },
    { kind: 'circle', cx: cx - r * 0.3, cy: cy - r * 0.3, r: r * 0.45, fill: M.treeDark, opacity: 0.35 },
  ];
}

/** A row of shopfronts seen from above: colored roofs with a front edge. */
function shopRow(x: number, w: number, y0: number, y1: number, facingRight: boolean): Shape[] {
  const shapes: Shape[] = [];
  const heights = [34, 28, 40, 30, 36, 26, 32];
  let y = y0;
  let i = 0;
  while (y < y1 - 12) {
    const h = Math.min(heights[i % heights.length], y1 - y);
    const fill = M.shops[i % M.shops.length] as `#${string}`;
    shapes.push({ kind: 'rect', x, y: y + 1, w, h: h - 2, rx: 2, fill, stroke: M.edge, strokeWidth: 1 });
    // Awning strip on the street side
    shapes.push({ kind: 'rect', x: facingRight ? x + w - 5 : x, y: y + 4, w: 5, h: h - 8, fill: M.roof, opacity: 0.45 });
    y += h;
    i++;
  }
  return shapes;
}

export const streetMap: Shape[] = [
  // Paper and border
  { kind: 'rect', x: 0, y: 0, w: 360, h: 640, fill: M.paper },
  { kind: 'rect', x: 8, y: 8, w: 344, h: 624, rx: 10, fill: 'none', stroke: M.edge, strokeWidth: 3 },
  { kind: 'rect', x: 14, y: 14, w: 332, h: 612, rx: 7, fill: 'none', stroke: M.edge, strokeWidth: 1, dash: '4 4' },

  // Central plaza (top): round lawn with paths
  { kind: 'circle', cx: 180, cy: 92, r: 60, fill: M.walk, stroke: M.edge, strokeWidth: 1.5 },
  { kind: 'circle', cx: 180, cy: 92, r: 44, fill: M.lawn },
  ...[30, 150, 210, 330].map((deg): Shape => {
    const a = (deg * Math.PI) / 180;
    return { kind: 'line', x1: 180, y1: 92, x2: 180 + Math.cos(a) * 60, y2: 92 + Math.sin(a) * 60, stroke: M.walk, strokeWidth: 8 };
  }),
  { kind: 'line', x1: 180, y1: 92, x2: 180, y2: 152, stroke: M.walk, strokeWidth: 30 },
  { kind: 'circle', cx: 180, cy: 92, r: 12, fill: M.walk, stroke: M.edge, strokeWidth: 1 },
  ...tree(150, 72), ...tree(210, 72), ...tree(148, 114), ...tree(212, 114),

  // Sidewalks and street
  { kind: 'rect', x: 136, y: 150, w: 88, h: 372, fill: M.walk },
  { kind: 'rect', x: 150, y: 150, w: 60, h: 372, fill: M.brick },
  { kind: 'line', x1: 173, y1: 150, x2: 173, y2: 522, stroke: M.rail, strokeWidth: 1.5 },
  { kind: 'line', x1: 187, y1: 150, x2: 187, y2: 522, stroke: M.rail, strokeWidth: 1.5 },
  ...Array.from({ length: 6 }, (_, i): Shape => ({ kind: 'rect', x: 152 + i * 10, y: 156, w: 5, h: 10, fill: M.walk })),
  ...Array.from({ length: 6 }, (_, i): Shape => ({ kind: 'rect', x: 152 + i * 10, y: 506, w: 5, h: 10, fill: M.walk })),

  // Cross street
  { kind: 'rect', x: 30, y: 318, w: 300, h: 30, fill: M.brick },
  { kind: 'rect', x: 30, y: 314, w: 106, h: 4, fill: M.walk },
  { kind: 'rect', x: 224, y: 314, w: 106, h: 4, fill: M.walk },
  { kind: 'rect', x: 30, y: 348, w: 106, h: 4, fill: M.walk },
  { kind: 'rect', x: 224, y: 348, w: 106, h: 4, fill: M.walk },

  // Shops on both sides (with the cross street between blocks)
  ...shopRow(64, 72, 152, 314, true),
  ...shopRow(64, 72, 352, 522, true),
  ...shopRow(224, 72, 152, 314, false),
  ...shopRow(224, 72, 352, 522, false),
  // Back lots and trees
  ...tree(42, 200, 9), ...tree(318, 240, 9), ...tree(44, 420, 9), ...tree(316, 460, 9),

  // Town Square (bottom) with a lawn and flagpole
  { kind: 'rect', x: 64, y: 522, w: 232, h: 78, rx: 12, fill: M.walk, stroke: M.edge, strokeWidth: 1.5 },
  { kind: 'rect', x: 104, y: 536, w: 152, h: 50, rx: 18, fill: M.lawn },
  { kind: 'line', x1: 180, y1: 548, x2: 180, y2: 578, stroke: '#5C5C66', strokeWidth: 2 },
  { kind: 'polygon', points: '181,548 196,553 181,558', fill: '#C8475A' },
  ...tree(118, 548), ...tree(242, 548), ...tree(118, 576), ...tree(242, 576),

  // Entrance path to the bottom edge
  { kind: 'rect', x: 160, y: 600, w: 40, h: 26, fill: M.walk },

  // Compass rose (top right)
  { kind: 'circle', cx: 314, cy: 50, r: 18, fill: 'none', stroke: M.edge, strokeWidth: 1.5 },
  { kind: 'polygon', points: '314,30 318,46 314,50 310,46', fill: '#1B2340' },
  { kind: 'polygon', points: '314,70 318,54 314,50 310,54', fill: M.edge },
  { kind: 'polygon', points: '294,50 310,46 314,50 310,54', fill: M.edge },
  { kind: 'polygon', points: '334,50 318,46 314,50 318,54', fill: M.edge },
];

/** Text labels drawn over the map (canvas coordinates). */
export const streetMapLabels = [
  { text: 'Central Plaza', x: 180, y: 22, size: 11 },
  { text: 'Town Square', x: 180, y: 612, size: 11 },
  { text: 'N', x: 314, y: 18, size: 10 },
] as const;
