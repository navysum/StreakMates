import { addDays, isoWeekday, startOfWeek, toLocalDate } from './date.ts';

export type Cadence = 'daily' | 'days' | 'weekly';

export type Schedule = {
  cadence: Cadence;
  /** ISO weekdays (1 = Monday) for cadence 'days'. */
  targetDays: number[];
  /** Times per week for cadence 'weekly'. */
  targetPerWeek: number;
};

/** Is `iso` a day this habit is meant to be done? Weekly habits have no fixed days. */
export function isScheduled(schedule: Schedule, iso: string): boolean {
  if (schedule.cadence === 'daily') return true;
  if (schedule.cadence === 'days') return schedule.targetDays.includes(isoWeekday(iso));
  return true;
}

/**
 * Consecutive scheduled days completed, counting back from today.
 *
 * Today not being done yet doesn't break a streak — you might do it later —
 * so counting starts at today when it's complete and yesterday otherwise.
 * Days the habit isn't scheduled for are skipped rather than breaking it.
 *
 * Weekly-target habits have no per-day expectation, so they get 0 here and
 * report progress through `weeklyProgress` instead.
 */
export function computeStreak(
  schedule: Schedule,
  completedDates: Iterable<string>,
  today: string = toLocalDate(),
): number {
  if (schedule.cadence === 'weekly') return 0;

  const done = completedDates instanceof Set ? completedDates : new Set(completedDates);
  if (done.size === 0) return 0;

  let cursor = done.has(today) ? today : addDays(today, -1);
  let streak = 0;

  // A year and a bit of slack — far past any real streak, and bounded so a
  // corrupt date can't spin forever.
  for (let guard = 0; guard < 400; guard++) {
    if (!isScheduled(schedule, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (!done.has(cursor)) break;
    streak++;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

/** Completions inside the current week (Monday-based), against the target. */
export function weeklyProgress(
  schedule: Schedule,
  completedDates: Iterable<string>,
  today: string = toLocalDate(),
): { done: number; target: number } {
  const done = completedDates instanceof Set ? completedDates : new Set(completedDates);
  const monday = startOfWeek(today);

  let count = 0;
  for (let i = 0; i < 7; i++) {
    if (done.has(addDays(monday, i))) count++;
  }

  const target =
    schedule.cadence === 'weekly'
      ? schedule.targetPerWeek
      : schedule.cadence === 'days'
        ? schedule.targetDays.length
        : 7;

  return { done: count, target };
}

/** Short line under a habit name: streak, or weekly progress for weekly habits. */
export function describeProgress(
  schedule: Schedule,
  completedDates: Iterable<string>,
  today: string = toLocalDate(),
): string {
  if (schedule.cadence === 'weekly') {
    const { done, target } = weeklyProgress(schedule, completedDates, today);
    return `${done} OF ${target} THIS WEEK`;
  }

  const streak = computeStreak(schedule, completedDates, today);
  if (streak > 0) return `${streak} DAY STREAK`;

  const done = completedDates instanceof Set ? completedDates : new Set(completedDates);
  const yesterday = addDays(today, -1);
  if (done.size > 0 && !done.has(yesterday) && !done.has(today)) return 'STREAK BROKEN';
  return 'NO STREAK YET';
}

/**
 * The longest run of scheduled days ever kept, not just the current one.
 *
 * Unscheduled days are skipped rather than breaking a run, exactly as
 * `computeStreak` treats them; a scheduled day that was missed resets it.
 * Days before the first check-in are not counted against anyone.
 */
export function bestStreak(
  schedule: Schedule,
  completedDates: Iterable<string>,
  today: string = toLocalDate(),
): number {
  if (schedule.cadence === 'weekly') return 0;

  const done = completedDates instanceof Set ? completedDates : new Set(completedDates);
  if (done.size === 0) return 0;

  const first = [...done].sort()[0];

  let best = 0;
  let run = 0;
  let cursor = first;

  for (let guard = 0; guard < 4000 && cursor <= today; guard++) {
    if (isScheduled(schedule, cursor)) {
      if (done.has(cursor)) {
        run++;
        if (run > best) best = run;
      } else if (cursor !== today) {
        // Today being blank is not yet a miss — it might still be done.
        run = 0;
      }
    }
    cursor = addDays(cursor, 1);
  }

  return best;
}
