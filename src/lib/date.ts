/**
 * "Today" is a device concept, never a server one. Someone checking in at
 * 11pm in Sydney and someone at 8am in London must land on their own dates,
 * so the day is always worked out here and sent as a plain `YYYY-MM-DD`.
 */

/** Local calendar date as YYYY-MM-DD. */
export function toLocalDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD into a Date at local midnight (not UTC midnight). */
export function fromLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = fromLocalDate(iso);
  d.setDate(d.getDate() + days);
  return toLocalDate(d);
}

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export function isoWeekday(iso: string): number {
  const js = fromLocalDate(iso).getDay(); // 0 = Sunday
  return js === 0 ? 7 : js;
}

/** Monday of the week containing `iso`. */
export function startOfWeek(iso: string): string {
  return addDays(iso, -(isoWeekday(iso) - 1));
}

export function daysBetween(from: string, to: string): number {
  const ms = fromLocalDate(to).getTime() - fromLocalDate(from).getTime();
  return Math.round(ms / 86_400_000);
}

export const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

export function formatToday(iso: string): string {
  return fromLocalDate(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
