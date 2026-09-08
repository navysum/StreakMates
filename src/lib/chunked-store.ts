/**
 * Chunking for a key/value store with a small per-value limit.
 *
 * SecureStore warns above 2048 bytes per value, and a Supabase session is
 * larger than that once the JWT is in it. Values are split across numbered
 * chunks, measured in UTF-8 bytes because that is what the limit counts, with
 * the count stored under the key itself.
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

/**
 * Split so that no chunk exceeds `limit` **bytes** once encoded as UTF-8.
 *
 * The limit SecureStore cares about is a byte count, not a character count, and
 * a Supabase session is not pure ASCII: it carries the display name and email
 * Google supplies. A name in Greek, Arabic or Japanese is two to three bytes a
 * character, so slicing by `String.length` can hand SecureStore a chunk several
 * times over its limit — and the failure lands as a session that will not
 * persist, i.e. signed out again on every launch, for exactly the people whose
 * names are not Latin.
 *
 * Code points are never split down the middle: a surrogate pair is measured and
 * placed as one unit, so no chunk can end on half an emoji and no rejoined
 * value can come back corrupted.
 */
export function split(value: string, limit: number): string[] {
  if (value.length === 0) return [''];

  const parts: string[] = [];
  let current = '';
  let bytes = 0;

  // Iterating the string yields whole code points, so a surrogate pair arrives
  // as one two-unit character rather than as two halves.
  for (const char of value) {
    const size = utf8Length(char);
    if (bytes + size > limit && current !== '') {
      parts.push(current);
      current = '';
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);

  return parts;
}

/** Bytes one code point takes in UTF-8. */
function utf8Length(char: string): number {
  const code = char.codePointAt(0)!;
  if (code < 0x80) return 1;
  if (code < 0x800) return 2;
  if (code < 0x10000) return 3;
  return 4;
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
