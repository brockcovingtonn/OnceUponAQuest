import { useState } from 'react';

import { stampAvatars } from '@/lib/avatars';
import { type CapturedPhoto, pickAvatarPhoto, removeOldAvatars, uploadAvatarPhoto } from '@/lib/photos';

export type AvatarChoice = {
  mode: 'stamp' | 'photo';
  stampKey: string;
  /** The user's own photo: already uploaded (path) or just picked (local). */
  photo: { path?: string; localUri?: string; local?: CapturedPhoto } | null;
};

export type SavedAvatar = { avatarKey: string; avatarUrl: string | null };

/** State + actions for picking a stamp avatar or the user's own photo. */
export function useAvatarChoice(initial?: { avatarKey: string | null; avatarUrl: string | null }) {
  const [choice, setChoice] = useState<AvatarChoice>(() => ({
    mode: initial?.avatarUrl ? 'photo' : 'stamp',
    stampKey: stampAvatars.find((a) => a.key === initial?.avatarKey)?.key ?? stampAvatars[0].key,
    photo: initial?.avatarUrl ? { path: initial.avatarUrl } : null,
  }));
  const [picking, setPicking] = useState(false);

  async function pickPhoto() {
    setPicking(true);
    try {
      const picked = await pickAvatarPhoto();
      if (picked) setChoice((c) => ({ ...c, mode: 'photo', photo: { localUri: picked.uri, local: picked } }));
    } finally {
      setPicking(false);
    }
  }

  /** Uploads a newly picked photo if needed; returns what to store on the profile. */
  async function resolve(userId: string): Promise<SavedAvatar> {
    if (choice.mode === 'stamp' || !choice.photo) return { avatarKey: choice.stampKey, avatarUrl: null };
    if (choice.photo.local) {
      const path = await uploadAvatarPhoto(userId, choice.photo.local);
      return { avatarKey: choice.stampKey, avatarUrl: path };
    }
    return { avatarKey: choice.stampKey, avatarUrl: choice.photo.path ?? null };
  }

  /** After the profile is saved, delete photos the user no longer uses. */
  async function cleanUp(userId: string, saved: SavedAvatar) {
    await removeOldAvatars(userId, saved.avatarUrl).catch(() => {});
  }

  return {
    choice,
    picking,
    pickPhoto,
    selectStamp: (key: string) => setChoice((c) => ({ ...c, mode: 'stamp', stampKey: key })),
    selectPhoto: () => setChoice((c) => (c.photo ? { ...c, mode: 'photo' } : c)),
    resolve,
    cleanUp,
  };
}
