import type { Profile } from './types';

/**
 * How a person is named anywhere other people can see them.
 *
 * Usernames are unique and display names are not, so the handle wins: two
 * people called Craig are indistinguishable otherwise.
 */
export function handle(profile?: Pick<Profile, 'username' | 'display_name'> | null): string {
  if (profile?.username) return `@${profile.username}`;
  return profile?.display_name?.trim() || 'Someone';
}

/** The letter shown in an avatar circle. */
export function initial(profile?: Pick<Profile, 'username' | 'display_name'> | null): string {
  const source = profile?.username || profile?.display_name || '?';
  return source.trim().slice(0, 1).toUpperCase();
}

export function initials(name: string): string {
  // What gets passed here is not always a display name. The leaderboard labels
  // its rows with the handle and marks your own row, so this is called with
  // "@alex" and with "@craig (you)" — and taking the first letter of each word
  // turned those into "@A" and "@(", which is what the avatars on that screen
  // actually showed.
  //
  // So: drop anything parenthesised, then strip leading punctuation off each
  // word. A plain character class rather than a Unicode property escape, which
  // Hermes does not reliably support — and stripping only the *leading* run
  // means a name written in a non-Latin script keeps its own first letters.
  const parts = name
    .replace(/\([^)]*\)/g, ' ')
    .split(/\s+/)
    .map((word) => word.replace(/^[^0-9A-Za-z\u00C0-\uFFFF]+/, ''))
    .filter(Boolean);

  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
