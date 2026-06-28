import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { CalendarDays, ChevronRight, Clock3, ImageOff, Search, ShoppingBag } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPageHeader } from '@/components/app-page-header';
import { formatPhp } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { getAuthSession, type AuthSession } from '@/services/auth-session';
import { getMyOrders, type CustomerOrder } from '@/services/orders-api';
import { getPayMongoPaymentStatus } from '@/services/payments-api';

type OrderTab = 'all' | 'to_pay' | 'processing' | 'shipped' | 'completed' | 'failed';

const tabs: { id: OrderTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'to_pay', label: 'To Pay' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'completed', label: 'Completed' },
  { id: 'failed', label: 'Failed' },
];

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<OrderTab>('all');
  const [query, setQuery] = useState('');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOrders = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const nextSession = await getAuthSession();
      setSession(nextSession);
      if (!nextSession) {
        setOrders([]);
        return;
      }
      const loaded = await getMyOrders({ session: nextSession });

      // Silently reconcile any pending-payment orders with PayMongo.
      // This ensures the list stays accurate even without a public webhook URL.
      const pendingOrders = loaded.filter((o) => o.paymentStatus === 'pending');
      if (pendingOrders.length > 0) {
        await Promise.allSettled(
          pendingOrders.map((o) => {
            const firstId = o.id.split(',')[0];
            return firstId
              ? getPayMongoPaymentStatus({ orderId: firstId, session: nextSession })
              : Promise.resolve();
          }),
        );
        // Reload orders to pick up any newly-paid statuses
        setOrders(await getMyOrders({ session: nextSession }));
      } else {
        setOrders(loaded);
      }

      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Orders are unavailable right now.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void loadOrders(), [loadOrders]));
  useFocusEffect(
    useCallback(() => {
      if (isOrderTab(params.tab)) {
        setActiveTab(params.tab);
      }
    }, [params.tab]),
  );

  const visibleOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesTab = activeTab === 'all' || getOrderTab(order) === activeTab;
      const matchesQuery = !normalizedQuery || [
        order.orderNumber,
        order.productName,
        ...order.items.map((item) => item.productName),
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesTab && matchesQuery;
    });
  }, [activeTab, orders, query]);

  return (
    <View style={styles.screen}>
      <AppPageHeader title="My Orders" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabBar}>
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)} style={styles.tab}>
              <Text style={[styles.tabText, selected && styles.tabTextActive]}>{tab.label}</Text>
              <View style={[styles.tabIndicator, selected && styles.tabIndicatorActive]} />
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} tintColor={theme.colors.primary} onRefresh={() => loadOrders(true)} />}
        showsVerticalScrollIndicator={false}>
        {session ? (
          <View style={styles.searchField}>
            <Search color="#333333" size={21} />
            <TextInput
              onChangeText={setQuery}
              placeholder={`Search ${activeTab === 'all' ? '' : `${tabs.find((tab) => tab.id === activeTab)?.label.toLowerCase()} `}orders`}
              placeholderTextColor="#B7B7B7"
              style={styles.searchInput}
              value={query}
            />
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.state}><ActivityIndicator color={theme.colors.primary} /><Text style={styles.stateText}>Loading orders</Text></View>
        ) : !session ? (
          <EmptyState message="Sign in to see your orders and payment status." action="Sign in" onPress={() => router.push('/(auth)/login')} />
        ) : errorMessage ? (
          <EmptyState message={errorMessage} action="Try again" onPress={() => loadOrders(true)} />
        ) : visibleOrders.length === 0 ? (
          <View style={styles.noOrders}><Text style={styles.noOrdersText}>{query ? 'No matching orders' : 'No current orders'}</Text></View>
        ) : (
          visibleOrders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </ScrollView>
    </View>
  );
}

