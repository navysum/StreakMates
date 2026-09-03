import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  reminderFor,
  reminderKey,
  remindersFor,
  toSchedulerWeekday,
} from '../reminders-pure.ts';
import type { Habit } from '../types.ts';

const habit = (over: Partial<Habit> = {}): Habit => ({
  id: 'h1',
  owner_id: 'u1',
  group_id: null,
  title: 'Morning run',
  emoji: null,
  color: 'green',
  cadence: 'daily',
  target_days: [],
  target_per_week: 3,
  reminder_at: '07:00:00',
  sort_order: 0,
  created_at: '2026-01-01T00:00:00Z',
  archived_at: null,
  ...over,
});

test('a habit with no reminder time has no reminder', () => {
  assert.equal(reminderFor(habit({ reminder_at: null })), null);
});

test('an archived habit stops reminding', () => {
  assert.equal(reminderFor(habit({ archived_at: '2026-02-01T00:00:00Z' })), null);
});

test('a daily habit reminds every day', () => {
  const r = reminderFor(habit())!;
  assert.equal(r.at, '07:00');
  assert.deepEqual(r.weekdays, []);
});

test('a days-of-week habit only reminds on its days', () => {
  const r = reminderFor(habit({ cadence: 'days', target_days: [1, 3, 5] }))!;
  assert.deepEqual(r.weekdays, [1, 3, 5]);
});

test('a weekly habit reminds daily, since it has no fixed days', () => {
  const r = reminderFor(habit({ cadence: 'weekly', target_days: [] }))!;
  assert.deepEqual(r.weekdays, []);
});

test('the emoji rides along in the title when there is one', () => {
  assert.equal(reminderFor(habit({ emoji: '🏃' }))!.title, '🏃 Morning run');
  assert.equal(reminderFor(habit())!.title, 'Morning run');
});

test('a malformed time is dropped rather than scheduled wrongly', () => {
  assert.equal(reminderFor(habit({ reminder_at: 'not a time' })), null);
});

test('times are normalised so the key is stable', () => {
  assert.equal(reminderFor(habit({ reminder_at: '7:5:00' }))!.at, '07:05');
});

test('keys separate the same habit on different days and times', () => {
  const r = reminderFor(habit())!;
  assert.notEqual(reminderKey(r, 1), reminderKey(r, 3));
  assert.notEqual(reminderKey(r, null), reminderKey(r, 1));
  // Same inputs must give the same key, or every sync reschedules everything.
  assert.equal(reminderKey(r, 1), reminderKey(reminderFor(habit())!, 1));
});

test('only habits with reminders are scheduled', () => {
  const list = remindersFor([
    habit({ id: 'a' }),
    habit({ id: 'b', reminder_at: null }),
    habit({ id: 'c', archived_at: '2026-02-01T00:00:00Z' }),
  ]);
  assert.deepEqual(
    list.map((r) => r.habitId),
    ['a'],
  );
});

test('weekday numbering is translated for the scheduler', () => {
  // ISO Monday is 1; the scheduler calls Sunday 1 and Monday 2.
  assert.equal(toSchedulerWeekday(1), 2);
  assert.equal(toSchedulerWeekday(7), 1); // Sunday
  assert.equal(toSchedulerWeekday(6), 7); // Saturday
});
