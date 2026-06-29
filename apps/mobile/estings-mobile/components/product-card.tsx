import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Star } from 'lucide-react-native';
import { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { formatPhp, type Product } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';

const imageNotFound = require('@/assets/images/default-img/ImageNotFound.webp');
const ratingStars = [1, 2, 3, 4, 5] as const;

/**
 * Shared product card used across the entire app:
 * Shop grid, Search results, Cart recommendations, and "You May Also Like".
 *
 * Renders: image → name → price → star rating (always 0 when no real data).
 */
type ProductCardProps = {
  product: Product;
  style?: StyleProp<ViewStyle>;
};

export const ProductCard = memo(function ProductCard({ product, style }: ProductCardProps) {
  const display = useMemo(() => {
    const isSoldOut = (product.stock ?? 0) <= 0;
    const hasSalePrice = Boolean(product.originalPriceCents && product.originalPriceCents > product.priceCents);
    const discountPercent =
      hasSalePrice && product.originalPriceCents
        ? Math.round(((product.originalPriceCents - product.priceCents) / product.originalPriceCents) * 100)
        : 0;
    const averageRating = Math.max(0, Math.min(5, Number(product.averageRating ?? 0)));
    const reviewCount = Math.max(0, Number(product.reviewCount ?? 0));

    return {
      averageRating,
      discountPercent,
      hasSalePrice,
      isSoldOut,
      price: formatPhp(product.priceCents),
      originalPrice: hasSalePrice && product.originalPriceCents ? formatPhp(product.originalPriceCents) : '',
      reviewCount,
    };
  }, [
    product.averageRating,
    product.originalPriceCents,
    product.priceCents,
    product.reviewCount,
    product.stock,
  ]);
  const handlePress = useCallback(() => {
    router.push(`/product-details?id=${encodeURIComponent(product.id)}`);
  }, [product.id]);

  if (product.isVisible !== true) {
    return null;
  }

  return (
    <Pressable
      accessibilityLabel={`View ${product.name} details`}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, style, pressed && styles.cardPressed]}
      onPress={handlePress}>
      {product.imageUrl ? (
        <Image
          cachePolicy="memory-disk"
          contentFit="cover"
          recyclingKey={product.id}
          source={{ uri: product.imageUrl }}
          style={styles.image}
        />
      ) : (
        <Image contentFit="cover" source={imageNotFound} style={styles.image} />
      )}
      {display.isSoldOut ? (
        <View style={styles.soldOutBadge}>
          <Text style={styles.soldOutText}>Sold out</Text>
        </View>
      ) : null}
      {display.hasSalePrice ? (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{display.discountPercent}%</Text>
        </View>
      ) : null}
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{display.price}</Text>
          {display.originalPrice ? (
            <Text style={styles.originalPrice}>{display.originalPrice}</Text>
          ) : null}
        </View>
        <View style={styles.ratingRow}>
          <View style={styles.stars}>
            {ratingStars.map((star) => (
              <Star
                key={star}
                size={11}
                color={display.averageRating >= star - 0.25 ? '#F2B950' : '#DDE0DD'}
                fill={display.averageRating >= star - 0.25 ? '#F2B950' : 'transparent'}
                strokeWidth={2}
              />
            ))}
          </View>
          <Text numberOfLines={1} style={styles.ratingText}>
            {display.averageRating.toFixed(1)} ({display.reviewCount} {display.reviewCount === 1 ? 'Review' : 'Reviews'})
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    width: '48.7%',
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  image: {
    aspectRatio: 1,
    backgroundColor: theme.colors.white,
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
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
  },
  discountBadge: {
    backgroundColor: '#006B4B',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
    position: 'absolute',
    right: theme.spacing.sm,
    top: theme.spacing.sm,
  },
  discountText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    lineHeight: 13,
  },
  body: {
    gap: 4,
    padding: theme.spacing.sm,
  },
  name: {
    color: theme.colors.text,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  price: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    lineHeight: 18,
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  originalPrice: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    textDecorationLine: 'line-through',
  },
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    lineHeight: 14,
  },
});
