import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore warns above ~2 KB per value and Supabase sessions can be larger,
// so values are split across numbered keys: `<key>.count`, `<key>.0`, `<key>.1`, …
const CHUNK_SIZE = 1800;

const countKey = (key: string) => `${key}.count`;
const chunkKey = (key: string, index: number) => `${key}.${index}`;

async function readCount(key: string): Promise<number> {
  const raw = await SecureStore.getItemAsync(countKey(key));
  const count = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(count) ? count : 0;
}

async function removeChunks(key: string, from: number, to: number) {
  for (let i = from; i < to; i++) {
    await SecureStore.deleteItemAsync(chunkKey(key, i));
  }
}

const nativeStorage = {
  async getItem(key: string): Promise<string | null> {
    const count = await readCount(key);
    if (count === 0) return null;
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(chunkKey(key, i));
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    const previous = await readCount(key);
    const count = Math.max(1, Math.ceil(value.length / CHUNK_SIZE));
    for (let i = 0; i < count; i++) {
      await SecureStore.setItemAsync(
        chunkKey(key, i),
        value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
      );
    }
    await SecureStore.setItemAsync(countKey(key), String(count));
    await removeChunks(key, count, previous);
  },

  async removeItem(key: string): Promise<void> {
    const count = await readCount(key);
    await removeChunks(key, 0, count);
    await SecureStore.deleteItemAsync(countKey(key));
  },
};

// SecureStore has no web implementation; web is only used for quick previews.
const webStorage = {
  getItem: async (key: string) => globalThis.localStorage?.getItem(key) ?? null,
  setItem: async (key: string, value: string) => globalThis.localStorage?.setItem(key, value),
  removeItem: async (key: string) => globalThis.localStorage?.removeItem(key),
};

/** Session storage for the Supabase client, backed by the device keychain/keystore. */
export const secureStorage = Platform.OS === 'web' ? webStorage : nativeStorage;
