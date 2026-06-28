import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, theme } from '@/constants/theme';

export type DeliveryStatus = 'Assigned' | 'In Transit' | 'Delivered';

export function DeliveryCard({
  address,
  customer,
  eta,
  id,
  items,
  onOpen,
  status,
}: {
  address: string;
  customer: string;
  eta: string;
  id: string;
  items: string;
  onOpen?: () => void;
  status: DeliveryStatus;
}) {
  const statusStyle = getStatusStyle(status);

  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onOpen}>
      <View style={styles.topRow}>
        <View style={styles.orderId}>
          <IconSymbol color={theme.colors.primaryDark} name="shippingbox.fill" size={18} />
          <Text style={styles.orderIdText}>{id}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusStyle.background }]}>
          <Text style={[styles.statusText, { color: statusStyle.foreground }]}>{status}</Text>
        </View>
      </View>

      <View style={styles.copy}>
        <Text style={styles.customer}>{customer}</Text>
        <Text style={styles.address}>{address}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>{items}</Text>
        <Text style={styles.meta}>{eta}</Text>
      </View>

      <View style={styles.openButton}>
        <Text style={styles.openButtonText}>Open Delivery</Text>
        <IconSymbol color={theme.colors.text} name="chevron.right" size={18} />
      </View>
    </Pressable>
  );
}

function getStatusStyle(status: DeliveryStatus) {
  if (status === 'Delivered') {
    return { background: theme.colors.greenSoft, foreground: theme.colors.primaryDark };
  }

  if (status === 'In Transit') {
    return { background: theme.colors.amberSoft, foreground: '#8A5A05' };
  }

  return { background: theme.colors.riderSoft, foreground: theme.colors.rider };
}

const styles = StyleSheet.create({
  address: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.07)',
    borderRadius: 20,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  copy: {
    gap: 4,
  },
  customer: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    lineHeight: 22,
  },
  meta: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  openButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    minHeight: 44,
  },
  openButtonText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 18,
  },
  orderId: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  orderIdText: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  statusPill: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    lineHeight: 14,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
