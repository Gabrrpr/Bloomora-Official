import { Image } from 'expo-image';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Flower2,
  ShoppingBag,
  Store,
  Truck,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  type ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPageHeader } from '@/components/app-page-header';
import { AppDatePickerModal } from '@/components/app-date-picker-modal';
import { formatPhp, type CartItem } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { ApiError } from '@/services/api-client';
import {
  addressesApi,
  type AccountAddress,
  type AccountAddressPayload,
} from '@/services/addresses-api';
import { clearAuthSession, getAuthSession, type AuthSession } from '@/services/auth-session';
import { getCartItems } from '@/services/cart-storage';
import { createOrdersFromCart } from '@/services/payments-api';
import { shopApi } from '@/services/shop-api';
import {
  getCheckoutSettings,
  validateVoucher,
  type AppliedVoucher,
  type DeliverySettings,
} from '@/services/commerce-api';
import {
  findLocationByName,
  findPhilippineLocationPath,
  getPhilippineBarangays,
  getPhilippineCities,
  getPhilippineProvinces,
  getPhilippineRegions,
  type PhilippineLocationOption,
} from '@/utils/philippine-locations';

type FulfillmentMethod = 'delivery' | 'pickup';
type DeliveryProvider = 'lalamove' | 'standard';
type OrderRecipient = 'myself' | 'someone';
type TimeSlot = {
  enabled: boolean;
  id: string;
  label: string;
};
type CountryCode = {
  code: string;
  flag: string;
  name: string;
};
type CheckoutValidationErrors = {
  address?: string;
  date?: string;
  recipient?: string;
  time?: string;
};
type AddressFormValue = {
  barangay: string;
  city: string;
  formattedAddress: string;
  isDefault: boolean;
  province: string;
  region: string;
  street: string;
};

const lalamoveLogo = require('@/assets/images/payment/lalamove.png');
const estingsDeliveryLogo = require('@/assets/images/payment/estings-delivery.png');

