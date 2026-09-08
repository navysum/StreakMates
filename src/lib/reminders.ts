/**
 * Habit reminders, scheduled on the device.
 *
 * Deliberately local rather than server push: "remind me at 07:00" needs no
 * server, works with no signal, and needs no development build. Push is only
 * required for things the server knows first — a friend checking in — which is
 * a later problem.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Habit } from './types';
import {
  remindersFor,
  reminderKey,
  toSchedulerWeekday,
  type Reminder,
} from './reminders-pure';

export * from './reminders-pure';

/**
 * Android puts every notification in a channel, and the channel — not the
 * notification — owns whether it makes a sound and whether it comes forward.
 * Post without one and Android files it under a default low-importance
 * channel: no sound, no banner. `sound: true` on the focus alarm is simply
 * ignored. That is the whole reason a timer that works on an iPhone appears
 * broken on a Pixel, so the channels are created before anything is scheduled.
 *
 * Two of them, because a person may reasonably want the end of a focus stretch
 * to make a noise and a habit reminder not to. Android shows them separately
 * in system settings and remembers what they choose.
 *
 * Creating a channel that already exists updates it, so this is safe to call
 * on every launch. It is a no-op on iOS.
 */
export const CHANNEL = { reminders: 'reminders', focus: 'focus' } as const;

export async function ensureChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL.reminders, {
    name: 'Habit reminders',
    description: 'The nudge at the time you asked for.',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });
  await Notifications.setNotificationChannelAsync(CHANNEL.focus, {
    name: 'Focus timer',
    description: 'The end of a stretch of focus, and the end of a break.',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });
}

export async function ensurePermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  // Never ask twice if they have said no; iOS ignores it anyway.
  if (!existing.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/**
 * Make the scheduled notifications match the habits, and no more.
 *
 * Rescheduling from scratch each time would be simpler but loses nothing and
 * costs a permission-visible churn on every app open, so this diffs first.
 */
export async function syncReminders(habits: Habit[]): Promise<{ added: number; removed: number }> {
  await ensureChannels();

  const wanted = new Map<string, { reminder: Reminder; weekday: number | null }>();
  for (const reminder of remindersFor(habits)) {
    if (reminder.weekdays.length === 0) {
      wanted.set(reminderKey(reminder, null), { reminder, weekday: null });
    } else {
      for (const weekday of reminder.weekdays) {
        wanted.set(reminderKey(reminder, weekday), { reminder, weekday });
      }
    }
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const existing = new Map<string, string>();
  for (const item of scheduled) {
    const key = (item.content.data as { key?: string } | null)?.key;
    if (typeof key === 'string') existing.set(key, item.identifier);
  }

  let removed = 0;
  for (const [key, identifier] of existing) {
    if (!wanted.has(key)) {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      removed++;
    }
  }

  let added = 0;
  for (const [key, { reminder, weekday }] of wanted) {
    if (existing.has(key)) continue;
    const [hour, minute] = reminder.at.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: 'Still to do today.',
        data: { key, habitId: reminder.habitId },
      },
      // channelId lives on the trigger, not the request, and is ignored on iOS.
      trigger:
        weekday === null
          ? {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour,
              minute,
              channelId: CHANNEL.reminders,
            }
          : {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: toSchedulerWeekday(weekday),
              hour,
              minute,
              channelId: CHANNEL.reminders,
            },
    });
    added++;
  }

  return { added, removed };
}

export async function cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ------------------------------------------------------------------- focus

/**
 * The alert for the end of a stretch of focus.
 *
 * Scheduled for a wall-clock moment rather than counted down, so it fires with
 * the app closed — which is the whole point of a focus timer. Exactly one is
 * ever outstanding: starting a stretch replaces whatever was pending, so a
 * paused-then-restarted timer cannot leave a stale alarm behind to go off
 * halfway through the next one.
 */
const FOCUS_ALARM = 'streakmates.focus-alarm';

export async function scheduleFocusAlarm(finishesAt: number, phase: string): Promise<void> {
  await cancelFocusAlarm();
  await ensureChannels();

  const seconds = Math.round((finishesAt - Date.now()) / 1000);
  if (seconds <= 0) return; // already over; nothing to announce

  const breakTime = phase.toLowerCase().includes('break');
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: FOCUS_ALARM,
      content: {
        title: breakTime ? 'Break over' : 'Time is up',
        body: breakTime ? 'Back to it.' : 'Stretch, look out of a window, then go again.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        repeats: false,
        channelId: CHANNEL.focus,
      },
    });
  } catch {
    // No permission, or notifications unavailable. The timer still runs; it
    // just will not announce itself.
  }
}

export async function cancelFocusAlarm(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(FOCUS_ALARM);
  } catch {
    // Cancelling something that was never scheduled is not a failure.
  }
}
