import { Image } from 'expo-image';
import { requireOptionalNativeModule } from 'expo';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Info,
  LoaderCircle,
  Mic,
  RotateCcw,
  Send,
  ShoppingCart,
  Sparkles,
  X,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { AppBrandHeader, getAppBrandHeaderLayout } from '@/components/app-brand-header';
import { FloatingProductSearch } from '@/components/floating-product-search';
import { GreetingCardComposer } from '@/components/greeting-card-composer';
import { ProductAddOnSelector } from '@/components/product-add-on-selector';
import { formatPhp, type Product } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { requireSignedIn } from '@/services/auth-guard';
import { addAiArrangementToCart } from '@/services/guest-cart';
import {
  checkAndGenerate,
  getAiUsage,
  isCustomizationEnabled,
  type AiUsage,
  type GenerationResult,
} from '@/services/customization-api';
import { shopApi } from '@/services/shop-api';

// ── Constants ────────────────────────────────────────────────────────────────

const PROMPT_SAMPLES = [
  'A romantic pink bouquet for our anniversary, soft white accents, elegant wrap',
  'A cheerful birthday arrangement with bright pink petals and fresh greenery',
  'A minimalist bridal bouquet with blush flowers, airy texture, and pearl ribbon',
];

const EXAMPLE_PROMPTS = [
  "I'm ordering this for Valentine's Day. She likes pink and soft, romantic styles.",
  'Something cheerful and bright with sunflowers for a birthday.',
  'Elegant white and green arrangement for a wedding centerpiece.',
  'Soft lavender and cream bouquet for a graduation gift.',
];

const OBJECT_WORDS = ['bouquet', 'arrangement', 'flower box', 'gift', 'floral base'];