const timeSlots: TimeSlot[] = [
  { enabled: true, id: 'anytime', label: 'Anytime of the day' },
  { enabled: false, id: 'morning', label: '9:00 AM – 12:00 PM' },
  { enabled: false, id: 'afternoon', label: '1:00 PM – 6:00 PM' },
];
const countryCodes: CountryCode[] = [
  { code: '+63', flag: '🇵🇭', name: 'Philippines' },
  { code: '+1', flag: '🇺🇸', name: 'United States / Canada' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+64', flag: '🇳🇿', name: 'New Zealand' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+62', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+66', flag: '🇹🇭', name: 'Thailand' },
  { code: '+84', flag: '🇻🇳', name: 'Vietnam' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+82', flag: '🇰🇷', name: 'South Korea' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+852', flag: '🇭🇰', name: 'Hong Kong' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+971', flag: '🇦🇪', name: 'United Arab Emirates' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+39', flag: '🇮🇹', name: 'Italy' },
  { code: '+34', flag: '🇪🇸', name: 'Spain' },
  { code: '+31', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+41', flag: '🇨🇭', name: 'Switzerland' },
  { code: '+46', flag: '🇸🇪', name: 'Sweden' },
  { code: '+47', flag: '🇳🇴', name: 'Norway' },
  { code: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: '+52', flag: '🇲🇽', name: 'Mexico' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
];

function getCountryForPhone(phone: string | null | undefined) {
  const digits = phone?.replace(/\D/g, '') ?? '';

  return (
    [...countryCodes]
      .sort((first, second) => second.code.length - first.code.length)
      .find((country) => digits.startsWith(country.code.replace(/\D/g, ''))) ?? countryCodes[0]
  );
}

function normalizeLocalPhone(phone: string, countryCode: string) {
  const countryDigits = countryCode.replace(/\D/g, '');
  let digits = phone.replace(/\D/g, '');

  if (digits.startsWith(countryDigits)) {
    digits = digits.slice(countryDigits.length);
  }

  if (countryCode === '+63') {
    digits = digits.replace(/^0+/, '').slice(0, 10);
  }

  return digits;
}

function formatPhoneForDisplay(phone: string, countryCode: string) {
  const digits = normalizeLocalPhone(phone, countryCode);

  if (countryCode === '+63') {
    return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)]
      .filter(Boolean)
      .join(' ');
  }

  return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}

function getSupportedDeliveryArea(address: string) {
  const normalizedAddress = address.toLowerCase();
  if (
    normalizedAddress.includes('metro manila') ||
    normalizedAddress.includes('national capital region') ||
    normalizedAddress.includes(' ncr') ||
    normalizedAddress.includes('manila')
  ) {
    return 'Metro Manila';
  }

  if (
    normalizedAddress.includes('pampanga') ||
    normalizedAddress.includes('angeles') ||
    normalizedAddress.includes('mabalacat') ||
    normalizedAddress.includes('san fernando')
  ) {
    return 'Pampanga';
  }

  return null;
}

function getDeliveryProviderForArea(area: string | null): DeliveryProvider | null {
  if (area === 'Metro Manila') return 'lalamove';
  if (area === 'Pampanga') return 'standard';
  return null;
}

function getDeliveryProvinceLabel(address: string) {
  const normalizedAddress = address.toLowerCase();

  for (const region of getPhilippineRegions()) {
    const province = getPhilippineProvinces(region.code).find((item) =>
      normalizedAddress.includes(item.name.toLowerCase())
    );

    if (province) {
      return province.code === '-NO PROVINCE-' ? 'Metro Manila' : province.name;
    }
  }

  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : 'this province';
}

function toCanonicalPhone(phone: string, countryCode: string) {
  return `${countryCode}${normalizeLocalPhone(phone, countryCode)}`;
}

function splitRecipientName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

function formatAccountAddress(address: AccountAddress) {
  const path = findPhilippineLocationPath(address.province, address.city);
  const province =
    path?.province.code === '-NO PROVINCE-' ? 'Metro Manila' : address.province;

  return [
    address.street,
    address.barangay,
    address.city,
    province,
    path?.region.name,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function createCheckoutAttemptId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    const next = char === 'x' ? value : (value & 0x3) | 0x8;
    return next.toString(16);
  });
}

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const checkoutAttemptIdRef = useRef(createCheckoutAttemptId());
  const params = useLocalSearchParams<{ ids?: string; voucher?: string }>();
  const selectedIds = useMemo(
    () => new Set((params.ids ?? '').split(',').map((id) => id.trim()).filter(Boolean)),
    [params.ids],
  );
  const minimumDate = useMemo(() => startOfDay(new Date()), []);
  const maximumDate = useMemo(() => {
    const date = startOfDay(new Date());
    date.setDate(date.getDate() + 30);
    return date;
  }, []);
  const availableDates = useMemo(
    () =>
      Array.from({ length: 3 }, (_, index) => {
        const date = new Date(minimumDate);
        date.setDate(date.getDate() + index);
        return date;
      }),
    [minimumDate],
  );
  const [items, setItems] = useState<CartItem[]>([]);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>('delivery');
  const [deliveryProvider, setDeliveryProvider] = useState<DeliveryProvider>('standard');
  const [recipientType, setRecipientType] = useState<OrderRecipient>('myself');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [sendAnonymously, setSendAnonymously] = useState(false);
  const [recipientFirstName, setRecipientFirstName] = useState('');
  const [recipientLastName, setRecipientLastName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientCountry, setRecipientCountry] = useState<CountryCode>(countryCodes[0]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [accountAddress, setAccountAddress] = useState<AccountAddress | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<AccountAddress[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
  const [validationErrors, setValidationErrors] = useState<CheckoutValidationErrors>({});
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>({
    delivery_fee: 100,
    minimum_order: 0,
    same_day_cutoff: '14:00',
    timezone: 'Asia/Manila',
  });
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const isTodayUnavailable = useMemo(() => {
    if (fulfillmentMethod !== 'delivery') return false;
    const [hour, minute] = deliverySettings.same_day_cutoff.split(':').map(Number);
    const now = new Date();
    return now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= minute);
  }, [deliverySettings.same_day_cutoff, fulfillmentMethod]);
  const isCustomDateSelected = Boolean(
    selectedDate &&
      !availableDates.some((date) => date.toDateString() === selectedDate.toDateString()),
  );

  const summary = useMemo(() => {
    const subtotalCents = items.reduce((total, item) => total + item.product.priceCents * item.quantity, 0);
    const feeCents = fulfillmentMethod === 'delivery' ? Math.round(deliverySettings.delivery_fee * 100) : 0;
    const discountCents = Math.round((appliedVoucher?.discount ?? 0) * 100);
    return { discountCents, feeCents, subtotalCents, totalCents: Math.max(0, subtotalCents + feeCents - discountCents) };
  }, [appliedVoucher?.discount, deliverySettings.delivery_fee, fulfillmentMethod, items]);
  const addressLines = useMemo(() => {
    const parts = deliveryAddress.split(',').map((part) => part.trim()).filter(Boolean);
    const fullName = [recipientFirstName, recipientLastName].filter(Boolean).join(' ');

    return {
      contact: [
        recipientPhone
          ? `${recipientCountry.code} ${formatPhoneForDisplay(recipientPhone, recipientCountry.code)}`
          : 'Contact number',
        fullName || 'Recipient full name',
      ].join(' • '),
      locality: parts.slice(1).join(', ') || 'Barangay, City, Province, Country (PH)',
      street: parts[0] || 'Street address',
    };
  }, [deliveryAddress, recipientCountry.code, recipientFirstName, recipientLastName, recipientPhone]);
  const deliveryArea = useMemo(
    () => getSupportedDeliveryArea(deliveryAddress),
    [deliveryAddress],
  );
  const activeDeliveryProvider = useMemo(
    () => (fulfillmentMethod === 'delivery' ? getDeliveryProviderForArea(deliveryArea) : null),
    [deliveryArea, fulfillmentMethod],
  );
  const displayedDeliveryProvider = activeDeliveryProvider ?? deliveryProvider;
  const deliveryProvinceLabel = useMemo(
    () => getDeliveryProvinceLabel(deliveryAddress),
    [deliveryAddress],
  );

  useEffect(() => {
    if (!activeDeliveryProvider || activeDeliveryProvider === deliveryProvider) return;
    setDeliveryProvider(activeDeliveryProvider);
  }, [activeDeliveryProvider, deliveryProvider]);

  useEffect(() => {
    let active = true;
    Promise.all([
      getCartItems(),
      getAuthSession(),
      shopApi.getCatalog().catch(() => null),
      getCheckoutSettings().catch(() => null),
    ])
      .then(async ([cartItems, nextSession, catalog, checkoutSettings]) => {
        if (!active) return;
        const liveProducts = new Map(catalog?.products.map((product) => [product.id, product]) ?? []);
        const hydratedItems = cartItems.map((item) => ({
          ...item,
          product: liveProducts.get(item.product.id) ?? item.product,
        }));
        setItems(selectedIds.size ? hydratedItems.filter((item) => selectedIds.has(item.product.id)) : hydratedItems);
        setSession(nextSession);
        if (checkoutSettings?.delivery) setDeliverySettings(checkoutSettings.delivery);
        let savedAddress: AccountAddress | null = null;

        if (nextSession?.accessToken) {
          try {
            const addresses = await addressesApi.list(nextSession.accessToken);
            setSavedAddresses(addresses);
            savedAddress = addresses.find((address) => address.is_default) ?? addresses[0] ?? null;
          } catch {
            savedAddress = null;
          }
        }

        if (!active) return;
        const savedName = savedAddress ? splitRecipientName(savedAddress.recipient_name) : null;
        const savedPhone = savedAddress?.phone ?? nextSession?.user.phone_number ?? '';
        setAccountAddress(savedAddress);
        setRecipientFirstName(savedName?.firstName ?? nextSession?.user.first_name ?? '');
        setRecipientLastName(savedName?.lastName ?? nextSession?.user.last_name ?? '');
        const nextCountry = getCountryForPhone(savedPhone);
        setRecipientCountry(nextCountry);
        setRecipientPhone(normalizeLocalPhone(savedPhone, nextCountry.code));
        setDeliveryAddress(
          savedAddress ? formatAccountAddress(savedAddress) : nextSession?.user.address ?? '',
        );
      })
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [selectedIds]);

  useEffect(() => {
    if (!params.voucher || !session || !items.length) {
      setAppliedVoucher(null);
      return;
    }
    let active = true;
    void validateVoucher({
      code: params.voucher,
      session,
      subtotal: items.reduce((total, item) => total + item.product.priceCents * item.quantity, 0) / 100,
    })
      .then((voucher) => {
        if (active) {
          setAppliedVoucher(voucher);
          setVoucherError(null);
        }
      })
      .catch((error) => {
        if (active) {
          setAppliedVoucher(null);
          setVoucherError(error instanceof Error ? error.message : 'Voucher is no longer valid.');
        }
      });
    return () => {
      active = false;
    };
  }, [items, params.voucher, session]);

  const selectRecipient = (value: OrderRecipient) => {
    setRecipientType(value);
    if (value === 'myself') {
      const savedName = accountAddress ? splitRecipientName(accountAddress.recipient_name) : null;
      const savedPhone = accountAddress?.phone ?? session?.user.phone_number ?? '';
      setRecipientFirstName(savedName?.firstName ?? session?.user.first_name ?? '');
      setRecipientLastName(savedName?.lastName ?? session?.user.last_name ?? '');
      const nextCountry = getCountryForPhone(savedPhone);
      setRecipientCountry(nextCountry);
      setRecipientPhone(normalizeLocalPhone(savedPhone, nextCountry.code));
      setDeliveryAddress(
        accountAddress ? formatAccountAddress(accountAddress) : session?.user.address ?? '',
      );
    } else {
      setRecipientFirstName('');
      setRecipientLastName('');
      setRecipientPhone('');
      setDeliveryAddress('');
    }
    setValidationErrors((current) => ({ ...current, recipient: undefined }));
  };

  const clearValidationError = (key: keyof CheckoutValidationErrors) => {
    setValidationErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleAddressSave = async (value: AddressFormValue) => {
    setDeliveryAddress(value.formattedAddress);
    clearValidationError('address');

    if (recipientType !== 'myself' || !session) {
      return;
    }

    const payload: AccountAddressPayload = {
      barangay: value.barangay,
      city: value.city,
      is_default: value.isDefault || accountAddress?.is_default === true,
      label: accountAddress?.label || 'Home',
      phone: toCanonicalPhone(recipientPhone, recipientCountry.code),
      province: value.province || value.region,
      recipient_name: [recipientFirstName, recipientLastName].filter(Boolean).join(' ').trim(),
      street: value.street,
    };
    const response = accountAddress
      ? await addressesApi.update(accountAddress.id, payload, session.accessToken)
      : await addressesApi.create(payload, session.accessToken);

    setAccountAddress(response.address);
    setSavedAddresses((current) => {
      const next = current.filter((address) => address.id !== response.address.id);
      return [response.address, ...next].sort((first, second) => Number(second.is_default) - Number(first.is_default));
    });
  };

  const selectSavedAddress = (address: AccountAddress) => {
    setAccountAddress(address);
    setDeliveryAddress(formatAccountAddress(address));
    const name = splitRecipientName(address.recipient_name);
    const country = getCountryForPhone(address.phone);
    setRecipientFirstName(name.firstName);
    setRecipientLastName(name.lastName);
    setRecipientCountry(country);
    setRecipientPhone(normalizeLocalPhone(address.phone, country.code));
    clearValidationError('address');
    clearValidationError('recipient');
  };

  const handleContinue = async () => {
    if (isPaying) return;
    if (!session) {
      router.replace('/(auth)/login');
      return;
    }
    if (!items.length) {
      Alert.alert('Cart is empty', 'Return to your cart and select at least one item.');
      return;
    }
    const nextErrors: CheckoutValidationErrors = {};
    if (!selectedDate) nextErrors.date = `Select a ${fulfillmentMethod} date.`;
    if (!selectedTime) nextErrors.time = `Select a ${fulfillmentMethod} time.`;
    if (!recipientFirstName.trim() || !recipientLastName.trim() || !recipientPhone.trim()) {
      nextErrors.recipient = 'Add the recipient’s first name, last name, and phone number.';
    }
    if (fulfillmentMethod === 'delivery') {
      if (!deliveryAddress.trim()) {
        nextErrors.address = 'Add a delivery address.';
      } else if (!getSupportedDeliveryArea(deliveryAddress)) {
        nextErrors.address = 'Delivery is currently available only within Metro Manila and Pampanga.';
      }
    }
    if (Object.keys(nextErrors).length) {
      setValidationErrors(nextErrors);
      scrollRef.current?.scrollTo({ animated: true, y: 0 });
      return;
    }
    setValidationErrors({});
    if (!recipientFirstName.trim() || !recipientLastName.trim() || !recipientPhone.trim()) {
      Alert.alert('Recipient details required', 'Add the recipient’s name and phone number.');
      return;
    }
    if (fulfillmentMethod === 'delivery') {
      if (!deliveryAddress.trim()) {
        Alert.alert('Delivery address required', 'Add the recipient’s delivery address.');
        return;
      }
      if (!getSupportedDeliveryArea(deliveryAddress)) {
        Alert.alert('Outside delivery area', 'Delivery is currently available only within Metro Manila and Pampanga.');
        return;
      }
    }

    if (!selectedDate) {
      Alert.alert(
        fulfillmentMethod === 'delivery' ? 'Delivery date required' : 'Pickup date required',
        'Select a date before continuing.',
      );
      return;
    }
    if (!selectedTime) {
      Alert.alert(
        fulfillmentMethod === 'delivery' ? 'Delivery time required' : 'Pickup time required',
        'Select an available time before continuing.',
      );
      return;
    }

    setIsPaying(true);
    try {
      const selectedSlot = timeSlots.find((slot) => slot.id === selectedTime);
      const checkoutDeliveryProvider =
        fulfillmentMethod === 'delivery'
          ? getDeliveryProviderForArea(getSupportedDeliveryArea(deliveryAddress))
          : null;
      const created = await createOrdersFromCart({
        attemptId: checkoutAttemptIdRef.current,
        deliveryAddress: fulfillmentMethod === 'delivery' ? deliveryAddress.trim() : '',
        deliveryDate: selectedDate.toISOString(),
        deliveryNotes: specialInstructions.trim(),
        deliveryProvider: checkoutDeliveryProvider ?? undefined,
        fulfillmentMethod,
        isAnonymous: sendAnonymously,
        items,
        recipient: {
          firstName: recipientFirstName.trim(),
          lastName: recipientLastName.trim(),
          phoneNumber: toCanonicalPhone(recipientPhone, recipientCountry.code),
        },
        recipientType,
        session,
        timeSlot: selectedSlot?.id ?? 'anytime',
        voucherCode: appliedVoucher?.code,
      });
      const orderId = created.order_ids[0];
      if (!orderId) {
        throw new Error('The backend did not return an order ID.');
      }
      const paymentHref = `/payment?orderId=${encodeURIComponent(orderId)}` as Href;
      router.push(paymentHref);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await clearAuthSession();
        Alert.alert('Sign in again', 'Your session expired.');
        router.replace('/(auth)/login');
      } else {
        Alert.alert('Checkout unavailable', error instanceof Error ? error.message : 'Unable to continue to payment.');
      }
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.mutedText}>Preparing checkout…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppPageHeader title="Checkout" />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 82 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Pressable onPress={() => setIsSummaryExpanded((current) => !current)} style={styles.summaryHeader}>
            <View style={styles.summaryTitleRow}>
              <View style={styles.bagIconWrap}>
                <ShoppingBag color={theme.colors.text} size={22} strokeWidth={2} />
                <View style={styles.itemBadge}>
                  <Text style={styles.itemBadgeText}>{items.length}</Text>
                </View>
              </View>
              <Text style={styles.summaryTopLabel}>Order Summary</Text>
            </View>
            <View style={styles.summaryHeaderRight}>
              {!isSummaryExpanded ? <Text style={styles.collapsedTotal}>{formatPhp(summary.totalCents)}</Text> : null}
              {isSummaryExpanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </View>
          </Pressable>
          {isSummaryExpanded ? (
            <View style={styles.summaryBody}>
              {items.map((item) => <SummaryProduct item={item} key={item.id} />)}
              <View style={styles.divider} />
              <SummaryRow label={`Subtotal (${items.reduce((total, item) => total + item.quantity, 0)})`} value={formatPhp(summary.subtotalCents)} />
              {fulfillmentMethod === 'delivery' ? <SummaryRow label="Shipping Fee" value={formatPhp(summary.feeCents)} /> : null}
              {summary.discountCents > 0 ? <SummaryRow label={`Voucher (${appliedVoucher?.code})`} value={`-${formatPhp(summary.discountCents)}`} /> : null}
              <View style={styles.dashedDivider} />
              <SummaryRow isTotal label="Total" value={formatPhp(summary.totalCents)} />
            </View>
          ) : null}
        </View>

        {Object.values(validationErrors).some(Boolean) ? (
          <View accessibilityRole="alert" style={styles.validationBanner}>
            <Text style={styles.validationTitle}>Complete the required details</Text>
            {Object.values(validationErrors).filter(Boolean).map((message) => (
              <Text key={message} style={styles.validationMessage}>• {message}</Text>
            ))}
          </View>
        ) : null}

        <View style={styles.labelRow}>
          <Text style={styles.fieldLabel}>Fulfillment Method</Text>
          <CircleHelp color={theme.colors.textMuted} size={11} />
        </View>
        <View style={styles.segment}>
          <SegmentOption
            active={fulfillmentMethod === 'delivery'}
            icon={<Truck color={fulfillmentMethod === 'delivery' ? theme.colors.white : theme.colors.textMuted} size={19} />}
            label="Delivery"
            onPress={() => {
              setFulfillmentMethod('delivery');
              setSelectedDate(null);
              setSelectedTime(null);
            }}
          />
          <SegmentOption
            active={fulfillmentMethod === 'pickup'}
            icon={<Store color={fulfillmentMethod === 'pickup' ? theme.colors.white : theme.colors.textMuted} size={19} />}
            label="Pickup"
            onPress={() => {
              setFulfillmentMethod('pickup');
              setSelectedDate(null);
              setSelectedTime(null);
            }}
          />
        </View>

        {fulfillmentMethod === 'delivery' ? (
          <>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Delivery Provider</Text>
              <CircleHelp color={theme.colors.textMuted} size={11} />
            </View>
            {deliveryArea === 'Metro Manila' ? (
              <DeliveryProviderOption
                active={displayedDeliveryProvider === 'lalamove'}
                image={lalamoveLogo}
                label="Lalamove"
                note="For Metro Manila orders"
                onPress={() => setDeliveryProvider('lalamove')}
              />
            ) : deliveryArea === 'Pampanga' ? (
              <DeliveryProviderOption
                active={displayedDeliveryProvider === 'standard'}
                image={estingsDeliveryLogo}
                label="Esting's Standard Delivery"
                note="For Pampanga orders"
                onPress={() => setDeliveryProvider('standard')}
              />
            ) : (
              <View style={styles.providerHintBox}>
                <Text style={styles.helperText}>There are no currently supported delivery providers in {deliveryProvinceLabel}.</Text>
              </View>
            )}
          </>
        ) : null}

        <Section title={fulfillmentMethod === 'delivery' ? 'Delivery Date' : 'Pickup Date'}>
          <View style={styles.dateCards}>
            {availableDates.slice(0, 3).map((date, index) => {
              const disabled = index === 0 && isTodayUnavailable;
              return (
              <Pressable
                disabled={disabled}
                key={date.toISOString()}
                onPress={() =>
                  setSelectedDate((current) => {
                    const next = current?.toDateString() === date.toDateString() ? null : date;
                    if (next) clearValidationError('date');
                    return next;
                  })
                }
                style={({ pressed }) => [
                  styles.dateCard,
                  disabled && styles.disabled,
                  selectedDate && date.toDateString() === selectedDate.toDateString() && styles.dateCardActive,
                  pressed && !disabled && styles.controlPressed,
                ]}>
                <Text style={styles.dateCardDate}>{date.toLocaleDateString('en-PH', { day: 'numeric', month: 'short' })}</Text>
                <Text style={styles.dateCardCaption}>{index === 0 ? 'TODAY' : index === 1 ? 'TOMORROW' : date.toLocaleDateString('en-PH', { weekday: 'short' }).toUpperCase()}</Text>
              </Pressable>
              );
            })}
            <Pressable
              onPress={() => setIsDateModalOpen(true)}
              style={({ pressed }) => [
                styles.dateCard,
                isCustomDateSelected && styles.dateCardActive,
                pressed && styles.controlPressed,
              ]}>
              {isCustomDateSelected && selectedDate ? (
                <>
                  <Text style={styles.dateCardDate}>
                    {selectedDate.toLocaleDateString('en-PH', { day: 'numeric', month: 'short' })}
                  </Text>
                  <Text style={styles.dateCardCaption}>
                    {selectedDate.toLocaleDateString('en-PH', { weekday: 'short' }).toUpperCase()}
                  </Text>
                </>
              ) : (
                <>
                  <CalendarDays color={theme.colors.text} size={17} />
                  <Text style={styles.dateCardCaption}>PICK DATE</Text>
                </>
              )}
            </Pressable>
          </View>
          {validationErrors.date ? <Text style={styles.fieldError}>{validationErrors.date}</Text> : null}
          {isTodayUnavailable ? <Text style={styles.helperText}>Same-day delivery is unavailable after 2:00 PM.</Text> : null}
          {voucherError ? <Text style={styles.fieldError}>{voucherError}</Text> : null}
          {fulfillmentMethod === 'pickup' ? (
            <Text style={styles.helperText}>Orders are prepared during store hours. You’ll receive a notification once your order is ready for pickup on the selected date.</Text>
          ) : null}
        </Section>

        <Section title={fulfillmentMethod === 'delivery' ? 'Delivery Time' : 'Pickup Time'}>
          <View style={styles.timeOptions}>
            {timeSlots.map((slot) => (
              <RadioOption
                active={selectedTime === slot.id}
                disabled={!slot.enabled}
                key={slot.id}
                label={slot.label}
                note={!slot.enabled ? 'Currently unavailable' : undefined}
                onPress={() => slot.enabled && setSelectedTime((current) => {
                  const next = current === slot.id ? null : slot.id;
                  if (next) clearValidationError('time');
                  return next;
                })}
              />
            ))}
          </View>
          {validationErrors.time ? <Text style={styles.fieldError}>{validationErrors.time}</Text> : null}
        </Section>

        <Section title="Who is this order for?">
          <View style={styles.twoColumns}>
            <ChoiceCard active={recipientType === 'myself'} label="Myself" note={fulfillmentMethod === 'delivery' ? 'I will receive this order.' : 'This order is for me.'} onPress={() => selectRecipient('myself')} />
            <ChoiceCard active={recipientType === 'someone'} label="Someone" note={fulfillmentMethod === 'delivery' ? 'I am sending this as a gift.' : 'This order is for another person.'} onPress={() => selectRecipient('someone')} />
          </View>
          {validationErrors.recipient ? <Text style={styles.fieldError}>{validationErrors.recipient}</Text> : null}
        </Section>

        <Section separated title="Sender Information">
          {fulfillmentMethod === 'delivery' ? (
            <>
              <View style={styles.instructionLabelRow}>
                <Text style={styles.inputLabel}>Special Instruction for the rider</Text>
                <Text style={styles.characterCount}>{specialInstructions.length}/400</Text>
              </View>
              <TextInput
                maxLength={400}
                multiline
                onChangeText={setSpecialInstructions}
                placeholder="e.g. Please call the recipient before arriving."
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.input, styles.notesInput]}
                value={specialInstructions}
              />
            </>
          ) : null}
          <Checkbox
            checked={sendAnonymously}
            label="Send anonymously"
            onPress={() => setSendAnonymously((current) => !current)}
          />
        </Section>

        <Section separated title="Recipient Information">
          {fulfillmentMethod === 'delivery' ? (
            <>
              <View style={styles.addressLabelRow}>
                <Text style={styles.inputLabel}>Shipping Address</Text>
                <Pressable onPress={() => router.push('/addresses')} style={styles.changeButton}>
                  <Text style={styles.changeButtonText}>Manage</Text>
                </Pressable>
              </View>
              {savedAddresses.length > 1 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedAddressRow}>
                  {savedAddresses.map((address) => (
                    <Pressable
                      key={address.id}
                      onPress={() => selectSavedAddress(address)}
                      style={[styles.savedAddressChip, accountAddress?.id === address.id && styles.savedAddressChipActive]}>
                      <Text style={[styles.savedAddressChipText, accountAddress?.id === address.id && styles.savedAddressChipTextActive]}>{address.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}
              <View style={styles.addressLabelRow}>
                <Text style={styles.inputLabel}>Selected address</Text>
                <Pressable onPress={() => setIsAddressModalOpen(true)} style={styles.changeButton}>
                  <Text style={styles.changeButtonText}>{deliveryAddress.trim() ? 'Change Address' : '+ Add Address'}</Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => setIsAddressModalOpen(true)}
                style={[
                  styles.addressPreview,
                  deliveryAddress.trim() ? styles.addressPreviewFilled : styles.addressPreviewEmpty,
                ]}>
                {deliveryAddress.trim() ? (
                  <>
                    <Text style={styles.addressPrimary}>{addressLines.street}</Text>
                    <Text style={styles.addressSecondary}>{addressLines.locality}</Text>
                    <Text style={styles.addressSecondary}>{addressLines.contact}</Text>
                  </>
                ) : (
                  <Text style={styles.noAddressText}>No Address Yet</Text>
                )}
              </Pressable>
              {validationErrors.address ? <Text style={styles.fieldError}>{validationErrors.address}</Text> : null}
            </>
          ) : (
            <>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <PhoneNumberField
                country={recipientCountry}
                onCountryChange={setRecipientCountry}
                onPhoneChange={(value) => {
                  setRecipientPhone(value);
                  clearValidationError('recipient');
                }}
                phone={recipientPhone}
              />
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput onChangeText={(value) => { setRecipientFirstName(value); clearValidationError('recipient'); }} placeholder="Juana" placeholderTextColor="#B7B7B7" style={styles.input} value={recipientFirstName} />
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput onChangeText={(value) => { setRecipientLastName(value); clearValidationError('recipient'); }} placeholder="dela Cruz" placeholderTextColor="#B7B7B7" style={styles.input} value={recipientLastName} />
            </>
          )}
        </Section>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
        <Pressable
          disabled={isPaying || !items.length}
          onPress={handleContinue}
          style={({ pressed }) => [styles.continueButton, (isPaying || !items.length) && styles.disabled, pressed && styles.pressed]}>
          <Text style={styles.continueButtonText}>{isPaying ? 'Checking out...' : 'Continue to payment'}</Text>
        </Pressable>
      </View>

      <AppDatePickerModal
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        onClose={() => setIsDateModalOpen(false)}
        onSelect={(date) => {
          setSelectedDate(date);
          clearValidationError('date');
          setIsDateModalOpen(false);
        }}
        selectedDate={selectedDate}
        title={fulfillmentMethod === 'delivery' ? 'Select delivery date' : 'Select pickup date'}
        visible={isDateModalOpen}
      />
      <RecipientModal
        address={deliveryAddress}
        firstName={recipientFirstName}
        fulfillmentMethod={fulfillmentMethod}
        isAccountAddress={recipientType === 'myself'}
        isDefaultAddress={accountAddress?.is_default ?? false}
        lastName={recipientLastName}
        onClose={() => setIsAddressModalOpen(false)}
        onFirstNameChange={setRecipientFirstName}
        onLastNameChange={setRecipientLastName}
        onPhoneChange={setRecipientPhone}
        onSave={handleAddressSave}
        country={recipientCountry}
        onCountryChange={setRecipientCountry}
        phone={recipientPhone}
        visible={isAddressModalOpen}
      />
    </View>
  );
}

function Section({ children, icon, separated = false, title }: { children: ReactNode; icon?: ReactNode; separated?: boolean; title: string }) {
  return (
    <View style={[styles.section, separated && styles.separatedSection]}>
      <View style={styles.sectionHeading}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {separated ? <View style={styles.sectionDivider} /> : null}
      {children}
    </View>
  );
}

function SegmentOption({ active, icon, label, onPress }: { active: boolean; icon: ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.segmentOption, active && styles.segmentOptionActive, pressed && styles.controlPressed]}>
      {icon}
      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function DeliveryProviderOption({
  active,
  icon,
  image,
  label,
  note,
  onPress,
}: {
  active: boolean;
  icon?: ReactNode;
  image?: ImageSourcePropType;
  label: string;
  note: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.providerCard, active && styles.providerCardActive, pressed && styles.controlPressed]}>
      <View style={[styles.providerIconFrame, active && styles.providerIconFrameActive]}>
        {image ? (
          <Image contentFit="contain" source={image} style={styles.providerLogo} />
        ) : icon}
      </View>
      <View style={styles.providerCopy}>
        <Text style={[styles.providerLabel, active && styles.providerLabelActive]}>{label}</Text>
        <Text style={[styles.providerNote, active && styles.providerNoteActive]}>{note}</Text>
      </View>
      {active ? <Check color={theme.colors.white} size={17} strokeWidth={2.7} /> : null}
    </Pressable>
  );
}

