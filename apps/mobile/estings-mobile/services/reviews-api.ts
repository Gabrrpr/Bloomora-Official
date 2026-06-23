import { apiFetch } from '@/services/api-client';
import type { AuthSession } from '@/services/auth-session';

export type ReviewableProduct = {
  id: string;
  image_url?: string | null;
  name: string;
  reviewed: boolean;
};

export async function getReviewEligibility(orderId: string, session: AuthSession) {
  return apiFetch<{ order_id: string; products: ReviewableProduct[] }>(
    `/reviews/order/${encodeURIComponent(orderId)}/eligibility`,
    { token: session.accessToken },
  );
}

export async function submitProductReview({
  comment,
  imageUri,
  orderId,
  productId,
  rating,
  session,
}: {
  comment: string;
  imageUri?: string | null;
  orderId: string;
  productId: string;
  rating: number;
  session: AuthSession;
}) {
  const form = new FormData();
  form.append('order_id', orderId);
  form.append('product_id', productId);
  form.append('star_rating', String(rating));
  form.append('comment', comment);
  if (imageUri) {
    form.append('image', {
      name: `review-${Date.now()}.jpg`,
      type: 'image/jpeg',
      uri: imageUri,
    } as never);
  }
  return apiFetch<{ status: string }>('/reviews/submit', {
    body: form,
    method: 'POST',
    token: session.accessToken,
  });
}
