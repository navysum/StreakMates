import { addDays, startOfWeek } from './date.ts';
import { isScheduled, type Schedule } from './streak.ts';

/**
 * What one cell of a week strip is showing.
 *
 * `off` covers both "not scheduled" and "hasn't happened yet" — in both cases
 * nothing is owed, so nothing is missing. Keeping them one state is what stops
 * the strip from accusing you of missing tomorrow.
 */
export type CellState = 'done' | 'today' | 'missed' | 'off';

export type Cell = { date: string; state: CellState };

export function cellState(
  date: string,
  done: Set<string>,
  schedule: Schedule,
  today: string,
): CellState {
  if (done.has(date)) return 'done';
  if (date === today) return isScheduled(schedule, date) ? 'today' : 'off';
  if (date > today) return 'off';
  return isScheduled(schedule, date) ? 'missed' : 'off';
}

/** The seven days of `date`'s week, Monday first. */
export function weekOf(date: string): string[] {
  const monday = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function weekCells(
  date: string,
  done: Set<string>,
  schedule: Schedule,
  today: string,
): Cell[] {
  return weekOf(date).map((d) => ({ date: d, state: cellState(d, done, schedule, today) }));
}

/**
 * `weeks` whole weeks ending with the one containing `today`, oldest first,
 * as a flat list of cells. Rendered 7 rows deep it reads like a calendar.
 */
export function gridCells(
  weeks: number,
  done: Set<string>,
  schedule: Schedule,
  today: string,
): Cell[][] {
  const thisMonday = startOfWeek(today);
  return Array.from({ length: weeks }, (_, i) => {
    const monday = addDays(thisMonday, (i - (weeks - 1)) * 7);
    return weekCells(monday, done, schedule, today);
  });
}

/**
 * Bucket 0-4 for the heatmap ramp, over a whole week's worth of cells. A week
 * with nothing owed sits at 0 rather than reading as a failure.
 */
export function weekRamp(cells: Cell[]): number {
  const owed = cells.filter((c) => c.state !== 'off').length;
  const done = cells.filter((c) => c.state === 'done').length;
  if (done === 0) return 0;
  if (owed === 0) return 4;
  return Math.min(4, Math.max(1, Math.ceil((done / owed) * 4)));
}

/** Count of days done in `date`'s week. */
export function weekDoneCount(date: string, done: Set<string>): number {
  return weekOf(date).filter((d) => done.has(d)).length;
}

/**
 * One person's week across several habits at once, for the group board.
 *
 * A day is done only when everything owed that day was done — a half-kept day
 * is not a kept day. Today is never "missed" while it is still today, and a day
 * that owed nothing cannot be failed.
 *
 * Nothing is owed before it existed. A habit created on Thursday was not owed
 * on Monday, and a person who joined on Thursday was not in the group on
 * Monday — without `startsOn` and `from` a group made today opens on three
 * missed days for everybody in it, which is both untrue and a miserable first
 * screen. This is the same rule `leaderboard.ts` already applies; the board
 * used to disagree with the standings sitting underneath it.
 */
export function aggregateCells(
  date: string,
  habits: { id: string; schedule: Schedule; /** ISO date it was created. */ startsOn?: string }[],
  isDone: (habitId: string, day: string) => boolean,
  today: string,
  /** ISO date this person joined. Days before it are nobody's failure. */
  from?: string,
): Cell[] {
  return weekOf(date).map((day) => {
    if (day > today) return { date: day, state: 'off' as const };
    if (from && day < from) return { date: day, state: 'off' as const };

    const owed = habits.filter(
      (h) => isScheduled(h.schedule, day) && !(h.startsOn && day < h.startsOn),
    );
    if (owed.length === 0) return { date: day, state: 'off' as const };

    const kept = owed.filter((h) => isDone(h.id, day)).length;
    if (kept === owed.length) return { date: day, state: 'done' as const };
    return { date: day, state: day === today ? ('today' as const) : ('missed' as const) };
  });
}
