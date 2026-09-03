import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { HabitForm, type HabitFormValue } from '@/components/HabitForm';
import { ModalHeader } from '@/components/ModalHeader';
import { Notice } from '@/components/Notice';
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
import { toLocalDate } from '@/lib/date';
import { describeProgress } from '@/lib/streak';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export default function EditHabitScreen() {
  const { colors } = useTheme();
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

  if (habitQuery.isLoading || !habit) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgPage }}>
        <ModalHeader title="Habit" />
        <ActivityIndicator style={styles.loader} color={colors.textMuted} />
      </View>
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
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the habit.');
    }
  }

  function onSubmit(value: HabitFormValue) {
    const goingPublic = !habit!.group_id && value.group_id;
    if (!goingPublic) return void save(value);

    // Sharing cannot be un-seen, so it is never a silent side effect of Save.
    const group = groups?.find((g) => g.id === value.group_id);
    Alert.alert(
      'Share this habit?',
      `Everyone in ${group?.name ?? 'the group'} will see ${habit!.title}, including the ${dates.size} check-in${dates.size === 1 ? '' : 's'} already against it. You can make it private again, but they will have seen it.`,
      [
        { text: 'Keep private', style: 'cancel' },
        { text: 'Share it', onPress: () => void save(value) },
      ],
    );
  }

  function confirmDelete() {
    const count = dates.size;
    Alert.alert(
      `Delete ${habit!.title}?`,
      count > 0
        ? `This deletes the habit and all ${count} check-in${count === 1 ? '' : 's'} against it. It cannot be undone — archiving keeps the history instead.`
        : 'This deletes the habit. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove.mutateAsync(habit!.id);
              router.back();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Could not delete the habit.');
            }
          },
        },
      ],
    );
  }

  const archived = !!habit.archived_at;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPage }}>
      <ModalHeader
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
      />
      <HabitForm
        initial={initial}
        submitLabel="Save changes"
        busy={update.isPending}
        onSubmit={onSubmit}
        groups={groups ?? []}
        footer={
          <View style={styles.footer}>
            {error ? <Notice label="Something went wrong" tone="bad">{error}</Notice> : null}
            <Button
              label={archived ? 'Restore habit' : 'Archive habit'}
              busy={setArchived.isPending}
              onPress={() =>
                setArchived.mutate(
                  { id: habit.id, archived: !archived },
                  { onSuccess: () => router.back() },
                )
              }
            />
            <Notice label="Archive keeps everything">
              {'Archiving drops the habit off Today but keeps every check-in and the streak record, and you can restore it in one tap. Deleting destroys the history.'}
            </Notice>
            <Button
              label="Delete habit"
              variant="danger"
              busy={remove.isPending}
              onPress={confirmDelete}
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  footer: { gap: spacing.card, marginTop: spacing.section },
});
