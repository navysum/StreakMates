import assert from 'node:assert/strict';
import { test } from 'node:test';
import { byTask, isDone, progress, sortTasks, toggleIntent } from '../tasks.ts';
import type { Task, TaskCompletion } from '../types.ts';

const ME = 'me';
const DAN = 'dan';

const task = (over: Partial<Task> = {}): Task => ({
  id: 't1',
  user_id: ME,
  group_id: null,
  title: 'Book the restaurant',
  completion: 'once',
  position: 0,
  created_at: '2026-09-01T09:00:00Z',
  done_at: null,
  ...over,
});

const rows = (...pairs: [string, string][]): TaskCompletion[] =>
  pairs.map(([task_id, user_id]) => ({ task_id, user_id, done_at: '2026-09-05T10:00:00Z' }));

test('a private task is done when you have done it', () => {
  const t = task();
  assert.equal(isDone(t, byTask([]), ME), false);
  assert.equal(isDone(t, byTask(rows(['t1', ME])), ME), true);
});

test('a shared "once" task is done when ANYONE has done it', () => {
  const t = task({ group_id: 'g1', completion: 'once' });
  const done = byTask(rows(['t1', DAN]));
  assert.equal(isDone(t, done, ME), true, 'Dan booked it, so it is booked');
  assert.equal(isDone(t, done, DAN), true);
});

test('a shared "everyone" task is done only when YOU have done it', () => {
  const t = task({ group_id: 'g1', completion: 'everyone', title: 'Submit expenses' });
  const done = byTask(rows(['t1', DAN]));
  assert.equal(isDone(t, done, ME), false, "Dan's expenses are not mine");
  assert.equal(isDone(t, done, DAN), true);
});

test('signed out, nothing is done', () => {
  assert.equal(isDone(task(), byTask(rows(['t1', ME])), null), false);
});

test('progress is only meaningful for an "everyone" task', () => {
  const everyone = task({ group_id: 'g1', completion: 'everyone' });
  assert.deepEqual(progress(everyone, byTask(rows(['t1', DAN])), 3), { done: 1, total: 3 });

  assert.equal(progress(task(), byTask([]), 3), null, 'private has no group progress');
  assert.equal(
    progress(task({ group_id: 'g1', completion: 'once' }), byTask([]), 3),
    null,
    'a "once" task is not 1 of 3',
  );
});

test('ticking a private task adds only your row', () => {
  assert.deepEqual(toggleIntent(task(), byTask([]), ME), { add: true, removeUsers: [] });
});

test('unticking a private task removes only your row', () => {
  assert.deepEqual(toggleIntent(task(), byTask(rows(['t1', ME])), ME), {
    add: false,
    removeUsers: [ME],
  });
});

test('anyone can put a shared "once" task back, whoever ticked it', () => {
  // Dan booked the restaurant and went quiet; somebody else has to be able to
  // undo it, or the list is stuck.
  const t = task({ group_id: 'g1', completion: 'once' });
  assert.deepEqual(toggleIntent(t, byTask(rows(['t1', DAN])), ME), {
    add: false,
    removeUsers: [DAN],
  });
});

test('unticking an "everyone" task never touches anyone else', () => {
  const t = task({ group_id: 'g1', completion: 'everyone' });
  const done = byTask(rows(['t1', ME], ['t1', DAN]));
  assert.deepEqual(toggleIntent(t, done, ME), { add: false, removeUsers: [ME] });
});

test('ticking an "everyone" task someone else has done still adds your own', () => {
  const t = task({ group_id: 'g1', completion: 'everyone' });
  assert.deepEqual(toggleIntent(t, byTask(rows(['t1', DAN])), ME), {
    add: true,
    removeUsers: [],
  });
});

test('open tasks come before done ones', () => {
  const a = task({ id: 'a', position: 5 });
  const b = task({ id: 'b', position: 0 });
  const sorted = sortTasks([a, b], byTask(rows(['b', ME])), ME);
  assert.deepEqual(
    sorted.map((t) => t.id),
    ['a', 'b'],
    'b is done, so it drops below a despite its lower position',
  );
});

test('within a group, position wins and age breaks the tie', () => {
  const first = task({ id: 'a', position: 0, created_at: '2026-09-02T00:00:00Z' });
  const second = task({ id: 'b', position: 0, created_at: '2026-09-01T00:00:00Z' });
  const third = task({ id: 'c', position: 1 });
  const sorted = sortTasks([third, first, second], byTask([]), ME);
  assert.deepEqual(
    sorted.map((t) => t.id),
    ['b', 'a', 'c'],
  );
});

test('a shared "once" task sorts as done for everyone at once', () => {
  const t = task({ id: 'a', group_id: 'g1', completion: 'once' });
  const other = task({ id: 'b', position: 1 });
  const done = byTask(rows(['a', DAN]));
  assert.deepEqual(
    sortTasks([t, other], done, ME).map((x) => x.id),
    ['b', 'a'],
    'Dan finishing it moves it down my list too',
  );
});
