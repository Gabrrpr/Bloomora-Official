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
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { ChevronDown, ImageOff, MapPin, Search, WifiOff, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBrandHeader } from '@/components/app-brand-header';
import { EmptyState } from '@/components/bloom-ui';
import { ProductCard } from '@/components/product-card';
import { formatPhp, type Product } from '@/constants/shop';
import { theme } from '@/constants/theme';
import { shopApi, type ShopHeroSlide } from '@/services/shop-api';

const pageBackground = '#F5F5F5';
const softText = '#2F3A34';
type ShopBranch = 'all' | 'manila' | 'pampanga';

const shopBranches: { label: string; value: ShopBranch }[] = [
  { label: 'All', value: 'all' },
  { label: 'Manila', value: 'manila' },
  { label: 'Pampanga', value: 'pampanga' },
];

const defaultShopHero: ShopHeroSlide = {
  accent: theme.colors.primary,
  cta: 'Shop Flowers',
  ctaSecondary: 'Make It Personal',
  ctaSecondaryNav: 'create',
  description:
    'Since 1959, Esting\'s has been part of countless moments big and small. Every arrangement is made by hand with fresh flowers and genuine care.',
  headline: 'Fresh Blooms,\nSince 1959',
  id: 'mobile-shop-default',
  tag: 'Esting\'s Flower International Inc.',
};

const defaultShopHeroes: ShopHeroSlide[] = [
  defaultShopHero,
  {
    accent: '#e11d48',
    cta: 'Shop Flowers',
    ctaSecondary: 'Explore Collection',
    ctaSecondaryNav: 'shop',
    description:
      'Whether it is an apology, a misunderstanding, or a way to say you care, flowers can say it simply.',
    headline: 'Let flowers\ndo the talking',
    id: 'mobile-shop-apology',
    tag: 'Made a mistake?',
  },
  {
    accent: '#7c3aed',
    cta: 'Try It Now',
    ctaSecondary: 'See Examples',
    ctaSecondaryNav: 'create',
    description:
      'Describe your ideal bouquet or build your own arrangement through Mix and Match.',
    headline: 'Flowers,\nMade Your Way',
    id: 'mobile-shop-personal',
    tag: 'Make It Personal',
  },
  {
    accent: '#d97706',
    cta: 'Shop Flowers',
    ctaSecondary: 'View Occasions',
    ctaSecondaryNav: 'occasions',
    description:
      'From everyday surprises to big moments, fresh arrangements help express what you feel.',
    headline: 'Simple Ways\nto Show You Care',
    id: 'mobile-shop-moments',
    tag: 'Fresh Flowers, For Any Moment',
  },
];

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAppendingProducts, setIsAppendingProducts] = useState(false);
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<ShopBranch>('all');
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [shopHeroes, setShopHeroes] = useState<ShopHeroSlide[]>(defaultShopHeroes);
  const [visibleProductCount, setVisibleProductCount] = useState(4);
  const lastProductBatchAt = useRef(0);
  const productBatchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCatalog = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const { products: nextProducts } = await shopApi.getCatalog({
        branch: selectedBranch,
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
  }, [selectedBranch]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    let isActive = true;

    shopApi
      .getHeroSlides()
      .then((data) => {
        if (isActive && data.slides.length > 0) {
          setShopHeroes(data.slides);
          setActiveHeroIndex(0);
        }
      })
      .catch(() => {});

    return () => {
      isActive = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    if (selectedBranch === 'all') {
      return products;
    }

    return products.filter((product) => {
      const branch = normalizeProductBranch(product.branch);

      return branch === selectedBranch;
    });
  }, [products, selectedBranch]);

  const lazyVisibleProducts = filteredProducts.slice(0, visibleProductCount);
  const canAppendProducts = visibleProductCount < filteredProducts.length;
  const selectedBranchLabel = shopBranches.find((branch) => branch.value === selectedBranch)?.label ?? 'All';

  const handleSubmitSearch = useCallback(() => {
    const nextQuery = query.trim();

    router.push(nextQuery ? `/search-results?q=${encodeURIComponent(nextQuery)}` : '/search-results');
  }, [query]);

  const handleCatalogScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);

      if (distanceFromBottom < 420 && canAppendProducts && Date.now() - lastProductBatchAt.current > 700 && !isAppendingProducts) {
        lastProductBatchAt.current = Date.now();
        setIsAppendingProducts(true);

        productBatchTimer.current = setTimeout(() => {
          setVisibleProductCount((current) => Math.min(current + 4, filteredProducts.length));
          setIsAppendingProducts(false);
          productBatchTimer.current = null;
        }, 260);
      }
    },
    [canAppendProducts, filteredProducts.length, isAppendingProducts],
  );

  useEffect(() => {
    setVisibleProductCount(4);
    lastProductBatchAt.current = 0;
    setIsAppendingProducts(false);

    if (productBatchTimer.current) {
      clearTimeout(productBatchTimer.current);
      productBatchTimer.current = null;
    }
  }, [filteredProducts.length, selectedBranch]);

  useEffect(() => {
    return () => {
      if (productBatchTimer.current) {
        clearTimeout(productBatchTimer.current);
      }
    };
  }, []);

  return (
    <View style={styles.screen}>
      <View style={styles.stickyHeader}>
        <AppBrandHeader showSearchAction={false} />

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={theme.icon.sm} color={theme.colors.textMuted} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setQuery}
              placeholder="Search flowers, gifts, colors"
              placeholderTextColor={theme.colors.textMuted}
              returnKeyType="search"
              style={styles.searchInput}
              onSubmitEditing={handleSubmitSearch}
              value={query}
            />
            {query ? (
              <Pressable
                accessibilityLabel="Clear search"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  setQuery('');
                }}>
                <X size={theme.icon.sm} color={theme.colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
          <BranchSelector
            isOpen={isBranchMenuOpen}
            selectedBranch={selectedBranch}
            onSelect={(branch) => {
              setSelectedBranch(branch);
              setIsBranchMenuOpen(false);
            }}
            onToggle={() => setIsBranchMenuOpen((current) => !current)}
          />
        </View>
      </View>

      <ScrollView
        onScroll={handleCatalogScroll}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadCatalog(true)} tintColor={theme.colors.primary} />}
        scrollEventThrottle={160}
        showsVerticalScrollIndicator={false}
        style={styles.catalogScroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]}>
        {isLoading ? (
          <CatalogSkeleton />
        ) : errorMessage ? (
          <CatalogUnavailableState message={errorMessage} onRetry={() => loadCatalog(true)} />
        ) : (
          <ShopCmsHeroCarousel
            activeIndex={activeHeroIndex}
            heroes={shopHeroes}
            onActiveIndexChange={setActiveHeroIndex}
            width={width}
          />
        )}

      {isLoading || errorMessage ? null : (
        <SectionTitle
          title="Products"
        />
      )}

      {isLoading || errorMessage ? null : lazyVisibleProducts.length > 0 ? (
        <View style={styles.productGrid}>
          {lazyVisibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
          {isAppendingProducts ? <ProductAppendLoader /> : null}
          {!isAppendingProducts && canAppendProducts ? <View style={styles.productScrollBuffer} /> : null}
        </View>
      ) : (
        <EmptyState
          title="No products found"
          description={
            selectedBranch === 'all'
              ? 'Try another category or search term.'
              : `No products are listed for ${selectedBranchLabel} yet. Try All branches.`
          }
        />
      )}
      </ScrollView>
    </View>
  );
}

