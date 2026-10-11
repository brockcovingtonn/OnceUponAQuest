/**
 * Original storybook scenes (400 × 240 canvas): a Victorian main street at
 * night, plus one vignette per quest used as quest covers and placeholder
 * hint photos until the founder's own photos arrive.
 *
 * Hard rule: no castles, characters or three-circle shapes — the street ends
 * in open sky on purpose.
 */
import type { Shape } from '@/art/shapes';

export const SCENE = { width: 400, height: 240 } as const;

const C = {
  sky: '#1B2340',
  skyLow: '#26305A',
  gold: '#E2B04A',
  goldSoft: '#F3D58A',
  parchment: '#FAF5EA',
  rose: '#D9677A',
  fern: '#4F9D7A',
  dark: '#141A31',
  windowDark: '#2E3966',
  bricks: ['#3A4677', '#4A3F6B', '#35506E', '#5A4566', '#3F5A73'],
  trim: '#7E8BC0',
  sidewalk: '#2A3358',
  curb: '#3B4778',
} as const;

const GROUND = 200;

function sparkle(cx: number, cy: number, r: number, fill: `#${string}`, opacity = 1): Shape {
  const s = r * 0.28;
  return {
    kind: 'polygon',
    points: `${cx},${cy - r} ${cx + s},${cy - s} ${cx + r},${cy} ${cx + s},${cy + s} ${cx},${cy + r} ${cx - s},${cy + s} ${cx - r},${cy} ${cx - s},${cy - s}`,
    fill,
    opacity,
  };
}

function sky(): Shape[] {
  const dots: [number, number][] = [
    [22, 30], [64, 18], [108, 44], [150, 14], [196, 36], [238, 20], [282, 46], [362, 24], [386, 60], [40, 70], [128, 76],
  ];
  return [
    { kind: 'rect', x: 0, y: 0, w: 400, h: 240, fill: C.sky },
    { kind: 'rect', x: 0, y: 110, w: 400, h: 130, fill: C.skyLow, opacity: 0.6 },
    ...dots.map(([x, y]): Shape => ({ kind: 'circle', cx: x, cy: y, r: 1.4, fill: C.parchment, opacity: 0.8 })),
    sparkle(86, 30, 6, C.goldSoft),
    sparkle(214, 58, 4, C.parchment, 0.9),
    sparkle(312, 30, 5, C.goldSoft),
    sparkle(172, 34, 3, C.parchment, 0.8),
  ];
}

function moon(cx: number, cy: number, r: number): Shape[] {
  return [
    { kind: 'circle', cx, cy, r: r + 8, fill: C.goldSoft, opacity: 0.12 },
    { kind: 'circle', cx, cy, r, fill: C.goldSoft },
    { kind: 'circle', cx: cx + r * 0.45, cy: cy - r * 0.2, r: r * 0.85, fill: C.sky },
  ];
}

type Roof = 'flat' | 'gable' | 'mansard';

/** A Victorian shopfront: body, roof, cornice, lit upper windows, shop window and door. */
function building(x: number, w: number, h: number, color: string, roof: Roof, lit: boolean[]): Shape[] {
  const top = GROUND - h;
  const shapes: Shape[] = [{ kind: 'rect', x, y: top, w, h, fill: color as `#${string}` }];
  if (roof === 'gable') {
    const peak = Math.min(w * 0.38, 30);
    shapes.push({ kind: 'polygon', points: `${x - 3},${top} ${x + w / 2},${top - peak} ${x + w + 3},${top}`, fill: color as `#${string}` });
    shapes.push({ kind: 'circle', cx: x + w / 2, cy: top - peak * 0.38, r: Math.min(w * 0.07, 5), fill: C.gold, opacity: 0.9 });
  } else if (roof === 'mansard') {
    shapes.push({ kind: 'polygon', points: `${x},${top} ${x + 6},${top - 16} ${x + w - 6},${top - 16} ${x + w},${top}`, fill: C.dark });
    shapes.push({ kind: 'rect', x: x + w / 2 - 5, y: top - 13, w: 10, h: 10, fill: lit[0] ? C.gold : C.windowDark });
  }
  // Cornice
  shapes.push({ kind: 'rect', x: x - 3, y: top - 3, w: w + 6, h: 6, fill: C.trim });
  // Upper windows: two rows of arched-top windows
  const cols = Math.max(2, Math.floor(w / 22));
  const gap = w / cols;
  let i = 0;
  for (let row = 0; row < 2; row++) {
    const wy = top + 12 + row * 28;
    if (wy + 20 > GROUND - 50) break;
    for (let col = 0; col < cols; col++) {
      const wx = x + col * gap + gap / 2 - 6;
      const on = lit[i++ % lit.length];
      shapes.push({ kind: 'rect', x: wx, y: wy, w: 12, h: 18, rx: 6, fill: on ? C.gold : C.windowDark });
    }
  }
  // Shop window and door at street level
  shapes.push({ kind: 'rect', x: x + 6, y: GROUND - 34, w: w * 0.55, h: 24, fill: C.goldSoft, opacity: 0.85 });
  shapes.push({ kind: 'rect', x: x + w * 0.68, y: GROUND - 34, w: w * 0.22, h: 34, rx: 2, fill: C.dark });
  return shapes;
}

