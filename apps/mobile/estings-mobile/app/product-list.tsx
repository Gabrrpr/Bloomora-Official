import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

export default function ProductListScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    category?: string;
    group?: string;
    section?: ProductSectionKind;
    title?: string;
  }>();
  const seed = useRef(createRecommendationSeed()).current;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  const title = typeof params.title === 'string' && params.title.trim() ? params.title : 'Products';
  const category = typeof params.category === 'string' ? params.category : '';
  const group = typeof params.group === 'string' ? params.group : '';
  const section = typeof params.section === 'string' ? params.section : undefined;
  const isOccasionIndex = group === 'occasions' && !category && !section;

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setProducts(await shopApi.getProducts());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Products are unavailable.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const visibleProducts = useMemo(() => {
    const orderedProducts = buildDiscoveryProductOrder({ products, seed });

    if (section) {
      return getProductsForSection(section, section === 'flash-sale' ? products : orderedProducts, seed);
    }

    if (category) {
      return orderedProducts.filter((product) => matchesProductCategory(product, category));
    }

    return orderedProducts;
  }, [category, products, section, seed]);
  const productColumns = splitIntoColumns(visibleProducts);
  const occasionColumns = splitIntoColumns(occasionAssets);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
        <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <ArrowLeft size={22} color={theme.colors.primary} strokeWidth={2.4} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text numberOfLines={1} style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {isOccasionIndex
              ? `${occasionAssets.length} moments`
              : `${visibleProducts.length} ${visibleProducts.length === 1 ? 'product' : 'products'}`}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]}>
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
  header: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderBottomColor: 'rgba(31, 42, 36, 0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  backButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
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
