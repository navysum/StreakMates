import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import * as outbox from './outbox';
import { positionsFor, type Positions } from './ordering';
import { assertChanged } from './writes';
import { addDays, toLocalDate } from './date';
import type {
  CheckIn,
  FocusSession,
  Group,
  GroupMember,
  GroupPreview,
  Habit,
  Nudge,
  Profile,
  Reaction,
  ReactionEmoji,
  Task,
  TaskCompletion,
  TaskCompletionKind,
} from './types';

/** Streaks need contiguous history; a year and a bit is far past any real one. */
const HISTORY_DAYS = 400;

function db() {
  if (!supabase) throw new Error('Supabase is not configured. Fill in .env and restart.');
  return supabase;
}

export const keys = {
  profile: ['profile'] as const,
  habits: ['habits'] as const,
  checkIns: ['check-ins'] as const,
  groups: ['groups'] as const,
  members: (groupId: string) => ['group-members', groupId] as const,
  allMembers: ['group-members'] as const,
  people: ['people'] as const,
  reactions: ['reactions'] as const,
  nudges: ['nudges'] as const,
  order: ['habit-order'] as const,
  tasks: ['tasks'] as const,
  taskDone: ['task-completions'] as const,
  focus: ['focus-sessions'] as const,
};

// ---------------------------------------------------------------- profile

export function useProfile(userId: string | null) {
  return useQuery({
    queryKey: keys.profile,
    enabled: !!userId,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await db()
        .from('profiles')
        .select('id, username, display_name, avatar_url, timezone')
        .eq('id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSetUsername(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      // Through a function, not a table write. An UPDATE that matches no rows
      // is not an error in PostgREST, so a missing profile row — anyone whose
      // account predates the handle_new_user trigger — used to report success,
      // leave the username unset, and bounce straight back to this screen
      // forever. An upsert cannot fix it either: PostgREST puts every column
      // of the payload into the ON CONFLICT DO UPDATE, id included, and that
      // column is deliberately not updatable.
      const { error } = await db().rpc('set_username', { p_username: username.trim() });
      if (error) {
        // Two people can pick the same free name in the same moment; the
        // unique index is what decides, and this is how it says so.
        if (error.code === '23505') {
          throw new Error('That username could not be claimed. Please try another one.');
        }
        if (error.code === '23514') {
          throw new Error(
            'Usernames are 3–20 characters, start with a letter, and use only letters, numbers and underscores.',
          );
        }
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.profile });
      qc.invalidateQueries({ queryKey: ['group-members'] });
    },
  });
}

// ---------------------------------------------------------------- habits

export function useHabits(includeArchived = false) {
  return useQuery({
    queryKey: [...keys.habits, { includeArchived }],
    queryFn: async (): Promise<Habit[]> => {
      let q = db().from('habits').select('*');
      if (!includeArchived) q = q.is('archived_at', null);
      const { data, error } = await q.order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useHabit(id: string | undefined) {
  return useQuery({
    queryKey: [...keys.habits, id],
    enabled: !!id,
    queryFn: async (): Promise<Habit | null> => {
      const { data, error } = await db().from('habits').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

type HabitDraft = Pick<Habit, 'title'> &
  Partial<
    Pick<
      Habit,
      | 'emoji'
      | 'color'
      | 'cadence'
      | 'target_days'
      | 'target_per_week'
      | 'group_id'
      | 'reminder_at'
    >
  >;

export function useCreateHabit(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (draft: HabitDraft): Promise<Habit> => {
      const { data, error } = await db()
        .from('habits')
        .insert({ ...draft, owner_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.habits }),
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Habit> & { id: string }) => {
      const { data, error } = await db().from('habits').update(patch).eq('id', id).select('id');
      if (error) throw error;
      assertChanged(
        data,
        'Those changes were not saved. The habit may have been deleted on another device.',
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.habits }),
  });
}

/** Archiving keeps every check-in and the streak record. Prefer it to deleting. */
export function useSetArchived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { data, error } = await db()
        .from('habits')
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq('id', id)
        .select('id');
      if (error) throw error;
      assertChanged(
        data,
        'That habit was not changed. It may have been deleted on another device.',
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.habits }),
  });
}

/** Destroys the habit and every check-in against it. Not reversible. */
export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // `.select()` matters. A DELETE that matches no rows is not an error in
      // PostgREST, and RLS makes "no rows" the normal outcome for anyone who
      // is not allowed to do this — a group member deleting a shared habit
      // only the group owner may delete. Without the select the client is told
      // nothing came back, calls that success, and navigates away from a habit
      // that is still there. Asking for the deleted rows turns a silent no-op
      // into something we can check.
      const { data, error } = await db().from('habits').delete().eq('id', id).select('id');
      if (error) throw error;
      assertChanged(
        data,
        'That habit was not deleted. A shared habit can only be deleted by whoever owns the group.',
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.habits });
      qc.invalidateQueries({ queryKey: keys.checkIns });
    },
  });
}

