import { Image } from 'expo-image';
import { Check, Flower2, Pencil, ShoppingCart, Sparkles } from 'lucide-react-native';
import { memo, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AI_EASE_OUT, AI_MOTION, MotionPressable } from '@/components/ai-arrangement-motion';
import { AiPreviewDisclaimer } from '@/components/ai-preview-disclaimer';
import { GreetingCardComposer } from '@/components/greeting-card-composer';
import { ProductAddOnSelector } from '@/components/product-add-on-selector';
import { RecipeGallery } from '@/components/recipe-gallery';
import { ResultDisclosure } from '@/components/result-disclosure';
import { formatPhp, type Product } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import type { GenerationResult } from '@/services/customization-api';

type AiArrangementResultProps = {
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
  onToggleAddOn: (addOnId: string) => void;
  prompt: string;
  result: GenerationResult;
  selectedAddOnIds: ReadonlySet<string>;
};

export const AiArrangementResult = memo(function AiArrangementResult({
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
  onToggleAddOn,
  prompt,
  result,
  selectedAddOnIds,
}: AiArrangementResultProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [isEditingName, setIsEditingName] = useState(false);
  const imageProgress = useSharedValue(reduceMotion ? 1 : 0);
  const contentProgress = useSharedValue(reduceMotion ? 1 : 0);
  const actionProgress = useSharedValue(reduceMotion ? 1 : 0);

  const selectedAddOns = useMemo(
    () => addOns.filter((item) => selectedAddOnIds.has(item.id)),
    [addOns, selectedAddOnIds],
  );
  const basePrice = result.price_breakdown?.total_price ?? 0;
  const addOnPrice = selectedAddOns.reduce((total, item) => total + item.priceCents / 100, 0);
  const displayTotal = basePrice + addOnPrice;
  const materialCount = result.price_breakdown?.items?.reduce((total, item) => total + item.quantity, 0) ?? 0;

  useEffect(() => {
    const entranceDuration = reduceMotion ? 100 : AI_MOTION.contentEntrance;
    imageProgress.value = withTiming(1, { duration: reduceMotion ? 100 : 180, easing: AI_EASE_OUT });
    contentProgress.value = withDelay(
      reduceMotion ? 0 : 70,
      withTiming(1, { duration: entranceDuration, easing: AI_EASE_OUT }),
    );
    actionProgress.value = withTiming(1, { duration: reduceMotion ? 100 : AI_MOTION.statusEntrance, easing: AI_EASE_OUT });
  }, [actionProgress, contentProgress, imageProgress, reduceMotion]);

  const imageStyle = useAnimatedStyle(() => ({ opacity: imageProgress.value }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentProgress.value,
    transform: [{ translateY: reduceMotion ? 0 : interpolate(contentProgress.value, [0, 1], [8, 0]) }],
  }));
  const actionStyle = useAnimatedStyle(() => ({
    opacity: actionProgress.value,
    transform: [{ translateY: reduceMotion ? 0 : interpolate(actionProgress.value, [0, 1], [12, 0]) }],
  }));

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 112 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.promptRecap}>
          <Sparkles color={theme.colors.primary} size={15} strokeWidth={2.3} />
          <Text numberOfLines={2} style={styles.promptText}>{prompt}</Text>
        </View>

        <Animated.View style={[styles.previewCard, imageStyle]}>
          {result.generated_image_url ? (
            <Image
              accessibilityLabel={`AI concept preview for ${arrangementName}`}
              contentFit="cover"
              source={{ uri: result.generated_image_url }}
              style={styles.generatedImage}
              transition={reduceMotion ? 0 : 180}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Sparkles color="#AAB3AC" size={32} strokeWidth={1.7} />
              <Text style={styles.placeholderText}>Preview unavailable</Text>
            </View>
          )}
          <View style={styles.aiBadge}>
            <Sparkles color={theme.colors.white} size={11} strokeWidth={2.4} />
            <Text style={styles.aiBadgeText}>AI Concept</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.resultContent, contentStyle]}>
          <View style={styles.summaryCard}>
            <View style={styles.nameRow}>
              {isEditingName ? (
                <TextInput
                  accessibilityLabel="Arrangement name"
                  autoFocus
                  maxLength={80}
                  onChangeText={onChangeArrangementName}
                  onSubmitEditing={() => setIsEditingName(false)}
                  placeholder="Arrangement name"
                  placeholderTextColor={theme.colors.textMuted}
                  returnKeyType="done"
                  selectTextOnFocus
                  style={styles.nameInput}
                  value={arrangementName}
                />
              ) : (
                <Text numberOfLines={2} style={styles.arrangementName}>
                  {arrangementName.trim() || 'AI Arrangement'}
                </Text>
              )}
              <MotionPressable
                accessibilityLabel={isEditingName ? 'Finish editing arrangement name' : 'Edit arrangement name'}
                accessibilityRole="button"
                onPress={() => setIsEditingName((current) => !current)}
                style={styles.editButton}>
                {isEditingName ? (
                  <Text style={styles.doneText}>Done</Text>
                ) : (
                  <Pencil color={theme.colors.textMuted} size={17} strokeWidth={2.2} />
                )}
              </MotionPressable>
            </View>

            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>{addOnPrice > 0 ? 'Total with add-ons' : 'Arrangement total'}</Text>
                <Text style={styles.totalPrice}>{formatPhp(Math.round(displayTotal * 100))}</Text>
              </View>
              <View style={styles.availabilityPill}>
                <Check color={theme.colors.primary} size={14} strokeWidth={2.5} />
                <Text style={styles.availabilityPillText}>Available</Text>
              </View>
            </View>

            <AiPreviewDisclaimer />
          </View>

          <View style={styles.disclosures}>
            <ResultDisclosure
              defaultOpen
              description={`${materialCount} stem${materialCount === 1 ? '' : 's'} and materials`}
              title="Recipe & price">
              <View style={styles.recipeList}>
                <RecipeGallery items={(result.price_breakdown?.items ?? []).map((item) => ({
                  id: item.product_id,
                  imageUrl: item.image_url,
                  label: item.product_name,
                  quantity: item.quantity,
                }))} />
                {result.price_breakdown?.items?.map((item, index) => (
                  <View key={`${item.product_id}-${index}`} style={styles.recipeRow}>
                    {item.image_url ? (
                      <Image
                        accessibilityLabel={item.product_name}
                        contentFit="cover"
                        source={{ uri: item.image_url }}
                        style={styles.recipeImage}
                      />
                    ) : (
                      <View style={styles.recipeImageFallback}>
                        <Flower2 color={theme.colors.primary} size={18} strokeWidth={1.9} />
                      </View>
                    )}
                    <View style={styles.recipeCopy}>
                      <Text style={styles.recipeName}>{item.product_name}</Text>
                      <Text style={styles.recipeMeta}>{item.material_type} · {item.quantity} × {formatPhp(Math.round(item.unit_price * 100))}</Text>
                    </View>
                    <Text style={styles.recipePrice}>{formatPhp(Math.round(item.subtotal * 100))}</Text>
                  </View>
                ))}
                <View style={styles.recipeTotalRow}>
                  <Text style={styles.recipeTotalLabel}>Recipe total</Text>
                  <Text style={styles.recipeTotalPrice}>{formatPhp(Math.round(basePrice * 100))}</Text>
                </View>
                <View style={styles.inventoryNote}>
                  <Check color={theme.colors.primary} size={17} strokeWidth={2.4} />
                  <Text style={styles.inventoryText}>Validated against currently safe inventory.</Text>
                </View>
              </View>
            </ResultDisclosure>

            <ResultDisclosure description="Add a gift or personal message" title="Personalize">
              <View style={styles.personalizeContent}>
                <ProductAddOnSelector
                  addOns={addOns}
                  isLoading={isLoadingAddOns}
                  onToggle={onToggleAddOn}
                  selectedIds={selectedAddOnIds}
                />
                <GreetingCardComposer message={cardMessage} onChangeMessage={onChangeCardMessage} />
              </View>
            </ResultDisclosure>

            <ResultDisclosure description="Inventory and AI preview information" title="About this preview">
              <View style={styles.aboutContent}>
                {result.remaining_generations !== undefined ? (
                  <View style={styles.aboutRow}>
                    <Sparkles color={theme.colors.primary} size={17} strokeWidth={2.2} />
                    <Text style={styles.aboutText}>
                      {result.remaining_generations} AI creation{result.remaining_generations === 1 ? '' : 's'} remaining today.
                    </Text>
                  </View>
                ) : null}
              </View>
            </ResultDisclosure>
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 12) }, actionStyle]}>
        <MotionPressable
          accessibilityLabel={addedToCart ? 'Added to cart' : 'Add to cart'}
          accessibilityRole="button"
          accessibilityState={{ disabled: addingToCart }}
          disabled={addingToCart}
          onPress={onAddToCart}
          style={[styles.cartButton, addedToCart && styles.cartButtonAdded]}>
          {addingToCart ? (
            <ActivityIndicator color={theme.colors.primary} size="small" />
          ) : addedToCart ? (
            <>
              <Check color={theme.colors.primary} size={18} strokeWidth={2.5} />
              <Text style={styles.cartButtonText}>Added</Text>
            </>
          ) : (
            <>
              <ShoppingCart color={theme.colors.primary} size={18} strokeWidth={2.3} />
              <Text style={styles.cartButtonText}>Add to cart</Text>
            </>
          )}
        </MotionPressable>
        <MotionPressable
          accessibilityLabel="Buy now"
          accessibilityRole="button"
          accessibilityState={{ disabled: addingToCart }}
          disabled={addingToCart}
          onPress={onBuyNow}
          style={styles.buyButton}>
          <Text style={styles.buyButtonText}>Buy now</Text>
        </MotionPressable>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { backgroundColor: theme.colors.surfaceAlt, flex: 1 },
  scrollContent: { gap: 14, paddingHorizontal: 18, paddingTop: 16 },
  promptRecap: {
    alignItems: 'flex-start',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    gap: 9,
    padding: 12,
  },
  promptText: { color: '#465048', flex: 1, fontFamily: Fonts.sansMedium, fontSize: 12, lineHeight: 18 },
  previewCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    elevation: 2,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: theme.colors.text,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  generatedImage: { aspectRatio: 0.94, width: '100%' },
  imagePlaceholder: { alignItems: 'center', aspectRatio: 1.1, gap: 8, justifyContent: 'center', width: '100%' },
  placeholderText: { color: theme.colors.textMuted, fontFamily: Fonts.sansMedium, fontSize: 13 },
  aiBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(31, 42, 36, 0.78)',
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    gap: 5,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'absolute',
    top: 12,
  },
  aiBadgeText: { color: theme.colors.white, fontFamily: Fonts.sansBold, fontSize: 10, letterSpacing: 0.2 },
  resultContent: { gap: 14 },
  summaryCard: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 15,
    padding: theme.spacing.lg,
  },
  nameRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  arrangementName: { color: theme.colors.text, flex: 1, fontFamily: Fonts.sansBold, fontSize: 19, lineHeight: 25 },
  nameInput: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    minHeight: 44,
    paddingHorizontal: 10,
  },
  editButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
  doneText: { color: theme.colors.primary, fontFamily: Fonts.sansBold, fontSize: 13 },
  priceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { color: theme.colors.textMuted, fontFamily: Fonts.sansMedium, fontSize: 11, marginBottom: 2 },
  totalPrice: { color: theme.colors.primaryDark, fontFamily: Fonts.sansExtraBold, fontSize: 24, lineHeight: 30 },
  availabilityPill: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  availabilityPillText: { color: theme.colors.primaryDark, fontFamily: Fonts.sansBold, fontSize: 11 },
  disclosures: { gap: 10 },
  recipeList: { gap: 0 },
  recipeRow: {
    alignItems: 'center',
    borderBottomColor: theme.colors.subtleBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 58,
    paddingVertical: 9,
  },
  recipeImage: { backgroundColor: theme.colors.surfaceAlt, borderRadius: 10, height: 46, width: 46 },
  recipeImageFallback: { alignItems: 'center', backgroundColor: theme.colors.greenSoft, borderRadius: 10, height: 46, justifyContent: 'center', width: 46 },
  recipeCopy: { flex: 1, gap: 3 },
  recipeName: { color: theme.colors.text, fontFamily: Fonts.sansSemiBold, fontSize: 13, lineHeight: 18 },
  recipeMeta: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 10, lineHeight: 15, textTransform: 'capitalize' },
  recipePrice: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 13 },
  recipeTotalRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 },
  recipeTotalLabel: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 13 },
  recipeTotalPrice: { color: theme.colors.primaryDark, fontFamily: Fonts.sansBold, fontSize: 15 },
  inventoryNote: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    gap: 8,
    padding: 10,
  },
  inventoryText: { color: theme.colors.primaryDark, flex: 1, fontFamily: Fonts.sansMedium, fontSize: 11, lineHeight: 16 },
  personalizeContent: { gap: 18 },
  aboutContent: { gap: 13 },
  aboutRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 9 },
  aboutText: { color: theme.colors.textMuted, flex: 1, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  actionBar: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    position: 'absolute',
    right: 0,
  },
  cartButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.primary,
    borderRadius: 14,
    borderWidth: 1.2,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 12,
  },
  cartButtonAdded: { backgroundColor: theme.colors.greenSoft },
  cartButtonText: { color: theme.colors.primaryDark, fontFamily: Fonts.sansBold, fontSize: 13 },
  buyButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 14,
  },
  buyButtonText: { color: theme.colors.white, fontFamily: Fonts.sansBold, fontSize: 14 },
});
