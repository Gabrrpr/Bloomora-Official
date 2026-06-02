import { router } from 'expo-router';

import { BloomScreen } from '@/components/bloom-ui';
import { BackHeaderAction, ExamplesList } from '@/components/make-personal-ui';

export default function ArrangementExamplesScreen() {
  return (
    <BloomScreen
      eyebrow="Make it personal"
      headerAction={<BackHeaderAction />}
      title="See examples."
      subtitle="Start from a florist-made idea, then customize it in the prompt screen.">
      <ExamplesList
        onUsePromptIdea={(idea) => {
          router.push({
            pathname: '/create/describe',
            params: { prompt: idea },
          });
        }}
      />
    </BloomScreen>
  );
}
