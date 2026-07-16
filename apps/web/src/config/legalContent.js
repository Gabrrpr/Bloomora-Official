// Shared legal content. These objects are the DEFAULTS / FALLBACKS used by both
// the public legal pages and the Admin > Legal CMS editor, so editing the copy
// in one place keeps the admin defaults and the public fallbacks in sync.
//
// Once an admin saves changes, the saved version (stored in the settings blob
// under the keys below) overrides these defaults on the public pages.

export const SETTINGS_PATH = "/products/admin/settings/homepage"

export const TERMS_KEY    = "__terms__"
export const PRIVACY_KEY   = "__privacy__"
export const ORDERING_KEY  = "__ordering__"
export const COOKIE_KEY     = "__cookie__"

const SUBTITLE = "Esting's Flowers International Inc."
const EFFECTIVE = "June 24, 2026"
const UPDATED = "June 2026"

export const DEFAULT_TERMS = {
  docTitle: "Terms & Conditions",
  docSubtitle: SUBTITLE,
  effectiveDate: EFFECTIVE,
  lastUpdated: UPDATED,
  notice: "By accessing the Esting's web or mobile application, you agree to the following terms, governed by the laws of the Republic of the Philippines. Esting's is the official digital commerce platform of Esting's Flowers International Inc.",
  sections: [
    { title: "1. Account Registration", content: "Access to premium features, specifically the AI Concept Previews, is restricted to registered users. You are responsible for maintaining the confidentiality of your login credentials and for all activities occurring under your account." },
    { title: "2. Intellectual Property", content: "All designs, floral catalog images, and the Esting's Flowers rose logo (established in 1959) are the exclusive property of Esting's Flowers International Inc." },
    { title: "3. Two-Way Customization Disclaimer", content: "The AI Concept Previews generated via the Flux model are high-fidelity approximations intended for visualization only. Because flowers are organic materials, natural variations in shade, size, and bloom stage are expected and do not constitute a defect." },
    { title: "4. Platform Pricing", content: "Users acknowledge that product prices displayed on Esting's platforms include a 10% markup compared to face-to-face transactions at physical branch locations. This adjustment covers digital infrastructure, AI tools, and secure payment processing." },
    { title: "5. Administrative Rights", content: "The shop administrator reserves the right to disable customization features during peak seasons (e.g., Valentine's Day) or large order influxes to maintain operational efficiency." },
    { title: "6. Acceptable Use", content: "Users must not input offensive or inappropriate language into the AI customization engine. Esting's maintains a zero-tolerance policy for \"bogus orders\" intended to harass or distress recipients." },
  ],
}

export const DEFAULT_PRIVACY = {
  docTitle: "Data Privacy Policy",
  docSubtitle: SUBTITLE,
  effectiveDate: EFFECTIVE,
  lastUpdated: UPDATED,
  notice: "At Esting's Flowers International Inc., we value the privacy and security of our customers' personal information. This policy explains how Bloomora collects, uses, stores, and shares personal data in accordance with Republic Act No. 10173, also known as the Data Privacy Act of 2012.",
  sections: [
    { title: "1. Information Collection", content: "To provide our floral services, Bloomora may collect the following information: User Profile - full name, email address, birth date, and contact number provided during registration; Logistics Data - delivery address, delivery instructions, and GPS or location details needed for order fulfillment; Transaction Details - ordered items, total amount, payment status, order history, and related transaction records. Bloomora does not store full credit card details, as payment processing is handled by authorized payment partners." },
    { title: "2. Purpose of Data Processing", content: "The collected data is used for the following purposes: Order Fulfillment - to process orders, verify payments through PayMongo, and coordinate delivery through Lalamove or in-house riders; Personalization - to support the Two-Way Customization feature and provide arrangement recommendations based on customer preferences; Customer Support - to manage inquiries, order concerns, replacement requests, and feedback through the Communication and Feedback Module; Analytics and Forecasting - to generate sales reports, demand forecasts, and inventory insights that help improve product availability and seasonal planning." },
    { title: "3. Data Retention", content: "Bloomora retains personal information only for as long as necessary to fulfill business, legal, accounting, and operational purposes. Customer records may be kept for up to five (5) years from the user's last account activity or successful order completion, unless a longer period is required by law or for legitimate business reasons. After the retention period, personal data will be securely deleted, anonymized, or archived in accordance with applicable policies." },
    { title: "4. Third-Party Sharing", content: "Bloomora only shares necessary information with authorized service providers involved in completing customer transactions. These may include PayMongo for secure digital payment processing and Lalamove or in-house riders for delivery fulfillment and tracking. Personal data is not sold or shared with unrelated third parties." },
    { title: "5. Your Rights", content: "Under the Data Privacy Act of 2012, users have the right to be informed, access their personal data, request correction of inaccurate information, object to or withdraw consent where applicable, request blocking, removal, or destruction of personal data when legally justified, and file a complaint with the National Privacy Commission. Users may exercise these rights through the Account Management Module or by contacting Esting's Flowers International Inc. through the available support channels in Bloomora." },
  ],
}

