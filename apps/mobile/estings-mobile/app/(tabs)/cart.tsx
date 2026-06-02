import { router, useFocusEffect } from 'expo-router';
import { ArrowRight, Flower2, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBrandHeader } from '@/components/app-brand-header';
import { formatPhp, getCartSummary, type CartItem } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { getGuestCartItems, removeGuestCartItem, updateGuestCartItemQuantity } from '@/services/guest-cart';

const outlineColor = 'rgba(31, 42, 36, 0.11)';
const hairlineColor = 'rgba(31, 42, 36, 0.09)';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const cartSummary = getCartSummary(cartItems);
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const loadCart = useCallback(async () => {
    setIsLoading(true);

    try {
      setCartItems(await getGuestCartItems());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCart();
    }, [loadCart]),
  );

  const handleUpdateQuantity = useCallback(async (productId: string, quantity: number) => {
    setCartItems(await updateGuestCartItemQuantity(productId, quantity));
  }, []);

  const handleRemoveItem = useCallback(async (productId: string) => {
    setCartItems(await removeGuestCartItem(productId));
  }, []);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]}>
      <AppBrandHeader />

      <View style={styles.body}>
        <View>
          <Text style={styles.eyebrow}>SHOPPING BAG</Text>
          <Text style={styles.title}>Your Cart</Text>
          <Text style={styles.subtitle}>
            {itemCount > 0 ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'} ready for checkout` : 'Browse now, sign in when you are ready to checkout.'}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.statePanel}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.stateText}>Loading your cart</Text>
          </View>
        ) : cartItems.length === 0 ? (
          <EmptyCart />
        ) : (
          <>
            <View style={styles.cartList}>
              {cartItems.map((item) => (
                <CartLineItem
                  item={item}
                  key={item.id}
                  onRemove={handleRemoveItem}
                  onUpdateQuantity={handleUpdateQuantity}
                />
              ))}
            </View>

            <View style={styles.summaryPanel}>
              <SummaryRow label="Subtotal" value={formatPhp(cartSummary.subtotalCents)} />
              <SummaryRow label="Estimated delivery" value={formatPhp(cartSummary.deliveryCents)} />
              <SummaryRow label="Guest discount" value={`-${formatPhp(cartSummary.discountCents)}`} />
              <View style={styles.summaryDivider} />
              <SummaryRow isTotal label="Total" value={formatPhp(cartSummary.totalCents)} />
            </View>

            <View style={styles.checkoutPanel}>
              <View style={styles.checkoutIcon}>
                <ShoppingBag size={20} color={theme.colors.primary} strokeWidth={2.2} />
              </View>
              <View style={styles.checkoutCopy}>
                <Text style={styles.checkoutTitle}>Sign in to checkout</Text>
                <Text style={styles.checkoutText}>Your guest cart is ready. Login or create an account to add delivery details and place the order.</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(auth)/login')}
                style={({ pressed }) => [styles.checkoutButton, pressed && styles.pressed]}>
                <ArrowRight size={18} color={theme.colors.white} strokeWidth={2.4} />
              </Pressable>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function EmptyCart() {
  return (
    <View style={styles.emptyPanel}>
      <View style={styles.emptyIconRing}>
        <View style={styles.emptyIcon}>
          <ShoppingBag size={34} color={theme.colors.primary} strokeWidth={2} />
        </View>
      </View>
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptyText}>Add flowers from categories or the feed. You can checkout after signing in.</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/categories')}
        style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}>
        <Text style={styles.primaryActionText}>Browse products</Text>
        <ArrowRight size={17} color={theme.colors.white} strokeWidth={2.3} />
      </Pressable>
    </View>
  );
}

