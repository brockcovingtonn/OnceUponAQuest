import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tables, TablesInsert } from '@/types/database';

export type Profile = Tables<'profiles'>;

export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,24}$/;

export const queryKeys = {
  profile: (userId: string | undefined) => ['profile', userId] as const,
  usernameAvailable: (username: string) => ['username-available', username.toLowerCase()] as const,
};

/** The signed-in user's profile row, or null if onboarding isn't finished. */
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.profile(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUsernameAvailable(username: string) {
  return useQuery({
    queryKey: queryKeys.usernameAvailable(username),
    enabled: USERNAME_PATTERN.test(username),
    staleTime: 10_000,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc('username_available', { p_username: username });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: TablesInsert<'profiles'>): Promise<Profile> => {
      const { data, error } = await supabase.from('profiles').insert(profile).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile(profile.id), profile);
    },
  });
}

// ---------------------------------------------------------------------------
// Quests and progress
// ---------------------------------------------------------------------------

const questListSelect = `
  id, slug, title, story, est_minutes, sort_order, is_premium, season,
  land:lands ( id, name, sort_order ),
  badge:badges ( id, slug, title, art_key ),
  spots ( count )
` as const;

const questDetailSelect = `
  id, slug, title, story, est_minutes,
  badge:badges ( id, slug, title, description, art_key ),
  spots ( id, sort_order, teaser, title, method, pause_during_parades, holiday_note )
` as const;

export type QuestSummary = {
  id: string;
  slug: string;
  title: string;
  story: string | null;
  estMinutes: number;
  isPremium: boolean;
  season: string | null;
  land: { id: string; name: string; sortOrder: number };
  badge: { id: string; slug: string; title: string; artKey: string } | null;
  spotCount: number;
};

export type QuestDetail = Awaited<ReturnType<typeof fetchQuestDetail>>;
export type QuestSpot = NonNullable<QuestDetail>['spots'][number];

export type MyProgress = {
  /** Spot ids the user has found, with the date found. */
  foundSpots: Map<string, string>;
  /** Number of found spots per quest id. */
  foundByQuest: Map<string, number>;
  /** Badge ids the user has earned. */
  badgeIds: Set<string>;
};

export const questKeys = {
  all: ['quests'] as const,
  detail: (slug: string) => ['quest', slug] as const,
  progress: (userId: string | undefined) => ['progress', userId] as const,
};

export function useQuests() {
  return useQuery({
    queryKey: questKeys.all,
    queryFn: async (): Promise<QuestSummary[]> => {
      const { data, error } = await supabase
        .from('quests')
        .select(questListSelect)
        .order('sort_order');
      if (error) throw error;
      return data.map((q) => ({
          id: q.id,
          slug: q.slug,
          title: q.title,
          story: q.story,
          estMinutes: q.est_minutes,
          isPremium: q.is_premium,
          season: q.season,
          land: { id: q.land.id, name: q.land.name, sortOrder: q.land.sort_order },
          badge: q.badge
            ? { id: q.badge.id, slug: q.badge.slug, title: q.badge.title, artKey: q.badge.art_key }
            : null,
          spotCount: q.spots[0]?.count ?? 0,
      }));
    },
  });
}

