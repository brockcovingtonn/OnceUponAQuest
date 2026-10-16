/**
 * The explorer avatar, in an animated-movie style: a big-headed kid (about
 * 1 : 3) with large sparkly eyes, soft shading, glossy hair and chunky
 * sneakers. All original artwork, drawn as plain SVG on a 120 × 168 canvas so
 * the same drawing works in the app (SvgXml), on the map, on share cards, and
 * in preview scripts.
 *
 * Hard rules: no character likenesses (the style is a general animated-film
 * look, never a copy of any studio's characters), no mouse ears or
 * three-circle shapes (so no buns or round ears on top of the head), and
 * outfits follow the public-domain books' own descriptions rather than any
 * film's designs.
 *
 * The look (skin, hair, eyes) is free to change. Clothes come from the
 * wardrobe (src/art/avatarItems.ts); the database checks what you own.
 * Wardrobe art was drawn for the first chibi body; it's fitted onto this one
 * with per-slot transforms below (ITEM_FIT).
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

const INK = '#2A2A33';

// ---------------------------------------------------------------------------
// The body's measurements.
// ---------------------------------------------------------------------------
const HX = 60; // head center
const HY = 48;
const RX = 27; // face half-width
const RY = 28.5; // face half-height
const EYE_Y = HY + 4;
const EYE_GAP = 11.5;
const EYE_R = 7;
const T = 86; // top of the torso (shoulders)
const B = 116; // waist
const F = AVATAR_FEET_Y; // soles
const LEG_W = 9.5;
const ARM_W = 7.5;

type Arm = { shoulder: [number, number]; elbow: [number, number]; hand: [number, number] };
const ARMS: Record<Pose, { left: Arm; right: Arm }> = {
  stand: {
    left: { shoulder: [43, T + 6], elbow: [39, (T + B) / 2 + 2], hand: [41, B + 2] },
    right: { shoulder: [77, T + 6], elbow: [81, (T + B) / 2 + 2], hand: [79, B + 2] },
  },
  cheer: {
    left: { shoulder: [43, T + 6], elbow: [32, T - 6], hand: [30, T - 22] },
    right: { shoulder: [77, T + 6], elbow: [88, T - 6], hand: [90, T - 22] },
  },
  wave: {
    left: { shoulder: [43, T + 6], elbow: [39, (T + B) / 2 + 2], hand: [41, B + 2] },
    right: { shoulder: [77, T + 6], elbow: [89, T - 2], hand: [93, T - 18] },
  },
};

/**
 * Wardrobe art was drawn on the first (chibi) body: head centered at 60,52,
 * torso from y 84 to 106, feet at 132. These transforms fit it to this body.
 */
const FIT = {
  hat: 'translate(0 -4)',
  // Stretch the old torso (84 → 106) over the new one (86 → 116).
  outfit: `matrix(1 0 0 ${(B - T) / 22} 0 ${T - 84 * ((B - T) / 22)})`,
  // Back items grow a little and reach further down.
  back: `matrix(1.1 0 0 1.45 ${60 - 60 * 1.1} ${T - 84 * 1.45})`,
};
/** Items that need their own fit. */
const ITEM_FIT: Record<string, string> = {
  'flying-carpet': 'matrix(1.05 0 0 1 -3 27)',
  'robot-pal': 'translate(0 40)',
  'shoulder-parrot': 'translate(0 4)',
  'canoe-paddle': 'matrix(1 0 0 1.3 0 -22)',
  'riding-hood-cape': 'matrix(1.08 0 0 1.2 -4.8 4.4)',
  'fishing-hat': 'translate(0 -7)',
};

let uid = 0;

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * (1 + amount))));
  const r = f(n >> 16);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ---------------------------------------------------------------------------
// Hair: a back layer (behind the head/body) and a front layer (over the head).
// ---------------------------------------------------------------------------

