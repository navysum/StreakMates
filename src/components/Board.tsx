import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '@/theme/ThemeProvider';
import { Avatar } from './Avatar';
import { WeekLabels, WeekStrip } from './WeekStrip';
import { aggregateCells } from '@/lib/week';
import { doneKey } from '@/lib/queries';
import { space, type Theme } from '@/theme';
import type { GroupMember, Habit } from '@/lib/types';

type Props = {
  habits: Habit[];
  members: GroupMember[];
  done: Set<string>;
  date: string;
  userId: string | null;
};

/**
 * The group's week: one row per member, seven days across.
 *
 * A day fills only when that person kept everything owed that day, which is
 * the sentence under the board and the reason it answers "who is actually
 * keeping up" rather than "who ticked something". Each row reads to a screen
 * reader as one sentence: "Priya, 4 of 5 days kept this week".
 */
export function Board({ habits, members, done, date, userId }: Props) {
  const styles = useThemedStyles(makeStyles);

  const schedules = habits.map((h) => ({
    id: h.id,
    schedule: {
      cadence: h.cadence,
      targetDays: h.target_days,
      targetPerWeek: h.target_per_week,
    },
    startsOn: h.created_at.slice(0, 10),
  }));

  const rows = members
    .map((member) => {
      const cells = aggregateCells(
        date,
        schedules,
        (habitId, day) => done.has(doneKey(habitId, member.user_id, day)),
        date,
        member.joined_at.slice(0, 10),
      );
      const owed = cells.filter((c) => c.state !== 'off').length;
      const kept = cells.filter((c) => c.state === 'done').length;
      return { member, cells, kept, owed, rate: owed > 0 ? kept / owed : 0 };
    })
    // By each member's own rate, then by days kept — so the board is a
    // standing, not a roll call.
    .sort((a, b) => b.rate - a.rate || b.kept - a.kept);

  if (members.length === 0) {
    return <Text style={styles.none}>Nobody has joined yet.</Text>;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.nameCol} />
        <WeekLabels flex />
      </View>

      {rows.map(({ member, cells, kept, owed }) => {
        const you = member.user_id === userId;
        const name = member.profile?.display_name ?? 'Someone';
        // First names: the column is narrow, and a surname cut to "Alex M…"
        // says less than "Alex" does.
        const short = name.split(/\s+/)[0] || name;
        return (
          <View
            key={member.user_id}
            style={styles.row}
            accessible
            accessibilityLabel={`${you ? 'You' : name}, ${kept} of ${owed} ${owed === 1 ? 'day' : 'days'} kept this week`}
          >
            <View style={styles.nameCol}>
              <Avatar name={name} size={24} />
              <Text numberOfLines={1} style={[styles.name, you && styles.you]}>
                {short}
              </Text>
            </View>
            <WeekStrip cells={cells} size={16} flex />
          </View>
        );
      })}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { gap: space.sm },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    nameCol: { width: 92, flexDirection: 'row', alignItems: 'center', gap: space.sm },
    name: { ...t.type.caption, color: t.colors.inkSoft, flex: 1, minWidth: 0 },
    you: { color: t.colors.ink, fontFamily: t.fonts.uiMedium },
    none: { ...t.type.italic, color: t.colors.inkMuted },
  });
