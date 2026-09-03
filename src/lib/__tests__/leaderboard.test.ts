import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  expectedCount,
  expectedDays,
  groupRate,
  groupStreak,
  habitRates,
  mostImproved,
  percent,
  perfectDays,
  standings,
  windowDays,
  type ScoredHabit,
  type ScoredMember,
} from '../leaderboard.ts';

// 2026-09-03 is a Thursday; the Monday of that week is 2026-08-31.
const TODAY = '2026-09-03';
const WEEK = windowDays(7, TODAY); // Thu back to the previous Fri

const daily = (over: Partial<ScoredHabit> = {}): ScoredHabit => ({
  id: 'h-daily',
  title: 'Run',
  emoji: null,
  cadence: 'daily',
  targetDays: [],
  targetPerWeek: 1,
  createdOn: '2026-01-01',
  archivedOn: null,
  ...over,
});

const mwf = (over: Partial<ScoredHabit> = {}): ScoredHabit =>
  daily({ id: 'h-mwf', cadence: 'days', targetDays: [1, 3, 5], ...over });

const weekly = (over: Partial<ScoredHabit> = {}): ScoredHabit =>
  daily({ id: 'h-weekly', cadence: 'weekly', targetPerWeek: 3, ...over });

const member = (userId: string, joinedOn = '2026-01-01'): ScoredMember => ({ userId, joinedOn });

const ticks = (...entries: [string, string, string][]) =>
  new Set(entries.map(([h, u, d]) => `${h}|${u}|${d}`));

// ---------------------------------------------------------------- expected

test('a daily habit is owed every day of the window', () => {
  assert.equal(expectedCount(daily(), member('a'), WEEK), 7);
});

test('a days-of-week habit is only owed on its days', () => {
  const owed = expectedDays(mwf(), member('a'), WEEK);
  assert.deepEqual(owed, ['2026-09-02', '2026-08-31', '2026-08-28']); // Wed, Mon, Fri
});

test('nothing is owed before the member joined', () => {
  // Joined Wednesday: Thursday and Wednesday only.
  assert.equal(expectedCount(daily(), member('a', '2026-09-02'), WEEK), 2);
});

test('joining late does not look like failing all week', () => {
  const rows = standings([daily()], [member('a'), member('b', TODAY)], ticks(), WEEK);
  const late = rows.find((r) => r.userId === 'b')!;
  assert.equal(late.expected, 1);
  assert.notEqual(late.expected, 7);
});

test('nothing is owed before the habit existed, or after it was archived', () => {
  assert.equal(expectedCount(daily({ createdOn: '2026-09-02' }), member('a'), WEEK), 2);
  assert.equal(expectedCount(daily({ archivedOn: '2026-09-02' }), member('a'), WEEK), 5);
});

test('a weekly target scales to the part of the week someone was eligible for', () => {
  assert.equal(expectedCount(weekly(), member('a'), WEEK), 3);
  // Eligible for three days of seven: ceil(3 * 3/7) = 2, not the full 3.
  assert.equal(expectedCount(weekly(), member('a', '2026-09-01'), WEEK), 2);
});

// ---------------------------------------------------------------- ranking

test('consistency is ranked, not volume', () => {
  // 'veteran' has been here all week and missed three days.
  // 'newcomer' joined on Tuesday and has not missed one.
  const done = ticks(
    ...WEEK.slice(0, 4).map((d) => ['h-daily', 'veteran', d] as [string, string, string]),
    ['h-daily', 'newcomer', TODAY],
    ['h-daily', 'newcomer', '2026-09-02'],
    ['h-daily', 'newcomer', '2026-09-01'],
  );

  const rows = standings([daily()], [member('veteran'), member('newcomer', '2026-09-01')], done, WEEK);

  const veteran = rows.find((r) => r.userId === 'veteran')!;
  const newcomer = rows.find((r) => r.userId === 'newcomer')!;

  // Counting check-ins would have put the veteran first.
  assert.ok(veteran.completed > newcomer.completed);
  // Counting consistency does not.
  assert.equal(rows[0].userId, 'newcomer');
  assert.equal(newcomer.rate, 1);
  assert.ok(veteran.rate! < 1);
});

test('someone owed nothing is ranked at neither end', () => {
  // The habit did not exist on the day in the window, so nobody was owed it.
  const rows = standings([daily({ createdOn: TODAY })], [member('a'), member('b')], ticks(), [
    '2026-08-28',
  ]);
  assert.deepEqual(
    rows.map((r) => r.rate),
    [null, null],
  );
  assert.equal(groupRate(rows), null);
});

