import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Check, Flower2, Heart, RefreshCw, Search, ShoppingBag, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBrandHeader } from '@/components/app-brand-header';
import { EmptyState } from '@/components/bloom-ui';
import { formatPhp, type Category, type Product } from '@/constants/shop';
import { theme } from '@/constants/theme';
import { addGuestCartItem } from '@/services/guest-cart';
import { shopApi } from '@/services/shop-api';

const allCategory: Category = {
  id: 'all',
  itemCount: 0,
  name: 'All',
};

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [recentlyAddedProductId, setRecentlyAddedProductId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(allCategory.id);

  const loadCatalog = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [nextProducts, nextCategories] = await Promise.all([
        shopApi.getProducts(),
        shopApi.getCategories(),
      ]);

      setProducts(nextProducts);
      setCategories(nextCategories);
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

  const categoryOptions = useMemo(
    () => [{ ...allCategory, itemCount: products.length }, ...categories],
    [categories, products.length],
  );

  const selectedCategory = categoryOptions.find((category) => category.id === selectedCategoryId) ?? categoryOptions[0];

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = selectedCategoryId === allCategory.id || product.categoryId === selectedCategoryId;
      const searchableText = [
        product.name,
        product.description,
        product.categoryName,
        product.productGroup,
        product.productType,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [products, query, selectedCategoryId]);

  const visibleProducts = query || selectedCategoryId !== allCategory.id ? filteredProducts : filteredProducts.slice(0, 8);

  const categoryCards = useMemo(() => {
    return categories.map((category) => {
      const categoryProducts = products.filter((product) => product.categoryId === category.id);

      return {
        ...category,
        imageUrl: categoryProducts[0]?.imageUrl,
        previewNames: categoryProducts.slice(0, 2).map((product) => product.name),
      };
    });
  }, [categories, products]);

  const heroProduct = products.find((product) => product.imageUrl) ?? products[0];

  const handleAddToCart = useCallback(async (product: Product) => {
    await addGuestCartItem(product);
    setRecentlyAddedProductId(product.id);
    setTimeout(() => {
      setRecentlyAddedProductId((currentProductId) => (currentProductId === product.id ? null : currentProductId));
    }, 1300);
  }, []);

  return (
    <View style={styles.screen}>
      <View style={styles.stickyHeader}>
        <AppBrandHeader />

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
              value={query}
            />
          </View>
          <Pressable accessibilityLabel="Refresh catalog" onPress={() => loadCatalog(true)} style={styles.iconButton}>
            {isRefreshing ? (
              <ActivityIndicator color={theme.colors.primary} size="small" />
            ) : (
              <RefreshCw size={theme.icon.sm} color={theme.colors.primary} />
            )}
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChips}>
          {categoryOptions.map((category) => {
            const isSelected = category.id === selectedCategoryId;

            return (
              <Pressable
                key={category.id}
                onPress={() => setSelectedCategoryId(category.id)}
                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}>
                <Text style={[styles.categoryChipTitle, isSelected && styles.categoryChipTitleSelected]}>{category.name}</Text>
                <Text style={[styles.categoryChipMeta, isSelected && styles.categoryChipMetaSelected]}>
                  {category.itemCount} picks
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadCatalog(true)} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}
        style={styles.catalogScroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]}>
        <View style={styles.hero}>
        {heroProduct?.imageUrl ? (
          <Image resizeMode="cover" source={{ uri: heroProduct.imageUrl }} style={styles.heroImage} />
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

      {selectedCategoryId === allCategory.id && !query ? (
        <View style={styles.categoryCardSection}>
          <SectionTitle title="Shop categories" subtitle="Choose a style to start browsing" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryCards}>
            {categoryCards.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => setSelectedCategoryId(category.id)}
                style={styles.categoryCard}>
                {category.imageUrl ? (
                  <Image resizeMode="cover" source={{ uri: category.imageUrl }} style={styles.categoryCardImage} />
                ) : (
                  <View style={styles.categoryCardFallback}>
                    <Flower2 size={theme.icon.lg} color={theme.colors.primary} />
                  </View>
                )}
                <View style={styles.categoryCardBody}>
                  <Text style={styles.categoryCardTitle}>{category.name}</Text>
                  <Text style={styles.categoryCardMeta}>{category.itemCount} picks</Text>
                  {category.previewNames.length > 0 ? (
                    <Text numberOfLines={1} style={styles.categoryCardPreview}>
                      {category.previewNames.join(' / ')}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <SectionTitle
        title={selectedCategory?.name ?? 'Products'}
        subtitle={`${visibleProducts.length} ${visibleProducts.length === 1 ? 'favorite' : 'favorites'}`}
      />

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.loadingText}>Preparing the flower shelf</Text>
        </View>
      ) : errorMessage ? (
        <EmptyState title="Catalog unavailable" description={errorMessage} />
      ) : visibleProducts.length > 0 ? (
        <View style={styles.productGrid}>
          {visibleProducts.map((product) => (
            <ProductTile
              isAdded={recentlyAddedProductId === product.id}
              key={product.id}
              onAddToCart={handleAddToCart}
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
  isAdded,
  onAddToCart,
  product,
}: {
  isAdded: boolean;
  onAddToCart: (product: Product) => void;
  product: Product;
}) {
  const isSoldOut = (product.stock ?? 0) <= 0;

  return (
    <View style={styles.productTile}>
      {product.imageUrl ? (
        <Image resizeMode="cover" source={{ uri: product.imageUrl }} style={styles.productImage} />
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
      <Pressable accessibilityLabel={`Save ${product.name}`} style={styles.favoriteButton}>
        <Heart size={theme.icon.sm} color={theme.colors.primary} />
      </Pressable>
      <View style={styles.productBody}>
        <View style={styles.productMetaRow}>
          <Text style={styles.productCategory} numberOfLines={1}>
            {product.categoryName ?? product.tag}
          </Text>
          <Sparkles size={14} color={theme.colors.accent} />
        </View>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>{formatPhp(product.priceCents)}</Text>
          <Pressable
            accessibilityLabel={`Add ${product.name} to cart`}
            disabled={isSoldOut}
            onPress={() => onAddToCart(product)}
            style={[styles.addButton, isAdded && styles.addButtonAdded, isSoldOut && styles.addButtonDisabled]}>
            {isAdded ? (
              <Check size={theme.icon.sm} color={theme.colors.white} strokeWidth={2.8} />
            ) : (
              <ShoppingBag size={theme.icon.sm} color={theme.colors.white} />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  stickyHeader: {
    backgroundColor: theme.colors.background,
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
    backgroundColor: theme.colors.background,
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
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.white,
    fontSize: 30,
    fontWeight: '800',
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
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 48,
    paddingHorizontal: theme.spacing.lg,
  },
  searchInput: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 15,
    minWidth: 0,
    paddingVertical: theme.spacing.sm,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  categoryChips: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  categoryChip: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    gap: 2,
    minWidth: 112,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  categoryChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryChipTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  categoryChipTitleSelected: {
    color: theme.colors.white,
  },
  categoryChipMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryChipMetaSelected: {
    color: theme.colors.white,
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
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
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
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  loadingState: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
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
  productImage: {
    backgroundColor: theme.colors.surfaceAlt,
    height: 154,
    width: '100%',
  },
  productImageFallback: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    height: 154,
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
    fontWeight: '800',
  },
  favoriteButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.pill,
    height: 34,
    justifyContent: 'center',
    position: 'absolute',
    right: theme.spacing.sm,
    top: theme.spacing.sm,
    width: 34,
  },
  productBody: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  productMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    justifyContent: 'space-between',
  },
  productCategory: {
    color: theme.colors.primary,
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
  },
  productName: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    minHeight: 40,
  },
  productFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productPrice: {
    color: theme.colors.text,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  addButtonAdded: {
    backgroundColor: theme.colors.accent,
  },
  addButtonDisabled: {
    backgroundColor: theme.colors.tabInactive,
  },
});
