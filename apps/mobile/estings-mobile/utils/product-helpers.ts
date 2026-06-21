import type { Product, ProductColor } from '@/constants/shop';

export function isFlowerProduct(product: Pick<Product, 'productGroup' | 'categoryName'>) {
  const group = product.productGroup?.toLowerCase();
  const category = product.categoryName?.toLowerCase() ?? '';
  return group === 'floral' || category.includes('flower');
}

export type QuotationMeta = {
  date: string;
  qty: number;
  ref: string;
};

export function buildQuotationRef(productId: string) {
  return `BLM-${productId}-${Date.now().toString().slice(-6)}`;
}

export function buildQuotationText({
  addOns,
  colorName,
  meta,
  product,
}: {
  addOns: Product[];
  colorName?: string;
  meta: QuotationMeta;
  product: Product;
}) {
  const basePrice = product.priceCents / 100;
  const addOnTotal = addOns.reduce((total, item) => total + item.priceCents / 100, 0);
  const unitPrice = basePrice + addOnTotal;
  const grandTotal = unitPrice * meta.qty;
  const lines = [
    'BULK ORDER QUOTATION',
    "Esting's Flower International Inc.",
    `Ref ${meta.ref}  ·  ${meta.date}`,
    '',
    `Item: ${product.name}`,
  ];

  if (colorName) {
    lines.push(`Color: ${colorName}`);
  }

  lines.push(
    `Quantity: ${meta.qty}`,
    '',
    `Base: PHP ${basePrice.toLocaleString('en-PH')} x ${meta.qty} = PHP ${(basePrice * meta.qty).toLocaleString('en-PH')}`,
  );

  for (const addOn of addOns) {
    const addOnPrice = addOn.priceCents / 100;
    lines.push(
      `Add-on (${addOn.name}): PHP ${addOnPrice.toLocaleString('en-PH')} x ${meta.qty} = PHP ${(addOnPrice * meta.qty).toLocaleString('en-PH')}`,
    );
  }

  lines.push(
    '',
    `Per-unit total: PHP ${unitPrice.toLocaleString('en-PH')}`,
    `GRAND TOTAL: PHP ${grandTotal.toLocaleString('en-PH')}`,
    '',
    'This is a standard-rate estimate. Is a bulk discount available for this quantity?',
  );

  return lines.join('\n');
}

export function getSelectedColorName(colors: ProductColor[], selectedColorId: string | null) {
  return colors.find((color) => color.id === selectedColorId)?.name;
}
