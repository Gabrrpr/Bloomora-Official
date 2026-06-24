import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, Check, LoaderCircle, RotateCcw, ShoppingCart, Shuffle, Sparkles } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBrandHeader, getAppBrandHeaderLayout } from '@/components/app-brand-header';
import { FloatingProductSearch } from '@/components/floating-product-search';
import { GreetingCardComposer } from '@/components/greeting-card-composer';
import { ProductAddOnSelector } from '@/components/product-add-on-selector';
import { formatPhp, type Product } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { addAiArrangementToCart } from '@/services/guest-cart';
import {
  checkAndGenerate,
  getAiUsage,
  getCustomizationProducts,
  isCustomizationEnabled,
  type AiUsage,
  type CustomizationProduct,
  type GenerationResult,
} from '@/services/customization-api';
import { getAuthSession } from '@/services/auth-session';
import { requireSignedIn } from '@/services/auth-guard';
import { shopApi } from '@/services/shop-api';

const imageNotFound = require('@/assets/images/default-img/ImageNotFound.webp');

type StepKey = 'arrangement' | 'flowers' | 'container' | 'accessories';
type ContainerMode = 'vase' | 'wrapping';

const STEPS: { description: string; key: StepKey; label: string; title: string }[] = [
  {
    description: 'Choose the base look and presentation for your custom arrangement.',
    key: 'arrangement',
    label: 'Arrangement',
    title: 'Choose your arrangement',
  },
  {
    description: 'Select one flower or filler from the available customization stock.',
    key: 'flowers',
    label: 'Flowers',
    title: 'Choose flowers and fillers',
  },
  {
    description: 'Pick a vase or wrapping style to hold the arrangement together.',
    key: 'container',
    label: 'Container',
    title: 'Choose your container',
  },
  {
    description: 'Add a finishing detail, then generate your personalized preview.',
    key: 'accessories',
    label: 'Accessories',
    title: 'Choose accessories',
  },
];

const ARRANGEMENT_OPTIONS = [
  {
    id: 'bouquet',
    label: 'Hand bouquet',
    description: 'Classic hand-tied bouquet with a polished gift-ready finish.',
  },
  {
    id: 'vase-arrangement',
    label: 'Vase arrangement',
    description: 'Structured display designed for tables, offices, and home spaces.',
  },
  {
    id: 'flower-box',
    label: 'Flower box',
    description: 'Compact premium arrangement with a clean boxed presentation.',
  },
  {
    id: 'wrapped-bundle',
    label: 'Wrapped bundle',
    description: 'Soft floral bundle with a casual, romantic wrapped style.',
  },
];

const FLOWER_FACTS = [
  'Roses can live for over a week with fresh water and a clean stem cut.',
  'Carnations are among the longest-lasting cut flowers.',
  "Baby's breath adds airy texture and symbolizes everlasting love.",
  'A balanced bouquet usually combines focal blooms, fillers, and greenery.',
];

