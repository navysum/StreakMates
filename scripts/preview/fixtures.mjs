// A believable little account, so every screen has something real to draw.
const ME = '11111111-1111-1111-1111-111111111111';
const ALEX = '22222222-2222-2222-2222-222222222222';
const SAM = '33333333-3333-3333-3333-333333333333';
const GROUP = 'aaaaaaaa-0000-0000-0000-000000000001';

const d = (back) => {
  const t = new Date();
  t.setDate(t.getDate() - back);
  return t.toISOString().slice(0, 10);
};
const iso = (back) => {
  const t = new Date();
  t.setDate(t.getDate() - back);
  return t.toISOString();
};

const profiles = [
  { id: ME, username: 'craig', display_name: 'Craig Ataide', avatar_url: null, timezone: 'Europe/London' },
  { id: ALEX, username: 'alex', display_name: 'Alex Moore', avatar_url: null, timezone: 'Europe/London' },
  { id: SAM, username: 'sam', display_name: 'Sam Okafor', avatar_url: null, timezone: 'Europe/London' },
];

const habits = [
  { id: 'h1', owner_id: ME, group_id: null, title: 'Morning run', emoji: null, color: 'green',
    cadence: 'daily', target_days: [], target_per_week: 1, reminder_at: null, sort_order: 0,
    created_at: iso(120), archived_at: null },
  { id: 'h2', owner_id: ME, group_id: null, title: 'Read 20 pages', emoji: null, color: 'blue',
    cadence: 'daily', target_days: [], target_per_week: 1, reminder_at: null, sort_order: 1,
    created_at: iso(60), archived_at: null },
  { id: 'h3', owner_id: ME, group_id: null, title: 'Guitar practice', emoji: null, color: 'purple',
    cadence: 'days', target_days: [1, 3, 5], target_per_week: 1, reminder_at: null, sort_order: 2,
    created_at: iso(30), archived_at: null },
  { id: 'h4', owner_id: ALEX, group_id: GROUP, title: 'Gym session', emoji: null, color: 'teal',
    cadence: 'weekly', target_days: [], target_per_week: 3, reminder_at: null, sort_order: 3,
    created_at: iso(45), archived_at: null },
  { id: 'h5', owner_id: ME, group_id: GROUP, title: 'No phone after 10', emoji: null, color: 'coral',
    cadence: 'daily', target_days: [], target_per_week: 1, reminder_at: null, sort_order: 4,
    created_at: iso(20), archived_at: null },
];

// h1 is a long streak (pink), h2 mid (violet), h3 short (blue) — so the
// spectrum is visible on one screen rather than having to be imagined.
const checkIns = [];
let n = 0;
const add = (habit, user, back, note = null) =>
  checkIns.push({ id: `c${n++}`, habit_id: habit, user_id: user, local_date: d(back),
                  note, created_at: iso(back) });

for (let i = 0; i < 41; i++) add('h1', ME, i);          // 41-day streak → pink
for (let i = 0; i < 9; i++) add('h2', ME, i);           // 9 days       → violet
for (let i = 0; i < 2; i++) add('h3', ME, i * 2);       // 2 days       → blue
add('h1', ME, 0, 'Cold but worth it. Hit a new best pace on the last mile.');
checkIns.pop();
for (let i = 0; i < 25; i++) if (i % 3 !== 2) add('h5', ME, i);
for (let i = 0; i < 30; i++) if (i % 4 !== 3) add('h4', ALEX, i);
for (let i = 0; i < 30; i++) if (i % 2 === 0) add('h4', SAM, i);
for (let i = 0; i < 20; i++) if (i % 3 === 0) add('h5', ALEX, i);
checkIns[0].note = 'Cold but worth it — new best pace on the last mile.';
checkIns[3].note = 'Nearly skipped. Glad I did not.';

const groups = [
  { id: GROUP, name: 'Sunrise Club', emoji: null, invite_code: 'HJ4K2P',
    created_by: ME, created_at: iso(50) },
];

const members = [
  { group_id: GROUP, user_id: ME, role: 'owner', joined_at: iso(50), profile: profiles[0] },
  { group_id: GROUP, user_id: ALEX, role: 'member', joined_at: iso(48), profile: profiles[1] },
  { group_id: GROUP, user_id: SAM, role: 'member', joined_at: iso(22), profile: profiles[2] },
];

const reactions = [
  { check_in_id: checkIns[0].id, user_id: ALEX, emoji: '🔥' },
  { check_in_id: checkIns[0].id, user_id: SAM, emoji: '👏' },
  { check_in_id: checkIns[1].id, user_id: ALEX, emoji: '💪' },
];

const tasks = [
  { id: 't1', user_id: ME, group_id: null, title: 'Draft the launch post', kind: 'each',
    done_at: null, sort_order: 0, created_at: iso(1) },
  { id: 't2', user_id: ME, group_id: GROUP, title: 'Book the 5k entries', kind: 'once',
    done_at: null, sort_order: 1, created_at: iso(1) },
  { id: 't3', user_id: ME, group_id: null, title: 'Reply to the physio', kind: 'each',
    done_at: null, sort_order: 2, created_at: iso(2) },
];

export const TABLES = {
  profiles,
  habits,
  check_ins: checkIns,
  groups,
  group_members: members,
  reactions,
  nudges: [],
  habit_order: habits.map((h, i) => ({ user_id: ME, habit_id: h.id, position: i })),
  tasks,
  task_completions: [{ task_id: 't3', user_id: ME, completed_on: d(0) }],
  focus_sessions: [
    { id: 'f1', user_id: ME, started_at: iso(0), minutes: 25, task_id: 't1' },
    { id: 'f2', user_id: ME, started_at: iso(1), minutes: 50, task_id: null },
  ],
};

export const IDS = { ME, ALEX, SAM, GROUP };
