import { apiFetch } from '@/services/api-client';

export const TERMS_KEY = '__terms__';
export const PRIVACY_KEY = '__privacy__';
export const ORDERING_KEY = '__ordering__';
export const FAQ_KEY = '__faq__';

export type HelpDocument = {
  docTitle: string;
  docSubtitle?: string;
  effectiveDate?: string;
  lastUpdated?: string;
  notice?: string;
  sections: { title: string; content: string }[];
};

export type FaqCategory = {
  category: string;
  id: string;
  items: { a: string; id: string; q: string }[];
};

type HelpSettings = Partial<Record<typeof TERMS_KEY | typeof PRIVACY_KEY | typeof ORDERING_KEY | typeof FAQ_KEY, unknown>>;

const docSubtitle = "Esting's Flowers International Inc.";
const effectiveDate = 'June 24, 2026';
const lastUpdated = 'June 2026';

export const fallbackDocuments: Record<'terms' | 'privacy' | 'ordering', HelpDocument> = {
  ordering: {
    docTitle: 'Ordering & Fulfillment Policy',
    docSubtitle,
    effectiveDate,
    lastUpdated,
    notice: "Esting's operates under strict business rules to ensure the freshness of perishable floral products and the security of transactions.",
    sections: [
      { title: '1. Pay-As-You-Order Policy', content: 'We follow a strict prepaid policy where all orders must be paid in full online before preparation and fulfillment begin. Cash on Delivery (COD) is not supported.' },
      { title: '2. Payment Methods', content: 'Digital payments are processed through PayMongo, supporting GCash, Maya, and major credit/debit cards. Bulk orders may require a formal quotation before a payment link is issued.' },
      { title: '3. Branch Selection', content: 'Customers must select either the Manila or Pampanga branch before ordering to ensure correct material availability and delivery fee calculation.' },
      { title: '4. Delivery Cutoffs', content: 'Orders placed before 12:00 PM are eligible for same-day delivery. Orders received after this time are automatically scheduled for the next day.' },
      { title: '5. Fulfillment Schedule', content: 'While customers select a delivery date, exact delivery times cannot be guaranteed and will occur within the day.' },
      { title: '6. Cancellations and Refunds', content: 'Due to the perishable nature of flowers, all sales are final once a product has been paid for.' },
      { title: '7. Exchanges for Quality Issues', content: 'Replacements are only permitted if a product arrives in poor condition. Users must provide photographic or video proof immediately upon receipt.' },
      { title: '8. Address Accuracy', content: 'The customer is responsible for providing a complete and accurate delivery address. Failed deliveries caused by incorrect details may require additional fees.' },
    ],
  },
  privacy: {
    docTitle: 'Data Privacy Policy',
    docSubtitle,
    effectiveDate,
    lastUpdated,
    notice: "At Esting's, we are committed to protecting your privacy and handling personal data in accordance with Republic Act No. 10173.",
    sections: [
      { title: '1. Information Collection', content: 'We collect profile details, delivery information, and transaction details needed to process orders and provide support.' },
      { title: '2. Purpose of Data Processing', content: 'Your data is used for order fulfillment, payment verification, customer support, personalization, and operations analytics.' },
      { title: '3. Data Retention', content: 'Esting\'s retains personal information for up to five years from your last account activity or successful order completion, unless a longer period is required by law.' },
      { title: '4. Third-Party Sharing', content: 'We only share information with authorized partners necessary for service delivery, including payment and logistics providers.' },
      { title: '5. Your Rights', content: 'Under the Data Privacy Act, you may request access, correction, or deactivation of your account information through customer support.' },
    ],
  },
  terms: {
    docTitle: 'Terms & Conditions',
    docSubtitle,
    effectiveDate,
    lastUpdated,
    notice: "By accessing the Esting's web or mobile application, you agree to these terms, governed by the laws of the Republic of the Philippines.",
    sections: [
      { title: '1. Account Registration', content: 'Access to premium features may require a registered account. You are responsible for keeping your login credentials confidential.' },
      { title: '2. Intellectual Property', content: "All designs, catalog images, and Esting's branding are the exclusive property of Esting's Flowers International Inc." },
      { title: '3. Customization Disclaimer', content: 'AI concept previews are approximations for visualization only. Natural variations in flowers are expected and do not constitute a defect.' },
      { title: '4. Platform Pricing', content: 'Product prices displayed on digital platforms may include adjustments that cover digital infrastructure, tools, and secure payment processing.' },
      { title: '5. Administrative Rights', content: 'The shop administrator may disable customization features during peak seasons or high-volume periods.' },
      { title: '6. Acceptable Use', content: 'Users must not submit offensive content or place fraudulent orders intended to harass recipients or disrupt operations.' },
    ],
  },
};

