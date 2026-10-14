/**
 * Geometry for the storybook park map (src/art/parkMap.ts), which is drawn to
 * scale from OpenStreetMap at one map unit per meter, north up, so GPS points
 * map straight onto it.
 */
import { PARK_CANVAS, PARK_LANDS } from '@/art/parkMap';
import { LANDMARK_APPROX, PARK_GEO_PROJECTION } from '@/art/parkGeo';

export { PARK_CANVAS };

export type MapPoint = { x: number; y: number };

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

/** The real-map region covering part of the storybook canvas (in map meters). */
export function regionForView(view: { x: number; y: number; w: number; h: number }) {
  const P = PARK_GEO_PROJECTION;
  return {
    latitude: P.lat0 - (P.y0 + view.y + view.h / 2) / P.metersPerLat,
    longitude: P.lng0 + (P.x0 + view.x + view.w / 2) / P.metersPerLng,
    latitudeDelta: (view.h / P.metersPerLat) * 1.1,
    longitudeDelta: (view.w / P.metersPerLng) * 1.1,
  };
}

/** Region for the real map: the whole park (the storybook map's own extent). */
export const PARK_REGION = regionForView({ x: 0, y: 0, w: PARK_CANVAS.width, h: PARK_CANVAS.height });
