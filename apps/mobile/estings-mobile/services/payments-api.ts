import { apiFetch } from '@/services/api-client';
import type { AuthSession } from '@/services/auth-session';
import type { CartItem } from '@/constants/shop';

type CreateOrdersResponse = {
  order_ids: string[];
  status: string;
};

export type PayMongoCheckoutResponse = {
  checkout_session_id: string;
  checkout_url: string;
  order_ids: string[];
  provider: 'paymongo';
  reference_number: string;
  status: 'pending';
};

export type PayMongoPaymentStatusResponse = {
  checkout_session_id?: string | null;
  checkout_url?: string | null;
  order?: {
    id: string;
    order_number?: string;
    order_status?: string;
    payment_status?: string;
    status?: string;
  };
  paid_at?: string | null;
  payment_status: string;
  provider?: string | null;
};

export async function createOrdersFromCart({
  deliveryAddress,
  deliveryDate,
  deliveryNotes = '',
  deliveryProvider,
  fulfillmentMethod = 'delivery',
  isAnonymous = false,
  items,
  recipient,
  recipientType = 'myself',
  session,
  timeSlot = 'anytime',
}: {
  deliveryAddress?: string;
  deliveryDate?: string;
  deliveryNotes?: string;
  deliveryProvider?: string;
  fulfillmentMethod?: 'delivery' | 'pickup';
  isAnonymous?: boolean;
  items: CartItem[];
  recipient?: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  recipientType?: 'myself' | 'someone';
  session: AuthSession;
  timeSlot?: string;
}) {
  return apiFetch<CreateOrdersResponse>('/orders/', {
    body: JSON.stringify({
      delivery_address: deliveryAddress ?? session.user.address ?? '',
      delivery_date: deliveryDate,
      delivery_notes: deliveryNotes,
      delivery_provider: deliveryProvider,
      fulfillment_method: fulfillmentMethod,
      is_anonymous: isAnonymous,
      items: items.map((item) => ({
        group: item.product.productGroup ?? item.product.categoryName ?? item.product.tag,
        id: item.product.id,
        qty: item.quantity,
      })),
      payment_method: 'ewallet',
      recipient_first_name: recipient?.firstName,
      recipient_last_name: recipient?.lastName,
      recipient_phone_number: recipient?.phoneNumber,
      recipient_type: recipientType,
      time_slot: timeSlot,
    }),
    method: 'POST',
    token: session.accessToken,
  });
}

export async function createPayMongoCheckout({
  cancelUrl,
  orderIds,
  session,
  successUrl,
}: {
  cancelUrl?: string;
  orderIds: string[];
  session: AuthSession;
  successUrl?: string;
}) {
  return apiFetch<PayMongoCheckoutResponse>('/payments/paymongo/checkout', {
    body: JSON.stringify({
      cancel_url: cancelUrl,
      order_ids: orderIds,
      payment_method_types: ['card', 'gcash', 'qrph'],
      success_url: successUrl,
    }),
    method: 'POST',
    token: session.accessToken,
  });
}

export async function getPayMongoPaymentStatus({
  orderId,
  session,
}: {
  orderId: string;
  session: AuthSession;
}) {
  return apiFetch<PayMongoPaymentStatusResponse>(`/payments/paymongo/status/${encodeURIComponent(orderId)}`, {
    method: 'GET',
    token: session.accessToken,
  });
}
