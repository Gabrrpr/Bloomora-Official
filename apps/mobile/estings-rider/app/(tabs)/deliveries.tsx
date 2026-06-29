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
        {!isLoading && !error && filteredDeliveries.length === 0 ? (
          <EmptyState
            icon="package"
            title={query.trim() ? 'No deliveries found' : 'No active work'}
            text={query.trim() ? 'Try a different order, recipient, or address.' : 'Assigned deliveries will appear here when dispatch sends new work.'}
          />
        ) : null}
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

function EmptyState({
  icon,
  text,
  title,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
  title: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Feather color={theme.colors.primary} name={icon} size={26} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  emptyTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    lineHeight: 22,
    textAlign: 'center',
  },
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
