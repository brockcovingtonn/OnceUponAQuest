/**
 * The two parks: names for the park switch, and each one's storybook map
 * (canvas, drawing, lands, labels and GPS projection).
 */
import { DCA_GEO_PROJECTION } from '@/art/dcaGeo';
import { DCA_CANVAS, DCA_LANDS, DCA_TWINKLES, dcaMap, dcaMapLabels } from '@/art/dcaMap';
import { PARK_GEO_PROJECTION } from '@/art/parkGeo';
import { PARK_CANVAS, PARK_LANDS, PARK_TWINKLES, parkMap, parkMapLabels, type ParkLand } from '@/art/parkMap';
import type { Shape } from '@/art/shapes';
import type { ParkId } from '@/lib/preferences';

export type { ParkId };

export type MapLabel = { text: string; x: number; y: number; size: number; style: 'title' | 'plain' };

export type ParkMapConfig = {
  id: ParkId;
  canvas: { width: number; height: number };
  shapes: Shape[];
  lands: ParkLand[];
  labels: readonly MapLabel[];
  twinkles: { x: number; y: number }[];
  projection: { lat0: number; lng0: number; metersPerLat: number; metersPerLng: number; x0: number; y0: number };
};

export const PARK_IDS: ParkId[] = ['disneyland-park', 'california-adventure'];

export const PARK_MAPS: Record<ParkId, ParkMapConfig> = {
  'disneyland-park': {
    id: 'disneyland-park',
    canvas: PARK_CANVAS,
    shapes: parkMap,
    lands: PARK_LANDS,
    labels: parkMapLabels,
    twinkles: PARK_TWINKLES,
    projection: PARK_GEO_PROJECTION,
  },
  'california-adventure': {
    id: 'california-adventure',
    canvas: DCA_CANVAS,
    shapes: dcaMap,
    lands: DCA_LANDS,
    labels: dcaMapLabels,
    twinkles: DCA_TWINKLES,
    projection: DCA_GEO_PROJECTION,
  },
};

/** Which park a land belongs to (lands.park_id is the source of truth; ids are prefixed too). */
export function parkOfLand(landId: string): ParkId {
  return landId.startsWith('dca-') ? 'california-adventure' : 'disneyland-park';
}
