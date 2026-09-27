import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui';
import { HabitForm, type HabitFormValue } from '@/components/HabitForm';
import { ModalScreen } from '@/components/ModalScreen';
import { Notice } from '@/components/Notice';
import { TextAction } from '@/components/TextAction';
import { useAuth } from '@/auth/AuthProvider';
import {
  byHabit,
  useCheckIns,
  useDeleteHabit,
  useGroups,
  useHabit,
  useSetArchived,
  useUpdateHabit,
} from '@/lib/queries';
import { confirm } from '@/lib/confirm';
import { toLocalDate } from '@/lib/date';
import { describeProgress } from '@/lib/streak';
import { useTheme } from '@/theme/ThemeProvider';

export default function EditHabitScreen() {
  const t = useTheme();
  const { userId } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const habitQuery = useHabit(id);
  const checkIns = useCheckIns();
  const { data: groups } = useGroups();
  const update = useUpdateHabit();
  const setArchived = useSetArchived();
  const remove = useDeleteHabit();
  const [error, setError] = useState<string | null>(null);

  const habit = habitQuery.data;
  const dates = useMemo(
    () => byHabit(checkIns.data, userId).get(id ?? '') ?? new Set<string>(),
    [checkIns.data, userId, id],
  );

  if (habitQuery.isLoading) {
    return (
      <ModalScreen title="Habit">
        <ActivityIndicator style={styles.loader} color={t.colors.inkMuted} />
      </ModalScreen>
    );
  }

  // Loading and gone are different answers — see the note in habit/[id].tsx.
  if (!habit) {
    return (
      <ModalScreen title="Habit" eyebrow="Not found">
        <Notice label="Gone">
          {'This habit no longer exists. It may have been deleted here or on another device.'}
        </Notice>
        <Button title="Back to Today" variant="outline" onPress={() => router.replace('/')} />
      </ModalScreen>
    );
  }

  const initial: HabitFormValue = {
    title: habit.title,
    emoji: habit.emoji ?? '',
    color: habit.color,
    cadence: habit.cadence,
    target_days: habit.target_days.length ? habit.target_days : [1, 2, 3, 4, 5, 6, 7],
    target_per_week: habit.target_per_week,
    group_id: habit.group_id,
    reminder_at: habit.reminder_at ? habit.reminder_at.slice(0, 5) : '',
  };

  async function save(value: HabitFormValue) {
    setError(null);
    try {
      await update.mutateAsync({
        id: habit!.id,
        title: value.title,
        emoji: value.emoji.trim() || null,
        color: value.color,
        cadence: value.cadence,
        target_days: value.cadence === 'days' ? value.target_days : [],
        target_per_week: value.target_per_week,
        group_id: value.group_id,
        reminder_at: value.reminder_at ? `${value.reminder_at}:00` : null,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The habit could not be saved.');
    }
  }

  async function onSubmit(value: HabitFormValue) {
    const goingPublic = !habit!.group_id && value.group_id;
    if (!goingPublic) return void save(value);

    // Sharing cannot be un-seen, so it is never a silent side effect of Save.
    const group = groups?.find((g) => g.id === value.group_id);
    const yes = await confirm({
      title: 'Share this habit?',
      message: `Everyone in ${group?.name ?? 'the group'} will see ${habit!.title}, including the ${dates.size} check-in${dates.size === 1 ? '' : 's'} already against it. You can make it private again, but they will have seen it.`,
      confirmLabel: 'Share it',
      cancelLabel: 'Keep it private',
    });
    if (yes) await save(value);
  }

  async function confirmDelete() {
    const count = dates.size;
    const yes = await confirm({
      title: `Delete ${habit!.title}?`,
      message:
        count > 0
          ? `This deletes the habit and all ${count} check-in${count === 1 ? '' : 's'} against it. It cannot be undone — archiving keeps the history instead.`
          : 'This deletes the habit. It cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!yes) return;

    try {
      await remove.mutateAsync(habit!.id);
      // Not router.back(). Back is the detail screen for the habit that was
      // just deleted — a tombstone of the thing you asked to be rid of. Go to
      // the list it was in instead.
      if (router.canDismiss()) router.dismissTo('/');
      else router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The habit could not be deleted.');
    }
  }

  const archived = !!habit.archived_at;

  return (
    <ModalScreen
      title="Edit habit"
      eyebrow={describeProgress(
        {
          cadence: habit.cadence,
          targetDays: habit.target_days,
          targetPerWeek: habit.target_per_week,
        },
        dates,
        toLocalDate(),
      )}
    >
      <HabitForm
        initial={initial}
        submitLabel="Save changes"
        busy={update.isPending}
        onSubmit={(v) => void onSubmit(v)}
        groups={groups ?? []}
        footer={
          <>
            {error ? <Notice label="Something went wrong">{error}</Notice> : null}
            <Button
              title={archived ? 'Restore habit' : 'Archive habit'}
              variant="outline"
              loading={setArchived.isPending}
              onPress={() =>
                setArchived.mutate(
                  { id: habit.id, archived: !archived },
                  { onSuccess: () => router.back() },
                )
              }
            />
            <Notice label="Archive keeps everything">
              {'Archiving takes the habit off Today but keeps every check-in and its longest run, and you can restore it in one tap. Deleting destroys the history.'}
            </Notice>
            {/* There is no destructive colour in this system, so the weight of
                this action is carried by the confirmation — and a warning
                haptic as it appears — not by a red button. It is a quiet
                word in muted ink: in Washi the accent is red, and in LifeOS
                it is green, and neither should say "delete". */}
            <TextAction
              title={remove.isPending ? 'Deleting…' : 'Delete habit'}
              tone="muted"
              onPress={() => void confirmDelete()}
              style={styles.start}
            />
          </>
        }
      />
    </ModalScreen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  start: { alignSelf: 'flex-start' },
});
