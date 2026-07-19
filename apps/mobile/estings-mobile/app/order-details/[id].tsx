import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, Copy, HelpCircle, ImageOff, MapPin, MessageCircle, Package, Truck, UserRound } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPageHeader } from '@/components/app-page-header';
import { CustomerDeliveryRouteMap } from '@/components/customer-delivery-route-map';
import { formatPhp } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { getAuthSession } from '@/services/auth-session';
import {
  getCustomerDeliveryRoute,
  getCustomerStreetPhotos,
  getOrderById,
  getUniqueOrderItems,
  type CustomerOrder,
  type CustomerRoutePreview,
  type CustomerStreetPhoto,
} from '@/services/orders-api';
import { getPayMongoPaymentStatus } from '@/services/payments-api';

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={styles.screen}>
      <AppPageHeader onBack={goBackFromOrderDetails} title="Order Details" />
      <View style={styles.state}>
        <Text style={styles.title}>Order details unavailable</Text>
        <Text style={styles.muted}>{error.message || 'This order could not be opened.'}</Text>
        <Pressable onPress={retry} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Try again</Text>
        </Pressable>
        <Pressable onPress={goBackFromOrderDetails} style={styles.outlineButton}>
          <Text style={styles.outlineButtonText}>Back to orders</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function OrderDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapInteracting, setIsMapInteracting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const copyOrderNumber = useCallback(async (orderNumber: string) => {
    await Clipboard.setStringAsync(orderNumber);
    Alert.alert('Copied', `${orderNumber} copied to clipboard.`);
  }, []);

  const loadOrder = useCallback(async () => {
    if (!id?.trim()) {
      setOrder(null);
      setErrorMessage('The order ID is missing.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const session = await getAuthSession();
      if (!session) {
        router.replace('/(auth)/login');
        return;
      }
      // Load the order first
      const loaded = await getOrderById({ orderId: id, session });

      // If still pending payment, silently call the PayMongo status endpoint.
      // This triggers server-side reconciliation so the order reflects the real
      // payment state even when running locally without a public webhook URL.
      if (loaded.paymentStatus === 'pending' && loaded.id) {
        try {
          const firstId = loaded.id.split(',')[0];
          if (firstId) {
            await getPayMongoPaymentStatus({ orderId: firstId, session });
            // Reload order with the now-reconciled status
            setOrder(await getOrderById({ orderId: id, session }));
          } else {
            setOrder(loaded);
          }
        } catch {
          // Reconciliation failed — show whatever we have
          setOrder(loaded);
        }
      } else {
        setOrder(loaded);
      }

      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Order details are unavailable.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => void loadOrder(), [loadOrder]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const remainingSeconds = useMemo(() => order?.expiresAt ? Math.max(0, Math.floor((new Date(order.expiresAt).getTime() - now) / 1000)) : 0, [now, order?.expiresAt]);
  useEffect(() => {
    if (order?.paymentStatus === 'pending' && order.expiresAt && remainingSeconds === 0) void loadOrder();
  }, [loadOrder, order?.expiresAt, order?.paymentStatus, remainingSeconds]);

  return (
    <View style={styles.screen}>
      <AppPageHeader
        onBack={goBackFromOrderDetails}
        title="Order Details"
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} scrollEnabled={!isMapInteracting} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.state}><ActivityIndicator color={theme.colors.primary} /><Text style={styles.muted}>Loading order details</Text></View>
        ) : errorMessage || !order ? (
          <View style={styles.state}><Text style={styles.title}>Order unavailable</Text><Text style={styles.muted}>{errorMessage ?? 'No order data was returned.'}</Text><Pressable onPress={loadOrder} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Try again</Text></Pressable><Pressable onPress={goBackFromOrderDetails} style={styles.outlineButton}><Text style={styles.outlineButtonText}>Back</Text></Pressable></View>
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
                <View>
                  <Text style={styles.fieldLabel}>Order Number</Text>
                  <Pressable
                    accessibilityHint="Copies the order number"
                    accessibilityLabel={`Copy order number ${order.orderNumber}`}
                    accessibilityRole="button"
                    onPress={() => void copyOrderNumber(order.orderNumber)}
                    style={({ pressed }) => [styles.orderNumberButton, pressed && styles.orderNumberPressed]}>
                    <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                    <Copy color={theme.colors.primary} size={15} strokeWidth={2} />
                  </Pressable>
                </View>
                <Text style={styles.placedText}>Placed on {formatDateTime(order.createdAt)}</Text>
              </View>
              <View style={styles.paymentInfoRow}>
                <View style={styles.paymentMethod}>
                  <Text style={styles.fieldLabel}>Payment Method</Text>
                  <Text style={styles.fieldValue}>{order.paymentProvider ? formatLabel(order.paymentProvider) : 'PayMongo'}</Text>
                </View>
                <View style={styles.paymentStatus}>
                  <Text style={order.paymentStatus === 'paid' ? styles.paymentComplete : styles.paymentPending}>
                    {order.paymentStatus === 'paid' ? 'Payment completed' : `Payment due in ${formatCountdown(remainingSeconds)}`}
                  </Text>
                  {order.paymentStatus === 'paid' ? <CheckCircle2 color={theme.colors.primary} size={17} /> : null}
                </View>
              </View>
              <Pressable
                onPress={() => Alert.alert(
                  order.paymentStatus === 'paid' ? 'Payment Details' : 'Payment Status',
                  [
                    `Status: ${formatLabel(order.paymentStatus)}`,
                    `${order.paymentStatus === 'paid' ? 'Amount Paid' : 'Amount Due'}: ${formatPhp(Math.round(order.totalAmount * 100))}`,
                    `Payment Method: ${order.paymentStatus === 'paid' ? (order.paymentProvider ? formatLabel(order.paymentProvider) : 'PayMongo') : 'Not completed yet'}`,
                    `Reference Number: ${order.paymentReference || 'Not available yet'}`,
                    `Transaction ID: ${order.transactionId || 'Not available yet'}`,
                    `Payment Date: ${order.paidAt ? formatDateTime(order.paidAt) : 'Not available yet'}`,
                  ].join('\n'),
                )}
                style={styles.outlineButton}>
                <Text style={styles.outlineButtonText}>{order.paymentStatus === 'paid' ? 'View Payment Details' : 'View Payment Status'}</Text>
              </Pressable>
              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Shipping Information</Text>
              <View style={styles.deliveryGrid}>
                <DetailValue label="Fulfillment Method" value={formatLabel(order.fulfillmentMethod)} />
                <DetailValue label={order.fulfillmentMethod === 'pickup' ? 'Pickup Time' : 'Delivery Time'} value={formatTimeSlot(order.timeSlot)} />
              </View>
              <View style={styles.deliveryGrid}>
                <DetailValue label="Delivery Date" value={formatDate(order.scheduledAt)} />
                <DetailValue label="Delivery Provider" value={order.deliveryProvider ? formatLabel(order.deliveryProvider) : 'Not applicable'} />
              </View>
              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Delivery Information</Text>
              <View style={styles.deliveryGrid}>
                <DetailValue label="Name" value={order.recipientName || 'Not available'} />
                <DetailValue label="Contact Number" value={order.recipientPhone || 'Not available'} />
              </View>
              <DetailValue label="Address" value={order.deliveryAddress || `Pickup at ${order.branch || "Esting's"}`} />
              {order.deliveryNotes ? <DetailValue label="Delivery Notes" value={order.deliveryNotes} /> : null}
              {order.deliveryTracking ? <DeliveryTrackingView order={order} onMapInteractionChange={setIsMapInteracting} /> : null}
              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Order Summary</Text>
              {getUniqueOrderItems(order.items ?? []).map((item) => (
                <View key={item.id} style={styles.productRow}>
                  {item.imageUrl ? <Image contentFit="cover" source={{ uri: item.imageUrl }} style={styles.image} /> : <View style={styles.imageFallback}><ImageOff color={theme.colors.primary} size={25} /></View>}
                  <View style={styles.productCopy}>
                    <Text style={styles.productName}>{item.productName || 'Flower order'}</Text>
                    <Text style={styles.muted}>{order.branch || "Esting's Flower Shop"}</Text>
                    {item.cardMessage ? <Text style={styles.cardMessage}>Card message: {item.cardMessage}</Text> : null}
                  </View>
                  <View style={styles.productEnd}><Text style={styles.muted}>x{item.quantity}</Text><Text style={styles.price}>{formatPhp(Math.round(item.totalAmount * 100))}</Text></View>
                </View>
              ))}
              <View style={styles.dashedDivider} />
              <SummaryRow label="Subtotal" value={formatPhp(Math.round(order.subtotalAmount * 100))} />
              <SummaryRow label="Delivery Fee" value={formatPhp(Math.round(order.deliveryFee * 100))} />
              <SummaryRow emphasized label="Total" value={formatPhp(Math.round(order.totalAmount * 100))} />
              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Support Center</Text>
              <View style={styles.supportActions}>
                <Pressable
                  onPress={() => router.push(`/(support)/live-chat?quote=${encodeURIComponent(`Hi, I need help with Order #${order.orderNumber}.\n\nOrder ID: ${order.orderNumber}\nPayment Status: ${formatLabel(order.paymentStatus)}\nOrder Status: ${formatLabel(order.status)}`)}` as never)}
                  style={[styles.supportButton, styles.supportButtonDark]}>
                  <MessageCircle color="#FFFFFF" size={18} />
                  <Text style={styles.supportButtonText}>Live Chat Support</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/help-center' as never)}
                  style={styles.supportButton}>
                  <HelpCircle color="#444444" size={18} />
                  <Text style={styles.supportButtonOutlineText}>Help Center</Text>
                </Pressable>
              </View>

              {order.paymentStatus === 'pending' ? (
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

function goBackFromOrderDetails() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)/orders');
  }
}

function DetailValue({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailValue}><Text style={styles.fieldLabel}>{label}</Text><Text selectable style={styles.fieldValue}>{value}</Text></View>;
}

function SummaryRow({ emphasized = false, label, value }: { emphasized?: boolean; label: string; value: string }) {
  return <View style={styles.summaryRow}><Text style={[styles.summaryLabel, emphasized && styles.totalText]}>{label}</Text><Text selectable style={[styles.summaryValue, emphasized && styles.totalValue]}>{value}</Text></View>;
}

function DeliveryTrackingView({
  order,
  onMapInteractionChange,
}: {
  order: CustomerOrder;
  onMapInteractionChange: (isInteracting: boolean) => void;
}) {
  const tracking = order.deliveryTracking;
  const [routePreview, setRoutePreview] = useState<CustomerRoutePreview | null>(null);
  const [streetPhotos, setStreetPhotos] = useState<CustomerStreetPhoto[]>([]);

  useEffect(() => {
    if (!tracking?.deliveryId || tracking.mode === 'external') return;
    let mounted = true;
    getAuthSession().then((session) => {
      if (!session || !mounted) return;
      return Promise.all([
        getCustomerDeliveryRoute({ deliveryId: tracking.deliveryId!, session }).catch(() => null),
        getCustomerStreetPhotos({ deliveryId: tracking.deliveryId!, session }).catch(() => null),
      ]).then(([preview, photos]) => {
        if (!mounted) return;
        setRoutePreview(preview);
        setStreetPhotos(photos?.photos ?? []);
      });
    });
    return () => {
      mounted = false;
      onMapInteractionChange(false);
    };
  }, [onMapInteractionChange, tracking?.deliveryId, tracking?.mode]);

  if (!tracking) return null;

  const timeline = tracking.events?.length ? tracking.events.map((event, index) => ({ key: `${event.status}-${index}`, label: formatLabel(event.status), time: event.createdAt })) : [
    { key: 'assigned', label: 'Assigned', time: tracking.assignedAt },
    { key: 'picked-up', label: 'Picked up', time: tracking.pickedUpAt },
    { key: 'out-for-delivery', label: 'Out for delivery', time: tracking.inTransitAt },
    { key: 'arrived', label: 'Arrived', time: tracking.arrivedAt },
    { key: 'completed', label: 'Completed', time: tracking.deliveredAt },
  ];

  return (
    <View style={styles.trackingCard}>
      <View style={styles.trackingHeader}>
        <Truck color={theme.colors.primary} size={20} />
        <View style={styles.trackingHeaderCopy}>
          <Text style={styles.trackingTitle}>{tracking.mode === 'external' ? `${tracking.providerName || formatLabel(tracking.provider || 'external courier')} Tracking` : 'In-house Delivery Tracking'}</Text>
          <Text selectable style={styles.trackingMeta}>{tracking.mode === 'external' ? `Reference: ${tracking.externalReference || 'Awaiting booking'}` : `Delivery ID: ${tracking.deliveryId || 'To be assigned'}`}</Text>
        </View>
      </View>

      <View style={styles.trackingTimeline}>
        {timeline.map((item) => {
          const done = Boolean(item.time);
          return (
            <View key={item.key} style={styles.trackingStep}>
              <View style={[styles.trackingDot, done && styles.trackingDotDone]}>
                {done ? <CheckCircle2 color="#FFFFFF" size={12} /> : null}
              </View>
              <View style={styles.trackingStepCopy}>
                <Text style={[styles.trackingStepLabel, done && styles.trackingStepLabelDone]}>{item.label}</Text>
                <Text style={styles.trackingStepTime}>{item.time ? formatDateTime(item.time) : 'Pending'}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.trackingDetailsGrid}>
        <TrackingDetail icon="truck" label="Status" value={formatLabel(tracking.status || order.status)} />
        {tracking.mode !== 'external' ? <TrackingDetail icon="user" label="Rider" value={tracking.rider?.name || 'To be assigned'} /> : null}
        {tracking.mode !== 'external' ? <TrackingDetail icon="map" label="Vehicle" value={formatVehicle(tracking.vehicle)} /> : null}
      </View>

      {tracking.trackingUrl ? <Pressable accessibilityRole="link" style={styles.trackingLinkButton} onPress={() => void Linking.openURL(tracking.trackingUrl!)}><Text style={styles.trackingLinkText}>Open official courier tracking</Text></Pressable> : null}

      {tracking.interventionRequired ? <View style={styles.trackingWarning}><Text style={styles.trackingWarningText}>The courier reported a delivery exception. Esting&apos;s staff will review or rebook it.</Text></View> : null}

      {routePreview ? <CustomerDeliveryRouteMap preview={routePreview} onMapInteractionChange={onMapInteractionChange} /> : null}

      {tracking.mode !== 'external' ? <View style={styles.customerStreetSection}><Text style={styles.customerStreetTitle}>Nearby street photos</Text>{streetPhotos.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.customerStreetList}>{streetPhotos.map((photo) => <CustomerStreetPhotoCard key={photo.id} photo={photo} />)}</ScrollView> : <Text style={styles.customerStreetEmpty}>No nearby street photos are available for this address.</Text>}<Text style={styles.customerStreetAttribution}>Nearby imagery © KartaView contributors · May not show the exact property.</Text></View> : null}

      {tracking.proofPhotoUrl ? (
        <View style={styles.proofPanel}>
          <Image contentFit="cover" source={{ uri: tracking.proofPhotoUrl }} style={styles.proofImage} />
          <View style={styles.proofCopy}>
            <Text style={styles.proofTitle}>Proof of delivery</Text>
            {tracking.proofNote ? <Text style={styles.proofText}>{tracking.proofNote}</Text> : null}
            {tracking.deliveredAt ? <Text style={styles.proofText}>Completed {formatDateTime(tracking.deliveredAt)}</Text> : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function TrackingDetail({
  icon,
  label,
  value,
}: {
  icon: 'map' | 'truck' | 'user';
  label: string;
  value: string;
}) {
  const Icon = icon === 'user' ? UserRound : icon === 'map' ? MapPin : Truck;

  return (
    <View style={styles.trackingDetail}>
      <Icon color={theme.colors.primary} size={16} />
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text selectable style={styles.trackingDetailValue}>{value}</Text>
    </View>
  );
}

function CustomerStreetPhotoCard({ photo }: { photo: CustomerStreetPhoto }) {
  const sources = getStreetPhotoSources(photo);
  const [sourceIndex, setSourceIndex] = useState(0);
  const sourceUri = sources[sourceIndex];

  useEffect(() => setSourceIndex(0), [photo.id]);

  return (
    <View style={styles.customerStreetCard}>
      {sourceUri ? (
        <Image contentFit="cover" source={{ uri: sourceUri }} style={styles.customerStreetImage} onError={() => setSourceIndex((index) => index + 1)} />
      ) : (
        <View style={[styles.customerStreetImage, styles.customerStreetFallback]}>
          <ImageOff color={theme.colors.primary} size={24} />
          <Text style={styles.customerStreetFallbackText}>Image unavailable</Text>
        </View>
      )}
      <Text style={styles.customerStreetCaption}>{photo.capturedAt ? `Captured ${new Date(photo.capturedAt).toLocaleDateString()}` : 'Nearby KartaView imagery'}</Text>
    </View>
  );
}

function getStreetPhotoSources(photo: CustomerStreetPhoto) {
  const sources: string[] = [];
  for (const candidate of [...(photo.imageUrls ?? []), photo.imageUrl]) {
    if (!candidate) continue;
    const secureUrl = candidate.replace(/^http:\/\//, 'https://').replace('[[sizeprefix]]', 'lth');
    const thumbnailUrl = secureUrl.replace('/wrapped_proc/', '/lth/').replace('/proc/', '/lth/');
    if (!sources.includes(thumbnailUrl)) sources.push(thumbnailUrl);
    if (!sources.includes(secureUrl)) sources.push(secureUrl);
  }
  return sources;
}

function formatVehicle(vehicle: NonNullable<CustomerOrder['deliveryTracking']>['vehicle']) {
  if (!vehicle) return 'To be assigned';
  const plate = vehicle.plateNumber || 'No plate';
  const model = [vehicle.brand, vehicle.model].filter(Boolean).join(' ');
  return model ? `${plate} - ${model}` : plate;
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
function formatLabel(value: string) {
  if (value === 'delivered') return 'Completed';
  return value.split(/[_-]+/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
function formatCountdown(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  return [hours, minutes, remaining].map((value) => String(value).padStart(2, '0')).join(':');
}
function formatTimeSlot(value?: string | null) {
  if (!value || value === 'anytime') return 'Anytime (9AM - 6PM)';
  return formatLabel(value);
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
  orderNumberButton: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  orderNumberPressed: { opacity: 0.55 },
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
  cardMessage: { color: theme.colors.primary, fontFamily: Fonts.sansMedium, fontSize: 11, lineHeight: 16 },
  productEnd: { alignItems: 'flex-end', alignSelf: 'stretch', justifyContent: 'space-between', paddingVertical: 8 },
  productName: { color: '#444444', fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 18 },
  price: { color: '#444444', fontFamily: Fonts.sansMedium, fontSize: 13 },
  dashedDivider: { borderColor: '#D7D7D7', borderStyle: 'dashed', borderTopWidth: 1 },
  summaryRow: { flexDirection: 'row', gap: theme.spacing.md, justifyContent: 'space-between' },
  summaryLabel: { color: '#333333', fontFamily: Fonts.sans, fontSize: 16 },
  summaryValue: { color: '#444444', flex: 1, fontFamily: Fonts.sans, fontSize: 15, textAlign: 'right' },
  totalText: { color: '#222222', fontFamily: Fonts.sansMedium, fontSize: 17 },
  totalValue: { color: '#444444', fontFamily: Fonts.sansMedium, fontSize: 16 },
  supportActions: { gap: 10 },
  supportButton: { alignItems: 'center', borderColor: '#D7D7D7', borderRadius: theme.radius.sm, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 54 },
  supportButtonDark: { backgroundColor: '#383838', borderColor: '#383838' },
  supportButtonOutlineText: { color: '#444444', fontFamily: Fonts.sans, fontSize: 16 },
  supportButtonText: { color: '#FFFFFF', fontFamily: Fonts.sans, fontSize: 16 },
  proofCopy: { flex: 1, gap: 3 },
  proofImage: { backgroundColor: '#ECECEC', borderRadius: theme.radius.sm, height: 82, width: 82 },
  proofPanel: { alignItems: 'center', backgroundColor: '#F6F8F6', borderColor: '#E1E6E1', borderRadius: theme.radius.sm, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 12 },
  proofText: { color: '#666666', fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  proofTitle: { color: '#333333', fontFamily: Fonts.sansMedium, fontSize: 14 },
  primaryButton: { alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, justifyContent: 'center', minHeight: 54 },
  primaryButtonText: { color: '#FFFFFF', fontFamily: Fonts.sansMedium, fontSize: 16 },
  trackingCard: { backgroundColor: '#FFFFFF', borderColor: '#D7D7D7', borderRadius: theme.radius.sm, borderWidth: 1, gap: 14, padding: 14 },
  trackingDetail: { backgroundColor: '#F6F8F6', borderColor: '#E1E6E1', borderRadius: theme.radius.sm, borderWidth: 1, flex: 1, gap: 4, minHeight: 84, padding: 10 },
  trackingDetailsGrid: { flexDirection: 'row', gap: 8 },
  trackingDetailValue: { color: '#333333', fontFamily: Fonts.sansMedium, fontSize: 11, lineHeight: 16 },
  trackingDot: { alignItems: 'center', backgroundColor: '#D7D7D7', borderRadius: 10, height: 20, justifyContent: 'center', width: 20 },
  trackingDotDone: { backgroundColor: theme.colors.primary },
  trackingHeader: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  trackingHeaderCopy: { flex: 1, gap: 2 },
  trackingMeta: { color: '#777777', fontFamily: Fonts.sans, fontSize: 11 },
  trackingStep: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  trackingStepCopy: { flex: 1, gap: 2 },
  trackingStepLabel: { color: '#777777', fontFamily: Fonts.sans, fontSize: 13 },
  trackingStepLabelDone: { color: '#333333', fontFamily: Fonts.sansMedium },
  trackingStepTime: { color: '#999999', fontFamily: Fonts.sans, fontSize: 11 },
  trackingTimeline: { gap: 10 },
  trackingTitle: { color: '#333333', fontFamily: Fonts.sansMedium, fontSize: 17 },
  trackingLinkButton: { alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, justifyContent: 'center', minHeight: 46, paddingHorizontal: 14 },
  trackingLinkText: { color: '#FFFFFF', fontFamily: Fonts.sansMedium, fontSize: 14 },
  trackingWarning: { backgroundColor: '#FFF4E5', borderColor: '#F4C87A', borderRadius: theme.radius.sm, borderWidth: 1, padding: 12 },
  trackingWarningText: { color: '#7A4A00', fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  customerStreetAttribution: { color: '#888888', fontFamily: Fonts.sans, fontSize: 10, lineHeight: 14 },
  customerStreetCaption: { color: '#666666', fontFamily: Fonts.sans, fontSize: 10, lineHeight: 14, padding: 8 },
  customerStreetCard: { backgroundColor: '#F6F8F6', borderRadius: theme.radius.sm, overflow: 'hidden', width: 205 },
  customerStreetEmpty: { color: '#777777', fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  customerStreetFallback: { alignItems: 'center', backgroundColor: '#EDF1ED', gap: 5, justifyContent: 'center' },
  customerStreetFallbackText: { color: '#777777', fontFamily: Fonts.sansMedium, fontSize: 11 },
  customerStreetImage: { height: 120, width: '100%' },
  customerStreetList: { gap: 10 },
  customerStreetSection: { gap: 9 },
  customerStreetTitle: { color: '#333333', fontFamily: Fonts.sansMedium, fontSize: 15 },
});
