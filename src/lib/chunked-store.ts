/**
 * Chunking for a key/value store with a small per-value limit.
 *
 * SecureStore warns above 2048 bytes per value, and a Supabase session is
 * larger than that once the JWT is in it. Values are split across numbered
 * chunks with the count stored under the key itself.
 *
 * Kept apart from the SecureStore call sites so the decisions here can be
 * tested without a device.
 */

export type KeyValue = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};

/** SecureStore keys allow only word characters, dots and dashes. */
export const safeKey = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');

export const chunkKey = (key: string, i: number) => `${key}.${i}`;

export function split(value: string, limit: number): string[] {
  if (value.length === 0) return [''];
  const parts: string[] = [];
  for (let i = 0; i < value.length; i += limit) parts.push(value.slice(i, i + limit));
  return parts;
}

async function dropChunks(store: KeyValue, key: string, count: number) {
  for (let i = 0; i < count; i++) await store.remove(chunkKey(key, i));
}

export function chunked(store: KeyValue, limit: number) {
  return {
    async getItem(rawKey: string): Promise<string | null> {
      const key = safeKey(rawKey);
      const header = await store.get(key);
      if (header === null) return null;

      const count = Number(header);
      // A value written before chunking existed, or by something else.
      if (!Number.isInteger(count) || count < 1) return header;

      let out = '';
      for (let i = 0; i < count; i++) {
        const part = await store.get(chunkKey(key, i));
        // A missing chunk means a torn write. Half a session is worse than
        // none: reporting absence makes the app ask for a fresh sign-in.
        if (part === null) return null;
        out += part;
      }
      return out;
    },

    async setItem(rawKey: string, value: string): Promise<void> {
      const key = safeKey(rawKey);

      // Clear what was there first, so a shorter value cannot leave a longer
      // one's tail behind to be read back later.
      const previous = await store.get(key);
      if (previous !== null) await dropChunks(store, key, Number(previous) || 0);

      const parts = split(value, limit);
      for (let i = 0; i < parts.length; i++) await store.set(chunkKey(key, i), parts[i]);

      // The count goes last, so an interrupted write leaves no header and reads
      // back as absent rather than as a truncated session.
      await store.set(key, String(parts.length));
    },

    async removeItem(rawKey: string): Promise<void> {
      const key = safeKey(rawKey);
      const header = await store.get(key);
      if (header !== null) await dropChunks(store, key, Number(header) || 0);
      await store.remove(key);
    },
  };
}
