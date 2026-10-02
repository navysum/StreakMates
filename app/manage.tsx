import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ModalScreen } from '@/components/ModalScreen';
import { Notice } from '@/components/Notice';
import { Row } from '@/components/Row';
import { Section } from '@/components/Section';
import { TextAction } from '@/components/TextAction';
import { useAuth } from '@/auth/AuthProvider';
import { useGroups, useHabitOrder, useHabits, useReorderHabits, useSetArchived } from '@/lib/queries';
import { reorder, sortHabits } from '@/lib/ordering';
import { useTheme, useThemedStyles } from '@/theme/ThemeProvider';
import { space, type Theme } from '@/theme';
import type { Habit } from '@/lib/types';

function cadenceLabel(h: Habit): string {
  if (h.cadence === 'daily') return 'Every day';
  if (h.cadence === 'weekly') return `${h.target_per_week} times a week`;
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return h.target_days.map((d) => names[d - 1]).join(', ');
}

export default function ManageScreen() {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
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
      onError: (e) => setError(e instanceof Error ? e.message : 'The new order could not be saved.'),
    });
  }

  return (
    <ModalScreen title="Manage habits" eyebrow="Reorder, archive, restore">
      {error ? <Notice label="Something went wrong">{error}</Notice> : null}

      {all.isLoading ? (
        <ActivityIndicator style={styles.loader} color={t.colors.inkMuted} />
      ) : (
        <>
          {lists.length === 0 ? (
            <Notice label="Nothing active">{'Add a habit from Today and it appears here.'}</Notice>
          ) : (
            lists.map((list) => (
              <Section key={list.key} label={list.title} action={`${list.habits.length}`} list>
                {list.habits.map((habit, i) => (
                  <Row key={habit.id} last={i === list.habits.length - 1} style={styles.row}>
                    <View style={styles.arrows}>
                      <Arrow
                        label={`Move ${habit.title} up`}
                        glyph="↑"
                        disabled={i === 0}
                        onPress={() => move(list.habits, i, -1)}
                      />
                      <Arrow
                        label={`Move ${habit.title} down`}
                        glyph="↓"
                        disabled={i === list.habits.length - 1}
                        onPress={() => move(list.habits, i, 1)}
                      />
                    </View>

                    <Pressable
                      style={({ pressed }) => [styles.name, pressed && styles.pressed]}
                      onPress={() => router.push(`/habit/${habit.id}`)}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${habit.title}, ${cadenceLabel(habit)}`}
                    >
                      <Text numberOfLines={1} style={styles.title}>
                        {habit.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.meta}>
                        {cadenceLabel(habit)}
                      </Text>
                    </Pressable>

                    <TextAction
                      title="Archive"
                      tone="muted"
                      accessibilityLabel={`Archive ${habit.title}`}
                      onPress={() => setArchived.mutate({ id: habit.id, archived: true })}
                    />
                  </Row>
                ))}
              </Section>
            ))
          )}

          {archived.length > 0 ? (
            <Section label="Archived" action={`${archived.length}`} list>
              {archived.map((habit, i) => (
                <Row key={habit.id} last={i === archived.length - 1}>
                  <Text numberOfLines={1} style={[styles.title, styles.muted, styles.grow]}>
                    {habit.title}
                  </Text>
                  <TextAction
                    title="Restore"
                    accessibilityLabel={`Restore ${habit.title}`}
                    onPress={() => setArchived.mutate({ id: habit.id, archived: false })}
                  />
                </Row>
              ))}
            </Section>
          ) : null}

          <Notice label="Your order, not theirs">
            {'Each list is arranged separately, and only for you. Moving a shared habit changes where it sits in your list — the rest of the group keep their own.'}
          </Notice>

          <Notice label="Two different things">
            {'Archiving keeps every check-in and the longest run, and restores in one tap. Deleting destroys the history — it lives on the habit’s edit screen, behind a confirmation.'}
          </Notice>
        </>
      )}
    </ModalScreen>
  );
}

/**
 * A 44pt square for each arrow. These used to be bare glyphs with hitSlop,
 * which react-native-web ignores, so in a browser they were 14px targets.
 */
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
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}
    >
      <Text style={[styles.glyph, disabled && styles.off]}>{glyph}</Text>
    </Pressable>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    loader: { marginTop: space.xl },
    row: { gap: space.sm, paddingVertical: space.sm },
    arrows: { flexDirection: 'row' },
    arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    glyph: { fontFamily: t.fonts.ui, fontSize: 18, color: t.colors.inkSoft },
    off: { color: t.colors.inkFaint },
    name: { flex: 1, minWidth: 0, justifyContent: 'center', minHeight: 44 },
    title: { ...t.type.row, color: t.colors.ink },
    meta: { ...t.type.italic, color: t.colors.inkMuted },
    muted: { color: t.colors.inkMuted },
    grow: { flex: 1, minWidth: 0 },
    pressed: { opacity: 0.6 },
  });
