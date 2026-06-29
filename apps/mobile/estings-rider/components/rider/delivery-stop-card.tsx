import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, theme } from '@/constants/theme';
import type { RiderDelivery, RiderDeliveryStatus } from '@/services/deliveries-api';

type DeliveryStopCardVariant = 'featuredDark' | 'listLight' | 'compact' | 'completed';

export function DeliveryStopCard({
  delivery,
  onCall,
  onMessage,
  onPress,
  variant = 'listLight',
}: {
  delivery: RiderDelivery;
  onCall?: () => void;
  onMessage?: () => void;
  onPress?: () => void;
  variant?: DeliveryStopCardVariant;
}) {
  const dark = variant === 'featuredDark';
  const compact = variant === 'compact' || variant === 'completed';
  const completed = variant === 'completed' || delivery.status === 'delivered';
  const progress = getProgress(delivery.status);
  const destination = getDestination(delivery);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        dark && styles.cardDark,
        compact && styles.cardCompact,
        pressed && onPress && styles.pressed,
      ]}
      onPress={onPress}>
      <View style={styles.headerRow}>
        <StatusTag status={completed ? 'delivered' : delivery.status} dark={dark} />
        <Feather color={dark ? theme.colors.white : theme.colors.textMuted} name="chevron-right" size={compact ? 18 : 20} />
      </View>

      <View style={styles.routeRow}>
        <Text numberOfLines={1} style={[styles.origin, dark && styles.textOnDark]}>
          {"Esting's Flower Int..."}
        </Text>
        <View style={styles.routeArrow}>
          <Feather color={dark ? theme.colors.white : theme.colors.text} name="arrow-right" size={18} />
        </View>
        <Text numberOfLines={1} style={[styles.destination, dark && styles.textOnDark]}>
          {destination}
        </Text>
      </View>

      {!compact ? (
        <View style={[styles.progressTrack, dark && styles.progressTrackDark]}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      ) : null}

      <View style={[styles.metaRow, compact && styles.metaRowCompact]}>
        <Text selectable numberOfLines={1} style={[styles.orderId, dark && styles.mutedOnDark]}>
          Order ID #{delivery.orderNumber}
        </Text>
        <View style={styles.recipientBlock}>
          <Text numberOfLines={1} style={[styles.recipientName, dark && styles.mutedOnDark]}>
            {delivery.recipientName}
          </Text>
          {!compact ? (
            <Text selectable numberOfLines={1} style={[styles.recipientPhone, dark && styles.mutedOnDark]}>
              {delivery.recipientPhone}
            </Text>
          ) : null}
        </View>
      </View>

      {!compact ? (
        <View style={styles.bottomRow}>
          <View style={styles.productRow}>
            <View style={[styles.productBox, dark && styles.productBoxDark]}>
              {delivery.imageUrl ? (
                <Image contentFit="cover" source={{ uri: delivery.imageUrl }} style={styles.productImage} />
              ) : (
                <Text style={styles.productText}>product image</Text>
              )}
            </View>
            {getExtraItemCount(delivery) > 0 ? (
              <View style={[styles.moreBox, dark && styles.productBoxDark]}>
                <Text style={styles.moreText}>+{getExtraItemCount(delivery)}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actionRow}>
            <Pressable accessibilityLabel="Message recipient" accessibilityRole="button" disabled={!onMessage} style={styles.iconButton} onPress={onMessage}>
              <Feather color={dark ? theme.colors.white : theme.colors.text} name="message-square" size={22} />
            </Pressable>
            <Pressable accessibilityLabel="Call recipient" accessibilityRole="button" disabled={!onCall} style={styles.iconButton} onPress={onCall}>
              <Feather color={dark ? theme.colors.white : theme.colors.primary} name="phone" size={23} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

export function StatusTag({ dark = false, status }: { dark?: boolean; status: RiderDeliveryStatus }) {
  const label = getStatusLabel(status);

  return (
    <View style={[styles.statusTag, dark && styles.statusTagDark]}>
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
}

export function getStatusLabel(status: RiderDeliveryStatus) {
  const labels: Record<RiderDeliveryStatus, string> = {
    arrived: 'Arrived',
    assigned: 'Assigned',
    delivered: 'Completed',
    failed: 'Issue',
    issue_reported: 'Issue',
    out_for_delivery: 'Out for Delivery',
    picked_up: 'Picked Up',
  };

  return labels[status];
}

export function getDestination(delivery: RiderDelivery) {
  const address = delivery.address.trim();
  if (!address) return delivery.assignedArea ?? 'Delivery stop';

  const firstSegment = address.split(' - ')[0]?.split(',')[0]?.trim();
  return firstSegment || delivery.assignedArea || 'Delivery stop';
}

function getProgress(status: RiderDeliveryStatus) {
  const progress: Record<RiderDeliveryStatus, number> = {
    arrived: 82,
    assigned: 18,
    delivered: 100,
    failed: 25,
    issue_reported: 25,
    out_for_delivery: 48,
    picked_up: 34,
  };

  return progress[status];
}

function getExtraItemCount(delivery: RiderDelivery) {
  const itemCount = Number(delivery.itemCount ?? deriveItemCount(delivery.itemSummary));
  if (!Number.isFinite(itemCount) || itemCount <= 1) return 0;
  return Math.min(9, itemCount - 1);
}

function deriveItemCount(summary: string) {
  if (!summary.trim()) return 1;
  return summary.split(',').filter((part) => part.trim()).length || 1;
}

const styles = StyleSheet.create({
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  bottomRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.34)',
    borderRadius: 16,
    borderWidth: 1,
    gap: theme.spacing.sm,
    minHeight: 188,
    padding: theme.spacing.md,
  },
  cardCompact: {
    minHeight: 74,
    paddingVertical: 13,
  },
  cardDark: {
    backgroundColor: '#242424',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
  },
  destination: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    lineHeight: 23,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  metaRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  metaRowCompact: {
    alignItems: 'center',
  },
  moreBox: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    borderRadius: 14,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  moreText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    lineHeight: 23,
  },
  mutedOnDark: {
    color: '#A7A7A7',
  },
  orderId: {
    color: theme.colors.textMuted,
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  origin: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    lineHeight: 23,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  productBox: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    borderRadius: 14,
    height: 72,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 72,
  },
  productBoxDark: {
    backgroundColor: theme.colors.surface,
  },
  productImage: {
    height: '100%',
    width: '100%',
  },
  productRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  productText: {
    color: theme.colors.text,
    fontFamily: Fonts.sans,
    fontSize: 8,
    lineHeight: 11,
    textAlign: 'center',
  },
  progressFill: {
    backgroundColor: '#41B650',
    borderRadius: theme.radius.pill,
    height: '100%',
  },
  progressTrack: {
    alignItems: 'flex-start',
    backgroundColor: '#E0E0E0',
    borderColor: 'rgba(31, 42, 36, 0.16)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 12,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 2,
  },
  progressTrackDark: {
    backgroundColor: '#2D2D2D',
    borderColor: '#686868',
  },
  recipientBlock: {
    alignItems: 'flex-end',
    flex: 1,
  },
  recipientName: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'right',
  },
  recipientPhone: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'right',
  },
  routeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  routeArrow: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
  },
  statusTag: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#41B650',
    borderRadius: 8,
    minHeight: 30,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  statusTagDark: {
    minHeight: 36,
    paddingHorizontal: 17,
  },
  statusText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    lineHeight: 15,
  },
  textOnDark: {
    color: theme.colors.white,
  },
});
