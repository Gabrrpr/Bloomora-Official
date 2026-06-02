import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { DeliveryCard } from '@/components/rider/delivery-card';
import { RiderScreen, SectionHeader } from '@/components/rider/screen';
import { Fonts, theme } from '@/constants/theme';

const activeDeliveries = [
  {
    address: '17 Dahlia Ave., Marikina Heights',
    customer: 'Aileen Cruz',
    eta: 'Pickup ready',
    id: 'ORD-2051',
    items: 'Sunflower wrap',
    status: 'Assigned' as const,
  },
  {
    address: 'Lobby, Greenfield Tower, Mandaluyong',
    customer: 'Joel Ramirez',
    eta: 'ETA 24 min',
    id: 'ORD-2050',
    items: 'Anniversary bouquet',
    status: 'In Transit' as const,
  },
  {
    address: 'Block 8 Lot 3, Fairview, Quezon City',
    customer: 'Nina Reyes',
    eta: 'ETA 41 min',
    id: 'ORD-2049',
    items: 'Orchid basket',
    status: 'Assigned' as const,
  },
];

export default function DeliveriesScreen() {
  return (
    <RiderScreen subtitle="Active route and assigned orders" title="Deliveries">
      <View style={styles.routePanel}>
        <Text style={styles.routeLabel}>Current route</Text>
        <Text style={styles.routeTitle}>Shop to North Metro</Text>
        <Text style={styles.routeText}>{"3 active stops grouped by distance from Esting's Flower Shop."}</Text>
      </View>

      <SectionHeader title="Assigned Orders" />
      <View style={styles.list}>
        {activeDeliveries.map((delivery) => (
          <DeliveryCard
            key={delivery.id}
            {...delivery}
            onOpen={() => router.push({ pathname: '/delivery/[id]/index', params: { id: delivery.id.replace('ORD-', '') } })}
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
});
