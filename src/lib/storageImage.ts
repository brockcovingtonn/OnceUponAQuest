import type { ImageSource } from 'expo-image';

import { useAuth } from '@/lib/auth';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export type PhotoBucket = 'avatars' | 'spot-photos' | 'checkin-photos';

/**
 * Image source for a file in a private bucket, loaded with the signed-in
 * user's token. Cached by path so token refreshes don't refetch.
 */
export function useStorageImage(bucket: PhotoBucket, path: string | null | undefined): ImageSource | null {
  const { session } = useAuth();
  if (!path || !session) return null;
  return {
    uri: `${supabaseUrl}/storage/v1/object/authenticated/${bucket}/${path}`,
    headers: { Authorization: `Bearer ${session.access_token}`, apikey: anonKey },
    cacheKey: `${bucket}/${path}`,
  };
}
