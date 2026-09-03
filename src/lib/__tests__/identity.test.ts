import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handle, initial } from '../identity.ts';

/** Mirrors the CHECK constraint in 0003_usernames.sql. */
const USERNAME = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;

test('handle prefers the unique username over the repeatable display name', () => {
  assert.equal(handle({ username: 'craig', display_name: 'Craig Ataide' }), '@craig');
  assert.equal(handle({ username: null, display_name: 'Craig Ataide' }), 'Craig Ataide');
});

test('handle never renders an empty label', () => {
  assert.equal(handle({ username: null, display_name: '   ' }), 'Someone');
  assert.equal(handle(null), 'Someone');
  assert.equal(handle(undefined), 'Someone');
});

test('initial comes from the username when there is one', () => {
  assert.equal(initial({ username: 'craig', display_name: 'Zoe' }), 'C');
  assert.equal(initial({ username: null, display_name: 'zoe' }), 'Z');
  assert.equal(initial(null), '?');
});

test('username format: accepts ordinary handles', () => {
  for (const ok of ['craig', 'Craig_99', 'a_b', 'x'.repeat(20)]) {
    assert.ok(USERNAME.test(ok), ok);
  }
});

test('username format: rejects the awkward ones', () => {
  for (const bad of [
    'ab', // too short
    'x'.repeat(21), // too long
    '9craig', // must start with a letter
    '_craig', // must start with a letter
    'cr aig', // no spaces
    'craig!', // no punctuation
    'craig-99', // no hyphens
    '', // empty
  ]) {
    assert.ok(!USERNAME.test(bad), bad);
  }
});
