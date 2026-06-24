import type { CustomerOrder } from '@/services/orders-api';
import { getOrderById } from '@/services/orders-api';
import { getPayMongoPaymentStatus, type PayMongoPaymentStatusResponse } from '@/services/payments-api';
import type { AuthSession } from '@/services/auth-session';

export type PayMongoReceipt = {
  amount: number;
  orderNumbers: string[];
  paidAt?: string | null;
  paymentMethod?: string | null;
  paymentStatus: string;
  reference?: string | null;
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
  const purchasedProductIds = [
    ...(order?.items ?? []).map((item) => item.productId),
    ...statuses.flatMap((status) => status.order?.items?.map((item) => item.product_id) ?? []),
  ].filter((id): id is string => Boolean(id));

  return {
    allPaid,
    order,
    purchasedProductIds: [...new Set(purchasedProductIds)],
    receipt: {
      amount: Number(order?.totalAmount ?? 0),
      orderNumbers: order?.orderIds?.length ? [order.orderNumber] : statuses.map((status) => status.order?.order_number ?? '').filter(Boolean),
      paidAt: order?.paidAt ?? statuses.find((status) => status.paid_at)?.paid_at,
      paymentMethod: order?.paymentProvider ?? statuses.find((status) => status.provider)?.provider,
      paymentStatus: allPaid ? 'paid' : order?.paymentStatus ?? statuses[0]?.payment_status ?? 'pending',
      reference: order?.paymentReference,
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