export default function MixAndMatchScreen() {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [containerMode, setContainerMode] = useState<ContainerMode>('vase');
  const [products, setProducts] = useState<CustomizationProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [customizationEnabled, setCustomizationEnabled] = useState(true);
  const [aiUsage, setAiUsage] = useState<AiUsage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [factIdx, setFactIdx] = useState(0);
  const [addOns, setAddOns] = useState<Product[]>([]);
  const [arrangementName, setArrangementName] = useState('AI Arrangement');
  const [cardMessage, setCardMessage] = useState('');
  const [isLoadingAddOns, setIsLoadingAddOns] = useState(false);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<ReadonlySet<string>>(() => new Set());
  const [isHeaderSolid, setIsHeaderSolid] = useState(false);
  const [selectedArrangement, setSelectedArrangement] = useState(ARRANGEMENT_OPTIONS[0].id);
  const [selectedFlowerId, setSelectedFlowerId] = useState<string | null>(null);
  const [selectedVaseId, setSelectedVaseId] = useState<string | null>(null);
  const [selectedWrappingId, setSelectedWrappingId] = useState<string | null>(null);
  const [selectedAccessoryId, setSelectedAccessoryId] = useState<string | null>(null);
  const headerLayout = getAppBrandHeaderLayout(width, height, insets.top);
  const side = Math.min(Math.max(width * 0.062, 20), 30);
  const activeStep = STEPS[step];
  const flowerProducts = useMemo(() => products.filter(isFlowerLikeProduct), [products]);
  const vaseProducts = useMemo(() => products.filter((product) => normalizeCategory(product.category) === 'vase'), [products]);
  const wrappingProducts = useMemo(() => products.filter((product) => normalizeCategory(product.category) === 'wrapping'), [products]);
  const accessoryProducts = useMemo(() => products.filter((product) => normalizeCategory(product.category) === 'accessory'), [products]);
  const selectedArrangementOption = ARRANGEMENT_OPTIONS.find((option) => option.id === selectedArrangement) ?? ARRANGEMENT_OPTIONS[0];
  const selectedFlower = products.find((product) => product.id === selectedFlowerId);
  const selectedVase = products.find((product) => product.id === selectedVaseId);
  const selectedWrapping = products.find((product) => product.id === selectedWrappingId);
  const selectedAccessory = products.find((product) => product.id === selectedAccessoryId);
  const selectedContainer = selectedVase ?? selectedWrapping;
  const canGenerate = Boolean(selectedFlowerId && (selectedVaseId || selectedWrappingId) && selectedAccessoryId);
  const showResult = Boolean(result?.success);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const shouldShowSolidHeader = event.nativeEvent.contentOffset.y > 12;
    setIsHeaderSolid((current) => (current === shouldShowSolidHeader ? current : shouldShowSolidHeader));
  };

  useEffect(() => {
    let isActive = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const [session, toggleRes, productRes, usageRes] = await Promise.all([
          getAuthSession(),
          isCustomizationEnabled().catch(() => ({ enabled: true })),
          getCustomizationProducts(),
          getAiUsage().catch(() => ({ remaining: 5, limit: 5 })),
        ]);

        if (!isActive) {
          return;
        }

        if (!session) {
          setError('Please sign in before using Mix & Match.');
        }

        setCustomizationEnabled(toggleRes.enabled);
        setProducts(productRes.filter((product) => product.is_available !== false));
        setAiUsage(usageRes);
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load Mix & Match products.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    setIsLoadingAddOns(true);
    void shopApi.getAddOns()
      .then((items) => {
        if (isActive) {
          setAddOns(items);
        }
      })
      .catch(() => {
        if (isActive) {
          setAddOns([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingAddOns(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isGenerating) {
      setProgress(0);
      return;
    }

    setProgress(8);
    setFactIdx(Math.floor(Math.random() * FLOWER_FACTS.length));

    const progressTimer = setInterval(() => {
      setProgress((current) => (current >= 90 ? 90 : current + Math.max(1, (92 - current) * 0.08)));
    }, 280);
    const factTimer = setInterval(() => {
      setFactIdx((current) => (current + 1) % FLOWER_FACTS.length);
    }, 3600);

    return () => {
      clearInterval(progressTimer);
      clearInterval(factTimer);
    };
  }, [isGenerating]);

  function handleSelectContainerMode(nextMode: ContainerMode) {
    setContainerMode(nextMode);
    setSelectedVaseId(null);
    setSelectedWrappingId(null);
  }

  function handleNext() {
    if (step === 0) {
      setStep(1);
      return;
    }

    if (step === 1 && !selectedFlowerId) {
      setError('Choose a flower or filler to continue.');
      return;
    }

    if (step === 2 && !selectedContainer) {
      setError('Choose a vase or wrapping to continue.');
      return;
    }

    if (step < STEPS.length - 1) {
      setError(null);
      setStep((current) => current + 1);
      scrollRef.current?.scrollTo({ animated: true, y: 0 });
      return;
    }

    void handleGenerate();
  }

  async function handleGenerate() {
    if (!customizationEnabled) {
      setError('AI Customization is temporarily disabled during peak seasons.');
      return;
    }

    if (aiUsage && aiUsage.remaining <= 0) {
      setError(`You have reached your daily limit of ${aiUsage.limit} AI generations. Please try again tomorrow.`);
      return;
    }

    if (!canGenerate || isGenerating) {
      setError('Complete all selections before generating your preview.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const promptText = buildPrompt({
        accessory: selectedAccessory,
        arrangement: selectedArrangementOption,
        flower: selectedFlower,
        vase: selectedVase,
        wrapping: selectedWrapping,
      });
      const data = await checkAndGenerate({
        accessory_id: selectedAccessoryId ?? undefined,
        flower_id: selectedFlowerId ?? undefined,
        prompt_text: promptText,
        vase_id: selectedVaseId ?? undefined,
        wrapping_id: selectedWrappingId ?? undefined,
      });

      if (data.success) {
        setProgress(100);
        setResult(data);
        setArrangementName(`${selectedArrangementOption.label} Mix & Match`);
        setCardMessage('');
        setSelectedAddOnIds(new Set());
        setAiUsage((current) => (current ? { ...current, remaining: data.remaining_generations ?? current.remaining } : current));
        scrollRef.current?.scrollTo({ animated: true, y: 0 });
      } else {
        setError(data.message || 'Generation failed. Please try another selection.');
        setAiUsage((current) => (current ? { ...current, remaining: data.remaining_generations ?? current.remaining } : current));
      }
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : 'Failed to generate arrangement.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleAddToCart() {
    if (!result || addingToCart) {
      return;
    }

    setAddingToCart(true);

    try {
      const session = await requireSignedIn('add this arrangement to your cart');
      if (!session) {
        return;
      }

      const breakdownNames = result.price_breakdown?.items?.map((item) => `${item.quantity}x ${item.product_name}`).join(', ') || 'Custom arrangement';
      const totalPricePesos = result.price_breakdown?.total_price || 0;
      const selectedAddOns = addOns.filter((item) => selectedAddOnIds.has(item.id));
      const addOnTotalPesos = selectedAddOns.reduce((total, item) => total + item.priceCents / 100, 0);

      await addAiArrangementToCart({
        addOns: selectedAddOns,
        arrangementId: result.arrangement_id,
        cardMessage,
        description: `${selectedArrangementOption.label}. Contains: ${breakdownNames}.`,
        imageUrl: result.generated_image_url,
        name: arrangementName.trim() || `${selectedArrangementOption.label} Mix & Match`,
        priceCents: Math.round((totalPricePesos + addOnTotalPesos) * 100),
      });

      router.push('/(tabs)/cart');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add this arrangement to your cart.');
    } finally {
      setAddingToCart(false);
    }
  }

  function handleStartOver() {
    setResult(null);
    setError(null);
    setStep(0);
    setSelectedFlowerId(null);
    setSelectedVaseId(null);
    setSelectedWrappingId(null);
    setSelectedAccessoryId(null);
    setProgress(0);
    setArrangementName('AI Arrangement');
    setCardMessage('');
    setSelectedAddOnIds(new Set());
  }

  const stepProducts =
    step === 1
      ? flowerProducts
      : step === 2
        ? containerMode === 'vase'
          ? vaseProducts
          : wrappingProducts
        : step === 3
          ? accessoryProducts
          : [];

  return (
    <View style={styles.screen}>
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
            paddingBottom: insets.bottom + 108,
            paddingHorizontal: side,
            paddingTop: headerLayout.top + headerLayout.height + 24,
          },
        ]}
        contentInsetAdjustmentBehavior="never"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        <Pressable accessibilityLabel="Back to Create" accessibilityRole="button" onPress={() => router.back()} style={styles.backLink}>
          <ArrowLeft color="#6A706B" size={18} strokeWidth={2.4} />
          <Text style={styles.backLinkText}>Back to Create</Text>
        </Pressable>

        {showResult && result ? (
          <ResultView
            addOns={addOns}
            arrangementLabel={selectedArrangementOption.label}
            arrangementName={arrangementName}
            addingToCart={addingToCart}
            cardMessage={cardMessage}
            isLoadingAddOns={isLoadingAddOns}
            selectedAddOnIds={selectedAddOnIds}
            onAddToCart={handleAddToCart}
            onChangeArrangementName={setArrangementName}
            onChangeCardMessage={setCardMessage}
            onStartOver={handleStartOver}
            onToggleAddOn={(id) => {
              setSelectedAddOnIds((current) => {
                const next = new Set(current);
                if (next.has(id)) {
                  next.delete(id);
                } else {
                  next.add(id);
                }
                return next;
              });
            }}
            result={result}
          />
        ) : (
          <>
            <View style={styles.heroBlock}>
              <Text style={styles.heroEyebrow}>MAKE IT PERSONAL</Text>
              <Text style={styles.heroTitle}>Mix & <Text style={styles.heroTitleAccent}>Match</Text></Text>
              <Text style={styles.heroSubtitle}>Build your own bouquet step by step, exactly the way you want it.</Text>
            </View>

            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <View style={styles.progressTitleRow}>
                  <View style={styles.iconFrame}>
                    <Shuffle color="#4B5563" size={20} strokeWidth={2.4} />
                  </View>
                  <View style={styles.progressCopy}>
                    <Text style={styles.progressTitle}>Mix and Match</Text>
                    <Text style={styles.progressSubtitle}>Build your bouquet step by step</Text>
                  </View>
                </View>
                <View style={styles.progressMeta}>
                  <Text style={styles.aiUsage}>{aiUsage ? `${aiUsage.remaining} / ${aiUsage.limit} AI left` : 'AI preview'}</Text>
                  <Text style={styles.stepCount}>Step {step + 1} of {STEPS.length}</Text>
                </View>
              </View>
              <View style={styles.stepTrack}>
                {STEPS.map((item, index) => (
                  <StepNode key={item.key} index={index} label={item.label} status={index < step ? 'done' : index === step ? 'active' : 'idle'} />
                ))}
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.selectionCard}>
              <View style={styles.selectionHeader}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{step + 1}</Text>
                </View>
                <View style={styles.selectionCopy}>
                  <Text style={styles.selectionTitle}>{activeStep.title}</Text>
                  <Text style={styles.selectionSubtitle}>{activeStep.description}</Text>
                </View>
              </View>

              {isLoading ? (
                <View style={styles.loadingPanel}>
                  <ActivityIndicator color={theme.colors.primary} />
                  <Text style={styles.loadingText}>Loading customization stock...</Text>
                </View>
              ) : step === 0 ? (
                <View style={styles.arrangementGrid}>
                  {ARRANGEMENT_OPTIONS.map((option) => (
                    <ChoiceCard
                      description={option.description}
                      key={option.id}
                      label={option.label}
                      onPress={() => {
                        setSelectedArrangement(option.id);
                        setError(null);
                      }}
                      selected={selectedArrangement === option.id}
                    />
                  ))}
                </View>
              ) : (
                <>
                  {step === 2 ? (
                    <View style={styles.segmentedControl}>
                      <SegmentButton active={containerMode === 'vase'} label="Vase" onPress={() => handleSelectContainerMode('vase')} />
                      <SegmentButton active={containerMode === 'wrapping'} label="Wrapping" onPress={() => handleSelectContainerMode('wrapping')} />
                    </View>
                  ) : null}
                  <View style={styles.productGrid}>
                    {stepProducts.map((product) => (
                      <InventoryCard
                        key={product.id}
                        onPress={() => {
                          setError(null);
                          if (step === 1) {
                            setSelectedFlowerId((current) => (current === product.id ? null : product.id));
                          } else if (step === 2 && containerMode === 'vase') {
                            setSelectedVaseId((current) => (current === product.id ? null : product.id));
                          } else if (step === 2) {
                            setSelectedWrappingId((current) => (current === product.id ? null : product.id));
                          } else {
                            setSelectedAccessoryId((current) => (current === product.id ? null : product.id));
                          }
                        }}
                        product={product}
                        selected={
                          selectedFlowerId === product.id ||
                          selectedVaseId === product.id ||
                          selectedWrappingId === product.id ||
                          selectedAccessoryId === product.id
                        }
                      />
                    ))}
                  </View>
                  {stepProducts.length === 0 ? (
                    <Text style={styles.emptyText}>No available items for this step yet.</Text>
                  ) : null}
                </>
              )}

              <View style={styles.cardFooter}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    if (step === 0) {
                      router.back();
                      return;
                    }
                    setStep((current) => Math.max(current - 1, 0));
                  }}
                  style={({ pressed }) => [styles.returnButton, pressed && styles.pressed]}>
                  <Text style={styles.returnButtonText}>{step === 0 ? 'Return' : 'Back'}</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={isGenerating || isLoading}
                  onPress={handleNext}
                  style={({ pressed }) => [styles.continueButton, (isGenerating || isLoading) && styles.continueButtonDisabled, pressed && !isGenerating && !isLoading && styles.pressed]}>
                  <Text style={[styles.continueButtonText, (isGenerating || isLoading) && styles.continueButtonTextDisabled]}>
                    {step === STEPS.length - 1 ? (isGenerating ? 'Generating...' : 'Generate') : 'Continue'}
                  </Text>
                  {isGenerating ? (
                    <SpinningLoader />
                  ) : step === STEPS.length - 1 ? (
                    <Sparkles color="#FFFFFF" size={19} strokeWidth={2.5} />
                  ) : (
                    <ArrowRight color="#FFFFFF" size={19} strokeWidth={2.5} />
                  )}
                </Pressable>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {isGenerating ? <GenerationOverlay fact={FLOWER_FACTS[factIdx]} progress={progress} /> : null}
      <FloatingProductSearch onClose={() => setIsSearchOpen(false)} visible={isSearchOpen} />
    </View>
  );
}

