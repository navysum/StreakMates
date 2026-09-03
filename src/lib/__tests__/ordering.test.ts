import assert from 'node:assert/strict';
import { test } from 'node:test';
import { positionsFor, reorder, sortHabits, type Positions } from '../ordering.ts';
import type { Habit } from '../types.ts';

const habit = (id: string, created: string): Habit => ({
  id,
  owner_id: 'u',
  group_id: null,
  title: id,
  emoji: null,
  color: 'green',
  cadence: 'daily',
  target_days: [],
  target_per_week: 1,
  reminder_at: null,
  sort_order: 0,
  created_at: created,
  archived_at: null,
});

const a = habit('a', '2026-01-01T00:00:00Z');
const b = habit('b', '2026-01-02T00:00:00Z');
const c = habit('c', '2026-01-03T00:00:00Z');

const at = (entries: [string, number][]): Positions => new Map(entries);

test('stored positions decide the order', () => {
  const sorted = sortHabits([a, b, c], at([['c', 0], ['a', 1], ['b', 2]]));
  assert.deepEqual(sorted.map((h) => h.id), ['c', 'a', 'b']);
});

test('habits you have never arranged go last, oldest first', () => {
  const sorted = sortHabits([c, a, b], at([['c', 0]]));
  assert.deepEqual(sorted.map((h) => h.id), ['c', 'a', 'b']);
});

test('with nothing stored, creation order wins', () => {
  const sorted = sortHabits([c, b, a], at([]));
  assert.deepEqual(sorted.map((h) => h.id), ['a', 'b', 'c']);
});

test('sorting does not mutate the input', () => {
  const input = [c, a, b];
  sortHabits(input, at([['a', 0]]));
  assert.deepEqual(input.map((h) => h.id), ['c', 'a', 'b']);
});

test('moving up and down does what it says', () => {
  assert.deepEqual(reorder(['a', 'b', 'c'], 2, 0), ['c', 'a', 'b']);
  assert.deepEqual(reorder(['a', 'b', 'c'], 0, 2), ['b', 'c', 'a']);
  assert.deepEqual(reorder(['a', 'b', 'c'], 1, 0), ['b', 'a', 'c']);
});

test('a move that goes nowhere leaves the list alone', () => {
  const ids = ['a', 'b', 'c'];
  assert.deepEqual(reorder(ids, 1, 1), ids);
  assert.deepEqual(reorder(ids, 0, -1), ids);
  assert.deepEqual(reorder(ids, 0, 9), ids);
});

test('each list is numbered from zero, so lists do not share a sequence', () => {
  assert.deepEqual(positionsFor(['x', 'y']), [
    { habit_id: 'x', position: 0 },
    { habit_id: 'y', position: 1 },
  ]);
});
