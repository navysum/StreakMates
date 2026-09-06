import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatDayLabel, formatWeekOf, isoWeek } from '../date.ts';

test('iso week: 4 January is always in week 1', () => {
  assert.equal(isoWeek('2026-01-04'), 1);
  assert.equal(isoWeek('2025-01-04'), 1);
});

test('iso week: a year starting on Thursday puts 1 January in week 1', () => {
  // 2026-01-01 is a Thursday, so that week holds the year's first Thursday.
  assert.equal(isoWeek('2026-01-01'), 1);
});

test('iso week: a year starting on Friday puts 1 January in the previous year’s last week', () => {
  // 2027-01-01 is a Friday: its week's Thursday falls in 2026, so it is week 53.
  assert.equal(isoWeek('2027-01-01'), 53);
});

test('iso week: the whole of one week carries the same number', () => {
  const monday = '2026-08-31';
  const sunday = '2026-09-06';
  assert.equal(isoWeek(monday), isoWeek(sunday));
});

test('iso week: consecutive weeks step by one', () => {
  assert.equal(isoWeek('2026-09-07') - isoWeek('2026-09-06'), 1);
});

test('day label: weekday, zero-padded day, month and week number', () => {
  assert.equal(formatDayLabel('2026-09-06'), `Sun 06 Sep · Week ${isoWeek('2026-09-06')}`);
});

test('week of: names the Monday the week started on, whatever day you ask from', () => {
  assert.equal(formatWeekOf('2026-09-06'), 'Week of 31 Aug');
  assert.equal(formatWeekOf('2026-08-31'), 'Week of 31 Aug');
});
