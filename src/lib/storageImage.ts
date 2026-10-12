import { Image, type ImageSource } from 'expo-image';

import { useAuth } from '@/lib/auth';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export type PhotoBucket = 'avatars' | 'spot-photos' | 'checkin-photos';

/** Stable URL for a file in a private bucket (the token travels in headers, not the URL). */
export function storageUrl(bucket: PhotoBucket, path: string): string {
  return `${supabaseUrl}/storage/v1/object/authenticated/${bucket}/${path}`;
}

function authHeaders(accessToken: string): Record<string, string> {
  return { Authorization: `Bearer ${accessToken}`, apikey: anonKey };
}

/**
 * Image source for a file in a private bucket, loaded with the signed-in
 * user's token and cached on disk by URL (so photos saved ahead of time by
 * prefetchStorageImages show without signal).
 */
export function useStorageImage(bucket: PhotoBucket, path: string | null | undefined): ImageSource | null {
  const { session } = useAuth();
  if (!path || !session) return null;
  return { uri: storageUrl(bucket, path), headers: authHeaders(session.access_token) };
}

/** Download photos into the on-device cache now, so they're there later without signal. */
export async function prefetchStorageImages(bucket: PhotoBucket, paths: (string | null | undefined)[], accessToken: string) {
  const urls = paths.filter((p): p is string => Boolean(p)).map((p) => storageUrl(bucket, p));
  if (urls.length === 0) return;
  await Image.prefetch(urls, { cachePolicy: 'disk', headers: authHeaders(accessToken) }).catch(() => false);
}
