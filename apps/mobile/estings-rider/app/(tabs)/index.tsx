import Feather from '@expo/vector-icons/Feather';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeliveryStopCard } from '@/components/rider/delivery-stop-card';
import { Fonts, theme } from '@/constants/theme';
import { getAuthSession, type AuthUser } from '@/services/auth-session';
import {
  getMyDeliveries,
  getMyDeliveryOrders,
  type RiderDelivery,
  type RiderDeliveryOrder,
  type RiderDeliveryStatus,
} from '@/services/deliveries-api';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [deliveries, setDeliveries] = useState<RiderDelivery[]>([]);
  const [deliveryOrders, setDeliveryOrders] = useState<RiderDeliveryOrder[]>([]);
  const [rider, setRider] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);

  const sortedDeliveries = useMemo(() => sortDeliveries(deliveries), [deliveries]);
  const activeDeliveryOrder = deliveryOrders[0] ?? null;
  const activeDeliveries = useMemo(() => sortedDeliveries.filter((d) => d.status !== 'delivered'), [sortedDeliveries]);
  const assignedDeliveries = useMemo(() => activeDeliveries.filter((d) => d.status === 'assigned'), [activeDeliveries]);
  const selectedDelivery = useMemo(() => {
    const activeRouteStop = activeDeliveries.find((d) => d.status === 'out_for_delivery' || d.status === 'arrived');
    if (activeRouteStop) return activeRouteStop;
    if (selectedDeliveryId) {
      const selected = activeDeliveries.find((d) => d.id === selectedDeliveryId);
      if (selected) return selected;
    }
    return activeDeliveries[0] ?? null;
  }, [activeDeliveries, selectedDeliveryId]);
  const nextStops = useMemo(() => activeDeliveries.filter((d) => d.id !== selectedDelivery?.id), [activeDeliveries, selectedDelivery?.id]);

  const loadDeliveries = useCallback(async ({ showInitialLoader = false }: { showInitialLoader?: boolean } = {}) => {
    if (showInitialLoader) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [nextDeliveryOrders, nextDeliveries, session] = await Promise.all([
        getMyDeliveryOrders().catch(() => [] as RiderDeliveryOrder[]),
        getMyDeliveries(),
        getAuthSession(),
      ]);
      setRider(session?.user ?? null);
      setDeliveries(nextDeliveries);
      setDeliveryOrders(nextDeliveryOrders);
      setSelectedDeliveryId((current) => {
        if (current && nextDeliveries.some((delivery) => delivery.id === current)) return current;
        return nextDeliveries[0]?.id ?? null;
      });
    } catch (nextError) {
      setDeliveries([]);
      setDeliveryOrders([]);
      setSelectedDeliveryId(null);
      setError(nextError instanceof Error ? nextError.message : 'Unable to load deliveries.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDeliveries({ showInitialLoader: true });
  }, [loadDeliveries]);

  useFocusEffect(
    useCallback(() => {
      void loadDeliveries();
    }, [loadDeliveries]),
  );

  function handleRefresh() {
    setIsRefreshing(true);
    void loadDeliveries();
  }

  function openDelivery(delivery: RiderDelivery) {
    setSelectedDeliveryId(delivery.id);
    router.push({
      pathname: '/delivery/[id]',
      params: {
        id: delivery.id,
        stopIndex: String(activeDeliveries.indexOf(delivery)),
        stopTotal: String(activeDeliveries.length),
      },
    });
  }

  async function handleCallRecipient(delivery: RiderDelivery) {
    if (!delivery.recipientPhone) {
      Alert.alert('No phone number', 'This delivery has no recipient phone number.');
      return;
    }
    await Linking.openURL(`tel:${delivery.recipientPhone}`);
  }

  async function handleTextRecipient(delivery: RiderDelivery) {
    if (!delivery.recipientPhone) {
      Alert.alert('No phone number', 'This delivery has no recipient phone number.');
      return;
    }
    await Linking.openURL(`sms:${delivery.recipientPhone}`);
  }

  function handleOpenMap(delivery: RiderDelivery) {
    if (!delivery.address) {
      Alert.alert('No address', 'This delivery has no address.');
      return;
    }

    const encodedAddress = encodeURIComponent(delivery.address);
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
  }

  function handleOpenWaze(delivery: RiderDelivery) {
    if (!delivery.address) {
      Alert.alert('No address', 'This delivery has no address.');
      return;
    }

    const encodedAddress = encodeURIComponent(delivery.address);
    void Linking.openURL(`https://waze.com/ul?q=${encodedAddress}&navigate=yes`);
  }

  function handleOpenMapApp() {
    void Linking.openURL('https://www.google.com/maps');
  }

  function handleOpenWazeApp() {
    void Linking.openURL('https://waze.com/ul');
  }

  async function handleOpenContactsApp() {
    const opened = await Linking.canOpenURL('contacts://')
      .then((canOpen) => (canOpen ? Linking.openURL('contacts://').then(() => true) : false))
      .catch(() => false);

    if (!opened) {
      Alert.alert('Contacts unavailable', 'Open your contacts app from the device home screen.');
    }
  }

  async function handleOpenMessagesApp() {
    await Linking.openURL('sms:');
  }

  async function handleOpenContacts(delivery: RiderDelivery) {
    if (!delivery.recipientPhone) {
      Alert.alert('No phone number', 'This delivery has no recipient phone number.');
      return;
    }

    const opened = await Linking.canOpenURL('contacts://').then((canOpen) => {
      if (!canOpen) return false;
      return Linking.openURL('contacts://').then(() => true);
    }).catch(() => false);

    if (!opened) {
      await Linking.openURL(`tel:${delivery.recipientPhone}`);
    }
  }

  function handleReviewDispatch() {
    if (!activeDeliveryOrder) return;
    router.push({ pathname: '/dispatch/[id]', params: { id: activeDeliveryOrder.id } });
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={isRefreshing} tintColor={theme.colors.primary} onRefresh={handleRefresh} />}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 112 }]}>
      <View style={styles.welcomeBlock}>
        <Text style={styles.welcomeMuted}>Welcome back,</Text>
        <Text style={styles.welcomeName}>{getRiderName(rider)}</Text>
      </View>

      {isLoading ? <StatePanel icon="loader" title="Loading deliveries" text="Checking assigned orders." /> : null}
      {error ? <StatePanel icon="alert-circle" text="Pull down to refresh when your connection is back." title="Could not load deliveries" /> : null}

      {!isLoading && !error && activeDeliveries.length === 0 ? (
        <>
          <StatePanel icon="check-circle" text="Pull down to check for new assignments." title="No active work" />
          <View style={styles.actionRail}>
            <CircleAction icon="map-pin" label="Google Maps" onPress={handleOpenMapApp} />
            <CircleAction icon="navigation" label="Waze" onPress={handleOpenWazeApp} />
            <CircleAction icon="user" label="Contacts" onPress={() => void handleOpenContactsApp()} />
            <CircleAction icon="message-square" label="Messages" onPress={() => void handleOpenMessagesApp()} />
          </View>
        </>
      ) : null}

      {!isLoading && !error && activeDeliveryOrder ? (
        <View style={styles.dispatchStrip}>
          <View>
            <Text style={styles.dispatchLabel}>Pickup batch</Text>
            <Text selectable style={styles.dispatchNumber}>{activeDeliveryOrder.deliveryOrderNumber}</Text>
          </View>
          <Text style={styles.dispatchStops}>{activeDeliveryOrder.stopCount || activeDeliveryOrder.deliveries.length} orders</Text>
        </View>
      ) : null}

      {!isLoading && !error && selectedDelivery ? (
        <>
          <Text style={styles.sectionTitle}>📍 Selected stop</Text>
          <DeliveryStopCard
            delivery={selectedDelivery}
            variant="featuredDark"
            onCall={() => void handleCallRecipient(selectedDelivery)}
            onMessage={() => void handleTextRecipient(selectedDelivery)}
            onPress={() => openDelivery(selectedDelivery)}
          />

          <View style={styles.actionRail}>
            <CircleAction icon="map-pin" label="Google Maps" onPress={() => handleOpenMap(selectedDelivery)} />
            <CircleAction icon="navigation" label="Waze" onPress={() => handleOpenWaze(selectedDelivery)} />
            <CircleAction icon="user" label="Contacts" disabled={!selectedDelivery.recipientPhone} onPress={() => void handleOpenContacts(selectedDelivery)} />
            <CircleAction icon="phone" label="Phone" disabled={!selectedDelivery.recipientPhone} onPress={() => void handleCallRecipient(selectedDelivery)} />
          </View>

          {assignedDeliveries.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.pickupButton, pressed && styles.pressed]}
              onPress={handleReviewDispatch}>
              <Feather color={theme.colors.white} name="package" size={18} />
              <Text style={styles.pickupButtonText}>Review items & start dispatch</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}

      {nextStops.length > 0 ? (
        <View style={styles.nextBlock}>
          <Text style={styles.sectionTitle}>📍 Select your next stop</Text>
          <View style={styles.nextList}>
            {nextStops.map((delivery) => (
              <DeliveryStopCard
                key={delivery.id}
                delivery={delivery}
                variant="compact"
                onPress={() => {
                  setSelectedDeliveryId(delivery.id);
                  openDelivery(delivery);
                }}
              />
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

function CircleAction({
  disabled,
  icon,
  label,
  onPress,
}: {
  disabled?: boolean;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} style={({ pressed }) => [styles.circleAction, disabled && styles.disabledAction, pressed && !disabled && styles.pressed]} onPress={onPress}>
      <View style={styles.circleIcon}>
        <Feather color={theme.colors.primary} name={icon} size={23} />
      </View>
      <Text numberOfLines={1} style={styles.circleLabel}>{label}</Text>
    </Pressable>
  );
}

function StatePanel({
  icon,
  text,
  title,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
  title: string;
}) {
  return (
    <View style={styles.statePanel}>
      <Feather color={theme.colors.primary} name={icon} size={24} />
      <Text style={styles.stateTitle}>{title}</Text>
      <Text selectable style={styles.stateText}>{text}</Text>
    </View>
  );
}

function getRiderName(user: AuthUser | null) {
  const firstName = user?.first_name?.trim();
  if (firstName) return `${firstName} 👋`;
  return 'Rider 👋';
}

function sortDeliveries(deliveries: RiderDelivery[]) {
  return [...deliveries].sort((a, b) => {
    const statusDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
    if (statusDiff !== 0) return statusDiff;
    return getScheduledTime(a) - getScheduledTime(b);
  });
}

function getStatusPriority(status: RiderDeliveryStatus) {
  const priorities: Record<RiderDeliveryStatus, number> = {
    arrived: 0,
    out_for_delivery: 1,
    picked_up: 2,
    assigned: 3,
    issue_reported: 4,
    failed: 5,
    delivered: 6,
  };

  return priorities[status];
}

function getScheduledTime(delivery: RiderDelivery) {
  const time = delivery.scheduledAt ? new Date(delivery.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER;
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

const styles = StyleSheet.create({
  actionRail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  circleAction: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  circleIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  circleLabel: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 9,
    lineHeight: 12,
    maxWidth: 78,
    textAlign: 'center',
  },
  content: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  disabledAction: {
    opacity: 0.4,
  },
  dispatchLabel: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  dispatchNumber: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    lineHeight: 22,
  },
  dispatchStops: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    lineHeight: 18,
  },
  dispatchStrip: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(48, 141, 54, 0.16)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  nextBlock: {
    gap: theme.spacing.md,
  },
  nextList: {
    gap: theme.spacing.sm,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
  pickupButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
  },
  pickupButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    lineHeight: 18,
  },
  retryNotice: {
    alignItems: 'flex-start',
    backgroundColor: theme.colors.redSoft,
    borderRadius: 14,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  retryText: {
    color: theme.colors.danger,
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  screen: {
    backgroundColor: theme.colors.surfaceAlt,
    flex: 1,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    lineHeight: 22,
  },
  statePanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  stateText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  stateTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansMedium,
    fontSize: 17,
    lineHeight: 22,
    textAlign: 'center',
  },
  welcomeBlock: {
    gap: 1,
  },
  welcomeMuted: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 19,
  },
  welcomeName: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 22,
    lineHeight: 28,
  },
});
