import { useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { useProfile } from '@/lib/queries';
import { YouButton } from './Avatar';

/**
 * Your monogram in the corner of a tab, leading to You.
 *
 * You used to be the fourth tab; NavySum apps keep to three, so your profile,
 * your record and the app's settings moved behind this. It sits on every tab,
 * so they are still one tap away from anywhere. Renders nothing until the
 * profile has loaded, rather than a placeholder monogram.
 */
export function YouCorner() {
  const { userId } = useAuth();
  const profile = useProfile(userId);
  const router = useRouter();
  if (!profile.data) return null;
  return <YouButton name={profile.data.display_name} onPress={() => router.push('/you')} />;
}
