import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, Flower2, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AiPreviewDisclaimer } from '@/components/ai-preview-disclaimer';
import { AppPageHeader } from '@/components/app-page-header';
import { RecipeGallery } from '@/components/recipe-gallery';
import { ResultDisclosure } from '@/components/result-disclosure';
import { formatPhp, type CartArrangementRecipeItem, type CartItem } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { getCartItems } from '@/services/cart-storage';
import { getCustomizationProducts, type CustomizationProduct } from '@/services/customization-api';

export default function ArrangementDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { cartItemId } = useLocalSearchParams<{ cartItemId?: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [cartItem, setCartItem] = useState<CartItem | null>(null);
  const [legacyRecipeItems, setLegacyRecipeItems] = useState<CartArrangementRecipeItem[]>([]);

  useEffect(() => {
    if (!cartItemId) {
      setIsLoading(false);
      return;
    }

    let active = true;
    getCartItems({ forceRefresh: true })
      .then(async (items) => {
        if (active) {
          const found = items.find((item) => item.id === cartItemId) ?? null;
          setCartItem(found);
          if (found && !found.arrangementDetails?.recipeItems.length) {
            const products = await getCustomizationProducts().catch(() => []);
            if (active) setLegacyRecipeItems(buildLegacyRecipeItems(found.product.description, products));
          }
        }
      })
      .catch(() => {
        if (active) setCartItem(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cartItemId]);

  return (
    <View style={styles.screen}>
      <AppPageHeader title="Arrangement Details" />
      {isLoading ? <LoadingState /> : cartItem ? (
        <ArrangementContent cartItem={cartItem} bottomInset={insets.bottom} legacyRecipeItems={legacyRecipeItems} />
      ) : (
        <NotFoundState />
      )}
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.centeredState}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
      <Text style={styles.stateBody}>Loading your arrangement…</Text>
    </View>
  );
}

function NotFoundState() {
  return (
    <View style={styles.centeredState}>
      <View style={styles.stateIcon}>
        <Flower2 color={theme.colors.primary} size={27} strokeWidth={1.9} />
      </View>
      <Text style={styles.stateTitle}>Arrangement not found</Text>
      <Text style={styles.stateBody}>It may have been removed from your cart or is still syncing.</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.replace('/(tabs)/cart')}
        style={({ pressed }) => [styles.returnButton, pressed && styles.pressed]}>
        <Text style={styles.returnButtonText}>Return to cart</Text>
      </Pressable>
    </View>
  );
}

function ArrangementContent({
  bottomInset,
  cartItem,
  legacyRecipeItems,
}: {
  bottomInset: number;
  cartItem: CartItem;
  legacyRecipeItems: CartArrangementRecipeItem[];
}) {
  const { product } = cartItem;
  const details = cartItem.arrangementDetails;
  const sourceLabel = details?.source === 'mix-and-match' ? 'Mix and Match' : 'Describe Your Arrangement';
  const addOnTotal = cartItem.addOns?.reduce((total, addOn) => total + addOn.priceCents, 0) ?? 0;
  const recipeTotal = details?.basePriceCents ?? Math.max(0, product.priceCents - addOnTotal);
  const recipeItems = details?.recipeItems.length ? details.recipeItems : legacyRecipeItems;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(bottomInset, 20) + 28 }]}
      showsVerticalScrollIndicator={false}>
      {details?.prompt ? (
        <View style={styles.promptRecap}>
          <Sparkles color={theme.colors.primary} size={15} strokeWidth={2.3} />
          <Text numberOfLines={3} style={styles.promptText}>{details.prompt}</Text>
        </View>
      ) : null}

      <View style={styles.previewCard}>
        {product.imageUrl ? (
          <Image
            accessibilityLabel={`AI concept preview for ${product.name}`}
            contentFit="cover"
            source={{ uri: product.imageUrl }}
            style={styles.previewImage}
            transition={180}
          />
        ) : (
          <View style={styles.previewPlaceholder}>
            <Sparkles color="#AAB3AC" size={34} strokeWidth={1.7} />
            <Text style={styles.placeholderText}>Preview unavailable</Text>
          </View>
        )}
        <View style={styles.aiBadge}>
          <Sparkles color={theme.colors.white} size={11} strokeWidth={2.4} />
          <Text style={styles.aiBadgeText}>AI Concept</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.sourceLabel}>{sourceLabel}</Text>
        <Text style={styles.arrangementName}>{product.name}</Text>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>Confirmed total</Text>
            <Text style={styles.totalPrice}>{formatPhp(product.priceCents)}</Text>
          </View>
          <View style={styles.availabilityPill}>
            <Check color={theme.colors.primary} size={14} strokeWidth={2.5} />
            <Text style={styles.availabilityText}>In your cart</Text>
          </View>
        </View>
        <AiPreviewDisclaimer />
      </View>

      <View style={styles.disclosures}>
        <ResultDisclosure
          defaultOpen
          description={recipeItems.length ? `${recipeItems.length} confirmed materials` : 'Confirmed arrangement materials'}
          title="Recipe & price">
          <View style={styles.recipeList}>
            <RecipeGallery items={recipeItems.map((item, index) => ({
              id: item.productId || `${item.productName}-${index}`,
              imageUrl: item.imageUrl,
              label: item.productName,
              quantity: item.quantity,
            }))} />
            {recipeItems.length ? recipeItems.map((item, index) => (
              <View key={`${item.productId || item.productName}-${index}`} style={styles.recipeRow}>
                {item.imageUrl ? (
                  <Image
                    accessibilityLabel={item.productName}
                    contentFit="cover"
                    source={{ uri: item.imageUrl }}
                    style={styles.recipeImage}
                  />
                ) : (
                  <View style={styles.recipeImageFallback}>
                    <Flower2 color={theme.colors.primary} size={18} strokeWidth={1.9} />
                  </View>
                )}
                <View style={styles.recipeCopy}>
                  <Text style={styles.recipeName}>{item.productName}</Text>
                  <Text style={styles.recipeMeta}>
                    {item.materialType} · {item.quantity} × {item.unitPriceCents > 0 ? formatPhp(item.unitPriceCents) : 'Price included'}
                  </Text>
                </View>
                <Text style={styles.recipePrice}>{item.subtotalCents > 0 ? formatPhp(item.subtotalCents) : `${item.quantity} used`}</Text>
              </View>
            )) : (
              <Text style={styles.descriptionText}>{product.description || 'The confirmed florist recipe is attached to this arrangement.'}</Text>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Recipe total</Text>
              <Text style={styles.totalValue}>{formatPhp(recipeTotal)}</Text>
            </View>
          </View>
        </ResultDisclosure>

        {cartItem.addOns?.length || cartItem.cardMessage ? (
          <ResultDisclosure description="Add-ons and greeting card" title="Personalize">
            <View style={styles.personalizeList}>
              {cartItem.addOns?.map((addOn) => (
                <View key={addOn.id} style={styles.personalizeRow}>
                  <Text style={styles.personalizeName}>{addOn.name}</Text>
                  <Text style={styles.personalizePrice}>{formatPhp(addOn.priceCents)}</Text>
                </View>
              ))}
              {cartItem.cardMessage ? (
                <View style={styles.cardMessage}>
                  <Text style={styles.cardLabel}>Greeting card</Text>
                  <Text style={styles.cardText}>{cartItem.cardMessage}</Text>
                </View>
              ) : null}
            </View>
          </ResultDisclosure>
        ) : null}
      </View>
    </ScrollView>
  );
}

