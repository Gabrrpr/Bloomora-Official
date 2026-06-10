import { router } from 'expo-router';
import { Image } from 'expo-image';
import { ImageOff, Star } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatPhp, type Product } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';

/**
 * Shared product card used across the entire app:
 * Shop grid, Search results, Cart recommendations, and "You May Also Like".
 *
 * Renders: image → name → price → star rating (always 0 when no real data).
 */
export function ProductCard({ product }: { product: Product }) {
  const isSoldOut = (product.stock ?? 0) <= 0;

  return (
    <Pressable
      accessibilityLabel={`View ${product.name} details`}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/product-details?id=${encodeURIComponent(product.id)}`)}>
      {product.imageUrl ? (
        <Image
          cachePolicy="memory-disk"
          contentFit="cover"
          recyclingKey={product.id}
          source={{ uri: product.imageUrl }}
          style={styles.image}
        />
      ) : (
        <View style={styles.imageFallback}>
          <ImageOff size={28} color={theme.colors.primary} />
        </View>
      )}
      {isSoldOut ? (
        <View style={styles.soldOutBadge}>
          <Text style={styles.soldOutText}>Sold out</Text>
        </View>
      ) : null}
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        <Text style={styles.price}>{formatPhp(product.priceCents)}</Text>
        <View style={styles.ratingRow}>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={11}
                color="#DDE0DD"
                fill="transparent"
                strokeWidth={2}
              />
            ))}
          </View>
          <Text style={styles.ratingText}>(0)</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.11)',
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    overflow: 'hidden',
    position: 'relative',
    width: '47.8%',
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
  imageFallback: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: theme.colors.greenSoft,
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
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
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
    minHeight: 36,
  },
  price: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    lineHeight: 18,
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
