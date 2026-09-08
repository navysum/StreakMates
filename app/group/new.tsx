import { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Plate } from '@/components/Plate';
import { Field } from '@/components/Field';
import { ModalHeader } from '@/components/ModalHeader';
import { Notice } from '@/components/Notice';
import { useCreateGroup } from '@/lib/queries';
import { useTheme } from '@/theme/ThemeProvider';
import { space, spacing } from '@/theme/tokens';

export default function NewGroupScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const create = useCreateGroup();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onCreate() {
    setError(null);
    try {
      const group = await create.mutateAsync({ name: name.trim(), emoji: null });
      router.replace(`/group/${group.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the group.');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ModalHeader title="New group" eyebrow="You’ll be the owner" />
      <KeyboardSafe>
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.bottom }]}
          keyboardShouldPersistTaps="handled"
        >
          <Plate label="Group">
            <Field
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="The Gym Rats"
              autoFocus
              maxLength={60}
              last
            />
          </Plate>

          <Button
            label="Create group"
            variant="primary"
            busy={create.isPending}
            disabled={!name.trim()}
            onPress={onCreate}
          />

          {error ? <Notice label="Could not create">{error}</Notice> : null}

          <Notice label="What happens next">
            {'A six-character invite code is generated for you. Share it and anyone with it can join. As owner you can change the code later if it leaks.'}
          </Notice>
        </ScrollView>
      </KeyboardSafe>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.page, gap: spacing.section },
});
