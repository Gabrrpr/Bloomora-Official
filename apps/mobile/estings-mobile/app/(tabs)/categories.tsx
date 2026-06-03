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
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Flower2, Search, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBrandHeader } from '@/components/app-brand-header';
import { EmptyState } from '@/components/bloom-ui';
import { formatPhp, type Product } from '@/constants/shop';
import { theme } from '@/constants/theme';
import { shopApi } from '@/services/shop-api';

const pageBackground = '#F5F5F5';
const softText = '#2F3A34';

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [visibleProductCount, setVisibleProductCount] = useState(8);

  const loadCatalog = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const { products: nextProducts } = await shopApi.getCatalog({
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
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const filteredProducts = useMemo(() => {
    return products;
  }, [products]);

  const visibleProducts = filteredProducts.slice(0, 8);
  const lazyVisibleProducts = filteredProducts.slice(0, visibleProductCount);

  const heroProduct = products.find((product) => product.imageUrl) ?? products[0];

  const handleSubmitSearch = useCallback(() => {
    const nextQuery = query.trim();

    router.push(nextQuery ? `/search-results?q=${encodeURIComponent(nextQuery)}` : '/search-results');
  }, [query]);

  const handleCatalogScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);

      if (distanceFromBottom < 420) {
        setVisibleProductCount((current) => Math.min(current + 4, filteredProducts.length));
      }
    },
    [filteredProducts.length],
  );

  useEffect(() => {
    setVisibleProductCount(8);
  }, [products.length]);

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
        ) : (
          <View style={styles.hero}>
            {heroProduct?.imageUrl ? (
              <Image cachePolicy="memory-disk" contentFit="cover" recyclingKey={heroProduct.id} source={{ uri: heroProduct.imageUrl }} style={styles.heroImage} />
            ) : (
              <View style={styles.heroFallback}>
                <Flower2 size={theme.icon.lg} color={theme.colors.primary} />
              </View>
            )}
            <View style={styles.heroOverlay} />
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>Fresh blooms</Text>
              <Text style={styles.title}>Find flowers for every moment</Text>
              <Text style={styles.subtitle}>Browse bouquets, arrangements, and thoughtful add-ons from Estings.</Text>
            </View>
          </View>
        )}

      {isLoading ? null : (
        <SectionTitle
          title="Products"
          subtitle={`${visibleProducts.length} ${visibleProducts.length === 1 ? 'favorite' : 'favorites'}`}
        />
      )}

      {isLoading ? null : errorMessage ? (
        <EmptyState title="Catalog unavailable" description={errorMessage} />
      ) : lazyVisibleProducts.length > 0 ? (
        <View style={styles.productGrid}>
          {lazyVisibleProducts.map((product) => (
            <ProductTile
              key={product.id}
              product={product}
            />
          ))}
        </View>
      ) : (
        <EmptyState title="No products found" description="Try another category or search term." />
      )}
      </ScrollView>
    </View>
  );
}

function SectionTitle({ subtitle, title }: { subtitle: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function ProductTile({
  product,
}: {
  product: Product;
}) {
  const isSoldOut = (product.stock ?? 0) <= 0;

  return (
    <Pressable
      accessibilityLabel={`View ${product.name} details`}
      accessibilityRole="button"
      style={({ pressed }) => [styles.productTile, pressed && styles.productTilePressed]}
      onPress={() => router.push(`/product-details?id=${encodeURIComponent(product.id)}`)}>
      {product.imageUrl ? (
        <Image cachePolicy="memory-disk" contentFit="contain" recyclingKey={product.id} source={{ uri: product.imageUrl }} style={styles.productImage} />
      ) : (
        <View style={styles.productImageFallback}>
          <Flower2 size={theme.icon.lg} color={theme.colors.primary} />
        </View>
      )}
      {isSoldOut ? (
        <View style={styles.soldOutBadge}>
          <Text style={styles.soldOutText}>Sold out</Text>
        </View>
      ) : null}
      <View style={styles.productBody}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productPrice}>{formatPhp(product.priceCents)}</Text>
      </View>
    </Pressable>
  );
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
    paddingTop: theme.spacing.lg,
  },
  hero: {
    borderRadius: theme.radius.lg,
    height: 248,
    justifyContent: 'flex-end',
    marginHorizontal: theme.spacing.lg,
    overflow: 'hidden',
    padding: theme.spacing.lg,
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
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 35, 25, 0.42)',
  },
  heroCopy: {
    gap: theme.spacing.xs,
    maxWidth: 300,
  },
  eyebrow: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.white,
    fontSize: 30,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 36,
  },
  subtitle: {
    color: theme.colors.white,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.92,
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
  sectionSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
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
    backgroundColor: theme.colors.white,
    height: 158,
    width: '100%',
  },
  productImageFallback: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    height: 158,
    justifyContent: 'center',
    width: '100%',
  },
  soldOutBadge: {
    backgroundColor: 'rgba(31, 42, 36, 0.78)',
    borderRadius: theme.radius.pill,
    left: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    position: 'absolute',
    top: theme.spacing.sm,
  },
  soldOutText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  productBody: {
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  productName: {
    color: softText,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    minHeight: 36,
  },
  productPrice: {
    color: theme.colors.primary,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
});
