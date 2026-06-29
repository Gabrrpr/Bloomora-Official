import Feather from '@expo/vector-icons/Feather';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { DeliveryStopCard, getDestination } from '@/components/rider/delivery-stop-card';
import { RiderScreen } from '@/components/rider/screen';
import { Fonts, theme } from '@/constants/theme';
import { getMyDeliveries, type RiderDelivery } from '@/services/deliveries-api';

export default function DeliveriesScreen() {
  const [deliveries, setDeliveries] = useState<RiderDelivery[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDeliveries = useCallback(async ({ showInitialLoader = false }: { showInitialLoader?: boolean } = {}) => {
    if (showInitialLoader) {
      setIsLoading(true);
    }

    try {
      const nextDeliveries = await getMyDeliveries();
      setDeliveries(nextDeliveries);
      setError(null);
    } catch (nextError) {
      setDeliveries([]);
      setError(nextError instanceof Error ? nextError.message : 'Unable to load deliveries.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
    let isMounted = true;

      getMyDeliveries()
        .then((nextDeliveries) => {
          if (!isMounted) return;
          setDeliveries(nextDeliveries);
          setError(null);
        })
        .catch((nextError) => {
          if (!isMounted) return;
          setDeliveries([]);
          setError(nextError instanceof Error ? nextError.message : 'Unable to load deliveries.');
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });

    return () => {
      isMounted = false;
    };
    }, []),
  );

  function handleRefresh() {
    setIsRefreshing(true);
    void loadDeliveries();
  }

  const filteredDeliveries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return deliveries;

    return deliveries.filter((delivery) => {
      const haystack = [
        delivery.orderNumber,
        delivery.recipientName,
        delivery.recipientPhone,
        delivery.address,
        getDestination(delivery),
        delivery.itemSummary,
      ].join(' ').toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [deliveries, query]);

  return (
    <RiderScreen
      title="Deliveries"
      refreshControl={<RefreshControl refreshing={isRefreshing} tintColor={theme.colors.primary} onRefresh={handleRefresh} />}>
      <View style={styles.searchBox}>
        <Feather color="#8F8F8F" name="search" size={22} />
        <TextInput
          placeholder="Search deliveries"
          placeholderTextColor="#8F8F8F"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <View style={styles.list}>
        {isLoading ? <Text style={styles.stateText}>Loading assigned deliveries...</Text> : null}
        {error ? <Text selectable style={styles.stateText}>{error}</Text> : null}
        {!isLoading && !error && filteredDeliveries.length === 0 ? <Text style={styles.stateText}>No deliveries found.</Text> : null}
        {filteredDeliveries.map((delivery) => (
          <DeliveryStopCard
            key={delivery.id}
            delivery={delivery}
            variant="listLight"
            onPress={() => router.push({ pathname: '/delivery/[id]', params: { id: delivery.id } })}
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
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#E7E7E7',
    borderRadius: 11,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 47,
    paddingHorizontal: theme.spacing.md,
  },
  searchInput: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 0,
  },
  stateText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
});
