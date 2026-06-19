import { useState, useEffect } from "react"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api"
import estingsLogo from "../../assets/Estings.svg"

const G  = "#2E8B34"
const DG = "#0C573E"

// Legal content is stored in the shared settings blob under this key. If nothing
// is published yet (or the fetch fails), the FALLBACK below is shown — it is the
// original hard-coded Terms, so the page is never blank.
const SETTINGS_PATH = "/products/admin/settings/homepage"
const TERMS_KEY = "__terms__"

const FALLBACK = {
  docTitle: "Terms & Conditions",
  docSubtitle: "Bloomora Floral Management System",
  effectiveDate: "January 1, 2025",
  lastUpdated: "April 2025",
  notice: "Please read these Terms carefully before using Bloomora's platform. By accessing or using our services, you agree to be bound by these terms.",
  sections: [
    { title: "1. Acceptance of Terms", content: "By creating an account or accessing any part of the Bloomora Floral Management System, you confirm that you are at least 18 years of age and agree to comply with and be bound by these Terms and Conditions. If you do not agree, please do not use our platform." },
    { title: "2. About Bloomora", content: "Bloomora, operating under Esting's Flower International Inc., is a digital platform providing floral arrangement management, ordering, and delivery coordination services. We connect customers with premium floral products and enable administrators to manage inventory, orders, and customer relationships." },
    { title: "3. Account Registration", content: "To access certain features of the platform, you must register for an account. You agree to provide accurate and complete information during registration, maintain the security of your password, accept all risks of unauthorized access, and promptly notify us of any unauthorized use. Bloomora reserves the right to terminate accounts that violate these provisions." },
    { title: "4. Products and Ordering", content: "All floral products displayed on our platform are subject to availability. We reserve the right to limit quantities or discontinue products at any time. Product colors, sizes, and arrangements may vary slightly from photographs shown. Pricing is subject to change without notice. All orders are subject to acceptance and availability confirmation." },
    { title: "5. Payment Terms", content: "Payment is required at the time of order placement. We accept major credit and debit cards and other specified payment methods. All transactions are processed securely. Prices are listed in the applicable local currency and include applicable taxes unless stated otherwise." },
    { title: "6. Delivery and Fulfillment", content: "Delivery times are estimates and not guaranteed. While we strive to deliver orders on time, factors such as weather, traffic, or other unforeseen circumstances may cause delays. For time-sensitive occasions, we recommend ordering well in advance." },
    { title: "7. Cancellations and Refunds", content: "Orders may be cancelled within 2 hours of placement for a full refund. After this window, cancellation may not be possible as preparation may have already begun. Refunds for damaged or incorrect orders will be issued after review. The perishable nature of floral products means returns may not always be possible — instead, we may offer a replacement or store credit." },
    { title: "8. Privacy Policy", content: "Your privacy is important to us. We collect and process personal information in accordance with our Privacy Policy. We use your information to process orders, improve our services, and communicate with you about your account and offerings. We do not sell your personal information to third parties." },
    { title: "9. Intellectual Property", content: "All content on the Bloomora platform, including logos, images, text, and software, is the exclusive property of Bloomora or its content suppliers and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission." },
    { title: "10. Limitation of Liability", content: "To the maximum extent permitted by law, Bloomora shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of the platform. Our total liability shall not exceed the amount paid by you for the specific order giving rise to the claim." },
    { title: "11. Modifications to Terms", content: "Bloomora reserves the right to modify these Terms at any time. We will notify registered users of significant changes via email or through the platform. Continued use of the platform after changes become effective constitutes your acceptance of the revised Terms." },
    { title: "12. Contact Information", content: "If you have questions about these Terms and Conditions, please contact us at legal@bloomora.com or through our customer support portal. We are committed to addressing your concerns in a timely manner." },
  ],
}