/** Striped awning across a shopfront. */
function awning(x: number, w: number, y: number, stripe: string): Shape[] {
  const stripes = Math.max(4, Math.round(w / 9));
  const sw = w / stripes;
  const shapes: Shape[] = [];
  for (let s = 0; s < stripes; s++) {
    shapes.push({
      kind: 'polygon',
      points: `${x + s * sw},${y} ${x + (s + 1) * sw},${y} ${x + (s + 1) * sw + 2},${y + 12} ${x + s * sw + 2},${y + 12}`,
      fill: (s % 2 === 0 ? stripe : C.parchment) as `#${string}`,
    });
  }
  return shapes;
}

/** Gas lamp with a soft glow. */
function lamp(x: number): Shape[] {
  return [
    { kind: 'circle', cx: x, cy: GROUND - 58, r: 11, fill: C.gold, opacity: 0.22 },
    { kind: 'rect', x: x - 1.5, y: GROUND - 52, w: 3, h: 52, fill: C.dark },
    { kind: 'rect', x: x - 5, y: GROUND - 4, w: 10, h: 4, fill: C.dark },
    { kind: 'polygon', points: `${x - 6},${GROUND - 64} ${x + 6},${GROUND - 64} ${x + 4},${GROUND - 52} ${x - 4},${GROUND - 52}`, fill: C.gold },
    { kind: 'polygon', points: `${x - 7},${GROUND - 64} ${x + 7},${GROUND - 64} ${x},${GROUND - 71}`, fill: C.dark },
  ];
}

function street(): Shape[] {
  return [
    { kind: 'rect', x: 0, y: GROUND, w: 400, h: 40, fill: C.sidewalk },
    { kind: 'rect', x: 0, y: GROUND, w: 400, h: 3, fill: C.curb },
    ...[30, 110, 190, 270, 350].map((x): Shape => ({ kind: 'rect', x, y: GROUND + 20, w: 40, h: 2, rx: 1, fill: C.curb })),
  ];
}

/** The full street at night: used behind sign-in, the intro and the Quests header. */
export const mainStreetNight: Shape[] = [
  ...sky(),
  ...moon(346, 44, 16),
  ...building(-4, 62, 118, C.bricks[0], 'gable', [true, false, true, true]),
  ...building(62, 72, 138, C.bricks[1], 'mansard', [true, true, false, true, true, false]),
  ...building(138, 56, 104, C.bricks[2], 'flat', [false, true, true, false]),
  ...building(198, 80, 146, C.bricks[3], 'gable', [true, false, true, true, false, true]),
  ...building(282, 60, 112, C.bricks[4], 'mansard', [true, true, false, true]),
  ...building(346, 58, 126, C.bricks[0], 'flat', [false, true, true, true]),
  ...awning(66, 64, GROUND - 46, C.rose),
  ...awning(202, 72, GROUND - 46, C.fern),
  ...awning(350, 50, GROUND - 46, C.rose),
  ...street(),
  ...lamp(56),
  ...lamp(196),
  ...lamp(340),
];

// ---------------------------------------------------------------------------
// Quest vignettes (covers + placeholder hint photos)
// ---------------------------------------------------------------------------

function nightBackdrop(): Shape[] {
  return [...sky(), ...moon(352, 40, 13)];
}

/** Windows of Legends: a tall facade with names painted on glowing upper windows. */
const windowsVignette: Shape[] = [
  ...nightBackdrop(),
  { kind: 'rect', x: 70, y: 40, w: 260, h: 160, fill: C.bricks[1] },
  { kind: 'rect', x: 64, y: 34, w: 272, h: 8, fill: C.trim },
  ...[0, 1, 2].flatMap((col): Shape[] => {
    const x = 92 + col * 80;
    return [
      { kind: 'path', d: `M${x} 130 L${x} 74 C${x} 60 ${x + 10} 54 ${x + 28} 54 C${x + 46} 54 ${x + 56} 60 ${x + 56} 74 L${x + 56} 130 Z`, fill: C.gold },
      { kind: 'line', x1: x + 28, y1: 54, x2: x + 28, y2: 130, stroke: C.bricks[1], strokeWidth: 3 },
      { kind: 'line', x1: x, y1: 92, x2: x + 56, y2: 92, stroke: C.bricks[1], strokeWidth: 3 },
      { kind: 'rect', x: x + 6, y: 102, w: 18, h: 3, rx: 1.5, fill: C.sky },
      { kind: 'rect', x: x + 32, y: 102, w: 16, h: 3, rx: 1.5, fill: C.sky },
      { kind: 'rect', x: x + 6, y: 110, w: 14, h: 3, rx: 1.5, fill: C.sky },
      { kind: 'rect', x: x + 32, y: 110, w: 18, h: 3, rx: 1.5, fill: C.sky },
      { kind: 'rect', x: x - 4, y: 130, w: 64, h: 5, fill: C.trim },
    ];
  }),
  ...awning(84, 232, 150, C.rose),
  { kind: 'rect', x: 92, y: 166, w: 140, h: 34, fill: C.goldSoft, opacity: 0.85 },
  { kind: 'rect', x: 252, y: 162, w: 52, h: 38, rx: 2, fill: C.dark },
  ...street(),
  ...lamp(40),
  ...lamp(362),
];

