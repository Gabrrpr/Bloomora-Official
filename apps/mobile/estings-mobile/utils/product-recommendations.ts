import type { CartItem, Product } from '@/constants/shop';

type ProductMetadata = Product & {
  featured?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  occasion?: string | null;
  occasions?: string[] | null;
  soldCount?: number;
  sold_count?: number;
  tags?: string[] | string | null;
  totalSold?: number;
};

type ScoredProduct = {
  product: Product;
  score: number;
};

const newArrivalWindowMs = 1000 * 60 * 60 * 24 * 30;

export function createRecommendationSeed() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function isActiveInStockProduct(product: Product) {
  const metadata = product as ProductMetadata;
  const isActive = metadata.isActive !== false;
  const stock = product.stock ?? 0;

  return isActive && stock > 0;
}

export function buildRelatedProductRecommendations({
  currentProduct,
  products,
  seed,
}: {
  currentProduct?: Product;
  products: Product[];
  seed: string;
}) {
  if (!currentProduct) {
    return buildDiscoveryProductOrder({ products, seed });
  }

  const candidates = products.filter((product) => product.id !== currentProduct.id && isActiveInStockProduct(product));
  const scoredProducts = candidates.map((product) => {
    const relevanceScore = getProductRelevanceScore(currentProduct, product);

    return {
      product,
      score: relevanceScore > 0 ? relevanceScore : getDiscoveryScore(product) * 0.45,
    };
  });

  return orderScoredProducts(scoredProducts, seed, 'related');
}

export function buildCartProductRecommendations({
  cartItems,
  products,
  seed,
}: {
  cartItems: CartItem[];
  products: Product[];
  seed: string;
}) {
  const cartProductIds = new Set(cartItems.map((item) => item.product.id));
  const candidates = products.filter((product) => !cartProductIds.has(product.id) && isActiveInStockProduct(product));

  if (cartItems.length === 0) {
    return buildDiscoveryProductOrder({ products: candidates, seed });
  }

  const cartProducts = cartItems.map((item) => item.product);
  const scoredProducts = candidates.map((product) => {
    const relevanceScore = cartProducts.reduce((total, cartProduct) => total + getProductRelevanceScore(cartProduct, product), 0);

    return {
      product,
      score: relevanceScore > 0 ? relevanceScore : getDiscoveryScore(product) * 0.45,
    };
  });

  return orderScoredProducts(scoredProducts, seed, 'cart');
}

export function buildDiscoveryProductOrder({
  products,
  seed,
}: {
  products: Product[];
  seed: string;
}) {
  const scoredProducts = products.filter(isActiveInStockProduct).map((product) => ({
    product,
    score: getDiscoveryScore(product),
  }));

  return orderScoredProducts(scoredProducts, seed, 'discovery');
}

function orderScoredProducts(scoredProducts: ScoredProduct[], seed: string, salt: string) {
  return [...scoredProducts]
    .sort((first, second) => {
      const firstBucket = Math.floor(first.score / 2);
      const secondBucket = Math.floor(second.score / 2);

      if (firstBucket !== secondBucket) {
        return secondBucket - firstBucket;
      }

      const scoreDifference = second.score - first.score;

      if (Math.abs(scoreDifference) > 2) {
        return scoreDifference;
      }

      return seededUnit(seed, `${salt}-${first.product.id}`) - seededUnit(seed, `${salt}-${second.product.id}`);
    })
    .map((item) => item.product);
}