function StepNode({ index, label, status }: { index: number; label: string; status: 'active' | 'done' | 'idle' }) {
  const isActive = status === 'active';
  const isDone = status === 'done';

  return (
    <View style={styles.stepItem}>
      {index > 0 ? <View style={[styles.stepLine, (isActive || isDone) && styles.stepLineActive]} /> : null}
      <View style={[styles.stepCircle, isActive && styles.stepCircleActive, isDone && styles.stepCircleDone]}>
        {isDone ? <Check color="#FFFFFF" size={14} strokeWidth={2.5} /> : <Text style={[styles.stepCircleText, isActive && styles.stepCircleTextActive]}>{index + 1}</Text>}
      </View>
      <Text numberOfLines={2} style={[styles.stepLabel, (isActive || isDone) && styles.stepLabelActive]}>{label}</Text>
    </View>
  );
}

function ChoiceCard({ description, label, onPress, selected }: { description: string; label: string; onPress: () => void; selected: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.choiceCard, selected && styles.choiceCardSelected, pressed && styles.pressed]}>
      <View style={[styles.choiceIcon, selected && styles.choiceIconSelected]}>
        {selected ? <Check color="#FFFFFF" size={16} strokeWidth={2.8} /> : <Sparkles color="#6B7280" size={16} strokeWidth={2.2} />}
      </View>
      <Text style={styles.choiceTitle}>{label}</Text>
      <Text style={styles.choiceText}>{description}</Text>
    </Pressable>
  );
}

function SegmentButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.segmentButton, active && styles.segmentButtonActive]}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function InventoryCard({ onPress, product, selected }: { onPress: () => void; product: CustomizationProduct; selected: boolean }) {
  const isOut = (product.stock ?? 0) <= 0 || product.stock_status === 'out_of_stock';

  return (
    <Pressable disabled={isOut} onPress={onPress} style={({ pressed }) => [styles.productCard, selected && styles.productCardSelected, isOut && styles.productCardDisabled, pressed && !isOut && styles.pressed]}>
      <View style={styles.productImageWrap}>
        <Image contentFit="cover" source={product.image_url ? { uri: product.image_url } : imageNotFound} style={styles.productImage} />
        {selected ? (
          <View style={styles.productCheck}>
            <Check color="#FFFFFF" size={13} strokeWidth={3} />
          </View>
        ) : null}
      </View>
      <Text numberOfLines={2} style={styles.productName}>{product.name}</Text>
      <Text style={styles.productPrice}>{formatPhp(Math.round((product.price || 0) * 100))}</Text>
      <View style={[styles.stockBadge, product.stock_status === 'low_stock' && styles.stockBadgeLow, isOut && styles.stockBadgeOut]}>
        <Text style={[styles.stockText, product.stock_status === 'low_stock' && styles.stockTextLow, isOut && styles.stockTextOut]}>
          {isOut ? 'Out' : product.stock_status === 'low_stock' ? 'Low stock' : `${product.stock} left`}
        </Text>
      </View>
    </Pressable>
  );
}

