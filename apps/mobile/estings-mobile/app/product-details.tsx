import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Image as RNImage,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { ArrowLeft, Heart, ImageOff, Minus, Package, Plus, Share2, ShoppingBag, Star } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/bloom-ui';
import { EstingsLogo } from '@/components/estings-logo';
import { ProductRecommendationGallery } from '@/components/product-recommendation-gallery';
import { formatPhp, type Product, type ProductColor } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { addGuestCartItem } from '@/services/guest-cart';
import { shopApi, type ProductRatingSummary, type ProductReview } from '@/services/shop-api';

const cartRoute = '/(tabs)/cart' as Href;

export default function ProductDetailsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const productId = typeof params.id === 'string' ? params.id : '';
  const lastRecommendationBatchAt = useRef(0);
  const recommendationBatchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAppendingRecommendations, setIsAppendingRecommendations] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [productColors, setProductColors] = useState<ProductColor[]>([]);
  const [productRating, setProductRating] = useState<ProductRatingSummary>({ averageRating: 0, reviewCount: 0 });
  const [productReviews, setProductReviews] = useState<ProductReview[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [visibleRecommendationCount, setVisibleRecommendationCount] = useState(4);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

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

  useEffect(() => {
    let isActive = true;

    if (!productId) {
      setProductColors([]);
      setProductRating({ averageRating: 0, reviewCount: 0 });
      setProductReviews([]);
      setSelectedColorId(null);
      return undefined;
    }

    Promise.all([
      shopApi.getProductColors(productId),
      shopApi.getProductRating(productId),
      shopApi.getProductReviews(productId),
    ]).then(([nextColors, nextRating, nextReviews]) => {
      if (!isActive) {
        return;
      }

      setProductColors(nextColors);
      setProductRating(nextRating);
      setProductReviews(nextReviews);
      setSelectedColorId(nextColors[0]?.id ?? null);
    });

    return () => {
      isActive = false;
    };
  }, [productId]);

  const product = useMemo(
    () => products.find((item) => item.id === productId),
    [productId, products],
  );

  const [aspectRatio, setAspectRatio] = useState<number>(1);

  useEffect(() => {
    if (product?.imageUrl) {
      RNImage.getSize(
        product.imageUrl,
        (width, height) => {
          if (width && height) {
            setAspectRatio(width / height);
          }
        },
        (error) => {
          console.warn('Failed to resolve image aspect ratio:', error);
        }
      );
    } else {
      setAspectRatio(1);
    }
  }, [product?.imageUrl]);
  const images = useMemo(() => {
    if (product && (product as any).images && Array.isArray((product as any).images)) {
      return (product as any).images;
    }
    return product?.imageUrl ? [product.imageUrl] : [];
  }, [product]);

  const hasMultipleImages = images.length > 1;

  const recommendedProducts = useMemo(
    () => products.filter((item) => item.id !== productId),
    [productId, products],
  );
  const visibleRecommendations = recommendedProducts.slice(0, visibleRecommendationCount);
  const recommendationCap = Math.min(recommendedProducts.length, 16);
  const canAppendRecommendations = visibleRecommendationCount < recommendationCap;
  const isSoldOut = (product?.stock ?? 0) <= 0;

  const handleAddToCart = useCallback(async () => {
    if (isAdded) {
      router.push(cartRoute);
      return;
    }

    if (!product || isSoldOut) {
      return;
    }

    await addGuestCartItem(product, quantity);
    setIsAdded(true);
  }, [isAdded, isSoldOut, product, quantity]);

  const appendRecommendationBatch = useCallback(() => {
    if (isAppendingRecommendations || !canAppendRecommendations) {
      return;
    }

    setIsAppendingRecommendations(true);

    recommendationBatchTimer.current = setTimeout(() => {
      setVisibleRecommendationCount((current) => Math.min(current + 4, recommendationCap));
      setIsAppendingRecommendations(false);
      recommendationBatchTimer.current = null;
    }, 260);
  }, [canAppendRecommendations, isAppendingRecommendations, recommendationCap]);

  const handleProductScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);

      if (distanceFromBottom < 340 && Date.now() - lastRecommendationBatchAt.current > 700) {
        lastRecommendationBatchAt.current = Date.now();
        appendRecommendationBatch();
      }
    },
    [appendRecommendationBatch],
  );

  useEffect(() => {
    setIsAdded(false);
    setQuantity(1);
    setVisibleRecommendationCount(4);
    setIsAppendingRecommendations(false);
    lastRecommendationBatchAt.current = 0;

    if (recommendationBatchTimer.current) {
      clearTimeout(recommendationBatchTimer.current);
      recommendationBatchTimer.current = null;
    }
  }, [productId]);

  useEffect(() => {
    return () => {
      if (recommendationBatchTimer.current) {
        clearTimeout(recommendationBatchTimer.current);
      }
    };
  }, []);

  return (
    <View style={styles.screen}>
      <ScrollView
        onScroll={handleProductScroll}
        scrollEventThrottle={160}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + (product ? 180 : 104) }}>

        {isLoading ? (
          <View style={[styles.loadingState, { paddingTop: insets.top + 80 }]}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading product details</Text>
          </View>
        ) : errorMessage ? (
          <View style={{ paddingTop: insets.top + 60 }}>
            <EmptyState title="Product unavailable" description={errorMessage} />
          </View>
        ) : product ? (
          <>
            {/* ─── Hero: colored background + image + floating actions ─── */}
            <View style={styles.heroSection}>
              <View style={styles.heroBackground}>
                {/* Top floating nav */}
                <View style={[styles.heroNav, { top: insets.top }]}>
                  <Pressable
                    accessibilityLabel="Go back"
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.heroNavButton, pressed && styles.pressed]}
                    onPress={() => router.back()}>
                    <ArrowLeft size={22} color={theme.colors.text} strokeWidth={2.4} />
                  </Pressable>

                  <View style={styles.heroNavRight}>
                    <Pressable
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.heroNavButton, pressed && styles.pressed]}>
                      <Share2 size={19} color={theme.colors.text} strokeWidth={2.2} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: isFavorite }}
                      style={({ pressed }) => [
                        styles.heroNavButton,
                        isFavorite && styles.heroNavButtonFavorited,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => setIsFavorite((current) => !current)}>
                      <Heart
                        size={19}
                        color={isFavorite ? theme.colors.white : theme.colors.text}
                        fill={isFavorite ? theme.colors.white : 'transparent'}
                        strokeWidth={2.2}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Product image */}
                <View style={styles.imageContainer}>
                  {product.imageUrl ? (
                    <Image
                      cachePolicy="memory-disk"
                      contentFit="cover"
                      recyclingKey={product.id}
                      source={{ uri: product.imageUrl }}
                      style={[styles.productImage, { aspectRatio }]}
                    />
                  ) : (
                    <View style={styles.productImageFallback}>
                      <ImageOff size={64} color={theme.colors.primary} />
                    </View>
                  )}

                  {/* Image indicators (dots) */}
                  {hasMultipleImages ? (
                    <View style={styles.indicatorRow}>
                      <View style={[styles.indicator, styles.indicatorActive]} />
                      <View style={styles.indicator} />
                      <View style={styles.indicator} />
                      <View style={styles.indicator} />
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Sold out badge overlay */}
              {isSoldOut ? (
                <View style={styles.soldOutBadge}>
                  <Text style={styles.soldOutText}>Sold out</Text>
                </View>
              ) : null}
            </View>

            {/* ─── Content area (white, rounded top) ─── */}
            <View style={styles.contentSheet}>
              {/* Badges row */}
              {product.tag ? (
                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Heart size={12} color={theme.colors.primary} fill={theme.colors.primary} strokeWidth={2} />
                    <Text style={styles.badgeText}>{product.tag}</Text>
                  </View>
                  {product.stock != null && product.stock > 0 && product.stock <= 10 ? (
                    <View style={styles.badgeUrgent}>
                      <Text style={styles.badgeUrgentText}>🔥 Only {product.stock} left</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* Product name + price */}
              <View style={styles.titleBlock}>
                <Text style={styles.productName}>{product.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{formatPhp(product.priceCents)}</Text>
                  {product.categoryName || product.tag ? (
                    <Text style={styles.categoryLabel}>
                      {product.categoryName ?? product.productGroup ?? 'Arrangement'}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Sold count + shipping */}
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  <Package size={13} color={theme.colors.textMuted} /> Free shipping available
                </Text>
              </View>

              {/* Rating inline */}
              <RatingInline averageRating={productRating.averageRating} reviewCount={productRating.reviewCount} />

              {/* Description */}
              <Text style={styles.description}>
                {product.description || 'Freshly prepared by Esting\u0027s for gifting, celebrations, and everyday moments.'}
              </Text>

              {/* Color selector */}
              <ColorSelector colors={productColors} selectedColorId={selectedColorId} onSelectColor={setSelectedColorId} />

              {/* Quantity */}
              <View style={styles.quantitySection}>
                <Text style={styles.sectionLabel}>Quantity</Text>
                <View style={styles.quantityControl}>
                  <Pressable
                    accessibilityLabel="Decrease quantity"
                    accessibilityRole="button"
                    disabled={quantity <= 1}
                    style={({ pressed }) => [styles.qtyButton, (quantity <= 1) && styles.qtyButtonDisabled, pressed && quantity > 1 && styles.pressed]}
                    onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
                    <Minus size={16} color={quantity <= 1 ? theme.colors.border : theme.colors.text} strokeWidth={2.5} />
                  </Pressable>
                  <Text style={styles.qtyValue}>{quantity}</Text>
                  <Pressable
                    accessibilityLabel="Increase quantity"
                    accessibilityRole="button"
                    disabled={quantity >= (product.stock ?? 99)}
                    style={({ pressed }) => [
                      styles.qtyButton,
                      (quantity >= (product.stock ?? 99)) && styles.qtyButtonDisabled,
                      pressed && quantity < (product.stock ?? 99) && styles.pressed,
                    ]}
                    onPress={() => setQuantity((q) => Math.min(product.stock ?? 99, q + 1))}>
                    <Plus size={16} color={quantity >= (product.stock ?? 99) ? theme.colors.border : theme.colors.text} strokeWidth={2.5} />
                  </Pressable>
                </View>
              </View>

              {/* Stock info */}
              <View style={styles.stockRow}>
                <View style={[styles.stockDot, isSoldOut ? styles.stockDotOut : styles.stockDotAvailable]} />
                <Text style={[styles.stockText, isSoldOut && styles.stockTextOut]}>
                  {isSoldOut ? 'Currently unavailable' : `In Stock (${product.stock ?? 0})`}
                </Text>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Reviews section */}
              <ReviewsSection reviews={productReviews} summary={productRating} />

              {/* Divider */}
              <View style={styles.divider} />

              {/* Recommendations */}
              <View style={styles.recommendationWrap}>
                <ProductRecommendationGallery
                  canAppend={canAppendRecommendations}
                  isAppending={isAppendingRecommendations}
                  isLoading={isLoading}
                  products={visibleRecommendations}
                />
              </View>
            </View>
          </>
        ) : (
          <View style={{ paddingTop: insets.top + 60 }}>
            <EmptyState title="Product not found" description="This product may no longer be available." />
          </View>
        )}
      </ScrollView>

      {product ? (
        <ProductActionBar
          bottomInset={insets.bottom}
          isAdded={isAdded}
          isSoldOut={isSoldOut}
          onAddToCart={handleAddToCart}
        />
      ) : null}
    </View>
  );
}

// ─── Rating row ────────────────────────────────────────────────────────────────
function RatingInline({ averageRating, reviewCount }: { averageRating: number; reviewCount: number }) {
  return (
    <View style={styles.ratingRow}>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={15}
            color={averageRating >= star ? '#F2B950' : '#DDE0DD'}
            fill={averageRating >= star ? '#F2B950' : 'transparent'}
            strokeWidth={2}
          />
        ))}
      </View>
      <Text style={styles.ratingValue}>{averageRating.toFixed(1)}</Text>
      <Text style={styles.ratingCount}>({reviewCount})</Text>
      {reviewCount > 0 ? (
        <Text style={styles.ratingLink}>{reviewCount} Reviews</Text>
      ) : null}
    </View>
  );
}