function ShopCmsHeroCarousel({
  activeIndex,
  heroes,
  onActiveIndexChange,
  width,
}: {
  activeIndex: number;
  heroes: ShopHeroSlide[];
  onActiveIndexChange: (index: number) => void;
  width: number;
}) {
  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
      onActiveIndexChange(Math.min(Math.max(nextIndex, 0), heroes.length - 1));
    },
    [heroes.length, onActiveIndexChange, width],
  );

  return (
    <View style={styles.heroCarousel}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}>
        {heroes.map((hero) => (
          <ShopCmsHero hero={hero} key={String(hero.id)} width={width} />
        ))}
      </ScrollView>
      <View style={styles.heroDots}>
        {heroes.map((hero, index) => (
          <View
            key={`dot-${hero.id}`}
            style={[
              styles.heroDot,
              index === activeIndex && styles.heroDotActive,
              index === activeIndex && { backgroundColor: hero.accent || theme.colors.primary },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function ShopCmsHero({ hero, width }: { hero: ShopHeroSlide; width: number }) {
  const accent = hero.accent || theme.colors.primary;
  const imageUrl = resolveCmsImage(hero.image);

  return (
    <View style={[styles.hero, { backgroundColor: accent, width }]}>
      {imageUrl ? (
        <Image cachePolicy="memory-disk" contentFit="cover" source={{ uri: imageUrl }} style={styles.heroImage} />
      ) : (
        <View style={styles.heroTexture}>
          <View style={[styles.heroAccentCircle, { borderColor: 'rgba(255, 255, 255, 0.24)' }]} />
          <View style={[styles.heroAccentLine, { backgroundColor: 'rgba(255, 255, 255, 0.18)' }]} />
        </View>
      )}
      <View style={styles.heroOverlay} />
      <View style={styles.heroCopy}>
        <Text numberOfLines={1} style={[styles.eyebrow, { backgroundColor: `${accent}88` }]}>
          {hero.tag}
        </Text>
        <Text numberOfLines={2} style={styles.title}>
          {hero.headline.split('\n').slice(0, 2).map((line, index, lines) => (
            <Text key={`${line}-${index}`}>
              {line}
              {index < lines.length - 1 ? '\n' : ''}
            </Text>
          ))}
        </Text>
        <Text numberOfLines={2} style={styles.subtitle}>
          {hero.description}
        </Text>
        <View style={styles.heroActions}>
          <Pressable accessibilityRole="button" onPress={() => {}} style={({ pressed }) => [styles.heroPrimaryButton, pressed && styles.productTilePressed]}>
            <Text style={styles.heroPrimaryButtonText}>{hero.cta || 'Shop Flowers'}</Text>
          </Pressable>
          {hero.ctaSecondary ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (hero.ctaSecondaryNav === 'create') {
                  router.push('/create/describe');
                }
              }}
              style={({ pressed }) => [styles.heroSecondaryButton, pressed && styles.productTilePressed]}>
              <Text style={styles.heroSecondaryButtonText}>{hero.ctaSecondary}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function resolveCmsImage(image?: string | null) {
  const trimmedImage = image?.trim();

  if (!trimmedImage) {
    return undefined;
  }

  return /^https?:\/\//i.test(trimmedImage) ? trimmedImage : undefined;
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
  return (
    <>
      {[0, 1, 2, 3].map((item) => (
        <View key={`append-${item}`} style={styles.productTile}>
          <SkeletonBlock style={styles.productImage} />
          <View style={styles.productBody}>
            <SkeletonBlock style={styles.skeletonLineWide} />
            <SkeletonBlock style={styles.skeletonLineShort} />
          </View>
        </View>
      ))}
    </>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    </View>
  );
}

function BranchSelector({
  isOpen,
  onSelect,
  onToggle,
  selectedBranch,
}: {
  isOpen: boolean;
  onSelect: (branch: ShopBranch) => void;
  onToggle: () => void;
  selectedBranch: ShopBranch;
}) {
  const selectedLabel = shopBranches.find((branch) => branch.value === selectedBranch)?.label ?? 'All';

  return (
    <View style={styles.branchSelectorWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={onToggle}
        style={({ pressed }) => [styles.branchTrigger, pressed && styles.branchButtonPressed]}>
        <MapPin size={14} color={theme.colors.primary} strokeWidth={2.2} />
        <View style={styles.branchTriggerCopy}>
          <Text style={styles.branchTriggerLabel}>Branch</Text>
          <Text numberOfLines={1} style={styles.branchTriggerText}>{selectedLabel}</Text>
        </View>
        <ChevronDown size={14} color={theme.colors.textMuted} strokeWidth={2.2} />
      </Pressable>
      {isOpen ? (
        <View style={styles.branchMenu}>
        {shopBranches.map((branch) => {
          const isSelected = branch.value === selectedBranch;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={branch.value}
              onPress={() => onSelect(branch.value)}
              style={({ pressed }) => [
                styles.branchButton,
                isSelected && styles.branchButtonActive,
                pressed && styles.branchButtonPressed,
              ]}>
              <Text style={[styles.branchButtonText, isSelected && styles.branchButtonTextActive]}>
                {branch.label}
              </Text>
            </Pressable>
          );
        })}
        </View>
      ) : null}
    </View>
  );
}


function normalizeProductBranch(branch?: string) {
  const normalizedBranch = branch?.trim().toLowerCase();

  if (!normalizedBranch) {
    return undefined;
  }

  if (normalizedBranch.includes('manila')) {
    return 'manila';
  }

  if (normalizedBranch.includes('pampanga')) {
    return 'pampanga';
  }

  if (normalizedBranch === 'all') {
    return 'all';
  }

  return normalizedBranch;
}

function CatalogSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.hero}>
        <SkeletonBlock style={styles.heroImage} />
      </View>
      <View style={styles.sectionHeader}>
        <View style={styles.skeletonHeaderCopy}>
          <SkeletonBlock style={styles.skeletonTitleLine} />
          <SkeletonBlock style={styles.skeletonLineShort} />
        </View>
      </View>
      <View style={styles.productGrid}>
        {[0, 1, 2, 3].map((item) => (
          <View key={`product-${item}`} style={styles.productTile}>
            <SkeletonBlock style={styles.productImage} />
            <View style={styles.productBody}>
              <SkeletonBlock style={styles.skeletonLineWide} />
              <SkeletonBlock style={styles.skeletonLineShort} />
            </View>
          </View>
        ))}
      </View>
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
    backgroundColor: theme.colors.white,
    borderBottomColor: 'rgba(31, 42, 36, 0.08)',
    borderBottomWidth: 1,
    elevation: 4,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    shadowColor: '#1F2A24',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    zIndex: 20,
  },
  catalogScroll: {
    backgroundColor: pageBackground,
    flex: 1,
  },
  content: {
    gap: theme.spacing.lg,
    paddingTop: 0,
  },
  heroCarousel: {
    backgroundColor: theme.colors.white,
    overflow: 'hidden',
    position: 'relative',
  },
  hero: {
    height: 218,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.surfaceAlt,
    height: '100%',
    width: '100%',
  },
  heroFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    justifyContent: 'center',
  },
  heroTexture: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  heroAccentCircle: {
    borderRadius: 140,
    borderWidth: 1,
    height: 230,
    position: 'absolute',
    right: -78,
    top: -66,
    width: 230,
  },
  heroAccentLine: {
    borderRadius: theme.radius.pill,
    height: 3,
    left: theme.spacing.lg,
    position: 'absolute',
    right: theme.spacing.lg,
    top: theme.spacing.lg,
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
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  heroCopy: {
    gap: 7,
    maxWidth: 288,
  },
  eyebrow: {
    color: theme.colors.white,
    alignSelf: 'flex-start',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 4,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.white,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 31,
  },
  subtitle: {
    color: theme.colors.white,
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.9,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    paddingTop: 5,
  },
  heroPrimaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.pill,
    justifyContent: 'center',
    minHeight: 35,
    paddingHorizontal: theme.spacing.md,
  },
  heroPrimaryButtonText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  heroSecondaryButton: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.46)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 35,
    paddingHorizontal: theme.spacing.md,
  },
  heroSecondaryButtonText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  heroDots: {
    alignItems: 'center',
    bottom: 10,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  heroDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    borderRadius: theme.radius.pill,
    height: 5,
    width: 5,
  },
  heroDotActive: {
    width: 18,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 48,
    paddingHorizontal: theme.spacing.lg,
  },
  searchInput: {
    color: softText,
    flex: 1,
    fontSize: 15,
    minWidth: 0,
    paddingVertical: theme.spacing.sm,
  },
  branchSelectorWrap: {
    position: 'relative',
    width: 132,
    zIndex: 30,
  },
  branchTrigger: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: theme.spacing.xs,
  },
  branchTriggerCopy: {
    flex: 1,
    minWidth: 0,
  },
  branchTriggerLabel: {
    color: theme.colors.textMuted,
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 11,
  },
  branchTriggerText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 15,
  },
  branchMenu: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 54,
    width: 128,
    zIndex: 40,
  },
  branchButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderBottomColor: theme.colors.subtleBorder,
    borderBottomWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
  },
  branchButtonActive: {
    backgroundColor: theme.colors.greenSoft,
  },
  branchButtonPressed: {
    opacity: 0.78,
  },
  branchButtonText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 17,
  },
  branchButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  categoryCardSection: {
    gap: theme.spacing.md,
  },
  categoryCards: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  categoryCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    overflow: 'hidden',
    width: 188,
  },
  categoryCardImage: {
    backgroundColor: theme.colors.surfaceAlt,
    height: 126,
    width: '100%',
  },
  categoryCardFallback: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    height: 126,
    justifyContent: 'center',
    width: '100%',
  },
  categoryCardBody: {
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  categoryCardTitle: {
    color: softText,
    fontSize: 17,
    fontWeight: '600',
  },
  categoryCardMeta: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  categoryCardPreview: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    color: softText,
    fontSize: 22,
    fontWeight: '600',
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
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  productScrollBuffer: {
    height: 32,
    width: '100%',
  },
  productTile: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    overflow: 'hidden',
    position: 'relative',
    width: '47.8%',
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
