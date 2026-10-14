// Builds the storybook park map's geometry from OpenStreetMap data.
//
//   node scripts/build-park-map.mjs            uses the cached download in .expo/osm/ (git-ignored)
//   node scripts/build-park-map.mjs --refresh  downloads fresh data from the Overpass API first
//
// Writes src/art/parkGeo.ts: real walkways, building footprints, water, rockwork,
// greenery, the railroad loop and land outlines, projected to a canvas at one
// pixel per meter (north up), so GPS pins land in the right place. The drawing
// style is our own; nothing is traced from any park's official map.
//
// Map data © OpenStreetMap contributors, available under the Open Database
// License (ODbL). The app credits OpenStreetMap on the map and in About.
//
// House rules: shapes that could read as protected designs are replaced with
// plain ones (the castle footprint becomes a rounded block, the famous freighter a
// round landing pad, the entrance flower bed an oval). No names are drawn.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const CACHE = '.expo/osm';
const OUT = 'src/art/parkGeo.ts';
const BBOX = '33.8080,-117.9260,33.8170,-117.9140';

// ---------------------------------------------------------------------------
// Download (only with --refresh or when the cache is missing)
// ---------------------------------------------------------------------------
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
    const ids = park.elements
      .filter((e) => e.type === 'relation' && ['multipolygon', 'building'].includes(e.tags?.type))
      .map((e) => e.id);
    const rels = await overpass(`[out:json][timeout:180];(relation(id:${ids.join(',')});relation(id:16491364););out geom;`);
    writeFileSync(`${CACHE}/relations.json`, JSON.stringify(rels));
  }
  return {
    ways: JSON.parse(readFileSync(`${CACHE}/park.json`, 'utf8')).elements.filter((e) => e.type === 'way' && e.geometry).map((e) => ({ ...e, tags: e.tags ?? {} })),
    rels: JSON.parse(readFileSync(`${CACHE}/relations.json`, 'utf8')).elements,
  };
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------
const LAT0 = 33.8125;
const LNG0 = -117.9195;
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
function resample(pts, count, closed) {
  const seq = closed ? [...pts, pts[0]] : pts;
  const seg = seq.slice(1).map((p, i) => Math.hypot(p.x - seq[i].x, p.y - seq[i].y));
  const total = seg.reduce((a, b) => a + b, 0);
  const out = [];
  for (let k = 0; k < count; k++) {
    let d = (k / count) * total, i = 0;
    while (i < seg.length - 1 && d > seg[i]) d -= seg[i++];
    const f = seg[i] ? d / seg[i] : 0;
    out.push({ x: seq[i].x + (seq[i + 1].x - seq[i].x) * f, y: seq[i].y + (seq[i + 1].y - seq[i].y) * f });
  }
  if (closed) out.push(out[0]);
  return out;
}
/** Joins way geometries end-to-end into closed rings (for multipolygons). */
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
  'dlp-main-street': 653252855,
  'dlp-adventureland': 631985993,
  'dlp-new-orleans-square': 810673623,
  'dlp-bayou-country': 1330786930,
  'dlp-frontierland': 1245437181,
  'dlp-galaxys-edge': 708338427,
  'dlp-fantasyland': 583352219,
  'dlp-toontown': 211240076,
  'dlp-tomorrowland': 745520756,
};
const landRings = Object.fromEntries(Object.entries(LANDS).map(([id, wayId]) => [id, geom(byId.get(wayId))]));
const landOf = (pt) => Object.keys(landRings).find((id) => inside(pt, landRings[id])) ?? null;

