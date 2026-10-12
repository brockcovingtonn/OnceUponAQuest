import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';

/** How long cached data stays usable offline. */
export const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

/** Change when cached data shapes change, so old caches are thrown away. */
const CACHE_VERSION = 'v1';

// Never worth keeping across launches.
const NOT_PERSISTED = new Set(['username-available']);

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'once-upon-a-quest:query-cache',
  throttleTime: 1000,
});

/** Quest content, progress, profile and friends are kept on the device so the app works without signal. */
export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister: queryPersister,
  maxAge: CACHE_MAX_AGE_MS,
  buster: CACHE_VERSION,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) =>
      query.state.status === 'success' && !NOT_PERSISTED.has(String(query.queryKey[0])),
  },
};
