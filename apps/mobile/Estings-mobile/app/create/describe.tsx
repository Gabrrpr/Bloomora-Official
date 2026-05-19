import { useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { BloomScreen } from '@/components/bloom-ui';
import { AiDisclaimer, BackHeaderAction, DescribeForm } from '@/components/make-personal-ui';
import { generatedLooks } from '@/constants/shop';

export default function DescribeArrangementScreen() {
  const params = useLocalSearchParams<{ prompt?: string }>();
  const initialPrompt =
    typeof params.prompt === 'string'
      ? params.prompt
      : "I'm ordering this for Valentine's Day. She likes pink and soft, romantic styles. I want it to look elegant and sweet.";
  const [prompt, setPrompt] = useState(initialPrompt);
  const [generationIndex, setGenerationIndex] = useState(0);
  const generatedImage = generatedLooks[generationIndex % generatedLooks.length];
  const characterCount = useMemo(() => prompt.trim().length, [prompt]);

  return (
    <BloomScreen
      eyebrow="Make it personal"
      headerAction={<BackHeaderAction />}
      title="Describe your arrangement.">
      <DescribeForm
        characterCount={characterCount}
        generatedImage={generatedImage}
        onGenerate={() => setGenerationIndex((current) => current + 1)}
        onPromptChange={setPrompt}
        onUsePromptIdea={setPrompt}
        prompt={prompt}
      />
      <AiDisclaimer />
    </BloomScreen>
  );
}
