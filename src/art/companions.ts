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

  // ---------------------------------------------------------------------------
  // California Adventure
  // ---------------------------------------------------------------------------
  {
    id: 'anne-shirley',
    landId: 'dca-buena-vista-street',
    name: 'Anne Shirley',
    book: 'Anne of Green Gables (1908)',
    quote: "Isn't it splendid to think of all the things there are to find out about?",
    lines: [
      'A whole street of brand-new old things! I could imagine stories about every window.',
      'Look at the little details. That is where the romance of a place hides, I\'m sure of it.',
      'Kindred spirits always stop to look closer. Shall we?',
    ],
    svg: frame(
      '#F3D9B0',
      `<path d="M14 64C14 50 22 44 32 44S50 50 50 64Z" fill="#6E8AB0"/><path d="M27 45L32 50L37 45" fill="#FAF5EA"/><path d="M19 30C16 40 16 50 18 56" stroke="#B9583A" stroke-width="4.5" stroke-linecap="round" fill="none"/><path d="M45 30C48 40 48 50 46 56" stroke="#B9583A" stroke-width="4.5" stroke-linecap="round" fill="none"/><circle cx="32" cy="32" r="13" fill="#F7DCC8"/>${eyes(32, 5, 1.8)}<g fill="#C98A5A" opacity="0.8"><circle cx="25" cy="36" r="0.7"/><circle cx="27" cy="37.2" r="0.7"/><circle cx="37" cy="37.2" r="0.7"/><circle cx="39" cy="36" r="0.7"/></g><path d="M28 38Q32 41 36 38" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M19 27C20 18 44 18 45 27C40 23 24 23 19 27Z" fill="#B9583A"/><ellipse cx="32" cy="21" rx="16" ry="3.6" fill="#E8C870"/><path d="M22 21C22 13 42 13 42 21Z" fill="#E8C870"/><path d="M22 19H42" stroke="#4F7FB8" stroke-width="1.8"/>`,
    ),
  },
  {
    id: 'dorothy',
    landId: 'dca-hollywood-land',
    name: 'Dorothy of Kansas',
    book: 'The Wonderful Wizard of Oz (1900)',
    quote: 'There is no place like home.',
    lines: [
      'Toto, I have a feeling this street is a stage set. Everything is make-believe, and wonderful!',
      'Follow the road and keep your eyes open. You never know what is behind a painted wall.',
      'Every studio lot has a little magic in it. Let\'s find it.',
    ],
    svg: frame(
      '#C9E3F0',
      `<path d="M14 64C14 50 22 44 32 44S50 50 50 64Z" fill="#B8A8D8"/><path d="M27 44L32 49L37 44" fill="#FAF5EA"/><path d="M16 36C14 20 50 20 48 36C48 44 44 48 40 48H24C20 48 16 44 16 36Z" fill="#E98AA0"/><circle cx="32" cy="34" r="12" fill="#EDC4A0"/><path d="M21 30C22 23 42 23 43 30C38 27 26 27 21 30Z" fill="#5A3A28"/>${eyes(34, 4.6, 1.7)}<path d="M28.5 39.5Q32 42 35.5 39.5" stroke="${INK}" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M38 44L42 50" stroke="#E98AA0" stroke-width="2"/><g transform="translate(49 52)"><ellipse cx="0" cy="3" rx="7" ry="5" fill="#2A2A33"/><circle cx="-4" cy="-2" r="4" fill="#2A2A33"/><path d="M-7 -5L-8 -9L-5 -6Z" fill="#2A2A33"/><circle cx="-5" cy="-2.5" r="0.8" fill="#FFFFFF"/></g>`,
    ),
  },
  {
    id: 'sherlock-holmes',
    landId: 'dca-avengers-campus',
    name: 'Sherlock Holmes',
    book: 'A Scandal in Bohemia (1891)',
    quote: 'You see, but you do not observe.',
    lines: [
      'A campus of heroes, and every wall is full of evidence. Shall we observe?',
      'Elementary: the clues to this place\'s past are written right on its walls.',
      'Never trust the obvious. Look up, look down, look behind.',
    ],
    svg: frame(
      '#D8CBAE',
      `<path d="M14 64C14 50 22 44 32 44S50 50 50 64Z" fill="#6E5A46"/><path d="M14 52C22 46 42 46 50 52L50 56C42 50 22 50 14 56Z" fill="#8A6A4A"/><circle cx="32" cy="32" r="12.5" fill="#EDC4A0"/>${eyes(32, 4.8, 1.7)}<path d="M32 33L30 38H33" stroke="#B0724A" stroke-width="1.2" fill="none"/><path d="M28.5 40.5H35.5" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/><path d="M18 26C18 14 46 14 46 26Z" fill="#9A7A5A"/><path d="M18 26C18 14 46 14 46 26" fill="none" stroke="#6E5A46" stroke-width="1"/><path d="M22 18L42 26M28 15L46 24M18 22L36 30" stroke="#6E5A46" stroke-width="0.8" opacity="0.6"/><path d="M14 26H24L22 30H14Z M50 26H40L42 30H50Z" fill="#9A7A5A"/><g transform="translate(50 50)"><circle r="6" fill="#CFE3F6" stroke="#C9963F" stroke-width="2"/><path d="M4 4L10 10" stroke="#6E4630" stroke-width="3" stroke-linecap="round"/></g>`,
    ),
  },
  {
    id: 'the-tortoise',
    landId: 'dca-cars-land',
    name: 'The Tortoise',
    book: "Aesop's Fables (translated by George Fyler Townsend, 1867)",
    quote: 'Slow but steady wins the race.',
    lines: [
      'Everyone here is in such a hurry! I find more by going slowly.',
      'Take your time on Route 66. The best sights are the ones the speedy ones miss.',
      'Walk, don\'t race. That\'s how I won, you know.',
    ],
    svg: frame(
      '#F3D9B0',
      `<path d="M8 50Q32 40 56 50" stroke="#C9A07A" stroke-width="2" fill="none" stroke-dasharray="4 4"/><path d="M14 52C14 36 26 30 36 30C46 30 52 40 52 52Z" fill="#5C8A48"/><path d="M22 40L28 36L34 40L40 36L46 42M24 48L30 44L36 48L42 44" stroke="#3E6A32" stroke-width="1.6" fill="none"/><path d="M14 52H54" stroke="#3E6A32" stroke-width="2.5"/><ellipse cx="13" cy="40" rx="8" ry="7" fill="#8FB070"/><circle cx="11" cy="38" r="1.6" fill="${INK}"/><path d="M9 43Q12 45 15 43" stroke="${INK}" stroke-width="1.1" fill="none"/><path d="M18 52V58M30 52V58M42 52V58" stroke="#8FB070" stroke-width="4" stroke-linecap="round"/>`,
    ),
  },
  {
    id: 'kiku',
    landId: 'dca-san-fransokyo-square',
    name: 'Kiku the paper crane',
    book: 'An original Once Upon a Quest story',
    quote: 'Fold by fold, a plain square becomes a bird. Look closely, and a harbor becomes a story.',
    lines: [
      'Two cities folded into one! Can you see which corner came from where?',
      'Follow the lanterns along the water. They always point somewhere good.',
      'Smell that? Fresh bread. Every harbor has its own perfume.',
    ],
    svg: frame(
      '#BFD8E8',
      `<path d="M8 44L30 36L24 52Z" fill="#FAF5EA" stroke="#C8CCD8" stroke-width="0.8"/><path d="M30 36L56 26L40 50Z" fill="#FFFFFF" stroke="#C8CCD8" stroke-width="0.8"/><path d="M24 52L30 36L40 50Z" fill="#E6E6EE"/><path d="M30 36L36 16L40 20L34 38Z" fill="#FAF5EA" stroke="#C8CCD8" stroke-width="0.8"/><path d="M36 16L42 14L40 20Z" fill="#D9677A"/><circle cx="38.5" cy="17.5" r="0.9" fill="${INK}"/><path d="M14 56H50" stroke="#4F7FB8" stroke-width="2" opacity="0.6"/><circle cx="50" cy="44" r="3" fill="#F2A04A"/>`,
    ),
  },
  {
    id: 'skin-horse',
    landId: 'dca-pixar-pier',
    name: 'The Skin Horse',
    book: 'The Velveteen Rabbit (1922)',
    quote: 'Real isn\'t how you are made. It\'s a thing that happens to you.',
    lines: [
      'A whole boardwalk of toys and games! Some of them have been loved for a very long time.',
      'Look for the rides that have stories inside them. The best toys always do.',
      'When something is loved enough, it doesn\'t mind being a little worn.',
    ],
    svg: frame(
      '#F3D9B0',
      `<path d="M16 60C16 44 20 32 30 26L34 16L38 24C48 24 56 32 54 40C53 45 47 46 43 43L36 48L38 60Z" fill="#B9A08A"/><path d="M34 16L32 26L38 24Z" fill="#9A826C"/><path d="M30 26C26 30 22 36 20 44M28 30L22 32M26 36L19 37M24 42L17 42" stroke="#6E5A46" stroke-width="2.4" stroke-linecap="round" fill="none"/><circle cx="42" cy="30" r="2" fill="${INK}"/><circle cx="51" cy="39" r="1.2" fill="#6E5A46"/><path d="M38 34L50 30M40 40L48 44" stroke="#C8475A" stroke-width="1.6"/><ellipse cx="32" cy="46" rx="5" ry="3.6" fill="#D8CBAE"/><ellipse cx="44" cy="35" rx="3" ry="2" fill="#D8CBAE"/><path d="M27 52L29 54M31 52L33 54M35 52L37 54" stroke="#6E5A46" stroke-width="0.9"/>`,
    ),
  },
  {
    id: 'the-owl',
    landId: 'dca-paradise-gardens-park',
    name: 'The Owl (and the Pussy-cat)',
    book: 'The Owl and the Pussy-cat (Edward Lear, 1871)',
    quote: 'The Owl and the Pussy-cat went to sea in a beautiful pea-green boat.',
    lines: [
      'O lovely bay! O lovely bay! What a beautiful place for a boat.',
      'Shall we stroll to the bandstand? I\'ll bring my guitar.',
      'Look out over the water. Things always shine a little brighter by the sea.',
    ],
    svg: frame(
      '#C9E3F0',
      `<path d="M8 50H56L50 60H14Z" fill="#8FC07A"/><path d="M8 50H56" stroke="#5C8A48" stroke-width="2"/><ellipse cx="30" cy="38" rx="12" ry="13" fill="#9A7A5A"/><path d="M21 28L24 22L27 27M39 28L36 22L33 27" fill="#9A7A5A"/><circle cx="26" cy="35" r="5" fill="#FAF5EA"/><circle cx="34" cy="35" r="5" fill="#FAF5EA"/><circle cx="26" cy="35" r="2.4" fill="${INK}"/><circle cx="34" cy="35" r="2.4" fill="${INK}"/><path d="M30 38L28 41H32Z" fill="#E2B04A"/><ellipse cx="30" cy="45" rx="7" ry="4" fill="#C9A983"/><g transform="translate(45 40) rotate(-25)"><ellipse cx="0" cy="4" rx="5" ry="6" fill="#C99A5A"/><rect x="-1" y="-10" width="2" height="12" fill="#6E4630"/><circle cx="0" cy="4" r="1.6" fill="#6E4630"/></g>`,
    ),
  },
  {
    id: 'john-muir',
    landId: 'dca-grizzly-peak',
    name: 'John Muir, mountain naturalist',
    book: 'A letter to his sister (1873)',
    quote: 'The mountains are calling and I must go.',
    lines: [
      'Smell the pines! Even a mountain made by people can remind you of the real wild.',
      'Listen to the river. Every rushing stream is singing its own song.',
      'Walk softly on the trail and look for the little things: bark, stone, a hawk overhead.',
    ],
    svg: frame(
      '#C9E3C0',
      `<path d="M4 44L20 20L34 44Z M30 44L46 16L62 44Z" fill="#8FA88A"/><path d="M14 64C14 50 22 44 32 44S50 50 50 64Z" fill="#7A6A4A"/><circle cx="32" cy="30" r="11" fill="#D9A273"/>${eyes(29, 4.4, 1.6)}<path d="M21 32C21 48 43 48 43 32C40 38 24 38 21 32Z" fill="#B8B0A0"/><path d="M27 36Q32 38 37 36" stroke="#8E8676" stroke-width="1.2" fill="none"/><path d="M18 22C18 14 46 14 46 22Z" fill="#5A4A3A"/><path d="M14 23H50" stroke="#4A3A2A" stroke-width="2.4"/>`,
    ),
  },

];

export function companionForLand(landId: string | null | undefined): Companion | null {
  return COMPANIONS.find((c) => c.landId === landId) ?? null;
}
