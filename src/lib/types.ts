export type Cadence = 'daily' | 'days' | 'weekly';
export type HabitColor = 'green' | 'amber' | 'blue' | 'purple' | 'teal' | 'coral';

export type Profile = {
  id: string;
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