function buildLegacyRecipeItems(
  description: string | undefined,
  products: CustomizationProduct[],
): CartArrangementRecipeItem[] {
  const recipeText = description?.match(/contains:\s*(.+?)(?:\.\s*$|$)/i)?.[1];
  if (!recipeText) return [];

  const productsByName = new Map(products.map((product) => [product.name.trim().toLowerCase(), product]));
  return recipeText.split(',').flatMap((entry) => {
    const match = entry.trim().match(/^(\d+)x\s+(.+)$/i);
    if (!match) return [];

    const quantity = Number(match[1]);
    const productName = match[2].trim();
    const product = productsByName.get(productName.toLowerCase());
    const unitPriceCents = Math.round(Number(product?.price || 0) * 100);
    return [{
      imageUrl: product?.image_url ?? undefined,
      materialType: product?.product_type || product?.category || 'Material',
      productId: product?.id,
      productName,
      quantity,
      subtotalCents: unitPriceCents * quantity,
      unitPriceCents,
    }];
  });
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F7F8F7', flex: 1 },
  content: { gap: 14, paddingHorizontal: 16, paddingTop: 14 },
  centeredState: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center', paddingHorizontal: 34 },
  stateIcon: { alignItems: 'center', backgroundColor: theme.colors.greenSoft, borderRadius: 999, height: 58, justifyContent: 'center', width: 58 },
  stateTitle: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 20, textAlign: 'center' },
  stateBody: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  returnButton: { alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: 12, justifyContent: 'center', marginTop: 4, minHeight: 46, paddingHorizontal: 22 },
  returnButtonText: { color: theme.colors.white, fontFamily: Fonts.sansBold, fontSize: 14 },
  promptRecap: { alignItems: 'flex-start', backgroundColor: theme.colors.white, borderColor: theme.colors.subtleBorder, borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 9, padding: 12 },
  promptText: { color: theme.colors.text, flex: 1, fontFamily: Fonts.sansMedium, fontSize: 12, lineHeight: 18 },
  previewCard: { backgroundColor: '#EEF1EE', borderRadius: 20, overflow: 'hidden', position: 'relative' },
  previewImage: { aspectRatio: 0.94, width: '100%' },
  previewPlaceholder: { alignItems: 'center', aspectRatio: 0.94, gap: 10, justifyContent: 'center', width: '100%' },
  placeholderText: { color: theme.colors.textMuted, fontFamily: Fonts.sansMedium, fontSize: 13 },
  aiBadge: { alignItems: 'center', backgroundColor: 'rgba(34, 44, 37, 0.76)', borderRadius: 999, flexDirection: 'row', gap: 5, left: 12, paddingHorizontal: 10, paddingVertical: 6, position: 'absolute', top: 12 },
  aiBadgeText: { color: theme.colors.white, fontFamily: Fonts.sansBold, fontSize: 10 },
  summaryCard: { backgroundColor: theme.colors.white, borderColor: theme.colors.subtleBorder, borderRadius: 18, borderWidth: 1, gap: 10, padding: 16 },
  sourceLabel: { color: theme.colors.primary, fontFamily: Fonts.sansBold, fontSize: 10, letterSpacing: 0.7, textTransform: 'uppercase' },
  arrangementName: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 22, lineHeight: 28 },
  priceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { color: theme.colors.textMuted, fontFamily: Fonts.sansMedium, fontSize: 11 },
  totalPrice: { color: theme.colors.primaryDark, fontFamily: Fonts.sansBold, fontSize: 23, marginTop: 2 },
  availabilityPill: { alignItems: 'center', backgroundColor: theme.colors.greenSoft, borderRadius: 999, flexDirection: 'row', gap: 5, paddingHorizontal: 10, paddingVertical: 7 },
  availabilityText: { color: theme.colors.primaryDark, fontFamily: Fonts.sansBold, fontSize: 11 },
  disclosures: { gap: 10 },
  recipeList: { gap: 0 },
  recipeRow: { alignItems: 'center', borderBottomColor: theme.colors.subtleBorder, borderBottomWidth: 1, flexDirection: 'row', gap: 12, paddingVertical: 11 },
  recipeImage: { backgroundColor: theme.colors.surfaceAlt, borderRadius: 10, height: 48, width: 48 },
  recipeImageFallback: { alignItems: 'center', backgroundColor: theme.colors.greenSoft, borderRadius: 10, height: 48, justifyContent: 'center', width: 48 },
  recipeCopy: { flex: 1, gap: 3 },
  recipeName: { color: theme.colors.text, fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  recipeMeta: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 11, textTransform: 'capitalize' },
  recipePrice: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 12 },
  descriptionText: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20, paddingVertical: 8 },
  totalRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 13 },
  totalLabel: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 13 },
  totalValue: { color: theme.colors.primaryDark, fontFamily: Fonts.sansBold, fontSize: 14 },
  personalizeList: { gap: 10 },
  personalizeRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  personalizeName: { color: theme.colors.text, flex: 1, fontFamily: Fonts.sansMedium, fontSize: 13 },
  personalizePrice: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 12 },
  cardMessage: { backgroundColor: theme.colors.surfaceAlt, borderRadius: 12, gap: 5, marginTop: 2, padding: 12 },
  cardLabel: { color: theme.colors.primary, fontFamily: Fonts.sansBold, fontSize: 10, textTransform: 'uppercase' },
  cardText: { color: theme.colors.text, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20 },
  pressed: { opacity: 0.72 },
});
