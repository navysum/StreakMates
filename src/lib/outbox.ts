/**
 * Check-ins that have not reached the server yet.
 *
 * Tapping the circle updates the cache immediately, so the tick is instant.
 * If the write then fails — no signal, a flat tunnel, the app closed — the
 * intent would otherwise be lost when the cache goes. This keeps it on disk
 * until it lands.
 *
 * Replaying is safe because check_ins is unique on (habit, user, date): a
 * write that arrives twice does nothing the second time.
 */

export type Pending = {
  habitId: string;
  date: string;
  complete: boolean;
  /** When it was queued, so stale intent can be dropped. */
  queuedAt: string;
};

/** The slice of AsyncStorage this needs, so tests can pass a fake. */
export type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

export const STORAGE_KEY = 'habits.outbox';

/**
 * check_ins' insert policy rejects a local_date more than three days old, so
 * anything older than that can never land and is dropped rather than retried
 * forever.
 */
export const MAX_AGE_DAYS = 3;

export async function read(storage: Storage): Promise<Pending[]> {
  try {
    const raw = await storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPending);
  } catch {
    // A corrupt outbox is an empty one. Losing a queued tick is bad; failing
    // to open the app because of one is worse.
    return [];
  }
}

function isPending(value: unknown): value is Pending {
  const v = value as Pending;
  return (
    !!v &&
    typeof v.habitId === 'string' &&
    typeof v.date === 'string' &&
    typeof v.complete === 'boolean' &&
    typeof v.queuedAt === 'string'
  );
}

/**
 * Queue an intent, replacing any earlier one for the same day.
 *
 * Ticking then unticking while offline should send one write, not two, and the
 * last thing you did is the thing you meant.
 */
export function merge(existing: Pending[], next: Pending): Pending[] {
  const others = existing.filter(
    (p) => !(p.habitId === next.habitId && p.date === next.date),
  );
  return [...others, next];
}

/** Entries still recent enough that the server would accept them. */
export function fresh(entries: Pending[], today: string): Pending[] {
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS);
  const oldest = cutoff.toISOString().slice(0, 10);
  return entries.filter((p) => p.date >= oldest);
}

export async function enqueue(storage: Storage, entry: Pending): Promise<void> {
  const current = await read(storage);
  await storage.setItem(STORAGE_KEY, JSON.stringify(merge(current, entry)));
}

export async function clear(storage: Storage, done: Pending[]): Promise<void> {
  const current = await read(storage);
  const remaining = current.filter(
    (p) => !done.some((d) => d.habitId === p.habitId && d.date === p.date),
  );
  await storage.setItem(STORAGE_KEY, JSON.stringify(remaining));
}

export type FlushResult = { sent: number; failed: number; dropped: number };

/**
 * Try everything queued. Whatever lands is forgotten; whatever fails stays for
 * next time, so a flat tunnel costs nothing but a delay.
 */
export async function flush(
  storage: Storage,
  today: string,
  send: (entry: Pending) => Promise<void>,
): Promise<FlushResult> {
  const all = await read(storage);
  if (all.length === 0) return { sent: 0, failed: 0, dropped: 0 };

  const usable = fresh(all, today);
  const dropped = all.length - usable.length;

  const sent: Pending[] = [];
  let failed = 0;
  for (const entry of usable) {
    try {
      await send(entry);
      sent.push(entry);
    } catch {
      failed++;
    }
  }

  // Stale entries go with the successful ones: neither is coming back.
  await clear(storage, [...sent, ...all.filter((p) => !usable.includes(p))]);
  return { sent: sent.length, failed, dropped };
}
