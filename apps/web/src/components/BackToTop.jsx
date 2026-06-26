import { useTheme } from "../context/ThemeContext"

const G = "#2E8B34"


export default function BackToTop() {
  const { isDark, toggleDark } = useTheme()

  // ── Scroll-to-top button colors ──
  const btnBg   = isDark ? "#4ade80" : G
  const btnFg   = isDark ? "#0f172a" : "#ffffff"
  const btnGlow = isDark
    ? "0 4px 14px rgba(74,222,128,0.35)"
    : "0 4px 14px rgba(46,139,52,0.35)"

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <>
      <style>{`
        @keyframes bttBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        .btt-arrow-icon { animation: bttBounce 3.6s ease-in-out infinite; }
      `}</style>

      <div className="fixed bottom-6 left-6 z-50 flex flex-col items-center gap-3">

        {/* ── Dark mode toggle (top) ── */}
        <button
          onClick={toggleDark}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="w-12 h-12 flex items-center justify-center rounded-full transition-all relative overflow-hidden hover:scale-110 active:scale-95"
          style={{
            background: isDark
              ? "linear-gradient(135deg, #1e3a5f, #2d4a7a)"
              : "linear-gradient(135deg, #fef3c7, #fde68a)",
            border: isDark ? "1.5px solid #3b5fa0" : "1.5px solid #f59e0b",
            boxShadow: isDark
              ? "0 4px 14px rgba(59,130,246,0.3)"
              : "0 4px 14px rgba(245,158,11,0.3)",
          }}
        >
          {/* Sun (light mode) */}
          <span
            style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              opacity: isDark ? 0 : 1,
              transform: isDark ? "rotate(90deg) scale(0.5)" : "rotate(0deg) scale(1)",
              transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <svg width="18" height="18" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </span>
          {/* Moon (dark mode) */}
          <span
            style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              opacity: isDark ? 1 : 0,
              transform: isDark ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.5)",
              transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <svg width="16" height="16" fill="#93c5fd" viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          </span>
        </button>

        {/* ── Scroll to top (bottom) ── */}
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          title="Back to top"
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
          style={{ backgroundColor: btnBg, color: btnFg, boxShadow: btnGlow }}
        >
          <svg
            className="btt-arrow-icon w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M12 19V5" />
            <path d="M5 12l7-7 7 7" />
          </svg>
        </button>

      </div>
    </>
  )
}