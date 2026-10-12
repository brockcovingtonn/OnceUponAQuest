// Synthesizes the app's original sound effects (no samples, no outside audio):
//   assets/sounds/stamp.wav  — a soft, papery stamp "thunk"
//   assets/sounds/chime.wav  — a sparkly bell arpeggio for earning a badge
//   assets/sounds/saved.wav  — a gentle two-note "saved for later"
//   node scripts/generate-sounds.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const RATE = 22050;

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

/** Scale to a peak of -3 dBFS and fade the ends so nothing clicks. */
function finish(samples, fadeMs = 8) {
  const peak = Math.max(...samples.map(Math.abs)) || 1;
  const gain = 0.707 / peak;
  const fade = Math.floor((RATE * fadeMs) / 1000);
  return samples.map((s, i) => {
    const edge = Math.min(1, i / fade, (samples.length - 1 - i) / fade);
    return s * gain * edge;
  });
}

// Deterministic noise so the files are identical every run.
let seed = 7;
const noise = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648) * 2 - 1;

function stamp() {
  const n = Math.floor(RATE * 0.32);
  const out = new Array(n).fill(0);
  let phase = 0;
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    // Low thump: pitch sweeps down 150 → 55 Hz
    const f = 55 + 95 * Math.exp(-t * 30);
    phase += (2 * Math.PI * f) / RATE;
    const thump = Math.sin(phase) * Math.exp(-t * 18);
    // Papery slap: filtered noise burst at the start
    lp += 0.35 * (noise() - lp);
    const slap = lp * Math.exp(-t * 90) * 0.6;
    // Tiny woody click on top
    const click = Math.sin(2 * Math.PI * 1400 * t) * Math.exp(-t * 260) * 0.25;
    out[i] = thump + slap + click;
  }
  return finish(out, 4);
}

function bell(out, startS, freq, gain, decay) {
  const start = Math.floor(startS * RATE);
  for (let i = start; i < out.length; i++) {
    const t = (i - start) / RATE;
    const env = Math.exp(-t * decay) * Math.min(1, t * 400);
    // Bell-like inharmonic partials
    out[i] +=
      gain *
      env *
      (Math.sin(2 * Math.PI * freq * t) +
        0.45 * Math.sin(2 * Math.PI * freq * 2.76 * t) * Math.exp(-t * 4) +
        0.2 * Math.sin(2 * Math.PI * freq * 5.4 * t) * Math.exp(-t * 7));
  }
}

function chime() {
  const out = new Array(Math.floor(RATE * 1.6)).fill(0);
  // Rising C-major arpeggio, then a soft high sparkle
  [1046.5, 1318.5, 1568, 2093].forEach((f, k) => bell(out, k * 0.09, f, 1 - k * 0.12, 3.2));
  [3136, 2637, 3520, 4186].forEach((f, k) => bell(out, 0.42 + k * 0.06, f, 0.18, 9));
  return finish(out);
}

function saved() {
  const out = new Array(Math.floor(RATE * 0.7)).fill(0);
  bell(out, 0, 784, 0.8, 7); // G5
  bell(out, 0.12, 1046.5, 0.7, 6); // C6
  return finish(out);
}

mkdirSync('assets/sounds', { recursive: true });
writeFileSync('assets/sounds/stamp.wav', wav(stamp()));
writeFileSync('assets/sounds/chime.wav', wav(chime()));
writeFileSync('assets/sounds/saved.wav', wav(saved()));
console.log('Wrote assets/sounds/stamp.wav, chime.wav, saved.wav');
