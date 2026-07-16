import { ArrowRight, Mic, Sparkles, TriangleAlert, X } from 'lucide-react-native';
import { memo, type ReactNode, type RefObject, useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ArrangementValidationRecovery } from '@/components/arrangement-validation-recovery';
import { AI_EASE_OUT, AI_MOTION, MotionPressable } from '@/components/ai-arrangement-motion';
import { AiPreviewDisclaimer } from '@/components/ai-preview-disclaimer';
import { Fonts, theme } from '@/constants/theme';
import type { AiUsage, QuantityValidation } from '@/services/customization-api';

const EXAMPLE_PROMPTS = [
  {
    label: 'Anniversary bouquet',
    prompt: 'Romantic pink bouquet with soft white accents for an anniversary',
  },
  {
    label: 'Birthday sunflowers',
    prompt: 'Cheerful sunflower arrangement for a birthday',
  },
  {
    label: 'Wedding centerpiece',
    prompt: 'Elegant white and green wedding centerpiece',
  },
] as const;

const COMPOSER_INPUT_MIN_HEIGHT = 24;
const COMPOSER_INPUT_MAX_HEIGHT = 128;

type AiArrangementComposerProps = {
  aiUsage: AiUsage | null;
  error: string | null;
  inputRef: RefObject<TextInput | null>;
  isListening: boolean;
  isProcessing: boolean;
  isSignedIn: boolean;
  maxPromptLength: number;
  onApplySuggestion: () => void;
  onBuildManually: () => void;
  onChangePrompt: (value: string) => void;
  onDismissError: () => void;
  onGenerate: () => void;
  onOpenCapabilities: () => void;
  onOpenQuantityDetails: () => void;
  onSelectExample: (prompt: string) => void;
  onVoiceInput: () => void;
  prompt: string;
  quantityValidation: QuantityValidation | null;
  speechLevel: number;
};