/** Where you have put each habit. Yours alone — see 0006_habit_order.sql. */
export function useHabitOrder(userId: string | null) {
  return useQuery({
    queryKey: keys.order,
    enabled: !!userId,
    queryFn: async (): Promise<Positions> => {
      const { data, error } = await db()
        .from('habit_order')
        .select('habit_id, position');
      if (error) throw error;
      return new Map((data ?? []).map((r) => [r.habit_id as string, r.position as number]));
    },
  });
}

/**
 * Save one list's arrangement.
 *
 * Only the habits in that list are renumbered, so private habits and each
 * group's habits keep their own sequence rather than sharing one.
 */
export function useReorderHabits(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const rows = positionsFor(orderedIds).map((r) => ({ ...r, user_id: userId }));
      const { error } = await db()
        .from('habit_order')
        .upsert(rows, { onConflict: 'user_id,habit_id' });
      if (error) throw error;
    },
    // Reordering should feel immediate; the list is the whole feedback.
    onMutate: async (orderedIds) => {
      await qc.cancelQueries({ queryKey: keys.order });
      const previous = qc.getQueryData<Positions>(keys.order);
      qc.setQueryData<Positions>(keys.order, (old) => {
        const next = new Map(old ?? []);
        orderedIds.forEach((id, index) => next.set(id, index));
        return next;
      });
      return { previous };
    },
    onError: (_e, _v, context) => {
      if (context?.previous) qc.setQueryData(keys.order, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.order }),
  });
}

// ---------------------------------------------------------------- check-ins

