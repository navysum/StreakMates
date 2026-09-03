import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';

export default function YouScreen() {
  return (
    <Screen title="You" eyebrow="Not built yet">
      <Placeholder
        phase="Phase 1"
        what="Sign in with Google, then your profile, reminder settings and the appearance toggle. Right now the app follows your device's light or dark setting automatically."
      />
    </Screen>
  );
}
