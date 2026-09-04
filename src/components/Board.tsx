import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Avatar } from './Avatar';
import { WeekLabels, WeekStrip } from './WeekStrip';
import { aggregateCells } from '@/lib/week';
import { doneKey } from '@/lib/queries';
import { space, typography } from '@/theme/tokens';
import type { GroupMember, Habit } from '@/lib/types';

type Props = {
  habits: Habit[];
  members: GroupMember[];
  done: Set<string>;
  date: string;
};

/**
 * The group's week: one row per member, seven cells across.
 *
 * A cell is filled only when that person kept everything owed that day, so the
 * board answers "who is actually keeping up" rather than "who ticked something".
 * Members are ordered by how much of the week they have kept.
 */
export function Board({ habits, members, done, date }: Props) {
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
      return { member, cells, kept: cells.filter((c) => c.state === 'done').length };
    })
    .sort((a, b) => b.kept - a.kept);

  if (members.length === 0) {
    return (
      <Text style={[typography.caption, { color: colors.textMuted }]}>
        Nobody has joined yet.
      </Text>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <View style={styles.nameCol} />
        <WeekLabels />
      </View>

      {rows.map(({ member, cells }) => (
        <View key={member.user_id} style={styles.row}>
          <View style={styles.nameCol}>
            <Avatar
              id={member.user_id}
              name={member.profile?.display_name ?? '?'}
              size={24}
            />
            <Text
              numberOfLines={1}
              style={[typography.caption, styles.name, { color: colors.textPrimary }]}
            >
              {member.profile?.display_name ?? 'Someone'}
            </Text>
          </View>
          <WeekStrip cells={cells} size={16} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 32 },
  nameCol: { width: 96, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  name: { flex: 1, minWidth: 0 },
});