export function useCheckIns() {
  return useQuery({
    queryKey: keys.checkIns,
    queryFn: async (): Promise<CheckIn[]> => {
      const { data, error } = await db()
        .from('check_ins')
        .select('id, habit_id, user_id, local_date, note, created_at')
        .gte('local_date', addDays(toLocalDate(), -HISTORY_DAYS))
        .order('local_date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Completed dates per habit, for the signed-in user only. */
export function byHabit(checkIns: CheckIn[] | undefined, userId: string | null) {
  const map = new Map<string, Set<string>>();
  for (const c of checkIns ?? []) {
    if (userId && c.user_id !== userId) continue;
    let set = map.get(c.habit_id);
    if (!set) map.set(c.habit_id, (set = new Set()));
    set.add(c.local_date);
  }
  return map;
}

/** One check-in write. Shared by the tap and by the outbox replay. */
async function writeCheckIn(
  userId: string | null,
  habitId: string,
  date: string,
  complete: boolean,
): Promise<void> {
  if (complete) {
    // The unique key on (habit, user, date) makes this idempotent, so a retry
    // that lands twice is harmless.
    const { error } = await db()
      .from('check_ins')
      .upsert(
        { habit_id: habitId, user_id: userId, local_date: date },
        { onConflict: 'habit_id,user_id,local_date', ignoreDuplicates: true },
      );
    if (error) throw error;
  } else {
    const { error } = await db()
      .from('check_ins')
    // Un-checking. No assertChanged: if the check-in is already gone, the end
    // state is the one the person asked for, and raising here would turn a
    // double tap into an error. See src/lib/writes.ts.
      .delete()
      .eq('habit_id', habitId)
      .eq('user_id', userId!)
      .eq('local_date', date);
    if (error) throw error;
  }
}

/**
 * Sends anything a previous session could not. Safe to call on every launch:
 * an empty outbox costs one read.
 */
export async function flushOutbox(userId: string | null, today: string) {
  return outbox.flush(AsyncStorage, today, (entry) =>
    writeCheckIn(userId, entry.habitId, entry.date, entry.complete),
  );
}

/**
 * Every completion as `habit|user|date`, for looking up any member's day on
 * the group board rather than only your own.
 */
export function checkInIndex(checkIns: CheckIn[] | undefined) {
  const set = new Set<string>();
  for (const c of checkIns ?? []) set.add(`${c.habit_id}|${c.user_id}|${c.local_date}`);
  return set;
}

export const doneKey = (habitId: string, userId: string, date: string) =>
  `${habitId}|${userId}|${date}`;

/**
 * Keeps the shared half of the app live: a friend's tick, on a habit or on a
 * shared task, appears without a refresh.
 *
 * This is the only live-update mechanism there is — `refetchOnWindowFocus` is
 * off and nothing polls — so a table missing from here is a table that looks
 * frozen until the app is restarted. Every table whose rows two people can
 * both see belongs in this list.
 *
 * Row-level security applies to these events too, so nothing arrives that the
 * viewer could not already have read.
 */
export function useRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('check-ins-and-habits')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'check_ins' }, () =>
        qc.invalidateQueries({ queryKey: keys.checkIns }),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habits' }, () =>
        qc.invalidateQueries({ queryKey: keys.habits }),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () =>
        qc.invalidateQueries({ queryKey: keys.reactions }),
      )
      // A shared task is only worth sharing if you can see somebody else do
      // it. Without these two the list sat stale until the app was reopened.
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () =>
        qc.invalidateQueries({ queryKey: keys.tasks }),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_completions' }, () =>
        qc.invalidateQueries({ queryKey: keys.taskDone }),
      )
      // Both member queries share the 'group-members' prefix, so one
      // invalidation refreshes the board and every roster.
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, () =>
        qc.invalidateQueries({ queryKey: keys.allMembers }),
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [qc]);
}

/**
 * Tapping the circle. Updates the cache first so the tick is instant, and
 * rolls back if the write fails.
 *
 * The unique key on (habit, user, date) makes this idempotent, so a retry
 * that lands twice is harmless.
 */
export function useToggleCheckIn(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      habitId,
      date,
      complete,
    }: {
      habitId: string;
      date: string;
      complete: boolean;
    }) => {
      await writeCheckIn(userId, habitId, date, complete);
    },

    onMutate: async ({ habitId, date, complete }) => {
      await qc.cancelQueries({ queryKey: keys.checkIns });
      const previous = qc.getQueryData<CheckIn[]>(keys.checkIns);

      qc.setQueryData<CheckIn[]>(keys.checkIns, (old = []) =>
        complete
          ? [
              {
                id: `optimistic-${habitId}-${date}`,
                habit_id: habitId,
                user_id: userId ?? '',
                local_date: date,
                note: null,
                created_at: new Date().toISOString(),
              },
              ...old,
            ]
          : old.filter(
              (c) => !(c.habit_id === habitId && c.local_date === date && c.user_id === userId),
            ),
      );

      return { previous };
    },

    onError: (_err, variables, context) => {
      // Keep the intent on disk so closing the app does not lose it. The tick
      // is rolled back so the screen stays honest about what has landed.
      void outbox.enqueue(AsyncStorage, {
        habitId: variables.habitId,
        date: variables.date,
        complete: variables.complete,
        queuedAt: new Date().toISOString(),
      });
      if (context?.previous) qc.setQueryData(keys.checkIns, context.previous);
    },

    onSettled: () => qc.invalidateQueries({ queryKey: keys.checkIns }),
  });
}

