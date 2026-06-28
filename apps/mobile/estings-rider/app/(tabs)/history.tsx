import Feather from '@expo/vector-icons/Feather';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

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
    <RiderScreen title="History">
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
      {!isLoading && !error && completedDeliveries.length === 0 ? <Text style={styles.stateText}>No completed deliveries yet.</Text> : null}

      {!isLoading && !error ? (
        <View style={styles.groups}>
          {(['Today', 'Yesterday', 'Past'] as HistoryGroup[]).map((group) => (
            <View key={group} style={styles.group}>
              <Text style={styles.groupTitle}>{group}</Text>
              {groups[group].length > 0 ? (
                <View style={styles.list}>
                  {groups[group].map((delivery) => (
                    <DeliveryStopCard key={delivery.id} delivery={delivery} variant="completed" />
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