function ChoiceCard({ active, label, note, onPress }: { active: boolean; label: string; note: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.choiceCard, active && styles.choiceCardActive, pressed && styles.controlPressed]}>
      <Text style={[styles.choiceLabel, active && styles.choiceLabelActive]}>{label}</Text>
      <Text style={styles.choiceNote}>{note}</Text>
    </Pressable>
  );
}

function RadioOption({ active, disabled, label, note, onPress }: { active: boolean; disabled?: boolean; label: string; note?: string; onPress: () => void }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.radioRow, active && styles.radioRowActive, disabled && styles.disabled, pressed && styles.controlPressed]}>
      <Text style={styles.radioLabel}>{label}</Text>
      {note ? <Text style={styles.timeCaption}>{note}</Text> : null}
    </Pressable>
  );
}

function Checkbox({ checked, label, onPress }: { checked: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.checkboxRow}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>{checked ? <Check color={theme.colors.white} size={14} strokeWidth={3} /> : null}</View>
      <Text style={styles.radioLabel}>{label}</Text>
    </Pressable>
  );
}

function SummaryProduct({ item }: { item: CartItem }) {
  return (
    <View style={styles.summaryProduct}>
      {item.product.imageUrl ? (
        <Image
          cachePolicy="memory-disk"
          contentFit="cover"
          recyclingKey={item.product.id}
          source={{ uri: item.product.imageUrl }}
          style={styles.summaryProductImage}
        />
      ) : (
        <View style={styles.summaryProductFallback}>
          <Flower2 color={theme.colors.primary} size={24} />
        </View>
      )}
      <View style={styles.summaryProductCopy}>
        <Text numberOfLines={2} style={styles.summaryProductName}>{item.product.name}</Text>
        <Text numberOfLines={1} style={styles.summaryProductDetails}>{item.product.categoryName ?? item.product.tag}</Text>
        <Text style={styles.summaryProductQuantity}>Qty: {item.quantity}</Text>
      </View>
      <Text style={styles.summaryProductPrice}>{formatPhp(item.product.priceCents * item.quantity)}</Text>
    </View>
  );
}