export const AiArrangementComposer = memo(function AiArrangementComposer({
  aiUsage,
  error,
  inputRef,
  isListening,
  isProcessing,
  isSignedIn,
  maxPromptLength,
  onApplySuggestion,
  onBuildManually,
  onChangePrompt,
  onDismissError,
  onGenerate,
  onOpenCapabilities,
  onOpenQuantityDetails,
  onSelectExample,
  onVoiceInput,
  prompt,
  quantityValidation,
  speechLevel,
}: AiArrangementComposerProps) {
  const reduceMotion = useReducedMotion();
  const entrance = useSharedValue(reduceMotion ? 1 : 0);
  const focus = useSharedValue(0);
  const inputHeight = useSharedValue(COMPOSER_INPUT_MIN_HEIGHT);
  const hasPrompt = prompt.trim().length > 0;
  const showExamples = !hasPrompt && !error && !quantityValidation;
  const welcomeCopy = getWelcomeCopy({ error, hasPrompt, isListening, isProcessing, quantityValidation });

  useEffect(() => {
    entrance.value = withTiming(1, {
      duration: reduceMotion ? 100 : AI_MOTION.introEntrance,
      easing: AI_EASE_OUT,
    });
  }, [entrance, reduceMotion]);

  useEffect(() => {
    if (prompt.length === 0) {
      inputHeight.value = withTiming(COMPOSER_INPUT_MIN_HEIGHT, {
        duration: reduceMotion ? 60 : AI_MOTION.composerFocus,
        easing: AI_EASE_OUT,
      });
    }
  }, [inputHeight, prompt.length, reduceMotion]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: reduceMotion ? 0 : interpolate(entrance.value, [0, 1], [8, 0]) }],
  }));

  const composerStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focus.value,
      [0, 1],
      [theme.colors.border, 'rgba(46, 139, 52, 0.72)'],
    ),
    shadowOpacity: interpolate(focus.value, [0, 1], [0.05, 0.12]),
  }));

  const inputViewportStyle = useAnimatedStyle(() => ({ height: inputHeight.value }));

  const handleInputContentSizeChange = (contentHeight: number) => {
    const nextHeight = Math.min(
      COMPOSER_INPUT_MAX_HEIGHT,
      Math.max(COMPOSER_INPUT_MIN_HEIGHT, Math.ceil(contentHeight)),
    );
    inputHeight.value = withTiming(nextHeight, {
      duration: reduceMotion ? 60 : 160,
      easing: AI_EASE_OUT,
    });
  };

  const updateFocus = (nextValue: number) => {
    focus.value = withTiming(nextValue, {
      duration: reduceMotion ? 80 : AI_MOTION.composerFocus,
      easing: AI_EASE_OUT,
    });
  };

  const usageLabel = !isSignedIn
    ? 'Review first · sign in to create'
    : aiUsage
      ? `Review first · ${aiUsage.remaining} of ${aiUsage.limit} creations left`
      : 'Review first · no AI used';

  return (
    <Animated.View style={[styles.content, entranceStyle]}>
      <View style={styles.welcomeArea}>
        <AnimatedWelcomeCopy key={`${welcomeCopy.title}-${welcomeCopy.subtitle}`} title={welcomeCopy.title} subtitle={welcomeCopy.subtitle}>
          <View style={styles.heroIcon}>
            <Sparkles color={theme.colors.primary} size={23} strokeWidth={2.2} />
          </View>
        </AnimatedWelcomeCopy>
      </View>

      <View style={styles.composerCluster}>
        {error ? <SystemBanner message={error} onDismiss={onDismissError} /> : null}

        {quantityValidation ? (
          <ArrangementValidationRecovery
            onApplySuggestion={onApplySuggestion}
            onBuildManually={onBuildManually}
            onOpenDetails={onOpenQuantityDetails}
            validation={quantityValidation}
          />
        ) : null}

        {showExamples ? (
          <AnimatedReveal style={styles.examplesSection}>
            <ScrollView
              contentContainerStyle={styles.exampleList}
              horizontal
              keyboardShouldPersistTaps="handled"
              showsHorizontalScrollIndicator={false}>
              {EXAMPLE_PROMPTS.map((example) => (
                <MotionPressable
                  accessibilityHint="Fills the description without generating"
                  accessibilityRole="button"
                  key={example.label}
                  onPress={() => onSelectExample(example.prompt)}
                  style={styles.exampleChip}>
                  <Text numberOfLines={1} style={styles.exampleText}>{example.label}</Text>
                </MotionPressable>
              ))}
            </ScrollView>
          </AnimatedReveal>
        ) : null}

        <Animated.View style={[styles.composer, composerStyle]}>
          <Animated.View style={[styles.inputViewport, inputViewportStyle]}>
            <TextInput
            ref={inputRef}
            accessibilityHint="Include the arrangement style, flowers, colors, occasion, and optional quantities"
            accessibilityLabel="Describe your flower arrangement"
            cursorColor={theme.colors.primary}
            editable={!isProcessing}
            maxLength={maxPromptLength}
            multiline
            onBlur={() => updateFocus(0)}
            onChangeText={onChangePrompt}
            onContentSizeChange={(event) => handleInputContentSizeChange(event.nativeEvent.contentSize.height)}
            onFocus={() => updateFocus(1)}
            placeholder="Describe your arrangement…"
            placeholderTextColor="#89928B"
            scrollEnabled
            style={styles.input}
            textAlignVertical="top"
            value={prompt}
            />
          </Animated.View>

          {isProcessing ? (
            <View accessibilityLiveRegion="polite" accessibilityRole="progressbar" style={styles.processingRow}>
              <ActivityIndicator color={theme.colors.primary} size="small" />
              <Text style={styles.processingText}>Reviewing your recipe…</Text>
            </View>
          ) : (
            <View style={styles.composerFooter}>
              <View style={styles.composerMeta}>
                <Text numberOfLines={1} style={styles.usageText}>{usageLabel}</Text>
                <Text style={styles.characterCount}>{prompt.length}/{maxPromptLength}</Text>
              </View>
              <VoiceButton
                isListening={isListening}
                level={speechLevel}
                onPress={onVoiceInput}
              />
              <MotionPressable
                accessibilityHint="Builds a product and price review without generating an AI image"
                accessibilityLabel="Review arrangement recipe"
                accessibilityRole="button"
                accessibilityState={{ disabled: !hasPrompt }}
                disabled={!hasPrompt}
                onPress={onGenerate}
                style={[styles.sendButton, !hasPrompt && styles.sendButtonDisabled]}>
                <ArrowRight color={theme.colors.white} size={19} strokeWidth={2.4} />
              </MotionPressable>
            </View>
          )}
        </Animated.View>

        <AiPreviewDisclaimer />

        <MotionPressable
          accessibilityHint="Shows arrangement sizes and inventory guidance"
          accessibilityRole="button"
          onPress={onOpenCapabilities}
          style={styles.capabilitiesButton}>
          <Text style={styles.capabilitiesText}>What can I create?</Text>
        </MotionPressable>
      </View>
    </Animated.View>
  );
});