async function fetchQuestDetail(slug: string) {
  const { data, error } = await supabase
    .from('quests')
    .select(questDetailSelect)
    .eq('slug', slug)
    .order('sort_order', { referencedTable: 'spots' })
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** One quest with its spots in walking order, or null if it doesn't exist or isn't live. */
export function useQuest(slug: string | undefined) {
  return useQuery({
    queryKey: questKeys.detail(slug ?? ''),
    enabled: Boolean(slug),
    queryFn: () => fetchQuestDetail(slug ?? ''),
  });
}

/** The signed-in user's own check-ins and badges (friends' rows are filtered out). */
export function useMyProgress(userId: string | undefined) {
  return useQuery({
    queryKey: questKeys.progress(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<MyProgress> => {
      const [checkins, badges] = await Promise.all([
        supabase
          .from('checkins')
          .select('spot_id, created_at, spot:spots ( quest_id )')
          .eq('user_id', userId ?? ''),
        supabase.from('user_badges').select('badge_id').eq('user_id', userId ?? ''),
      ]);
      if (checkins.error) throw checkins.error;
      if (badges.error) throw badges.error;

      const foundSpots = new Map<string, string>();
      const foundByQuest = new Map<string, number>();
      for (const row of checkins.data) {
        foundSpots.set(row.spot_id, row.created_at);
        if (row.spot) {
          foundByQuest.set(row.spot.quest_id, (foundByQuest.get(row.spot.quest_id) ?? 0) + 1);
        }
      }
      return { foundSpots, foundByQuest, badgeIds: new Set(badges.data.map((b) => b.badge_id)) };
    },
  });
}

// ---------------------------------------------------------------------------
// Spots, check-ins, reports, badges
// ---------------------------------------------------------------------------

// source_url is internal research only and is never selected by the app.
const spotDetailSelect = `
  id, quest_id, sort_order, teaser, title, where_to_stand, clue, hint, prompt, method,
  lat, lng, radius_m, pause_during_parades, holiday_note,
  quest:quests ( slug, title, spots ( count ) )
` as const;

export const spotKeys = {
  detail: (id: string) => ['spot', id] as const,
};

async function fetchSpot(id: string) {
  const { data, error } = await supabase.from('spots').select(spotDetailSelect).eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export type SpotDetail = NonNullable<Awaited<ReturnType<typeof fetchSpot>>>;

export function useSpot(id: string | undefined) {
  return useQuery({
    queryKey: spotKeys.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: () => fetchSpot(id ?? ''),
  });
}

export const CHECK_IN_REASONS = [
  'not_found',
  'paused',
  'too_far',
  'location_required',
  'wrong_answer',
  'photo_required',
] as const;
export type CheckInReason = (typeof CHECK_IN_REASONS)[number];

export type CheckInResult =
  | { ok: true; questComplete: boolean; badgeSlug: string | null }
  | { ok: false; reason: CheckInReason; distanceM: number | null };

export type CheckInInput = {
  spotId: string;
  answer?: string;
  lat?: number;
  lng?: number;
  photoPath?: string;
  paradeMode: boolean;
};

function isReason(value: unknown): value is CheckInReason {
  return typeof value === 'string' && (CHECK_IN_REASONS as readonly string[]).includes(value);
}

/** Parse the jsonb returned by public.check_in. */
export function parseCheckInResult(raw: unknown): CheckInResult {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('Unexpected check_in response');
  }
  const r = raw as Record<string, unknown>;
  if (r.ok === true) {
    return {
      ok: true,
      questComplete: r.quest_complete === true,
      badgeSlug: typeof r.badge_slug === 'string' ? r.badge_slug : null,
    };
  }
  if (!isReason(r.reason)) throw new Error('Unexpected check_in reason');
  return { ok: false, reason: r.reason, distanceM: typeof r.distance_m === 'number' ? r.distance_m : null };
}

export function useCheckIn(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CheckInInput): Promise<CheckInResult> => {
      const { data, error } = await supabase.rpc('check_in', {
        p_spot_id: input.spotId,
        p_answer: input.answer,
        p_lat: input.lat,
        p_lng: input.lng,
        p_photo_path: input.photoPath,
        p_parade_mode: input.paradeMode,
      });
      if (error) throw error;
      return parseCheckInResult(data);
    },
    onSuccess: async (result) => {
      if (result.ok) await queryClient.invalidateQueries({ queryKey: questKeys.progress(userId) });
    },
  });
}

export type ReportReason = 'spot_changed' | 'unsafe' | 'answer_wrong' | 'other';

export function useReportSpot() {
  return useMutation({
    mutationFn: async (input: { spotId: string; reason: ReportReason; note: string }) => {
      const note = input.note.trim();
      const { error } = await supabase
        .from('spot_reports')
        .insert({ spot_id: input.spotId, reason: input.reason, note: note === '' ? null : note });
      if (error) throw error;
    },
  });
}

export function useBadge(slug: string | undefined) {
  return useQuery({
    queryKey: ['badge', slug ?? ''] as const,
    enabled: Boolean(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('id, slug, title, description, art_key, quests ( id, slug, title, spots ( count ) )')
        .eq('slug', slug ?? '')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