/**
 * Deletes the account for good.
 *
 * The function behind this hands over anything shared before it cascades:
 * a group habit you created keeps existing under a new owner, so leaving
 * cannot destroy the check-ins your friends made against it.
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await db().rpc('delete_my_account');
      if (error) throw error;
    },
  });
}

// ---------------------------------------------------------------- people

/**
 * Everyone whose name might need rendering: yourself, plus anyone sharing a
 * group with you. The policy decides that, so this needs no filter of its own.
 */
export function usePeople() {
  return useQuery({
    queryKey: keys.people,
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await db()
        .from('profiles')
        .select('id, username, display_name, avatar_url, timezone');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function peopleById(people: Profile[] | undefined) {
  return new Map((people ?? []).map((p) => [p.id, p]));
}

// ---------------------------------------------------------------- reactions

export function useReactions() {
  return useQuery({
    queryKey: keys.reactions,
    queryFn: async (): Promise<Reaction[]> => {
      const { data, error } = await db()
        .from('reactions')
        .select('check_in_id, user_id, emoji');
      if (error) throw error;
      return (data ?? []) as Reaction[];
    },
  });
}

/** Reactions on a check-in, grouped by emoji, with whether you are in each. */
export function reactionSummary(reactions: Reaction[] | undefined, userId: string | null) {
  const byCheckIn = new Map<string, Map<ReactionEmoji, { count: number; mine: boolean }>>();
  for (const r of reactions ?? []) {
    let emojis = byCheckIn.get(r.check_in_id);
    if (!emojis) byCheckIn.set(r.check_in_id, (emojis = new Map()));
    const existing = emojis.get(r.emoji) ?? { count: 0, mine: false };
    emojis.set(r.emoji, {
      count: existing.count + 1,
      mine: existing.mine || r.user_id === userId,
    });
  }
  return byCheckIn;
}

export function useToggleReaction(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      checkInId,
      emoji,
      on,
    }: {
      checkInId: string;
      emoji: ReactionEmoji;
      on: boolean;
    }) => {
      if (on) {
        const { error } = await db()
          .from('reactions')
          .upsert(
            { check_in_id: checkInId, user_id: userId, emoji },
            { onConflict: 'check_in_id,user_id,emoji', ignoreDuplicates: true },
          );
        if (error) throw error;
      } else {
        const { error } = await db()
          .from('reactions')
        // Removing your own reaction — already-gone is success. See
        // src/lib/writes.ts.
          .delete()
          .eq('check_in_id', checkInId)
          .eq('user_id', userId!)
          .eq('emoji', emoji);
        if (error) throw error;
      }
    },
    // Optimistic, like the check-in circle: a reaction should feel instant.
    onMutate: async ({ checkInId, emoji, on }) => {
      await qc.cancelQueries({ queryKey: keys.reactions });
      const previous = qc.getQueryData<Reaction[]>(keys.reactions);
      qc.setQueryData<Reaction[]>(keys.reactions, (old = []) =>
        on
          ? [...old, { check_in_id: checkInId, user_id: userId ?? '', emoji }]
          : old.filter(
              (r) => !(r.check_in_id === checkInId && r.emoji === emoji && r.user_id === userId),
            ),
      );
      return { previous };
    },
    onError: (_e, _v, context) => {
      if (context?.previous) qc.setQueryData(keys.reactions, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.reactions }),
  });
}

// ---------------------------------------------------------------- nudges

