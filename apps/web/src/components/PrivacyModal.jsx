import { useEffect, useRef, useState } from "react"
import { api } from "../services/api"
import { SETTINGS_PATH, PRIVACY_KEY, DEFAULT_PRIVACY } from "../config/legalContent"

// Data Privacy Policy shown as a modal (same look as TermsModal), but its copy
// is pulled live from the Admin → Legal CMS, falling back to DEFAULT_PRIVACY.
export default function PrivacyModal({ open, onClose }) {
  const dialogRef = useRef(null)
  const [doc, setDoc] = useState(DEFAULT_PRIVACY)

  // Load the saved CMS version (if any) the first time the modal is opened.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    api.get(SETTINGS_PATH)
      .then(parsed => {
        if (cancelled) return
        const saved = parsed?.[PRIVACY_KEY]
        if (saved && typeof saved === "object" && Array.isArray(saved.sections) && saved.sections.length > 0) {
          setDoc({
            docTitle:      saved.docTitle      || DEFAULT_PRIVACY.docTitle,
            docSubtitle:   saved.docSubtitle   || DEFAULT_PRIVACY.docSubtitle,
            effectiveDate: saved.effectiveDate || DEFAULT_PRIVACY.effectiveDate,
            lastUpdated:   saved.lastUpdated   || DEFAULT_PRIVACY.lastUpdated,
            notice:        saved.notice        || DEFAULT_PRIVACY.notice,
            sections:      saved.sections.map(s => ({ title: s?.title || "", content: s?.content || "" })),
          })
        }
      })
      .catch(() => { /* keep fallback */ })
    return () => { cancelled = true }
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e) => { if (e.key === "Escape") onClose?.() }
    window.addEventListener("keydown", onKey)
    setTimeout(() => dialogRef.current?.focus(), 50)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.()
  }

  return (
    <div
      onClick={handleBackdrop}
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6 bg-black/50 backdrop-blur-sm animate-[fadeIn_.18s_ease-out]"
      aria-modal="true"
      role="dialog"
      aria-labelledby="privacy-modal-title"
    >
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden outline-none animate-[slideUp_.22s_ease-out]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100 bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 id="privacy-modal-title" className="text-lg font-bold text-gray-800">
                {doc.docTitle}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {doc.docSubtitle} · Bloomora
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition flex items-center justify-center flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm text-gray-700 leading-relaxed space-y-5">
          <p className="text-xs text-gray-400">
            Effective {doc.effectiveDate} · Last updated {doc.lastUpdated}
          </p>

          {doc.notice && (
            <p className="text-sm text-gray-600 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              {doc.notice}
            </p>
          )}

          {doc.sections.map((s, i) => (
            <section key={i}>
              {s.title && <h3 className="font-semibold text-gray-800 mb-1.5">{s.title}</h3>}
              <p>{s.content}</p>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-green-700 hover:bg-green-800 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
