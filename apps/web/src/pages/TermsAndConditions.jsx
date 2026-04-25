import estingsLogo from "../assets/estings.svg"

export default function TermsAndConditions({ onNavigate, onBack }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack || (() => window.history.back())}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          {/* Green Esting's SVG logo in the centre */}
          <img src={estingsLogo} alt="Esting's" className="h-8" />

          <div className="w-16" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Hero */}
          <div className="bg-gradient-to-br from-green-700 to-green-900 px-8 py-10 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-green-200 text-sm font-medium tracking-wide uppercase">Legal Document</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Terms &amp; Conditions</h1>
            <p className="text-green-100 text-sm">Bloomora Floral Management System</p>
            <div className="flex items-center gap-4 mt-4 text-xs text-green-200">
              <span>Effective Date: January 1, 2025</span>
              <span>•</span>
              <span>Last Updated: April 2025</span>
            </div>
          </div>

          <div className="px-8 py-10 space-y-8 text-sm leading-relaxed text-gray-600">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
              <strong>Please read these Terms and Conditions carefully</strong> before using Bloomora's platform. By accessing or using our services, you agree to be bound by these terms.
            </div>

            {[
              {
                title: "1. Acceptance of Terms",
                content: `By creating an account or accessing any part of the Bloomora Floral Management System ("Platform"), you confirm that you are at least 18 years of age and agree to comply with and be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our Platform.`,
              },
              {
                title: "2. About Bloomora",
                content: `Bloomora (operating under "Esting's Flower International Inc.") is a digital platform providing floral arrangement management, ordering, and delivery coordination services. We connect customers with premium floral products and enable administrators to manage inventory, orders, and customer relationships.`,
              },
              {
                title: "3. Account Registration",
                content: `To access certain features of the Platform, you must register for an account. You agree to: (a) provide accurate, current, and complete information during registration; (b) maintain the security of your password and accept all risks of unauthorized access to your account; (c) promptly notify us of any unauthorized use of your account; and (d) not create accounts using automated methods or false identities. Bloomora reserves the right to terminate accounts that violate these provisions.`,
              },
              {
                title: "4. Products and Ordering",
                content: `All floral products displayed on our Platform are subject to availability. We reserve the right to limit quantities or discontinue products at any time. Product colors, sizes, and arrangements may vary slightly from photographs shown. Pricing is subject to change without notice. All orders are subject to acceptance and availability confirmation.`,
              },
              {
                title: "5. Payment Terms",
                content: `Payment is required at the time of order placement. We accept major credit/debit cards and other specified payment methods. All transactions are processed securely. Prices are listed in the applicable local currency and include applicable taxes unless stated otherwise. We are not responsible for any additional bank charges or fees.`,
              },
              {
                title: "6. Delivery and Fulfillment",
                content: `Delivery times are estimates and not guaranteed. While we strive to deliver orders on time, factors such as weather, traffic, or other unforeseen circumstances may cause delays. For time-sensitive occasions, we recommend ordering well in advance. Delivery is subject to our service coverage area. We will make reasonable efforts to contact you if delivery cannot be completed.`,
              },
              {
                title: "7. Cancellations and Refunds",
                content: `Orders may be cancelled within 2 hours of placement for a full refund. After this window, cancellation may not be possible as preparation may have already begun. Refunds for damaged or incorrect orders will be issued after review. The perishable nature of floral products means returns may not always be possible; instead, we may offer a replacement or store credit.`,
              },
              {
                title: "8. Privacy Policy",
                content: `Your privacy is important to us. We collect and process personal information in accordance with our Privacy Policy, which is incorporated into these Terms by reference. We use your information to process orders, improve our services, and communicate with you about your account and our offerings. We do not sell your personal information to third parties.`,
              },
              {
                title: "9. Intellectual Property",
                content: `All content on the Bloomora Platform, including logos, images, text, and software, is the exclusive property of Bloomora or its content suppliers and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.`,
              },
              {
                title: "10. Limitation of Liability",
                content: `To the maximum extent permitted by law, Bloomora shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of the Platform. Our total liability for any claim arising from these Terms shall not exceed the amount paid by you for the specific order giving rise to the claim.`,
              },
              {
                title: "11. Modifications to Terms",
                content: `Bloomora reserves the right to modify these Terms at any time. We will notify registered users of significant changes via email or through the Platform. Continued use of the Platform after changes become effective constitutes your acceptance of the revised Terms.`,
              },
              {
                title: "12. Contact Information",
                content: `If you have questions about these Terms and Conditions, please contact us at: legal@bloomora.com or through our customer support portal. We are committed to addressing your concerns in a timely manner.`,
              },
            ].map(({ title, content }) => (
              <section key={title}>
                <h2 className="text-base font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">{title}</h2>
                <p>{content}</p>
              </section>
            ))}

            <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-2">
              <img src={estingsLogo} alt="Esting's" className="h-5" />
              <p className="text-xs text-gray-400">© 2025 Esting's Flower International Inc. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
