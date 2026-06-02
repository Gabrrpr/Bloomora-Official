import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronDown, ChevronLeft, Info, Lightbulb, Sparkles } from 'lucide-react-native';
import { useState } from 'react';

import { PrimaryButton } from '@/components/bloom-ui';
import { generatedLooks, type CreateOption, type CreateOptions } from '@/constants/shop';
import { theme } from '@/constants/theme';

export const promptIdeas = [
  "A romantic Valentine's Day arrangement with soft pink and cream flowers, elegant and sweet.",
  'A cheerful birthday bouquet with yellow tulips, warm greenery, and a bright wrap.',
  'A minimal white orchid arrangement with a clean premium feel for an office table.',
];

const promptTips = [
  {
    title: 'Theme or occasion',
    description: "Mention the vibe you want, like Valentine's Day, birthday, sympathy, or congratulations.",
  },
  {
    title: "Colors you'd like",
    description: 'Add a color palette such as soft pink and cream, all white, or vibrant and colorful.',
  },
  {
    title: 'Favorite flower',
    description: 'Tell us the flower you want to see most, such as roses, lilies, orchids, or tulips.',
  },
];

export function BackHeaderAction() {
  return (
    <Pressable accessibilityLabel="Go back" accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
      <ChevronLeft size={theme.icon.md} color={theme.colors.text} />
    </Pressable>
  );
}

export function DescribeForm({
  characterCount,
  onGenerate,
  onPromptChange,
  onUsePromptIdea,
  prompt,
}: {
  characterCount: number;
  onGenerate: () => void;
  onPromptChange: (value: string) => void;
  onUsePromptIdea: (value: string) => void;
  prompt: string;
}) {
  return (
    <View style={styles.aiFlow}>
      <View style={styles.aiPromptCard}>
        <View style={styles.aiPromptHeader}>
          <View style={styles.aiIconBubble}>
            <Sparkles size={theme.icon.md} color={theme.colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.aiTitle}>Tell the florist AI what to make</Text>
            <Text style={styles.aiSubtitle}>Occasion, colors, favorite flowers, and mood are enough.</Text>
          </View>
        </View>

        <TextInput
          multiline
          maxLength={500}
          onChangeText={onPromptChange}
          placeholder="Example: Soft pink roses for an anniversary, elegant and romantic."
          placeholderTextColor={theme.colors.textMuted}
          style={styles.promptInput}
          textAlignVertical="top"
          value={prompt}
        />

        <View style={styles.promptFooter}>
          <Text style={styles.count}>{characterCount}/500</Text>
          <Pressable style={styles.textActionButton} onPress={() => onUsePromptIdea(promptIdeas[0])}>
            <Text style={styles.textAction}>Use example</Text>
          </Pressable>
        </View>
      </View>

      <PromptTips />
      <PrimaryButton label="Create my bouquet" onPress={onGenerate} />
      <PreviewArea eyebrow="AI output" title="Your generated arrangement will appear here." />
    </View>
  );
}

export function MixAndMatchForm({
  onGenerate,
  onSelectColor,
  onSelectFlower,
  onSelectWrapper,
  options,
  selectedColor,
  selectedFlower,
  selectedWrapper,
}: {
  onGenerate: () => void;
  onSelectColor: (id: string) => void;
  onSelectFlower: (id: string) => void;
  onSelectWrapper: (id: string) => void;
  options: CreateOptions;
  selectedColor: string;
  selectedFlower: string;
  selectedWrapper: string;
}) {
  return (
    <View style={styles.panel}>
      <View style={styles.pathIntro}>
        <View style={styles.mixPathIcon}>
          <Sparkles size={theme.icon.md} color={theme.colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.pathTitle}>Build your own bouquet.</Text>
          <Text style={styles.pathDescription}>Choose the main stem, color story, and wrapping style.</Text>
        </View>
      </View>

      <OptionSelector label="Flower type" options={options.flowerTypes} selectedId={selectedFlower} onSelect={onSelectFlower} />
      <OptionSelector label="Color" options={options.colors} selectedId={selectedColor} onSelect={onSelectColor} />
      <OptionSelector label="Wrapper" options={options.wrappers} selectedId={selectedWrapper} onSelect={onSelectWrapper} />

      <PrimaryButton label="Preview my bouquet" onPress={onGenerate} />
      <PreviewArea eyebrow="Manual output" title="Your arrangement summary will appear here." />
    </View>
  );
}

