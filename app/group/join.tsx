import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TextInput, View, StyleSheet, Pressable } from 'react-native';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Plate } from '@/components/Plate';
import { ModalHeader } from '@/components/ModalHeader';
import { Notice } from '@/components/Notice';
import { Tag } from '@/components/Tag';
import { useJoinGroup, usePreviewGroup } from '@/lib/queries';
import { useTheme } from '@/theme/ThemeProvider';
import { ink, radius, space, spacing, typography } from '@/theme/tokens';
import type { GroupPreview } from '@/lib/types';

const CODE_LENGTH = 6;
// The alphabet the database generates from: no 0, O, 1, I or L, so nothing
// gets misread. Anything else typed is simply ignored.
const ALLOWED = /[23456789ABCDEFGHJKMNPQRSTUVWXYZ]/g;

export default function JoinGroupScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ModalHeader title="Join a group" eyebrow="Six characters" />
      <KeyboardSafe>
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.bottom }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[typography.prose, { color: ink(colors, 78) }]}>
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
                    backgroundColor: char ? colors.accents[100] : 'transparent',
                    borderColor: char ? colors.accent : colors.divider,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.statSmall,
                    { color: char ? colors.accents[700] : ink(colors, 45) },
                  ]}
                >
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
            <Text style={[typography.label, { color: ink(colors, 62) }]}>Checking…</Text>
          ) : null}

          {preview ? (
            <Plate>
              <View style={styles.found}>
                <View style={styles.foundText}>
                  <Text numberOfLines={1} style={[typography.cardTitle, { color: colors.text }]}>
                    {preview.name}
                  </Text>
                  <Text style={[typography.caption, { color: ink(colors, 70) }]}>
                    {preview.member_count} member{Number(preview.member_count) === 1 ? '' : 's'}
                  </Text>
                </View>
                <Tag label="Found" />
              </View>
            </Plate>
          ) : null}

          <Button
            label="Join group"
            variant="primary"
            disabled={!preview}
            busy={join.isPending}
            onPress={onJoin}
          />

          {error ? <Notice label="Could not join">{error}</Notice> : null}

          <Text style={[typography.caption, styles.fine, { color: ink(colors, 65) }]}>
            Codes skip 0, O, 1 and I, so nobody mistypes them.
          </Text>
        </ScrollView>
      </KeyboardSafe>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.page, gap: spacing.section },
  boxes: { flexDirection: 'row', gap: space.sm, justifyContent: 'center', paddingVertical: space.sm },
  box: {
    width: 44,
    height: 54,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hidden: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  found: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  foundText: { flex: 1, minWidth: 0, gap: space.xs },
  fine: { textAlign: 'center', marginTop: space.sm },
});
