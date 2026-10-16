/**
 * Lantern Keep: our own storybook castle, drawn on the map where the park's
 * real castle stands. A grand Scottish baronial castle on a grassy rock:
 * a crenellated curtain wall, two stout round towers, crow-stepped great
 * halls, a gatehouse with its portcullis and bridge, and one broad central
 * tower crowned by a glass lantern. Midnight, Gold and Parchment palette.
 *
 * Castle rules (CLAUDE.md hard rule 2): in-app only (never the logo, icon,
 * splash or store art); no tall cluster of slim spires (every tower here is
 * stout and flat-topped except the one lantern); no pink-and-blue or
 * blue-and-gold towers; never with an arc, star or fireworks over it; and it
 * passes the squint test (from the Oct 2026 castle study, option A).
 *
 * The lore: the lamplighters of every storybook keep one lantern burning at
 * the top of this keep, so travelers lost in any story can find their way home.
 */

const G = '#E2B04A';
const ROOF = '#2E3A63';
const ROOF2 = '#3A4878';
const S1 = '#EDE3CC';
const S2 = '#D9CBAA';
const S3 = '#C4B48E';
const LINE = '#8E7A6A';
const GLOW = '#F6D58E';

const win = (x: number, y: number, w = 6, h = 10) =>
  `<path d="M${x} ${y + h}V${y + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2}V${y + h}Z" fill="${G}"/>`;

function crenel(x1: number, x2: number, y: number, fill: string, step = 8): string {
  let out = '';
  for (let x = x1; x < x2 - 2; x += step) {
    out += `<rect x="${x}" y="${y - 5}" width="${step / 2 + 1}" height="6" fill="${fill}" stroke="${LINE}" stroke-width="0.6"/>`;
  }
  return out;
}

/** A stout, flat-topped round tower seen from the front. */
function drum(cx: number, top: number, bottom: number, r: number): string {
  return (
    `<rect x="${cx - r}" y="${top}" width="${r * 2}" height="${bottom - top}" fill="${S1}" stroke="${LINE}" stroke-width="0.8"/>` +
    `<rect x="${cx + r * 0.3}" y="${top}" width="${r * 0.7}" height="${bottom - top}" fill="${S3}" opacity="0.6"/>` +
    `<rect x="${cx - r - 3}" y="${top - 6}" width="${r * 2 + 6}" height="7" fill="${S1}" stroke="${LINE}" stroke-width="0.8"/>` +
    crenel(cx - r - 3, cx + r + 3, top - 6, S1, 7)
  );
}

const flag = (x: number, y: number, c: string) =>
  `<path d="M${x} ${y}V${y - 16}" stroke="${LINE}" stroke-width="1.2"/><path d="M${x} ${y - 16}L${x + 11} ${y - 13}L${x} ${y - 10}Z" fill="${c}"/>`;

/** Drawn in a 306 × 212 box; its base (the rock) is the bottom edge. */
export const LANTERN_KEEP_BOX = { width: 306, height: 212 };

export const lanternKeepSvg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="8 -16 306 212">` +
  // The rock and grass.
  '<path d="M10 196C30 180 60 176 90 178H230C262 176 290 182 312 196Z" fill="#8E9A7A"/>' +
  '<path d="M18 196C40 186 70 184 100 186L120 196Z" fill="#7A8866"/>' +
  // Curtain wall and the two round towers.
  `<rect x="40" y="128" width="240" height="56" fill="${S2}" stroke="${LINE}" stroke-width="0.8"/>` +
  crenel(40, 280, 128, S2) +
  drum(46, 110, 184, 12) +
  drum(274, 112, 184, 12) +
  // Great halls with crow-stepped gables, and the broad keep between them.
  `<path d="M70 128V84H88V76H96V68H104V60H112V68H120V76H128V84H146V128Z" fill="${S1}" stroke="${LINE}" stroke-width="0.8"/>` +
  `<path d="M146 128V70H200V128Z" fill="${S2}" stroke="${LINE}" stroke-width="0.8"/>` +
  crenel(146, 200, 70, S2) +
  `<path d="M200 128V90H218V82H226V74H234V82H242V90H254V128Z" fill="${S1}" stroke="${LINE}" stroke-width="0.8"/>` +
  // The lantern tower.
  drum(173, 40, 70, 15) +
  `<circle cx="173" cy="22" r="18" fill="#FFE9A8" opacity="0.4"/>` +
  `<path d="M161 34H185V18C185 10 179 6 173 6C167 6 161 10 161 18Z" fill="${GLOW}" stroke="${G}" stroke-width="2"/>` +
  `<path d="M167 34V14M173 34V8M179 34V14M161 24H185" stroke="${G}" stroke-width="1.2"/>` +
  `<path d="M157 18L173 -2L189 18Z" fill="${ROOF}"/><circle cx="173" cy="-2" r="2.6" fill="${G}"/>` +
  // Lit windows.
  win(84, 96) +
  win(100, 96) +
  win(116, 96) +
  win(132, 96) +
  win(156, 84) +
  win(170, 84) +
  win(184, 84) +
  win(212, 100) +
  win(228, 100) +
  win(240, 100) +
  win(42, 130, 6, 9) +
  win(270, 130, 6, 9) +
  win(169, 48, 8, 12) +
  // Gatehouse, portcullis and bridge.
  `<rect x="150" y="140" width="46" height="44" fill="${S1}" stroke="${LINE}" stroke-width="0.8"/>` +
  crenel(150, 196, 140, S1) +
  `<path d="M160 184V164C160 154 186 154 186 164V184Z" fill="${ROOF}"/>` +
  `<path d="M164 166H182M164 172H182M164 178H182M168 158V184M173 156V184M178 158V184" stroke="${G}" stroke-width="0.9"/>` +
  '<path d="M160 196L164 184H182L186 196Z" fill="#9A8466"/>' +
  `<path d="M60 184V170C60 166 66 166 66 170V184ZM250 184V170C250 166 256 166 256 170V184Z" fill="${ROOF}"/>` +
  // Banners.
  flag(46, 104, '#D9677A') +
  flag(274, 106, ROOF2) +
  flag(107, 60, G) +
  '</svg>';
