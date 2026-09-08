/**
 * Group standings, computed from check-in rows.
 *
 * Two rules shape all of this, and both come from the plan:
 *
 *  - **Rank consistency, not volume.** Counting check-ins would reward whoever
 *    tracks the most habits, so everything here is completed ÷ expected.
 *  - **Only shared habits count.** A private habit feeding a group percentage
 *    would leak it: watch a score move on a day someone logged nothing shared,
 *    and you have learned something they chose not to show you.
 */
import { addDays, isoWeekday, toLocalDate } from './date.ts';
import type { Cadence } from './streak.ts';

export type ScoredHabit = {
  id: string;
  title: string;
  emoji: string | null;
  cadence: Cadence;
  targetDays: number[];
  targetPerWeek: number;
  /** Local date the habit was created; nothing is expected before it. */
  createdOn: string;
  /** Local date it was archived, if it was; nothing is expected from then on. */
  archivedOn: string | null;
};

export type ScoredMember = {
  userId: string;
  /** Local date they joined; nothing is expected of them before it. */
  joinedOn: string;
};

/** `${habitId}|${userId}|${date}` — the index built by `checkInIndex`. */
export type DoneSet = Set<string>;

export type Row = {
  userId: string;
  completed: number;
  expected: number;
  /** completed ÷ expected, or null when nothing was expected of them. */
  rate: number | null;
};

export type HabitRow = {
  habit: ScoredHabit;
  completed: number;
  expected: number;
  rate: number | null;
};

const key = (habitId: string, userId: string, date: string) => `${habitId}|${userId}|${date}`;

/** The days in a window, most recent first. */
export function windowDays(days: number, today: string = toLocalDate()): string[] {
  return Array.from({ length: days }, (_, i) => addDays(today, -i));
}

/**
 * Which days this habit was actually owed by this member.
 *
 * Getting this right is what stops someone who joined on Friday appearing to
 * have failed all week — the commonest way a leaderboard becomes unfair.
 */
export function expectedDays(habit: ScoredHabit, member: ScoredMember, days: string[]): string[] {
  return days.filter((day) => {
    if (day < habit.createdOn) return false;
    if (habit.archivedOn && day >= habit.archivedOn) return false;
    if (day < member.joinedOn) return false;
    if (habit.cadence === 'days') return habit.targetDays.includes(isoWeekday(day));
    return true; // daily, and weekly's eligibility (its count is handled below)
  });
}

/**
 * How many completions this habit owed this member over the window.
 *
 * Weekly habits have no fixed days, so their target is scaled by how much of
 * the week the member was actually eligible for — a full target for someone
 * who joined on Friday would be a punishment for joining.
 */
export function expectedCount(habit: ScoredHabit, member: ScoredMember, days: string[]): number {
  const eligible = expectedDays(habit, member, days);
  if (habit.cadence !== 'weekly') return eligible.length;
  if (eligible.length === 0) return 0;
  const scaled = Math.ceil((habit.targetPerWeek * eligible.length) / 7);
  return Math.min(scaled, eligible.length);
}

function completedCount(
  habit: ScoredHabit,
  member: ScoredMember,
  days: string[],
  done: DoneSet,
): number {
  // Weekly habits count any day in the window; dated habits only count the
  // days they were owed, so an unscheduled extra is not worth more than a
  // scheduled one.
  const countable = habit.cadence === 'weekly' ? days : expectedDays(habit, member, days);
  const kept = countable.filter((day) => done.has(key(habit.id, member.userId, day))).length;

  // A weekly habit can be kept more often than it was owed, and before this
  // that produced rates above 100% — a gym habit at three a week, done most
  // days, showed as 106% on the leaderboard and dragged the group rate up with
  // it. Over a 30-day window it owes ceil(3 x 30 / 7) = 13 and can count 30,
  // so the ceiling was 231%.
  //
  // Doing more than you owed is 100%, not more: the board measures whether
  // people did what they signed up for, and letting one person's enthusiasm
  // score above the maximum makes every other number on the screen mean less.
  // A dated habit cannot exceed its own owed days, so this only binds weekly.
  if (habit.cadence !== 'weekly') return kept;
  return Math.min(kept, expectedCount(habit, member, days));
}

