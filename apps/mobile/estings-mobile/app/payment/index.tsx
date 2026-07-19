import * as Linking from 'expo-linking';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, type Href, useLocalSearchParams, useNavigation } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  Banknote,
  Check,
  ChevronRight,
  ChevronUp,
  Flower2,
  ShoppingBag,
  Upload,
} from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';

import gcashLogo from '../../assets/images/payment/gcash.png';
import mastercardLogo from '../../assets/images/payment/mastercard.png';
import paymongoLogo from '../../assets/images/payment/paymongo.png';
import qrphLogo from '../../assets/images/payment/qrph.png';
import visaLogo from '../../assets/images/payment/visa.png';
import { AppPageHeader } from '@/components/app-page-header';
import { formatPhp } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { getAuthSession } from '@/services/auth-session';
import { getOrderById, type CustomerOrder, type CustomerOrderItem } from '@/services/orders-api';
import { isPayMongoOrderPaid } from '@/services/paymongo-confirmation';
import { createPayMongoCheckout, getPayMongoPaymentStatus } from '@/services/payments-api';

type PaymentMethod = 'paymongo' | 'gcash' | 'bank';

const PAYMONGO_BUTTON_LOCK_MS = 2 * 60 * 1000;

const paymentLogos = {
  gcash: gcashLogo,
  mastercard: mastercardLogo,
  paymongo: paymongoLogo,
  qrph: qrphLogo,
  visa: visaLogo,
};

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{
    orderId?: string;
  }>();
  const orderId = params.orderId?.trim() ?? '';
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod | null>('paymongo');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymongoLockedUntil, setPaymongoLockedUntil] = useState(0);
  const [paymongoLockRemainingSeconds, setPaymongoLockRemainingSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const allowLeaveRef = useRef(false);
  const isCheckingLeaveRef = useRef(false);
  const paymongoLockedUntilRef = useRef(0);

  useEffect(() => {
    const removeBefore = navigation.addListener('beforeRemove', (event) => {
      if (allowLeaveRef.current) return;
      if (order?.paymentStatus === 'paid') return;
      event.preventDefault();

      if (isCheckingLeaveRef.current) return;
      isCheckingLeaveRef.current = true;
      void (async () => {
        try {
          const session = await getAuthSession();
          if (session && orderId) {
            const isPaid = await isPayMongoOrderPaid({ orderId, session });
            if (isPaid) {
              const refreshedOrder = await getOrderById({ orderId, session });
              setOrder(refreshedOrder);
              allowLeaveRef.current = true;
              navigation.dispatch(event.data.action);
              return;
            }
          }
        } catch {
          // Fall back to the explicit confirmation dialog below.
        } finally {
          isCheckingLeaveRef.current = false;
        }

        Alert.alert('Leave payment?', 'Your order is not paid yet.', [
          { style: 'cancel', text: 'Stay' },
          {
            style: 'destructive',
            text: 'Leave',
            onPress: () => {
              allowLeaveRef.current = true;
              navigation.dispatch(event.data.action);
            },
          },
        ]);
      })();
    });
    return () => {
      removeBefore();
    };
  }, [navigation, order?.paymentStatus, orderId]);

  useEffect(() => {
    let active = true;
    setIsLoadingOrder(true);
    setOrderError(null);
    void (async () => {
      const session = await getAuthSession();
      if (!session) throw new Error('Your login session has expired. Sign in and try again.');
      if (!orderId) throw new Error('The order ID is missing. Return to checkout and try again.');
      return getOrderById({ orderId, session });
    })()
      .then((nextOrder) => {
        if (active) setOrder(nextOrder);
      })
      .catch((error) => {
        if (active) setOrderError(error instanceof Error ? error.message : 'Unable to load this order.');
      })
      .finally(() => {
        if (active) setIsLoadingOrder(false);
      });
    return () => {
      active = false;
    };
  }, [orderId]);

  useEffect(() => {
    const updateRemaining = () => {
      const expiresAt = order?.expiresAt ? new Date(order.expiresAt).getTime() : 0;
      setRemainingSeconds(expiresAt ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)) : 0);
    };
    updateRemaining();
    const timer = setInterval(updateRemaining, 1000);
    return () => clearInterval(timer);
  }, [order?.expiresAt]);

  useEffect(() => {
    const updatePaymentLock = () => {
      setPaymongoLockRemainingSeconds(
        paymongoLockedUntil > 0
          ? Math.max(0, Math.ceil((paymongoLockedUntil - Date.now()) / 1000))
          : 0,
      );
    };

    updatePaymentLock();
    if (paymongoLockedUntil <= Date.now()) return;

    const timer = setInterval(updatePaymentLock, 1000);
    const unlockTimer = setTimeout(
      () => setPaymongoLockedUntil(0),
      Math.max(0, paymongoLockedUntil - Date.now()),
    );
    return () => {
      clearInterval(timer);
      clearTimeout(unlockTimer);
    };
  }, [paymongoLockedUntil]);

  const items = order?.items ?? [];
  const totalCents = Math.round((order?.totalAmount ?? 0) * 100);
  const deliveryFeeCents = Math.round((order?.deliveryFee ?? 0) * 100);
  const subtotalCents = Math.round((order?.subtotalAmount ?? 0) * 100);
  const itemQuantity = items.reduce((total, item) => total + item.quantity, 0);
  const timerLabel = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;

  const handleUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access required', 'Allow photo access to upload your payment screenshot.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled) setReceiptUri(result.assets[0]?.uri ?? null);
  };

  const handleContinue = async () => {
    if (!method || isProcessing || Date.now() < paymongoLockedUntilRef.current) return;
    if (method !== 'paymongo') {
      Alert.alert(
        'Manual payment unavailable',
        'Receipt submission is not connected to the backend yet. Use PayMongo so your payment can be verified securely.',
      );
      return;
    }
    const session = await getAuthSession();
    if (!session) {
      Alert.alert('Payment unavailable', 'Your login session has expired. Sign in and try again.');
      return;
    }
    if (!order || !orderId) {
      Alert.alert('Payment unavailable', 'Your order is unavailable. Return to checkout and try again.');
      return;
    }
    if (remainingSeconds <= 0 || order.paymentStatus === 'expired') {
      Alert.alert('Payment expired', 'This order is no longer available for payment. Return to your cart and check out again.');
      return;
    }
    const lockedUntil = Date.now() + PAYMONGO_BUTTON_LOCK_MS;
    paymongoLockedUntilRef.current = lockedUntil;
    setPaymongoLockedUntil(lockedUntil);
    setIsProcessing(true);
    try {
      const webOrigin = Platform.OS === 'web' ? globalThis.location.origin : null;
      const nativeSuccessUrl = `${Linking.createURL('/payment/success')}?orderIds=${encodeURIComponent(orderId)}`;
      const nativeCancelUrl = `${Linking.createURL('/payment/cancel')}?orderId=${encodeURIComponent(orderId)}`;
      const successUrl = webOrigin
        ? `${webOrigin}/payment/success?orderIds=${encodeURIComponent(orderId)}`
        : nativeSuccessUrl;
      const cancelUrl = webOrigin
        ? `${webOrigin}/payment/cancel?orderId=${encodeURIComponent(orderId)}`
        : nativeCancelUrl;
      const checkout = await createPayMongoCheckout({
        cancelUrl,
        orderIds: [orderId],
        session,
        successUrl,
      });
      const successHref = `/payment/success?orderIds=${encodeURIComponent(checkout.order_ids.join(','))}` as Href;
      if (Platform.OS === 'web') {
        globalThis.location.href = checkout.checkout_url;
        return;
      }
      const result = await WebBrowser.openAuthSessionAsync(checkout.checkout_url, Linking.createURL('/payment/success'));
      if (result.type === 'success') {
        if (result.url.includes('/payment/expired')) router.replace('/payment/expired');
        else if (result.url.includes('/payment/failed')) router.replace('/payment/failed');
        else if (result.url.includes('/payment/cancel')) {
          router.replace(`/payment/cancel?orderId=${encodeURIComponent(orderId)}` as Href);
        }
        else router.replace(successHref);
      } else {
        const status = await getPayMongoPaymentStatus({ orderId, session });
        if (status.payment_status === 'paid' || status.order?.payment_status === 'paid') {
          router.replace(successHref);
        }
      }
    } catch (error) {
      Alert.alert('Payment unavailable', error instanceof Error ? error.message : 'Unable to open PayMongo.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoadingOrder) {
    return (
      <View style={styles.screen}>
        <AppPageHeader onBack={() => navigation.goBack()} title="Payment" />
        <View style={styles.loadingState}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={styles.resultBody}>Loading the server-confirmed order total…</Text>
        </View>
      </View>
    );
  }

  if (!order || orderError) {
    return (
      <View style={styles.screen}>
        <AppPageHeader onBack={() => navigation.goBack()} title="Payment" />
        <View style={styles.loadingState}>
          <Text style={styles.resultMutedTitle}>Payment unavailable</Text>
          <Text style={styles.resultBody}>{orderError ?? 'Unable to load this order.'}</Text>
          <SecondaryButton label="Return to checkout" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppPageHeader onBack={() => navigation.goBack()} title="Payment" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Pressable onPress={() => setIsSummaryExpanded((current) => !current)} style={styles.summaryHeader}>
            <View style={styles.summaryTitleRow}>
              <View style={styles.bagIconWrap}>
                <ShoppingBag color={theme.colors.text} size={22} strokeWidth={2} />
                <View style={styles.itemBadge}><Text style={styles.itemBadgeText}>{items.length}</Text></View>
              </View>
              <Text style={styles.summaryTitle}>Order Summary</Text>
            </View>
            {isSummaryExpanded ? <ChevronUp size={19} /> : <ChevronRight size={19} />}
          </Pressable>
          {isSummaryExpanded ? (
            <View style={styles.summaryBody}>
              {items.map((item) => <PaymentProduct item={item} key={item.id} />)}
              <View style={styles.divider} />
              <SummaryRow label={`Subtotal (${itemQuantity})`} value={formatPhp(subtotalCents)} />
              {deliveryFeeCents ? <SummaryRow label="Shipping Fee" value={formatPhp(deliveryFeeCents)} /> : null}
              <View style={styles.dashedDivider} />
              <SummaryRow isTotal label="Total" value={formatPhp(totalCents)} />
            </View>
          ) : null}
        </View>

        <AmountCard
          label="Amount to Pay"
          status={remainingSeconds > 0 ? `Complete payment within ${timerLabel}` : 'Payment window expired'}
          totalCents={totalCents}
        />

        <View style={styles.methodsCard}>
          <Text style={styles.methodsTitle}>Choose a payment method</Text>
          <Text style={styles.methodsSubtitle}>Select how you’d like to pay for your order.</Text>
          <PaymentOption
            active={method === 'paymongo'}
            label="Pay with PayMongo"
            onPress={() => setMethod(method === 'paymongo' ? null : 'paymongo')}
            right={<Image contentFit="contain" source={paymentLogos.paymongo} style={styles.paymongoLogoImage} />}>
            <View style={styles.recommendedRow}>
              <View style={styles.fastCheckoutRow}>
                <View style={styles.recommended}><Text style={styles.recommendedText}>Recommended</Text></View>
                <Text style={styles.fastCheckout}><Text style={styles.bold}>Fast checkout.</Text> Supports QR Ph, Cards, and E-wallets</Text>
              </View>
              <View style={styles.paymentBrands}>
                <Image contentFit="contain" source={paymentLogos.qrph} style={styles.qrphLogo} />
                <Image contentFit="contain" source={paymentLogos.visa} style={styles.visaLogo} />
                <Image contentFit="contain" source={paymentLogos.mastercard} style={styles.mastercardLogo} />
                <Image contentFit="contain" source={paymentLogos.gcash} style={styles.gcashBrandLogo} />
              </View>
            </View>
          </PaymentOption>
          <PaymentOption
            active={method === 'gcash'}
            disabled
            label="E-Wallet"
            onPress={() => {}}
            right={<Image contentFit="contain" source={paymentLogos.gcash} style={styles.gcashLogoImage} />}>
            <ManualPaymentDetails
              method="gcash"
              onUpload={handleUpload}
              orderIds={[orderId]}
              receiptUri={receiptUri}
              totalCents={totalCents}
            />
          </PaymentOption>
          <PaymentOption
            active={method === 'bank'}
            disabled
            label="Bank Transfer"
            onPress={() => {}}
            right={<Banknote color={method === 'bank' ? theme.colors.primary : '#777777'} size={23} />}>
            <ManualPaymentDetails
              method="bank"
              onUpload={handleUpload}
              orderIds={[orderId]}
              receiptUri={receiptUri}
              totalCents={totalCents}
            />
          </PaymentOption>
          <PrimaryButton
            disabled={isProcessing || paymongoLockRemainingSeconds > 0 || remainingSeconds <= 0 || !method || (method !== 'paymongo' && !receiptUri)}
            label={paymongoLockRemainingSeconds > 0 ? 'Waiting for Payment...' : isProcessing ? 'Opening PayMongo…' : getPaymentButtonLabel(method)}
            onPress={handleContinue}
          />
          <Pressable
            accessibilityHint="Opens the policy in the Help Center"
            accessibilityRole="link"
            onPress={() => router.push('/help-center/ordering' as Href)}
            style={({ pressed }) => [styles.policyLink, pressed && styles.pressed]}>
            <Text style={styles.policyLinkText}>
              By proceeding with payment, you acknowledge and agree to our Ordering &amp; Fulfillment Policy.
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function getPaymentButtonLabel(method: PaymentMethod | null) {
  if (method === 'paymongo') return 'Pay with PayMongo';
  if (method === 'gcash') return 'Pay with E-Wallet';
  if (method === 'bank') return 'Pay via Bank Transfer';
  return 'Select a payment method';
}

function AmountCard({ label, status, totalCents }: { label: string; status: string; totalCents: number }) {
  return (
    <View style={styles.amountCard}>
      <Text style={styles.amountLabel}>{label}</Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.amountValue}>
        {formatPhp(totalCents)}
      </Text>
      <Text style={styles.amountStatus}>{status}</Text>
    </View>
  );
}

function PaymentOption({
  active,
  children,
  disabled = false,
  label,
  onPress,
  right,
}: {
  active: boolean;
  children?: ReactNode;
  disabled?: boolean;
  label: string;
  onPress: () => void;
  right: ReactNode;
}) {
  return (
    <View style={[styles.paymentOption, active && styles.paymentOptionActive, disabled && styles.paymentOptionDisabled]}>
      <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.paymentOptionHeader, pressed && styles.pressed]}>
        <View style={[styles.radio, active && styles.radioActive]}>{active ? <Check color={theme.colors.white} size={16} strokeWidth={3} /> : null}</View>
        <Text style={styles.paymentOptionLabel}>{label}</Text>
        {disabled ? <View style={styles.unavailableTag}><Text style={styles.unavailableTagText}>Unavailable</Text></View> : null}
        <View style={styles.paymentOptionRight}>{right}</View>
      </Pressable>
      {active && children ? <View style={styles.paymentOptionDetails}>{children}</View> : null}
    </View>
  );
}

function ManualPaymentDetails({
  method,
  onUpload,
  orderIds,
  receiptUri,
  totalCents,
}: {
  method: 'bank' | 'gcash';
  onUpload: () => void;
  orderIds: string[];
  receiptUri: string | null;
  totalCents: number;
}) {
  const qrValue = [
    'BLOOMORA_PAYMENT',
    `METHOD=${method.toUpperCase()}`,
    `MERCHANT=Esting's Flower Shop`,
    method === 'gcash' ? 'ACCOUNT=09172346789' : 'ACCOUNT=CONTACT_STORE_FOR_BANK_DETAILS',
    `AMOUNT_PHP=${(totalCents / 100).toFixed(2)}`,
    `ORDER_IDS=${orderIds.join(',')}`,
  ].join('|');

  return (
    <View style={styles.manualDetails}>
      <View style={styles.qrBox}>
        <QRCode
          backgroundColor="#FFFFFF"
          color="#111111"
          quietZone={8}
          size={150}
          value={qrValue}
        />
      </View>
      <View style={styles.manualCopy}>
        <Text style={styles.manualLabel}>Account Name</Text>
        <Text style={styles.manualValue}>Esting’s Flower Shop</Text>
        {method === 'gcash' ? (
          <>
            <Text style={styles.manualLabel}>Account Number</Text>
            <Text style={styles.manualValue}>0917 234 6789</Text>
          </>
        ) : null}
        <Text style={styles.instructionTitle}>Instruction</Text>
        <Text style={styles.instructions}>
          {method === 'gcash'
            ? '1. Send the exact payment amount\n2. Take a screenshot of the successful payment\n3. Upload the screenshot below\n4. Tap “Continue”'
            : '1. Transfer the payment using your banking app\n2. Save the payment receipt\n3. Upload the receipt\n4. Tap “Continue”'}
        </Text>
        <Pressable onPress={onUpload} style={({ pressed }) => [styles.uploadButton, pressed && styles.pressed]}>
          <Upload color="#FFFFFF" size={17} />
          <Text style={styles.uploadButtonText}>{receiptUri ? 'Change Screenshot' : 'Upload Screenshot'}</Text>
        </Pressable>
      </View>
      {receiptUri ? <Image contentFit="cover" source={{ uri: receiptUri }} style={styles.receiptPreview} /> : null}
    </View>
  );
}

function PaymentProduct({ item }: { item: CustomerOrderItem }) {
  return (
    <View style={styles.productRow}>
      {item.imageUrl ? (
        <Image contentFit="cover" source={{ uri: item.imageUrl }} style={styles.productImage} />
      ) : (
        <View style={styles.productFallback}><Flower2 color={theme.colors.primary} size={24} /></View>
      )}
      <View style={styles.productCopy}>
        <Text style={styles.productName}>{item.productName}</Text>
        <Text style={styles.productMeta}>Qty: {item.quantity}</Text>
      </View>
      <Text style={styles.productPrice}>{formatPhp(Math.round(item.totalAmount * 100))}</Text>
    </View>
  );
}

function SummaryRow({ isTotal = false, label, value }: { isTotal?: boolean; label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, isTotal && styles.totalText]}>{label}</Text>
      <Text style={[styles.summaryValue, isTotal && styles.totalText]}>{value}</Text>
    </View>
  );
}

