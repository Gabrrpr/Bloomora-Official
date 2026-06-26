import { useState } from "react"
import cookieImg from "../assets/homepage/Cookie.webp"

const DG = "#0C573E"
const G  = "#2E8B34"

const COOKIE_CATEGORIES = [
  {
    key: "necessary",
    label: "Strictly Necessary",
    desc: "Required for the website to function. Cannot be turned off. These include your login session, shopping cart, and security tokens.",
    locked: true,
  },
  {
    key: "analytics",
    label: "Analytics & Performance",
    desc: "Helps us understand how visitors interact with our website — which pages are visited most, how long people stay, and where they come from.",
    locked: false,
  },
  {
    key: "functional",
    label: "Functional",
    desc: "Remembers your preferences such as your branch location (Manila or Pampanga), dark mode setting, and recently viewed arrangements.",
    locked: false,
  },
  {
    key: "marketing",
    label: "Marketing",
    desc: "Used to show you relevant promotions and flower arrangements based on your browsing activity on our website.",
    locked: false,
  },
]

function Toggle({ on, onChange, locked }) {
  return (
    <button
      onClick={() => !locked && onChange(!on)}
      disabled={locked}
      className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200"
      style={{
        backgroundColor: on ? G : "#d1d5db",
        cursor: locked ? "not-allowed" : "pointer",
      }}>
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: on ? "22px" : "2px" }}
      />
    </button>
  )
}

function CookieSettingsPanel({ onBack, onSave }) {
  const [prefs, setPrefs] = useState({
    necessary: true,
    analytics: false,
    functional: true,
    marketing: false,
  })

  const [expanded, setExpanded] = useState(null)

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }))

  const handleAcceptAll = () => {
    const all = { necessary: true, analytics: true, functional: true, marketing: true }
    setPrefs(all)
    onSave(all)
  }

  const handleSave = () => onSave(prefs)

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
        boxShadow: "0 24px 64px rgba(0,0,0,0.13), 0 4px 16px rgba(0,0,0,0.07)",
      }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4"
        style={{ borderBottom: "1px solid #f1f5f9" }}>
        <button onClick={onBack}
          className="w-7 h-7 flex items-center justify-center rounded-full transition-all hover:bg-gray-100 flex-shrink-0"
          style={{ color: "#6b7280" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <img src={cookieImg} alt="Cookie" className="w-6 h-6 object-contain" />
          <p className="text-sm font-bold" style={{ color: "#111827" }}>Cookie Settings</p>
        </div>
      </div>

      {/* Intro text */}
      <div className="px-6 pt-4 pb-2">
        <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>
          Choose which cookies you allow. Strictly necessary cookies cannot be disabled as they are required for the site to work properly.
        </p>
      </div>

      {/* Categories */}
      <div className="px-6 pb-4 space-y-2 max-h-72 overflow-y-auto">
        {COOKIE_CATEGORIES.map(cat => (
          <div key={cat.key} className="rounded-xl overflow-hidden"
            style={{ border: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>

            {/* Row */}
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  onClick={() => setExpanded(expanded === cat.key ? null : cat.key)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left">
                  <svg
                    className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200"
                    style={{ color: "#9ca3af", transform: expanded === cat.key ? "rotate(90deg)" : "rotate(0deg)" }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-sm font-semibold truncate" style={{ color: "#111827" }}>{cat.label}</span>
                  {cat.locked && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: "#f0fdf4", color: DG }}>
                      Always on
                    </span>
                  )}
                </button>
              </div>
              <Toggle on={prefs[cat.key]} onChange={() => toggle(cat.key)} locked={cat.locked} />
            </div>

            {/* Expanded description */}
            {expanded === cat.key && (
              <div className="px-9 pb-3">
                <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>{cat.desc}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-between gap-3 px-6 py-4"
        style={{ borderTop: "1px solid #f1f5f9" }}>
        <button onClick={handleSave}
          className="flex-1 py-2.5 rounded-full text-sm font-semibold border-2 transition-all hover:bg-gray-50 active:scale-95"
          style={{ borderColor: "#d1d5db", color: "#374151" }}>
          Save preferences
        </button>
        <button onClick={handleAcceptAll}
          className="flex-1 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
          Accept all
        </button>
      </div>
    </div>
  )
}

export default function CookieConsent({ onAccept }) {
  const [hiding, setHiding]       = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const dismiss = (accepted, prefs = null) => {
    setHiding(true)
    setTimeout(() => {
      if (onAccept) onAccept(accepted, prefs)
    }, 380)
  }

  const handleSavePrefs = (prefs) => {
    dismiss(true, prefs)
  }

  return (
    <>
      <style>{`
        @keyframes cookieSlideUp {
          from { opacity: 0; transform: translateY(110%); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="fixed bottom-6 left-6 z-[9999]"
        style={{
          animation: hiding ? "none" : "cookieSlideUp 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
          transform: hiding ? "translateY(120%)" : "translateY(0)",
          transition: hiding ? "transform 0.38s ease-in, opacity 0.38s ease-in" : "none",
          opacity: hiding ? 0 : 1,
          width: "min(520px, calc(100vw - 48px))",
        }}>

        {showSettings ? (
          <CookieSettingsPanel
            onBack={() => setShowSettings(false)}
            onSave={handleSavePrefs}
          />
        ) : (
          <div className="relative rounded-2xl px-8 py-7 text-center"
            style={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              boxShadow: "0 24px 64px rgba(0,0,0,0.13), 0 4px 16px rgba(0,0,0,0.07)",
            }}>

            {/* Close button */}
            <button
              onClick={() => dismiss(false)}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full transition-all hover:bg-gray-100"
              style={{ color: "#9ca3af" }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Cookie icon */}
            <div className="flex justify-center mb-4">
              <img src={cookieImg} alt="Cookie" className="w-16 h-16 object-contain" />
            </div>

            {/* Title */}
            <h2 className="text-lg font-bold mb-2" style={{ color: "#111827" }}>
              Our website uses cookies
            </h2>

            {/* Description */}
            <p className="text-sm leading-relaxed mb-6"
              style={{ color: "#6b7280", maxWidth: "380px", margin: "0 auto 24px" }}>
              We and our digital partners use cookies to improve your browsing experience,
              save your preferences and provide us with information on how you use our website.
              For more information about cookies, please see our{" "}
              <a href="#" className="underline font-medium" style={{ color: DG }}>Privacy Policy</a>.
            </p>

            {/* Buttons */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={() => setShowSettings(true)}
                className="text-sm font-semibold underline underline-offset-2 transition-all hover:opacity-70"
                style={{ color: DG }}>
                Cookie Settings
              </button>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <button
                  onClick={() => dismiss(false)}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold border-2 transition-all hover:bg-gray-50 active:scale-95"
                  style={{ borderColor: "#d1d5db", color: "#374151" }}>
                  Decline All
                </button>
                <button
                  onClick={() => dismiss(true)}
                  className="px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
                  Accept cookies
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}