const MAX_PROMPT_LENGTH = 500;

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

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function DescribeArrangementScreen() {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [prompt, setPrompt] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiUsage, setAiUsage] = useState<AiUsage | null>(null);
  const [customizationEnabled, setCustomizationEnabled] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [addOns, setAddOns] = useState<Product[]>([]);
  const [arrangementName, setArrangementName] = useState('AI Arrangement');
  const [cardMessage, setCardMessage] = useState('');
  const [isLoadingAddOns, setIsLoadingAddOns] = useState(false);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<ReadonlySet<string>>(() => new Set());
  const [isListening, setIsListening] = useState(false);
  const [speechLevel, setSpeechLevel] = useState(0);
  const [isHeaderSolid, setIsHeaderSolid] = useState(false);
  const speechPromptBase = useRef('');

  const typedPlaceholder = useTypewriterPrompt(PROMPT_SAMPLES);
  const rollingWordIndex = useRollingWordIndex(OBJECT_WORDS);
  const hasPrompt = prompt.trim().length > 0;
  const promptFocusProgress = useSharedValue(hasPrompt ? 1 : 0);
  const headerLayout = getAppBrandHeaderLayout(width, height, insets.top);
  const side = Math.min(Math.max(width * 0.062, 20), 30);

  useEffect(() => {
    promptFocusProgress.value = withTiming(hasPrompt ? 1 : 0, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  }, [hasPrompt, promptFocusProgress]);

  useEffect(() => {
    let active = true;
    setIsLoadingAddOns(true);
    shopApi.getAddOns()
      .then((nextAddOns) => {
        if (active) {
          setAddOns(nextAddOns);
        }
      })
      .catch(() => {
        if (active) {
          setAddOns([]);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingAddOns(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const speechModule = getSpeechRecognitionModule();
    if (!speechModule) {
      return;
    }

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
        if (!transcript) {
          return;
        }

        const base = speechPromptBase.current.trim();
        const nextPrompt = base ? `${base} ${transcript}` : transcript;
        setPrompt(nextPrompt.slice(0, MAX_PROMPT_LENGTH));
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

  const introCopyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(promptFocusProgress.value, [0, 1], [1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(promptFocusProgress.value, [0, 1], [0, -10], Extrapolation.CLAMP) },
      { scale: interpolate(promptFocusProgress.value, [0, 1], [1, 0.98], Extrapolation.CLAMP) },
    ],
  }));

  const focusIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(promptFocusProgress.value, [0, 0.55, 1], [0, 0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(promptFocusProgress.value, [0, 1], [10, 0], Extrapolation.CLAMP) },
      { scale: interpolate(promptFocusProgress.value, [0, 1], [0.82, 1], Extrapolation.CLAMP) },
    ],
  }));

  // Load AI usage and customization status on mount
  useEffect(() => {
    async function load() {
      try {
        const [toggleRes, usageRes] = await Promise.all([
          isCustomizationEnabled().catch(() => ({ enabled: true })),
          getAiUsage().catch(() => ({ remaining: 5, limit: 5 })),
        ]);
        setCustomizationEnabled(toggleRes.enabled);
        setAiUsage(usageRes);
      } catch {
        setCustomizationEnabled(true);
      }
    }
    load();
  }, []);

  const handleUseExample = () => {
    const randomIndex = Math.floor(Math.random() * EXAMPLE_PROMPTS.length);
    setPrompt(EXAMPLE_PROMPTS[randomIndex]);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const shouldShowSolidHeader = event.nativeEvent.contentOffset.y > 12;
    setIsHeaderSolid((current) => (current === shouldShowSolidHeader ? current : shouldShowSolidHeader));
  };

  const handleVoiceInput = async () => {
    if (isProcessing) {
      return;
    }

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

      const available = speechModule.isRecognitionAvailable();
      if (!available) {
        setError('Speech recognition is not available on this device.');
        return;
      }

      speechPromptBase.current = prompt;
      setError(null);
      speechModule.start({
        continuous: false,
        interimResults: true,
        lang: 'en-US',
        volumeChangeEventOptions: {
          enabled: true,
          intervalMillis: 120,
        },
      });
    } catch {
      setIsListening(false);
      setSpeechLevel(0);
      setError('Voice input could not start. Rebuild the app and try again.');
    }
  };

  const handleGenerate = async () => {
    if (!customizationEnabled) {
      setError('AI Customization is temporarily disabled during peak seasons.');
      return;
    }
    if (!prompt.trim() || isProcessing) return;
    if (aiUsage && aiUsage.remaining === 0) {
      setError(`You have reached your daily limit of ${aiUsage.limit} AI generations. Please try again tomorrow.`);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setAddedToCart(false);

    try {
      // Fetch available inventory for the supercharged prompt
      let availableInventory = '';
      try {
        const products = await shopApi.getProducts();
        availableInventory = products
          .filter((p) => p.isActive && (p.stock ?? 0) > 0)
          .map((p) => p.name)
          .join(', ');
      } catch {
        // Continue without inventory — the backend will handle it
      }

      const superchargedPrompt = `Customer Request: "${prompt.trim()}". 
        If the request is vague (like just an occasion or color), act as an expert florist and invent a beautiful recipe that perfectly matches the vibe. 
        Strict inventory rules: You MUST ONLY pick flowers, vases, and wrappings from this exact list of available stock: [${availableInventory}]. 
        Strict visual rules for the image generator: Ultra-realistic 8k macro photography, studio lighting, hyper-detailed, elegant floral design, lifelike textures, natural lighting. NO artificial-looking gloss, NO cartoonish colors. Professional florist portfolio shot, eye-level, standing upright against a clean, neutral background. DO NOT use a top-down view.`;

      const data = await checkAndGenerate({ prompt_text: superchargedPrompt });

      if (data.success) {
        setResult(data);
        setArrangementName(data.price_breakdown?.items?.[0]?.product_name || 'AI Arrangement');
        setCardMessage('');
        setSelectedAddOnIds(new Set());
        setAiUsage((prev) => (prev ? { ...prev, remaining: data.remaining_generations ?? prev.remaining } : prev));

        // Scroll to results after a brief delay
        setTimeout(() => {
          scrollRef.current?.scrollTo({ animated: true, y: 0 });
        }, 300);
      } else {
        setError(data.message || 'Generation failed. Please try again.');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to generate arrangement. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToCart = async () => {
    if (!result || addingToCart) return false;

    const session = await requireSignedIn('add this arrangement to your cart');
    if (!session) return false;

    setAddingToCart(true);
    try {
      const breakdownNames =
        result.price_breakdown?.items?.map((i) => `${i.quantity}x ${i.product_name}`).join(', ') ||
        'Custom arrangement';
      const totalPricePesos = result.price_breakdown?.total_price || 0;
      const selectedAddOns = addOns.filter((item) => selectedAddOnIds.has(item.id));
      const addOnTotalPesos = selectedAddOns.reduce((total, item) => total + item.priceCents / 100, 0);

      await addAiArrangementToCart({
        addOns: selectedAddOns,
        arrangementId: result.arrangement_id,
        cardMessage,
        description: `Contains: ${breakdownNames}.`,
        imageUrl: result.generated_image_url,
        name: arrangementName.trim() || 'AI Arrangement',
        priceCents: Math.round((totalPricePesos + addOnTotalPesos) * 100),
      });

      setAddedToCart(true);
      return true;
    } catch (addError) {
      Alert.alert('Error', addError instanceof Error ? addError.message : 'Failed to add to cart. Please try again.');
      return false;
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    const didAdd = await handleAddToCart();
    if (didAdd) {
      router.push('/(tabs)/cart');
    }
  };

  const handleStartOver = () => {
    setResult(null);
    setError(null);
    setPrompt('');
    setAddedToCart(false);
    setArrangementName('AI Arrangement');
    setCardMessage('');
    setSelectedAddOnIds(new Set());
  };

  const showResults = result && result.success;

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.background}>
        <PromptBackground />
      </View>

      <AppBrandHeader
        absolute
        onSearchPress={() => setIsSearchOpen(true)}
        showSearchAction
        style={isHeaderSolid && styles.floatingHeaderSolid}
      />

      <ScrollView
        ref={scrollRef}
        bounces={false}
        contentContainerStyle={[
          styles.content,
          {
            minHeight: height,
            paddingBottom: insets.bottom + 106,
            paddingHorizontal: side,
            paddingTop: headerLayout.top + headerLayout.height + 24,
          },
        ]}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityLabel="Back to Create"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backLink}>
          <ArrowLeft color="#6A706B" size={18} strokeWidth={2.4} />
          <Text style={styles.backLinkText}>Back to Create</Text>
        </Pressable>

        {showResults ? (
          <ResultsView
            addedToCart={addedToCart}
            addingToCart={addingToCart}
            addOns={addOns}
            arrangementName={arrangementName}
            cardMessage={cardMessage}
            isLoadingAddOns={isLoadingAddOns}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onChangeArrangementName={setArrangementName}
            onChangeCardMessage={setCardMessage}
            onStartOver={handleStartOver}
            onToggleAddOn={(addOnId) => {
              setSelectedAddOnIds((current) => {
                const next = new Set(current);
                if (next.has(addOnId)) {
                  next.delete(addOnId);
                } else {
                  next.add(addOnId);
                }
                return next;
              });
            }}
            prompt={prompt}
            result={result}
            selectedAddOnIds={selectedAddOnIds}
          />
        ) : (
          <>
            <View style={styles.promptIntroFrame}>
              <Animated.View pointerEvents={hasPrompt ? 'none' : 'auto'} style={[styles.copy, introCopyStyle]}>
                <Text style={styles.eyebrow}>Build your bouquet with a prompt.</Text>
                <View style={styles.titleBlock}>
                  <Text style={styles.title}>Describe your dream</Text>
                  <RollingWord words={OBJECT_WORDS} wordIndex={rollingWordIndex} />
                </View>
              </Animated.View>
              <Animated.View pointerEvents="none" style={[styles.focusIconPanel, focusIconStyle]}>
                {isProcessing ? <PromptPetalWind width={width} /> : null}
                <View style={styles.focusIconHalo}>
                  <GradientSparkIcon animated={isProcessing} size={40} />
                </View>
              </Animated.View>
            </View>

            <View style={[styles.promptShell, isProcessing && styles.promptShellProcessing]}>
              {isProcessing ? <PromptProcessingGlow /> : null}
              <TextInput
                editable={!isProcessing}
                cursorColor="#F36F95"
                maxLength={MAX_PROMPT_LENGTH}
                multiline
                onChangeText={setPrompt}
                placeholder={typedPlaceholder}
                placeholderTextColor="#A7ABA8"
                style={[styles.input, isProcessing && styles.inputProcessing]}
                textAlignVertical="top"
                value={prompt}
              />
              <View style={styles.promptActions}>
                {isProcessing ? (
                  <Text style={styles.processingInlineText}>Creating preview...</Text>
                ) : (
                  <View style={styles.promptActionsLeft}>
                    <Pressable accessibilityRole="button" onPress={handleUseExample} style={styles.exampleButton}>
                      <Text style={styles.exampleButtonText}>Use an example</Text>
                    </Pressable>
                    <Text style={styles.charCount}>
                      {prompt.length} / {MAX_PROMPT_LENGTH}
                    </Text>
                  </View>
                )}
                <VoicePromptButton
                  disabled={isProcessing}
                  isListening={isListening}
                  level={speechLevel}
                  onPress={handleVoiceInput}
                />
                <SubmitPromptButton
                  disabled={!hasPrompt || isProcessing || (aiUsage?.remaining === 0)}
                  isProcessing={isProcessing}
                  onSubmit={handleGenerate}
                />
              </View>
            </View>

            {aiUsage ? (
              <View style={styles.usageRow}>
                <Sparkles color={theme.colors.primary} size={14} strokeWidth={2} />
                <Text style={styles.usageText}>
                  {aiUsage.remaining} / {aiUsage.limit} AI generations left today
                </Text>
              </View>
            ) : null}

          </>
        )}
      </ScrollView>

      {error ? (
        <ErrorToast
          message={error}
          onClose={() => setError(null)}
          top={headerLayout.top + headerLayout.height + 8}
        />
      ) : null}

      <FloatingProductSearch onClose={() => setIsSearchOpen(false)} visible={isSearchOpen} />
    </View>
  );
}

// ── Results View ─────────────────────────────────────────────────────────────

function ResultsView({
  addedToCart,
  addingToCart,
  addOns,
  arrangementName,
  cardMessage,
  isLoadingAddOns,
  onAddToCart,
  onBuyNow,
  onChangeArrangementName,
  onChangeCardMessage,
  onStartOver,
  onToggleAddOn,
  prompt,
  result,
  selectedAddOnIds,
}: {
  addedToCart: boolean;
  addingToCart: boolean;
  addOns: Product[];
  arrangementName: string;
  cardMessage: string;
  isLoadingAddOns: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onChangeArrangementName: (value: string) => void;
  onChangeCardMessage: (value: string) => void;
  onStartOver: () => void;
  onToggleAddOn: (addOnId: string) => void;
  prompt: string;
  result: GenerationResult;
  selectedAddOnIds: ReadonlySet<string>;
}) {
  const { width } = useWindowDimensions();
  const imageSize = width - Math.min(Math.max(width * 0.062, 20), 30) * 2;
  const totalPrice = result.price_breakdown?.total_price || 0;
  const materialCount = result.price_breakdown?.items?.reduce((total, item) => total + item.quantity, 0) ?? 0;

  return (
    <View style={styles.resultsContainer}>
      {/* Prompt recap */}
      <View style={styles.promptRecap}>
        <View style={styles.promptRecapPill}>
          <Sparkles color="#F36F95" size={13} strokeWidth={2.5} />
          <Text style={styles.promptRecapLabel}>Your prompt</Text>
        </View>
        <Text style={styles.promptRecapText} numberOfLines={2}>{prompt}</Text>
      </View>

      {/* Generated image */}
      {result.generated_image_url ? (
        <>
          <View style={styles.imageContainer}>
            <Image
              contentFit="cover"
              source={{ uri: result.generated_image_url }}
              style={[styles.generatedImage, { height: imageSize * 1.1, width: imageSize }]}
              transition={400}
            />
            <View style={styles.aiBadge}>
              <Sparkles color="#FFFFFF" size={11} strokeWidth={2.5} />
              <Text style={styles.aiBadgeText}>AI Concept Preview</Text>
            </View>
          </View>
          <View style={styles.conceptNote}>
            <Sparkles color={theme.colors.primary} size={15} strokeWidth={2.3} />
            <Text style={styles.conceptNoteText}>
              This image is an AI-generated concept to show the overall color palette and vibe. Your final handcrafted arrangement will strictly follow the exact stem counts and materials listed below in your Cost Breakdown.
            </Text>
          </View>
        </>
      ) : (
        <View style={[styles.imagePlaceholder, { height: imageSize * 0.8, width: imageSize }]}>
          <Sparkles color="#C4C9C5" size={32} strokeWidth={1.5} />
          <Text style={styles.imagePlaceholderText}>No image generated</Text>
        </View>
      )}

      {/* Details card */}
      <View style={styles.detailsCard}>
        <Text style={styles.inputLabel}>Arrangement name</Text>
        <TextInput
          maxLength={80}
          onChangeText={onChangeArrangementName}
          placeholder="Arrangement name"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.arrangementNameInput}
          value={arrangementName}
        />

        {result.price_breakdown?.items && result.price_breakdown.items.length > 0 ? (
          <>
            {/* Materials used */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Materials Used</Text>
              <View style={styles.materialsWrap}>
                {result.price_breakdown.items.map((item, idx) => (
                  <View key={`${item.product_name}-${idx}`} style={styles.materialChip}>
                    <View style={styles.materialDot} />
                    <Text style={styles.materialType}>{item.material_type}:</Text>
                    <Text style={styles.materialName}>
                      {item.product_name}
                      {item.quantity > 1 ? ` x ${item.quantity}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Cost breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Cost Breakdown</Text>
              <View style={styles.costTable}>
                {result.price_breakdown.items.map((item, idx) => (
                  <View key={`cost-${idx}`} style={styles.costRow}>
                    <Text style={styles.costItemName}>
                      {item.product_name}
                      {item.quantity > 1 ? <Text style={styles.costItemQty}> x {item.quantity}</Text> : null}
                    </Text>
                    <Text style={styles.costItemPrice}>{formatPhp(Math.round(item.subtotal * 100))}</Text>
                  </View>
                ))}
                <View style={styles.costTotalRow}>
                  <Text style={styles.costTotalLabel}>Total</Text>
                  <Text style={styles.costTotalPrice}>{formatPhp(Math.round(totalPrice * 100))}</Text>
                </View>
              </View>
            </View>
          </>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Flower Availability</Text>
          <View style={styles.availabilityPanel}>
            <Check color={theme.colors.primary} size={18} strokeWidth={2.4} />
            <Text style={styles.availabilityText}>
              {materialCount > 0
                ? `${materialCount} listed material${materialCount === 1 ? '' : 's'} were generated from current available inventory.`
                : 'The backend accepted this arrangement against current available inventory.'}
            </Text>
          </View>
        </View>

        <ProductAddOnSelector
          addOns={addOns}
          isLoading={isLoadingAddOns}
          selectedIds={selectedAddOnIds}
          onToggle={onToggleAddOn}
        />

        <GreetingCardComposer message={cardMessage} onChangeMessage={onChangeCardMessage} />

        {/* AI usage */}
        {result.remaining_generations !== undefined ? (
          <View style={styles.remainingRow}>
            <Info color="#9BA19C" size={14} strokeWidth={2} />
            <Text style={styles.remainingText}>
              {result.remaining_generations} AI generation{result.remaining_generations !== 1 ? 's' : ''} remaining
              today
            </Text>
          </View>
        ) : null}
      </View>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        {addedToCart ? (
          <View style={styles.addedFeedback}>
            <Check color={theme.colors.primary} size={18} strokeWidth={2.5} />
            <Text style={styles.addedFeedbackText}>Added to cart</Text>
          </View>
        ) : (
          <Pressable
            accessibilityLabel="Add to Cart"
            accessibilityRole="button"
            disabled={addingToCart}
            onPress={onAddToCart}
            style={({ pressed }) => [styles.addToCartButton, pressed && styles.buttonPressed]}>
            {addingToCart ? (
              <ActivityIndicator color={theme.colors.primary} size="small" />
            ) : (
              <>
                <ShoppingCart color={theme.colors.primary} size={18} strokeWidth={2.2} />
                <Text style={styles.addToCartText}>Add to Cart</Text>
              </>
            )}
          </Pressable>
        )}

        <Pressable
          accessibilityLabel="Buy Now"
          accessibilityRole="button"
          onPress={onBuyNow}
          style={({ pressed }) => [styles.buyNowButton, pressed && styles.buttonPressed]}>
          <Text style={styles.buyNowText}>Buy Now</Text>
          <ChevronRight color="#FFFFFF" size={18} strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* Start over */}
      <Pressable
        accessibilityLabel="Start Over"
        accessibilityRole="button"
        onPress={onStartOver}
        style={styles.startOverButton}>
        <RotateCcw color="#9BA19C" size={15} strokeWidth={2.2} />
        <Text style={styles.startOverText}>Start over with a new prompt</Text>
      </Pressable>

      {/* AI disclaimer */}
      <View style={styles.disclaimer}>
        <Info color="#C4C9C5" size={13} strokeWidth={2} />
        <Text style={styles.disclaimerText}>
          This is an AI-generated preview. Your bouquet will be prepared based on your selected options, and the price
          will remain the same.
        </Text>
      </View>
      <Text style={styles.poweredBy}>POWERED BY pollinations.ai</Text>
    </View>
  );
}

// ── Loading Overlay ──────────────────────────────────────────────────────────

function GradientSparkIcon({ animated, size }: { animated: boolean; size: number }) {
  const motion = useSharedValue(0);

  useEffect(() => {
    motion.value = animated
      ? withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.cubic) }), -1, true)
      : withTiming(0, { duration: 220 });
  }, [animated, motion]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(motion.value, [0, 1], [-4, 8])}deg` },
      { scale: interpolate(motion.value, [0, 1], [1, 1.12]) },
    ],
  }));

  return (
    <Animated.View style={iconStyle}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Defs>
          <LinearGradient id="focusSpark" x1="10" x2="56" y1="8" y2="58">
            <Stop offset="0" stopColor="#FF8FB2" />
            <Stop offset="0.5" stopColor="#F36F95" />
            <Stop offset="1" stopColor={theme.colors.primary} />
          </LinearGradient>
        </Defs>
        <Path
          d="M31.8 4.6c1.2 0 2.2.8 2.5 2l4.8 17.2c.2.8.9 1.5 1.7 1.7l16.8 4.8c1.1.3 1.9 1.3 1.9 2.5s-.8 2.2-1.9 2.5l-16.8 4.8c-.8.2-1.5.9-1.7 1.7L34.3 59c-.3 1.1-1.3 1.9-2.5 1.9s-2.2-.8-2.5-1.9l-4.8-17.2c-.2-.8-.9-1.5-1.7-1.7L6 35.3c-1.1-.3-1.9-1.3-1.9-2.5s.8-2.2 1.9-2.5l16.8-4.8c.8-.2 1.5-.9 1.7-1.7l4.8-17.2c.3-1.2 1.3-2 2.5-2Z"
          fill="url(#focusSpark)"
        />
        <Path d="M49.5 5.9l1.8 6.4 6.3 1.8-6.3 1.8-1.8 6.4-1.8-6.4-6.3-1.8 6.3-1.8 1.8-6.4Z" fill="#FFB8CB" />
      </Svg>
    </Animated.View>
  );
}

function PromptPetalWind({ width }: { width: number }) {
  return (
    <View pointerEvents="none" style={[styles.promptPetalLayer, { marginLeft: -width / 2, width }]}>
      {PROMPT_PETALS.map((petal, index) => (
        <PromptWindPetal key={`${petal.top}-${petal.delay}`} index={index} screenWidth={width} {...petal} />
      ))}
    </View>
  );
}

const PROMPT_PETALS = [
  { color: '#F36F95', delay: 0, scale: 1, top: 18 },
  { color: '#FFC3D0', delay: 0.18, scale: 0.78, top: 48 },
  { color: '#F8A9BC', delay: 0.38, scale: 1.18, top: 30 },
  { color: '#FFD7DE', delay: 0.62, scale: 0.9, top: 64 },
  { color: '#EC5F88', delay: 0.78, scale: 0.72, top: 8 },
];

function PromptWindPetal({
  color,
  delay,
  index,
  scale,
  screenWidth,
  top,
}: {
  color: string;
  delay: number;
  index: number;
  scale: number;
  screenWidth: number;
  top: number;
}) {
  const progress = useSharedValue(delay);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1 + delay, { duration: 2100 + index * 170, easing: Easing.linear }), -1, false);
  }, [delay, index, progress]);

  const petalStyle = useAnimatedStyle(() => {
    const phase = progress.value % 1;

    return {
      opacity: interpolate(phase, [0, 0.12, 0.82, 1], [0, 0.9, 0.9, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(phase, [0, 1], [-48, screenWidth + 48], Extrapolation.CLAMP) },
        { translateY: interpolate(phase, [0, 0.5, 1], [18, -12 - index * 3, 10], Extrapolation.CLAMP) },
        { rotate: `${interpolate(phase, [0, 1], [-38 + index * 12, 130 - index * 10], Extrapolation.CLAMP)}deg` },
        { scale },
      ],
    };
  });

  return <Animated.View style={[styles.promptWindPetal, { backgroundColor: color, top }, petalStyle]} />;
}

