import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, ChevronDown, Search, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBrandHeader } from '@/components/app-brand-header';
import { EmptyState } from '@/components/bloom-ui';
import { ProductCard } from '@/components/product-card';
import { occasionAssets, type OccasionAsset } from '@/constants/occasion-assets';
import { type Product } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { shopApi } from '@/services/shop-api';
import { buildDiscoveryProductOrder, createRecommendationSeed } from '@/utils/product-recommendations';

type ProductSectionKind =
  | 'flash-sale'
  | 'featured'
  | 'new-arrivals'
  | 'random'
  | 'floral-products'
  | 'non-floral-products';
const pageBackground = '#F5F5F5';
const softText = '#2F3A34';
const outlineColor = 'rgba(31, 42, 36, 0.11)';
type SortOption = 'all' | 'latest' | 'price-asc' | 'price-desc';
type BudgetOption = 'all' | 'under-1000' | '1000-2000' | 'over-2000';
const sortOptions: { label: string; value: SortOption }[] = [
  { label: 'All', value: 'all' },
  { label: 'Latest', value: 'latest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
];
const budgetOptions: { label: string; value: BudgetOption }[] = [
  { label: 'Any', value: 'all' },
  { label: 'Lower than 1000', value: 'under-1000' },
  { label: '1000-2000', value: '1000-2000' },
  { label: '2000 above', value: 'over-2000' },
];

export default function ProductListScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    category?: string;
    branch?: 'manila' | 'pampanga';
    group?: string;
    section?: ProductSectionKind;
    title?: string;
  }>();
  const seed = useRef(createRecommendationSeed()).current;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openFilter, setOpenFilter] = useState<'sort' | 'budget' | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [selectedBudget, setSelectedBudget] = useState<BudgetOption>('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('all');

  const title = typeof params.title === 'string' && params.title.trim() ? params.title : 'Products';
  const category = typeof params.category === 'string' ? params.category : '';
  const group = typeof params.group === 'string' ? params.group : '';
  const section = typeof params.section === 'string' ? params.section : undefined;
  const isOccasionIndex = group === 'occasions' && !category && !section;

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setProducts(await shopApi.getProducts({ branch: params.branch }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Products are unavailable.');
    } finally {
      setIsLoading(false);
    }
  }, [params.branch]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const baseProducts = useMemo(() => {
    const orderedProducts = buildDiscoveryProductOrder({ products, seed });

    if (section) {
      return getProductsForSection(section, section === 'flash-sale' ? products : orderedProducts, seed);
    }

    if (category) {
      return orderedProducts.filter((product) => matchesProductCategory(product, category));
    }

    return orderedProducts;
  }, [category, products, section, seed]);
  const normalizedQuery = query.trim();
  const visibleProducts = useMemo(() => {
    const normalizedSearch = normalizedQuery.toLowerCase();
    const filteredProducts = baseProducts.filter((product) => {
      const price = product.priceCents / 100;
      const searchableText = [
        product.name,
        product.description,
        product.categoryName,
        product.productGroup,
        product.productType,
        product.tag,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (!normalizedSearch || searchableText.includes(normalizedSearch)) && matchesBudget(price, selectedBudget);
    });

    return sortProducts(filteredProducts, selectedSort);
  }, [baseProducts, normalizedQuery, selectedBudget, selectedSort]);
  const productColumns = splitIntoColumns(visibleProducts);
  const occasionColumns = splitIntoColumns(occasionAssets);
  const scopeLabel = isOccasionIndex ? 'Occasions' : title;
  const resultTitle = normalizedQuery ? `"${normalizedQuery}"` : title;
  const resultContext = normalizedQuery ? `Searching in ${scopeLabel}` : `Browsing ${scopeLabel}`;
  const resultCountLabel = isOccasionIndex
    ? `${occasionAssets.length} moments`
    : `${visibleProducts.length} ${visibleProducts.length === 1 ? 'product' : 'products'}`;

  return (
    <View style={styles.screen}>
      <View style={styles.stickyHeader}>
        <AppBrandHeader showSearchAction={false} />

        <View style={styles.searchRow}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <ArrowLeft size={24} color={theme.colors.primary} strokeWidth={2.4} />
          </Pressable>
          <View style={styles.searchBox}>
            <Search size={theme.icon.sm} color={theme.colors.textMuted} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setQuery}
              placeholder={`Search in ${scopeLabel}`}
              placeholderTextColor={theme.colors.textMuted}
              returnKeyType="search"
              style={styles.searchInput}
              value={query}
            />
            {query ? (
              <Pressable accessibilityLabel="Clear search" accessibilityRole="button" hitSlop={8} onPress={() => setQuery('')}>
                <X size={theme.icon.sm} color={theme.colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.filterRow}>
          <FilterDropdown
            isOpen={openFilter === 'sort'}
            options={sortOptions}
            selectedValue={selectedSort}
            onSelect={(value) => {
              setSelectedSort(value);
              setOpenFilter(null);
            }}
            onToggle={() => setOpenFilter((current) => (current === 'sort' ? null : 'sort'))}
          />
          <FilterDropdown
            isOpen={openFilter === 'budget'}
            options={budgetOptions}
            selectedValue={selectedBudget}
            onSelect={(value) => {
              setSelectedBudget(value);
              setOpenFilter(null);
            }}
            onToggle={() => setOpenFilter((current) => (current === 'budget' ? null : 'budget'))}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]}>
        <View style={styles.resultsHeader}>
          <View style={styles.scopePill}>
            <Text numberOfLines={1} style={styles.scopePillText}>{resultContext}</Text>
          </View>
          <Text numberOfLines={2} style={styles.title}>{resultTitle}</Text>
          <Text style={styles.subtitle}>{resultCountLabel}</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading products</Text>
          </View>
        ) : errorMessage ? (
          <EmptyState title="Products unavailable" description={errorMessage} />
        ) : isOccasionIndex ? (
          <View style={styles.occasionGrid}>
            {occasionColumns.map((column, columnIndex) => (
              <View key={`occasion-column-${columnIndex}`} style={styles.occasionColumn}>
                {column.map((occasion) => (
                  <OccasionPickerCard
                    key={occasion.label}
                    occasion={occasion}
                    onPress={() =>
                      router.push(
                        `/product-list?title=${encodeURIComponent(occasion.label)}&category=${encodeURIComponent(
                          occasion.label,
                        )}&group=occasions`,
                      )
                    }
                  />
                ))}
              </View>
            ))}
          </View>
        ) : visibleProducts.length > 0 ? (
          <View style={styles.productGrid}>
            {productColumns.map((column, columnIndex) => (
              <View key={`products-${columnIndex}`} style={styles.productColumn}>
                {column.map((product) => (
                  <ProductCard key={product.id} product={product} style={styles.productCard} />
                ))}
              </View>
            ))}
          </View>
        ) : (
          <EmptyState title="No products found" description="Try another category or section." />
        )}
      </ScrollView>
    </View>
  );
}

