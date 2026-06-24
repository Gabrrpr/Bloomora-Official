import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image as RNImage,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { ArrowLeft, Check, FileText, Heart, MessageCircle, Minus, Package, Plus, Share2, ShoppingBag, Star, User } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BulkQuotationSheet } from '@/components/bulk-quotation-sheet';
import { EmptyState } from '@/components/bloom-ui';
import { ProductAddOnSelector } from '@/components/product-add-on-selector';
import { ProductCareGuideSection } from '@/components/product-care-guide-section';
import { ProductCard } from '@/components/product-card';
import { formatPhp, type Product, type ProductColor } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { addCartItem, getCartItems } from '@/services/cart-storage';
import { shopApi, type ProductRatingSummary, type ProductReview } from '@/services/shop-api';
import { getSelectedColorName, isFlowerProduct } from '@/utils/product-helpers';
import { buildRelatedProductRecommendations, createRecommendationSeed } from '@/utils/product-recommendations';

const cartRoute = '/(tabs)/cart' as Href;
const bulkQuantityHint = 10;
const imageNotFound = require('@/assets/images/default-img/ImageNotFound.webp');
const pageBackground = '#F5F5F5';
const hairlineColor = 'rgba(31, 42, 36, 0.09)';

type ProductDetailsRow =
  | { id: 'reviews-empty'; type: 'reviews-empty' }
  | { id: 'reviews-divider'; type: 'reviews-divider' }
  | { id: 'recommendation-title'; type: 'recommendation-title' }
  | { id: string; review: ProductReview; type: 'review' }
  | { id: string; products: Product[]; type: 'recommendation-row' };

