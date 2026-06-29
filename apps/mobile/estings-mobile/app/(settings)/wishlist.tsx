import { router } from 'expo-router';
import { ArrowRight, ChevronLeft, Heart } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { ProductCard } from '@/components/product-card';
import { type Product } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { getSavedWishlistProducts } from '@/services/feed-wishlist';
import { shopApi } from '@/services/shop-api';

const outlineColor = 'rgba(31, 42, 36, 0.11)';

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const catalog = await shopApi.getProducts();
      setProducts(await getSavedWishlistProducts(catalog));
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Wishlist is unavailable right now.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + theme.spacing.lg }]}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Go back" style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={28} color={theme.colors.primary} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.title}>Wishlist</Text>
      </View>

      {isLoading ? (
        <View style={styles.statePanel}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.emptyPanel}>
          <Text selectable style={styles.emptyText}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void load(true)}
            style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}>
            <Text style={styles.primaryActionText}>Try again</Text>
          </Pressable>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyPanel}>
          <View style={styles.emptyIconRing}>
            <View style={styles.emptyIcon}>
              <Heart size={34} color={theme.colors.primary} strokeWidth={2} />
            </View>
          </View>
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptyText}>
            Bouquets and arrangements you save from the feed and product details will appear here.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/')}
            style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}>
            <Text style={styles.primaryActionText}>Explore bouquets</Text>
            <ArrowRight size={17} color={theme.colors.white} strokeWidth={2.3} />
          </Pressable>
        </View>
      ) : (
        <FlatList
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={[styles.gridContent, { paddingBottom: insets.bottom + theme.spacing.xl }]}
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          refreshControl={<RefreshControl refreshing={isRefreshing} tintColor={theme.colors.primary} onRefresh={() => void load(true)} />}
          renderItem={({ item }) => <ProductCard product={item} style={styles.productCard} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.surfaceAlt,
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    minHeight: 44,
  },
  backButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    marginLeft: -6,
    width: 42,
  },
  title: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 26,
    lineHeight: 32,
  },
  emptyPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: outlineColor,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  statePanel: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 320,
  },
  gridContent: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  gridRow: {
    gap: theme.spacing.sm,
  },
  productCard: {
    flex: 1,
    width: 'auto',
  },
  emptyIconRing: {
    alignItems: 'center',
    borderColor: 'rgba(46, 139, 52, 0.16)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 86,
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
    width: 86,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(46, 139, 52, 0.12)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
  },
  primaryActionText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
