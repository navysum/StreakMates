import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  aggregateCells,
  cellState,
  gridCells,
  weekCells,
  weekDoneCount,
  weekOf,
  weekRamp,
} from '../week.ts';
import type { Schedule } from '../streak.ts';

const daily: Schedule = { cadence: 'daily', targetDays: [], targetPerWeek: 7 };
const weekdays: Schedule = { cadence: 'days', targetDays: [1, 2, 3, 4, 5], targetPerWeek: 5 };
const flexible: Schedule = { cadence: 'weekly', targetDays: [], targetPerWeek: 4 };

// 2026-09-04 is a Friday, so its week runs Mon 31 Aug to Sun 6 Sep.
const TODAY = '2026-09-04';

test('weekOf starts on Monday and runs seven days', () => {
  assert.deepEqual(weekOf(TODAY), [
    '2026-08-31',
    '2026-09-01',
    '2026-09-02',
    '2026-09-03',
    '2026-09-04',
    '2026-09-05',
    '2026-09-06',
  ]);
  // Asking on the Monday itself gives the same week, not the one before.
  assert.deepEqual(weekOf('2026-08-31'), weekOf(TODAY));
});

test('a done day reads as done whatever the schedule says', () => {
  const done = new Set(['2026-09-05']); // a Saturday, outside the target days
  assert.equal(cellState('2026-09-05', done, weekdays, TODAY), 'done');
});

test('today is its own state until it is done', () => {
  assert.equal(cellState(TODAY, new Set(), daily, TODAY), 'today');
  assert.equal(cellState(TODAY, new Set([TODAY]), daily, TODAY), 'done');
});

test('today reads as off when nothing is owed today', () => {
  // Saturday, on a weekdays-only habit.
  assert.equal(cellState('2026-09-05', new Set(), weekdays, '2026-09-05'), 'off');
});

test('the future is never missed', () => {
  assert.equal(cellState('2026-09-06', new Set(), daily, TODAY), 'off');
});

test('a past day that was owed and not done is missed', () => {
  assert.equal(cellState('2026-09-03', new Set(), daily, TODAY), 'missed');
});

test('a past day that was never owed is off, not missed', () => {
  // 2026-08-30 is a Sunday: not a target day, so nothing was owed.
  assert.equal(cellState('2026-08-30', new Set(), weekdays, TODAY), 'off');
});

test('a flexible habit owes every day, so a blank past day still shows', () => {
  // 'weekly' has no fixed days, and isScheduled treats every day as eligible.
  assert.equal(cellState('2026-09-03', new Set(), flexible, TODAY), 'missed');
});

test('weekCells covers the whole week in order', () => {
  const cells = weekCells(TODAY, new Set(['2026-08-31', '2026-09-01']), daily, TODAY);
  assert.equal(cells.length, 7);
  assert.deepEqual(
    cells.map((c) => c.state),
    ['done', 'done', 'missed', 'missed', 'today', 'off', 'off'],
  );
});

test('gridCells is oldest week first and ends on this week', () => {
  const grid = gridCells(3, new Set(), daily, TODAY);
  assert.equal(grid.length, 3);
  assert.equal(grid[0][0].date, '2026-08-17');
  assert.equal(grid[2][0].date, '2026-08-31');
  assert.ok(grid[2].some((c) => c.date === TODAY));
});

test('ramp is 0 when nothing was done', () => {
  assert.equal(weekRamp(weekCells(TODAY, new Set(), daily, TODAY)), 0);
});

test('ramp reaches 4 only on a fully kept week', () => {
  const week = weekOf('2026-08-24'); // a fully past week
  const all = weekRamp(weekCells('2026-08-24', new Set(week), daily, TODAY));
  assert.equal(all, 4);

  const half = weekRamp(weekCells('2026-08-24', new Set(week.slice(0, 3)), daily, TODAY));
  assert.ok(half > 0 && half < 4, `expected a middle bucket, got ${half}`);
});

test('a week that owed nothing but got something still reads as full', () => {
  // Every cell 'off' (all future), but one done — no denominator to divide by.
  const cells = [
    { date: '2027-01-04', state: 'done' as const },
    { date: '2027-01-05', state: 'off' as const },
  ];
  assert.equal(weekRamp(cells), 4);
});

test('weekDoneCount counts only that week', () => {
  const done = new Set(['2026-08-31', '2026-09-04', '2026-08-24']);
  assert.equal(weekDoneCount(TODAY, done), 2);
});

const H = (id: string, schedule: Schedule) => ({ id, schedule });

test('aggregate: a day is done only when everything owed is done', () => {
  const habits = [H('a', daily), H('b', daily)];
  const partial = (id: string, day: string) => id === 'a' && day === '2026-09-01';
  const cells = aggregateCells(TODAY, habits, partial, TODAY);
  assert.equal(cells[1].state, 'missed'); // Tuesday: one of two
});

test('aggregate: everything owed and done reads as done', () => {
  const habits = [H('a', daily), H('b', daily)];
  // Both habits kept on Monday and Tuesday, neither after.
  const cells = aggregateCells(TODAY, habits, (_id, day) => day <= '2026-09-01', TODAY);
  assert.deepEqual(
    cells.map((c) => c.state),
    ['done', 'done', 'missed', 'missed', 'today', 'off', 'off'],
  );
});

test('aggregate: a partly-done today is still today, never missed', () => {
  const habits = [H('a', daily), H('b', daily)];
  const cells = aggregateCells(TODAY, habits, (id) => id === 'a', TODAY);
  assert.equal(cells[4].state, 'today');
});

test('aggregate: a day nothing was owed on cannot be failed', () => {
  // Sunday, with only weekday habits.
  const cells = aggregateCells('2026-08-24', [H('a', weekdays)], () => false, TODAY);
  assert.equal(cells[6].state, 'off');
  assert.equal(cells[0].state, 'missed');
});

test('aggregate: a group with no shared habits shows an empty week, not a failed one', () => {
  const cells = aggregateCells(TODAY, [], () => false, TODAY);
  assert.ok(cells.every((c) => c.state === 'off'));
});

test('aggregate: the future is never missed', () => {
  const cells = aggregateCells(TODAY, [H('a', daily)], () => false, TODAY);
  assert.equal(cells[5].state, 'off');
  assert.equal(cells[6].state, 'off');
});
