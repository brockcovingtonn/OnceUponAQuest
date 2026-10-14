// Renders the app icon, Android icon layers, splash image and favicon from the
// logo mark in src/art/logoMark.ts, so every icon matches the in-app logo.
//
//   node scripts/generate-icons.mjs
//
// Writes into assets/images/. App icons and the splash image are native
// assets: after changing them, make a new build (an over-the-air update can't
// replace them).
import { writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

import { logoSvg } from '../src/art/logoMark.ts';

const OUT = 'assets/images';
const MIDNIGHT = '#1B2340';

/** Places the 100 × 100 mark at `fraction` of a `size` canvas, optionally on a background. */
function compose(variant, size, fraction, background) {
  const inner = logoSvg(variant).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const scale = (size * fraction) / 100;
  const offset = (size - 100 * scale) / 2;
  const bg = background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bg}<g transform="translate(${offset} ${offset}) scale(${scale})">${inner}</g></svg>`;
}

function png(svg, file) {
  writeFileSync(`${OUT}/${file}`, new Resvg(svg, { fitTo: { mode: 'original' } }).render().asPng());
  console.log(`Wrote ${OUT}/${file}`);
}

// iOS app icon: full-bleed night sky (iOS rounds the corners itself).
png(compose('tile', 1024, 1), 'icon.png');
// Android adaptive icon: the mark inside the 66% safe zone, the sky behind it, and a themed silhouette.
png(compose('bare', 512, 0.66), 'android-icon-foreground.png');
png(compose('backdrop', 512, 1), 'android-icon-background.png');
png(compose('mono', 432, 0.62), 'android-icon-monochrome.png');
// Splash image (drawn on midnight by expo-splash-screen at 200 pt wide) and web favicon.
png(compose('bare', 600, 1), 'splash-icon.png');
png(compose('tile', 48, 1, MIDNIGHT), 'favicon.png');
