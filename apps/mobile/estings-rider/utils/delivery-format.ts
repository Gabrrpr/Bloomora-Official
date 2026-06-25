import type { DeliveryStatus } from '@/components/rider/delivery-card';
import type { RiderDelivery, RiderDeliveryStatus } from '@/services/deliveries-api';

export function getRiderStatusLabel(status: RiderDeliveryStatus) {
  const labels: Record<RiderDeliveryStatus, string> = {
    arrived: 'Arrived',
    assigned: 'Assigned',
    delivered: 'Delivered',
    failed: 'Failed',
    issue_reported: 'Issue Reported',
    out_for_delivery: 'Out for Delivery',
    picked_up: 'Picked Up',
  };

  return labels[status];
}

export function getDeliveryCardStatus(status: RiderDeliveryStatus): DeliveryStatus {
  if (status === 'delivered') {
    return 'Delivered';
  }

  if (status === 'picked_up' || status === 'out_for_delivery' || status === 'arrived') {
    return 'In Transit';
  }

  return 'Assigned';
}

export function getDeliveryEta(delivery: RiderDelivery) {
  if (delivery.status === 'delivered' && delivery.deliveredAt) {
    return `Delivered ${formatTime(delivery.deliveredAt)}`;
  }

  if (delivery.scheduledAt) {
    return `Scheduled ${formatTime(delivery.scheduledAt)}`;
  }

  return getRiderStatusLabel(delivery.status);
}

export function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
