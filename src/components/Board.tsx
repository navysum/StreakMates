import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Avatar } from './Avatar';
import { WeekLabels, WeekStrip } from './WeekStrip';
import { aggregateCells } from '@/lib/week';
import { doneKey } from '@/lib/queries';
import { ink, space, typography } from '@/theme/tokens';
import type { GroupMember, Habit } from '@/lib/types';

type Props = {
  habits: Habit[];
  members: GroupMember[];
  done: Set<string>;
  date: string;
  userId: string | null;
};

/**
 * The group's week: one row per member, seven cells across.
 *
 * A square fills only when that person kept everything owed that day, which is
 * the sentence under the plate and the reason the board answers "who is
 * actually keeping up" rather than "who ticked something".
 */
export function Board({ habits, members, done, date, userId }: Props) {
  const { colors } = useTheme();

  const schedules = habits.map((h) => ({
    id: h.id,
    schedule: {
      cadence: h.cadence,
      targetDays: h.target_days,
      targetPerWeek: h.target_per_week,
    },
  }));

  const rows = members
    .map((member) => {
      const cells = aggregateCells(
        date,
        schedules,
        (habitId, day) => done.has(doneKey(habitId, member.user_id, day)),
        date,
      );
      const owed = cells.filter((c) => c.state !== 'off').length;
      const kept = cells.filter((c) => c.state === 'done').length;
      return { member, cells, kept, rate: owed > 0 ? kept / owed : 0 };
    })
    // By each member's own rate, then by days kept — so the board is a
    // standing, not a roll call.
    .sort((a, b) => b.rate - a.rate || b.kept - a.kept);

  if (members.length === 0) {
    return (
      <Text style={[typography.caption, { color: ink(colors, 70) }]}>Nobody has joined yet.</Text>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <View style={styles.nameCol} />
        <WeekLabels flex />
      </View>

      {rows.map(({ member, cells }) => {
        const you = member.user_id === userId;
        return (
          <View key={member.user_id} style={styles.row}>
            <View style={styles.nameCol}>
              <Avatar name={member.profile?.display_name ?? '?'} size={22} />
              <Text
                numberOfLines={1}
                style={[typography.caption, styles.name, { color: you ? colors.text : ink(colors, 70) }]}
              >
                {member.profile?.display_name ?? 'Someone'}
              </Text>
            </View>
            <WeekStrip cells={cells} size={16} flex />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  nameCol: { width: 76, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  name: { flex: 1, minWidth: 0 },
});
