import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ArrowRight, Check, LoaderCircle, Minus, PackageOpen, Plus, RotateCcw, Search, ShoppingCart, Shuffle, Sparkles, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  type ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPageHeader } from '@/components/app-page-header';
import { GreetingCardComposer } from '@/components/greeting-card-composer';
import { ProductAddOnSelector } from '@/components/product-add-on-selector';
import { formatPhp, type Product } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { requireSignedIn } from '@/services/auth-guard';
import { getAuthSession } from '@/services/auth-session';
import {
  checkAndGenerate,
  getAiUsage,
  getCustomizationProducts,
  isCustomizationEnabled,
  type AiUsage,
  type CustomizationProduct,
  type GenerationResult,
} from '@/services/customization-api';
import { addAiArrangementToCart } from '@/services/cart-storage';
import { shopApi } from '@/services/shop-api';

const imageNotFound = require('@/assets/images/default-img/ImageNotFound.webp');
const arrangementBouquet = require('@/assets/images/make-it-personal/arrangement_bouquet.webp');
const arrangementBox = require('@/assets/images/make-it-personal/arrangement_box.webp');
const arrangementVase = require('@/assets/images/make-it-personal/arrangement_vase.webp');
const pollinationsCredit = require('@/assets/images/make-it-personal/pollinations-ai.png');
const generationProblemMessage = 'There is a problem generating this arrangement. Please try again.';
const SCREEN_SIDE = 20;

function formatGenerationError(message?: string | null, fallback = generationProblemMessage) {
  const trimmedMessage = message?.trim();

  if (!trimmedMessage || /internal\s+server\s+error/i.test(trimmedMessage)) {
    return fallback;
  }

  return trimmedMessage;
}

type ArrangementType = 'bouquet' | 'box' | 'vase';
type StepKey = 'arrangement' | 'flowers' | 'container' | 'accessories' | 'review';

type ArrangementOption = {
  description: string;
  helper: string;
  id: ArrangementType;
  image: number;
  label: string;
  maxStems: number;
};

type SelectedPreviewItem = {
  id: string;
  image: ImageSourcePropType;
  label: string;
};

const ARRANGEMENT_OPTIONS: ArrangementOption[] = [
  {
    description: 'Hand-tied & wrapped',
    helper: 'Up to 24 stems',
    id: 'bouquet',
    image: arrangementBouquet,
    label: 'Bouquet',
    maxStems: 24,
  },
  {
    description: 'Arranged in a gift box',
    helper: 'Up to 9 stems',
    id: 'box',
    image: arrangementBox,
    label: 'Flower Box',
    maxStems: 9,
  },
  {
    description: 'Arranged in a vase',
    helper: 'Up to 12 stems',
    id: 'vase',
    image: arrangementVase,
    label: 'Vase',
    maxStems: 12,
  },
];

const FLOWER_FACTS = [
  'A balanced arrangement combines focal blooms, texture, and a clear container style.',
  'Fresh water and clean stem cuts help flowers last longer.',
  'Fillers add movement and texture without needing strict stem counts.',
  'Florists use containers to control the final shape and presentation.',
];

const SEARCH_THRESHOLDS: Record<'container' | 'filler' | 'standard', number> = {
  container: 7,
  filler: 9,
  standard: 7,
};