// Railroad loop: named track, minus dead-end spurs, walked as one ring.
// The little Fantasyland circus train has its own unconnected loop; starting from the
// southernmost point keeps the walk on the main line.
const track = ways.filter((w) => w.tags.railway === 'narrow_gauge');
const nodeKey = (p) => `${p.lat.toFixed(7)},${p.lon.toFixed(7)}`;
const adj = new Map();
const pos = new Map();
for (const w of track) {
  for (let i = 1; i < w.geometry.length; i++) {
    const a = nodeKey(w.geometry[i - 1]), b = nodeKey(w.geometry[i]);
    pos.set(a, w.geometry[i - 1]);
    pos.set(b, w.geometry[i]);
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a).add(b);
    adj.get(b).add(a);
  }
}
for (let pruned = true; pruned; ) {
  pruned = false;
  for (const [k, n] of adj) {
    if (n.size < 2) {
      for (const o of n) adj.get(o)?.delete(k);
      adj.delete(k);
      pruned = true;
    }
  }
}
const start = [...adj.keys()].sort((a, b) => pos.get(a).lat - pos.get(b).lat)[0];
const loopKeys = [start];
let prev = null, cur = start;
for (let guard = 0; guard < 5000; guard++) {
  const options = [...adj.get(cur)].filter((n) => n !== prev);
  let next = options[0];
  if (options.length > 1 && prev) {
    // At a junction, keep going as straight as possible.
    const p0 = meters(pos.get(prev)), p1 = meters(pos.get(cur));
    const h = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    next = options.sort((a, b) => {
      const pa = meters(pos.get(a)), pb = meters(pos.get(b));
      const da = Math.abs(((Math.atan2(pa.y - p1.y, pa.x - p1.x) - h + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
      const db = Math.abs(((Math.atan2(pb.y - p1.y, pb.x - p1.x) - h + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
      return da - db;
    })[0];
  }
  if (!next || next === start) break;
  loopKeys.push(next);
  prev = cur;
  cur = next;
}
const loop = loopKeys.map((k) => meters(pos.get(k)));
const loopSet = new Set(loopKeys);
if (area(loop) < 0) loop.reverse();

// Canvas extent: every land and the railroad, plus a margin.
const allPts = [...loop, ...Object.values(landRings).flat()];
const ext = bbox(allPts);
const PAD = 40;
const W = Math.ceil(ext.maxX - ext.minX + PAD * 2);
const H = Math.ceil(ext.maxY - ext.minY + PAD * 2);
const X0 = ext.minX - PAD, Y0 = ext.minY - PAD;
const toCanvas = (p) => ({ x: p.x - X0, y: p.y - Y0 });
const inPark = (p) => inside(p, loop) || landOf(p) !== null;

const r1 = (n) => Math.round(n * 10) / 10;
/** Simplifies a closed ring by splitting it at the point farthest from its start. */
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
const ellipseD = (c, rx, ry) => `M${r1(c.x - rx)} ${r1(c.y)}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(2 * rx)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-2 * rx)} 0Z`;
const roundRectD = (b, inset, rad) => {
  const x = b.minX + inset, y = b.minY + inset, w = b.maxX - b.minX - 2 * inset, h = b.maxY - b.minY - 2 * inset;
  return `M${r1(x + rad)} ${r1(y)}H${r1(x + w - rad)}Q${r1(x + w)} ${r1(y)} ${r1(x + w)} ${r1(y + rad)}V${r1(y + h - rad)}Q${r1(x + w)} ${r1(y + h)} ${r1(x + w - rad)} ${r1(y + h)}H${r1(x + rad)}Q${r1(x)} ${r1(y + h)} ${r1(x)} ${r1(y + h - rad)}V${r1(y + rad)}Q${r1(x)} ${r1(y)} ${r1(x + rad)} ${r1(y)}Z`;
};

const layers = {
  greens: [], forest: [], water: [], streams: [], rock: {}, walkAreas: [], paths: [], mainPaths: [], steps: [],
  buildings: {}, roofs: [], monorail: [], peoplemover: [], smallTrain: [], tram: [], raceway: [], special: [],
};
const ENTRANCE_BED = meters({ lat: 33.80983, lon: -117.91895 });
const CASTLE_IDS = new Set([331440228, 317967515]);
const FREIGHTER_IDS = new Set([1329137052]);
const forestRings = [];

for (const w of ways) {
  const t = w.tags || {};
  const pts = geom(w);
  const isClosed = closed(w);
  const c = isClosed ? centroid(pts) : pts[Math.floor(pts.length / 2)];
  if (c.x < X0 || c.x > X0 + W || c.y < Y0 || c.y > Y0 + H) continue;
  const park = inPark(c);
  const land = landOf(c);

  if (isClosed && (t.leisure === 'garden' || t.leisure === 'park' || ['grass', 'meadow', 'village_green', 'flowerbed'].includes(t.landuse) || ['scrub', 'grassland', 'heath'].includes(t.natural))) {
    if (Math.hypot(c.x - ENTRANCE_BED.x, c.y - ENTRANCE_BED.y) < 25) {
      const b = bbox(pts.map(toCanvas));
      layers.greens.push(ellipseD({ x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 }, (b.maxX - b.minX) / 2, (b.maxY - b.minY) / 2));
    } else layers.greens.push(ringD(pts));
    continue;
  }
  if (isClosed && (t.landuse === 'forest' || t.natural === 'wood')) {
    layers.forest.push(ringD(pts));
    forestRings.push(pts);
    continue;
  }
  if (isClosed && t.natural === 'water') {
    layers.water.push(ringD(pts));
    continue;
  }
  if (!isClosed && ['stream', 'canal', 'drain', 'ditch'].includes(t.waterway)) {
    layers.streams.push(lineD(pts));
    continue;
  }
  if (isClosed && (t.natural === 'bare_rock' || t.natural === 'cliff' || t.natural === 'rock')) {
    const key = land ?? 'other';
    (layers.rock[key] ??= []).push(ringD(pts));
    continue;
  }
  if (!park) {
    if (t.railway === 'monorail') layers.monorail.push(lineD(pts));
    continue;
  }
  if (isClosed && (t['area:highway'] || ((t.highway === 'pedestrian' || t.highway === 'footway') && t.area === 'yes') || t.place === 'square')) {
    layers.walkAreas.push(ringD(pts));
    continue;
  }
  if (t.highway) {
    if (/queue|backstage|cast/i.test(t.name ?? '')) continue;
    if (['pedestrian', 'living_street'].includes(t.highway)) layers.mainPaths.push(lineD(pts));
    else if (t.highway === 'steps') layers.steps.push(lineD(pts));
    else if (['footway', 'path', 'corridor'].includes(t.highway)) layers.paths.push(lineD(pts));
    else if (t.highway === 'raceway') layers.raceway.push(lineD(pts));
    continue;
  }
  if (t.building && isClosed) {
    if (CASTLE_IDS.has(w.id)) {
      const b = bbox(pts.map(toCanvas));
      layers.special.push({ kind: 'castle', d: roundRectD(b, Math.min(b.maxX - b.minX, b.maxY - b.minY) * 0.12, 6) });
      continue;
    }
    if (FREIGHTER_IDS.has(w.id)) {
      const cc = toCanvas(c);
      layers.special.push({ kind: 'pad', d: circleD(cc, Math.sqrt(Math.abs(area(pts)) / Math.PI)) });
      continue;
    }
    // Big show buildings behind the berm are hidden under trees, as guests see them.
    if (!inside(c, loop) && Math.abs(area(pts)) > 1500) {
      layers.forest.push(ringD(pts));
      forestRings.push(pts);
      continue;
    }
    if (t.building === 'roof') layers.roofs.push(ringD(pts));
    else (layers.buildings[land ?? 'other'] ??= []).push(ringD(pts));
    continue;
  }
  if (t.railway === 'monorail') layers.monorail.push(lineD(pts));
  else if (t.railway === 'abandoned' || t.railway === 'disused') layers.peoplemover.push(lineD(pts));
  else if (t.railway === 'narrow_gauge' && land === 'dlp-fantasyland' && !w.geometry.some((g) => loopSet.has(nodeKey(g)))) layers.smallTrain.push(lineD(pts));
  else if (t.railway === 'tram') layers.tram.push(lineD(pts));
}

// Multipolygon water (rivers with islands) and buildings.
for (const r of rels) {
  const t = r.tags || {};
  const outer = assembleRings(r.members.filter((m) => m.role === 'outer' && m.geometry).map((m) => m.geometry.map(meters)));
  const inner = assembleRings(r.members.filter((m) => m.role === 'inner' && m.geometry).map((m) => m.geometry.map(meters)));
  if (!outer.length) continue;
  const c = centroid(outer[0]);
  if (c.x < X0 || c.x > X0 + W || c.y < Y0 || c.y > Y0 + H) continue;
  const d = [...outer, ...inner].map((ring) => ringD(ring)).join('');
  if (t.natural === 'water') layers.water.push(d);
  else if (t.building && inPark(c) && r.id !== 7751688) {
    if (!inside(c, loop) && Math.abs(area(outer[0])) > 1500) {
      layers.forest.push(d);
      forestRings.push(...outer);
    } else (layers.buildings[landOf(c) ?? 'other'] ??= []).push(d);
  }
  else if ((t.landuse === 'forest' || t.natural === 'wood') && t.type === 'multipolygon') {
    layers.forest.push(d);
    forestRings.push(...outer);
  } else if (t.leisure === 'garden' || t.landuse === 'grass') layers.greens.push(d);
}

// Trees: little round canopies scattered through wooded areas.
const trees = [];
for (const ring of forestRings) {
  const b = bbox(ring);
  for (let y = b.minY + 4; y < b.maxY; y += 9) {
    for (let x = b.minX + 4 + ((Math.round(y) / 9) % 2) * 4.5; x < b.maxX; x += 9) {
      const p = { x: x + (Math.sin(x * 12.9898 + y * 78.233) * 2), y: y + Math.cos(x * 4.1 + y) * 2 };
      if (inside(p, ring) && p.x > X0 && p.x < X0 + W && p.y > Y0 && p.y < Y0 + H) trees.push(toCanvas(p));
    }
  }
}

// Riverboat route.
const riverRel = rels.find((r) => r.id === 16491364);
let riverboat = [];
if (riverRel) {
  const lines = riverRel.members.filter((m) => m.type === 'way' && m.geometry).map((m) => m.geometry.map(meters));
  const ring = assembleRings(lines)[0] ?? lines[0];
  riverboat = resample(simplify(ring.map(toCanvas), 1), 60, true);
}

// Land labels, zoom views and stand-in stamp routes.
// Stand-in stamps sit on main guest walkways (not queues, not the river island).
const island = geom(byId.get(480350228));
const mainVertices = [], footVertices = [];
for (const w of ways) {
  const t = w.tags || {};
  if (/queue|backstage|cast/i.test(t.name ?? '')) continue;
  const bucket = ['pedestrian', 'living_street'].includes(t.highway) ? mainVertices : ['footway', 'path'].includes(t.highway) ? footVertices : null;
  if (!bucket) continue;
  for (const p of w.geometry) {
    const m = meters(p);
    if (!inside(m, island)) bucket.push(m);
  }
}
const HUB = meters({ lat: 33.8119, lon: -117.91896 });
const lands = {};
for (const [id, ring] of Object.entries(landRings)) {
  const c = toCanvas(centroid(ring));
  const b = bbox(ring.map(toCanvas));
  let vw = b.maxX - b.minX + 40, vh = b.maxY - b.minY + 40;
  if (vw / vh < 0.6) vw = vh * 0.6;
  if (vh / vw < 0.55) vh = vw * 0.55;
  const cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2;
  // Spread sample points over the land's walkways, then split them into two routes.
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
      if (!best || bestD < 15) break;
      picks.push(best);
    }
  }
  // Two smooth routes: order the picks by angle around the land's center, starting
  // after the widest gap, and give each quest one half of the arc.
  const byAngle = picks
    .map((p) => ({ p, a: Math.atan2(p.y - c.y, p.x - c.x) }))
    .sort((u, v) => u.a - v.a);
  let gapAt = 0, gap = -1;
  for (let i = 0; i < byAngle.length; i++) {
    const next = byAngle[(i + 1) % byAngle.length];
    const g = (next.a - byAngle[i].a + 2 * Math.PI) % (2 * Math.PI);
    if (g > gap) (gap = g), (gapAt = (i + 1) % byAngle.length);
  }
  const arc = [...byAngle.slice(gapAt), ...byAngle.slice(0, gapAt)].map((u) => u.p);
  const half = Math.ceil(arc.length / 2);
  const routeA = arc.slice(0, half), routeB = arc.slice(half);
  const lane = (r) => (r.length >= 2 ? r : [r[0] ?? c, c]);
  lands[id] = {
    label: { x: r1(c.x), y: r1(c.y) },
    view: { x: r1(cx - vw / 2), y: r1(cy - vh / 2), w: r1(vw), h: r1(vh) },
    lanes: [lane(routeA), lane(routeB)].map((l) => l.map((p) => ({ x: r1(p.x), y: r1(p.y) }))),
    outline: ringD(ring, 1),
  };
}

// Approximate positions for Storybook Lens landmarks (until they're pinned on site).
const wayCenter = (id) => {
  const w = byId.get(id);
  if (!w) return null;
  const pts = geom(w);
  return closed(w) ? centroid(pts) : pts[Math.floor(pts.length / 2)];
};
const landCenter = (id) => centroid(landRings[id]);
const fixed = (lat, lon) => meters({ lat, lon });
const LANDMARKS = {
  'main-street-station': wayCenter(153044358),
  'town-square': fixed(33.8103, -117.91895),
  'main-street-facades': fixed(33.8110, -117.91895),
  'firehouse-apartment': fixed(33.81045, -117.91952),
  'horse-drawn-streetcars': fixed(33.8108, -117.91895),
  'tiki-room': wayCenter(653252856),
  'jungle-river': wayCenter(194261873),
  'treehouse-tree': wayCenter(1058667880),
  'jungle-temple': wayCenter(824031782),
  'new-orleans-square-land': landCenter('dlp-new-orleans-square'),
  'pirate-bayou': wayCenter(824031784),
  'mansion-on-the-hill': wayCenter(178238274),
  'dream-suite': fixed(33.81115, -117.9212),
  'bears-to-bayou': landCenter('dlp-bayou-country'),
  'log-flume-hill': wayCenter(361504826),
  'explorer-canoes': wayCenter(107526234),
  'riverside-restaurant': wayCenter(507135887),
  'the-riverboat': wayCenter(146430144),
  'the-tall-ship': fixed(33.81236, -117.92072),
  'red-rock-mountain': wayCenter(266074156),
  'saloon-stage': wayCenter(616075967),
  'river-island': wayCenter(480350228),
  'outpost-spires': landCenter('dlp-galaxys-edge'),
  'outpost-market': wayCenter(694322088),
  'full-size-freighter': wayCenter(1329137052),
  'resistance-base': wayCenter(607524502),
  'the-castle': wayCenter(331440228),
  'the-carrousel': wayCenter(129691054),
  'small-world-facade': wayCenter(135489209),
  'snowy-peak': wayCenter(107280556),
  'miniature-canal': wayCenter(107526246),
  'no-straight-lines': landCenter('dlp-toontown'),
  'town-park': wayCenter(1156522374),
  'gags-around-town': fixed(33.8152, -117.9190),
  'town-depot': wayCenter(421940771),
  'white-spire': wayCenter(122090695),
  'the-monorail': wayCenter(112155719),
  'empty-track': wayCenter(110199422),
  'little-freeway': wayCenter(168833464),
  'rocket-spinner': wayCenter(761611922),
};
const toLatLng = (m) => ({ lat: +(LAT0 - m.y / M_PER_LAT).toFixed(6), lng: +(LNG0 + m.x / M_PER_LNG).toFixed(6) });
const landmarks = Object.fromEntries(Object.entries(LANDMARKS).filter(([, m]) => m).map(([slug, m]) => [slug, toLatLng(m)]));

const features = {
  carrousel: toCanvas(wayCenter(129691054)),
  teacups: toCanvas(wayCenter(109506979)),
  spinner: toCanvas(meters({ lat: 33.81367, lon: -117.9189 })),
  rocketSpinner: toCanvas(wayCenter(761611922)),
  clock: toCanvas(wayCenter(135489209)),
  peak: toCanvas(wayCenter(107280556)),
  spire: toCanvas(wayCenter(122090695)),
  hub: toCanvas(HUB),
};

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------
const join = (arr) => arr.filter(Boolean).join('');
const pt = (p) => `{ x: ${r1(p.x)}, y: ${r1(p.y)} }`;
const treeD = trees.map((p) => circleD(p, 3.4)).join('');
const out = `// Generated by scripts/build-park-map.mjs — do not edit by hand.
// Map data © OpenStreetMap contributors, available under the Open Database License (ODbL).
// Projected at 1 px per meter, north up.

export const PARK_GEO_CANVAS = { width: ${W}, height: ${H} } as const;

/** Projection used for the canvas (see toParkPoint in src/lib/mapGeometry.ts). */
export const PARK_GEO_PROJECTION = {
  lat0: ${LAT0},
  lng0: ${LNG0},
  metersPerLat: ${M_PER_LAT.toFixed(3)},
  metersPerLng: ${M_PER_LNG.toFixed(3)},
  x0: ${r1(X0)},
  y0: ${r1(Y0)},
} as const;

export const PARK_GEO_LAYERS = {
  ground: ${JSON.stringify(ringD(loop, 1))},
  greens: ${JSON.stringify(join(layers.greens))},
  forest: ${JSON.stringify(join(layers.forest))},
  trees: ${JSON.stringify(treeD)},
  water: ${JSON.stringify(join(layers.water))},
  streams: ${JSON.stringify(join(layers.streams))},
  rock: ${JSON.stringify(Object.fromEntries(Object.entries(layers.rock).map(([k, v]) => [k, join(v)])))},
  walkAreas: ${JSON.stringify(join(layers.walkAreas))},
  paths: ${JSON.stringify(join(layers.paths))},
  mainPaths: ${JSON.stringify(join(layers.mainPaths))},
  steps: ${JSON.stringify(join(layers.steps))},
  buildings: ${JSON.stringify(Object.fromEntries(Object.entries(layers.buildings).map(([k, v]) => [k, join(v)])))},
  roofs: ${JSON.stringify(join(layers.roofs))},
  monorail: ${JSON.stringify(join(layers.monorail))},
  peoplemover: ${JSON.stringify(join(layers.peoplemover))},
  smallTrain: ${JSON.stringify(join(layers.smallTrain))},
  tram: ${JSON.stringify(join(layers.tram))},
  raceway: ${JSON.stringify(join(layers.raceway))},
  castle: ${JSON.stringify(layers.special.filter((s) => s.kind === 'castle').map((s) => s.d).join(''))},
  pad: ${JSON.stringify(layers.special.filter((s) => s.kind === 'pad').map((s) => s.d).join(''))},
  railroad: ${JSON.stringify(ringD(loop, 0.8))},
} as const;

/** Outlines of each land (lands.id). */
export const PARK_GEO_LANDS: Record<string, { label: { x: number; y: number }; view: { x: number; y: number; w: number; h: number }; lanes: { x: number; y: number }[][]; outline: string }> = ${JSON.stringify(lands, null, 2)};

/** The train loop, resampled evenly for animation (closed). */
export const PARK_GEO_TRAIN: { x: number; y: number }[] = [${resample(simplify(loop.map(toCanvas), 0.8), 180, true).map(pt).join(', ')}];

/** The riverboat's route around the island (closed). */
export const PARK_GEO_RIVERBOAT: { x: number; y: number }[] = [${riverboat.map(pt).join(', ')}];

/** Spots for little drawn details and animations. */
export const PARK_GEO_FEATURES = {
${Object.entries(features).map(([k, p]) => `  ${k}: ${pt(p)},`).join('\n')}
} as const;

/** Approximate positions of Storybook Lens landmarks (until pinned on site). */
export const LANDMARK_APPROX: Record<string, { lat: number; lng: number }> = ${JSON.stringify(landmarks, null, 2)};
`;
writeFileSync(OUT, out);
console.log(`Wrote ${OUT}: ${W}×${H} canvas, ${(out.length / 1024).toFixed(0)} KB, ${trees.length} trees, train loop ${loop.length} pts, riverboat ${riverboat.length} pts.`);
