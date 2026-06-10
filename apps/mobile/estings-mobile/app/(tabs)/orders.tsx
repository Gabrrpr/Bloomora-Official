import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { CheckCircle2, Clock3, ImageOff, PackageCheck, ReceiptText, RefreshCw, ShoppingBag, Truck } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBrandHeader } from '@/components/app-brand-header';
import { formatPhp } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { getAuthSession, type AuthSession } from '@/services/auth-session';
import { getMyOrders, type CustomerOrder } from '@/services/orders-api';

const outlineColor = 'rgba(31, 42, 36, 0.11)';
const hairlineColor = 'rgba(31, 42, 36, 0.09)';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pendingCount = useMemo(
    () => orders.filter((order) => order.paymentStatus !== 'paid').length,
    [orders],
  );

  const loadOrders = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const nextSession = await getAuthSession();
      setSession(nextSession);

      if (!nextSession) {
        setOrders([]);
        setErrorMessage(null);
        return;
      }

      setOrders(await getMyOrders({ session: nextSession }));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Orders are unavailable right now.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadOrders();
    }, [loadOrders]),
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={isRefreshing} tintColor={theme.colors.primary} onRefresh={() => loadOrders(true)} />}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]}>
        <AppBrandHeader />

        <View style={styles.body}>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>ORDERS</Text>
              <Text style={styles.title}>Your Orders</Text>
              <Text style={styles.subtitle}>
                {session
                  ? pendingCount > 0
                    ? `${pendingCount} ${pendingCount === 1 ? 'order is' : 'orders are'} waiting for payment confirmation.`
                    : 'Track payment, preparation, and delivery status here.'
                  : 'Sign in to view your flower orders.'}
              </Text>
            </View>
            {session ? (
              <Pressable
                accessibilityLabel="Refresh orders"
                accessibilityRole="button"
                onPress={() => loadOrders(true)}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                <RefreshCw color={theme.colors.primary} size={20} strokeWidth={2.3} />
              </Pressable>
            ) : null}
          </View>

          {isLoading ? (
            <OrdersLoadingState />
          ) : !session ? (
            <SignedOutState />
          ) : errorMessage ? (
            <OrdersErrorState message={errorMessage} onRetry={() => loadOrders(true)} />
          ) : orders.length === 0 ? (
            <EmptyOrdersState />
          ) : (
            <View style={styles.orderList}>
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function OrderCard({ order }: { order: CustomerOrder }) {
  const paymentTone = order.paymentStatus === 'paid' ? 'paid' : 'pending';
  const StatusIcon = getOrderStatusIcon(order.status);

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderTopRow}>
        <View style={styles.orderIdentity}>
          <View style={styles.orderIcon}>
            <ReceiptText color={theme.colors.primary} size={20} strokeWidth={2.2} />
          </View>
          <View style={styles.orderNumberCopy}>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
          </View>
        </View>
        <PaymentBadge status={order.paymentStatus} tone={paymentTone} />
      </View>

      <View style={styles.orderProductRow}>
        {order.imageUrl ? (
          <Image cachePolicy="memory-disk" contentFit="cover" source={{ uri: order.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={styles.productFallback}>
            <ImageOff color={theme.colors.primary} size={26} />
          </View>
        )}
        <View style={styles.productCopy}>
          <Text numberOfLines={2} style={styles.productName}>
            {order.productName}
          </Text>
          <Text style={styles.productMeta}>
            Qty {order.quantity} · {order.branch || 'Esting\'s'}
          </Text>
          <Text style={styles.productPrice}>{formatPhp(Math.round(order.totalAmount * 100))}</Text>
        </View>
      </View>

      <View style={styles.orderStatusRow}>
        <View style={styles.statusPill}>
          <StatusIcon color={theme.colors.primary} size={15} strokeWidth={2.3} />
          <Text style={styles.statusText}>{formatStatus(order.status)}</Text>
        </View>
        {order.paymentProvider ? <Text style={styles.providerText}>{formatProvider(order.paymentProvider)}</Text> : null}
      </View>
    </View>
  );
}

function PaymentBadge({ status, tone }: { status: string; tone: 'paid' | 'pending' }) {
  return (
    <View style={[styles.paymentBadge, tone === 'paid' ? styles.paymentBadgePaid : styles.paymentBadgePending]}>
      {tone === 'paid' ? (
        <CheckCircle2 color={theme.colors.primary} size={14} strokeWidth={2.3} />
      ) : (
        <Clock3 color={theme.colors.textMuted} size={14} strokeWidth={2.3} />
      )}
      <Text style={[styles.paymentBadgeText, tone === 'paid' ? styles.paymentBadgeTextPaid : styles.paymentBadgeTextPending]}>
        {formatStatus(status)}
      </Text>
    </View>
  );
}

function OrdersLoadingState() {
  return (
    <View style={styles.statePanel}>
      <ActivityIndicator color={theme.colors.primary} />
      <Text style={styles.stateText}>Loading orders</Text>
    </View>
  );
}

function SignedOutState() {
  return (
    <View style={styles.emptyPanel}>
      <View style={styles.emptyIcon}>
        <PackageCheck color={theme.colors.primary} size={34} strokeWidth={2.1} />
      </View>
      <Text style={styles.emptyTitle}>Sign in to track orders</Text>
      <Text style={styles.emptyText}>Orders, payment status, and delivery updates appear here after checkout.</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/(auth)/login')}
        style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}>
        <Text style={styles.primaryActionText}>Sign in</Text>
      </Pressable>
    </View>
  );
}

function OrdersErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.emptyPanel}>
      <View style={styles.emptyIcon}>
        <Clock3 color={theme.colors.primary} size={34} strokeWidth={2.1} />
      </View>
      <Text style={styles.emptyTitle}>Orders unavailable</Text>
      <Text style={styles.emptyText}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}>
        <Text style={styles.secondaryActionText}>Try again</Text>
      </Pressable>
    </View>
  );
}

