import { Text } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * A small status word beside something: "Owner", "Now", "Strongest".
 *
 * Set as a label and nothing more — no pill, no fill. NavySum has no badges,
 * and a word in small tracked capitals already reads as a quiet aside. The
 * accent is for the one tag that marks what is live right now, like the task
 * the timer is running against.
 *
 * There is still no destructive tone. "Needs work" is muted, not red: nothing
 * in this system says failure in colour.
 */
export function Tag({ label, variant = 'muted' }: { label: string; variant?: 'muted' | 'accent' }) {
  const t = useTheme();
  return (
    <Text style={[t.type.label, variant === 'accent' && { color: t.colors.seal }]}>{label}</Text>
  );
}
