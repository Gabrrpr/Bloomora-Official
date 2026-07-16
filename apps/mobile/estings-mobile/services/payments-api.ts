import { apiFetch } from '@/services/api-client';
import type { AuthSession } from '@/services/auth-session';
import type { CartItem } from '@/constants/shop';
import type { VerifiedAddress } from '@/services/location-api';

type CreateOrdersResponse = {
  order?: {
    delivery_fee: number;
    expires_at?: string | null;
    id: string;
    subtotal_amount: number;
    total_amount: number;
  };
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
    items?: {
      product_id?: string | null;
    }[];
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
  attemptId,
  branch,
  deliveryAddress,
  deliveryDate,
  deliveryLocation,
  deliveryNotes = '',
  deliveryProvider,
  fulfillmentMethod = 'delivery',
  isAnonymous = false,
  items,
  voucherCode,
  recipient,
  recipientType = 'myself',
  session,
  timeSlot = 'anytime',
}: {
  addressDetails?: string;
  addressId?: string;
  addressVerificationToken?: string;
  attemptId: string;
  branch: 'manila' | 'pampanga';
  deliveryAddress?: string;
  deliveryDate?: string;
  deliveryLocation?: Pick<VerifiedAddress, 'geocode_precision' | 'latitude' | 'longitude'>;
  deliveryNotes?: string;
  deliveryProvider?: string;
  fulfillmentMethod?: 'delivery' | 'lalamove' | 'pickup';
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
  voucherCode?: string;
}) {
  return apiFetch<CreateOrdersResponse>('/orders/', {
    body: JSON.stringify({
      attemptId,
      branch_name: branch,
      delivery_address: deliveryAddress ?? '',
      delivery_date: deliveryDate,
      delivery_geocode_precision: deliveryLocation?.geocode_precision || undefined,
      delivery_lat: Number.isFinite(deliveryLocation?.latitude) ? deliveryLocation?.latitude : undefined,
      delivery_lng: Number.isFinite(deliveryLocation?.longitude) ? deliveryLocation?.longitude : undefined,
      delivery_notes: deliveryNotes,
      delivery_provider: deliveryProvider,
      fulfillment_method: fulfillmentMethod,
      is_anonymous: isAnonymous,
      items: items.flatMap((item) => [
        {
          group: item.product.productGroup ?? item.product.categoryName ?? item.product.tag,
          id: item.product.id,
          qty: item.quantity,
          card_message: item.cardMessage,
        },
        ...(item.addOns ?? []).map((addOn) => ({
          group: addOn.productGroup ?? addOn.categoryName ?? addOn.tag,
          id: addOn.id,
          qty: 1,
        })),
      ]),
      payment_method: 'ewallet',
      recipient_first_name: recipient?.firstName,
      recipient_last_name: recipient?.lastName,
      recipient_phone_number: recipient?.phoneNumber,
      recipient_type: recipientType,
      time_slot: timeSlot,
      voucher_code: voucherCode,
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
