import AsyncStorage from '@react-native-async-storage/async-storage';
import { idle, type Timer } from './pomodoro';

/**
 * The running timer, kept on the device.
 *
 * A timer that forgets itself when the app is closed is not a focus timer.
 * Because a running timer is only a start time and a duration, storing it is
 * enough — reopening the app half an hour later works out where it got to.
 */
const KEY = 'streakmates.focus-timer';

export async function loadTimer(): Promise<Timer | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Timer;
    // A shape written by an older build is not worth guessing at.
    if (!parsed || typeof parsed !== 'object' || !('state' in parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveTimer(timer: Timer): Promise<void> {
  try {
    if (timer.state === 'idle' && timer.done === 0) {
      await AsyncStorage.removeItem(KEY);
      return;
    }
    await AsyncStorage.setItem(KEY, JSON.stringify(timer));
  } catch {
    // Losing the timer across a restart is a nuisance, not a reason to break
    // the screen someone is looking at.
  }
}

export const emptyTimer = () => idle();