function FilterDropdown<TValue extends string>({
  isOpen,
  onSelect,
  options,
  selectedValue,
  onToggle,
}: {
  isOpen: boolean;
  onSelect: (value: TValue) => void;
  options: { label: string; value: TValue }[];
  selectedValue: TValue;
  onToggle: () => void;
}) {
  const selectedOption = options.find((option) => option.value === selectedValue) ?? options[0];

  return (
    <View style={styles.filterDropdown}>
      <Pressable accessibilityRole="button" style={styles.filterButton} onPress={onToggle}>
        <Text numberOfLines={1} style={styles.filterValue}>{selectedOption.label}</Text>
        <ChevronDown size={16} color={theme.colors.primary} strokeWidth={2.4} />
      </Pressable>
      {isOpen ? (
        <View style={styles.filterMenu}>
          {options.map((option) => {
            const isSelected = option.value === selectedValue;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={[styles.filterOption, isSelected && styles.filterOptionSelected]}
                onPress={() => onSelect(option.value)}>
                <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextSelected]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function OccasionPickerCard({
  occasion,
  onPress,
}: {
  occasion: OccasionAsset;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.occasionPickerCard, pressed && styles.pressed]}>
      <View style={styles.occasionPickerImageWrap}>
        <Image contentFit="cover" source={occasion.image} style={styles.occasionPickerImage} />
      </View>
      <Text numberOfLines={1} style={styles.occasionPickerTitle}>
        {occasion.label}
      </Text>
      <Text numberOfLines={3} style={styles.occasionPickerDescription}>
        {occasion.description}
      </Text>
      <View style={styles.occasionPickerButton}>
        <Text style={styles.occasionPickerButtonText}>Shop now</Text>
      </View>
    </Pressable>
  );
}

function getProductsForSection(sectionId: ProductSectionKind, products: Product[], seed: string) {
  switch (sectionId) {
    case 'flash-sale':
      return getFlashSaleProducts(products);
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

function matchesProductCategory(product: Product, category: string) {
  const normalizedCategory = normalizeValue(category);
  const searchableValues = [
    product.name,
    product.description,
    product.categoryName,
    product.productGroup,
    product.productType,
    product.tag,
  ];

  return searchableValues.some((value) => normalizeValue(value).includes(normalizedCategory));
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

function matchesBudget(price: number, budget: BudgetOption) {
  if (budget === 'under-1000') {
    return price < 1000;
  }

  if (budget === '1000-2000') {
    return price >= 1000 && price <= 2000;
  }

  if (budget === 'over-2000') {
    return price > 2000;
  }

  return true;
}

function sortProducts(products: Product[], sort: SortOption) {
  const sortedProducts = [...products];

  if (sort === 'latest') {
    return sortedProducts.sort((first, second) => {
      const firstTime = first.createdAt ? new Date(first.createdAt).getTime() : 0;
      const secondTime = second.createdAt ? new Date(second.createdAt).getTime() : 0;

      return secondTime - firstTime;
    });
  }

  if (sort === 'price-asc') {
    return sortedProducts.sort((first, second) => first.priceCents - second.priceCents);
  }

  if (sort === 'price-desc') {
    return sortedProducts.sort((first, second) => second.priceCents - first.priceCents);
  }

  return sortedProducts;
}

function getStableRandomValue(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (Math.abs(hash) % 10000) / 10000;
}

function normalizeValue(value?: string | null) {
  return value?.trim().toLowerCase() ?? '';
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
  backButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: outlineColor,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
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
    minHeight: 50,
    minWidth: 0,
    paddingHorizontal: theme.spacing.lg,
  },
  searchInput: {
    color: softText,
    flex: 1,
    fontSize: 15,
    minWidth: 0,
    paddingVertical: theme.spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    zIndex: 30,
  },
  filterDropdown: {
    flex: 1,
    position: 'relative',
    zIndex: 30,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: theme.borderWidth,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: theme.spacing.md,
  },
  filterValue: {
    color: softText,
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 15,
    minWidth: 0,
  },
  filterMenu: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 42,
    zIndex: 40,
  },
  filterOption: {
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: theme.spacing.md,
  },
  filterOptionSelected: {
    backgroundColor: theme.colors.greenSoft,
  },
  filterOptionText: {
    color: softText,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
  },
  filterOptionTextSelected: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
  },
  resultsHeader: {
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
  },
  scopePill: {
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(46, 139, 52, 0.16)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    maxWidth: '100%',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  scopePillText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    lineHeight: 14,
  },
  title: {
    color: softText,
    fontFamily: Fonts.sansBold,
    fontSize: 20,
    lineHeight: 25,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  content: {
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
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
  occasionGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  occasionColumn: {
    flex: 1,
    gap: theme.spacing.md,
  },
  occasionPickerCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: 'rgba(46, 139, 52, 0.18)',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  occasionPickerImageWrap: {
    backgroundColor: '#EEF3EF',
    borderColor: theme.colors.primary,
    borderRadius: 43,
    borderWidth: 1,
    height: 86,
    overflow: 'hidden',
    width: 86,
  },
  occasionPickerImage: {
    height: '100%',
    width: '100%',
  },
  occasionPickerFallback: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  occasionPickerTitle: {
    color: softText,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
  },
  occasionPickerDescription: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 15,
    minHeight: 45,
    textAlign: 'center',
  },
  occasionPickerButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: theme.spacing.md,
  },
  occasionPickerButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 11,
  },
  productGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
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
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
