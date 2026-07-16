import type { CustomerOrder } from '@/services/orders-api';
import { getOrderById } from '@/services/orders-api';
import { getPayMongoPaymentStatus, type PayMongoPaymentStatusResponse } from '@/services/payments-api';
import type { AuthSession } from '@/services/auth-session';

export type PayMongoReceipt = {
  checkoutSessionId?: string | null;
  orderNumbers: string[];
  orderTotal: number;
  paidAt?: string | null;
  paymentMethod?: string | null;
  provider?: string | null;
  paymentStatus: string;
  transactionId?: string | null;
};

export type PayMongoConfirmationResult = {
  allPaid: boolean;
  order?: CustomerOrder;
  purchasedProductIds: string[];
  receipt: PayMongoReceipt;
  statuses: PayMongoPaymentStatusResponse[];
};

export async function confirmPayMongoOrders({
  orderIds,
  session,
}: {
  orderIds: string[];
  session: AuthSession;
}): Promise<PayMongoConfirmationResult> {
  const normalizedOrderIds = orderIds.map((id) => id.trim()).filter(Boolean);
  const statuses = await Promise.all(
    normalizedOrderIds.map((orderId) => getPayMongoPaymentStatus({ orderId, session })),
  );
  const order = normalizedOrderIds.length
    ? await getOrderById({ orderId: normalizedOrderIds.join(','), session }).catch(() => undefined)
    : undefined;
  const allPaid = statuses.length > 0 && statuses.every((status) => status.payment_status === 'paid');
  const statusOrderNumbers = statuses
    .map((status) => status.order?.order_number ?? '')
    .filter(Boolean);
  const purchasedProductIds = [
    ...(order?.items ?? []).map((item) => item.productId),
    ...statuses.flatMap((status) => status.order?.items?.map((item) => item.product_id) ?? []),
  ].filter((id): id is string => Boolean(id));

  return {
    allPaid,
    order,
    purchasedProductIds: [...new Set(purchasedProductIds)],
    receipt: {
      checkoutSessionId: statuses.find((status) => status.checkout_session_id)?.checkout_session_id
        ?? order?.paymentReference,
      orderNumbers: statusOrderNumbers.length
        ? statusOrderNumbers
        : order?.orderNumber ? [order.orderNumber] : [],
      orderTotal: Number(order?.totalAmount ?? 0),
      paidAt: order?.paidAt ?? statuses.find((status) => status.paid_at)?.paid_at,
      paymentMethod: order?.paymentMethod,
      provider: order?.paymentProvider ?? statuses.find((status) => status.provider)?.provider,
      paymentStatus: allPaid ? 'paid' : order?.paymentStatus ?? statuses[0]?.payment_status ?? 'pending',
      transactionId: order?.transactionId,
    },
    statuses,
  };
}

export async function isPayMongoOrderPaid({
  orderId,
  session,
}: {
  orderId: string;
  session: AuthSession;
}) {
  const result = await confirmPayMongoOrders({ orderIds: orderId.split(','), session });
  return result.allPaid;
}
