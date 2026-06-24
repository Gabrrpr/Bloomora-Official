import { router, useFocusEffect } from 'expo-router';
import { Bell, CheckCheck, ChevronLeft, PackageCheck, Tag } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/bloom-ui';
import { Fonts, theme } from '@/constants/theme';
import { getAuthSession, type AuthSession } from '@/services/auth-session';
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type MobileNotification,
} from '@/services/notifications-api';

const pollIntervalMs = 30_000;

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const eyebrow = useMemo(() => `${unreadCount} unread`, [unreadCount]);

  const loadNotifications = useCallback(async ({ showSpinner = false } = {}) => {
    if (showSpinner) {
      setIsLoading(true);
    }

    try {
      const nextSession = await getAuthSession();
      if (!nextSession) {
        router.replace('/(auth)/login');
        return;
      }

      const [nextNotifications, nextUnreadCount] = await Promise.all([
        getNotifications({ session: nextSession }),
        getUnreadNotificationCount({ session: nextSession }),
      ]);
      setSession(nextSession);
      setNotifications(nextNotifications);
      setUnreadCount(nextUnreadCount);
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
      let active = true;
      void loadNotifications({ showSpinner: true });
      const interval = setInterval(() => {
        if (active) {
          void loadNotifications();
        }
      }, pollIntervalMs);

      return () => {
        active = false;
        clearInterval(interval);
      };
    }, [loadNotifications]),
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    void loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    if (!session || unreadCount <= 0) return;
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead({ session });
      await loadNotifications();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to mark notifications as read.');
      await loadNotifications();
    }
  }, [loadNotifications, session, unreadCount]);

  const handleOpenNotification = useCallback(async (notification: MobileNotification) => {
    if (!session) return;
    if (!notification.isRead) {
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
      try {
        await markNotificationRead({ notificationId: notification.id, session });
      } catch {
        await loadNotifications();
      }
    }

    if (notification.orderId) {
      router.push(`/order-details/${encodeURIComponent(notification.orderId)}`);
    }
  }, [loadNotifications, session]);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, theme.spacing.lg) + 36, paddingTop: insets.top + theme.spacing.lg },
      ]}
      refreshControl={<RefreshControl refreshing={isRefreshing} tintColor={theme.colors.primary} onRefresh={handleRefresh} />}
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.eyebrowRow}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Pressable accessibilityLabel="Go back" hitSlop={10} style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={theme.icon.md} color={theme.colors.primary} />
          </Pressable>
        </View>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Notifications</Text>
          <Pressable
            accessibilityLabel="Mark all notifications as read"
            disabled={unreadCount <= 0}
            hitSlop={8}
            style={({ pressed }) => [styles.markAllButton, unreadCount <= 0 && styles.disabled, pressed && styles.pressed]}
            onPress={handleMarkAllRead}>
            <CheckCheck size={17} color={theme.colors.primary} />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>Order updates, promos, and account activity.</Text>
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : notifications.length ? (
        <View style={styles.list}>
          {notifications.map((notification) => (
            <NotificationRow key={notification.id} notification={notification} onPress={handleOpenNotification} />
          ))}
        </View>
      ) : (
        <EmptyState
          title="No notifications yet"
          description="You will see order updates, delivery reminders, and account activity here."
        />
      )}
    </ScrollView>
  );
}

function NotificationRow({
  notification,
  onPress,
}: {
  notification: MobileNotification;
  onPress: (notification: MobileNotification) => void;
}) {
  const Icon = notification.orderId ? PackageCheck : notification.type.toLowerCase().includes('promo') ? Tag : Bell;

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.notificationRow, !notification.isRead && styles.unreadRow, pressed && styles.pressed]}
      onPress={() => onPress(notification)}>
      <View style={styles.iconCircle}>
        <Icon size={18} color={theme.colors.primary} />
      </View>
      <View style={styles.notificationCopy}>
        <View style={styles.notificationTitleRow}>
          <Text numberOfLines={2} style={styles.notificationTitle}>
            {notification.title}
          </Text>
          {!notification.isRead ? <View style={styles.unreadDot} /> : null}
        </View>
        <Text numberOfLines={3} style={styles.notificationMessage}>
          {notification.message}
        </Text>
        <Text style={styles.notificationTime}>{formatRelativeTime(notification.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

function formatRelativeTime(value?: string) {
  if (!value) return 'Just now';
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'Just now';
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  content: {
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  disabled: {
    opacity: 0.45,
  },
  errorText: {
    color: theme.colors.danger,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  eyebrowRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  header: {
    gap: theme.spacing.sm,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  list: {
    gap: theme.spacing.sm,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  markAllButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  notificationCopy: {
    flex: 1,
    gap: 4,
  },
  notificationMessage: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  notificationRow: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  notificationTime: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
  },
  notificationTitle: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 19,
  },
  notificationTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  pressed: {
    opacity: 0.78,
  },
  screen: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.serif,
    fontSize: 34,
    lineHeight: 40,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  unreadDot: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 8,
    width: 8,
  },
  unreadRow: {
    backgroundColor: '#F5FBF4',
    borderColor: theme.colors.primary,
  },
});
