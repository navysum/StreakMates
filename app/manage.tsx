import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Pill } from '@/components/Pill';
import { ModalHeader } from '@/components/ModalHeader';
import { useHabits, useReorderHabits, useSetArchived } from '@/lib/queries';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme/tokens';
import type { Habit } from '@/lib/types';

function cadenceLabel(h: Habit): string {
  if (h.cadence === 'daily') return 'Daily';
  if (h.cadence === 'weekly') return `${h.target_per_week}× / wk`;
  const names = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return h.target_days.map((d) => names[d - 1]).join(' ');
}

export default function ManageScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const all = useHabits(true);
  const reorder = useReorderHabits();
  const setArchived = useSetArchived();
  const [error, setError] = useState<string | null>(null);

  const active = useMemo(() => (all.data ?? []).filter((h) => !h.archived_at), [all.data]);
  const archived = useMemo(() => (all.data ?? []).filter((h) => h.archived_at), [all.data]);

  function move(index: number, delta: number) {
    const next = [...active];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(
      next.map((h) => h.id),
      { onError: (e) => setError(e instanceof Error ? e.message : 'Could not reorder.') },
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPage }}>
      <ModalHeader title="Manage habits" eyebrow="Reorder, archive, restore" />
      <ScrollView contentContainerStyle={styles.body}>
        {error ? <Notice label="Something went wrong" tone="bad">{error}</Notice> : null}

        {all.isLoading ? (
          <ActivityIndicator style={styles.loader} color={colors.textMuted} />
        ) : (
          <>
            <Card title="Active" action={`${active.length}`}>
              {active.length === 0 ? (
                <Text style={[typography.body, styles.none, { color: colors.textMuted }]}>
                  Nothing active. Add a habit from Today.
                </Text>
              ) : (
                active.map((habit, i) => (
                  <View
                    key={habit.id}
                    style={[
                      styles.row,
                      {
                        borderBottomColor: colors.borderDefault,
                        borderBottomWidth: i === active.length - 1 ? 0 : 1,
                      },
                    ]}
                  >
                    <View style={styles.arrows}>
                      <Pressable
                        onPress={() => move(i, -1)}
                        disabled={i === 0}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Move ${habit.title} up`}
                      >
                        <Text
                          style={[
                            typography.monoSmall,
                            { color: i === 0 ? colors.borderStrong : colors.textMuted },
                          ]}
                        >
                          ▲
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => move(i, 1)}
                        disabled={i === active.length - 1}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Move ${habit.title} down`}
                      >
                        <Text
                          style={[
                            typography.monoSmall,
                            {
                              color:
                                i === active.length - 1 ? colors.borderStrong : colors.textMuted,
                            },
                          ]}
                        >
                          ▼
                        </Text>
                      </Pressable>
                    </View>

                    <Pressable
                      style={styles.name}
                      onPress={() => router.push(`/habit/${habit.id}`)}
                      accessibilityRole="button"
                    >
                      <Text
                        numberOfLines={1}
                        style={[typography.rowName, { color: colors.textPrimary }]}
                      >
                        {habit.emoji ? `${habit.emoji}  ${habit.title}` : habit.title}
                      </Text>
                    </Pressable>

                    <Pill label={cadenceLabel(habit)} />

                    <Pressable
                      onPress={() => setArchived.mutate({ id: habit.id, archived: true })}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Archive ${habit.title}`}
                    >
                      <Pill label="Archive" tone="warn" />
                    </Pressable>
                  </View>
                ))
              )}
            </Card>

            {archived.length > 0 ? (
              <Card title="Archived" action={`${archived.length}`}>
                {archived.map((habit, i) => (
                  <View
                    key={habit.id}
                    style={[
                      styles.row,
                      {
                        borderBottomColor: colors.borderDefault,
                        borderBottomWidth: i === archived.length - 1 ? 0 : 1,
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[typography.rowName, styles.name, { color: colors.textMuted }]}
                    >
                      {habit.emoji ? `${habit.emoji}  ${habit.title}` : habit.title}
                    </Text>
                    <Pressable
                      onPress={() => setArchived.mutate({ id: habit.id, archived: false })}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Restore ${habit.title}`}
                    >
                      <Pill label="Restore" tone="good" />
                    </Pressable>
                  </View>
                ))}
              </Card>
            ) : null}

            <Notice label="Two different things">
              {'Archiving keeps every check-in and the streak record, and restores in one tap. Deleting destroys the history — it lives on the habit’s own screen, behind a confirmation.'}
            </Notice>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.page, gap: spacing.card },
  loader: { marginTop: 32 },
  row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 9 },
  arrows: { gap: 1 },
  name: { flex: 1, minWidth: 0 },
  none: { paddingVertical: 8 },
});
