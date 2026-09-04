import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  emailProblem,
  nameProblem,
  normaliseEmail,
  passwordProblem,
  MAX_PASSWORD,
} from '../credentials.ts';

test('an ordinary address is accepted', () => {
  assert.equal(emailProblem('craig@example.com'), null);
  assert.equal(emailProblem('  craig+habits@sub.example.co.uk  '), null);
});

test('an empty or malformed address is refused with a reason', () => {
  assert.match(emailProblem('')!, /Enter your email/);
  assert.match(emailProblem('craig')!, /email address/);
  assert.match(emailProblem('craig@example')!, /email address/);
  assert.match(emailProblem('a b@example.com')!, /email address/);
});

test('addresses are lower-cased and trimmed for sending', () => {
  assert.equal(normaliseEmail('  Craig@Example.COM '), 'craig@example.com');
});

test('a password of at least eight characters is accepted', () => {
  assert.equal(passwordProblem('correct-horse'), null);
  assert.equal(passwordProblem('abcdefgh'), null);
});

test('a short password is refused', () => {
  assert.match(passwordProblem('abc')!, /at least 8/);
  assert.match(passwordProblem('')!, /Enter a password/);
});

test('a password bcrypt would silently truncate is refused, not cut', () => {
  const ok = 'a'.repeat(MAX_PASSWORD);
  assert.equal(passwordProblem(ok), null);
  assert.match(passwordProblem('a'.repeat(MAX_PASSWORD + 1))!, /too long/);
});

test('length is counted in bytes, because that is what bcrypt counts', () => {
  // 20 four-byte emoji is 80 bytes, over the limit, despite being 40 UTF-16
  // units and 20 characters.
  const emoji = '🔥'.repeat(20);
  assert.ok(emoji.length < MAX_PASSWORD, 'string length alone would pass');
  assert.match(passwordProblem(emoji)!, /too long/);
});

test('the obvious guesses are refused whatever their length', () => {
  assert.match(passwordProblem('password123')!, /anyone would guess/);
  assert.match(passwordProblem('PASSWORD123')!, /anyone would guess/);
  assert.match(passwordProblem('streakmates')!, /anyone would guess/);
});

test('a password of only spaces is refused', () => {
  assert.match(passwordProblem('         ')!, /only spaces/);
});

test('a name is required and bounded to what the column holds', () => {
  assert.equal(nameProblem('Craig'), null);
  assert.match(nameProblem('   ')!, /Enter the name/);
  assert.match(nameProblem('x'.repeat(61))!, /under 60/);
  assert.equal(nameProblem('x'.repeat(60)), null);
});
