import { apiFetch } from '@/services/api-client';
import type { AuthSession } from '@/services/auth-session';

export type CustomerOrder = {
  branch?: string | null;
  canReview: boolean;
  checkoutUrl?: string | null;
  createdAt?: string | null;
  deliveryAddress?: string | null;
  deliveryNotes?: string | null;
  deliveryFee: number;
  deliveryProvider?: string | null;
  deliveryTracking?: CustomerDeliveryTracking | null;
  discountAmount: number;
  expiresAt?: string | null;
  hasReviewed: boolean;
  id: string;
  imageUrl?: string | null;
  isCustom: boolean;
  itemCount: number;
  items: CustomerOrderItem[];
  orderNumber: string;
  orderIds: string[];
  paidAt?: string | null;
  paymentMethod?: string | null;
  paymentProvider?: string | null;
  paymentReference?: string | null;
  paymentStatus: string;
  voucherCode?: string | null;
  transactionId?: string | null;
  productName: string;
  quantity: number;
  recipientName?: string | null;
  recipientPhone?: string | null;
  fulfillmentMethod: string;
  subtotalAmount: number;
  timeSlot?: string | null;
  scheduledAt?: string | null;
  specialNote?: string | null;
  status: string;
  totalAmount: number;
  updatedAt?: string | null;
};

export type CustomerDeliveryTracking = {
  assignedAt?: string | null;
  arrivedAt?: string | null;
  deliveredAt?: string | null;
  deliveryId?: string | null;
  estimatedArrival?: string | null;
  inTransitAt?: string | null;
  lalamoveOrderId?: string | null;
  lalamoveShareLink?: string | null;
  lalamoveStatus?: string | null;
  pickedUpAt?: string | null;
  proofNote?: string | null;
  proofPhotoUrl?: string | null;
  provider?: string | null;
  rider?: {
    id: string;
    name?: string | null;
    phone?: string | null;
  } | null;
  status?: string | null;
  vehicle?: {
    brand?: string | null;
    color?: string | null;
    id: string;
    model?: string | null;
    plateNumber?: string | null;
    vehicleType?: string | null;
  } | null;
};

export type CustomerOrderItem = {
  cardEnabled?: boolean;
  cardMessage?: string | null;
  id: string;
  imageUrl?: string | null;
  productId?: string | null;
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
  delivery_fee?: number | null;
  delivery_provider?: string | null;
  delivery_tracking?: BackendDeliveryTracking | null;
  discount_amount?: number | null;
  expires_at?: string | null;
  has_reviewed?: boolean | null;
  id: string;
  image_url?: string | null;
  is_custom?: boolean | null;
  items?: BackendOrderItem[] | null;
  order_number?: string | null;
  paid_at?: string | null;
  payment_method?: string | null;
  payment_provider?: string | null;
  payment_reference?: string | null;
  payment_status?: string | null;
  voucher_code?: string | null;
  transaction_id?: string | null;
  product_name?: string | null;
  quantity?: number | null;
  recipient_first_name?: string | null;
  recipient_last_name?: string | null;
  recipient_phone?: string | null;
  fulfillment_method?: string | null;
  subtotal_amount?: number | null;
  time_slot?: string | null;
  scheduled_at?: string | null;
  special_note?: string | null;
  status?: string | null;
  total_amount?: number | null;
  updated_at?: string | null;
};

type BackendDeliveryTracking = {
  assigned_at?: string | null;
  arrived_at?: string | null;
  delivered_at?: string | null;
  delivery_id?: string | null;
  estimated_arrival?: string | null;
  in_transit_at?: string | null;
  lalamove_order_id?: string | null;
  lalamove_share_link?: string | null;
  lalamove_status?: string | null;
  picked_up_at?: string | null;
  proof_note?: string | null;
  proof_photo_url?: string | null;
  provider?: string | null;
  rider?: {
    id: string;
    name?: string | null;
    phone?: string | null;
  } | null;
  status?: string | null;
  vehicle?: {
    brand?: string | null;
    color?: string | null;
    id: string;
    model?: string | null;
    plate_number?: string | null;
    vehicle_type?: string | null;
  } | null;
};

