export type Product = {
  id: string;
  colors?: ProductColor[];
  description?: string;
  careGuide?: string[];
  name: string;
  originalPriceCents?: number;
  priceCents: number;
  tag: string;
  imageUrl?: string;
  isActive?: boolean;
  isFlashSale?: boolean;
  isPromoted?: boolean;
  categoryId: string;
  categoryName?: string;
  branch?: 'all' | 'manila' | 'pampanga' | string;
  createdAt?: string;
  productGroup?: string;
  productType?: string;
  stock?: number;
};

export type ProductColor = {
  hex: string;
  id: string;
  name: string;
};

export type Category = {
  id: string;
  name: string;
  itemCount: number;
  productGroup?: string;
  totalStock?: number;
};

export type CartItem = {
  id: string;
  product: Product;
  quantity: number;
};

export type Order = {
  id: string;
  productName: string;
  dateLabel: string;
  status: 'processing' | 'out_for_delivery' | 'completed';
};

export type Promo = {
  id: string;
  title: string;
  description: string;
};

export type PromoSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaLabel: string;
};

export type ShopNotification = {
  id: string;
  title: string;
  message: string;
  timeLabel: string;
  type: 'order' | 'promo' | 'ai' | 'support';
  unread: boolean;
};

export type CreateOption = {
  id: string;
  label: string;
};

export type CreateOptions = {
  flowerTypes: CreateOption[];
  colors: CreateOption[];
  wrappers: CreateOption[];
};

export const sampleProducts: Product[] = [
  {
    id: 'prod-blush-garden',
    name: 'Blush Garden Bouquet',
    priceCents: 249900,
    tag: 'Best seller',
    categoryId: 'cat-roses',
    imageUrl:
      'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'prod-orchid-table',
    name: 'Orchid Table Arrangement',
    priceCents: 329900,
    tag: 'Premium',
    categoryId: 'cat-orchids',
    imageUrl:
      'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'prod-sunlit-tulip',
    name: 'Sunlit Tulip Wrap',
    priceCents: 189900,
    tag: 'Fresh today',
    categoryId: 'cat-tulips',
    imageUrl:
      'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=700&q=80',
  },
];

export const sampleCategories: Category[] = [
  { id: 'cat-roses', name: 'Roses', itemCount: 24 },
  { id: 'cat-lilies', name: 'Lilies', itemCount: 18 },
  { id: 'cat-orchids', name: 'Orchids', itemCount: 12 },
  { id: 'cat-tulips', name: 'Tulips', itemCount: 16 },
  { id: 'cat-sympathy', name: 'Sympathy', itemCount: 10 },
  { id: 'cat-weddings', name: 'Weddings', itemCount: 28 },
];

export const sampleCartItems: CartItem[] = [
  { id: 'cart-1', product: sampleProducts[0], quantity: 1 },
  { id: 'cart-2', product: sampleProducts[2], quantity: 2 },
];

export const sampleOrders: Order[] = [
  {
    id: 'BLM-1048',
    productName: 'Blush Garden Bouquet',
    dateLabel: 'Arrives today',
    status: 'out_for_delivery',
  },
  {
    id: 'BLM-0992',
    productName: 'Orchid Table Arrangement',
    dateLabel: 'Apr 22',
    status: 'completed',
  },
];

export const samplePromos: Promo[] = [
  {
    id: 'promo-mothers-day',
    title: 'Mother\'s Day sets',
    description: 'Curated blooms with same-day Metro Manila delivery.',
  },
  {
    id: 'promo-local-studio',
    title: 'Philippines-based studio',
    description: 'Hand-tied fresh by local florists.',
  },
];

export const sampleNotifications: ShopNotification[] = [
  {
    id: 'notif-order-out',
    title: 'Your bouquet is on the way',
    message: 'Blush Garden Bouquet is out for delivery and should arrive this afternoon.',
    timeLabel: '12 min ago',
    type: 'order',
    unread: true,
  },
  {
    id: 'notif-ai-ready',
    title: 'AI bouquet idea saved',
    message: 'Your soft pink arrangement concept is ready to review in Generate.',
    timeLabel: '1 hr ago',
    type: 'ai',
    unread: true,
  },
  {
    id: 'notif-promo-weekend',
    title: 'Weekend delivery promo',
    message: 'Enjoy free Metro Manila delivery for orders above PHP 2,500 this weekend.',
    timeLabel: 'Yesterday',
    type: 'promo',
    unread: false,
  },
];

export const samplePromoSlides: PromoSlide[] = [
  {
    id: 'slide-promos',
    eyebrow: 'Promos',
    title: 'Free Metro Manila delivery',
    description: 'Available for orders above PHP 2,500 this weekend.',
    ctaLabel: 'Shop promo',
    imageUrl:
      'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'slide-new-arrivals',
    eyebrow: 'New arrivals',
    title: 'Fresh stems from local florists',
    description: 'Discover newly arranged bouquets for birthdays, thanks, and everyday gifting.',
    ctaLabel: 'See new',
    imageUrl:
      'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'slide-seasonal',
    eyebrow: 'Seasonal offers',
    title: 'Summer-ready orchid sets',
    description: 'Elegant arrangements for warm-weather celebrations across the Philippines.',
    ctaLabel: 'Explore offers',
    imageUrl:
      'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'slide-ai',
    eyebrow: 'AI flower highlights',
    title: 'Create your dream bouquet',
    description: 'Type a prompt and generate a floral image concept before you order.',
    ctaLabel: 'Try Create',
    imageUrl:
      'https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=900&q=80',
  },
];

export const generatedLooks = [
  'https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1494972308805-463bc619d34e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=900&q=80',
];

export const sampleCreateOptions: CreateOptions = {
  flowerTypes: [
    { id: 'rose', label: 'Rose' },
    { id: 'tulip', label: 'Tulip' },
    { id: 'orchid', label: 'Orchid' },
  ],
  colors: [
    { id: 'white', label: 'White' },
    { id: 'pink', label: 'Pink' },
    { id: 'yellow', label: 'Yellow' },
  ],
  wrappers: [
    { id: 'kraft', label: 'Kraft paper' },
    { id: 'linen', label: 'Linen wrap' },
    { id: 'box', label: 'Gift box' },
  ],
};

export function formatPhp(cents: number) {
  return new Intl.NumberFormat('en-PH', {
    currency: 'PHP',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(cents / 100);
}

export function getCartSummary(items: CartItem[]) {
  const subtotalCents = items.reduce(
    (total, item) => total + item.product.priceCents * item.quantity,
    0,
  );
  const deliveryCents = 15000;

  return {
    subtotalCents,
    deliveryCents,
    totalCents: subtotalCents + deliveryCents,
  };
}
