import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const riderNotificationsStorageKey = 'estings.rider.notifications';

export type RiderNotification = {
  createdAt: string;
  deliveryId?: string;
  id: string;
  isRead: boolean;
  message: string;
  title: string;
  type: 'delivery' | 'general';
};

let memoryNotifications: RiderNotification[] | null = null;

export async function getRiderNotifications(): Promise<RiderNotification[]> {
  if (memoryNotifications) {
    return memoryNotifications;
  }

  const storedNotifications =
    Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(riderNotificationsStorageKey)
      : await SecureStore.getItemAsync(riderNotificationsStorageKey);

  if (!storedNotifications) {
    memoryNotifications = [];
    return memoryNotifications;
  }

  return parseNotifications(storedNotifications);
}

export async function addCompletedDeliveryNotification({
  deliveryId,
  orderNumber,
  recipientName,
}: {
  deliveryId: string;
  orderNumber: string;
  recipientName: string;
}) {
  const currentNotifications = await getRiderNotifications();
  const nextNotification: RiderNotification = {
    createdAt: new Date().toISOString(),
    deliveryId,
    id: `delivery-completed-${deliveryId}-${Date.now()}`,
    isRead: false,
    message: `${orderNumber} for ${recipientName} has been marked delivered.`,
    title: 'You have completed a delivery',
    type: 'delivery',
  };
  const nextNotifications = [nextNotification, ...currentNotifications].slice(0, 50);

  await saveRiderNotifications(nextNotifications);

  return nextNotification;
}

export async function markRiderNotificationRead(notificationId: string) {
  const currentNotifications = await getRiderNotifications();
  const nextNotifications = currentNotifications.map((notification) =>
    notification.id === notificationId ? { ...notification, isRead: true } : notification,
  );

  await saveRiderNotifications(nextNotifications);

  return nextNotifications;
}

export async function markAllRiderNotificationsRead() {
  const currentNotifications = await getRiderNotifications();
  const nextNotifications = currentNotifications.map((notification) => ({ ...notification, isRead: true }));

  await saveRiderNotifications(nextNotifications);

  return nextNotifications;
}

async function saveRiderNotifications(notifications: RiderNotification[]) {
  memoryNotifications = notifications;
  const serializedNotifications = JSON.stringify(notifications);

  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(riderNotificationsStorageKey, serializedNotifications);
    return;
  }

  await SecureStore.setItemAsync(riderNotificationsStorageKey, serializedNotifications);
}

function parseNotifications(serializedNotifications: string): RiderNotification[] {
  try {
    const parsed = JSON.parse(serializedNotifications);

    if (!Array.isArray(parsed)) {
      memoryNotifications = [];
      return memoryNotifications;
    }

    memoryNotifications = parsed
      .map((notification): RiderNotification => ({
        createdAt: typeof notification.createdAt === 'string' ? notification.createdAt : new Date().toISOString(),
        deliveryId: typeof notification.deliveryId === 'string' ? notification.deliveryId : undefined,
        id: typeof notification.id === 'string' ? notification.id : `${Date.now()}`,
        isRead: notification.isRead === true,
        message: typeof notification.message === 'string' ? notification.message : 'You have a rider update.',
        title: typeof notification.title === 'string' ? notification.title : 'Notification',
        type: notification.type === 'delivery' ? 'delivery' : 'general',
      }))
      .slice(0, 50);

    return memoryNotifications;
  } catch {
    memoryNotifications = [];
    return memoryNotifications;
  }
}
