export type Cadence = 'daily' | 'days' | 'weekly';
export type HabitColor = 'green' | 'amber' | 'blue' | 'purple' | 'teal' | 'coral';

export type Profile = {
  id: string;
  /** Unique across the whole app. Null only until someone has chosen one. */
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  timezone: string;
};

export type Habit = {
  id: string;
  owner_id: string;
  group_id: string | null;
  title: string;
  emoji: string | null;
  color: HabitColor;
  cadence: Cadence;
  target_days: number[];
  target_per_week: number;
  reminder_at: string | null;
  sort_order: number;
  created_at: string;
  archived_at: string | null;
};

export type CheckIn = {
  id: string;
  habit_id: string;
  user_id: string;
  local_date: string;
  note: string | null;
  /** When it arrived, as opposed to the day it counts for. Orders the feed. */
  created_at: string;
};

export const REACTIONS = ['🔥', '👏', '💪', '🙌', '😂'] as const;
export type ReactionEmoji = (typeof REACTIONS)[number];

export type Reaction = {
  check_in_id: string;
  user_id: string;
  emoji: ReactionEmoji;
};

export type Nudge = {
  id: string;
  habit_id: string;
  from_user: string;
  to_user: string;
  nudge_day: string;
  created_at: string;
};

export type Group = {
  id: string;
  name: string;
  emoji: string | null;
  invite_code: string;
  created_by: string;
  created_at: string;
};

export type GroupMember = {
  group_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  profile?: Profile;
};

export type GroupPreview = {
  id: string;
  name: string;
  emoji: string | null;
  member_count: number;
};

/** How a shared task gets finished. Private tasks are always effectively 'once'. */
export type TaskCompletionKind = 'once' | 'everyone';

export type Task = {
  id: string;
  user_id: string;
  /** Null for a private task. */
  group_id: string | null;
  title: string;
  completion: TaskCompletionKind;
  position: number;
  created_at: string;
  /**
   * Superseded by task_completions and no longer read or written. Left on the
   * row so a build from before 0010 keeps working.
   */
  done_at: string | null;
};

export type TaskCompletion = {
  task_id: string;
  user_id: string;
  done_at: string;
};

export type FocusSession = {
  id: string;
  user_id: string;
  task_id: string | null;
  started_at: string;
  minutes: number;
  created_at: string;
};
