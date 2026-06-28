import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { ImageOff, Star } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPageHeader } from '@/components/app-page-header';
import { Fonts, theme } from '@/constants/theme';
import { getAuthSession, type AuthSession } from '@/services/auth-session';
import { getMyOrders, type CustomerOrder } from '@/services/orders-api';
import { getMyReviews, type MyReview } from '@/services/reviews-api';

type RatingTab = 'to-rate' | 'reviews';

export default function MyRatingScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<RatingTab>('to-rate');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const nextSession = await getAuthSession();
      setSession(nextSession);
      if (!nextSession) {
        setOrders([]);
        setReviews([]);
        return;
      }
      const [nextOrders, nextReviews] = await Promise.all([
        getMyOrders({ session: nextSession }),
        getMyReviews(nextSession),
      ]);
      setOrders(nextOrders);
      setReviews(nextReviews);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Ratings are unavailable right now.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reviewableOrders = useMemo(
    () => orders.filter((order) => (order.status === 'delivered' || order.status === 'completed') && order.canReview && !order.hasReviewed),
    [orders],
  );

  return (
    <View style={styles.screen}>
      <AppPageHeader title="My Rating" />
      <View style={styles.tabs}>
        <TabButton active={activeTab === 'to-rate'} label="To rate" onPress={() => setActiveTab('to-rate')} />
        <TabButton active={activeTab === 'reviews'} label="My Reviews" onPress={() => setActiveTab('reviews')} />
      </View>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} tintColor={theme.colors.primary} onRefresh={() => void load(true)} />}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.state}><ActivityIndicator color={theme.colors.primary} /><Text style={styles.stateText}>Loading ratings</Text></View>
        ) : !session ? (
          <EmptyState action="Sign in" message="Sign in to rate completed orders and view your reviews." onPress={() => router.push('/(auth)/login')} />
        ) : error ? (
          <EmptyState action="Try again" message={error} onPress={() => void load(true)} />
        ) : activeTab === 'to-rate' ? (
          reviewableOrders.length === 0 ? (
            <EmptyState message="No completed orders are ready to rate." />
          ) : (
            reviewableOrders.map((order) => <ToRateCard key={order.id} order={order} />)
          )
        ) : reviews.length === 0 ? (
          <EmptyState message="You have not submitted any reviews yet." />
        ) : (
          reviews.map((review) => <ReviewCard key={review.id} review={review} />)
        )}
      </ScrollView>
    </View>
  );
}

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.tab}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
      <View style={[styles.tabIndicator, active && styles.tabIndicatorActive]} />
    </Pressable>
  );
}

function ToRateCard({ order }: { order: CustomerOrder }) {
  const firstItem = order.items[0];
  return (
    <View style={styles.card}>
      <View style={styles.productRow}>
        {firstItem?.imageUrl ? <Image source={{ uri: firstItem.imageUrl }} style={styles.image} /> : <View style={styles.imageFallback}><ImageOff color={theme.colors.primary} size={22} /></View>}
        <View style={styles.cardCopy}>
          <Text numberOfLines={2} style={styles.cardTitle}>{firstItem?.productName ?? order.productName}</Text>
          <Text style={styles.cardMeta}>Order {order.orderNumber}</Text>
          <Text style={styles.cardMeta}>Completed {formatDate(order.updatedAt ?? order.createdAt)}</Text>
        </View>
      </View>
      <Pressable onPress={() => router.push(`/review/${order.orderIds[0] ?? order.id}` as Href)} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Rate now</Text>
      </Pressable>
    </View>
  );
}

function ReviewCard({ review }: { review: MyReview }) {
  return (
    <View style={styles.card}>
      <View style={styles.productRow}>
        {review.product_image_url || review.image_url ? <Image source={{ uri: review.product_image_url || review.image_url || '' }} style={styles.image} /> : <View style={styles.imageFallback}><Star color="#E8A928" size={22} /></View>}
        <View style={styles.cardCopy}>
          <Text numberOfLines={2} style={styles.cardTitle}>{review.product_name || 'Reviewed product'}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((value) => <Star key={value} color="#E8A928" fill={value <= review.star_rating ? '#E8A928' : 'transparent'} size={15} />)}
          </View>
          <Text style={styles.cardMeta}>{formatDate(review.created_at)}</Text>
        </View>
      </View>
      {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
    </View>
  );
}

function EmptyState({ action, message, onPress }: { action?: string; message: string; onPress?: () => void }) {
  return (
    <View style={styles.state}>
      <Star color={theme.colors.primary} size={34} />
      <Text style={styles.stateText}>{message}</Text>
      {action && onPress ? <Pressable onPress={onPress} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{action}</Text></Pressable> : null}
    </View>
  );
}

function formatDate(value?: string | null) {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(date);
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderColor: '#D8D8D8', borderRadius: 12, borderWidth: 1, gap: 14, padding: 14 },
  cardCopy: { flex: 1, gap: 5 },
  cardMeta: { color: '#777777', fontFamily: Fonts.sans, fontSize: 12, lineHeight: 16 },
  cardTitle: { color: '#222222', fontFamily: Fonts.sansSemiBold, fontSize: 15, lineHeight: 20 },
  content: { gap: 14, padding: 14 },
  image: { backgroundColor: '#ECECEC', borderRadius: 8, height: 74, width: 74 },
  imageFallback: { alignItems: 'center', backgroundColor: '#ECECEC', borderRadius: 8, height: 74, justifyContent: 'center', width: 74 },
  primaryButton: { alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: 8, justifyContent: 'center', minHeight: 44, paddingHorizontal: 18 },
  primaryButtonText: { color: '#FFFFFF', fontFamily: Fonts.sansSemiBold, fontSize: 14 },
  productRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  reviewComment: { color: '#444444', fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20 },
  screen: { backgroundColor: '#F5F5F5', flex: 1 },
  starsRow: { flexDirection: 'row', gap: 2 },
  state: { alignItems: 'center', gap: 12, padding: 48 },
  stateText: { color: '#777777', fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  tab: { alignItems: 'center', flex: 1, paddingTop: 15 },
  tabIndicator: { height: 3, marginTop: 12, width: '100%' },
  tabIndicatorActive: { backgroundColor: theme.colors.primary },
  tabText: { color: '#A7A7A7', fontFamily: Fonts.sansMedium, fontSize: 14 },
  tabTextActive: { color: theme.colors.primary, fontFamily: Fonts.sansSemiBold },
  tabs: { backgroundColor: '#FFFFFF', borderBottomColor: '#D7D7D7', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row' },
});