function EmptyOrdersState() {
  return (
    <View style={styles.emptyPanel}>
      <View style={styles.emptyIcon}>
        <ShoppingBag color={theme.colors.primary} size={34} strokeWidth={2.1} />
      </View>
      <Text style={styles.emptyTitle}>No orders yet</Text>
      <Text style={styles.emptyText}>Your paid and pending checkout orders will appear here.</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/categories')}
        style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}>
        <Text style={styles.primaryActionText}>Browse products</Text>
      </Pressable>
    </View>
  );
}

function getOrderStatusIcon(status: string) {
  if (status === 'out_for_delivery') {
    return Truck;
  }

  if (status === 'delivered' || status === 'confirmed') {
    return CheckCircle2;
  }

  return Clock3;
}

function formatStatus(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatProvider(value: string) {
  return value.toLowerCase() === 'paymongo' ? 'PayMongo' : formatStatus(value);
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Recently placed';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Recently placed';
  }

  return new Intl.DateTimeFormat('en-PH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
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
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: 3,
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
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: outlineColor,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  orderList: {
    gap: theme.spacing.md,
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderColor: outlineColor,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  orderTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  orderIdentity: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minWidth: 0,
  },
  orderIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.sm,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  orderNumberCopy: {
    flex: 1,
    minWidth: 0,
  },
  orderNumber: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 19,
  },
  orderDate: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  paymentBadge: {
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    gap: 5,
    minHeight: 30,
    paddingHorizontal: theme.spacing.sm,
  },
  paymentBadgePaid: {
    backgroundColor: theme.colors.greenSoft,
  },
  paymentBadgePending: {
    backgroundColor: theme.colors.surfaceAlt,
  },
  paymentBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    lineHeight: 16,
  },
  paymentBadgeTextPaid: {
    color: theme.colors.primary,
  },
  paymentBadgeTextPending: {
    color: theme.colors.textMuted,
  },
  orderProductRow: {
    borderColor: hairlineColor,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  productImage: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    height: 92,
    width: 82,
  },
  productFallback: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.md,
    height: 92,
    justifyContent: 'center',
    width: 82,
  },
  productCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  productName: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
  },
  productMeta: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  productPrice: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    lineHeight: 22,
  },
  orderStatusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  statusPill: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: hairlineColor,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: theme.spacing.sm,
  },
  statusText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
  },
  providerText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
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
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 76,
    justifyContent: 'center',
    width: 76,
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
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    minHeight: 46,
    paddingHorizontal: theme.spacing.xl,
  },
  primaryActionText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
  },
  secondaryAction: {
    alignItems: 'center',
    borderColor: outlineColor,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    minHeight: 46,
    paddingHorizontal: theme.spacing.xl,
  },
  secondaryActionText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
