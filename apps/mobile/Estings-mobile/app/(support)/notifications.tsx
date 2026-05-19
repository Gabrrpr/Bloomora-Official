import { router } from 'expo-router';
import { Bell, ChevronLeft, Gift, MessageCircle, PackageCheck, Sparkles } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BloomScreen, EmptyState, Section } from '@/components/bloom-ui';
import { type ShopNotification } from '@/constants/shop';
import { theme } from '@/constants/theme';
import { shopSnapshot } from '@/services/shop-api';

const notificationIcons = {
  ai: Sparkles,
  order: PackageCheck,
  promo: Gift,
  support: MessageCircle,
};

export default function NotificationsScreen() {
  const notifications = shopSnapshot.notifications;
  const unreadCount = notifications.filter((notification) => notification.unread).length;

  return (
    <BloomScreen
      eyebrow={`${unreadCount} unread`}
      headerAction={
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={10}
          style={styles.backButton}
          onPress={() => router.back()}>
          <ChevronLeft size={theme.icon.md} color={theme.colors.primary} />
        </Pressable>
      }
      title="Notifications"
      subtitle="Order updates, promos, support replies, and AI bouquet activity.">
      <Section title="Recent">
        {notifications.length ? (
          <View style={styles.list}>
            {notifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} />
            ))}
          </View>
        ) : (
          <EmptyState
            title="No notifications yet"
            description="You will see order updates, delivery reminders, and saved bouquet activity here."
          />
        )}
      </Section>
    </BloomScreen>
  );
}

function NotificationRow({ notification }: { notification: ShopNotification }) {
  const Icon = notificationIcons[notification.type] ?? Bell;

  return (
    <Pressable style={[styles.card, notification.unread && styles.cardUnread]}>
      <View style={styles.iconFrame}>
        <Icon size={theme.icon.md} color={theme.colors.primary} />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          {notification.unread ? <View style={styles.unreadDot} /> : null}
        </View>
        <Text style={styles.notificationMessage}>{notification.message}</Text>
        <Text style={styles.timeLabel}>{notification.timeLabel}</Text>
      </View>
    </Pressable>
  );
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
  list: {
    gap: theme.spacing.md,
  },
  card: {
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  cardUnread: {
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(46, 139, 52, 0.24)',
  },
  iconFrame: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  body: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  notificationTitle: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
  },
  unreadDot: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    height: 9,
    width: 9,
  },
  notificationMessage: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  timeLabel: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