export default function TermsAndConditions({ onNavigate, onBack }) {
  const { isDark } = useTheme()

  // CMS content — starts as fallback, replaced if a saved version exists
  const [doc, setDoc] = useState(FALLBACK)

  useEffect(() => {
    let cancelled = false
    api.get(SETTINGS_PATH)
      .then(parsed => {
        if (cancelled) return
        const saved = parsed?.[TERMS_KEY]
        if (saved && typeof saved === "object" && Array.isArray(saved.sections) && saved.sections.length > 0) {
          setDoc({
            docTitle:      saved.docTitle      || FALLBACK.docTitle,
            docSubtitle:   saved.docSubtitle   || FALLBACK.docSubtitle,
            effectiveDate: saved.effectiveDate || FALLBACK.effectiveDate,
            lastUpdated:   saved.lastUpdated   || FALLBACK.lastUpdated,
            notice:        saved.notice        || FALLBACK.notice,
            sections:      saved.sections.map(s => ({ title: s?.title || "", content: s?.content || "" })),
          })
        }
      })
      .catch(() => { /* keep fallback */ })
    return () => { cancelled = true }
  }, [])

  // Page
  const pageBg = isDark ? "#0f172a" : "#f8fafc"

  // Sticky header
  const headerBg  = isDark ? "#1a2332" : "white"
  const headerBdr = isDark ? "#1e293b" : "#f1f5f9"
  const backC     = isDark ? "#94a3b8" : "#4b5563"
  const backHov   = isDark ? "#f1f5f9" : "#111827"

  // Card
  const cardBg    = isDark ? "#1a2332" : "white"
  const cardBdr   = isDark ? "#1e293b" : "#e5e7eb"
  const cardShadow= isDark ? "0 4px 32px rgba(0,0,0,0.4)" : "0 1px 3px rgba(0,0,0,0.06)"

  // Text
  const bodyC     = isDark ? "#cbd5e1" : "#4b5563"
  const sectionHC = isDark ? "#f1f5f9" : "#1e293b"
  const divC      = isDark ? "#1e293b" : "#f0f0f0"
  const footerC   = isDark ? "#475569" : "#9ca3af"

  // Notice box
  const noteBg  = isDark ? "rgba(251,191,36,0.1)"  : "#fefce8"
  const noteBdr = isDark ? "rgba(251,191,36,0.3)"  : "#fde68a"
  const noteTxt = isDark ? "#fcd34d"               : "#92400e"

  const logoStyle = isDark ? { filter:"brightness(0) invert(1)" } : {}

  return (
    <div className="min-h-screen" style={{ backgroundColor:pageBg }}>
      <style>{`@keyframes pageRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}`}</style>

      {/* Sticky top bar */}
      <div className="sticky top-0 z-10" style={{ backgroundColor:headerBg, borderBottom:`1px solid ${headerBdr}` }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack || (() => window.history.back())}
            className="flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{ color:backC }}
            onMouseEnter={e => e.currentTarget.style.color=backHov}
            onMouseLeave={e => e.currentTarget.style.color=backC}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Back
          </button>

          <img src={estingsLogo} alt="Esting's" className="h-8" style={logoStyle}/>

          <div className="w-14"/>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="rounded-2xl overflow-hidden"
          style={{ backgroundColor:cardBg, border:`1px solid ${cardBdr}`, boxShadow:cardShadow, animation:"pageRise 0.6s ease 0.1s both" }}>

          {/* Hero band */}
          <div style={{ background:`linear-gradient(135deg,${DG} 0%,${G} 100%)`, padding:"clamp(28px,6vw,48px) clamp(20px,5vw,40px)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor:"rgba(255,255,255,0.15)" }}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color:"#86efac" }}>Legal Document</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{doc.docTitle}</h1>
            <p style={{ color:"rgba(255,255,255,0.72)", fontSize:"14px" }}>{doc.docSubtitle}</p>
            <div className="flex flex-wrap items-center gap-3 mt-4 text-xs" style={{ color:"rgba(255,255,255,0.52)" }}>
              {doc.effectiveDate && <span>Effective Date: {doc.effectiveDate}</span>}
              {doc.effectiveDate && doc.lastUpdated && <span>•</span>}
              {doc.lastUpdated && <span>Last Updated: {doc.lastUpdated}</span>}
            </div>
          </div>

          {/* Body */}
          <div className="px-5 sm:px-8 py-8 sm:py-10 space-y-7">

            {doc.notice && (
              <div className="p-4 rounded-xl text-sm font-medium" style={{ backgroundColor:noteBg, border:`1px solid ${noteBdr}`, color:noteTxt }}>
                {doc.notice}
              </div>
            )}

            {doc.sections.map(({ title, content }, i) => (
              <section key={i}>
                <h2 className="text-base font-bold mb-3 pb-2" style={{ color:sectionHC, borderBottom:`1px solid ${divC}` }}>
                  {title}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color:bodyC }}>
                  {content}
                </p>
              </section>
            ))}

            {/* Footer */}
            <div className="pt-4 flex items-center justify-center gap-2" style={{ borderTop:`1px solid ${divC}` }}>
              <img src={estingsLogo} alt="Esting's" className="h-5" style={logoStyle}/>
              <p className="text-xs" style={{ color:footerC }}>© 2025 Esting's Flower International Inc. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}