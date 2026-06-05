import { router, useFocusEffect, type Href } from 'expo-router';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { ArrowRight, Check, ChevronUp, Flower2, Gift, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBrandHeader } from '@/components/app-brand-header';
import { formatPhp, getCartSummary, type CartItem, type Product } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { ApiError } from '@/services/api-client';
import { clearAuthSession, getAuthSession, type AuthSession } from '@/services/auth-session';
import { getGuestCartItems, removeGuestCartItem, updateGuestCartItemQuantity } from '@/services/guest-cart';
import { createOrdersFromCart, createPayMongoCheckout } from '@/services/payments-api';
import { shopApi } from '@/services/shop-api';

const outlineColor = 'rgba(31, 42, 36, 0.11)';
const hairlineColor = 'rgba(31, 42, 36, 0.09)';
const floatingCheckoutOffset = 92;
const paymentCancelRoute = '/payment/cancel' as Href;
const paymentSuccessRoute = '/payment/success' as Href;

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const lastRecommendationBatchAt = useRef(0);
  const recommendationBatchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [hasRequestedRecommendations, setHasRequestedRecommendations] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<ReadonlySet<string>>(() => new Set());
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isAppendingRecommendations, setIsAppendingRecommendations] = useState(false);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const [visibleRecommendationCount, setVisibleRecommendationCount] = useState(4);
  const selectedCartItems = useMemo(
    () => cartItems.filter((item) => selectedProductIds.has(item.product.id)),
    [cartItems, selectedProductIds],
  );
  const cartSummary = getCartSummary(selectedCartItems);
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const selectedItemCount = selectedCartItems.reduce((total, item) => total + item.quantity, 0);
  const isSignedIn = Boolean(session);
  const isAllSelected = cartItems.length > 0 && selectedProductIds.size === cartItems.length;
  const visibleRecommendations = useMemo(() => {
    const cartProductIds = new Set(cartItems.map((item) => item.product.id));

    return recommendedProducts.filter((product) => !cartProductIds.has(product.id)).slice(0, visibleRecommendationCount);
  }, [cartItems, recommendedProducts, visibleRecommendationCount]);
  const recommendationCap = Math.min(recommendedProducts.length, 16);
  const canAppendRecommendations = visibleRecommendationCount < recommendationCap;

  const loadCart = useCallback(async () => {
    setIsLoading(true);

    try {
      const [nextItems, nextSession] = await Promise.all([getGuestCartItems(), getAuthSession()]);
      setCartItems(nextItems);
      setSelectedProductIds(new Set(nextItems.map((item) => item.product.id)));
      setSession(nextSession);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setHasRequestedRecommendations(true);
      void loadCart();

      return () => {
        if (recommendationBatchTimer.current) {
          clearTimeout(recommendationBatchTimer.current);
          recommendationBatchTimer.current = null;
        }
        lastRecommendationBatchAt.current = 0;
        setHasRequestedRecommendations(false);
        setIsAppendingRecommendations(false);
        setIsRecommendationLoading(false);
        setRecommendedProducts([]);
        setVisibleRecommendationCount(4);
      };
    }, [loadCart]),
  );

  const handleUpdateQuantity = useCallback(async (productId: string, quantity: number) => {
    setCartItems(await updateGuestCartItemQuantity(productId, quantity));
  }, []);

  const handleRemoveItem = useCallback(async (productId: string) => {
    setCartItems(await removeGuestCartItem(productId));
    setSelectedProductIds((current) => {
      const next = new Set(current);
      next.delete(productId);
      return next;
    });
  }, []);

  const requestRecommendations = useCallback(() => {
    setHasRequestedRecommendations(true);
  }, []);

  const appendRecommendationBatch = useCallback(() => {
    if (isAppendingRecommendations || !canAppendRecommendations) {
      return;
    }

    setIsAppendingRecommendations(true);

    recommendationBatchTimer.current = setTimeout(() => {
      setVisibleRecommendationCount((current) => Math.min(current + 4, recommendationCap));
      setIsAppendingRecommendations(false);
      recommendationBatchTimer.current = null;
    }, 260);
  }, [canAppendRecommendations, isAppendingRecommendations, recommendationCap]);

  const handleCartScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);

      if (distanceFromBottom < 520) {
        requestRecommendations();
      }

      if (distanceFromBottom < 340 && Date.now() - lastRecommendationBatchAt.current > 700) {
        lastRecommendationBatchAt.current = Date.now();
        appendRecommendationBatch();
      }
    },
    [appendRecommendationBatch, requestRecommendations],
  );

  const handleCheckout = useCallback(async () => {
    if (isCheckingOut) {
      return;
    }

    if (!session) {
      router.push('/(auth)/login');
      return;
    }

    if (selectedCartItems.length === 0) {
      Alert.alert('Select an item', 'Choose at least one item before checkout.');
      return;
    }

    setIsCheckingOut(true);

    try {
      const orderResponse = await createOrdersFromCart({
        items: selectedCartItems,
        session,
      });
      const checkout = await createPayMongoCheckout({
        orderIds: orderResponse.order_ids,
        session,
      });
      const browserResult = await WebBrowser.openAuthSessionAsync(
        checkout.checkout_url,
        'bloomoramobile://payment',
      );

      if (browserResult.type === 'success') {
        if (browserResult.url.includes('/payment/cancel')) {
          router.push(paymentCancelRoute);
        } else {
          router.push(paymentSuccessRoute);
        }
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await clearAuthSession();
        setSession(null);
        Alert.alert('Sign in again', 'Your session expired. Please sign in again before checkout.', [
          {
            text: 'Sign in',
            onPress: () => router.push('/(auth)/login'),
          },
        ]);
        return;
      }

      const message = error instanceof Error ? error.message : 'Unable to start PayMongo checkout.';
      Alert.alert('Checkout unavailable', message);
    } finally {
      setIsCheckingOut(false);
    }
  }, [isCheckingOut, selectedCartItems, session]);

  useEffect(() => {
    if (!hasRequestedRecommendations || recommendedProducts.length > 0 || isRecommendationLoading) {
      return;
    }

    let isActive = true;
    setIsRecommendationLoading(true);

    shopApi
      .getProducts()
      .then((products) => {
        if (isActive) {
          setRecommendedProducts(products);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsRecommendationLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [hasRequestedRecommendations, isRecommendationLoading, recommendedProducts.length]);

  useEffect(() => {
    if (!isLoading && cartItems.length === 0) {
      requestRecommendations();
    }
  }, [cartItems.length, isLoading, requestRecommendations]);

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]}>
          <CartScreenSkeleton />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        onScroll={handleCartScroll}
        scrollEventThrottle={160}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (cartItems.length > 0 && isSignedIn ? 264 : 104) }]}>
        <AppBrandHeader />

        <View style={styles.body}>
          <View>
            <Text style={styles.eyebrow}>SHOPPING BAG</Text>
            <Text style={styles.title}>Your Cart</Text>
            <Text style={styles.subtitle}>
              {itemCount > 0
                ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'} in your cart`
                : isSignedIn
                  ? 'Browse now, then checkout with your saved account details.'
                  : 'Browse now, sign in when you are ready to checkout.'}
            </Text>
          </View>

          {cartItems.length === 0 ? (
            <>
              <EmptyCart />
              {!isSignedIn ? <GuestCheckoutPrompt /> : null}
              <RecommendationGallery
                canAppend={canAppendRecommendations}
                isAppending={isAppendingRecommendations}
                isLoading={isRecommendationLoading}
                products={visibleRecommendations}
              />
            </>
          ) : (
            <>
              <View style={styles.cartList}>
                {cartItems.map((item) => (
                  <CartLineItem
                    item={item}
                    key={item.id}
                    isSelected={selectedProductIds.has(item.product.id)}
                    onRemove={handleRemoveItem}
                    onToggleSelected={() => {
                      setSelectedProductIds((current) => {
                        const next = new Set(current);

                        if (next.has(item.product.id)) {
                          next.delete(item.product.id);
                        } else {
                          next.add(item.product.id);
                        }

                        return next;
                      });
                    }}
                    onUpdateQuantity={handleUpdateQuantity}
                  />
                ))}
              </View>

              {!isSignedIn ? <PriceBreakdown summary={cartSummary} /> : null}

              {!isSignedIn ? <GuestCheckoutPrompt /> : null}

              <RecommendationGallery
                canAppend={canAppendRecommendations}
                isAppending={isAppendingRecommendations}
                isLoading={isRecommendationLoading}
                products={visibleRecommendations}
              />
            </>
          )}
        </View>
      </ScrollView>

      {cartItems.length > 0 && isSignedIn ? (
        <CheckoutBar
          isAllSelected={isAllSelected}
          isCheckingOut={isCheckingOut}
          itemCount={selectedItemCount}
          onCheckout={handleCheckout}
          onToggleAll={() => {
            setSelectedProductIds((current) =>
              current.size === cartItems.length ? new Set() : new Set(cartItems.map((item) => item.product.id)),
            );
          }}
          summary={cartSummary}
          bottomInset={insets.bottom}
        />
      ) : null}
    </View>
  );
}

