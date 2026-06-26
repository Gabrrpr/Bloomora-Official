import { useState, useEffect } from "react"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api.js"
import {
  SETTINGS_PATH,
  TERMS_KEY, PRIVACY_KEY, ORDERING_KEY, COOKIE_KEY,
  DEFAULT_TERMS, DEFAULT_PRIVACY, DEFAULT_ORDERING, DEFAULT_COOKIE,
} from "../../config/legalContent"

const G  = "#2E8B34"
const DG = "#0C573E"


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

  const [activeTab, setActiveTab] = useState("terms") // "terms" | "privacy" | "ordering"
  const [terms, setTerms]       = useState(() => JSON.parse(JSON.stringify(DEFAULT_TERMS)))
  const [privacy, setPrivacy]   = useState(() => JSON.parse(JSON.stringify(DEFAULT_PRIVACY)))
  const [ordering, setOrdering] = useState(() => JSON.parse(JSON.stringify(DEFAULT_ORDERING)))
  const [cookie, setCookie]     = useState(() => JSON.parse(JSON.stringify(DEFAULT_COOKIE)))
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
        const { [TERMS_KEY]: savedTerms, [PRIVACY_KEY]: savedPrivacy, [ORDERING_KEY]: savedOrdering, [COOKIE_KEY]: savedCookie, ...rest } = parsed
        setOtherKeys(rest)
        if (savedTerms)    setTerms(mergeDoc(savedTerms, DEFAULT_TERMS))
        if (savedPrivacy)  setPrivacy(mergeDoc(savedPrivacy, DEFAULT_PRIVACY))
        if (savedOrdering) setOrdering(mergeDoc(savedOrdering, DEFAULT_ORDERING))
        if (savedCookie)   setCookie(mergeDoc(savedCookie, DEFAULT_COOKIE))
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
  const updateOrdering = next => { setOrdering(next); setDirty(true); setSaved(false) }
  const updateCookie = next => { setCookie(next); setDirty(true); setSaved(false) }

  const handleSave = async () => {
    setSaving(true)
    try {
      // auto-stamp "Last Updated" on the doc being saved so the public date stays truthful
      const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      const termsToSave    = { ...terms,    lastUpdated: today }
      const privacyToSave  = { ...privacy,  lastUpdated: today }
      const orderingToSave = { ...ordering, lastUpdated: today }
      const cookieToSave   = { ...cookie,   lastUpdated: today }

      const payload = { ...otherKeys, [TERMS_KEY]: termsToSave, [PRIVACY_KEY]: privacyToSave, [ORDERING_KEY]: orderingToSave, [COOKIE_KEY]: cookieToSave }
      await api.post(SETTINGS_PATH, payload)

      setTerms(termsToSave)
      setPrivacy(privacyToSave)
      setOrdering(orderingToSave)
      setCookie(cookieToSave)
      setDirty(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      alert("Failed to save legal content: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  const currentDoc = activeTab === "terms" ? terms : activeTab === "privacy" ? privacy : activeTab === "ordering" ? ordering : cookie
  const setCurrentDoc = activeTab === "terms" ? updateTerms : activeTab === "privacy" ? updatePrivacy : activeTab === "ordering" ? updateOrdering : updateCookie

  const TABS = [
    { id: "terms",    label: "Terms & Conditions" },
    { id: "privacy",  label: "Data Privacy Policy" },
    { id: "ordering", label: "Ordering & Fulfillment" },
    { id: "cookie",   label: "Cookie Policy" },
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
            Edit the Terms &amp; Conditions, Data Privacy Policy, Ordering &amp; Fulfillment, and Cookie Policy shown to customers.
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