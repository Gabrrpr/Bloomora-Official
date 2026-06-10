import { router, type Href, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { ArrowLeft, CreditCard, MapPin, ReceiptText, ShieldCheck, ShoppingBag } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatPhp, getCartSummary, type CartItem } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { ApiError } from '@/services/api-client';
import { clearAuthSession, getAuthSession, type AuthSession } from '@/services/auth-session';
import { getGuestCartItems } from '@/services/guest-cart';
import { createOrdersFromCart, createPayMongoCheckout } from '@/services/payments-api';

const outlineColor = 'rgba(31, 42, 36, 0.11)';
const successRoute = '/payment/success' as Href;
const cancelRoute = '/payment/cancel' as Href;
const failedRoute = '/payment/failed' as Href;
const expiredRoute = '/payment/expired' as Href;

function appendQueryParam(url: string, key: string, value: string) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ ids?: string }>();
  const selectedIds = useMemo(
    () => new Set((params.ids ?? '').split(',').map((id) => id.trim()).filter(Boolean)),
    [params.ids],
  );
  const [items, setItems] = useState<CartItem[]>([]);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  const summary = getCartSummary(items);

  useEffect(() => {
    let isActive = true;

    Promise.all([getGuestCartItems(), getAuthSession()])
      .then(([cartItems, nextSession]) => {
        if (!isActive) {
          return;
        }

        const scopedItems = selectedIds.size > 0 ? cartItems.filter((item) => selectedIds.has(item.product.id)) : cartItems;
        setItems(scopedItems);
        setSession(nextSession);
        setDeliveryAddress(nextSession?.user.address ?? '');
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [selectedIds]);

  const handlePay = useCallback(async () => {
    if (isPaying) {
      return;
    }

    if (!session) {
      router.replace('/(auth)/login');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Cart is empty', 'Return to cart and select at least one item.');
      return;
    }

    if (!deliveryAddress.trim()) {
      Alert.alert('Delivery address required', 'Enter a delivery address before payment.');
      return;
    }

    setIsPaying(true);

    try {
      const orderResponse = await createOrdersFromCart({
        deliveryAddress: deliveryAddress.trim(),
        deliveryNotes: deliveryNotes.trim(),
        items,
        session,
      });
      const successHref = `${successRoute}?orderIds=${encodeURIComponent(orderResponse.order_ids.join(','))}` as Href;
      const webOrigin = Platform.OS === 'web' ? globalThis.location.origin : null;
      const checkout = await createPayMongoCheckout({
        cancelUrl: webOrigin ? `${webOrigin}/payment/cancel` : Linking.createURL('/payment/cancel'),
        orderIds: orderResponse.order_ids,
        session,
        successUrl: webOrigin
          ? `${webOrigin}${successHref}`
          : appendQueryParam(Linking.createURL('/payment/success'), 'orderIds', orderResponse.order_ids.join(',')),
      });

      if (Platform.OS === 'web') {
        globalThis.location.href = checkout.checkout_url;
        return;
      }

      const browserResult = await WebBrowser.openAuthSessionAsync(checkout.checkout_url, Linking.createURL('/payment'));

      if (browserResult.type === 'success') {
        router.replace(getPaymentReturnRoute(browserResult.url, successHref));
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await clearAuthSession();
        setSession(null);
        Alert.alert('Sign in again', 'Your session expired. Please sign in again before checkout.', [
          { text: 'Sign in', onPress: () => router.replace('/(auth)/login') },
        ]);
        return;
      }

      const message = error instanceof Error ? error.message : 'Unable to start PayMongo checkout.';
      Alert.alert('Checkout unavailable', message);
    } finally {
      setIsPaying(false);
    }
  }, [deliveryAddress, deliveryNotes, isPaying, items, session]);

  if (isLoading) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.loadingText}>Preparing checkout...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.spacing.xxl }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={theme.colors.primary} size={22} strokeWidth={2.4} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>CHECKOUT</Text>
            <Text style={styles.title}>Review your order</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <ShoppingBag color={theme.colors.primary} size={20} strokeWidth={2.2} />
            <Text style={styles.sectionTitle}>Items</Text>
          </View>
          {items.length > 0 ? (
            items.map((item) => <CheckoutItem item={item} key={item.id} />)
          ) : (
            <Text style={styles.emptyText}>No selected cart items.</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MapPin color={theme.colors.primary} size={20} strokeWidth={2.2} />
            <Text style={styles.sectionTitle}>Delivery</Text>
          </View>
          <TextInput
            multiline
            onChangeText={setDeliveryAddress}
            placeholder="Delivery address"
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.input, styles.addressInput]}
            value={deliveryAddress}
          />
          <TextInput
            multiline
            onChangeText={setDeliveryNotes}
            placeholder="Delivery notes or preferred time"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            value={deliveryNotes}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <ReceiptText color={theme.colors.primary} size={20} strokeWidth={2.2} />
            <Text style={styles.sectionTitle}>Summary</Text>
          </View>
          <SummaryRow label="Subtotal" value={formatPhp(summary.subtotalCents)} />
          <SummaryRow label="Estimated delivery" value={formatPhp(summary.deliveryCents)} />
          <View style={styles.divider} />
          <SummaryRow isTotal label="Total" value={formatPhp(summary.totalCents)} />
        </View>

        <View style={styles.paymentNote}>
          <ShieldCheck color={theme.colors.primary} size={19} strokeWidth={2.2} />
          <Text style={styles.paymentNoteText}>Payment opens on PayMongo Hosted Checkout. We confirm paid status through webhook.</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: isPaying, disabled: isPaying || items.length === 0 }}
          disabled={isPaying || items.length === 0}
          onPress={handlePay}
          style={({ pressed }) => [styles.payButton, (isPaying || items.length === 0) && styles.payButtonDisabled, pressed && styles.pressed]}>
          <CreditCard color={theme.colors.white} size={19} strokeWidth={2.3} />
          <Text style={styles.payButtonText}>{isPaying ? 'Opening PayMongo...' : 'Pay with PayMongo'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function getPaymentReturnRoute(url: string, successHref: Href) {
  if (url.includes('/payment/expired')) {
    return expiredRoute;
  }

  if (url.includes('/payment/failed')) {
    return failedRoute;
  }

  if (url.includes('/payment/cancel')) {
    return cancelRoute;
  }

  return successHref;
}

function CheckoutItem({ item }: { item: CartItem }) {
  return (
    <View style={styles.itemRow}>
      <View style={styles.itemQuantity}>
        <Text style={styles.itemQuantityText}>{item.quantity}</Text>
      </View>
      <View style={styles.itemCopy}>
        <Text numberOfLines={2} style={styles.itemName}>{item.product.name}</Text>
        <Text style={styles.itemMeta}>{item.product.categoryName ?? item.product.tag}</Text>
      </View>
      <Text style={styles.itemPrice}>{formatPhp(item.product.priceCents * item.quantity)}</Text>
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
  centerScreen: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
  },
  content: {
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: outlineColor,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
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
    fontSize: 25,
    lineHeight: 31,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderColor: outlineColor,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 16,
  },
  itemRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  itemQuantity: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.sm,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  itemQuantityText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 19,
  },
  itemMeta: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  itemPrice: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  input: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: outlineColor,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    color: theme.colors.text,
    fontFamily: Fonts.sans,
    fontSize: 14,
    minHeight: 54,
    padding: theme.spacing.md,
    textAlignVertical: 'top',
  },
  addressInput: {
    minHeight: 82,
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
    fontSize: 19,
  },
  divider: {
    backgroundColor: outlineColor,
    height: 1,
  },
  paymentNote: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(46, 139, 52, 0.14)',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  paymentNoteText: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 17,
  },
  payButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: theme.spacing.xl,
  },
  payButtonDisabled: {
    opacity: 0.58,
  },
  payButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