/** One row per member, best first. Members owed nothing are listed last. */
export function standings(
  habits: ScoredHabit[],
  members: ScoredMember[],
  done: DoneSet,
  days: string[],
): Row[] {
  const rows = members.map((member) => {
    let completed = 0;
    let expected = 0;
    for (const habit of habits) {
      completed += completedCount(habit, member, days, done);
      expected += expectedCount(habit, member, days);
    }
    return {
      userId: member.userId,
      completed,
      expected,
      // Nothing expected is not the same as nothing done: someone who joined
      // today belongs at neither end of the board.
      rate: expected === 0 ? null : completed / expected,
    };
  });

  return rows.sort((a, b) => {
    if (a.rate === null && b.rate === null) return 0;
    if (a.rate === null) return 1;
    if (b.rate === null) return -1;
    if (b.rate !== a.rate) return b.rate - a.rate;
    return b.completed - a.completed;
  });
}

/** Per-habit completion across the whole group. Best first. */
export function habitRates(
  habits: ScoredHabit[],
  members: ScoredMember[],
  done: DoneSet,
  days: string[],
): HabitRow[] {
  const rows = habits.map((habit) => {
    let completed = 0;
    let expected = 0;
    for (const member of members) {
      completed += completedCount(habit, member, days, done);
      expected += expectedCount(habit, member, days);
    }
    return { habit, completed, expected, rate: expected === 0 ? null : completed / expected };
  });

  return rows.sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));
}

/**
 * Biggest rise between two windows.
 *
 * The second way to win, and the only one available to whoever is bottom.
 */
export function mostImproved(now: Row[], before: Row[]): { userId: string; delta: number } | null {
  const previous = new Map(before.map((r) => [r.userId, r.rate]));
  let best: { userId: string; delta: number } | null = null;

  for (const row of now) {
    const then = previous.get(row.userId);
    if (row.rate === null || then === null || then === undefined) continue;
    const delta = row.rate - then;
    if (delta > 0 && (best === null || delta > best.delta)) {
      best = { userId: row.userId, delta };
    }
  }
  return best;
}

/**
 * Consecutive days on which every member hit at least one shared habit.
 *
 * Deliberately collective, and shown above the ranking: the top of the screen
 * should be something the group wins together before the part where they beat
 * each other.
 */
export function groupStreak(
  habits: ScoredHabit[],
  members: ScoredMember[],
  done: DoneSet,
  today: string = toLocalDate(),
): number {
  if (habits.length === 0 || members.length === 0) return 0;

  const everyoneOn = (day: string) =>
    members.every((member) =>
      habits.some(
        (habit) =>
          day >= member.joinedOn &&
          day >= habit.createdOn &&
          done.has(key(habit.id, member.userId, day)),
      ),
    );

  // Today still being open is not a broken streak.
  let cursor = everyoneOn(today) ? today : addDays(today, -1);
  let streak = 0;
  for (let guard = 0; guard < 400; guard++) {
    if (!everyoneOn(cursor)) break;
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Days on which everyone did everything that was owed of them. */
export function perfectDays(
  habits: ScoredHabit[],
  members: ScoredMember[],
  done: DoneSet,
  days: string[],
): number {
  const perfect = days.filter((day) =>
    members.every((member) => {
      const owed = habits.filter((habit) => expectedDays(habit, member, [day]).length > 0);
      // A day nothing was owed is not a perfect day; it is an empty one.
      if (owed.length === 0) return false;
      return owed.every((habit) => done.has(key(habit.id, member.userId, day)));
    }),
  );
  return perfect.length;
}

/** The group's completion across the window, as one number. */
export function groupRate(rows: Row[]): number | null {
  const completed = rows.reduce((sum, r) => sum + r.completed, 0);
  const expected = rows.reduce((sum, r) => sum + r.expected, 0);
  return expected === 0 ? null : completed / expected;
}

export const percent = (rate: number | null): string =>
  rate === null ? '—' : `${Math.round(rate * 100)}%`;
