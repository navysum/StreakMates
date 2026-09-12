import { useEffect, useState } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Plate } from '@/components/Plate';
import { Field } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { Tag } from '@/components/Tag';
import { useAuth } from '@/auth/AuthProvider';
import { useProfile, useSetUsername } from '@/lib/queries';
import { useTheme } from '@/theme/ThemeProvider';
import { ink, space, spacing, typography } from '@/theme/tokens';

const VALID = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;

export default function UsernameScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useAuth();

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
      setError(e instanceof Error ? e.message : 'Could not save that username.');
    }
  }

  return (
    <KeyboardSafe style={{ backgroundColor: colors.bg }}>
      <ScrollView
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={[
          styles.body,
          { paddingTop: insets.top + (first ? 60 : 24), paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.head}>
          <Text style={[typography.screenTitle, { color: colors.text }]}>
            {first ? 'Pick a username' : 'Your username'}
          </Text>
          <Text style={[typography.prose, { color: ink(colors, 78) }]}>
            {first
              ? 'This is how friends will recognise you in a group. It has to be yours alone — no two people in the app can share one.'
              : 'Changing this changes how you appear in every group you are in.'}
          </Text>
        </View>

        <Plate label="Handle">
          <Field
            label="Username"
            value={username}
            onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
            placeholder="craig"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            maxLength={20}
            last
          />
        </Plate>

        <View style={styles.status}>
          {!username ? null : !wellFormed ? (
            <Tag label="3–20 chars, start with a letter" variant="outline" />
          ) : unchanged ? (
            <Tag label="Unchanged" variant="outline" />
          ) : (
            <Tag label="Ready to claim" variant="outline" />
          )}
        </View>

        <Button
          label={first ? 'Claim it' : 'Save username'}
          variant="primary"
          busy={save.isPending}
          disabled={!wellFormed || unchanged}
          onPress={onSave}
        />

        {error ? <Notice label="Could not save">{error}</Notice> : null}

        <Notice label="Why a username">
          {'Display names come from Google and repeat — two friends called Craig look identical on a board. A username is checked against everyone in the app, so yours is only ever yours.'}
        </Notice>
      </ScrollView>
    </KeyboardSafe>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.page, gap: spacing.section },
  head: { gap: space.md },
  status: { minHeight: 28, flexDirection: 'row', alignItems: 'center' },
});