// ── Hooks ────────────────────────────────────────────────────────────────────

function useTypewriterPrompt(samples: string[]) {
  const [sampleIndex, setSampleIndex] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const currentSample = samples[sampleIndex];

  useEffect(() => {
    const isComplete = characterCount === currentSample.length;
    const isEmpty = characterCount === 0;
    const delay = isComplete ? 1150 : isEmpty && isDeleting ? 260 : isDeleting ? 24 : 42;

    const timer = setTimeout(() => {
      if (!isDeleting && isComplete) {
        setIsDeleting(true);
        return;
      }

      if (isDeleting && isEmpty) {
        setIsDeleting(false);
        setSampleIndex((value) => (value + 1) % samples.length);
        return;
      }

      setCharacterCount((value) => value + (isDeleting ? -1 : 1));
    }, delay);

    return () => clearTimeout(timer);
  }, [characterCount, currentSample.length, isDeleting, samples.length]);

  return useMemo(() => currentSample.slice(0, characterCount), [characterCount, currentSample]);
}

function useRollingWordIndex(words: string[]) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((value) => (value + 1) % words.length);
    }, 1350);

    return () => clearInterval(timer);
  }, [words.length]);

  return index;
}

// ── Sub-Components ───────────────────────────────────────────────────────────

function RollingWord({ wordIndex, words }: { wordIndex: number; words: string[] }) {
  const progress = useSharedValue(wordIndex);

  useEffect(() => {
    progress.value = withTiming(wordIndex, { duration: 520 });
  }, [progress, wordIndex]);

  const reelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -progress.value * 48 }],
  }));

  const blurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value % 1, [0, 0.5, 1], [0.18, 0.42, 0.18], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.rollingWordWindow}>
      <Animated.View style={[styles.rollingBlur, styles.rollingBlurTop, blurStyle]} />
      <Animated.View style={[styles.rollingWordReel, reelStyle]}>
        {words.map((word) => (
          <Text key={word} style={styles.rollingWordText}>
            {word}.
          </Text>
        ))}
      </Animated.View>
      <Animated.View style={[styles.rollingBlur, styles.rollingBlurBottom, blurStyle]} />
    </View>
  );
}

