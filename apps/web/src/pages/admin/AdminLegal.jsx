import { useState, useEffect } from "react"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api.js"

const G  = "#2E8B34"
const DG = "#0C573E"

// Legal content is stored inside the same settings blob the homepage uses,
// under these dedicated keys. Keeping the key names here in one place means
// that if a standalone settings endpoint is added later, only this constant
// and the two api paths below need to change.
const SETTINGS_PATH = "/products/admin/settings/homepage"
const TERMS_KEY   = "__terms__"
const PRIVACY_KEY = "__privacy__"

// ── Default content (used as the fallback when nothing is saved yet) ──────────
// Terms mirrors the existing public Terms page; Privacy is a Data Privacy Act
// (RA 10173) oriented starting point the admin can edit freely.
const DEFAULT_TERMS = {
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

const DEFAULT_PRIVACY = {
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

// ─── tokens (same system as the rest of admin) ───────────────────────────────
function useTokens(isDark) {
  if (isDark) return {
    surfaceBg: "#1e293b", surfaceAlt: "#162032",
    cardBg: "#1e293b", cardBorder: "#334155",
    cardShadow: "0 2px 8px rgba(0,0,0,0.4)",
    inputBg: "#0f172a", inputBorder: "#475569",
    divider: "#334155", hoverBg: "#2d3f55",
    textPrimary: "#f1f5f9", textSecondary: "#cbd5e1", textMuted: "#94a3b8",
    accentG: "#4ade80", badgeBg: "#1a2d42",
    dangerBg: "rgba(239,68,68,0.1)", dangerColor: "#f87171",
    noteBg: "rgba(251,191,36,0.1)", noteBdr: "rgba(251,191,36,0.3)", noteTxt: "#fcd34d",
  }
  return {
    surfaceBg: "#ffffff", surfaceAlt: "#fafbfc",
    cardBg: "#ffffff", cardBorder: "#e8edf2",
    cardShadow: "0 1px 3px rgba(0,0,0,0.04)",
    inputBg: "#f7f9fc", inputBorder: "#dde3ec",
    divider: "#e8edf2", hoverBg: "#f8faf9",
    textPrimary: "#111827", textSecondary: "#6b7280", textMuted: "#9ca3af",
    accentG: G, badgeBg: "#f1f5f9",
    dangerBg: "#fef2f2", dangerColor: "#dc2626",
    noteBg: "#fefce8", noteBdr: "#fde68a", noteTxt: "#92400e",
  }
}

// merge saved doc onto its default so a partial save never loses fields
function mergeDoc(saved, fallback) {
  if (!saved || typeof saved !== "object") return JSON.parse(JSON.stringify(fallback))
  return {
    docTitle:      saved.docTitle      ?? fallback.docTitle,
    docSubtitle:   saved.docSubtitle   ?? fallback.docSubtitle,
    effectiveDate: saved.effectiveDate ?? fallback.effectiveDate,
    lastUpdated:   saved.lastUpdated   ?? fallback.lastUpdated,
    notice:        saved.notice        ?? fallback.notice,
    sections: Array.isArray(saved.sections) && saved.sections.length > 0
      ? saved.sections.map(s => ({ title: s?.title || "", content: s?.content || "" }))
      : fallback.sections.map(s => ({ ...s })),
  }
}

// ─── small inputs ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, t, maxLength }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.textMuted }}>{label}</label>
      <input value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength}
        className="w-full px-3 py-2 text-sm rounded-md outline-none transition-all"
        style={{ backgroundColor: t.inputBg, color: t.textPrimary, border: `1px solid ${t.inputBorder}` }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = "0 0 0 2px rgba(46,139,52,0.15)" }}
        onBlur={e => { e.target.style.borderColor = t.inputBorder; e.target.style.boxShadow = "none" }} />
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder, t, rows = 3 }) {
  return (
    <div>
      {label && <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.textMuted }}>{label}</label>}
      <textarea value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full px-3 py-2 text-sm rounded-md outline-none transition-all resize-y"
        style={{ backgroundColor: t.inputBg, color: t.textPrimary, border: `1px solid ${t.inputBorder}` }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = "0 0 0 2px rgba(46,139,52,0.15)" }}
        onBlur={e => { e.target.style.borderColor = t.inputBorder; e.target.style.boxShadow = "none" }} />
    </div>
  )
}

