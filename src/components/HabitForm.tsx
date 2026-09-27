import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './ui';
import { Chip } from './Chip';
import { Choice } from './Choice';
import { Field, FieldRow, FieldValue } from './Field';
import { Section } from './Section';
import { Segmented } from './Segmented';
import { useThemedStyles } from '@/theme/ThemeProvider';
import { space, type Theme } from '@/theme';
import { WEEKDAY_LABELS } from '@/lib/date';
import { CAN_SCHEDULE } from '@/lib/reminders';
import type { Cadence, HabitColor } from '@/lib/types';

/** Read aloud for the day chips, which show a single letter each. */
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
   * carry one. The interface is non-pictorial, so nothing sets it any more
   * and nothing renders it.
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
 * It is drawn inside a ModalScreen, which provides the scroll and the keyboard
 * handling.
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
  const styles = useThemedStyles(makeStyles);
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

  const noDays = value.cadence === 'days' && value.target_days.length === 0;
  const canSubmit = value.title.trim().length > 0 && !noDays && !busy;

  const summary =
    value.cadence === 'daily'
      ? 'Every day.'
      : value.cadence === 'days'
        ? noDays
          ? 'Pick at least one day.'
          : `${value.target_days.length} ${value.target_days.length === 1 ? 'day' : 'days'} a week.`
        : `${value.target_per_week} ${value.target_per_week === 1 ? 'time' : 'times'} a week, on any days.`;

  return (
    <>
      <Field
        label="Name"
        value={value.title}
        onChangeText={(t) => set('title', t)}
        placeholder="Morning run"
        autoFocus={!initial}
        maxLength={80}
        returnKeyType="done"
      />

      <Section label="How often">
        <View style={styles.stack}>
          <Segmented
            accessibilityLabel="How often"
            value={value.cadence}
            onChange={(c) => set('cadence', c)}
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'days', label: 'Some days' },
              { value: 'weekly', label: 'Weekly' },
            ]}
          />

          {value.cadence === 'days' ? (
            <View style={styles.days} accessibilityLabel="Days of the week">
              {WEEKDAY_LABELS.map((letter, i) => (
                <Chip
                  key={i}
                  role="checkbox"
                  label={letter}
                  accessibilityLabel={DAY_NAMES[i]}
                  selected={value.target_days.includes(i + 1)}
                  onPress={() => toggleDay(i + 1)}
                  style={styles.day}
                />
              ))}
            </View>
          ) : null}

          {value.cadence === 'weekly' ? (
            <Segmented
              accessibilityLabel="Times a week"
              value={String(value.target_per_week)}
              onChange={(n) => set('target_per_week', Number(n))}
              options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: String(n), label: `${n}×` }))}
            />
          ) : null}

          <Text style={styles.summary} accessibilityLiveRegion="polite">
            {summary}
          </Text>
        </View>
      </Section>

      {CAN_SCHEDULE ? (
        <Field
          label="Remind me"
          value={value.reminder_at}
          onChangeText={(text) => set('reminder_at', text.replace(/[^0-9:]/g, '').slice(0, 5))}
          onBlur={() => set('reminder_at', normaliseTime(value.reminder_at))}
          placeholder="None, or a time like 07:00"
          keyboardType="numbers-and-punctuation"
          maxLength={5}
        />
      ) : (
        // A browser cannot wake itself at 07:00, so offering the field would
        // be taking a time it can never honour. A reminder set on the phone
        // still works, and still shows on the habit's own screen.
        <Section list>
          <FieldRow label="Remind me" last>
            <FieldValue>On the phone app</FieldValue>
          </FieldRow>
        </Section>
      )}

      {!lockVisibility && groups.length > 0 ? (
        <Section label="Who sees it" list>
          <Choice
            value={value.group_id}
            onChange={(g) => set('group_id', g)}
            options={[
              { value: null, label: 'Only you', hint: 'Private' },
              ...groups.map((g) => ({
                value: g.id as string | null,
                label: g.name,
                hint: 'Everyone in the group checks in',
              })),
            ]}
          />
        </Section>
      ) : null}

      <Button
        title={submitLabel}
        loading={busy}
        disabled={!canSubmit}
        onPress={() => onSubmit({ ...value, title: value.title.trim() })}
      />

      {footer}
    </>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    stack: { gap: space.md },
    days: { flexDirection: 'row', gap: space.xs },
    day: { flex: 1, minWidth: 0, paddingHorizontal: 0 },
    summary: { ...t.type.italic, color: t.colors.inkMuted },
  });
