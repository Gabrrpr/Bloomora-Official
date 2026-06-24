import { apiFetch } from '@/services/api-client';

export const relationshipOptions = [
  'Best Friend',
  'Partner / Lover',
  'Spouse',
  'Mother',
  'Father',
  'Sibling',
  'Grandparent',
  'Child',
  'Colleague',
  'Boss',
  'Teacher',
  'Mentor',
  'Classmate',
  'Neighbor',
  'Acquaintance',
] as const;

export const occasionOptions = [
  'Birthday',
  'Anniversary',
  "Valentine's Day",
  "Mother's Day",
  "Father's Day",
  'Graduation',
  'Get Well Soon',
  'Thank You',
  'Congratulations',
  'Just Because',
  'Sympathy',
  'Wedding',
  'New Baby',
  'Farewell',
] as const;

export const toneOptions = [
  { label: 'Warm & Heartfelt', value: 'warm' },
  { label: 'Playful & Fun', value: 'playful' },
  { label: 'Elegant & Formal', value: 'elegant' },
  { label: 'Simple & Sweet', value: 'simple' },
] as const;

export type CardTone = (typeof toneOptions)[number]['value'];

export async function generateGreetingCardMessage({
  extra = '',
  occasion,
  relationship,
  tone = 'warm',
}: {
  extra?: string;
  occasion: string;
  relationship: string;
  tone?: CardTone;
}) {
  const response = await apiFetch<{ message: string }>('/customization/generate-card', {
    body: JSON.stringify({
      extra,
      occasion,
      relationship,
      tone,
    }),
    method: 'POST',
  });

  return response.message.trim();
}
