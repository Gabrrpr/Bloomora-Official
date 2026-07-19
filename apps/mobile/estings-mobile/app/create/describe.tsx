import { requireOptionalNativeModule } from 'expo';
import { router } from 'expo-router';
import { Info, RotateCcw } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AiArrangementComposer } from '@/components/ai-arrangement-composer';
import { AiArrangementReview } from '@/components/ai-arrangement-review';
import { AiArrangementResult } from '@/components/ai-arrangement-result';
import { AiCapabilitiesSheet } from '@/components/ai-capabilities-sheet';
import { AppPageHeader } from '@/components/app-page-header';
import { QuantityDetailsSheet } from '@/components/arrangement-validation-recovery';
import { type Product } from '@/constants/shop';
import { theme } from '@/constants/theme';
import { requireSignedIn } from '@/services/auth-guard';
import { getAuthSession } from '@/services/auth-session';
import {
  checkAndGenerate,
  DEFAULT_CUSTOMIZATION_RULES,
  getAiUsage,
  getCustomizationRules,
  isCustomizationEnabled,
  type AiUsage,
  type CustomizationRules,
  type DyaRecipePreview,
  type GenerationResult,
  type QuantityValidation,
} from '@/services/customization-api';
import { addAiArrangementToCart } from '@/services/cart-storage';
import { shopApi } from '@/services/shop-api';

const MAX_PROMPT_LENGTH = 500;
const GENERATION_PROBLEM_MESSAGE = 'There is a problem generating this arrangement. Please try again.';

function formatGenerationError(message?: string | null, fallback = GENERATION_PROBLEM_MESSAGE) {
  const trimmedMessage = message?.trim();

  if (!trimmedMessage || /internal\s+server\s+error/i.test(trimmedMessage)) {
    return fallback;
  }

  return trimmedMessage;
}

type SpeechRecognitionModule = {
  abort: () => void;
  addListener: (eventName: string, listener: (event: any) => void) => { remove: () => void };
  isRecognitionAvailable: () => boolean;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  start: (options: Record<string, unknown>) => void;
  stop: () => void;
};

function getSpeechRecognitionModule(): SpeechRecognitionModule | null {
  return requireOptionalNativeModule<SpeechRecognitionModule>('ExpoSpeechRecognition');
}

function inferArrangementType(prompt: string): keyof CustomizationRules['arrangement_limits'] {
  const normalized = prompt.toLowerCase();
  if (/\b(flower\s*box|gift\s*box|boxed)\b/.test(normalized)) return 'box';
  if (/\bvase\b/.test(normalized)) return 'vase';
  return 'bouquet';
}

