import { router, useLocalSearchParams } from 'expo-router';
import {
  Animated,
  Easing,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowLeft, ChevronDown, Search, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBrandHeader } from '@/components/app-brand-header';
import { EmptyState } from '@/components/bloom-ui';
import { ProductCard } from '@/components/product-card';
import { type Product } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { shopApi, type CategoryHierarchyGroup } from '@/services/shop-api';
import { getStoreBranch, setStoreBranch, type StoreBranch } from '@/services/branch-preference';

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
  const params = useLocalSearchParams<{ branch?: StoreBranch; q?: string }>();
  const initialQuery = typeof params.q === 'string' ? params.q : '';
  const initialBranch = params.branch === 'pampanga' ? 'pampanga' : 'manila';
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [branch, setBranch] = useState<StoreBranch>(initialBranch);
  const [isBranchPickerOpen, setIsBranchPickerOpen] = useState(false);
  const [isCategorySheetMounted, setIsCategorySheetMounted] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [openFilter, setOpenFilter] = useState<'sort' | 'budget' | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryHierarchy, setCategoryHierarchy] = useState<CategoryHierarchyGroup[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [selectedBudget, setSelectedBudget] = useState<BudgetOption>('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('all');
  const categorySheetProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const nextQuery = typeof params.q === 'string' ? params.q : '';
    setQuery(nextQuery);
    setSubmittedQuery(nextQuery);
  }, [params.q]);

  useEffect(() => {
    if (params.branch === 'manila' || params.branch === 'pampanga') {
      setBranch(params.branch);
      return;
    }

    void getStoreBranch().then(setBranch);
  }, [params.branch]);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setProducts(await shopApi.getProducts({ branch }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Search is unavailable.');
    } finally {
      setIsLoading(false);
    }
  }, [branch]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

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

  const handleSubmitSearch = useCallback(() => {
    const nextQuery = query.trim();
    setSubmittedQuery(nextQuery);
    setOpenFilter(null);
  }, [query]);

  const handleSelectBranch = useCallback((nextBranch: StoreBranch) => {
    setBranch(nextBranch);
    setIsBranchPickerOpen(false);
    void setStoreBranch(nextBranch);
    router.setParams({ branch: nextBranch });
  }, []);

  const handleOpenCategorySheet = useCallback(() => {
    setIsBranchPickerOpen(false);
    setOpenFilter(null);
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

  const handleSelectCategory = useCallback((category?: string) => {
    const nextQuery = category ?? '';
    setQuery(nextQuery);
    setSubmittedQuery(nextQuery);
    setOpenFilter(null);
    setIsCategorySheetOpen(false);
    setIsCategorySheetMounted(false);
  }, []);

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <View style={styles.productCell}>
        <ProductCard product={item} style={styles.productCard} />
      </View>
    ),
    [],
  );

  const listHeader = isLoading ? (
    <SearchHeaderSkeleton />
  ) : (
    <View style={styles.resultsHeader}>
      <Text style={styles.resultsTitle}>{normalizedQuery ? `"${normalizedQuery}"` : 'All products'}</Text>
      <Text style={styles.resultsSubtitle}>
        {`${searchResults.length} ${searchResults.length === 1 ? 'product' : 'products'} found`}
      </Text>
    </View>
  );

  const listEmpty = isLoading ? (
    <SearchSkeleton />
  ) : errorMessage ? (
    <EmptyState title="Search unavailable" description={errorMessage} />
  ) : (
    <EmptyState title="No products found" description="Try another product name, category, color, or flower type." />
  );

  return (
    <View style={styles.screen}>
      <View style={styles.stickyHeader}>
        <AppBrandHeader
          onMenuPress={handleOpenCategorySheet}
          onStorePress={() => setIsBranchPickerOpen((current) => !current)}
          showMenuAction
          showSearchAction={false}
          showStoreAction
        />

        {isBranchPickerOpen ? (
          <BranchPopover branch={branch} onClose={() => setIsBranchPickerOpen(false)} onSelect={handleSelectBranch} topInset={insets.top} />
        ) : null}

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

      {isCategorySheetMounted ? (
        <CategorySelectorSheet
          hierarchy={categoryHierarchy.length > 0 ? categoryHierarchy : buildCategoryHierarchyFromProducts(products)}
          isOpen={isCategorySheetOpen}
          onClose={handleCloseCategorySheet}
          onSelectCategory={handleSelectCategory}
          progress={categorySheetProgress}
        />
      ) : null}

      <FlatList
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]}
        contentInsetAdjustmentBehavior="automatic"
        data={isLoading || errorMessage ? [] : searchResults}
        initialNumToRender={Platform.OS === 'android' ? 8 : 10}
        keyExtractor={(product) => product.id}
        ListEmptyComponent={listEmpty}
        ListHeaderComponent={listHeader}
        ListHeaderComponentStyle={styles.listHeader}
        maxToRenderPerBatch={Platform.OS === 'android' ? 6 : 8}
        numColumns={2}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={renderProduct}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        updateCellsBatchingPeriod={50}
        windowSize={Platform.OS === 'android' ? 7 : 9}
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
                pressed && styles.pressed,
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
  const insets = useSafeAreaInsets();
  const bottomClearance = Math.max(insets.bottom + 120, 136);
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
        <ScrollView
          contentContainerStyle={[styles.categorySheetContent, { paddingBottom: bottomClearance }]}
          showsVerticalScrollIndicator={false}>
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

