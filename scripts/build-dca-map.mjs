// Builds the storybook map of Disney California Adventure from OpenStreetMap.
//
//   node scripts/build-dca-map.mjs            uses the cached download in .expo/osm-dca/ (git-ignored)
//   node scripts/build-dca-map.mjs --refresh  downloads fresh data from the Overpass API first
//
// Writes src/art/dcaGeo.ts: walkways, building footprints, water, rockwork,
// greenery, coaster track and land outlines, projected at one pixel per meter
// (north up) so GPS pins land in the right place. Same approach and drawing
// rules as scripts/build-park-map.mjs (Disneyland); nothing is traced from any
// official map, and no names are drawn.
//
// Map data © OpenStreetMap contributors, available under the Open Database
// License (ODbL). The app credits OpenStreetMap on the map and in About.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const CACHE = '.expo/osm-dca';
const OUT = 'src/art/dcaGeo.ts';
const BBOX = '33.8025,-117.9245,33.8100,-117.9150';
const PARK_RELATION = 15626312;

async function overpass(query) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'User-Agent': 'OnceUponAQuest-map-builder/1.0', Accept: 'application/json' },
      body: new URLSearchParams({ data: query }),
    });
    const text = await res.text();
    if (text.startsWith('{')) return JSON.parse(text);
    console.log(`Overpass busy (attempt ${attempt}); retrying in 30 s…`);
    await new Promise((r) => setTimeout(r, 30000));
  }
  throw new Error('Overpass did not answer; try again later.');
}

async function load() {
  if (process.argv.includes('--refresh') || !existsSync(`${CACHE}/park.json`)) {
    mkdirSync(CACHE, { recursive: true });
    const park = await overpass(`[out:json][timeout:170];(way(${BBOX});relation(${BBOX}););out geom tags;`);
    writeFileSync(`${CACHE}/park.json`, JSON.stringify(park));
    const ids = park.elements.filter((e) => e.type === 'relation' && ['multipolygon', 'building'].includes(e.tags?.type)).map((e) => e.id);
    const rels = await overpass(`[out:json][timeout:180];(relation(id:${ids.join(',')}););out geom;`);
    writeFileSync(`${CACHE}/relations.json`, JSON.stringify(rels));
  }
  return {
    ways: JSON.parse(readFileSync(`${CACHE}/park.json`, 'utf8')).elements.filter((e) => e.type === 'way' && e.geometry).map((e) => ({ ...e, tags: e.tags ?? {} })),
    rels: JSON.parse(readFileSync(`${CACHE}/relations.json`, 'utf8')).elements,
  };
}

// ---------------------------------------------------------------------------
// Geometry helpers (same as the Disneyland builder)
// ---------------------------------------------------------------------------
const LAT0 = 33.8062;
const LNG0 = -117.9196;
const φ = (LAT0 * Math.PI) / 180;
const M_PER_LAT = 111132.92 - 559.82 * Math.cos(2 * φ) + 1.175 * Math.cos(4 * φ);
const M_PER_LNG = 111412.84 * Math.cos(φ) - 93.5 * Math.cos(3 * φ);
const meters = (p) => ({ x: (p.lon - LNG0) * M_PER_LNG, y: (LAT0 - p.lat) * M_PER_LAT });

