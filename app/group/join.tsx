import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui';
import { ModalScreen } from '@/components/ModalScreen';
import { Notice } from '@/components/Notice';
import { Section } from '@/components/Section';
import { useJoinGroup, usePreviewGroup } from '@/lib/queries';
import { useThemedStyles } from '@/theme/ThemeProvider';
import { space, type Theme } from '@/theme';
import type { GroupPreview } from '@/lib/types';

const CODE_LENGTH = 6;
// The alphabet the database generates from: no 0, O, 1, I or L, so nothing
// gets misread. Anything else typed is simply ignored.
const ALLOWED = /[23456789ABCDEFGHJKMNPQRSTUVWXYZ]/g;

export default function JoinGroupScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const input = useRef<TextInput>(null);

  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(true);
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
        if (!found) setError('No group has that code. Check it with whoever sent it.');
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'That code could not be checked.');
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
      setError(e instanceof Error ? e.message : 'You could not join that group.');
    }
  }

  const boxes = Array.from({ length: CODE_LENGTH }, (_, i) => code[i] ?? '');

  return (
    <ModalScreen title="Join a group" eyebrow="Six characters">
      <Text style={styles.lead}>Ask a friend for their group’s code.</Text>

      <Pressable
        onPress={() => input.current?.focus()}
        style={styles.boxes}
        accessibilityRole="button"
        accessibilityLabel={code ? `Invite code so far: ${code.split('').join(' ')}` : 'Enter the invite code'}
      >
        {boxes.map((char, i) => (
          <View
            key={i}
            style={[
              styles.box,
              // The box the next character goes in, while typing.
              focused && i === Math.min(code.length, CODE_LENGTH - 1) && styles.next,
            ]}
          >
            <Text style={styles.char} maxFontSizeMultiplier={1.2}>
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
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="characters"
        autoCorrect={false}
        autoFocus
        maxLength={CODE_LENGTH}
        style={styles.hidden}
        accessibilityLabel="Invite code"
      />

      {lookup.isPending ? <Text style={styles.note}>Checking the code…</Text> : null}

      {preview ? (
        <Section label="Found">
          <Text numberOfLines={1} style={styles.found}>
            {preview.name}
          </Text>
          <Text style={styles.note}>
            {preview.member_count} {Number(preview.member_count) === 1 ? 'member' : 'members'}
          </Text>
        </Section>
      ) : null}

      <Button title="Join group" disabled={!preview} loading={join.isPending} onPress={onJoin} />

      {error ? <Notice label="Could not join">{error}</Notice> : null}

      <Text style={styles.note}>Codes skip 0, O, 1 and I, so nobody mistypes them.</Text>
    </ModalScreen>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    lead: { ...t.type.body, color: t.colors.inkSoft },
    boxes: { flexDirection: 'row', gap: space.sm, justifyContent: 'center' },
    box: {
      width: 46,
      height: 58,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.surface,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: t.colors.paperEdge,
      borderRadius: t.radius.input,
    },
    next: { borderColor: t.colors.inkSoft },
    char: { ...t.type.heading, color: t.colors.ink },
    hidden: { position: 'absolute', opacity: 0, height: 1, width: 1 },
    found: { ...t.type.heading, color: t.colors.ink },
    note: { ...t.type.italic, color: t.colors.inkMuted },
  });
