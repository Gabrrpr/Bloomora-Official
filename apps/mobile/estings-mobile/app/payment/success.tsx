import * as MediaLibrary from 'expo-media-library';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, Clock3, Download, ReceiptText, RefreshCw } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  AppState,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef, releaseCapture } from 'react-native-view-shot';

import { AppPageHeader } from '@/components/app-page-header';
import { Fonts, theme } from '@/constants/theme';
import { getAuthSession } from '@/services/auth-session';
import { removeCartItem } from '@/services/cart-storage';
import { notifyCartUpdated } from '@/services/guest-cart';
import type { CustomerOrder } from '@/services/orders-api';
import {
  confirmPayMongoOrders,
  type PayMongoConfirmationResult,
  type PayMongoReceipt,
} from '@/services/paymongo-confirmation';

const estingsCorporateLogo = require('../../assets/images/estings-logo.svg');

type ConfirmationState = 'checking' | 'confirmed' | 'missing' | 'pending' | 'unavailable';

export default function PaymentSuccessScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ orderIds?: string }>();
  const orderIds = useMemo(
    () => (params.orderIds ?? '').split(',').map((id) => id.trim()).filter(Boolean),
    [params.orderIds],
  );
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>(
    orderIds.length > 0 ? 'checking' : 'missing',
  );
  const [confirmation, setConfirmation] = useState<PayMongoConfirmationResult | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const receiptRef = useRef<View | null>(null);
  const receiptReveal = useRef(new Animated.Value(0)).current;
  const isConfirmed = confirmationState === 'confirmed';
  const order = confirmation?.order;

  const checkPaymentStatus = useCallback(async () => {
    if (orderIds.length === 0) {
      setConfirmationState('missing');
      return false;
    }

    setIsRefreshing(true);
    try {
      const session = await getAuthSession();
      if (!session) {
        setConfirmationState('unavailable');
        return false;
      }

      const result = await confirmPayMongoOrders({ orderIds, session });
      setConfirmation(result);
      setConfirmationState(result.allPaid ? 'confirmed' : 'pending');

      if (result.allPaid) {
        await Promise.allSettled(
          result.purchasedProductIds.map((productId) => removeCartItem(productId)),
        );
        notifyCartUpdated();
      }

      return result.allPaid;
    } catch {
      setConfirmationState('unavailable');
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [orderIds]);

  useEffect(() => {
    let isActive = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;

      try {
        const isPaid = await checkPaymentStatus();
        if (!isActive || orderIds.length === 0 || isPaid || attempts >= 12) {
          return;
        }
      } catch {
        if (isActive) {
          setConfirmationState('unavailable');
        }
        return;
      }

      timeoutId = setTimeout(poll, 2500);
    };

    void poll();

    return () => {
      isActive = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [checkPaymentStatus, orderIds.length]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && confirmationState !== 'confirmed') {
        void checkPaymentStatus();
      }
    });
    return () => subscription.remove();
  }, [checkPaymentStatus, confirmationState]);

  useEffect(() => {
    if (!isConfirmed || !order) {
      receiptReveal.setValue(0);
      return;
    }

    Animated.timing(receiptReveal, {
      duration: 360,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [isConfirmed, order, receiptReveal]);

  const saveReceipt = useCallback(async () => {
    if (!isConfirmed || !order || !receiptRef.current || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveNotice(null);
    let capturedUri: string | null = null;

    try {
      const fileName = `Estings-Payment-Receipt-${safeFileName(order.orderNumber)}`;

      if (Platform.OS === 'web') {
        capturedUri = await captureRef(receiptRef, {
          format: 'png',
          quality: 1,
          result: 'data-uri',
        });
        downloadReceipt(capturedUri, `${fileName}.png`);
        setSaveNotice('Receipt downloaded as a PNG image.');
        return;
      }

      const mediaLibraryAvailable = await MediaLibrary.isAvailableAsync();
      if (!mediaLibraryAvailable) {
        Alert.alert(
          'Saving is not available',
          'You can still take a screenshot of the receipt below.',
        );
        return;
      }

      const permission = await MediaLibrary.requestPermissionsAsync(true);
      if (!permission.granted) {
        Alert.alert(
          'Photos access is off',
          "Allow Esting's to add photos, then tap Save receipt again.",
        );
        return;
      }

      capturedUri = await captureRef(receiptRef, {
        fileName,
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      await MediaLibrary.saveToLibraryAsync(asFileUri(capturedUri));
      setSaveNotice('Receipt saved to your Photos or Gallery.');
    } catch {
      Alert.alert(
        'Receipt not saved',
        'Please try again. You can also take a screenshot of the receipt below.',
      );
    } finally {
      if (capturedUri && Platform.OS !== 'web') {
        try {
          releaseCapture(capturedUri);
        } catch {
          // Temporary receipt files are also cleared when the app closes.
        }
      }
      setIsSaving(false);
    }
  }, [isConfirmed, isSaving, order]);

  const orderNumbers = confirmation ? getOrderNumbers(confirmation) : [];

  return (
    <View style={styles.screen}>
      <AppPageHeader
        onBack={() => router.replace('/(tabs)/orders')}
        title={isConfirmed ? 'Payment receipt' : 'Payment status'}
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.spacing.xxl }]}
        removeClippedSubviews={false}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.iconRing, !isConfirmed && styles.iconRingPending]}>
            {isConfirmed ? (
              <Check color={theme.colors.primaryDark} size={38} strokeWidth={2.8} />
            ) : (
              <Clock3 color={theme.colors.primaryDark} size={34} strokeWidth={2.2} />
            )}
          </View>
          <Text style={styles.eyebrow}>PAYMONGO PAYMENT</Text>
          <Text style={styles.title}>{getStatusTitle(confirmationState)}</Text>
          <Text style={styles.body}>{getStatusMessage(confirmationState, Boolean(order))}</Text>
        </View>

        {isConfirmed && order && confirmation ? (
          <Animated.View
            style={[
              styles.receiptSection,
              {
                opacity: receiptReveal,
                transform: [{
                  translateY: receiptReveal.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                }],
              },
            ]}>
            <View style={styles.receiptShadow}>
              <ReceiptDocument
                confirmationReceipt={confirmation.receipt}
                order={order}
                orderNumbers={orderNumbers}
                receiptRef={receiptRef}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => void saveReceipt()}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && !isSaving && styles.pressed,
                isSaving && styles.disabledButton,
              ]}>
              <Download color={theme.colors.primary} size={19} strokeWidth={2.3} />
              <Text style={styles.saveButtonText}>
                {isSaving
                  ? 'Preparing receipt...'
                  : Platform.OS === 'web' ? 'Download receipt' : 'Save receipt'}
              </Text>
            </Pressable>
            {saveNotice ? (
              <Text accessibilityLiveRegion="polite" style={styles.saveNotice}>{saveNotice}</Text>
            ) : null}
          </Animated.View>
        ) : (
          <PaymentStatusCard
            hasOrderIds={orderIds.length > 0}
            isRefreshing={isRefreshing}
            onRefresh={() => void checkPaymentStatus()}
            state={confirmationState}
          />
        )}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(tabs)/orders')}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <ReceiptText color={theme.colors.white} size={18} strokeWidth={2.2} />
            <Text style={styles.primaryButtonText}>View my orders</Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/contact')}
            style={({ pressed }) => [styles.supportButton, pressed && styles.pressed]}>
            <Text style={styles.supportCopy}>Need help?</Text>
            <Text style={styles.supportLink}>Contact us</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function ReceiptDocument({
  confirmationReceipt,
  order,
  orderNumbers,
  receiptRef,
}: {
  confirmationReceipt: PayMongoReceipt;
  order: CustomerOrder;
  orderNumbers: string[];
  receiptRef: React.RefObject<View | null>;
}) {
  const fulfillment = formatFulfillment(order.fulfillmentMethod, order.deliveryProvider);
  const requestedDateLabel = order.fulfillmentMethod === 'pickup'
    ? 'Requested pickup'
    : 'Requested delivery';
  const totalQuantity = order.items.reduce((total, item) => total + item.quantity, 0);
  const method = formatPaymentMethod(order.paymentMethod ?? confirmationReceipt.paymentMethod);
  const provider = formatPaymentProvider(order.paymentProvider ?? confirmationReceipt.provider);

  return (
    <View collapsable={false} ref={receiptRef} style={styles.receipt}>
      <View style={styles.receiptTopRule} />
      <View style={styles.receiptBrandRow}>
        <View style={styles.receiptBrandIdentity}>
          <Image contentFit="contain" source={estingsCorporateLogo} style={styles.receiptLogo} />
          <View style={styles.receiptCompanyCopy}>
            <Text style={styles.receiptCompanyName}>Esting&apos;s Flowers</Text>
            <Text style={styles.receiptCompanyLegalName}>International Inc.</Text>
          </View>
        </View>
        <View style={styles.paidBadge}>
          <Text style={styles.paidBadgeText}>PAID</Text>
        </View>
      </View>

      <Text style={styles.receiptTitle}>Payment receipt</Text>
      <Text style={styles.receiptSubtitle}>
        Payment has been confirmed for the order{orderNumbers.length > 1 ? 's' : ''} below.
      </Text>

      <View style={styles.receiptDivider} />

      <View style={styles.metaGrid}>
        <ReceiptMeta label={orderNumbers.length > 1 ? 'Order numbers' : 'Order number'} value={orderNumbers.join('\n')} />
        <ReceiptMeta label="Paid on" value={formatPaidDate(confirmationReceipt.paidAt ?? order.paidAt)} />
        <ReceiptMeta label="Payment method" value={method} />
        <ReceiptMeta label="Processed by" value={provider} />
        <ReceiptMeta label="Ordering branch" value={formatBranch(order.branch)} />
        <ReceiptMeta label="Fulfillment" value={fulfillment} />
        {order.recipientName ? <ReceiptMeta label="Recipient" value={order.recipientName} /> : null}
        {order.scheduledAt ? (
          <ReceiptMeta
            label={requestedDateLabel}
            value={`${formatRequestedDate(order.scheduledAt)} · ${formatTimeSlot(order.timeSlot)}`}
          />
        ) : null}
      </View>

      <View style={styles.receiptDivider} />

      <Text style={styles.receiptSectionTitle}>Order items ({totalQuantity})</Text>
      <View style={styles.itemList}>
        {order.items.map((item, index) => (
          <View key={item.id} style={styles.receiptItem}>
            <View style={styles.itemIndex}>
              <Text style={styles.itemIndexText}>{index + 1}</Text>
            </View>
            <View style={styles.itemCopy}>
              <Text style={styles.itemName}>{item.productName}</Text>
              <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>{formatReceiptCurrency(item.totalAmount)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.receiptDivider} />

      <View style={styles.totals}>
        <ReceiptTotalRow label="Subtotal" value={formatReceiptCurrency(order.subtotalAmount)} />
        {order.fulfillmentMethod !== 'pickup' ? (
          <ReceiptTotalRow label="Delivery fee" value={formatReceiptCurrency(order.deliveryFee)} />
        ) : null}
        {order.discountAmount > 0 ? (
          <ReceiptTotalRow
            label={order.voucherCode ? `Voucher ${order.voucherCode}` : 'Discount'}
            value={`-${formatReceiptCurrency(order.discountAmount)}`}
          />
        ) : null}
        <View style={styles.totalRule} />
        <ReceiptTotalRow isTotal label="Order total" value={formatReceiptCurrency(order.totalAmount)} />
      </View>

      <View style={styles.receiptFooter}>
        <Text style={styles.receiptFooterTitle}>Thank you for choosing Esting&apos;s.</Text>
        <Text style={styles.receiptFooterText}>
          This receipt confirms payment. Follow preparation and fulfillment updates in My Orders.
        </Text>
      </View>
      <View style={styles.receiptBottomRule} />
    </View>
  );
}

function ReceiptMeta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value || 'Not available'}</Text>
    </View>
  );
}