function SubmitPromptButton({
  disabled,
  isProcessing = false,
  onSubmit,
}: {
  disabled: boolean;
  isProcessing?: boolean;
  onSubmit: () => void;
}) {
  const progress = useSharedValue(disabled ? 0 : 1);

  useEffect(() => {
    progress.value = withTiming(disabled ? 0 : 1, { duration: 220 });
  }, [disabled, progress]);

  const buttonStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['#F0F1F0', '#FFFFFF']),
    borderColor: interpolateColor(progress.value, [0, 1], ['#DADFDA', 'rgba(218, 222, 218, 0.72)']),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.96, 1], Extrapolation.CLAMP) }],
  }));

  const iconColor = disabled ? (isProcessing ? '#F36F95' : '#A4AAA5') : '#1F2A24';

  return (
    <Animated.View style={[styles.submitButton, buttonStyle]}>
      <Pressable
        accessibilityLabel="Submit prompt"
        accessibilityRole="button"
        accessibilityState={{ busy: isProcessing, disabled }}
        disabled={disabled}
        onPress={onSubmit}
        style={({ pressed }) => [
          styles.submitButtonPressable,
          pressed && !disabled && styles.submitButtonPressed,
        ]}>
        {isProcessing ? (
          <LoadingSubmitIcon color={iconColor} />
        ) : (
          <Send color={iconColor} size={18} strokeWidth={2.5} />
        )}
      </Pressable>
    </Animated.View>
  );
}

