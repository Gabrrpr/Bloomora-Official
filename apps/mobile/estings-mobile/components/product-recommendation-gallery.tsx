import { StyleSheet, Text, View } from 'react-native';

import { ProductCard } from '@/components/product-card';
import { type Product } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';

const hairlineColor = 'rgba(31, 42, 36, 0.09)';

export function ProductRecommendationGallery({
  canAppend,
  isAppending,
  isLoading,
  products,
}: {
  canAppend: boolean;
  isAppending: boolean;
  isLoading: boolean;
  products: Product[];
}) {
  const productColumns = splitIntoColumns(products);

  return (
    <View style={styles.recommendationSection}>
      <View style={styles.recommendationHeader}>
        <View style={styles.recommendationTitleRow}>
          <View style={styles.titleLine} />
          <Text style={styles.recommendationTitle}>You May Also Like</Text>
          <View style={styles.titleLine} />
        </View>
        <Text style={styles.recommendationSubtitle}>
          Ranked by a content-based match across product details, tags, occasion, and price.
        </Text>
      </View>
      {isLoading && products.length === 0 ? (
        <ProductRecommendationSkeleton />
      ) : (
        <View style={styles.recommendationGrid}>
          {productColumns.map((column, columnIndex) => (
            <View key={`products-${columnIndex}`} style={styles.productColumn}>
              {column.map((product) => (
                <ProductCard key={product.id} product={product} style={styles.productCard} />
              ))}
            </View>
          ))}
        </View>
      )}
      {isAppending ? <RecommendationAppendLoader /> : null}
      {!isAppending && canAppend && products.length > 0 ? <View style={styles.recommendationScrollBuffer} /> : null}
    </View>
  );
}

export function ProductRecommendationSkeleton() {
  const skeletonColumns = splitIntoColumns([0, 1, 2, 3]);

  return (
    <View style={styles.recommendationGrid}>
      {skeletonColumns.map((column, columnIndex) => (
        <View key={`skeleton-column-${columnIndex}`} style={styles.productColumn}>
          {column.map((item) => (
            <View key={item} style={styles.skeletonCard}>
              <SkeletonBlock style={styles.skeletonImage} />
              <View style={styles.skeletonBody}>
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

function RecommendationAppendLoader() {
  const skeletonColumns = splitIntoColumns([0, 1]);

  return (
    <View style={styles.recommendationGrid}>
      {skeletonColumns.map((column, columnIndex) => (
        <View key={`append-column-${columnIndex}`} style={styles.productColumn}>
          {column.map((item) => (
            <View key={item} style={styles.skeletonCard}>
              <SkeletonBlock style={styles.skeletonImage} />
              <View style={styles.skeletonBody}>
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

function SkeletonBlock({ style }: { style: object }) {
  return <View style={[styles.skeletonBase, style]} />;
}

const styles = StyleSheet.create({
  recommendationSection: {
    gap: theme.spacing.md,
  },
  recommendationTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'center',
  },
  recommendationHeader: {
    gap: 6,
  },
  titleLine: {
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
  recommendationSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: theme.spacing.md,
    textAlign: 'center',
  },
  recommendationGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
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
  recommendationScrollBuffer: {
    height: 32,
  },
  skeletonCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  skeletonImage: {
    aspectRatio: 1,
    backgroundColor: theme.colors.white,
    width: '100%',
  },
  skeletonBody: {
    gap: 4,
    padding: theme.spacing.sm,
  },
  skeletonBase: {
    backgroundColor: '#E8ECE9',
    overflow: 'hidden',
  },
  skeletonLineShort: {
    borderRadius: theme.radius.sm,
    height: 14,
    width: '42%',
  },
  skeletonLineWide: {
    borderRadius: theme.radius.sm,
    height: 16,
    width: '86%',
  },
});
