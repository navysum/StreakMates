import { MILESTONES } from '../theme/palette.ts';

/**
 * Did this check-in just reach something worth saying out loud?
 *
 * The brand reserves the gradient for "major accomplishments", and until now
 * nothing in the app produced one — `MILESTONES` and `isMilestone` were
 * written into the palette and never called. The streak spectrum already
 * changes colour as a run grows, which is a quiet signal; this is the loud
 * one, and it fires at most a handful of times a year per habit.
 *
 * Deliberately narrow. It is true only on the *transition*: checking in on day
 * seven of a run announces the week, and every later visit to a seven-day
 * streak says nothing. Otherwise it stops being a moment and becomes a badge.
 *
 * `before` and `after` are the streak either side of the tap, so unchecking
 * something can never celebrate — `after` is smaller, and the guard below
 * refuses anything that did not grow.
 */
export function reachedMilestone(before: number, after: number): boolean {
  if (after <= before) return false;
  return (MILESTONES as readonly number[]).includes(after);
}

/** How a reached milestone reads. Kept here so the wording has one home. */
export function milestoneLabel(days: number): string {
  if (days === 7) return 'A week';
  if (days === 14) return 'Two weeks';
  if (days === 30) return 'A month';
  if (days === 50) return 'Fifty days';
  if (days === 100) return 'One hundred days';
  if (days === 200) return 'Two hundred days';
  if (days === 365) return 'A year';
  return `${days} days`;
}