function ReceiptTotalRow({
  isTotal = false,
  label,
  value,
}: {
  isTotal?: boolean;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, isTotal && styles.grandTotalLabel]}>{label}</Text>
      <Text style={[styles.totalValue, isTotal && styles.grandTotalValue]}>{value}</Text>
    </View>
  );
}

function PaymentStatusCard({
  hasOrderIds,
  isRefreshing,
  onRefresh,
  state,
}: {
  hasOrderIds: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  state: ConfirmationState;
}) {
  return (
    <View style={styles.statusCard}>
      <View style={styles.statusCardHeader}>
        <View style={styles.statusDot} />
        <View style={styles.statusCardCopy}>
          <Text style={styles.statusCardLabel}>Current payment status</Text>
          <Text style={styles.statusCardValue}>{getShortStatus(state)}</Text>
        </View>
      </View>
      <Text style={styles.statusCardBody}>
        A receipt appears here only after the payment is confirmed, so it never shows an unverified success.
      </Text>
      {hasOrderIds ? (
        <Pressable
          accessibilityRole="button"
          disabled={isRefreshing}
          onPress={onRefresh}
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && !isRefreshing && styles.pressed,
            isRefreshing && styles.disabledButton,
          ]}>
          <RefreshCw color={theme.colors.primary} size={17} strokeWidth={2.2} />
          <Text style={styles.refreshButtonText}>{isRefreshing ? 'Checking...' : 'Check again'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function getOrderNumbers(confirmation: PayMongoConfirmationResult) {
  const numbers = confirmation.statuses
    .map((status) => status.order?.order_number?.trim())
    .filter((value): value is string => Boolean(value));
  if (numbers.length > 0) {
    return [...new Set(numbers)];
  }
  return confirmation.receipt.orderNumbers.length > 0
    ? confirmation.receipt.orderNumbers
    : confirmation.order?.orderNumber ? [confirmation.order.orderNumber] : [];
}

function getStatusTitle(state: ConfirmationState) {
  if (state === 'confirmed') return 'Payment received';
  if (state === 'missing') return 'Open your order to continue';
  if (state === 'unavailable') return 'We could not refresh the status';
  return 'Confirming your payment';
}

function getStatusMessage(state: ConfirmationState, hasOrder: boolean) {
  if (state === 'confirmed' && hasOrder) {
    return 'Your payment is confirmed. We received your order, and its latest updates will appear in My Orders.';
  }
  if (state === 'confirmed') {
    return 'Your payment is confirmed. We are still loading the full receipt details; tap Check again in a moment.';
  }
  if (state === 'checking') {
    return "You're back from PayMongo. We're securely checking the payment before showing a receipt.";
  }
  if (state === 'missing') {
    return 'This page does not have the order information needed to check a payment. Open My Orders to see the latest status.';
  }
  if (state === 'unavailable') {
    return 'Your payment may still be okay. Please check again, or open My Orders to see its latest status.';
  }
  return 'PayMongo returned you to the app, but the payment is still being confirmed. This can take a short moment.';
}

function getShortStatus(state: ConfirmationState) {
  if (state === 'checking') return 'Checking payment';
  if (state === 'missing') return 'Order link missing';
  if (state === 'unavailable') return 'Temporarily unavailable';
  if (state === 'confirmed') return 'Paid';
  return 'Waiting for confirmation';
}

function formatReceiptCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', {
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: 'currency',
  }).format(Number.isFinite(value) ? value : 0);
}

