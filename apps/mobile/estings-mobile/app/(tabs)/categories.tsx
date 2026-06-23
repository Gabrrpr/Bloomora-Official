import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import {
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Search, Star, Store, WifiOff, X, Zap } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBrandHeader } from '@/components/app-brand-header';
import { EmptyState } from '@/components/bloom-ui';
import { ProductCard } from '@/components/product-card';
import { formatPhp, type Product } from '@/constants/shop';
import { theme } from '@/constants/theme';
import { shopApi } from '@/services/shop-api';
import { getStoreBranch, setStoreBranch, type StoreBranch } from '@/services/branch-preference';
import { buildDiscoveryProductOrder, createRecommendationSeed } from '@/utils/product-recommendations';

const imageNotFound = require('@/assets/images/default-img/ImageNotFound.webp');
const makeItPersonalBanner = require('@/assets/images/banners/MakeItPersonal_Banner.png');
const pageBackground = '#F5F5F5';
const hairlineColor = 'rgba(31, 42, 36, 0.09)';
const softText = '#2F3A34';
type ProductSectionKind =
  | 'flash-sale'
  | 'featured'
  | 'new-arrivals'
  | 'random'
  | 'floral-products'
  | 'non-floral-products';

type ProductSectionConfig = {
  id: ProductSectionKind;
  isVisible: boolean;
  order: number;
  title: string;
};

