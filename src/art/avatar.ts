/**
 * The explorer avatar, painted in a feature-film style: a teen (about 1 : 5
 * heads tall) with an oval face, almond eyes with detailed irises, full brows,
 * a sculpted nose, full lips, strand-painted hair and soft, warm lighting.
 *
 * All original artwork. The style is a general animated-film look, never a
 * copy of any studio's characters; no mouse ears or three-circle shapes; and
 * outfits follow the public-domain books' own descriptions rather than any
 * film's designs.
 *
 * How it's drawn: the figure is built in "film units" (the head is about 172
 * units tall, the feet at y 880) and scaled onto the 120 × 168 canvas that
 * every screen uses. Soft light and shadow are painted with transparent
 * gradients and feathered strokes instead of SVG blur filters, because the
 * native renderers blur in screen pixels (ignoring the drawing's scale) and are
 * slow with many blurs. Small figures (detail: 'lite') skip the finest
 * texture.
 *
 * Wardrobe: clothes (OutfitArt) are painted onto this body from their data.
 * Hats, back items and held items keep their original drawings and are fitted
 * onto the head, torso and hand with the transforms below.
 */

import { ITEM_ART, type OutfitArt } from './avatarItems';

export const AVATAR_CANVAS = { width: 120, height: 168 };
/** Where the feet touch the ground, for standing the avatar on a point. */
export const AVATAR_FEET_Y = 160;

export const SKIN_TONES = {
  s1: '#F7DCC8',
  s2: '#EDC4A0',
  s3: '#D9A273',
  s4: '#B0724A',
  s5: '#7E4C30',
  s6: '#523222',
} as const;

export const HAIR_COLORS = {
  h1: '#2B2024',
  h2: '#5A3A28',
  h3: '#8C3B22',
  h4: '#D9A441',
  h5: '#C9C6D6',
  h6: '#D9677A',
  h7: '#4F7FB8',
} as const;

export const EYE_COLORS = {
  e1: '#5A3A28',
  e2: '#8A6A3A',
  e3: '#4F7A3A',
  e4: '#4F7FB8',
  e5: '#6E7684',
} as const;

export const HAIR_STYLES = ['crop', 'swoop', 'bob', 'long', 'curls', 'ponytail', 'braids', 'shaved'] as const;
export const EYE_STYLES = ['dot', 'happy', 'sparkle'] as const;
export type Slot = 'hat' | 'outfit' | 'back' | 'held';
export const SLOTS: Slot[] = ['hat', 'outfit', 'back', 'held'];

export type AvatarLook = {
  v: 1;
  skin: keyof typeof SKIN_TONES;
  hair: (typeof HAIR_STYLES)[number];
  hairColor: keyof typeof HAIR_COLORS;
  eyes: (typeof EYE_STYLES)[number];
  eyeColor: keyof typeof EYE_COLORS;
  freckles: boolean;
  hat: string | null;
  outfit: string;
  back: string | null;
  held: string | null;
};

export const DEFAULT_LOOK: AvatarLook = {
  v: 1,
  skin: 's2',
  hair: 'swoop',
  hairColor: 'h2',
  eyes: 'dot',
  eyeColor: 'e1',
  freckles: false,
  hat: null,
  outfit: 'explorer-tee',
  back: 'day-pack',
  held: null,
};

/** Reads a stored avatar, filling anything missing or unknown with defaults. */
export function parseLook(raw: unknown): AvatarLook | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
    typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
  const item = (v: unknown) => (typeof v === 'string' && v in ITEM_ART ? v : null);
  return {
    v: 1,
    skin: pick(r.skin, Object.keys(SKIN_TONES) as (keyof typeof SKIN_TONES)[], DEFAULT_LOOK.skin),
    hair: pick(r.hair, HAIR_STYLES, DEFAULT_LOOK.hair),
    hairColor: pick(r.hairColor, Object.keys(HAIR_COLORS) as (keyof typeof HAIR_COLORS)[], DEFAULT_LOOK.hairColor),
    eyes: pick(r.eyes, EYE_STYLES, DEFAULT_LOOK.eyes),
    eyeColor: pick(r.eyeColor, Object.keys(EYE_COLORS) as (keyof typeof EYE_COLORS)[], DEFAULT_LOOK.eyeColor),
    freckles: r.freckles === true,
    hat: item(r.hat),
    outfit: item(r.outfit) ?? DEFAULT_LOOK.outfit,
    back: item(r.back),
    held: item(r.held),
  };
}

export type Pose = 'stand' | 'cheer' | 'wave';

// ---------------------------------------------------------------------------
// Measurements, in film units. The head is centered on x = 120.
// ---------------------------------------------------------------------------
const CX = 120;
const FACE = { ty: 36, cw: 60, tY: 108, chw: 61, chY: 150, jw: 38, jY: 192, cy: 208 };
const EYE = { dx: 29, y: 132, w: 17, h: 10.5 };
const BROW_Y = 106;
const NOSE = { y: 163, w: 9 };
const MOUTH = { y: 184, w: 15 };
const NECK_W = 27;
const BODY = { sy: 252, sw: 82, wy: 430, ww: 60, hy: 452, hw: 66, ky: 640, fy: 880, aw: 40, lw: 58 };
/** Film units → canvas: the feet (y 880) land on AVATAR_FEET_Y. */
const SCALE = 0.17;
const TO_CANVAS = `translate(${60 - CX * SCALE} ${AVATAR_FEET_Y - BODY.fy * SCALE}) scale(${SCALE})`;

type Pt = [number, number];

// ---------------------------------------------------------------------------
// Color and path helpers.
// ---------------------------------------------------------------------------
const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbHex = (a: number[]) => `#${a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
function mix(a: string, b: string, t: number): string {
  const x = hexRgb(a);
  const y = hexRgb(b);
  return rgbHex(x.map((v, i) => v + (y[i] - v) * t));
}
const shade = (a: string, k: number) => rgbHex(hexRgb(a).map((v) => v * (1 + k)));
const n1 = (v: number) => Math.round(v * 10) / 10;

/** A smooth path through points (Catmull-Rom as cubic Béziers). */
function smooth(pts: Pt[], close = false): string {
  const P = close ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M${n1(P[1][0])} ${n1(P[1][1])}`;
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    d += `C${n1(p1[0] + (p2[0] - p0[0]) / 6)} ${n1(p1[1] + (p2[1] - p0[1]) / 6)} ${n1(p2[0] - (p3[0] - p1[0]) / 6)} ${n1(p2[1] - (p3[1] - p1[1]) / 6)} ${n1(p2[0])} ${n1(p2[1])}`;
  }
  return close ? `${d}Z` : d;
}

/** A symmetric outline around x = CX from right-side cubic segments. */
function symPath(top: number, segs: number[][]): string {
  let d = `M${CX} ${top}`;
  segs.forEach(([a, b, c, e, g, h]) => (d += `C${CX + a} ${b} ${CX + c} ${e} ${CX + g} ${h}`));
  for (let i = segs.length - 1; i >= 0; i--) {
    const [a, b, c, e] = segs[i];
    const [pg, ph] = i > 0 ? [segs[i - 1][4], segs[i - 1][5]] : [0, top];
    d += `C${CX - c} ${e} ${CX - a} ${b} ${CX - pg} ${ph}`;
  }
  return `${d}Z`;
}

const mirror = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [2 * CX - x, y]);

