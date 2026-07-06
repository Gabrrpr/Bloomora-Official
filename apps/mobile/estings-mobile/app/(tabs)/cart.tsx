import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowRight, Check, ChevronRight, ChevronUp, Flower2, Minus, Plus, ShoppingBag, Sparkles, Trash2 } from 'lucide-react-native';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBrandHeader, getAppBrandHeaderLayout } from '@/components/app-brand-header';
import { ProductCard } from '@/components/product-card';
import { formatPhp, getCartSummary, type CartItem, type Product } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { ApiError } from '@/services/api-client';
import { clearAuthSession, getAuthSession, type AuthSession } from '@/services/auth-session';
import {
  getCartItems,
  removeCartItem,
  setCartItems as persistCartItems,
  updateCartItemQuantity,
} from '@/services/cart-storage';
import { shopApi } from '@/services/shop-api';
import { getStoreBranch, type StoreBranch } from '@/services/branch-preference';
import { validateVoucher, type AppliedVoucher } from '@/services/commerce-api';
import { buildCartProductRecommendations, createRecommendationSeed } from '@/utils/product-recommendations';

const outlineColor = 'rgba(31, 42, 36, 0.11)';
const hairlineColor = 'rgba(31, 42, 36, 0.09)';
const pageBackground = '#F5F5F5';
const floatingCheckoutOffset = 92;

type CartListRow =
  | { id: 'header'; type: 'header' }
  | { id: 'empty'; type: 'empty' }
  | { id: 'guest'; type: 'guest' }
  | { id: 'voucher'; type: 'voucher' }
  | { id: 'summary'; type: 'summary' }
  | { id: 'recommendation-title'; type: 'recommendation-title' }
  | { id: 'recommendation-skeleton'; type: 'recommendation-skeleton' }
  | { id: string; index: number; item: CartItem; type: 'cart-item' }
  | { id: string; products: Product[]; type: 'recommendation-row' };