export default function MixAndMatchScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState(0);
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
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<ReadonlySet<string>>(() => new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArrangement, setSelectedArrangement] = useState<ArrangementType>('bouquet');
  const [flowerQuantities, setFlowerQuantities] = useState<Record<string, number>>({});
  const [selectedFillerIds, setSelectedFillerIds] = useState<ReadonlySet<string>>(() => new Set());
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [selectedAccessoryId, setSelectedAccessoryId] = useState<string | null>(null);
  const [flowerSheetProduct, setFlowerSheetProduct] = useState<CustomizationProduct | null>(null);
  const [flowerSheetQty, setFlowerSheetQty] = useState(0);

  const selectedArrangementOption = useMemo(
    () => ARRANGEMENT_OPTIONS.find((option) => option.id === selectedArrangement) ?? ARRANGEMENT_OPTIONS[0],
    [selectedArrangement],
  );
  const steps = useMemo(
    () => getSteps(selectedArrangementOption),
    [selectedArrangementOption],
  );
  const isReviewStep = step >= steps.length;
  const activeStep = isReviewStep ? getReviewStep() : steps[step];
  const availableProducts = useMemo(() => products.filter(isMixAndMatchProduct), [products]);
  const flowerProducts = useMemo(() => availableProducts.filter(isFlowerProduct), [availableProducts]);
  const fillerProducts = useMemo(() => availableProducts.filter(isFillerProduct), [availableProducts]);
  const wrapperProducts = useMemo(() => availableProducts.filter(isWrapperProduct), [availableProducts]);
  const vaseProducts = useMemo(() => availableProducts.filter(isVaseProduct), [availableProducts]);
  const boxProducts = useMemo(() => products.filter(isBoxProduct), [products]);
  const accessoryProducts = useMemo(() => availableProducts.filter(isAccessoryProduct), [availableProducts]);
  const selectedFlowers = useMemo(
    () =>
      Object.entries(flowerQuantities)
        .map(([id, quantity]) => ({ product: products.find((item) => item.id === id), quantity }))
        .filter((item): item is { product: CustomizationProduct; quantity: number } => Boolean(item.product) && item.quantity > 0),
    [flowerQuantities, products],
  );
  const selectedFillers = useMemo(
    () => products.filter((item) => selectedFillerIds.has(item.id)),
    [products, selectedFillerIds],
  );
  const containerProducts = useMemo(() => {
    if (selectedArrangement === 'bouquet') return wrapperProducts;
    if (selectedArrangement === 'vase') return vaseProducts;
    return boxProducts;
  }, [boxProducts, selectedArrangement, vaseProducts, wrapperProducts]);
  const selectedContainer = products.find((item) => item.id === selectedContainerId);
  const selectedAccessory = products.find((item) => item.id === selectedAccessoryId);
  const selectedStemCount = selectedFlowers.reduce((total, item) => total + item.quantity, 0);
  const selectedPreviewItems = useMemo<SelectedPreviewItem[]>(
    () => [
      { id: selectedArrangementOption.id, image: selectedArrangementOption.image, label: selectedArrangementOption.label },
      ...selectedFlowers.map(({ product, quantity }) => ({
        id: product.id,
        image: product.image_url ? { uri: product.image_url } : imageNotFound,
        label: `${quantity}x ${product.name}`,
      })),
      ...selectedFillers.map((product) => ({
        id: product.id,
        image: product.image_url ? { uri: product.image_url } : imageNotFound,
        label: product.name,
      })),
      ...(selectedContainer ? [{
        id: selectedContainer.id,
        image: selectedContainer.image_url ? { uri: selectedContainer.image_url } : imageNotFound,
        label: selectedContainer.name,
      }] : []),
      ...(selectedAccessory ? [{
        id: selectedAccessory.id,
        image: selectedAccessory.image_url ? { uri: selectedAccessory.image_url } : imageNotFound,
        label: selectedAccessory.name,
      }] : []),
    ],
    [selectedAccessory, selectedArrangementOption, selectedContainer, selectedFillers, selectedFlowers],
  );
  const estimatedTotalCents = useMemo(() => {
    const flowers = selectedFlowers.reduce((total, item) => total + Math.round((item.product.price || 0) * 100) * item.quantity, 0);
    const fillers = selectedFillers.reduce((total, item) => total + Math.round((item.price || 0) * 100), 0);
    const container = selectedContainer ? Math.round((selectedContainer.price || 0) * 100) : 0;
    const accessory = selectedAccessory ? Math.round((selectedAccessory.price || 0) * 100) : 0;
    return flowers + fillers + container + accessory;
  }, [selectedAccessory, selectedContainer, selectedFillers, selectedFlowers]);
  const showResult = Boolean(result?.success);

  const stepProducts = useMemo(() => {
    if (activeStep.key === 'flowers') return flowerProducts;
    if (activeStep.key === 'container') return containerProducts;
    if (activeStep.key === 'accessories') return accessoryProducts;
    return [];
  }, [accessoryProducts, activeStep.key, containerProducts, flowerProducts]);
  const flowerStepProducts = useMemo(() => [...flowerProducts, ...fillerProducts], [fillerProducts, flowerProducts]);
  const searchThreshold = activeStep.key === 'container' ? SEARCH_THRESHOLDS.container : SEARCH_THRESHOLDS.standard;
  const searchableProducts = activeStep.key === 'flowers' ? flowerStepProducts : stepProducts;
  const shouldShowSearch = searchableProducts.length >= searchThreshold;
  const visibleFlowerProducts = useMemo(() => filterProductsForSearch(flowerProducts, searchQuery), [flowerProducts, searchQuery]);
  const visibleFillerProducts = useMemo(() => filterProductsForSearch(fillerProducts, searchQuery), [fillerProducts, searchQuery]);
  const visibleStepProducts = useMemo(() => filterProductsForSearch(stepProducts, searchQuery), [searchQuery, stepProducts]);

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

        if (!isActive) return;

        setIsSignedIn(Boolean(session));
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
        if (isActive) setAddOns(items);
      })
      .catch(() => {
        if (isActive) setAddOns([]);
      })
      .finally(() => {
        if (isActive) setIsLoadingAddOns(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    setSearchQuery('');
  }, [step, selectedArrangement]);

  useEffect(() => {
    setSelectedContainerId(null);
  }, [selectedArrangement]);

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

  function handleNext() {
    if (!canContinue(activeStep.key)) {
      return;
    }

    if (activeStep.key === 'review') {
      void handleGenerate();
      return;
    }

    if (step < steps.length - 1) {
      setError(null);
      setStep((current) => current + 1);
      scrollRef.current?.scrollTo({ animated: true, y: 0 });
      return;
    }

    setError(null);
    setStep(steps.length);
    scrollRef.current?.scrollTo({ animated: true, y: 0 });
  }

  function canContinue(key: StepKey) {
    if (key === 'flowers' && selectedStemCount <= 0) {
      setError('Choose at least one flower to continue.');
      return false;
    }

    if (key === 'container' && !selectedContainerId) {
      if (containerProducts.length === 0) {
        setError('There is no stock in this container type. Please try another arrangement type. We will add more soon!');
        return false;
      }

      setError(`Choose a ${getContainerLabel(selectedArrangement).toLowerCase()} to continue.`);
      return false;
    }

    if (key === 'review' && (!selectedContainerId || selectedStemCount <= 0)) {
      setError('Complete your flowers and container before generating.');
      return false;
    }

    return true;
  }

  function openFlowerSheet(product: CustomizationProduct) {
    setFlowerSheetProduct(product);
    setFlowerSheetQty(flowerQuantities[product.id] ?? 1);
    setError(null);
  }

  function updateFlowerQuantity(productId: string, nextQuantity: number) {
    const product = products.find((item) => item.id === productId);
    const currentQuantity = flowerQuantities[productId] ?? 0;
    const remainingLimit = selectedArrangementOption.maxStems - (selectedStemCount - currentQuantity);
    const stockLimit = Math.max(0, product?.stock ?? selectedArrangementOption.maxStems);
    const clamped = Math.min(Math.max(nextQuantity, 0), remainingLimit, stockLimit);

    if (nextQuantity > clamped) {
      setError(`You can select up to ${selectedArrangementOption.maxStems} stems for ${selectedArrangementOption.label}.`);
    } else {
      setError(null);
    }

    setFlowerQuantities((current) => {
      const next = { ...current };
      if (clamped <= 0) {
        delete next[productId];
      } else {
        next[productId] = clamped;
      }
      return next;
    });
  }

  function closeFlowerSheet() {
    setFlowerSheetProduct(null);
    setFlowerSheetQty(0);
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

    if (!selectedContainer || selectedFlowers.length === 0 || isGenerating) {
      setError('Complete all selections before generating your preview.');
      return;
    }

    const session = await requireSignedIn('generate your arrangement');
    if (!session) {
      setIsSignedIn(false);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const primaryFlower = [...selectedFlowers].sort((first, second) => second.quantity - first.quantity)[0]?.product;
      const promptText = buildPrompt({
        accessory: selectedAccessory,
        arrangement: selectedArrangementOption,
        container: selectedContainer,
        fillers: selectedFillers,
        flowers: selectedFlowers,
      });
      const data = await checkAndGenerate({
        flower_id: primaryFlower?.id,
        prompt_text: promptText,
        accessory_id: selectedAccessory?.id,
        vase_id: selectedArrangement === 'vase' ? selectedContainer.id : undefined,
        wrapping_id: selectedArrangement === 'bouquet' ? selectedContainer.id : undefined,
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
        setError(formatGenerationError(data.message, 'Generation failed. Please try another selection.'));
        setAiUsage((current) => (current ? { ...current, remaining: data.remaining_generations ?? current.remaining } : current));
      }
    } catch (generateError) {
      setError(formatGenerationError(generateError instanceof Error ? generateError.message : null));
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleAddToCart() {
    const confirmedContainer = selectedContainer;
    if (!result || addingToCart || !confirmedContainer) {
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
        arrangementDetails: {
          arrangementId: result.arrangement_id,
          basePriceCents: Math.round(totalPricePesos * 100),
          prompt: buildPrompt({
            accessory: selectedAccessory,
            arrangement: selectedArrangementOption,
            container: confirmedContainer,
            fillers: selectedFillers,
            flowers: selectedFlowers,
          }),
          recipeItems: result.price_breakdown?.items?.map((item) => ({
            imageUrl: item.image_url ?? undefined,
            materialType: item.material_type,
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
            subtotalCents: Math.round(item.subtotal * 100),
            unitPriceCents: Math.round(item.unit_price * 100),
          })) ?? [],
          source: 'mix-and-match',
        },
        arrangementId: result.arrangement_id,
        cardMessage,
        description: `${selectedArrangementOption.label}. Contains: ${breakdownNames}.`,
        imageUrl: result.generated_image_url,
        name: arrangementName.trim() || `${selectedArrangementOption.label} Mix & Match`,
        priceCents: Math.round((totalPricePesos + addOnTotalPesos) * 100),
      });

      router.push('/(tabs)/cart');
    } catch (addError) {
      Alert.alert('Error', addError instanceof Error ? addError.message : 'Failed to add this arrangement to your cart.');
    } finally {
      setAddingToCart(false);
    }
  }

  function handleStartOver() {
    setResult(null);
    setError(null);
    setStep(0);
    setSelectedArrangement('bouquet');
    setFlowerQuantities({});
    setSelectedFillerIds(new Set());
    setSelectedContainerId(null);
    setSelectedAccessoryId(null);
    setProgress(0);
    setArrangementName('AI Arrangement');
    setCardMessage('');
    setSelectedAddOnIds(new Set());
  }

  const generationDisabled = isGenerating || isLoading || (activeStep.key === 'review' && !isSignedIn);
  const generationLabel = activeStep.key === 'review'
    ? isGenerating
      ? 'Generating...'
      : isSignedIn
        ? 'Generate'
        : 'Sign in to generate'
    : 'Continue';

  const stepFooter = (
    <View style={styles.cardFooter}>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          if (step === 0) {
            router.back();
            return;
          }
          if (isReviewStep) {
            setStep(steps.length - 1);
            return;
          }
          setStep((current) => Math.max(current - 1, 0));
        }}
        style={({ pressed }) => [styles.returnButton, pressed && styles.pressed]}>
        <Text style={styles.returnButtonText}>{step === 0 ? 'Return' : 'Back'}</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        disabled={generationDisabled}
        onPress={handleNext}
        style={({ pressed }) => [styles.continueButton, generationDisabled && styles.continueButtonDisabled, pressed && !generationDisabled && styles.pressed]}>
        <Text style={[styles.continueButtonText, generationDisabled && styles.continueButtonTextDisabled]}>
          {generationLabel}
        </Text>
        {isGenerating ? (
          <SpinningLoader />
        ) : activeStep.key === 'review' ? (
          <Sparkles color="#FFFFFF" size={19} strokeWidth={2.5} />
        ) : (
          <ArrowRight color="#FFFFFF" size={19} strokeWidth={2.5} />
        )}
      </Pressable>
    </View>
  );

  return (
    <View style={styles.screen}>
      <AppPageHeader title="Mix and Match" />

      <ScrollView
        ref={scrollRef}
        bounces={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + (showResult ? 108 : 156),
            paddingHorizontal: SCREEN_SIDE,
            paddingTop: 24,
          },
        ]}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}>
        {showResult && result ? (
          <ResultView
            addOns={addOns}
            arrangementLabel={selectedArrangementOption.label}
            arrangementName={arrangementName}
            addingToCart={addingToCart}
            cardMessage={cardMessage}
            isLoadingAddOns={isLoadingAddOns}
            selectedAddOnIds={selectedAddOnIds}
            selectedItems={selectedPreviewItems}
            onAddToCart={handleAddToCart}
            onChangeArrangementName={setArrangementName}
            onChangeCardMessage={setCardMessage}
            onStartOver={handleStartOver}
            onToggleAddOn={(id) => {
              setSelectedAddOnIds((current) => {
                const next = new Set(current);
                if (next.has(id)) next.delete(id);
                else next.add(id);
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
              <Text style={styles.heroSubtitle}>Build your own custom arrangement from available florist materials.</Text>
            </View>

            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <View style={styles.progressTitleRow}>
                  <View style={styles.iconFrame}>
                    <Shuffle color="#4B5563" size={20} strokeWidth={2.4} />
                  </View>
                  <View style={styles.progressCopy}>
                    <Text style={styles.progressTitle}>Mix and Match</Text>
                    <Text style={styles.progressSubtitle}>Phone-friendly AI arrangement builder</Text>
                  </View>
                </View>
                <View style={styles.progressMeta}>
                  <Text style={styles.aiUsage}>{aiUsage ? `${aiUsage.remaining} / ${aiUsage.limit} AI left` : 'AI preview'}</Text>
                  <Text style={styles.stepCount}>{isReviewStep ? 'Review' : `Step ${step + 1} of ${steps.length}`}</Text>
                </View>
              </View>
              <View style={styles.stepTrack}>
                {steps.map((item, index) => (
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
                  <Text style={styles.stepBadgeText}>{isReviewStep ? '✓' : step + 1}</Text>
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
              ) : activeStep.key === 'arrangement' ? (
                <View style={styles.arrangementGrid}>
                  {ARRANGEMENT_OPTIONS.map((option) => (
                    <ArrangementChoiceCard
                      key={option.id}
                      option={option}
                      onPress={() => {
                        setSelectedArrangement(option.id);
                        setError(null);
                      }}
                      selected={selectedArrangement === option.id}
                    />
                  ))}
                  <SelectionSummary label="Arrangement" value={selectedArrangementOption.label} />
                </View>
              ) : activeStep.key === 'review' ? (
                <ReviewPanel
                  accessory={selectedAccessory}
                  arrangement={selectedArrangementOption}
                  container={selectedContainer}
                  estimatedTotalCents={estimatedTotalCents}
                  fillers={selectedFillers}
                  flowers={selectedFlowers}
                  selectedItems={selectedPreviewItems}
                />
              ) : (
                <>
                  {activeStep.key === 'flowers' ? (
                    <SelectedFlowersSummary
                      maxStems={selectedArrangementOption.maxStems}
                      onChangeQuantity={updateFlowerQuantity}
                      selectedFlowers={selectedFlowers}
                      stemCount={selectedStemCount}
                    />
                  ) : null}

                  {shouldShowSearch ? (
                    <View style={styles.inlineSearch}>
                      <Search color="#6B7280" size={17} strokeWidth={2.2} />
                      <TextInput
                        autoCapitalize="none"
                        onChangeText={setSearchQuery}
                        placeholder={`Search ${activeStep.label.toLowerCase()}`}
                        placeholderTextColor="#9CA3AF"
                        style={styles.inlineSearchInput}
                        value={searchQuery}
                      />
                      {searchQuery ? (
                        <Pressable accessibilityLabel="Clear search" onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                          <X color="#6B7280" size={16} strokeWidth={2.4} />
                        </Pressable>
                      ) : null}
                    </View>
                  ) : null}

                  {activeStep.key === 'flowers' ? (
                    <>
                      <ProductSectionHeader title="Main Flower" subtitle={`Select up to ${selectedArrangementOption.maxStems} stems for this arrangement.`} />
                      <View style={styles.productGrid}>
                        {visibleFlowerProducts.map((product) => {
                          const quantity = flowerQuantities[product.id] ?? 0;

                          return (
                            <InventoryCard
                              key={product.id}
                              onPress={() => {
                                setError(null);
                                openFlowerSheet(product);
                              }}
                              product={product}
                              quantity={quantity}
                              selected={quantity > 0}
                            />
                          );
                        })}
                      </View>
                      {flowerProducts.length === 0 ? (
                        <Text style={styles.emptyText}>No main flowers are available for Mix and Match yet.</Text>
                      ) : visibleFlowerProducts.length === 0 ? (
                        <Text style={styles.emptyText}>No main flowers match your search.</Text>
                      ) : null}

                      <ProductSectionHeader title="Filler" subtitle="Optional greenery and texture for the arrangement." />
                      <View style={styles.productGrid}>
                        {visibleFillerProducts.map((product) => (
                          <InventoryCard
                            key={product.id}
                            onPress={() => {
                              setError(null);
                              setSelectedFillerIds((current) => {
                                const next = new Set(current);
                                if (next.has(product.id)) next.delete(product.id);
                                else next.add(product.id);
                                return next;
                              });
                            }}
                            product={product}
                            selected={selectedFillerIds.has(product.id)}
                          />
                        ))}
                      </View>
                      {fillerProducts.length === 0 ? (
                        <Text style={styles.emptyText}>No fillers are available for Mix and Match yet.</Text>
                      ) : visibleFillerProducts.length === 0 ? (
                        <Text style={styles.emptyText}>No fillers match your search.</Text>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <View style={styles.productGrid}>
                        {visibleStepProducts.map((product) => {
                          const selected = activeStep.key === 'container' ? selectedContainerId === product.id : selectedAccessoryId === product.id;

                          return (
                            <InventoryCard
                              key={product.id}
                              onPress={() => {
                                setError(null);
                                if (activeStep.key === 'accessories') {
                                  setSelectedAccessoryId((current) => (current === product.id ? null : product.id));
                                  return;
                                }
                                setSelectedContainerId((current) => (current === product.id ? null : product.id));
                              }}
                              product={product}
                              selected={selected}
                            />
                          );
                        })}
                      </View>
                      {stepProducts.length === 0 ? (
                        activeStep.key === 'container' ? <EmptyContainerState /> : <Text style={styles.emptyText}>No accessories are available yet. You can continue without one.</Text>
                      ) : visibleStepProducts.length === 0 ? (
                        <Text style={styles.emptyText}>No items match your search.</Text>
                      ) : null}
                    </>
                  )}
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {!showResult ? (
        <View style={[styles.floatingStepFooter, { paddingBottom: insets.bottom + 12, paddingHorizontal: SCREEN_SIDE }]}>
          {stepFooter}
        </View>
      ) : null}

      <FlowerQuantitySheet
        maxStems={selectedArrangementOption.maxStems}
        onClose={closeFlowerSheet}
        onSave={(product, quantity) => {
          updateFlowerQuantity(product.id, quantity);
          closeFlowerSheet();
        }}
        onSetQuantity={setFlowerSheetQty}
        product={flowerSheetProduct}
        quantity={flowerSheetQty}
        remainingStems={selectedArrangementOption.maxStems - (selectedStemCount - (flowerSheetProduct ? flowerQuantities[flowerSheetProduct.id] ?? 0 : 0))}
      />
      {isGenerating ? <GenerationOverlay fact={FLOWER_FACTS[factIdx]} progress={progress} /> : null}
    </View>
  );
}

function getSteps(arrangement: ArrangementOption): { description: string; key: StepKey; label: string; title: string }[] {
  return [
    {
      description: "Pick how you'd like your flowers presented.",
      key: 'arrangement',
      label: 'Arrangement',
      title: 'Choose your arrangement',
    },
    {
      description: `Choose the main flower, then add optional fillers. ${arrangement.label} supports ${arrangement.maxStems} stems.`,
      key: 'flowers',
      label: 'Flowers',
      title: 'Select flowers',
    },
    {
      description: `Only matching container options are shown for this arrangement.`,
      key: 'container',
      label: 'Container',
      title: 'Choose container',
    },
    {
      description: 'Choose an optional ribbon or accessory.',
      key: 'accessories',
      label: 'Accessories',
      title: 'Choose accessories',
    },
  ];
}

function getReviewStep(): { description: string; key: StepKey; label: string; title: string } {
  return {
    description: 'Review your selected items and price breakdown, then generate the AI concept.',
    key: 'review',
    label: 'Review',
    title: 'Review and generate',
  };
}

function getContainerLabel(type: ArrangementType) {
  if (type === 'bouquet') return 'wrapper';
  if (type === 'vase') return 'vase';
  return 'clear box';
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

function ArrangementChoiceCard({ onPress, option, selected }: { onPress: () => void; option: ArrangementOption; selected: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.arrangementCard, selected && styles.arrangementCardSelected, pressed && styles.pressed]}>
      <View style={styles.arrangementImageWrap}>
        <Image contentFit="contain" source={option.image} style={styles.arrangementImage} />
        {selected ? (
          <View style={styles.arrangementCheck}>
            <Check color="#FFFFFF" size={13} strokeWidth={3} />
          </View>
        ) : null}
      </View>
      <Text style={[styles.arrangementTitle, selected && styles.arrangementTitleSelected]}>{option.label}</Text>
      <Text style={styles.arrangementDescription}>{option.description}</Text>
      <Text style={styles.arrangementHelper}>{option.helper}</Text>
    </Pressable>
  );
}

function SelectionSummary({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.selectionSummary}>
      <Text style={styles.selectionSummaryText}>{label}: {value}</Text>
    </View>
  );
}

function ProductSectionHeader({ subtitle, title }: { subtitle: string; title: string }) {
  return (
    <View style={styles.productSectionHeader}>
      <Text style={styles.productSectionTitle}>{title}</Text>
      <Text style={styles.productSectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function EmptyContainerState() {
  return (
    <View style={styles.emptyContainerState}>
      <PackageOpen color="#9CA3AF" size={28} strokeWidth={2.1} />
      <Text style={styles.emptyContainerText}>There is no stock in this container type. Please try another arrangement type. We will add more soon!</Text>
    </View>
  );
}

function SelectedFlowersSummary({
  maxStems,
  onChangeQuantity,
  selectedFlowers,
  stemCount,
}: {
  maxStems: number;
  onChangeQuantity: (productId: string, quantity: number) => void;
  selectedFlowers: { product: CustomizationProduct; quantity: number }[];
  stemCount: number;
}) {
  if (!selectedFlowers.length) {
    return (
      <View style={styles.flowerSummaryEmpty}>
        <Text style={styles.flowerSummaryText}>Selected stems: {stemCount} / {maxStems}</Text>
      </View>
    );
  }

  return (
    <View style={styles.flowerSummary}>
      <Text style={styles.flowerSummaryText}>Selected stems: {stemCount} / {maxStems}</Text>
      {selectedFlowers.map(({ product, quantity }) => (
        <View key={product.id} style={styles.flowerSummaryRow}>
          <Text numberOfLines={1} style={styles.flowerSummaryName}>{product.name}</Text>
          <View style={styles.quickQuantity}>
            <Pressable onPress={() => onChangeQuantity(product.id, quantity - 1)} style={styles.quickQuantityButton}>
              <Minus color="#24482E" size={14} strokeWidth={2.5} />
            </Pressable>
            <Text style={styles.quickQuantityText}>{quantity}</Text>
            <Pressable onPress={() => onChangeQuantity(product.id, quantity + 1)} style={styles.quickQuantityButton}>
              <Plus color="#24482E" size={14} strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

function InventoryCard({
  onPress,
  product,
  quantity,
  selected,
}: {
  onPress: () => void;
  product: CustomizationProduct;
  quantity?: number;
  selected: boolean;
}) {
  const isOut = !isSelectableProduct(product);

  return (
    <Pressable disabled={isOut} onPress={onPress} style={({ pressed }) => [styles.productCard, selected && styles.productCardSelected, isOut && styles.productCardDisabled, pressed && !isOut && styles.pressed]}>
      <View style={styles.productImageWrap}>
        <Image contentFit="cover" source={product.image_url ? { uri: product.image_url } : imageNotFound} style={styles.productImage} />
        {selected ? (
          <View style={styles.productCheck}>
            {quantity && quantity > 0 ? <Text style={styles.productCheckText}>{quantity}</Text> : <Check color="#FFFFFF" size={13} strokeWidth={3} />}
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

function FlowerQuantitySheet({
  maxStems,
  onClose,
  onSave,
  onSetQuantity,
  product,
  quantity,
  remainingStems,
}: {
  maxStems: number;
  onClose: () => void;
  onSave: (product: CustomizationProduct, quantity: number) => void;
  onSetQuantity: (quantity: number) => void;
  product: CustomizationProduct | null;
  quantity: number;
  remainingStems: number;
}) {
  if (!product) {
    return null;
  }

  const maxQuantity = Math.max(0, Math.min(product.stock ?? maxStems, remainingStems));
  const nextQuantity = Math.min(Math.max(quantity, 0), maxQuantity);

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <View style={styles.modalBackdrop}>
        <Pressable accessibilityLabel="Close flower quantity selector" onPress={onClose} style={styles.modalScrim} />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Flower quantity</Text>
            <Pressable accessibilityLabel="Close" onPress={onClose} style={styles.sheetClose}>
              <X color="#3A403B" size={19} strokeWidth={2.4} />
            </Pressable>
          </View>
          <View style={styles.sheetProductRow}>
            <Image contentFit="cover" source={product.image_url ? { uri: product.image_url } : imageNotFound} style={styles.sheetImage} />
            <View style={styles.sheetProductCopy}>
              <Text numberOfLines={2} style={styles.sheetProductName}>{product.name}</Text>
              <Text style={styles.sheetProductMeta}>{formatPhp(Math.round((product.price || 0) * 100))} each</Text>
              <Text style={styles.sheetProductMeta}>{product.stock} available</Text>
            </View>
          </View>
          <View style={styles.sheetLimitBox}>
            <Text style={styles.sheetLimitText}>Stem limit for this arrangement: {maxStems}</Text>
            <Text style={styles.sheetLimitText}>You can add up to {maxQuantity} of this flower now.</Text>
          </View>
          <View style={styles.sheetQuantityRow}>
            <Pressable onPress={() => onSetQuantity(Math.max(0, nextQuantity - 1))} style={styles.sheetQuantityButton}>
              <Minus color="#24482E" size={18} strokeWidth={2.6} />
            </Pressable>
            <Text style={styles.sheetQuantityText}>{nextQuantity}</Text>
            <Pressable onPress={() => onSetQuantity(Math.min(maxQuantity, nextQuantity + 1))} style={styles.sheetQuantityButton}>
              <Plus color="#24482E" size={18} strokeWidth={2.6} />
            </Pressable>
          </View>
          <Pressable onPress={() => onSave(product, nextQuantity)} style={({ pressed }) => [styles.sheetSaveButton, pressed && styles.pressed]}>
            <Text style={styles.sheetSaveText}>{nextQuantity > 0 ? 'Add / Update flower' : 'Remove flower'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ReviewPanel({
  accessory,
  arrangement,
  container,
  estimatedTotalCents,
  fillers,
  flowers,
  selectedItems,
}: {
  accessory?: CustomizationProduct;
  arrangement: ArrangementOption;
  container?: CustomizationProduct;
  estimatedTotalCents: number;
  fillers: CustomizationProduct[];
  flowers: { product: CustomizationProduct; quantity: number }[];
  selectedItems: SelectedPreviewItem[];
}) {
  return (
    <View style={styles.reviewPanel}>
      <SelectionSummary label="Arrangement" value={arrangement.label} />
      <View style={styles.reviewImageGrid}>
        {selectedItems.map((item) => (
          <View key={item.id} style={styles.reviewImageItem}>
            <Image contentFit="cover" source={item.image} style={styles.reviewImage} />
            <Text numberOfLines={2} style={styles.reviewImageLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Price Breakdown</Text>
        {flowers.map(({ product, quantity }) => (
          <ReviewRow key={product.id} label={product.name} meta={`x ${quantity}`} value={formatPhp(Math.round((product.price || 0) * 100) * quantity)} />
        ))}
        {fillers.map((product) => (
          <ReviewRow key={product.id} label={product.name} value={formatPhp(Math.round((product.price || 0) * 100))} />
        ))}
        {container ? <ReviewRow label={container.name} value={formatPhp(Math.round((container.price || 0) * 100))} /> : null}
        {accessory ? <ReviewRow label={accessory.name} value={formatPhp(Math.round((accessory.price || 0) * 100))} /> : null}
        {!fillers.length ? <Text style={styles.reviewMuted}>No fillers selected</Text> : null}
        {!accessory ? <Text style={styles.reviewMuted}>No accessory selected</Text> : null}
        <View style={styles.estimatedTotal}>
          <Text style={styles.estimatedTotalLabel}>Estimated before AI check</Text>
          <Text style={styles.estimatedTotalValue}>{formatPhp(estimatedTotalCents)}</Text>
        </View>
      </View>
    </View>
  );
}

function ReviewRow({ label, meta, value }: { label: string; meta?: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <View style={styles.reviewLabelGroup}>
        <Text numberOfLines={1} style={styles.reviewLabel}>{label}</Text>
        {meta ? <Text style={styles.qtyPill}>{meta}</Text> : null}
      </View>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
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
  selectedItems,
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
  selectedItems: SelectedPreviewItem[];
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
          <Text style={styles.conceptNoteText}>AI-generated concept for color palette and vibe. Final handcrafted arrangement follows the exact materials in the cost breakdown.</Text>
        </View>
        <Image contentFit="contain" source={pollinationsCredit} style={styles.pollinationsCredit} />

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

          <View style={styles.selectedItemsPanel}>
            <Text style={styles.breakdownTitle}>Selected Items</Text>
            <View style={styles.reviewImageGrid}>
              {selectedItems.map((item) => (
                <View key={item.id} style={styles.reviewImageItem}>
                  <Image contentFit="cover" source={item.image} style={styles.reviewImage} />
                  <Text numberOfLines={2} style={styles.reviewImageLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Cost Breakdown</Text>
            {result.price_breakdown?.items?.map((item) => (
              <View key={`${item.product_id}-${item.product_name}`} style={styles.breakdownRow}>
                <View style={styles.breakdownLabelGroup}>
                  {item.image_url ? (
                    <Image contentFit="cover" source={{ uri: item.image_url }} style={styles.breakdownImage} />
                  ) : (
                    <View style={styles.breakdownImageFallback}>
                      <PackageOpen color={theme.colors.primary} size={17} strokeWidth={1.9} />
                    </View>
                  )}
                  <View style={styles.breakdownItemCopy}>
                    <Text numberOfLines={1} style={styles.breakdownLabel}>{item.product_name}</Text>
                    <Text style={styles.breakdownMeta}>{item.material_type} · {item.quantity} used</Text>
                  </View>
                </View>
                <Text style={styles.breakdownValue}>{formatPhp(Math.round(item.subtotal * 100))}</Text>
              </View>
            ))}
            {selectedAddOnTotal > 0 ? (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Add-ons</Text>
                <Text style={styles.breakdownValue}>{formatPhp(selectedAddOnTotal)}</Text>
              </View>
            ) : null}
            <View style={styles.breakdownTotalRow}>
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
      <Text style={styles.resultFinePrint}>Generated image is stored with the arrangement and used for cart and checkout display.</Text>
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

function normalizeText(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

function productSearchBlob(product: CustomizationProduct) {
  const attrs = product.attrs
    ? Object.values(product.attrs).filter((value) => value !== null && value !== undefined).join(' ')
    : '';
  const extended = product as CustomizationProduct & {
    description?: string | null;
    product_group?: string | null;
    product_type?: string | null;
  };

  return normalizeText(`${product.name} ${product.category} ${extended.description ?? ''} ${extended.product_type ?? ''} ${extended.product_group ?? ''} ${attrs}`);
}

function isSelectableProduct(product: CustomizationProduct) {
  return product.is_available !== false && product.stock_status !== 'out_of_stock' && (product.stock ?? 0) > 0;
}

function productCategory(product: CustomizationProduct) {
  return normalizeText(product.category);
}

function productType(product: CustomizationProduct) {
  return normalizeText(product.product_type);
}

function isExactCategory(product: CustomizationProduct, categories: string[]) {
  const category = productCategory(product);
  return categories.includes(category);
}

function isMixAndMatchProduct(product: CustomizationProduct) {
  if (!isSelectableProduct(product)) return false;
  const category = productCategory(product);
  const blob = productSearchBlob(product);

  if (category === 'box') return false;
  if (['filler', 'wrapping', 'vase', 'ribbon', 'flower', 'flowers'].includes(category)) return true;

  if (product.is_visible === true) return false;
  return !/\b(bouquet|arrangement|flower box arrangement|vase arrangement|catalog|storefront)\b/.test(blob);
}

function isFillerProduct(product: CustomizationProduct) {
  const type = productType(product);
  const blob = productSearchBlob(product);
  if (blob.includes('pot filler')) return false;
  return isExactCategory(product, ['filler']) || type.includes('filler') || blob.includes('greenery') || blob.includes('gypsophila') || blob.includes("baby's breath") || blob.includes('statice');
}

function isFlowerProduct(product: CustomizationProduct) {
  const category = productCategory(product);
  const type = productType(product);
  const blob = productSearchBlob(product);
  if (isFillerProduct(product) || /\b(wrapper|wrapping|wrap|vase|box|ribbon|accessory)\b/.test(blob)) return false;
  return category.includes('flower') || type.includes('flower') || /\b(rose|roses|tulip|tulips|carnation|carnations|lily|lilies|orchid|orchids|sunflower|sunflowers|peony|peonies)\b/.test(blob);
}

function isWrapperProduct(product: CustomizationProduct) {
  const category = productCategory(product);
  const type = productType(product);
  const blob = productSearchBlob(product);
  if (blob.includes('ribbon') || category.includes('accessory') || type.includes('accessory') || category.includes('vase') || type.includes('vase') || category.includes('box') || type.includes('box')) return false;
  return isExactCategory(product, ['wrapping']) || ((category.includes('wrapper') || type.includes('wrapping') || type.includes('wrapper') || blob.includes('wrapper') || blob.includes('wrapping') || blob.includes('wrap')) && !blob.includes('ribbon'));
}

function isVaseProduct(product: CustomizationProduct) {
  const type = productType(product);
  return isExactCategory(product, ['vase']) || type.includes('vase') || productSearchBlob(product).includes('vase');
}

function isBoxProduct(product: CustomizationProduct) {
  return isSelectableProduct(product) && productCategory(product) === 'box';
}

function isAccessoryProduct(product: CustomizationProduct) {
  const category = productCategory(product);
  const type = productType(product);
  const blob = productSearchBlob(product);
  return category.includes('ribbon') || type.includes('ribbon') || blob.includes('ribbon');
}

function filterProductsForSearch(products: CustomizationProduct[], query: string) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return products;

  return products.filter((product) => productSearchBlob(product).includes(normalizedQuery));
}

function buildPrompt({
  accessory,
  arrangement,
  container,
  fillers,
  flowers,
}: {
  accessory?: CustomizationProduct;
  arrangement: ArrangementOption;
  container: CustomizationProduct;
  fillers: CustomizationProduct[];
  flowers: { product: CustomizationProduct; quantity: number }[];
}) {
  const flowerText = flowers.map(({ product, quantity }) => `${quantity} ${product.attrs?.color || ''} ${product.name}`.trim()).join(', ');
  const fillerText = fillers.length ? `with optional fillers: ${fillers.map((item) => item.name).join(', ')}` : 'with no filler required';
  const containerText =
    arrangement.id === 'bouquet'
      ? `wrapped with ${container.name}`
      : arrangement.id === 'vase'
        ? `arranged in ${container.name} vase`
        : `arranged in ${container.name} flower box`;
  const accessoryText = accessory ? `finished with ${accessory.name}` : 'with no ribbon or accessory';

  return `A custom Mix and Match ${arrangement.label}: ${flowerText}, ${fillerText}, ${containerText}, ${accessoryText}. Ultra-realistic florist product photo, clean studio lighting, elegant composition, natural textures, front-facing arrangement, no top-down view.`;
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
    borderRadius: 22,
    borderWidth: 1,
    gap: 20,
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
    minHeight: 74,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepLine: {
    backgroundColor: '#E5E7EB',
    height: 2,
    left: '-50%',
    position: 'absolute',
    top: 15,
    width: '100%',
  },
  stepLineActive: {
    backgroundColor: theme.colors.primary,
  },
  stepCircle: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: theme.radius.pill,
    height: 30,
    justifyContent: 'center',
    marginBottom: 8,
    width: 30,
    zIndex: 1,
  },
  stepCircleActive: {
    backgroundColor: '#EAF5EC',
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  stepCircleDone: {
    backgroundColor: theme.colors.primary,
  },
  stepCircleText: {
    color: '#6B7280',
    fontFamily: Fonts.sansBold,
    fontSize: 12,
  },
  stepCircleTextActive: {
    color: theme.colors.primary,
  },
  stepLabel: {
    color: '#8B958D',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: theme.colors.primary,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: 14,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  errorText: {
    color: '#B91C1C',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  selectionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: softOutline,
    borderRadius: 22,
    borderWidth: 1,
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  selectionHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  stepBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontFamily: Fonts.sansBold,
    fontSize: 12,
  },
  selectionCopy: {
    flex: 1,
  },
  selectionTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 17,
  },
  selectionSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  loadingPanel: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 34,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
  },
  arrangementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  arrangementCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    width: '47%',
  },
  arrangementCardSelected: {
    backgroundColor: '#F4FBF5',
    borderColor: theme.colors.primary,
  },
  arrangementImageWrap: {
    alignItems: 'center',
    backgroundColor: '#F8FAF8',
    borderRadius: 12,
    height: 132,
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  arrangementImage: {
    height: '100%',
    width: '100%',
  },
  arrangementCheck: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    top: 10,
    width: 24,
  },
  arrangementTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    textAlign: 'center',
  },
  arrangementTitleSelected: {
    color: theme.colors.primary,
  },
  arrangementDescription: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  arrangementHelper: {
    color: '#9CA3AF',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    marginTop: 3,
    textAlign: 'center',
  },
  selectionSummary: {
    backgroundColor: '#EEF7EF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%',
  },
  selectionSummaryText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
  },
  productSectionHeader: {
    gap: 3,
    marginTop: 2,
  },
  productSectionTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
  },
  productSectionSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 17,
  },
  flowerSummaryEmpty: {
    backgroundColor: '#F8FAF8',
    borderRadius: 12,
    padding: 12,
  },
  flowerSummary: {
    backgroundColor: '#F8FAF8',
    borderRadius: 12,
    gap: 10,
    padding: 12,
  },
  flowerSummaryText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
  },
  flowerSummaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  flowerSummaryName: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
  },
  quickQuantity: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE7DE',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
  },
  quickQuantityButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 34,
  },
  quickQuantityText: {
    color: '#24482E',
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    minWidth: 18,
    textAlign: 'center',
  },
  inlineSearch: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  inlineSearchInput: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearSearchButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    width: '47%',
  },
  productCardSelected: {
    backgroundColor: '#F4FBF5',
    borderColor: theme.colors.primary,
  },
  productCardDisabled: {
    opacity: 0.45,
  },
  productImageWrap: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    height: 118,
    marginBottom: 9,
    overflow: 'hidden',
  },
  productImage: {
    height: '100%',
    width: '100%',
  },
  productCheck: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 8,
    minWidth: 24,
    paddingHorizontal: 6,
  },
  productCheckText: {
    color: '#FFFFFF',
    fontFamily: Fonts.sansBold,
    fontSize: 11,
  },
  productName: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    lineHeight: 17,
    minHeight: 34,
  },
  productPrice: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    marginTop: 5,
  },
  stockBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDF7ED',
    borderRadius: theme.radius.pill,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stockBadgeLow: {
    backgroundColor: '#FEF3C7',
  },
  stockBadgeOut: {
    backgroundColor: '#F3F4F6',
  },
  stockText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 10,
  },
  stockTextLow: {
    color: '#B45309',
  },
  stockTextOut: {
    color: '#6B7280',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    paddingVertical: 20,
    textAlign: 'center',
  },
  emptyContainerState: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 26,
  },
  emptyContainerText: {
    color: '#8B95A1',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  floatingStepFooter: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopColor: '#EEF0EE',
    borderTopWidth: 1,
    bottom: 0,
    boxShadow: '0 -12px 28px rgba(31, 42, 36, 0.08)',
    left: 0,
    paddingTop: 12,
    position: 'absolute',
    right: 0,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 10,
  },
  returnButton: {
    alignItems: 'center',
    borderColor: '#DDE2DD',
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    width: 112,
  },
  returnButtonText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  continueButtonDisabled: {
    opacity: 0.55,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.sansExtraBold,
    fontSize: 14,
  },
  continueButtonTextDisabled: {
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScrim: {
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: '#D1D5DB',
    borderRadius: theme.radius.pill,
    height: 4,
    width: 42,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 18,
  },
  sheetClose: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  sheetProductRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  sheetImage: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    height: 92,
    width: 92,
  },
  sheetProductCopy: {
    flex: 1,
    justifyContent: 'center',
  },
  sheetProductName: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 16,
    lineHeight: 21,
  },
  sheetProductMeta: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    marginTop: 4,
  },
  sheetLimitBox: {
    backgroundColor: '#F8FAF8',
    borderRadius: 12,
    gap: 3,
    padding: 12,
  },
  sheetLimitText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
  },
  sheetQuantityRow: {
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: '#DCE7DE',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
  },
  sheetQuantityButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 56,
  },
  sheetQuantityText: {
    color: '#24482E',
    fontFamily: Fonts.sansExtraBold,
    fontSize: 20,
    minWidth: 40,
    textAlign: 'center',
  },
  sheetSaveButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    minHeight: 50,
    justifyContent: 'center',
  },
  sheetSaveText: {
    color: '#FFFFFF',
    fontFamily: Fonts.sansExtraBold,
    fontSize: 14,
  },
  reviewPanel: {
    gap: theme.spacing.md,
  },
  reviewImageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  reviewImageItem: {
    width: '30.5%',
  },
  reviewImage: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    height: 78,
    width: '100%',
  },
  reviewImageLabel: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 5,
  },
  reviewSection: {
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  reviewSectionTitle: {
    backgroundColor: '#F9FAFB',
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reviewRow: {
    alignItems: 'center',
    borderTopColor: '#EEF0EE',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  reviewLabelGroup: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  reviewLabel: {
    color: '#64748B',
    flexShrink: 1,
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
  qtyPill: {
    backgroundColor: '#F3F4F6',
    borderRadius: theme.radius.pill,
    color: '#8B95A1',
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  reviewValue: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
  },
  reviewMuted: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    padding: 12,
  },
  estimatedTotal: {
    alignItems: 'center',
    backgroundColor: '#F3FAF3',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  estimatedTotalLabel: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
  },
  estimatedTotalValue: {
    color: '#047857',
    fontFamily: Fonts.sansExtraBold,
    fontSize: 16,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderColor: softOutline,
    borderRadius: 22,
    borderWidth: 1,
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  resultHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  resultHeaderIcon: {
    alignItems: 'center',
    backgroundColor: '#FAF0FF',
    borderRadius: theme.radius.pill,
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
    fontSize: 21,
  },
  resultSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
  resultIconButton: {
    alignItems: 'center',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  resultBody: {
    gap: theme.spacing.lg,
  },
  resultImageFrame: {
    borderRadius: 18,
    height: 310,
    overflow: 'hidden',
    position: 'relative',
  },
  resultImage: {
    height: '100%',
    width: '100%',
  },
  resultImageBadge: {
    backgroundColor: 'rgba(12, 87, 62, 0.9)',
    borderRadius: theme.radius.pill,
    left: 12,
    paddingHorizontal: 11,
    paddingVertical: 6,
    position: 'absolute',
    top: 12,
    zIndex: 1,
  },
  resultImageBadgeText: {
    color: '#FFFFFF',
    fontFamily: Fonts.sansBold,
    fontSize: 11,
  },
  conceptNote: {
    alignItems: 'flex-start',
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  conceptNoteText: {
    color: '#6D4D7A',
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 17,
  },
  pollinationsCredit: {
    alignSelf: 'flex-start',
    height: 22,
    width: 150,
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
    borderColor: '#DDE2DD',
    borderRadius: 12,
    borderWidth: 1,
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  resultDescription: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  selectedItemsPanel: {
    borderColor: '#DDE2DD',
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  breakdownCard: {
    borderColor: '#DDE2DD',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  breakdownTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 14,
    padding: 12,
  },
  breakdownRow: {
    alignItems: 'center',
    borderTopColor: '#EEF0EE',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  breakdownLabelGroup: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  breakdownImage: { backgroundColor: '#F3F5F3', borderRadius: 9, height: 44, width: 44 },
  breakdownImageFallback: { alignItems: 'center', backgroundColor: theme.colors.greenSoft, borderRadius: 9, height: 44, justifyContent: 'center', width: 44 },
  breakdownItemCopy: { flex: 1, gap: 3 },
  breakdownMeta: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 10, textTransform: 'capitalize' },
  breakdownLabel: {
    color: '#64748B',
    flexShrink: 1,
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
  breakdownQty: {
    backgroundColor: '#F3F4F6',
    borderRadius: theme.radius.pill,
    color: '#8B95A1',
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  breakdownValue: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
  },
  breakdownTotalRow: {
    alignItems: 'center',
    backgroundColor: '#F3FAF3',
    borderTopColor: '#DDEBDD',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  breakdownTotalLabel: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
  },
  breakdownTotalValue: {
    color: '#047857',
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 52,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.sansExtraBold,
    fontSize: 14,
  },
  resultFinePrint: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(12, 17, 24, 0.42)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    padding: 26,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  overlayCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    gap: theme.spacing.md,
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
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  progressTrack: {
    backgroundColor: '#E5E7EB',
    borderRadius: theme.radius.pill,
    height: 8,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: '100%',
  },
  pressed: {
    opacity: 0.72,
  },
});
