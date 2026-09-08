import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertChanged } from '../writes.ts';

test('writes: an empty result is a refusal, not a success', () => {
  // The shape PostgREST returns when RLS filtered every row out.
  assert.throws(() => assertChanged([], 'nope'), /nope/);
});

test('writes: a null result is a refusal too', () => {
  // PostgREST returns null rather than [] when the request did not ask for a
  // representation, which is exactly the case that hid this bug for so long.
  assert.throws(() => assertChanged(null, 'nope'), /nope/);
});

test('writes: rows pass straight through, so a caller can use them', () => {
  const rows = [{ id: 'a' }, { id: 'b' }];
  assert.deepEqual(assertChanged(rows, 'nope'), rows);
});

test('writes: the message reaches the user unchanged', () => {
  // These strings are shown verbatim on screen, so they are part of the API.
  assert.throws(
    () => assertChanged([], 'Only the group owner can rename it.'),
    { message: 'Only the group owner can rename it.' },
  );
});
