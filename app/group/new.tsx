import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui';
import { Field } from '@/components/Field';
import { ModalScreen } from '@/components/ModalScreen';
import { Notice } from '@/components/Notice';
import { useCreateGroup } from '@/lib/queries';

export default function NewGroupScreen() {
  const router = useRouter();
  const create = useCreateGroup();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onCreate() {
    setError(null);
    try {
      const group = await create.mutateAsync({ name: name.trim(), emoji: null });
      router.replace(`/group/${group.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The group could not be created.');
    }
  }

  return (
    <ModalScreen title="New group" eyebrow="You will own it">
      <Field
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="The Gym Rats"
        autoFocus
        maxLength={60}
        returnKeyType="done"
        onSubmitEditing={() => (name.trim() ? void onCreate() : undefined)}
      />

      <Button
        title="Create group"
        loading={create.isPending}
        disabled={!name.trim()}
        onPress={onCreate}
      />

      {error ? <Notice label="Could not create it">{error}</Notice> : null}

      <Notice label="What happens next">
        {'A six-character invite code is made for you. Share it, and anyone with it can join. You can change the code later if it gets around.'}
      </Notice>
    </ModalScreen>
  );
}
