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