function hairBack(style: AvatarLook['hair'], fill: string): string {
  switch (style) {
    case 'bob':
      return `<path d="M${HX - RX - 4} ${HY} C${HX - RX - 6} ${HY - RY - 8} ${HX + RX + 6} ${HY - RY - 8} ${HX + RX + 4} ${HY} L${HX + RX + 5} ${HY + 22} C${HX + RX + 2} ${HY + 28} ${HX + 14} ${HY + 27} ${HX + 10} ${HY + 22} H${HX - 10} C${HX - 14} ${HY + 27} ${HX - RX - 2} ${HY + 28} ${HX - RX - 5} ${HY + 22} Z" fill="${fill}"/>`;
    case 'long':
      return `<path d="M${HX - RX - 3} ${HY} C${HX - RX - 5} ${HY - RY - 8} ${HX + RX + 5} ${HY - RY - 8} ${HX + RX + 3} ${HY} L${HX + RX + 7} ${T + 32} C${HX + 12} ${T + 38} ${HX - 12} ${T + 38} ${HX - RX - 7} ${T + 32} Z" fill="${fill}"/>`;
    case 'curls': {
      let bumps = '';
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        bumps += `<circle cx="${(HX + Math.cos(a) * (RX + 3)).toFixed(1)}" cy="${(HY - 3 + Math.sin(a) * (RY + 1)).toFixed(1)}" r="10.5"/>`;
      }
      return `<g fill="${fill}">${bumps}<ellipse cx="${HX}" cy="${HY - 3}" rx="${RX + 4}" ry="${RY + 2}"/></g>`;
    }
    case 'ponytail':
      return `<path d="M${HX + RX - 6} ${HY - 18} C${HX + RX + 16} ${HY - 18} ${HX + RX + 18} ${HY + 8} ${HX + RX + 12} ${HY + 30} C${HX + RX + 10} ${HY + 38} ${HX + RX + 2} ${HY + 40} ${HX + RX} ${HY + 36} C${HX + RX + 6} ${HY + 20} ${HX + RX + 4} ${HY} ${HX + RX - 6} ${HY - 8} Z" fill="${fill}"/>`;
    case 'braids':
      return `<path d="M${HX - RX - 2} ${HY + 4} C${HX - RX - 4} ${HY - RY - 6} ${HX + RX + 4} ${HY - RY - 6} ${HX + RX + 2} ${HY + 4} Z" fill="${fill}"/>`;
    default:
      return '';
  }
}