function CartLineItem({
  item,
  onRemove,
  onUpdateQuantity,
}: {
  item: CartItem;
  onRemove: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}) {
  const lineTotal = item.product.priceCents * item.quantity;
  const removeProgress = useRef(new Animated.Value(0)).current;
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = useCallback(() => {
    if (isRemoving) {
      return;
    }

    setIsRemoving(true);
    Animated.timing(removeProgress, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: false,
    }).start(() => onRemove(item.product.id));
  }, [isRemoving, item.product.id, onRemove, removeProgress]);

  const animatedStyle = {
    maxHeight: removeProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [156, 0],
    }),
    marginBottom: removeProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.spacing.md, 0],
    }),
    opacity: removeProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
    transform: [
      {
        translateX: removeProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -18],
        }),
      },
      {
        scale: removeProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.96],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.cartItem, animatedStyle]}>
      {item.product.imageUrl ? (
        <Image resizeMode="cover" source={{ uri: item.product.imageUrl }} style={styles.cartItemImage} />
      ) : (
        <View style={styles.cartItemFallback}>
          <Flower2 size={24} color={theme.colors.primary} />
        </View>
      )}
      <View style={styles.cartItemBody}>
        <Text numberOfLines={1} style={styles.cartItemCategory}>
          {item.product.categoryName ?? item.product.tag}
        </Text>
        <Text numberOfLines={2} style={styles.cartItemName}>
          {item.product.name}
        </Text>
        <Text style={styles.cartItemPrice}>{formatPhp(lineTotal)}</Text>
        <View style={styles.cartItemActions}>
          <View style={styles.quantityControl}>
            <Pressable
              accessibilityLabel={`Decrease ${item.product.name} quantity`}
              disabled={isRemoving}
              onPress={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
              style={styles.quantityButton}>
              <Minus size={15} color={theme.colors.text} />
            </Pressable>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <Pressable
              accessibilityLabel={`Increase ${item.product.name} quantity`}
              disabled={isRemoving}
              onPress={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
              style={styles.quantityButton}>
              <Plus size={15} color={theme.colors.text} />
            </Pressable>
          </View>
          <Pressable
            accessibilityLabel={`Remove ${item.product.name}`}
            disabled={isRemoving}
            onPress={handleRemove}
            style={[styles.removeButton, isRemoving && styles.removeButtonActive]}>
            <Trash2 size={16} color={theme.colors.danger} />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

function SummaryRow({ isTotal = false, label, value }: { isTotal?: boolean; label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, isTotal && styles.summaryTotalLabel]}>{label}</Text>
      <Text style={[styles.summaryValue, isTotal && styles.summaryTotalValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    gap: theme.spacing.lg,
  },
  body: {
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontFamily: Fonts.condensedMedium,
    fontSize: 13,
    lineHeight: 16,
  },
  title: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  statePanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: outlineColor,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  stateText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
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
  cartList: {
    marginBottom: -theme.spacing.md,
  },
  cartItem: {
    backgroundColor: theme.colors.surface,
    borderColor: outlineColor,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    padding: theme.spacing.md,
  },
  cartItemImage: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    height: 108,
    width: 92,
  },
  cartItemFallback: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.md,
    height: 108,
    justifyContent: 'center',
    width: 92,
  },
  cartItemBody: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  cartItemCategory: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  cartItemName: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
  },
  cartItemPrice: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    lineHeight: 20,
  },
  cartItemActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  quantityControl: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: outlineColor,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: 4,
  },
  quantityButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.pill,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  quantityText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    minWidth: 18,
    textAlign: 'center',
  },
  removeButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: outlineColor,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  removeButtonActive: {
    opacity: 0.7,
  },
  summaryPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: outlineColor,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
  },
  summaryValue: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  summaryTotalLabel: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
  },
  summaryTotalValue: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 18,
  },
  summaryDivider: {
    backgroundColor: hairlineColor,
    height: 1,
    marginVertical: theme.spacing.xs,
  },
  checkoutPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: outlineColor,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  checkoutIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(46, 139, 52, 0.11)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  checkoutCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  checkoutTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
  },
  checkoutText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  checkoutButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
