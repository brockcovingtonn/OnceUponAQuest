import AsyncStorage from '@react-native-async-storage/async-storage';
import { onlineManager, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/lib/auth';
import { isNetworkError } from '@/lib/network';
import { processQueue, type QueuedCheckIn } from '@/lib/offlineSync';
import { type CapturedPhoto, deleteSavedPhoto, savePhotoForLater, uploadSavedCheckinPhoto } from '@/lib/photos';
import { parseCheckInResult, questKeys } from '@/lib/queries';
import { queryPersister } from '@/lib/queryPersistence';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'once-upon-a-quest:offline-checkins';

export type NewOfflineCheckIn = {
  spotId: string;
  questSlug: string;
  spotName: string;
  answer?: string;
  photo?: CapturedPhoto;
  lat?: number;
  lng?: number;
  paradeMode: boolean;
};

export type LastSync = { syncedCount: number; badges: string[]; failedCount: number; at: number };

type OfflineQueueState = {
  items: QueuedCheckIn[];
  /** Number of check-ins still waiting to upload. */
  waitingCount: number;
  syncing: boolean;
  lastSync: LastSync | null;
  enqueue: (checkIn: NewOfflineCheckIn) => Promise<void>;
  /** Forget a queued item (e.g. after reading why it failed, or before retrying). */
  remove: (id: string) => Promise<void>;
  dismissLastSync: () => void;
  syncNow: () => Promise<void>;
};

const OfflineQueueContext = createContext<OfflineQueueState | null>(null);

async function readQueue(): Promise<QueuedCheckIn[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedCheckIn[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(items: QueuedCheckIn[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/** Check-ins made without signal wait here (on the device) and upload when the connection returns. */
export function OfflineQueueProvider({ children }: { children: ReactNode }) {
  const { session, initialized } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const [items, setItems] = useState<QueuedCheckIn[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<LastSync | null>(null);
  const itemsRef = useRef(items);
  const syncingRef = useRef(false);

  const save = useCallback(async (next: QueuedCheckIn[]) => {
    itemsRef.current = next;
    setItems(next);
    await writeQueue(next);
  }, []);

  useEffect(() => {
    readQueue().then((stored) => {
      itemsRef.current = stored;
      setItems(stored);
      setLoaded(true);
    });
  }, []);

  // When the signed-in person changes, drop the previous person's cached data.
  const previousUserId = useRef(userId);
  useEffect(() => {
    if (!initialized) return;
    if (previousUserId.current && previousUserId.current !== userId) {
      queryClient.clear();
      queryPersister.removeClient();
    }
    previousUserId.current = userId;
  }, [initialized, userId, queryClient]);

  // Signing out (or another person signing in) clears this device's queue and cache.
  useEffect(() => {
    if (!loaded || !initialized) return;
    const foreign = itemsRef.current.filter((item) => item.userId !== userId);
    if (foreign.length === 0) return;
    foreign.forEach((item) => item.photoUri && deleteSavedPhoto(item.photoUri));
    save(itemsRef.current.filter((item) => item.userId === userId));
  }, [loaded, initialized, userId, save]);

  const syncNow = useCallback(async () => {
    if (!userId || syncingRef.current || !onlineManager.isOnline()) return;
    if (!itemsRef.current.some((item) => item.status === 'waiting' && item.userId === userId)) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      const outcome = await processQueue(itemsRef.current, userId, {
        uploadPhoto: (item) => uploadSavedCheckinPhoto(userId, item.spotId, item.photoUri ?? ''),
        checkIn: async (item, photoPath) => {
          const { data, error } = await supabase.rpc('check_in', {
            p_spot_id: item.spotId,
            p_answer: item.answer,
            p_lat: item.lat,
            p_lng: item.lng,
            p_photo_path: photoPath,
            p_parade_mode: item.paradeMode,
          });
          if (error) throw error;
          return parseCheckInResult(data);
        },
        deletePhoto: async (uri) => deleteSavedPhoto(uri),
        isNetworkError,
      });
      await save(outcome.queue);
      if (outcome.syncedCount > 0 || outcome.newlyFailed.length > 0) {
        setLastSync({
          syncedCount: outcome.syncedCount,
          badges: outcome.badges,
          failedCount: outcome.newlyFailed.length,
          at: Date.now(),
        });
        await queryClient.invalidateQueries({ queryKey: questKeys.progress(userId) });
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [userId, queryClient, save]);

  // Sync on launch, when the connection comes back, and when the app returns to the foreground.
  useEffect(() => {
    if (!loaded) return;
    syncNow();
    const unsubscribeOnline = onlineManager.subscribe((online) => {
      if (online) syncNow();
    });
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncNow();
    });
    return () => {
      unsubscribeOnline();
      appState.remove();
    };
  }, [loaded, syncNow]);

  const enqueue = useCallback(
    async (checkIn: NewOfflineCheckIn) => {
      if (!userId) return;
      const photoUri = checkIn.photo ? await savePhotoForLater(checkIn.photo) : undefined;
      const item: QueuedCheckIn = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId,
        spotId: checkIn.spotId,
        questSlug: checkIn.questSlug,
        spotName: checkIn.spotName,
        answer: checkIn.answer,
        photoUri,
        lat: checkIn.lat,
        lng: checkIn.lng,
        paradeMode: checkIn.paradeMode,
        createdAt: new Date().toISOString(),
        status: 'waiting',
      };
      // One entry per spot: a new attempt replaces an older failed one.
      const others = itemsRef.current.filter((existing) => existing.spotId !== checkIn.spotId);
      await save([...others, item]);
      syncNow();
    },
    [userId, save, syncNow],
  );

  const remove = useCallback(
    async (id: string) => {
      const item = itemsRef.current.find((existing) => existing.id === id);
      if (item?.photoUri) deleteSavedPhoto(item.photoUri);
      await save(itemsRef.current.filter((existing) => existing.id !== id));
    },
    [save],
  );

  const value = useMemo<OfflineQueueState>(
    () => ({
      items: items.filter((item) => item.userId === userId),
      waitingCount: items.filter((item) => item.userId === userId && item.status === 'waiting').length,
      syncing,
      lastSync,
      enqueue,
      remove,
      dismissLastSync: () => setLastSync(null),
      syncNow,
    }),
    [items, userId, syncing, lastSync, enqueue, remove, syncNow],
  );

  return <OfflineQueueContext.Provider value={value}>{children}</OfflineQueueContext.Provider>;
}

export function useOfflineQueue(): OfflineQueueState {
  const context = useContext(OfflineQueueContext);
  if (!context) throw new Error('useOfflineQueue must be used inside OfflineQueueProvider');
  return context;
}

/** The queued check-in for one spot, if any. */
export function useQueuedCheckIn(spotId: string | undefined): QueuedCheckIn | undefined {
  const { items } = useOfflineQueue();
  return spotId ? items.find((item) => item.spotId === spotId) : undefined;
}
