/**
 * Story companions: one character per land from a public-domain book, who
 * keeps your explorer company on that land's quests. Portraits are original
 * drawings in our style, based on the books' own words, never on any film's
 * character design (the Cheshire Cat is a gray tabby with a wide grin, not
 * striped pink and purple; Mr. Toad wears motoring goggles and a tweed cap).
 * No round ears on top of a round head (that reads as the three-circle shape).
 *
 * Quotes are copied from the original public-domain texts and marked as
 * quotes; the other lines are our own words.
 */

export type Companion = {
  id: string;
  landId: string;
  name: string;
  book: string;
  /** A line from the original book. */
  quote: string;
  /** Lines in our own words, said as you explore. */
  lines: string[];
  /** Portrait on a 64 × 64 canvas. */
  svg: string;
};

const INK = '#2A2A33';
const GOLD = '#E2B04A';

let clipId = 0;
const frame = (bg: string, body: string) => {
  const id = `cc${clipId++}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><clipPath id="${id}"><circle cx="32" cy="32" r="31"/></clipPath></defs><g clip-path="url(#${id})"><circle cx="32" cy="32" r="31" fill="${bg}"/>${body}</g><circle cx="32" cy="32" r="30" fill="none" stroke="${GOLD}" stroke-width="2.4"/></svg>`;
};
const eyes = (y: number, dx = 7, r = 2.2) =>
  `<circle cx="${32 - dx}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${32 + dx}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${32 - dx + 0.8}" cy="${y - 0.8}" r="0.7" fill="#fff"/><circle cx="${32 + dx + 0.8}" cy="${y - 0.8}" r="0.7" fill="#fff"/>`;

