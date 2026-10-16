/**
 * "Fireworks over the park": the night skyline the intro flies into through
 * the logo's keyhole. Original artwork in our own storybook style: a snowy
 * alpine peak, red-rock buttes, a rocket ride, our own Lantern Keep on the
 * railroad berm, and Main Street rooftops outlined in lights. No characters or
 * three-circle shapes. Lantern Keep here is an owner-approved exception to the
 * castle rule (CLAUDE.md hard rule 2), pending attorney review.
 *
 * Drawn on a 400 × 860 portrait canvas; show it with
 * preserveAspectRatio "xMidYMax slice" so the skyline always sits on the
 * bottom edge. The train is separate (SKYLINE_TRAIN) so it can roll along
 * the berm at TRAIN_TRACK_Y.
 */

import { lanternKeepSvg } from './lanternKeep';

export const SKYLINE = { width: 400, height: 860 };
/** Where the train's wheels sit, in skyline units. */
export const TRAIN_TRACK_Y = 693;
export const TRAIN = { width: 92, height: 26 };

// Small deterministic scatter, so the stars never move between renders.
function stars(): string {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  let out = '';
  for (let i = 0; i < 70; i++) {
    const x = (rand() * 400).toFixed(1);
    const y = (rand() * 520).toFixed(1);
    const r = (0.5 + rand() * 1.1).toFixed(2);
    const o = (0.35 + rand() * 0.6).toFixed(2);
    out += `<circle cx="${x}" cy="${y}" r="${r}" opacity="${o}"/>`;
  }
  return `<g fill="#FFF4CF">${out}</g>`;
}

/** A row of lit windows: n windows of w × h starting at (x, y), `gap` apart. */
function windows(x: number, y: number, n: number, w: number, h: number, gap: number): string {
  let out = '';
  for (let i = 0; i < n; i++) out += `<rect x="${x + i * gap}" y="${y}" width="${w}" height="${h}" rx="${w / 2}"/>`;
  return out;
}

/** Marquee bulbs along a straight roof line. */
function bulbs(x1: number, y1: number, x2: number, y2: number, n: number): string {
  let out = '';
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out += `<circle cx="${(x1 + (x2 - x1) * t).toFixed(1)}" cy="${(y1 + (y2 - y1) * t).toFixed(1)}" r="1.1"/>`;
  }
  return out;
}

const DEFS =
  '<defs>' +
  '<linearGradient id="skSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E1330"/><stop offset="0.45" stop-color="#1B2340"/><stop offset="0.72" stop-color="#2F2C66"/><stop offset="0.86" stop-color="#5A3F80"/><stop offset="1" stop-color="#7C4F86"/></linearGradient>' +
  '<radialGradient id="skGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#F6D58E" stop-opacity="0.55"/><stop offset="1" stop-color="#F6D58E" stop-opacity="0"/></radialGradient>' +
  '<radialGradient id="skStar" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF0BF" stop-opacity="0.9"/><stop offset="1" stop-color="#FFF0BF" stop-opacity="0"/></radialGradient>' +
  '<radialGradient id="skLamp" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFD98A" stop-opacity="0.7"/><stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></radialGradient>' +
  '<mask id="skMoon"><circle cx="350" cy="206" r="15" fill="#fff"/><circle cx="357" cy="200" r="13" fill="#000"/></mask>' +
  '</defs>';

const SKY =
  '<rect width="400" height="860" fill="url(#skSky)"/>' +
  stars() +
  '<circle cx="350" cy="206" r="26" fill="url(#skStar)" opacity="0.5"/>' +
  '<circle cx="350" cy="206" r="15" fill="#FFF0BF" mask="url(#skMoon)"/>' +
  // The wishing star from the logo, right where the keyhole first looks.
  '<circle cx="200" cy="372" r="30" fill="url(#skStar)" opacity="0.8"/>' +
  '<polygon points="200,360 203.4,369.5 213.4,369.8 205.5,375.9 208.3,385.5 200,379.9 191.7,385.5 194.5,375.9 186.6,369.8 196.6,369.5" fill="#FFF0BF"/>' +
  // Warm haze over the park.
  '<ellipse cx="200" cy="690" rx="260" ry="120" fill="url(#skGlow)" opacity="0.55"/>';

