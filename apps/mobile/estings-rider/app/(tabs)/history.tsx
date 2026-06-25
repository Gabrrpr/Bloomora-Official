import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DeliveryCard } from '@/components/rider/delivery-card';
import { MetricCard } from '@/components/rider/metric-card';
import { RiderScreen, SectionHeader } from '@/components/rider/screen';
import { Fonts, theme } from '@/constants/theme';
import { getMyDeliveryHistory, type RiderDelivery } from '@/services/deliveries-api';
import { getDeliveryEta } from '@/utils/delivery-format';

export default function HistoryScreen() {
  const [completedDeliveries, setCompletedDeliveries] = useState<RiderDelivery[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getMyDeliveryHistory()
      .then((nextDeliveries) => {
        if (isMounted) {
          setCompletedDeliveries(nextDeliveries);
          setError(null);
        }
      })
      .catch((nextError) => {
        if (isMounted) {
          setError(nextError instanceof Error ? nextError.message : 'Unable to load delivery history.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <RiderScreen subtitle="Completed deliveries and shift totals" title="History">
      <View style={styles.metricsRow}>
        <MetricCard icon="checkmark.seal.fill" label="Completed" value={String(completedDeliveries.length)} />
        <MetricCard icon="clock.fill" label="Avg. handoff" tone="amber" value="6m" />
      </View>

      <View style={styles.summaryPanel}>
        <Text style={styles.summaryTitle}>Today</Text>
        <Text style={styles.summaryText}>All completed orders were handed to verified recipients. No return-to-shop items logged.</Text>
      </View>

      <SectionHeader title="Recent Deliveries" />
      <View style={styles.list}>
        {isLoading ? <Text style={styles.stateText}>Loading completed deliveries...</Text> : null}
        {error ? <Text selectable style={styles.stateText}>{error}</Text> : null}
        {!isLoading && !error && completedDeliveries.length === 0 ? <Text style={styles.stateText}>No completed deliveries yet.</Text> : null}
        {completedDeliveries.map((delivery) => (
          <DeliveryCard
            key={delivery.id}
            address={delivery.address}
            customer={delivery.recipientName}
            eta={getDeliveryEta(delivery)}
            id={delivery.orderNumber}
            items={delivery.itemSummary}
            status="Delivered"
          />
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
  stateText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
});