function hairFront(style: AvatarLook['hair'], fill: string, dark: string): string {
  const shine = (d: string) => `<path d="${d}" stroke="#FFFFFF" stroke-width="2.2" opacity="0.32" fill="none" stroke-linecap="round"/>`;
  switch (style) {
    case 'crop':
      return (
        `<path d="M${HX - RX} ${HY - 2} C${HX - RX - 2} ${HY - RY - 8} ${HX + RX + 2} ${HY - RY - 8} ${HX + RX} ${HY - 2} C${HX + RX - 4} ${HY - 16} ${HX + 8} ${HY - 18} ${HX} ${HY - 14} C${HX - 8} ${HY - 18} ${HX - RX + 4} ${HY - 16} ${HX - RX} ${HY - 2} Z" fill="${fill}"/>` +
        shine(`M${HX - 10} ${HY - RY + 1} Q${HX} ${HY - RY - 4} ${HX + 12} ${HY - RY + 2}`)
      );
    case 'swoop':
      return (
        `<path d="M${HX - RX - 1} ${HY + 2} C${HX - RX - 3} ${HY - RY - 8} ${HX + RX + 4} ${HY - RY - 9} ${HX + RX + 1} ${HY + 2} C${HX + RX - 3} ${HY - 13} ${HX + 6} ${HY - 14} ${HX - 4} ${HY - 10} C${HX - 12} ${HY - 7} ${HX - RX + 2} ${HY - 10} ${HX - RX - 1} ${HY + 2} Z" fill="${fill}"/>` +
        `<path d="M${HX - 6} ${HY - 12} Q${HX + 6} ${HY - 22} ${HX + RX - 2} ${HY - 10}" stroke="${dark}" stroke-width="1.4" fill="none"/>` +
        shine(`M${HX - 8} ${HY - RY + 2} Q${HX + 4} ${HY - RY - 2} ${HX + 14} ${HY - RY + 6}`)
      );
    case 'bob':
      return (
        `<path d="M${HX - RX - 3} ${HY + 4} C${HX - RX - 5} ${HY - RY - 8} ${HX + RX + 5} ${HY - RY - 8} ${HX + RX + 3} ${HY + 4} C${HX + RX - 2} ${HY - 10} ${HX + RX - 6} ${HY - 13} ${HX + RX - 8} ${HY - 14} H${HX - RX + 8} C${HX - RX + 6} ${HY - 13} ${HX - RX + 2} ${HY - 10} ${HX - RX - 3} ${HY + 4} Z" fill="${fill}"/>` +
        `<path d="M${HX - RX + 8} ${HY - 14} C${HX - 8} ${HY - 17} ${HX + 8} ${HY - 17} ${HX + RX - 8} ${HY - 14}" stroke="${dark}" stroke-width="1.3" fill="none"/>` +
        shine(`M${HX - 12} ${HY - RY + 3} Q${HX - 4} ${HY - RY - 2} ${HX + 6} ${HY - RY + 1}`)
      );
    case 'long':
      return (
        `<path d="M${HX - RX - 2} ${HY + 6} C${HX - RX - 4} ${HY - RY - 8} ${HX + RX + 4} ${HY - RY - 8} ${HX + RX + 2} ${HY + 6} C${HX + RX - 4} ${HY - 8} ${HX + 4} ${HY - 16} ${HX} ${HY - 19} C${HX - 4} ${HY - 16} ${HX - RX + 4} ${HY - 8} ${HX - RX - 2} ${HY + 6} Z" fill="${fill}"/>` +
        shine(`M${HX - 12} ${HY - RY + 3} Q${HX - 4} ${HY - RY - 2} ${HX + 6} ${HY - RY + 1}`)
      );
    case 'curls':
      return `<path d="M${HX - RX + 1} ${HY - 4} C${HX - RX + 2} ${HY - RY - 4} ${HX + RX - 2} ${HY - RY - 4} ${HX + RX - 1} ${HY - 4} C${HX + 8} ${HY - 15} ${HX - 8} ${HY - 15} ${HX - RX + 1} ${HY - 4} Z" fill="${fill}"/>`;
    case 'ponytail':
      return (
        `<path d="M${HX - RX} ${HY - 2} C${HX - RX - 2} ${HY - RY - 8} ${HX + RX + 2} ${HY - RY - 8} ${HX + RX} ${HY - 2} C${HX + RX - 4} ${HY - 14} ${HX + 10} ${HY - 16} ${HX - 2} ${HY - 15} C${HX - 12} ${HY - 15} ${HX - RX + 4} ${HY - 12} ${HX - RX} ${HY - 2} Z" fill="${fill}"/>` +
        `<ellipse cx="${HX + RX - 3}" cy="${HY - 16}" rx="3.6" ry="3" fill="#D9677A"/>` +
        shine(`M${HX - 10} ${HY - RY + 1} Q${HX} ${HY - RY - 4} ${HX + 12} ${HY - RY + 2}`)
      );
    case 'braids':
      return (
        `<path d="M${HX - RX} ${HY - 2} C${HX - RX - 2} ${HY - RY - 8} ${HX + RX + 2} ${HY - RY - 8} ${HX + RX} ${HY - 2} C${HX + RX - 6} ${HY - 15} ${HX + 10} ${HY - 17} ${HX} ${HY - 17} C${HX - 10} ${HY - 17} ${HX - RX + 6} ${HY - 15} ${HX - RX} ${HY - 2} Z" fill="${fill}"/>` +
        `<path d="M${HX} ${HY - RY - 4} V${HY - 17}" stroke="${dark}" stroke-width="1.4"/>` +
        [HX - RX - 3, HX + RX + 3]
          .map(
            (x) =>
              `<g fill="${fill}"><ellipse cx="${x}" cy="${HY + 10}" rx="5.4" ry="6.4"/><ellipse cx="${x}" cy="${HY + 21}" rx="5" ry="6"/><ellipse cx="${x}" cy="${HY + 31}" rx="4.6" ry="5.4"/><ellipse cx="${x}" cy="${HY + 40}" rx="4.2" ry="5"/></g><circle cx="${x}" cy="${HY + 47}" r="2.8" fill="#E2B04A"/>`,
          )
          .join('')
      );
    default:
      return `<path d="M${HX - RX + 2} ${HY - 6} C${HX - RX + 4} ${HY - RY - 2} ${HX + RX - 4} ${HY - RY - 2} ${HX + RX - 2} ${HY - 6} C${HX + 10} ${HY - 16} ${HX - 10} ${HY - 16} ${HX - RX + 2} ${HY - 6} Z" fill="${fill}" opacity="0.3"/>`;
  }
}

// ---------------------------------------------------------------------------
// Face.
// ---------------------------------------------------------------------------

