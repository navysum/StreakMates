import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initials } from '../identity.ts';

/**
 * The leaderboard does not pass display names. It labels each row with the
 * person's handle and marks your own, so `initials` is called with strings
 * like "@alex" and "@craig (you)" — and on the rendered screen those came out
 * as "@A" and "@(" before this was fixed.
 */

test('initials: a handle loses its @', () => {
  assert.equal(initials('@alex'), 'AL');
  assert.equal(initials('@sam'), 'SA');
});

test('initials: "(you)" is a marker, not a surname', () => {
  assert.equal(initials('@craig (you)'), 'CR');
  assert.equal(initials('Craig Ataide (you)'), 'CA');
});

test('initials: ordinary display names are unchanged', () => {
  assert.equal(initials('Craig Ataide'), 'CA');
  assert.equal(initials('Alex Moore'), 'AM');
  assert.equal(initials('Prince'), 'PR');
  assert.equal(initials('mary-jane watson'), 'MW');
});

test('initials: nothing usable still gives something to draw', () => {
  assert.equal(initials(''), '?');
  assert.equal(initials('   '), '?');
  assert.equal(initials('@'), '?');
  assert.equal(initials('(you)'), '?');
});

test('initials: a non-Latin name keeps its own letters', () => {
  // The strip is a leading run only, so these survive intact rather than
  // being erased by an over-eager filter.
  assert.equal(initials('Ολυμπία Παπά'), 'ΟΠ');
  assert.equal(initials('田中 花子'), '田花');
});