function VoicePromptButton({
  disabled,
  isListening,
  level,
  onPress,
}: {
  disabled: boolean;
  isListening: boolean;
  level: number;
  onPress: () => void;
}) {
  const iconColor = disabled ? '#A4AAA5' : isListening ? '#F36F95' : '#3F4741';

  return (
    <Pressable
      accessibilityLabel={isListening ? 'Stop voice input' : 'Start voice input'}
      accessibilityRole="button"
      accessibilityState={{ busy: isListening, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.voiceButton,
        disabled && styles.voiceButtonDisabled,
        pressed && !disabled && styles.voiceButtonPressed,
      ]}>
      {isListening ? <VoiceVisualizer level={level} /> : null}
      <Mic color={iconColor} size={19} strokeWidth={2.35} />
    </Pressable>
  );
}

function VoiceVisualizer({ level }: { level: number }) {
  return (
    <View pointerEvents="none" style={styles.voiceVisualizer}>
      {[0.45, 0.72, 1, 0.66].map((weight, index) => (
        <View
          key={weight}
          style={[
            styles.voiceVisualizerBar,
            {
              height: 5 + Math.round(level * weight * 18),
              opacity: 0.48 + level * 0.48,
              transform: [{ translateY: index % 2 === 0 ? 1 : -1 }],
            },
          ]}
        />
      ))}
    </View>
  );
}

