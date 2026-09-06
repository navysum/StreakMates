import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Plate } from '@/components/Plate';
import { Notice } from '@/components/Notice';
import { Tag } from '@/components/Tag';
import { ModalHeader } from '@/components/ModalHeader';
import { useAuth } from '@/auth/AuthProvider';
import { useGroups, useHabitOrder, useHabits, useReorderHabits, useSetArchived } from '@/lib/queries';
import { reorder, sortHabits } from '@/lib/ordering';
import { useTheme } from '@/theme/ThemeProvider';
import { ink, space, spacing, typography } from '@/theme/tokens';
import type { Habit } from '@/lib/types';

function cadenceLabel(h: Habit): string {
  if (h.cadence === 'daily') return 'Daily';
  if (h.cadence === 'weekly') return `${h.target_per_week}× / wk`;
  const names = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return h.target_days.map((d) => names[d - 1]).join(' ');
}

export default function ManageScreen() {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const router = useRouter();

  const all = useHabits(true);
  const groups = useGroups();
  const order = useHabitOrder(userId);
  const save = useReorderHabits(userId);
  const setArchived = useSetArchived();
  const [error, setError] = useState<string | null>(null);

  const positions = order.data ?? new Map<string, number>();
  const active = useMemo(() => (all.data ?? []).filter((h) => !h.archived_at), [all.data]);
  const archived = useMemo(() => (all.data ?? []).filter((h) => h.archived_at), [all.data]);

  /**
   * One reorderable list per place habits actually appear: your private ones,
   * then each group. They are numbered separately, so moving a private habit
   * cannot disturb a group's list.
   */
  const lists = useMemo(() => {
    const mine = sortHabits(active.filter((h) => !h.group_id), positions);
    const byGroup = (groups.data ?? []).map((group) => ({
      key: group.id,
      title: group.name,
      habits: sortHabits(active.filter((h) => h.group_id === group.id), positions),
    }));
    return [{ key: 'private', title: 'Private', habits: mine }, ...byGroup].filter(
      (list) => list.habits.length > 0,
    );
  }, [active, groups.data, positions]);

  function move(habits: Habit[], index: number, delta: number) {
    const ids = habits.map((h) => h.id);
    const next = reorder(ids, index, index + delta);
    if (next === ids) return;
    save.mutate(next, {
      onError: (e) => setError(e instanceof Error ? e.message : 'Could not reorder.'),
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ModalHeader title="Manage habits" eyebrow="Reorder, archive, restore" />
      <ScrollView contentContainerStyle={styles.body}>
        {error ? <Notice label="Something went wrong">{error}</Notice> : null}

        {all.isLoading ? (
          <ActivityIndicator style={styles.loader} color={ink(colors, 60)} />
        ) : (
          <>
            {lists.length === 0 ? (
              <Plate>
                <Text style={[typography.body, styles.none, { color: ink(colors, 70) }]}>
                  Nothing active. Add a habit from Today.
                </Text>
              </Plate>
            ) : (
              lists.map((list) => (
                <Plate key={list.key} label={list.title} action={`${list.habits.length}`}>
                  {list.habits.map((habit, i) => (
                    <View
                      key={habit.id}
                      style={[
                        styles.row,
                        {
                          borderBottomColor: colors.divider,
                          borderBottomWidth: i === list.habits.length - 1 ? 0 : 1,
                        },
                      ]}
                    >
                      <View style={styles.arrows}>
                        <Arrow
                          label={`Move ${habit.title} up`}
                          glyph="▲"
                          disabled={i === 0}
                          onPress={() => move(list.habits, i, -1)}
                        />
                        <Arrow
                          label={`Move ${habit.title} down`}
                          glyph="▼"
                          disabled={i === list.habits.length - 1}
                          onPress={() => move(list.habits, i, 1)}
                        />
                      </View>

                      <Pressable
                        style={styles.name}
                        onPress={() => router.push(`/habit/${habit.id}`)}
                        accessibilityRole="button"
                      >
                        <Text
                          numberOfLines={1}
                          style={[typography.body, { color: colors.text }]}
                        >
                          {habit.title}
                        </Text>
                      </Pressable>

                      <Tag label={cadenceLabel(habit)} variant="outline" />

                      <Pressable
                        onPress={() => setArchived.mutate({ id: habit.id, archived: true })}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Archive ${habit.title}`}
                      >
                        <Tag label="Archive" variant="outline" />
                      </Pressable>
                    </View>
                  ))}
                </Plate>
              ))
            )}

            {archived.length > 0 ? (
              <Plate label="Archived" action={`${archived.length}`}>
                {archived.map((habit, i) => (
                  <View
                    key={habit.id}
                    style={[
                      styles.row,
                      {
                        borderBottomColor: colors.divider,
                        borderBottomWidth: i === archived.length - 1 ? 0 : 1,
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[typography.body, styles.name, { color: ink(colors, 55) }]}
                    >
                      {habit.title}
                    </Text>
                    <Pressable
                      onPress={() => setArchived.mutate({ id: habit.id, archived: false })}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Restore ${habit.title}`}
                    >
                      <Tag label="Restore" />
                    </Pressable>
                  </View>
                ))}
              </Plate>
            ) : null}

            <Notice label="Your order, not theirs">
              {'Each list is arranged separately and only for you. Moving a shared habit changes where it sits in your list — the rest of the group keep their own.'}
            </Notice>

            <Notice label="Two different things">
              {'Archiving keeps every check-in and the streak record, and restores in one tap. Deleting destroys the history — it lives on the habit’s own screen, behind a confirmation.'}
            </Notice>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Arrow({
  label,
  glyph,
  disabled,
  onPress,
}: {
  label: string;
  glyph: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={8} accessibilityRole="button" accessibilityLabel={label}>
      <Text
        style={[typography.labelSmall, { color: ink(colors, disabled ? 30 : 70) }]}
      >
        {glyph}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.page, gap: spacing.section, paddingBottom: spacing.bottom + space.xxl },
  loader: { marginTop: 32 },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: space.md },
  arrows: { gap: 2 },
  name: { flex: 1, minWidth: 0 },
  none: { paddingVertical: space.sm },
});
