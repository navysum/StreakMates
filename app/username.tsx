import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui';
import { TextAction } from '@/components/TextAction';
import { Field } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/auth/AuthProvider';
import { AccountMissingError, useProfile, useSetUsername } from '@/lib/queries';
import { useThemedStyles } from '@/theme/ThemeProvider';
import { space, type Theme } from '@/theme';

const VALID = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;

export default function UsernameScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { userId, signOut } = useAuth();

  const profile = useProfile(userId);
  const save = useSetUsername(userId);

  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  const first = !profile.data?.username;
  const wellFormed = VALID.test(username);
  const unchanged = username === (profile.data?.username ?? '');

  useEffect(() => {
    if (profile.data?.username) setUsername(profile.data.username);
  }, [profile.data?.username]);

  async function onSave() {
    setError(null);
    try {
      await save.mutateAsync(username);
      if (first) router.replace('/');
      else if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (e) {
      if (e instanceof AccountMissingError) {
        await signOut();
        return;
      }
      setError(e instanceof Error ? e.message : 'That username could not be saved.');
    }
  }

  const status = !username
    ? ' '
    : !wellFormed
      ? '3 to 20 letters, numbers or underscores, starting with a letter.'
      : unchanged
        ? 'That is your username now.'
        : 'Ready to claim.';

  return (
    <Screen
      title={first ? 'Pick a username' : 'Your username'}
      label={first ? 'One more thing' : 'You'}
      // Nowhere to go back to on the way in: everyone needs one first.
      back={first ? undefined : {}}
    >
      <Text style={styles.lead}>
        {first
          ? 'This is how friends will recognise you in a group. It is yours alone — no two people in the app can share one.'
          : 'Changing it changes how you appear in every group you are in.'}
      </Text>

      <Field
        label="Username"
        value={username}
        onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
        placeholder="craig"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
        maxLength={20}
        returnKeyType="done"
      />
      <Text style={styles.status} accessibilityLiveRegion="polite">
        {status}
      </Text>

      <Button
        title={first ? 'Claim it' : 'Save username'}
        loading={save.isPending}
        disabled={!wellFormed || unchanged}
        onPress={onSave}
      />

      {error ? <Notice label="Could not save">{error}</Notice> : null}

      {first ? (
        // The only screen with no way out otherwise: everyone lands here
        // before the tabs, and the tabs are where Sign out lives.
        <TextAction title="Not you? Sign out" tone="muted" onPress={() => void signOut()} />
      ) : null}

      <Notice label="Why a username">
        {'Names come from Google and repeat — two friends called Craig look the same on a board. A username is checked against everyone in the app, so yours is only ever yours.'}
      </Notice>
    </Screen>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    lead: { ...t.type.body, color: t.colors.inkSoft, marginTop: -space.md },
    status: { ...t.type.italic, color: t.colors.inkMuted, marginTop: -space.lg },
  });
