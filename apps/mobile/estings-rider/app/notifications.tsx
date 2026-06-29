import Feather from '@expo/vector-icons/Feather';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, theme } from '@/constants/theme';
import {
  getRiderNotifications,
  markAllRiderNotificationsRead,
  markRiderNotificationRead,
  type RiderNotification,
} from '@/services/rider-notifications';

export default function RiderNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<RiderNotification[]>([]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const loadNotifications = useCallback(async () => {
    try {
      const nextNotifications = await getRiderNotifications();
      setNotifications(nextNotifications);
      setErrorMessage(null);
    } catch (error) {
      setNotifications([]);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load notifications.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications]),
  );

  function handleRefresh() {
    setIsRefreshing(true);
    void loadNotifications();
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) return;

    const nextNotifications = await markAllRiderNotificationsRead();
    setNotifications(nextNotifications);
  }

  async function handleNotificationPress(notification: RiderNotification) {
    if (!notification.isRead) {
      const nextNotifications = await markRiderNotificationRead(notification.id);
      setNotifications(nextNotifications);
    }

    if (notification.deliveryId) {
      router.push(`/delivery/${notification.deliveryId}` as never);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: Math.max(insets.bottom, theme.spacing.lg) + 36,
          paddingTop: insets.top + theme.spacing.lg,
        },
      ]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={isRefreshing} tintColor={theme.colors.primary} onRefresh={handleRefresh} />}
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={10}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          onPress={() => router.back()}>
          <Feather color={theme.colors.text} name="chevron-left" size={theme.icon.md} />
        </Pressable>
        <Pressable
          accessibilityLabel="Mark all notifications as read"
          disabled={unreadCount === 0}
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, unreadCount === 0 && styles.disabledIconButton, pressed && styles.pressed]}
          onPress={() => void handleMarkAllRead()}>
          <Feather color={theme.colors.textMuted} name="check-circle" size={18} />
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.countText}>{unreadCount} unread</Text>
      </View>

      {errorMessage ? (
        <NotificationState icon="alert-circle" title="Notifications unavailable" description={`${errorMessage} Pull down to try again.`} />
      ) : notifications.length === 0 ? (
        <EmptyNotificationState />
      ) : (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Delivery Updates</Text>
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onPress={() => void handleNotificationPress(notification)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function EmptyNotificationState() {
  return (
    <NotificationState
      icon="bell"
      title="No notifications yet"
      description="Delivery assignments, route changes, and completed deliveries will appear here."
    />
  );
}

function NotificationState({
  description,
  icon,
  title,
}: {
  description: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Feather color={theme.colors.primary} name={icon} size={31} />
      </View>
      <View style={styles.emptyCopy}>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyDescription}>{description}</Text>
      </View>
    </View>
  );
}

function NotificationCard({
  notification,
  onPress,
}: {
  notification: RiderNotification;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.notificationCard, pressed && styles.pressed]}
      onPress={onPress}>
      <View style={styles.notificationIcon}>
        <Feather color={theme.colors.primary} name="check-circle" size={22} />
      </View>
      <View style={styles.notificationCopy}>
        <Text numberOfLines={2} style={styles.notificationTitle}>
          {notification.title}
        </Text>
        <Text numberOfLines={3} style={styles.notificationMessage}>
          {notification.message}
        </Text>
        <Text style={styles.notificationTime}>{formatRelativeDate(notification.createdAt)}</Text>
      </View>
      {!notification.isRead ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

function formatRelativeDate(value?: string) {
  if (!value) return 'Today';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Today';

  const sameDay = new Date().toDateString() === date.toDateString();
  const time = new Intl.DateTimeFormat('en-PH', { hour: '2-digit', minute: '2-digit' }).format(date);

  if (sameDay) {
    return `Today, ${time}`;
  }

  return new Intl.DateTimeFormat('en-PH', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(date);
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
    fontFamily: Fonts.sansBold,
    fontSize: 21,
    lineHeight: 27,
    textAlign: 'center',
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
  notificationIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
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
    fontSize: 13,
    lineHeight: 18,
    marginTop: theme.spacing.md,
  },
  notificationTitle: {
    color: '#111111',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 18,
    lineHeight: 23,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  screen: {
    backgroundColor: theme.colors.surface,
    flex: 1,
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
