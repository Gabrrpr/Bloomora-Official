import * as Linking from 'expo-linking';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  Banknote,
  Check,
  ChevronRight,
  ChevronUp,
  Clock3,
  Flower2,
  ShoppingBag,
  Upload,
} from 'lucide-react-native';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';

import gcashLogo from '../../assets/images/payment/gcash.png';
import mastercardLogo from '../../assets/images/payment/mastercard.png';
import paymongoLogo from '../../assets/images/payment/paymongo.png';
import qrphLogo from '../../assets/images/payment/qrph.png';
import visaLogo from '../../assets/images/payment/visa.png';
import { AppPageHeader } from '@/components/app-page-header';
import { formatPhp, type CartItem } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { getAuthSession } from '@/services/auth-session';
import { getCartItems } from '@/services/cart-storage';
import { createPayMongoCheckout } from '@/services/payments-api';
import { shopApi } from '@/services/shop-api';

type PaymentMethod = 'paymongo' | 'gcash' | 'bank';
type ScreenState = 'selecting' | 'submitted';

const paymentLogos = {
  gcash: gcashLogo,
  mastercard: mastercardLogo,
  paymongo: paymongoLogo,
  qrph: qrphLogo,
  visa: visaLogo,
};

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    deliveryFeeCents?: string;
    ids?: string;
    orderIds?: string;
    totalCents?: string;
  }>();
  const selectedIds = useMemo(
    () => new Set((params.ids ?? '').split(',').map((id) => id.trim()).filter(Boolean)),
    [params.ids],
  );
  const orderIds = useMemo(
    () => (params.orderIds ?? '').split(',').map((id) => id.trim()).filter(Boolean),
    [params.orderIds],
  );
  const totalCents = Number(params.totalCents ?? 0);
  const deliveryFeeCents = Number(params.deliveryFeeCents ?? 0);
  const [items, setItems] = useState<CartItem[]>([]);
  const [method, setMethod] = useState<PaymentMethod | null>('paymongo');
  const [voucher, setVoucher] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [screenState, setScreenState] = useState<ScreenState>('selecting');
  const [remainingSeconds, setRemainingSeconds] = useState(30 * 60);

  useEffect(() => {
    let active = true;
    Promise.all([getCartItems(), shopApi.getCatalog().catch(() => null)]).then(([cartItems, catalog]) => {
      if (!active) return;
      const liveProducts = new Map(catalog?.products.map((product) => [product.id, product]) ?? []);
      const hydrated = cartItems.map((item) => ({
        ...item,
        product: liveProducts.get(item.product.id) ?? item.product,
      }));
      setItems(selectedIds.size ? hydrated.filter((item) => selectedIds.has(item.product.id)) : hydrated);
    });
    return () => {
      active = false;
    };
  }, [selectedIds]);

  useEffect(() => {
    if (screenState !== 'selecting') return;
    const timer = setInterval(() => setRemainingSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => clearInterval(timer);
  }, [screenState]);

  const subtotalCents = Math.max(0, totalCents - deliveryFeeCents);
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
    if (!method || isProcessing) return;
    if (method !== 'paymongo') {
      if (!receiptUri) {
        Alert.alert('Screenshot required', 'Upload your successful payment screenshot before continuing.');
        return;
      }
      setScreenState('submitted');
      return;
    }
    const session = await getAuthSession();
    if (!session || !orderIds.length) {
      Alert.alert('Payment unavailable', 'Your order session is unavailable. Return to checkout and try again.');
      return;
    }
    setIsProcessing(true);
    try {
      const purchasedIds = Array.from(selectedIds).join(',');
      const successHref = `/payment/success?orderIds=${encodeURIComponent(orderIds.join(','))}&ids=${encodeURIComponent(purchasedIds)}` as Href;
      const webOrigin = Platform.OS === 'web' ? globalThis.location.origin : null;
      const nativeSuccessUrl = `${Linking.createURL('/payment/success')}?orderIds=${encodeURIComponent(orderIds.join(','))}&ids=${encodeURIComponent(purchasedIds)}`;
      const nativeCancelUrl = Linking.createURL('/payment/cancel');
      const checkout = await createPayMongoCheckout({
        cancelUrl: webOrigin ? `${webOrigin}/payment/cancel` : nativeCancelUrl,
        orderIds,
        session,
        successUrl: webOrigin
          ? `${webOrigin}${successHref}`
          : nativeSuccessUrl,
      });
      if (Platform.OS === 'web') {
        globalThis.location.href = checkout.checkout_url;
        return;
      }
      const result = await WebBrowser.openAuthSessionAsync(checkout.checkout_url, Linking.createURL('/payment/success'));
      if (result.type === 'success') {
        if (result.url.includes('/payment/expired')) router.replace('/payment/expired');
        else if (result.url.includes('/payment/failed')) router.replace('/payment/failed');
        else if (result.url.includes('/payment/cancel')) router.replace('/payment/cancel');
        else router.replace(successHref);
      }
    } catch (error) {
      Alert.alert('Payment unavailable', error instanceof Error ? error.message : 'Unable to open PayMongo.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (screenState === 'submitted') {
    return (
      <View style={styles.screen}>
        <AppPageHeader title="Payment" />
        <ScrollView contentContainerStyle={[styles.submittedContent, { paddingBottom: insets.bottom + 32 }]}>
          <AmountCard label="Amount to Pay" status="Payment Under Review" totalCents={totalCents} />
          <View style={styles.resultCard}>
            <View style={styles.resultIcon}>
              <Clock3 color={theme.colors.primary} size={38} />
            </View>
            <Text style={styles.resultMutedTitle}>Payment Submitted</Text>
            <Text style={styles.resultBody}>Your payment proof has been received and is waiting for verification.</Text>
            <PrimaryButton label="Track my order" onPress={() => router.replace('/(tabs)/orders')} />
            <SecondaryButton label="Close" onPress={() => router.replace('/(tabs)/cart')} />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppPageHeader title="Payment" />
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

        <AmountCard label="Amount to Pay" status={`Complete payment within ${timerLabel}`} totalCents={totalCents} />

        <View style={styles.voucherSection}>
          <Text style={styles.fieldTitle}>Voucher Code</Text>
          <View style={styles.voucherRow}>
            <TextInput onChangeText={setVoucher} placeholder="Enter voucher code" placeholderTextColor="#AAAAAA" style={styles.voucherInput} value={voucher} />
            <Pressable
              onPress={() => Alert.alert('Voucher', voucher.trim() ? 'This voucher will be validated when voucher support is connected.' : 'Enter a voucher code first.')}
              style={({ pressed }) => [styles.applyButton, pressed && styles.pressed]}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </Pressable>
          </View>
        </View>

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
            label="E-Wallet"
            onPress={() => setMethod(method === 'gcash' ? null : 'gcash')}
            right={<Image contentFit="contain" source={paymentLogos.gcash} style={styles.gcashLogoImage} />}>
            <ManualPaymentDetails
              method="gcash"
              onUpload={handleUpload}
              orderIds={orderIds}
              receiptUri={receiptUri}
              totalCents={totalCents}
            />
          </PaymentOption>
          <PaymentOption active={method === 'bank'} label="Bank Transfer" onPress={() => setMethod(method === 'bank' ? null : 'bank')} right={<Banknote color="#AAAAAA" size={23} />}>
            <ManualPaymentDetails
              method="bank"
              onUpload={handleUpload}
              orderIds={orderIds}
              receiptUri={receiptUri}
              totalCents={totalCents}
            />
          </PaymentOption>
          <PrimaryButton
            disabled={!method || (method !== 'paymongo' && !receiptUri)}
            label={isProcessing ? 'Opening PayMongo…' : method === 'paymongo' ? 'Pay with PayMongo' : 'Continue'}
            onPress={handleContinue}
          />
        </View>
      </ScrollView>
    </View>
  );
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
  label,
  onPress,
  right,
}: {
  active: boolean;
  children?: ReactNode;
  label: string;
  onPress: () => void;
  right: ReactNode;
}) {
  return (
    <View style={[styles.paymentOption, active && styles.paymentOptionActive]}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.paymentOptionHeader, pressed && styles.pressed]}>
        <View style={[styles.radio, active && styles.radioActive]}>{active ? <Check color={theme.colors.white} size={16} strokeWidth={3} /> : null}</View>
        <Text style={styles.paymentOptionLabel}>{label}</Text>
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

function PaymentProduct({ item }: { item: CartItem }) {
  return (
    <View style={styles.productRow}>
      {item.product.imageUrl ? (
        <Image contentFit="cover" source={{ uri: item.product.imageUrl }} style={styles.productImage} />
      ) : (
        <View style={styles.productFallback}><Flower2 color={theme.colors.primary} size={24} /></View>
      )}
      <View style={styles.productCopy}>
        <Text style={styles.productName}>{item.product.name}</Text>
        <Text style={styles.productMeta}>{item.product.categoryName ?? item.product.tag}</Text>
        <Text style={styles.productMeta}>Qty: {item.quantity}</Text>
      </View>
      <Text style={styles.productPrice}>{formatPhp(item.product.priceCents * item.quantity)}</Text>
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
  paymentOptionHeader: { alignItems: 'center', flexDirection: 'row', gap: 9, minHeight: 54, paddingHorizontal: 11 },
  radio: { alignItems: 'center', borderColor: '#B8B8B8', borderRadius: 14, borderWidth: 1.3, height: 26, justifyContent: 'center', width: 26 },
  radioActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  paymentOptionLabel: { color: '#333333', flexShrink: 1, fontFamily: Fonts.sans, fontSize: 14 },
  paymentOptionRight: { alignItems: 'flex-end', flex: 1, minWidth: 70 },
  recommended: { backgroundColor: '#C9F2D0', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  recommendedText: { color: theme.colors.primary, fontFamily: Fonts.sansMedium, fontSize: 10 },
  paymongoLogoImage: { height: 21, width: 92 },
  gcashLogoImage: { height: 21, width: 76 },
  paymentOptionDetails: { padding: 14, paddingTop: 0 },
  recommendedRow: { gap: 8, paddingLeft: 35 },
  fastCheckoutRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  fastCheckout: { color: '#555555', fontFamily: Fonts.sans, fontSize: 11 },
  bold: { fontFamily: Fonts.sansBold },
  paymentBrands: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  qrphLogo: { height: 22, width: 72 },
  visaLogo: { height: 19, width: 58 },
  mastercardLogo: { height: 24, width: 40 },
  gcashBrandLogo: { height: 22, width: 82 },
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
  buttonDisabled: { backgroundColor: '#9BCB9F' },
  secondaryButton: { alignItems: 'center', backgroundColor: '#BFECC4', borderRadius: theme.radius.sm, justifyContent: 'center', minHeight: 56, width: '100%' },
  secondaryButtonText: { color: theme.colors.primary, fontFamily: Fonts.sansBold, fontSize: 16 },
  resultCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.md, borderWidth: 1, gap: 14, padding: 28 },
  resultIcon: { alignItems: 'center', backgroundColor: '#C5F0C9', borderRadius: 42, height: 84, justifyContent: 'center', width: 84 },
  resultMutedTitle: { color: '#AAAAAA', fontFamily: Fonts.sansMedium, fontSize: 17 },
  resultBody: { color: '#333333', fontFamily: Fonts.sans, fontSize: 16, lineHeight: 23, marginBottom: 12, textAlign: 'center' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
});