export default function DescribeArrangementScreen() {
  const insets = useSafeAreaInsets();
  const promptInputRef = useRef<TextInput>(null);
  const speechPromptBase = useRef('');

  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [recipePreview, setRecipePreview] = useState<DyaRecipePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiUsage, setAiUsage] = useState<AiUsage | null>(null);
  const [customizationEnabled, setCustomizationEnabled] = useState(true);
  const [customizationRules, setCustomizationRules] = useState<CustomizationRules>(DEFAULT_CUSTOMIZATION_RULES);
  const [quantityValidation, setQuantityValidation] = useState<QuantityValidation | null>(null);
  const [isQuantityDetailsVisible, setIsQuantityDetailsVisible] = useState(false);
  const [isCapabilitiesVisible, setIsCapabilitiesVisible] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [addOns, setAddOns] = useState<Product[]>([]);
  const [arrangementName, setArrangementName] = useState('AI Arrangement');
  const [cardMessage, setCardMessage] = useState('');
  const [isLoadingAddOns, setIsLoadingAddOns] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<ReadonlySet<string>>(() => new Set());
  const [isListening, setIsListening] = useState(false);
  const [speechLevel, setSpeechLevel] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoadingAddOns(true);

    shopApi.getAddOns()
      .then((nextAddOns) => {
        if (active) setAddOns(nextAddOns);
      })
      .catch(() => {
        if (active) setAddOns([]);
      })
      .finally(() => {
        if (active) setIsLoadingAddOns(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const speechModule = getSpeechRecognitionModule();
    if (!speechModule) return;

    const subscriptions = [
      speechModule.addListener('start', () => {
        setIsListening(true);
        setSpeechLevel(0.35);
      }),
      speechModule.addListener('end', () => {
        setIsListening(false);
        setSpeechLevel(0);
      }),
      speechModule.addListener('result', (event) => {
        const transcript = event.results?.[0]?.transcript?.trim();
        if (!transcript) return;

        const base = speechPromptBase.current.trim();
        setPrompt((base ? `${base} ${transcript}` : transcript).slice(0, MAX_PROMPT_LENGTH));
        setQuantityValidation(null);
        setIsQuantityDetailsVisible(false);
      }),
      speechModule.addListener('volumechange', (event) => {
        setSpeechLevel(Math.min(Math.max((event.value + 2) / 12, 0.08), 1));
      }),
      speechModule.addListener('error', (event) => {
        setIsListening(false);
        setSpeechLevel(0);
        setError(event.message || 'Voice input could not start. Please try again.');
      }),
    ];

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
      speechModule.abort();
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadScreenData() {
      try {
        const [session, toggleResponse, usageResponse, rulesResponse] = await Promise.all([
          getAuthSession(),
          isCustomizationEnabled().catch(() => ({ enabled: true })),
          getAiUsage().catch(() => ({ remaining: 5, limit: 5 })),
          getCustomizationRules().catch(() => DEFAULT_CUSTOMIZATION_RULES),
        ]);

        if (!active) return;
        setIsSignedIn(Boolean(session));
        setCustomizationEnabled(toggleResponse.enabled);
        setAiUsage(usageResponse);
        setCustomizationRules(rulesResponse);
      } catch {
        if (active) setCustomizationEnabled(true);
      }
    }

    loadScreenData();
    return () => {
      active = false;
    };
  }, []);

  const handlePromptChange = useCallback((value: string) => {
    setPrompt(value);
    setQuantityValidation(null);
    setIsQuantityDetailsVisible(false);
    setRecipePreview(null);
  }, []);

  const handleSelectExample = useCallback((example: string) => {
    handlePromptChange(example);
    promptInputRef.current?.focus();
  }, [handlePromptChange]);

  const handleVoiceInput = useCallback(async () => {
    if (isProcessing) return;

    const speechModule = getSpeechRecognitionModule();
    if (!speechModule) {
      setIsListening(false);
      setSpeechLevel(0);
      setError('Voice input needs a rebuilt development app with speech recognition enabled.');
      return;
    }

    if (isListening) {
      try {
        speechModule.stop();
      } catch {
        setIsListening(false);
        setSpeechLevel(0);
      }
      return;
    }

    try {
      const permissions = await speechModule.requestPermissionsAsync();
      if (!permissions.granted) {
        setError('Microphone and speech recognition permissions are needed for voice input.');
        return;
      }
      if (!speechModule.isRecognitionAvailable()) {
        setError('Speech recognition is not available on this device.');
        return;
      }

      speechPromptBase.current = prompt;
      setError(null);
      speechModule.start({
        continuous: false,
        interimResults: true,
        lang: 'en-US',
        volumeChangeEventOptions: { enabled: true, intervalMillis: 120 },
      });
    } catch {
      setIsListening(false);
      setSpeechLevel(0);
      setError('Voice input could not start. Rebuild the app and try again.');
    }
  }, [isListening, isProcessing, prompt]);

  const handleReview = useCallback(async () => {
    if (!customizationEnabled) {
      setError('AI Customization is temporarily disabled during peak seasons.');
      return;
    }
    if (!prompt.trim() || isProcessing) return;

    const session = await requireSignedIn('review your arrangement');
    if (!session) {
      setIsSignedIn(false);
      return;
    }
    setIsSignedIn(true);

    setIsProcessing(true);
    setError(null);
    setQuantityValidation(null);
    setIsQuantityDetailsVisible(false);
    try {
      const data = await checkAndGenerate({ prompt_text: prompt.trim(), review_only: true });
      if (data.success && data.price_breakdown) {
        const arrangementType = data.arrangement_type ?? inferArrangementType(prompt);
        setRecipePreview({
          arrangementLabel: customizationRules.arrangement_limits[arrangementType].label,
          arrangementType,
          items: data.price_breakdown.items,
          totalPrice: data.price_breakdown.total_price,
        });
      } else if (data.validation) {
        setQuantityValidation(data.validation);
        setAiUsage((current) => current
          ? { ...current, remaining: data.remaining_generations ?? current.remaining }
          : current);
      } else {
        setError(formatGenerationError(data.message, 'A complete recipe could not be prepared. Try another description.'));
      }
    } catch (reviewError: unknown) {
      const message = reviewError instanceof Error ? reviewError.message : null;
      setError(formatGenerationError(message, 'The recipe could not be reviewed. Please try again.'));
    } finally {
      setIsProcessing(false);
    }
  }, [customizationEnabled, customizationRules, isProcessing, prompt]);

  const handleGenerate = useCallback(async () => {
    if (!recipePreview || isProcessing) return;

    const session = await requireSignedIn('generate your arrangement');
    if (!session) {
      setIsSignedIn(false);
      return;
    }
    setIsSignedIn(true);

    if (aiUsage?.remaining === 0) {
      setError(`You have reached your daily limit of ${aiUsage.limit} AI generations. Please try again tomorrow.`);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setQuantityValidation(null);
    setIsQuantityDetailsVisible(false);
    setResult(null);
    setAddedToCart(false);

    try {
      const data = await checkAndGenerate({ prompt_text: prompt.trim() });

      if (data.success) {
        setResult(data);
        setArrangementName(data.price_breakdown?.items?.[0]?.product_name || 'AI Arrangement');
        setCardMessage('');
        setSelectedAddOnIds(new Set());
        setAiUsage((current) => current
          ? { ...current, remaining: data.remaining_generations ?? current.remaining }
          : current);
      } else if (data.validation) {
        setRecipePreview(null);
        setQuantityValidation(data.validation);
        setAiUsage((current) => current
          ? { ...current, remaining: data.remaining_generations ?? current.remaining }
          : current);
      } else {
        setError(formatGenerationError(data.message, 'Generation failed. Please try again.'));
      }
    } catch (generationError: unknown) {
      const message = generationError instanceof Error ? generationError.message : null;
      setError(formatGenerationError(message));
    } finally {
      setIsProcessing(false);
    }
  }, [aiUsage, isProcessing, prompt, recipePreview]);

  const handleEditPreview = useCallback(() => {
    setRecipePreview(null);
    setError(null);
    requestAnimationFrame(() => promptInputRef.current?.focus());
  }, []);

  const handleEditGeneratedPrompt = useCallback(() => {
    setResult(null);
    setRecipePreview(null);
    setError(null);
    setAddedToCart(false);
    requestAnimationFrame(() => promptInputRef.current?.focus());
  }, []);

  const handleRegenerateResult = useCallback(async () => {
    if (!result || isProcessing) return;
    const session = await requireSignedIn('regenerate your arrangement');
    if (!session) return;
    if (aiUsage?.remaining === 0) {
      Alert.alert('Daily limit reached', `You have reached your daily limit of ${aiUsage.limit} AI generations.`);
      return;
    }
    setIsProcessing(true);
    try {
      const data = await checkAndGenerate({ prompt_text: prompt.trim() });
      if (data.success) {
        setResult(data);
        setAddedToCart(false);
        setAiUsage(current => current
          ? { ...current, remaining: data.remaining_generations ?? current.remaining }
          : current);
      } else if (data.validation) {
        setResult(null);
        setRecipePreview(null);
        setQuantityValidation(data.validation);
      } else {
        Alert.alert('Could not regenerate', formatGenerationError(data.message));
      }
    } catch (regenerationError: unknown) {
      const message = regenerationError instanceof Error ? regenerationError.message : null;
      Alert.alert('Could not regenerate', formatGenerationError(message));
    } finally {
      setIsProcessing(false);
    }
  }, [aiUsage, isProcessing, prompt, result]);

  const handleToggleAddOn = useCallback((addOnId: string) => {
    setSelectedAddOnIds((current) => {
      const next = new Set(current);
      if (next.has(addOnId)) next.delete(addOnId);
      else next.add(addOnId);
      return next;
    });
    setAddedToCart(false);
  }, []);

  const handleArrangementNameChange = useCallback((value: string) => {
    setArrangementName(value);
    setAddedToCart(false);
  }, []);

  const handleCardMessageChange = useCallback((value: string) => {
    setCardMessage(value);
    setAddedToCart(false);
  }, []);

  const dismissError = useCallback(() => setError(null), []);
  const openCapabilities = useCallback(() => setIsCapabilitiesVisible(true), []);
  const closeCapabilities = useCallback(() => setIsCapabilitiesVisible(false), []);
  const openQuantityDetails = useCallback(() => setIsQuantityDetailsVisible(true), []);
  const closeQuantityDetails = useCallback(() => setIsQuantityDetailsVisible(false), []);

  const handleAddToCart = useCallback(async () => {
    if (!result || addingToCart) return false;
    if (addedToCart) return true;

    const session = await requireSignedIn('add this arrangement to your cart');
    if (!session) return false;

    setAddingToCart(true);
    try {
      const breakdownNames = result.price_breakdown?.items
        ?.map((item) => `${item.quantity}x ${item.product_name}`)
        .join(', ') || 'Custom arrangement';
      const totalPricePesos = result.price_breakdown?.total_price || 0;
      const selectedAddOns = addOns.filter((item) => selectedAddOnIds.has(item.id));
      const addOnTotalPesos = selectedAddOns.reduce((total, item) => total + item.priceCents / 100, 0);

      await addAiArrangementToCart({
        addOns: selectedAddOns,
        arrangementDetails: {
          arrangementId: result.arrangement_id,
          basePriceCents: Math.round(totalPricePesos * 100),
          prompt,
          recipeItems: result.price_breakdown?.items?.map((item) => ({
            imageUrl: item.image_url ?? undefined,
            materialType: item.material_type,
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
            subtotalCents: Math.round(item.subtotal * 100),
            unitPriceCents: Math.round(item.unit_price * 100),
          })) ?? [],
          source: 'describe',
        },
        arrangementId: result.arrangement_id,
        cardMessage,
        description: `Contains: ${breakdownNames}.`,
        imageUrl: result.generated_image_url,
        name: arrangementName.trim() || 'AI Arrangement',
        priceCents: Math.round((totalPricePesos + addOnTotalPesos) * 100),
      });

      setAddedToCart(true);
      return true;
    } catch (addError: unknown) {
      Alert.alert('Error', addError instanceof Error ? addError.message : 'Failed to add to cart. Please try again.');
      return false;
    } finally {
      setAddingToCart(false);
    }
  }, [addOns, addedToCart, addingToCart, arrangementName, cardMessage, prompt, result, selectedAddOnIds]);

  const handleBuyNow = useCallback(async () => {
    const didAdd = await handleAddToCart();
    if (didAdd) router.push('/(tabs)/cart');
  }, [handleAddToCart]);

  const applySuggestedPrompt = useCallback(() => {
    if (!quantityValidation?.suggested_prompt) return;
    setPrompt(quantityValidation.suggested_prompt);
    setQuantityValidation(null);
    setIsQuantityDetailsVisible(false);
    setError(null);
    promptInputRef.current?.focus();
  }, [quantityValidation]);

  const handleStartOver = useCallback(() => {
    setResult(null);
    setError(null);
    setPrompt('');
    setAddedToCart(false);
    setArrangementName('AI Arrangement');
    setCardMessage('');
    setSelectedAddOnIds(new Set());
    setQuantityValidation(null);
    setIsQuantityDetailsVisible(false);
    setRecipePreview(null);
  }, []);

  const buildArrangementManually = useCallback(() => {
    setIsQuantityDetailsVisible(false);
    router.push('/create/mix-and-match');
  }, []);

  const showResults = Boolean(result?.success);

  const headerAction = showResults ? (
    <Pressable
      accessibilityHint="Clears this result and returns to the description"
      accessibilityLabel="New prompt"
      accessibilityRole="button"
      hitSlop={8}
      onPress={handleStartOver}
      style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}>
      <RotateCcw color={theme.colors.text} size={20} strokeWidth={2.2} />
    </Pressable>
  ) : (
    <Pressable
      accessibilityLabel="What can I create?"
      accessibilityRole="button"
      hitSlop={8}
      onPress={openCapabilities}
      style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}>
      <Info color={theme.colors.text} size={20} strokeWidth={2.2} />
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <AppPageHeader rightAction={headerAction} title="Describe Your Arrangement" />

      {showResults && result ? (
        <AiArrangementResult
          addedToCart={addedToCart}
          addingToCart={addingToCart}
          addOns={addOns}
          arrangementName={arrangementName}
          cardMessage={cardMessage}
          isLoadingAddOns={isLoadingAddOns}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          onChangeArrangementName={handleArrangementNameChange}
          onChangeCardMessage={handleCardMessageChange}
          onEditPrompt={handleEditGeneratedPrompt}
          onRegenerate={handleRegenerateResult}
          onToggleAddOn={handleToggleAddOn}
          prompt={prompt}
          result={result}
          regenerating={isProcessing}
          selectedAddOnIds={selectedAddOnIds}
        />
      ) : recipePreview ? (
        <AiArrangementReview
          isGenerating={isProcessing}
          onEdit={handleEditPreview}
          onGenerate={handleGenerate}
          preview={recipePreview}
          prompt={prompt}
        />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
          style={styles.promptRoot}>
          <ScrollView
            contentContainerStyle={[styles.promptScroll, { paddingBottom: Math.max(insets.bottom, 20) }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <AiArrangementComposer
              aiUsage={aiUsage}
              error={error}
              inputRef={promptInputRef}
              isListening={isListening}
              isProcessing={isProcessing}
              isSignedIn={isSignedIn}
              maxPromptLength={MAX_PROMPT_LENGTH}
              onApplySuggestion={applySuggestedPrompt}
              onBuildManually={buildArrangementManually}
              onChangePrompt={handlePromptChange}
              onDismissError={dismissError}
              onGenerate={handleReview}
              onOpenCapabilities={openCapabilities}
              onOpenQuantityDetails={openQuantityDetails}
              onSelectExample={handleSelectExample}
              onVoiceInput={handleVoiceInput}
              prompt={prompt}
              quantityValidation={quantityValidation}
              speechLevel={speechLevel}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <AiCapabilitiesSheet
        onDismiss={closeCapabilities}
        rules={customizationRules}
        visible={isCapabilitiesVisible}
      />

      {quantityValidation ? (
        <QuantityDetailsSheet
          onApplySuggestion={applySuggestedPrompt}
          onBuildManually={buildArrangementManually}
          onDismiss={closeQuantityDetails}
          validation={quantityValidation}
          visible={isQuantityDetailsVisible}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.surfaceAlt, flex: 1 },
  promptRoot: { flex: 1 },
  promptScroll: { flexGrow: 1 },
  headerAction: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  pressed: { opacity: 0.55 },
});
