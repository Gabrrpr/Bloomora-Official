import { useState, useEffect } from "react"
import { useTheme } from "../context/ThemeContext"
import { api } from "../services/api"
import estingsLogo from "../assets/Estings.svg"

const G  = "#2E8B34"
const DG = "#0C573E"

// Privacy content is stored in the shared settings blob under this key. If nothing
// is published yet (or the fetch fails), the FALLBACK below is shown — a Data
// Privacy Act (RA 10173) oriented default, so the page is never blank.
const SETTINGS_PATH = "/products/admin/settings/homepage"
const PRIVACY_KEY = "__privacy__"

const FALLBACK = {
  docTitle: "Privacy Policy",
  docSubtitle: "Bloomora Floral Management System",
  effectiveDate: "January 1, 2025",
  lastUpdated: "April 2025",
  notice: "This Privacy Policy explains how Bloomora collects, uses, and protects your personal information in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173).",
  sections: [
    { title: "1. Introduction", content: "Bloomora, operating under Esting's Flower International Inc., respects your right to privacy and is committed to protecting the personal information you share with us. This Privacy Policy describes how we collect, use, store, and disclose your personal data when you use our platform, in compliance with Republic Act No. 10173 (the Data Privacy Act of 2012) and its implementing rules and regulations." },
    { title: "2. Information We Collect", content: "We collect information you provide directly, such as your name, email address, phone number, delivery address, and payment details when you register an account or place an order. We also automatically collect technical information such as your device type, browser, and usage data to improve our services." },
    { title: "3. How We Use Your Information", content: "We use your personal information to process and fulfill your orders, coordinate delivery, communicate with you about your account and purchases, provide customer support, improve our platform, and comply with legal obligations. We process your data only for purposes that are legitimate and clearly stated." },
    { title: "4. Legal Basis for Processing", content: "We process your personal information based on your consent, the necessity of fulfilling our contract with you, compliance with legal obligations, and our legitimate interests as a business, consistent with the Data Privacy Act of 2012." },
    { title: "5. Disclosure of Information", content: "We do not sell your personal information. We may share your data with trusted service providers who assist us in operating our platform and delivering orders, such as payment processors and delivery partners. These parties are bound to protect your information and use it only for the purposes we specify." },
    { title: "6. Data Storage and Security", content: "We implement appropriate organizational, physical, and technical security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. We retain your data only for as long as necessary to fulfill the purposes outlined in this policy or as required by law." },
    { title: "7. Your Rights as a Data Subject", content: "Under the Data Privacy Act of 2012, you have the right to be informed, to access your personal data, to object to processing, to request correction of inaccurate data, to request erasure or blocking, to data portability, and to file a complaint with the National Privacy Commission. You may exercise these rights by contacting us." },
    { title: "8. Cookies and Tracking", content: "Our platform uses cookies and similar technologies to enhance your experience, remember your preferences, and analyze usage. You may control cookies through your browser settings, though disabling them may affect certain features of the platform." },
    { title: "9. Children's Privacy", content: "Our platform is intended for users who are at least 18 years of age. We do not knowingly collect personal information from minors. If we become aware that we have collected data from a minor without proper consent, we will take steps to delete it." },
    { title: "10. Changes to This Policy", content: "We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of significant changes through the platform or by email. Continued use of our services after changes take effect constitutes acceptance of the updated policy." },
    { title: "11. Contact Us", content: "If you have questions about this Privacy Policy or wish to exercise your data privacy rights, please contact our Data Protection Officer at privacy@bloomora.com or through our customer support portal." },
  ],
}

export default function PrivacyPolicy({ onNavigate, onBack }) {
  const { isDark } = useTheme()

  // CMS content — starts as fallback, replaced if a saved version exists
  const [doc, setDoc] = useState(FALLBACK)

  useEffect(() => {
    let cancelled = false
    api.get(SETTINGS_PATH)
      .then(parsed => {
        if (cancelled) return
        const saved = parsed?.[PRIVACY_KEY]
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