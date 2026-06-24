import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, Clock3, ReceiptText } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatPhp } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { getAuthSession } from '@/services/auth-session';
import { removeCartItem } from '@/services/cart-storage';
import { notifyCartUpdated } from '@/services/guest-cart';
import { confirmPayMongoOrders, type PayMongoConfirmationResult } from '@/services/paymongo-confirmation';

type ConfirmationState = 'checking' | 'confirmed' | 'pending' | 'unavailable';

export default function PaymentSuccessScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ orderIds?: string }>();
  const orderIds = useMemo(
    () => (params.orderIds ?? '').split(',').map((id) => id.trim()).filter(Boolean),
    [params.orderIds],
  );
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>(orderIds.length > 0 ? 'checking' : 'pending');
  const [confirmation, setConfirmation] = useState<PayMongoConfirmationResult | null>(null);
  const isConfirmed = confirmationState === 'confirmed';

  const checkPaymentStatus = useCallback(async () => {
    if (orderIds.length === 0) {
      setConfirmationState('pending');
      return false;
    }

    const session = await getAuthSession();
    if (!session) {
      setConfirmationState('unavailable');
      return false;
    }

    const result = await confirmPayMongoOrders({ orderIds, session });
    setConfirmation(result);
    setConfirmationState(result.allPaid ? 'confirmed' : 'pending');

    if (result.allPaid) {
      await Promise.all(result.purchasedProductIds.map((productId) => removeCartItem(productId)));
      notifyCartUpdated();
    }

    return result.allPaid;
  }, [orderIds]);

  useEffect(() => {
    let isActive = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;

      try {
        const isPaid = await checkPaymentStatus();
        if (!isActive || isPaid || attempts >= 12) {
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
  }, [checkPaymentStatus]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && confirmationState !== 'confirmed') {
        void checkPaymentStatus();
      }
    });
    return () => subscription.remove();
  }, [checkPaymentStatus, confirmationState]);

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.spacing.xxl }]}
      style={styles.screen}>
      <View style={styles.panel}>
        <View style={[styles.iconRing, !isConfirmed && styles.iconRingPending]}>
          {isConfirmed ? (
            <CheckCircle2 color={theme.colors.primary} size={42} strokeWidth={2.1} />
          ) : (
            <Clock3 color={theme.colors.primary} size={42} strokeWidth={2.1} />
          )}
        </View>
        <Text style={styles.title}>
          {isConfirmed ? 'Payment successful' : 'Payment processing'}
        </Text>
        <Text style={styles.body}>{getStatusMessage(confirmationState)}</Text>
        {confirmation ? <ReceiptPanel confirmation={confirmation} /> : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => void checkPaymentStatus()}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
          <Text style={styles.secondaryButtonText}>Check status</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/(tabs)/orders')}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <ReceiptText color={theme.colors.white} size={18} strokeWidth={2.2} />
          <Text style={styles.primaryButtonText}>View orders</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function ReceiptPanel({ confirmation }: { confirmation: PayMongoConfirmationResult }) {
  const receipt = confirmation.receipt;
  const orderNumbers = receipt.orderNumbers.length ? receipt.orderNumbers.join(', ') : confirmation.order?.orderNumber;

  return (
    <View style={styles.receiptPanel}>
      <ReceiptRow label="Order" value={orderNumbers || 'Processing'} />
      <ReceiptRow label="Status" value={toLabel(receipt.paymentStatus)} />
      <ReceiptRow label="Method" value={toLabel(receipt.paymentMethod || 'PayMongo')} />
      <ReceiptRow label="Reference" value={receipt.reference || 'Processing'} />
      <ReceiptRow label="Transaction ID" value={receipt.transactionId || 'Processing'} />
      <ReceiptRow label="Amount" value={formatPhp(Math.round(receipt.amount * 100))} />
      <ReceiptRow label="Paid date" value={formatDate(receipt.paidAt)} />
    </View>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.receiptRow}>
      <Text style={styles.receiptLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.receiptValue}>
        {value}
      </Text>
    </View>
  );
}

function formatDate(value?: string | null) {
  if (!value) return 'Processing';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Processing';
  return date.toLocaleString('en-PH', {
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function toLabel(value: string) {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusMessage(state: ConfirmationState) {
  if (state === 'confirmed') {
    return 'Your order is confirmed and queued for preparation.';
  }

  if (state === 'checking') {
    return "PayMongo returned you to the app. We're checking the paid transaction.";
  }

  if (state === 'unavailable') {
    return 'We could not check the payment status right now. Open your orders or try checking again.';
  }

  return 'The payment provider returned successfully, but the backend is still processing the payment.';
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  panel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.11)',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  iconRing: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 86,
    justifyContent: 'center',
    width: 86,
  },
  iconRingPending: {
    backgroundColor: theme.colors.surfaceAlt,
  },
  title: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
  body: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    minHeight: 48,
    paddingHorizontal: theme.spacing.xl,
    width: '100%',
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
  },
  receiptLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
  },
  receiptPanel: {
    alignSelf: 'stretch',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  receiptRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  receiptValue: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    textAlign: 'right',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: 'rgba(31, 42, 36, 0.11)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: theme.spacing.xl,
    width: '100%',
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
