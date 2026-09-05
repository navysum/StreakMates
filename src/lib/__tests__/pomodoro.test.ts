import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULTS,
  MINUTE,
  advance,
  elapsedMs,
  finishesAt,
  format,
  idle,
  isFinished,
  nextPhase,
  pause,
  remainingMs,
  reset,
  start,
  type Settings,
} from '../pomodoro.ts';

const T0 = 1_800_000_000_000; // a fixed "now"
const short: Settings = { focus: 2, short: 1, long: 3, longEvery: 2 };

test('an idle timer has nothing left and nothing elapsed', () => {
  const t = idle();
  assert.equal(remainingMs(t, T0), 0);
  assert.equal(elapsedMs(t, T0), 0);
  assert.equal(isFinished(t, T0), false);
});

test('starting runs for the phase length', () => {
  const t = start(idle('focus'), short, T0);
  assert.equal(t.state, 'running');
  assert.equal(remainingMs(t, T0), 2 * MINUTE);
});

test('time passes even though nothing is counting', () => {
  const t = start(idle('focus'), short, T0);
  assert.equal(remainingMs(t, T0 + 30_000), 90_000);
  assert.equal(elapsedMs(t, T0 + 30_000), 30_000);
});

test('a phone asleep for the whole stretch still finishes it', () => {
  // The point of holding a start time rather than a countdown: nothing had to
  // be running for this to be true.
  const t = start(idle('focus'), short, T0);
  assert.equal(isFinished(t, T0 + 2 * MINUTE), true);
  assert.equal(remainingMs(t, T0 + 10 * MINUTE), 0, 'never goes negative');
});

test('pausing keeps what was left, and resuming continues from there', () => {
  const running = start(idle('focus'), short, T0);
  const paused = pause(running, T0 + 30_000);
  assert.equal(paused.state, 'paused');
  assert.equal(remainingMs(paused, T0 + 5 * MINUTE), 90_000, 'a pause does not tick');

  // Resumed an hour later: still 90 seconds to go, not 90 minus the hour.
  const resumed = start(paused, short, T0 + MINUTE * 60);
  assert.equal(remainingMs(resumed, T0 + MINUTE * 60), 90_000);
  assert.equal(remainingMs(resumed, T0 + MINUTE * 60 + 30_000), 60_000);
});

test('pausing an idle or paused timer changes nothing', () => {
  const t = idle();
  assert.deepEqual(pause(t, T0), t);
  const paused = pause(start(t, short, T0), T0 + 1000);
  assert.deepEqual(pause(paused, T0 + 9999), paused);
});

test('starting an already-running timer does not restart it', () => {
  const running = start(idle(), short, T0);
  assert.deepEqual(start(running, short, T0 + 30_000), running);
});

test('reset returns to the top of the stretch but keeps the tally', () => {
  const t = start(idle('focus', 3), short, T0);
  const r = reset(t);
  assert.equal(r.state, 'idle');
  assert.equal(r.done, 3);
  assert.equal(r.phase, 'focus');
});

test('a finished focus stretch is followed by a short break', () => {
  const t = advance(start(idle('focus', 0), short, T0), short);
  assert.equal(t.phase, 'short');
  assert.equal(t.done, 1, 'the focus stretch counts');
});

test('the long break lands on the cadence, not before it', () => {
  // longEvery is 2 here.
  assert.equal(nextPhase('focus', 1, short), 'short');
  assert.equal(nextPhase('focus', 2, short), 'long');
  assert.equal(nextPhase('focus', 3, short), 'short');
  assert.equal(nextPhase('focus', 4, short), 'long');
});

test('a break is always followed by focus, and does not count', () => {
  assert.equal(nextPhase('short', 5, short), 'focus');
  assert.equal(nextPhase('long', 5, short), 'focus');
  const afterBreak = advance(start(idle('short', 2), short, T0), short);
  assert.equal(afterBreak.phase, 'focus');
  assert.equal(afterBreak.done, 2, 'breaks are not achievements');
});

test('the default cadence is four focus stretches to a long break', () => {
  assert.equal(nextPhase('focus', 3, DEFAULTS), 'short');
  assert.equal(nextPhase('focus', 4, DEFAULTS), 'long');
});

test('finishesAt is the moment to schedule the alert for', () => {
  const running = start(idle(), short, T0);
  assert.equal(finishesAt(running), T0 + 2 * MINUTE);
  assert.equal(finishesAt(idle()), null, 'nothing to schedule when idle');
  assert.equal(finishesAt(pause(running, T0)), null, 'nor when paused');
});

test('the clock reads mm:ss and holds its width', () => {
  assert.equal(format(25 * MINUTE), '25:00');
  assert.equal(format(0), '00:00');
  assert.equal(format(-5000), '00:00', 'never negative');
  assert.equal(format(9_000), '00:09');
  assert.equal(format(61_000), '01:01');
});

test('the last second is shown as 00:01, not 00:00', () => {
  // Rounding up: while any part of a second remains, it is still on the clock.
  assert.equal(format(1), '00:01');
  assert.equal(format(999), '00:01');
});

test('a full cycle at the default settings', () => {
  let t = idle('focus', 0);
  let now = T0;
  const phases: string[] = [];

  for (let i = 0; i < 8; i++) {
    t = start(t, DEFAULTS, now);
    assert.equal(t.state, 'running');
    // Jump to exactly the end of this stretch and take the next one.
    now = t.state === 'running' ? t.startedAt + t.durationMs : now;
    assert.equal(isFinished(t, now), true);
    phases.push(t.phase);
    t = advance(t, DEFAULTS);
  }

  assert.deepEqual(phases, [
    'focus', 'short',
    'focus', 'short',
    'focus', 'short',
    'focus', 'long',
  ]);
  assert.equal(t.done, 4, 'four focus stretches, and the long break earned');
});