function ErrorToast({ message, onClose, top }: { message: string; onClose: () => void; top: number }) {
  return (
    <View pointerEvents="box-none" style={[styles.toastLayer, { top }]}>
      <View style={styles.errorToast}>
        <View style={styles.errorToastIcon}>
          <Info color="#DC2626" size={15} strokeWidth={2.2} />
        </View>
        <Text style={styles.errorToastText}>{message}</Text>
        <Pressable
          accessibilityLabel="Close error message"
          accessibilityRole="button"
          hitSlop={10}
          onPress={onClose}
          style={({ pressed }) => [styles.errorToastClose, pressed && styles.errorToastClosePressed]}>
          <X color="#6A706B" size={16} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}

function LoadingSubmitIcon({ color }: { color: string }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(1, {
        duration: 850,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [rotation]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, 360])}deg` }],
  }));

  return (
    <Animated.View style={iconStyle}>
      <LoaderCircle color={color} size={18} strokeWidth={2.5} />
    </Animated.View>
  );
}

function PromptProcessingGlow() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: 1900,
        easing: Easing.inOut(Easing.cubic),
      }),
      -1,
      false,
    );
  }, [progress]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.38, 0.78, 0.38], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.012, 1], Extrapolation.CLAMP) }],
  }));

  return (
    <View pointerEvents="none" style={styles.promptGlowLayer}>
      <Animated.View style={[styles.promptGlowBase, glowStyle]} />
      <Animated.View style={[styles.promptGlowBloom, glowStyle]} />
    </View>
  );
}

function PromptBackground() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 390 860" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="page" x1="0" x2="390" y1="0" y2="860">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.58" stopColor="#FAFAFA" />
          <Stop offset="1" stopColor="#F2F3F2" />
        </LinearGradient>
      </Defs>
      <Path d="M0 0H390V860H0Z" fill="url(#page)" />
      {Array.from({ length: 210 }).map((_, index) => {
        const row = Math.floor(index / 14);
        const column = index % 14;
        const x = column * 30 + (row % 2 === 0 ? 8 : 22);
        const y = row * 42 + 28 + Math.sin(column * 0.9 + row * 0.42) * 14;

        return (
          <Circle
            key={`${row}-${column}`}
            cx={x}
            cy={y}
            r={1.25}
            fill="#A6AAA5"
            opacity={0.13 + ((row + column) % 4) * 0.04}
          />
        );
      })}
      <Path d="M0 738 C90 696 174 716 268 678 C325 654 362 616 390 574 V860H0Z" fill="#F3F4F2" opacity={0.7} />
    </Svg>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  background: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  floatingHeaderSolid: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderBottomColor: 'rgba(218, 222, 218, 0.72)',
    borderBottomWidth: 1,
    boxShadow: '0 10px 26px rgba(31, 42, 36, 0.08)',
  },
  content: {
    justifyContent: 'flex-start',
  },
  backLink: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 7,
    marginBottom: 30,
    minHeight: 44,
    paddingRight: theme.spacing.md,
  },
  backLinkText: {
    color: '#6A706B',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    fontWeight: '700',
  },
  promptIntroFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 146,
    position: 'relative',
  },
  copy: {
    alignItems: 'center',
    gap: theme.spacing.md,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  focusIconPanel: {
    alignItems: 'center',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  focusIconHalo: {
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    height: 82,
    justifyContent: 'center',
    width: 82,
    zIndex: 2,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  titleBlock: {
    alignItems: 'center',
    gap: 2,
    width: '100%',
  },
  title: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 39,
    textAlign: 'center',
  },
  rollingWordWindow: {
    alignSelf: 'stretch',
    height: 48,
    justifyContent: 'center',
    minWidth: 260,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  rollingWordReel: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  rollingWordText: {
    color: '#F36F95',
    fontFamily: Fonts.sansExtraBold,
    fontSize: 34,
    fontWeight: '800',
    height: 48,
    lineHeight: 39,
    textAlign: 'center',
    width: '100%',
  },
  rollingBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    height: 11,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 2,
  },
  rollingBlurTop: {
    top: 0,
  },
  rollingBlurBottom: {
    bottom: 0,
  },
  promptShell: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(218, 222, 218, 0.72)',
    borderRadius: 18,
    borderWidth: 1,
    boxShadow: '0 16px 36px rgba(31, 42, 36, 0.08)',
    minHeight: 158,
    overflow: 'visible',
    padding: theme.spacing.md,
    width: '100%',
  },
  promptShellProcessing: {
    borderColor: 'rgba(243, 111, 149, 0.56)',
  },
  input: {
    color: '#3F4741',
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 94,
    padding: 0,
  },
  inputProcessing: {
    color: '#5C645E',
  },
  promptActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'flex-end',
  },
  promptActionsLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  exampleButton: {
    borderColor: 'rgba(31, 42, 36, 0.1)',
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exampleButtonText: {
    color: '#9BA19C',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    fontWeight: '700',
  },
  charCount: {
    color: '#C4C9C5',
    fontFamily: Fonts.sans,
    fontSize: 12,
  },
  submitButton: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  submitButtonPressable: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  submitButtonPressed: {
    opacity: 0.72,
  },
  voiceButton: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 5,
    height: 38,
    justifyContent: 'center',
    minWidth: 38,
    paddingHorizontal: 4,
  },
  voiceButtonDisabled: {
    opacity: 0.42,
  },
  voiceButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
  voiceVisualizer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    height: 24,
  },
  voiceVisualizerBar: {
    backgroundColor: '#F36F95',
    borderRadius: theme.radius.pill,
    width: 3,
  },
  processingInlineText: {
    color: '#F36F95',
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  toastLayer: {
    left: 20,
    position: 'absolute',
    right: 20,
    zIndex: 70,
  },
  errorToast: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(220, 38, 38, 0.18)',
    borderRadius: 16,
    borderWidth: 1,
    boxShadow: '0 18px 40px rgba(31, 42, 36, 0.14)',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  errorToastIcon: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: theme.radius.pill,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  errorToastText: {
    color: '#7F1D1D',
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  errorToastClose: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  errorToastClosePressed: {
    opacity: 0.58,
  },
  usageRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: theme.spacing.lg,
    paddingHorizontal: 4,
  },
  usageText: {
    color: '#6A706B',
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
  // ── Results styles ─────────────────────────────────────────────────────────
  resultsContainer: {
    gap: 16,
  },
  promptRecap: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(218, 222, 218, 0.72)',
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  promptRecapPill: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  promptRecapLabel: {
    color: '#F36F95',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    fontWeight: '700',
  },
  promptRecapText: {
    color: '#5C645E',
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  imageContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  generatedImage: {
    borderRadius: 20,
    width: '100%',
  },
  aiBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(31, 42, 36, 0.72)',
    borderRadius: 999,
    bottom: 14,
    flexDirection: 'row',
    gap: 5,
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: 'absolute',
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    fontWeight: '700',
  },
  imagePlaceholder: {
    alignItems: 'center',
    backgroundColor: '#F5F6F5',
    borderColor: 'rgba(218, 222, 218, 0.72)',
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    color: '#C4C9C5',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
  },
  conceptNote: {
    alignItems: 'flex-start',
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(46, 139, 52, 0.16)',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  conceptNoteText: {
    color: theme.colors.primaryDark,
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 18,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(218, 222, 218, 0.72)',
    borderRadius: 20,
    borderWidth: 1,
    boxShadow: '0 12px 32px rgba(31, 42, 36, 0.06)',
    gap: 20,
    padding: 20,
  },
  arrangementName: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  arrangementNameInput: {
    backgroundColor: '#F7F8F7',
    borderColor: 'rgba(46, 139, 52, 0.2)',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 20,
    minHeight: 54,
    paddingHorizontal: theme.spacing.md,
  },
  inputLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    marginBottom: -12,
    textTransform: 'uppercase',
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    color: '#3F4741',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    fontWeight: '700',
  },
  materialsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  materialChip: {
    alignItems: 'center',
    backgroundColor: '#F9FAFA',
    borderColor: 'rgba(218, 222, 218, 0.72)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  materialDot: {
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  materialType: {
    color: '#3F4741',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    fontWeight: '600',
  },
  materialName: {
    color: '#6A706B',
    fontFamily: Fonts.sans,
    fontSize: 12,
  },
  costTable: {
    backgroundColor: '#FCF9F2',
    borderColor: 'rgba(183, 121, 31, 0.16)',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  costRow: {
    borderBottomColor: '#F3F4F2',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  costItemName: {
    color: '#6A706B',
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
  costItemQty: {
    color: '#9BA19C',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
  },
  costItemPrice: {
    color: '#3F4741',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    fontWeight: '600',
  },
  costTotalRow: {
    backgroundColor: '#F4F9F1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  costTotalLabel: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    fontWeight: '700',
  },
  costTotalPrice: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    fontWeight: '700',
  },
  availabilityPanel: {
    alignItems: 'center',
    backgroundColor: '#F4FBF6',
    borderColor: 'rgba(46, 139, 52, 0.16)',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  availabilityText: {
    color: theme.colors.primaryDark,
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 18,
  },
  scoresRow: {
    flexDirection: 'row',
    gap: 10,
  },
  scoreCard: {
    alignItems: 'center',
    backgroundColor: '#F9FAFA',
    borderColor: 'rgba(218, 222, 218, 0.72)',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    paddingVertical: 14,
  },
  scoreValue: {
    color: '#3F4741',
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
  },
  scoreLabel: {
    color: '#9BA19C',
    fontFamily: Fonts.sans,
    fontSize: 11,
    textAlign: 'center',
  },
  remainingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  remainingText: {
    color: '#9BA19C',
    fontFamily: Fonts.sans,
    fontSize: 12,
  },

  // ── Action buttons ─────────────────────────────────────────────────────────
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addToCartButton: {
    alignItems: 'center',
    borderColor: theme.colors.primary,
    borderRadius: 14,
    borderWidth: 2,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 15,
  },
  addToCartText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
  },
  addedFeedback: {
    alignItems: 'center',
    backgroundColor: '#F0F8F1',
    borderColor: theme.colors.primary,
    borderRadius: 14,
    borderWidth: 2,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 15,
  },
  addedFeedbackText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
  },
  buyNowButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    boxShadow: '0 4px 14px rgba(46, 139, 52, 0.3)',
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 15,
  },
  buyNowText: {
    color: '#FFFFFF',
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  startOverButton: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 7,
    paddingVertical: 10,
  },
  startOverText: {
    color: '#9BA19C',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    fontWeight: '600',
  },
  disclaimer: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  disclaimerText: {
    color: '#C4C9C5',
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 16,
  },
  poweredBy: {
    alignSelf: 'flex-end',
    color: '#C4C9C5',
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingRight: 4,
  },

  // ── Loading overlay ────────────────────────────────────────────────────────
  loadingOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(12, 87, 62, 0.35)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 60,
  },
  loadingCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    boxShadow: '0 24px 60px rgba(31, 42, 36, 0.2)',
    marginHorizontal: 24,
    paddingHorizontal: 32,
    paddingVertical: 40,
    width: '100%',
  },
  loadingFlowerContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(244, 114, 182, 0.1)',
    borderRadius: 999,
    height: 72,
    justifyContent: 'center',
    marginBottom: 20,
    width: 72,
  },
  loadingTitle: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansBold,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  loadingSubtitle: {
    color: '#9BA19C',
    fontFamily: Fonts.sans,
    fontSize: 14,
    marginBottom: 24,
  },
  progressTrack: {
    backgroundColor: '#F1ECE6',
    borderRadius: 999,
    height: 10,
    marginBottom: 8,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    borderRadius: 999,
    height: '100%',
    // Pink → Gold → Green gradient approximated with a single green for RN
    backgroundColor: theme.colors.primary,
  },
  progressPercent: {
    color: '#9BA19C',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 24,
  },
  factCard: {
    backgroundColor: '#FDF2F8',
    borderColor: '#FBCFE8',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    width: '100%',
  },
  factLabel: {
    color: '#DB2777',
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  factText: {
    color: '#4B5563',
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },

  // ── Processing glow (preserved from original) ─────────────────────────────
  promptPetalLayer: {
    height: 92,
    left: '50%',
    overflow: 'hidden',
    position: 'absolute',
    top: 24,
    zIndex: 1,
  },
  promptWindPetal: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 6,
    height: 24,
    left: 0,
    position: 'absolute',
    width: 14,
  },
  promptGlowLayer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: -1,
  },
  promptGlowBase: {
    borderColor: 'transparent',
    borderRadius: 18,
    borderWidth: 0,
    bottom: 0,
    boxShadow: '0 0 24px rgba(243, 111, 149, 0.16)',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  promptGlowBloom: {
    backgroundColor: 'transparent',
    borderRadius: 18,
    bottom: 0,
    boxShadow: '0 0 42px rgba(243, 111, 149, 0.22)',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
