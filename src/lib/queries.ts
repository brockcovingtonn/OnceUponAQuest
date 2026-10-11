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