function AnimatedWelcomeCopy({
  children,
  subtitle,
  title,
}: {
  children: ReactNode;
  subtitle: string;
  title: string;
}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: reduceMotion ? 80 : 180,
      easing: AI_EASE_OUT,
    });
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: reduceMotion ? 0 : interpolate(progress.value, [0, 1], [6, 0]) }],
  }));

  return (
    <Animated.View accessibilityLiveRegion="polite" style={[styles.intro, animatedStyle]}>
      {children}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Animated.View>
  );
}

function AnimatedReveal({ children, style }: { children: ReactNode; style?: object }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: reduceMotion ? 80 : AI_MOTION.statusEntrance,
      easing: AI_EASE_OUT,
    });
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: reduceMotion ? 0 : interpolate(progress.value, [0, 1], [6, 0]) }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

function getWelcomeCopy({
  error,
  hasPrompt,
  isListening,
  isProcessing,
  quantityValidation,
}: {
  error: string | null;
  hasPrompt: boolean;
  isListening: boolean;
  isProcessing: boolean;
  quantityValidation: QuantityValidation | null;
}) {
  if (isProcessing) {
    return { title: 'Preparing your review…', subtitle: 'Gemini is matching your request to safe inventory and pricing.' };
  }
  if (isListening) {
    return { title: 'I’m listening…', subtitle: 'Tell us the flowers, colors, occasion, and presentation.' };
  }
  if (quantityValidation) {
    return { title: 'Here’s a recipe that works', subtitle: 'Review the stocked materials before continuing.' };
  }
  if (error) {
    return { title: 'Let’s try that again', subtitle: 'You can edit your description and send it again.' };
  }
  if (hasPrompt) {
    return { title: 'Ready when you are', subtitle: 'Add any finishing details, then create your preview.' };
  }
  return {
    title: 'What would you like us to create?',
    subtitle: 'Describe the flowers, colors, occasion, and presentation.',
  };
}

function VoiceButton({
  isListening,
  level,
  onPress,
}: {
  isListening: boolean;
  level: number;
  onPress: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const intensity = useSharedValue(0);

  useEffect(() => {
    intensity.value = withTiming(isListening ? Math.max(level, 0.18) : 0, {
      duration: isListening && !reduceMotion ? 120 : 80,
      easing: AI_EASE_OUT,
    });
  }, [intensity, isListening, level, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(intensity.value, [0, 1], [theme.colors.surfaceAlt, theme.colors.greenSoft]),
    borderColor: interpolateColor(intensity.value, [0, 1], [theme.colors.border, theme.colors.primary]),
    transform: [{ scale: reduceMotion ? 1 : interpolate(intensity.value, [0, 1], [1, 1.06]) }],
  }));

  return (
    <MotionPressable
      accessibilityHint={isListening ? 'Stops voice input' : 'Adds your spoken description to the prompt'}
      accessibilityLabel={isListening ? 'Stop listening' : 'Describe with your voice'}
      accessibilityRole="button"
      accessibilityState={{ selected: isListening }}
      onPress={onPress}
      style={[styles.voiceButton, animatedStyle]}>
      <Mic color={isListening ? theme.colors.primary : theme.colors.textMuted} size={19} strokeWidth={2.2} />
    </MotionPressable>
  );
}

function SystemBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: reduceMotion ? 100 : AI_MOTION.statusEntrance,
      easing: AI_EASE_OUT,
    });
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: reduceMotion ? 0 : interpolate(progress.value, [0, 1], [-6, 0]) }],
  }));

  return (
    <Animated.View accessibilityLiveRegion="assertive" accessibilityRole="alert" style={[styles.errorBanner, animatedStyle]}>
      <TriangleAlert color={theme.colors.danger} size={18} strokeWidth={2.2} />
      <Text style={styles.errorText}>{message}</Text>
      <MotionPressable
        accessibilityLabel="Dismiss message"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onDismiss}
        style={styles.dismissButton}>
        <X color={theme.colors.textMuted} size={18} strokeWidth={2.2} />
      </MotionPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 20 },
  welcomeArea: { flex: 1, justifyContent: 'center', minHeight: 250, paddingVertical: 28 },
  intro: { alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 48,
    justifyContent: 'center',
    marginBottom: 4,
    width: 48,
  },
  title: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 24,
    lineHeight: 31,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 330,
    textAlign: 'center',
  },
  composerCluster: { gap: 10 },
  composer: {
    backgroundColor: '#F1F4F1',
    borderRadius: 26,
    borderWidth: 1.2,
    padding: 12,
    shadowColor: theme.colors.text,
    shadowOffset: { height: 3, width: 0 },
    shadowRadius: 10,
  },
  input: {
    color: theme.colors.text,
    fontFamily: Fonts.sans,
    fontSize: 15,
    height: '100%',
    lineHeight: 23,
    padding: 0,
  },
  inputViewport: { overflow: 'hidden' },
  composerFooter: { alignItems: 'center', flexDirection: 'row', gap: 8, paddingTop: 8 },
  composerMeta: { flex: 1, gap: 2, minWidth: 0 },
  usageText: { color: theme.colors.textMuted, fontFamily: Fonts.sansMedium, fontSize: 11, lineHeight: 15 },
  characterCount: { color: '#929A94', fontFamily: Fonts.sans, fontSize: 10, lineHeight: 13 },
  voiceButton: {
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sendButtonDisabled: { backgroundColor: '#BCC4BE' },
  processingRow: {
    alignItems: 'center',
    borderTopColor: theme.colors.subtleBorder,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 9,
    minHeight: 48,
    paddingTop: 12,
  },
  processingText: { color: theme.colors.primaryDark, fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  examplesSection: { marginHorizontal: -16 },
  exampleList: { gap: 8, paddingHorizontal: 16 },
  exampleChip: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  exampleText: { color: '#465048', fontFamily: Fonts.sansMedium, fontSize: 12, lineHeight: 17 },
  capabilitiesButton: { alignItems: 'center', alignSelf: 'center', justifyContent: 'center', minHeight: 36, paddingHorizontal: 12 },
  capabilitiesText: { color: theme.colors.primary, fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  errorBanner: {
    alignItems: 'flex-start',
    backgroundColor: '#FFF4F2',
    borderColor: '#F3C3BD',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    padding: 12,
  },
  errorText: { color: '#7A2E27', flex: 1, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  dismissButton: { alignItems: 'center', height: 28, justifyContent: 'center', marginRight: -4, marginTop: -4, width: 28 },
});
