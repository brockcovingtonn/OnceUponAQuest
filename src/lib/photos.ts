import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

const MAX_UPLOAD_BYTES = 1_000_000;
// Longest side and JPEG quality, tried in order until the file is under 1 MB.
const COMPRESSION_STEPS: [number, number][] = [
  [1600, 0.7],
  [1280, 0.6],
  [1024, 0.5],
  [800, 0.4],
];

export type CapturedPhoto = { uri: string; width: number; height: number };

export type CameraResult =
  | { status: 'ok'; photo: CapturedPhoto }
  | { status: 'canceled' }
  | { status: 'denied' };

export async function takePhoto(): Promise<CameraResult> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return { status: 'denied' };
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, exif: false });
  if (result.canceled) return { status: 'canceled' };
  const { uri, width, height } = result.assets[0];
  return { status: 'ok', photo: { uri, width, height } };
}

/** Resize and re-encode as JPEG until the file is under 1 MB. Returns a local file uri. */
export async function compressPhoto(
  photo: CapturedPhoto,
  steps: [number, number][] = COMPRESSION_STEPS,
): Promise<string> {
  const longest = Math.max(photo.width, photo.height);
  for (const [maxSide, quality] of steps) {
    const context = ImageManipulator.manipulate(photo.uri);
    if (longest > maxSide) {
      context.resize(
        photo.width >= photo.height ? { width: maxSide, height: null } : { width: null, height: maxSide },
      );
    }
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: quality });
    if (new File(saved.uri).size < MAX_UPLOAD_BYTES) return saved.uri;
  }
  throw new Error('Photo is still larger than 1 MB after compression');
}

/** Upload to checkin-photos at `<user id>/<spot id>-<timestamp>.jpg` and return that path. */
export async function uploadCheckinPhoto(userId: string, spotId: string, photo: CapturedPhoto): Promise<string> {
  const uri = await compressPhoto(photo);
  const path = `${userId}/${spotId}-${Date.now()}.jpg`;
  const body = await new File(uri).arrayBuffer();
  const { error } = await supabase.storage
    .from('checkin-photos')
    .upload(path, body, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  return path;
}

// ---------------------------------------------------------------------------
// Profile photos ("Use my own photo")
// ---------------------------------------------------------------------------

const AVATAR_STEPS: [number, number][] = [
  [512, 0.8],
  [512, 0.6],
  [384, 0.6],
];

/** Pick a photo from the library, cropped square. No permission prompt is needed for the system picker. */
export async function pickAvatarPhoto(): Promise<CapturedPhoto | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    exif: false,
  });
  if (result.canceled) return null;
  const { uri, width, height } = result.assets[0];
  return { uri, width, height };
}

/** Upload to avatars/<user id>/avatar-<timestamp>.jpg and return that path. */
export async function uploadAvatarPhoto(userId: string, photo: CapturedPhoto): Promise<string> {
  const uri = await compressPhoto(photo, AVATAR_STEPS);
  const path = `${userId}/avatar-${Date.now()}.jpg`;
  const body = await new File(uri).arrayBuffer();
  const { error } = await supabase.storage.from('avatars').upload(path, body, { contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
}

/** Delete the user's older profile photos, keeping `keepPath` (if any). */
export async function removeOldAvatars(userId: string, keepPath: string | null) {
  const bucket = supabase.storage.from('avatars');
  const { data: files, error } = await bucket.list(userId, { limit: 100 });
  if (error) throw error;
  const stale = files.map((f) => `${userId}/${f.name}`).filter((p) => p !== keepPath);
  if (stale.length > 0) await bucket.remove(stale);
}