function PrimaryButton({ disabled = false, label, onPress }: { disabled?: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, disabled && styles.buttonDisabled, pressed && !disabled && styles.pressed]}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F5F5F5', flex: 1 },
  loadingState: { alignItems: 'center', flex: 1, gap: 14, justifyContent: 'center', padding: 28 },
  content: { gap: 16, padding: 16 },
  submittedContent: { gap: 18, padding: 16 },
  summaryCard: { backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.md, borderWidth: 1, overflow: 'hidden' },
  summaryHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 58, paddingHorizontal: 14 },
  summaryTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  bagIconWrap: { position: 'relative' },
  itemBadge: { alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: 8, height: 16, justifyContent: 'center', minWidth: 16, position: 'absolute', right: -8, top: -8 },
  itemBadgeText: { color: '#FFFFFF', fontFamily: Fonts.sansBold, fontSize: 9 },
  summaryTitle: { color: theme.colors.text, fontFamily: Fonts.sans, fontSize: 16 },
  summaryBody: { borderTopColor: theme.colors.subtleBorder, borderTopWidth: 1, gap: 14, padding: 16 },
  productRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  productImage: { backgroundColor: '#ECECEC', borderRadius: theme.radius.md, height: 92, width: 80 },
  productFallback: { alignItems: 'center', backgroundColor: '#ECECEC', borderRadius: theme.radius.md, height: 92, justifyContent: 'center', width: 80 },
  productCopy: { flex: 1, gap: 4, paddingTop: 3 },
  productName: { color: '#444444', fontFamily: Fonts.sansMedium, fontSize: 14, lineHeight: 20 },
  productMeta: { color: '#999999', fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  productPrice: { color: '#444444', fontFamily: Fonts.sansMedium, fontSize: 14, paddingTop: 4 },
  divider: { backgroundColor: '#D7D7D7', height: 1 },
  dashedDivider: { borderColor: '#D7D7D7', borderStyle: 'dashed', borderTopWidth: 1, height: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: '#555555', fontFamily: Fonts.sans, fontSize: 14 },
  summaryValue: { color: '#555555', fontFamily: Fonts.sans, fontSize: 14, fontVariant: ['tabular-nums'] },
  totalText: { color: '#444444', fontFamily: Fonts.sansBold },
  amountCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.md, borderWidth: 1, gap: 12, justifyContent: 'center', minHeight: 220, padding: 24 },
  amountLabel: { color: '#AAAAAA', fontFamily: Fonts.sansMedium, fontSize: 16 },
  amountValue: { color: theme.colors.primary, fontFamily: Fonts.sansBold, fontSize: 32, fontVariant: ['tabular-nums'], maxWidth: '100%', textAlign: 'center' },
  amountStatus: { color: '#444444', fontFamily: Fonts.sansMedium, fontSize: 16, textAlign: 'center' },
  voucherSection: { gap: 8 },
  fieldTitle: { color: '#333333', fontFamily: Fonts.sansMedium, fontSize: 15 },
  voucherRow: { flexDirection: 'row', gap: 10 },
  voucherInput: { backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.sm, borderWidth: 1, color: '#444444', flex: 1, fontFamily: Fonts.sans, fontSize: 14, minHeight: 52, paddingHorizontal: 14 },
  applyButton: { alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, justifyContent: 'center', minHeight: 52, paddingHorizontal: 28 },
  applyButtonText: { color: '#FFFFFF', fontFamily: Fonts.sansBold, fontSize: 14 },
  methodsCard: { backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.md, borderWidth: 1, gap: 14, padding: 16 },
  methodsTitle: { color: '#444444', fontFamily: Fonts.sansMedium, fontSize: 22 },
  methodsSubtitle: { color: '#666666', fontFamily: Fonts.sans, fontSize: 13, marginBottom: 2 },
  paymentOption: { borderColor: '#C5C5C5', borderRadius: theme.radius.sm, borderWidth: 1, overflow: 'hidden' },
  paymentOptionActive: { borderColor: theme.colors.primary, borderWidth: 1.5 },
  paymentOptionDisabled: { backgroundColor: '#F2F2F2', opacity: 0.55 },
  paymentOptionHeader: { alignItems: 'center', flexDirection: 'row', gap: 9, minHeight: 54, paddingHorizontal: 11 },
  radio: { alignItems: 'center', borderColor: '#B8B8B8', borderRadius: 14, borderWidth: 1.3, height: 26, justifyContent: 'center', width: 26 },
  radioActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  paymentOptionLabel: { color: '#333333', flexShrink: 1, fontFamily: Fonts.sans, fontSize: 14 },
  paymentOptionRight: { alignItems: 'flex-end', flex: 1, minWidth: 70 },
  unavailableTag: { backgroundColor: '#E2E2E2', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3 },
  unavailableTagText: { color: '#666666', fontFamily: Fonts.sansMedium, fontSize: 9 },
  recommended: { backgroundColor: '#C9F2D0', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  recommendedText: { color: theme.colors.primary, fontFamily: Fonts.sansMedium, fontSize: 10 },
  paymongoLogoImage: { height: 21, width: 92 },
  gcashLogoImage: { height: 21, width: 76 },
  paymentOptionDetails: { padding: 14, paddingTop: 0 },
  recommendedRow: { gap: 8, paddingLeft: 35 },
  fastCheckoutRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  fastCheckout: { color: '#555555', fontFamily: Fonts.sans, fontSize: 11 },
  bold: { fontFamily: Fonts.sansBold },
  paymentBrands: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 9, maxWidth: '100%' },
  qrphLogo: { height: 18, width: 56 },
  visaLogo: { height: 16, width: 43 },
  mastercardLogo: { height: 19, width: 31 },
  gcashBrandLogo: { height: 17, width: 58 },
  manualDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  qrBox: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.sm, borderWidth: 1, height: 176, justifyContent: 'center', width: 176 },
  manualCopy: { flex: 1, gap: 3, minWidth: 150 },
  manualLabel: { color: '#999999', fontFamily: Fonts.sans, fontSize: 11 },
  manualValue: { color: '#444444', fontFamily: Fonts.sansMedium, fontSize: 13, marginBottom: 7 },
  instructionTitle: { color: '#555555', fontFamily: Fonts.sansBold, fontSize: 11, marginTop: 3 },
  instructions: { color: '#666666', fontFamily: Fonts.sans, fontSize: 10, lineHeight: 14 },
  uploadButton: { alignItems: 'center', backgroundColor: '#4A4A4A', borderRadius: theme.radius.sm, flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 8, minHeight: 44, paddingHorizontal: 12 },
  uploadButtonText: { color: '#FFFFFF', fontFamily: Fonts.sansMedium, fontSize: 12 },
  receiptPreview: { borderRadius: theme.radius.sm, height: 110, width: '100%' },
  primaryButton: { alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, justifyContent: 'center', marginTop: 10, minHeight: 56 },
  primaryButtonText: { color: '#FFFFFF', fontFamily: Fonts.sansBold, fontSize: 16 },
  policyLink: { alignItems: 'center', justifyContent: 'center', minHeight: 36, paddingHorizontal: 12 },
  policyLinkText: { color: theme.colors.primary, fontFamily: Fonts.sansMedium, fontSize: 13, textAlign: 'center', textDecorationLine: 'underline' },
  buttonDisabled: { backgroundColor: '#9BCB9F' },
  secondaryButton: { alignItems: 'center', backgroundColor: '#BFECC4', borderRadius: theme.radius.sm, justifyContent: 'center', minHeight: 56, width: '100%' },
  secondaryButtonText: { color: theme.colors.primary, fontFamily: Fonts.sansBold, fontSize: 16 },
  resultCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.md, borderWidth: 1, gap: 14, padding: 28 },
  resultIcon: { alignItems: 'center', backgroundColor: '#C5F0C9', borderRadius: 42, height: 84, justifyContent: 'center', width: 84 },
  resultMutedTitle: { color: '#AAAAAA', fontFamily: Fonts.sansMedium, fontSize: 17 },
  resultBody: { color: '#333333', fontFamily: Fonts.sans, fontSize: 16, lineHeight: 23, marginBottom: 12, textAlign: 'center' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
});