function formatPaidDate(value?: string | null) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString('en-PH', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    timeZone: 'Asia/Manila',
    timeZoneName: 'short',
    year: 'numeric',
  });
}

function formatRequestedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleDateString('en-PH', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Manila',
    year: 'numeric',
  });
}

function formatTimeSlot(value?: string | null) {
  if (!value || value === 'anytime') return 'Anytime of the day';
  if (value === 'morning') return 'Morning';
  if (value === 'afternoon') return 'Afternoon';
  return toDisplayLabel(value);
}

function formatPaymentMethod(value?: string | null) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'ewallet' || normalized === 'wallet') return 'E-wallet';
  if (normalized === 'qrph') return 'QR Ph';
  if (normalized === 'paymaya' || normalized === 'pay_maya') return 'Maya';
  if (normalized === 'gcash') return 'GCash';
  if (normalized === 'card') return 'Card';
  if (normalized === 'cash') return 'Cash';
  return normalized ? toDisplayLabel(normalized) : 'Online payment';
}

function formatPaymentProvider(value?: string | null) {
  const normalized = String(value ?? 'paymongo').trim().toLowerCase();
  if (normalized === 'paymongo') return 'PayMongo';
  return toDisplayLabel(normalized);
}

function formatFulfillment(method?: string | null, provider?: string | null) {
  const normalizedMethod = String(method ?? '').toLowerCase();
  const normalizedProvider = String(provider ?? '').toLowerCase();
  if (normalizedMethod === 'pickup') return 'Store pickup';
  if (normalizedMethod === 'lalamove' || normalizedProvider === 'lalamove') return 'Lalamove';
  return 'Standard delivery';
}