export default function ProductDetailsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const productId = typeof params.id === 'string' ? params.id : '';
  const compactHeaderProgress = useRef(new Animated.Value(0)).current;
  const recommendationSeed = useRef(createRecommendationSeed()).current;
  const scrollRef = useRef<FlatList<ProductDetailsRow>>(null);
  const toastProgress = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [productColors, setProductColors] = useState<ProductColor[]>([]);
  const [addOns, setAddOns] = useState<Product[]>([]);
  const [productRating, setProductRating] = useState<ProductRatingSummary>({ averageRating: 0, reviewCount: 0 });
  const [productReviews, setProductReviews] = useState<ProductReview[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<ReadonlySet<string>>(() => new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showCompactHeader, setShowCompactHeader] = useState(false);
  const [showAddedToast, setShowAddedToast] = useState(false);
  const [isLoadingAddOns, setIsLoadingAddOns] = useState(false);
  const [showBulkQuotation, setShowBulkQuotation] = useState(false);
  const [cardMessage, setCardMessage] = useState('');

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

    setIsLoadingAddOns(true);
    setSelectedAddOnIds(new Set());

    Promise.all([
      shopApi.getProductColors(productId),
      shopApi.getAddOns(),
      shopApi.getProductRating(productId),
      shopApi.getProductReviews(productId),
    ])
      .then(([nextColors, nextAddOns, nextRating, nextReviews]) => {
        if (!isActive) {
          return;
        }

        setProductColors(nextColors);
        setAddOns(nextAddOns);
        setProductRating(nextRating);
        setProductReviews(nextReviews);
        setSelectedColorId(nextColors[0]?.id ?? null);
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingAddOns(false);
        }
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
    () =>
      buildRelatedProductRecommendations({
        currentProduct: product,
        products,
        seed: recommendationSeed,
      }),
    [product, products, recommendationSeed],
  );
  const detailsRows = useMemo<ProductDetailsRow[]>(() => {
    const rows: ProductDetailsRow[] =
      productReviews.length > 0
        ? productReviews.map((review) => ({
            id: `review-${review.id}`,
            review,
            type: 'review' as const,
          }))
        : [{ id: 'reviews-empty', type: 'reviews-empty' }];

    rows.push(
      { id: 'reviews-divider', type: 'reviews-divider' },
      { id: 'recommendation-title', type: 'recommendation-title' },
    );
    for (let index = 0; index < recommendedProducts.length; index += 2) {
      const products = recommendedProducts.slice(index, index + 2);
      rows.push({
        id: `recommendations-${products.map((item) => item.id).join('-')}`,
        products,
        type: 'recommendation-row',
      });
    }

    return rows;
  }, [productReviews, recommendedProducts]);
  const isSoldOut = (product?.stock ?? 0) <= 0;
  const soldCount = getProductSoldCount(product);
  const selectedAddOns = useMemo(
    () => addOns.filter((item) => selectedAddOnIds.has(item.id)),
    [addOns, selectedAddOnIds],
  );
  const addOnTotalCents = useMemo(
    () => selectedAddOns.reduce((total, item) => total + item.priceCents, 0),
    [selectedAddOns],
  );
  const unitTotalCents = (product?.priceCents ?? 0) + addOnTotalCents;
  const showCareGuide = product ? isFlowerProduct(product) : false;
  const showBulkHint = quantity >= bulkQuantityHint;
  const selectedColorName = getSelectedColorName(productColors, selectedColorId);

  const loadCartItemCount = useCallback(async () => {
    const items = await getCartItems();
    setCartItemCount(items.reduce((total, item) => total + item.quantity, 0));
  }, []);

  useEffect(() => {
    void loadCartItemCount();
  }, [loadCartItemCount]);

  const handleAddToCart = useCallback(async () => {
    if (isAdded) {
      router.push(cartRoute);
      return;
    }

    if (!product || isSoldOut) {
      return;
    }

    try {
      let nextItems = await addCartItem(product, quantity, cardMessage);
      for (const addOn of selectedAddOns) {
        nextItems = await addCartItem(addOn, 1);
      }
      setIsAdded(true);
      setShowAddedToast(true);
      setCartItemCount(nextItems.reduce((total, item) => total + item.quantity, 0));
    } catch (error) {
      Alert.alert(
        'Unable to add item',
        error instanceof Error ? error.message : 'Please try again in a moment.',
      );
      return;
    }

    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }

    toastProgress.stopAnimation();
    Animated.timing(toastProgress, {
      duration: 180,
      toValue: 1,
      useNativeDriver: true,
    }).start();

    toastTimer.current = setTimeout(() => {
      Animated.timing(toastProgress, {
        duration: 190,
        toValue: 0,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setShowAddedToast(false);
        }
      });
      toastTimer.current = null;
    }, 1800);
  }, [cardMessage, isAdded, isSoldOut, product, quantity, selectedAddOns, toastProgress]);

  const handleBuyNow = useCallback(async () => {
    if (!product || isSoldOut) {
      return;
    }

    let nextItems = await addCartItem(product, quantity, cardMessage);
    const checkoutIds = [product.id];
    for (const addOn of selectedAddOns) {
      nextItems = await addCartItem(addOn, 1);
      checkoutIds.push(addOn.id);
    }
    setIsAdded(true);
    setCartItemCount(nextItems.reduce((total, item) => total + item.quantity, 0));
    router.push(`/checkout?ids=${encodeURIComponent(checkoutIds.join(','))}` as Href);
  }, [cardMessage, isSoldOut, product, quantity, selectedAddOns]);

  const handleOpenBulkQuotation = useCallback(() => {
    setShowBulkQuotation(true);
  }, []);

  const handleOpenChatWithQuote = useCallback(
    (quoteText: string) => {
      if (!product) {
        return;
      }

      setShowBulkQuotation(false);
      router.push(
        `/live-chat?productId=${encodeURIComponent(product.id)}&productName=${encodeURIComponent(product.name)}&productPrice=${encodeURIComponent(formatPhp(unitTotalCents))}&quote=${encodeURIComponent(quoteText)}` as Href,
      );
    },
    [product, unitTotalCents],
  );

  const handleChatAboutProduct = useCallback(() => {
    if (!product) {
      return;
    }

    router.push(
      `/live-chat?productId=${encodeURIComponent(product.id)}&productName=${encodeURIComponent(product.name)}&productPrice=${encodeURIComponent(formatPhp(product.priceCents))}` as Href,
    );
  }, [product]);

  const handleScrollToTop = useCallback(() => {
    scrollRef.current?.scrollToOffset({ animated: true, offset: 0 });
  }, []);

  const handleProductScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = event.nativeEvent;
      const shouldShowCompactHeader = contentOffset.y > 180;

      if (shouldShowCompactHeader !== showCompactHeader) {
        setShowCompactHeader(shouldShowCompactHeader);
      }
    },
    [showCompactHeader],
  );

  useEffect(() => {
    Animated.timing(compactHeaderProgress, {
      duration: 180,
      toValue: showCompactHeader ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [compactHeaderProgress, showCompactHeader]);

  useEffect(() => {
    setIsAdded(false);
    setQuantity(1);
    setSelectedAddOnIds(new Set());
    setShowBulkQuotation(false);
  }, [productId]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
      toastProgress.stopAnimation();
    };
  }, [toastProgress]);

  const toastAnimatedStyle = {
    opacity: toastProgress,
    transform: [
      {
        translateY: toastProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
      {
        scale: toastProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1],
        }),
      },
    ],
  };

  const renderDetailsRow = useCallback(
    ({ item: row }: { item: ProductDetailsRow }) => {
      if (row.type === 'review') {
        return <ReviewRow review={row.review} />;
      }

      if (row.type === 'reviews-empty') {
        return <ReviewsEmpty />;
      }

      if (row.type === 'reviews-divider') {
        return (
          <View style={styles.detailsDividerRow}>
            <View style={styles.divider} />
          </View>
        );
      }

      if (row.type === 'recommendation-title') {
        return (
          <View style={styles.recommendationWrap}>
            <View style={styles.recommendationTitleRow}>
              <View style={styles.recommendationTitleLine} />
              <Text style={styles.recommendationTitle}>You May Also Like</Text>
              <View style={styles.recommendationTitleLine} />
            </View>
          </View>
        );
      }

      return (
        <View style={styles.recommendationGridRow}>
          {row.products.map((item) => (
            <ProductCard key={item.id} product={item} style={styles.recommendationCard} />
          ))}
          {row.products.length === 1 ? <View style={styles.recommendationCardSpacer} /> : null}
        </View>
      );
    },
    [],
  );

  return (
    <View style={styles.screen}>
      <FlatList
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: insets.bottom + (product ? 180 : 104) }}
        contentInsetAdjustmentBehavior="automatic"
        data={product ? detailsRows : []}
        initialNumToRender={Platform.OS === 'android' ? 3 : 4}
        keyExtractor={(row) => row.id}
        ListHeaderComponent={
          <>
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
                      accessibilityLabel="Open cart"
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.heroNavButton, pressed && styles.pressed]}
                      onPress={() => router.push(cartRoute)}>
                      <ShoppingBag size={19} color={theme.colors.text} strokeWidth={2.2} />
                      {cartItemCount > 0 ? (
                        <View style={styles.cartCountBadge}>
                          <Text style={styles.cartCountText}>{cartItemCount > 99 ? '99+' : cartItemCount}</Text>
                        </View>
                      ) : null}
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
                    <Image contentFit="contain" source={imageNotFound} style={[styles.productImage, styles.productImageFallback, { aspectRatio }]} />
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
              {/* Product name + price */}
              <View style={styles.titleBlock}>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{formatPhp(product.priceCents)}</Text>
                  <View style={styles.priceMetaRow}>
                    <Text style={styles.soldCountInlineText}>{soldCount.toLocaleString('en-PH')} sold</Text>
                    <Pressable
                      accessibilityLabel="Favorite product"
                      accessibilityRole="button"
                      accessibilityState={{ selected: isFavorite }}
                      hitSlop={10}
                      onPress={() => setIsFavorite((current) => !current)}
                      style={({ pressed }) => [styles.priceFavoriteButton, isFavorite && styles.priceFavoriteButtonActive, pressed && styles.pressed]}>
                      <Heart
                        size={24}
                        color={isFavorite ? '#FF5C93' : theme.colors.textMuted}
                        fill={isFavorite ? '#FF5C93' : 'transparent'}
                        strokeWidth={2.2}
                      />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.productNameRow}>
                  {product.tag ? (
                    <View style={styles.productTagPill}>
                      <Text style={styles.productTagText}>{product.tag}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.productName}>{product.name}</Text>
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

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>
                  {product.description || 'No product description has been added yet.'}
                </Text>
              </View>

              {/* Color selector */}
              <ColorSelector colors={productColors} selectedColorId={selectedColorId} onSelectColor={setSelectedColorId} />

              <ProductAddOnSelector
                addOns={addOns}
                isLoading={isLoadingAddOns}
                selectedIds={selectedAddOnIds}
                onToggle={(addOnId: string) => {
                  setSelectedAddOnIds((current) => {
                    const next = new Set(current);
                    if (next.has(addOnId)) next.delete(addOnId);
                    else next.add(addOnId);
                    return next;
                  });
                }}
              />

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

              {showBulkHint ? (
                <BulkOrderHint onGetQuote={handleOpenBulkQuotation} quantity={quantity} />
              ) : null}

              <View style={styles.cardComposer}>
                <View style={styles.cardComposerTitleRow}>
                  <FileText color={theme.colors.primary} size={18} />
                  <Text style={styles.cardComposerTitle}>Add a letter card</Text>
                </View>
                <TextInput
                  maxLength={500}
                  multiline
                  onChangeText={setCardMessage}
                  placeholder="Write a short message for the recipient (optional)"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.cardComposerInput}
                  value={cardMessage}
                />
                <Text style={styles.cardComposerCount}>{cardMessage.length}/500</Text>
              </View>

              {/* Stock info */}
              {!isSoldOut ? (
                <View style={styles.stockRow}>
                  <View style={[styles.stockDot, styles.stockDotAvailable]} />
                  <Text style={styles.stockText}>In Stock ({product.stock ?? 0})</Text>
                </View>
              ) : null}

              {/* Divider */}
              {showCareGuide ? (
                <>
                  <View style={styles.divider} />
                  <ProductCareGuideSection entries={product.careGuide ?? []} />
                </>
              ) : null}

              <View style={styles.divider} />

              {/* Reviews section */}
              <ReviewsSummary reviews={productReviews} summary={productRating} />
            </View>
          </>
        ) : (
          <View style={{ paddingTop: insets.top + 60 }}>
            <EmptyState title="Product not found" description="This product may no longer be available." />
          </View>
        )}
          </>
        }
        maxToRenderPerBatch={Platform.OS === 'android' ? 3 : 4}
        onScroll={handleProductScroll}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={renderDetailsRow}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        updateCellsBatchingPeriod={50}
        windowSize={Platform.OS === 'android' ? 5 : 7}
      />

      {product ? (
        <ProductActionBar
          bottomInset={insets.bottom}
          isAdded={isAdded}
          isSoldOut={isSoldOut}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          onChat={handleChatAboutProduct}
          priceLabel={formatPhp(unitTotalCents)}
        />
      ) : null}

      {product ? (
        <BulkQuotationSheet
          addOns={selectedAddOns}
          colorName={selectedColorName}
          onClose={() => setShowBulkQuotation(false)}
          onOpenChat={handleOpenChatWithQuote}
          product={product}
          visible={showBulkQuotation}
        />
      ) : null}

      {product ? (
        <ProductScrollHeader
          animatedStyle={{
            opacity: compactHeaderProgress,
            transform: [
              {
                translateY: compactHeaderProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-18, 0],
                }),
              },
            ],
          }}
          cartItemCount={cartItemCount}
          onBack={() => router.back()}
          onCartPress={() => router.push(cartRoute)}
          onTitlePress={handleScrollToTop}
          pointerEvents={showCompactHeader ? 'auto' : 'none'}
          title={product.name}
          topInset={insets.top}
        />
      ) : null}

      {showAddedToast ? (
        <Animated.View style={[styles.addedToast, { bottom: insets.bottom + 96 }, toastAnimatedStyle]}>
          <View style={styles.addedToastIcon}>
            <Check size={14} color={theme.colors.white} strokeWidth={3} />
          </View>
          <Text style={styles.addedToastText}>Added to cart successfully.</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

function ProductScrollHeader({
  animatedStyle,
  cartItemCount,
  onBack,
  onCartPress,
  onTitlePress,
  pointerEvents,
  title,
  topInset,
}: {
  animatedStyle: object;
  cartItemCount: number;
  onBack: () => void;
  onCartPress: () => void;
  onTitlePress: () => void;
  pointerEvents: 'auto' | 'none';
  title: string;
  topInset: number;
}) {
  return (
    <Animated.View pointerEvents={pointerEvents} style={[styles.compactHeader, { paddingTop: topInset }, animatedStyle]}>
      <View style={styles.compactHeaderRow}>
        <View style={styles.compactHeaderLeading}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onBack}
            style={({ pressed }) => [styles.compactHeaderButton, pressed && styles.pressed]}>
            <ArrowLeft size={22} color={theme.colors.text} strokeWidth={2.4} />
          </Pressable>
        </View>
        <Pressable
          accessibilityLabel="Scroll to product image"
          accessibilityRole="button"
          onPress={onTitlePress}
          style={({ pressed }) => [styles.compactHeaderTitleButton, pressed && styles.pressed]}>
          <Text numberOfLines={1} style={styles.compactHeaderTitle}>
            {title}
          </Text>
        </Pressable>
        <View style={styles.compactHeaderActions}>
          <Pressable
            accessibilityLabel="Share product"
            accessibilityRole="button"
            hitSlop={10}
            style={({ pressed }) => [styles.compactHeaderButton, pressed && styles.pressed]}>
            <Share2 size={18} color={theme.colors.text} strokeWidth={2.2} />
          </Pressable>
          <Pressable
            accessibilityLabel="Open cart"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onCartPress}
            style={({ pressed }) => [styles.compactHeaderButton, pressed && styles.pressed]}>
            <ShoppingBag size={18} color={theme.colors.text} strokeWidth={2.2} />
            {cartItemCount > 0 ? (
              <View style={styles.compactCartCountBadge}>
                <Text style={styles.compactCartCountText}>{cartItemCount > 99 ? '99+' : cartItemCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Bulk order hint ───────────────────────────────────────────────────────────
function BulkOrderHint({ onGetQuote, quantity }: { onGetQuote: () => void; quantity: number }) {
  return (
    <View style={styles.bulkHint}>
      <View style={styles.bulkHintIcon}>
        <FileText color="#DB2777" size={18} strokeWidth={2.2} />
      </View>
      <View style={styles.bulkHintBody}>
        <Text style={styles.bulkHintTitle}>Buying {quantity}+ pieces?</Text>
        <Text style={styles.bulkHintText}>Get a bulk quotation for better rates.</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onGetQuote}
        style={({ pressed }) => [styles.bulkHintButton, pressed && styles.pressed]}>
        <Text style={styles.bulkHintButtonText}>Get quote</Text>
      </Pressable>
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
function ReviewsSummary({ reviews, summary }: { reviews: ProductReview[]; summary: ProductRatingSummary }) {
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

    </View>
  );
}

function ReviewRow({ review }: { review: ProductReview }) {
  const formattedDate = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <View style={styles.reviewRowWrap}>
      <View style={styles.reviewItem}>
        <View style={styles.reviewItemHeader}>
          <View style={styles.reviewAuthorRow}>
            {review.profilePictureUrl ? (
              <Image source={{ uri: review.profilePictureUrl }} style={styles.reviewAvatar} contentFit="cover" />
            ) : (
              <View style={styles.reviewAvatarFallback}>
                <User size={16} color={theme.colors.textMuted} strokeWidth={2.2} />
              </View>
            )}
            <View style={styles.reviewAuthorInfo}>
              <Text style={styles.reviewAuthorName}>{review.userName || 'Anonymous'}</Text>
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
          </View>
          {formattedDate ? <Text style={styles.reviewDate}>{formattedDate}</Text> : null}
        </View>
        {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
      </View>
    </View>
  );
}

function ReviewsEmpty() {
  return (
    <View style={styles.reviewsEmptyWrap}>
      <View style={styles.reviewsEmpty}>
        <Text style={styles.reviewsEmptyTitle}>No reviews yet</Text>
        <Text style={styles.reviewsEmptyText}>
          Be the first to share your experience with this product.
        </Text>
      </View>
    </View>
  );
}

// ─── Bottom action bar ─────────────────────────────────────────────────────────
function getProductSoldCount(product: Product | undefined) {
  const productWithSoldCount = product as
    | (Product & { soldCount?: number; sold_count?: number; totalSold?: number })
    | undefined;
  const soldCount = productWithSoldCount?.soldCount ?? productWithSoldCount?.sold_count ?? productWithSoldCount?.totalSold ?? 0;

  return Number.isFinite(soldCount) && soldCount > 0 ? Math.round(soldCount) : 0;
}

function ProductActionBar({
  bottomInset,
  isAdded,
  isSoldOut,
  onAddToCart,
  onBuyNow,
  onChat,
  priceLabel,
}: {
  bottomInset: number;
  isAdded: boolean;
  isSoldOut: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onChat: () => void;
  priceLabel: string;
}) {
  return (
    <View style={[styles.actionBar, { paddingBottom: bottomInset + theme.spacing.md }]}>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.actionIconButton, pressed && styles.pressed]}
        onPress={onChat}>
        <MessageCircle size={21} color={theme.colors.primary} strokeWidth={2.3} />
        <Text style={styles.actionIconText}>Chat</Text>
      </Pressable>

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
        <ShoppingBag size={18} color={theme.colors.primary} strokeWidth={2.3} />
        <Text style={[styles.cartButtonText, isAdded && styles.cartButtonTextAdded]}>
          {isAdded ? 'View cart' : 'Add to cart'}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isSoldOut }}
        disabled={isSoldOut}
        style={({ pressed }) => [
          styles.buyNowButton,
          isSoldOut && styles.buyNowButtonDisabled,
          pressed && !isSoldOut && styles.pressed,
        ]}
        onPress={onBuyNow}>
        <Text style={styles.buyNowLabel}>{isSoldOut ? 'Unavailable' : 'Buy now'}</Text>
        <Text style={styles.buyNowPrice}>{isSoldOut ? 'Sold out' : priceLabel}</Text>
      </Pressable>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  cardComposer: {
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(46, 139, 52, 0.22)',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 8,
    marginTop: 14,
    padding: 12,
  },
  cardComposerTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  cardComposerTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
  },
  cardComposerInput: {
    backgroundColor: theme.colors.white,
    borderColor: hairlineColor,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    color: theme.colors.text,
    fontFamily: Fonts.sans,
    fontSize: 13,
    minHeight: 86,
    padding: 10,
    textAlignVertical: 'top',
  },
  cardComposerCount: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 10,
    textAlign: 'right',
  },
  screen: {
    backgroundColor: theme.colors.white,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  compactHeader: {
    backgroundColor: theme.colors.white,
    borderBottomColor: 'rgba(31, 42, 36, 0.07)',
    borderBottomWidth: 1,
    elevation: 4,
    left: 0,
    position: 'absolute',
    right: 0,
    shadowColor: '#1F2A24',
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    top: 0,
    zIndex: 40,
  },
  compactHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 56,
    paddingHorizontal: theme.spacing.sm,
  },
  compactHeaderButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    position: 'relative',
    width: 44,
  },
  compactHeaderTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 18,
    paddingHorizontal: theme.spacing.sm,
    textAlign: 'center',
  },
  compactHeaderTitleButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  compactHeaderLeading: {
    width: 88,
  },
  compactHeaderActions: {
    flexDirection: 'row',
    width: 88,
  },
  compactCartCountBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.white,
    borderRadius: 9,
    borderWidth: 1.4,
    height: 17,
    justifyContent: 'center',
    minWidth: 17,
    paddingHorizontal: 4,
    position: 'absolute',
    right: 4,
    top: 4,
  },
  compactCartCountText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 8.5,
    lineHeight: 11,
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
    position: 'relative',
    width: 42,
  },
  heroNavButtonFavorited: {
    backgroundColor: theme.colors.primary,
  },
  cartCountBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.white,
    borderRadius: 10,
    borderWidth: 1.5,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -2,
    top: -3,
  },
  cartCountText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    lineHeight: 12,
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
    backgroundColor: theme.colors.greenSoft,
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
    bottom: 42,
    left: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    position: 'absolute',
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
    gap: 8,
  },
  productName: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 18,
    lineHeight: 23,
    minWidth: 0,
  },
  productNameRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 7,
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  price: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 32,
    lineHeight: 38,
  },
  priceMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
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
  priceFavoriteButton: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  priceFavoriteButtonActive: {
    transform: [{ scale: 1.03 }],
  },
  productTagPill: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
    justifyContent: 'center',
    marginTop: -1,
    minHeight: 22,
    paddingHorizontal: 10,
  },
  productTagText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    includeFontPadding: false,
    lineHeight: 17,
  },
  soldCountText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
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
  detailSection: {
    gap: theme.spacing.sm,
  },
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

  bulkHint: {
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    borderColor: '#FBCFE8',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  bulkHintIcon: {
    alignItems: 'center',
    backgroundColor: '#FCE7F3',
    borderRadius: theme.radius.sm,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  bulkHintBody: {
    flex: 1,
    gap: 2,
  },
  bulkHintTitle: {
    color: '#9D174D',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  bulkHintText: {
    color: '#BE185D',
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 15,
  },
  bulkHintButton: {
    backgroundColor: '#DB2777',
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  bulkHintButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 12,
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
  reviewRowWrap: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.xl,
  },
  reviewItem: {
    borderBottomColor: 'rgba(31, 42, 36, 0.05)',
    borderBottomWidth: 1,
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  reviewItemHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  reviewAuthorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  reviewAvatar: {
    borderRadius: 18,
    height: 36,
    width: 36,
  },
  reviewAvatarFallback: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  reviewAuthorInfo: {
    gap: 3,
  },
  reviewAuthorName: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
  },
  reviewDate: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
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
  reviewsEmptyWrap: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.xl,
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
    backgroundColor: pageBackground,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  detailsDividerRow: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  recommendationTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'center',
  },
  recommendationTitleLine: {
    backgroundColor: hairlineColor,
    flex: 1,
    height: 1,
  },
  recommendationTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    lineHeight: 23,
  },
  recommendationGridRow: {
    backgroundColor: pageBackground,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  recommendationCard: {
    flex: 1,
    width: 'auto',
  },
  recommendationCardSpacer: {
    flex: 1,
  },

  // Action bar
  actionBar: {
    backgroundColor: theme.colors.white,
    borderColor: 'rgba(31, 42, 36, 0.06)',
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    left: 0,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    position: 'absolute',
    right: 0,
  },
  addedToast: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#1F2A24',
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 44,
    paddingHorizontal: theme.spacing.lg,
    position: 'absolute',
    zIndex: 60,
  },
  addedToastIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  addedToastText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  soldCountInlineText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  actionIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
    width: 58,
  },
  actionIconText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  cartButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: 16,
    gap: 2,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: theme.spacing.md,
    width: 112,
  },
  cartButtonAdded: {
    backgroundColor: theme.colors.greenSoft,
  },
  cartButtonDisabled: {
    opacity: 0.45,
  },
  cartButtonText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  cartButtonTextAdded: {
    color: theme.colors.primary,
  },
  buyNowButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: theme.spacing.lg,
  },
  buyNowButtonDisabled: {
    backgroundColor: theme.colors.tabInactive,
  },
  buyNowLabel: {
    color: theme.colors.white,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  buyNowPrice: {
    color: theme.colors.white,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 17,
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
