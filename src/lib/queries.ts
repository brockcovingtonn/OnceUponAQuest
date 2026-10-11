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
  /** Snack check-ins (Snack Passport), oldest first. */
  snacks: { spotId: string; foundAt: string }[];
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
          .select('spot_id, method, created_at, spot:spots ( quest_id )')
          .eq('user_id', userId ?? ''),
        supabase.from('user_badges').select('badge_id').eq('user_id', userId ?? ''),
      ]);
      if (checkins.error) throw checkins.error;
      if (badges.error) throw badges.error;

      const foundSpots = new Map<string, string>();
      const foundByQuest = new Map<string, number>();
      const snacks: MyProgress['snacks'] = [];
      for (const row of checkins.data) {
        foundSpots.set(row.spot_id, row.created_at);
        if (row.method === 'snack') snacks.push({ spotId: row.spot_id, foundAt: row.created_at });
        if (row.spot) {
          foundByQuest.set(row.spot.quest_id, (foundByQuest.get(row.spot.quest_id) ?? 0) + 1);
        }
      }
      snacks.sort((a, b) => a.foundAt.localeCompare(b.foundAt));
      return {
        foundSpots,
        foundByQuest,
        badgeIds: new Set(badges.data.map((b) => b.badge_id)),
        snacks,
      };
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

// ---------------------------------------------------------------------------
// Passport
// ---------------------------------------------------------------------------

export type PassportSpot = {
  id: string;
  teaser: string;
  title: string;
  method: Tables<'spots'>['method'];
};

export type PassportLand = { id: string; name: string; spots: PassportSpot[] };

export type PassportBadge = { id: string; slug: string; title: string; artKey: string };

export type PassportContent = { lands: PassportLand[]; badges: PassportBadge[] };

/** Every live spot grouped by land (walking order), and every badge for a live quest. */
export function usePassportContent() {
  return useQuery({
    queryKey: ['passport-content'] as const,
    queryFn: async (): Promise<PassportContent> => {
      const [spots, badges] = await Promise.all([
        supabase
          .from('spots')
          .select('id, sort_order, teaser, title, method, quest:quests ( sort_order, land:lands ( id, name, sort_order ) )'),
        supabase.from('badges').select('id, slug, title, art_key, quests ( sort_order )'),
      ]);
      if (spots.error) throw spots.error;
      if (badges.error) throw badges.error;

      const ordered = [...spots.data].sort(
        (a, b) =>
          a.quest.land.sort_order - b.quest.land.sort_order ||
          a.quest.sort_order - b.quest.sort_order ||
          a.sort_order - b.sort_order,
      );
      const lands = new Map<string, PassportLand>();
      for (const spot of ordered) {
        const land = lands.get(spot.quest.land.id) ?? {
          id: spot.quest.land.id,
          name: spot.quest.land.name,
          spots: [],
        };
        land.spots.push({ id: spot.id, teaser: spot.teaser, title: spot.title, method: spot.method });
        lands.set(land.id, land);
      }

      // RLS only returns live quests, so badges with no quests belong to drafts.
      const liveBadges = badges.data
        .filter((b) => b.quests.length > 0)
        .sort((a, b) => a.quests[0].sort_order - b.quests[0].sort_order)
        .map((b) => ({ id: b.id, slug: b.slug, title: b.title, artKey: b.art_key }));

      return { lands: [...lands.values()], badges: liveBadges };
    },
  });
}

// ---------------------------------------------------------------------------
// Friends
// ---------------------------------------------------------------------------

export type FriendProfile = { id: string; username: string; avatarKey: string | null };

export type Friendships = {
  /** Requests other explorers sent to me, waiting for my answer. */
  incoming: FriendProfile[];
  /** Requests I sent that haven't been accepted yet. */
  outgoing: FriendProfile[];
  /** Ids of everyone I'm already friends with. */
  friendIds: Set<string>;
};

export type LeaderboardRow = {
  userId: string;
  username: string;
  avatarKey: string | null;
  spotsFound: number;
  badges: number;
  isMe: boolean;
};