/** Small seeded random numbers, so a look always paints the same strands. */
function seeded(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

let uid = 0;

/** One figure's drawing context: unique ids, shared gradients, soft paint. */
class Painter {
  readonly id = `av${uid++}`;
  private n = 0;
  private defs: string[] = [];
  private grads = new Map<string, string>();
  readonly lite: boolean;
  readonly rnd: () => number;
  constructor(lite: boolean, rnd: () => number) {
    this.lite = lite;
    this.rnd = rnd;
  }
  uid() {
    return `${this.id}_${this.n++}`;
  }
  def(markup: string) {
    this.defs.push(markup);
  }
  defsMarkup() {
    return `<defs>${this.defs.join('')}</defs>`;
  }
  /** A soft-edged ellipse (what a blurred ellipse looks like). */
  glow(cx: number, cy: number, rx: number, ry: number, color: string, opacity: number, soft: number) {
    const R = rx + soft * 1.2;
    const Ry = ry + soft * 1.2;
    const t0 = Math.max(0, Math.min(0.8, Math.round(((Math.min(rx, ry) - soft) / Math.min(R, Ry)) * 10) / 10));
    const key = `${color}|${opacity}|${t0}`;
    let g = this.grads.get(key);
    if (!g) {
      g = this.uid();
      this.grads.set(key, g);
      this.def(
        `<radialGradient id="${g}"><stop offset="0" stop-color="${color}" stop-opacity="${opacity}"/><stop offset="${t0}" stop-color="${color}" stop-opacity="${n1(opacity * 0.85 * 100) / 100}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`,
      );
    }
    return `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(R)}" ry="${n1(Ry)}" fill="url(#${g})"/>`;
  }
  /** A soft-edged line (what a blurred stroke looks like). */
  stroke(d: string, color: string, width: number, opacity: number, soft: number) {
    // Five thin layers, widest first, so the edge fades without visible rings.
    // (Small figures use two; the rings don't show at that size.)
    const layers = this.lite ? 2 : 5;
    let o = '';
    for (let i = 0; i < layers; i++) {
      const w = width + soft * 2.6 * (1 - i / (layers - 1));
      o += `<path d="${d}" stroke="${color}" stroke-width="${n1(w)}" fill="none" opacity="${n1((opacity * 85) / layers) / 100}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    return o;
  }
  /** A soft-edged filled shape. */
  fill(d: string, color: string, opacity: number, soft: number, transform = '') {
    const t = transform ? ` transform="${transform}"` : '';
    let o = `<path d="${d}"${t} fill="${color}" opacity="${n1(opacity * 40) / 100}"/>`;
    for (const k of [2.8, 2.1, 1.4, 0.7]) {
      o += `<path d="${d}"${t} fill="none" stroke="${color}" stroke-width="${n1(soft * k)}" stroke-linejoin="round" opacity="${n1(opacity * 11) / 100}"/>`;
    }
    return o;
  }
  /** A filled shape with shading painted inside it (never spilling out). */
  part(d: string, fill: string, shading = '') {
    const c = this.uid();
    this.def(`<clipPath id="${c}"><path d="${d}"/></clipPath>`);
    return `<path d="${d}" fill="${fill}"/>${shading ? `<g clip-path="url(#${c})">${shading}</g>` : ''}`;
  }
  clip(d: string) {
    const c = this.uid();
    this.def(`<clipPath id="${c}"><path d="${d}"/></clipPath>`);
    return c;
  }
}

/** The outline of a limb through joints, with a half-width at each joint. */
function limbPath(pts: Pt[], widths: number[]): string {
  const left: Pt[] = [];
  const right: Pt[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / len;
    const ny = (b[0] - a[0]) / len;
    left.push([p[0] + nx * widths[i], p[1] + ny * widths[i]]);
    right.push([p[0] - nx * widths[i], p[1] - ny * widths[i]]);
  });
  return smooth([...left, ...right.reverse()], true);
}

/** A line through joints, pushed sideways (toward +x when side = 1). */
function offsetLine(pts: Pt[], widths: number[], k: number): Pt[] {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let nx = -(b[1] - a[1]) / len;
    let ny = (b[0] - a[0]) / len;
    if (nx < 0) {
      nx = -nx;
      ny = -ny;
    }
    return [p[0] + nx * widths[i] * k, p[1] + ny * widths[i] * k];
  });
}

type Skin = { base: string; lit: string; shadow: string; deep: string; blush: string };
function skinSet(base: string): Skin {
  return {
    base,
    lit: mix(base, '#FFF3E4', 0.4),
    shadow: mix(shade(base, -0.32), '#8E2E22', 0.2),
    deep: mix(shade(base, -0.5), '#5A1A14', 0.2),
    blush: mix(base, '#E2585A', 0.55),
  };
}

// ---------------------------------------------------------------------------
// Arms by pose: shoulder, elbow, wrist.
// ---------------------------------------------------------------------------
const { sy, sw } = BODY;
const ARM_DOWN = (s: number): Pt[] => [
  [CX + s * (sw - 16), sy + 22],
  [CX + s * (sw + 8), sy + 135],
  [CX + s * (sw + 14), 528],
];
const ARM_UP = (s: number): Pt[] => [
  [CX + s * (sw - 16), sy + 22],
  [CX + s * (sw + 58), sy - 24],
  [CX + s * (sw + 56), sy - 140],
];
const ARMS: Record<Pose, { left: Pt[]; right: Pt[] }> = {
  stand: { left: ARM_DOWN(-1), right: ARM_DOWN(1) },
  cheer: { left: ARM_UP(-1), right: ARM_UP(1) },
  wave: { left: ARM_DOWN(-1), right: ARM_UP(1) },
};
const ARM_W = [BODY.aw * 0.5, BODY.aw * 0.42, BODY.aw * 0.33];

/** Center of the hand at the end of an arm. */
function handAt(arm: Pt[]): Pt {
  const [ex, ey] = arm[1];
  const [wx, wy] = arm[2];
  const len = Math.hypot(wx - ex, wy - ey);
  return [wx + ((wx - ex) / len) * BODY.aw * 0.5, wy + ((wy - ey) / len) * BODY.aw * 0.5];
}

// ---------------------------------------------------------------------------
// Wardrobe fits: item art was drawn on the first chibi body (head centered at
// 60, 52 with a 26-unit radius; torso 43–77 × 84–106; feet at 132).
// ---------------------------------------------------------------------------
const HAT_FIT = 'translate(-72 -47.2) scale(3.2)';
const TORSO_FIT = 'matrix(4.8 0 0 7.2 -168 -356.8)';
/** Back items sit a little narrower than the chest so packs don't poke out. */
const BACK_FIT = 'matrix(4 0 0 7.2 -120 -356.8)';
const CAPE_FIT = 'matrix(5 0 0 12.8 -180 -825.2)';
const ITEM_FIT: Record<string, string> = {
  'flying-carpet': 'matrix(4.6 0 0 4 -156 352)',
  'robot-pal': 'matrix(6 0 0 6 -74 208)',
  'shoulder-parrot': 'matrix(4.6 0 0 4.6 -156 -150)',
  'canoe-paddle': 'matrix(4.8 0 0 7.6 -168 -390)',
  'riding-hood-cape': CAPE_FIT,
  'horseman-cloak': CAPE_FIT,
  'twinkle-cape': CAPE_FIT,
  'autumn-leaf-cape': CAPE_FIT,
  'fairy-wings': 'matrix(5.2 0 0 5.2 -192 -168)',
  'crossed-swords-flag': 'matrix(4.6 0 0 7 -138 -44)',
  'fishing-hat': 'translate(-72 -56.8) scale(3.2)',
  'diving-helmet': 'translate(-48 -10) scale(2.8)',
};
/** Capes hang from the shoulders (y 84 in item art) and flare past the arms; anything above is cut. */
const CAPES = new Set(['riding-hood-cape', 'horseman-cloak', 'twinkle-cape', 'autumn-leaf-cape']);
const HELD_SCALE = 4.4;

// ---------------------------------------------------------------------------
// The head.
// ---------------------------------------------------------------------------
const FACE_PATH = symPath(FACE.ty, [
  [FACE.cw * 0.62, FACE.ty, FACE.cw, FACE.ty + 34, FACE.cw, FACE.tY],
  [FACE.cw, FACE.tY + 20, FACE.chw, FACE.chY - 16, FACE.chw, FACE.chY],
  [FACE.chw, FACE.chY + 20, FACE.jw + 14, FACE.jY - 8, FACE.jw, FACE.jY],
  [FACE.jw - 14, FACE.cy - 4, 16, FACE.cy, 0, FACE.cy],
]);

function neck(p: Painter, k: Skin): string {
  const { jY, cy } = FACE;
  const nw = NECK_W;
  const d = `M${CX - nw} ${jY - 10}C${CX - nw} ${cy + 20} ${CX - nw - 2} ${cy + 34} ${CX - nw - 18} ${cy + 50}H${CX + nw + 18}C${CX + nw + 2} ${cy + 34} ${CX + nw} ${cy + 20} ${CX + nw} ${jY - 10}Z`;
  return p.part(
    d,
    mix(k.base, k.shadow, 0.2),
    p.fill(FACE_PATH, k.deep, 0.6, 6, 'translate(0 12)') +
      p.glow(CX + nw, cy + 26, nw * 0.6, 30, k.shadow, 0.4, 6) +
      p.glow(CX - nw * 0.5, cy + 40, nw * 0.4, 10, k.lit, 0.35, 6),
  );
}

function ears(p: Painter, k: Skin): string {
  let o = '';
  for (const s of [-1, 1]) {
    const x = CX + s * (FACE.chw + 1);
    const y = EYE.y + 12;
    o += `<ellipse cx="${x}" cy="${y}" rx="10" ry="17" fill="${s > 0 ? mix(k.base, k.shadow, 0.4) : k.base}"/>`;
    o += p.stroke(`M${x + s * 3} ${y - 10}Q${x + s * 7} ${y} ${x + s * 2} ${y + 10}`, k.shadow, 3, 0.8, 2);
  }
  return o;
}

function eye(p: Painter, look: AvatarLook, k: Skin, s: -1 | 1): string {
  const ew = EYE.w;
  const eh = look.eyes === 'sparkle' ? EYE.h * 1.15 : EYE.h;
  const ey = EYE.y;
  const cx = CX + s * EYE.dx;
  const inner = cx - s * ew;
  const outer = cx + s * ew;
  const topY = ey - eh * 1.25;
  const botY = look.eyes === 'happy' ? ey + eh * 0.3 : ey + eh * 0.95;
  const shape = `M${inner} ${ey + 1}C${inner + s * ew * 0.35} ${topY} ${outer - s * ew * 0.45} ${topY} ${outer} ${ey - 1}C${outer - s * ew * 0.3} ${botY} ${inner + s * ew * 0.4} ${botY + 1} ${inner} ${ey + 1}Z`;
  const ir = EYE.h * 1.05;
  const ix = cx + s;
  const iy = ey + 1;
  const iris = EYE_COLORS[look.eyeColor] ?? EYE_COLORS.e1;
  const ig = p.uid();
  p.def(
    `<radialGradient id="${ig}" cx="50%" cy="55%" r="50%"><stop offset="0.25" stop-color="${mix(iris, '#E0A050', 0.45)}"/><stop offset="0.65" stop-color="${iris}"/><stop offset="1" stop-color="${mix(iris, '#000000', 0.55)}"/></radialGradient>`,
  );
  const clip = p.clip(shape);
  let o = `<path d="${shape}" fill="#EFE6E0"/><g clip-path="url(#${clip})">`;
  o += p.glow(inner + s * 2, ey + 1, 5, 4, '#D89A90', 0.7, 2);
  o += p.glow(outer, ey, 6, eh, k.shadow, 0.4, 4);
  o += `<circle cx="${ix}" cy="${iy}" r="${ir}" fill="url(#${ig})"/>`;
  if (!p.lite) {
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      o += `<path d="M${n1(ix + Math.cos(a) * ir * 0.42)} ${n1(iy + Math.sin(a) * ir * 0.42)}L${n1(ix + Math.cos(a) * ir * 0.92)} ${n1(iy + Math.sin(a) * ir * 0.92)}" stroke="${mix(iris, '#F0C080', 0.5)}" stroke-width="0.7" opacity="0.35"/>`;
    }
  }
  o += `<circle cx="${ix}" cy="${iy}" r="${ir - 0.6}" fill="none" stroke="#120808" stroke-width="1.6" opacity="0.5"/>`;
  o += `<circle cx="${ix}" cy="${iy}" r="${n1(ir * 0.4)}" fill="#0C0606"/>`;
  o += p.glow(cx, topY + 1, ew * 1.1, eh * 0.75, '#2A1010', 0.55, 4);
  o += p.glow(ix + s * ir * 0.3, iy + ir * 0.45, ir * 0.4, ir * 0.18, '#FFFFFF', 0.14, 2);
  o += '</g>';
  o += `<ellipse cx="${n1(ix - ir * 0.32)}" cy="${n1(iy - ir * 0.32)}" rx="${n1(ir * 0.17)}" ry="${n1(ir * 0.2)}" fill="#FFFFFF" opacity="0.85"/>`;
  // Lash line thickening outward, a few lashes, the crease and the lower lid.
  const lid = `M${inner} ${ey + 1}C${inner + s * ew * 0.35} ${topY} ${outer - s * ew * 0.45} ${topY} ${outer} ${ey - 1}`;
  o += `<path d="${lid}" stroke="#1A0E0E" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  o += `<path d="M${cx} ${topY + 1.5}C${cx + s * ew * 0.5} ${topY + 1} ${outer} ${ey - eh * 0.6} ${outer + s * 4} ${ey - eh * 0.9}C${outer} ${ey + 0.5} ${cx + s * ew * 0.5} ${topY + 5} ${cx} ${topY + 4}Z" fill="#1A0E0E"/>`;
  for (let i = 0; i < (p.lite ? 0 : 4); i++) {
    const t = 0.55 + i * 0.13;
    const x = inner + (outer - inner) * t;
    const y = topY + 2 + (t - 0.5) * eh * 1.2;
    o += `<path d="M${n1(x)} ${n1(y)}q${s * 2} -3 ${n1(s * 4.5)} -4" stroke="#1A0E0E" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
  }
  o += `<path d="M${inner + s * 2} ${topY - 2}C${inner + s * ew * 0.4} ${topY - eh * 0.9} ${outer - s * ew * 0.4} ${topY - eh * 0.9} ${outer + s * 2} ${ey - eh * 0.7}" stroke="${k.deep}" stroke-width="1.6" fill="none" opacity="0.45"/>`;
  o += `<path d="M${outer - s} ${ey}C${outer - s * ew * 0.3} ${botY + 1} ${inner + s * ew * 0.4} ${botY + 2} ${inner + s * 2} ${ey + 2}" stroke="${k.shadow}" stroke-width="1.4" fill="none" opacity="0.7"/>`;
  o += p.stroke(`M${outer - s * 2} ${ey + 3}C${outer - s * ew * 0.3} ${botY + 6} ${inner + s * ew * 0.4} ${botY + 6} ${inner + s * 3} ${ey + 5}`, k.shadow, 2.5, 0.3, 2);
  if (look.eyes === 'happy') o += p.stroke(`M${inner} ${botY + 7}Q${cx} ${botY + 3} ${outer} ${botY + 6}`, k.shadow, 2, 0.4, 2);
  return o;
}

function face(p: Painter, look: AvatarLook, k: Skin, hairShadow: string | null): string {
  const { ty, cw, tY, chY, jw, jY, cy } = FACE;
  const sg = p.uid();
  p.def(
    `<radialGradient id="${sg}" cx="40%" cy="38%" r="70%"><stop offset="0" stop-color="${mix(k.base, k.lit, 0.5)}"/><stop offset="0.6" stop-color="${k.base}"/><stop offset="1" stop-color="${mix(k.base, k.shadow, 0.6)}"/></radialGradient>`,
  );
  const clip = p.clip(FACE_PATH);
  let o = `<path d="${FACE_PATH}" fill="url(#${sg})"/><g clip-path="url(#${clip})">`;
  o += p.glow(CX + cw * 0.95, chY - 6, cw * 0.55, (cy - ty) * 0.55, k.shadow, 0.5, 14);
  o += p.glow(CX - cw * 0.35, ty + (tY - ty) * 0.55, cw * 0.55, (tY - ty) * 0.42, k.lit, 0.55, 14);
  for (const s of [-1, 1]) {
    o += p.glow(CX + s * EYE.dx, EYE.y - 2, EYE.w * 1.35, EYE.h * 1.9, k.shadow, s > 0 ? 0.42 : 0.3, 6);
    o += p.glow(CX + s * (EYE.dx + 6), EYE.y + EYE.h + 22, EYE.w * 1.1, EYE.w * 0.7, k.blush, 0.4, 8);
    o += p.glow(CX + s * (EYE.dx + 2), EYE.y + EYE.h + 12, EYE.w * 0.9, 5, k.lit, s < 0 ? 0.5 : 0.2, 6);
  }
  o += p.stroke(`M${CX - jw - 6} ${jY - 4}Q${CX} ${cy + 16} ${CX + jw + 6} ${jY - 4}`, k.shadow, 10, 0.45, 6);
  o += p.glow(CX, cy - 9, 10, 5, k.lit, 0.5, 4);
  o += p.stroke(`M${CX + cw - 2} ${tY - 20}C${CX + FACE.chw + 2} ${chY} ${CX + jw + 18} ${jY} ${CX + 20} ${cy - 2}`, '#FFE2B8', 3, 0.5, 2);
  if (look.freckles) {
    for (let i = 0; i < (p.lite ? 12 : 26); i++) {
      const s = i % 2 ? 1 : -1;
      o += `<circle cx="${n1(CX + s * (8 + p.rnd() * 34))}" cy="${n1(EYE.y + EYE.h + 8 + p.rnd() * 16)}" r="${n1(0.9 + p.rnd())}" fill="${k.shadow}" opacity="0.5"/>`;
    }
  }
  if (hairShadow) o += p.fill(hairShadow, k.deep, 0.55, 6, 'translate(0 7)');
  o += '</g>';
  // Nose: shade down the right side, a light bridge, a rounded tip.
  const ny = NOSE.y;
  const nw = NOSE.w;
  o += p.stroke(`M${CX + 5} ${EYE.y + 2}C${CX + 8} ${EYE.y + 16} ${CX + 9} ${ny - 12} ${CX + nw * 0.7} ${ny - 2}`, k.shadow, 5, 0.45, 4);
  o += p.stroke(`M${CX - 3} ${EYE.y + 6}C${CX - 4} ${EYE.y + 18} ${CX - 3} ${ny - 14} ${CX - 2} ${ny - 6}`, k.lit, 3.5, 0.55, 2);
  o += p.glow(CX, ny + 5, nw * 1.05, 4, k.deep, 0.45, 4);
  o += p.glow(CX, ny - 1, nw * 0.62, nw * 0.5, mix(k.base, k.lit, 0.35), 0.9, 2);
  for (const s of [-1, 1]) {
    o += `<path d="M${CX + s * nw} ${ny - 4}Q${CX + s * (nw + 2)} ${ny + 4} ${CX + s * nw * 0.45} ${ny + 4}" stroke="${k.deep}" stroke-width="2" fill="none" opacity="0.6"/>`;
    o += `<ellipse cx="${CX + s * nw * 0.45}" cy="${ny + 3.4}" rx="2.6" ry="1.4" fill="${k.deep}" opacity="0.55"/>`;
  }
  o += `<ellipse cx="${CX - 2}" cy="${ny - 4}" rx="2.4" ry="1.6" fill="#FFFFFF" opacity="0.35"/>`;
  o += mouth(p, look, k);
  o += eye(p, look, k, -1) + eye(p, look, k, 1);
  return o;
}

function mouth(p: Painter, look: AvatarLook, k: Skin): string {
  const my = MOUTH.y;
  const mw = look.eyes === 'happy' ? MOUTH.w + 2 : MOUTH.w;
  const lip = mix(k.base, '#B8505A', 0.45);
  const lipDark = mix(lip, '#4A1418', 0.35);
  let o = p.stroke(`M${CX - 3} ${NOSE.y + 8}L${CX - 3} ${my - 5}M${CX + 3} ${NOSE.y + 8}L${CX + 3} ${my - 5}`, k.shadow, 2, 0.35, 2);
  if (look.eyes === 'happy') {
    // An open, toothy smile.
    o += `<path d="M${CX - mw} ${my - 2}C${CX - mw * 0.6} ${my - 6} ${CX + mw * 0.6} ${my - 6} ${CX + mw} ${my - 2}C${CX + mw * 0.6} ${my + 12} ${CX - mw * 0.6} ${my + 12} ${CX - mw} ${my - 2}Z" fill="#5A1A20"/>`;
    o += `<path d="M${CX - mw * 0.8} ${my - 2.6}C${CX - mw * 0.4} ${my - 4.4} ${CX + mw * 0.4} ${my - 4.4} ${CX + mw * 0.8} ${my - 2.6}L${CX + mw * 0.7} ${my + 1.6}C${CX + mw * 0.3} ${my + 3} ${CX - mw * 0.3} ${my + 3} ${CX - mw * 0.7} ${my + 1.6}Z" fill="#F4EEE8"/>`;
    o += `<ellipse cx="${CX}" cy="${my + 6.5}" rx="${mw * 0.45}" ry="2.6" fill="#D86A76"/>`;
    o += `<path d="M${CX - mw - 1} ${my - 2.5}C${CX - mw * 0.5} ${my - 7} ${CX - 4} ${my - 8} ${CX} ${my - 6}C${CX + 4} ${my - 8} ${CX + mw * 0.5} ${my - 7} ${CX + mw + 1} ${my - 2.5}C${CX + mw * 0.5} ${my - 5} ${CX - mw * 0.5} ${my - 5} ${CX - mw - 1} ${my - 2.5}Z" fill="${lipDark}"/>`;
    o += `<path d="M${CX - mw * 0.7} ${my + 7}C${CX - mw * 0.3} ${my + 13} ${CX + mw * 0.3} ${my + 13} ${CX + mw * 0.7} ${my + 7}C${CX + mw * 0.3} ${my + 10} ${CX - mw * 0.3} ${my + 10} ${CX - mw * 0.7} ${my + 7}Z" fill="${lip}"/>`;
  } else {
    o += `<path d="M${CX - mw} ${my}C${CX - mw * 0.6} ${my - 5} ${CX - 5} ${my - 7} ${CX} ${my - 4.5}C${CX + 5} ${my - 7} ${CX + mw * 0.6} ${my - 5} ${CX + mw} ${my}Q${CX} ${my + 3} ${CX - mw} ${my}Z" fill="${lipDark}"/>`;
    o += `<path d="M${CX - mw * 0.85} ${my + 1}Q${CX} ${my + 3.5} ${CX + mw * 0.85} ${my + 1}C${CX + mw * 0.55} ${my + 11} ${CX - mw * 0.55} ${my + 11} ${CX - mw * 0.85} ${my + 1}Z" fill="${lip}"/>`;
    o += `<ellipse cx="${CX - 2}" cy="${my + 5.5}" rx="${mw * 0.32}" ry="1.8" fill="#FFFFFF" opacity="0.3"/>`;
    o += `<path d="M${CX - mw - 2} ${my - 2}Q${CX} ${my + 4} ${CX + mw + 2} ${my - 2}" stroke="${mix(lipDark, '#2A0A0C', 0.5)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  }
  for (const s of [-1, 1]) {
    o += `<path d="M${CX + s * (mw + 3)} ${my - 5}Q${CX + s * (mw + 4)} ${my} ${CX + s * (mw + 1)} ${my + 2}" stroke="${k.shadow}" stroke-width="2" fill="none" opacity="0.55"/>`;
  }
  o += p.glow(CX, my + 15, mw * 0.6, 3, k.shadow, 0.35, 4);
  return o;
}

function brows(p: Painter, look: AvatarLook): string {
  const hair = HAIR_COLORS[look.hairColor];
  const color = look.hair === 'shaved' ? mix(hair, '#000000', 0.15) : mix(hair, '#000000', 0.3);
  const lift = look.eyes === 'sparkle' ? 4 : 0;
  let o = '';
  for (const s of [-1, 1]) {
    const cx = CX + s * EYE.dx;
    const by = BROW_Y - lift;
    const ew = EYE.w;
    const inner = cx - s * ew * 0.95;
    const outer = cx + s * ew * 1.15;
    const d = `M${inner} ${by + 3}C${cx - s * ew * 0.4} ${by - 6} ${cx + s * ew * 0.5} ${by - 8} ${outer} ${by + 1}C${cx + s * ew * 0.45} ${by - 2} ${cx - s * ew * 0.3} ${by + 1} ${inner + s} ${by + 10}Z`;
    let hairs = '';
    if (!p.lite) {
      for (let i = 0; i < 16; i++) {
        const t = i / 15;
        const x = inner + (outer - inner) * t;
        hairs += `<path d="M${n1(x)} ${n1(by + 8 - t * 6)}l${s * 5} ${n1(-4 + t * 3)}" stroke="${mix(color, '#000000', 0.35)}" stroke-width="1.2" opacity="0.6"/>`;
      }
    }
    o += p.part(d, color, hairs);
  }
  return o;
}

// ---------------------------------------------------------------------------
// Hair: a back layer (behind the body) and a front layer (over the face).
// ---------------------------------------------------------------------------
type Hair = { back: string; front: string; shadow: string | null; ears: boolean };

function strands(p: Painter, inner: Pt[], outer: Pt[], n: number, colors: string[], wave: number, widths: [number, number] = [1.2, 2.8]) {
  let o = '';
  const count = p.lite ? Math.ceil(n * 0.15) : n;
  for (let i = 0; i < count; i++) {
    const t = p.rnd();
    const amp = wave * (0.7 + 0.6 * ((i * 7) % 5) / 4);
    const pts = inner.map((a, k): Pt => {
      const b = outer[k];
      const w = Math.sin(k * 1.1 + t * 0.8) * amp * Math.min(1, k / 3);
      return [a[0] + (b[0] - a[0]) * t + w, a[1] + (b[1] - a[1]) * t];
    });
    o += `<path d="${smooth(pts)}" stroke="${colors[Math.floor(p.rnd() * colors.length)]}" stroke-width="${n1(widths[0] + p.rnd() * (widths[1] - widths[0]))}" fill="none" opacity="${n1(0.3 + p.rnd() * 0.5)}" stroke-linecap="round"/>`;
  }
  return o;
}
const waved = (pts: Pt[], amp: number): Pt[] => pts.map(([x, y], k) => [x + Math.sin(k * 1.1) * amp * Math.min(1, k / 3), y]);

/** Strands fanning from a crown point to points along an edge. */
function fan(p: Painter, crown: Pt, spread: number, edge: Pt[], n: number, colors: string[], bow = 8) {
  let o = '';
  const count = p.lite ? Math.ceil(n * 0.15) : n;
  for (let i = 0; i < count; i++) {
    const t = p.rnd() * (edge.length - 1);
    const k = Math.floor(t);
    const u = t - k;
    const e: Pt = [edge[k][0] + (edge[k + 1][0] - edge[k][0]) * u, edge[k][1] + (edge[k + 1][1] - edge[k][1]) * u];
    const sx = crown[0] + (p.rnd() - 0.5) * spread;
    const sy2 = crown[1] + p.rnd() * 10;
    const mx = (sx + e[0]) / 2 + (e[0] < CX ? -bow : bow);
    const my = Math.min(sy2, e[1]) - 4;
    o += `<path d="M${n1(sx)} ${n1(sy2)}Q${n1(mx)} ${n1(my)} ${n1(e[0])} ${n1(e[1])}" stroke="${colors[Math.floor(p.rnd() * colors.length)]}" stroke-width="${n1(1 + p.rnd() * 2.4)}" fill="none" opacity="${n1(0.3 + p.rnd() * 0.5)}" stroke-linecap="round"/>`;
  }
  return o;
}

function hair(p: Painter, look: AvatarLook): Hair {
  const c = HAIR_COLORS[look.hairColor];
  const dk = mix(c, '#000000', 0.5);
  const lt = mix(c, '#F2E0C0', 0.4);
  const rim = mix(c, '#FFD9A0', 0.6);
  const cols = [dk, c, mix(c, dk, 0.5), lt, c];
  const { ty, cw, tY } = FACE;
  const grad = p.uid();
  p.def(`<linearGradient id="${grad}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${mix(c, lt, 0.45)}"/><stop offset="0.5" stop-color="${c}"/><stop offset="1" stop-color="${dk}"/></linearGradient>`);
  const fill = `url(#${grad})`;

  // A close cap over the skull with a hairline; used by several styles.
  const capWith = (hairline: Pt[], top = ty - 10): string => {
    const dome: Pt[] = [];
    for (let a = 180; a <= 360; a += 20) dome.push([CX + Math.cos((a * Math.PI) / 180) * (cw + 8), tY + 6 + Math.sin((a * Math.PI) / 180) * (tY + 6 - top)]);
    return smooth([[CX - cw - 6, tY + 26], ...dome, [CX + cw + 6, tY + 26], ...hairline], true);
  };

  switch (look.hair) {
    case 'long':
    case 'bob': {
      const long = look.hair === 'long';
      const W = long ? 15 : 5;
      const inR: Pt[] = long
        ? [[121, ty + 22], [146, ty + 26], [168, ty + 40], [182, tY - 12], [188, tY + 30], [192, tY + 80], [198, tY + 130], [204, tY + 180], [208, tY + 230]]
        : [[121, ty + 22], [146, ty + 26], [168, ty + 40], [182, tY - 12], [188, tY + 34], [186, tY + 84], [176, tY + 112]];
      const outR: Pt[] = long
        ? [[121, ty - 16], [168, ty - 12], [206, ty + 22], [224, tY - 6], [236, tY + 40], [244, tY + 90], [250, tY + 140], [254, tY + 190], [250, tY + 240]]
        : [[121, ty - 16], [168, ty - 12], [206, ty + 22], [222, tY - 6], [230, tY + 44], [226, tY + 92], [196, tY + 118]];
      const frontR = smooth([...waved(outR, W), ...waved(inR, W).reverse()], true);
      const frontL = smooth([...waved(mirror(outR), W), ...waved(mirror(inR), W).reverse()], true);
      const backD = long
        ? smooth([[120, ty - 22], [190, ty - 8], [228, 70], [256, 150], [262, 200], [290, 250], [284, 310], [300, 330], [272, 372], [222, 352], [172, 378], [120, 356], [68, 378], [18, 352], [-32, 372], [-60, 330], [-44, 310], [-50, 250], [-22, 200], [-16, 150], [12, 70], [50, ty - 8]], true)
        : smooth([[120, ty - 22], [196, ty - 10], [236, 70], [244, 150], [236, 210], [200, 232], [120, 236], [40, 232], [4, 210], [-4, 150], [4, 70], [44, ty - 10]], true);
      const sheen = (side: number) =>
        p.stroke(`M${CX + side * 20} ${ty}C${CX + side * 70} ${ty + 4} ${CX + side * 98} ${ty + 50} ${CX + side * 104} ${tY + 40}`, lt, 10, side < 0 ? 0.6 : 0.4, 6);
      const backStrands =
        strands(p, mirror(outR).map(([x, y]): Pt => [x - 10, y + 20]), mirror(inR).map(([x, y]): Pt => [x - 4, y + 20]), 26, [dk, c, mix(c, dk, 0.5)], W, [1.5, 3]) +
        strands(p, outR.map(([x, y]): Pt => [x + 10, y + 20]), inR.map(([x, y]): Pt => [x + 4, y + 20]), 26, [dk, c, mix(c, dk, 0.5)], W, [1.5, 3]);
      return {
        back: p.part(backD, dk, backStrands),
        front:
          p.part(frontR, fill, strands(p, inR, outR, 46, cols, W) + sheen(1) + p.glow(200, tY + 120, 40, 90, dk, 0.5, 14)) +
          p.part(frontL, fill, strands(p, mirror(inR), mirror(outR), 46, cols, W) + sheen(-1)) +
          p.stroke(smooth(waved(outR, W)), rim, 3, 0.6, 2) +
          `<path d="M${CX} ${ty - 14}L${CX + 1} ${ty + 22}" stroke="${dk}" stroke-width="2.5"/>`,
        shadow: `${frontR} ${frontL}`,
        ears: false,
      };
    }
    case 'curls': {
      const R = cw + 30;
      const cyH = ty + 40;
      let blob = '';
      for (let i = 0; i < 30; i++) {
        const a = (i / 30) * Math.PI * 2;
        blob += `<circle cx="${n1(CX + Math.cos(a) * R)}" cy="${n1(cyH + Math.sin(a) * R * 0.85)}" r="${n1(16 + p.rnd() * 6)}"/>`;
      }
      const hl: Pt[] = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        const a = Math.PI * (1 + t);
        hl.push([CX + Math.cos(a) * (cw + 2), ty + 60 + (Math.abs(t - 0.5) * 2) ** 2 * (tY - ty - 34)]);
      }
      const cg = p.uid();
      p.def(`<radialGradient id="${cg}" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="${mix(c, lt, 0.35)}"/><stop offset="0.5" stop-color="${c}"/><stop offset="1" stop-color="${dk}"/></radialGradient>`);
      const mask = p.uid();
      p.def(`<clipPath id="${mask}">${blob}<ellipse cx="${CX}" cy="${cyH}" rx="${R}" ry="${R * 0.85}"/></clipPath>`);
      let tex = '';
      const count = p.lite ? 70 : 420;
      for (let i = 0; i < count; i++) {
        const a = p.rnd() * Math.PI * 2;
        const r = Math.sqrt(p.rnd()) * (R + 18);
        const x = CX + Math.cos(a) * r;
        const y = cyH + Math.sin(a) * r * 0.85;
        const light = Math.max(0, Math.min(1, 0.5 + (-(x - CX) - (y - cyH)) / (R * 2)));
        const rr = 2.4 + p.rnd() * 2.4;
        const a0 = p.rnd() * 6.28;
        tex += `<path d="M${n1(x + Math.cos(a0) * rr)} ${n1(y + Math.sin(a0) * rr)}A${n1(rr)} ${n1(rr)} 0 1 1 ${n1(x + Math.cos(a0 + 4) * rr)} ${n1(y + Math.sin(a0 + 4) * rr)}" stroke="${mix(dk, lt, light)}" stroke-width="1.4" fill="none" opacity="${n1(0.3 + light * 0.5)}"/>`;
      }
      const cap = `M${CX - cw - 6} ${tY + 20}${hl.map(([x, y]) => `L${n1(x)} ${n1(y + 6)}`).join('')}L${CX + cw + 6} ${tY + 20}L${CX + cw + 40} ${ty - 30}L${CX - cw - 40} ${ty - 30}Z`;
      const edge = hl.map(([x, y]) => `<circle cx="${n1(x)}" cy="${n1(y - 4)}" r="${n1(6 + p.rnd() * 2.5)}"/>`).join('');
      return {
        back: `<g fill="url(#${cg})">${blob}<ellipse cx="${CX}" cy="${cyH}" rx="${R}" ry="${R * 0.85}"/></g><g clip-path="url(#${mask})">${tex}${p.glow(CX + R * 0.7, cyH + R * 0.6, R * 0.8, R * 0.6, dk, 0.5, 14)}</g>`,
        front: `<g clip-path="url(#${mask})">${p.part(cap, `url(#${cg})`, tex)}</g><g fill="url(#${cg})">${edge}</g>`,
        shadow: cap,
        ears: true,
      };
    }
    case 'swoop': {
      const cap = smooth([[CX - cw - 6, tY + 28], [CX - cw - 10, tY - 10], [CX - cw + 2, ty + 8], [104, ty - 16], [170, ty - 12], [CX + cw + 8, ty + 20], [CX + cw + 10, tY], [CX + cw + 2, tY + 26], [CX + cw - 6, tY - 6], [158, ty + 46], [116, ty + 56], [76, ty + 50], [CX - cw + 6, tY - 4], [CX - cw, tY + 26]], true);
      const edge: Pt[] = [[CX - cw - 4, tY + 20], [CX - cw + 4, tY - 8], [76, ty + 50], [96, ty + 55], [116, ty + 56], [138, ty + 52], [158, ty + 46], [CX + cw - 6, tY - 6], [CX + cw + 2, tY + 22]];
      return {
        back: '',
        front:
          p.part(cap, fill, fan(p, [162, ty - 2], 24, edge, 90, cols) + p.stroke(`M76 ${ty + 24}C104 ${ty} 150 ${ty - 2} 186 ${ty + 26}`, lt, 10, 0.55, 6) + p.glow(CX + cw, tY, 20, 40, dk, 0.5, 8)) +
          p.stroke(`M${CX + cw + 8} ${ty + 20}C${CX + cw + 12} ${tY - 30} ${CX + cw + 12} ${tY} ${CX + cw + 2} ${tY + 26}`, rim, 2.5, 0.6, 2),
        shadow: cap,
        ears: true,
      };
    }
    case 'crop': {
      const hairline: Pt[] = [[CX + cw - 4, tY - 8], [CX + 34, ty + 40], [CX + 12, ty + 44], [CX - 10, ty + 42], [CX - 34, ty + 44], [CX - cw + 4, tY - 8]];
      const cap = capWith(hairline);
      const edge: Pt[] = [[CX - cw - 4, tY + 20], [CX - cw + 4, tY - 8], [CX - 34, ty + 44], [CX - 10, ty + 42], [CX + 12, ty + 44], [CX + 34, ty + 40], [CX + cw - 4, tY - 8], [CX + cw + 4, tY + 20]];
      return {
        back: '',
        front: p.part(cap, fill, fan(p, [CX + 6, ty - 4], 30, edge, 80, cols, 4) + p.stroke(`M${CX - 50} ${ty + 14}C${CX - 20} ${ty - 6} ${CX + 20} ${ty - 6} ${CX + 50} ${ty + 14}`, lt, 9, 0.5, 6) + p.glow(CX + cw, tY, 20, 40, dk, 0.5, 8)) + p.stroke(smooth([[CX + cw - 10, ty + 4], [CX + cw + 8, tY - 20], [CX + cw + 6, tY + 26]]), rim, 2.5, 0.55, 2),
        shadow: cap,
        ears: true,
      };
    }
    case 'shaved': {
      const hairline: Pt[] = [[CX + cw - 4, tY - 6], [CX + 30, ty + 34], [CX, ty + 30], [CX - 30, ty + 34], [CX - cw + 4, tY - 6]];
      const cap = smooth([[CX - cw - 2, tY + 22], [CX - cw - 3, tY - 20], [CX - cw + 12, ty + 6], [CX - 30, ty - 4], [CX + 30, ty - 4], [CX + cw - 12, ty + 6], [CX + cw + 3, tY - 20], [CX + cw + 2, tY + 22], ...hairline], true);
      let dots = '';
      if (!p.lite) for (let i = 0; i < 160; i++) dots += `<circle cx="${n1(CX - cw + p.rnd() * cw * 2)}" cy="${n1(ty - 6 + p.rnd() * (tY - ty + 30))}" r="0.9" fill="${dk}" opacity="0.5"/>`;
      return {
        back: '',
        front: `<g opacity="0.7">${p.part(cap, fill, dots + p.glow(CX - 20, ty + 10, 40, 16, lt, 0.4, 8))}</g>`,
        shadow: null,
        ears: true,
      };
    }
    case 'ponytail':
    case 'braids': {
      const braids = look.hair === 'braids';
      const hairline: Pt[] = braids
        ? [[CX + cw - 4, tY - 4], [CX + 40, ty + 36], [CX + 2, ty + 26], [CX - 2, ty + 26], [CX - 40, ty + 36], [CX - cw + 4, tY - 4]]
        : [[CX + cw - 4, tY - 4], [CX + 36, ty + 30], [CX, ty + 24], [CX - 36, ty + 30], [CX - cw + 4, tY - 4]];
      const cap = capWith(hairline, ty - 12);
      const edge: Pt[] = [[CX - cw - 4, tY + 20], [CX - cw + 4, tY - 4], [CX - 36, ty + 30], [CX, ty + 25], [CX + 36, ty + 30], [CX + cw - 4, tY - 4], [CX + cw + 4, tY + 20]];
      const capPaint = p.part(cap, fill, fan(p, braids ? [CX, ty + 26] : [CX + 30, ty - 30], braids ? 4 : 40, braids ? edge : edge.map(([x, y]): Pt => [x, y - 40]), 70, cols, braids ? 14 : 6) + p.stroke(`M${CX - 50} ${ty + 10}C${CX - 20} ${ty - 8} ${CX + 20} ${ty - 8} ${CX + 50} ${ty + 10}`, lt, 9, 0.5, 6));
      let back = '';
      let extra = '';
      if (braids) {
        for (const s of [-1, 1]) {
          const x0 = CX + s * (cw + 4);
          for (let i = 0; i < 11; i++) {
            const y = tY + 40 + i * 22;
            const r = 13 - i * 0.35;
            const side = i % 2 ? 1 : -1;
            const bx = x0 + side * r * 0.32;
            const lobe = `M${bx - r} ${y - r * 0.9}C${bx - r * 0.4} ${y - r * 1.3} ${bx + r * 1.1} ${y - r * 0.4} ${bx + r * 0.9} ${y + r * 0.6}C${bx + r * 0.4} ${y + r * 1.2} ${bx - r * 1.1} ${y + r * 0.2} ${bx - r} ${y - r * 0.9}Z`;
            const lines = p.lite ? '' : [-0.4, 0, 0.4].map((f) => `<path d="M${n1(bx - r * 0.8)} ${n1(y - r * (0.7 - f))}Q${n1(bx)} ${n1(y - r * (0.5 - f))} ${n1(bx + r * 0.7)} ${n1(y + r * (0.4 + f))}" stroke="${lt}" stroke-width="1.4" fill="none" opacity="0.45"/>`).join('');
            extra += `<g transform="${side > 0 ? '' : `matrix(-1 0 0 1 ${2 * x0} 0)`}">${p.part(lobe, fill, lines + p.glow(bx + r * 0.5, y + r * 0.5, r * 0.6, r * 0.4, dk, 0.6, 5))}</g>`;
          }
          const tip = tY + 40 + 11 * 22;
          extra += `<path d="M${x0 - 10} ${tip - 6}Q${x0} ${tip + 26} ${x0 + 10} ${tip - 6}Z" fill="${c}"/><circle cx="${x0}" cy="${tip - 8}" r="7" fill="#E2B04A"/>`;
        }
      } else {
        const tail = smooth([[196, ty + 20], [236, ty + 30], [252, 120], [246, 200], [262, 270], [240, 330], [222, 300], [214, 230], [206, 150], [196, 90]], true);
        back = p.part(tail, fill, strands(p, [[198, ty + 26], [214, 90], [222, 160], [228, 230], [234, 300]], [[236, ty + 32], [250, 120], [248, 200], [258, 270], [244, 326]], 30, cols, 6) + p.glow(250, 220, 20, 90, dk, 0.5, 10));
        extra = `<ellipse cx="200" cy="${ty + 28}" rx="10" ry="13" fill="#D9677A"/><ellipse cx="197" cy="${ty + 23}" rx="4" ry="3" fill="#FFFFFF" opacity="0.35"/>`;
      }
      return { back, front: capPaint + extra, shadow: cap, ears: true };
    }
  }
}

// ---------------------------------------------------------------------------
// Body and clothes.
// ---------------------------------------------------------------------------
type Paints = { p: Painter; k: Skin; o: OutfitArt };

function legs({ p, k, o }: Paints): string {
  const { hy, ky, fy, lw, hw } = BODY;
  let out = '';
  if (o.lower.kind === 'tail') {
    const c = o.lower.color;
    const d = `M${CX - hw - 6} ${hy - 20}C${CX - hw - 10} ${ky} ${CX - 40} ${fy - 120} ${CX - 14} ${fy - 50}L${CX - 70} ${fy}C${CX - 30} ${fy + 6} ${CX - 8} ${fy - 10} ${CX} ${fy - 26}C${CX + 8} ${fy - 10} ${CX + 30} ${fy + 6} ${CX + 70} ${fy}L${CX + 14} ${fy - 50}C${CX + 40} ${fy - 120} ${CX + hw + 10} ${ky} ${CX + hw + 6} ${hy - 20}Z`;
    let scales = '';
    for (let y = hy + 10; y < fy - 80; y += 34) scales += `<path d="M${CX - hw} ${y}Q${CX} ${y + 22} ${CX + hw} ${y}" stroke="${mix(c, '#FFFFFF', 0.35)}" stroke-width="4" fill="none" opacity="0.6"/>`;
    return p.part(d, c, scales + p.glow(CX + hw * 0.6, (hy + fy) / 2, hw * 0.4, (fy - hy) * 0.5, mix(c, '#000000', 0.5), 0.5, 14) + p.glow(CX - hw * 0.4, ky - 60, hw * 0.25, 100, '#FFFFFF', 0.3, 10));
  }
  const legColor = o.legs ?? k.base;
  const covered = o.legs !== undefined;
  const sd = covered ? mix(legColor, '#000000', 0.4) : k.shadow;
  const sl = covered ? mix(legColor, '#FFFFFF', 0.2) : k.lit;
  for (const s of [-1, 1]) {
    const x = CX + s * hw * 0.5;
    const pts: Pt[] = [[x, hy - 10], [x - s * 2, (hy + ky) / 2], [x - s * 3, ky], [x - s * 2, (ky + fy) / 2 - 20], [x, fy - 30]];
    const w = [lw * 0.5, lw * 0.47, lw * 0.37, lw * 0.39, lw * 0.26];
    out += p.part(
      limbPath(pts, w),
      legColor,
      p.stroke(smooth(offsetLine(pts, w, 0.75)), sd, lw * 0.3, 0.75, 8) +
        p.stroke(smooth(offsetLine(pts, w, -0.45)), sl, lw * 0.1, 0.5, 4) +
        p.glow(x - s * 3, ky + 20, lw * 0.3, 8, sd, 0.35, 4),
    );
    // A chunky sneaker.
    const sx = x + s * 6;
    const sh = lw * 1.5;
    const shoe = `M${sx - sh * 0.5} ${fy}C${sx - sh * 0.55} ${fy - 44} ${sx + sh * 0.15} ${fy - 50} ${sx + sh * 0.5} ${fy - 16}C${sx + sh * 0.62} ${fy - 6} ${sx + sh * 0.6} ${fy} ${sx + sh * 0.52} ${fy}Z`;
    out += p.part(shoe, o.shoes, p.glow(sx - sh * 0.15, fy - 36, sh * 0.2, 8, '#FFFFFF', 0.45, 4) + p.glow(sx + sh * 0.35, fy - 10, sh * 0.3, 16, '#000000', 0.3, 6));
    out += `<path d="M${sx - sh * 0.54} ${fy - 9}H${sx + sh * 0.6}V${fy + 3}Q${sx} ${fy + 7} ${sx - sh * 0.54} ${fy + 3}Z" fill="#EFE8DC"/>`;
    out += `<path d="M${sx - 6} ${fy - 34}l12 5M${sx - 3} ${fy - 42}l12 5" stroke="#F7F1E6" stroke-width="3" stroke-linecap="round" opacity="0.85"/>`;
  }
  return out;
}

function lowerGarment({ p, o }: Paints): string {
  const { wy, ww, hy, hw, ky, fy, lw } = BODY;
  const c = o.lower.color;
  const dk = mix(c, '#000000', 0.4);
  const lt = mix(c, '#FFFFFF', 0.15);
  const shade2 = (top: number, bottom: number, wide: number) =>
    p.glow(CX + wide * 0.85, (top + bottom) / 2, wide * 0.45, (bottom - top) * 0.6, dk, 0.6, 12) + p.glow(CX - wide * 0.55, top + 30, wide * 0.3, 30, lt, 0.5, 8);
  switch (o.lower.kind) {
    case 'shorts': {
      const d = `M${CX - ww} ${wy}H${CX + ww}C${CX + hw + 4} ${hy - 10} ${CX + hw + 8} ${hy + 40} ${CX + hw + 8} ${hy + 60}Q${CX + hw * 0.4} ${hy + 70} ${CX + 4} ${hy + 58}L${CX} ${hy + 16}L${CX - 4} ${hy + 58}Q${CX - hw * 0.4} ${hy + 70} ${CX - hw - 8} ${hy + 60}C${CX - hw - 8} ${hy + 40} ${CX - hw - 4} ${hy - 10} ${CX - ww} ${wy}Z`;
      return p.part(d, c, shade2(wy, hy + 70, hw) + p.stroke(`M${CX} ${hy - 10}V${hy + 20}`, dk, 4, 0.7, 2));
    }
    case 'pants': {
      let out = '';
      for (const s of [-1, 1]) {
        const x = CX + s * hw * 0.5;
        const pts: Pt[] = [[x, hy - 10], [x - s * 2, (hy + ky) / 2], [x - s * 3, ky], [x - s * 2, (ky + fy) / 2 - 20], [x, fy - 34]];
        const w = [lw * 0.6, lw * 0.56, lw * 0.47, lw * 0.46, lw * 0.4];
        out += p.part(limbPath(pts, w), c, p.stroke(smooth(offsetLine(pts, w, 0.75)), dk, lw * 0.3, 0.7, 8) + p.stroke(smooth(offsetLine(pts, w, -0.4)), lt, lw * 0.1, 0.5, 4));
      }
      out += p.part(`M${CX - ww} ${wy}H${CX + ww}C${CX + hw + 4} ${hy - 10} ${CX + hw + 6} ${hy + 30} ${CX + hw + 4} ${hy + 50}H${CX - hw - 4}C${CX - hw - 6} ${hy + 30} ${CX - hw - 4} ${hy - 10} ${CX - ww} ${wy}Z`, c, shade2(wy, hy + 50, hw));
      return out;
    }
    case 'skirt':
    case 'dress':
    case 'robe': {
      const bottom = o.lower.kind === 'skirt' ? hy + 120 : o.lower.kind === 'dress' ? ky - 10 : fy - 40;
      const flare = o.lower.kind === 'robe' ? hw + 24 : hw + 40;
      const top = o.lower.kind === 'skirt' ? wy : wy - 60;
      const d = `M${CX - ww} ${top}H${CX + ww}C${CX + hw} ${hy} ${CX + flare} ${bottom - 40} ${CX + flare} ${bottom}Q${CX} ${bottom + 18} ${CX - flare} ${bottom}C${CX - flare} ${bottom - 40} ${CX - hw} ${hy} ${CX - ww} ${top}Z`;
      let folds = '';
      for (const f of [-0.55, 0, 0.55]) folds += p.stroke(`M${CX + f * ww} ${wy + 20}L${CX + f * flare * 1.05} ${bottom}`, dk, 6, 0.35, 6);
      return p.part(d, c, folds + shade2(top, bottom, flare));
    }
    default:
      return '';
  }
}

const TORSO_PATH = (() => {
  const { sy: y, sw: w, wy, ww, aw } = BODY;
  return `M${CX - 30} ${y - 8}Q${CX} ${y + 10} ${CX + 30} ${y - 8}C${CX + w * 0.7} ${y - 6} ${CX + w + 8} ${y} ${CX + w + 8} ${y + 34}C${CX + w + 4} ${y + 70} ${CX + w - aw * 0.4} ${y + 120} ${CX + ww + 8} ${wy - 30}L${CX + ww + 8} ${wy + 16}Q${CX} ${wy + 28} ${CX - ww - 8} ${wy + 16}L${CX - ww - 8} ${wy - 30}C${CX - w + aw * 0.4} ${y + 120} ${CX - w - 4} ${y + 70} ${CX - w - 8} ${y + 34}C${CX - w - 8} ${y} ${CX - w * 0.7} ${y - 6} ${CX - 30} ${y - 8}Z`;
})();

function torso({ p, o }: Paints): string {
  const { sy: y, sw: w, wy, ww } = BODY;
  const c = o.shirt;
  const dk = mix(c, '#20101A', 0.38);
  const lt = mix(c, '#FFFFFF', 0.3);
  const extra = o.extra ? `<g transform="${TORSO_FIT}">${o.extra}</g>` : '';
  return (
    p.part(
      TORSO_PATH,
      c,
      extra +
        p.glow(CX + w + 10, (y + wy) / 2, w * 0.45, (wy - y) * 0.7, dk, 0.6, 14) +
        p.glow(CX - w * 0.45, y + 34, w * 0.45, 30, lt, 0.5, 14) +
        p.stroke(`M${CX - ww - 8} ${wy + 6}Q${CX} ${wy + 22} ${CX + ww + 8} ${wy + 6}`, dk, 8, 0.5, 4) +
        p.stroke(`M${CX - 24} ${y + 2}Q${CX} ${y + 26} ${CX + 24} ${y + 2}`, dk, 8, 0.5, 4) +
        p.stroke(`M${CX - w * 0.2} ${y + 90}Q${CX - w * 0.05} ${y + 120} ${CX - w * 0.25} ${y + 150}`, dk, 4, 0.25, 6),
    ) + `<path d="M${CX - 30} ${y - 8}Q${CX} ${y + 10} ${CX + 30} ${y - 8}" stroke="${dk}" stroke-width="6" fill="none"/>`
  );
}

function arm({ p, k, o }: Paints, pts: Pt[], s: -1 | 1): string {
  const w = ARM_W;
  let out = p.part(
    limbPath(pts, w),
    k.base,
    p.stroke(smooth(offsetLine(pts, w, 0.7)), k.shadow, BODY.aw * 0.28, s > 0 ? 0.8 : 0.55, 6) + p.stroke(smooth(offsetLine(pts, w, -0.45)), k.lit, BODY.aw * 0.1, 0.5, 4),
  );
  // Sleeves.
  if (o.sleeves !== 'none') {
    const sleeve = o.sleeveColor ?? o.shirt;
    const sdk = mix(sleeve, '#20101A', 0.38);
    const sp: Pt[] =
      o.sleeves === 'long'
        ? pts.map(([x, y], i): Pt => (i === 2 ? [pts[1][0] + (x - pts[1][0]) * 0.9, pts[1][1] + (y - pts[1][1]) * 0.9] : [x, y]))
        : [pts[0], [pts[0][0] + (pts[1][0] - pts[0][0]) * 0.5, pts[0][1] + (pts[1][1] - pts[0][1]) * 0.5]];
    const sw2 = o.sleeves === 'long' ? [w[0] + 6, w[1] + 6, w[2] + 5] : [w[0] + 8, w[0] + 7];
    out += p.part(limbPath(sp, sw2), sleeve, p.stroke(smooth(offsetLine(sp, sw2, 0.7)), sdk, BODY.aw * 0.3, 0.7, 6) + p.stroke(smooth(offsetLine(sp, sw2, -0.4)), mix(sleeve, '#FFFFFF', 0.3), BODY.aw * 0.12, 0.5, 4));
  }
  // Hand: a soft mitten with finger creases and a thumb.
  const [hx, hy] = handAt(pts);
  const a = BODY.aw;
  const ang = (Math.atan2(hy - pts[2][1], hx - pts[2][0]) * 180) / Math.PI - 90;
  const hand = `M${hx - a * 0.42} ${hy - a * 0.55}C${hx - a * 0.6} ${hy} ${hx - a * 0.45} ${hy + a * 0.75} ${hx} ${hy + a * 0.78}C${hx + a * 0.45} ${hy + a * 0.75} ${hx + a * 0.6} ${hy} ${hx + a * 0.42} ${hy - a * 0.55}Z`;
  out += `<g transform="rotate(${n1(ang)} ${n1(hx)} ${n1(hy)})">`;
  out += p.part(hand, k.base, p.glow(hx + s * a * 0.3, hy + a * 0.2, a * 0.3, a * 0.6, k.shadow, 0.6, 4) + [-1, 0, 1].map((i) => `<path d="M${n1(hx + i * a * 0.2)} ${n1(hy + a * 0.25)}L${n1(hx + i * a * 0.22)} ${n1(hy + a * 0.75)}" stroke="${k.shadow}" stroke-width="2" opacity="0.5"/>`).join(''));
  out += `<ellipse cx="${n1(hx - s * a * 0.42)}" cy="${n1(hy - a * 0.05)}" rx="${n1(a * 0.17)}" ry="${n1(a * 0.36)}" fill="${mix(k.base, k.lit, 0.3)}" transform="rotate(${-s * 18} ${n1(hx - s * a * 0.42)} ${n1(hy)})"/>`;
  out += '</g>';
  return out;
}

// ---------------------------------------------------------------------------
// The whole figure.
// ---------------------------------------------------------------------------

type Options = {
  pose?: Pose;
  /** 'full' (default): the whole figure. 'bust': head and shoulders, for round profile pictures. */
  crop?: 'full' | 'bust';
  /** Shadow under the feet (full crop only). */
  shadow?: boolean;
  /** 'lite' skips the finest texture, for small figures (map markers, grids). */
  detail?: 'full' | 'lite';
};

function fit(slot: 'hat' | 'back', itemId: string): string {
  return ITEM_FIT[itemId] ?? (slot === 'hat' ? HAT_FIT : BACK_FIT);
}

/** The avatar's inner SVG markup on the 120 × 168 canvas. */
export function avatarMarkup(look: AvatarLook, { pose = 'stand', shadow = true, detail = 'full' }: Options = {}): string {
  const p = new Painter(detail === 'lite', seeded(`${look.hair}|${look.hairColor}|${look.skin}`));
  const k = skinSet(SKIN_TONES[look.skin]);
  const outfit = ITEM_ART[look.outfit]?.outfit ?? ITEM_ART[DEFAULT_LOOK.outfit].outfit!;
  const hat = look.hat ? ITEM_ART[look.hat] : undefined;
  const back = look.back ? ITEM_ART[look.back] : undefined;
  const held = look.held ? ITEM_ART[look.held] : undefined;
  const arms = ARMS[pose];
  const paints: Paints = { p, k, o: outfit };
  const h = hair(p, look);

  let o = '';
  if (shadow) o += p.glow(CX, BODY.fy + 4, 90, 9, '#1B2340', 0.2, 8);
  if (back?.svg) {
    let art = back.svg;
    if (look.back && CAPES.has(look.back)) {
      const c = p.uid();
      p.def(`<clipPath id="${c}"><rect x="-40" y="86" width="200" height="120"/></clipPath>`);
      art = `<g clip-path="url(#${c})">${art}</g>`;
    }
    o += `<g transform="${fit('back', look.back ?? '')}">${art}</g>`;
  }
  o += h.back;
  o += legs(paints);
  o += lowerGarment(paints);
  o += neck(p, k);
  o += torso(paints);
  o += arm(paints, arms.left, -1);
  o += arm(paints, arms.right, 1);
  if (back?.front) o += `<g transform="${fit('back', look.back ?? '')}">${back.front}</g>`;
  if (h.ears) o += ears(p, k);
  o += face(p, look, k, h.shadow);
  o += h.front;
  o += brows(p, look);
  if (hat?.svg) o += `<g transform="${fit('hat', look.hat ?? '')}">${hat.svg}</g>`;
  // Held items last, so balloons and lamps stay in front of the head.
  if (held?.svg) {
    const [hx, hy] = handAt(arms.right);
    o += `<g transform="translate(${n1(hx)} ${n1(hy)}) scale(${HELD_SCALE})">${held.svg}</g>`;
  }
  return `${p.defsMarkup()}<g transform="${TO_CANVAS}">${o}</g>`;
}

/** Profile-picture crop: head and shoulders, on the canvas. */
const BUST_VIEWBOX = (() => {
  const x = 60 + (-5 - CX) * SCALE;
  const y = AVATAR_FEET_Y - (BODY.fy + 4) * SCALE;
  const s = 250 * SCALE;
  return `${n1(x * 10) / 10} ${n1(y * 10) / 10} ${n1(s * 10) / 10} ${n1(s * 10) / 10}`;
})();

/** The avatar as a complete SVG document. */
export function avatarSvg(look: AvatarLook, options: Options = {}): string {
  const viewBox = options.crop === 'bust' ? BUST_VIEWBOX : `0 0 ${AVATAR_CANVAS.width} ${AVATAR_CANVAS.height}`;
  const markup = avatarMarkup(look, { ...options, shadow: options.crop === 'bust' ? false : options.shadow });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${markup}</svg>`;
}
