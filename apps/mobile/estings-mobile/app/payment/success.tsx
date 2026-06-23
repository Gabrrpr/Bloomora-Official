import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, Clock3, ReceiptText } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, theme } from '@/constants/theme';
import { getAuthSession } from '@/services/auth-session';
import { removeCartItem } from '@/services/cart-storage';
import { notifyCartUpdated } from '@/services/guest-cart';
import { getPayMongoPaymentStatus, type PayMongoPaymentStatusResponse } from '@/services/payments-api';

type ConfirmationState = 'checking' | 'confirmed' | 'pending' | 'unavailable';

export default function PaymentSuccessScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ orderIds?: string }>();
  const orderIds = useMemo(
    () => (params.orderIds ?? '').split(',').map((id) => id.trim()).filter(Boolean),
    [params.orderIds],
  );
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>(orderIds.length > 0 ? 'checking' : 'pending');
  const [statusResult, setStatusResult] = useState<PayMongoPaymentStatusResponse | null>(null);
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

    const statuses = await Promise.all(
      orderIds.map((orderId) =>
        getPayMongoPaymentStatus({
          orderId,
          session,
        }),
      ),
    );
    const firstStatus = statuses[0] ?? null;
    setStatusResult(firstStatus);

    const allPaid = statuses.every((status) => status.payment_status === 'paid' || status.order?.payment_status === 'paid');
    setConfirmationState(allPaid ? 'confirmed' : 'pending');
    if (allPaid) {
      const purchasedIds = statuses.flatMap((status) =>
        status.order?.items?.map((item) => item.product_id).filter((id): id is string => Boolean(id)) ?? [],
      );
      await Promise.all([...new Set(purchasedIds)].map((productId) => removeCartItem(productId)));
      notifyCartUpdated();
    }

    return allPaid;
  }, [orderIds]);

  useEffect(() => {
    let isActive = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;

      try {
        const isPaid = await checkPaymentStatus();
        if (!isActive || isPaid || attempts >= 8) {
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
          {isConfirmed ? 'Thank you for your purchase!' : 'Payment pending confirmation'}
        </Text>
        <Text style={styles.body}>{getStatusMessage(confirmationState)}</Text>
        {statusResult?.order?.order_number ? <Text style={styles.referenceText}>{statusResult.order.order_number}</Text> : null}
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

function getStatusMessage(state: ConfirmationState) {
  if (state === 'confirmed') {
    return 'Payment successful. Your order is confirmed and is now queued for preparation.';
  }

  if (state === 'checking') {
    return "PayMongo returned you to the app. We're checking the database for the paid transaction.";
  }

  if (state === 'unavailable') {
    return 'We could not check the payment status right now. Open your orders or try checking again.';
  }

  return 'PayMongo returned you to the app, but the database has not marked the transaction as paid yet.';
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
    padding: theme.spacing.xxl,
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
  referenceText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    lineHeight: 18,
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