export const friendKeys = {
  friendships: (userId: string | undefined) => ['friendships', userId] as const,
  leaderboard: (userId: string | undefined) => ['leaderboard', userId] as const,
};

export function useFriendships(userId: string | undefined) {
  return useQuery({
    queryKey: friendKeys.friendships(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<Friendships> => {
      const { data, error } = await supabase.from('friendships').select(`
        requester, addressee, status,
        requester_profile:profiles!friendships_requester_fkey ( id, username, avatar_key ),
        addressee_profile:profiles!friendships_addressee_fkey ( id, username, avatar_key )
      `);
      if (error) throw error;

      const toFriend = (p: { id: string; username: string; avatar_key: string | null }): FriendProfile => ({
        id: p.id,
        username: p.username,
        avatarKey: p.avatar_key,
      });
      const result: Friendships = { incoming: [], outgoing: [], friendIds: new Set() };
      for (const row of data) {
        const iAmRequester = row.requester === userId;
        if (row.status === 'accepted') {
          result.friendIds.add(iAmRequester ? row.addressee : row.requester);
        } else if (iAmRequester) {
          result.outgoing.push(toFriend(row.addressee_profile));
        } else {
          result.incoming.push(toFriend(row.requester_profile));
        }
      }
      return result;
    },
  });
}

export function useLeaderboard(userId: string | undefined) {
  return useQuery({
    queryKey: friendKeys.leaderboard(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<LeaderboardRow[]> => {
      const { data, error } = await supabase.rpc('friends_leaderboard');
      if (error) throw error;
      return data.map((row) => ({
        userId: row.user_id,
        username: row.username,
        avatarKey: row.avatar_key ?? null,
        spotsFound: row.spots_found,
        badges: row.badges,
        isMe: row.is_me,
      }));
    },
  });
}

export type AddFriendOutcome = 'sent' | 'not_found' | 'self' | 'already_friends' | 'already_sent' | 'they_asked';

/** Escape LIKE wildcards so "lamp_lighter" matches only itself. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export function useAddFriend(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (username: string): Promise<AddFriendOutcome> => {
      if (!userId) throw new Error('Not signed in');
      const { data: match, error } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', escapeLike(username.trim()))
        .maybeSingle();
      if (error) throw error;
      if (!match) return 'not_found';
      if (match.id === userId) return 'self';

      const current = queryClient.getQueryData<Friendships>(friendKeys.friendships(userId));
      if (current?.friendIds.has(match.id)) return 'already_friends';
      if (current?.outgoing.some((f) => f.id === match.id)) return 'already_sent';
      if (current?.incoming.some((f) => f.id === match.id)) return 'they_asked';

      const insert = await supabase.from('friendships').insert({ requester: userId, addressee: match.id });
      if (insert.error) {
        if (insert.error.code === '23505') return 'already_sent';
        throw insert.error;
      }
      return 'sent';
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: friendKeys.friendships(userId) }),
  });
}

export function useRespondToRequest(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requesterId, accept }: { requesterId: string; accept: boolean }) => {
      if (!userId) throw new Error('Not signed in');
      const query = accept
        ? supabase.from('friendships').update({ status: 'accepted' })
        : supabase.from('friendships').delete();
      const { error } = await query.eq('requester', requesterId).eq('addressee', userId);
      if (error) throw error;
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: friendKeys.friendships(userId) }),
        queryClient.invalidateQueries({ queryKey: friendKeys.leaderboard(userId) }),
      ]),
  });
}

/** Remove an accepted friendship, whichever of us sent the original request. */
export function useRemoveFriend(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (friendId: string) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(
          `and(requester.eq.${userId},addressee.eq.${friendId}),and(requester.eq.${friendId},addressee.eq.${userId})`,
        );
      if (error) throw error;
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: friendKeys.friendships(userId) }),
        queryClient.invalidateQueries({ queryKey: friendKeys.leaderboard(userId) }),
      ]),
  });
}
