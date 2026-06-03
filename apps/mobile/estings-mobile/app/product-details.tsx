import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, ChevronLeft, Flower2, Heart, ShoppingBag } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBrandHeader } from '@/components/app-brand-header';
import { EmptyState } from '@/components/bloom-ui';
import { formatPhp, type Product } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { addGuestCartItem } from '@/services/guest-cart';
import { shopApi } from '@/services/shop-api';

const outlineColor = 'rgba(31, 42, 36, 0.11)';

export default function ProductDetailsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const productId = typeof params.id === 'string' ? params.id : '';
  const [isAdded, setIsAdded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setProducts(await shopApi.getProducts());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Product details are unavailable.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const product = useMemo(
    () => products.find((item) => item.id === productId),
    [productId, products],
  );
  const isSoldOut = (product?.stock ?? 0) <= 0;

  const handleAddToCart = useCallback(async () => {
    if (!product || isSoldOut) {
      return;
    }

    await addGuestCartItem(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1300);
  }, [isSoldOut, product]);

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]}>
        <AppBrandHeader />

        <View style={styles.headerRow}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            onPress={() => router.back()}>
            <ChevronLeft size={24} color={theme.colors.primary} strokeWidth={2.4} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>PRODUCT DETAILS</Text>
            <Text style={styles.headerTitle}>Flower details</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading product details</Text>
          </View>
        ) : errorMessage ? (
          <EmptyState title="Product unavailable" description={errorMessage} />
        ) : product ? (
          <>
            <View style={styles.imageStage}>
              {product.imageUrl ? (
                <Image resizeMode="contain" source={{ uri: product.imageUrl }} style={styles.productImage} />
              ) : (
                <View style={styles.productImageFallback}>
                  <Flower2 size={54} color={theme.colors.primary} />
                </View>
              )}
              {isSoldOut ? (
                <View style={styles.soldOutBadge}>
                  <Text style={styles.soldOutText}>Sold out</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.detailsPanel}>
              <View style={styles.titleRow}>
                <View style={styles.titleCopy}>
                  <Text style={styles.category}>{product.categoryName ?? product.tag}</Text>
                  <Text style={styles.productName}>{product.name}</Text>
                </View>
                <Text style={styles.price}>{formatPhp(product.priceCents)}</Text>
              </View>

              {product.description ? (
                <Text style={styles.description}>{product.description}</Text>
              ) : (
                <Text style={styles.description}>Freshly prepared by Esting&apos;s for gifting, celebrations, and everyday moments.</Text>
              )}

              <View style={styles.metaGrid}>
                <InfoPill label="Type" value={product.productType || product.productGroup || 'Arrangement'} />
                <InfoPill label="Stock" value={isSoldOut ? 'Unavailable' : `${product.stock ?? 0} available`} />
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isFavorite }}
                style={({ pressed }) => [styles.favoriteButton, isFavorite && styles.favoriteButtonActive, pressed && styles.pressed]}
                onPress={() => setIsFavorite((current) => !current)}>
                <Heart
                  size={20}
                  color={isFavorite ? theme.colors.white : theme.colors.primary}
                  fill={isFavorite ? theme.colors.white : 'transparent'}
                  strokeWidth={2.3}
                />
                <Text style={[styles.favoriteButtonText, isFavorite && styles.favoriteButtonTextActive]}>
                  {isFavorite ? 'Saved' : 'Favorite'}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={isSoldOut}
                style={({ pressed }) => [styles.cartButton, isSoldOut && styles.cartButtonDisabled, pressed && !isSoldOut && styles.pressed]}
                onPress={handleAddToCart}>
                {isAdded ? (
                  <Check size={20} color={theme.colors.white} strokeWidth={2.8} />
                ) : (
                  <ShoppingBag size={20} color={theme.colors.white} strokeWidth={2.3} />
                )}
                <Text style={styles.cartButtonText}>{isSoldOut ? 'Sold out' : isAdded ? 'Added to cart' : 'Add to cart'}</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <EmptyState title="Product not found" description="This product may no longer be available." />
        )}
      </ScrollView>
    </View>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoPill}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  scroll: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    gap: theme.spacing.lg,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: outlineColor,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontFamily: Fonts.condensedMedium,
    fontSize: 13,
    lineHeight: 16,
  },
  headerTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 28,
    lineHeight: 34,
  },
  loadingState: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
  },
  imageStage: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    justifyContent: 'center',
    marginHorizontal: theme.spacing.lg,
    minHeight: 360,
    overflow: 'hidden',
    padding: theme.spacing.md,
    position: 'relative',
  },
  productImage: {
    height: 330,
    width: '100%',
  },
  productImageFallback: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.lg,
    height: 330,
    justifyContent: 'center',
    width: '100%',
  },
  soldOutBadge: {
    backgroundColor: 'rgba(31, 42, 36, 0.78)',
    borderRadius: theme.radius.pill,
    left: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    position: 'absolute',
    top: theme.spacing.lg,
  },
  soldOutText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  detailsPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: outlineColor,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  titleRow: {
    gap: theme.spacing.md,
  },
  titleCopy: {
    gap: theme.spacing.xs,
  },
  category: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 12,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  productName: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 26,
    lineHeight: 32,
  },
  price: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 24,
    lineHeight: 30,
  },
  description: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    lineHeight: 21,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  infoPill: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    flex: 1,
    gap: 3,
    minHeight: 64,
    padding: theme.spacing.md,
  },
  infoLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 13,
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  favoriteButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: theme.spacing.lg,
  },
  favoriteButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  favoriteButtonText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 14,
  },
  favoriteButtonTextActive: {
    color: theme.colors.white,
  },
  cartButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: theme.spacing.lg,
  },
  cartButtonDisabled: {
    backgroundColor: theme.colors.tabInactive,
  },
  cartButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