function ResultView({
  addOns,
  addingToCart,
  arrangementLabel,
  arrangementName,
  cardMessage,
  isLoadingAddOns,
  onChangeArrangementName,
  onChangeCardMessage,
  onAddToCart,
  onStartOver,
  onToggleAddOn,
  result,
  selectedAddOnIds,
}: {
  addOns: Product[];
  addingToCart: boolean;
  arrangementLabel: string;
  arrangementName: string;
  cardMessage: string;
  isLoadingAddOns: boolean;
  onChangeArrangementName: (value: string) => void;
  onChangeCardMessage: (value: string) => void;
  onAddToCart: () => void;
  onStartOver: () => void;
  onToggleAddOn: (id: string) => void;
  result: GenerationResult;
  selectedAddOnIds: ReadonlySet<string>;
}) {
  const baseTotalPrice = Math.round((result.price_breakdown?.total_price || 0) * 100);
  const selectedAddOnTotal = addOns
    .filter((item) => selectedAddOnIds.has(item.id))
    .reduce((total, item) => total + item.priceCents, 0);
  const totalPrice = baseTotalPrice + selectedAddOnTotal;

  return (
    <View style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <View style={styles.resultHeaderIcon}>
          <Sparkles color="#C05BCB" size={26} strokeWidth={2.2} />
        </View>
        <View style={styles.resultHeaderCopy}>
          <Text style={styles.resultTitle}>Final result</Text>
          <Text style={styles.resultSubtitle}>Preview and analysis</Text>
        </View>
        <Pressable onPress={onStartOver} style={({ pressed }) => [styles.resultIconButton, pressed && styles.pressed]}>
          <RotateCcw color="#3A403B" size={22} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View style={styles.resultBody}>
        <View style={styles.resultImageFrame}>
          <View style={styles.resultImageBadge}>
            <Text style={styles.resultImageBadgeText}>AI Concept Preview</Text>
          </View>
          <Image contentFit="cover" source={result.generated_image_url ? { uri: result.generated_image_url } : imageNotFound} style={styles.resultImage} />
        </View>
        <View style={styles.conceptNote}>
          <Sparkles color="#9D5EDB" size={17} strokeWidth={2.3} />
          <Text style={styles.conceptNoteText}>This image is an AI-generated concept to show the overall color palette and vibe. Your final handcrafted arrangement will strictly follow the exact stem counts and materials listed below in your Cost Breakdown.</Text>
        </View>

        <View style={styles.resultDetails}>
          <Text style={styles.inputLabel}>Arrangement name</Text>
          <TextInput
            onChangeText={onChangeArrangementName}
            placeholder={`${arrangementLabel} Mix & Match`}
            placeholderTextColor="#9CA3AF"
            style={styles.arrangementNameInput}
            value={arrangementName}
          />
          <Text style={styles.resultDescription}>A personalized floral arrangement based on your selected materials.</Text>

          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Cost Breakdown</Text>
            {result.price_breakdown?.items?.map((item) => (
              <View key={`${item.product_id}-${item.product_name}`} style={styles.breakdownRow}>
                <Text numberOfLines={1} style={styles.breakdownLabel}>{item.product_name} x {item.quantity}</Text>
                <Text style={styles.breakdownValue}>{formatPhp(Math.round(item.subtotal * 100))}</Text>
              </View>
            ))}
            <View style={styles.breakdownDivider} />
            {selectedAddOnTotal > 0 ? (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTotalLabel}>Add-ons</Text>
                <Text style={styles.breakdownTotalValue}>{formatPhp(selectedAddOnTotal)}</Text>
              </View>
            ) : null}
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownTotalLabel}>Total</Text>
              <Text style={styles.breakdownTotalValue}>{formatPhp(totalPrice)}</Text>
            </View>
          </View>

          <ProductAddOnSelector
            addOns={addOns}
            isLoading={isLoadingAddOns}
            onToggle={onToggleAddOn}
            selectedIds={selectedAddOnIds}
          />

          <GreetingCardComposer message={cardMessage} onChangeMessage={onChangeCardMessage} />

          <Pressable disabled={addingToCart} onPress={onAddToCart} style={({ pressed }) => [styles.addButton, addingToCart && styles.continueButtonDisabled, pressed && !addingToCart && styles.pressed]}>
            <ShoppingCart color="#FFFFFF" size={19} />
            <Text style={styles.addButtonText}>{addingToCart ? 'Adding...' : 'Add to shopping bag'}</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.resultFinePrint}>This is an AI generated preview. Your bouquet will be prepared based on the selected size and options.</Text>
    </View>
  );
}

