import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Info,
  LoaderCircle,
  RotateCcw,
  Send,
  ShoppingCart,
  Sparkles,
  Star,
  Heart,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
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
import { formatPhp } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { addAiArrangementToCart } from '@/services/guest-cart';
import {
  checkAndGenerate,
  getAiUsage,
  isCustomizationEnabled,
  type AiUsage,
  type GenerationResult,
} from '@/services/customization-api';
import { getAuthSession } from '@/services/auth-session';
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

const FLOWER_FACTS = [
  'Roses can live for over a week with fresh water and a clean stem cut.',
  'Sunflowers turn to follow the sun across the sky, a habit called heliotropism.',
  'Tulips were once so prized in the 1600s that their bulbs were worth more than gold.',
  'Carnations are among the longest-lasting cut flowers, often blooming for two to three weeks.',
  'The fragrance of a flower is strongest just after it fully opens.',
  'Lavender has been used for centuries to bring a sense of calm and relaxation.',
  'Adding a little sugar to the vase water can help cut flowers stay fresh longer.',
  "Baby's breath symbolizes everlasting love, which is why it pairs so well with roses.",
];

const MAX_PROMPT_LENGTH = 500;

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

  // Loading overlay state
  const [progress, setProgress] = useState(0);
  const [factIdx, setFactIdx] = useState(0);

  const typedPlaceholder = useTypewriterPrompt(PROMPT_SAMPLES);
  const rollingWordIndex = useRollingWordIndex(OBJECT_WORDS);
  const hasPrompt = prompt.trim().length > 0;
  const headerLayout = getAppBrandHeaderLayout(width, height, insets.top);
  const side = Math.min(Math.max(width * 0.062, 20), 30);

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

  // Progress bar animation during loading
  useEffect(() => {
    if (!isProcessing) {
      setProgress(0);
      return;
    }
    setProgress(8);
    setFactIdx(Math.floor(Math.random() * FLOWER_FACTS.length));

    const prog = setInterval(() => {
      setProgress((p) => (p >= 90 ? 90 : p + Math.max(1, (92 - p) * 0.08)));
    }, 280);
    const facts = setInterval(() => {
      setFactIdx((i) => (i + 1) % FLOWER_FACTS.length);
    }, 3600);

    return () => {
      clearInterval(prog);
      clearInterval(facts);
    };
  }, [isProcessing]);

  const handleUseExample = () => {
    const randomIndex = Math.floor(Math.random() * EXAMPLE_PROMPTS.length);
    setPrompt(EXAMPLE_PROMPTS[randomIndex]);
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
        setProgress(100);
        setResult(data);
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
    if (!result || addingToCart) return;

    setAddingToCart(true);
    try {
      const breakdownNames =
        result.price_breakdown?.items?.map((i) => `${i.quantity}x ${i.product_name}`).join(', ') ||
        'Custom arrangement';
      const totalPricePesos = result.price_breakdown?.total_price || 0;

      await addAiArrangementToCart({
        arrangementId: result.arrangement_id,
        description: `Contains: ${breakdownNames}.`,
        imageUrl: result.generated_image_url,
        name: result.price_breakdown?.items?.[0]?.product_name || 'AI Arrangement',
        priceCents: Math.round(totalPricePesos * 100),
      });

      setAddedToCart(true);
    } catch {
      Alert.alert('Error', 'Failed to add to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push('/(tabs)/cart');
  };

  const handleStartOver = () => {
    setResult(null);
    setError(null);
    setPrompt('');
    setAddedToCart(false);
    setProgress(0);
  };

  const showResults = result && result.success;

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.background}>
        <PromptBackground />
      </View>

      <AppBrandHeader absolute onSearchPress={() => setIsSearchOpen(true)} showSearchAction />

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
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onStartOver={handleStartOver}
            prompt={prompt}
            result={result}
          />
        ) : (
          <>
            <View style={styles.copy}>
              <Text style={styles.eyebrow}>Build your bouquet with a prompt.</Text>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>Describe your dream</Text>
                <RollingWord words={OBJECT_WORDS} wordIndex={rollingWordIndex} />
              </View>
            </View>

            <View style={styles.promptShell}>
              {isProcessing ? <PromptProcessingGlow /> : null}
              <TextInput
                editable={!isProcessing}
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
                <SubmitPromptButton
                  disabled={!hasPrompt || isProcessing || (aiUsage?.remaining === 0)}
                  isProcessing={isProcessing}
                  onSubmit={handleGenerate}
                />
              </View>
            </View>

            {error ? (
              <View style={styles.errorBanner}>
                <Info color="#DC2626" size={16} strokeWidth={2} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {aiUsage ? (
              <View style={styles.usageRow}>
                <Sparkles color={theme.colors.primary} size={14} strokeWidth={2} />
                <Text style={styles.usageText}>
                  {aiUsage.remaining} / {aiUsage.limit} AI generations left today
                </Text>
              </View>
            ) : null}

            <View style={styles.ghostRow}>
              <View style={styles.ghostChip} />
              <View style={styles.ghostChipWide} />
            </View>
          </>
        )}
      </ScrollView>

      {/* Loading overlay */}
      {isProcessing ? (
        <LoadingOverlay factIdx={factIdx} progress={progress} />
      ) : null}

      <FloatingProductSearch onClose={() => setIsSearchOpen(false)} visible={isSearchOpen} />
    </View>
  );
}

