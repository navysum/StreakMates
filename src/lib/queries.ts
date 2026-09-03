import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { addDays, toLocalDate } from './date';
import type { CheckIn, Group, GroupMember, GroupPreview, Habit, Profile } from './types';

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
};

// ---------------------------------------------------------------- profile

export function useProfile(userId: string | null) {
  return useQuery({
    queryKey: keys.profile,
    enabled: !!userId,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await db()
        .from('profiles')
        .select('id, display_name, avatar_url, timezone')
        .eq('id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
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
      const { data, error } = await q
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
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
  Partial<Pick<Habit, 'emoji' | 'color' | 'cadence' | 'target_days' | 'target_per_week' | 'group_id' | 'sort_order'>>;

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
      const { error } = await db().from('habits').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.habits }),
  });
}

/** Archiving keeps every check-in and the streak record. Prefer it to deleting. */
export function useSetArchived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await db()
        .from('habits')
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.habits }),
  });
}

/** Destroys the habit and every check-in against it. Not reversible. */
export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db().from('habits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.habits });
      qc.invalidateQueries({ queryKey: keys.checkIns });
    },
  });
}

export function useReorderHabits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      // Sequential rather than upsert: upsert would need every non-null column.
      for (let i = 0; i < orderedIds.length; i++) {
        const { error } = await db()
          .from('habits')
          .update({ sort_order: i })
          .eq('id', orderedIds[i]);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.habits }),
  });
}

// ---------------------------------------------------------------- check-ins

export function useCheckIns() {
  return useQuery({
    queryKey: keys.checkIns,
    queryFn: async (): Promise<CheckIn[]> => {
      const { data, error } = await db()
        .from('check_ins')
        .select('id, habit_id, user_id, local_date, note')
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
 * Keeps the board live: a friend's tick appears without a refresh.
 *
 * Row-level security applies to these events too, so nothing arrives that the
 * viewer could not already have read.
 */
export function useRealtimeCheckIns() {
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
      if (complete) {
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
          .delete()
          .eq('habit_id', habitId)
          .eq('user_id', userId!)
          .eq('local_date', date);
        if (error) throw error;
      }
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
              },
              ...old,
            ]
          : old.filter(
              (c) => !(c.habit_id === habitId && c.local_date === date && c.user_id === userId),
            ),
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(keys.checkIns, context.previous);
    },

    onSettled: () => qc.invalidateQueries({ queryKey: keys.checkIns }),
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
        .select('group_id, user_id, role, joined_at, profile:profiles(id, display_name, avatar_url, timezone)')
        .eq('group_id', groupId!)
        .order('joined_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as GroupMember[];
    },
  });
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
      const { error } = await db().from('groups').update({ name, emoji }).eq('id', id);
      if (error) throw error;
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