test('members owed nothing sort last, not first', () => {
  // The window is a day before 'newcomer' existed here, so nothing was owed of
  // them — which must not read as a perfect score or a zero.
  const done = ticks(['h-daily', 'a', '2026-08-28']);
  const rows = standings([daily()], [member('newcomer', TODAY), member('a')], done, ['2026-08-28']);
  assert.equal(rows[0].userId, 'a');
  assert.equal(rows[1].rate, null);
});

test('unscheduled extras do not out-earn scheduled days', () => {
  // Ticking Tuesday on a Mon/Wed/Fri habit should not raise the rate.
  const done = ticks(['h-mwf', 'a', '2026-09-01']);
  const [row] = standings([mwf()], [member('a')], done, WEEK);
  assert.equal(row.completed, 0);
});

// ---------------------------------------------------------------- habits

test('habit rates rank the group, strongest first', () => {
  const strong = daily({ id: 'strong' });
  const weak = daily({ id: 'weak' });
  const done = ticks(
    ...WEEK.map((d) => ['strong', 'a', d] as [string, string, string]),
    ['weak', 'a', TODAY],
  );
  const rows = habitRates([weak, strong], [member('a')], done, WEEK);
  assert.equal(rows[0].habit.id, 'strong');
  assert.equal(rows[0].rate, 1);
  assert.ok(rows[1].rate! < 0.2);
});

// ---------------------------------------------------------------- extras

test('most improved is the biggest rise, and ignores anyone who fell', () => {
  const now = [
    { userId: 'up', completed: 6, expected: 7, rate: 6 / 7 },
    { userId: 'down', completed: 1, expected: 7, rate: 1 / 7 },
  ];
  const before = [
    { userId: 'up', completed: 1, expected: 7, rate: 1 / 7 },
    { userId: 'down', completed: 7, expected: 7, rate: 1 },
  ];
  assert.equal(mostImproved(now, before)!.userId, 'up');
});

test('most improved is null when nobody rose', () => {
  const now = [{ userId: 'a', completed: 1, expected: 7, rate: 1 / 7 }];
  const before = [{ userId: 'a', completed: 7, expected: 7, rate: 1 }];
  assert.equal(mostImproved(now, before), null);
});

test('the group streak needs everyone, every day', () => {
  const habits = [daily()];
  const both = [member('a'), member('b')];

  const everyone = ticks(
    ['h-daily', 'a', TODAY],
    ['h-daily', 'b', TODAY],
    ['h-daily', 'a', '2026-09-02'],
    ['h-daily', 'b', '2026-09-02'],
  );
  assert.equal(groupStreak(habits, both, everyone, TODAY), 2);

  // One person missing yesterday ends it, however well the other did.
  const oneShort = ticks(
    ['h-daily', 'a', TODAY],
    ['h-daily', 'b', TODAY],
    ['h-daily', 'a', '2026-09-02'],
  );
  assert.equal(groupStreak(habits, both, oneShort, TODAY), 1);
});

test('today still being open does not break the group streak', () => {
  const habits = [daily()];
  const both = [member('a'), member('b')];
  const yesterdayOnly = ticks(['h-daily', 'a', '2026-09-02'], ['h-daily', 'b', '2026-09-02']);
  assert.equal(groupStreak(habits, both, yesterdayOnly, TODAY), 1);
});

test('an empty group has no streak rather than an infinite one', () => {
  assert.equal(groupStreak([], [member('a')], ticks(), TODAY), 0);
  assert.equal(groupStreak([daily()], [], ticks(), TODAY), 0);
});

test('a perfect day needs everything owed, from everyone', () => {
  const habits = [daily({ id: 'h1' }), daily({ id: 'h2' })];
  const both = [member('a'), member('b')];
  const all = ticks(
    ['h1', 'a', TODAY],
    ['h2', 'a', TODAY],
    ['h1', 'b', TODAY],
    ['h2', 'b', TODAY],
  );
  assert.equal(perfectDays(habits, both, all, [TODAY]), 1);

  const missingOne = ticks(['h1', 'a', TODAY], ['h2', 'a', TODAY], ['h1', 'b', TODAY]);
  assert.equal(perfectDays(habits, both, missingOne, [TODAY]), 0);
});

test('a day nothing was owed is empty, not perfect', () => {
  // Thursday is not a Mon/Wed/Fri day.
  assert.equal(perfectDays([mwf()], [member('a')], ticks(), [TODAY]), 0);
});

test('percent renders a missing rate as a dash, not zero', () => {
  assert.equal(percent(null), '—');
  assert.equal(percent(0), '0%');
  assert.equal(percent(0.856), '86%');
  assert.equal(percent(1), '100%');
});

test('the window runs backwards from today', () => {
  assert.deepEqual(windowDays(3, TODAY), ['2026-09-03', '2026-09-02', '2026-09-01']);
});