function OrderCard({ order }: { order: CustomerOrder }) {
  const status = getCustomerStatus(order);
  const pending = getOrderTab(order) === 'to_pay';
  return (
    <Pressable onPress={() => router.push(`/order-details/${order.id}` as Href)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cardHeader}>
        <View style={styles.orderHeading}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <View style={[styles.statusBadge, pending && styles.statusBadgePending]}><Text style={[styles.statusText, pending && styles.statusTextPending]}>{status}</Text></View>
        </View>
        <View style={styles.placedRow}><Text style={styles.placedText}>Placed on {formatDateTime(order.createdAt)}</Text><ChevronRight color="#555555" size={19} /></View>
      </View>

      <View style={styles.schedulePanel}>
        <ScheduleValue icon={CalendarDays} label="Delivery Date" value={formatScheduleDate(order.scheduledAt)} />
        <View style={styles.scheduleDivider} />
        <ScheduleValue icon={Clock3} label="Delivery Time" value={formatScheduleTime(order.scheduledAt)} />
      </View>

      {order.items.slice(0, 2).map((item) => (
        <View key={item.id} style={styles.productRow}>
          {item.imageUrl ? <Image contentFit="cover" source={{ uri: item.imageUrl }} style={styles.productImage} /> : <View style={styles.imageFallback}><ImageOff color={theme.colors.primary} size={23} /></View>}
          <View style={styles.productCopy}>
            <Text numberOfLines={2} style={styles.productName}>{item.productName}</Text>
            <Text style={styles.productDetails}>{order.branch || "Esting's Flower Shop"}</Text>
          </View>
          <View style={styles.productPriceColumn}><Text style={styles.quantity}>x{item.quantity}</Text><Text style={styles.productPrice}>{formatPhp(Math.round(item.totalAmount * 100))}</Text></View>
        </View>
      ))}
      {order.items.length > 2 ? <Text style={styles.moreItems}>+ {order.items.length - 2} more items</Text> : null}

      <View style={styles.dashedDivider} />
      <View style={styles.totalRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>{formatPhp(Math.round(order.totalAmount * 100))}</Text></View>
      {pending ? (
        <View style={styles.paymentRow}>
          <View style={styles.paymentDue}><Text style={styles.paymentDueText}>Payment pending</Text></View>
          <Pressable onPress={(event) => { event.stopPropagation(); if (order.checkoutUrl) void Linking.openURL(order.checkoutUrl); }} style={styles.payButton}>
            <Text style={styles.payButtonText}>Pay</Text>
          </Pressable>
        </View>
      ) : null}
      {getOrderTab(order) === 'completed' && !order.hasReviewed ? (
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            router.push(`/review/${order.orderIds[0] ?? order.id}` as Href);
          }}
          style={styles.reviewButton}>
          <Text style={styles.reviewButtonText}>Write a review</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

function ScheduleValue({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return <View style={styles.scheduleValue}><Text style={styles.scheduleMain}>{value}</Text><View style={styles.scheduleLabelRow}><Icon color="#999999" size={11} /><Text style={styles.scheduleLabel}>{label}</Text></View></View>;
}

function EmptyState({ action, message, onPress }: { action: string; message: string; onPress: () => void }) {
  return <View style={styles.state}><ShoppingBag color={theme.colors.primary} size={34} /><Text style={styles.stateText}>{message}</Text><Pressable onPress={onPress} style={styles.payButton}><Text style={styles.payButtonText}>{action}</Text></Pressable></View>;
}

export function getOrderTab(order: CustomerOrder): Exclude<OrderTab, 'all'> {
  if (order.paymentStatus === 'failed' || order.paymentStatus === 'expired' || order.status === 'cancelled' || order.status === 'payment_failed') return 'failed';
  if (order.paymentStatus !== 'paid') return 'to_pay';
  if (order.status === 'delivered' || order.status === 'completed') return 'completed';
  if (order.status === 'out_for_delivery') return 'shipped';
  return 'processing';
}

export function getCustomerStatus(order: CustomerOrder) {
  const tab = getOrderTab(order);
  if (tab === 'to_pay') return 'Unpaid';
  if (tab === 'completed') return 'Completed';
  if (tab === 'shipped') return 'Out for delivery';
  if (tab === 'failed') return order.status === 'cancelled' ? 'Cancelled' : 'Failed';
  return order.status === 'preparing' ? 'Processing' : formatLabel(order.status);
}

function formatLabel(value: string) {
  return value.split(/[_-]+/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
function isOrderTab(value?: string): value is OrderTab {
  return tabs.some((tab) => tab.id === value);
}
function validDate(value?: string | null) { const date = value ? new Date(value) : null; return date && !Number.isNaN(date.getTime()) ? date : null; }
function formatDateTime(value?: string | null) { const date = validDate(value); return date ? new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(date) : 'Recently'; }
function formatScheduleDate(value?: string | null) { const date = validDate(value); return date ? new Intl.DateTimeFormat('en-PH', { day: '2-digit', month: 'short', year: 'numeric' }).format(date) : 'To be confirmed'; }
function formatScheduleTime(value?: string | null) { const date = validDate(value); return date ? new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' }).format(date) : 'Anytime (9AM - 6PM)'; }

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F5F5F5', flex: 1 },
  tabsScroll: { backgroundColor: '#FFFFFF', flexGrow: 0 },
  tabBar: { borderBottomColor: '#D7D7D7', borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 8 },
  tab: { alignItems: 'center', minWidth: 82, paddingHorizontal: 8, paddingTop: 16 },
  tabText: { color: '#A7A7A7', fontFamily: Fonts.sansMedium, fontSize: 12 },
  tabTextActive: { color: theme.colors.primary, fontFamily: Fonts.sansSemiBold },
  tabIndicator: { height: 3, marginTop: 12, width: '100%' },
  tabIndicatorActive: { backgroundColor: theme.colors.primary },
  content: { gap: 14, padding: 14 },
  searchField: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#D8D8D8', borderRadius: theme.radius.pill, borderWidth: 1, flexDirection: 'row', gap: 10, minHeight: 52, paddingHorizontal: 16 },
  searchInput: { color: '#444444', flex: 1, fontFamily: Fonts.sans, fontSize: 14, paddingVertical: 10 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#D8D8D8', borderRadius: theme.radius.md, borderWidth: 1, boxShadow: '0 2px 3px rgba(0,0,0,0.12)', overflow: 'hidden', paddingBottom: 14 },
  cardHeader: { alignItems: 'center', borderBottomColor: '#E6E6E6', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  orderHeading: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  orderNumber: { color: '#333333', fontFamily: Fonts.sansMedium, fontSize: 15 },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, paddingHorizontal: 10, paddingVertical: 5 },
  statusBadgePending: { backgroundColor: '#F1F1F1' },
  statusText: { color: '#FFFFFF', fontFamily: Fonts.sansMedium, fontSize: 10, textAlign: 'center' },
  statusTextPending: { color: '#777777' },
  placedRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  placedText: { color: '#555555', fontFamily: Fonts.sans, fontSize: 9 },
  schedulePanel: { backgroundColor: '#F6F6F6', borderColor: '#E0E0E0', borderRadius: theme.radius.sm, borderWidth: 1, flexDirection: 'row', margin: 14, minHeight: 72 },
  scheduleValue: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  scheduleMain: { color: '#555555', fontFamily: Fonts.sans, fontSize: 13 },
  scheduleLabelRow: { alignItems: 'center', flexDirection: 'row', gap: 3, marginTop: 3 },
  scheduleLabel: { color: '#999999', fontFamily: Fonts.sans, fontSize: 9 },
  scheduleDivider: { backgroundColor: '#E0E0E0', marginVertical: 10, width: 1 },
  productRow: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 14, paddingVertical: 7 },
  productImage: { backgroundColor: '#ECECEC', borderRadius: theme.radius.sm, height: 74, width: 66 },
  imageFallback: { alignItems: 'center', backgroundColor: '#ECECEC', borderRadius: theme.radius.sm, height: 74, justifyContent: 'center', width: 66 },
  productCopy: { flex: 1, gap: 4 },
  productName: { color: '#444444', fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 18 },
  productDetails: { color: '#999999', fontFamily: Fonts.sans, fontSize: 11 },
  productPriceColumn: { alignItems: 'flex-end', alignSelf: 'stretch', justifyContent: 'space-between', paddingVertical: 4 },
  quantity: { color: '#777777', fontFamily: Fonts.sans, fontSize: 11 },
  productPrice: { color: '#444444', fontFamily: Fonts.sansMedium, fontSize: 13, fontVariant: ['tabular-nums'] },
  moreItems: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 11, paddingHorizontal: 14, textAlign: 'right' },
  dashedDivider: { borderColor: '#D7D7D7', borderStyle: 'dashed', borderTopWidth: 1, marginHorizontal: 14, marginTop: 8 },
  totalRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 12 },
  totalLabel: { color: '#555555', fontFamily: Fonts.sans, fontSize: 14 },
  totalValue: { color: '#444444', fontFamily: Fonts.sansMedium, fontSize: 14, fontVariant: ['tabular-nums'] },
  paymentRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingTop: 10 },
  paymentDue: { backgroundColor: '#F6F6F6', borderColor: '#DEDEDE', borderRadius: theme.radius.sm, borderWidth: 1, flex: 1, justifyContent: 'center', paddingHorizontal: 12 },
  paymentDueText: { color: '#555555', fontFamily: Fonts.sans, fontSize: 12 },
  payButton: { alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, justifyContent: 'center', minHeight: 44, minWidth: 108, paddingHorizontal: 18 },
  payButtonText: { color: '#FFFFFF', fontFamily: Fonts.sansMedium, fontSize: 14 },
  reviewButton: { alignItems: 'center', alignSelf: 'flex-end', borderColor: theme.colors.primary, borderRadius: theme.radius.sm, borderWidth: 1, marginHorizontal: 14, marginTop: 10, minHeight: 42, justifyContent: 'center', paddingHorizontal: 18 },
  reviewButtonText: { color: theme.colors.primary, fontFamily: Fonts.sansMedium, fontSize: 13 },
  noOrders: { alignItems: 'center', paddingTop: 150 },
  noOrdersText: { color: '#B7B7B7', fontFamily: Fonts.sans, fontSize: 15 },
  state: { alignItems: 'center', gap: 12, padding: 48 },
  stateText: { color: '#777777', fontFamily: Fonts.sans, fontSize: 13, textAlign: 'center' },
  pressed: { opacity: 0.76 },
});
