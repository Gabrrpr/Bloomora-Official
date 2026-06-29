import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { Bell, CheckCheck, ChevronLeft, LogIn } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, theme } from '@/constants/theme';
import { getAuthSession, type AuthSession } from '@/services/auth-session';
import { getOrderById } from '@/services/orders-api';
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type MobileNotification,
} from '@/services/notifications-api';

type OrderPreview = {
  imageUrl?: string | null;
  productName: string;
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [orderPreview, setOrderPreview] = useState<OrderPreview | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [session, setSession] = useState<AuthSession | null>(null);

  const orderUpdate = useMemo(
    () => notifications.filter((notification) => isOrderUpdate(notification)).sort(compareNotificationDateDesc)[0],
    [notifications],
  );
  const latestUpdates = useMemo(
    () => notifications
      .filter((notification) => notification.id !== orderUpdate?.id)
      .filter((notification) => !isOrderUpdate(notification))
      .slice(0, 6),
    [notifications, orderUpdate?.id],
  );

  const loadSession = useCallback(async ({ showSpinner = false } = {}) => {
    if (showSpinner) {
      setIsLoading(true);
    }

    try {
      const nextSession = await getAuthSession();
      setSession(nextSession);
      if (nextSession) {
        const [nextNotifications, nextUnreadCount] = await Promise.all([
          getNotifications({ session: nextSession }),
          getUnreadNotificationCount({ session: nextSession }),
        ]);
        setNotifications(nextNotifications);
        setUnreadCount(nextUnreadCount);
        const nextOrderUpdate = nextNotifications.find((notification) => isOrderUpdate(notification));
        if (nextOrderUpdate?.orderId) {
          try {
            const order = await getOrderById({ orderId: nextOrderUpdate.orderId, session: nextSession });
            const firstItem = order?.items[0];
            setOrderPreview({
              imageUrl: firstItem?.imageUrl ?? order?.imageUrl ?? null,
              productName: firstItem?.productName ?? order?.productName ?? 'Order product',
            });
          } catch {
            setOrderPreview(null);
          }
        } else {
          setOrderPreview(null);
        }
      } else {
        setNotifications([]);
        setOrderPreview(null);
        setUnreadCount(0);
      }
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load notifications.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSession({ showSpinner: true });
    }, [loadSession]),
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    void loadSession();
  }, [loadSession]);

  const handleMarkAllRead = useCallback(async () => {
    if (!session || unreadCount === 0) return;
    await markAllNotificationsRead({ session });
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
    setUnreadCount(0);
  }, [session, unreadCount]);

  const handleNotificationPress = useCallback(async (notification: MobileNotification) => {
    if (session && !notification.isRead) {
      void markNotificationRead({ notificationId: notification.id, session }).catch(() => {});
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, isRead: true } : item));
      setUnreadCount((current) => Math.max(0, current - 1));
    }
    if (notification.orderId) {
      router.push('/(tabs)/orders?tab=all' as never);
    }
  }, [session]);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, theme.spacing.lg) + 36, paddingTop: insets.top + theme.spacing.lg },
      ]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={isRefreshing} tintColor={theme.colors.primary} onRefresh={handleRefresh} />}
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Go back" hitSlop={10} style={styles.iconButton} onPress={() => router.back()}>
          <ChevronLeft size={theme.icon.md} color={theme.colors.text} />
        </Pressable>
        <Pressable
          accessibilityLabel="Mark all notifications as read"
          disabled={!session || unreadCount === 0}
          hitSlop={8}
          onPress={() => void handleMarkAllRead()}
          style={[styles.iconButton, (!session || unreadCount === 0) && styles.disabledIconButton]}>
          <CheckCheck size={18} color={theme.colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.countText}>{unreadCount} unread</Text>
      </View>

      {errorMessage ? <Text selectable style={styles.errorText}>{errorMessage}</Text> : null}
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : !session ? (
        <SignedOutState />
      ) : notifications.length === 0 ? (
        <EmptyNotificationState />
      ) : (
        <>
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Order Updates</Text>
            {orderUpdate ? (
              <NotificationCard featured notification={orderUpdate} orderPreview={orderPreview} onPress={() => void handleNotificationPress(orderUpdate)} />
            ) : (
              <Text style={styles.endText}>No order updates right now.</Text>
            )}
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Latest Updates</Text>
            {latestUpdates.length === 0 ? (
              <>
                <View style={styles.placeholderCard} />
                <Text style={styles.endText}>No more updates.</Text>
              </>
            ) : (
              latestUpdates.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} onPress={() => void handleNotificationPress(notification)} />
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function EmptyNotificationState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Bell size={31} color={theme.colors.primary} strokeWidth={1.8} />
      </View>
      <View style={styles.emptyCopy}>
        <Text style={styles.emptyTitle}>No notifications yet</Text>
        <Text style={styles.emptyDescription}>Order updates, promos, and support replies will appear here.</Text>
      </View>
    </View>
  );
}