// A hot-air balloon drifting over the left side.
const BALLOON =
  '<g transform="translate(62 452)">' +
  '<path d="M0 -18C10 -18 15 -10 15 -3C15 6 6 12 3 17H-3C-6 12 -15 6 -15 -3C-15 -10 -10 -18 0 -18Z" fill="#D9677A"/>' +
  '<path d="M0 -18C4 -18 6 -10 6 -3C6 6 2 12 1.2 17H-1.2C-2 12 -6 6 -6 -3C-6 -10 -4 -18 0 -18Z" fill="#FAF5EA"/>' +
  '<path d="M-14 -5H14" stroke="#E2B04A" stroke-width="1.4"/>' +
  '<path d="M-3 17L-3.5 22M3 17L3.5 22" stroke="#C9B48A" stroke-width="0.7"/>' +
  '<rect x="-4" y="22" width="8" height="5" rx="1" fill="#8A5A3C"/>' +
  '</g>';

// The snowy peak, behind the station on the left.
const PEAK =
  '<path d="M30 702L95 600L108 610L150 470L165 505L176 498L215 580L232 575L275 702Z" fill="#2E2A5C"/>' +
  '<path d="M150 470L165 505L176 498L215 580L232 575L275 702H172L158 560Z" fill="#26234F"/>' +
  '<path d="M150 470L165 505L176 498L190 528L181 524L174 533L165 522L157 534L149 521L141 532L136 524L132 530L139 506Z" fill="#D9D6EE"/>' +
  '<path d="M150 470L165 505L176 498L190 528L181 524L174 533L165 522L157 534L155 512Z" fill="#B4AFD6"/>' +
  // Pines along the foot of the mountain.
  '<g fill="#1C2448">' +
  '<path d="M60 702l7-22 7 22z"/><path d="M72 702l6-18 6 18z"/><path d="M226 702l6-19 6 19z"/><path d="M238 702l7-24 7 24z"/><path d="M252 702l5-15 5 15z"/>' +
  '</g>';

// Red-rock buttes, far right.
const BUTTES =
  '<path d="M300 702L305 652L318 648L323 620L356 616L361 636L381 633L386 606L412 604V702Z" fill="#5A3450"/>' +
  '<path d="M323 620L356 616L357 624L324 628Z M386 606L412 604V612L387 614Z" fill="#7A4560"/>' +
  '<path d="M306 668H340M318 684H360M362 652H405M372 676H410" stroke="#6C3D58" stroke-width="1.6" stroke-linecap="round"/>';

/** A little rocket at (x, y), nose pointing right (dir 1) or left (dir -1). */
function rocket(x: number, y: number, dir: 1 | -1): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${dir} 1)">` +
    '<path d="M-6 -3.5H-9L-6 -1Z M-6 3.5H-9L-6 1Z" fill="#D9677A"/>' +
    '<path d="M-7 0C-7 -3.5 2 -4.5 9 0C2 4.5 -7 3.5 -7 0Z" fill="#C9CEEA"/>' +
    '<circle cx="1.5" cy="0" r="1.5" fill="#F6D58E"/>' +
    '</g>'
  );
}

