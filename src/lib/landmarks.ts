/**
 * Storybook Lens: landmark stories, Lens stamps, and their field tools.
 * source_url is internal research only and is never selected by the app.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type LayerKey = 'architecture' | 'story' | 'history' | 'engineering';
export const LAYER_KEYS: LayerKey[] = ['architecture', 'story', 'history', 'engineering'];

export type Landmark = {
  id: string;
  slug: string;
  order: number;
  title: string;
  teaser: string;
  lookFor: string;
  layers: Partial<Record<LayerKey, string>>;
  lat: number | null;
  lng: number | null;
  radiusM: number;
  photoPath: string | null;
  verified: boolean;
  land: { id: string; name: string; order: number };
};

export type LandmarkDetail = Landmark & {
  /** Quest spots that point at this landmark ("Story behind this"). */
  linkedQuests: { id: string; slug: string; title: string }[];
};

const landmarkSelect = `
  id, slug, sort_order, title, teaser, look_for, architecture, story, history, engineering,
  lat, lng, radius_m, photo_path, verified_on_site,
  land:lands ( id, name, sort_order )
` as const;

type LandmarkRow = {
  id: string;
  slug: string;
  sort_order: number;
  title: string;
  teaser: string;
  look_for: string;
  architecture: string | null;
  story: string | null;
  history: string | null;
  engineering: string | null;
  lat: number | null;
  lng: number | null;
  radius_m: number;
  photo_path: string | null;
  verified_on_site: boolean;
  land: { id: string; name: string; sort_order: number };
};

function toLandmark(row: LandmarkRow): Landmark {
  const layers: Partial<Record<LayerKey, string>> = {};
  for (const key of LAYER_KEYS) {
    const text = row[key];
    if (text) layers[key] = text;
  }
  return {
    id: row.id,
    slug: row.slug,
    order: row.sort_order,
    title: row.title,
    teaser: row.teaser,
    lookFor: row.look_for,
    layers,
    lat: row.lat,
    lng: row.lng,
    radiusM: row.radius_m,
    photoPath: row.photo_path,
    verified: row.verified_on_site,
    land: { id: row.land.id, name: row.land.name, order: row.land.sort_order },
  };
}

export const landmarkKeys = {
  all: ['landmarks'] as const,
  detail: (slug: string) => ['landmark', slug] as const,
  stamps: (userId: string | undefined) => ['lens-stamps', userId] as const,
};

/** Every live landmark, in walking order (land, then landmark). Cached for offline use. */
export function useLandmarks() {
  return useQuery({
    queryKey: landmarkKeys.all,
    queryFn: async (): Promise<Landmark[]> => {
      const { data, error } = await supabase.from('landmarks').select(landmarkSelect);
      if (error) throw error;
      return data
        .map(toLandmark)
        .sort((a, b) => a.land.order - b.land.order || a.order - b.order);
    },
  });
}

export function useLandmark(slug: string | undefined) {
  return useQuery({
    queryKey: landmarkKeys.detail(slug ?? ''),
    enabled: Boolean(slug),
    queryFn: async (): Promise<LandmarkDetail | null> => {
      const { data, error } = await supabase
        .from('landmarks')
        .select(`${landmarkSelect}, spots ( id, quest:quests ( id, slug, title, sort_order ) )`)
        .eq('slug', slug ?? '')
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const quests = new Map<string, { id: string; slug: string; title: string; order: number }>();
      for (const s of data.spots) quests.set(s.quest.id, { ...s.quest, order: s.quest.sort_order });
      return {
        ...toLandmark(data),
        linkedQuests: [...quests.values()]
          .sort((a, b) => a.order - b.order)
          .map(({ id, slug: questSlug, title }) => ({ id, slug: questSlug, title })),
      };
    },
  });
}