// ── Results View ─────────────────────────────────────────────────────────────

function ResultsView({
  addedToCart,
  addingToCart,
  onAddToCart,
  onBuyNow,
  onStartOver,
  prompt,
  result,
}: {
  addedToCart: boolean;
  addingToCart: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onStartOver: () => void;
  prompt: string;
  result: GenerationResult;
}) {
  const { width } = useWindowDimensions();
  const imageSize = width - Math.min(Math.max(width * 0.062, 20), 30) * 2;
  const arrangementName = result.price_breakdown?.items?.[0]?.product_name || 'AI Arrangement';
  const totalPrice = result.price_breakdown?.total_price || 0;

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
        <View style={styles.imageContainer}>
          <Image
            contentFit="cover"
            source={{ uri: result.generated_image_url }}
            style={[styles.generatedImage, { height: imageSize * 1.1, width: imageSize }]}
            transition={400}
          />
          <View style={styles.aiBadge}>
            <Sparkles color="#FFFFFF" size={11} strokeWidth={2.5} />
            <Text style={styles.aiBadgeText}>AI Generated</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.imagePlaceholder, { height: imageSize * 0.8, width: imageSize }]}>
          <Sparkles color="#C4C9C5" size={32} strokeWidth={1.5} />
          <Text style={styles.imagePlaceholderText}>No image generated</Text>
        </View>
      )}

      {/* Details card */}
      <View style={styles.detailsCard}>
        <Text style={styles.arrangementName}>{arrangementName}</Text>

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
                      {item.quantity > 1 ? ` × ${item.quantity}` : ''}
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
                      {item.quantity > 1 ? (
                        <Text style={styles.costItemQty}> × {item.quantity}</Text>
                      ) : null}
                    </Text>
                    <Text style={styles.costItemPrice}>₱{(+item.subtotal).toLocaleString()}</Text>
                  </View>
                ))}
                <View style={styles.costTotalRow}>
                  <Text style={styles.costTotalLabel}>Total</Text>
                  <Text style={styles.costTotalPrice}>₱{totalPrice.toLocaleString()}.00</Text>
                </View>
              </View>
            </View>
          </>
        ) : null}

        {/* Availability scores */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Flower Availability</Text>
          <View style={styles.scoresRow}>
            {[
              { icon: Check, label: 'Availability', score: '10/10' },
              { icon: Star, label: 'Popular', score: '9/10' },
              { icon: Heart, label: 'Easy to care', score: '9/10' },
            ].map(({ icon: Icon, label, score }) => (
              <View key={label} style={styles.scoreCard}>
                <Icon color={theme.colors.primary} size={18} strokeWidth={2} />
                <Text style={styles.scoreValue}>{score}</Text>
                <Text style={styles.scoreLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

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

function LoadingOverlay({ factIdx, progress }: { factIdx: number; progress: number }) {
  const insets = useSafeAreaInsets();
  const flowerRotation = useSharedValue(0);

  useEffect(() => {
    flowerRotation.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [flowerRotation]);

  const flowerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(flowerRotation.value, [0, 1], [0, 360])}deg` }],
  }));

  return (
    <View style={[styles.loadingOverlay, { paddingTop: insets.top + 60 }]}>
      <View style={styles.loadingCard}>
        <View style={styles.loadingFlowerContainer}>
          <Animated.View style={flowerStyle}>
            <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <Circle
                  key={deg}
                  cx={24 + 10 * Math.cos((deg * Math.PI) / 180)}
                  cy={24 + 10 * Math.sin((deg * Math.PI) / 180)}
                  r={6}
                  fill="#F36F95"
                  opacity={0.85}
                />
              ))}
              <Circle cx={24} cy={24} r={7} fill="#FBB950" />
              <Circle cx={24} cy={24} r={3.5} fill="#F59E0B" />
            </Svg>
          </Animated.View>
        </View>

        <Text style={styles.loadingTitle}>Creating your bouquet</Text>
        <Text style={styles.loadingSubtitle}>Arranging every petal just for you...</Text>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>

        {/* Flower fact */}
        <View style={styles.factCard}>
          <Text style={styles.factLabel}>DID YOU KNOW?</Text>
          <Text style={styles.factText}>{FLOWER_FACTS[factIdx]}</Text>
        </View>
      </View>
    </View>
  );
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
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.34, 0.9, 0.34], Extrapolation.CLAMP),
  }));

  const topGlowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-80, 340]) }],
  }));

  const rightGlowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [-60, 190]) }],
  }));

  const bottomGlowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [340, -80]) }],
  }));

  const leftGlowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [190, -60]) }],
  }));

  return (
    <View pointerEvents="none" style={styles.promptGlowLayer}>
      <Animated.View style={[styles.promptGlowBase, glowStyle]} />
      <Animated.View style={[styles.promptGlowLine, styles.promptGlowTop, topGlowStyle]} />
      <Animated.View style={[styles.promptGlowLineVertical, styles.promptGlowRight, rightGlowStyle]} />
      <Animated.View style={[styles.promptGlowLine, styles.promptGlowBottom, bottomGlowStyle]} />
      <Animated.View style={[styles.promptGlowLineVertical, styles.promptGlowLeft, leftGlowStyle]} />
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
  copy: {
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: 30,
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
    overflow: 'hidden',
    padding: theme.spacing.md,
    width: '100%',
  },
  input: {
    color: '#3F4741',
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
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
  processingInlineText: {
    color: '#F36F95',
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  errorBanner: {
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: theme.spacing.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  errorText: {
    color: '#DC2626',
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
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
  ghostRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  ghostChip: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(218, 222, 218, 0.72)',
    borderRadius: 10,
    borderWidth: 1,
    height: 34,
    width: 96,
  },
  ghostChipWide: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(218, 222, 218, 0.72)',
    borderRadius: 10,
    borderWidth: 1,
    height: 34,
    width: 116,
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
    borderColor: 'rgba(218, 222, 218, 0.72)',
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
  promptGlowLayer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 0,
  },
  promptGlowBase: {
    borderColor: 'rgba(243, 111, 149, 0.52)',
    borderRadius: 18,
    borderWidth: 1.4,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  promptGlowLine: {
    backgroundColor: '#F36F95',
    borderRadius: theme.radius.pill,
    boxShadow: '0 0 14px rgba(243, 111, 149, 0.88)',
    height: 2.5,
    position: 'absolute',
    width: 92,
  },
  promptGlowLineVertical: {
    backgroundColor: '#F36F95',
    borderRadius: theme.radius.pill,
    boxShadow: '0 0 14px rgba(243, 111, 149, 0.88)',
    height: 74,
    position: 'absolute',
    width: 2.5,
  },
  promptGlowTop: {
    top: 0,
  },
  promptGlowRight: {
    right: 0,
  },
  promptGlowBottom: {
    bottom: 0,
  },
  promptGlowLeft: {
    left: 0,
  },
});
