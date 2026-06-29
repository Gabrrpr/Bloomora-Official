import Feather from '@expo/vector-icons/Feather';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { DeliveryStopCard, getDestination } from '@/components/rider/delivery-stop-card';
import { RiderScreen } from '@/components/rider/screen';
import { Fonts, theme } from '@/constants/theme';
import { getMyDeliveryHistory, type RiderDelivery } from '@/services/deliveries-api';

type HistoryGroup = 'Today' | 'Yesterday' | 'Past';

export default function HistoryScreen() {
  const [completedDeliveries, setCompletedDeliveries] = useState<RiderDelivery[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadHistory = useCallback(async ({ showInitialLoader = false }: { showInitialLoader?: boolean } = {}) => {
    if (showInitialLoader) {
      setIsLoading(true);
    }

    try {
      const nextDeliveries = await getMyDeliveryHistory();
      setCompletedDeliveries(nextDeliveries);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load delivery history.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
    let isMounted = true;

      getMyDeliveryHistory()
        .then((nextDeliveries) => {
          if (!isMounted) return;
          setCompletedDeliveries(nextDeliveries);
          setError(null);
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
    }, []),
  );

  function handleRefresh() {
    setIsRefreshing(true);
    void loadHistory();
  }

  const groups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filteredDeliveries = completedDeliveries.filter((delivery) => {
      if (!normalizedQuery) return true;
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

    return groupHistory(filteredDeliveries);
  }, [completedDeliveries, query]);

  return (
    <RiderScreen
      title="History"
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

      {isLoading ? <Text style={styles.stateText}>Loading completed deliveries...</Text> : null}
      {error ? <Text selectable style={styles.stateText}>{error}</Text> : null}
      {!isLoading && !error && completedDeliveries.length === 0 ? (
        <EmptyState icon="clock" title="No completed deliveries yet" text="Completed and failed deliveries will appear here with their update times." />
      ) : null}

      {!isLoading && !error ? (
        <View style={styles.groups}>
          {(['Today', 'Yesterday', 'Past'] as HistoryGroup[]).map((group) => (
            <View key={group} style={styles.group}>
              <Text style={styles.groupTitle}>{group}</Text>
              {groups[group].length > 0 ? (
                <View style={styles.list}>
                  {groups[group].map((delivery) => (
                    <DeliveryStopCard
                      key={delivery.id}
                      delivery={delivery}
                      variant="completed"
                      onPress={() => router.push({ pathname: '/delivery/[id]', params: { id: delivery.id } })}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
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

function groupHistory(deliveries: RiderDelivery[]) {
  const groups: Record<HistoryGroup, RiderDelivery[]> = {
    Past: [],
    Today: [],
    Yesterday: [],
  };
  const now = new Date();

  deliveries.forEach((delivery) => {
    const deliveredAt = delivery.deliveredAt ? new Date(delivery.deliveredAt) : null;
    if (!deliveredAt || Number.isNaN(deliveredAt.getTime())) {
      groups.Past.push(delivery);
      return;
    }

    const diffDays = getDayDiff(now, deliveredAt);
    if (diffDays === 0) {
      groups.Today.push(delivery);
    } else if (diffDays === 1) {
      groups.Yesterday.push(delivery);
    } else {
      groups.Past.push(delivery);
    }
  });

  return groups;
}

function getDayDiff(now: Date, then: Date) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const other = new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime();
  return Math.round((today - other) / 86400000);
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
  group: {
    gap: theme.spacing.md,
  },
  groups: {
    gap: theme.spacing.lg,
  },
  groupTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    lineHeight: 21,
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
