import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { HabitForm, emptyHabit, type HabitFormValue } from '@/components/HabitForm';
import { ModalHeader } from '@/components/ModalHeader';
import { Notice } from '@/components/Notice';
import { useAuth } from '@/auth/AuthProvider';
import { useCreateHabit, useHabits } from '@/lib/queries';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export default function NewHabitScreen() {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const router = useRouter();
  const create = useCreateHabit(userId);
  const { data: habits } = useHabits();
  const [error, setError] = useState<string | null>(null);

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
        // New habits go to the bottom of the list.
        sort_order: habits?.length ?? 0,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the habit.');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPage }}>
      <ModalHeader title="New habit" eyebrow="Private — only you will see it" />
      <HabitForm
        initial={emptyHabit}
        submitLabel="Create habit"
        busy={create.isPending}
        onSubmit={onSubmit}
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
