import { useEffect, useRef, useState, useCallback } from "react"
import { useTheme } from "../context/ThemeContext"

const G   = "#2E8B34"
const DG  = "#0C573E"
const G_D = "#4ade80"

/* ── Reviews ─────────────────────────────────────────────────── */
const REVIEWS = [
  { id:1, name:"Khaye Muñoz",              source:"Facebook", text:"They made very special flower always.", rating:5 },
  { id:2, name:"Dennis Rivera Logarta",    source:"Facebook", text:"True people and a perfect flower shop. Message from KANSAS USA.", rating:5 },
  { id:3, name:"Iris Canda-van de Kreeke", source:"Facebook", text:"Happy with the service and the outcome of the flowers when they delivered it to my mom's doorstep. And also it was right on time.", rating:5 },
  { id:4, name:"Dave Ramos",               source:"Facebook", text:"The best flower shop for all occasions!", rating:5 },
  { id:5, name:"Nikola Crnogorcevic",      source:"Google",   text:"Always fresh flowers and fast service. Price not high and there is a lot of choice also.", rating:4 },
  { id:6, name:"John Clark",               source:"Google",   text:"I have used this place a few times now and every time their flower arrangements are amazing. Very professional service.", rating:4 },
]

/* ── Trust features ──────────────────────────────────────────── */
const FEATURES = [
  {
    title: "Same Day Delivery",
    subtitle: "Order before 2:00 PM",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    title: "Handled With Care",
    subtitle: "Every order inspected",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
  },
  {
    title: "65+ Years of Trust",
    subtitle: "Serving since 1959",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
      </svg>
    ),
  },
  {
    title: "Always Fresh",
    subtitle: "Blooms that last 7+ days",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
      </svg>
    ),
  },
]

/* ── Scroll reveal ───────────────────────────────────────────── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])
  return [ref, visible]
}

/* ── Stars ───────────────────────────────────────────────────── */
function Stars({ count = 5, isDark }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="15" height="15" fill={i <= count ? "#f59e0b" : (isDark ? "#2d3748" : "#e5e7eb")} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  )
}

/* ── Source badge ────────────────────────────────────────────── */
function SourceBadge({ source, isDark }) {
  const isFB = source === "Facebook"
  const bg    = isFB ? (isDark ? "rgba(24,119,242,0.12)" : "#eef3fd") : (isDark ? "rgba(66,133,244,0.10)" : "#f0f4ff")
  const border = isFB ? (isDark ? "rgba(24,119,242,0.25)" : "#c8d8f8") : (isDark ? "rgba(66,133,244,0.22)" : "#ccd8f6")
  const color  = isFB ? "#1877F2" : "#4285F4"
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "2px 8px", borderRadius: "99px",
      backgroundColor: bg, border: `1px solid ${border}`,
      fontSize: "10px", fontWeight: 600, color,
      letterSpacing: "0.02em",
    }}>
      {isFB ? (
        <svg width="9" height="9" fill="#1877F2" viewBox="0 0 24 24">
          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
        </svg>
      ) : (
        <svg width="9" height="9" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      )}
      via {source}
    </span>
  )
}