// ─── Section row editor (one numbered clause) ─────────────────────────────────
function SectionRow({ section, idx, total, onUpdate, onRemove, onMove, t, isDark }) {
  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: t.surfaceAlt, border: `1px solid ${t.cardBorder}` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold"
            style={{ backgroundColor: isDark ? "rgba(74,222,128,0.85)" : G, color: isDark ? "#0f172a" : "#fff" }}>
            {idx + 1}
          </span>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>Section</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onMove(idx, -1)} disabled={idx === 0} aria-label="Move section up"
            className="w-6 h-6 rounded flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: t.textSecondary, border: `1px solid ${t.cardBorder}` }}
            onMouseEnter={e => { if (idx !== 0) e.currentTarget.style.backgroundColor = t.hoverBg }}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>
          </button>
          <button onClick={() => onMove(idx, 1)} disabled={idx === total - 1} aria-label="Move section down"
            className="w-6 h-6 rounded flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: t.textSecondary, border: `1px solid ${t.cardBorder}` }}
            onMouseEnter={e => { if (idx !== total - 1) e.currentTarget.style.backgroundColor = t.hoverBg }}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
          <button onClick={() => onRemove(idx)} aria-label="Remove section"
            className="w-6 h-6 rounded flex items-center justify-center transition-all"
            style={{ color: t.dangerColor }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = t.dangerBg}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Field label="Heading" value={section.title} onChange={v => onUpdate(idx, { ...section, title: v })}
          placeholder="e.g. 1. Acceptance of Terms" t={t} maxLength={80} />
        <TextArea label="Body" value={section.content} onChange={v => onUpdate(idx, { ...section, content: v })}
          placeholder="The clause text shown to customers…" t={t} rows={4} />
      </div>
    </div>
  )
}

// ─── Document editor (one tab worth: Terms or Privacy) ────────────────────────
function DocEditor({ doc, onChange, t, isDark }) {
  const sections = doc.sections || []

  const updateSection = (idx, next) => onChange({ ...doc, sections: sections.map((s, i) => i === idx ? next : s) })
  const removeSection = idx => onChange({ ...doc, sections: sections.filter((_, i) => i !== idx) })
  const addSection = () => onChange({ ...doc, sections: [...sections, { title: "", content: "" }] })
  const moveSection = (idx, dir) => {
    const target = idx + dir
    if (target < 0 || target >= sections.length) return
    const next = [...sections]
    const [item] = next.splice(idx, 1)
    next.splice(target, 0, item)
    onChange({ ...doc, sections: next })
  }

  return (
    <div className="space-y-4">
      {/* Document meta */}
      <div className="rounded-xl p-4" style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
        <div className="flex items-center gap-2 mb-3">
          <svg width="14" height="14" fill="none" stroke={isDark ? "#4ade80" : G} strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p className="text-sm font-bold" style={{ color: t.textPrimary }}>Document Header</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Document Title" value={doc.docTitle} onChange={v => onChange({ ...doc, docTitle: v })} placeholder="e.g. Terms & Conditions" t={t} maxLength={60} />
          <Field label="Subtitle" value={doc.docSubtitle} onChange={v => onChange({ ...doc, docSubtitle: v })} placeholder="e.g. Bloomora Floral Management System" t={t} maxLength={70} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <Field label="Effective Date" value={doc.effectiveDate} onChange={v => onChange({ ...doc, effectiveDate: v })} placeholder="e.g. January 1, 2025" t={t} maxLength={40} />
          <Field label="Last Updated" value={doc.lastUpdated} onChange={v => onChange({ ...doc, lastUpdated: v })} placeholder="e.g. April 2025" t={t} maxLength={40} />
        </div>
        <div className="mt-3">
          <TextArea label="Notice Banner" value={doc.notice} onChange={v => onChange({ ...doc, notice: v })}
            placeholder="The highlighted note shown above the sections…" t={t} rows={2} />
        </div>
      </div>

      {/* Sections */}
      <div className="rounded-xl p-4" style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
        <div className="flex items-center gap-2 mb-3">
          <svg width="14" height="14" fill="none" stroke={isDark ? "#4ade80" : G} strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7"/>
          </svg>
          <p className="text-sm font-bold" style={{ color: t.textPrimary }}>Sections</p>
          <span className="text-[10px] ml-auto" style={{ color: t.textMuted }}>{sections.length} section{sections.length === 1 ? "" : "s"}</span>
        </div>
        <div className="space-y-3">
          {sections.map((section, i) => (
            <SectionRow key={i} section={section} idx={i} total={sections.length}
              onUpdate={updateSection} onRemove={removeSection} onMove={moveSection} t={t} isDark={isDark} />
          ))}
        </div>
        <button onClick={addSection}
          className="w-full mt-3 py-2.5 rounded-md flex items-center justify-center gap-1.5 transition-all text-sm font-semibold"
          style={{ backgroundColor: t.surfaceAlt, border: `1px dashed ${t.cardBorder}`, color: isDark ? "#4ade80" : G }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = isDark ? "rgba(74,222,128,0.4)" : "#86efac"; e.currentTarget.style.backgroundColor = isDark ? "rgba(74,222,128,0.05)" : "#f0fdf4" }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = t.cardBorder; e.currentTarget.style.backgroundColor = t.surfaceAlt }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6"/></svg>
          Add Section
        </button>
      </div>
    </div>
  )
}

