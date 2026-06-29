import { useTheme } from "../context/ThemeContext"
import mobileDemo from "../assets/mobileDemo.mp4"

const G  = "#2E8B34"
const DG = "#0C573E"

// Where the "Download the App" button points. Update this to your real
// download/landing page when it's ready.
const DOWNLOAD_URL = "/download"

const FEATURES = [
  "Everything from the website, in a compact app",
  "Browse the full shop and order in a few taps",
  "Track every delivery in real time",
  "Message our florists whenever you need",
]

/**
 * "Get the App" homepage segment — an Android phone mockup playing the demo clip.
 * The video lives at src/assets/mobileDemo.mp4 (1080×2400, 9:20).
 */
export default function MobileAppSection() {
  const { isDark } = useTheme()

  const sectionBg = isDark ? "#0d1521" : "#f6faf6"
  const cardBg    = isDark ? "#111c2b" : "#ffffff"
  const cardBdr   = isDark ? "#1e2d40" : "#e6efe7"
  const headingC  = isDark ? "#f3f7f4" : "#0e2a1c"
  const bodyC     = isDark ? "#9fb1a6" : "#4a5d52"
  const tagC      = isDark ? "#4ade80" : G
  const featC     = isDark ? "#cdd9d1" : "#33473b"

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-10 lg:py-12" style={{ background: sectionBg }}>
      <div
        className="max-w-6xl mx-auto rounded-2xl overflow-hidden"
        style={{ background: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? "none" : "0 1px 2px rgba(16,40,28,0.04)" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] items-center">

          {/* ── Copy ───────────────────────────────────────────── */}
          <div className="px-8 sm:px-12 lg:px-16 py-10 lg:py-12 text-center lg:text-left">
            <span className="text-sm font-bold uppercase tracking-[0.22em]" style={{ color: tagC }}>
              Esting's Mobile App
            </span>

            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold leading-[1.1]"
              style={{
                backgroundImage: isDark
                  ? "linear-gradient(115deg, #4ade80 0%, #2E8B34 42%, #f472b6 100%)"
                  : "linear-gradient(115deg, #0C573E 0%, #2E8B34 42%, #db2777 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
              }}>
              The whole flower shop,<br className="hidden sm:block" /> right in your pocket
            </h2>

            <p className="mt-5 text-lg leading-relaxed mx-auto lg:mx-0 max-w-lg" style={{ color: bodyC }}>
              Everything you love about Esting's, made faster and simpler on your phone.
            </p>

            <ul className="mt-9 space-y-4 text-left inline-block">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3.5">
                  <svg className="w-6 h-6 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={tagC} strokeWidth={2.4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[17px] leading-snug" style={{ color: featC }}>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-11 flex justify-center lg:justify-start">
              <a
                href={DOWNLOAD_URL}
                className="inline-flex items-center gap-3 rounded-xl px-9 py-4 text-lg font-bold text-white transition-colors"
                style={{ background: G }}
                onMouseEnter={(e) => (e.currentTarget.style.background = DG)}
                onMouseLeave={(e) => (e.currentTarget.style.background = G)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                </svg>
                Download the App
              </a>
            </div>

            <p className="mt-5 text-sm" style={{ color: bodyC }}>
              Free on Android.
            </p>
          </div>

          {/* ── Android phone mockup with looping video ─────────── */}
          <div className="relative flex justify-center items-center overflow-hidden px-6 pb-10 pt-10 lg:py-10"
            style={{
              background: isDark
                ? "radial-gradient(120% 90% at 50% 0%, #14352a 0%, #0e1c2b 55%, #0b1622 100%)"
                : "radial-gradient(120% 90% at 50% 0%, #d8f3df 0%, #eef9f0 55%, #f6faf6 100%)",
            }}>
            {/* soft glow halo behind the phone */}
            <div className="pointer-events-none absolute rounded-full"
              style={{
                width: "min(420px, 80%)", aspectRatio: "1",
                background: isDark ? "rgba(74,222,128,0.16)" : "rgba(46,139,52,0.18)",
                filter: "blur(70px)",
              }} />
            <div className="relative">
              <div
                style={{
                  width: "min(300px, 72vw)",
                  aspectRatio: "9 / 20",
                  borderRadius: 50,
                  background: "linear-gradient(150deg, #2a2a30 0%, #0d0d10 45%, #050507 100%)",
                  padding: 11,
                  boxShadow: "0 40px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.05)",
                }}
              >
                {/* screen — clean, no notch/island */}
                <div
                  className="relative w-full h-full overflow-hidden"
                  style={{ borderRadius: 40, background: "#000", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}
                >
                  <video
                    className="w-full h-full object-cover"
                    src={mobileDemo}
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                </div>
              </div>
              {/* power + volume buttons on the right edge (Android) */}
              <span className="absolute" style={{ right: -2, top: "26%", width: 3, height: 30, borderRadius: 3, background: "#26262a" }} />
              <span className="absolute" style={{ right: -2, top: "37%", width: 3, height: 48, borderRadius: 3, background: "#26262a" }} />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
