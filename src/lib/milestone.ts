/**
 * The runs worth one quiet line: a week, a month, a hundred days, a year.
 *
 * These are the NavySum milestones, the same in every app. They used to be
 * seven, and denser in the middle; a line that arrives every fortnight stops
 * being a moment and becomes a notification.
 */
export const MILESTONES = [7, 30, 100, 365] as const;

/**
 * Did this check-in just reach something worth saying out loud?
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
  if (days === 30) return 'A month';
  if (days === 100) return 'A hundred days';
  if (days === 365) return 'A year';
  return `${days} days`;
}