// ─── Live preview (mirrors the public legal page) ─────────────────────────────
function DocPreview({ doc, isDark }) {
  const cardBg    = isDark ? "#1a2332" : "white"
  const cardBdr   = isDark ? "#1e293b" : "#e5e7eb"
  const bodyC     = isDark ? "#cbd5e1" : "#4b5563"
  const sectionHC = isDark ? "#f1f5f9" : "#1e293b"
  const divC      = isDark ? "#1e293b" : "#f0f0f0"
  const noteBg    = isDark ? "rgba(251,191,36,0.1)" : "#fefce8"
  const noteBdr   = isDark ? "rgba(251,191,36,0.3)" : "#fde68a"
  const noteTxt   = isDark ? "#fcd34d" : "#92400e"

  const sections = doc.sections || []

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}` }}>
      {/* hero band */}
      <div style={{ background: `linear-gradient(135deg,${DG} 0%,${G} 100%)`, padding: "24px 22px" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#86efac" }}>Legal Document</span>
        </div>
        <h1 className="text-xl font-bold text-white mb-1">{doc.docTitle || "(document title)"}</h1>
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "12px" }}>{doc.docSubtitle || "(subtitle)"}</p>
        <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px]" style={{ color: "rgba(255,255,255,0.52)" }}>
          {doc.effectiveDate && <span>Effective Date: {doc.effectiveDate}</span>}
          {doc.effectiveDate && doc.lastUpdated && <span>•</span>}
          {doc.lastUpdated && <span>Last Updated: {doc.lastUpdated}</span>}
        </div>
      </div>

      {/* body */}
      <div className="px-5 py-6 space-y-5">
        {doc.notice && (
          <div className="p-3 rounded-xl text-[12px] font-medium" style={{ backgroundColor: noteBg, border: `1px solid ${noteBdr}`, color: noteTxt }}>
            {doc.notice}
          </div>
        )}
        {sections.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: bodyC }}>Add a section to preview it here.</p>
        ) : (
          sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-sm font-bold mb-2 pb-1.5" style={{ color: sectionHC, borderBottom: `1px solid ${divC}` }}>
                {s.title || "(section heading)"}
              </h2>
              <p className="text-[12px] leading-relaxed" style={{ color: bodyC }}>
                {s.content || "(section body)"}
              </p>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminLegal() {
  const { isDark } = useTheme()
  const t = useTokens(isDark)

  const [activeTab, setActiveTab] = useState("terms") // "terms" | "privacy"
  const [terms, setTerms]     = useState(() => JSON.parse(JSON.stringify(DEFAULT_TERMS)))
  const [privacy, setPrivacy] = useState(() => JSON.parse(JSON.stringify(DEFAULT_PRIVACY)))
  const [otherKeys, setOtherKeys] = useState({}) // preserve homepage/featured data on save
  const [dirty, setDirty]   = useState(false)
  const [saved, setSaved]   = useState(false)
  const [saving, setSaving] = useState(false)
  // Drives the one-time entrance animation; removed after it plays so it never replays.
  const [entered, setEntered] = useState(false)

  // load existing settings; pull out the two legal keys, remember the rest
  useEffect(() => {
    let cancelled = false
    api.get(SETTINGS_PATH)
      .then(parsed => {
        if (cancelled || !parsed || typeof parsed !== "object") return
        const { [TERMS_KEY]: savedTerms, [PRIVACY_KEY]: savedPrivacy, ...rest } = parsed
        setOtherKeys(rest)
        if (savedTerms)   setTerms(mergeDoc(savedTerms, DEFAULT_TERMS))
        if (savedPrivacy) setPrivacy(mergeDoc(savedPrivacy, DEFAULT_PRIVACY))
      })
      .catch(err => console.error("Failed to load legal settings:", err))
    return () => { cancelled = true }
  }, [])

  // Play the entrance animation once on mount, then turn it off.
  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 1300)
    return () => clearTimeout(timer)
  }, [])

  const updateTerms = next => { setTerms(next); setDirty(true); setSaved(false) }
  const updatePrivacy = next => { setPrivacy(next); setDirty(true); setSaved(false) }

  const handleSave = async () => {
    setSaving(true)
    try {
      // auto-stamp "Last Updated" on the doc being saved so the public date stays truthful
      const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      const termsToSave   = { ...terms,   lastUpdated: today }
      const privacyToSave = { ...privacy, lastUpdated: today }

      const payload = { ...otherKeys, [TERMS_KEY]: termsToSave, [PRIVACY_KEY]: privacyToSave }
      await api.post(SETTINGS_PATH, payload)

      setTerms(termsToSave)
      setPrivacy(privacyToSave)
      setDirty(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      alert("Failed to save legal content: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  const currentDoc = activeTab === "terms" ? terms : privacy
  const setCurrentDoc = activeTab === "terms" ? updateTerms : updatePrivacy

  const TABS = [
    { id: "terms",   label: "Terms & Conditions" },
    { id: "privacy", label: "Privacy Policy" },
  ]

  return (
    <div className="space-y-5">
      {/* Gentle fade + rise so content eases in once loaded instead of flashing. */}
      <style>{`
        @keyframes legalRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .legal-rise { animation: legalRise 0.85s ease-out both; }
      `}</style>

      {/* header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${entered ? "" : "legal-rise"}`}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: t.textPrimary }}>Legal</h1>
          <p className="text-sm mt-1" style={{ color: t.textSecondary }}>
            Edit the Terms &amp; Conditions and Privacy Policy shown to customers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5"
              style={{ backgroundColor: isDark ? "rgba(74,222,128,0.15)" : "#f0fdf4", color: isDark ? "#4ade80" : "#16a34a" }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              Saved
            </span>
          )}
          <button onClick={handleSave} disabled={!dirty || saving}
            className="text-xs font-bold px-4 py-2 rounded-md text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
            {saving
              ? <svg width="13" height="13" fill="none" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>
              : <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
            Save Changes
          </button>
        </div>
      </div>

      {/* tabs */}
      <div className={`inline-flex p-1 rounded-lg gap-1 ${entered ? "" : "legal-rise"}`} style={{ backgroundColor: t.badgeBg, border: `1px solid ${t.cardBorder}`, animationDelay: "0.18s" }}>
        {TABS.map(tab => {
          const on = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all"
              style={{ backgroundColor: on ? t.surfaceBg : "transparent", color: on ? (isDark ? "#4ade80" : DG) : t.textSecondary, boxShadow: on ? "0 1px 3px rgba(0,0,0,0.12)" : "none" }}>
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* split layout */}
      <div className={`grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-5 ${entered ? "" : "legal-rise"}`} style={{ animationDelay: "0.36s" }}>
        <div>
          <DocEditor doc={currentDoc} onChange={setCurrentDoc} t={t} isDark={isDark} />
        </div>
        <div>
          <div className="flex items-center gap-2 px-1 mb-2">
            <svg width="14" height="14" fill="none" stroke={t.textMuted} strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>Live Preview</p>
          </div>
          <div className="xl:sticky xl:top-4">
            <DocPreview doc={currentDoc} isDark={isDark} />
          </div>
        </div>
      </div>
    </div>
  )
}