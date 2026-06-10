import { apiFetch } from '@/services/api-client';
import type { AuthSession } from '@/services/auth-session';

export type CustomerOrder = {
  branch?: string | null;
  checkoutUrl?: string | null;
  createdAt?: string | null;
  deliveryAddress?: string | null;
  deliveryNotes?: string | null;
  id: string;
  imageUrl?: string | null;
  orderNumber: string;
  paidAt?: string | null;
  paymentProvider?: string | null;
  paymentStatus: string;
  productName: string;
  quantity: number;
  status: string;
  totalAmount: number;
};

type BackendOrder = {
  branch?: string | null;
  checkout_url?: string | null;
  created_at?: string | null;
  delivery_address?: string | null;
  delivery_notes?: string | null;
  id: string;
  image_url?: string | null;
  order_number?: string | null;
  paid_at?: string | null;
  payment_provider?: string | null;
  payment_status?: string | null;
  product_name?: string | null;
  quantity?: number | null;
  status?: string | null;
  total_amount?: number | null;
};

export async function getMyOrders({ session }: { session: AuthSession }) {
  const orders = await apiFetch<BackendOrder[]>('/orders/my', {
    method: 'GET',
    token: session.accessToken,
  });

  return orders.map(mapBackendOrder);
}

function mapBackendOrder(order: BackendOrder): CustomerOrder {
  return {
    branch: order.branch,
    checkoutUrl: order.checkout_url,
    createdAt: order.created_at,
    deliveryAddress: order.delivery_address,
    deliveryNotes: order.delivery_notes,
    id: order.id,
    imageUrl: order.image_url,
    orderNumber: order.order_number || `ORD-${order.id.slice(0, 8).toUpperCase()}`,
    paidAt: order.paid_at,
    paymentProvider: order.payment_provider,
    paymentStatus: order.payment_status || 'pending',
    productName: order.product_name || 'Flower order',
    quantity: Number(order.quantity ?? 1),
    status: order.status || 'pending',
    totalAmount: Number(order.total_amount ?? 0),
  };
}
