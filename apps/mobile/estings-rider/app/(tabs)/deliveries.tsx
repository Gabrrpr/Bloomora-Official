import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DeliveryCard } from '@/components/rider/delivery-card';
import { RiderScreen, SectionHeader } from '@/components/rider/screen';
import { Fonts, theme } from '@/constants/theme';
import { getMyDeliveries, type RiderDelivery } from '@/services/deliveries-api';
import { getDeliveryCardStatus, getDeliveryEta } from '@/utils/delivery-format';

export default function DeliveriesScreen() {
  const [deliveries, setDeliveries] = useState<RiderDelivery[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getMyDeliveries()
      .then((nextDeliveries) => {
        if (isMounted) {
          setDeliveries(nextDeliveries);
          setError(null);
        }
      })
      .catch((nextError) => {
        if (isMounted) {
          setError(nextError instanceof Error ? nextError.message : 'Unable to load deliveries.');
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
    <RiderScreen subtitle="Active route and assigned orders" title="Deliveries">
      <View style={styles.routePanel}>
        <Text style={styles.routeLabel}>Current route</Text>
        <Text style={styles.routeTitle}>{deliveries.length > 0 ? `${deliveries.length} active stop${deliveries.length === 1 ? '' : 's'}` : 'No active route'}</Text>
        <Text style={styles.routeText}>{"Assignments are grouped by Esting's dispatch based on area and availability."}</Text>
      </View>

      <SectionHeader title="Assigned Orders" />
      <View style={styles.list}>
        {isLoading ? <Text style={styles.stateText}>Loading assigned deliveries...</Text> : null}
        {error ? <Text selectable style={styles.stateText}>{error}</Text> : null}
        {!isLoading && !error && deliveries.length === 0 ? <Text style={styles.stateText}>No assigned deliveries right now.</Text> : null}
        {deliveries.map((delivery) => (
          <DeliveryCard
            key={delivery.id}
            address={delivery.address}
            customer={delivery.recipientName}
            eta={getDeliveryEta(delivery)}
            id={delivery.orderNumber}
            items={delivery.itemSummary}
            status={getDeliveryCardStatus(delivery.status)}
            onOpen={() => router.push({ pathname: '/delivery/[id]/index', params: { id: delivery.id } })}
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
  routeLabel: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  routePanel: {
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(46, 139, 52, 0.12)',
    borderRadius: 22,
    borderWidth: 1,
    gap: 5,
    padding: theme.spacing.lg,
  },
  routeText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  routeTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 22,
    lineHeight: 27,
  },
  stateText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
});
