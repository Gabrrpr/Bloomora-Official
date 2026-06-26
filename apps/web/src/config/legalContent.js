// ─────────────────────────────────────────────────────────────────────────────
// Shared legal content. These objects are the DEFAULTS / FALLBACKS used by both
// the public legal pages and the Admin → Legal CMS editor, so editing the copy
// in one place keeps the admin defaults and the public fallbacks in sync.
//
// Once an admin saves changes, the saved version (stored in the settings blob
// under the keys below) overrides these defaults on the public pages.
// ─────────────────────────────────────────────────────────────────────────────

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
  notice: "At Esting's, we are committed to protecting your privacy and ensuring your personal data is handled with the highest level of security. This policy outlines our practices regarding data collection and processing in strict adherence to Republic Act No. 10173 (Data Privacy Act of 2012).",
  sections: [
    { title: "1. Information Collection", content: "To facilitate our floral services, we collect the following data: User Profile — full name, valid email address, birth date, and contact number provided during registration; Logistics Data — precise delivery addresses and GPS coordinates for fulfillment; Transaction Details — items purchased, total amounts, and payment status (note: Esting's does not store full credit card numbers; these are handled by our secure payment partner)." },
    { title: "2. Purpose of Data Processing", content: "Your data is used to provide and improve our services: Fulfillment — verifying payments through the PayMongo API and coordinating delivery via the Lalamove API; Personalisation — powering the Two-Way Customization engine and providing tailored arrangement recommendations; Support — managing inquiries and replacement requests through the Communication and Feedback Module; Analytics — generating demand forecasts and reports to optimize our floral inventory and seasonal offerings." },
    { title: "3. Data Retention", content: "Esting's retains personal information for a period of five (5) years from the date of your last account activity or successful order completion. This period ensures compliance with Philippine commercial and tax auditing standards and facilitates historical record retrieval for returning customers. Upon expiration, all data is securely deleted or anonymised." },
    { title: "4. Third-Party Sharing", content: "We only share information with authorized partners necessary for service delivery: PayMongo for secure digital payment processing, and Lalamove or our in-house riders for real-time tracking and delivery fulfillment." },
    { title: "5. Your Rights", content: "Under the Data Privacy Act, you have the right to access, rectify, or request the deactivation of your account through the Account Management Module." },
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
  notice: "Bloomora uses cookies — small text files stored on your device — to provide personalized floral services, ensure secure transactions, and analyze platform performance.",
  sections: [
    { title: "1. Purpose", content: "Bloomora uses cookies — small text files stored on your device — to provide personalized floral services, ensure secure transactions, and analyze platform performance." },
    { title: "2. Core Uses", content: "Authentication & Security — to recognize your account and prevent unauthorized access or malicious activity. Preferences & Customization — to remember your branch selection (Manila or Pampanga) and preserve your AI-driven Two-Way Customization inputs. Shopping Cart — to track floral arrangements and supplies as you browse, ensuring they remain saved until checkout. Operations Analytics — to collect data for the Sales Visualization Module, helping us identify seasonal trends and best-selling products." },
    { title: "3. Third-Party Cookies", content: "We utilize specialized third-party services that may set cookies: Payments — the PayMongo API facilitates secure digital payment processing; Logistics — the Lalamove API supports real-time delivery tracking and distance-based fee calculations; Generative AI — Pollinations.ai and the Flux Generative AI Model manage data to render visual previews of your custom designs." },
    { title: "4. Management & Compliance", content: "You may disable cookies through your browser, though this will limit your ability to use personalization features or complete purchases. This policy is aligned with the Data Privacy Act of 2012 (RA 10173) of the Philippines." },
  ],
}
