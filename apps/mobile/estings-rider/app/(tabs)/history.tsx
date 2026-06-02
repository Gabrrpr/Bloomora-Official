import { StyleSheet, Text, View } from 'react-native';

import { DeliveryCard } from '@/components/rider/delivery-card';
import { MetricCard } from '@/components/rider/metric-card';
import { RiderScreen, SectionHeader } from '@/components/rider/screen';
import { Fonts, theme } from '@/constants/theme';

const completedDeliveries = [
  {
    address: 'Banawe St., Quezon City',
    customer: 'Carlo Lim',
    eta: 'Delivered 2:18 PM',
    id: 'ORD-2046',
    items: 'White lilies',
    status: 'Delivered' as const,
  },
  {
    address: 'Ortigas Center, Pasig',
    customer: 'Denise Yu',
    eta: 'Delivered 12:43 PM',
    id: 'ORD-2044',
    items: 'Pink rose box',
    status: 'Delivered' as const,
  },
];

export default function HistoryScreen() {
  return (
    <RiderScreen subtitle="Completed deliveries and shift totals" title="History">
      <View style={styles.metricsRow}>
        <MetricCard icon="checkmark.seal.fill" label="Completed" value="5" />
        <MetricCard icon="clock.fill" label="Avg. handoff" tone="amber" value="6m" />
      </View>

      <View style={styles.summaryPanel}>
        <Text style={styles.summaryTitle}>Today</Text>
        <Text style={styles.summaryText}>All completed orders were handed to verified recipients. No return-to-shop items logged.</Text>
      </View>

      <SectionHeader title="Recent Deliveries" />
      <View style={styles.list}>
        {completedDeliveries.map((delivery) => (
          <DeliveryCard key={delivery.id} {...delivery} />
        ))}
      </View>
    </RiderScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: theme.spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  summaryPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.07)',
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    padding: theme.spacing.lg,
  },
  summaryText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  summaryTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    lineHeight: 21,
  },
});
