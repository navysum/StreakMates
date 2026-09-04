import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { StatusDot } from './StatusDot';
import { initial } from '@/lib/identity';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/tokens';
import { doneKey } from '@/lib/queries';
import type { GroupMember, Habit } from '@/lib/types';

const MEMBER_COLORS = ['green', 'amber', 'blue', 'purple', 'teal', 'coral'] as const;

type Props = {
  habits: Habit[];
  members: GroupMember[];
  done: Set<string>;
  date: string;
};

/**
 * Habits down, people across. The empty rings are the point — that is what
 * everyone can see.
 */
export function Board({ habits, members, done, date }: Props) {
  const { colors } = useTheme();

  if (habits.length === 0) {
    return (
      <Text style={[typography.body, styles.empty, { color: colors.textMuted }]}>
        No shared habits yet. Add one and everyone in the group checks in against it.
      </Text>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pad}>
      <View>
        <View style={[styles.row, styles.head, { borderBottomColor: colors.borderDefault }]}>
          <Text style={[typography.label, styles.label, { color: colors.textMuted }]}>Habit</Text>
          {members.map((m, i) => (
            <View
              key={m.user_id}
              style={[
                styles.cell,
                styles.avatar,
                { backgroundColor: colors[MEMBER_COLORS[i % MEMBER_COLORS.length]] },
              ]}
            >
              <Text style={styles.initial}>{initial(m.profile)}</Text>
            </View>
          ))}
        </View>

        {habits.map((habit, i) => (
          <View
            key={habit.id}
            style={[
              styles.row,
              {
                borderBottomColor: colors.borderDefault,
                borderBottomWidth: i === habits.length - 1 ? 0 : 1,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[typography.rowName, styles.label, { color: colors.textPrimary }]}
            >
              {habit.emoji ? `${habit.emoji}  ${habit.title}` : habit.title}
            </Text>
            {members.map((m) => (
              <View key={m.user_id} style={styles.cell}>
                <StatusDot size="sm" complete={done.has(doneKey(habit.id, m.user_id, date))} />
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { paddingRight: 4 },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12 },
  head: { minHeight: 36, borderBottomWidth: 1 },
  label: { width: 144 },
  cell: { width: 32, alignItems: 'center', justifyContent: 'center' },
  avatar: { height: 28, borderRadius: 14 },
  initial: { fontFamily: 'DMSans-Bold', fontSize: 12, color: '#fff' },
  empty: { paddingVertical: 12 },
});