export const DEFAULT_ORDERING = {
  docTitle: "Ordering & Fulfillment Policy",
  docSubtitle: SUBTITLE,
  effectiveDate: EFFECTIVE,
  lastUpdated: UPDATED,
  notice: "Esting's operates under strict business rules to ensure the freshness of perishable floral products and the security of transactions.",
  sections: [
    { title: "1. Pay-As-You-Order Policy", content: "We follow a strict prepaid policy where all orders must be paid in full online before preparation and fulfillment begin. Cash on Delivery (COD) is not supported to prevent fraudulent \"bogus\" orders." },
    { title: "2. Payment Methods", content: "Digital payments are processed through the PayMongo API, supporting GCash, Maya, and major credit/debit cards. Bulk orders may require a formal quotation and administrative approval before a payment link is issued." },
    { title: "3. Branch Selection", content: "Customers must explicitly select either the Manila or Pampanga branch before ordering to ensure correct material availability and delivery fee calculation." },
    { title: "4. Delivery Cutoffs", content: "Orders placed before 12:00 PM (Noon) are eligible for same-day delivery. Orders received after this time are automatically scheduled for the next day, though the shop may attempt to accommodate late requests depending on current volume." },
    { title: "5. Fulfillment Schedule", content: "While customers select a delivery date, exact delivery times cannot be guaranteed and will occur \"within the day\"." },
    { title: "6. Cancellations and Refunds", content: "Due to the perishable nature of flowers, all sales are final. Cancellations or cash refunds are not permitted once a product has been paid for." },
    { title: "7. Exchanges for Quality Issues", content: "Replacements are only permitted if a product arrives in poor condition. To qualify, users must provide photographic or video proof of the damaged item via the Communication and Feedback Module immediately upon receipt." },
    { title: "8. Address Accuracy", content: "The customer is responsible for providing a complete and accurate delivery address; delays or failures caused by incorrect pinning may result in additional re-delivery fees." },
  ],
}

export const DEFAULT_COOKIE = {
  docTitle: "Cookie Policy",
  docSubtitle: SUBTITLE,
  effectiveDate: EFFECTIVE,
  lastUpdated: UPDATED,
  notice: "Bloomora uses cookies - small text files stored on your device - to provide personalized floral services, ensure secure transactions, and analyze platform performance.",
  sections: [
    { title: "1. Purpose", content: "Bloomora uses cookies - small text files stored on your device - to provide personalized floral services, ensure secure transactions, and analyze platform performance." },
    { title: "2. Core Uses", content: "Authentication & Security - to recognize your account and prevent unauthorized access or malicious activity. Preferences & Customization - to remember your branch selection (Manila or Pampanga) and preserve your AI-driven Two-Way Customization inputs. Shopping Cart - to track floral arrangements and supplies as you browse, ensuring they remain saved until checkout. Operations Analytics - to collect data for the Sales Visualization Module, helping us identify seasonal trends and best-selling products." },
    { title: "3. Third-Party Cookies", content: "We utilize specialized third-party services that may set cookies: Payments - the PayMongo API facilitates secure digital payment processing; Logistics - the Lalamove API supports real-time delivery tracking and distance-based fee calculations; Generative AI - Pollinations.ai and the Flux Generative AI Model manage data to render visual previews of your custom designs." },
    { title: "4. Management & Compliance", content: "You may disable cookies through your browser, though this will limit your ability to use personalization features or complete purchases. This policy is aligned with the Data Privacy Act of 2012 (RA 10173) of the Philippines." },
  ],
}