/* ── Avatar ──────────────────────────────────────────────────── */
function Avatar({ isDark }) {
  const bg = isDark ? "#1e2d3d" : "#f0f7f1"
  const border = isDark ? "#2d4a3e" : "#c8e6c9"
  const iconColor = isDark ? G_D : DG
  return (
    <div style={{
      width: "52px", height: "52px", borderRadius: "50%",
      backgroundColor: bg,
      border: `1.5px solid ${border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      margin: "0 auto 16px",
      flexShrink: 0,
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" fill={iconColor} fillOpacity="0.75"/>
        <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.75"/>
      </svg>
    </div>
  )
}

/* ── Review Card ─────────────────────────────────────────────── */
function ReviewCard({ review, isDark }) {
  const cardBg     = isDark ? "#1a2332" : "#ffffff"
  const cardBorder = isDark ? "#243040" : "#e8ede9"
  const textColor  = isDark ? "#9ca3af" : "#6b7280"
  const nameColor  = isDark ? "#f3f4f6" : "#111827"
  const dividerC   = isDark ? "#243040" : "#eeeeee"
  const accentG    = isDark ? G_D : DG
  const quoteColor = isDark ? "rgba(74,222,128,0.18)" : "rgba(12,87,62,0.10)"

  return (
    <div style={{
      backgroundColor: cardBg,
      border: `1px solid ${cardBorder}`,
      borderRadius: "16px",
      padding: "28px 24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      height: "100%",
      boxSizing: "border-box",
      transition: "box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.boxShadow = isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.08)"
      e.currentTarget.style.borderColor = isDark ? "#2d4a3e" : "#c8deca"
      e.currentTarget.style.transform = "translateY(-3px)"
    }}
    onMouseLeave={e => {
      e.currentTarget.style.boxShadow = "none"
      e.currentTarget.style.borderColor = cardBorder
      e.currentTarget.style.transform = "translateY(0)"
    }}
    >
      <Avatar isDark={isDark} />

      {/* Opening quote */}
      <div style={{
        fontSize: "36px",
        lineHeight: 1,
        color: quoteColor,
        fontFamily: "Georgia, serif",
        marginBottom: "4px",
        userSelect: "none",
        color: accentG,
        opacity: 0.35,
      }}>
        ❝
      </div>

      {/* Review text — uses the site's body font, same as OccasionsStrip description */}
      <p style={{
        fontSize: "13.5px",
        lineHeight: "1.75",
        color: textColor,
        margin: "8px 0 20px",
        flex: 1,
      }}>
        {review.text}
      </p>

      {/* Divider */}
      <div style={{ width: "32px", height: "1px", backgroundColor: dividerC, marginBottom: "16px" }} />

      {/* Name — bold, same weight as OccasionsStrip labels */}
      <p style={{
        fontSize: "14px",
        fontWeight: 700,
        color: nameColor,
        margin: "0 0 6px",
        lineHeight: 1.3,
      }}>
        {review.name}
      </p>

      {/* Source */}
      <div style={{ marginBottom: "12px" }}>
        <SourceBadge source={review.source} isDark={isDark} />
      </div>

      {/* Stars */}
      <Stars count={review.rating} isDark={isDark} />
    </div>
  )
}

/* ── Arrow Button ────────────────────────────────────────────── */
function ArrowBtn({ dir, onClick, isDark }) {
  const accentG = isDark ? G_D : G
  return (
    <button
      onClick={onClick}
      aria-label={dir === "left" ? "Previous" : "Next"}
      style={{
        flexShrink: 0,
        width: "40px", height: "40px",
        borderRadius: "50%",
        border: `1.5px solid ${isDark ? "#2d3748" : "#d1d5db"}`,
        backgroundColor: isDark ? "#111827" : "#ffffff",
        color: isDark ? "#6b7280" : "#9ca3af",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.08)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = accentG
        e.currentTarget.style.color = accentG
        e.currentTarget.style.backgroundColor = isDark ? "#1a2332" : "#f0fdf4"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isDark ? "#2d3748" : "#d1d5db"
        e.currentTarget.style.color = isDark ? "#6b7280" : "#9ca3af"
        e.currentTarget.style.backgroundColor = isDark ? "#111827" : "#ffffff"
      }}
    >
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d={dir === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  )
}

/* ── Trust Feature Item ──────────────────────────────────────── */
function TrustItem({ feature, isDark, delay, visible }) {
  const accentG = isDark ? G_D : DG
  const iconBg  = isDark ? "rgba(74,222,128,0.08)" : "#f0f7f1"
  const iconBorder = isDark ? "rgba(74,222,128,0.15)" : "#c8e6c9"
  const bg      = isDark ? "#1a2332" : "#ffffff"
  const border  = isDark ? "#243040" : "#e8ede9"
  const titleC  = isDark ? "#e5e7eb" : "#111827"
  const subC    = isDark ? "#6b7280" : "#9ca3af"

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: "14px",
        padding: "16px 18px",
        borderRadius: "12px",
        backgroundColor: bg,
        border: `1px solid ${border}`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = isDark ? "#2d4a3e" : "#a8d5b0"
        e.currentTarget.style.boxShadow = isDark ? "0 4px 16px rgba(0,0,0,0.3)" : "0 4px 16px rgba(46,139,52,0.08)"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = border
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      <div style={{
        flexShrink: 0, width: "44px", height: "44px",
        borderRadius: "10px",
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: iconBg,
        color: accentG,
        border: `1px solid ${iconBorder}`,
      }}>
        {feature.icon}
      </div>
      <div>
        {/* Title — same font weight as OccasionsStrip card labels */}
        <p style={{ fontSize: "13px", fontWeight: 700, margin: 0, lineHeight: 1.3, color: titleC }}>
          {feature.title}
        </p>
        {/* Subtitle — same style as OccasionsStrip body text */}
        <p style={{ fontSize: "11.5px", margin: "2px 0 0", lineHeight: 1.4, color: subC }}>
          {feature.subtitle}
        </p>
      </div>
    </div>
  )
}

/* ── Main Component ──────────────────────────────────────────── */
export default function Testimonials() {
  const { isDark } = useTheme()
  const [headerRef, headerVisible] = useScrollReveal(0.2)
  const [cardsRef,  cardsVisible]  = useScrollReveal(0.1)
  const [trustRef,  trustVisible]  = useScrollReveal(0.1)
  const [current,  setCurrent]     = useState(0)
  const [visibleCount, setVisibleCount] = useState(3)
  const total = REVIEWS.length

  // Swipe support
  const touchStart = useRef(null)
  const onTouchStart = (e) => { touchStart.current = e.touches[0].clientX }
  const onTouchEnd   = (e) => {
    if (touchStart.current === null) return
    const diff = touchStart.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev()
    touchStart.current = null
  }

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth
      const isLandscape = window.innerHeight < 500 && w >= 600
      if (w < 640 || isLandscape) setVisibleCount(1)
      else if (w < 1024) setVisibleCount(2)
      else setVisibleCount(3)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const prev = useCallback(() => setCurrent(c => (c - 1 + total) % total), [total])
  const next = useCallback(() => setCurrent(c => (c + 1) % total), [total])
  const getVisible = () => Array.from({ length: visibleCount }, (_, i) => REVIEWS[(current + i) % total])

  // Theme tokens — mirrored from OccasionsStrip pattern
  const sectionBg = isDark ? "#111827" : "#f9fafb"
  const headingC  = isDark ? "#f3f4f6" : "#111827"
  const subC      = isDark ? "#9ca3af" : "#6b7280"
  const accentG   = isDark ? G_D : G
  const accentDG  = isDark ? G_D : DG
  const dotInact  = isDark ? "#374151" : "#d1d5db"
  const trustBg   = isDark ? "#0f172a" : "#ffffff"
  const trustBdr  = isDark ? "#1e293b" : "#e8ede9"
  const trustLbl  = isDark ? "#374151" : "#d1d5db"

  return (
    <section style={{ backgroundColor: sectionBg, padding: "clamp(48px,7vw,88px) 0", borderBottom: `1px solid ${isDark ? "#1e293b" : "#f3f4f6"}` }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 clamp(16px,4vw,40px)" }}>

        {/* ── Header — font pattern from OccasionsStrip ── */}
        <div
          ref={headerRef}
          style={{
            textAlign: "center",
            marginBottom: "clamp(36px,5vw,52px)",
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? "translateY(0)" : "translateY(18px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          {/* Eyebrow — exact same pattern as OccasionsStrip "Browse by Moment" */}
          <p style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: accentG,
            margin: "0 0 10px",
          }}>
            Customer Reviews
          </p>

          {/* Headline — same font-bold + size scale as OccasionsStrip h2 */}
          <h2 style={{
            fontSize: "clamp(26px,4.5vw,40px)",
            fontWeight: 700,
            lineHeight: 1.2,
            color: headingC,
            margin: "0 0 12px",
            letterSpacing: "-0.01em",
          }}>
            What Our Customers Say
          </h2>

          {/* Description — same text-sm gray as OccasionsStrip body */}
          <p style={{
            fontSize: "clamp(13px,1.5vw,15px)",
            color: subC,
            margin: "0 auto 20px",
            maxWidth: "400px",
            lineHeight: 1.6,
          }}>
            Real feedback from real customers who love our flowers and gifts.
          </p>

          {/* Accent bar — same as OccasionsStrip green underline */}
          <div style={{
            width: "48px", height: "3px",
            borderRadius: "99px",
            backgroundColor: accentDG,
            margin: "0 auto",
          }} />
        </div>

        {/* ── Carousel ── */}
        <div
          ref={cardsRef}
          style={{
            opacity: cardsVisible ? 1 : 0,
            transform: cardsVisible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s",
          }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Cards row */}
          <div style={{ display: "flex", alignItems: "stretch", gap: "clamp(8px,2vw,16px)" }}>
            <ArrowBtn dir="left" onClick={prev} isDark={isDark} />

            <div style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: `repeat(${visibleCount}, minmax(0,1fr))`,
              gap: "clamp(10px,2vw,16px)",
              alignItems: "stretch",
            }}>
              {getVisible().map((review, i) => (
                <ReviewCard
                  key={`${review.id}-${i}-${current}`}
                  review={review}
                  isDark={isDark}
                />
              ))}
            </div>

            <ArrowBtn dir="right" onClick={next} isDark={isDark} />
          </div>

          {/* Dot indicators */}
          <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "24px" }}>
            {REVIEWS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to review ${i + 1}`}
                style={{
                  width: i === current ? "20px" : "7px",
                  height: "7px",
                  borderRadius: "99px",
                  backgroundColor: i === current ? accentDG : dotInact,
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Trust Bar ── */}
        <div
          ref={trustRef}
          style={{
            marginTop: "clamp(36px,5vw,56px)",
            padding: "clamp(18px,3vw,28px)",
            borderRadius: "16px",
            backgroundColor: trustBg,
            border: `1px solid ${trustBdr}`,
            boxShadow: isDark ? "0 2px 16px rgba(0,0,0,0.25)" : "0 2px 16px rgba(0,0,0,0.04)",
          }}
        >
          {/* Label — same eyebrow style */}
          <p style={{
            textAlign: "center",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: trustLbl,
            margin: "0 0 16px",
          }}>
            Why Choose Us
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "clamp(8px,2vw,12px)",
          }}>
            {FEATURES.map((f, i) => (
              <TrustItem
                key={f.title}
                feature={f}
                isDark={isDark}
                delay={i * 70}
                visible={trustVisible}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}