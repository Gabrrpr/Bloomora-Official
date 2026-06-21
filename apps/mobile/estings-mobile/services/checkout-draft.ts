import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import type { CartItem } from '@/constants/shop';

export type CheckoutDraft = {
  attemptId: string;
  createdAt: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryNotes: string;
  deliveryProvider?: string;
  fulfillmentMethod: 'delivery' | 'pickup';
  isAnonymous: boolean;
  items: CartItem[];
  recipient: { firstName: string; lastName: string; phoneNumber: string };
  recipientType: 'myself' | 'someone';
  timeSlot: string;
};

const key = 'bloomora.checkout-draft';
const uri = `${FileSystem.documentDirectory}checkout-draft.json`;

export async function saveCheckoutDraft(draft: CheckoutDraft) {
  const value = JSON.stringify(draft);
  if (Platform.OS === 'web') globalThis.localStorage?.setItem(key, value);
  else await FileSystem.writeAsStringAsync(uri, value);
}

export async function getCheckoutDraft(): Promise<CheckoutDraft | null> {
  try {
    const value = Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(key)
      : (await FileSystem.getInfoAsync(uri)).exists
        ? await FileSystem.readAsStringAsync(uri)
        : null;
    if (!value) return null;
    const draft = JSON.parse(value) as CheckoutDraft;
    if (Date.now() - new Date(draft.createdAt).getTime() > 60 * 60 * 1000) {
      await clearCheckoutDraft();
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export async function clearCheckoutDraft() {
  if (Platform.OS === 'web') globalThis.localStorage?.removeItem(key);
  else await FileSystem.deleteAsync(uri, { idempotent: true });
}
