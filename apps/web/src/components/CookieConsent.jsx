import { useState, useEffect } from "react"

const DG = "#0C573E"

// Changed to v2 key — clears old stored values so popup shows again
const STORAGE_KEY = "bloomora_cookie_v2"

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [hiding, setHiding]   = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      const t = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(t)
    }
  }, [])

  const dismiss = (accepted) => {
    setHiding(true)
    localStorage.setItem(STORAGE_KEY, accepted ? "accepted" : "denied")
    setTimeout(() => setVisible(false), 400)
  }

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes cookieSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(110%); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <div
        className="fixed bottom-6 left-1/2 z-[9999]"
        style={{
          animation: hiding ? "none" : "cookieSlideUp 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          transform: hiding ? "translateX(-50%) translateY(120%)" : "translateX(-50%) translateY(0)",
          transition: hiding ? "transform 0.4s ease-in" : "none",
          width: "min(480px, calc(100vw - 32px))",
        }}
      >
        <div className="rounded-2xl px-6 py-5"
          style={{ backgroundColor: "white", border: "1px solid #e5e7eb", boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)" }}>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#e6f4ea" }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={DG} strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <circle cx="8.5" cy="10" r="1" fill={DG} stroke="none" />
                <circle cx="14" cy="8" r="1" fill={DG} stroke="none" />
                <circle cx="15" cy="13.5" r="1" fill={DG} stroke="none" />
                <circle cx="10" cy="14.5" r="1" fill={DG} stroke="none" />
              </svg>
            </div>
            <p className="text-sm font-bold text-gray-800">We use cookies</p>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-5">
            To improve your experience, analyze traffic, and show you relevant content. Accept all cookies or select "Deny" to opt out of non-essential tracking.
          </p>
          <div className="flex items-center gap-3">
            <button onClick={() => dismiss(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all hover:bg-gray-50 active:scale-95"
              style={{ borderColor: "#e5e7eb", color: "#6b7280" }}>
              Deny
            </button>
            <button onClick={() => dismiss(true)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: DG }}>
              Accept all
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
