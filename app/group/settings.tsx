import { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Plate } from '@/components/Plate';
import { Field } from '@/components/Field';
import { ModalHeader } from '@/components/ModalHeader';
import { Notice } from '@/components/Notice';
import { useGroups, useUpdateGroup } from '@/lib/queries';
import { useTheme } from '@/theme/ThemeProvider';
import { space, spacing } from '@/theme/tokens';

export default function GroupSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const groups = useGroups();
  const update = useUpdateGroup();
  const group = groups.data?.find((g) => g.id === id);

  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fill in once the group arrives from the cache or the network.
  useEffect(() => {
    if (!group) return;
    setName(group.name);
  }, [group]);

  async function onSave() {
    setError(null);
    try {
      await update.mutateAsync({ id: id!, name: name.trim(), emoji: group?.emoji ?? null });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the group.');
    }
  }

  const changed = !!group && name.trim() !== group.name;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ModalHeader title="Group settings" eyebrow="Everyone in the group sees this" />
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
            maxLength={60}
            last
          />
        </Plate>

        <Button
          label="Save changes"
          variant="primary"
          busy={update.isPending}
          disabled={!changed || !name.trim()}
          onPress={onSave}
        />

        {error ? <Notice label="Could not save">{error}</Notice> : null}

        <Notice label="Owners only">
          {'Only the group owner can rename a group. The invite code is changed from the group menu.'}
        </Notice>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.page, gap: spacing.section },
});
