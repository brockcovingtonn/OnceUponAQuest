/**
 * Offline check-in queue: types and the sync loop. Kept free of React Native
 * imports so the logic can be tested on its own (see src/lib/offlineQueue.tsx
 * for storage, photos and triggers).
 */

export type CheckInReason =
  | 'not_found'
  | 'paused'
  | 'too_far'
  | 'location_required'
  | 'wrong_answer'
  | 'photo_required'
  | 'pass_required';

export type CheckInResult =
  | { ok: true; questComplete: boolean; badgeSlug: string | null }
  | { ok: false; reason: CheckInReason; distanceM: number | null };

export type QueuedCheckIn = {
  id: string;
  userId: string;
  spotId: string;
  questSlug: string;
  /** What the spot screen showed (teaser), for messages. */
  spotName: string;
  answer?: string;
  /** Compressed photo saved on the device, uploaded at sync time. */
  photoUri?: string;
  /** Captured when the user tapped Check in; GPS works without signal. */
  lat?: number;
  lng?: number;
  paradeMode: boolean;
  createdAt: string;
  status: 'waiting' | 'failed';
  /** Why the server refused it once synced (e.g. a wrong typed answer). */
  reason?: CheckInReason;
};

export type SyncDeps = {
  uploadPhoto: (item: QueuedCheckIn) => Promise<string>;
  checkIn: (item: QueuedCheckIn, photoPath: string | undefined) => Promise<CheckInResult>;
  deletePhoto: (uri: string) => Promise<void>;
  isNetworkError: (error: unknown) => boolean;
};

export type SyncOutcome = {
  /** Every item still in the queue afterwards (waiting + failed). */
  queue: QueuedCheckIn[];
  syncedCount: number;
  newlyFailed: QueuedCheckIn[];
  /** Badge slugs earned by synced check-ins. */
  badges: string[];
  /** True if the connection dropped part-way; the rest waits for next time. */
  interrupted: boolean;
};

/** Sends waiting check-ins for `userId` in the order they were made. */
export async function processQueue(queue: QueuedCheckIn[], userId: string, deps: SyncDeps): Promise<SyncOutcome> {
  const remaining: QueuedCheckIn[] = [];
  const newlyFailed: QueuedCheckIn[] = [];
  const badges: string[] = [];
  let syncedCount = 0;
  let interrupted = false;

  for (const item of queue) {
    if (interrupted || item.status !== 'waiting' || item.userId !== userId) {
      remaining.push(item);
      continue;
    }
    try {
      const photoPath = item.photoUri ? await deps.uploadPhoto(item) : undefined;
      const result = await deps.checkIn(item, photoPath);
      if (item.photoUri) await deps.deletePhoto(item.photoUri).catch(() => {});
      if (result.ok) {
        syncedCount += 1;
        if (result.questComplete && result.badgeSlug) badges.push(result.badgeSlug);
      } else {
        const failed: QueuedCheckIn = { ...item, status: 'failed', reason: result.reason, photoUri: undefined };
        newlyFailed.push(failed);
        remaining.push(failed);
      }
    } catch (error) {
      // No connection: stop and keep this and everything after it for next time.
      // Any other error: keep it waiting and carry on with the rest.
      remaining.push(item);
      if (deps.isNetworkError(error)) interrupted = true;
    }
  }
  return { queue: remaining, syncedCount, newlyFailed, badges, interrupted };
}
