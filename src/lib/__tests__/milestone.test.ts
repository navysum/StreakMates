import assert from 'node:assert/strict';
import { test } from 'node:test';
import { milestoneLabel, reachedMilestone } from '../milestone.ts';
import { MILESTONES } from '../../theme/palette.ts';

test('milestone: fires on the day the run reaches one', () => {
  assert.equal(reachedMilestone(6, 7), true);
  assert.equal(reachedMilestone(13, 14), true);
  assert.equal(reachedMilestone(29, 30), true);
});

test('milestone: says nothing on an ordinary day', () => {
  assert.equal(reachedMilestone(7, 8), false);
  assert.equal(reachedMilestone(0, 1), false);
  assert.equal(reachedMilestone(30, 31), false);
});

test('milestone: a streak already past one does not re-announce it', () => {
  // The screen recomputes on every render; without this it would celebrate
  // a seven-day streak every time you opened the app.
  assert.equal(reachedMilestone(7, 7), false);
  assert.equal(reachedMilestone(30, 30), false);
});

test('milestone: unchecking never celebrates', () => {
  assert.equal(reachedMilestone(7, 6), false);
  assert.equal(reachedMilestone(30, 0), false);
  assert.equal(reachedMilestone(1, 0), false);
});

test('milestone: every listed milestone is reachable', () => {
  for (const m of MILESTONES) {
    assert.equal(reachedMilestone(m - 1, m), true, `${m} did not fire`);
  }
});

test('milestone: a jump past a milestone still counts only on the exact day', () => {
  // Backfilling several days at once can move a streak from 5 to 9. That is
  // not the moment the week was earned, and claiming it would be a lie the
  // person can check against their own history.
  assert.equal(reachedMilestone(5, 9), false);
});

test('milestone: the wording is human at every listed value', () => {
  assert.equal(milestoneLabel(7), 'A week');
  assert.equal(milestoneLabel(30), 'A month');
  assert.equal(milestoneLabel(365), 'A year');
  for (const m of MILESTONES) {
    assert.ok(milestoneLabel(m).length > 0);
    assert.ok(!/^\d+ days$/.test(milestoneLabel(m)), `${m} fell through to the default`);
  }
});
