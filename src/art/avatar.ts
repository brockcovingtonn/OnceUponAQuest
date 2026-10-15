/**
 * The explorer avatar: a chibi storybook character drawn in layers, all
 * original artwork. Everything is plain SVG on a 120 × 140 canvas so the
 * same drawing works in the app (SvgXml), on the map, on share cards, and in
 * preview scripts.
 *
 * Hard rules: no character likenesses, no mouse ears or three-circle shapes
 * (so no buns or round ears on top of the head), and outfits follow the
 * public-domain books' own descriptions rather than any film's designs.
 *
 * The look (skin, hair, eyes) is free to change. Clothes come from the
 * wardrobe (src/art/avatarItems.ts); the database checks what you own.
 */

import { ITEM_ART, type OutfitArt } from './avatarItems';

export const AVATAR_CANVAS = { width: 120, height: 140 };

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
    freckles: r.freckles === true,
    hat: item(r.hat),
    outfit: item(r.outfit) ?? DEFAULT_LOOK.outfit,
    back: item(r.back),
    held: item(r.held),
  };
}

export type Pose = 'stand' | 'cheer' | 'wave';

/** Where each hand is, per pose (the held item goes in the right hand). */
const HANDS: Record<Pose, { left: [number, number]; right: [number, number] }> = {
  stand: { left: [39, 109], right: [81, 109] },
  cheer: { left: [32, 72], right: [88, 72] },
  wave: { left: [39, 109], right: [90, 76] },
};

const INK = '#2A2A33';

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

function hairBack(style: AvatarLook['hair'], c: string): string {
  switch (style) {
    case 'bob':
      return `<path d="M31 52C31 30 44 23 60 23C76 23 89 30 89 52V74C89 79 84 80 80 78H40C36 80 31 79 31 74Z" fill="${c}"/>`;
    case 'long':
      return `<path d="M30 52C30 29 44 22 60 22C76 22 90 29 90 52L92 98C92 104 86 106 80 103H40C34 106 28 104 28 98Z" fill="${c}"/>`;
    case 'curls': {
      let bumps = '';
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        bumps += `<circle cx="${(60 + Math.cos(a) * 29).toFixed(1)}" cy="${(48 + Math.sin(a) * 27).toFixed(1)}" r="9"/>`;
      }
      return `<g fill="${c}">${bumps}<ellipse cx="60" cy="48" rx="30" ry="28"/></g>`;
    }
    case 'ponytail':
      return `<path d="M82 40C96 42 100 58 96 74C94 82 88 86 84 84C88 74 88 58 80 50Z" fill="${c}"/>`;
    case 'braids':
      return `<path d="M33 52C33 30 45 24 60 24C75 24 87 30 87 52V60H33Z" fill="${c}"/>`;
    default:
      return '';
  }
}

