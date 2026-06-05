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

export async function createOrdersFromCart({
  items,
  session,
}: {
  items: CartItem[];
  session: AuthSession;
}) {
  return apiFetch<CreateOrdersResponse>('/orders/', {
    body: JSON.stringify({
      delivery_address: session.user.address ?? '',
      delivery_notes: '',
      items: items.map((item) => ({
        group: item.product.productGroup ?? item.product.categoryName ?? item.product.tag,
        id: item.product.id,
        qty: item.quantity,
      })),
      payment_method: 'ewallet',
    }),
    method: 'POST',
    token: session.accessToken,
  });
}

export async function createPayMongoCheckout({
  orderIds,
  session,
}: {
  orderIds: string[];
  session: AuthSession;
}) {
  return apiFetch<PayMongoCheckoutResponse>('/payments/paymongo/checkout', {
    body: JSON.stringify({
      order_ids: orderIds,
      payment_method_types: ['card', 'gcash', 'qrph'],
    }),
    method: 'POST',
    token: session.accessToken,
  });
}