const productSectionConfig: ProductSectionConfig[] = [
  { id: 'flash-sale', isVisible: true, order: 5, title: 'Flash Sale' },
  { id: 'featured', isVisible: true, order: 10, title: 'Featured Products' },
  { id: 'new-arrivals', isVisible: true, order: 20, title: 'New Arrivals' },
  { id: 'random', isVisible: true, order: 30, title: 'Discover Something New' },
  { id: 'floral-products', isVisible: true, order: 40, title: 'Floral Products' },
  { id: 'non-floral-products', isVisible: true, order: 50, title: 'Non Floral Products' },
];
const productSectionPreviewLimit = 12;

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearchBarMounted, setIsSearchBarMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productOrderSeed, setProductOrderSeed] = useState(() => createRecommendationSeed());
  const [query, setQuery] = useState('');
  const [branch, setBranch] = useState<StoreBranch>('manila');
  const [isBranchPickerOpen, setIsBranchPickerOpen] = useState(false);
  const searchBarProgress = useRef(new Animated.Value(0)).current;

  const loadCatalog = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const { products: nextProducts } = await shopApi.getCatalog({
        branch,
        forceRefresh: showRefresh,
      });

      setProducts(nextProducts);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Catalog is unavailable.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [branch]);

  useEffect(() => {
    void getStoreBranch().then(setBranch);
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const handleRefreshCatalog = useCallback(() => {
    setProductOrderSeed(createRecommendationSeed());
    loadCatalog(true);
  }, [loadCatalog]);

  const filteredProducts = useMemo(() => {
    return buildDiscoveryProductOrder({
      products,
      seed: productOrderSeed,
    });
  }, [productOrderSeed, products]);
  const productSections = useMemo(
    () => buildProductSections(filteredProducts, products, productOrderSeed),
    [filteredProducts, productOrderSeed, products],
  );
  const hasRenderableSections = productSections.some(shouldRenderProductSection);

  const handleSubmitSearch = useCallback(() => {
    const nextQuery = query.trim();

    setIsSearchOpen(false);
    setIsSearchBarMounted(false);
    router.push(nextQuery ? `/search-results?q=${encodeURIComponent(nextQuery)}&branch=${branch}` : `/search-results?branch=${branch}`);
  }, [branch, query]);

  const handleOpenSearch = useCallback(() => {
    setIsSearchOpen(true);
    setIsSearchBarMounted(true);
    searchBarProgress.stopAnimation();
    Animated.timing(searchBarProgress, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [searchBarProgress]);

  const handleCloseSearch = useCallback(() => {
    searchBarProgress.stopAnimation();
    Animated.timing(searchBarProgress, {
      duration: 180,
      easing: Easing.in(Easing.cubic),
      toValue: 0,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setIsSearchOpen(false);
      setIsSearchBarMounted(false);
      setQuery('');
    });
  }, [searchBarProgress]);

  const handleOpenProductList = useCallback((params: ProductListRouteParams) => {
    router.push(buildProductListRoute({ ...params, branch }));
  }, [branch]);

  return (
    <View style={styles.screen}>
      <View style={styles.stickyHeader}>
        <AppBrandHeader onSearchPress={handleOpenSearch} />
        <Pressable
          accessibilityLabel={`Change store branch. Current branch ${branch}`}
          onPress={() => setIsBranchPickerOpen((current) => !current)}
          style={styles.branchButton}>
          <Store color={theme.colors.primary} size={17} />
          <Text style={styles.branchButtonText}>{branch === 'manila' ? 'Manila' : 'Pampanga'}</Text>
        </Pressable>

      </View>
      {isBranchPickerOpen ? (
        <View style={styles.branchPicker}>
          {(['manila', 'pampanga'] as StoreBranch[]).map((option) => (
            <Pressable
              key={option}
              onPress={() => {
                setBranch(option);
                void setStoreBranch(option);
                setIsBranchPickerOpen(false);
              }}
              style={[styles.branchOption, branch === option && styles.branchOptionActive]}>
              <Text style={[styles.branchOptionText, branch === option && styles.branchOptionTextActive]}>
                {option === 'manila' ? 'Manila' : 'Pampanga'}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {isSearchBarMounted ? (
        <FloatingSearchBar
          isOpen={isSearchOpen}
          onChangeText={setQuery}
          onClose={handleCloseSearch}
          onSubmit={handleSubmitSearch}
          progress={searchBarProgress}
          topInset={insets.top}
          value={query}
        />
      ) : null}

      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefreshCatalog} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}
        style={styles.catalogScroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]}>
        {isLoading ? (
          <CatalogSkeleton />
        ) : errorMessage ? (
          <CatalogUnavailableState message={errorMessage} onRetry={() => loadCatalog(true)} />
        ) : (
          <MakeItPersonalBanner />
        )}

      {isLoading || errorMessage ? null : hasRenderableSections ? (
        productSections.map((section) =>
          shouldRenderProductSection(section) ? (
            <ProductSection
              key={section.id}
              onViewMore={() => handleOpenProductList({ section: section.id, title: section.title })}
              products={section.products}
              sectionId={section.id}
              title={section.title}
            />
          ) : null,
        )
      ) : (
        <EmptyState
          title="No products found"
          description={
            'Try another category or search term.'
          }
        />
      )}
      </ScrollView>
    </View>
  );
}

function MakeItPersonalBanner() {
  return (
    <Pressable
      accessibilityLabel="Try Make it Personal"
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/(tabs)/generate', params: { frame: 'selection' } })}
      style={({ pressed }) => [styles.bannerButton, pressed && styles.productTilePressed]}>
      <Image contentFit="cover" source={makeItPersonalBanner} style={styles.makeItPersonalBanner} />
    </Pressable>
  );
}

function CatalogUnavailableState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.unavailablePanel}>
      <View style={styles.unavailableIcon}>
        <WifiOff size={34} color={theme.colors.primary} strokeWidth={2.1} />
      </View>
      <Text style={styles.unavailableTitle}>Catalog unavailable</Text>
      <Text style={styles.unavailableText}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}>
        <Text style={styles.retryButtonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

function ProductAppendLoader() {
  const skeletonColumns = splitIntoColumns([0, 1, 2, 3]);

  return (
    <View style={styles.productGrid}>
      {skeletonColumns.map((column, columnIndex) => (
        <View key={`append-column-${columnIndex}`} style={styles.productColumn}>
          {column.map((item) => (
            <View key={`append-${item}`} style={styles.productTile}>
              <SkeletonBlock style={styles.productImage} />
              <View style={styles.productBody}>
                <SkeletonBlock style={styles.skeletonLineWide} />
                <SkeletonBlock style={styles.skeletonLineShort} />
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

type ProductListRouteParams = {
  branch?: StoreBranch;
  category?: string;
  group?: 'occasions';
  section?: ProductSectionKind;
  title: string;
};

function FloatingSearchBar({
  isOpen,
  onChangeText,
  onClose,
  onSubmit,
  progress,
  topInset,
  value,
}: {
  isOpen: boolean;
  onChangeText: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  progress: Animated.Value;
  topInset: number;
  value: string;
}) {
  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  return (
    <Animated.View
      pointerEvents={isOpen ? 'auto' : 'none'}
      style={[
        styles.searchOverlay,
        {
          opacity,
          top: topInset + 74,
          transform: [{ translateY }, { scale }],
        },
      ]}>
      <View style={styles.searchBar}>
        <Search size={theme.icon.sm} color={theme.colors.textMuted} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder="Search flowers, gifts, colors"
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="search"
          style={styles.searchInput}
          value={value}
        />
        {value ? (
          <Pressable accessibilityLabel="Clear search" accessibilityRole="button" hitSlop={8} onPress={() => onChangeText('')}>
            <X size={theme.icon.sm} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}
        <Pressable accessibilityLabel="Close search" accessibilityRole="button" hitSlop={8} onPress={onClose}>
          <X size={theme.icon.sm} color={theme.colors.textMuted} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

function ProductSection({
  onViewMore,
  products,
  sectionId,
  title,
}: {
  onViewMore: () => void;
  products: Product[];
  sectionId: ProductSectionKind;
  title: string;
}) {
  const isFlashSale = sectionId === 'flash-sale';
  const previewProducts = products.slice(0, productSectionPreviewLimit);
  const productColumns = splitIntoColumns(previewProducts);
  const canViewMore = isFlashSale ? products.length > 0 : products.length > productSectionPreviewLimit;

  return (
    <View style={styles.productSection}>
      <SectionTitle canViewMore={canViewMore} isFlashSale={isFlashSale} onViewMore={onViewMore} title={title} />
      {isFlashSale ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.flashSaleRail}>
          {previewProducts.length > 0 ? (
            previewProducts.map((product) => (
              <FlashSaleProductCard key={product.id} product={product} />
            ))
          ) : (
            <FlashSaleSkeletonPreview />
          )}
        </ScrollView>
      ) : (
        <View style={styles.productGrid}>
          {productColumns.map((column, columnIndex) => (
            <View key={`${title}-${columnIndex}`} style={styles.productColumn}>
              {column.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  style={styles.productCard}
                />
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function FlashSaleSkeletonPreview() {
  return (
    <>
      <View style={styles.flashSaleSkeletonCard}>
        <View style={styles.flashSaleSkeletonImage} />
        <View style={styles.flashSaleSkeletonBody}>
          <View style={styles.flashSaleSkeletonLineWide} />
          <View style={styles.flashSaleSkeletonLineMedium} />
          <View style={styles.flashSaleSkeletonSpacer} />
          <View style={styles.flashSaleSkeletonLineShort} />
        </View>
      </View>
      <View style={[styles.flashSaleSkeletonCard, styles.flashSaleSkeletonCardPartial]}>
        <View style={styles.flashSaleSkeletonImage} />
        <View style={styles.flashSaleSkeletonBody}>
          <View style={styles.flashSaleSkeletonLineWide} />
          <View style={styles.flashSaleSkeletonLineMedium} />
          <View style={styles.flashSaleSkeletonSpacer} />
          <View style={styles.flashSaleSkeletonLineShort} />
        </View>
      </View>
    </>
  );
}

function FlashSaleProductCard({ product }: { product: Product }) {
  const isSoldOut = (product.stock ?? 0) <= 0;
  const originalPrice = product.originalPriceCents && product.originalPriceCents > product.priceCents ? product.originalPriceCents : undefined;
  const description = product.description?.trim() || product.categoryName || product.productType || product.productGroup || product.tag;

  return (
    <Pressable
      accessibilityLabel={`View ${product.name} details`}
      accessibilityRole="button"
      onPress={() => router.push(`/product-details?id=${encodeURIComponent(product.id)}`)}
      style={({ pressed }) => [styles.flashSaleCard, pressed && styles.productTilePressed]}>
      <View style={styles.flashSaleImageWrap}>
        {product.imageUrl ? (
          <Image cachePolicy="memory-disk" contentFit="cover" recyclingKey={`flash-${product.id}`} source={{ uri: product.imageUrl }} style={styles.flashSaleImage} />
        ) : (
          <Image contentFit="cover" source={imageNotFound} style={styles.flashSaleImage} />
        )}
        {isSoldOut ? (
          <View style={styles.flashSaleSoldOutBadge}>
            <Text style={styles.flashSaleSoldOutText}>Sold out</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.flashSaleCardBody}>
        <Text numberOfLines={2} style={styles.flashSaleCardName}>
          {product.name}
        </Text>
        <View style={styles.flashSalePriceRow}>
          <Text style={styles.flashSaleCardPrice}>{formatPhp(product.priceCents)}</Text>
          {originalPrice ? <Text style={styles.flashSaleOriginalPrice}>{formatPhp(originalPrice)}</Text> : null}
        </View>
        <Text numberOfLines={2} style={styles.flashSaleCardMeta}>
          {description}
        </Text>
        <View style={styles.flashSaleRatingRow}>
          <View style={styles.flashSaleStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={11} color="#DDE0DD" fill="transparent" strokeWidth={2} />
            ))}
          </View>
          <Text style={styles.flashSaleRatingText}>(0)</Text>
        </View>
      </View>
    </Pressable>
  );
}

function SectionTitle({
  canViewMore,
  isFlashSale,
  onViewMore,
  title,
}: {
  canViewMore?: boolean;
  isFlashSale?: boolean;
  onViewMore?: () => void;
  title: string;
}) {
  return (
    <View style={[styles.sectionHeader, isFlashSale && styles.flashSaleHeader]}>
      <View style={styles.sectionTitleWrap}>
        <View style={styles.sectionTitleRow}>
          {isFlashSale ? <Zap color={theme.colors.white} fill="transparent" size={20} strokeWidth={2.4} /> : null}
          <Text style={[styles.sectionTitle, isFlashSale && styles.flashSaleTitle]}>{title}</Text>
        </View>
        {isFlashSale ? (
          <View style={styles.flashCountdown}>
            {['00', '00', '00'].map((value, index) => (
              <View key={`${value}-${index}`} style={styles.flashCountdownBox}>
                <Text style={styles.flashCountdownText}>{value}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.sectionTitleLine} />
      </View>
      {canViewMore && onViewMore ? (
        <Pressable accessibilityRole="button" onPress={onViewMore} style={({ pressed }) => [styles.viewMoreButton, pressed && styles.productTilePressed]}>
          <Text style={[styles.viewMoreText, isFlashSale && styles.flashSaleViewMoreText]}>Shop More</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function buildProductSections(products: Product[], allProducts: Product[], seed: string) {
  return productSectionConfig
    .filter((section) => section.isVisible)
    .sort((first, second) => first.order - second.order)
    .map((section) => ({
      ...section,
      products: prioritizeProductsWithImages(getProductsForSection(section.id, products, seed, allProducts)),
    }));
}

function shouldRenderProductSection(section: ProductSectionConfig & { products: Product[] }) {
  return section.id === 'flash-sale' || section.products.length > 0;
}

function getProductsForSection(sectionId: ProductSectionKind, products: Product[], seed: string, allProducts: Product[] = products) {
  switch (sectionId) {
    case 'flash-sale':
      return getFlashSaleProducts(allProducts);
    case 'featured':
      return products.filter(isFeaturedProduct);
    case 'new-arrivals':
      return products.filter(isNewArrivalProduct);
    case 'random':
      return [...products].sort(
        (first, second) =>
          getStableRandomValue(`${seed}:discover:${first.id}`) - getStableRandomValue(`${seed}:discover:${second.id}`),
      );
    case 'floral-products':
      return products.filter(isFloralProduct);
    case 'non-floral-products':
      return products.filter((product) => !isFloralProduct(product));
    default:
      return products;
  }
}

function getFlashSaleProducts(products: Product[]) {
  return products.filter((product) => isActiveProduct(product) && isFlashSaleProduct(product));
}

function prioritizeProductsWithImages(products: Product[]) {
  return [...products].sort((first, second) => Number(hasProductImage(second)) - Number(hasProductImage(first)));
}

function hasProductImage(product: Product) {
  return Boolean(product.imageUrl?.trim());
}

function isFlashSaleProduct(product: Product) {
  const metadata = product as Product & { isFlashSale?: boolean; isPromoted?: boolean };
  const searchableText = [product.name, product.description, product.categoryName, product.productGroup, product.productType, product.tag]
    .filter(Boolean)
    .join(' ');

  return Boolean(
    (product.originalPriceCents && product.originalPriceCents > product.priceCents) ||
      metadata.isFlashSale ||
      metadata.isPromoted ||
      /\b(flash\s*sale|promo|promoted|discount|sale)\b/i.test(searchableText),
  );
}

function isActiveProduct(product: Product) {
  return product.isActive !== false;
}

function isFeaturedProduct(product: Product) {
  const metadata = product as Product & { featured?: boolean; isFeatured?: boolean };

  return Boolean(metadata.featured || metadata.isFeatured || /\b(featured|premium|highlight)\b/i.test(product.tag));
}

function isNewArrivalProduct(product: Product) {
  const metadata = product as Product & { isNew?: boolean };
  const createdTime = product.createdAt ? new Date(product.createdAt).getTime() : Number.NaN;
  const isRecentlyCreated = Number.isFinite(createdTime) && Date.now() - createdTime <= 1000 * 60 * 60 * 24 * 30;

  return Boolean(metadata.isNew || /\b(new|arrival|fresh)\b/i.test(product.tag) || isRecentlyCreated);
}

function isFloralProduct(product: Product) {
  const searchableText = [product.categoryName, product.productGroup, product.productType, product.tag, product.name]
    .filter(Boolean)
    .join(' ');

  if (/\b(non[\s-]?floral|add[\s-]?on|gift|chocolate|teddy|balloon|vase|wrapper|ribbon|card|cake)\b/i.test(searchableText)) {
    return false;
  }

  return /\b(floral|flower|flowers|bouquet|arrangement|rose|roses|orchid|orchids|tulip|tulips|lily|lilies|sunflower|carnation|stems?)\b/i.test(
    searchableText,
  );
}

function splitIntoColumns<T>(items: T[]) {
  return [
    items.filter((_, index) => index % 2 === 0),
    items.filter((_, index) => index % 2 === 1),
  ];
}

function getStableRandomValue(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (Math.abs(hash) % 10000) / 10000;
}

function buildProductListRoute(params: ProductListRouteParams) {
  const searchParams = new URLSearchParams();

  searchParams.set('title', params.title);
  if (params.branch) searchParams.set('branch', params.branch);

  if (params.section) {
    searchParams.set('section', params.section);
  }

  if (params.category) {
    searchParams.set('category', params.category);
  }

  if (params.group) {
    searchParams.set('group', params.group);
  }

  return `/product-list?${searchParams.toString()}` as const;
}

function CatalogSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.bannerSkeleton}>
        <SkeletonBlock style={styles.bannerSkeletonImage} />
      </View>
      <View style={styles.sectionHeader}>
        <View style={styles.skeletonHeaderCopy}>
          <SkeletonBlock style={styles.skeletonTitleLine} />
          <SkeletonBlock style={styles.skeletonLineShort} />
        </View>
      </View>
      <ProductAppendLoader />
    </View>
  );
}

function SkeletonBlock({ style }: { style: object }) {
  const opacity = useRef(new Animated.Value(0.42)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          duration: 760,
          easing: Easing.inOut(Easing.quad),
          toValue: 0.78,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          duration: 760,
          easing: Easing.inOut(Easing.quad),
          toValue: 0.42,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[styles.skeletonBase, style, { opacity }]} />;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: pageBackground,
    flex: 1,
  },
  stickyHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderBottomColor: hairlineColor,
    borderBottomWidth: 1,
    paddingBottom: theme.spacing.sm,
    zIndex: 20,
  },
  branchButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(46, 139, 52, 0.22)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: theme.spacing.lg,
    minHeight: 36,
    paddingHorizontal: 12,
  },
  branchButtonText: {
    color: theme.colors.primary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  branchPicker: {
    backgroundColor: theme.colors.white,
    borderBottomColor: hairlineColor,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    zIndex: 19,
  },
  branchOption: {
    alignItems: 'center',
    borderColor: hairlineColor,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  branchOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  branchOptionText: {
    color: softText,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  branchOptionTextActive: {
    color: theme.colors.white,
  },
  catalogScroll: {
    backgroundColor: pageBackground,
    flex: 1,
  },
  content: {
    gap: theme.spacing.md,
    paddingTop: 0,
  },
  bannerButton: {
    backgroundColor: theme.colors.white,
    overflow: 'hidden',
    width: '100%',
  },
  makeItPersonalBanner: {
    aspectRatio: 1088 / 503,
    backgroundColor: theme.colors.white,
    width: '100%',
  },
  bannerSkeleton: {
    backgroundColor: theme.colors.white,
    overflow: 'hidden',
  },
  bannerSkeletonImage: {
    aspectRatio: 1088 / 503,
    width: '100%',
  },
  unavailablePanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.10)',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    minHeight: 300,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  unavailableIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(46, 139, 52, 0.12)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  unavailableTitle: {
    color: softText,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    textAlign: 'center',
  },
  unavailableText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    minHeight: 46,
    paddingHorizontal: theme.spacing.xl,
  },
  retryButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  searchOverlay: {
    left: theme.spacing.lg,
    position: 'absolute',
    right: theme.spacing.lg,
    zIndex: 60,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 50,
    paddingHorizontal: theme.spacing.lg,
  },
  searchInput: {
    color: softText,
    flex: 1,
    fontSize: 15,
    minWidth: 0,
    paddingVertical: theme.spacing.sm,
  },
  sectionHeader: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderTopColor: 'rgba(31, 42, 36, 0.06)',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  flashSaleHeader: {
    backgroundColor: theme.colors.primary,
    borderTopWidth: 0,
    minHeight: 52,
  },
  sectionTitleWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: theme.spacing.md,
    minWidth: 0,
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  sectionTitle: {
    color: softText,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
  },
  flashSaleTitle: {
    color: theme.colors.white,
    fontSize: 15,
  },
  flashCountdown: {
    flexDirection: 'row',
    gap: 4,
  },
  flashCountdownBox: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 6,
    justifyContent: 'center',
    minHeight: 26,
    minWidth: 26,
    paddingHorizontal: 3,
  },
  flashCountdownText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  sectionTitleLine: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 0,
    marginTop: 0,
    width: 0,
  },
  viewMoreButton: {
    backgroundColor: 'transparent',
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 6,
  },
  viewMoreText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  flashSaleViewMoreText: {
    color: theme.colors.white,
    fontSize: 10,
  },
  productSection: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  skeletonWrap: {
    gap: theme.spacing.lg,
  },
  skeletonBase: {
    backgroundColor: '#E8ECE9',
  },
  skeletonHeaderCopy: {
    gap: theme.spacing.sm,
    width: '58%',
  },
  skeletonTitleLine: {
    borderRadius: theme.radius.sm,
    height: 24,
    width: '100%',
  },
  skeletonLineShort: {
    borderRadius: theme.radius.sm,
    height: 14,
    width: '42%',
  },
  skeletonLineWide: {
    borderRadius: theme.radius.sm,
    height: 16,
    width: '84%',
  },
  productGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  flashSaleRail: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  flashSaleCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 144,
    overflow: 'hidden',
    padding: theme.spacing.sm,
    width: 318,
  },
  flashSaleSkeletonCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 144,
    overflow: 'hidden',
    padding: theme.spacing.sm,
    width: 318,
  },
  flashSaleSkeletonCardPartial: {
    opacity: 0.9,
    width: 206,
  },
  flashSaleSkeletonImage: {
    backgroundColor: 'rgba(31, 42, 36, 0.18)',
    borderRadius: theme.radius.sm,
    height: 116,
    width: 116,
  },
  flashSaleSkeletonBody: {
    flex: 1,
    gap: 9,
    minWidth: 0,
  },
  flashSaleSkeletonLineWide: {
    backgroundColor: 'rgba(31, 42, 36, 0.17)',
    borderRadius: theme.radius.sm,
    height: 15,
    width: '88%',
  },
  flashSaleSkeletonLineMedium: {
    backgroundColor: 'rgba(31, 42, 36, 0.14)',
    borderRadius: theme.radius.sm,
    height: 15,
    width: '58%',
  },
  flashSaleSkeletonLineShort: {
    backgroundColor: 'rgba(31, 42, 36, 0.12)',
    borderRadius: theme.radius.sm,
    height: 14,
    width: '58%',
  },
  flashSaleSkeletonSpacer: {
    height: 36,
  },
  flashSaleImageWrap: {
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.sm,
    height: 116,
    overflow: 'hidden',
    position: 'relative',
    width: 116,
  },
  flashSaleImage: {
    height: '100%',
    width: '100%',
  },
  flashSaleSoldOutBadge: {
    backgroundColor: 'rgba(31, 42, 36, 0.78)',
    borderRadius: theme.radius.pill,
    left: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    position: 'absolute',
    top: 7,
  },
  flashSaleSoldOutText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  flashSaleCardBody: {
    flex: 1,
    gap: 7,
    minWidth: 0,
  },
  flashSaleCardName: {
    color: softText,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  flashSalePriceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  flashSaleCardPrice: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 19,
  },
  flashSaleOriginalPrice: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    textDecorationLine: 'line-through',
  },
  flashSaleCardMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  flashSaleRatingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  flashSaleStars: {
    flexDirection: 'row',
    gap: 1,
  },
  flashSaleRatingText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
  productColumn: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  productCard: {
    borderColor: theme.colors.white,
    borderWidth: 1,
    width: '100%',
  },
  productTile: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  productTilePressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  productImage: {
    aspectRatio: 1,
    backgroundColor: theme.colors.white,
    width: '100%',
  },
  productBody: {
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
});
