import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { HabitForm, emptyHabit, type HabitFormValue } from '@/components/HabitForm';
import { ModalHeader } from '@/components/ModalHeader';
import { Notice } from '@/components/Notice';
import { useAuth } from '@/auth/AuthProvider';
import { useCreateHabit, useGroups } from '@/lib/queries';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export default function NewHabitScreen() {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const router = useRouter();
  // Set when adding straight into a group, so visibility is already decided.
  const { group } = useLocalSearchParams<{ group?: string }>();

  const create = useCreateHabit(userId);
  const { data: groups } = useGroups();
  const [error, setError] = useState<string | null>(null);

  const inGroup = groups?.find((g) => g.id === group);

  async function onSubmit(value: HabitFormValue) {
    setError(null);
    try {
      await create.mutateAsync({
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
      setError(e instanceof Error ? e.message : 'Could not save the habit.');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPage }}>
      <ModalHeader
        title={inGroup ? 'New shared habit' : 'New habit'}
        eyebrow={
          inGroup
            ? `Everyone in ${inGroup.name} checks in`
            : 'Private unless you say otherwise'
        }
      />
      <HabitForm
        initial={{ ...emptyHabit, group_id: inGroup?.id ?? null }}
        submitLabel={inGroup ? 'Create shared habit' : 'Create habit'}
        busy={create.isPending}
        onSubmit={onSubmit}
        groups={groups ?? []}
        lockVisibility={!!inGroup}
        footer={
          error ? (
            <View style={styles.error}>
              <Notice label="Could not save" tone="bad">{error}</Notice>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({ error: { marginTop: spacing.card } });