function buildCategoryHierarchyFromProducts(products: Product[]): CategoryHierarchyGroup[] {
  const groups = new Map<string, Set<string>>();

  for (const product of products) {
    const category = product.categoryName?.trim() || product.tag?.trim();

    if (!category) {
      continue;
    }

    const group = product.productGroup?.trim() || (isLikelyNonFloralCategory(category) ? 'Non-Floral' : 'Floral');
    const groupItems = groups.get(group) ?? new Set<string>();
    groupItems.add(category);
    groups.set(group, groupItems);
  }

  return Array.from(groups, ([title, items]) => ({
    title,
    items: Array.from(items).sort((first, second) => first.localeCompare(second)),
  })).sort((first, second) => getCategoryGroupPriority(first.title) - getCategoryGroupPriority(second.title) || first.title.localeCompare(second.title));
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

function isLikelyNonFloralCategory(category: string) {
  return /\b(non[\s-]?floral|accessory|basket|candle|card|gift|pot|ribbon|tool|vase|wrapper|wrapping)\b/i.test(category);
}

function SearchSkeleton() {
  const skeletonColumns = splitIntoColumns([0, 1, 2, 3]);

  return (
    <View style={styles.productGrid}>
      {skeletonColumns.map((column, columnIndex) => (
        <View key={`skeleton-column-${columnIndex}`} style={styles.productColumn}>
          {column.map((item) => (
            <View key={item} style={styles.productTile}>
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

function splitIntoColumns<T>(items: T[]) {
  return [
    items.filter((_, index) => index % 2 === 0),
    items.filter((_, index) => index % 2 === 1),
  ];
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
  return <View style={[styles.skeletonBase, style]} />;
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
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  listHeader: {
    marginBottom: theme.spacing.lg,
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
  branchOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 70,
  },
  branchPicker: {
    backgroundColor: theme.colors.white,
    borderColor: outlineColor,
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
    borderColor: outlineColor,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
  },
  branchOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  branchOptionText: {
    color: softText,
    fontFamily: Fonts.sansMedium,
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
    borderRightColor: outlineColor,
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
    borderBottomColor: outlineColor,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 72,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  categorySheetTitle: {
    color: '#111827',
    fontFamily: Fonts.sansExtraBold,
    fontSize: 18,
    letterSpacing: 0,
  },
  categorySheetContent: {
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  allProductsButton: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 2,
  },
  allProductsText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
    lineHeight: 20,
  },
  categoryGroup: {
    gap: theme.spacing.sm,
  },
  categoryGroupTitle: {
    color: '#9CA3AF',
    fontFamily: Fonts.sansExtraBold,
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
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    lineHeight: 21,
  },
  categoryEmptyText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
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
    gap: theme.spacing.sm,
  },
  productColumn: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  productCard: {
    width: '100%',
  },
  productCell: {
    flex: 1,
    maxWidth: '48.7%',
  },
  productRow: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
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