export const COMPANIONS: Companion[] = [
  {
    id: 'tom-sawyer',
    landId: 'dlp-main-street',
    name: 'Tom Sawyer',
    book: 'The Adventures of Tom Sawyer (1876)',
    quote: 'Does a boy get a chance to whitewash a fence every day?',
    lines: [
      'Every shop window on this street has a story. I bet I can spot more than you!',
      'Keep your eyes peeled. The best treasure is always hiding in plain sight.',
      "Walk, don't dash. A true adventurer notices things.",
    ],
    svg: frame(
      '#BFD8E8',
      `<path d="M14 64C14 50 22 44 32 44S50 50 50 64Z" fill="#9C6B46"/><path d="M28 44L32 52L36 44Z" fill="#F3EBDD"/><circle cx="32" cy="32" r="13" fill="#EDC4A0"/>${eyes(32, 5, 1.8)}<path d="M28 38Q32 41 36 38" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/><g fill="#B0724A" opacity="0.7"><circle cx="24" cy="36" r="0.7"/><circle cx="26" cy="37" r="0.7"/><circle cx="38" cy="37" r="0.7"/><circle cx="40" cy="36" r="0.7"/></g><ellipse cx="32" cy="23" rx="19" ry="4" fill="#E8C870"/><path d="M21 23C21 14 43 14 43 23Z" fill="#E8C870"/><path d="M21 21H43" stroke="#C9A64E" stroke-width="1.6"/>`,
    ),
  },
  {
    id: 'bagheera',
    landId: 'dlp-adventureland',
    name: 'Bagheera the black panther',
    book: 'The Jungle Book (1894)',
    quote: 'We be of one blood, ye and I.',
    lines: [
      'Move softly through the jungle and it will show you its secrets.',
      'Look up, cub. Half the jungle lives above your head.',
      'A good hunter of clues is patient. Take your time.',
    ],
    svg: frame(
      '#9FC9A0',
      `<path d="M14 18L22 28L18 30Z M50 18L42 28L46 30Z" fill="#2B2833"/><ellipse cx="32" cy="36" rx="17" ry="16" fill="#2B2833"/><ellipse cx="32" cy="43" rx="8" ry="6" fill="#3A3644"/><path d="M29 41L32 44L35 41Z" fill="#1B1A22"/><ellipse cx="25" cy="33" rx="3.4" ry="2.4" fill="#E2B04A"/><ellipse cx="39" cy="33" rx="3.4" ry="2.4" fill="#E2B04A"/><ellipse cx="25" cy="33" rx="1" ry="2.2" fill="${INK}"/><ellipse cx="39" cy="33" rx="1" ry="2.2" fill="${INK}"/><path d="M24 46L16 45M24 48L17 49M40 46L48 45M40 48L47 49" stroke="#8E8A9A" stroke-width="0.7"/>`,
    ),
  },
  {
    id: 'captain-flint',
    landId: 'dlp-new-orleans-square',
    name: 'Captain Flint the parrot',
    book: 'Treasure Island (1883)',
    quote: 'Pieces of eight! Pieces of eight!',
    lines: [
      'Squawk! Ironwork, lanterns, old doors. This square is full of pirate gold!',
      'X marks the spot, matey. Or a crest, or a balcony. Look sharp!',
      'Treasure goes to the patient. Squawk!',
    ],
    svg: frame(
      '#F3D9B0',
      `<path d="M22 64C20 52 24 42 32 40C40 42 44 52 42 64Z" fill="#3E8F4E"/><path d="M26 54C28 58 36 58 38 54" stroke="#2E6F3C" stroke-width="1.4" fill="none"/><circle cx="32" cy="30" r="13" fill="#4FA35A"/><path d="M40 28C48 28 48 38 42 39C42 35 41 32 38 31Z" fill="${GOLD}"/><circle cx="35" cy="27" r="3.4" fill="#fff"/><circle cx="35.6" cy="27" r="1.8" fill="${INK}"/><path d="M22 20C24 14 30 14 32 17C30 15 26 17 25 21Z" fill="#D94A3A"/><path d="M24 40C22 46 22 52 24 56" stroke="#4F7FB8" stroke-width="3" fill="none"/>`,
    ),
  },
  {
    id: 'water-rat',
    landId: 'dlp-bayou-country',
    name: 'Ratty the Water Rat',
    book: 'The Wind in the Willows (1908)',
    quote:
      'Believe me, my young friend, there is nothing—absolute nothing—half so much worth doing as simply messing about in boats.',
    lines: [
      'Listen to the water. The bayou always has something to say.',
      'Slow and easy, like a punt on a summer river. You find more that way.',
      'A picnic, a boat and a riddle. What more could anyone want?',
    ],
    svg: frame(
      '#BFD8E8',
      `<path d="M8 50Q32 58 56 50L52 60Q32 66 12 60Z" fill="#9A6B42"/><ellipse cx="32" cy="38" rx="13" ry="12" fill="#8E7A6A"/><ellipse cx="19" cy="35" rx="3" ry="5" fill="#8E7A6A" transform="rotate(-35 19 35)"/><ellipse cx="45" cy="35" rx="3" ry="5" fill="#8E7A6A" transform="rotate(35 45 35)"/><ellipse cx="19" cy="35" rx="1.5" ry="3" fill="#D9A0A0" transform="rotate(-35 19 35)"/><ellipse cx="45" cy="35" rx="1.5" ry="3" fill="#D9A0A0" transform="rotate(35 45 35)"/>${eyes(36, 5, 1.8)}<ellipse cx="32" cy="43" rx="3" ry="2.2" fill="#5A3A28"/><path d="M28 44L20 43M28 46L21 47M36 44L44 43M36 46L43 47" stroke="#5A4A3A" stroke-width="0.6"/><ellipse cx="32" cy="22" rx="12" ry="3" fill="#E8C870"/><path d="M24 22V17H40V22Z" fill="#E8C870"/><path d="M24 20H40" stroke="#2E3A63" stroke-width="1.6"/>`,
    ),
  },
  {
    id: 'huck-finn',
    landId: 'dlp-frontierland',
    name: 'Huckleberry Finn',
    book: 'Adventures of Huckleberry Finn (1884)',
    quote: "It's lovely to live on a raft.",
    lines: [
      "The river's wide and the frontier's wider. Plenty of corners to poke around.",
      'Old forts, old wagons, old stories. Every one of them left a clue behind.',
      "Mind the folks around you, and you'll see more than they do.",
    ],
    svg: frame(
      '#F3D9B0',
      `<path d="M14 64C14 50 22 44 32 44S50 50 50 64Z" fill="#7E8A5A"/><path d="M24 46V64M40 46V64" stroke="#5A3A28" stroke-width="2"/><circle cx="32" cy="32" r="13" fill="#D9A273"/>${eyes(32, 5, 1.8)}<path d="M28 38Q32 40 36 38" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M20 26C22 16 42 16 44 26C40 23 24 23 20 26Z" fill="#C9A64E"/><path d="M14 27C20 22 44 22 50 27C44 26 20 26 14 27Z" fill="#C9A64E"/><path d="M38 18L41 23" stroke="#9A7A3A" stroke-width="1"/><path d="M42 44L52 36" stroke="#C9B48A" stroke-width="1.4"/>`,
    ),
  },
  {
    id: 'cog',
    landId: 'dlp-galaxys-edge',
    name: 'Cog the tin explorer',
    book: 'An original Once Upon a Quest story',
    quote: 'Beep! Every outpost has a story. Let us find this one together.',
    lines: [
      'Scanning... Scanning... Clue detected somewhere nearby!',
      'Dusty walls, flickering signs, old crates. My favorite kind of mystery.',
      'Recalibrating: the best explorers walk slowly and look carefully.',
    ],
    svg: frame(
      '#D8CBAE',
      `<path d="M32 10V18" stroke="#8F97C6" stroke-width="2"/><circle cx="32" cy="9" r="3" fill="#D9677A"/><rect x="16" y="18" width="32" height="26" rx="7" fill="${GOLD}"/><rect x="21" y="23" width="22" height="13" rx="4" fill="#1B2340"/><circle cx="27" cy="29.5" r="2.6" fill="#9FC4F0"/><circle cx="37" cy="29.5" r="2.6" fill="#9FC4F0"/><rect x="20" y="46" width="24" height="14" rx="4" fill="#D9677A"/><circle cx="32" cy="53" r="3" fill="${GOLD}"/>`,
    ),
  },
  {
    id: 'cheshire-cat',
    landId: 'dlp-fantasyland',
    name: 'The Cheshire Cat',
    book: "Alice's Adventures in Wonderland (1865)",
    quote: "We're all mad here. I'm mad. You're mad.",
    lines: [
      'Which way should you go? That depends a good deal on where you want to get to.',
      'Curiouser and curiouser. Look twice; things here are rarely what they seem.',
      'I may vanish, but the clues never do.',
    ],
    svg: frame(
      '#C9D9A8',
      `<path d="M14 18L22 30L16 32Z M50 18L42 30L48 32Z" fill="#8E8A94"/><ellipse cx="32" cy="38" rx="19" ry="16" fill="#9C98A2"/><path d="M20 30L26 32M18 36L24 36M44 30L38 32M46 36L40 36" stroke="#6E6A76" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="25" cy="33" rx="3" ry="2.6" fill="#B8C94A"/><ellipse cx="39" cy="33" rx="3" ry="2.6" fill="#B8C94A"/><ellipse cx="25" cy="33" rx="0.9" ry="2.4" fill="${INK}"/><ellipse cx="39" cy="33" rx="0.9" ry="2.4" fill="${INK}"/><path d="M18 40Q32 54 46 40Q32 46 18 40Z" fill="#fff" stroke="${INK}" stroke-width="1.2"/><path d="M22 42V45M26 43.5V47M30 44.3V48M34 44.3V48M38 43.5V47M42 42V45" stroke="${INK}" stroke-width="0.7"/>`,
    ),
  },
  {
    id: 'mr-toad',
    landId: 'dlp-toontown',
    name: 'Mr. Toad of Toad Hall',
    book: 'The Wind in the Willows (1908)',
    quote: 'The poetry of motion! The real way to travel! The only way to travel!',
    lines: [
      'Poop-poop! What a splendid, silly town. I shall have everything in it!',
      'Clever, aren\'t I? Almost as clever as you, finding all these clues.',
      'Even I, the great Toad, walk here. Mostly.',
    ],
    svg: frame(
      '#F3D9B0',
      `<ellipse cx="32" cy="40" rx="20" ry="15" fill="#6E9A57"/><path d="M18 46Q32 56 46 46Q32 50 18 46Z" fill="#E8D9A0"/><path d="M22 47Q32 52 42 47" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="23" cy="30" r="6" fill="#6E9A57"/><circle cx="41" cy="30" r="6" fill="#6E9A57"/><circle cx="23" cy="30" r="3.6" fill="#C9963F"/><circle cx="41" cy="30" r="3.6" fill="#C9963F"/><circle cx="23" cy="30" r="2.4" fill="#9FC4F0"/><circle cx="41" cy="30" r="2.4" fill="#9FC4F0"/><path d="M27 30H37" stroke="#C9963F" stroke-width="1.6"/><path d="M18 24C20 14 44 14 46 24Z" fill="#8A6A4A"/><path d="M44 22H54C54 25 50 26 46 26Z" fill="#6E4630"/>`,
    ),
  },
  {
    id: 'captain-nemo',
    landId: 'dlp-tomorrowland',
    name: 'Captain Nemo',
    book: 'Twenty Thousand Leagues Under the Seas (1870)',
    quote: 'The sea is everything.',
    lines: [
      'The future is built from the dreams of the past. Look closely at the machines.',
      'Steady as she goes. Observe, record, and the wonders reveal themselves.',
      'Mobilis in mobili: moving within the moving. Keep exploring.',
    ],
    svg: frame(
      '#9FC4F0',
      `<path d="M14 64C14 50 22 44 32 44S50 50 50 64Z" fill="#1E2A4A"/><circle cx="28" cy="52" r="1.4" fill="${GOLD}"/><circle cx="36" cy="52" r="1.4" fill="${GOLD}"/><circle cx="32" cy="32" r="13" fill="#D9A273"/>${eyes(31, 5, 1.8)}<path d="M20 34C20 48 44 48 44 34C40 40 24 40 20 34Z" fill="#5A4A3A"/><path d="M28 37Q32 39 36 37" stroke="${INK}" stroke-width="1.2" fill="none"/><path d="M18 24C18 16 46 16 46 24Z" fill="#1E2A4A"/><path d="M16 25H48" stroke="${INK}" stroke-width="2.4"/><circle cx="32" cy="20" r="2" fill="${GOLD}"/>`,
    ),
  },
];

export function companionForLand(landId: string | null | undefined): Companion | null {
  return COMPANIONS.find((c) => c.landId === landId) ?? null;
}