function getProductRelevanceScore(sourceProduct: Product, candidateProduct: Product) {
  let score = 0;
  const sourceTags = getProductTags(sourceProduct);
  const candidateTags = getProductTags(candidateProduct);
  const sharedTags = countSharedValues(sourceTags, candidateTags);

  score += sharedTags * 4;

  if (sourceProduct.categoryId && sourceProduct.categoryId === candidateProduct.categoryId) {
    score += 8;
  } else if (
    normalizeValue(sourceProduct.categoryName) &&
    normalizeValue(sourceProduct.categoryName) === normalizeValue(candidateProduct.categoryName)
  ) {
    score += 8;
  }

  if (getProductOccasion(sourceProduct) && getProductOccasion(sourceProduct) === getProductOccasion(candidateProduct)) {
    score += 5;
  }

  score += getPriceSimilarityScore(sourceProduct.priceCents, candidateProduct.priceCents);
  score += getDescriptionSimilarityScore(sourceProduct.description, candidateProduct.description);

  if (candidateProduct.imageUrl) {
    score += 0.75;
  }

  if (candidateProduct.description?.trim()) {
    score += 0.5;
  }

  return score;
}

function getDiscoveryScore(product: Product) {
  const metadata = product as ProductMetadata;
  let score = 0;

  if (metadata.featured || metadata.isFeatured || /\b(featured|premium|highlight)\b/i.test(product.tag)) {
    score += 7;
  }

  if (metadata.isNew || /\b(new|arrival|fresh)\b/i.test(product.tag) || isRecentlyCreated(product.createdAt)) {
    score += 5;
  }

  if (product.imageUrl) {
    score += 3;
  }

  if (product.description?.trim()) {
    score += 2;
  }

  if (product.categoryName || product.productGroup || product.productType) {
    score += 1;
  }

  return score;
}

function getProductTags(product: Product) {
  const metadata = product as ProductMetadata;
  const rawTags = Array.isArray(metadata.tags)
    ? metadata.tags
    : typeof metadata.tags === 'string'
      ? metadata.tags.split(',')
      : [];

  return new Set(
    [
      product.tag,
      product.categoryName,
      product.productGroup,
      product.productType,
      getProductOccasion(product),
      ...rawTags,
    ]
      .map(normalizeValue)
      .filter(Boolean),
  );
}

function getProductOccasion(product: Product) {
  const metadata = product as ProductMetadata;
  const occasion = metadata.occasion ?? metadata.occasions?.[0] ?? null;

  return normalizeValue(occasion);
}

function getPriceSimilarityScore(sourcePrice: number, candidatePrice: number) {
  if (sourcePrice <= 0 || candidatePrice <= 0) {
    return 0;
  }

  const differenceRatio = Math.abs(sourcePrice - candidatePrice) / Math.max(sourcePrice, candidatePrice);

  if (differenceRatio <= 0.15) {
    return 4;
  }

  if (differenceRatio <= 0.3) {
    return 2.5;
  }

  if (differenceRatio <= 0.5) {
    return 1;
  }

  return 0;
}

function getDescriptionSimilarityScore(firstDescription?: string, secondDescription?: string) {
  const firstWords = getDescriptionTokens(firstDescription);
  const secondWords = getDescriptionTokens(secondDescription);

  if (firstWords.size === 0 || secondWords.size === 0) {
    return 0;
  }

  const sharedWords = countSharedValues(firstWords, secondWords);
  const unionSize = new Set([...firstWords, ...secondWords]).size;

  return Math.min((sharedWords / unionSize) * 8, 4);
}

function getDescriptionTokens(description?: string) {
  return new Set(
    (description ?? '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3),
  );
}

function countSharedValues(firstValues: Set<string>, secondValues: Set<string>) {
  let sharedCount = 0;

  firstValues.forEach((value) => {
    if (secondValues.has(value)) {
      sharedCount += 1;
    }
  });

  return sharedCount;
}

function isRecentlyCreated(createdAt?: string) {
  if (!createdAt) {
    return false;
  }

  const createdTime = new Date(createdAt).getTime();

  return Number.isFinite(createdTime) && Date.now() - createdTime <= newArrivalWindowMs;
}

function normalizeValue(value?: string | null) {
  return value?.trim().toLowerCase() ?? '';
}

function seededUnit(seed: string, value: string) {
  return (hashString(`${seed}:${value}`) % 10000) / 10000;
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash);
}