function GenerationOverlay({ fact, progress }: { fact: string; progress: number }) {
  return (
    <View style={styles.overlay}>
      <View style={styles.overlayCard}>
        <SpinningLoader color={theme.colors.primary} />
        <Text style={styles.overlayTitle}>Creating your arrangement</Text>
        <Text style={styles.overlayFact}>{fact}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(Math.max(progress, 0), 100)}%` }]} />
        </View>
      </View>
    </View>
  );
}

function SpinningLoader({ color = '#FFFFFF' }: { color?: string }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 950, easing: Easing.linear }), -1, false);
  }, [rotation]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <LoaderCircle color={color} size={19} strokeWidth={2.5} />
    </Animated.View>
  );
}

function normalizeCategory(category: string) {
  return category.trim().toLowerCase();
}

function isFlowerLikeProduct(product: CustomizationProduct) {
  const category = normalizeCategory(product.category);

  return category === 'flower' || category === 'flowers' || category === 'filler' || category === 'fillers';
}

function buildPrompt({
  accessory,
  arrangement,
  flower,
  vase,
  wrapping,
}: {
  accessory?: CustomizationProduct;
  arrangement: { label: string };
  flower?: CustomizationProduct;
  vase?: CustomizationProduct;
  wrapping?: CustomizationProduct;
}) {
  const parts = [
    `${arrangement.label} floral arrangement`,
    flower ? `${flower.attrs?.quantity || 1} ${flower.attrs?.color || ''} ${flower.attrs?.style || ''} ${flower.name}` : null,
    vase ? `presented in ${vase.attrs?.material || ''} ${vase.attrs?.style || ''} ${vase.name}` : null,
    wrapping ? `wrapped with ${wrapping.attrs?.color || ''} ${wrapping.attrs?.style || ''} ${wrapping.name}` : null,
    accessory ? `finished with ${accessory.attrs?.name || accessory.name}` : null,
  ].filter(Boolean);

  return `A custom Mix and Match arrangement: ${parts.join(', ')}. Ultra-realistic florist product photo, clean studio lighting, elegant composition, natural textures, front-facing arrangement, no top-down view.`;
}

const softOutline = 'rgba(218, 222, 218, 0.72)';

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FAFAFA',
    flex: 1,
  },
  content: {
    gap: theme.spacing.lg,
  },
  floatingHeaderSolid: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderBottomColor: 'rgba(218, 222, 218, 0.72)',
    borderBottomWidth: 1,
    boxShadow: '0 10px 26px rgba(31, 42, 36, 0.08)',
  },
  backLink: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 7,
    minHeight: 44,
    paddingRight: theme.spacing.md,
  },
  backLinkText: {
    color: '#6A706B',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
  },
  heroBlock: {
    alignItems: 'center',
    gap: 7,
  },
  heroEyebrow: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    letterSpacing: 2,
  },
  heroTitle: {
    color: '#0C573E',
    fontFamily: Fonts.sansExtraBold,
    fontSize: 30,
    lineHeight: 36,
  },
  heroTitleAccent: {
    color: '#DB2777',
  },
  heroSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderColor: softOutline,
    borderRadius: 24,
    borderWidth: 1,
    boxShadow: '0 18px 42px rgba(31, 42, 36, 0.08)',
    gap: 22,
    padding: theme.spacing.lg,
  },
  progressHeader: {
    gap: theme.spacing.md,
  },
  progressTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  iconFrame: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: theme.radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  progressCopy: {
    flex: 1,
  },
  progressTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 19,
    lineHeight: 24,
  },
  progressSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  aiUsage: {
    color: '#8B958D',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
  },
  stepCount: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
  },
  stepTrack: {
    flexDirection: 'row',
    minHeight: 72,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepLine: {
    backgroundColor: '#E5E7EB',
    height: 1.4,
    left: '-50%',
    position: 'absolute',
    right: '50%',
    top: 18,
  },
  stepLineActive: {
    backgroundColor: theme.colors.primary,
  },
  stepCircle: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
    zIndex: 2,
  },
  stepCircleActive: {
    borderColor: theme.colors.primary,
  },
  stepCircleDone: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  stepCircleText: {
    color: '#A2AAA4',
    fontFamily: Fonts.sansBold,
    fontSize: 12,
  },
  stepCircleTextActive: {
    color: theme.colors.primary,
  },
  stepLabel: {
    color: '#98A19A',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10,
    lineHeight: 13,
    marginTop: 8,
    maxWidth: 74,
    minHeight: 28,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: theme.colors.primaryDark,
  },
  errorBox: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderRadius: 14,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  errorText: {
    color: '#DC2626',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 17,
  },
  selectionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: softOutline,
    borderRadius: 24,
    borderWidth: 1,
    boxShadow: '0 18px 42px rgba(31, 42, 36, 0.08)',
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  selectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  stepBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 26,
    justifyContent: 'center',
    marginTop: 1,
    width: 26,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontFamily: Fonts.sansBold,
    fontSize: 12,
  },
  selectionCopy: {
    flex: 1,
    gap: 3,
  },
  selectionTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 17,
    lineHeight: 22,
  },
  selectionSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  loadingPanel: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: 160,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#8B958D',
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
  arrangementGrid: {
    gap: theme.spacing.sm,
  },
  choiceCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 16,
    borderWidth: 1,
    gap: 5,
    padding: theme.spacing.md,
  },
  choiceCardSelected: {
    backgroundColor: '#F0F7F1',
    borderColor: theme.colors.primary,
  },
  choiceIcon: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: theme.radius.pill,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  choiceIconSelected: {
    backgroundColor: theme.colors.primary,
  },
  choiceTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 14,
  },
  choiceText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  segmentedControl: {
    backgroundColor: '#F3F4F6',
    borderRadius: 15,
    flexDirection: 'row',
    padding: 4,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    minHeight: 38,
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0 8px 18px rgba(31, 42, 36, 0.08)',
  },
  segmentText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
  },
  segmentTextActive: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 9,
    width: '48.5%',
  },
  productCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
  },
  productCardDisabled: {
    opacity: 0.52,
  },
  productImageWrap: {
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    height: '100%',
    width: '100%',
  },
  productCheck: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: 7,
    top: 7,
    width: 22,
  },
  productName: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 8,
    minHeight: 32,
  },
  productPrice: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    marginTop: 3,
  },
  stockBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: theme.radius.pill,
    marginTop: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  stockBadgeLow: {
    backgroundColor: '#FFF7ED',
  },
  stockBadgeOut: {
    backgroundColor: '#FEF2F2',
  },
  stockText: {
    color: '#6B7280',
    fontFamily: Fonts.sansBold,
    fontSize: 10,
  },
  stockTextLow: {
    color: '#D97706',
  },
  stockTextOut: {
    color: '#DC2626',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    textAlign: 'center',
  },
  cardFooter: {
    alignItems: 'center',
    borderTopColor: '#EEF1EE',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.lg,
  },
  returnButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: softOutline,
    borderRadius: 13,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  returnButtonText: {
    color: '#3F4741',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    height: 52,
    justifyContent: 'center',
    minWidth: 150,
    paddingHorizontal: theme.spacing.lg,
  },
  continueButtonDisabled: {
    backgroundColor: '#E2E5E2',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.sansBold,
    fontSize: 15,
  },
  continueButtonTextDisabled: {
    color: '#A5ABA6',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderColor: softOutline,
    borderRadius: 22,
    borderWidth: 1,
    boxShadow: '0 18px 42px rgba(31, 42, 36, 0.12)',
    overflow: 'hidden',
  },
  resultHeader: {
    alignItems: 'center',
    borderBottomColor: '#EEF1EE',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  resultHeaderIcon: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  resultHeaderCopy: {
    flex: 1,
  },
  resultTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 22,
  },
  resultSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 14,
  },
  resultIconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  resultBody: {
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  resultImageFrame: {
    aspectRatio: 1,
    borderColor: '#DEE3DE',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  resultImageBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 999,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    position: 'absolute',
    top: 12,
    zIndex: 2,
  },
  resultImageBadgeText: {
    color: '#7C3AED',
    fontFamily: Fonts.sansBold,
    fontSize: 11,
  },
  resultImage: {
    height: '100%',
    width: '100%',
  },
  conceptNote: {
    alignItems: 'flex-start',
    backgroundColor: '#F5F0FF',
    borderColor: '#DDD0FF',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    padding: theme.spacing.md,
  },
  conceptNoteText: {
    color: '#4C3A72',
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  resultDetails: {
    gap: theme.spacing.md,
  },
  inputLabel: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
  },
  arrangementNameInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DEE3DE',
    borderRadius: 14,
    borderWidth: 1,
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
  },
  resultDescription: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  breakdownCard: {
    borderColor: '#DEE3DE',
    borderRadius: 16,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  breakdownTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    marginBottom: theme.spacing.sm,
  },
  breakdownRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingVertical: 5,
  },
  breakdownLabel: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 12,
  },
  breakdownValue: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
  },
  breakdownDivider: {
    backgroundColor: '#E5E8E5',
    height: 1,
    marginVertical: theme.spacing.sm,
  },
  breakdownTotalLabel: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
  },
  breakdownTotalValue: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 20,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#1F8F4D',
    borderRadius: 14,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 52,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.sansBold,
    fontSize: 15,
  },
  resultFinePrint: {
    borderTopColor: '#EEF1EE',
    borderTopWidth: 1,
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    padding: theme.spacing.lg,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(9, 19, 13, 0.38)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    padding: theme.spacing.lg,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 40,
  },
  overlayCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    gap: theme.spacing.md,
    maxWidth: 340,
    padding: theme.spacing.xl,
    width: '100%',
  },
  overlayTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 18,
  },
  overlayFact: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  progressTrack: {
    backgroundColor: '#E8ECE9',
    borderRadius: theme.radius.pill,
    height: 8,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    backgroundColor: theme.colors.primary,
    height: '100%',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
});
