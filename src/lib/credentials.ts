/**
 * What counts as a usable email address and password.
 *
 * Kept pure and apart from the auth calls so the rules can be tested, and so
 * the same message appears whether you are signing up, signing in, or resetting.
 */

/** Deliberately permissive. Something@something.something, and no spaces. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD = 8;

/**
 * bcrypt, which is what Supabase hashes with, silently ignores anything past
 * 72 bytes. A longer password would appear to work and then let a truncated
 * version in, so it is refused rather than quietly cut.
 */
export const MAX_PASSWORD = 72;

/** A handful that are guessed first, whatever the length rule says. */
const OBVIOUS = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  'qwertyui',
  'qwerty123',
  'letmein1',
  'iloveyou',
  'streakmates',
]);

export function emailProblem(raw: string): string | null {
  const email = raw.trim();
  if (!email) return 'Enter your email address.';
  if (!EMAIL.test(email)) return 'That does not look like an email address.';
  return null;
}

export function passwordProblem(password: string): string | null {
  if (!password) return 'Enter a password.';
  if (password.length < MIN_PASSWORD) {
    return `Use at least ${MIN_PASSWORD} characters.`;
  }
  // Byte length, not character count: an emoji is four bytes to bcrypt.
  if (new TextEncoder().encode(password).length > MAX_PASSWORD) {
    return 'That password is too long. Keep it under 72 bytes.';
  }
  if (password.trim().length === 0) return 'A password cannot be only spaces.';
  if (OBVIOUS.has(password.toLowerCase())) {
    return 'That password is one of the first anyone would guess. Pick another.';
  }
  return null;
}

export function nameProblem(raw: string): string | null {
  const name = raw.trim();
  if (!name) return 'Enter the name your friends will see.';
  if (name.length > 60) return 'Keep your name under 60 characters.';
  return null;
}

/** Normalised for sending: addresses are case-insensitive in practice. */
export const normaliseEmail = (raw: string) => raw.trim().toLowerCase();
