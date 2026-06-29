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
  assignedVehicle?: {
    brand?: string | null;
    capacity?: string | null;
    color?: string | null;
    id: string;
    model?: string | null;
    plateNumber?: string | null;
    vehicleType?: string | null;
  } | null;
  branch?: string | null;
  customerNotes?: string | null;
  deliveredAt?: string | null;
  deliveryNotes?: string | null;
  estimatedArrival?: string | null;
  handlingNotes: string[];
  id: string;
  imageUrl?: string | null;
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

export type RiderDeliveryOrder = {
  branch?: string | null;
  createdAt?: string | null;
  deliveries: RiderDelivery[];
  deliveryOrderNumber: string;
  id: string;
  notes?: string | null;
  riderId?: string | null;
  riderName?: string | null;
  status: string;
  stopCount: number;
  updatedAt?: string | null;
  vehicleId?: string | null;
  vehiclePlateNumber?: string | null;
  vehicleType?: string | null;
};

export type RiderProfile = {
  activeDeliveries: number;
  branch?: string | null;
  completedDeliveries: number;
  email: string;
  firstName?: string | null;
  id: string;
  lastName?: string | null;
  phoneNumber?: string | null;
  profilePictureUrl?: string | null;
  riderIsAvailable: boolean;
  username?: string | null;
};

export async function getMyDeliveries() {
  return apiFetchWithSession<RiderDelivery[]>('/deliveries/rider/me');
}

export async function getRiderProfile() {
  return apiFetchWithSession<RiderProfile>('/deliveries/rider/profile');
}

export async function updateRiderAvailability(riderIsAvailable: boolean) {
  return apiFetchWithSession<RiderProfile>('/deliveries/rider/profile', {
    body: JSON.stringify({ riderIsAvailable }),
    method: 'PATCH',
  });
}

export async function getMyDeliveryOrders() {
  return apiFetchWithSession<RiderDeliveryOrder[]>('/deliveries/rider/delivery-orders/me');
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
  photoUri,
  proofNote,
}: {
  deliveryId: string;
  photoUri: string;
  proofNote?: string;
}) {
  const formData = new FormData();
  formData.append('file', {
    name: `delivery-proof-${deliveryId}.jpg`,
    type: 'image/jpeg',
    uri: photoUri,
  } as unknown as Blob);
  if (proofNote) {
    formData.append('proof_note', proofNote);
  }

  return apiFetchWithSession<RiderDelivery>(`/deliveries/${encodeURIComponent(deliveryId)}/proof`, {
    body: formData,
    method: 'POST',
  });
}
