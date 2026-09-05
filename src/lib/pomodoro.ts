/**
 * The Pomodoro timer's decisions, with no timer in them.
 *
 * A countdown held in component state stops when the phone sleeps, the app is
 * backgrounded, or React re-mounts — which is most of the time a focus timer is
 * meant to be running. So nothing here counts down. A running timer is a start
 * time and a duration; how much is left is worked out from the clock whenever
 * anyone asks. Close the app for twenty minutes and it has still passed.
 *
 * That also makes every decision here a pure function of (state, now), which is
 * why they can be tested at all.
 */

export type Phase = 'focus' | 'short' | 'long';

export type Settings = {
  /** Minutes. */
  focus: number;
  short: number;
  long: number;
  /** A long break after this many focus stretches. */
  longEvery: number;
};

export const DEFAULTS: Settings = { focus: 25, short: 5, long: 15, longEvery: 4 };

export type Timer =
  | { state: 'idle'; phase: Phase; done: number }
  | { state: 'running'; phase: Phase; done: number; startedAt: number; durationMs: number }
  | { state: 'paused'; phase: Phase; done: number; remainingMs: number; durationMs: number };

export const MINUTE = 60_000;

export function minutesFor(phase: Phase, s: Settings): number {
  return phase === 'focus' ? s.focus : phase === 'short' ? s.short : s.long;
}

export const idle = (phase: Phase = 'focus', done = 0): Timer => ({ state: 'idle', phase, done });

export function start(timer: Timer, s: Settings, now: number): Timer {
  if (timer.state === 'running') return timer;
  const durationMs =
    timer.state === 'paused' ? timer.durationMs : minutesFor(timer.phase, s) * MINUTE;
  const remaining = timer.state === 'paused' ? timer.remainingMs : durationMs;
  // Starting from a pause resumes what was left, not the whole stretch.
  return {
    state: 'running',
    phase: timer.phase,
    done: timer.done,
    startedAt: now - (durationMs - remaining),
    durationMs,
  };
}

export function pause(timer: Timer, now: number): Timer {
  if (timer.state !== 'running') return timer;
  return {
    state: 'paused',
    phase: timer.phase,
    done: timer.done,
    remainingMs: remainingMs(timer, now),
    durationMs: timer.durationMs,
  };
}

/** Back to the top of the current stretch, keeping the count of finished ones. */
export function reset(timer: Timer): Timer {
  return idle(timer.phase, timer.done);
}

export function remainingMs(timer: Timer, now: number): number {
  switch (timer.state) {
    case 'idle':
      return 0;
    case 'paused':
      return Math.max(0, timer.remainingMs);
    case 'running':
      return Math.max(0, timer.durationMs - (now - timer.startedAt));
  }
}

export function elapsedMs(timer: Timer, now: number): number {
  if (timer.state === 'idle') return 0;
  return timer.durationMs - remainingMs(timer, now);
}

export function isFinished(timer: Timer, now: number): boolean {
  return timer.state === 'running' && remainingMs(timer, now) === 0;
}

/**
 * What follows the stretch that just ended. A long break lands after every
 * `longEvery` focus stretches; breaks always return to focus.
 */
export function nextPhase(phase: Phase, doneAfter: number, s: Settings): Phase {
  if (phase !== 'focus') return 'focus';
  return doneAfter > 0 && doneAfter % s.longEvery === 0 ? 'long' : 'short';
}

/** The timer after the current stretch runs out, sitting ready at the next one. */
export function advance(timer: Timer, s: Settings): Timer {
  const done = timer.phase === 'focus' ? timer.done + 1 : timer.done;
  return idle(nextPhase(timer.phase, done, s), done);
}

/** When a running timer will finish, for scheduling the notification. */
export function finishesAt(timer: Timer): number | null {
  return timer.state === 'running' ? timer.startedAt + timer.durationMs : null;
}

/** mm:ss, never negative, and stable in width so the display does not jump. */
export function format(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const PHASE_LABEL: Record<Phase, string> = {
  focus: 'Focus',
  short: 'Short break',
  long: 'Long break',
};
