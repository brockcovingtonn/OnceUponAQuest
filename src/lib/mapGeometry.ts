/**
 * Geometry shared by the storybook map and the real map.
 *
 * The storybook map is drawn on a 360 × 640 canvas: Town Square at the bottom,
 * the street running north, the central plaza at the top. Real GPS pins are
 * placed with a simple calibration (two anchor points along the street).
 * It's approximate — check it against a few real pins after the field walk
 * and adjust the anchors if stamps land on the wrong side of the street.
 */

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
