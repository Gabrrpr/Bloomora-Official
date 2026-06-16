import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { AppBrandHeader, getAppBrandHeaderLayout } from '@/components/app-brand-header';
import { FloatingProductSearch } from '@/components/floating-product-search';
import type { CartItem } from '@/constants/shop';
import { formatPhp } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { getGuestCartItems } from '@/services/guest-cart';

export default function ArrangementDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const { cartItemId } = useLocalSearchParams<{ cartItemId?: string }>();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cartItem, setCartItem] = useState<CartItem | null>(null);

  const headerLayout = getAppBrandHeaderLayout(width, height, insets.top);
  const side = Math.min(Math.max(width * 0.062, 20), 30);
  const imageWidth = width - side * 2;
  const imageHeight = imageWidth * 1.05;

  useEffect(() => {
    if (!cartItemId) {
      setIsLoading(false);
      return;
    }

    let active = true;

    getGuestCartItems().then((items) => {
      if (!active) return;

      const found = items.find((item) => item.id === cartItemId) ?? null;
      setCartItem(found);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [cartItemId]);

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <View pointerEvents="none" style={styles.background}>
          <ArrangementBackground />
        </View>
        <AppBrandHeader absolute onSearchPress={() => setIsSearchOpen(true)} showSearchAction />
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
        <FloatingProductSearch onClose={() => setIsSearchOpen(false)} visible={isSearchOpen} />
      </View>
    );
  }

  if (!cartItem) {
    return (
      <View style={styles.screen}>
        <View pointerEvents="none" style={styles.background}>
          <ArrangementBackground />
        </View>
        <AppBrandHeader absolute onSearchPress={() => setIsSearchOpen(true)} showSearchAction />
        <View style={styles.centered}>
          <Sparkles color="#A7ABA8" size={40} strokeWidth={1.6} />
          <Text style={styles.notFoundTitle}>Arrangement not found</Text>
          <Text style={styles.notFoundBody}>
            This arrangement may have been removed from your cart.
          </Text>
          <Pressable
            accessibilityLabel="Back to Cart"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.notFoundButton}
          >
            <ArrowLeft color="#FFFFFF" size={16} strokeWidth={2.4} />
            <Text style={styles.notFoundButtonText}>Back to Cart</Text>
          </Pressable>
        </View>
        <FloatingProductSearch onClose={() => setIsSearchOpen(false)} visible={isSearchOpen} />
      </View>
    );
  }

  const { product } = cartItem;

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.background}>
        <ArrangementBackground />
      </View>

      <AppBrandHeader absolute onSearchPress={() => setIsSearchOpen(true)} showSearchAction />

      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + 40,
            paddingHorizontal: side,
            paddingTop: headerLayout.top + headerLayout.height + 24,
          },
        ]}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityLabel="Back to Cart"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backLink}
        >
          <ArrowLeft color="#6A706B" size={18} strokeWidth={2.4} />
          <Text style={styles.backLinkText}>Back to Cart</Text>
        </Pressable>

        {/* Image Card */}
        <View style={styles.imageCard}>
          {product.imageUrl ? (
            <Image
              contentFit="cover"
              source={{ uri: product.imageUrl }}
              style={[styles.image, { height: imageHeight, width: imageWidth - 2 }]}
              transition={320}
            />
          ) : (
            <View style={[styles.imagePlaceholder, { height: imageHeight, width: imageWidth - 2 }]}>
              <Sparkles color="#C8CCC9" size={48} strokeWidth={1.4} />
              <Text style={styles.imagePlaceholderText}>No preview available</Text>
            </View>
          )}
        </View>

        {/* AI Badge */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Sparkles color="#F36F95" size={13} strokeWidth={2.6} />
            <Text style={styles.badgeText}>{product.tag || 'AI Generated'}</Text>
          </View>
          {product.categoryName ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{product.categoryName}</Text>
            </View>
          ) : null}
        </View>

        {/* Arrangement Name */}
        <Text style={styles.arrangementName}>{product.name}</Text>

        {/* Price */}
        <Text style={styles.price}>{formatPhp(product.priceCents)}</Text>

        {/* Description Card */}
        {product.description ? (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionLabel}>Arrangement Details</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
        ) : null}

        {/* AI Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <View style={styles.disclaimerIconRow}>
            <Sparkles color="#A7ABA8" size={14} strokeWidth={2} />
          </View>
          <Text style={styles.disclaimerText}>
            This is an AI-generated preview. Your bouquet will be prepared based on your selected
            options, and the price will remain the same.
          </Text>
          <Text style={styles.poweredBy}>POWERED BY pollinations.ai</Text>
        </View>
      </ScrollView>

      <FloatingProductSearch onClose={() => setIsSearchOpen(false)} visible={isSearchOpen} />
    </View>
  );
}

function ArrangementBackground() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 390 860" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="page" x1="0" x2="390" y1="0" y2="860">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.58" stopColor="#FAFAFA" />
          <Stop offset="1" stopColor="#F2F3F2" />
        </LinearGradient>
      </Defs>
      <Path d="M0 0H390V860H0Z" fill="url(#page)" />
      {Array.from({ length: 210 }).map((_, index) => {
        const row = Math.floor(index / 14);
        const column = index % 14;
        const x = column * 30 + (row % 2 === 0 ? 8 : 22);
        const y = row * 42 + 28 + Math.sin(column * 0.9 + row * 0.42) * 14;

        return (
          <Circle
            key={`${row}-${column}`}
            cx={x}
            cy={y}
            r={1.25}
            fill="#A6AAA5"
            opacity={0.13 + ((row + column) % 4) * 0.04}
          />
        );
      })}
      <Path
        d="M0 738 C90 696 174 716 268 678 C325 654 362 616 390 574 V860H0Z"
        fill="#F3F4F2"
        opacity={0.7}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  background: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  content: {
    justifyContent: 'flex-start',
  },
  backLink: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 7,
    marginBottom: 24,
    minHeight: 44,
    paddingRight: theme.spacing.md,
  },
  backLinkText: {
    color: '#6A706B',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    fontWeight: '700',
  },
  imageCard: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(218, 222, 218, 0.72)',
    borderRadius: 18,
    borderWidth: 1,
    boxShadow: '0 12px 32px rgba(31, 42, 36, 0.1)',
    marginBottom: 20,
    overflow: 'hidden',
    width: '100%',
  },
  image: {
    borderRadius: 17,
  },
  imagePlaceholder: {
    alignItems: 'center',
    backgroundColor: '#F6F7F6',
    borderRadius: 17,
    gap: 12,
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    color: '#A7ABA8',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    fontWeight: '600',
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: 'rgba(243, 111, 149, 0.1)',
    borderColor: 'rgba(243, 111, 149, 0.24)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#E0537F',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryBadge: {
    backgroundColor: 'rgba(46, 139, 52, 0.08)',
    borderColor: 'rgba(46, 139, 52, 0.18)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryBadgeText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    fontWeight: '700',
  },
  arrangementName: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 6,
  },
  price: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(218, 222, 218, 0.72)',
    borderRadius: 18,
    borderWidth: 1,
    boxShadow: '0 8px 24px rgba(31, 42, 36, 0.06)',
    marginBottom: 24,
    padding: theme.spacing.lg,
  },
  descriptionLabel: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  descriptionText: {
    color: '#5C645E',
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 22,
  },
  disclaimerContainer: {
    alignItems: 'center',
    borderTopColor: 'rgba(218, 222, 218, 0.48)',
    borderTopWidth: 1,
    gap: 8,
    marginTop: 4,
    paddingTop: 24,
  },
  disclaimerIconRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(167, 171, 168, 0.1)',
    borderRadius: theme.radius.pill,
    height: 32,
    justifyContent: 'center',
    marginBottom: 2,
    width: 32,
  },
  disclaimerText: {
    color: '#9BA19C',
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  poweredBy: {
    color: '#B8BCB9',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  notFoundTitle: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  notFoundBody: {
    color: '#9BA19C',
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  notFoundButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 22,
    paddingVertical: 13,
  },
  notFoundButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    fontWeight: '700',
  },
});
