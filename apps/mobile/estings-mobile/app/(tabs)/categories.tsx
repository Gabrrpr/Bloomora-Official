import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, type Href } from 'expo-router';
import { Image } from 'expo-image';
import {
  Animated,
  Easing,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Search, Star, WifiOff, X, Zap } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBrandHeader } from '@/components/app-brand-header';
import { EmptyState } from '@/components/bloom-ui';
import { ProductCard } from '@/components/product-card';
import { formatPhp, type Product } from '@/constants/shop';
import { theme } from '@/constants/theme';
import { shopApi } from '@/services/shop-api';
import { getStoreBranch, setStoreBranch, type StoreBranch } from '@/services/branch-preference';
import {
  mobileContentService,
  type CategoryBanner,
} from '@/services/mobile-content-service';
import { buildDiscoveryProductOrder, createRecommendationSeed } from '@/utils/product-recommendations';
import type { CategoryHierarchyGroup } from '@/services/shop-api';

const imageNotFound = require('@/assets/images/default-img/ImageNotFound.webp');
const pageBackground = '#F5F5F5';
const hairlineColor = 'rgba(31, 42, 36, 0.09)';
const softText = '#2F3A34';
type ProductSectionKind =
  | 'flash-sale'
  | 'featured'
  | 'new-arrivals'
  | 'random';
type ProductSectionId = ProductSectionKind | `category:${string}`;

type ProductSectionConfig = {
  id: ProductSectionId;
  isVisible: boolean;
  order: number;
  category?: string;
  title: string;
};