// Lantern Keep at night, standing on the berm to the right of the snowy peak
// (staggered so the peak and its snowcap stay in view). Its stone is recolored
// for moonlight; the windows and the lantern stay lit.
// Castle-rule exception: CLAUDE.md hard rule 2 (owner decision, pending attorney review).
const NIGHT_STONE: [string, string][] = [
  ['#EDE3CC', '#6E6A92'],
  ['#D9CBAA', '#5E5A84'],
  ['#C4B48E', '#4E4A74'],
  ['#8E7A6A', '#2E2A50'],
  ['#8E9A7A', '#2F4A4A'],
  ['#7A8866', '#28403F'],
  ['#9A8466', '#4A3E3A'],
];
const KEEP_SCALE = 0.5;
const KEEP =
  `<g transform="translate(176 ${700 - 212 * KEEP_SCALE}) scale(${KEEP_SCALE}) translate(-8 16)">` +
  NIGHT_STONE.reduce((svg, [day, night]) => svg.split(day).join(night), lanternKeepSvg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')) +
  '</g>';

// A rocket ride: a mast with a golden orb and rockets on curved arms.
const ROCKETS =
  '<g transform="translate(360 0)">' +
  '<path d="M-14 690L-9 668H9L14 690Z" fill="#3A3F72"/>' +
  '<rect x="-2.2" y="596" width="4.4" height="74" fill="#8F97C6"/>' +
  '<ellipse cx="0" cy="606" rx="31" ry="6" fill="none" stroke="#8F97C6" stroke-width="1.6"/>' +
  '<path d="M0 600Q-16 600 -29 610M0 600Q16 600 29 610" fill="none" stroke="#8F97C6" stroke-width="1.6"/>' +
  rocket(-29, 611, -1) +
  rocket(29, 611, 1) +
  '<circle cx="0" cy="590" r="7.5" fill="#E2B04A"/><circle cx="-2.5" cy="587.5" r="2.2" fill="#F6D58E"/>' +
  '<path d="M0 582.5V574" stroke="#8F97C6" stroke-width="1.2"/>' +
  '</g>';

// The railroad berm across the park, with the track on top.
const BERM =
  '<path d="M-10 704C70 694 140 694 200 694C260 694 330 694 410 704V830H-10Z" fill="#1F3446"/>' +
  '<path d="M-10 704C70 694 140 694 200 694C260 694 330 694 410 704" fill="none" stroke="#2F5A57" stroke-width="2"/>';

// Main Street rooftops in the foreground, outlined in lights.
const STREET_LEFT =
  '<g>' +
  '<path d="M-12 726H22L30 712H-12Z" fill="#1A1F3D"/>' +
  '<rect x="-12" y="726" width="44" height="140" fill="#151A35"/>' +
  '<path d="M30 742L36 730H88L94 742Z" fill="#1A1F3D"/>' +
  '<rect x="32" y="742" width="60" height="124" fill="#121731"/>' +
  '<path d="M52 730Q62 712 72 730Z" fill="#1A1F3D"/>' +
  '<path d="M62 716V700" stroke="#3A3F62" stroke-width="1.2"/><path d="M62 700L72 703L62 706Z" fill="#E2B04A"/>' +
  '<path d="M92 776L112 756L132 776Z" fill="#1A1F3D"/>' +
  '<rect x="94" y="776" width="36" height="90" fill="#151A35"/>' +
  '<g fill="#F6D58E" opacity="0.9">' +
  windows(-6, 740, 3, 5, 9, 11) +
  windows(-6, 764, 3, 5, 9, 11) +
  windows(40, 754, 4, 5, 9, 13) +
  windows(40, 778, 4, 5, 9, 13) +
  windows(101, 788, 3, 5, 9, 10) +
  '</g>' +
  '<g fill="#FFE7A8">' +
  bulbs(-12, 726, 22, 726, 6) +
  bulbs(22, 726, 30, 712, 2) +
  bulbs(36, 730, 88, 730, 10) +
  bulbs(92, 776, 112, 756, 4) +
  bulbs(112, 756, 132, 776, 4) +
  '</g>' +
  '</g>';

const STREET_RIGHT =
  '<g>' +
  '<path d="M268 778L286 760H304L322 778Z" fill="#1A1F3D"/>' +
  '<rect x="270" y="778" width="50" height="90" fill="#151A35"/>' +
  '<rect x="318" y="738" width="44" height="130" fill="#121731"/>' +
  '<path d="M314 740L322 724H358L366 740Z" fill="#1A1F3D"/>' +
  '<path d="M330 724Q340 704 350 724Z" fill="#1A1F3D"/>' +
  '<path d="M340 708V692" stroke="#3A3F62" stroke-width="1.2"/><path d="M340 692L350 695L340 698Z" fill="#D9677A"/>' +
  '<path d="M360 722H412V760H360Z" fill="#151A35"/>' +
  '<path d="M356 722L366 708H412V722Z" fill="#1A1F3D"/>' +
  '<rect x="360" y="760" width="52" height="108" fill="#151A35"/>' +
  '<g fill="#F6D58E" opacity="0.9">' +
  windows(278, 790, 3, 5, 9, 14) +
  windows(326, 752, 3, 5, 9, 13) +
  windows(326, 776, 3, 5, 9, 13) +
  windows(368, 734, 3, 5, 9, 13) +
  windows(368, 770, 3, 5, 9, 13) +
  '</g>' +
  '<g fill="#FFE7A8">' +
  bulbs(268, 778, 286, 760, 4) +
  bulbs(286, 760, 304, 760, 3) +
  bulbs(304, 760, 322, 778, 4) +
  bulbs(322, 724, 358, 724, 7) +
  bulbs(366, 708, 412, 708, 9) +
  '</g>' +
  '</g>';

// Gas lamps and the plaza.
const PLAZA =
  '<rect x="-12" y="820" width="424" height="50" fill="#0E1228"/>' +
  '<circle cx="152" cy="784" r="18" fill="url(#skLamp)"/><circle cx="248" cy="784" r="18" fill="url(#skLamp)"/>' +
  '<g fill="#0B0F22"><rect x="150.8" y="788" width="2.4" height="40"/><rect x="246.8" y="788" width="2.4" height="40"/><rect x="147" y="826" width="10" height="4" rx="1"/><rect x="243" y="826" width="10" height="4" rx="1"/></g>' +
  '<g fill="#FFE7A8"><path d="M148 788L150 778H154L156 788Z"/><path d="M244 788L246 778H250L252 788Z"/></g>' +
  '<path d="M146 778H158M242 778H254" stroke="#0B0F22" stroke-width="1.6"/>';

export const skylineSvg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SKYLINE.width} ${SKYLINE.height}" preserveAspectRatio="xMidYMax slice">` +
  DEFS +
  SKY +
  BALLOON +
  BUTTES +
  PEAK +
  ROCKETS +
  KEEP +
  BERM +
  STREET_LEFT +
  STREET_RIGHT +
  PLAZA +
  '</svg>';