function NotificationCard({
  featured = false,
  notification,
  orderPreview,
  onPress,
}: {
  featured?: boolean;
  notification: MobileNotification;
  orderPreview?: OrderPreview | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.notificationCard, featured && styles.featuredCard, pressed && styles.pressed]}>
      <View style={styles.notificationCopy}>
        <Text numberOfLines={2} style={styles.notificationTitle}>{notification.title}</Text>
        <Text numberOfLines={featured ? 2 : 3} style={styles.notificationMessage}>{notification.message}</Text>
        <Text style={styles.notificationTime}>{formatRelativeDate(notification.createdAt)}</Text>
      </View>
      {featured ? (
        <View style={styles.productImageFallback}>
          {orderPreview?.imageUrl ? (
            <Image contentFit="cover" source={{ uri: orderPreview.imageUrl }} style={styles.productImage} />
          ) : (
            <Text style={styles.productImageText}>{orderPreview?.productName ?? 'Order product'}</Text>
          )}
        </View>
      ) : null}
      {!notification.isRead ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

function SignedOutState() {
  return (
    <View style={styles.signedOutState}>
      <View style={styles.emptyIcon}>
        <LogIn size={28} color={theme.colors.primary} />
      </View>
      <Text style={styles.signedOutTitle}>Please log in</Text>
      <Text style={styles.signedOutText}>Sign in to view your order updates, promos, and account activity.</Text>
      <Pressable
        accessibilityLabel="Log in to view notifications"
        accessibilityRole="button"
        onPress={() => router.push('/(auth)/login')}
        style={({ pressed }) => [styles.signInButton, pressed && styles.pressed]}>
        <Text style={styles.signInButtonText}>Log in</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  countText: {
    color: '#777777',
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  disabledIconButton: {
    opacity: 0.44,
  },
  emptyCopy: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  emptyDescription: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 286,
    textAlign: 'center',
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  emptyState: {
    alignItems: 'center',
    gap: theme.spacing.lg,
    justifyContent: 'center',
    minHeight: 320,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 21,
    lineHeight: 27,
    textAlign: 'center',
  },
  errorText: {
    color: theme.colors.danger,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  loadingState: {
    alignItems: 'center',
    minHeight: 280,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  screen: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  signInButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    minHeight: 46,
    paddingHorizontal: theme.spacing.xl,
  },
  signInButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
  },
  signedOutState: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  signedOutText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  signedOutTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
  },
  title: {
    color: '#111111',
    fontFamily: Fonts.sansMedium,
    fontSize: 24,
    lineHeight: 30,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  endText: {
    color: '#777777',
    fontFamily: Fonts.sans,
    fontSize: 12,
    textAlign: 'center',
  },
  featuredCard: {
    minHeight: 144,
  },
  notificationCard: {
    alignItems: 'center',
    borderColor: '#D7D7D7',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    minHeight: 96,
    padding: 18,
    position: 'relative',
  },
  notificationCopy: {
    flex: 1,
    gap: 7,
  },
  notificationMessage: {
    color: '#777777',
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  notificationTime: {
    color: '#777777',
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 18,
    marginTop: 24,
  },
  notificationTitle: {
    color: '#111111',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 18,
    lineHeight: 23,
  },
  placeholderCard: {
    borderColor: '#D7D7D7',
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 96,
  },
  productImageFallback: {
    alignItems: 'center',
    backgroundColor: '#C6C6C6',
    borderRadius: 12,
    height: 120,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 120,
  },
  productImage: {
    height: '100%',
    width: '100%',
  },
  productImageText: {
    color: '#AAAAAA',
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 16,
    position: 'absolute',
    textAlign: 'center',
  },
  sectionBlock: {
    gap: 12,
  },
  sectionTitle: {
    color: '#111111',
    fontFamily: Fonts.sansMedium,
    fontSize: 20,
    lineHeight: 26,
  },
  unreadDot: {
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
    height: 8,
    position: 'absolute',
    right: 10,
    top: 10,
    width: 8,
  },
});

function formatRelativeDate(value?: string) {
  if (!value) return 'Today';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Today';
  const sameDay = new Date().toDateString() === date.toDateString();
  const time = new Intl.DateTimeFormat('en-PH', { hour: '2-digit', minute: '2-digit' }).format(date);
  if (sameDay) return `Today, ${time}`;
  return new Intl.DateTimeFormat('en-PH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

function isOrderUpdate(notification: MobileNotification) {
  const normalized = `${notification.type} ${notification.title} ${notification.message}`.toLowerCase();
  if (normalized.includes('flash sale') || normalized.includes('promo') || normalized.includes('product update')) {
    return false;
  }
  return Boolean(notification.orderId) || notification.type.toLowerCase() === 'order' || normalized.includes('order #') || normalized.includes('payment');
}

function compareNotificationDateDesc(first: MobileNotification, second: MobileNotification) {
  return getNotificationTime(second.createdAt) - getNotificationTime(first.createdAt);
}

function getNotificationTime(value?: string) {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
}
