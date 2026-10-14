/**
 * Geometry shared by the storybook map and the real map.
 *
 * The street map is drawn on a 360 × 640 canvas: Town Square at the bottom,
 * the street running north, the central plaza at the top. Real GPS pins are
 * placed with a simple calibration (two anchor points along the street).
 * It's approximate — check it against a few real pins after the field walk
 * and adjust the anchors if stamps land on the wrong side of the street.
 */

import { PARK_CANVAS, PARK_LANDS } from '@/art/parkMap';
import { LANDMARK_APPROX, PARK_GEO_PROJECTION } from '@/art/parkGeo';

export { PARK_CANVAS };

export const MAP_CANVAS = { width: 360, height: 640 } as const;

/** South anchor: middle of Town Square. North anchor: middle of the central plaza. */
const SOUTH = { lat: 33.81045, lng: -117.91895, x: 180, y: 560 };
const NORTH = { lat: 33.81215, lng: -117.91895, x: 180, y: 92 };

const PX_PER_DEG_LAT = (SOUTH.y - NORTH.y) / (NORTH.lat - SOUTH.lat);
// A degree of longitude is shorter than a degree of latitude at this latitude.
const PX_PER_DEG_LNG = PX_PER_DEG_LAT * Math.cos((SOUTH.lat * Math.PI) / 180);

export type MapPoint = { x: number; y: number };

/** Where a GPS point falls on the storybook map (null if it's off the drawing). */
export function toMapPoint(lat: number, lng: number): MapPoint | null {
  const x = SOUTH.x + (lng - SOUTH.lng) * PX_PER_DEG_LNG;
  const y = SOUTH.y - (lat - SOUTH.lat) * PX_PER_DEG_LAT;
  if (x < 0 || x > MAP_CANVAS.width || y < 0 || y > MAP_CANVAS.height) return null;
  return { x, y };
}

/**
 * Stand-in position for a spot without a pin yet: quests take turns along the
 * street in walking order (south to north), alternating sides, so stamps
 * don't pile up. Purely illustrative until the field walk.
 */
export function placeholderPoint(questIndex: number, order: number, questSpotCount: number): MapPoint {
  // One lane per quest: left shops, right shops, left sidewalk, right sidewalk —
  // at least 43px apart, so stamps from different quests never overlap.
  const lanes = [100, 260, 143, 217];
  const top = 190;
  const bottom = 496;
  const t = questSpotCount > 1 ? (order - 1) / (questSpotCount - 1) : 0.5;
  const y = bottom - t * (bottom - top) - (questIndex % 2) * 14;
  return { x: lanes[questIndex % lanes.length], y };
}

/** Region for the real map: the street with a little margin. */
export const STREET_REGION = {
  latitude: (SOUTH.lat + NORTH.lat) / 2,
  longitude: SOUTH.lng,
  latitudeDelta: 0.0032,
  longitudeDelta: 0.0032,
};

// ---------------------------------------------------------------------------
// Whole-park storybook map (src/art/parkMap.ts), drawn over real geography
// ---------------------------------------------------------------------------

/** Where a GPS point falls on the park map (null if it's off the drawing). */
export function toParkPoint(lat: number, lng: number): MapPoint | null {
  const P = PARK_GEO_PROJECTION;
  const x = (lng - P.lng0) * P.metersPerLng - P.x0;
  const y = (P.lat0 - lat) * P.metersPerLat - P.y0;
  if (x < 0 || x > PARK_CANVAS.width || y < 0 || y > PARK_CANVAS.height) return null;
  return { x, y };
}

/** Approximate map position of a Storybook Lens landmark that isn't pinned yet. */
export function approxLandmarkCoords(slug: string): { lat: number; lng: number } | null {
  return LANDMARK_APPROX[slug] ?? null;
}

/** Point a fraction `t` (0–1) of the way along a walking route. */
function alongRoute(route: MapPoint[], t: number): MapPoint {
  const lengths = route.slice(1).map((p, i) => Math.hypot(p.x - route[i].x, p.y - route[i].y));
  let remaining = t * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const f = lengths[i] ? Math.min(remaining / lengths[i], 1) : 0;
      return { x: route[i].x + (route[i + 1].x - route[i].x) * f, y: route[i].y + (route[i + 1].y - route[i].y) * f };
    }
    remaining -= lengths[i];
  }
  return route[0];
}

/**
 * Stand-in position on the park map for a spot without a pin yet: each quest
 * in a land walks its own route, in spot order. Purely illustrative.
 */
export function parkPlaceholderPoint(landId: string, questIndexInLand: number, order: number, questSpotCount: number): MapPoint {
  const land = PARK_LANDS.find((l) => l.id === landId);
  if (!land) return { x: PARK_CANVAS.width / 2, y: PARK_CANVAS.height / 2 };
  const route = land.lanes[questIndexInLand % land.lanes.length];
  const t = questSpotCount > 1 ? (order - 1) / (questSpotCount - 1) : 0.5;
  return alongRoute(route, t);
}

/** Region for the real map: the whole park (the storybook map's own extent). */
const P0 = PARK_GEO_PROJECTION;
export const PARK_REGION = {
  latitude: P0.lat0 - (P0.y0 + PARK_CANVAS.height / 2) / P0.metersPerLat,
  longitude: P0.lng0 + (P0.x0 + PARK_CANVAS.width / 2) / P0.metersPerLng,
  latitudeDelta: (PARK_CANVAS.height / P0.metersPerLat) * 1.05,
  longitudeDelta: (PARK_CANVAS.width / P0.metersPerLng) * 1.05,
};