function formatBranch(value?: string | null) {
  const normalized = String(value ?? '').trim().replace(/[—–-]+/g, '');
  return normalized ? `${toDisplayLabel(normalized.replace(/\s+branch$/i, ''))} branch` : 'Not available';
}

function toDisplayLabel(value: string) {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function safeFileName(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'Order';
}

function asFileUri(uri: string) {
  return uri.startsWith('file://') ? uri : `file://${uri}`;
}

function downloadReceipt(dataUri: string, fileName: string) {
  if (typeof document === 'undefined') {
    throw new Error('Browser download is unavailable.');
  }
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F5F7F5',
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  hero: {
    alignItems: 'center',
    maxWidth: 560,
    paddingHorizontal: theme.spacing.md,
    width: '100%',
  },
  iconRing: {
    alignItems: 'center',
    backgroundColor: '#DDF3DF',
    borderColor: '#C3E8C6',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 78,
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    width: 78,
  },
  iconRingPending: {
    backgroundColor: '#EEF2EF',
    borderColor: '#E0E6E1',
  },
  eyebrow: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.4,
    lineHeight: 15,
    marginBottom: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 30,
    letterSpacing: -0.7,
    lineHeight: 36,
    textAlign: 'center',
  },
  body: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    marginTop: theme.spacing.sm,
    maxWidth: 500,
    textAlign: 'center',
  },
  receiptSection: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    maxWidth: 560,
    width: '100%',
  },
  receiptShadow: {
    alignSelf: 'stretch',
    backgroundColor: theme.colors.white,
    borderRadius: 2,
    elevation: 4,
    shadowColor: '#152019',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
  },
  receipt: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    width: '100%',
  },
  receiptTopRule: {
    borderColor: '#CED6D0',
    borderStyle: 'dashed',
    borderTopWidth: 1,
    marginBottom: theme.spacing.lg,
  },
  receiptBottomRule: {
    borderColor: '#CED6D0',
    borderStyle: 'dashed',
    borderTopWidth: 1,
    marginTop: theme.spacing.lg,
  },
  receiptBrandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptBrandIdentity: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 9, paddingRight: 10 },
  receiptLogo: { borderRadius: 999, height: 46, width: 46 },
  receiptCompanyCopy: { flex: 1 },
  receiptCompanyName: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    lineHeight: 17,
  },
  receiptCompanyLegalName: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 9,
    lineHeight: 13,
  },
  paidBadge: {
    backgroundColor: '#E0F4E2',
    borderColor: '#B9E3BD',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  paidBadgeText: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 10,
    letterSpacing: 1.2,
    lineHeight: 12,
  },
  receiptTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 25,
    letterSpacing: -0.5,
    lineHeight: 31,
    marginTop: theme.spacing.xl,
  },
  receiptSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    marginTop: theme.spacing.xs,
  },
  receiptDivider: {
    backgroundColor: '#E4E9E5',
    height: 1,
    marginVertical: theme.spacing.lg,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: theme.spacing.lg,
  },
  metaItem: {
    paddingRight: theme.spacing.md,
    width: '50%',
  },
  metaLabel: {
    color: '#7B847D',
    fontFamily: Fonts.sansMedium,
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 3,
  },
  metaValue: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    lineHeight: 16,
  },
  receiptSectionTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  itemList: {
    gap: theme.spacing.md,
  },
  receiptItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  itemIndex: {
    alignItems: 'center',
    backgroundColor: '#F0F4F1',
    borderRadius: theme.radius.sm,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  itemIndexText: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansBold,
    fontSize: 11,
  },
  itemCopy: {
    flex: 1,
    paddingTop: 1,
  },
  itemName: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    lineHeight: 15,
  },
  itemQuantity: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  itemPrice: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    lineHeight: 16,
    paddingTop: 1,
    textAlign: 'right',
  },
  totals: {
    gap: theme.spacing.sm,
  },
  totalRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 16,
  },
  totalValue: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
  },
  totalRule: {
    borderColor: '#D8DEDA',
    borderStyle: 'dashed',
    borderTopWidth: 1,
    marginVertical: theme.spacing.xs,
  },
  grandTotalLabel: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 19,
  },
  grandTotalValue: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 17,
    lineHeight: 21,
  },
  receiptFooter: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  receiptFooterTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  receiptFooterText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 9,
    lineHeight: 14,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  saveButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: theme.colors.white,
    borderColor: '#CED8D0',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    minHeight: 50,
    paddingHorizontal: theme.spacing.xl,
  },
  saveButtonText: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
  },
  saveNotice: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 17,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: theme.colors.white,
    borderColor: '#E0E6E1',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginTop: theme.spacing.xl,
    maxWidth: 560,
    padding: theme.spacing.lg,
    width: '100%',
  },
  statusCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statusDot: {
    backgroundColor: theme.colors.amber,
    borderRadius: theme.radius.pill,
    height: 10,
    width: 10,
  },
  statusCardCopy: {
    flex: 1,
  },
  statusCardLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    lineHeight: 15,
  },
  statusCardValue: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
    marginTop: 2,
  },
  statusCardBody: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    marginTop: theme.spacing.md,
  },
  refreshButton: {
    alignItems: 'center',
    borderColor: '#D5DED7',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    minHeight: 46,
    paddingHorizontal: theme.spacing.lg,
  },
  refreshButtonText: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
  },
  actions: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    maxWidth: 560,
    width: '100%',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: theme.spacing.xl,
    width: '100%',
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
  },
  supportButton: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    minHeight: 36,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  supportCopy: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
  },
  supportLink: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansBold,
    fontSize: 12,
  },
  disabledButton: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.985 }],
  },
});
