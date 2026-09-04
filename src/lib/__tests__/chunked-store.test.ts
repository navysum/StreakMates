import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chunked, safeKey, split, type KeyValue } from '../chunked-store.ts';

/** An in-memory stand-in for SecureStore, with the same shape. */
function fake() {
  const data = new Map<string, string>();
  const store: KeyValue = {
    async get(k) {
      return data.has(k) ? data.get(k)! : null;
    },
    async set(k, v) {
      data.set(k, v);
    },
    async remove(k) {
      data.delete(k);
    },
  };
  return { store, data };
}

const LIMIT = 10;

test('a short value round-trips', async () => {
  const { store } = fake();
  const s = chunked(store, LIMIT);
  await s.setItem('k', 'hello');
  assert.equal(await s.getItem('k'), 'hello');
});

test('a value larger than the limit round-trips', async () => {
  const { store, data } = fake();
  const s = chunked(store, LIMIT);
  const long = 'x'.repeat(95);
  await s.setItem('k', long);
  assert.equal(await s.getItem('k'), long);
  assert.equal(data.get('k'), '10', 'header should record the chunk count');
});

test('every chunk stays within the limit', async () => {
  const { store, data } = fake();
  await chunked(store, LIMIT).setItem('k', 'y'.repeat(55));
  for (const [key, value] of data) {
    if (key === 'k') continue;
    assert.ok(value.length <= LIMIT, `${key} is ${value.length}`);
  }
});

test('a missing key reads as null', async () => {
  const { store } = fake();
  assert.equal(await chunked(store, LIMIT).getItem('nope'), null);
});

test('an empty string is stored and read back, not lost', async () => {
  const { store } = fake();
  const s = chunked(store, LIMIT);
  await s.setItem('k', '');
  assert.equal(await s.getItem('k'), '');
});

test('overwriting with a shorter value leaves no tail behind', async () => {
  const { store, data } = fake();
  const s = chunked(store, LIMIT);
  await s.setItem('k', 'a'.repeat(50)); // 5 chunks
  await s.setItem('k', 'b'.repeat(12)); // 2 chunks
  assert.equal(await s.getItem('k'), 'b'.repeat(12));
  assert.equal(data.has('k.2'), false, 'the old third chunk should be gone');
  assert.equal(data.has('k.4'), false);
});

test('a torn write reads as absent rather than as a short session', async () => {
  const { store, data } = fake();
  const s = chunked(store, LIMIT);
  await s.setItem('k', 'z'.repeat(50));
  data.delete('k.3'); // a chunk lost
  assert.equal(await s.getItem('k'), null);
});

test('removing clears the header and every chunk', async () => {
  const { store, data } = fake();
  const s = chunked(store, LIMIT);
  await s.setItem('k', 'q'.repeat(45));
  await s.removeItem('k');
  assert.equal(await s.getItem('k'), null);
  assert.equal(data.size, 0, `left behind: ${[...data.keys()].join(', ')}`);
});

test('a value written before chunking existed is still readable', async () => {
  const { store, data } = fake();
  data.set('k', 'a-plain-old-value');
  assert.equal(await chunked(store, LIMIT).getItem('k'), 'a-plain-old-value');
});

test('keys are reduced to characters SecureStore accepts', () => {
  assert.equal(safeKey('sb-abcdef-auth-token'), 'sb-abcdef-auth-token');
  assert.equal(safeKey('a b/c:d'), 'a_b_c_d');
  assert.equal(safeKey('keeps.dots-and_dashes'), 'keeps.dots-and_dashes');
});

test('split never returns an empty list, so a header is always written', () => {
  assert.deepEqual(split('', 10), ['']);
  assert.deepEqual(split('abc', 10), ['abc']);
  assert.deepEqual(split('abcdefghijk', 10), ['abcdefghij', 'k']);
});

test('a realistic session survives the round trip', async () => {
  const { store } = fake();
  const s = chunked(store, 1800);
  const session = JSON.stringify({
    access_token: 'eyJ' + 'A'.repeat(900),
    refresh_token: 'r'.repeat(60),
    expires_at: 1790000000,
    user: { id: 'e6f1', email: 'a@b.c', name: 'A'.repeat(200) },
  });
  await s.setItem('sb-project-auth-token', session);
  assert.equal(await s.getItem('sb-project-auth-token'), session);
});
