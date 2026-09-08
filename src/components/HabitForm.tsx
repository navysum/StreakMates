import { useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './Button';
import { Choice } from './Choice';
import { Field } from './Field';
import { Plate } from './Plate';
import { Segmented } from './Segmented';
import { useTheme } from '@/theme/ThemeProvider';
import { ink, radius, space, spacing, typography } from '@/theme/tokens';
import { WEEKDAY_LABELS } from '@/lib/date';
import type { Cadence, HabitColor } from '@/lib/types';

/** Accepts 7, 7:5, 0705 and the like; anything unreadable becomes no reminder. */
export function normaliseTime(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 0) return '';
  const [rawHour, rawMinute] =
    input.includes(':') ? input.split(':') : [digits.slice(0, -2) || '0', digits.slice(-2)];
  const hour = Number(rawHour);
  const minute = Number(rawMinute || 0);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return '';
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return '';
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export type HabitFormValue = {
  title: string;
  /**
   * Kept on the value because the column still exists and old habits still
   * carry one. The Industry system is non-pictorial, so nothing sets it any
   * more and nothing renders it.
   */
  emoji: string;
  /** Same: one accent only, so this is written but never shown. */
  color: HabitColor;
  cadence: Cadence;
  target_days: number[];
  target_per_week: number;
  /** null = private. A group id makes it shared with that group. */
  group_id: string | null;
  /** `HH:MM`, or empty for no reminder. */
  reminder_at: string;
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
  reminder_at: '',
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
  const insets = useSafeAreaInsets();
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
    <ScrollView
      contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.bottom }]}
      keyboardShouldPersistTaps="handled"
    >
      <Plate label="Habit">
        <Field
          label="Name"
          value={value.title}
          onChangeText={(t) => set('title', t)}
          placeholder="Morning run"
          autoFocus={!initial}
          maxLength={80}
          returnKeyType="done"
          last
        />
      </Plate>

      <Plate label="Schedule">
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
                    style={({ pressed }) => [
                      styles.day,
                      {
                        borderColor: on ? colors.accent : colors.divider,
                        backgroundColor: on ? colors.accents[100] : 'transparent',
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        typography.labelSmall,
                        { color: on ? colors.accents[700] : ink(colors, 62) },
                      ]}
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

          <Field
            label="Remind me"
            value={value.reminder_at}
            onChangeText={(text) => set('reminder_at', text.replace(/[^0-9:]/g, '').slice(0, 5))}
            onBlur={() => set('reminder_at', normaliseTime(value.reminder_at))}
            placeholder="07:00 — none"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            last
          />

          <Text style={[typography.labelSmall, { color: ink(colors, 62) }]}>
            {value.cadence === 'daily'
              ? 'Every day'
              : value.cadence === 'days'
                ? value.target_days.length
                  ? `${value.target_days.length} days a week`
                  : 'Pick at least one day'
                : `${value.target_per_week} times a week, any days`}
          </Text>
        </View>
      </Plate>

      {!lockVisibility && groups.length > 0 ? (
        <Plate label="Who sees it">
          <Choice
            value={value.group_id}
            onChange={(g) => set('group_id', g)}
            options={[
              { value: null, label: 'Private', hint: 'Only you' },
              ...groups.map((g) => ({
                value: g.id as string | null,
                label: g.name,
                hint: 'Everyone in the group checks in',
              })),
            ]}
          />
        </Plate>
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
  // The bottom padding is added at render time from the safe-area inset.
  body: { padding: spacing.page, gap: spacing.section },
  stack: { gap: space.lg },
  days: { flexDirection: 'row', gap: 5 },
  day: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.none,
  },
  pressed: { opacity: 0.6 },
});