function SummaryRow({ isTotal = false, label, value }: { isTotal?: boolean; label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text numberOfLines={2} style={[styles.summaryLabel, isTotal && styles.summaryTotalText]}>{label}</Text>
      <Text style={[styles.summaryValue, isTotal && styles.summaryTotalText]}>{value}</Text>
    </View>
  );
}

function RecipientModal(props: {
  address: string;
  country: CountryCode;
  firstName: string;
  fulfillmentMethod: FulfillmentMethod;
  isAccountAddress: boolean;
  isDefaultAddress: boolean;
  lastName: string;
  onClose: () => void;
  onCountryChange: (country: CountryCode) => void;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onSave: (value: AddressFormValue) => Promise<void>;
  phone: string;
  visible: boolean;
}) {
  const [street, setStreet] = useState('');
  const [barangay, setBarangay] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [region, setRegion] = useState('');
  const [barangayCode, setBarangayCode] = useState('');
  const [cityCode, setCityCode] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [regionCode, setRegionCode] = useState('');
  const [isDefaultAddress, setIsDefaultAddress] = useState(props.isDefaultAddress);
  const [isSaving, setIsSaving] = useState(false);
  const regionOptions = useMemo(() => getPhilippineRegions(), []);
  const provinceOptions = useMemo(() => getPhilippineProvinces(regionCode), [regionCode]);
  const cityOptions = useMemo(
    () => getPhilippineCities(regionCode, provinceCode),
    [provinceCode, regionCode],
  );
  const barangayOptions = useMemo(() => getPhilippineBarangays(cityCode), [cityCode]);

  useEffect(() => {
    if (!props.visible || props.fulfillmentMethod !== 'delivery') return;
    const parts = props.address.split(',').map((part) => part.trim()).filter(Boolean);
    const nextStreet = parts[0] ?? '';
    const nextBarangay = parts[1] ?? '';
    const nextCity = parts[2] ?? '';
    const nextProvince = parts[3] ?? '';
    const nextRegion = parts.slice(4).join(', ');
    const matchedRegion = findLocationByName(regionOptions, nextRegion);
    const nextProvinceOptions = matchedRegion ? getPhilippineProvinces(matchedRegion.code) : [];
    const matchedProvince = findLocationByName(nextProvinceOptions, nextProvince);
    const resolvedProvince =
      matchedProvince ??
      (nextProvinceOptions.length === 1 && nextProvinceOptions[0].code === '-NO PROVINCE-'
        ? nextProvinceOptions[0]
        : undefined);
    const nextCityOptions =
      matchedRegion && resolvedProvince
        ? getPhilippineCities(matchedRegion.code, resolvedProvince.code)
        : [];
    const matchedCity = findLocationByName(nextCityOptions, nextCity);
    const nextBarangayOptions = matchedCity ? getPhilippineBarangays(matchedCity.code) : [];
    const matchedBarangay = findLocationByName(nextBarangayOptions, nextBarangay);

    setStreet(nextStreet);
    setBarangay(matchedBarangay?.name ?? nextBarangay);
    setBarangayCode(matchedBarangay?.code ?? '');
    setCity(matchedCity?.name ?? nextCity);
    setCityCode(matchedCity?.code ?? '');
    setProvince(resolvedProvince?.name ?? nextProvince);
    setProvinceCode(resolvedProvince?.code ?? '');
    setRegion(matchedRegion?.name ?? nextRegion);
    setRegionCode(matchedRegion?.code ?? '');
    setIsDefaultAddress(props.isDefaultAddress);
  }, [props.address, props.fulfillmentMethod, props.isDefaultAddress, props.visible, regionOptions]);

  if (props.fulfillmentMethod === 'delivery') {
    const saveAddress = async () => {
      if (!street.trim() || !regionCode || !provinceCode || !cityCode || !barangayCode) {
        Alert.alert('Complete the address', 'Select a region, province, city or municipality, and barangay.');
        return;
      }

      const provinceName = provinceCode === '-NO PROVINCE-' ? 'Metro Manila' : province;
      const formattedAddress = [street, barangay, city, provinceName, region]
          .map((part) => part.trim())
          .filter(Boolean)
          .join(', ');

      setIsSaving(true);
      try {
        await props.onSave({
          barangay,
          city,
          formattedAddress,
          isDefault: isDefaultAddress,
          province: provinceName,
          region,
          street: street.trim(),
        });
        props.onClose();
      } catch (error) {
        Alert.alert(
          'Address not saved',
          error instanceof Error ? error.message : 'Unable to save the address. Try again.',
        );
      } finally {
        setIsSaving(false);
      }
    };

    const selectRegion = (option: PhilippineLocationOption) => {
      const nextProvinces = getPhilippineProvinces(option.code);

      setRegion(option.name);
      setRegionCode(option.code);
      setProvince(nextProvinces.length === 1 && nextProvinces[0].code === '-NO PROVINCE-' ? nextProvinces[0].name : '');
      setProvinceCode(nextProvinces.length === 1 && nextProvinces[0].code === '-NO PROVINCE-' ? nextProvinces[0].code : '');
      setCity('');
      setCityCode('');
      setBarangay('');
      setBarangayCode('');
    };

    const selectProvince = (option: PhilippineLocationOption) => {
      setProvince(option.name);
      setProvinceCode(option.code);
      setCity('');
      setCityCode('');
      setBarangay('');
      setBarangayCode('');
    };

    const selectCity = (option: PhilippineLocationOption) => {
      setCity(option.name);
      setCityCode(option.code);
      setBarangay('');
      setBarangayCode('');
    };

    return (
      <Modal animationType="slide" onRequestClose={props.onClose} visible={props.visible}>
        <View style={styles.addressScreen}>
          <AppPageHeader
            onBack={props.onClose}
            title={props.address.trim() ? 'Change Shipping Address' : 'Add Shipping Address'}
          />
          <ScrollView
            contentContainerStyle={styles.addressForm}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <AddressField label="Phone Number">
              <PhoneNumberField
                country={props.country}
                onCountryChange={props.onCountryChange}
                onPhoneChange={props.onPhoneChange}
                phone={props.phone}
              />
            </AddressField>
            <AddressField label="First Name">
              <TextInput onChangeText={props.onFirstNameChange} placeholder="Juana" placeholderTextColor="#AAAAAA" style={styles.addressFieldInput} value={props.firstName} />
            </AddressField>
            <AddressField label="Last Name">
              <TextInput onChangeText={props.onLastNameChange} placeholder="dela Cruz" placeholderTextColor="#AAAAAA" style={styles.addressFieldInput} value={props.lastName} />
            </AddressField>
            <View style={styles.addressSectionDivider} />
            <AddressField label="House No. / Building / Street">
              <TextInput onChangeText={setStreet} placeholder="e.g. 123 Sampaguita Street" placeholderTextColor="#AAAAAA" style={styles.addressFieldInput} value={street} />
            </AddressField>
            <AddressField label="Region">
              <LocationSelect
                onSelect={selectRegion}
                options={regionOptions}
                placeholder="Select a region"
                title="Select region"
                value={region}
              />
            </AddressField>
            {regionCode && provinceCode !== '-NO PROVINCE-' ? (
              <AddressField label="Province">
                <LocationSelect
                  onSelect={selectProvince}
                  options={provinceOptions}
                  placeholder="Select a province"
                  title="Select province"
                  value={province}
                />
              </AddressField>
            ) : null}
            {provinceCode ? (
              <AddressField label="City / Municipality">
                <LocationSelect
                  onSelect={selectCity}
                  options={cityOptions}
                  placeholder="Select a city or municipality"
                  title="Select city or municipality"
                  value={city}
                />
              </AddressField>
            ) : null}
            {cityCode ? (
              <AddressField label="Barangay">
                <LocationSelect
                  onSelect={(option) => {
                    setBarangay(option.name);
                    setBarangayCode(option.code);
                  }}
                  options={barangayOptions}
                  placeholder="Select a barangay"
                  title="Select barangay"
                  value={barangay}
                />
              </AddressField>
            ) : null}
            {props.isAccountAddress ? (
              <Checkbox checked={isDefaultAddress} label="Set as default shipping address" onPress={() => setIsDefaultAddress((current) => !current)} />
            ) : null}
          </ScrollView>
          <View style={styles.addressFooter}>
            <Pressable
              disabled={isSaving}
              onPress={saveAddress}
              style={({ pressed }) => [styles.addressSaveButton, isSaving && styles.disabled, pressed && styles.controlPressed]}>
              <Text style={styles.addressSaveButtonText}>
                {isSaving ? 'Saving…' : props.address.trim() ? 'Save Address' : 'Add Address'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal animationType="slide" onRequestClose={props.onClose} transparent visible={props.visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Recipient details</Text>
            <Pressable onPress={props.onClose}><Text style={styles.doneText}>Save</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <View style={styles.twoColumns}>
              <TextInput onChangeText={props.onFirstNameChange} placeholder="First name" placeholderTextColor={theme.colors.textMuted} style={[styles.input, styles.flex]} value={props.firstName} />
              <TextInput onChangeText={props.onLastNameChange} placeholder="Last name" placeholderTextColor={theme.colors.textMuted} style={[styles.input, styles.flex]} value={props.lastName} />
            </View>
            <PhoneNumberField
              country={props.country}
              onCountryChange={props.onCountryChange}
              onPhoneChange={props.onPhoneChange}
              phone={props.phone}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PhoneNumberField({
  country,
  onCountryChange,
  onPhoneChange,
  phone,
}: {
  country: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  onPhoneChange: (value: string) => void;
  phone: string;
}) {
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  return (
    <>
      <View style={styles.phoneField}>
        <Pressable
          accessibilityLabel="Select country code"
          onPress={() => setIsCountryOpen(true)}
          style={({ pressed }) => [styles.countrySelector, pressed && styles.controlPressed]}>
          <Text style={styles.countryFlag}>{country.flag}</Text>
          <Text style={styles.countryCode}>{country.code}</Text>
          <ChevronDown color="#777777" size={15} />
        </Pressable>
        <View style={styles.phoneDivider} />
        <TextInput
          keyboardType="phone-pad"
          maxLength={country.code === '+63' ? 12 : 20}
          onChangeText={(value) => onPhoneChange(normalizeLocalPhone(value, country.code))}
          placeholder="917 123 4567"
          placeholderTextColor="#AAAAAA"
          style={styles.phoneInput}
          value={formatPhoneForDisplay(phone, country.code)}
        />
      </View>
      <Modal animationType="slide" onRequestClose={() => setIsCountryOpen(false)} transparent visible={isCountryOpen}>
        <View style={styles.modalOverlay}>
          <View style={styles.countrySheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select country code</Text>
              <Pressable onPress={() => setIsCountryOpen(false)}>
                <Text style={styles.doneText}>Close</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {countryCodes.map((option) => {
                const selected = option.code === country.code && option.name === country.name;
                return (
                  <Pressable
                    key={`${option.name}-${option.code}`}
                    onPress={() => {
                      onCountryChange(option);
                      setIsCountryOpen(false);
                    }}
                    style={[styles.countryOption, selected && styles.countryOptionSelected]}>
                    <Text style={styles.countryOptionFlag}>{option.flag}</Text>
                    <Text style={styles.countryOptionName}>{option.name}</Text>
                    <Text style={styles.countryOptionCode}>{option.code}</Text>
                    {selected ? <Check color={theme.colors.primary} size={18} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function AddressField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <View style={styles.addressFieldGroup}>
      <Text style={styles.addressFieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function LocationSelect({
  disabled = false,
  onSelect,
  options,
  placeholder,
  title,
  value,
}: {
  disabled?: boolean;
  onSelect: (option: PhilippineLocationOption) => void;
  options: readonly PhilippineLocationOption[];
  placeholder: string;
  title: string;
  value: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(28)).current;
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => option.name.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  const open = () => {
    backdropOpacity.setValue(0);
    sheetTranslateY.setValue(28);
    setIsOpen(true);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          duration: 160,
          toValue: 1,
          useNativeDriver: false,
        }),
        Animated.timing(sheetTranslateY, {
          duration: 220,
          toValue: 0,
          useNativeDriver: false,
        }),
      ]).start();
    });
  };

  const close = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        duration: 140,
        toValue: 0,
        useNativeDriver: false,
      }),
      Animated.timing(sheetTranslateY, {
        duration: 180,
        toValue: 28,
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsOpen(false);
        setQuery('');
      }
    });
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={open}
        style={({ pressed }) => [
          styles.addressSelectField,
          disabled && styles.addressSelectDisabled,
          pressed && !disabled && styles.controlPressed,
        ]}>
        <Text numberOfLines={1} style={[styles.addressSelectText, !value && styles.addressSelectPlaceholder]}>
          {value || placeholder}
        </Text>
        <ChevronDown color="#777777" size={18} />
      </Pressable>
      <Modal animationType="none" onRequestClose={close} transparent visible={isOpen}>
        <View style={styles.locationModalOverlay}>
          <Animated.View pointerEvents="none" style={[styles.locationBackdrop, { opacity: backdropOpacity }]} />
          <Pressable accessibilityLabel="Close location selection" onPress={close} style={StyleSheet.absoluteFill} />
          <Animated.View style={[styles.locationSheet, { transform: [{ translateY: sheetTranslateY }] }]}>
            <View style={styles.locationSheetHeader}>
              <Text style={styles.locationSheetTitle}>{title}</Text>
              <Pressable accessibilityRole="button" onPress={close}>
                <Text style={styles.doneText}>Cancel</Text>
              </Pressable>
            </View>
            <TextInput
              autoCapitalize="words"
              autoCorrect={false}
              onChangeText={setQuery}
              placeholder={`Search ${title.toLowerCase().replace('select ', '')}`}
              placeholderTextColor="#999999"
              style={styles.locationSearchInput}
              value={query}
            />
            <FlatList
              contentContainerStyle={styles.locationList}
              data={filteredOptions}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(option) => option.code}
              ListEmptyComponent={<Text style={styles.locationEmptyText}>No matching location found.</Text>}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    close();
                  }}
                  style={({ pressed }) => [styles.locationOption, pressed && styles.locationOptionPressed]}>
                  <Text style={styles.locationOptionText}>{item.name}</Text>
                  {item.name === value ? <Check color={theme.colors.primary} size={18} /> : null}
                </Pressable>
              )}
            />
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F5F5F5', flex: 1 },
  loadingScreen: { alignItems: 'center', backgroundColor: '#F5F5F5', flex: 1, justifyContent: 'center' },
  content: { gap: 12, paddingHorizontal: 12, paddingTop: 12 },
  validationBanner: { backgroundColor: '#FFF1F0', borderColor: '#E9A29C', borderRadius: theme.radius.sm, borderWidth: 1, gap: 4, padding: 12 },
  validationTitle: { color: theme.colors.danger, fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  validationMessage: { color: '#8A3029', fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  fieldError: { color: theme.colors.danger, fontFamily: Fonts.sansMedium, fontSize: 11, lineHeight: 16 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: theme.spacing.xs, paddingTop: theme.spacing.sm },
  iconButton: { alignItems: 'center', backgroundColor: theme.colors.white, borderRadius: theme.radius.pill, height: 40, justifyContent: 'center', width: 40 },
  pageTitle: { color: theme.colors.text, fontFamily: Fonts.sansSemiBold, fontSize: 20 },
  headerSpacer: { width: 40 },
  labelRow: { alignItems: 'center', flexDirection: 'row', gap: 4, marginBottom: -7 },
  fieldLabel: { color: '#444444', fontFamily: Fonts.sans, fontSize: 13 },
  segment: { flexDirection: 'row', gap: 6 },
  segmentOption: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.sm, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 44 },
  segmentOptionActive: { backgroundColor: '#2E9638', borderColor: '#2E9638' },
  segmentLabel: { color: '#444444', fontFamily: Fonts.sans, fontSize: 14 },
  segmentLabelActive: { color: theme.colors.white },
  providerCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.sm, borderWidth: 1, flexDirection: 'row', gap: 10, minHeight: 62, paddingHorizontal: 12, paddingVertical: 10 },
  providerCardActive: { backgroundColor: '#2E9638', borderColor: '#2E9638' },
  providerIconFrame: { alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: theme.radius.sm, height: 40, justifyContent: 'center', overflow: 'hidden', width: 86 },
  providerIconFrameActive: { backgroundColor: '#FFFFFF' },
  providerLogo: { height: 30, width: 78 },
  providerCopy: { flex: 1 },
  providerLabel: { color: '#444444', fontFamily: Fonts.sansMedium, fontSize: 14 },
  providerLabelActive: { color: theme.colors.white },
  providerNote: { color: '#777777', fontFamily: Fonts.sans, fontSize: 11, marginTop: 2 },
  providerNoteActive: { color: 'rgba(255, 255, 255, 0.82)' },
  providerHintBox: { backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.sm, borderWidth: 1, padding: 12 },
  section: { backgroundColor: 'transparent', gap: 8 },
  separatedSection: { marginTop: 10, paddingBottom: 10 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  sectionDivider: { backgroundColor: '#D7D7D7', height: StyleSheet.hairlineWidth, marginBottom: 8, width: '100%' },
  sectionTitle: { color: '#333333', fontFamily: Fonts.sansMedium, fontSize: 14, lineHeight: 20 },
  dateCards: { flexDirection: 'row', gap: 6 },
  dateCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.sm, borderWidth: 1, flex: 1, minHeight: 72, justifyContent: 'center', gap: 4 },
  dateCardActive: { backgroundColor: theme.colors.greenSoft, borderColor: '#2E9638', borderWidth: 1.5 },
  dateCardDate: { color: '#555555', fontFamily: Fonts.sans, fontSize: 13 },
  dateCardCaption: { color: '#555555', fontFamily: Fonts.sans, fontSize: 10 },
  helperText: { color: '#888888', fontFamily: Fonts.sans, fontSize: 11, lineHeight: 16 },
  selectRow: { alignItems: 'center', backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, flexDirection: 'row', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: theme.spacing.md },
  selectValue: { color: theme.colors.text, fontFamily: Fonts.sansMedium, fontSize: 14 },
  timeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  radioRow: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.sm, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 12, width: '49%' },
  radioRowActive: { backgroundColor: theme.colors.greenSoft, borderColor: theme.colors.primary, borderWidth: 1.5 },
  radio: { alignItems: 'center', borderColor: '#A9B0AB', borderRadius: theme.radius.pill, borderWidth: 1.5, height: 20, justifyContent: 'center', width: 20 },
  radioActive: { borderColor: theme.colors.primary },
  radioDot: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.pill, height: 10, width: 10 },
  radioLabel: { color: '#555555', fontFamily: Fonts.sans, fontSize: 13, textAlign: 'center' },
  timeCaption: { color: '#666666', fontFamily: Fonts.sans, fontSize: 10, textAlign: 'center' },
  disabledNote: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 11, marginTop: 2 },
  twoColumns: { flexDirection: 'row', gap: 6 },
  choiceCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.sm, borderWidth: 1, flex: 1, minHeight: 72, justifyContent: 'center', padding: 8 },
  choiceCardActive: { backgroundColor: theme.colors.greenSoft, borderColor: theme.colors.primary, borderWidth: 1.5 },
  choiceLabel: { color: '#555555', fontFamily: Fonts.sans, fontSize: 13 },
  choiceLabelActive: { color: '#555555' },
  choiceNote: { color: '#666666', fontFamily: Fonts.sans, fontSize: 10, lineHeight: 15, marginTop: 3, textAlign: 'center' },
  input: { backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.sm, borderWidth: 1, color: '#444444', fontFamily: Fonts.sans, fontSize: 14, minHeight: 48, paddingHorizontal: 12, paddingVertical: 10 },
  notesInput: { minHeight: 72, textAlignVertical: 'top' },
  instructionLabelRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  characterCount: { color: '#888888', fontFamily: Fonts.sans, fontSize: 11, fontVariant: ['tabular-nums'] },
  addressInput: { minHeight: 108, textAlignVertical: 'top' },
  checkboxRow: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 48 },
  checkbox: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: 3, borderWidth: 1, height: 28, justifyContent: 'center', width: 28 },
  checkboxChecked: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  recipientSummary: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.md },
  recipientCopy: { flex: 1, gap: 3 },
  recipientName: { color: theme.colors.text, fontFamily: Fonts.sansSemiBold, fontSize: 14 },
  mutedText: { color: '#888888', fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  addressLabelRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  inputLabel: { color: '#888888', fontFamily: Fonts.sans, fontSize: 11 },
  addressPreview: { backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.sm, borderWidth: 1, gap: 5, minHeight: 96, padding: 12 },
  addressPreviewFilled: { backgroundColor: theme.colors.greenSoft, borderColor: theme.colors.primary, borderWidth: 1.5 },
  addressPreviewEmpty: { alignItems: 'center', justifyContent: 'center' },
  addressPrimary: { color: '#444444', fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 18 },
  addressSecondary: { color: '#777777', fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  noAddressText: { color: '#888888', fontFamily: Fonts.sansMedium, fontSize: 13, textAlign: 'center' },
  changeButton: { backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.sm, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  changeButtonText: { color: '#888888', fontFamily: Fonts.sans, fontSize: 11 },
  savedAddressRow: { gap: 8, paddingVertical: 2 },
  savedAddressChip: { backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.pill, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8 },
  savedAddressChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  savedAddressChipText: { color: '#666666', fontFamily: Fonts.sansMedium, fontSize: 11 },
  savedAddressChipTextActive: { color: theme.colors.white },
  summaryCard: { backgroundColor: '#FFFFFF', borderColor: '#D8D8D8', borderRadius: theme.radius.md, borderWidth: 1, overflow: 'hidden' },
  summaryHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 58, paddingHorizontal: 14 },
  summaryTitleRow: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm },
  summaryHeaderRight: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  collapsedTotal: { color: '#444444', fontFamily: Fonts.sansSemiBold, fontSize: 14, fontVariant: ['tabular-nums'] },
  summaryTopLabel: { color: '#333333', fontFamily: Fonts.sans, fontSize: 16 },
  bagIconWrap: { position: 'relative' },
  itemBadge: { alignItems: 'center', backgroundColor: '#2E9638', borderRadius: 8, height: 16, justifyContent: 'center', position: 'absolute', right: -8, top: -8, minWidth: 16, paddingHorizontal: 3 },
  itemBadgeText: { color: '#FFFFFF', fontFamily: Fonts.sansBold, fontSize: 9 },
  summaryBody: { borderTopColor: theme.colors.subtleBorder, borderTopWidth: 1, gap: 14, padding: 16 },
  summaryProduct: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  summaryProductImage: { backgroundColor: '#ECECEC', borderRadius: theme.radius.md, height: 128, width: 112 },
  summaryProductFallback: { alignItems: 'center', backgroundColor: '#ECECEC', borderRadius: theme.radius.md, height: 128, justifyContent: 'center', width: 112 },
  summaryProductCopy: { flex: 1, gap: 4, minWidth: 0, paddingTop: 4 },
  summaryProductName: { color: '#444444', fontFamily: Fonts.sansMedium, fontSize: 14, lineHeight: 20 },
  summaryProductDetails: { color: '#999999', fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  summaryProductQuantity: { color: '#999999', fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  summaryProductPrice: { color: '#444444', fontFamily: Fonts.sansMedium, fontSize: 14, fontVariant: ['tabular-nums'], paddingTop: 5 },
  summaryRow: { alignItems: 'flex-start', flexDirection: 'row', gap: theme.spacing.lg, justifyContent: 'space-between' },
  summaryLabel: { color: '#555555', flex: 1, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 20 },
  summaryValue: { color: '#555555', fontFamily: Fonts.sans, fontSize: 14, fontVariant: ['tabular-nums'] },
  summaryTotalText: { color: '#444444', fontFamily: Fonts.sansBold },
  divider: { backgroundColor: theme.colors.subtleBorder, height: 1, marginVertical: theme.spacing.xs },
  dashedDivider: { borderColor: '#D8D8D8', borderStyle: 'dashed', borderTopWidth: 1, height: 1, marginVertical: 2 },
  bottomBar: { backgroundColor: '#F5F5F5', bottom: 0, left: 0, paddingHorizontal: 12, paddingTop: 8, position: 'absolute', right: 0 },
  bottomLabel: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 11 },
  bottomTotal: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 18, fontVariant: ['tabular-nums'] },
  continueButton: { alignItems: 'center', backgroundColor: '#2E9638', borderRadius: theme.radius.sm, justifyContent: 'center', minHeight: 56, width: '100%' },
  continueButtonText: { color: '#FFFFFF', fontFamily: Fonts.sansMedium, fontSize: 14 },
  modalOverlay: { backgroundColor: 'rgba(18, 24, 20, 0.4)', flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: theme.colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: theme.spacing.md, maxHeight: '80%', padding: theme.spacing.lg },
  sheetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sheetTitle: { color: theme.colors.text, fontFamily: Fonts.sansSemiBold, fontSize: 18 },
  doneText: { color: theme.colors.primary, fontFamily: Fonts.sansSemiBold, fontSize: 14, padding: theme.spacing.sm },
  form: { gap: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  addressScreen: { backgroundColor: '#F5F5F5', flex: 1 },
  addressForm: { gap: 12, padding: 16, paddingBottom: 108 },
  addressFieldGroup: { gap: 6 },
  addressFieldLabel: { color: '#777777', fontFamily: Fonts.sans, fontSize: 11 },
  addressFieldInput: { backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.sm, borderWidth: 1, color: '#444444', fontFamily: Fonts.sans, fontSize: 14, minHeight: 48, paddingHorizontal: 12 },
  addressSectionDivider: { backgroundColor: '#D7D7D7', height: StyleSheet.hairlineWidth, marginVertical: 4, width: '100%' },
  phoneField: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.sm, borderWidth: 1, flexDirection: 'row', minHeight: 48, paddingHorizontal: 12 },
  countrySelector: { alignItems: 'center', flexDirection: 'row', gap: 5, minHeight: 46 },
  countryFlag: { fontSize: 18 },
  countryCode: { color: '#555555', fontFamily: Fonts.sansMedium, fontSize: 13, marginLeft: 6 },
  phoneDivider: { backgroundColor: '#D7D7D7', height: 22, marginHorizontal: 10, width: StyleSheet.hairlineWidth },
  phoneInput: { color: '#444444', flex: 1, fontFamily: Fonts.sans, fontSize: 14, minHeight: 46, paddingVertical: 0 },
  countrySheet: { backgroundColor: theme.colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: theme.spacing.md, maxHeight: '75%', padding: theme.spacing.lg },
  countryOption: { alignItems: 'center', borderBottomColor: theme.colors.subtleBorder, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, minHeight: 52, paddingHorizontal: 4 },
  countryOptionSelected: { backgroundColor: theme.colors.greenSoft },
  countryOptionFlag: { fontSize: 20 },
  countryOptionName: { color: theme.colors.text, flex: 1, fontFamily: Fonts.sans, fontSize: 14 },
  countryOptionCode: { color: theme.colors.textMuted, fontFamily: Fonts.sansMedium, fontSize: 13 },
  addressSelectField: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.sm, borderWidth: 1, flexDirection: 'row', minHeight: 48, paddingRight: 12 },
  addressSelectDisabled: { backgroundColor: '#EEEEEE', opacity: 0.62 },
  addressSelectText: { color: '#444444', flex: 1, fontFamily: Fonts.sans, fontSize: 14, paddingHorizontal: 12 },
  addressSelectPlaceholder: { color: '#AAAAAA' },
  locationModalOverlay: { flex: 1, justifyContent: 'flex-end' },
  locationBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.38)' },
  locationSheet: { backgroundColor: theme.colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '82%', minHeight: '55%', paddingBottom: 16 },
  locationSheetHeader: { alignItems: 'center', borderBottomColor: theme.colors.subtleBorder, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 58, paddingHorizontal: 18 },
  locationSheetTitle: { color: theme.colors.text, fontFamily: Fonts.sansSemiBold, fontSize: 16 },
  locationSearchInput: { backgroundColor: '#F3F4F3', borderRadius: theme.radius.sm, color: theme.colors.text, fontFamily: Fonts.sans, fontSize: 14, marginHorizontal: 16, marginVertical: 12, minHeight: 46, paddingHorizontal: 14 },
  locationList: { paddingBottom: 16, paddingHorizontal: 16 },
  locationOption: { alignItems: 'center', borderBottomColor: theme.colors.subtleBorder, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 52, paddingHorizontal: 4 },
  locationOptionPressed: { backgroundColor: theme.colors.greenSoft },
  locationOptionText: { color: theme.colors.text, flex: 1, fontFamily: Fonts.sans, fontSize: 14, paddingRight: 12 },
  locationEmptyText: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 14, paddingVertical: 28, textAlign: 'center' },
  addressFooter: { backgroundColor: '#F5F5F5', bottom: 0, left: 0, padding: 16, position: 'absolute', right: 0 },
  addressSaveButton: { alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, justifyContent: 'center', minHeight: 56 },
  addressSaveButtonText: { color: theme.colors.white, fontFamily: Fonts.sansMedium, fontSize: 14 },
  flex: { flex: 1 },
  disabled: { opacity: 0.45 },
  controlPressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
