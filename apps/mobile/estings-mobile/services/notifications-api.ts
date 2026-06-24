import { apiFetch } from '@/services/api-client';
import type { AuthSession } from '@/services/auth-session';

type BackendNotification = {
  created_at?: string | null;
  id: string;
  is_read?: boolean | null;
  message?: string | null;
  order_id?: string | null;
  title?: string | null;
  type?: string | null;
};

export type MobileNotification = {
  createdAt?: string;
  id: string;
  isRead: boolean;
  message: string;
  orderId?: string;
  title: string;
  type: string;
};

export async function getNotifications({ session }: { session: AuthSession }) {
  const notifications = await apiFetch<BackendNotification[]>('/notifications/', {
    method: 'GET',
    token: session.accessToken,
  });

  return notifications.map(mapBackendNotification);
}

export async function getUnreadNotificationCount({ session }: { session: AuthSession }) {
  const response = await apiFetch<{ unread_count?: number | null }>('/notifications/unread-count', {
    method: 'GET',
    token: session.accessToken,
  });

  return Number(response.unread_count ?? 0);
}

export async function markNotificationRead({
  notificationId,
  session,
}: {
  notificationId: string;
  session: AuthSession;
}) {
  return apiFetch<{ status: string }>(`/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'PATCH',
    token: session.accessToken,
  });
}

export async function markAllNotificationsRead({ session }: { session: AuthSession }) {
  return apiFetch<{ status: string }>('/notifications/read-all', {
    method: 'PATCH',
    token: session.accessToken,
  });
}

function mapBackendNotification(notification: BackendNotification): MobileNotification {
  return {
    createdAt: notification.created_at || undefined,
    id: notification.id,
    isRead: notification.is_read === true,
    message: notification.message?.trim() || 'You have a new update.',
    orderId: notification.order_id || undefined,
    title: notification.title?.trim() || 'Notification',
    type: notification.type?.trim() || 'general',
  };
}