function hairFront(style: AvatarLook['hair'], c: string): string {
  const dark = shade(c, -0.18);
  switch (style) {
    case 'crop':
      return `<path d="M33 50C32 30 45 24 60 24C75 24 88 30 87 50C83 41 76 36 68 36C64 40 56 40 52 36C44 36 37 41 33 50Z" fill="${c}"/>`;
    case 'swoop':
      return `<path d="M33 50C32 30 45 24 60 24C75 24 88 30 87 52C84 44 80 40 76 38C68 44 52 46 40 40C37 43 34 46 33 50Z" fill="${c}"/><path d="M48 33C58 31 70 33 78 38" stroke="${dark}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    case 'bob':
      return `<path d="M32 52C32 30 45 24 60 24C75 24 88 30 88 52C86 46 84 42 82 40V42H38V40C36 42 34 46 32 52Z" fill="${c}"/><path d="M38 41C46 38 52 38 60 40C68 38 74 38 82 41" stroke="${dark}" stroke-width="1.2" fill="none"/>`;
    case 'long':
      return `<path d="M32 54C31 30 45 24 60 24C75 24 89 30 88 54C84 44 76 38 66 37C62 41 54 41 50 37C42 39 35 45 32 54Z" fill="${c}"/>`;
    case 'curls':
      return `<path d="M35 46C38 32 48 27 60 27C72 27 82 32 85 46C80 40 72 37 66 38C62 42 56 42 52 38C46 37 40 40 35 46Z" fill="${c}"/>`;
    case 'ponytail':
      return `<path d="M33 50C32 30 45 24 60 24C75 24 88 30 87 50C84 42 78 38 70 37C64 41 52 41 46 37C40 39 35 44 33 50Z" fill="${c}"/><circle cx="84" cy="44" r="3.4" fill="#D9677A"/>`;
    case 'braids':
      return (
        `<path d="M33 50C32 30 45 24 60 24C75 24 88 30 87 50C83 42 74 37 60 37C46 37 37 42 33 50Z" fill="${c}"/>` +
        `<path d="M60 25V37" stroke="${dark}" stroke-width="1.4"/>` +
        [30, 90]
          .map(
            (x) =>
              `<g fill="${c}"><ellipse cx="${x}" cy="66" rx="5" ry="6"/><ellipse cx="${x}" cy="76" rx="4.6" ry="5.6"/><ellipse cx="${x}" cy="85" rx="4.2" ry="5"/></g><circle cx="${x}" cy="91.5" r="2.6" fill="#E2B04A"/>`,
          )
          .join('')
      );
    default:
      return `<path d="M36 44C40 32 50 27 60 27C70 27 80 32 84 44C76 38 68 36 60 36C52 36 44 38 36 44Z" fill="${c}" opacity="0.35"/>`;
  }
}

// ---------------------------------------------------------------------------
// Body, outfit and arms.
// ---------------------------------------------------------------------------

function body(o: OutfitArt, skin: string): string {
  const legs = o.legs ?? skin;
  let out = '';
  if (o.lower.kind === 'tail') {
    // A mermaid tail instead of legs.
    out += `<path d="M44 104H76C78 116 72 124 64 128L74 134C66 136 60 134 60 130C60 134 54 136 46 134L56 128C48 124 42 116 44 104Z" fill="${o.lower.color}"/>`;
    out += `<path d="M48 110Q60 114 72 110M50 118Q60 122 70 118" stroke="${shade(o.lower.color, 0.25)}" stroke-width="1.4" fill="none"/>`;
  } else {
    out += `<rect x="50" y="106" width="8" height="22" rx="3" fill="${legs}"/><rect x="62" y="106" width="8" height="22" rx="3" fill="${legs}"/>`;
    out += `<ellipse cx="53" cy="129" rx="6.5" ry="3.6" fill="${o.shoes}"/><ellipse cx="67" cy="129" rx="6.5" ry="3.6" fill="${o.shoes}"/>`;
  }
  const lower = o.lower.color;
  switch (o.lower.kind) {
    case 'shorts':
      out += `<path d="M45 104H75L76 116H62L60 110L58 116H44Z" fill="${lower}"/>`;
      break;
    case 'pants':
      out += `<path d="M45 104H75L72 126H62L60 112L58 126H48Z" fill="${lower}"/>`;
      break;
    case 'skirt':
      out += `<path d="M45 102H75L82 119C74 122 46 122 38 119Z" fill="${lower}"/>`;
      break;
    case 'dress':
      out += `<path d="M46 96H74L84 121C74 125 46 125 36 121Z" fill="${lower}"/>`;
      break;
    case 'robe':
      out += `<path d="M45 96H75L80 128C70 131 50 131 40 128Z" fill="${lower}"/>`;
      break;
    default:
      break;
  }
  // Neck and torso.
  out += `<rect x="55" y="78" width="10" height="9" fill="${shade(skin, -0.08)}"/>`;
  out += `<path d="M43 93C43 87 48 85 52 85H68C72 85 77 87 77 93L76 106H44Z" fill="${o.shirt}"/>`;
  return out;
}

function arm(from: [number, number], hand: [number, number], o: OutfitArt, skin: string): string {
  const [x1, y1] = from;
  const [x2, y2] = hand;
  let out = `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${skin}" stroke-width="7.5" stroke-linecap="round"/>`;
  if (o.sleeves !== 'none') {
    const t = o.sleeves === 'long' ? 0.85 : 0.42;
    const sx = x1 + (x2 - x1) * t;
    const sy = y1 + (y2 - y1) * t;
    out += `<path d="M${x1} ${y1}L${sx.toFixed(1)} ${sy.toFixed(1)}" stroke="${o.sleeveColor ?? o.shirt}" stroke-width="8.5" stroke-linecap="round"/>`;
  }
  out += `<circle cx="${x2}" cy="${y2}" r="4.4" fill="${skin}"/>`;
  return out;
}

// ---------------------------------------------------------------------------
// Head and face.
// ---------------------------------------------------------------------------

function head(look: AvatarLook, skin: string): string {
  let out = '';
  // Small human ears at the sides, level with the eyes (never on top).
  out += `<ellipse cx="33.5" cy="57" rx="3.6" ry="4.6" fill="${shade(skin, -0.06)}"/><ellipse cx="86.5" cy="57" rx="3.6" ry="4.6" fill="${shade(skin, -0.06)}"/>`;
  out += `<ellipse cx="60" cy="52" rx="27" ry="25.5" fill="${skin}"/>`;
  // Eyes.
  if (look.eyes === 'happy') {
    out += `<path d="M46 57Q50 52 54 57M66 57Q70 52 74 57" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  } else {
    const r = look.eyes === 'sparkle' ? 4 : 3.2;
    out += `<ellipse cx="50" cy="56" rx="${r * 0.86}" ry="${r}" fill="${INK}"/><ellipse cx="70" cy="56" rx="${r * 0.86}" ry="${r}" fill="${INK}"/>`;
    out += `<circle cx="51.2" cy="54.6" r="1.1" fill="#fff"/><circle cx="71.2" cy="54.6" r="1.1" fill="#fff"/>`;
    if (look.eyes === 'sparkle') out += `<circle cx="48.8" cy="57.6" r="0.7" fill="#fff"/><circle cx="68.8" cy="57.6" r="0.7" fill="#fff"/>`;
  }
  // Cheeks, freckles, smile.
  out += `<ellipse cx="44" cy="63" rx="4.4" ry="2.6" fill="#E98AA0" opacity="0.45"/><ellipse cx="76" cy="63" rx="4.4" ry="2.6" fill="#E98AA0" opacity="0.45"/>`;
  if (look.freckles) {
    out += `<g fill="${shade(skin, -0.35)}" opacity="0.7"><circle cx="42" cy="60.5" r="0.8"/><circle cx="45" cy="61.5" r="0.8"/><circle cx="43.5" cy="64.5" r="0.8"/><circle cx="78" cy="60.5" r="0.8"/><circle cx="75" cy="61.5" r="0.8"/><circle cx="76.5" cy="64.5" r="0.8"/></g>`;
  }
  out += `<path d="M55.5 64Q60 68.5 64.5 64" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
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

/** The avatar's inner SVG markup on the 120 × 140 canvas. */
export function avatarMarkup(look: AvatarLook, { pose = 'stand', shadow = true }: Options = {}): string {
  const skin = SKIN_TONES[look.skin];
  const hairColor = HAIR_COLORS[look.hairColor];
  const outfit = ITEM_ART[look.outfit]?.outfit ?? ITEM_ART[DEFAULT_LOOK.outfit].outfit!;
  const hat = look.hat ? ITEM_ART[look.hat] : undefined;
  const back = look.back ? ITEM_ART[look.back] : undefined;
  const held = look.held ? ITEM_ART[look.held] : undefined;
  const hands = HANDS[pose];

  let out = '';
  if (shadow) out += '<ellipse cx="60" cy="132" rx="24" ry="4.5" fill="#1B2340" opacity="0.14"/>';
  if (back?.svg) out += back.svg;
  out += hairBack(look.hair, hairColor);
  out += body(outfit, skin);
  if (outfit.extra) out += outfit.extra;
  out += arm([47, 90], hands.left, outfit, skin);
  out += arm([73, 90], hands.right, outfit, skin);
  if (back?.front) out += back.front;
  out += head(look, skin);
  out += hairFront(look.hair, hairColor);
  if (hat?.svg) out += hat.svg;
  // Held items last, so balloons and lamps stay in front of the head.
  if (held?.svg) out += `<g transform="translate(${hands.right[0]} ${hands.right[1]})">${held.svg}</g>`;
  return out;
}

/** The avatar as a complete SVG document. */
export function avatarSvg(look: AvatarLook, options: Options = {}): string {
  const viewBox = options.crop === 'bust' ? '22 16 76 76' : `0 0 ${AVATAR_CANVAS.width} ${AVATAR_CANVAS.height}`;
  const markup = avatarMarkup(look, { ...options, shadow: options.crop === 'bust' ? false : options.shadow });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${markup}</svg>`;
}
