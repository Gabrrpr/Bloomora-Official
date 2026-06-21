import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, ImageOff, Package } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPageHeader } from '@/components/app-page-header';
import { formatPhp } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { getAuthSession } from '@/services/auth-session';
import { getOrderById, type CustomerOrder } from '@/services/orders-api';

export default function OrderDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const session = await getAuthSession();
      if (!session) {
        router.replace('/(auth)/login');
        return;
      }
      setOrder(await getOrderById({ orderId: id, session }));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Order details are unavailable.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => void loadOrder(), [loadOrder]);

  return (
    <View style={styles.screen}>
      <AppPageHeader title="Order Details" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.state}><ActivityIndicator color={theme.colors.primary} /><Text style={styles.muted}>Loading order details</Text></View>
        ) : errorMessage || !order ? (
          <View style={styles.state}><Text style={styles.title}>Order unavailable</Text><Text style={styles.muted}>{errorMessage}</Text><Pressable onPress={loadOrder} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Try again</Text></Pressable></View>
        ) : (
          <>
            <View style={styles.hero}>
              <View style={styles.heroCopy}>
                <Text style={styles.heroTitle}>{getHeroTitle(order)}</Text>
                <Text style={styles.heroText}>{getHeroText(order)}</Text>
              </View>
              <Package color="#E2E5E2" size={128} strokeWidth={1} />
            </View>

            <View style={styles.detailsBody}>
              <View style={styles.orderHeading}>
                <View><Text style={styles.fieldLabel}>Order Number</Text><Text selectable style={styles.orderNumber}>{order.orderNumber}</Text></View>
                <Text style={styles.placedText}>Placed on {formatDateTime(order.createdAt)}</Text>
              </View>
              <View style={styles.paymentInfoRow}>
                <View style={styles.paymentMethod}>
                  <Text style={styles.fieldLabel}>Payment Method</Text>
                  <Text style={styles.fieldValue}>{order.paymentProvider ? formatLabel(order.paymentProvider) : 'PayMongo'}</Text>
                </View>
                <View style={styles.paymentStatus}>
                  <Text style={order.paymentStatus === 'paid' ? styles.paymentComplete : styles.paymentPending}>
                    {order.paymentStatus === 'paid' ? 'Payment completed' : 'Payment pending'}
                  </Text>
                  {order.paymentStatus === 'paid' ? <CheckCircle2 color={theme.colors.primary} size={17} /> : null}
                </View>
              </View>
              <Pressable style={styles.outlineButton}><Text style={styles.outlineButtonText}>View Payment Details</Text></Pressable>
              <View style={styles.divider} />

              <View style={styles.deliveryGrid}>
                <DetailValue label="Delivery Date" value={formatDate(order.scheduledAt)} />
                <DetailValue label="Delivery Time" value={formatTime(order.scheduledAt)} />
              </View>
              <DetailValue label="Delivery Address" value={order.deliveryAddress || `Pickup at ${order.branch || "Esting's"}`} />
              {order.deliveryNotes ? <DetailValue label="Delivery Notes" value={order.deliveryNotes} /> : null}
              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Order Summary</Text>
              {order.items.map((item) => (
                <View key={item.id} style={styles.productRow}>
                  {item.imageUrl ? <Image contentFit="cover" source={{ uri: item.imageUrl }} style={styles.image} /> : <View style={styles.imageFallback}><ImageOff color={theme.colors.primary} size={25} /></View>}
                  <View style={styles.productCopy}><Text style={styles.productName}>{item.productName}</Text><Text style={styles.muted}>{order.branch || "Esting's Flower Shop"}</Text></View>
                  <View style={styles.productEnd}><Text style={styles.muted}>x{item.quantity}</Text><Text style={styles.price}>{formatPhp(Math.round(item.totalAmount * 100))}</Text></View>
                </View>
              ))}
              <View style={styles.dashedDivider} />
              <SummaryRow emphasized label="Total" value={formatPhp(Math.round(order.totalAmount * 100))} />
              <View style={styles.divider} />

              <Pressable onPress={() => router.push('/(support)/live-chat')} style={styles.supportButton}><Text style={styles.supportButtonText}>Contact Support</Text></Pressable>

              {order.paymentStatus !== 'paid' ? (
                <Pressable onPress={() => order.checkoutUrl ? void Linking.openURL(order.checkoutUrl) : Alert.alert('Payment link unavailable', 'Refresh the order or contact support.')} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Pay Now</Text>
                </Pressable>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function DetailValue({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailValue}><Text style={styles.fieldLabel}>{label}</Text><Text selectable style={styles.fieldValue}>{value}</Text></View>;
}

function SummaryRow({ emphasized = false, label, value }: { emphasized?: boolean; label: string; value: string }) {
  return <View style={styles.summaryRow}><Text style={[styles.summaryLabel, emphasized && styles.totalText]}>{label}</Text><Text selectable style={[styles.summaryValue, emphasized && styles.totalValue]}>{value}</Text></View>;
}

function getHeroTitle(order: CustomerOrder) {
  if (order.paymentStatus !== 'paid') return 'Complete your payment';
  if (order.status === 'delivered' || order.status === 'completed') return 'Order completed';
  if (order.status === 'out_for_delivery') return 'Your order is on the way';
  if (order.status === 'preparing') return 'We are preparing your order';
  return 'Order confirmed';
}

function getHeroText(order: CustomerOrder) {
  if (order.paymentStatus !== 'paid') return 'Pay now so the florist can begin preparing your order.';
  if (order.status === 'delivered' || order.status === 'completed') return 'Thank you for choosing Bloomora. We hope the flowers made their day.';
  if (order.status === 'out_for_delivery') return 'Your flowers have left the shop and are heading to their destination.';
  return 'We will update this page as your order moves through each stage.';
}

function formatDateTime(value?: string | null) {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'To be confirmed';
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
function formatDate(value?: string | null) {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'To be confirmed';
  return new Intl.DateTimeFormat('en-PH', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}
function formatTime(value?: string | null) {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Anytime (9AM - 6PM)';
  return new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function formatLabel(value: string) {
  if (value === 'delivered') return 'Completed';
  return value.split(/[_-]+/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#FFFFFF', flex: 1 },
  content: { backgroundColor: '#FFFFFF' },
  state: { alignItems: 'center', gap: theme.spacing.md, paddingTop: 100 },
  hero: { alignItems: 'center', backgroundColor: '#F5F5F5', flexDirection: 'row', minHeight: 210, overflow: 'hidden', paddingHorizontal: 16 },
  heroCopy: { flex: 1, gap: 10 },
  heroTitle: { color: '#444444', fontFamily: Fonts.sansMedium, fontSize: 28, lineHeight: 34 },
  heroText: { color: '#555555', fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  detailsBody: { gap: 16, padding: 16 },
  orderHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  fieldLabel: { color: '#555555', fontFamily: Fonts.sans, fontSize: 12 },
  fieldValue: { color: '#222222', fontFamily: Fonts.sans, fontSize: 15, lineHeight: 21 },
  orderNumber: { color: '#222222', fontFamily: Fonts.sansBold, fontSize: 16, marginTop: 2 },
  placedText: { color: '#555555', fontFamily: Fonts.sans, fontSize: 9 },
  muted: { color: '#999999', fontFamily: Fonts.sans, fontSize: 11, lineHeight: 16 },
  title: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 18 },
  paymentInfoRow: { alignItems: 'flex-end', flexDirection: 'row', gap: 16 },
  paymentMethod: { flex: 1, gap: 2 },
  paymentStatus: { alignItems: 'center', backgroundColor: '#F6F6F6', borderColor: '#DEDEDE', borderRadius: theme.radius.sm, borderWidth: 1, flex: 1.2, flexDirection: 'row', gap: 7, minHeight: 48, paddingHorizontal: 12 },
  paymentComplete: { color: theme.colors.primary, fontFamily: Fonts.sans, fontSize: 12 },
  paymentPending: { color: '#555555', fontFamily: Fonts.sans, fontSize: 12 },
  outlineButton: { alignItems: 'center', borderColor: '#555555', borderRadius: theme.radius.sm, borderWidth: 1, justifyContent: 'center', minHeight: 48 },
  outlineButtonText: { color: '#444444', fontFamily: Fonts.sans, fontSize: 15 },
  divider: { backgroundColor: '#D7D7D7', height: StyleSheet.hairlineWidth },
  deliveryGrid: { flexDirection: 'row', gap: 16 },
  detailValue: { flex: 1, gap: 3 },
  sectionTitle: { color: '#333333', fontFamily: Fonts.sans, fontSize: 20 },
  productRow: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 94 },
  image: { backgroundColor: '#ECECEC', borderRadius: theme.radius.sm, height: 76, width: 66 },
  imageFallback: { alignItems: 'center', backgroundColor: '#ECECEC', borderRadius: theme.radius.sm, height: 76, justifyContent: 'center', width: 66 },
  productCopy: { flex: 1, gap: 5 },
  productEnd: { alignItems: 'flex-end', alignSelf: 'stretch', justifyContent: 'space-between', paddingVertical: 8 },
  productName: { color: '#444444', fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 18 },
  price: { color: '#444444', fontFamily: Fonts.sansMedium, fontSize: 13 },
  dashedDivider: { borderColor: '#D7D7D7', borderStyle: 'dashed', borderTopWidth: 1 },
  summaryRow: { flexDirection: 'row', gap: theme.spacing.md, justifyContent: 'space-between' },
  summaryLabel: { color: '#333333', fontFamily: Fonts.sans, fontSize: 16 },
  summaryValue: { color: '#444444', flex: 1, fontFamily: Fonts.sans, fontSize: 15, textAlign: 'right' },
  totalText: { color: '#222222', fontFamily: Fonts.sansMedium, fontSize: 17 },
  totalValue: { color: '#444444', fontFamily: Fonts.sansMedium, fontSize: 16 },
  supportButton: { alignItems: 'center', backgroundColor: '#383838', borderRadius: theme.radius.sm, justifyContent: 'center', minHeight: 54 },
  supportButtonText: { color: '#FFFFFF', fontFamily: Fonts.sans, fontSize: 16 },
  primaryButton: { alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, justifyContent: 'center', minHeight: 54 },
  primaryButtonText: { color: '#FFFFFF', fontFamily: Fonts.sansMedium, fontSize: 16 },
});