/** The little steam train: an engine and two coaches with lit windows (92 × 26). */
export const trainSvg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TRAIN.width} ${TRAIN.height}">` +
  // Coaches.
  '<rect x="2" y="9" width="24" height="12" rx="2" fill="#7A2E3E"/><path d="M1 9.5H27" stroke="#E2B04A" stroke-width="1.6"/>' +
  '<rect x="30" y="9" width="24" height="12" rx="2" fill="#7A2E3E"/><path d="M29 9.5H55" stroke="#E2B04A" stroke-width="1.6"/>' +
  '<g fill="#F6D58E"><rect x="5" y="12" width="4" height="4" rx="1"/><rect x="12" y="12" width="4" height="4" rx="1"/><rect x="19" y="12" width="4" height="4" rx="1"/><rect x="33" y="12" width="4" height="4" rx="1"/><rect x="40" y="12" width="4" height="4" rx="1"/><rect x="47" y="12" width="4" height="4" rx="1"/></g>' +
  // Engine: cab, boiler, stack and cowcatcher.
  '<rect x="58" y="6" width="11" height="15" rx="1" fill="#2E4F46"/><rect x="60" y="9" width="7" height="5" rx="1" fill="#F6D58E"/>' +
  '<path d="M56 5H71" stroke="#E2B04A" stroke-width="1.6"/>' +
  '<rect x="68" y="11" width="18" height="9" rx="4" fill="#2E4F46"/><path d="M70 11.5V19.5M75 11.5V19.5" stroke="#E2B04A" stroke-width="1"/>' +
  '<path d="M79 11L78 4H84L83 11Z" fill="#1E2A2A"/><circle cx="86.5" cy="13" r="1.6" fill="#FFE7A8"/>' +
  '<path d="M86 20L91 23H84Z" fill="#E2B04A"/>' +
  '<g fill="#D9677A"><circle cx="8" cy="22" r="2.6"/><circle cx="20" cy="22" r="2.6"/><circle cx="36" cy="22" r="2.6"/><circle cx="48" cy="22" r="2.6"/><circle cx="64" cy="21" r="3.6"/><circle cx="74" cy="22" r="2.6"/><circle cx="81" cy="22" r="2.6"/></g>' +
  '<g fill="#FAF5EA" opacity="0.55"><circle cx="81" cy="2.5" r="2.2"/><circle cx="77" cy="1.5" r="1.6"/></g>' +
  '</svg>';
