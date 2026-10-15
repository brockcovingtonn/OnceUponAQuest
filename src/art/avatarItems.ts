/**
 * Artwork for every wardrobe item, keyed by item id (the ids match the
 * avatar_items table; names, prices and unlocks live in the database).
 *
 * All original drawings. Story items follow the public-domain books' own
 * descriptions, never a film's character design: the Looking-Glass
 * pinafore is yellow like The Nursery Alice (1890), the skeleton-leaf tunic
 * is how Barrie dresses Peter, and so on. No mouse ears, no three-circle
 * shapes, no trademarked names.
 *
 * Coordinates are on the avatar's 120 × 140 canvas (head centered at 60, 52;
 * the top of the head at y ≈ 26). Held items are drawn around the right hand,
 * which is at (0, 0) in their own coordinates.
 */

export type OutfitArt = {
  shirt: string;
  sleeves: 'none' | 'short' | 'long';
  sleeveColor?: string;
  lower: { kind: 'shorts' | 'pants' | 'skirt' | 'dress' | 'robe' | 'tail'; color: string };
  /** Stockings or trousers color for the legs (default: skin). */
  legs?: string;
  shoes: string;
  /** Details drawn over the torso (collars, buttons, aprons). */
  extra?: string;
};

export type ItemArt = {
  slot: 'hat' | 'outfit' | 'back' | 'held';
  outfit?: OutfitArt;
  /** Hats and back items: drawn on the canvas. Held items: drawn at the hand. */
  svg?: string;
  /** Back items with a part in front of the body (straps, a parrot on the shoulder). */
  front?: string;
};

const GOLD = '#E2B04A';
const MIDNIGHT = '#1B2340';
const PARCHMENT = '#FAF5EA';
const INK = '#2A2A33';
const ROSE = '#D9677A';
const FERN = '#4F9D7A';

const buttons = (x: number, ys: number[], fill = GOLD) => ys.map((y) => `<circle cx="${x}" cy="${y}" r="1.3" fill="${fill}"/>`).join('');

