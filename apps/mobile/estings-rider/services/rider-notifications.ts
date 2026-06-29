import { apiFetchWithSession } from '@/services/api-client';

export type RiderNotification = {
  createdAt: string;
  deliveryId?: string;
  id: string;
  isRead: boolean;
  message: string;
  orderId?: string;
  title: string;
  type: 'delivery' | 'general';
};

type BackendNotification = {
  created_at?: string | null;
  delivery_id?: string | null;
  id: string;
  is_read?: boolean | null;
  message?: string | null;
  order_id?: string | null;
  title?: string | null;
  type?: string | null;
};

export async function getRiderNotifications(): Promise<RiderNotification[]> {
  const notifications = await apiFetchWithSession<BackendNotification[]>('/notifications/');
  return notifications.map(mapBackendNotification).filter((notification) => notification.type === 'delivery');
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
  return {
    createdAt: new Date().toISOString(),
    deliveryId,
    id: `delivery-completed-${deliveryId}`,
    isRead: true,
    message: `${orderNumber} for ${recipientName} has been marked delivered.`,
    title: 'You have completed a delivery',
    type: 'delivery' as const,
  };
}

export async function markRiderNotificationRead(notificationId: string) {
  await apiFetchWithSession<{ status: string }>(`/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'PATCH',
  });
  return getRiderNotifications();
}

export async function markAllRiderNotificationsRead() {
  await apiFetchWithSession<{ status: string }>('/notifications/read-all', {
    method: 'PATCH',
  });
  return getRiderNotifications();
}

function mapBackendNotification(notification: BackendNotification): RiderNotification {
  const normalizedType = (notification.type ?? '').toLowerCase();

  return {
    createdAt: notification.created_at ?? new Date().toISOString(),
    deliveryId: notification.delivery_id ?? undefined,
    id: notification.id,
    isRead: notification.is_read === true,
    message: notification.message ?? 'You have a rider update.',
    orderId: notification.order_id ?? undefined,
    title: notification.title ?? 'Notification',
    type: normalizedType === 'delivery' ? 'delivery' : 'general',
  };
}
