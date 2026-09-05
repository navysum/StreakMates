import type { Task, TaskCompletion } from './types';

/**
 * Whether a task is done, which now means three different things.
 *
 *   private        done when you have done it
 *   shared, once   done when anyone has — one restaurant booking, one booker
 *   shared, everyone   done for you when you have; the group's progress is
 *                      how many of you have
 *
 * Keeping the three in one place is the point: the screens ask "is this done
 * for me" and "how far along is the group", and never work it out themselves.
 */

export type Completions = Map<string, Set<string>>;

/** Completion rows indexed as task id -> the people who have done it. */
export function byTask(rows: TaskCompletion[] | undefined): Completions {
  const map: Completions = new Map();
  for (const row of rows ?? []) {
    const set = map.get(row.task_id) ?? new Set<string>();
    set.add(row.user_id);
    map.set(row.task_id, set);
  }
  return map;
}

export function doneBy(task: Task, done: Completions): Set<string> {
  return done.get(task.id) ?? new Set<string>();
}

/** Is this off the list, from where you are standing? */
export function isDone(task: Task, done: Completions, userId: string | null): boolean {
  const who = doneBy(task, done);
  if (task.group_id && task.completion === 'once') return who.size > 0;
  return userId !== null && who.has(userId);
}

/**
 * How many of the group have done it, for an "everyone" task. Null for the
 * kinds where the question does not apply, so a screen cannot render a
 * meaningless "1 of 1".
 */
export function progress(
  task: Task,
  done: Completions,
  memberCount: number,
): { done: number; total: number } | null {
  if (!task.group_id || task.completion !== 'everyone') return null;
  return { done: doneBy(task, done).size, total: memberCount };
}

/**
 * Open first, then done. Within each, the order someone chose, then oldest —
 * the same rule the habit list uses, so the two feel like one app.
 */
export function sortTasks(tasks: Task[], done: Completions, userId: string | null): Task[] {
  return [...tasks].sort((a, b) => {
    const aDone = isDone(a, done, userId);
    const bDone = isDone(b, done, userId);
    if (aDone !== bDone) return aDone ? 1 : -1;
    if (a.position !== b.position) return a.position - b.position;
    return a.created_at.localeCompare(b.created_at);
  });
}

/** What ticking the box should do: add your row, or take it away. */
export function toggleIntent(
  task: Task,
  done: Completions,
  userId: string | null,
): { add: boolean; removeUsers: string[] } {
  const who = doneBy(task, done);

  if (task.group_id && task.completion === 'once') {
    // Anyone may put a shared "once" task back, whoever ticked it.
    return who.size > 0 ? { add: false, removeUsers: [...who] } : { add: true, removeUsers: [] };
  }

  const mine = userId !== null && who.has(userId);
  return mine ? { add: false, removeUsers: userId ? [userId] : [] } : { add: true, removeUsers: [] };
}
