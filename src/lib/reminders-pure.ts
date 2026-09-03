import type { Habit } from './types.ts';

/**
 * The decisions behind a reminder, with nothing native in them.
 *
 * Kept apart from the scheduling so it can be unit tested: importing
 * expo-notifications pulls in React Native, which a node test cannot load.
 *
 * Original note:
 * Habit reminders, scheduled on the device.
 *
 * Deliberately local rather than server push: "remind me at 07:00" needs no
 * server, works with no signal, and needs no development build. Push is only
 * required for things the server knows first — a friend checking in — which is
 * a later problem.
 */
/** ISO weekday (1 = Monday) → the 1 = Sunday that the scheduler expects. */
export const toSchedulerWeekday = (isoWeekday: number) => (isoWeekday % 7) + 1;

export type Reminder = {
  habitId: string;
  title: string;
  /** Local wall-clock time, `HH:MM`. */
  at: string;
  /** ISO weekdays this fires on. Empty means every day. */
  weekdays: number[];
};

/** What a habit's reminder should be, or null if it has none. */
export function reminderFor(habit: Habit): Reminder | null {
  if (!habit.reminder_at || habit.archived_at) return null;
  const [hour, minute] = habit.reminder_at.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

  return {
    habitId: habit.id,
    title: habit.emoji ? `${habit.emoji} ${habit.title}` : habit.title,
    at: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    // A weekly habit has no fixed days, so it is reminded every day and the
    // person decides which ones to use.
    weekdays: habit.cadence === 'days' ? habit.target_days : [],
  };
}

export function remindersFor(habits: Habit[]): Reminder[] {
  return habits.map(reminderFor).filter((r): r is Reminder => r !== null);
}

/**
 * A stable identity for one scheduled notification, so rescheduling can tell
 * "already scheduled" from "changed" without cancelling everything each time.
 */
export function reminderKey(reminder: Reminder, weekday: number | null): string {
  return `${reminder.habitId}|${reminder.at}|${weekday ?? '*'}`;
}

