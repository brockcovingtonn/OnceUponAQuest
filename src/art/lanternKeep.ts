/**
 * Lantern Keep: our own storybook castle, drawn on the map where the park's
 * real castle stands. A squat Scottish tower house with crow-stepped gables
 * and one stout tower topped by a glass lantern, in our Midnight, Gold and
 * Parchment palette.
 *
 * Castle rules (CLAUDE.md hard rule 2): in-app only (never the logo, icon,
 * splash or store art); no tall cluster of slim spires; no pink-and-blue or
 * blue-and-gold towers; never with an arc, star or fireworks over it; and it
 * must pass the squint test.
 *
 * The lore: the lamplighters of every storybook keep one lantern burning at
 * the top of this keep, so travelers lost in any story can find their way home.
 */

const G = '#E2B04A';
const ROOF = '#2E3A63';
const STONE = '#E9DFC8';
const STONE2 = '#D8CBAE';

const win = (x: number, y: number, w = 6, h = 9) =>
  `<path d="M${x} ${y + h}V${y + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2}V${y + h}Z" fill="${G}"/>`;

/** Drawn in a 132 × 134 box; its base (the doorstep) is the bottom edge. */
export const LANTERN_KEEP_BOX = { width: 132, height: 134 };

export const lanternKeepSvg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 22 132 134">` +
  '<rect x="40" y="150" width="130" height="6" rx="3" fill="#C9BFA6"/>' +
  `<path d="M52 150V86H70V78H76V72H82V66H88V60H94V66H100V72H106V78H112V86H120V150Z" fill="${STONE}" stroke="#8E7A6A" stroke-width="1"/>` +
  `<path d="M52 86H120" stroke="${STONE2}" stroke-width="2"/>` +
  `<rect x="118" y="70" width="34" height="80" fill="${STONE2}" stroke="#8E7A6A" stroke-width="1"/>` +
  `<rect x="114" y="66" width="42" height="8" fill="${STONE}" stroke="#8E7A6A" stroke-width="1"/>` +
  [114, 122, 130, 138, 146].map((x) => `<rect x="${x}" y="60" width="5" height="7" fill="${STONE}" stroke="#8E7A6A" stroke-width="0.8"/>`).join('') +
  `<circle cx="135" cy="48" r="13" fill="#FFE9A8" opacity="0.45"/>` +
  `<path d="M125 60H145V42C145 36 140 33 135 33C130 33 125 36 125 42Z" fill="#F6D58E" stroke="${G}" stroke-width="2"/>` +
  `<path d="M130 60V40M135 60V35M140 60V40M125 50H145" stroke="${G}" stroke-width="1.2"/>` +
  `<path d="M122 42L135 24L148 42Z" fill="${ROOF}"/><circle cx="135" cy="24" r="2.4" fill="${G}"/>` +
  win(62, 96) +
  win(78, 96) +
  win(94, 96) +
  win(106, 120) +
  win(130, 84) +
  win(130, 108) +
  `<path d="M76 150V128C76 120 96 120 96 128V150Z" fill="${ROOF}"/><path d="M86 122V150" stroke="${G}" stroke-width="1.2"/>` +
  `<rect x="56" y="114" width="12" height="3" fill="${G}"/>` +
  '<path d="M44 150C44 138 52 132 58 136V150Z" fill="#7FA34A"/><path d="M158 150C158 140 166 136 172 140V150Z" fill="#7FA34A"/>' +
  '</svg>';
