import { useState, useEffect } from "react"
import mixAndMatchImg from "../../assets/MakeItPersonal/MixAndMatchImg.webp"
import describeImg from "../../assets/MakeItPersonal/DescribeImg.webp"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api"

const G  = "#2E8B34"
const DG = "#0C573E"

// ── Star row ──────────────────────────────────────────────────────────────────
function Stars({ count = 5 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 20 20"
          fill={i <= count ? "#f59e0b" : "#d1d5db"}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// ── A single review card ────────────────────────────────────────────────────
function ReviewCard({ review, t }) {
  const name   = review.customer_name || review.name || review.user_name || "Customer"
  const rating = review.star_rating ?? review.rating ?? 5
  const text   = review.comment || review.text || review.review || ""
  const date   = review.created_at ? new Date(review.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : ""
  const initial = name.trim().charAt(0).toUpperCase() || "C"

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: t.innerBg, border: `1px solid ${t.innerBdr}` }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${G}, ${DG})` }}>
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: t.headingC }}>{name}</p>
          <Stars count={rating} />
        </div>
        {date && <span className="text-[11px] flex-shrink-0" style={{ color: t.mutedC }}>{date}</span>}
      </div>
      {review.image_url && (
        <img src={review.image_url} alt="Custom bouquet"
          className="w-full h-36 object-cover rounded-xl mb-2.5" style={{ backgroundColor: t.innerBdr }} />
      )}
      {text && <p className="text-sm leading-relaxed" style={{ color: t.bodyC }}>{text}</p>}
    </div>
  )
}

export default function MakeItPersonal({ onNavigate }) {
  const { isDark } = useTheme()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  // Best-effort fetch of reviews left on custom-arrangement orders. Falls back
  // to the empty state if the backend doesn't expose the endpoint yet.
  useEffect(() => {
    let alive = true
    api.get("/reviews/custom-arrangements")
      .then(data => {
        if (!alive) return
        setReviews(Array.isArray(data) ? data : (data?.reviews || []))
      })
      .catch(() => { if (alive) setReviews([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  // ── Theme tokens (mirrors Describe Your Arrangement) ──────────────────────
  const pageBg     = isDark
    ? "radial-gradient(1100px 600px at 50% -8%, #0f2018 0%, #0d1a14 45%, #0f172a 100%)"
    : "radial-gradient(1100px 600px at 50% -8%, #eaf6ec 0%, #f4f9f1 45%, #fbf7ef 100%)"
  const accentG    = isDark ? "#4ade80" : G
  const accentDG   = isDark ? "#4ade80" : DG
  const accentPink = isDark ? "#f9a8d4" : "#db2777"
  const cardBg     = isDark ? "rgba(30,41,59,0.92)" : "rgba(255,255,255,0.9)"
  const cardBdr    = isDark ? "#334155" : "#dcfce7"
  const cardShadow = isDark ? "0 12px 40px rgba(0,0,0,0.45)" : "0 12px 40px rgba(12,87,62,0.08)"
  const headingC   = isDark ? "#f1f5f9" : "#1f2937"
  const bodyC      = isDark ? "#94a3b8" : "#6b7280"
  const mutedC     = isDark ? "#64748b" : "#9ca3af"
  const innerBg    = isDark ? "#1e293b" : "#ffffff"
  const innerBdr   = isDark ? "#334155" : "#eef2f1"
  const greenCircle= isDark ? "rgba(74,222,128,0.12)" : "rgba(46,139,52,0.1)"
  const pinkCircle = isDark ? "rgba(249,168,212,0.14)" : "rgba(219,39,119,0.08)"

  const t = { headingC, bodyC, mutedC, innerBg, innerBdr }

  const hoverIn = (accent) => (e) => {
    e.currentTarget.style.transform = "translateY(-4px)"
    e.currentTarget.style.boxShadow = isDark ? "0 18px 44px rgba(0,0,0,0.5)" : "0 18px 44px rgba(12,87,62,0.14)"
    e.currentTarget.style.borderColor = accent
  }
  const hoverOut = (e) => {
    e.currentTarget.style.transform = "none"
    e.currentTarget.style.boxShadow = cardShadow
    e.currentTarget.style.borderColor = cardBdr
  }

  const OptionCard = ({ img, alt, badge, badgeColor, badgeBg, title, desc, cta, ctaColor, page }) => (
    <button
      onClick={() => onNavigate(page)}
      className="group flex overflow-hidden rounded-3xl text-left transition-all duration-200 active:scale-[0.99]"
      style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, boxShadow: cardShadow, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      onMouseEnter={hoverIn(ctaColor)}
      onMouseLeave={hoverOut}
    >
      <div className="w-28 sm:w-40 shrink-0 overflow-hidden" style={{ backgroundColor: innerBdr }}>
        <img src={img} alt={alt} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="p-4 sm:p-6 flex flex-col justify-center min-w-0">
        <span className="inline-flex w-fit items-center text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-2.5"
          style={{ color: badgeColor, backgroundColor: badgeBg }}>
          {badge}
        </span>
        <h2 className="text-base sm:text-lg font-bold mb-1.5" style={{ color: headingC }}>{title}</h2>
        <p className="text-[13px] leading-relaxed mb-3 line-clamp-3" style={{ color: bodyC }}>{desc}</p>
        <span className="flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 group-hover:gap-2.5" style={{ color: ctaColor }}>
          {cta}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </button>
  )

  return (
    <div className="min-h-screen" style={{ background: pageBg }}>
      <style>{`@keyframes pageRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
        .mip-reviews::-webkit-scrollbar{width:6px}
        .mip-reviews::-webkit-scrollbar-thumb{background:rgba(46,139,52,0.3);border-radius:9999px}
        @keyframes titleShine { to { background-position: -200% 0; } }
        .shine-text { background-image: linear-gradient(110deg, var(--shine-base) 0%, var(--shine-base) 42%, #ffffff 50%, var(--shine-base) 58%, var(--shine-base) 100%); background-size: 200% 100%; background-position: 0% 0; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; will-change: background-position; animation: titleShine 3.5s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .shine-text { animation: none; } }
      `}</style>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        {/* Header */}
        <div className="text-center mb-10" style={{ animation: "pageRise 0.6s ease 0.05s both" }}>
          <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase mb-3" style={{ color: accentG }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#f472b6" }} />
            Make It Personal
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#fbbf24" }} />
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-3" style={{ color: accentDG }}>
            <span className="shine-text" style={{ "--shine-base": accentDG }}>Create Your</span> <span className="shine-text" style={{ "--shine-base": accentPink }}>Perfect Bouquet</span>
          </h1>
          <p className="text-sm sm:text-base max-w-md mx-auto leading-relaxed" style={{ color: bodyC }}>
            Choose how you'd like to build your arrangement. Our florists will craft it fresh, just for you.
          </p>
        </div>

        {/* Two columns: options (left) · reviews (right) */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">

          {/* LEFT — the two build options */}
          <div className="flex flex-col gap-5" style={{ animation: "pageRise 0.6s ease 0.16s both" }}>
            <OptionCard
              img={mixAndMatchImg} alt="Mix and Match"
              badge="Option 1" badgeColor={accentG} badgeBg={greenCircle}
              title="Mix and Match"
              desc="Build your bouquet step by step. Pick the size, arrangement, focal flowers, fillers, and finishing touches."
              cta="Start building" ctaColor={accentG} page="mix-and-match"
            />
            <OptionCard
              img={describeImg} alt="Describe your arrangement"
              badge="Option 2" badgeColor={accentPink} badgeBg={pinkCircle}
              title="Describe Your Arrangement"
              desc="Tell us your occasion, colors, and style, and our AI will bring your dream bouquet to life."
              cta="Describe it" ctaColor={accentPink} page="describe-arrangement"
            />
          </div>

          {/* RIGHT — reviews of customized bouquets */}
          <div className="rounded-3xl p-5 sm:p-6 flex flex-col"
            style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, boxShadow: cardShadow, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", minHeight: "340px", animation: "pageRise 0.6s ease 0.24s both" }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: greenCircle, color: accentG }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </span>
              <div>
                <h2 className="text-base font-bold" style={{ color: headingC }}>Customer Creations</h2>
                <p className="text-[13px]" style={{ color: bodyC }}>Reviews from customers who built their own bouquet.</p>
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm" style={{ color: mutedC }}>Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: greenCircle, color: accentG }}>
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                  </svg>
                </div>
                <p className="text-sm font-bold mb-1.5" style={{ color: headingC }}>No reviews yet</p>
                <p className="text-[13px] max-w-[17rem] leading-relaxed" style={{ color: bodyC }}>
                  Be the first! Once your custom bouquet arrives, you can leave a review and it will appear right here.
                </p>
              </div>
            ) : (
              /* Populated list */
              <div className="mip-reviews flex-1 flex flex-col gap-3 overflow-y-auto pr-1" style={{ maxHeight: "560px" }}>
                {reviews.map((r, i) => (
                  <ReviewCard key={r.id || i} review={r} t={t} />
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs mt-8" style={{ color: mutedC, animation: "pageRise 0.6s ease 0.34s both" }}>
          More than 1,000+ arrangements generated for customers like you
        </p>
      </div>
    </div>
  )
}