// ─── Color selector ────────────────────────────────────────────────────────────
function ColorSelector({
  colors,
  onSelectColor,
  selectedColorId,
}: {
  colors: ProductColor[];
  onSelectColor: (colorId: string) => void;
  selectedColorId: string | null;
}) {
  if (colors.length === 0) {
    return null;
  }

  return (
    <View style={styles.colorSection}>
      <Text style={styles.sectionLabel}>Select color</Text>
      <View style={styles.colorRow}>
        {colors.map((color) => {
          const isSelected = selectedColorId === color.id;

          return (
            <Pressable
              accessibilityLabel={`Select ${color.name}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={color.id}
              onPress={() => onSelectColor(color.id)}
              style={({ pressed }) => [
                styles.colorSwatchOuter,
                isSelected && styles.colorSwatchOuterSelected,
                pressed && styles.pressed,
              ]}>
              <View style={[styles.colorSwatch, { backgroundColor: color.hex }]}>
                {isSelected ? (
                  <View style={styles.colorCheck}>
                    <Text style={styles.colorCheckMark}>✓</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Reviews ───────────────────────────────────────────────────────────────────
function ReviewsSection({ reviews, summary }: { reviews: ProductReview[]; summary: ProductRatingSummary }) {
  const counts = useMemo(() => {
    const nextCounts = new Map<number, number>();

    for (const review of reviews) {
      nextCounts.set(review.rating, (nextCounts.get(review.rating) ?? 0) + 1);
    }

    return nextCounts;
  }, [reviews]);

  return (
    <View style={styles.reviewsSection}>
      <View style={styles.reviewsHeader}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        <Text style={styles.reviewsCountLink}>{summary.reviewCount} reviews</Text>
      </View>

      {/* Rating summary */}
      <View style={styles.ratingSummaryRow}>
        <Text style={styles.ratingSummaryBig}>{summary.averageRating.toFixed(1)}</Text>
        <View style={styles.ratingSummaryStars}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={14}
                color={summary.averageRating >= star ? '#F2B950' : '#DDE0DD'}
                fill={summary.averageRating >= star ? '#F2B950' : 'transparent'}
                strokeWidth={2}
              />
            ))}
          </View>
          <Text style={styles.ratingSummaryLabel}>{summary.reviewCount} ratings</Text>
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipScrollContent}>
        <View style={[styles.reviewChip, styles.reviewChipActive]}>
          <Text style={[styles.reviewChipText, styles.reviewChipTextActive]}>All</Text>
        </View>
        {[5, 4, 3, 2, 1].map((rating) => (
          <View key={rating} style={styles.reviewChip}>
            <Star size={11} color="#F2B950" fill="#F2B950" strokeWidth={2} />
            <Text style={styles.reviewChipText}>{rating} ({counts.get(rating) ?? 0})</Text>
          </View>
        ))}
      </ScrollView>

      {/* Review list */}
      {reviews.length > 0 ? (
        <View style={styles.reviewList}>
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewItemHeader}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={12}
                      color={review.rating >= star ? '#F2B950' : '#DDE0DD'}
                      fill={review.rating >= star ? '#F2B950' : 'transparent'}
                      strokeWidth={2}
                    />
                  ))}
                </View>
              </View>
              {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.reviewsEmpty}>
          <Text style={styles.reviewsEmptyTitle}>No reviews yet</Text>
          <Text style={styles.reviewsEmptyText}>
            Be the first to share your experience with this product.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Bottom action bar ─────────────────────────────────────────────────────────
function ProductActionBar({
  bottomInset,
  isAdded,
  isSoldOut,
  onAddToCart,
}: {
  bottomInset: number;
  isAdded: boolean;
  isSoldOut: boolean;
  onAddToCart: () => void;
}) {
  return (
    <View style={[styles.actionBar, { paddingBottom: bottomInset + theme.spacing.md }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isSoldOut }}
        disabled={isSoldOut}
        style={({ pressed }) => [
          styles.cartButton,
          isAdded && styles.cartButtonAdded,
          isSoldOut && styles.cartButtonDisabled,
          pressed && !isSoldOut && styles.pressed,
        ]}
        onPress={onAddToCart}>
        <ShoppingBag size={20} color={isAdded ? theme.colors.primary : theme.colors.white} strokeWidth={2.3} />
        <Text style={[styles.cartButtonText, isAdded && styles.cartButtonTextAdded]}>
          {isSoldOut ? 'Sold out' : isAdded ? 'View cart' : 'Add to cart'}
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.white,
    flex: 1,
  },
  scroll: {
    flex: 1,
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

  // ─── Hero ──────────────────────────────────
  heroSection: {
    position: 'relative',
  },
  heroBackground: {
    backgroundColor: '#EDF5EE',
  },
  heroNav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  heroNavRight: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  heroNavButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: theme.radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  heroNavButtonFavorited: {
    backgroundColor: theme.colors.primary,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  productImage: {
    width: '100%',
  },
  productImageFallback: {
    alignItems: 'center',
    height: 290,
    justifyContent: 'center',
    width: '100%',
  },
  indicatorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    position: 'absolute',
    bottom: 38,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  indicator: {
    backgroundColor: 'rgba(46, 139, 52, 0.2)',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  indicatorActive: {
    backgroundColor: theme.colors.primary,
    width: 24,
  },
  soldOutBadge: {
    backgroundColor: 'rgba(31, 42, 36, 0.78)',
    borderRadius: theme.radius.pill,
    left: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    position: 'absolute',
    top: 80,
  },
  soldOutText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 12,
  },

  // ─── Content sheet ─────────────────────────
  contentSheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: theme.spacing.lg,
    marginTop: -28,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    zIndex: 2,
  },

  // Badges
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: 'rgba(46, 139, 52, 0.08)',
    borderColor: 'rgba(46, 139, 52, 0.15)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 5,
  },
  badgeText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
  },
  badgeUrgent: {
    backgroundColor: '#FFF4E5',
    borderColor: '#FFE0B2',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 5,
  },
  badgeUrgentText: {
    color: '#E65100',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
  },

  // Title block
  titleBlock: {
    gap: theme.spacing.xs,
  },
  productName: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 24,
    lineHeight: 30,
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  price: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 22,
    lineHeight: 28,
  },
  categoryLabel: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.sm,
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    overflow: 'hidden',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },

  // Meta row
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  metaText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
  },

  // Rating
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingValue: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
  },
  ratingCount: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
  ratingLink: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    marginLeft: 4,
    textDecorationLine: 'underline',
  },

  // Description
  description: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 22,
  },

  // Color section
  colorSection: {
    gap: theme.spacing.sm,
  },
  sectionLabel: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  colorSwatchOuter: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: theme.radius.pill,
    borderWidth: 2.5,
    height: 40,
    justifyContent: 'center',
    padding: 2,
    width: 40,
  },
  colorSwatchOuterSelected: {
    borderColor: theme.colors.primary,
  },
  colorSwatch: {
    alignItems: 'center',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  colorCheck: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  colorCheckMark: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 11,
  },

  // Quantity
  quantitySection: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  quantityControl: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1.2,
    flexDirection: 'row',
    gap: 0,
  },
  qtyButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 42,
  },
  qtyButtonDisabled: {
    opacity: 0.4,
  },
  qtyValue: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    minWidth: 32,
    textAlign: 'center',
  },

  // Stock
  stockRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  stockDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  stockDotAvailable: {
    backgroundColor: theme.colors.primary,
  },
  stockDotOut: {
    backgroundColor: theme.colors.danger,
  },
  stockText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
  },
  stockTextOut: {
    color: theme.colors.danger,
  },

  // Divider
  divider: {
    backgroundColor: 'rgba(31, 42, 36, 0.06)',
    height: 1,
  },

  // Reviews
  reviewsSection: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    lineHeight: 24,
  },
  reviewsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewsCountLink: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
  },
  ratingSummaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  ratingSummaryBig: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 40,
    lineHeight: 48,
  },
  ratingSummaryStars: {
    gap: 4,
  },
  ratingSummaryLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    marginTop: 2,
  },
  chipScroll: {
    marginHorizontal: -theme.spacing.xl,
  },
  chipScrollContent: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  reviewChip: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 7,
  },
  reviewChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  reviewChipText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
  },
  reviewChipTextActive: {
    color: theme.colors.white,
  },
  reviewList: {
    gap: theme.spacing.md,
  },
  reviewItem: {
    borderBottomColor: 'rgba(31, 42, 36, 0.05)',
    borderBottomWidth: 1,
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  reviewItemHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  reviewComment: {
    color: theme.colors.text,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
  },
  reviewsEmpty: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.lg,
  },
  reviewsEmptyTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
  },
  reviewsEmptyText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },

  // Recommendations
  recommendationWrap: {
    marginHorizontal: 0,
  },

  // Action bar
  actionBar: {
    backgroundColor: theme.colors.white,
    borderColor: 'rgba(31, 42, 36, 0.06)',
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    gap: theme.spacing.md,
    left: 0,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    position: 'absolute',
    right: 0,
  },
  cartButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: theme.spacing.lg,
  },
  cartButtonAdded: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
  },
  cartButtonDisabled: {
    backgroundColor: theme.colors.tabInactive,
  },
  cartButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 16,
  },
  cartButtonTextAdded: {
    color: theme.colors.primary,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
