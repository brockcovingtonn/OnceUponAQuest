/**
 * Geometry for the storybook park maps (src/art/parkMap.ts for Disneyland,
 * src/art/dcaMap.ts for California Adventure). Both are drawn to scale from
 * OpenStreetMap at one map unit per meter, north up, so GPS points map
 * straight onto them.
 */
import { PARK_CANVAS } from '@/art/parkMap';
import { LANDMARK_APPROX } from '@/art/parkGeo';
import { PARK_MAPS, type ParkId } from '@/lib/parks';

export { PARK_CANVAS };

export type MapPoint = { x: number; y: number };

/** Where a GPS point falls on a park's map (null if it's off the drawing). */
export function toParkPoint(lat: number, lng: number, park: ParkId = 'disneyland-park'): MapPoint | null {
  const { projection: P, canvas } = PARK_MAPS[park];
  const x = (lng - P.lng0) * P.metersPerLng - P.x0;
  const y = (P.lat0 - lat) * P.metersPerLat - P.y0;
  if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return null;
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
export function parkPlaceholderPoint(
  landId: string,
  questIndexInLand: number,
  order: number,
  questSpotCount: number,
  park: ParkId = 'disneyland-park',
): MapPoint {
  const { lands, canvas } = PARK_MAPS[park];
  const land = lands.find((l) => l.id === landId);
  if (!land) return { x: canvas.width / 2, y: canvas.height / 2 };
  const route = land.lanes[questIndexInLand % land.lanes.length];
  const t = questSpotCount > 1 ? (order - 1) / (questSpotCount - 1) : 0.5;
  return alongRoute(route, t);
}

/** The real-map region covering part of a park's storybook canvas (in map meters). */
export function regionForView(view: { x: number; y: number; w: number; h: number }, park: ParkId = 'disneyland-park') {
  const P = PARK_MAPS[park].projection;
  return {
    latitude: P.lat0 - (P.y0 + view.y + view.h / 2) / P.metersPerLat,
    longitude: P.lng0 + (P.x0 + view.x + view.w / 2) / P.metersPerLng,
    latitudeDelta: (view.h / P.metersPerLat) * 1.1,
    longitudeDelta: (view.w / P.metersPerLng) * 1.1,
  };
}

/** Region for the real map: a whole park (its storybook map's own extent). */
export function parkRegion(park: ParkId) {
  const { canvas } = PARK_MAPS[park];
  return regionForView({ x: 0, y: 0, w: canvas.width, h: canvas.height }, park);
}

export const PARK_REGION = parkRegion('disneyland-park');