const productSectionConfig: ProductSectionConfig[] = [
  { id: 'flash-sale', isVisible: true, order: 5, title: 'Flash Sale' },
  { id: 'featured', isVisible: true, order: 10, title: 'Featured Products' },
  { id: 'new-arrivals', isVisible: true, order: 20, title: 'New Arrivals' },
  { id: 'random', isVisible: true, order: 30, title: 'Discover Something New' },
];
const productSectionPreviewLimit = 12;
const preferredFloralCategoryOrder = [
  'bouquet',
  'funerary arrangement',
  'funeral arrangement',
  'inaugural arrangement',
  'tabletop arrangement',
  'boxed arrangement',
  'box arrangement',
  'vase arrangement',
];
const preferredNonFloralCategoryOrder = [
  'vase',
  'candles',
  'candle',
  'pot',
  'pot fillers',
  'pot filler',
  'baskets',
  'basket',
  'accessory',
  'accessories',
];

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearchBarMounted, setIsSearchBarMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryBanners, setCategoryBanners] = useState<CategoryBanner[]>([]);
  const [categoryHierarchy, setCategoryHierarchy] = useState<CategoryHierarchyGroup[]>([]);
  const [productOrderSeed, setProductOrderSeed] = useState(() => createRecommendationSeed());
  const [query, setQuery] = useState('');
  const [branch, setBranch] = useState<StoreBranch>('manila');
  const [isBranchPickerOpen, setIsBranchPickerOpen] = useState(false);
  const [isCategorySheetMounted, setIsCategorySheetMounted] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const categorySheetProgress = useRef(new Animated.Value(0)).current;
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

  useEffect(() => {
    let active = true;
    void mobileContentService.getCategoryBanners(branch)
      .then((banners) => {
        if (active) {
          setCategoryBanners(banners);
        }
      })
      .catch(() => {
        if (active) {
          setCategoryBanners([]);
        }
      });
    return () => {
      active = false;
    };
  }, [branch]);

  useEffect(() => {
    let active = true;

    void shopApi.getCategoryHierarchy({ branch })
      .then((hierarchy) => {
        if (active) {
          setCategoryHierarchy(hierarchy);
        }
      })
      .catch(() => {
        if (active) {
          setCategoryHierarchy(buildCategoryHierarchyFromProducts(products));
        }
      });

    return () => {
      active = false;
    };
  }, [branch, products]);

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
  const visibleCategoryHierarchy = useMemo(
    () => (categoryHierarchy.length > 0 ? categoryHierarchy : buildCategoryHierarchyFromProducts(products)),
    [categoryHierarchy, products],
  );
  const productSections = useMemo(
    () => buildProductSections(filteredProducts, products, productOrderSeed, visibleCategoryHierarchy),
    [filteredProducts, productOrderSeed, products, visibleCategoryHierarchy],
  );
  const renderableSections = useMemo(
    () => productSections.filter(shouldRenderProductSection),
    [productSections],
  );

  const handleSubmitSearch = useCallback(() => {
    const nextQuery = query.trim();

    setIsSearchOpen(false);
    setIsSearchBarMounted(false);
    router.push(nextQuery ? `/search-results?q=${encodeURIComponent(nextQuery)}&branch=${branch}` : `/search-results?branch=${branch}`);
  }, [branch, query]);

  const handleOpenSearch = useCallback(() => {
    setIsBranchPickerOpen(false);
    setIsCategorySheetOpen(false);
    setIsCategorySheetMounted(false);
    setIsSearchOpen(true);
    setIsSearchBarMounted(true);
    searchBarProgress.stopAnimation();
    Animated.timing(searchBarProgress, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: false,
    }).start();
  }, [searchBarProgress]);

  const handleOpenCategorySheet = useCallback(() => {
    setIsBranchPickerOpen(false);
    setIsCategorySheetOpen(true);
    setIsCategorySheetMounted(true);
    categorySheetProgress.stopAnimation();
    Animated.timing(categorySheetProgress, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: false,
    }).start();
  }, [categorySheetProgress]);

  const handleCloseCategorySheet = useCallback(() => {
    categorySheetProgress.stopAnimation();
    Animated.timing(categorySheetProgress, {
      duration: 180,
      easing: Easing.in(Easing.cubic),
      toValue: 0,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setIsCategorySheetOpen(false);
      setIsCategorySheetMounted(false);
    });
  }, [categorySheetProgress]);

  const handleCloseSearch = useCallback(() => {
    searchBarProgress.stopAnimation();
    Animated.timing(searchBarProgress, {
      duration: 180,
      easing: Easing.in(Easing.cubic),
      toValue: 0,
      useNativeDriver: false,
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

  const handleSelectBranch = useCallback((nextBranch: StoreBranch) => {
    setBranch(nextBranch);
    void setStoreBranch(nextBranch);
    setIsBranchPickerOpen(false);
  }, []);

  const handleSelectCategory = useCallback((category?: string) => {
    setIsCategorySheetOpen(false);
    setIsCategorySheetMounted(false);
    router.push(buildProductListRoute(category ? { branch, category, title: category } : { branch, title: 'All Products' }));
  }, [branch]);
  const renderCatalogSection = useCallback(
    ({ item: section }: { item: ProductSectionConfig & { products: Product[] } }) => (
      <ProductSection
        onViewMore={() =>
          handleOpenProductList(
            section.category
              ? { category: section.category, title: section.title }
              : { section: section.id as ProductSectionKind, title: section.title },
          )
        }
        products={section.products}
        sectionId={section.id}
        title={section.title}
      />
    ),
    [handleOpenProductList],
  );
  const listHeader = isLoading ? (
    <CatalogSkeleton />
  ) : errorMessage ? (
    <CatalogUnavailableState message={errorMessage} onRetry={() => loadCatalog(true)} />
  ) : (
    <CategoryBannerCarousel banners={categoryBanners} />
  );
  const listEmpty = isLoading || errorMessage ? null : (
    <EmptyState
      title="No products found"
      description="Try another category or search term."
    />
  );

  return (
    <View style={styles.screen}>
      <View style={styles.stickyHeader}>
        <AppBrandHeader
          onMenuPress={handleOpenCategorySheet}
          onSearchPress={handleOpenSearch}
          onStorePress={() => {
            setIsCategorySheetOpen(false);
            setIsCategorySheetMounted(false);
            setIsBranchPickerOpen((current) => !current);
          }}
          showMenuAction
          showStoreAction
        />
        <AnnouncementStrip branch={branch} />
      </View>
      {isBranchPickerOpen ? (
        <BranchPopover branch={branch} onClose={() => setIsBranchPickerOpen(false)} onSelect={handleSelectBranch} topInset={insets.top} />
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

      {isCategorySheetMounted ? (
        <CategorySelectorSheet
          hierarchy={categoryHierarchy}
          isOpen={isCategorySheetOpen}
          onClose={handleCloseCategorySheet}
          onSelectCategory={handleSelectCategory}
          progress={categorySheetProgress}
        />
      ) : null}

      <FlatList
        data={isLoading || errorMessage ? [] : renderableSections}
        keyExtractor={(section) => section.id}
        ListEmptyComponent={listEmpty}
        ListHeaderComponent={listHeader}
        initialNumToRender={Platform.OS === 'android' ? 3 : 4}
        maxToRenderPerBatch={Platform.OS === 'android' ? 2 : 3}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefreshCatalog} tintColor={theme.colors.primary} />}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={renderCatalogSection}
        showsVerticalScrollIndicator={false}
        style={styles.catalogScroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]}
        updateCellsBatchingPeriod={70}
        windowSize={Platform.OS === 'android' ? 5 : 7}
      />
    </View>
  );
}

function BranchPopover({
  branch,
  onClose,
  onSelect,
  topInset,
}: {
  branch: StoreBranch;
  onClose: () => void;
  onSelect: (branch: StoreBranch) => void;
  topInset: number;
}) {
  return (
    <View pointerEvents="box-none" style={styles.branchOverlay}>
      <Pressable accessibilityLabel="Close branch selector" onPress={onClose} style={StyleSheet.absoluteFill} />
      <View style={[styles.branchPicker, { top: topInset + 66 }]}>
        {(['manila', 'pampanga'] as StoreBranch[]).map((option) => {
          const isSelected = branch === option;
          const label = option === 'manila' ? 'Manila' : 'Pampanga';

          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(option)}
              style={({ pressed }) => [
                styles.branchOption,
                isSelected && styles.branchOptionActive,
                pressed && styles.productTilePressed,
              ]}>
              <Text style={[styles.branchOptionText, isSelected && styles.branchOptionTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function CategorySelectorSheet({
  hierarchy,
  isOpen,
  onClose,
  onSelectCategory,
  progress,
}: {
  hierarchy: CategoryHierarchyGroup[];
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category?: string) => void;
  progress: Animated.Value;
}) {
  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.34],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-320, 0],
  });

  return (
    <View pointerEvents={isOpen ? 'auto' : 'none'} style={styles.categorySheetOverlay}>
      <Animated.View style={[styles.categorySheetBackdrop, { opacity: backdropOpacity }]}>
        <Pressable accessibilityLabel="Close categories" onPress={onClose} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[styles.categorySheet, { transform: [{ translateX }] }]}>
        <View style={styles.categorySheetHeader}>
          <Text style={styles.categorySheetTitle}>All Categories</Text>
          <Pressable accessibilityLabel="Close categories" accessibilityRole="button" hitSlop={8} onPress={onClose}>
            <X size={theme.icon.sm} color={theme.colors.textMuted} />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.categorySheetContent}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onSelectCategory()}
            style={({ pressed }) => [styles.allProductsButton, pressed && styles.categoryMenuItemPressed]}>
            <Text style={styles.allProductsText}>All Products</Text>
          </Pressable>

          {hierarchy.length > 0 ? (
            hierarchy.map((group) => (
              <View key={group.title} style={styles.categoryGroup}>
                <Text style={styles.categoryGroupTitle}>{formatCategoryGroupTitle(group.title)}</Text>
                {group.items.map((category) => (
                  <Pressable
                    key={`${group.title}-${category}`}
                    accessibilityRole="button"
                    onPress={() => onSelectCategory(category)}
                    style={({ pressed }) => [styles.categoryMenuItem, pressed && styles.categoryMenuItemPressed]}>
                    <Text numberOfLines={2} style={styles.categoryMenuItemText}>{category}</Text>
                  </Pressable>
                ))}
              </View>
            ))
          ) : (
            <Text style={styles.categoryEmptyText}>Categories are unavailable.</Text>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function AnnouncementStrip({ branch }: { branch: StoreBranch }) {
  const [activeMessage, setActiveMessage] = useState<0 | 1>(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(opacity, {
        duration: 180,
        easing: Easing.inOut(Easing.cubic),
        toValue: 0,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (!finished) {
          return;
        }

        setActiveMessage((current) => (current === 0 ? 1 : 0));
        Animated.timing(opacity, {
          duration: 220,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: false,
        }).start();
      });
    }, 4000);

    return () => {
      clearInterval(interval);
      opacity.stopAnimation();
    };
  }, [opacity]);

  const isBouquetMessage = activeMessage === 0;
  const branchName = branch === 'manila' ? 'Manila' : 'Pampanga';

  return (
    <Pressable
      accessibilityLabel={
        isBouquetMessage
          ? 'Build your own bouquet. Build now.'
          : `You are currently viewing our ${branchName} branch`
      }
      accessibilityRole={isBouquetMessage ? 'button' : 'text'}
      disabled={!isBouquetMessage}
      onPress={() => router.push({ pathname: '/(tabs)/generate', params: { frame: 'selection' } })}
      style={({ pressed }) => [styles.announcementStrip, pressed && styles.announcementStripPressed]}>
      <Animated.Text style={[styles.announcementText, { opacity }]}>
        {isBouquetMessage ? (
          <>
            Build your own bouquet - <Text style={styles.announcementLink}>BUILD NOW!</Text>
          </>
        ) : (
          `You are currently viewing our ${branchName} branch`
        )}
      </Animated.Text>
    </Pressable>
  );
}

function CategoryBannerCarousel({ banners }: { banners: CategoryBanner[] }) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const openBanner = useCallback((banner: CategoryBanner) => {
    const action = banner.action;
    if (action.type === 'product') {
      router.push(`/product-details?id=${encodeURIComponent(action.targetId)}`);
      return;
    }
    if (action.type === 'voucher') {
      router.push(`/(tabs)/cart?voucher=${encodeURIComponent(action.code)}` as Href);
      return;
    }
    if (action.type === 'feature') {
      router.push(action.route as Href);
    }
  }, []);

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={styles.bannerCarousel}>
      {banners.length === 0 ? (
        <View style={styles.makeItPersonalBanner} />
      ) : width > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          decelerationRate="fast"
          onMomentumScrollEnd={(event) => {
            setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));
          }}
          showsHorizontalScrollIndicator={false}>
          {banners.map((banner) => (
            <Pressable
              key={banner.id}
              accessibilityLabel={banner.accessibleLabel}
              accessibilityRole={banner.action.type === 'none' ? 'image' : 'button'}
              disabled={banner.action.type === 'none'}
              onPress={() => openBanner(banner)}
              style={({ pressed }) => [
                styles.bannerButton,
                { width },
                pressed && styles.productTilePressed,
              ]}>
              <Image
                contentFit="cover"
                recyclingKey={banner.media.id}
                source={{ uri: banner.media.url }}
                style={styles.makeItPersonalBanner}
                transition={180}
              />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      {banners.length > 1 ? (
        <View style={styles.bannerDots}>
          {banners.map((banner, index) => (
            <View
              key={banner.id}
              style={[styles.bannerDot, activeIndex === index && styles.bannerDotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
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
          top: topInset + 104,
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
  sectionId: ProductSectionId;
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
  const flashCountdown = usePhilippineMidnightCountdown();

  return (
    <View style={[styles.sectionHeader, isFlashSale && styles.flashSaleHeader]}>
      <View style={styles.sectionTitleWrap}>
        <View style={styles.sectionTitleRow}>
          {isFlashSale ? <Zap color={theme.colors.white} fill="transparent" size={20} strokeWidth={2.4} /> : null}
          <Text style={[styles.sectionTitle, isFlashSale && styles.flashSaleTitle]}>{title}</Text>
        </View>
        {isFlashSale ? (
          <View style={styles.flashCountdown}>
            {flashCountdown.map((value, index) => (
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

function usePhilippineMidnightCountdown() {
  const [parts, setParts] = useState(() => getPhilippineMidnightCountdownParts());

  useEffect(() => {
    const timer = setInterval(() => {
      setParts(getPhilippineMidnightCountdownParts());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return parts;
}

function getPhilippineMidnightCountdownParts() {
  const phOffsetMs = 8 * 60 * 60 * 1000;
  const phNowMs = Date.now() + phOffsetMs;
  const phNow = new Date(phNowMs);
  const nextMidnightPhMs = Date.UTC(phNow.getUTCFullYear(), phNow.getUTCMonth(), phNow.getUTCDate() + 1, 0, 0, 0);
  const diffSeconds = Math.max(0, Math.floor((nextMidnightPhMs - phNowMs) / 1000));
  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  return [hours, minutes, seconds].map((value) => value.toString().padStart(2, '0'));
}

function buildCategoryHierarchyFromProducts(products: Product[]): CategoryHierarchyGroup[] {
  const groups = new Map<string, Set<string>>();

  for (const product of products) {
    const category = product.categoryName?.trim() || product.tag?.trim();

    if (!category || /^add[\s-]?on$/i.test(category)) {
      continue;
    }

    const groupTitle = product.productGroup?.trim() || (isLikelyNonFloralCategory(category) ? 'Non-Floral' : 'Floral');
    const groupCategories = groups.get(groupTitle) ?? new Set<string>();
    groupCategories.add(category);
    groups.set(groupTitle, groupCategories);
  }

  return Array.from(groups, ([title, items]) => ({
    title,
    items: Array.from(items).sort((first, second) => compareCategoryNames(first, second, title)),
  })).sort(compareCategoryGroups);
}

function compareCategoryGroups(first: CategoryHierarchyGroup, second: CategoryHierarchyGroup) {
  return getCategoryGroupPriority(first.title) - getCategoryGroupPriority(second.title) || first.title.localeCompare(second.title);
}

function compareCategoryNames(first: string, second: string, groupTitle: string) {
  const firstPriority = getCategoryNamePriority(first, groupTitle);
  const secondPriority = getCategoryNamePriority(second, groupTitle);

  return firstPriority - secondPriority || first.localeCompare(second);
}

function getCategoryNamePriority(category: string, groupTitle: string) {
  const normalizedCategory = normalizeCategoryValue(category);
  const order = getCategoryGroupPriority(groupTitle) === 1 ? preferredNonFloralCategoryOrder : preferredFloralCategoryOrder;
  const index = order.indexOf(normalizedCategory);

  return index === -1 ? order.length : index;
}

function getCategoryGroupPriority(title: string) {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes('floral') && !normalizedTitle.includes('non')) {
    return 0;
  }

  if (normalizedTitle.includes('non')) {
    return 1;
  }

  return 2;
}

function formatCategoryGroupTitle(title: string) {
  return title.replace(/\s*-\s*/g, '-').toUpperCase();
}

function normalizeCategoryValue(value?: string) {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function isLikelyNonFloralCategory(category: string) {
  return /\b(non[\s-]?floral|accessory|basket|candle|card|gift|pot|ribbon|tool|vase|wrapper|wrapping)\b/i.test(category);
}

function buildProductSections(
  products: Product[],
  allProducts: Product[],
  seed: string,
  categoryHierarchy: CategoryHierarchyGroup[],
) {
  const staticSections = productSectionConfig
    .filter((section) => section.isVisible)
    .sort((first, second) => first.order - second.order)
    .map((section) => ({
      ...section,
      products: prioritizeProductsWithImages(getProductsForSection(section.id as ProductSectionKind, products, seed, allProducts)),
    }));

  return [
    ...staticSections,
    ...buildCategoryProductSections(products, categoryHierarchy),
  ];
}

function shouldRenderProductSection(section: ProductSectionConfig & { products: Product[] }) {
  return section.id === 'flash-sale' || section.products.length > 0;
}

function buildCategoryProductSections(products: Product[], hierarchy: CategoryHierarchyGroup[]) {
  const addedCategories = new Set<string>();
  const sections: (ProductSectionConfig & { products: Product[] })[] = [];

  for (const group of hierarchy) {
    const orderedCategories = [...group.items].sort((first, second) => compareCategoryNames(first, second, group.title));

    for (const category of orderedCategories) {
      const normalizedCategory = normalizeCategoryValue(category);

      if (!normalizedCategory || addedCategories.has(normalizedCategory)) {
        continue;
      }

      const categoryProducts = products.filter((product) => normalizeCategoryValue(product.categoryName || product.tag) === normalizedCategory);

      if (categoryProducts.length === 0) {
        continue;
      }

      addedCategories.add(normalizedCategory);
      sections.push({
        category,
        id: `category:${normalizedCategory}`,
        isVisible: true,
        order: getCategoryGroupPriority(group.title),
        products: prioritizeProductsWithImages(categoryProducts),
        title: category,
      });
    }
  }

  return sections;
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
  return <View style={[styles.skeletonBase, style]} />;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: pageBackground,
    flex: 1,
  },
  stickyHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    zIndex: 20,
  },
  announcementStrip: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 6,
  },
  announcementStripPressed: {
    backgroundColor: theme.colors.primaryDark,
  },
  announcementText: {
    color: theme.colors.white,
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
  announcementLink: {
    fontFamily: 'Inter_700Bold',
    textDecorationLine: 'underline',
  },
  branchOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 70,
  },
  branchPicker: {
    backgroundColor: theme.colors.white,
    borderColor: hairlineColor,
    borderRadius: 16,
    borderWidth: 1,
    boxShadow: '0 18px 36px rgba(31, 42, 36, 0.16)',
    elevation: 8,
    gap: 8,
    padding: 10,
    position: 'absolute',
    right: theme.spacing.md,
    width: 176,
    zIndex: 71,
  },
  branchOption: {
    alignItems: 'center',
    borderColor: hairlineColor,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
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
  categorySheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
  },
  categorySheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  categorySheet: {
    backgroundColor: theme.colors.white,
    borderRightColor: hairlineColor,
    borderRightWidth: 1,
    bottom: 0,
    left: 0,
    maxWidth: 330,
    position: 'absolute',
    top: 0,
    width: '84%',
  },
  categorySheetHeader: {
    alignItems: 'center',
    borderBottomColor: hairlineColor,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 72,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  categorySheetTitle: {
    color: '#111827',
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 18,
    letterSpacing: 0,
  },
  categorySheetContent: {
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 44,
    paddingTop: theme.spacing.lg,
  },
  allProductsButton: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  allProductsText: {
    color: theme.colors.primary,
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 15,
    lineHeight: 20,
  },
  categoryGroup: {
    gap: theme.spacing.sm,
  },
  categoryGroupTitle: {
    color: '#9CA3AF',
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 13,
    letterSpacing: 0.8,
    lineHeight: 18,
  },
  categoryMenuItem: {
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  categoryMenuItemPressed: {
    backgroundColor: 'rgba(46, 139, 52, 0.08)',
  },
  categoryMenuItemText: {
    color: '#4B5563',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    lineHeight: 21,
  },
  categoryEmptyText: {
    color: theme.colors.textMuted,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
  },
  catalogScroll: {
    backgroundColor: pageBackground,
    flex: 1,
  },
  content: {
    gap: 0,
    paddingTop: 0,
  },
  bannerButton: {
    backgroundColor: theme.colors.white,
    overflow: 'hidden',
    width: '100%',
  },
  bannerCarousel: {
    backgroundColor: theme.colors.white,
    overflow: 'hidden',
    width: '100%',
  },
  bannerDots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 9,
  },
  bannerDot: {
    backgroundColor: '#CBD5E1',
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  bannerDotActive: {
    backgroundColor: theme.colors.primary,
    width: 18,
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