export const ITEM_ART: Record<string, ItemArt> = {
  // -------------------------------------------------------------------------
  // Starters (free for everyone)
  // -------------------------------------------------------------------------
  'explorer-tee': {
    slot: 'outfit',
    outfit: {
      shirt: GOLD,
      sleeves: 'short',
      lower: { kind: 'shorts', color: '#2E3A63' },
      shoes: '#6B4A3A',
      extra: `<path d="M55 85L60 91L65 85" stroke="#B98A2E" stroke-width="1.6" fill="none"/><rect x="64" y="94" width="7" height="6" rx="1" fill="#C99A3A"/>`,
    },
  },
  'picnic-overalls': {
    slot: 'outfit',
    outfit: {
      shirt: '#F3EBDD',
      sleeves: 'short',
      lower: { kind: 'pants', color: FERN },
      shoes: '#5A3A28',
      extra: `<path d="M48 92H72V106H48Z" fill="${FERN}"/><path d="M49 86L50 93M71 86L70 93" stroke="${FERN}" stroke-width="3"/>${buttons(51, [93])}${buttons(69, [93])}<rect x="55" y="96" width="10" height="6" rx="1.5" fill="#3E7D61"/>`,
    },
  },
  'cozy-sweater': {
    slot: 'outfit',
    outfit: {
      shirt: ROSE,
      sleeves: 'long',
      lower: { kind: 'skirt', color: '#2E3A63' },
      legs: '#2E3A63',
      shoes: INK,
      extra: `<path d="M45 103H75" stroke="#B9505F" stroke-width="2" stroke-dasharray="2 2"/><path d="M54 86Q60 90 66 86" stroke="#B9505F" stroke-width="2" fill="none"/>`,
    },
  },
  'explorer-cap': {
    slot: 'hat',
    svg: `<path d="M34 41C34 25 46 21 60 21C74 21 86 25 86 41Z" fill="${FERN}"/><path d="M60 21V41" stroke="#3E7D61" stroke-width="1.2"/><path d="M76 39H97C97 43 93 45 87 45H76Z" fill="#3E7D61"/><circle cx="60" cy="21" r="2.4" fill="${GOLD}"/>`,
  },
  'day-pack': {
    slot: 'back',
    svg: `<rect x="38" y="84" width="44" height="28" rx="8" fill="#8A5A3C"/><rect x="38" y="98" width="8" height="12" rx="3" fill="#6E4630"/><rect x="74" y="98" width="8" height="12" rx="3" fill="#6E4630"/>`,
    front: `<path d="M50 86L49 104M70 86L71 104" stroke="#6E4630" stroke-width="3" stroke-linecap="round"/>`,
  },
  'folded-map': {
    slot: 'held',
    svg: `<path d="M-3 -14L5 -12L12 -14L12 2L5 4L-3 2Z" fill="${PARCHMENT}" stroke="#C9B48A" stroke-width="0.8"/><path d="M5 -12V4" stroke="#C9B48A" stroke-width="0.8"/><path d="M-1 -8Q3 -4 8 -9" stroke="${ROSE}" stroke-width="1" stroke-dasharray="1.5 1.5" fill="none"/><path d="M8 -10L10 -8M10 -10L8 -8" stroke="${ROSE}" stroke-width="1"/>`,
  },

  // -------------------------------------------------------------------------
  // Main Street, U.S.A.
  // -------------------------------------------------------------------------
  'straw-boater': {
    slot: 'hat',
    svg: `<ellipse cx="60" cy="33" rx="33" ry="6" fill="#E8C870"/><path d="M42 33V20C42 17 46 16 60 16C74 16 78 17 78 20V33Z" fill="#E8C870"/><rect x="42" y="26" width="36" height="6" fill="${MIDNIGHT}"/><path d="M42 28H78" stroke="${ROSE}" stroke-width="1.4"/><path d="M28 34Q60 40 92 34" stroke="#C9A64E" stroke-width="1" fill="none"/>`,
  },
  'quartet-stripes': {
    slot: 'outfit',
    outfit: {
      shirt: PARCHMENT,
      sleeves: 'long',
      lower: { kind: 'pants', color: '#3A3F62' },
      shoes: INK,
      extra: `<path d="M48 87H72L71 106H49Z" fill="${PARCHMENT}"/>${[51, 56, 61, 66, 70]
        .map((x) => `<path d="M${x} 88V105" stroke="${ROSE}" stroke-width="2"/>`)
        .join('')}<path d="M54 85L60 88L54 91ZM66 85L60 88L66 91Z" fill="#B9373F"/><circle cx="60" cy="88" r="1.6" fill="#B9373F"/>`,
    },
  },
  'engineer-cap': {
    slot: 'hat',
    svg: `<path d="M35 40C35 26 46 21 60 21C74 21 85 26 85 40Z" fill="#4A6A9A"/>${[40, 46, 52, 58, 64, 70, 76, 82]
      .map((x) => `<path d="M${x} 24V40" stroke="#DCE6F2" stroke-width="1.3"/>`)
      .join('')}<path d="M33 40H87C87 44 82 46 76 46H44C38 46 33 44 33 40Z" fill="#3A557E"/>`,
  },
  'balloon-bouquet': {
    slot: 'held',
    svg: `<path d="M0 0L2 -44M0 0L10 -52M0 0L18 -46M0 0L24 -36" stroke="#8E7A6A" stroke-width="0.8"/><ellipse cx="2" cy="-52" rx="7" ry="9" fill="${ROSE}"/><ellipse cx="11" cy="-61" rx="7" ry="9" fill="${GOLD}"/><ellipse cx="19" cy="-53" rx="7" ry="9" fill="${FERN}"/><ellipse cx="25" cy="-43" rx="7" ry="9" fill="#9FC4F0"/><g fill="#fff" opacity="0.6"><ellipse cx="0" cy="-55" rx="1.6" ry="2.6"/><ellipse cx="9" cy="-64" rx="1.6" ry="2.6"/><ellipse cx="17" cy="-56" rx="1.6" ry="2.6"/><ellipse cx="23" cy="-46" rx="1.6" ry="2.6"/></g>`,
  },
  'lamplighter-coat': {
    slot: 'outfit',
    outfit: {
      shirt: '#2E4F46',
      sleeves: 'long',
      lower: { kind: 'robe', color: '#2E4F46' },
      legs: INK,
      shoes: INK,
      extra: `<path d="M54 85L60 92L66 85" fill="${PARCHMENT}"/>${buttons(56, [95, 101, 107])}${buttons(64, [95, 101, 107])}<path d="M60 92V128" stroke="#24403A" stroke-width="1.2"/><path d="M45 96H75" stroke="${GOLD}" stroke-width="0.8" opacity="0.6"/>`,
    },
  },

  // -------------------------------------------------------------------------
  // Adventureland
  // -------------------------------------------------------------------------
  'skipper-hat': {
    slot: 'hat',
    svg: `<ellipse cx="60" cy="35" rx="34" ry="7" fill="#B59D6E"/><path d="M41 35C41 20 49 17 60 17C71 17 79 20 79 35Z" fill="#C9B48A"/><rect x="41" y="28" width="38" height="5" fill="#6B4A3A"/><path d="M47 28L52 33" stroke="${GOLD}" stroke-width="1.2"/>`,
  },
  'skipper-khakis': {
    slot: 'outfit',
    outfit: {
      shirt: '#C9B48A',
      sleeves: 'short',
      lower: { kind: 'shorts', color: '#8A7A55' },
      shoes: '#5A3A28',
      extra: `<path d="M55 85L60 90L65 85" stroke="#A8925F" stroke-width="1.6" fill="none"/><rect x="47" y="92" width="8" height="7" rx="1" fill="#B59D6E"/><rect x="65" y="92" width="8" height="7" rx="1" fill="#B59D6E"/><rect x="44" y="103" width="32" height="3" fill="#6B4A3A"/><rect x="58" y="102.5" width="4" height="4" fill="${GOLD}"/>`,
    },
  },
  'wishing-lamp': {
    slot: 'held',
    svg: `<path d="M-4 -6C-4 -12 4 -14 10 -10C14 -8 18 -10 22 -14C20 -8 16 -3 10 -2H0C-3 -2 -4 -4 -4 -6Z" fill="${GOLD}"/><path d="M-6 -6C-10 -6 -10 -2 -6 -1" stroke="${GOLD}" stroke-width="1.6" fill="none"/><ellipse cx="4" cy="-12" rx="4" ry="1.6" fill="#C99A3A"/><circle cx="4" cy="-14.5" r="1.4" fill="#C99A3A"/><path d="M22 -15C24 -18 23 -21 25 -23" stroke="#F6D58E" stroke-width="1" fill="none" opacity="0.8"/>`,
  },
  'pineapple-swirl': {
    slot: 'held',
    svg: `<path d="M-5 -10H7L1 4Z" fill="#D9A762"/><path d="M-3 -7L4 -7M-1 -3L3 -3" stroke="#B9874A" stroke-width="0.8"/><path d="M-6 -10C-8 -16 -2 -18 0 -16C0 -22 6 -22 6 -17C9 -18 10 -13 7 -10Z" fill="#F6E27A"/><path d="M-3 -13Q1 -11 5 -14M-1 -17Q2 -15 4 -18" stroke="#E8C84E" stroke-width="1" fill="none"/>`,
  },
  'flying-carpet': {
    slot: 'back',
    svg: `<path d="M14 126L104 122L110 134L20 138Z" fill="#7A2E3E"/><path d="M18 128L102 124L106 132L22 135Z" fill="none" stroke="${GOLD}" stroke-width="1.6"/><path d="M40 128L60 127L80 126" stroke="${GOLD}" stroke-width="2" stroke-dasharray="3 3"/>${[16, 22, 28]
      .map((y, i) => `<path d="M${14 - i} ${y + 110}L${9 - i} ${y + 111}" stroke="${GOLD}" stroke-width="1.2"/>`)
      .join('')}<path d="M110 134L115 135M108 130L113 130M106 126L111 125" stroke="${GOLD}" stroke-width="1.2"/>`,
  },

  // -------------------------------------------------------------------------
  // New Orleans Square
  // -------------------------------------------------------------------------
  tricorn: {
    slot: 'hat',
    svg: `<path d="M28 36C36 22 48 18 60 18C72 18 84 22 92 36C82 32 72 34 60 31C48 34 38 32 28 36Z" fill="${INK}"/><path d="M28 36C38 32 48 34 60 31C72 34 82 32 92 36" stroke="${GOLD}" stroke-width="1.6" fill="none"/><circle cx="60" cy="27" r="3" fill="${PARCHMENT}"/><path d="M57 27H63M60 24V30" stroke="${INK}" stroke-width="1"/>`,
  },
  'buccaneer-coat': {
    slot: 'outfit',
    outfit: {
      shirt: PARCHMENT,
      sleeves: 'long',
      sleeveColor: '#7A2E3E',
      lower: { kind: 'pants', color: INK },
      shoes: '#1E1E24',
      extra: `<path d="M43 93C43 87 48 85 52 85H55L53 112H42Z" fill="#7A2E3E"/><path d="M77 93C77 87 72 85 68 85H65L67 112H78Z" fill="#7A2E3E"/><path d="M55 85L53 112M65 85L67 112" stroke="${GOLD}" stroke-width="1.4"/><path d="M54 100H66" stroke="${ROSE}" stroke-width="4"/><path d="M57 86L60 92L63 86" stroke="#D8CDB8" stroke-width="1.2" fill="none"/>`,
    },
  },
  'treasure-map': {
    slot: 'held',
    svg: `<rect x="-3" y="-18" width="14" height="16" fill="#E9D9B0"/><ellipse cx="-3" cy="-10" rx="2.4" ry="8" fill="#D8C392"/><ellipse cx="11" cy="-10" rx="2.4" ry="8" fill="#D8C392"/><path d="M0 -14Q4 -8 8 -12" stroke="#8E7A6A" stroke-width="0.8" stroke-dasharray="1.4 1.4" fill="none"/><path d="M6 -8L9 -5M9 -8L6 -5" stroke="#B9373F" stroke-width="1.3"/>`,
  },
  beignet: {
    slot: 'held',
    svg: `<ellipse cx="4" cy="-4" rx="12" ry="3.4" fill="#FFFFFF" stroke="#D8CDB8" stroke-width="0.8"/><path d="M-4 -6L3 -12L10 -7L4 -3Z" fill="#E1B26A"/><path d="M2 -7L9 -12L14 -8L8 -4Z" fill="#D9A55C"/><g fill="#FFFFFF"><circle cx="2" cy="-9" r="1.2"/><circle cx="6" cy="-8" r="1"/><circle cx="9" cy="-10" r="1.2"/><circle cx="11" cy="-8" r="0.9"/><circle cx="4" cy="-11" r="0.8"/></g>`,
  },
  'shoulder-parrot': {
    slot: 'back',
    front: `<g transform="translate(46 80)"><path d="M-4 6C-10 14 -12 20 -10 26L-6 14Z" fill="#3E7D61"/><ellipse cx="0" cy="0" rx="7" ry="9" fill="#4FA35A"/><circle cx="2" cy="-8" r="5.4" fill="#4FA35A"/><path d="M6 -9C10 -9 10 -4 7 -3Z" fill="${GOLD}"/><circle cx="3" cy="-9" r="1.2" fill="${INK}"/><path d="M-4 0C-2 4 2 4 4 0" fill="#D94A3A"/><path d="M-2 9V12M2 9V12" stroke="${GOLD}" stroke-width="1.4"/></g>`,
  },
  'jack-o-lantern': {
    slot: 'held',
    svg: `<path d="M-6 -16Q4 -26 14 -16" stroke="#6B4A3A" stroke-width="1.2" fill="none"/><ellipse cx="4" cy="-8" rx="11" ry="9" fill="#E58A3A"/><path d="M0 -16Q4 -8 0 0M8 -16Q4 -8 8 0" stroke="#C96F28" stroke-width="1" fill="none"/><rect x="2.5" y="-20" width="3" height="4" rx="1" fill="#4F7A3A"/><path d="M-1 -11L1 -8H-3ZM9 -11L11 -8H7Z" fill="#F6D58E"/><path d="M-1 -4Q4 -1 9 -4L7 -3L4 -4L1 -3Z" fill="#F6D58E"/>`,
  },

  // -------------------------------------------------------------------------
  // Bayou Country
  // -------------------------------------------------------------------------
  'fishing-hat': {
    slot: 'hat',
    svg: `<path d="M30 38L38 22C44 18 76 18 82 22L90 38C80 35 40 35 30 38Z" fill="#6E8A5A"/><path d="M38 30H82" stroke="#58704A" stroke-width="3"/><path d="M76 29L80 34" stroke="${ROSE}" stroke-width="1.4"/><circle cx="80.5" cy="35" r="1.6" fill="${GOLD}"/>`,
  },
  'rowing-jumper': {
    slot: 'outfit',
    outfit: {
      shirt: '#F3EBDD',
      sleeves: 'long',
      lower: { kind: 'pants', color: '#4F6E8F' },
      shoes: PARCHMENT,
      extra: `<path d="M44 94H76M44 99H76" stroke="#2E3A63" stroke-width="2.6"/><path d="M53 85Q60 90 67 85" stroke="#D8CDB8" stroke-width="2.4" fill="none"/>`,
    },
  },
  'honey-pot': {
    slot: 'held',
    svg: `<path d="M-6 -2C-8 -10 -6 -16 0 -17H10C16 -16 18 -10 16 -2C14 2 -4 2 -6 -2Z" fill="#B9704A"/><rect x="-3" y="-21" width="16" height="5" rx="2" fill="#A35E3C"/><path d="M-2 -17C-2 -12 0 -12 0 -15M6 -17C6 -10 8 -10 8 -15" stroke="#E8B43E" stroke-width="2.4" stroke-linecap="round" fill="none"/><rect x="-1" y="-11" width="12" height="7" rx="1" fill="${PARCHMENT}"/>`,
  },
  'canoe-paddle': {
    slot: 'back',
    svg: `<path d="M30 124L96 70" stroke="#9A6B42" stroke-width="3.6" stroke-linecap="round"/><path d="M92 64C94 56 104 52 108 58C112 64 106 74 98 74C94 74 90 70 92 64Z" fill="#B9874A"/><path d="M95 70L106 59" stroke="#9A6B42" stroke-width="1"/>`,
  },
  'honey-bear-hoodie': {
    slot: 'outfit',
    outfit: {
      shirt: '#D9A441',
      sleeves: 'long',
      lower: { kind: 'pants', color: '#B8862E' },
      shoes: '#6B4A3A',
      extra: `<path d="M27 54C27 26 42 18 60 18C78 18 93 26 93 54C93 72 84 82 76 86H44C36 82 27 72 27 54Z" fill="#D9A441"/><path d="M60 92L65 95V101L60 104L55 101V95Z" fill="#E8C060" stroke="#B8862E" stroke-width="1"/><path d="M48 104H72" stroke="#B8862E" stroke-width="1.6"/>`,
    },
  },

  // -------------------------------------------------------------------------
  // Frontierland
  // -------------------------------------------------------------------------
  'ten-gallon': {
    slot: 'hat',
    svg: `<path d="M24 34C30 40 90 40 96 34C92 30 86 32 80 32H40C34 32 28 30 24 34Z" fill="#8A5A3C"/><path d="M42 33C40 22 44 12 52 14L60 18L68 14C76 12 80 22 78 33Z" fill="#9C6B46"/><path d="M42 29H78" stroke="#5A3A28" stroke-width="2.4"/>`,
  },
  prospector: {
    slot: 'outfit',
    outfit: {
      shirt: '#B5543C',
      sleeves: 'long',
      lower: { kind: 'pants', color: '#4A5F84' },
      shoes: '#5A3A28',
      extra: `<path d="M44 92H76M44 99H76" stroke="#8E3E2C" stroke-width="1" opacity="0.8"/><path d="M50 86V106M70 86V106" stroke="#8E3E2C" stroke-width="1" opacity="0.8"/><path d="M43 93C43 87 48 85 52 85H55V106H44Z" fill="#6B4A3A"/><path d="M77 93C77 87 72 85 68 85H65V106H76Z" fill="#6B4A3A"/><path d="M52 84H68L60 94Z" fill="${FERN}"/>`,
    },
  },
  'gold-pan': {
    slot: 'held',
    svg: `<ellipse cx="6" cy="-6" rx="13" ry="5" fill="#7A7F8A"/><ellipse cx="6" cy="-7" rx="10" ry="3.4" fill="#5E636E"/><g fill="${GOLD}"><circle cx="3" cy="-7" r="1.5"/><circle cx="8" cy="-8" r="1.2"/><circle cx="10" cy="-6" r="1"/></g>`,
  },
  'whitewash-brush': {
    slot: 'held',
    svg: `<path d="M0 4L4 -18" stroke="#9A6B42" stroke-width="3" stroke-linecap="round"/><rect x="-1" y="-30" width="11" height="12" rx="2" fill="#F3F0E8" transform="rotate(10 4 -24)"/><path d="M0 -30L10 -28" stroke="#D8D2C2" stroke-width="1"/>`,
  },
  'riverboat-pilot': {
    slot: 'outfit',
    outfit: {
      shirt: PARCHMENT,
      sleeves: 'long',
      sleeveColor: '#1E2A4A',
      lower: { kind: 'pants', color: INK },
      shoes: INK,
      extra: `<path d="M43 93C43 87 48 85 52 85H56L58 106H44Z" fill="#1E2A4A"/><path d="M77 93C77 87 72 85 68 85H64L62 106H76Z" fill="#1E2A4A"/>${buttons(53, [93, 99])}${buttons(67, [93, 99])}<path d="M44 90Q36 94 44 98" stroke="${GOLD}" stroke-width="1.4" fill="none"/><path d="M58 86L60 89L62 86" fill="${ROSE}"/>`,
    },
  },

  // -------------------------------------------------------------------------
  // Fantasyland
  // -------------------------------------------------------------------------
  'looking-glass-pinafore': {
    slot: 'outfit',
    outfit: {
      shirt: '#E9C24A',
      sleeves: 'short',
      lower: { kind: 'dress', color: '#E9C24A' },
      legs: PARCHMENT,
      shoes: INK,
      extra: `<path d="M50 86H70V100H50Z" fill="#FFFFFF"/><path d="M49 98H71L78 119C70 122 50 122 42 119Z" fill="#FFFFFF"/><path d="M42 119C46 122 50 120 54 122C58 120 62 122 66 120C70 122 74 120 78 119" stroke="#E6DED0" stroke-width="1.4" fill="none"/><path d="M50 86L47 84M70 86L73 84" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>`,
    },
  },
  'hatters-topper': {
    slot: 'hat',
    svg: `<ellipse cx="60" cy="31" rx="27" ry="5.5" fill="#4A3560"/><path d="M44 31L41 2H79L76 31Z" fill="#5A3E6E"/><ellipse cx="60" cy="2" rx="19" ry="3.6" fill="#6B4C80"/><rect x="43" y="22" width="34" height="5" fill="${GOLD}"/><rect x="64" y="12" width="12" height="9" fill="${PARCHMENT}" transform="rotate(8 70 16)"/><text x="66.5" y="19" font-size="5" font-family="Georgia, serif" fill="${INK}" transform="rotate(8 70 16)">10/6</text>`,
  },
  'pocket-watch': {
    slot: 'held',
    svg: `<path d="M0 0C-4 -6 0 -10 4 -12" stroke="${GOLD}" stroke-width="1" fill="none" stroke-dasharray="1.6 1"/><circle cx="7" cy="-16" r="7.5" fill="${GOLD}"/><circle cx="7" cy="-16" r="5.6" fill="${PARCHMENT}"/><path d="M7 -16V-20M7 -16L10 -15" stroke="${INK}" stroke-width="1" stroke-linecap="round"/><rect x="5.6" y="-25.6" width="2.8" height="2.6" rx="0.8" fill="${GOLD}"/>`,
  },
  'skeleton-leaf-tunic': {
    slot: 'outfit',
    outfit: {
      shirt: '#6E9A57',
      sleeves: 'none',
      lower: { kind: 'skirt', color: '#5C8A48' },
      shoes: '#8A6A4A',
      extra: `<path d="M60 86V104M60 92L52 88M60 92L68 88M60 98L51 95M60 98L69 95" stroke="#A9C98F" stroke-width="0.9" fill="none"/><path d="M38 119L42 112L46 120L50 113L54 121L58 114L62 121L66 114L70 121L74 113L78 120L82 119" fill="#5C8A48"/>`,
    },
  },
  'fairy-wings': {
    slot: 'back',
    svg: `<g opacity="0.85"><path d="M58 88C40 60 14 62 16 80C18 94 40 96 58 92Z" fill="#CFE3F6"/><path d="M58 94C42 98 26 112 34 120C42 126 54 110 58 98Z" fill="#E6D6F2"/><path d="M62 88C80 60 106 62 104 80C102 94 80 96 62 92Z" fill="#CFE3F6"/><path d="M62 94C78 98 94 112 86 120C78 126 66 110 62 98Z" fill="#E6D6F2"/></g><path d="M56 90C42 76 28 72 22 78M62 90C78 76 92 72 98 78M56 96C46 104 40 112 38 116M64 96C74 104 80 112 82 116" stroke="${GOLD}" stroke-width="0.9" fill="none" opacity="0.8"/>`,
  },
  'riding-hood-cape': {
    slot: 'back',
    svg: `<path d="M28 58C28 26 44 18 60 18C76 18 92 26 92 58C92 66 88 74 84 80L92 124C80 128 40 128 28 124L36 80C32 74 28 66 28 58Z" fill="#B9373F"/>`,
    front: `<path d="M54 84L60 88L66 84L62 92H58Z" fill="#B9373F"/>`,
  },
  'glass-slipper': {
    slot: 'held',
    svg: `<path d="M-6 -6C-6 -10 0 -12 4 -10L14 -16C18 -18 20 -14 18 -12L16 -4H-4C-6 -4 -6 -5 -6 -6Z" fill="#DCEFFB" stroke="#9FC4F0" stroke-width="1"/><path d="M14 -4V2" stroke="#9FC4F0" stroke-width="1.6"/><path d="M0 -9L4 -8" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/>`,
  },
  'briar-rose-crown': {
    slot: 'hat',
    svg: `<path d="M38 32C46 27 74 27 82 32" stroke="${GOLD}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M44 30L46 23L50 29M58 28L60 20L62 28M70 29L74 23L76 30" stroke="${GOLD}" stroke-width="2" fill="none" stroke-linejoin="round"/>${[
      [42, 31],
      [60, 28.5],
      [78, 31],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="${ROSE}"/><circle cx="${x}" cy="${y}" r="1.6" fill="#B9505F"/>`)
      .join('')}<path d="M49 31Q51 34 53 31M67 31Q69 34 71 31" stroke="${FERN}" stroke-width="1.6" fill="none"/>`,
  },
  'motor-goggles': {
    slot: 'hat',
    svg: `<path d="M34 40C34 24 46 20 60 20C74 20 86 24 86 40Z" fill="#8A5A3C"/><path d="M34 38H86" stroke="#6E4630" stroke-width="2"/><path d="M33 34H87" stroke="#5A3A28" stroke-width="2.4"/><circle cx="50" cy="33" r="6.4" fill="#C9963F"/><circle cx="70" cy="33" r="6.4" fill="#C9963F"/><circle cx="50" cy="33" r="4.4" fill="#9FC4F0"/><circle cx="70" cy="33" r="4.4" fill="#9FC4F0"/><path d="M56 33H64" stroke="#C9963F" stroke-width="2"/><path d="M48 31L50 30" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>`,
  },
  'shiny-apple': {
    slot: 'held',
    svg: `<path d="M4 -16C-2 -20 -8 -16 -7 -9C-6 -3 -1 0 4 -2C9 0 14 -3 15 -9C16 -16 10 -20 4 -16Z" fill="#C8323C"/><path d="M4 -16C4 -19 5 -21 7 -22" stroke="#6B4A3A" stroke-width="1.2" fill="none"/><path d="M6 -19C9 -22 12 -21 13 -19C10 -18 8 -18 6 -19Z" fill="${FERN}"/><ellipse cx="0" cy="-12" rx="1.6" ry="2.6" fill="#fff" opacity="0.5"/>`,
  },

  // -------------------------------------------------------------------------
  // Toontown
  // -------------------------------------------------------------------------
  'propeller-beanie': {
    slot: 'hat',
    svg: `<path d="M35 38C35 24 46 21 60 21C74 21 85 24 85 38Z" fill="${GOLD}"/><path d="M60 21C52 26 50 32 49 38H60ZM60 21C68 26 70 32 71 38H60Z" fill="${ROSE}"/><path d="M35 38C35 30 39 26 43 24L49 38Z" fill="#9FC4F0"/><path d="M85 38C85 30 81 26 77 24L71 38Z" fill="${FERN}"/><path d="M60 21V15" stroke="${INK}" stroke-width="1.4"/><path d="M60 15L48 12C46 14 48 16 50 15ZM60 15L72 18C74 16 72 14 70 15Z" fill="${ROSE}"/><circle cx="60" cy="15" r="1.6" fill="${INK}"/>`,
  },
  'squeaky-mallet': {
    slot: 'held',
    svg: `<path d="M0 2L2 -16" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/><rect x="-8" y="-28" width="20" height="12" rx="5" fill="${ROSE}"/><rect x="-8" y="-28" width="5" height="12" rx="2" fill="#B9505F"/><rect x="7" y="-28" width="5" height="12" rx="2" fill="#B9505F"/>`,
  },
  'jellybean-suspenders': {
    slot: 'outfit',
    outfit: {
      shirt: '#9FC4F0',
      sleeves: 'short',
      lower: { kind: 'shorts', color: FERN },
      shoes: '#7C5CC4',
      extra: `<path d="M50 86V105M70 86V105" stroke="${GOLD}" stroke-width="3.2"/>${[
        [50, 90, ROSE],
        [50, 97, '#7C5CC4'],
        [70, 90, '#F6A04A'],
        [70, 97, ROSE],
      ]
        .map(([x, y, c]) => `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="1.5" fill="${c}"/>`)
        .join('')}<path d="M55 86L60 89L65 86" fill="${ROSE}"/>`,
    },
  },

  // -------------------------------------------------------------------------
  // Tomorrowland
  // -------------------------------------------------------------------------
  'diving-helmet': {
    slot: 'hat',
    svg: `<path fill-rule="evenodd" d="M60 18A34 34 0 1 1 59.9 18ZM60 34A21 21 0 1 0 60.1 34Z" fill="#C9963F" transform="translate(0 2)"/><circle cx="60" cy="57" r="21" fill="#9FC4F0" opacity="0.18"/><circle cx="60" cy="57" r="21" fill="none" stroke="#A87A2E" stroke-width="3"/>${[
      [60, 33],
      [39, 47],
      [81, 47],
      [39, 68],
      [81, 68],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#A87A2E"/>`)
      .join('')}<rect x="54" y="14" width="12" height="7" rx="2" fill="#A87A2E"/><path d="M47 44A16 16 0 0 1 56 39" stroke="#fff" stroke-width="2" opacity="0.6" fill="none" stroke-linecap="round"/>`,
  },
  'nautilus-coat': {
    slot: 'outfit',
    outfit: {
      shirt: '#1E2A4A',
      sleeves: 'long',
      lower: { kind: 'pants', color: '#2A3352' },
      shoes: INK,
      extra: `${buttons(56, [92, 98, 104])}${buttons(64, [92, 98, 104])}<path d="M43 89H51M69 89H77" stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round"/><circle cx="69" cy="97" r="0" fill="none"/><path d="M55 85L60 90L65 85" stroke="${GOLD}" stroke-width="1.2" fill="none"/>`,
    },
  },
  'rocket-cadet': {
    slot: 'outfit',
    outfit: {
      shirt: '#EDEFF7',
      sleeves: 'long',
      lower: { kind: 'pants', color: '#EDEFF7' },
      shoes: ROSE,
      extra: `<path d="M44 96H76" stroke="${ROSE}" stroke-width="3"/><circle cx="68" cy="90" r="3.4" fill="${GOLD}"/><ellipse cx="68" cy="90" rx="6" ry="1.6" fill="none" stroke="${MIDNIGHT}" stroke-width="0.9"/><path d="M52 85Q60 89 68 85" stroke="#C9CEEA" stroke-width="2.4" fill="none"/>`,
    },
  },
  'rocket-pack': {
    slot: 'back',
    svg: `<rect x="34" y="84" width="14" height="28" rx="6" fill="#C9CEEA"/><rect x="72" y="84" width="14" height="28" rx="6" fill="#C9CEEA"/><path d="M34 90H48M72 90H86" stroke="${ROSE}" stroke-width="2.4"/><path d="M36 112L41 124L46 112ZM74 112L79 124L84 112Z" fill="#F6A04A"/><path d="M38.5 112L41 119L43.5 112ZM76.5 112L79 119L81.5 112Z" fill="#F6E27A"/>`,
  },

  // -------------------------------------------------------------------------
  // Galaxy's Edge (plain sci-fi, nothing from any film)
  // -------------------------------------------------------------------------
  'desert-wrap': {
    slot: 'outfit',
    outfit: {
      shirt: '#CDB894',
      sleeves: 'long',
      sleeveColor: '#B9A27A',
      lower: { kind: 'robe', color: '#CDB894' },
      legs: '#8A7A5A',
      shoes: '#6B4A3A',
      extra: `<path d="M48 84L74 104L70 108L44 90Z" fill="#8A6A4A"/><rect x="44" y="104" width="32" height="4" fill="#6B4A3A"/><rect x="47" y="106" width="6" height="6" rx="1" fill="#8A6A4A"/><rect x="67" y="106" width="6" height="6" rx="1" fill="#8A6A4A"/>`,
    },
  },
  'spacer-goggles': {
    slot: 'hat',
    svg: `<path d="M33 36C40 32 80 32 87 36" stroke="#5A4A3A" stroke-width="3.4" fill="none"/><rect x="42" y="28" width="15" height="11" rx="4" fill="#5E636E"/><rect x="63" y="28" width="15" height="11" rx="4" fill="#5E636E"/><rect x="44.5" y="30.5" width="10" height="6" rx="2.6" fill="#E89A5A"/><rect x="65.5" y="30.5" width="10" height="6" rx="2.6" fill="#E89A5A"/><path d="M57 33H63" stroke="#5E636E" stroke-width="2"/>`,
  },
  'robot-pal': {
    slot: 'back',
    svg: `<g transform="translate(14 102)"><path d="M0 -12V-18" stroke="#8F97C6" stroke-width="1.4"/><circle cx="0" cy="-19" r="2" fill="${ROSE}"/><rect x="-10" y="-12" width="20" height="16" rx="4" fill="${GOLD}"/><rect x="-7" y="-9" width="14" height="8" rx="2" fill="${MIDNIGHT}"/><circle cx="-2.5" cy="-5" r="1.6" fill="#9FC4F0"/><circle cx="2.5" cy="-5" r="1.6" fill="#9FC4F0"/><rect x="-8" y="4" width="16" height="10" rx="3" fill="${ROSE}"/><path d="M-4 18L4 18" stroke="#8F97C6" stroke-width="2" stroke-linecap="round" opacity="0.6"/></g>`,
  },

  // -------------------------------------------------------------------------
  // More storybook classics
  // -------------------------------------------------------------------------
  'laurel-crown': {
    slot: 'hat',
    svg: `<path d="M36 36C42 28 52 26 60 26C68 26 78 28 84 36" stroke="#6E8A3A" stroke-width="1.6" fill="none"/>${[
      [39, 34, -40],
      [44, 30, -30],
      [50, 27.5, -15],
      [70, 27.5, 15],
      [76, 30, 30],
      [81, 34, 40],
    ]
      .map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="5" fill="#7FA34A" transform="rotate(${r} ${x} ${y})"/>`)
      .join('')}<circle cx="60" cy="26" r="2.2" fill="${GOLD}"/>`,
  },
  'archer-cap': {
    slot: 'hat',
    svg: `<path d="M34 38C38 24 50 18 60 18C72 18 84 24 98 30C88 32 80 36 86 38Z" fill="#5C8A48"/><path d="M34 38H86" stroke="#4A7038" stroke-width="2.4"/><path d="M70 30C78 18 88 12 96 10C90 16 82 24 74 32Z" fill="${GOLD}"/><path d="M71 31L94 11" stroke="#C99A3A" stroke-width="0.9"/>`,
  },
  'mermaid-tail': {
    slot: 'outfit',
    outfit: {
      shirt: '#7FC7C0',
      sleeves: 'none',
      lower: { kind: 'tail', color: '#3E8FA8' },
      shoes: '#3E8FA8',
      extra: `<path d="M50 87Q60 93 70 87" stroke="${PARCHMENT}" stroke-width="2.2" stroke-dasharray="0.1 3.2" stroke-linecap="round" fill="none"/>`,
    },
  },
};