export default function CartScreen() {
  const params = useLocalSearchParams<{ voucher?: string }>();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const brandHeaderLayout = getAppBrandHeaderLayout(width, height, insets.top);
  const headerHeight = brandHeaderLayout.top + brandHeaderLayout.height;
  const recommendationSeed = useRef(createRecommendationSeed()).current;
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [hasRequestedRecommendations, setHasRequestedRecommendations] = useState(true);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<ReadonlySet<string>>(() => new Set());
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [branch, setBranch] = useState<StoreBranch>('manila');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);
  const [voucherMessage, setVoucherMessage] = useState<string | null>(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
  const lastVoucherParam = useRef<string | null>(null);
  const selectedCartItems = useMemo(
    () => cartItems.filter((item) => selectedProductIds.has(item.product.id)),
    [cartItems, selectedProductIds],
  );
  const cartSummary = getCartSummary(selectedCartItems);
  const selectedItemCount = selectedCartItems.reduce((total, item) => total + item.quantity, 0);
  const isSignedIn = Boolean(session);
  const isAllSelected = cartItems.length > 0 && selectedProductIds.size === cartItems.length;
  const productsForRecommendations = recommendedProducts.length > 0 ? recommendedProducts : catalogProducts;
  const rankedRecommendations = useMemo(
    () =>
      buildCartProductRecommendations({
        cartItems,
        products: productsForRecommendations,
        seed: recommendationSeed,
      }),
    [cartItems, productsForRecommendations, recommendationSeed],
  );

  useEffect(() => {
    const incomingVoucher = typeof params.voucher === 'string' ? params.voucher.trim().toUpperCase() : '';
    if (!incomingVoucher || incomingVoucher === lastVoucherParam.current) {
      return;
    }
    lastVoucherParam.current = incomingVoucher;
    setAppliedVoucher(null);
    setVoucherCode(incomingVoucher);
    setVoucherMessage('Voucher filled in from the feed. Tap Apply when you are ready.');
  }, [params.voucher]);

  const loadCart = useCallback(async (showLoading = true, forceRefresh = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const selectedBranch = await getStoreBranch();
      setBranch(selectedBranch);
      const storedItems = await getCartItems({ forceRefresh });

      setCartItems(storedItems);
      setSelectedProductIds(new Set(storedItems.map((item) => item.product.id)));

      const catalog = await shopApi.getCatalog({ branch: selectedBranch });
      const liveProducts = catalog.products;
      setCatalogProducts(liveProducts);
      const nextItems = hydrateCartItemsFromInventory(storedItems, liveProducts);

      if (!areCartItemsEquivalent(storedItems, nextItems)) {
        await persistCartItems(nextItems);
      }

      setCartItems(nextItems);
      setSelectedProductIds(new Set(nextItems.map((item) => item.product.id)));
    } catch (error) {
      console.warn('Failed to load cart items.', error);
      try {
        const fallbackItems = await getCartItems({ forceRefresh: false });

        setCartItems(fallbackItems);
        setSelectedProductIds(new Set(fallbackItems.map((item) => item.product.id)));
      } catch (fallbackError) {
        console.warn('Failed to load local cart items.', fallbackError);
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }

    try {
      setSession(await getAuthSession());
    } catch (error) {
      console.warn('Failed to load auth session for cart.', error);
      setSession(null);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      await loadCart(false, true);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, loadCart]);

  useFocusEffect(
    useCallback(() => {
      setHasRequestedRecommendations(true);
      void loadCart(true, true);

      return undefined;
    }, [loadCart]),
  );

  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
    const item = cartItems.find((cartItem) => cartItem.product.id === productId);
    if (!item || isAiArrangementCartItem(item)) {
      return;
    }

    const previousItems = cartItems;
    const stockLimit = item.product.stock && item.product.stock > 0 ? item.product.stock : 99;
    const nextQuantity = Math.min(Math.max(quantity, 1), stockLimit);
    const optimisticItems = cartItems.map((cartItem) =>
      cartItem.product.id === productId ? { ...cartItem, quantity: nextQuantity } : cartItem,
    );

    setCartItems(optimisticItems);

    void updateCartItemQuantity(productId, nextQuantity)
      .then((items) => {
        setCartItems(items);
      })
      .catch((error) => {
        setCartItems(previousItems);
        Alert.alert(
          'Unable to update quantity',
          error instanceof Error ? error.message : 'Please try again.',
        );
      });
  }, [cartItems]);

  const handleRemoveItem = useCallback(async (productId: string) => {
    setCartItems(await removeCartItem(productId));
    setSelectedProductIds((current) => {
      const next = new Set(current);
      next.delete(productId);
      return next;
    });
  }, []);

  const requestRecommendations = useCallback(() => {
    setHasRequestedRecommendations(true);
  }, []);

  const handleApplyVoucher = useCallback(async () => {
    if (!session || isValidatingVoucher) return;
    if (!voucherCode.trim()) {
      setAppliedVoucher(null);
      setVoucherMessage('Enter a voucher code.');
      return;
    }
    setIsValidatingVoucher(true);
    try {
      const voucher = await validateVoucher({
        code: voucherCode,
        session,
        subtotal: cartSummary.subtotalCents / 100,
      });
      setAppliedVoucher(voucher);
      setVoucherCode(voucher.code);
      setVoucherMessage(`Applied. You saved ${formatPhp(Math.round(voucher.discount * 100))}.`);
    } catch (error) {
      setAppliedVoucher(null);
      setVoucherMessage(error instanceof Error ? error.message : 'Voucher is invalid.');
    } finally {
      setIsValidatingVoucher(false);
    }
  }, [cartSummary.subtotalCents, isValidatingVoucher, session, voucherCode]);

  const appliedVoucherCode = appliedVoucher?.code;

  useEffect(() => {
    if (!appliedVoucherCode || !session) return;
    let active = true;
    void validateVoucher({
      code: appliedVoucherCode,
      session,
      subtotal: cartSummary.subtotalCents / 100,
    })
      .then((voucher) => {
        if (active) {
          setAppliedVoucher(voucher);
          setVoucherMessage(`Applied. You saved ${formatPhp(Math.round(voucher.discount * 100))}.`);
        }
      })
      .catch((error) => {
        if (active) {
          setAppliedVoucher(null);
          setVoucherMessage(error instanceof Error ? error.message : 'Voucher is no longer valid.');
        }
      });
    return () => {
      active = false;
    };
  }, [appliedVoucherCode, cartSummary.subtotalCents, session]);

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
    const incompatible = selectedCartItems.filter((item) => {
      const branches = item.product.branches?.map((value) => value.toLowerCase()) ?? [];
      return branches.length > 0 && !branches.includes('all') && !branches.includes(branch);
    });
    if (incompatible.length) {
      Alert.alert(
        'Mixed branch cart',
        `${incompatible.map((item) => item.product.name).join(', ')} is unavailable in the ${branch === 'manila' ? 'Manila' : 'Pampanga'} branch. Remove it or change the selected branch.`,
      );
      return;
    }

    setIsCheckingOut(true);

    try {
      const liveProducts = await shopApi.getProducts();
      const hydratedSelectedItems = hydrateCartItemsFromInventory(selectedCartItems, liveProducts, {
        removeUnavailable: true,
      });

      if (hydratedSelectedItems.length !== selectedCartItems.length) {
        Alert.alert('Cart updated', 'Some selected items are no longer available. Please review your cart before checkout.');
        await loadCart();
        return;
      }

      const checkoutQuery = hydratedSelectedItems.map((item) => item.product.id).join(',');
      const voucherQuery = appliedVoucher ? `&voucher=${encodeURIComponent(appliedVoucher.code)}` : '';
      router.push(`/checkout?ids=${encodeURIComponent(checkoutQuery)}${voucherQuery}`);
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

      const message = error instanceof Error ? error.message : 'Unable to prepare checkout.';
      Alert.alert('Checkout unavailable', message);
    } finally {
      setIsCheckingOut(false);
    }
  }, [appliedVoucher, branch, isCheckingOut, loadCart, selectedCartItems, session]);

  useEffect(() => {
    if (!hasRequestedRecommendations || recommendedProducts.length > 0 || isRecommendationLoading) {
      return;
    }

    let isActive = true;
    setIsRecommendationLoading(true);

    shopApi
      .getRecommendations(16, { branch })
      .then((products) => {
        if (isActive) {
          setRecommendedProducts(products);
        }
      })
      .catch((error) => {
        if (isActive) {
          console.warn('Failed to load cart recommendations.', error);
          void shopApi.getCatalog({ branch }).then((catalog) => {
            if (isActive) {
              setRecommendedProducts(catalog.products);
              setCatalogProducts(catalog.products);
            }
          }).catch(() => setRecommendedProducts([]));
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
  }, [branch, hasRequestedRecommendations, isRecommendationLoading, recommendedProducts.length]);

  useEffect(() => {
    if (!isLoading && cartItems.length === 0) {
      requestRecommendations();
    }
  }, [cartItems.length, isLoading, requestRecommendations]);

  const listRows = useMemo<CartListRow[]>(() => {
    const rows: CartListRow[] = [{ id: 'header', type: 'header' }];

    if (cartItems.length === 0) {
      rows.push({ id: 'empty', type: 'empty' });
    } else {
      rows.push(
        ...cartItems.map(
          (item, index): CartListRow => ({
            id: `cart-${item.id}`,
            index,
            item,
            type: 'cart-item',
          }),
        ),
        { id: 'summary', type: 'summary' },
        { id: 'voucher', type: 'voucher' },
      );
    }

    if (!isSignedIn) {
      rows.push({ id: 'guest', type: 'guest' });
    }

    rows.push({ id: 'recommendation-title', type: 'recommendation-title' });

    if (isRecommendationLoading && rankedRecommendations.length === 0) {
      rows.push({ id: 'recommendation-skeleton', type: 'recommendation-skeleton' });
    } else {
      for (let index = 0; index < rankedRecommendations.length; index += 2) {
        const products = rankedRecommendations.slice(index, index + 2);
        rows.push({
          id: `recommendations-${products.map((product) => product.id).join('-')}`,
          products,
          type: 'recommendation-row',
        });
      }
    }

    return rows;
  }, [cartItems, isRecommendationLoading, isSignedIn, rankedRecommendations]);

  const handleToggleSelected = useCallback((productId: string) => {
    setSelectedProductIds((current) => {
      const next = new Set(current);

      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }

      return next;
    });
  }, []);

  const renderListRow = useCallback(
    ({ item: row }: { item: CartListRow }) => {
      if (row.type === 'header') {
        return (
          <View style={[styles.pageHeader, styles.sectionSpacing]}>
            <Text style={styles.title}>Shopping Bag</Text>
          </View>
        );
      }

      if (row.type === 'empty') {
        return (
          <View style={styles.sectionSpacing}>
            <EmptyCart />
          </View>
        );
      }

      if (row.type === 'guest') {
        return (
          <View style={styles.sectionSpacing}>
            <GuestCheckoutPrompt />
          </View>
        );
      }

      if (row.type === 'summary') {
        return (
          <View style={styles.sectionSpacing}>
            <PriceBreakdown appliedVoucher={appliedVoucher} summary={cartSummary} />
          </View>
        );
      }

      if (row.type === 'voucher') {
        return (
          <View style={[styles.voucherPanel, styles.sectionSpacing]}>
            <Text style={styles.voucherTitle}>Voucher code</Text>
            <View style={styles.voucherRow}>
              <TextInput
                autoCapitalize="characters"
                editable={!isValidatingVoucher && !appliedVoucher}
                onChangeText={(value) => {
                  setVoucherCode(value);
                  setVoucherMessage(null);
                }}
                placeholder="Enter voucher"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.voucherInput}
                value={voucherCode}
              />
              <Pressable
                onPress={
                  appliedVoucher
                    ? () => {
                        setAppliedVoucher(null);
                        setVoucherCode('');
                        setVoucherMessage(null);
                      }
                    : handleApplyVoucher
                }
                style={styles.voucherButton}>
                <Text style={styles.voucherButtonText}>
                  {appliedVoucher ? 'Remove' : isValidatingVoucher ? 'Checking...' : 'Apply'}
                </Text>
              </Pressable>
            </View>
            {voucherMessage ? (
              <Text style={[styles.voucherMessage, appliedVoucher && styles.voucherMessageSuccess]}>
                {voucherMessage}
              </Text>
            ) : null}
          </View>
        );
      }

      if (row.type === 'recommendation-title') {
        return (
          <View style={[styles.recommendationHeader, styles.sectionSpacing]}>
            <View style={styles.recommendationTitleRow}>
              <View style={styles.titleLine} />
              <Text style={styles.recommendationTitle}>You May Also Like</Text>
              <View style={styles.titleLine} />
            </View>
            <Text style={styles.recommendationSubtitle}>
              Content-based matches from what is already in your cart.
            </Text>
          </View>
        );
      }

      if (row.type === 'recommendation-skeleton') {
        return <GallerySkeleton />;
      }

      if (row.type === 'recommendation-row') {
        return (
          <View style={styles.recommendationGridRow}>
            {row.products.map((product) => (
              <ProductCard key={product.id} product={product} style={styles.recommendationCard} />
            ))}
            {row.products.length === 1 ? <View style={styles.recommendationCardSpacer} /> : null}
          </View>
        );
      }

      const isFirst = row.index === 0;
      const isLast = row.index === cartItems.length - 1;

      return (
        <View style={[styles.cartItemShell, isFirst && styles.cartItemShellFirst, isLast && styles.cartItemShellLast]}>
          <CartLineItem
            item={row.item}
            isSelected={selectedProductIds.has(row.item.product.id)}
            onRemove={handleRemoveItem}
            onToggleSelected={handleToggleSelected}
            onUpdateQuantity={handleUpdateQuantity}
            showDivider={!isLast}
          />
        </View>
      );
    },
    [appliedVoucher, cartItems.length, cartSummary, handleApplyVoucher, handleRemoveItem, handleToggleSelected, handleUpdateQuantity, isValidatingVoucher, selectedProductIds, voucherCode, voucherMessage],
  );

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <AppBrandHeader absolute={true} style={styles.stickyBrandHeader} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: headerHeight + theme.spacing.md,
              paddingBottom: insets.bottom + 104,
            },
          ]}>
          <CartScreenSkeleton />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppBrandHeader absolute={true} style={styles.stickyBrandHeader} />
      <FlatList
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + theme.spacing.md,
            paddingBottom: insets.bottom + (cartItems.length > 0 && isSignedIn ? 264 : 104),
          },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        data={listRows}
        initialNumToRender={Platform.OS === 'android' ? 8 : 10}
        keyExtractor={(row) => row.id}
        maxToRenderPerBatch={Platform.OS === 'android' ? 6 : 8}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={renderListRow}
        refreshControl={
          <RefreshControl
            colors={[theme.colors.primary]}
            onRefresh={handleRefresh}
            progressBackgroundColor={theme.colors.white}
            refreshing={isRefreshing}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        updateCellsBatchingPeriod={50}
        windowSize={Platform.OS === 'android' ? 7 : 9}
      />

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
          appliedVoucher={appliedVoucher}
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

const CartLineItem = memo(function CartLineItem({
  isSelected,
  item,
  onRemove,
  onToggleSelected,
  onUpdateQuantity,
  showDivider,
}: {
  isSelected: boolean;
  item: CartItem;
  onRemove: (productId: string) => void;
  onToggleSelected: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  showDivider: boolean;
}) {
  const lineTotal = item.product.priceCents * item.quantity;
  const removeProgress = useRef(new Animated.Value(0)).current;
  const [isRemoving, setIsRemoving] = useState(false);
  const isAiArrangement = isAiArrangementCartItem(item);
  const addOnSummary = item.addOns?.map((addOn) => addOn.name).join(', ');

  const handleRemove = useCallback(() => {
    if (isRemoving) {
      return;
    }

    setIsRemoving(true);
    Animated.timing(removeProgress, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: false,
    }).start(() => onRemove(item.product.id));
  }, [isRemoving, item.product.id, onRemove, removeProgress]);

  const handleNavigateToArrangement = useCallback(() => {
    router.push(`/create/arrangement-details?cartItemId=${encodeURIComponent(item.id)}`);
  }, [item.id]);
  const handleNavigateToProduct = useCallback(() => {
    if (isAiArrangement) {
      router.push(`/create/arrangement-details?cartItemId=${encodeURIComponent(item.id)}`);
      return;
    }
    router.push(`/product-details?id=${encodeURIComponent(item.product.id)}`);
  }, [isAiArrangement, item.id, item.product.id]);
  const handleToggle = useCallback(() => {
    onToggleSelected(item.product.id);
  }, [item.product.id, onToggleSelected]);

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

  const itemContent = (
    <>
      <View style={styles.cartItemMain}>
        <Checkbox checked={isSelected} label={`Select ${item.product.name}`} onPress={handleToggle} />
        {item.product.imageUrl ? (
          <Pressable
            accessibilityLabel={`View ${item.product.name} details`}
            accessibilityRole="button"
            onPress={handleNavigateToProduct}
            style={({ pressed }) => pressed && styles.pressed}>
            <Image cachePolicy="memory-disk" contentFit="cover" recyclingKey={item.product.id} source={{ uri: item.product.imageUrl }} style={styles.cartItemImage} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityLabel={`View ${item.product.name} details`}
            accessibilityRole="button"
            onPress={handleNavigateToProduct}
            style={({ pressed }) => [styles.cartItemFallback, pressed && styles.pressed]}>
            <Flower2 size={24} color={theme.colors.primary} />
          </Pressable>
        )}
        <View style={styles.cartItemBody}>
          <View style={styles.cartItemCategoryRow}>
            {isAiArrangement ? (
              <View style={styles.aiBadge}>
                <Sparkles size={10} color={theme.colors.white} strokeWidth={2.4} />
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            ) : null}
            <Text numberOfLines={1} style={[styles.cartItemCategory, isAiArrangement && styles.cartItemCategoryAi]}>
              {item.product.categoryName ?? item.product.tag}
            </Text>
            {isAiArrangement ? (
              <ChevronRight size={14} color={theme.colors.primary} strokeWidth={2.2} />
            ) : null}
          </View>
          <Pressable
            accessibilityLabel={`View ${item.product.name} details`}
            accessibilityRole="button"
            onPress={handleNavigateToProduct}
            style={({ pressed }) => pressed && styles.pressed}>
            <Text numberOfLines={2} style={styles.cartItemName}>
              {item.product.name}
            </Text>
          </Pressable>
          <Text style={styles.cartItemPrice}>{formatPhp(lineTotal)}</Text>
          {addOnSummary ? (
            <Text numberOfLines={2} style={styles.cartItemMeta}>Add-ons: {addOnSummary}</Text>
          ) : null}
          {item.cardMessage ? (
            <Text numberOfLines={2} style={styles.cartItemMeta}>Greeting card: {item.cardMessage}</Text>
          ) : null}
          <View style={styles.cartItemActions}>
            {isAiArrangement ? (
              <View style={styles.aiQuantityPill}>
                <Sparkles size={12} color={theme.colors.primary} strokeWidth={2.4} />
                <Text style={styles.aiQuantityText}>Qty 1</Text>
              </View>
            ) : (
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
            )}
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
    </>
  );

  return (
    <Animated.View style={[styles.cartItem, isAiArrangement && styles.cartItemAi, animatedStyle]}>
      <View style={styles.cartItemContent}>
        {isAiArrangement ? (
          <Pressable
            accessibilityLabel={`View AI arrangement details for ${item.product.name}`}
            accessibilityRole="button"
            onPress={handleNavigateToArrangement}
            style={({ pressed }) => pressed && styles.pressed}>
            {itemContent}
          </Pressable>
        ) : (
          itemContent
        )}
      </View>
      {showDivider ? <View style={styles.cartItemDivider} /> : null}
    </Animated.View>
  );
});