export function useNudges() {
  return useQuery({
    queryKey: keys.nudges,
    queryFn: async (): Promise<Nudge[]> => {
      const { data, error } = await db()
        .from('nudges')
        .select('id, habit_id, from_user, to_user, nudge_day, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSendNudge(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ habitId, toUser }: { habitId: string; toUser: string }) => {
      const { error } = await db()
        .from('nudges')
        .insert({ habit_id: habitId, from_user: userId, to_user: toUser });
      if (error) {
        // The one-a-day index is the rate limit; say so in words.
        if (error.code === '23505') {
          throw new Error('You have already nudged them about this today.');
        }
        throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.nudges }),
  });
}

// ---------------------------------------------------------------- groups

export function useGroups() {
  return useQuery({
    queryKey: keys.groups,
    queryFn: async (): Promise<Group[]> => {
      const { data, error } = await db()
        .from('groups')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: keys.members(groupId ?? ''),
    enabled: !!groupId,
    queryFn: async (): Promise<GroupMember[]> => {
      const { data, error } = await db()
        .from('group_members')
        .select('group_id, user_id, role, joined_at, profile:profiles(id, username, display_name, avatar_url, timezone)')
        .eq('group_id', groupId!)
        .order('joined_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as GroupMember[];
    },
  });
}

/**
 * Members of every group you are in, in one request. The Groups list needs a
 * face and a count per group, and a hook cannot be called in a loop.
 *
 * RLS scopes this to groups you belong to, so it is the same data as
 * `useGroupMembers` for each of them, fetched once.
 */
export function useAllMembers() {
  return useQuery({
    queryKey: keys.allMembers,
    queryFn: async (): Promise<GroupMember[]> => {
      const { data, error } = await db()
        .from('group_members')
        .select(
          'group_id, user_id, role, joined_at, profile:profiles(id, username, display_name, avatar_url, timezone)',
        )
        .order('joined_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as GroupMember[];
    },
  });
}

/** Members keyed by the group they are in, preserving join order. */
export function membersByGroup(members: GroupMember[] | undefined) {
  const map = new Map<string, GroupMember[]>();
  for (const m of members ?? []) {
    const list = map.get(m.group_id) ?? [];
    list.push(m);
    map.set(m.group_id, list);
  }
  return map;
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, emoji }: { name: string; emoji?: string | null }): Promise<Group> => {
      const { data, error } = await db().rpc('create_group', {
        p_name: name,
        p_emoji: emoji ?? null,
      });
      if (error) throw error;
      return data as Group;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.groups }),
  });
}

/** What you see before committing to join: enough to recognise it, nothing more. */
export function usePreviewGroup() {
  return useMutation({
    mutationFn: async (code: string): Promise<GroupPreview | null> => {
      const { data, error } = await db().rpc('preview_group_by_code', { p_code: code });
      if (error) throw error;
      const rows = (data ?? []) as GroupPreview[];
      return rows[0] ?? null;
    },
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string): Promise<Group> => {
      const { data, error } = await db().rpc('join_group_with_code', { p_code: code });
      if (error) throw error;
      return data as Group;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.groups });
      qc.invalidateQueries({ queryKey: keys.habits });
    },
  });
}

/** Renaming and re-iconing a group. The policy allows owners only. */
export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      emoji,
    }: {
      id: string;
      name: string;
      emoji: string | null;
    }) => {
      const { data, error } = await db()
        .from('groups')
        .update({ name, emoji })
        .eq('id', id)
        .select('id');
      if (error) throw error;
      // The screen is only offered to owners, but /group/settings?id=... is a
      // plain URL on the web — any member can reach the form, fill it in and,
      // before this, be told it saved.
      assertChanged(data, 'Only the group owner can change its name.');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.groups }),
  });
}

export function useLeaveGroup(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await db()
        .from('group_members')
      // Leaving. Not being a member is exactly what was asked for, so an
      // already-left row is not a failure. See src/lib/writes.ts.
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.groups });
      qc.invalidateQueries({ queryKey: keys.habits });
    },
  });
}

export function useRotateInviteCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string): Promise<string> => {
      const { data, error } = await db().rpc('rotate_invite_code', { p_group_id: groupId });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.groups }),
  });
}

// -------------------------------------------------------------------- focus

/**
 * Tasks are private, so there is no visibility question here — RLS scopes
 * every one of these to the signed-in person and nothing else is possible.
 */
