import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { api } from "../services/api"
import { DEFAULT_ORDERING, ORDERING_KEY, SETTINGS_PATH } from "../config/legalContent"
import { getTopNavigationInset } from "../utils/modalViewport.js"

function normalizeSettings(settings) {
  if (typeof settings !== "string") return settings && typeof settings === "object" ? settings : {}
  try {
    const parsed = JSON.parse(settings)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

export default function OrderingFulfillmentModal({ open, onClose }) {
  const dialogRef = useRef(null)
  const [doc, setDoc] = useState(DEFAULT_ORDERING)
  const [viewportHeight, setViewportHeight] = useState(() => (
    typeof window === "undefined" ? 800 : window.visualViewport?.height || window.innerHeight
  ))
  const [topInset, setTopInset] = useState(() => getTopNavigationInset())

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setDoc(DEFAULT_ORDERING)
    api.get(`${SETTINGS_PATH}?_=${Date.now()}`)
      .then(settings => {
        if (cancelled) return
        const saved = normalizeSettings(settings)?.[ORDERING_KEY]
        if (!saved || typeof saved !== "object" || !Array.isArray(saved.sections)) return
        setDoc({
          docTitle: saved.docTitle || DEFAULT_ORDERING.docTitle,
          docSubtitle: saved.docSubtitle || DEFAULT_ORDERING.docSubtitle,
          effectiveDate: saved.effectiveDate || DEFAULT_ORDERING.effectiveDate,
          lastUpdated: saved.lastUpdated || DEFAULT_ORDERING.lastUpdated,
          notice: saved.notice || DEFAULT_ORDERING.notice,
          sections: saved.sections.map(section => ({
            title: String(section?.title || ""),
            content: String(section?.content || ""),
          })),
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [open])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const handleKeyDown = event => { if (event.key === "Escape") onClose?.() }
    window.addEventListener("keydown", handleKeyDown)
    window.setTimeout(() => dialogRef.current?.focus(), 50)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const updateViewportMetrics = () => {
      setViewportHeight(window.visualViewport?.height || window.innerHeight)
      setTopInset(getTopNavigationInset())
    }
    updateViewportMetrics()
    const frame = window.requestAnimationFrame(updateViewportMetrics)
    window.addEventListener("resize", updateViewportMetrics)
    window.visualViewport?.addEventListener("resize", updateViewportMetrics)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("resize", updateViewportMetrics)
      window.visualViewport?.removeEventListener("resize", updateViewportMetrics)
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-black/55 px-2 py-4 backdrop-blur-sm sm:px-4"
      style={{ top: topInset }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ordering-policy-modal-title"
      onClick={event => { if (event.target === event.currentTarget) onClose?.() }}
    >
        <div
          ref={dialogRef}
          tabIndex={-1}
          className="flex min-h-0 w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
          style={{ height: Math.max(96, Math.min(760, viewportHeight - topInset - 32)) }}
          onClick={event => event.stopPropagation()}
        >
        <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-gray-100 bg-gradient-to-br from-green-50 to-white px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-100">
              <svg className="h-5 w-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 id="ordering-policy-modal-title" className="text-lg font-bold text-gray-800">{doc.docTitle}</h2>
              <p className="mt-0.5 text-xs text-gray-500">{doc.docSubtitle} · Bloomora</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close policy" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-4 text-sm leading-relaxed text-gray-700 sm:px-6 sm:py-5">
          <p className="text-xs text-gray-400">Effective {doc.effectiveDate} · Last updated {doc.lastUpdated}</p>
          {doc.notice && <p className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-gray-600">{doc.notice}</p>}
          {doc.sections.map((section, index) => (
            <section key={`${section.title}-${index}`}>
              {section.title && <h3 className="mb-1.5 font-semibold text-gray-800">{section.title}</h3>}
              <p>{section.content}</p>
            </section>
          ))}
        </div>

        <div className="flex flex-shrink-0 justify-end border-t border-gray-100 bg-gray-50 px-5 py-3 sm:px-6 sm:py-4">
          <button type="button" onClick={onClose} className="rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800">Close</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
