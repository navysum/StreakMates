import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDays, isoWeekday, startOfWeek, toLocalDate } from '../date.ts';
import { computeStreak, describeProgress, weeklyProgress, type Schedule } from '../streak.ts';

const daily: Schedule = { cadence: 'daily', targetDays: [], targetPerWeek: 1 };
// Monday, Wednesday, Friday
const mwf: Schedule = { cadence: 'days', targetDays: [1, 3, 5], targetPerWeek: 1 };
const weekly: Schedule = { cadence: 'weekly', targetDays: [], targetPerWeek: 3 };

// 2026-09-03 is a Thursday.
const THU = '2026-09-03';

test('dates: local date round-trips without drifting through UTC', () => {
  assert.equal(toLocalDate(new Date(2026, 8, 3)), '2026-09-03');
  assert.equal(addDays('2026-09-03', -3), '2026-08-31');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29'); // leap year
});

test('dates: ISO weekday is Monday-based', () => {
  assert.equal(isoWeekday('2026-09-03'), 4); // Thursday
  assert.equal(isoWeekday('2026-09-06'), 7); // Sunday
  assert.equal(startOfWeek(THU), '2026-08-31'); // the Monday
});

test('daily: counts back from today when today is done', () => {
  const done = ['2026-09-03', '2026-09-02', '2026-09-01'];
  assert.equal(computeStreak(daily, done, THU), 3);
});

test('daily: today still undone does not break the streak', () => {
  const done = ['2026-09-02', '2026-09-01'];
  assert.equal(computeStreak(daily, done, THU), 2);
});

test('daily: a missing day ends the streak', () => {
  const done = ['2026-09-03', '2026-09-01', '2026-08-31'];
  assert.equal(computeStreak(daily, done, THU), 1);
});

test('daily: nothing logged is a zero streak, not a crash', () => {
  assert.equal(computeStreak(daily, [], THU), 0);
});

test('daily: a gap of two days from today is broken', () => {
  assert.equal(computeStreak(daily, ['2026-09-01'], THU), 0);
});

test('days: unscheduled days are skipped, not counted as misses', () => {
  // Fri 28th, Mon 31st, Wed 2nd done. Thursday is not scheduled.
  const done = ['2026-09-02', '2026-08-31', '2026-08-28'];
  assert.equal(computeStreak(mwf, done, THU), 3);
});

test('days: a missed scheduled day still ends the streak', () => {
  // Wednesday done, Monday missed.
  const done = ['2026-09-02', '2026-08-28'];
  assert.equal(computeStreak(mwf, done, THU), 1);
});

test('weekly: has no day streak, and reports progress instead', () => {
  const done = ['2026-08-31', '2026-09-02', '2026-09-03'];
  assert.equal(computeStreak(weekly, done, THU), 0);
  assert.deepEqual(weeklyProgress(weekly, done, THU), { done: 3, target: 3 });
});

test('weekly: only the current week counts', () => {
  // 2026-08-30 is the Sunday before this week's Monday.
  const done = ['2026-08-30', '2026-09-01'];
  assert.deepEqual(weeklyProgress(weekly, done, THU), { done: 1, target: 3 });
});

test('describeProgress: wording matches the state', () => {
  assert.equal(describeProgress(daily, ['2026-09-03', '2026-09-02'], THU), '2 DAY STREAK');
  assert.equal(describeProgress(daily, [], THU), 'NO STREAK YET');
  assert.equal(describeProgress(daily, ['2026-08-20'], THU), 'STREAK BROKEN');
  assert.equal(describeProgress(weekly, ['2026-09-01'], THU), '1 OF 3 THIS WEEK');
});
