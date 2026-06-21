import { apiFetch } from '@/services/api-client';
import type { AuthSession } from '@/services/auth-session';

export type CustomerOrder = {
  branch?: string | null;
  canReview: boolean;
  checkoutUrl?: string | null;
  createdAt?: string | null;
  deliveryAddress?: string | null;
  deliveryNotes?: string | null;
  hasReviewed: boolean;
  id: string;
  imageUrl?: string | null;
  isCustom: boolean;
  itemCount: number;
  items: CustomerOrderItem[];
  orderNumber: string;
  orderIds: string[];
  paidAt?: string | null;
  paymentProvider?: string | null;
  paymentReference?: string | null;
  paymentStatus: string;
  productName: string;
  quantity: number;
  scheduledAt?: string | null;
  specialNote?: string | null;
  status: string;
  totalAmount: number;
  updatedAt?: string | null;
};

export type CustomerOrderItem = {
  id: string;
  imageUrl?: string | null;
  productName: string;
  quantity: number;
  totalAmount: number;
};

type BackendOrder = {
  branch?: string | null;
  can_review?: boolean | null;
  checkout_url?: string | null;
  created_at?: string | null;
  delivery_address?: string | null;
  delivery_notes?: string | null;
  has_reviewed?: boolean | null;
  id: string;
  image_url?: string | null;
  is_custom?: boolean | null;
  items?: BackendOrderItem[] | null;
  order_number?: string | null;
  paid_at?: string | null;
  payment_provider?: string | null;
  payment_reference?: string | null;
  payment_status?: string | null;
  product_name?: string | null;
  quantity?: number | null;
  scheduled_at?: string | null;
  special_note?: string | null;
  status?: string | null;
  total_amount?: number | null;
  updated_at?: string | null;
};

type BackendOrderItem = {
  id: string;
  image_url?: string | null;
  line_total?: number | null;
  product_name?: string | null;
  quantity?: number | null;
};

export async function getMyOrders({ session }: { session: AuthSession }) {
  const orders = await apiFetch<BackendOrder[]>('/orders/my', {
    method: 'GET',
    token: session.accessToken,
  });

  return groupCheckoutOrders(orders.map(mapBackendOrder));
}

export async function getOrderById({
  orderId,
  session,
}: {
  orderId: string;
  session: AuthSession;
}) {
  const orderIds = orderId.split(',').map((value) => value.trim()).filter(Boolean);
  const orders = await Promise.all(
    orderIds.map((id) =>
      apiFetch<BackendOrder>(`/orders/${encodeURIComponent(id)}`, {
        method: 'GET',
        token: session.accessToken,
      }),
    ),
  );

  return mergeCheckoutOrders(orders.map(mapBackendOrder));
}

function mapBackendOrder(order: BackendOrder): CustomerOrder {
  const items = order.items?.length
    ? order.items.map((item) => ({
        id: item.id,
        imageUrl: item.image_url,
        productName: item.product_name || 'Flower order',
        quantity: Number(item.quantity ?? 1),
        totalAmount: Number(item.line_total ?? 0),
      }))
    : [{
        id: order.id,
        imageUrl: order.image_url,
        productName: order.product_name || 'Flower order',
        quantity: Number(order.quantity ?? 1),
        totalAmount: Number(order.total_amount ?? 0),
      }];

  return {
    branch: order.branch,
    canReview: order.can_review === true,
    checkoutUrl: order.checkout_url,
    createdAt: order.created_at,
    deliveryAddress: order.delivery_address,
    deliveryNotes: order.delivery_notes,
    hasReviewed: order.has_reviewed === true,
    id: order.id,
    imageUrl: order.image_url,
    isCustom: order.is_custom === true,
    itemCount: items.length,
    items,
    orderNumber: order.order_number || `ORD-${order.id.slice(0, 8).toUpperCase()}`,
    orderIds: [order.id],
    paidAt: order.paid_at,
    paymentProvider: order.payment_provider,
    paymentReference: order.payment_reference,
    paymentStatus: order.payment_status || 'pending',
    productName: order.product_name || 'Flower order',
    quantity: Number(order.quantity ?? 1),
    scheduledAt: order.scheduled_at,
    specialNote: order.special_note,
    status: order.status || 'pending',
    totalAmount: Number(order.total_amount ?? 0),
    updatedAt: order.updated_at,
  };
}

function groupCheckoutOrders(orders: CustomerOrder[]) {
  const groups = new Map<string, CustomerOrder[]>();

  for (const order of orders) {
    const key = order.paymentReference
      ? `checkout:${order.paymentReference}`
      : `order:${order.id}`;
    groups.set(key, [...(groups.get(key) ?? []), order]);
  }

  return [...groups.values()]
    .map(mergeCheckoutOrders)
    .sort((first, second) => dateValue(second.createdAt) - dateValue(first.createdAt));
}

function mergeCheckoutOrders(orders: CustomerOrder[]) {
  const first = orders[0];
  if (!first || orders.length === 1) {
    return first;
  }

  const items = orders.flatMap((order) => order.items);
  const allPaid = orders.every((order) => order.paymentStatus === 'paid');
  const status = getLeastAdvancedStatus(orders.map((order) => order.status));

  return {
    ...first,
    id: orders.map((order) => order.id).join(','),
    itemCount: items.length,
    items,
    orderIds: orders.flatMap((order) => order.orderIds),
    orderNumber: `ORDER-${first.orderNumber.replace(/^ORD-/, '')}`,
    paymentStatus: allPaid ? 'paid' : 'pending',
    productName: `${items[0]?.productName ?? 'Flower order'} + ${items.length - 1} more`,
    quantity: items.reduce((total, item) => total + item.quantity, 0),
    status,
    totalAmount: orders.reduce((total, order) => total + order.totalAmount, 0),
  };
}

function getLeastAdvancedStatus(statuses: string[]) {
  const rank: Record<string, number> = {
    cancelled: 0,
    pending: 1,
    confirmed: 2,
    preparing: 3,
    out_for_delivery: 4,
    delivered: 5,
    completed: 5,
  };
  return [...statuses].sort((first, second) => (rank[first] ?? 1) - (rank[second] ?? 1))[0] ?? 'pending';
}

function dateValue(value?: string | null) {
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
