import { createContext, useContext, useEffect, useState, useRef } from "react"

const ThemeContext = createContext({
  isDark: false,
  toggleDark: () => {},
  setIsDark: () => {},
  forceMode: () => {},
  clearForce: () => {},
})

export function ThemeProvider({ children }) {
  // User's actual saved preference
  const [userPref, setUserPref] = useState(() => {
    try { return localStorage.getItem("bloomora-theme") === "dark" }
    catch { return false }
  })

  // Forced override: null = no override (use userPref), true/false = forced
  const [forcedDark, setForcedDark] = useState(null)

  // What components actually see
  const isDark = forcedDark !== null ? forcedDark : userPref

  // Apply to DOM
  useEffect(() => {
    const root = document.documentElement
    isDark
      ? root.setAttribute("data-theme", "dark")
      : root.removeAttribute("data-theme")
  }, [isDark])

  // Show a brief toast when the user switches between dark and light mode.
  const [toast, setToast] = useState(null) // null | "dark" | "light"
  const [toastLeaving, setToastLeaving] = useState(false)
  const prevDark = useRef(isDark)
  useEffect(() => {
    if (isDark !== prevDark.current) {
      prevDark.current = isDark
      setToast(isDark ? "dark" : "light")
      setToastLeaving(false)
      const tLeave = setTimeout(() => setToastLeaving(true), 1300) // visible window
      const tGone  = setTimeout(() => setToast(null), 1560)        // after exit anim
      return () => { clearTimeout(tLeave); clearTimeout(tGone) }
    }
  }, [isDark])

  // Persist only the real user preference (not forced overrides)
  useEffect(() => {
    try { localStorage.setItem("bloomora-theme", userPref ? "dark" : "light") }
    catch {}
  }, [userPref])

  // On logout: clear everything and go light
  useEffect(() => {
    const handleLogout = () => {
      setUserPref(false)
      setForcedDark(null)
      try { localStorage.removeItem("bloomora-theme") } catch {}
    }
    window.addEventListener("bloomora:logout", handleLogout)
    return () => window.removeEventListener("bloomora:logout", handleLogout)
  }, [])

  // Toggle: if a force is active (e.g. admin), toggle within the forced context
  // so the button works. If no force, toggle the real user preference.
  const toggleDark = () => {
    if (forcedDark !== null) {
      setForcedDark(p => !p)
    } else {
      setUserPref(p => !p)
    }
  }

  const forceMode  = (dark) => setForcedDark(dark)
  const clearForce = () => setForcedDark(null)

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, setIsDark: setUserPref, forceMode, clearForce }}>
      {children}
      {toast && (() => {
        const isDarkToast = toast === "dark"
        const cardBg     = isDarkToast ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)"
        const cardBorder = isDarkToast ? "rgba(74,222,128,0.35)" : "rgba(46,139,52,0.28)"
        const cardShadow = isDarkToast ? "0 24px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)" : "0 24px 70px rgba(15,23,42,0.18), 0 0 0 1px rgba(0,0,0,0.04)"
        const titleC     = isDarkToast ? "#f1f5f9" : "#1f2937"
        const subC       = isDarkToast ? "#94a3b8" : "#6b7280"
        const iconBg     = isDarkToast ? "rgba(74,222,128,0.16)" : "rgba(245,158,11,0.14)"
        const iconC      = isDarkToast ? "#4ade80" : "#f59e0b"
        return (
        <>
          <style>{`
            @keyframes bloomThemeToastIn {
              0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.92); }
              100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            @keyframes bloomThemeToastOut {
              0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
              100% { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
            }
          `}</style>
          <div
            role="status"
            aria-live="polite"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 99999,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "16px",
              width: "max-content",
              maxWidth: "calc(100vw - 48px)",
              padding: "32px 40px",
              borderRadius: "22px",
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              boxShadow: cardShadow,
              color: titleC,
              animation: toastLeaving
                ? "bloomThemeToastOut 0.24s cubic-bezier(0.4,0,1,1) forwards"
                : "bloomThemeToastIn 0.28s cubic-bezier(0.22,1,0.36,1)",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "64px",
                height: "64px",
                borderRadius: "9999px",
                flexShrink: 0,
                background: iconBg,
                color: iconC,
              }}
            >
              {isDarkToast ? (
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              )}
            </span>
            <div style={{ lineHeight: 1.3 }}>
              <p style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>
                {isDarkToast ? "You're in dark mode" : "You're in light mode"}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: "14px", color: subC }}>
                {isDarkToast ? "Easy on the eyes" : "Bright and clear"}
              </p>
            </div>
          </div>
        </>
        )
      })()}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}