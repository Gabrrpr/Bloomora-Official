import { createPortal } from "react-dom"

const G = "#2E8B34"

// Centered "saved" confirmation popup, styled like the dark/light mode toast.
// Rendered through a portal so it's always centered on the viewport regardless
// of any parent transform/overflow.
export default function SaveToast({ show, isDark, message = "Saved!", sub = "Your changes are now live." }) {
  if (!show) return null
  const cardBg     = isDark ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)"
  const cardBorder = isDark ? "rgba(74,222,128,0.35)" : "rgba(46,139,52,0.28)"
  const cardShadow = isDark ? "0 24px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)" : "0 24px 70px rgba(15,23,42,0.18), 0 0 0 1px rgba(0,0,0,0.04)"
  const titleC = isDark ? "#f1f5f9" : "#1f2937"
  const subC   = isDark ? "#94a3b8" : "#6b7280"
  const iconBg = isDark ? "rgba(74,222,128,0.16)" : "rgba(46,139,52,0.12)"
  const iconC  = isDark ? "#4ade80" : G
  return createPortal(
    <>
      <style>{`
        @keyframes sharedSaveToastIn { 0% { opacity: 0; transform: translate(-50%, -50%) scale(0.92); } 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
        @keyframes sharedSaveCheckPop { 0% { transform: scale(0.4); opacity: 0; } 60% { transform: scale(1.12); opacity: 1; } 100% { transform: scale(1); } }
      `}</style>
      <div role="status" aria-live="polite"
        style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 2147483647,
          display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "14px",
          width: "max-content", maxWidth: "calc(100vw - 48px)", padding: "30px 38px", borderRadius: "22px",
          background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: cardShadow, color: titleC,
          animation: "sharedSaveToastIn 0.28s cubic-bezier(0.22,1,0.36,1)", pointerEvents: "none",
        }}>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "62px", height: "62px", borderRadius: "9999px", flexShrink: 0, background: iconBg, color: iconC, animation: "sharedSaveCheckPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        </span>
        <div>
          <p style={{ margin: 0, fontSize: "17px", fontWeight: 800 }}>{message}</p>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: subC }}>{sub}</p>
        </div>
      </div>
    </>,
    document.body
  )
}
