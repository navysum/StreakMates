import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  clear,
  enqueue,
  flush,
  fresh,
  merge,
  read,
  STORAGE_KEY,
  type Pending,
  type Storage,
} from '../outbox.ts';

const TODAY = '2026-09-03';

function fakeStorage(initial: string | null = null): Storage & { value: string | null } {
  return {
    value: initial,
    async getItem() {
      return this.value;
    },
    async setItem(_key, value) {
      this.value = value;
    },
  };
}

const entry = (over: Partial<Pending> = {}): Pending => ({
  habitId: 'h1',
  date: TODAY,
  complete: true,
  queuedAt: '2026-09-03T08:00:00Z',
  ...over,
});

test('an empty outbox reads as empty, not as a crash', async () => {
  assert.deepEqual(await read(fakeStorage()), []);
});

test('a corrupt outbox reads as empty rather than blocking the app', async () => {
  assert.deepEqual(await read(fakeStorage('{ not json')), []);
  assert.deepEqual(await read(fakeStorage('"a string"')), []);
  assert.deepEqual(await read(fakeStorage('[{"nonsense": true}]')), []);
});

test('queueing the same day twice keeps only the last intent', () => {
  const first = entry({ complete: true });
  const second = entry({ complete: false, queuedAt: '2026-09-03T09:00:00Z' });
  const result = merge([first], second);
  assert.equal(result.length, 1);
  assert.equal(result[0].complete, false);
});

test('a different day or habit queues separately', () => {
  const base = entry();
  assert.equal(merge([base], entry({ date: '2026-09-02' })).length, 2);
  assert.equal(merge([base], entry({ habitId: 'h2' })).length, 2);
});

test('entries the server would reject are dropped, not retried forever', () => {
  const recent = entry({ date: '2026-09-01' });
  const ancient = entry({ date: '2026-07-01' });
  assert.deepEqual(fresh([recent, ancient], TODAY), [recent]);
});

test('flushing sends everything queued and forgets what landed', async () => {
  const storage = fakeStorage(JSON.stringify([entry(), entry({ habitId: 'h2' })]));
  const seen: string[] = [];

  const result = await flush(storage, TODAY, async (e) => {
    seen.push(e.habitId);
  });

  assert.deepEqual(seen.sort(), ['h1', 'h2']);
  assert.deepEqual(result, { sent: 2, failed: 0, dropped: 0 });
  assert.deepEqual(await read(storage), []);
});

test('what fails stays queued for next time', async () => {
  const storage = fakeStorage(JSON.stringify([entry({ habitId: 'ok' }), entry({ habitId: 'bad' })]));

  const result = await flush(storage, TODAY, async (e) => {
    if (e.habitId === 'bad') throw new Error('no signal');
  });

  assert.equal(result.sent, 1);
  assert.equal(result.failed, 1);
  const left = await read(storage);
  assert.deepEqual(
    left.map((p) => p.habitId),
    ['bad'],
  );
});

test('stale entries are cleared even though they were never sent', async () => {
  const storage = fakeStorage(JSON.stringify([entry({ date: '2026-01-01' })]));
  const result = await flush(storage, TODAY, async () => {
    throw new Error('should not be called');
  });
  assert.deepEqual(result, { sent: 0, failed: 0, dropped: 1 });
  assert.deepEqual(await read(storage), []);
});

test('enqueue then flush round-trips through storage', async () => {
  const storage = fakeStorage();
  await enqueue(storage, entry());
  assert.equal((await read(storage)).length, 1);
  await flush(storage, TODAY, async () => {});
  assert.deepEqual(await read(storage), []);
});

test('clear removes only what it was told about', async () => {
  const storage = fakeStorage(JSON.stringify([entry({ habitId: 'a' }), entry({ habitId: 'b' })]));
  await clear(storage, [entry({ habitId: 'a' })]);
  assert.deepEqual((await read(storage)).map((p) => p.habitId), ['b']);
});

test('the storage key is stable, since changing it strands queued ticks', () => {
  assert.equal(STORAGE_KEY, 'habits.outbox');
});