export function ExamplesList({ onUsePromptIdea }: { onUsePromptIdea: (value: string) => void }) {
  return (
    <View style={styles.examplesList}>
      {promptIdeas.map((idea, index) => (
        <Pressable key={idea} style={({ pressed }) => [styles.exampleCard, pressed && styles.pressed]} onPress={() => onUsePromptIdea(idea)}>
          <Image source={{ uri: generatedLooks[index % generatedLooks.length] }} style={styles.exampleImage} />
          <View style={styles.exampleBody}>
            <Text style={styles.exampleLabel}>Arrangement idea</Text>
            <Text style={styles.exampleText}>{idea}</Text>
            <View style={styles.exampleFooter}>
              <Sparkles size={theme.icon.sm} color={theme.colors.primary} />
              <Text style={styles.exampleAction}>Use this prompt</Text>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export function AiDisclaimer() {
  return (
    <View style={styles.disclaimer}>
      <Info size={theme.icon.sm} color={theme.colors.primary} />
      <Text style={styles.disclaimerText}>
        AI-generated images may contain minor inaccuracies in flower count or arrangement. Your final order will use real items with a clear price breakdown.
      </Text>
    </View>
  );
}

function PromptTips() {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.tipsCard}>
      <Pressable accessibilityRole="button" style={styles.tipsHeader} onPress={() => setExpanded((current) => !current)}>
        <Lightbulb size={theme.icon.sm} color="#B7791F" />
        <View style={styles.flex}>
          <Text style={styles.tipsTitle}>Prompt tips</Text>
          <Text style={styles.tipsSummary}>{expanded ? 'Hide writing guidance' : 'Tap for quick writing guidance'}</Text>
        </View>
        <ChevronDown
          size={theme.icon.sm}
          color={theme.colors.textMuted}
          style={[styles.tipsChevron, expanded && styles.tipsChevronExpanded]}
        />
      </Pressable>
      {expanded
        ? promptTips.map((tip) => (
            <View key={tip.title} style={styles.tipRow}>
              <Info size={theme.icon.sm - 2} color={theme.colors.textMuted} />
              <View style={styles.flex}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDescription}>{tip.description}</Text>
              </View>
            </View>
          ))
        : null}
    </View>
  );
}

function OptionSelector({
  label,
  onSelect,
  options,
  selectedId,
}: {
  label: string;
  onSelect: (id: string) => void;
  options: CreateOption[];
  selectedId: string;
}) {
  return (
    <View style={styles.selectorGroup}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <View style={styles.optionWrap}>
        {options.map((option) => {
          const selected = option.id === selectedId;

          return (
            <Pressable
              key={option.id}
              style={({ pressed }) => [styles.optionChip, selected && styles.optionChipActive, pressed && styles.pressed]}
              onPress={() => onSelect(option.id)}>
              <Text style={[styles.optionText, selected && styles.optionTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function PreviewArea({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <View style={styles.previewCard}>
      <View style={styles.previewPlaceholder}>
        <View style={styles.previewIcon}>
          <Sparkles size={theme.icon.lg} color={theme.colors.primary} />
        </View>
        <Text style={styles.previewLabel}>{eyebrow}</Text>
        <Text style={styles.previewTitle}>{title}</Text>
        <Text style={styles.previewPrompt}>Generate when ready. No image or result is shown yet.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  inputTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  inputTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  inputSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  promptInput: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 180,
    padding: theme.spacing.lg,
  },
  promptFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  count: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  textActionButton: {
    paddingVertical: theme.spacing.xs,
  },
  textAction: {
    color: theme.colors.primaryDark,
    fontSize: 14,
    fontWeight: '800',
  },
  tipsCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.subtleBorder,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  tipsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 38,
  },
  tipsTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  tipsSummary: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  tipsChevron: {
    transform: [{ rotate: '0deg' }],
  },
  tipsChevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  tipRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  tipTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  tipDescription: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  pathIntro: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  mixPathIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.md,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  pathTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  pathDescription: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  selectorGroup: {
    gap: theme.spacing.sm,
  },
  selectorLabel: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  optionChip: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  optionChipActive: {
    backgroundColor: theme.colors.greenSoft,
    borderColor: theme.colors.primary,
    borderWidth: theme.activeBorderWidth,
  },
  optionText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  optionTextActive: {
    color: theme.colors.primaryDark,
  },
  previewCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    padding: theme.spacing.sm,
  },
  previewPlaceholder: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.subtleBorder,
    borderRadius: theme.radius.md,
    borderStyle: 'dashed',
    borderWidth: theme.borderWidth,
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 180,
    padding: theme.spacing.lg,
  },
  previewIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  previewLabel: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  previewTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
    textAlign: 'center',
  },
  previewPrompt: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
    textAlign: 'center',
  },
  examplesList: {
    gap: theme.spacing.md,
  },
  exampleCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    overflow: 'hidden',
  },
  exampleImage: {
    backgroundColor: theme.colors.surfaceAlt,
    height: 170,
    width: '100%',
  },
  exampleBody: {
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  exampleLabel: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  exampleText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
  },
  exampleFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  exampleAction: {
    color: theme.colors.primaryDark,
    fontSize: 14,
    fontWeight: '800',
  },
  disclaimer: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(46, 139, 52, 0.08)',
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  disclaimerText: {
    color: theme.colors.primaryDark,
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.84,
  },
  aiFlow: {
    gap: theme.spacing.lg,
  },
  aiPromptCard: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(46, 139, 52, 0.14)',
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  aiPromptHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  aiIconBubble: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  aiTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  aiSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
});