export function useTasks() {
  return useQuery({
    queryKey: keys.tasks,
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await db()
        .from('tasks')
        .select('id, user_id, group_id, title, completion, position, created_at, done_at')
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddTask(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      position,
      groupId,
      completion,
    }: {
      title: string;
      position: number;
      groupId: string | null;
      completion: TaskCompletionKind;
    }) => {
      const { error } = await db().from('tasks').insert({
        user_id: userId!,
        group_id: groupId,
        title: title.trim(),
        // Meaningless on a private task, but a column cannot be absent.
        completion: groupId ? completion : 'once',
        position,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tasks }),
  });
}

/** Every completion you are allowed to see: your own, and your groups'. */
export function useTaskCompletions() {
  return useQuery({
    queryKey: keys.taskDone,
    queryFn: async (): Promise<TaskCompletion[]> => {
      const { data, error } = await db()
        .from('task_completions')
        .select('task_id, user_id, done_at');
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Ticking a task off. Optimistic, because the tick is the whole interaction
 * and a round trip before the box fills makes the list feel broken.
 *
 * What that means depends on the task: your own row for a private or
 * "everyone" task, and for a shared "once" task, everybody's — since anyone
 * may put it back, whoever ticked it.
 */
export function useToggleTask(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      add,
      removeUsers,
    }: {
      taskId: string;
      add: boolean;
      removeUsers: string[];
    }) => {
      if (add) {
        const { error } = await db()
          .from('task_completions')
          .upsert({ task_id: taskId, user_id: userId! }, { onConflict: 'task_id,user_id' });
        if (error) throw error;
        return;
      }
      const { error } = await db()
        .from('task_completions')
        // Clearing completions — already-clear is success. See
        // src/lib/writes.ts.
        .delete()
        .eq('task_id', taskId)
        .in('user_id', removeUsers);
      if (error) throw error;
    },
    onMutate: async ({ taskId, add, removeUsers }) => {
      await qc.cancelQueries({ queryKey: keys.taskDone });
      const previous = qc.getQueryData<TaskCompletion[]>(keys.taskDone) ?? [];
      const next = add
        ? [...previous, { task_id: taskId, user_id: userId!, done_at: new Date().toISOString() }]
        : previous.filter((c) => !(c.task_id === taskId && removeUsers.includes(c.user_id)));
      qc.setQueryData<TaskCompletion[]>(keys.taskDone, next);
      return { previous };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(keys.taskDone, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.taskDone }),
  });
}

export function useRenameTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { data, error } = await db()
        .from('tasks')
        .update({ title: title.trim() })
        .eq('id', id)
        .select('id');
      if (error) throw error;
      assertChanged(data, 'That task was not renamed. It may have already been deleted.');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tasks }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await db().from('tasks').delete().eq('id', id).select('id');
      if (error) throw error;
      assertChanged(data, 'That task was not deleted. It may have already been removed.');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tasks }),
  });
}

/** Recent sessions, for "focused today" and the week's total. */
export function useFocusSessions() {
  return useQuery({
    queryKey: keys.focus,
    queryFn: async (): Promise<FocusSession[]> => {
      const { data, error } = await db()
        .from('focus_sessions')
        .select('id, user_id, task_id, started_at, minutes, created_at')
        .gte('started_at', new Date(Date.now() - 30 * 86_400_000).toISOString())
        .order('started_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * A finished stretch of focus. Only ever recorded, never edited: the policy
 * has no UPDATE, and started_at must be recent, so a quiet evening cannot
 * become a productive month after the fact.
 */
export function useRecordFocus(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      startedAt,
      minutes,
      taskId,
    }: {
      startedAt: Date;
      minutes: number;
      taskId: string | null;
    }) => {
      const { error } = await db().from('focus_sessions').insert({
        user_id: userId!,
        task_id: taskId,
        started_at: startedAt.toISOString(),
        minutes,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.focus }),
  });
}
