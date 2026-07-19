import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, theme } from '@/constants/theme';
import { PlannedRouteMap } from '@/components/rider/planned-route-map';
import {
  confirmDispatchPickup,
  getDispatchRoute,
  getMyDeliveryOrders,
  type RiderDelivery,
  type RiderDeliveryOrder,
  type RoutePreview,
} from '@/services/deliveries-api';

export default function DispatchConfirmScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const dispatchId = params.id ?? '';

  const [dispatchOrder, setDispatchOrder] = useState<RiderDeliveryOrder | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routePreview, setRoutePreview] = useState<RoutePreview | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getMyDeliveryOrders(), getDispatchRoute(dispatchId).catch(() => null)])
      .then(([orders, preview]) => {
        if (!isMounted) return;
        const found = orders.find((o) => o.id === dispatchId) ?? null;
        setDispatchOrder(found);
        setRoutePreview(preview);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setDispatchOrder(null);
        setError(err instanceof Error ? err.message : 'Unable to load dispatch.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [dispatchId]);

  const deliveries = useMemo(() => dispatchOrder?.deliveries ?? [], [dispatchOrder]);
  const allChecked = checkedIds.size === deliveries.length && deliveries.length > 0;
  const checkedCount = checkedIds.size;

  const handleToggle = useCallback(
    async (deliveryId: string) => {
      const next = new Set(checkedIds);
      if (next.has(deliveryId)) {
        next.delete(deliveryId);
      } else {
        next.add(deliveryId);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setCheckedIds(next);

      if (next.size === deliveries.length) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    [checkedIds, deliveries.length],
  );

  async function handleStartRoute() {
    if (!allChecked) return;
    if (!dispatchOrder) return;
    setIsStarting(true);
    setError(null);
    try {
      const updated = await confirmDispatchPickup(dispatchOrder.id);
      setDispatchOrder(updated);
      const firstDelivery = updated.deliveries[0];
      if (firstDelivery) {
        router.replace({ pathname: '/delivery/[id]', params: { id: firstDelivery.id, dispatchId: updated.id, stopIndex: '0', stopTotal: String(updated.deliveries.length) } });
      } else {
        router.back();
      }
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Unable to start this dispatch.');
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={() => router.back()}>
          <Feather color={theme.colors.text} name="chevron-left" size={24} />
        </Pressable>
        <View style={styles.topBarCopy}>
          <Text style={styles.topBarEyebrow}>Dispatch route</Text>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {dispatchOrder?.deliveryOrderNumber ?? 'Loading…'}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}>

        {/* Dispatch meta */}
        {dispatchOrder ? (
          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <MetaItem icon="truck" label="Vehicle" value={dispatchOrder.vehiclePlateNumber ?? dispatchOrder.vehicleType ?? 'Not assigned'} />
              <MetaItem icon="home" label="Branch" value={dispatchOrder.branch ?? 'Branch'} />
              <MetaItem icon="package" label="Stops" value={`${dispatchOrder.stopCount || deliveries.length} orders`} />
            </View>
            {dispatchOrder.notes ? (
              <View style={styles.notesRow}>
                <Feather color={theme.colors.primary} name="info" size={14} />
                <Text style={styles.notesText}>{dispatchOrder.notes}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {routePreview ? <PlannedRouteMap preview={routePreview} /> : null}

        {/* Progress indicator */}
        {deliveries.length > 0 ? (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View style={styles.storeRow}>
                <View style={styles.storeIconWrap}>
                  <Feather color={theme.colors.primary} name="home" size={18} />
                </View>
                <View style={styles.storeCopy}>
                  <Text style={styles.storeTitle}>{"Esting's Flowers International"}</Text>
                  <Text style={styles.storeSubtitle}>Confirm you have each item before leaving the store.</Text>
                </View>
              </View>
              <View style={styles.progressPillRow}>
                <View style={[styles.progressPill, allChecked && styles.progressPillDone]}>
                  <Text style={[styles.progressPillText, allChecked && styles.progressPillTextDone]}>
                    {checkedCount} / {deliveries.length} confirmed
                  </Text>
                </View>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: deliveries.length > 0 ? `${(checkedCount / deliveries.length) * 100}%` : '0%' },
                ]}
              />
            </View>
          </View>
        ) : null}

        {/* Loading / error states */}
        {isLoading ? (
          <View style={styles.stateCard}>
            <Feather color={theme.colors.textMuted} name="loader" size={22} />
            <Text style={styles.stateText}>Loading dispatch…</Text>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.stateCard, styles.stateCardError]}>
            <Feather color={theme.colors.danger} name="alert-circle" size={22} />
            <Text style={[styles.stateText, { color: theme.colors.danger }]}>{error}</Text>
          </View>
        ) : null}

        {!isLoading && !error && !dispatchOrder ? (
          <View style={styles.stateCard}>
            <Feather color={theme.colors.textMuted} name="package" size={22} />
            <Text style={styles.stateText}>No dispatch found. Create one from Delivery Admin first.</Text>
          </View>
        ) : null}

        {/* Checklist */}
        {!isLoading && !error && dispatchOrder ? (
          <View style={styles.checklist}>
            {deliveries.map((delivery, index) => (
              <ChecklistRow
                key={delivery.id}
                checked={checkedIds.has(delivery.id)}
                delivery={delivery}
                index={index}
                onToggle={() => void handleToggle(delivery.id)}
              />
            ))}
          </View>
        ) : null}

        {/* All-clear message */}
        {allChecked ? (
          <View style={styles.allClearBanner}>
            <Feather color={theme.colors.primaryDark} name="check-circle" size={18} />
            <Text style={styles.allClearText}>
              All {deliveries.length} items confirmed! {"You're"} ready to start.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky footer */}
      {dispatchOrder ? (
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) + theme.spacing.sm }]}>
        {!allChecked ? (
          <View style={styles.footerHint}>
            <Feather color={theme.colors.textMuted} name="info" size={13} />
            <Text style={styles.footerHintText}>
              Check off each item above to confirm you have them all.
            </Text>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={!allChecked || isStarting}
          style={({ pressed }) => [
            styles.startButton,
            (!allChecked || isStarting) && styles.startButtonDisabled,
            pressed && allChecked && !isStarting && styles.pressed,
          ]}
          onPress={() => void handleStartRoute()}>
          <Feather color={theme.colors.white} name="navigation" size={18} />
          <Text style={styles.startButtonText}>
            {isStarting ? 'Starting route…' : allChecked ? 'Confirm pickup & start route' : `Confirm all ${deliveries.length} items first`}
          </Text>
        </Pressable>
      </View>
      ) : null}
    </View>
  );
}

function MetaItem({ icon, label, value }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Feather color={theme.colors.primary} name={icon} size={15} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function ChecklistRow({
  checked,
  delivery,
  index,
  onToggle,
}: {
  checked: boolean;
  delivery: RiderDelivery;
  index: number;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={({ pressed }) => [
        styles.checkRow,
        checked && styles.checkRowChecked,
        pressed && styles.pressed,
      ]}
      onPress={onToggle}>

      {/* Stop number badge */}
      <View style={[styles.stopBadge, checked && styles.stopBadgeChecked]}>
        {checked ? (
          <Feather color={theme.colors.white} name="check" size={14} />
        ) : (
          <Text style={styles.stopBadgeText}>{index + 1}</Text>
        )}
      </View>

      {/* Product image */}
      <View style={styles.itemImage}>
        {delivery.imageUrl ? (
          <Image contentFit="cover" source={{ uri: delivery.imageUrl }} style={styles.itemImageAsset} />
        ) : (
          <Feather color={checked ? theme.colors.primary : theme.colors.textMuted} name="gift" size={22} />
        )}
      </View>

      {/* Copy */}
      <View style={styles.checkCopy}>
        <Text style={[styles.checkOrderNum, checked && styles.checkOrderNumChecked]}>
          {delivery.orderNumber}
        </Text>
        <Text style={styles.checkRecipient} numberOfLines={1}>{delivery.recipientName}</Text>
        <Text style={styles.checkItem} numberOfLines={1}>{delivery.itemSummary}</Text>
        {delivery.handlingNotes.length > 0 ? (
          <View style={styles.handlingRow}>
            <Feather color={theme.colors.accent} name="alert-triangle" size={11} />
            <Text style={styles.handlingText} numberOfLines={1}>
              {delivery.handlingNotes[0]}
              {delivery.handlingNotes.length > 1 ? ` +${delivery.handlingNotes.length - 1} more` : ''}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Check indicator */}
      <View style={[styles.checkIndicator, checked && styles.checkIndicatorDone]}>
        <Feather
          color={checked ? theme.colors.white : 'rgba(31,42,36,0.22)'}
          name="check"
          size={16}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  allClearBanner: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(48, 141, 54, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  allClearText: {
    color: theme.colors.primaryDark,
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 36,
  },
  checkCopy: {
    flex: 1,
    gap: 2,
  },
  checkIndicator: {
    alignItems: 'center',
    backgroundColor: 'rgba(31,42,36,0.07)',
    borderRadius: theme.radius.pill,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  checkIndicatorDone: {
    backgroundColor: theme.colors.primary,
  },
  checkItem: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  checkOrderNum: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    lineHeight: 15,
    textTransform: 'uppercase',
  },
  checkOrderNumChecked: {
    color: theme.colors.primary,
  },
  checkRecipient: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
  },
  checkRow: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  checkRowChecked: {
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(48, 141, 54, 0.22)',
  },
  checklist: {
    gap: theme.spacing.sm,
  },
  content: {
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  footer: {
    backgroundColor: theme.colors.surface,
    borderTopColor: 'rgba(31, 42, 36, 0.08)',
    borderTopWidth: 1,
    bottom: 0,
    gap: theme.spacing.sm,
    left: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    position: 'absolute',
    right: 0,
  },
  footerHint: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  footerHintText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  handlingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 1,
  },
  handlingText: {
    color: '#8A5A05',
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    lineHeight: 15,
  },
  itemImage: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 14,
    height: 64,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 64,
  },
  itemImageAsset: {
    height: '100%',
    width: '100%',
  },
  metaCard: {
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(48, 141, 54, 0.16)',
    borderRadius: 18,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  metaItem: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    flex: 1,
    gap: 3,
    padding: theme.spacing.sm,
  },
  metaLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 10,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  metaValue: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
  },
  notesRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  notesText: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  progressBarFill: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: '100%',
  },
  progressBarTrack: {
    backgroundColor: 'rgba(48, 141, 54, 0.15)',
    borderRadius: theme.radius.pill,
    height: 6,
    overflow: 'hidden',
  },
  progressHeader: {
    gap: theme.spacing.sm,
  },
  progressPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(31,42,36,0.08)',
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  progressPillDone: {
    backgroundColor: theme.colors.primary,
  },
  progressPillRow: {
    alignItems: 'flex-start',
  },
  progressPillText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  progressPillTextDone: {
    color: theme.colors.white,
  },
  progressSection: {
    gap: theme.spacing.sm,
  },
  screen: {
    backgroundColor: theme.colors.surfaceAlt,
    flex: 1,
  },
  startButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: theme.spacing.lg,
  },
  startButtonDisabled: {
    backgroundColor: '#BBDDC0',
  },
  startButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  stateCardError: {
    backgroundColor: theme.colors.redSoft,
    borderColor: 'rgba(180, 35, 24, 0.16)',
  },
  stateText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  stopBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(31,42,36,0.09)',
    borderRadius: theme.radius.pill,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  stopBadgeChecked: {
    backgroundColor: theme.colors.primary,
  },
  stopBadgeText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    lineHeight: 16,
  },
  storeCopy: {
    flex: 1,
    gap: 2,
  },
  storeIconWrap: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  storeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  storeSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  storeTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderBottomColor: 'rgba(31, 42, 36, 0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  topBarCopy: {
    flex: 1,
    gap: 1,
  },
  topBarEyebrow: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    lineHeight: 15,
    textTransform: 'uppercase',
  },
  topBarTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    lineHeight: 23,
  },
});
