import { apiFetch } from '@/services/api-client';
import { getAuthSession } from '@/services/auth-session';

// ── Types ────────────────────────────────────────────────────────────────────

export type AiUsage = {
  limit: number;
  remaining: number;
};

export type PriceBreakdownItem = {
  image_url?: string | null;
  material_type: string;
  product_id: string;
  product_name: string;
  quantity: number;
  subtotal: number;
  unit_price: number;
};

export type PriceBreakdown = {
  items: PriceBreakdownItem[];
  total_price: number;
};

export type DyaRecipePreview = {
  arrangementLabel: string;
  arrangementType: ArrangementLimitKey;
  items: PriceBreakdownItem[];
  totalPrice: number;
};

export type ArrangementLimitKey = 'bouquet' | 'vase' | 'box';

export type CustomizationRules = {
  arrangement_limits: Record<ArrangementLimitKey, {
    label: string;
    max_stems: number;
  }>;
};

export const DEFAULT_CUSTOMIZATION_RULES: CustomizationRules = {
  arrangement_limits: {
    bouquet: { label: 'Bouquet', max_stems: 24 },
    vase: { label: 'Vase', max_stems: 12 },
    box: { label: 'Flower Box', max_stems: 9 },
  },
};

export type QuantityValidation = {
  adjustment_reasons: string[];
  arrangement_type: ArrangementLimitKey;
  code: 'quantity_adjustment_required' | 'stock_adjustment_required' | 'material_unavailable' | string;
  max_stems: number;
  requested_items: {
    available_quantity: number;
    material_type?: string | null;
    product_id?: string | null;
    product_name: string;
    requested_quantity: number;
  }[];
  requested_total: number;
  suggested_items: {
    available_quantity?: number | null;
    material_type: 'flower' | 'filler' | 'wrapping' | 'vase' | 'box' | 'accessory' | string;
    product_id?: string | null;
    product_name: string;
    quantity: number;
    required: boolean;
  }[];
  suggested_prompt: string;
};

export type GenerationResult = {
  arrangement_id?: string;
  arrangement_type?: ArrangementLimitKey;
  generated_image_url?: string;
  message?: string;
  price_breakdown?: PriceBreakdown;
  remaining_generations?: number;
  success: boolean;
  unavailable_items?: UnavailableItem[];
  validation?: QuantityValidation;
};

export type UnavailableItem = {
  alternatives?: {
    image_url?: string;
    price: number;
    product_id: string;
    product_name: string;
  }[];
  field: string;
  product_name: string;
  reason: string;
};

export type GenerationPayload = {
  accessory_id?: string;
  flower_id?: string;
  prompt_text: string;
  review_only?: boolean;
  vase_id?: string;
  wrapping_id?: string;
};

export type CustomizationProduct = {
  attrs?: {
    color?: string | null;
    material?: string | null;
    name?: string | null;
    quantity?: number | null;
    size?: string | null;
    style?: string | null;
  };
  category: string;
  description?: string | null;
  id: string;
  image_url?: string | null;
  is_available?: boolean;
  is_customization_material?: boolean;
  is_visible?: boolean | null;
  name: string;
  price: number;
  product_group?: string | null;
  product_type?: string | null;
  stock: number;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock' | string;
};

// ── API Methods ──────────────────────────────────────────────────────────────

async function getSessionToken() {
  const session = await getAuthSession();
  return session?.accessToken ?? undefined;
}

export async function getAiUsage(): Promise<AiUsage> {
  const token = await getSessionToken();

  return apiFetch<AiUsage>('/customization/ai-usage', { token });
}

export async function getCustomizationRules(): Promise<CustomizationRules> {
  return apiFetch<CustomizationRules>('/customization/rules');
}

export async function checkAndGenerate(payload: GenerationPayload): Promise<GenerationResult> {
  const token = await getSessionToken();

  return apiFetch<GenerationResult>('/customization/check-and-generate', {
    body: JSON.stringify(payload),
    method: 'POST',
    token,
  });
}

export async function isCustomizationEnabled(): Promise<{ enabled: boolean }> {
  return apiFetch<{ enabled: boolean }>('/site-customization/customization/toggle');
}

export async function getCustomizationProducts(): Promise<CustomizationProduct[]> {
  return apiFetch<CustomizationProduct[]>('/products/customization/all');
}
