import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui';
import { Field } from '@/components/Field';
import { ModalScreen } from '@/components/ModalScreen';
import { Notice } from '@/components/Notice';
import { useGroups, useUpdateGroup } from '@/lib/queries';

export default function GroupSettingsScreen() {
  const router = useRouter();
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
      setError(e instanceof Error ? e.message : 'The group could not be saved.');
    }
  }

  const changed = !!group && name.trim() !== group.name;

  return (
    <ModalScreen title="Group settings" eyebrow="Everyone in the group sees this">
      <Field
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="The Gym Rats"
        maxLength={60}
        returnKeyType="done"
      />

      <Button
        title="Save changes"
        loading={update.isPending}
        disabled={!changed || !name.trim()}
        onPress={onSave}
      />

      {error ? <Notice label="Could not save">{error}</Notice> : null}

      <Notice label="Only the owner">
        {'Only the person who owns a group can rename it. The invite code is changed from the group’s options.'}
      </Notice>
    </ModalScreen>
  );
}
