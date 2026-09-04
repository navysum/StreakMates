import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TextInput, View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ModalHeader } from '@/components/ModalHeader';
import { Notice } from '@/components/Notice';
import { Pill } from '@/components/Pill';
import { useJoinGroup, usePreviewGroup } from '@/lib/queries';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, typography } from '@/theme/tokens';
import type { GroupPreview } from '@/lib/types';

const CODE_LENGTH = 6;
// The alphabet the database generates from: no 0, O, 1, I or L, so nothing
// gets misread. Anything else typed is simply ignored.
const ALLOWED = /[23456789ABCDEFGHJKMNPQRSTUVWXYZ]/g;

export default function JoinGroupScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const input = useRef<TextInput>(null);

  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<GroupPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lookup = usePreviewGroup();
  const join = useJoinGroup();

  // Resolve the group as soon as the code is complete, so people see what
  // they are joining before they commit.
  useEffect(() => {
    if (code.length !== CODE_LENGTH) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setError(null);
    lookup
      .mutateAsync(code)
      .then((found) => {
        if (cancelled) return;
        setPreview(found);
        if (!found) setError('No group with that code.');
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not check that code.');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function onJoin() {
    setError(null);
    try {
      const group = await join.mutateAsync(code);
      router.replace(`/group/${group.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not join that group.');
    }
  }

  const boxes = Array.from({ length: CODE_LENGTH }, (_, i) => code[i] ?? '');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPage }}>
      <ModalHeader title="Join a group" eyebrow="Six characters" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          Ask a friend for their group’s code.
        </Text>

        <Pressable
          onPress={() => input.current?.focus()}
          style={styles.boxes}
          accessibilityRole="button"
          accessibilityLabel="Enter invite code"
        >
          {boxes.map((char, i) => (
            <View
              key={i}
              style={[
                styles.box,
                {
                  backgroundColor: char ? colors.greenSoft : colors.bgSurface,
                  borderColor: char ? colors.green : colors.borderDefault,
                },
              ]}
            >
              <Text style={[styles.char, { color: char ? colors.green : colors.textMuted }]}>
                {char}
              </Text>
            </View>
          ))}
        </Pressable>

        <TextInput
          ref={input}
          value={code}
          onChangeText={(t) =>
            setCode((t.toUpperCase().match(ALLOWED) ?? []).join('').slice(0, CODE_LENGTH))
          }
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus
          maxLength={CODE_LENGTH}
          style={styles.hidden}
          accessibilityLabel="Invite code"
        />

        {lookup.isPending ? (
          <Text style={[typography.monoSmall, { color: colors.textMuted }]}>CHECKING…</Text>
        ) : null}

        {preview ? (
          <Card>
            <View style={styles.found}>
              <View style={styles.foundText}>
                <Text style={[typography.rowName, { color: colors.textPrimary }]}>
                  {preview.emoji ? `${preview.emoji}  ${preview.name}` : preview.name}
                </Text>
                <Text style={[typography.monoSmall, { color: colors.textMuted }]}>
                  {preview.member_count} MEMBER{Number(preview.member_count) === 1 ? '' : 'S'}
                </Text>
              </View>
              <Pill label="Found" tone="good" />
            </View>
          </Card>
        ) : null}

        <Button
          label="Join group"
          variant="primary"
          disabled={!preview}
          busy={join.isPending}
          onPress={onJoin}
        />

        {error ? <Notice label="Could not join" tone="bad">{error}</Notice> : null}

        <Text style={[typography.monoSmall, styles.fine, { color: colors.textMuted }]}>
          CODES SKIP 0, O, 1 AND I{'\n'}SO NOBODY MISTYPES THEM
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.page, gap: spacing.card },
  boxes: { flexDirection: 'row', gap: 6, justifyContent: 'center', paddingVertical: 6 },
  box: {
    width: 44,
    height: 54,
    borderWidth: 1,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  char: { fontFamily: 'CascadiaCode-SemiBold', fontSize: 24 },
  hidden: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  found: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  foundText: { flex: 1, gap: 1 },
  fine: { textAlign: 'center', marginTop: 8 },
});
