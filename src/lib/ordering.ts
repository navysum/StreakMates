/**
 * How habits are arranged in a list.
 *
 * Order is a personal preference, so it is stored per person rather than on
 * the habit — a shared habit is one row that every member can write, and
 * ordering it there rearranged everyone else's list too.
 *
 * A habit with no stored position is new to you; it goes to the end, oldest
 * first, so appearing in the list is predictable rather than random.
 */
import type { Habit } from './types.ts';

export type Positions = Map<string, number>;

export function sortHabits(habits: Habit[], positions: Positions): Habit[] {
  return [...habits].sort((a, b) => {
    const pa = positions.get(a.id);
    const pb = positions.get(b.id);
    if (pa !== undefined && pb !== undefined) return pa - pb;
    // Unplaced habits sit after placed ones rather than jumping to the top.
    if (pa !== undefined) return -1;
    if (pb !== undefined) return 1;
    return a.created_at.localeCompare(b.created_at);
  });
}

/**
 * Positions for one list after a move, numbered from zero.
 *
 * Each list is numbered independently, so private habits and a group's habits
 * do not have to share a sequence.
 */
export function reorder(ids: string[], from: number, to: number): string[] {
  if (from === to || from < 0 || to < 0 || from >= ids.length || to >= ids.length) return ids;
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function positionsFor(ids: string[]): { habit_id: string; position: number }[] {
  return ids.map((habit_id, position) => ({ habit_id, position }));
}
