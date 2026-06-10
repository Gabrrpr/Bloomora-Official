import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

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
  return (
    <View style={styles.recommendationSection}>
      <View style={styles.recommendationTitleRow}>
        <View style={styles.titleLine} />
        <Text style={styles.recommendationTitle}>You May Also Like</Text>
        <View style={styles.titleLine} />
      </View>
      {isLoading && products.length === 0 ? (
        <ProductRecommendationSkeleton />
      ) : (
        <View style={styles.recommendationGrid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </View>
      )}
      {isAppending ? <RecommendationAppendLoader /> : null}
      {!isAppending && canAppend && products.length > 0 ? <View style={styles.recommendationScrollBuffer} /> : null}
    </View>
  );
}

export function ProductRecommendationSkeleton() {
  return (
    <View style={styles.recommendationGrid}>
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <SkeletonBlock style={styles.skeletonImage} />
          <View style={styles.skeletonBody}>
            <SkeletonBlock style={styles.skeletonLineWide} />
            <SkeletonBlock style={styles.skeletonLineShort} />
          </View>
        </View>
      ))}
    </View>
  );
}

function RecommendationAppendLoader() {
  return (
    <View style={styles.appendRow}>
      {[0, 1].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <SkeletonBlock style={styles.skeletonImage} />
          <View style={styles.skeletonBody}>
            <SkeletonBlock style={styles.skeletonLineWide} />
            <SkeletonBlock style={styles.skeletonLineShort} />
          </View>
        </View>
      ))}
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
  recommendationSection: {
    gap: theme.spacing.md,
  },
  recommendationTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'center',
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
  recommendationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  appendRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  recommendationScrollBuffer: {
    height: 32,
  },
  skeletonCard: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.11)',
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    overflow: 'hidden',
    width: '47.8%',
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
