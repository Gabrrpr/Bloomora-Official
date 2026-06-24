import { ChevronDown, WandSparkles } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Fonts, theme } from '@/constants/theme';
import {
  generateGreetingCardMessage,
  occasionOptions,
  relationshipOptions,
  toneOptions,
  type CardTone,
} from '@/services/greeting-card-api';

type GreetingCardComposerProps = {
  message: string;
  onChangeMessage: (value: string) => void;
};

export function GreetingCardComposer({ message, onChangeMessage }: GreetingCardComposerProps) {
  const [relationship, setRelationship] = useState('');
  const [occasion, setOccasion] = useState('');
  const [tone, setTone] = useState<CardTone>('warm');
  const [extra, setExtra] = useState('');
  const [isAiWriterOpen, setIsAiWriterOpen] = useState(false);
  const [openSelect, setOpenSelect] = useState<'occasion' | 'relationship' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!relationship || !occasion || isGenerating) {
      setError('Select a relationship and occasion first.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      onChangeMessage(await generateGreetingCardMessage({ extra, occasion, relationship, tone }));
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : 'Could not generate a message.');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <View style={styles.cardComposer}>
      <View style={styles.cardComposerTitleRow}>
        <WandSparkles color={theme.colors.primary} size={18} />
        <View style={styles.cardComposerTitleCopy}>
          <Text style={styles.cardComposerTitle}>Greeting card (optional)</Text>
          <Text style={styles.cardComposerSubtitle}>Write your own message, or use AI when you need a starting point.</Text>
        </View>
      </View>

      <Text style={styles.writeLabel}>Write it yourself</Text>
      <TextInput
        maxLength={500}
        multiline
        onChangeText={onChangeMessage}
        placeholder="Write a short message for the recipient"
        placeholderTextColor={theme.colors.textMuted}
        style={styles.cardComposerInput}
        value={message}
      />
      <Text style={styles.cardComposerCount}>{message.length}/500</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isAiWriterOpen }}
        onPress={() => {
          setIsAiWriterOpen((current) => !current);
          setOpenSelect(null);
        }}
        style={({ pressed }) => [styles.aiToggle, pressed && styles.pressed]}>
        <View style={styles.aiToggleCopy}>
          <Text style={styles.aiToggleTitle}>AI Message Writer</Text>
          <Text style={styles.aiToggleText}>Generate a draft if you are not sure what to say.</Text>
        </View>
        <ChevronDown
          color={theme.colors.primary}
          size={18}
          strokeWidth={2.4}
          style={isAiWriterOpen && styles.chevronOpen}
        />
      </Pressable>

      {isAiWriterOpen ? (
        <View style={styles.aiWriter}>
          <CompactSelect
            label="Relationship"
            options={relationshipOptions}
            placeholder="Select relationship"
            selected={relationship}
            isOpen={openSelect === 'relationship'}
            onSelect={(value) => {
              setRelationship(value);
              setOpenSelect(null);
            }}
            onToggle={() => setOpenSelect((current) => (current === 'relationship' ? null : 'relationship'))}
          />
          <CompactSelect
            label="Occasion"
            options={occasionOptions}
            placeholder="Select occasion"
            selected={occasion}
            isOpen={openSelect === 'occasion'}
            onSelect={(value) => {
              setOccasion(value);
              setOpenSelect(null);
            }}
            onToggle={() => setOpenSelect((current) => (current === 'occasion' ? null : 'occasion'))}
          />
          <OptionGroup
            label="Tone"
            options={toneOptions.map((option) => option.label)}
            selected={toneOptions.find((option) => option.value === tone)?.label ?? toneOptions[0].label}
            onSelect={(label) => {
              const selectedTone = toneOptions.find((option) => option.label === label);
              if (selectedTone) {
                setTone(selectedTone.value);
              }
            }}
          />

          <TextInput
            multiline
            onChangeText={setExtra}
            placeholder="Extra context (optional)"
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.cardComposerInput, styles.contextInput]}
            value={extra}
          />

          <Pressable
            accessibilityRole="button"
            disabled={isGenerating}
            onPress={handleGenerate}
            style={({ pressed }) => [styles.aiButton, isGenerating && styles.disabled, pressed && !isGenerating && styles.pressed]}>
            {isGenerating ? <ActivityIndicator color={theme.colors.white} size="small" /> : null}
            <Text style={styles.aiButtonText}>{isGenerating ? 'Generating...' : 'Generate message'}</Text>
          </Pressable>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