function GuestCheckoutPrompt() {
  return (
    <View style={styles.checkoutPanel}>
      <View style={styles.checkoutIcon}>
        <ShoppingBag size={20} color={theme.colors.primary} strokeWidth={2.2} />
      </View>
      <View style={styles.checkoutCopy}>
        <Text style={styles.checkoutTitle}>Sign in to checkout</Text>
        <Text style={styles.checkoutText}>Login or create an account to add delivery details and place the order.</Text>
      </View>
      <Pressable
        accessibilityLabel="Sign in to checkout"
        accessibilityRole="button"
        onPress={() => router.push('/(auth)/login')}
        style={({ pressed }) => [styles.checkoutButton, pressed && styles.pressed]}>
        <ArrowRight size={18} color={theme.colors.white} strokeWidth={2.4} />
      </Pressable>
    </View>
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
  isSelected,
  item,
  onRemove,
  onToggleSelected,
  onUpdateQuantity,
}: {
  isSelected: boolean;
  item: CartItem;
  onRemove: (productId: string) => void;
  onToggleSelected: () => void;
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
      duration: 220,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start(() => onRemove(item.product.id));
  }, [isRemoving, item.product.id, onRemove, removeProgress]);

  const animatedStyle = {
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
      <View style={styles.cartItemMain}>
        <Checkbox checked={isSelected} label={`Select ${item.product.name}`} onPress={onToggleSelected} />
        {item.product.imageUrl ? (
          <Image cachePolicy="memory-disk" contentFit="cover" recyclingKey={item.product.id} source={{ uri: item.product.imageUrl }} style={styles.cartItemImage} />
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
      </View>
      <Pressable accessibilityRole="button" style={({ pressed }) => [styles.addOnDeal, pressed && styles.pressed]} onPress={() => {}}>
        <View style={styles.addOnIcon}>
          <Gift size={17} color={theme.colors.primary} strokeWidth={2.2} />
        </View>
        <Text style={styles.addOnText}>Add-on deals at lower prices</Text>
        <ArrowRight size={16} color={theme.colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

function RecommendationGallery({
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
        <GallerySkeleton />
      ) : (
        <View style={styles.recommendationGrid}>
          {products.map((product) => (
            <Pressable
              accessibilityLabel={`View ${product.name} details`}
              accessibilityRole="button"
              key={product.id}
              onPress={() => router.push(`/product-details?id=${encodeURIComponent(product.id)}`)}
              style={({ pressed }) => [styles.recommendationCard, pressed && styles.pressed]}>
              {product.imageUrl ? (
                <Image cachePolicy="memory-disk" contentFit="contain" recyclingKey={product.id} source={{ uri: product.imageUrl }} style={styles.recommendationImage} />
              ) : (
                <View style={styles.recommendationImageFallback}>
                  <Flower2 size={28} color={theme.colors.primary} />
                </View>
              )}
              <View style={styles.recommendationBody}>
                <Text numberOfLines={2} style={styles.recommendationName}>{product.name}</Text>
                <Text style={styles.recommendationPrice}>{formatPhp(product.priceCents)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
      {isAppending ? <RecommendationAppendLoader /> : null}
      {!isAppending && canAppend && products.length > 0 ? <View style={styles.recommendationScrollBuffer} /> : null}
    </View>
  );
}

function RecommendationAppendLoader() {
  return (
    <View style={styles.recommendationAppendLoader}>
      {[0, 1].map((item) => (
        <View key={item} style={styles.recommendationCard}>
          <SkeletonBlock style={styles.recommendationImage} />
          <View style={styles.recommendationBody}>
            <SkeletonBlock style={styles.skeletonLineWide} />
            <SkeletonBlock style={styles.skeletonLineShort} />
          </View>
        </View>
      ))}
    </View>
  );
}

function CheckoutBar({
  bottomInset,
  isAllSelected,
  isCheckingOut,
  itemCount,
  onCheckout,
  onToggleAll,
  summary,
}: {
  bottomInset: number;
  isAllSelected: boolean;
  isCheckingOut: boolean;
  itemCount: number;
  onCheckout: () => void;
  onToggleAll: () => void;
  summary: ReturnType<typeof getCartSummary>;
}) {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  return (
    <View style={[styles.checkoutBarWrap, { bottom: Math.max(bottomInset + floatingCheckoutOffset, 104) }]}>
      {isBreakdownOpen ? (
        <View style={styles.checkoutBreakdownPanel}>
          <PriceBreakdown summary={summary} compact />
        </View>
      ) : null}
      <View style={styles.checkoutTotalRow}>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: isAllSelected }} style={styles.allSelector} onPress={onToggleAll}>
          <CheckboxMark checked={isAllSelected} />
          <Text style={styles.allSelectorText}>All</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.checkoutTotalTextButton, pressed && styles.pressed]}
          onPress={() => setIsBreakdownOpen((current) => !current)}>
          <Text style={styles.checkoutTotalValue}>{formatPhp(summary.totalCents)}</Text>
          <ChevronUp
            size={16}
            color={theme.colors.primary}
            style={{ transform: [{ rotate: isBreakdownOpen ? '180deg' : '0deg' }] }}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: isCheckingOut, disabled: isCheckingOut || itemCount === 0 }}
          disabled={isCheckingOut || itemCount === 0}
          style={({ pressed }) => [
            styles.checkoutBarButton,
            (isCheckingOut || itemCount === 0) && styles.checkoutBarButtonDisabled,
            pressed && !isCheckingOut && itemCount > 0 && styles.pressed,
          ]}
          onPress={onCheckout}>
          <Text style={styles.checkoutBarText}>{isCheckingOut ? 'Opening...' : `Checkout (${itemCount})`}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Checkbox({ checked, label, onPress }: { checked: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="checkbox" accessibilityState={{ checked }} style={styles.itemCheckbox} onPress={onPress}>
      <CheckboxMark checked={checked} />
    </Pressable>
  );
}

function CheckboxMark({ checked }: { checked: boolean }) {
  return (
    <View style={[styles.checkboxMark, checked && styles.checkboxMarkChecked]}>
      {checked ? <Check size={14} color={theme.colors.white} strokeWidth={3} /> : null}
    </View>
  );
}

function CartSkeleton() {
  return (
    <View style={styles.cartSkeletonList}>
      {[0, 1].map((item) => (
        <SkeletonCard key={item} />
      ))}
      <GallerySkeleton />
    </View>
  );
}

function CartScreenSkeleton() {
  return (
    <>
      <View style={styles.skeletonBrandHeader}>
        <View style={styles.skeletonBrandCopy}>
          <SkeletonBlock style={styles.skeletonLogoLine} />
          <SkeletonBlock style={styles.skeletonBrandLine} />
        </View>
        <View style={styles.skeletonHeaderActions}>
          <SkeletonBlock style={styles.skeletonHeaderIcon} />
          <SkeletonBlock style={styles.skeletonHeaderIcon} />
        </View>
      </View>
      <View style={styles.body}>
        <CartHeaderSkeleton />
        <CartSkeleton />
      </View>
    </>
  );
}

function CartHeaderSkeleton() {
  return (
    <View style={styles.skeletonHeaderCopy}>
      <SkeletonBlock style={styles.skeletonLineShort} />
      <SkeletonBlock style={styles.skeletonTitleLine} />
      <SkeletonBlock style={styles.skeletonLineWide} />
    </View>
  );
}

function GallerySkeleton() {
  return (
    <View style={styles.recommendationGrid}>
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={styles.recommendationCard}>
          <SkeletonBlock style={styles.recommendationImage} />
          <View style={styles.recommendationBody}>
            <SkeletonBlock style={styles.skeletonLineWide} />
            <SkeletonBlock style={styles.skeletonLineShort} />
          </View>
        </View>
      ))}
    </View>
  );
}

function SkeletonCard() {
  return (
    <View style={styles.cartItem}>
      <View style={styles.cartItemMain}>
        <SkeletonBlock style={styles.skeletonCheckbox} />
        <SkeletonBlock style={styles.cartItemImage} />
        <View style={styles.skeletonCartBody}>
          <SkeletonBlock style={styles.skeletonLineShort} />
          <SkeletonBlock style={styles.skeletonLineWide} />
          <SkeletonBlock style={styles.skeletonLineMedium} />
          <SkeletonBlock style={styles.skeletonControl} />
        </View>
      </View>
      <SkeletonBlock style={styles.skeletonAddOn} />
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

function PriceBreakdown({
  compact = false,
  summary,
}: {
  compact?: boolean;
  summary: ReturnType<typeof getCartSummary>;
}) {
  return (
    <View style={[styles.summaryPanel, compact && styles.summaryPanelCompact]}>
      <SummaryRow label="Subtotal" value={formatPhp(summary.subtotalCents)} />
      <SummaryRow label="Estimated delivery" value={formatPhp(summary.deliveryCents)} />
      <View style={styles.summaryDivider} />
      <SummaryRow isTotal label="Total" value={formatPhp(summary.totalCents)} />
    </View>
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
  scroll: {
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
    fontFamily: Fonts.sansSemiBold,
    fontSize: 26,
    lineHeight: 32,
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
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    padding: theme.spacing.md,
  },
  cartItemMain: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  itemCheckbox: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    marginLeft: -2,
    width: 26,
  },
  checkboxMark: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: outlineColor,
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxMarkChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
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
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: 4,
  },
  quantityButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.sm,
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
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  addOnDeal: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: hairlineColor,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 42,
    paddingHorizontal: theme.spacing.md,
  },
  addOnIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.sm,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  addOnText: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 17,
  },
  recommendationSection: {
    gap: theme.spacing.md,
  },
  recommendationLoadingText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
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
  recommendationAppendLoader: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  recommendationScrollBuffer: {
    height: 32,
  },
  recommendationCard: {
    backgroundColor: theme.colors.surface,
    borderColor: outlineColor,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    overflow: 'hidden',
    width: '47.8%',
  },
  recommendationImage: {
    backgroundColor: theme.colors.white,
    height: 158,
    width: '100%',
  },
  recommendationImageFallback: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    height: 158,
    justifyContent: 'center',
    width: '100%',
  },
  recommendationBody: {
    gap: 4,
    padding: theme.spacing.sm,
  },
  recommendationName: {
    color: theme.colors.text,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    minHeight: 36,
  },
  recommendationPrice: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    lineHeight: 18,
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
  summaryPanelCompact: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
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
    borderRadius: theme.radius.sm,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    width: 44,
  },
  checkoutBarWrap: {
    backgroundColor: theme.colors.white,
    gap: theme.spacing.md,
    left: 0,
    paddingHorizontal: theme.spacing.lg,
    position: 'absolute',
    right: 0,
  },
  checkoutBreakdownPanel: {
    backgroundColor: theme.colors.white,
    borderColor: hairlineColor,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    boxShadow: '0 10px 24px rgba(31, 42, 36, 0.14)',
    overflow: 'hidden',
  },
  checkoutTotalRow: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: hairlineColor,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
  allSelector: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    minHeight: 44,
    paddingHorizontal: theme.spacing.xs,
  },
  allSelectorText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
  },
  checkoutTotalTextButton: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    justifyContent: 'flex-end',
    minWidth: 0,
    paddingHorizontal: theme.spacing.xs,
  },
  checkoutTotalLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  checkoutTotalValue: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    lineHeight: 24,
  },
  checkoutBarButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
  },
  checkoutBarButtonDisabled: {
    opacity: 0.58,
  },
  checkoutBarText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  cartSkeletonList: {
    gap: theme.spacing.md,
  },
  skeletonBase: {
    backgroundColor: '#E8ECE9',
    overflow: 'hidden',
  },
  skeletonBrandHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 78,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  skeletonBrandCopy: {
    gap: theme.spacing.sm,
    width: 154,
  },
  skeletonLogoLine: {
    borderRadius: theme.radius.sm,
    height: 24,
    width: 120,
  },
  skeletonBrandLine: {
    borderRadius: theme.radius.sm,
    height: 10,
    width: 72,
  },
  skeletonHeaderActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  skeletonHeaderIcon: {
    borderRadius: theme.radius.pill,
    height: 34,
    width: 34,
  },
  skeletonHeaderCopy: {
    gap: theme.spacing.sm,
    width: '72%',
  },
  skeletonTitleLine: {
    borderRadius: theme.radius.sm,
    height: 28,
    width: '78%',
  },
  skeletonCheckbox: {
    borderRadius: theme.radius.sm,
    height: 22,
    width: 22,
  },
  skeletonCartBody: {
    flex: 1,
    gap: theme.spacing.sm,
    minWidth: 0,
  },
  skeletonLineShort: {
    borderRadius: theme.radius.sm,
    height: 14,
    width: '42%',
  },
  skeletonLineMedium: {
    borderRadius: theme.radius.sm,
    height: 16,
    width: '62%',
  },
  skeletonLineWide: {
    borderRadius: theme.radius.sm,
    height: 16,
    width: '86%',
  },
  skeletonControl: {
    borderRadius: theme.radius.sm,
    height: 34,
    marginTop: theme.spacing.sm,
    width: '70%',
  },
  skeletonAddOn: {
    borderRadius: theme.radius.sm,
    height: 42,
    width: '100%',
  },
});
