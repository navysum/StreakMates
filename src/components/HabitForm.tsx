import { useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';
import { Choice } from './Choice';
import { Field, FieldRow } from './Field';
import { Segmented } from './Segmented';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, typography } from '@/theme/tokens';
import { WEEKDAY_LABELS } from '@/lib/date';
import type { Cadence, HabitColor } from '@/lib/types';

const COLORS: HabitColor[] = ['green', 'amber', 'blue', 'purple', 'teal', 'coral'];

export type HabitFormValue = {
  title: string;
  emoji: string;
  color: HabitColor;
  cadence: Cadence;
  target_days: number[];
  target_per_week: number;
  /** null = private. A group id makes it shared with that group. */
  group_id: string | null;
};

export const emptyHabit: HabitFormValue = {
  title: '',
  emoji: '',
  color: 'green',
  cadence: 'daily',
  target_days: [1, 2, 3, 4, 5, 6, 7],
  target_per_week: 3,
  // Private by default. Sharing is always a deliberate act.
  group_id: null,
};

type Props = {
  initial?: HabitFormValue;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (value: HabitFormValue) => void;
  footer?: React.ReactNode;
  /** Groups this habit could be shared with. */
  groups?: { id: string; name: string; emoji: string | null }[];
  /** Locks visibility — used when adding straight into a group. */
  lockVisibility?: boolean;
};

/**
 * One form for creating and editing, so there is only one to build and one to
 * learn. Only the name is required — everything else has a working default.
 */
export function HabitForm({
  initial,
  submitLabel,
  busy,
  onSubmit,
  footer,
  groups = [],
  lockVisibility,
}: Props) {
  const { colors } = useTheme();
  const [value, setValue] = useState<HabitFormValue>(initial ?? emptyHabit);

  const set = <K extends keyof HabitFormValue>(key: K, v: HabitFormValue[K]) =>
    setValue((prev) => ({ ...prev, [key]: v }));

  const toggleDay = (day: number) =>
    setValue((prev) => ({
      ...prev,
      target_days: prev.target_days.includes(day)
        ? prev.target_days.filter((d) => d !== day)
        : [...prev.target_days, day].sort((a, b) => a - b),
    }));

  const canSubmit = value.title.trim().length > 0 && !busy;

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Card>
        <Field
          label="Name"
          value={value.title}
          onChangeText={(t) => set('title', t)}
          placeholder="Morning run"
          autoFocus={!initial}
          maxLength={80}
          returnKeyType="done"
        />
        <Field
          label="Icon"
          value={value.emoji}
          onChangeText={(t) => set('emoji', t)}
          placeholder="Optional"
          maxLength={4}
        />
        <FieldRow label="Colour" last>
          {COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => set('color', c)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={c}
              accessibilityState={{ selected: value.color === c }}
              style={[
                styles.swatch,
                { backgroundColor: colors[c] },
                value.color === c && {
                  borderColor: colors.textPrimary,
                  borderWidth: 2,
                },
              ]}
            />
          ))}
        </FieldRow>
      </Card>

      <Card title="Schedule">
        <View style={styles.stack}>
          <Segmented
            value={value.cadence}
            onChange={(c) => set('cadence', c)}
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'days', label: 'Days' },
              { value: 'weekly', label: 'Weekly' },
            ]}
          />

          {value.cadence === 'days' ? (
            <View style={styles.days}>
              {WEEKDAY_LABELS.map((label, i) => {
                const day = i + 1;
                const on = value.target_days.includes(day);
                return (
                  <Pressable
                    key={day}
                    onPress={() => toggleDay(day)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={[
                      styles.day,
                      {
                        borderColor: on ? colors.green : colors.borderDefault,
                        backgroundColor: on ? colors.greenSoft : colors.bgSurface,
                      },
                    ]}
                  >
                    <Text
                      style={[typography.monoSmall, { color: on ? colors.green : colors.textMuted }]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {value.cadence === 'weekly' ? (
            <Segmented
              value={String(value.target_per_week)}
              onChange={(n) => set('target_per_week', Number(n))}
              options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: String(n), label: `${n}×` }))}
            />
          ) : null}

          <Text style={[typography.monoSmall, { color: colors.textMuted }]}>
            {value.cadence === 'daily'
              ? 'EVERY DAY'
              : value.cadence === 'days'
                ? value.target_days.length
                  ? `${value.target_days.length} DAYS A WEEK`
                  : 'PICK AT LEAST ONE DAY'
                : `${value.target_per_week} TIMES A WEEK, ANY DAYS`}
          </Text>
        </View>
      </Card>

      {!lockVisibility && groups.length > 0 ? (
        <Card title="Who sees it">
          <Choice
            value={value.group_id}
            onChange={(g) => set('group_id', g)}
            options={[
              { value: null, label: 'Private', hint: 'ONLY YOU' },
              ...groups.map((g) => ({
                value: g.id as string | null,
                label: g.emoji ? `${g.emoji}  ${g.name}` : g.name,
                hint: 'EVERYONE IN THE GROUP CHECKS IN',
              })),
            ]}
          />
        </Card>
      ) : null}

      <Button
        label={submitLabel}
        variant="primary"
        busy={busy}
        disabled={!canSubmit}
        onPress={() => onSubmit({ ...value, title: value.title.trim() })}
      />

      {footer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.page, gap: spacing.card },
  stack: { gap: 10 },
  swatch: { width: 18, height: 18, borderRadius: 9, borderColor: 'transparent', borderWidth: 2 },
  days: { flexDirection: 'row', gap: 5 },
  day: {
    flex: 1,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.button,
  },
});