const area = (ring) => {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j].x + ring[i].x) * (ring[j].y - ring[i].y);
  return a / 2;
};
function centroid(ring) {
  let x = 0, y = 0, a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const f = ring[j].x * ring[i].y - ring[i].x * ring[j].y;
    x += (ring[j].x + ring[i].x) * f;
    y += (ring[j].y + ring[i].y) * f;
    a += f;
  }
  if (Math.abs(a) < 1e-9) return { x: ring[0].x, y: ring[0].y };
  return { x: x / (3 * a), y: y / (3 * a) };
}
function inside(pt, ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if (a.y > pt.y !== b.y > pt.y && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}
function bbox(pts) {
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let max = 0, idx = -1;
    const a = pts[s], b = pts[e];
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    for (let i = s + 1; i < e; i++) {
      const d = Math.abs(dy * pts[i].x - dx * pts[i].y + b.x * a.y - b.y * a.x) / len;
      if (d > max) (max = d), (idx = i);
    }
    if (max > tol && idx > 0) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}
function assembleRings(lines) {
  const key = (p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  const pool = lines.map((l) => [...l]);
  const rings = [];
  while (pool.length) {
    let ring = pool.shift();
    let grew = true;
    while (key(ring[0]) !== key(ring[ring.length - 1]) && grew) {
      grew = false;
      for (let i = 0; i < pool.length; i++) {
        const l = pool[i];
        if (key(l[0]) === key(ring[ring.length - 1])) ring = ring.concat(l.slice(1));
        else if (key(l[l.length - 1]) === key(ring[ring.length - 1])) ring = ring.concat([...l].reverse().slice(1));
        else continue;
        pool.splice(i, 1);
        grew = true;
        break;
      }
    }
    if (ring.length > 3) rings.push(ring);
  }
  return rings;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
const { ways, rels } = await load();
const geom = (w) => w.geometry.map(meters);
const closed = (w) => w.geometry.length > 3 && w.geometry[0].lat === w.geometry.at(-1).lat && w.geometry[0].lon === w.geometry.at(-1).lon;
const byId = new Map(ways.map((w) => [w.id, w]));

const LANDS = {
  'dca-buena-vista-street': 954404818,
  'dca-hollywood-land': 936428569,
  'dca-avengers-campus': 983749993,
  'dca-cars-land': 951841354,
  'dca-san-fransokyo-square': 1203262924,
  'dca-pixar-pier': 603236902,
  'dca-paradise-gardens-park': 551398394,
  'dca-grizzly-peak': 380109784,
};
const landRings = Object.fromEntries(Object.entries(LANDS).map(([id, wayId]) => [id, geom(byId.get(wayId))]));
const landOf = (pt) => Object.keys(landRings).find((id) => inside(pt, landRings[id])) ?? null;

// The park boundary (largest outer ring of the park's multipolygon).
const parkRel = rels.find((r) => r.id === PARK_RELATION);
const parkRings = assembleRings(parkRel.members.filter((m) => m.role === 'outer' && m.geometry).map((m) => m.geometry.map(meters)));
const parkRing = parkRings.sort((a, b) => Math.abs(area(b)) - Math.abs(area(a)))[0];
const inPark = (p) => inside(p, parkRing) || landOf(p) !== null;

const ext = bbox([...parkRing, ...Object.values(landRings).flat()]);
const PAD = 40;
const W = Math.ceil(ext.maxX - ext.minX + PAD * 2);
const H = Math.ceil(ext.maxY - ext.minY + PAD * 2);
const X0 = ext.minX - PAD, Y0 = ext.minY - PAD;
const toCanvas = (p) => ({ x: p.x - X0, y: p.y - Y0 });

const r1 = (n) => Math.round(n * 10) / 10;
function simplifyRing(ring, tol) {
  const pts = ring.length > 1 && ring[0].x === ring.at(-1).x && ring[0].y === ring.at(-1).y ? ring.slice(0, -1) : ring;
  if (pts.length < 4) return pts;
  let far = 1, best = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[0].x, pts[i].y - pts[0].y);
    if (d > best) (best = d), (far = i);
  }
  const a = simplify(pts.slice(0, far + 1), tol);
  const b = simplify([...pts.slice(far), pts[0]], tol);
  return [...a, ...b.slice(1, -1)];
}
const ringD = (ring, tol = 0.6) => {
  const s = simplifyRing(ring.map(toCanvas), tol);
  return s.length < 3 ? '' : `M${s.map((p) => `${r1(p.x)} ${r1(p.y)}`).join('L')}Z`;
};
const lineD = (line, tol = 0.8) => {
  const s = simplify(line.map(toCanvas), tol);
  return s.length < 2 ? '' : `M${s.map((p) => `${r1(p.x)} ${r1(p.y)}`).join('L')}`;
};
const circleD = (c, r) => `M${r1(c.x - r)} ${r1(c.y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;

const layers = {
  greens: [], forest: [], water: [], streams: [], rock: {}, walkAreas: [], paths: [], mainPaths: [], steps: [],
  buildings: {}, roofs: [], coaster: [], monorail: [],
};
const forestRings = [];

for (const w of ways) {
  const t = w.tags || {};
  const pts = geom(w);
  const isClosed = closed(w);
  const c = isClosed ? centroid(pts) : pts[Math.floor(pts.length / 2)];
  if (c.x < X0 || c.x > X0 + W || c.y < Y0 || c.y > Y0 + H) continue;
  const park = inPark(c);
  const land = landOf(c);

  if (isClosed && (t.leisure === 'garden' || t.leisure === 'park' || ['grass', 'meadow', 'village_green', 'flowerbed', 'vineyard'].includes(t.landuse) || ['scrub', 'grassland', 'heath'].includes(t.natural))) {
    if (park) layers.greens.push(ringD(pts));
    continue;
  }
  if (isClosed && (t.landuse === 'forest' || t.natural === 'wood')) {
    if (park) {
      layers.forest.push(ringD(pts));
      forestRings.push(pts);
    }
    continue;
  }
  if (isClosed && t.natural === 'water') {
    if (park) layers.water.push(ringD(pts));
    continue;
  }
  if (!isClosed && ['stream', 'canal', 'drain', 'ditch', 'river'].includes(t.waterway)) {
    if (park) layers.streams.push(lineD(pts));
    continue;
  }
  if (!isClosed && t.attraction === 'river_rafting') {
    layers.streams.push(lineD(pts));
    continue;
  }
  if (isClosed && (t.natural === 'bare_rock' || t.natural === 'cliff' || t.natural === 'rock')) {
    (layers.rock[land ?? 'other'] ??= []).push(ringD(pts));
    continue;
  }
  if (t.railway === 'monorail') {
    layers.monorail.push(lineD(pts));
    continue;
  }
  if (!park) continue;
  if (isClosed && (t['area:highway'] || ((t.highway === 'pedestrian' || t.highway === 'footway') && t.area === 'yes') || t.place === 'square')) {
    layers.walkAreas.push(ringD(pts));
    continue;
  }
  if (t.highway) {
    if (/queue|backstage|cast|shuttle/i.test(t.name ?? '') || ['service', 'track'].includes(t.highway)) continue;
    if (['pedestrian', 'living_street'].includes(t.highway)) layers.mainPaths.push(lineD(pts));
    else if (t.highway === 'steps') layers.steps.push(lineD(pts));
    else if (['footway', 'path', 'corridor'].includes(t.highway)) layers.paths.push(lineD(pts));
    continue;
  }
  if (t.roller_coaster === 'track') {
    layers.coaster.push(lineD(pts, 0.5));
    continue;
  }
  if ((t.building || t['building:part']) && isClosed) {
    if (t.building === 'roof') layers.roofs.push(ringD(pts));
    else (layers.buildings[land ?? 'other'] ??= []).push(ringD(pts));
  }
}

for (const r of rels) {
  if (r.id === PARK_RELATION) continue;
  const t = r.tags || {};
  const outer = assembleRings(r.members.filter((m) => m.role === 'outer' && m.geometry).map((m) => m.geometry.map(meters)));
  const inner = assembleRings(r.members.filter((m) => m.role === 'inner' && m.geometry).map((m) => m.geometry.map(meters)));
  if (!outer.length) continue;
  const c = centroid(outer[0]);
  if (!inPark(c)) continue;
  const d = [...outer, ...inner].map((ring) => ringD(ring)).join('');
  if (t.natural === 'water') layers.water.push(d);
  else if (t.building) (layers.buildings[landOf(c) ?? 'other'] ??= []).push(d);
  else if (t.landuse === 'forest' || t.natural === 'wood') {
    layers.forest.push(d);
    forestRings.push(...outer);
  } else if (t.leisure === 'garden' || t.landuse === 'grass') layers.greens.push(d);
}

const trees = [];
for (const ring of forestRings) {
  const b = bbox(ring);
  for (let y = b.minY + 4; y < b.maxY; y += 9) {
    for (let x = b.minX + 4 + ((Math.round(y) / 9) % 2) * 4.5; x < b.maxX; x += 9) {
      const p = { x: x + Math.sin(x * 12.9898 + y * 78.233) * 2, y: y + Math.cos(x * 4.1 + y) * 2 };
      if (inside(p, ring)) trees.push(toCanvas(p));
    }
  }
}

// Land labels, zoom views and stand-in stamp routes (as for Disneyland).
const mainVertices = [], footVertices = [];
for (const w of ways) {
  const t = w.tags || {};
  if (/queue|backstage|cast|shuttle/i.test(t.name ?? '')) continue;
  const bucket = ['pedestrian', 'living_street'].includes(t.highway) ? mainVertices : ['footway', 'path'].includes(t.highway) ? footVertices : null;
  if (!bucket) continue;
  for (const p of w.geometry) bucket.push(meters(p));
}
const lands = {};
for (const [id, ring] of Object.entries(landRings)) {
  const c = toCanvas(centroid(ring));
  const b = bbox(ring.map(toCanvas));
  let vw = b.maxX - b.minX + 40, vh = b.maxY - b.minY + 40;
  if (vw / vh < 0.6) vw = vh * 0.6;
  if (vh / vw < 0.55) vh = vw * 0.55;
  const cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2;
  let cand = mainVertices.filter((p) => inside(p, ring)).map(toCanvas);
  if (cand.length < 40) cand = cand.concat(footVertices.filter((p) => inside(p, ring)).map(toCanvas));
  const picks = [];
  if (cand.length) {
    picks.push(cand.reduce((best, p) => (Math.hypot(p.x - c.x, p.y - c.y) < Math.hypot(best.x - c.x, best.y - c.y) ? p : best)));
    while (picks.length < 10) {
      let best = null, bestD = 0;
      for (const p of cand) {
        const d = Math.min(...picks.map((q) => Math.hypot(p.x - q.x, p.y - q.y)));
        if (d > bestD) (bestD = d), (best = p);
      }
      if (!best || bestD < 12) break;
      picks.push(best);
    }
  }
  const byAngle = picks.map((p) => ({ p, a: Math.atan2(p.y - c.y, p.x - c.x) })).sort((u, v) => u.a - v.a);
  let gapAt = 0, gap = -1;
  for (let i = 0; i < byAngle.length; i++) {
    const next = byAngle[(i + 1) % byAngle.length];
    const g = (next.a - byAngle[i].a + 2 * Math.PI) % (2 * Math.PI);
    if (g > gap) (gap = g), (gapAt = (i + 1) % byAngle.length);
  }
  const arc = [...byAngle.slice(gapAt), ...byAngle.slice(0, gapAt)].map((u) => u.p);
  const half = Math.ceil(arc.length / 2);
  const lane = (r) => (r.length >= 2 ? r : [r[0] ?? c, c]);
  lands[id] = {
    label: { x: r1(c.x), y: r1(c.y) },
    view: { x: r1(cx - vw / 2), y: r1(cy - vh / 2), w: r1(vw), h: r1(vh) },
    lanes: [lane(arc.slice(0, half)), lane(arc.slice(half))].map((l) => l.map((p) => ({ x: r1(p.x), y: r1(p.y) }))),
    outline: ringD(ring, 1),
  };
}

const wayCenter = (id) => {
  const w = byId.get(id);
  if (!w) return null;
  const pts = geom(w);
  return closed(w) ? centroid(pts) : pts[Math.floor(pts.length / 2)];
};
const features = {
  wheel: toCanvas(wayCenter(123138989)),
  carousel: toCanvas(wayCenter(120639750)),
  swings: toCanvas(wayCenter(364262516)),
  zephyr: toCanvas(wayCenter(342771469)),
  peak: toCanvas(wayCenter(154274688)),
};

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------
const join = (arr) => arr.filter(Boolean).join('');
const pt = (p) => `{ x: ${r1(p.x)}, y: ${r1(p.y)} }`;
const out = `// Generated by scripts/build-dca-map.mjs — do not edit by hand.
// Map data © OpenStreetMap contributors, available under the Open Database License (ODbL).
// Projected at 1 px per meter, north up.

export const DCA_GEO_CANVAS = { width: ${W}, height: ${H} } as const;

/** Projection used for the canvas (see toParkPoint in src/lib/mapGeometry.ts). */
export const DCA_GEO_PROJECTION = {
  lat0: ${LAT0},
  lng0: ${LNG0},
  metersPerLat: ${M_PER_LAT.toFixed(3)},
  metersPerLng: ${M_PER_LNG.toFixed(3)},
  x0: ${r1(X0)},
  y0: ${r1(Y0)},
} as const;

export const DCA_GEO_LAYERS = {
  ground: ${JSON.stringify(ringD(parkRing, 1))},
  greens: ${JSON.stringify(join(layers.greens))},
  forest: ${JSON.stringify(join(layers.forest))},
  trees: ${JSON.stringify(trees.map((p) => circleD(p, 3.4)).join(''))},
  water: ${JSON.stringify(join(layers.water))},
  streams: ${JSON.stringify(join(layers.streams))},
  rock: ${JSON.stringify(Object.fromEntries(Object.entries(layers.rock).map(([k, v]) => [k, join(v)])))},
  walkAreas: ${JSON.stringify(join(layers.walkAreas))},
  paths: ${JSON.stringify(join(layers.paths))},
  mainPaths: ${JSON.stringify(join(layers.mainPaths))},
  steps: ${JSON.stringify(join(layers.steps))},
  buildings: ${JSON.stringify(Object.fromEntries(Object.entries(layers.buildings).map(([k, v]) => [k, join(v)])))},
  roofs: ${JSON.stringify(join(layers.roofs))},
  coaster: ${JSON.stringify(join(layers.coaster))},
  monorail: ${JSON.stringify(join(layers.monorail))},
} as const;

/** Outlines of each land (lands.id). */
export const DCA_GEO_LANDS: Record<string, { label: { x: number; y: number }; view: { x: number; y: number; w: number; h: number }; lanes: { x: number; y: number }[][]; outline: string }> = ${JSON.stringify(lands, null, 2)};

/** Spots for little drawn details. */
export const DCA_GEO_FEATURES = {
${Object.entries(features).map(([k, p]) => `  ${k}: ${pt(p)},`).join('\n')}
} as const;
`;
writeFileSync(OUT, out);
console.log(`Wrote ${OUT}: ${W}×${H} canvas, ${(out.length / 1024).toFixed(0)} KB, ${trees.length} trees.`);
