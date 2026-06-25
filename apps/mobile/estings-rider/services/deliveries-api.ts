import { apiFetchWithSession } from '@/services/api-client';

export type RiderDeliveryStatus =
  | 'assigned'
  | 'picked_up'
  | 'out_for_delivery'
  | 'arrived'
  | 'delivered'
  | 'issue_reported'
  | 'failed';

export type RiderDelivery = {
  address: string;
  arrivedAt?: string | null;
  assignedArea?: string | null;
  branch?: string | null;
  customerNotes?: string | null;
  deliveredAt?: string | null;
  deliveryNotes?: string | null;
  estimatedArrival?: string | null;
  handlingNotes: string[];
  id: string;
  inTransitAt?: string | null;
  itemSummary: string;
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  pickedUpAt?: string | null;
  proofNote?: string | null;
  proofPhotoUrl?: string | null;
  recipientName: string;
  recipientPhone: string;
  scheduledAt?: string | null;
  status: RiderDeliveryStatus;
};

export async function getMyDeliveries() {
  return apiFetchWithSession<RiderDelivery[]>('/deliveries/rider/me');
}

export async function getMyDeliveryHistory() {
  return apiFetchWithSession<RiderDelivery[]>('/deliveries/rider/history');
}

export async function getDeliveryById(deliveryId: string) {
  return apiFetchWithSession<RiderDelivery>(`/deliveries/${encodeURIComponent(deliveryId)}`);
}

export async function updateDeliveryStatus(deliveryId: string, status: RiderDeliveryStatus, issueNote?: string) {
  return apiFetchWithSession<RiderDelivery>(`/deliveries/${encodeURIComponent(deliveryId)}/status`, {
    body: JSON.stringify({
      status,
      issue_note: issueNote,
    }),
    method: 'PATCH',
  });
}

export async function submitDeliveryProof({
  deliveryId,
  proofNote,
  proofPhotoUrl,
}: {
  deliveryId: string;
  proofNote?: string;
  proofPhotoUrl: string;
}) {
  const formData = new FormData();
  formData.append('proof_photo_url', proofPhotoUrl);
  if (proofNote) {
    formData.append('proof_note', proofNote);
  }

  return apiFetchWithSession<RiderDelivery>(`/deliveries/${encodeURIComponent(deliveryId)}/proof`, {
    body: formData,
    method: 'POST',
  });
}