function CheckoutBar({
  appliedVoucher,
  bottomInset,
  isAllSelected,
  isCheckingOut,
  itemCount,
  onCheckout,
  onToggleAll,
  summary,
}: {
  appliedVoucher: AppliedVoucher | null;
  bottomInset: number;
  isAllSelected: boolean;
  isCheckingOut: boolean;
  itemCount: number;
  onCheckout: () => void;
  onToggleAll: () => void;
  summary: ReturnType<typeof getCartSummary>;
}) {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const discountCents = getVoucherDiscountCents(summary, appliedVoucher);
  const totalCents = Math.max(0, summary.subtotalCents - discountCents);

  return (
    <View style={[styles.checkoutBarWrap, { bottom: Math.max(bottomInset + floatingCheckoutOffset, 104) }]}>
      {isBreakdownOpen ? (
        <View style={styles.checkoutBreakdownPanel}>
          <PriceBreakdown appliedVoucher={appliedVoucher} summary={summary} compact />
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
          <Text style={styles.checkoutTotalValue}>{formatPhp(totalCents)}</Text>
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
          <Text style={styles.checkoutBarText}>{isCheckingOut ? 'Checking out...' : `Checkout (${itemCount})`}</Text>
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
  const skeletonColumns = splitIntoColumns([0, 1, 2, 3]);

  return (
    <View style={styles.recommendationGrid}>
      {skeletonColumns.map((column, columnIndex) => (
        <View key={`skeleton-column-${columnIndex}`} style={styles.recommendationColumn}>
          {column.map((item) => (
            <View key={item} style={styles.recommendationCard}>
              <SkeletonBlock style={styles.recommendationImage} />
              <View style={styles.recommendationBody}>
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
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          duration: 760,
          easing: Easing.inOut(Easing.quad),
          toValue: 0.42,
          useNativeDriver: false,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[styles.skeletonBase, style, { opacity }]} />;
}

function PriceBreakdown({
  appliedVoucher,
  compact = false,
  summary,
}: {
  appliedVoucher?: AppliedVoucher | null;
  compact?: boolean;
  summary: ReturnType<typeof getCartSummary>;
}) {
  const discountCents = getVoucherDiscountCents(summary, appliedVoucher ?? null);
  const totalCents = Math.max(0, summary.subtotalCents - discountCents);

  return (
    <View style={[styles.summaryPanel, compact && styles.summaryPanelCompact]}>
      <SummaryRow label="Subtotal" value={formatPhp(summary.subtotalCents)} />
      {appliedVoucher && discountCents > 0 ? (
        <SummaryRow label={`Voucher ${appliedVoucher.code}`} value={`-${formatPhp(discountCents)}`} />
      ) : null}
      <View style={styles.summaryDivider} />
      <SummaryRow isTotal label="Total" value={formatPhp(totalCents)} />
    </View>
  );
}

function getVoucherDiscountCents(summary: ReturnType<typeof getCartSummary>, voucher: AppliedVoucher | null) {
  if (!voucher) {
    return 0;
  }

  return Math.min(summary.subtotalCents, Math.max(0, Math.round(voucher.discount * 100)));
}

function SummaryRow({ isTotal = false, label, value }: { isTotal?: boolean; label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, isTotal && styles.summaryTotalLabel]}>{label}</Text>
      <Text style={[styles.summaryValue, isTotal && styles.summaryTotalValue]}>{value}</Text>
    </View>
  );
}

function isAiArrangementCartItem(item: CartItem) {
  const productType = item.product.productType?.toLowerCase();
  const categoryName = item.product.categoryName?.toLowerCase();
  const productGroup = item.product.productGroup?.toLowerCase();
  return (
    item.product.id.startsWith('ai-arr-') ||
    productType === 'ai arrangement' ||
    productType === 'custom arrangement' ||
    categoryName === 'custom ai arrangement' ||
    productGroup === 'custom ai arrangement' ||
    item.product.categoryId === 'cat-ai-arrangement' ||
    item.product.categoryId === 'cat-custom-ai-arrangement'
  );
}

function hydrateCartItemsFromInventory(
  items: CartItem[],
  products: Product[],
  options: { removeUnavailable?: boolean } = {},
) {
  const liveProductsById = new Map(products.map((product) => [product.id, product]));

  return items.flatMap((item) => {
    if (isAiArrangementCartItem(item)) {
      return [{ ...item, quantity: 1 }];
    }

    const liveProduct = liveProductsById.get(item.product.id);

    if (!liveProduct || liveProduct.isActive === false) {
      return options.removeUnavailable ? [] : [item];
    }

    if (options.removeUnavailable && (liveProduct.stock ?? 0) <= 0) {
      return [];
    }

    const quantity = liveProduct.stock && liveProduct.stock > 0 ? Math.min(item.quantity, liveProduct.stock) : item.quantity;

    if (quantity <= 0) {
      return [];
    }

    return [
      {
        ...item,
        product: liveProduct,
        quantity,
      },
    ];
  });
}

function areCartItemsEquivalent(firstItems: CartItem[], secondItems: CartItem[]) {
  if (firstItems.length !== secondItems.length) {
    return false;
  }

  return firstItems.every((firstItem, index) => {
    const secondItem = secondItems[index];

    return (
      firstItem.product.id === secondItem?.product.id &&
      firstItem.quantity === secondItem.quantity &&
      firstItem.product.priceCents === secondItem.product.priceCents &&
      firstItem.product.stock === secondItem.product.stock &&
      firstItem.product.imageUrl === secondItem.product.imageUrl &&
      firstItem.product.isActive === secondItem.product.isActive
    );
  });
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: pageBackground,
    flex: 1,
  },
  stickyBrandHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderBottomColor: hairlineColor,
    borderBottomWidth: 1,
    paddingBottom: theme.spacing.sm,
    zIndex: 40,
  },
  scroll: {
    backgroundColor: pageBackground,
    flex: 1,
  },
  content: {
    gap: theme.spacing.lg,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  sectionSpacing: {
    marginBottom: theme.spacing.lg,
  },
  voucherPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: outlineColor,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 10,
    padding: theme.spacing.md,
  },
  voucherTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
  },
  voucherRow: {
    flexDirection: 'row',
    gap: 8,
  },
  voucherInput: {
    borderColor: outlineColor,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sans,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  voucherButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    minWidth: 92,
    paddingHorizontal: 12,
  },
  voucherButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
  },
  voucherMessage: {
    color: theme.colors.danger,
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 16,
  },
  voucherMessageSuccess: {
    color: theme.colors.primary,
  },
  body: {
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  pageHeader: {
    paddingTop: theme.spacing.xs,
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
    fontSize: 24,
    lineHeight: 30,
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
    backgroundColor: theme.colors.surface,
    borderColor: outlineColor,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cartItemShell: {
    backgroundColor: theme.colors.surface,
    borderColor: outlineColor,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  cartItemShellFirst: {
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  cartItemShellLast: {
    borderBottomLeftRadius: theme.radius.lg,
    borderBottomRightRadius: theme.radius.lg,
    borderBottomWidth: 1,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
  },
  cartItem: {
    backgroundColor: 'transparent',
    gap: theme.spacing.md,
    overflow: 'hidden',
    paddingTop: theme.spacing.lg,
  },
  cartItemDivider: {
    backgroundColor: hairlineColor,
    height: 1,
    marginHorizontal: theme.spacing.lg,
  },
  cartItemContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
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
  cartItemCategoryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  cartItemCategory: {
    color: theme.colors.primary,
    flex: 1,
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  cartItemCategoryAi: {
    flex: 0,
  },
  cartItemAi: {
    backgroundColor: 'rgba(139, 92, 246, 0.035)',
  },
  aiBadge: {
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  aiBadgeText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.5,
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
  cartItemMeta: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
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
    borderColor: 'transparent',
    borderRadius: theme.radius.sm,
    borderWidth: 0,
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
  aiQuantityPill: {
    alignItems: 'center',
    backgroundColor: '#EEF7EF',
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 12,
  },
  aiQuantityText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 12,
  },
  removeButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: 'transparent',
    borderRadius: theme.radius.sm,
    borderWidth: 0,
    height: 36,
    justifyContent: 'center',
    width: 36,
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
    textAlign: 'center',
  },
  recommendationGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  recommendationGridRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  recommendationColumn: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  recommendationScrollBuffer: {
    height: 32,
  },
  recommendationCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    flex: 1,
    width: 'auto',
  },
  recommendationCardSpacer: {
    flex: 1,
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
