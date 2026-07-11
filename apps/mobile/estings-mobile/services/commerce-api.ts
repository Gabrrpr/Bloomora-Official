import { apiFetch } from '@/services/api-client';
import type { AuthSession } from '@/services/auth-session';

export type DeliverySettings = {
  delivery_fee: number;
  minimum_order: number;
  same_day_cutoff: string;
  timezone: string;
};

export type ShippingMethod = {
  id: string;
  code: string;
  courier_name: string;
  delivery_type: string;
  description?: string | null;
  logo_url?: string | null;
  service_area: 'manila' | 'pampanga' | 'nationwide';
  base_rate: number;
  sort_order: number;
  is_active: boolean;
  supports_live_booking: boolean;
};

export type AppliedVoucher = {
  code: string;
  discount: number;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  minSpend: number;
};

export type ActiveAdvertisement = {
  cta_destination?: string | null;
  id: string;
  image_url: string;
  title: string;
};

export async function getCheckoutSettings() {
  return apiFetch<{ delivery: DeliverySettings; shipping_methods?: ShippingMethod[] }>('/commerce/checkout-settings');
}

export async function validateVoucher({
  code,
  session,
  subtotal,
}: {
  code: string;
  session: AuthSession;
  subtotal: number;
}) {
  const result = await apiFetch<{
    discount: number;
    voucher: {
      code: string;
      discount_type: 'fixed' | 'percent';
      discount_value: number;
      min_spend: number;
    };
  }>('/commerce/vouchers/validate', {
    body: JSON.stringify({ code, subtotal }),
    method: 'POST',
    token: session.accessToken,
  });
  return {
    code: result.voucher.code,
    discount: result.discount,
    discountType: result.voucher.discount_type,
    discountValue: result.voucher.discount_value,
    minSpend: result.voucher.min_spend,
  } satisfies AppliedVoucher;
}

export async function getActiveAdvertisement() {
  const response = await apiFetch<{ advertisement: ActiveAdvertisement | null }>(
    '/commerce/advertisements/active',
  );
  return response.advertisement;
}
