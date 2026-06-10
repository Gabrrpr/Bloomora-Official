import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { ArrowLeft, ChevronDown, Search, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBrandHeader } from '@/components/app-brand-header';
import { EmptyState } from '@/components/bloom-ui';
import { ProductCard } from '@/components/product-card';
import { type Product } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { shopApi } from '@/services/shop-api';

const outlineColor = 'rgba(31, 42, 36, 0.11)';
type SortOption = 'all' | 'latest' | 'price-asc' | 'price-desc';
type BudgetOption = 'all' | 'under-1000' | '1000-2000' | 'over-2000';

const pageBackground = '#F5F5F5';
const softText = '#2F3A34';
const softerText = '#5F6B63';
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

export default function SearchResultsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string }>();
  const initialQuery = typeof params.q === 'string' ? params.q : '';
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openFilter, setOpenFilter] = useState<'sort' | 'budget' | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [selectedBudget, setSelectedBudget] = useState<BudgetOption>('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('all');
  const [visibleResultCount, setVisibleResultCount] = useState(8);

  useEffect(() => {
    const nextQuery = typeof params.q === 'string' ? params.q : '';
    setQuery(nextQuery);
    setSubmittedQuery(nextQuery);
  }, [params.q]);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setProducts(await shopApi.getProducts());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Search is unavailable.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const normalizedQuery = submittedQuery.trim();
  const searchResults = useMemo(() => {
    const normalizedSearch = normalizedQuery.toLowerCase();

    const nextProducts = products.filter((product) => {
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

    return sortProducts(nextProducts, selectedSort);
  }, [normalizedQuery, products, selectedBudget, selectedSort]);

  const visibleSearchResults = searchResults.slice(0, visibleResultCount);

  const handleSubmitSearch = useCallback(() => {
    const nextQuery = query.trim();
    setSubmittedQuery(nextQuery);
    setOpenFilter(null);
  }, [query]);

  const handleResultsScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);

      if (distanceFromBottom < 420) {
        setVisibleResultCount((current) => Math.min(current + 4, searchResults.length));
      }
    },
    [searchResults.length],
  );

  useEffect(() => {
    setVisibleResultCount(8);
  }, [normalizedQuery, selectedBudget, selectedSort]);

  return (
    <View style={styles.screen}>
      <View style={styles.stickyHeader}>
        <AppBrandHeader showSearchAction={false} />

        <View style={styles.searchRow}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            onPress={() => router.back()}>
            <ArrowLeft size={24} color={theme.colors.primary} strokeWidth={2.4} />
          </Pressable>
          <View style={styles.searchBox}>
            <Search size={theme.icon.sm} color={theme.colors.textMuted} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setQuery}
              onSubmitEditing={handleSubmitSearch}
              placeholder="Search flowers, gifts, colors"
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
            label="Sort by"
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
            label="Budget"
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

      <ScrollView
        onScroll={handleResultsScroll}
        scrollEventThrottle={160}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]}>
        {isLoading ? (
          <SearchHeaderSkeleton />
        ) : (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>{normalizedQuery ? `"${normalizedQuery}"` : 'All products'}</Text>
            <Text style={styles.resultsSubtitle}>
              {`${searchResults.length} ${searchResults.length === 1 ? 'product' : 'products'} found`}
            </Text>
          </View>
        )}

        {isLoading ? (
          <SearchSkeleton />
        ) : errorMessage ? (
          <EmptyState title="Search unavailable" description={errorMessage} />
        ) : visibleSearchResults.length > 0 ? (
          <View style={styles.productGrid}>
            {visibleSearchResults.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </View>
        ) : (
          <EmptyState title="No products found" description="Try another product name, category, color, or flower type." />
        )}
      </ScrollView>
    </View>
  );
}

function FilterDropdown<TValue extends string>({
  isOpen,
  label,
  onSelect,
  options,
  selectedValue,
  onToggle,
}: {
  isOpen: boolean;
  label: string;
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

  if (sort === 'price-asc') {
    return sortedProducts.sort((first, second) => first.priceCents - second.priceCents);
  }

  if (sort === 'price-desc') {
    return sortedProducts.sort((first, second) => second.priceCents - first.priceCents);
  }

  return sortedProducts;
}


function SearchSkeleton() {
  return (
    <View style={styles.productGrid}>
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={styles.productTile}>
          <SkeletonBlock style={styles.productImage} />
          <View style={styles.productBody}>
            <SkeletonBlock style={styles.skeletonLineWide} />
            <SkeletonBlock style={styles.skeletonLineShort} />
          </View>
        </View>
      ))}
    </View>
  );
}

function SearchHeaderSkeleton() {
  return (
    <View style={styles.resultsHeader}>
      <SkeletonBlock style={styles.skeletonTitleLine} />
      <SkeletonBlock style={styles.skeletonLineShort} />
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
  scroll: {
    backgroundColor: pageBackground,
    flex: 1,
  },
  content: {
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
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
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 50,
    paddingHorizontal: theme.spacing.lg,
    flex: 1,
    marginHorizontal: 0,
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
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
  },
  resultsTitle: {
    color: softText,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 22,
    lineHeight: 28,
  },
  resultsSubtitle: {
    color: softerText,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  skeletonBase: {
    backgroundColor: '#E8ECE9',
  },
  skeletonTitleLine: {
    borderRadius: theme.radius.sm,
    height: 24,
    width: '58%',
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
  productImage: {
    backgroundColor: theme.colors.white,
    height: 194,
    width: '100%',
  },
  productBody: {
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