/** Landmark ids you've stamped, with the date. */
export function useMyLensStamps(userId: string | undefined) {
  return useQuery({
    queryKey: landmarkKeys.stamps(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lens_stamps')
        .select('landmark_id, stamped_at')
        .eq('user_id', userId ?? '');
      if (error) throw error;
      return data;
    },
    select: (rows) => new Map(rows.map((r) => [r.landmark_id, r.stamped_at])),
  });
}

export type StampReason = 'not_found' | 'location_required' | 'too_far';
export type StampResult = { ok: true; already: boolean } | { ok: false; reason: StampReason; distanceM: number | null };

export function parseStampResult(raw: unknown): StampResult {
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  if (r.ok === true) return { ok: true, already: r.already === true };
  const reason = r.reason === 'location_required' || r.reason === 'too_far' ? r.reason : 'not_found';
  return { ok: false, reason, distanceM: typeof r.distance_m === 'number' ? r.distance_m : null };
}

export function useStampLandmark(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ landmarkId, lat, lng }: { landmarkId: string; lat?: number; lng?: number }) => {
      const { data, error } = await supabase.rpc('stamp_landmark', { p_landmark_id: landmarkId, p_lat: lat, p_lng: lng });
      if (error) throw error;
      return parseStampResult(data);
    },
    onSuccess: (result) => {
      if (!result.ok) return;
      queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
      queryClient.invalidateQueries({ queryKey: ['star-history'] });
      return queryClient.invalidateQueries({ queryKey: landmarkKeys.stamps(userId) });
    },
  });
}

// ---------------------------------------------------------------------------
// Field tools (admins only; enforced in the database)
// ---------------------------------------------------------------------------

function invalidateLandmarks(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all(
    [landmarkKeys.all, ['landmark'], ['field-walk-landmarks']].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
}

export function useAdminUpdateLandmark(landmarkId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (changes: { lat?: number; lng?: number; photoPath?: string; verified?: boolean }) => {
      const { error } = await supabase.rpc('admin_update_landmark', {
        p_landmark_id: landmarkId,
        p_lat: changes.lat,
        p_lng: changes.lng,
        p_photo_path: changes.photoPath,
        p_verified: changes.verified,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateLandmarks(queryClient),
  });
}

export type LandmarkContentChanges = Partial<Record<'title' | 'teaser' | 'look_for' | LayerKey, string>> & { radius_m?: number };

export function useAdminUpdateLandmarkContent(landmarkId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (changes: LandmarkContentChanges) => {
      const { error } = await supabase.rpc('admin_update_landmark_content', { p_landmark_id: landmarkId, p_changes: changes });
      if (error) throw error;
    },
    onSuccess: () => invalidateLandmarks(queryClient),
  });
}

export type FieldWalkLandmark = { id: string; slug: string; title: string; landName: string; pinned: boolean; hasPhoto: boolean; verified: boolean };

export function useFieldWalkLandmarks(enabled: boolean) {
  return useQuery({
    queryKey: ['field-walk-landmarks'] as const,
    enabled,
    queryFn: async (): Promise<FieldWalkLandmark[]> => {
      const { data, error } = await supabase.from('landmarks').select(landmarkSelect);
      if (error) throw error;
      return data
        .map(toLandmark)
        .sort((a, b) => a.land.order - b.land.order || a.order - b.order)
        .map((l) => ({
          id: l.id,
          slug: l.slug,
          title: l.title,
          landName: l.land.name,
          pinned: l.lat !== null && l.lng !== null,
          hasPhoto: Boolean(l.photoPath),
          verified: l.verified,
        }));
    },
  });
}

// ---------------------------------------------------------------------------
// Compass geometry for the Lens view
// ---------------------------------------------------------------------------

/** Compass bearing in degrees (0 = north, clockwise) from one point to another. */
export function bearingDegrees(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const φ1 = toRad(from.lat);
  const φ2 = toRad(to.lat);
  const Δλ = toRad(to.lng - from.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Signed difference between two headings, in (-180, 180]. Positive means "to your right". */
export function relativeAngle(target: number, heading: number): number {
  let d = (target - heading) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}