function face(look: AvatarLook, skin: string, id: string): string {
  const sk2 = shade(skin, -0.16);
  let out = '';
  // Small human ears at the sides, level with the eyes (never on top).
  out += `<ellipse cx="${HX - RX + 1}" cy="${EYE_Y + 3}" rx="3.8" ry="5.6" fill="${sk2}"/><ellipse cx="${HX + RX - 1}" cy="${EYE_Y + 3}" rx="3.8" ry="5.6" fill="${sk2}"/>`;
  // Face: round cheeks, a soft chin, lit from the upper left.
  out += `<path d="M${HX - RX} ${HY - 2} C${HX - RX} ${HY - RY - 2} ${HX + RX} ${HY - RY - 2} ${HX + RX} ${HY - 2} C${HX + RX} ${HY + RY * 0.7} ${HX + RX * 0.45} ${HY + RY} ${HX} ${HY + RY} C${HX - RX * 0.45} ${HY + RY} ${HX - RX} ${HY + RY * 0.7} ${HX - RX} ${HY - 2} Z" fill="url(#${id}s)"/>`;
  // Cheeks and freckles.
  out += `<ellipse cx="${HX - EYE_GAP - 3}" cy="${EYE_Y + 12}" rx="6.4" ry="3.8" fill="#E98AA0" opacity="0.4"/><ellipse cx="${HX + EYE_GAP + 3}" cy="${EYE_Y + 12}" rx="6.4" ry="3.8" fill="#E98AA0" opacity="0.4"/>`;
  if (look.freckles) {
    out += `<g fill="${shade(skin, -0.35)}" opacity="0.65">${[-1, 1]
      .map((s) => [0, 1, 2].map((i) => `<circle cx="${HX + s * (EYE_GAP + 1 + i * 2.4)}" cy="${EYE_Y + 10 + (i % 2) * 2}" r="0.8"/>`).join(''))
      .join('')}</g>`;
  }
  // Eyes.
  for (const s of [-1, 1]) {
    const cx = HX + s * EYE_GAP;
    const ey = EYE_Y;
    const er = EYE_R;
    if (look.eyes === 'happy') {
      out += `<path d="M${cx - er * 0.85} ${ey + 1} Q${cx} ${ey - er * 0.9} ${cx + er * 0.85} ${ey + 1}" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      out += `<path d="M${cx + s * er * 0.85} ${ey} l${s * 2.2} -1.6" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>`;
    } else {
      out += `<ellipse cx="${cx}" cy="${ey}" rx="${er * 0.86}" ry="${er}" fill="#FFFFFF"/>`;
      out += `<ellipse cx="${cx}" cy="${ey - er * 0.55}" rx="${er * 0.8}" ry="${er * 0.4}" fill="${sk2}" opacity="0.22"/>`;
      out += `<circle cx="${cx + s * 0.4}" cy="${ey + er * 0.12}" r="${er * 0.74}" fill="url(#${id}i)"/>`;
      out += `<circle cx="${cx + s * 0.4}" cy="${ey + er * 0.12}" r="${er * 0.74}" fill="none" stroke="#000000" stroke-opacity="0.3" stroke-width="0.7"/>`;
      out += `<circle cx="${cx + s * 0.4}" cy="${ey + er * 0.16}" r="${er * 0.36}" fill="#1A1A22"/>`;
      out += `<circle cx="${cx + er * 0.25}" cy="${ey - er * 0.25}" r="${er * 0.24}" fill="#FFFFFF"/><circle cx="${cx - er * 0.28}" cy="${ey + er * 0.42}" r="${er * 0.1}" fill="#FFFFFF"/>`;
      if (look.eyes === 'sparkle') {
        out += `<path d="M${cx - er * 0.3} ${ey + er * 0.05} l0.9 -2 0.9 2 2 0.9 -2 0.9 -0.9 2 -0.9 -2 -2 -0.9 Z" fill="#FFFFFF" opacity="0.9"/>`;
      }
      // Upper lid and a little lash flick.
      out += `<path d="M${cx - er * 0.95} ${ey - er * 0.2} Q${cx} ${ey - er * 1.25} ${cx + er * 0.95} ${ey - er * 0.2}" stroke="${INK}" stroke-width="${er * 0.26}" fill="none" stroke-linecap="round"/>`;
      out += `<path d="M${cx + s * er * 0.8} ${ey - er * 0.55} l${s * er * 0.4} ${-er * 0.3}" stroke="${INK}" stroke-width="${er * 0.16}" stroke-linecap="round"/>`;
    }
  }
  // Nose and an open smile.
  out += `<path d="M${HX - 1.5} ${EYE_Y + EYE_R * 1.3} Q${HX + 1} ${EYE_Y + EYE_R * 1.9} ${HX + 2.5} ${EYE_Y + EYE_R * 1.5}" stroke="${sk2}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  const my = EYE_Y + EYE_R * 2.45;
  out += `<path d="M${HX - 6.3} ${my} Q${HX} ${my + 8.4} ${HX + 6.3} ${my} Q${HX} ${my + 2.5} ${HX - 6.3} ${my} Z" fill="#8C3B3B"/>`;
  out += `<path d="M${HX - 4.2} ${my + 0.4} Q${HX} ${my + 2.8} ${HX + 4.2} ${my + 0.4}" stroke="#FFFFFF" stroke-width="1.5" fill="none"/>`;
  out += `<path d="M${HX - 3} ${my + 5.6} Q${HX} ${my + 4.4} ${HX + 3} ${my + 5.6}" stroke="#D9677A" stroke-width="1.6" fill="none" opacity="0.8"/>`;
  return out;
}

function brows(look: AvatarLook, color: string): string {
  if (look.hair === 'shaved') color = shade(color, 0.1);
  return [-1, 1]
    .map((s) => {
      const cx = HX + s * EYE_GAP;
      const y = EYE_Y - EYE_R * 1.75;
      return `<path d="M${cx - 5.4} ${y + 1} Q${cx} ${y - 2.4} ${cx + 5.8} ${y + 0.8}" stroke="${color}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Body, outfit, arms.
// ---------------------------------------------------------------------------

function legsAndShoes(o: OutfitArt, skin: string): string {
  if (o.lower.kind === 'tail') {
    const c = o.lower.color;
    return (
      `<path d="M44 ${B - 4}H76C79 ${B + 14} 73 ${B + 30} 64 ${F - 8}L76 ${F + 2}C66 ${F + 5} 60 ${F + 2} 60 ${F - 2}C60 ${F + 2} 54 ${F + 5} 44 ${F + 2}L56 ${F - 8}C47 ${B + 30} 41 ${B + 14} 44 ${B - 4}Z" fill="${c}"/>` +
      `<path d="M47 ${B + 6}Q60 ${B + 11} 73 ${B + 6}M49 ${B + 16}Q60 ${B + 21} 71 ${B + 16}M52 ${B + 26}Q60 ${B + 30} 68 ${B + 26}" stroke="${shade(c, 0.28)}" stroke-width="1.4" fill="none"/>`
    );
  }
  const legs = o.legs ?? skin;
  const ankle = LEG_W * 0.72;
  let out = '';
  for (const s of [-1, 1]) {
    const cx = 60 + s * (LEG_W * 0.5 + 1.2);
    out += `<path d="M${cx - LEG_W / 2} ${B - 4} L${cx - ankle / 2} ${F - 7} H${cx + ankle / 2} L${cx + LEG_W / 2} ${B - 4} Z" fill="${legs}"/>`;
    out += `<path d="M${cx + s * LEG_W * 0.15} ${B - 4} L${cx + s * ankle * 0.1} ${F - 7}" stroke="${shade(legs, -0.18)}" stroke-width="${LEG_W * 0.3}" opacity="0.4"/>`;
    // A chunky sneaker.
    const sx = cx + s * 2;
    const sw = 16;
    out += `<path d="M${sx - sw / 2} ${F} C${sx - sw / 2} ${F - 9} ${sx + sw / 2 - 2} ${F - 9} ${sx + sw / 2} ${F - 2} V${F + 1} H${sx - sw / 2} Z" fill="${o.shoes}"/>`;
    out += `<rect x="${sx - sw / 2 - 0.5}" y="${F - 1}" width="${sw + 1}" height="3.4" rx="1.6" fill="#F3EBDD"/>`;
    out += `<path d="M${sx - 2} ${F - 6} L${sx + 2} ${F - 4.5} M${sx - 1} ${F - 7.6} L${sx + 3} ${F - 6}" stroke="#F3EBDD" stroke-width="1" stroke-linecap="round" opacity="0.8"/>`;
    out += `<ellipse cx="${sx - sw * 0.18}" cy="${F - 6}" rx="${sw * 0.16}" ry="1.4" fill="#FFFFFF" opacity="0.3"/>`;
  }
  return out;
}

function lowerGarment(o: OutfitArt): string {
  const c = o.lower.color;
  const dark = shade(c, -0.22);
  const seam = `<path d="M60 ${B - 6}V${B + 5}" stroke="${dark}" stroke-width="0.9" opacity="0.6"/>`;
  switch (o.lower.kind) {
    case 'shorts':
      return `<path d="M44.5 ${B - 7}H75.5L77 ${B + 10}Q68 ${B + 12} 61.5 ${B + 10}L60 ${B + 5}L58.5 ${B + 10}Q52 ${B + 12} 43 ${B + 10}Z" fill="${c}"/>${seam}`;
    case 'pants':
      return `<path d="M44.5 ${B - 7}H75.5L73 ${F - 9}H62L60 ${B + 6}L58 ${F - 9}H47Z" fill="${c}"/>${seam}<path d="M70 ${B}L68 ${F - 10}" stroke="${dark}" stroke-width="1.2" opacity="0.4"/>`;
    case 'skirt':
      return `<path d="M45 ${B - 8}H75L83 ${B + 15}C74 ${B + 19} 46 ${B + 19} 37 ${B + 15}Z" fill="${c}"/><path d="M48 ${B + 2}L44 ${B + 15}M60 ${B}V${B + 17}M72 ${B + 2}L76 ${B + 15}" stroke="${dark}" stroke-width="1" opacity="0.4"/>`;
    case 'dress':
      return `<path d="M46 ${T + 8}H74L85 ${B + 20}C75 ${B + 25} 45 ${B + 25} 35 ${B + 20}Z" fill="${c}"/><path d="M50 ${B}L44 ${B + 20}M60 ${B - 2}V${B + 22}M70 ${B}L76 ${B + 20}" stroke="${dark}" stroke-width="1" opacity="0.35"/>`;
    case 'robe':
      return `<path d="M45 ${T + 8}H75L81 ${F - 6}C70 ${F - 2} 50 ${F - 2} 39 ${F - 6}Z" fill="${c}"/><path d="M60 ${B}V${F - 4}" stroke="${dark}" stroke-width="1" opacity="0.5"/>`;
    default:
      return '';
  }
}

function torso(o: OutfitArt, skin: string): string {
  const sk2 = shade(skin, -0.16);
  let out = `<path d="M55.5 ${HY + RY - 8}H64.5V${T + 5}H55.5Z" fill="${sk2}"/>`;
  out += `<path d="M43 ${T + 9}C43 ${T + 1} 50 ${T - 1} 54 ${T - 1}H66C70 ${T - 1} 77 ${T + 1} 77 ${T + 9}L76 ${B - 3}C68 ${B + 1} 52 ${B + 1} 44 ${B - 3}Z" fill="${o.shirt}"/>`;
  return out;
}

/** Soft lighting over the clothes: a highlight on the left, shadow on the right. */
function torsoLight(id: string): string {
  return `<path d="M43 ${T + 9}C43 ${T + 1} 50 ${T - 1} 54 ${T - 1}H66C70 ${T - 1} 77 ${T + 1} 77 ${T + 9}L76 ${B - 3}C68 ${B + 1} 52 ${B + 1} 44 ${B - 3}Z" fill="url(#${id}l)"/>`;
}

function arm(a: Arm, o: OutfitArt, skin: string, side: -1 | 1): string {
  const [sx, sy] = a.shoulder;
  const [ex, ey] = a.elbow;
  const [hx, hy] = a.hand;
  const sk2 = shade(skin, -0.16);
  let out = `<path d="M${sx} ${sy} L${ex} ${ey} L${hx} ${hy}" stroke="${skin}" stroke-width="${ARM_W}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  out += `<path d="M${ex - side} ${ey} L${hx - side} ${hy}" stroke="${sk2}" stroke-width="${ARM_W * 0.25}" opacity="0.35" stroke-linecap="round"/>`;
  if (o.sleeves !== 'none') {
    const sleeve = o.sleeveColor ?? o.shirt;
    if (o.sleeves === 'long') {
      out += `<path d="M${sx} ${sy} L${ex} ${ey} L${ex + (hx - ex) * 0.82} ${ey + (hy - ey) * 0.82}" stroke="${sleeve}" stroke-width="${ARM_W + 2}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    } else {
      out += `<path d="M${sx} ${sy - 1} L${sx + (ex - sx) * 0.55} ${sy + (ey - sy) * 0.55}" stroke="${sleeve}" stroke-width="${ARM_W + 3.5}" fill="none" stroke-linecap="round"/>`;
    }
  }
  // A mitten hand with a thumb.
  out += `<ellipse cx="${hx}" cy="${hy + 2.5}" rx="${ARM_W * 0.6}" ry="${ARM_W * 0.72}" fill="${skin}"/>`;
  out += `<ellipse cx="${hx - side * ARM_W * 0.5}" cy="${hy}" rx="${ARM_W * 0.26}" ry="${ARM_W * 0.4}" fill="${skin}" transform="rotate(${side * 30} ${hx - side * ARM_W * 0.5} ${hy})"/>`;
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
};

function fitFor(slot: keyof typeof FIT, itemId: string): string {
  return ITEM_FIT[itemId] ?? FIT[slot];
}

/** The avatar's inner SVG markup on the 120 × 168 canvas. */
export function avatarMarkup(look: AvatarLook, { pose = 'stand', shadow = true }: Options = {}): string {
  const id = `av${uid++}`;
  const skin = SKIN_TONES[look.skin];
  const hairColor = HAIR_COLORS[look.hairColor];
  const iris = EYE_COLORS[look.eyeColor] ?? EYE_COLORS.e1;
  const outfit = ITEM_ART[look.outfit]?.outfit ?? ITEM_ART[DEFAULT_LOOK.outfit].outfit!;
  const hat = look.hat ? ITEM_ART[look.hat] : undefined;
  const back = look.back ? ITEM_ART[look.back] : undefined;
  const held = look.held ? ITEM_ART[look.held] : undefined;
  const arms = ARMS[pose];
  const dark = shade(hairColor, -0.22);

  let out =
    '<defs>' +
    `<radialGradient id="${id}s" cx="42%" cy="38%" r="70%"><stop offset="0" stop-color="${shade(skin, 0.08)}"/><stop offset="0.75" stop-color="${skin}"/><stop offset="1" stop-color="${shade(skin, -0.16)}"/></radialGradient>` +
    `<linearGradient id="${id}h" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="${shade(hairColor, 0.35)}"/><stop offset="0.55" stop-color="${hairColor}"/><stop offset="1" stop-color="${shade(hairColor, -0.2)}"/></linearGradient>` +
    `<radialGradient id="${id}i" cx="50%" cy="60%" r="55%"><stop offset="0" stop-color="${shade(iris, 0.5)}"/><stop offset="1" stop-color="${shade(iris, -0.25)}"/></radialGradient>` +
    `<linearGradient id="${id}l" x1="0" y1="0" x2="1" y2="0.4"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.18"/><stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity="0.16"/></linearGradient>` +
    '</defs>';
  const hairFill = `url(#${id}h)`;
  if (shadow) out += `<ellipse cx="60" cy="${F + 4}" rx="26" ry="5" fill="#1B2340" opacity="0.15"/>`;
  if (back?.svg) out += `<g transform="${fitFor('back', look.back ?? '')}">${back.svg}</g>`;
  out += hairBack(look.hair, hairFill);
  out += legsAndShoes(outfit, skin);
  out += lowerGarment(outfit);
  out += torso(outfit, skin);
  if (outfit.extra) out += `<g transform="${fitFor('outfit', look.outfit)}">${outfit.extra}</g>`;
  out += torsoLight(id);
  out += arm(arms.left, outfit, skin, -1);
  out += arm(arms.right, outfit, skin, 1);
  if (back?.front) out += `<g transform="${fitFor('back', look.back ?? '')}">${back.front}</g>`;
  out += face(look, skin, id);
  out += hairFront(look.hair, hairFill, dark);
  out += brows(look, dark);
  if (hat?.svg) out += `<g transform="${fitFor('hat', look.hat ?? '')}">${hat.svg}</g>`;
  // Held items last, so balloons and lamps stay in front of the head.
  if (held?.svg) {
    const [hx, hy] = arms.right.hand;
    out += `<g transform="translate(${hx} ${hy + 2}) scale(1.12)">${held.svg}</g>`;
  }
  return out;
}

/** The avatar as a complete SVG document. */
export function avatarSvg(look: AvatarLook, options: Options = {}): string {
  const viewBox = options.crop === 'bust' ? '20 8 80 80' : `0 0 ${AVATAR_CANVAS.width} ${AVATAR_CANVAS.height}`;
  const markup = avatarMarkup(look, { ...options, shadow: options.crop === 'bust' ? false : options.shadow });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${markup}</svg>`;
}
