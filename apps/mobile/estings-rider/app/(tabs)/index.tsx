import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeliveryCard } from '@/components/rider/delivery-card';
import { Fonts, theme } from '@/constants/theme';
import { getMyDeliveries, type RiderDelivery } from '@/services/deliveries-api';
import { getDeliveryCardStatus, getDeliveryEta } from '@/utils/delivery-format';

const banner = require('@/assets/images/rider/home-banner.png');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [deliveries, setDeliveries] = useState<RiderDelivery[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentDelivery = deliveries[0];

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
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: insets.bottom + 112,
          paddingTop: 0,
        },
      ]}>
      <View style={styles.hero}>
        <View style={styles.greeting}>
          <Text style={styles.goodMorning}>Good morning,</Text>
          <Text style={styles.riderTitle}>Rider</Text>
        </View>
        <Image contentFit="contain" source={banner} style={styles.banner} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {['All', 'Active', `Assigned(${deliveries.length})`, 'Completed'].map((filter, index) => (
          <View key={filter} style={[styles.filterPill, index === 0 && styles.filterPillActive]}>
            <Text style={[styles.filterText, index === 0 && styles.filterTextActive]}>{filter}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.currentPanel}>
        <View style={styles.currentPill}>
          <Text style={styles.currentPillText}>CURRENT DELIVERY</Text>
        </View>
        {isLoading ? (
          <Text style={styles.stateText}>Loading your assigned deliveries...</Text>
        ) : error ? (
          <Text selectable style={styles.stateText}>{error}</Text>
        ) : currentDelivery ? (
          <DeliveryCard
            address={currentDelivery.address}
            customer={currentDelivery.recipientName}
            eta={getDeliveryEta(currentDelivery)}
            id={currentDelivery.orderNumber}
            items={currentDelivery.itemSummary}
            status={getDeliveryCardStatus(currentDelivery.status)}
            onOpen={() => router.push({ pathname: '/delivery/[id]/index', params: { id: currentDelivery.id } })}
          />
        ) : (
          <Text style={styles.stateText}>No assigned deliveries right now.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  banner: {
    flex: 1,
    height: 180,
  },
  content: {
    gap: theme.spacing.md,
  },
  currentPanel: {
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    gap: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  currentPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  currentPillText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 13,
    letterSpacing: 1,
    lineHeight: 17,
  },
  filterPill: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    justifyContent: 'center',
    minHeight: 38,
    minWidth: 92,
    paddingHorizontal: theme.spacing.md,
  },
  filterPillActive: {
    backgroundColor: '#1F1F1F',
  },
  filterRow: {
    gap: theme.spacing.sm,
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.lg,
  },
  filterText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 18,
  },
  filterTextActive: {
    color: theme.colors.white,
  },
  goodMorning: {
    color: '#4E4E4E',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 21,
    lineHeight: 27,
  },
  greeting: {
    flex: 0.82,
    paddingLeft: theme.spacing.lg,
  },
  hero: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 170,
    paddingHorizontal: theme.spacing.lg,
  },
  riderTitle: {
    color: '#4E4E4E',
    fontFamily: Fonts.sansExtraBold,
    fontSize: 42,
    lineHeight: 48,
  },
  screen: {
    backgroundColor: theme.colors.surfaceAlt,
    flex: 1,
  },
  stateText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
});