type BackendOrderItem = {
  card_enabled?: boolean | null;
  card_message?: string | null;
  id: string;
  image_url?: string | null;
  line_total?: number | null;
  product_id?: string | null;
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
        productId: item.product_id,
        productName: item.product_name || 'Flower order',
        cardEnabled: item.card_enabled === true,
        cardMessage: item.card_message,
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
    deliveryFee: Number(order.delivery_fee ?? 0),
    deliveryProvider: order.delivery_provider,
    deliveryTracking: mapDeliveryTracking(order.delivery_tracking),
    discountAmount: Number(order.discount_amount ?? 0),
    expiresAt: order.expires_at,
    hasReviewed: order.has_reviewed === true,
    id: order.id,
    imageUrl: order.image_url,
    isCustom: order.is_custom === true,
    itemCount: items.length,
    items,
    orderNumber: order.order_number || `ORD-${order.id.slice(0, 8).toUpperCase()}`,
    orderIds: [order.id],
    paidAt: order.paid_at,
    paymentMethod: order.payment_method,
    paymentProvider: order.payment_provider,
    paymentReference: order.payment_reference,
    paymentStatus: order.payment_status || 'pending',
    voucherCode: order.voucher_code,
    transactionId: order.transaction_id,
    productName: order.product_name || 'Flower order',
    quantity: Number(order.quantity ?? 1),
    recipientName: [order.recipient_first_name, order.recipient_last_name].filter(Boolean).join(' ') || null,
    recipientPhone: order.recipient_phone,
    fulfillmentMethod: order.fulfillment_method || 'delivery',
    subtotalAmount: Number(order.subtotal_amount ?? order.total_amount ?? 0),
    timeSlot: order.time_slot,
    scheduledAt: order.scheduled_at,
    specialNote: order.special_note,
    status: order.status || 'pending',
    totalAmount: Number(order.total_amount ?? 0),
    updatedAt: order.updated_at,
  };
}

function mapDeliveryTracking(tracking?: BackendDeliveryTracking | null): CustomerDeliveryTracking | null {
  if (!tracking || (!tracking.status && !tracking.delivery_id && !tracking.lalamove_share_link)) {
    return null;
  }

  return {
    assignedAt: tracking.assigned_at,
    arrivedAt: tracking.arrived_at,
    deliveredAt: tracking.delivered_at,
    deliveryId: tracking.delivery_id,
    estimatedArrival: tracking.estimated_arrival,
    inTransitAt: tracking.in_transit_at,
    lalamoveOrderId: tracking.lalamove_order_id,
    lalamoveShareLink: tracking.lalamove_share_link,
    lalamoveStatus: tracking.lalamove_status,
    pickedUpAt: tracking.picked_up_at,
    proofNote: tracking.proof_note,
    proofPhotoUrl: tracking.proof_photo_url,
    provider: tracking.provider,
    rider: tracking.rider,
    status: tracking.status,
    vehicle: tracking.vehicle
      ? {
          brand: tracking.vehicle.brand,
          color: tracking.vehicle.color,
          id: tracking.vehicle.id,
          model: tracking.vehicle.model,
          plateNumber: tracking.vehicle.plate_number,
          vehicleType: tracking.vehicle.vehicle_type,
        }
      : null,
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
  const deliveryTracking = orders.find((order) => order.deliveryTracking)?.deliveryTracking ?? first.deliveryTracking;

  return {
    ...first,
    id: orders.map((order) => order.id).join(','),
    itemCount: items.length,
    items,
    orderIds: orders.flatMap((order) => order.orderIds),
    orderNumber: `ORDER-${first.orderNumber.replace(/^ORD-/, '')}`,
    deliveryTracking,
    deliveryFee: orders.reduce((total, order) => total + order.deliveryFee, 0),
    discountAmount: orders.reduce((total, order) => total + order.discountAmount, 0),
    paymentStatus: allPaid ? 'paid' : 'pending',
    productName: `${items[0]?.productName ?? 'Flower order'} + ${items.length - 1} more`,
    quantity: items.reduce((total, item) => total + item.quantity, 0),
    status,
    subtotalAmount: orders.reduce((total, order) => total + order.subtotalAmount, 0),
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