function CompactSelect({
  isOpen,
  label,
  onSelect,
  onToggle,
  options,
  placeholder,
  selected,
}: {
  isOpen: boolean;
  label: string;
  onSelect: (value: string) => void;
  onToggle: () => void;
  options: readonly string[];
  placeholder: string;
  selected: string;
}) {
  return (
    <View style={styles.selectGroup}>
      <Text style={styles.optionLabel}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={onToggle}
        style={({ pressed }) => [styles.selectButton, pressed && styles.pressed]}>
        <Text numberOfLines={1} style={[styles.selectButtonText, !selected && styles.selectPlaceholder]}>
          {selected || placeholder}
        </Text>
        <ChevronDown color={theme.colors.primary} size={17} strokeWidth={2.4} style={isOpen && styles.chevronOpen} />
      </Pressable>
      {isOpen ? (
        <View style={styles.selectMenu}>
          {options.map((option) => {
            const isSelected = selected === option;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={option}
                onPress={() => onSelect(option)}
                style={({ pressed }) => [styles.selectOption, isSelected && styles.selectOptionSelected, pressed && styles.pressed]}>
                <Text style={[styles.selectOptionText, isSelected && styles.selectOptionTextSelected]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function OptionGroup({
  label,
  onSelect,
  options,
  selected,
}: {
  label: string;
  onSelect: (value: string) => void;
  options: readonly string[];
  selected: string;
}) {
  return (
    <View style={styles.optionGroup}>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={styles.optionWrap}>
        {options.map((option) => {
          const isSelected = selected === option;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={option}
              onPress={() => onSelect(option)}
              style={({ pressed }) => [
                styles.optionChip,
                isSelected && styles.optionChipSelected,
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  aiButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 42,
    paddingHorizontal: theme.spacing.lg,
  },
  aiButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
  },
  cardComposer: {
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(46, 139, 52, 0.22)',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.sm,
    marginTop: 14,
    padding: 12,
  },
  cardComposerCount: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 10,
    textAlign: 'right',
  },
  cardComposerInput: {
    backgroundColor: theme.colors.white,
    borderColor: 'rgba(31, 42, 36, 0.09)',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    color: theme.colors.text,
    fontFamily: Fonts.sans,
    fontSize: 13,
    minHeight: 86,
    padding: 10,
    textAlignVertical: 'top',
  },
  cardComposerTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
  },
  cardComposerSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 16,
  },
  cardComposerTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 7,
  },
  cardComposerTitleCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  aiToggle: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: 'rgba(46, 139, 52, 0.16)',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
    minHeight: 54,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  aiToggleCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  aiToggleText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 15,
  },
  aiToggleTitle: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
  },
  aiWriter: {
    gap: theme.spacing.sm,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  contextInput: {
    minHeight: 54,
  },
  disabled: {
    opacity: 0.62,
  },
  errorText: {
    color: theme.colors.danger,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 17,
  },
  optionChip: {
    backgroundColor: theme.colors.white,
    borderColor: 'rgba(31, 42, 36, 0.1)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  optionChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionGroup: {
    gap: 7,
  },
  optionLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  optionText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
  },
  optionTextSelected: {
    color: theme.colors.white,
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
  selectButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: 'rgba(31, 42, 36, 0.1)',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 42,
    paddingHorizontal: 11,
  },
  selectButtonText: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    minWidth: 0,
  },
  selectGroup: {
    gap: 7,
  },
  selectMenu: {
    backgroundColor: theme.colors.white,
    borderColor: 'rgba(31, 42, 36, 0.1)',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  selectOption: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 11,
  },
  selectOptionSelected: {
    backgroundColor: theme.colors.greenSoft,
  },
  selectOptionText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
  },
  selectOptionTextSelected: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
  },
  selectPlaceholder: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
  },
  writeLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
});
