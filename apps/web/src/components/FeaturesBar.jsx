import { useEffect, useRef } from "react"
import { useTheme } from "../context/ThemeContext"

const G  = "#2E8B34"
const DG = "#0C573E"

const ScissorsIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m7.848 8.25 1.536.887M7.848 8.25a3 3 0 1 1-5.196-3 3 3 0 0 1 5.196 3Zm1.536.887a2.165 2.165 0 0 1 1.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 1 1-5.196 3 3 3 0 0 1 5.196-3Zm1.536-.887a2.165 2.165 0 0 0 1.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863 2.077-1.199m0-3.328a4.323 4.323 0 0 1 2.068-1.379l5.325-1.628a4.5 4.5 0 0 1 2.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.33 4.33 0 0 0 10.607 12m3.736 0 7.794 4.5-.802.215a4.5 4.5 0 0 1-2.48-.043l-5.326-1.629a4.324 4.324 0 0 1-2.068-1.379M14.343 12l-2.882 1.664" />
  </svg>
)

const TruckIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
</svg>
)

const ShieldIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 3l7 3v5c0 4.5-3 8-7 9.5C8 19 5 15.5 5 11V6z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
)

const ThumbsUpIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
  </svg>
)

const FEATURES = [
  { Icon: ScissorsIcon,  title: "Fresh & Handpicked", text: "Only the freshest blooms selected with care." },
  { Icon: TruckIcon,     title: "Same-Day Delivery",  text: "Order by the cut-off time for same-day delivery." },
  { Icon: ShieldIcon,    title: "Secure Checkout",    text: "Safe and secure payments for peace of mind." },
  { Icon: ThumbsUpIcon,  title: "100% Satisfaction",  text: "Your happiness is our promise, always." },
]

// ── Scroll-reveal hook (same behaviour as OccasionsStrip) ────────────────────
function useReveal(ref, delay = 0) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          el.style.opacity = "1"
          el.style.transform = "translateY(0)"
        }, delay)
        obs.disconnect()
      }
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
}

function FeatureItem({ Icon, title, text, accentG, titleC, textC, iconBg, idx }) {
  const ref = useRef(null)
  useReveal(ref, idx * 90)

  return (
    <div
      ref={ref}
      className="flex items-start gap-3 px-1.5 sm:px-2.5 lg:px-3"
      style={{
        opacity: 0,
        transform: "translateY(20px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      <span
        className="shrink-0 flex items-center justify-center rounded-full w-11 h-11 sm:w-12 sm:h-12"
        style={{ color: accentG, backgroundColor: iconBg }}
      >
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </span>
      <div className="min-w-0">
        <h3
          className="text-sm sm:text-[15px] font-bold leading-snug mb-0.5"
          style={{ color: titleC, fontFamily: "inherit" }}
        >
          {title}
        </h3>
        {/* Clamp to 2 lines and reserve that height so every card matches and the
            bar never grows a 3rd row on narrower laptops. */}
        <p
          className="text-xs sm:text-[13px] leading-snug line-clamp-2"
          style={{ color: textC, minHeight: "2.6em" }}
        >
          {text}
        </p>
      </div>
    </div>
  )
}

export default function FeaturesBar() {
  const { isDark } = useTheme()

  const accentG  = isDark ? "#4ade80" : G
  const cardBg   = isDark ? "#1e293b" : "#f1f8f3"   // pale mint in light, slate in dark
  const cardBrd  = isDark ? "#334155" : "#dcefe1"
  const titleC   = isDark ? "#f3f4f6" : "#1f2937"
  const textC    = isDark ? "#9ca3af" : "#6b7280"
  const iconBg   = isDark ? "rgba(74,222,128,0.12)" : "rgba(46,139,52,0.10)"

  return (
    // Sits just below the hero with only a gentle overlap so it never covers the
    // hero text/buttons. Overlap scales up slightly on larger laptops/desktops.
    <div className="relative z-20 px-4 sm:px-6 lg:px-8 mt-8 sm:-mt-4 md:-mt-5 lg:-mt-7 xl:-mt-9 mb-2 sm:mb-0">
      <div className="max-w-6xl mx-auto">
        <div
          className="rounded-2xl shadow-lg border"
          style={{ backgroundColor: cardBg, borderColor: cardBrd }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-5 gap-x-2 sm:gap-x-4 py-5 sm:py-5 px-3 sm:px-4">
            {FEATURES.map((f, i) => (
              <FeatureItem
                key={f.title}
                Icon={f.Icon}
                title={f.title}
                text={f.text}
                accentG={accentG}
                titleC={titleC}
                textC={textC}
                iconBg={iconBg}
                idx={i}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