export const fallbackFaqs: FaqCategory[] = [
  {
    id: 'cat-general',
    category: 'General',
    items: [
      { id: 'q-1', q: "How long has Esting's Flowers been in business?", a: "Esting's Flowers International Inc. was established in 1959." },
      { id: 'q-2', q: 'Where are your branches located?', a: 'We have branches in Sampaloc, Manila and San Fernando, Pampanga.' },
      { id: 'q-3', q: 'Do you accept international orders?', a: 'Yes. We accept orders from customers anywhere in the world for deliveries within the Philippines.' },
    ],
  },
  {
    id: 'cat-ordering',
    category: 'Ordering',
    items: [
      { id: 'q-4', q: 'Can I order in bulk?', a: 'Yes. The platform includes a Quotation Feature for bulk arrangement inquiries and pricing.' },
      { id: 'q-5', q: 'How do I track my order?', a: 'You can monitor each stage from My Orders in the mobile app.' },
    ],
  },
  {
    id: 'cat-payments',
    category: 'Payments',
    items: [
      { id: 'q-6', q: 'Do you offer Cash on Delivery?', a: 'No. Esting\'s follows a strict pay-as-you-order policy.' },
      { id: 'q-7', q: 'What payment methods do you accept?', a: 'PayMongo supports GCash, Maya, and major credit or debit cards.' },
    ],
  },
];

export async function getHelpSettings() {
  const settings = await apiFetch<HelpSettings | string>('/products/admin/settings/homepage');
  if (typeof settings === 'string') {
    try {
      const parsed = JSON.parse(settings) as HelpSettings;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return settings && typeof settings === 'object' ? settings : {};
}

export async function getHelpDocument(slug: 'terms' | 'privacy' | 'ordering') {
  const settings = await getHelpSettings();
  const key = slug === 'terms' ? TERMS_KEY : slug === 'privacy' ? PRIVACY_KEY : ORDERING_KEY;
  return normalizeDocument(settings[key], fallbackDocuments[slug]);
}

export async function getFaqCategories() {
  const settings = await getHelpSettings();
  return normalizeFaqs(settings[FAQ_KEY], fallbackFaqs);
}

function normalizeDocument(value: unknown, fallback: HelpDocument): HelpDocument {
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<HelpDocument>;
  const sections = Array.isArray(candidate.sections)
    ? candidate.sections
        .map((section) => ({
          title: String(section?.title ?? '').trim(),
          content: String(section?.content ?? '').trim(),
        }))
        .filter((section) => section.title || section.content)
    : [];
  if (sections.length === 0) return fallback;
  return {
    docTitle: candidate.docTitle?.trim() || fallback.docTitle,
    docSubtitle: candidate.docSubtitle?.trim() || fallback.docSubtitle,
    effectiveDate: candidate.effectiveDate?.trim() || fallback.effectiveDate,
    lastUpdated: candidate.lastUpdated?.trim() || fallback.lastUpdated,
    notice: candidate.notice?.trim() || fallback.notice,
    sections,
  };
}

function normalizeFaqs(value: unknown, fallback: FaqCategory[]) {
  if (!Array.isArray(value)) return fallback;
  const categories = value
    .map((category, categoryIndex) => {
      const source = category as Partial<FaqCategory>;
      const items = Array.isArray(source.items)
        ? source.items
            .map((item, itemIndex) => ({
              id: String(item?.id || `q-${categoryIndex}-${itemIndex}`),
              q: String(item?.q ?? '').trim(),
              a: String(item?.a ?? '').trim(),
            }))
            .filter((item) => item.q || item.a)
        : [];
      return {
        id: String(source.id || `cat-${categoryIndex}`),
        category: String(source.category || 'General').trim(),
        items,
      };
    })
    .filter((category) => category.items.length > 0);
  return categories.length > 0 ? categories : fallback;
}