/** Walt Was Here: one upstairs window with a lamp left burning. */
const lampVignette: Shape[] = [
  ...nightBackdrop(),
  { kind: 'rect', x: 40, y: 50, w: 320, h: 150, fill: C.bricks[2] },
  { kind: 'rect', x: 34, y: 44, w: 332, h: 8, fill: C.trim },
  { kind: 'rect', x: 76, y: 74, w: 40, h: 56, rx: 20, fill: C.windowDark },
  { kind: 'rect', x: 284, y: 74, w: 40, h: 56, rx: 20, fill: C.windowDark },
  { kind: 'circle', cx: 200, cy: 102, r: 54, fill: C.goldSoft, opacity: 0.16 },
  { kind: 'rect', x: 168, y: 66, w: 64, h: 80, rx: 32, fill: C.gold },
  { kind: 'line', x1: 200, y1: 66, x2: 200, y2: 146, stroke: C.bricks[2], strokeWidth: 3 },
  { kind: 'polygon', points: '190,118 210,118 207,134 193,134', fill: C.sky },
  { kind: 'polygon', points: '188,118 212,118 200,108', fill: C.sky },
  { kind: 'path', d: 'M200 120 C203 124 203 128 200 130 C197 128 197 124 200 120 Z', fill: C.parchment },
  { kind: 'rect', x: 160, y: 146, w: 80, h: 5, fill: C.trim },
  ...awning(56, 288, 160, C.fern),
  { kind: 'rect', x: 70, y: 176, w: 170, h: 24, fill: C.goldSoft, opacity: 0.85 },
  { kind: 'rect', x: 262, y: 172, w: 50, h: 28, rx: 2, fill: C.dark },
  ...street(),
  ...lamp(24),
];

/** Ears Everywhere: a magnifying glass sweeping over facade details. */
const magnifierVignette: Shape[] = [
  ...nightBackdrop(),
  ...building(30, 110, 150, C.bricks[3], 'gable', [true, false, true, true, false, true]),
  ...building(146, 108, 132, C.bricks[0], 'mansard', [false, true, true, false, true, true]),
  ...building(260, 110, 144, C.bricks[4], 'flat', [true, true, false, true, true, false]),
  ...street(),
  { kind: 'circle', cx: 214, cy: 108, r: 50, fill: C.parchment, opacity: 0.18 },
  { kind: 'line', x1: 250, y1: 144, x2: 290, y2: 184, stroke: C.dark, strokeWidth: 14 },
  { kind: 'line', x1: 250, y1: 144, x2: 290, y2: 184, stroke: C.gold, strokeWidth: 8 },
  { kind: 'circle', cx: 214, cy: 108, r: 50, fill: 'none', stroke: C.gold, strokeWidth: 8 },
  sparkle(214, 108, 12, C.goldSoft),
  sparkle(190, 88, 5, C.parchment),
  sparkle(238, 126, 4, C.parchment),
];

/** Main Street Senses: candy shop awning, a mailbox and music in the air. */
const sensesVignette: Shape[] = [
  ...nightBackdrop(),
  ...building(20, 170, 140, C.bricks[3], 'flat', [true, true, false, true, true, true]),
  ...building(198, 182, 150, C.bricks[2], 'gable', [true, false, true, true, true, false]),
  ...awning(24, 162, GROUND - 46, C.rose),
  ...awning(204, 170, GROUND - 46, C.rose),
  // Mailbox
  { kind: 'rect', x: 176, y: 168, w: 26, h: 32, rx: 4, fill: C.rose },
  { kind: 'path', d: 'M176 172 C176 160 202 160 202 172 Z', fill: C.rose },
  { kind: 'rect', x: 182, y: 174, w: 14, h: 3, rx: 1.5, fill: C.dark },
  // Music notes drifting in the sky
  { kind: 'circle', cx: 132, cy: 40, r: 5, fill: C.goldSoft },
  { kind: 'rect', x: 135.5, y: 18, w: 2.5, h: 22, fill: C.goldSoft },
  { kind: 'polygon', points: '135.5,18 149,23 149,28 138,24', fill: C.goldSoft },
  { kind: 'circle', cx: 252, cy: 30, r: 4, fill: C.goldSoft },
  { kind: 'rect', x: 255, y: 12, w: 2, h: 18, fill: C.goldSoft },
  // Steam from a cup of something warm
  { kind: 'path', d: 'M150 150 C144 142 156 136 150 128', fill: 'none', stroke: C.parchment, strokeWidth: 2, opacity: 0.7 },
  { kind: 'path', d: 'M160 150 C154 142 166 136 160 128', fill: 'none', stroke: C.parchment, strokeWidth: 2, opacity: 0.7 },
  ...street(),
  ...lamp(380),
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
