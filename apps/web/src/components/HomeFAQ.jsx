import { useState, useRef, useEffect } from "react"
import { useTheme } from "../context/ThemeContext"

const G  = "#2E8B34"
const DG = "#0C573E"

const FAQS = [
  {
    category: "Products Related",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.5c0-1.5-1-2.5-2.5-2.5S7 5 7 6.5c0 1 .5 1.8 1.3 2.2C7.5 9.2 7 10 7 11c0 1.7 1.3 3 3 3h.5m1.5-7.5c0-1.5 1-2.5 2.5-2.5S17 5 17 6.5c0 1-.5 1.8-1.3 2.2.8.5 1.3 1.3 1.3 2.3 0 1.7-1.3 3-3 3H12"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v6"/>
      </svg>
    ),
    items: [
      { q:"Will my order look exactly like the picture?", a:"Each arrangement is handcrafted, so minor variations in bloom shape and color may occur. However, we always stay true to the overall style, color palette, and size shown." },
      { q:"Do the flowers come in a vase?", a:"Most arrangements are delivered in a bouquet wrap. Vases are available as an add-on — just mention it when placing your order." },
      { q:"Can I include a gift message with my order?", a:"Yes! You can add a personalized message card during checkout. Just type your message in the provided field." },
      { q:"Can I customize my arrangement?", a:"Absolutely. Use our Make it Personal feature to describe your ideal bouquet, or build your own through Mix and Match." },
    ],
  },
  {
    category: "Order Related",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
      </svg>
    ),
    items: [
      { q:"How do I place an order?", a:"Browse our shop, choose your arrangement, select your delivery date and address, then proceed to checkout. It's that simple." },
      { q:"What are your delivery hours?", a:"Manila Branch: 9:00 AM – 9:00 PM. Pampanga Branch: 7:30 AM – 5:00 PM. Orders placed late may be scheduled for next-day delivery." },
      { q:"Do you deliver outside Metro Manila?", a:"Yes, we deliver nationwide. Please ensure your delivery address is complete and accurate to avoid delays." },
      { q:"What is your cancellation policy?", a:"We don't accept cancellations after payment. However, your payment can be converted to store credit for a future order." },
    ],
  },
]

/* ── Sparkle icon — replaces flower for each question row ─────── */
const SparkleIcon = ({ color }) => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"/>
  </svg>
)

/* ── Accordion item ─────────────────────────────────────────────── */
function AccordionItem({ q, a, isDark }) {
  const [open, setOpen] = useState(false)
  const contentRef      = useRef(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current) setHeight(open ? contentRef.current.scrollHeight : 0)
  }, [open])

  // Colors
  const cardBg    = isDark ? (open ? "#1a2e1e" : "#1a2332") : (open ? "#f2f9f3" : "#ffffff")
  const cardBdr   = open
    ? (isDark ? "rgba(74,222,128,0.5)" : G)
    : (isDark ? "rgba(74,222,128,0.15)" : "#e5e7eb")
  const neonShdw  = isDark && open ? "0 0 0 1.5px rgba(74,222,128,0.4), 0 0 18px rgba(74,222,128,0.08)" : "none"
  const qColor    = isDark ? (open ? "#f0fdf4" : "#e2e8f0") : "#1f2937"
  const aColor    = isDark ? "#94a3b8" : "#6b7280"
  const iconBg    = open ? (isDark ? "rgba(74,222,128,0.18)" : "#dff0df") : (isDark ? "rgba(74,222,128,0.06)" : "#f3f4f6")
  const iconColor = open ? (isDark ? "#4ade80" : DG) : (isDark ? "rgba(74,222,128,0.4)" : "#9ca3af")
  const chevBg    = open ? (isDark ? "#4ade80" : G)  : (isDark ? "rgba(74,222,128,0.1)" : "#f3f4f6")
  const chevColor = open ? (isDark ? "#0a1f0d" : "#fff") : (isDark ? "rgba(74,222,128,0.5)" : "#9ca3af")
  const divColor  = isDark ? "rgba(74,222,128,0.12)" : "#e5e7eb"

  return (
    <div className="rounded-xl overflow-hidden transition-all duration-200"
      style={{ border:`1.5px solid ${cardBdr}`, backgroundColor:cardBg, boxShadow:neonShdw }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-[13px] text-left border-none cursor-pointer bg-transparent">
        {/* Sparkle icon — distinct from the flower in the category title */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200"
          style={{ backgroundColor:iconBg }}>
          <SparkleIcon color={iconColor}/>
        </div>
        <span className="text-sm font-semibold flex-1 pr-2 leading-snug transition-colors duration-200"
          style={{ color:qColor }}>{q}</span>
        {/* Rotating chevron */}
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
          style={{ backgroundColor:chevBg, transform:open?"rotate(180deg)":"rotate(0deg)", boxShadow:open&&isDark?"0 0 10px rgba(74,222,128,0.3)":"none" }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={chevColor} strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
          </svg>
        </div>
      </button>
      {/* Animated answer */}
      <div style={{ height:`${height}px`, overflow:"hidden", transition:"height 0.35s cubic-bezier(0.4,0,0.2,1)" }}>
        <div ref={contentRef} className="px-4 pb-4 pt-3" style={{ borderTop:`1px solid ${divColor}` }}>
          <p className="text-[13.5px] leading-[1.7] m-0" style={{ color:aColor }}>{a}</p>
        </div>
      </div>
    </div>
  )
}

/* ── Category panel ─────────────────────────────────────────────── */
function CategoryPanel({ cat, isDark, visible, delay }) {
  const panelBg    = isDark ? "#1a2332" : "#ffffff"
  const panelBdr   = isDark ? "rgba(74,222,128,0.2)" : "#e5ede5"
  const panelShdw  = isDark
    ? "0 0 0 1px rgba(74,222,128,0.1), 0 8px 32px rgba(0,0,0,0.4)"
    : "0 4px 20px rgba(0,0,0,0.05)"
  const headingC   = isDark ? "#f0fdf4" : "#1f2937"
  const iconBg     = isDark ? "rgba(74,222,128,0.1)"  : "#eef7ee"
  const iconBdr    = isDark ? "rgba(74,222,128,0.25)" : "#c8e0c8"
  const iconColor  = isDark ? "#4ade80" : DG
  const iconGlow   = isDark ? "0 0 16px rgba(74,222,128,0.2)" : "none"
  const underlineC = isDark ? "#4ade80" : G
  const underlineGlow = isDark ? "0 0 8px rgba(74,222,128,0.5)" : "none"

  return (
    <div className="rounded-[18px] flex flex-col"
      style={{ backgroundColor:panelBg, border:`1px solid ${panelBdr}`, padding:"26px 22px", boxShadow:panelShdw, opacity:visible?1:0, transform:visible?"none":"translateY(20px)", transition:`opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms` }}>

      {/* Category header */}
      <div className="flex items-center gap-3.5 mb-4">
        <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor:iconBg, border:`1.5px solid ${iconBdr}`, color:iconColor, boxShadow:iconGlow }}>
          {cat.icon}
        </div>
        <div>
          <h3 className="text-[18px] font-bold mb-[6px] leading-tight" style={{ color:headingC }}>{cat.category}</h3>
          <div className="w-9 h-[2.5px] rounded-sm" style={{ backgroundColor:underlineC, boxShadow:underlineGlow }}/>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {cat.items.map((item, i) => (
          <AccordionItem key={i} q={item.q} a={item.a} isDark={isDark}/>
        ))}
      </div>
    </div>
  )
}

/* ── Main ───────────────────────────────────────────────────────── */
export default function HomeFAQ({ onNavigate }) {
  const { isDark } = useTheme()
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1100)
  const sectionRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener("resize", h)
    return () => window.removeEventListener("resize", h)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.06 }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  const isDesk      = w >= 768
  const isLandscape = typeof window !== "undefined" && window.innerHeight < 520 && w >= 600
  const useTwoCols  = isDesk && !isLandscape

  const openChat = () => window.dispatchEvent(new CustomEvent("bloomora:open-chat"))

  // Tokens — same pattern as OccasionsStrip
  const accentG    = isDark ? "#4ade80" : G
  const accentGlow = isDark ? "0 0 10px rgba(74,222,128,0.5)" : "none"
  // ▼ SAME dark bg as OccasionsStrip ▼
  const sectionBg  = isDark ? "#111827" : "white"
  const sectionBdr = isDark ? "#2d3748" : "#f3f4f6"
  const headingC   = isDark ? "#f3f4f6" : "#1f2937"
  const bodyC      = isDark ? "#9ca3af" : "#6b7280"

  // CTA bar
  const ctaBg      = isDark ? "#1a2332" : "#ffffff"
  const ctaBdr     = isDark ? "rgba(74,222,128,0.25)" : "#e5ede5"
  const ctaShdw    = isDark ? "0 0 0 1px rgba(74,222,128,0.1), 0 4px 24px rgba(0,0,0,0.35)" : "0 2px 16px rgba(0,0,0,0.05)"
  const ctaTitleC  = isDark ? "#f0fdf4" : "#111827"
  const ctaSubC    = isDark ? "#94a3b8" : "#6b7280"
  const ctaIconBg  = isDark ? "rgba(74,222,128,0.1)"  : "#f0f7f0"
  const ctaIconBdr = isDark ? "rgba(74,222,128,0.25)" : "#c8e0c8"
  const ctaIconC   = isDark ? "#4ade80" : DG
  const ctaBtnGlow = isDark ? "0 0 16px rgba(74,222,128,0.25), 0 4px 12px rgba(12,87,62,0.4)" : "0 4px 12px rgba(12,87,62,0.3)"

  return (
    <section className="py-[clamp(56px,7vw,96px)] border-b"
      style={{ backgroundColor:sectionBg, borderColor:sectionBdr }}>
      <div ref={sectionRef} className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-12">

        {/* ── Header — identical 3-row pattern to OccasionsStrip ── */}
        <div className="text-center mb-12 transition-all duration-500"
          style={{ opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(24px)" }}>
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color:accentG }}>
            Got Questions?
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color:headingC }}>
            Frequently Asked Questions
          </h2>
          <p className="text-sm mb-4" style={{ color:bodyC }}>
            Find quick answers to the most common questions about our flowers, orders, and delivery.
          </p>
          {/* Green bar — same as OccasionsStrip, with glow in dark mode */}
          <div className="w-12 h-[3px] mx-auto rounded-full"
            style={{ backgroundColor:accentG, boxShadow:accentGlow }}/>
        </div>

        {/* ── Two-column panels ── */}
        <div className={`grid gap-4 sm:gap-6 ${useTwoCols ? "grid-cols-2" : "grid-cols-1"}`}>
          {FAQS.map((cat, i) => (
            <CategoryPanel key={cat.category} cat={cat} isDark={isDark} visible={visible} delay={i * 100}/>
          ))}
        </div>

        {/* ── CTA — compact, centred, opens ChatWidget ── */}
        <div className="flex justify-center mt-[clamp(28px,4vw,44px)]">
          <div className="flex items-center gap-4 rounded-2xl transition-all duration-500 w-full max-w-[520px]"
            style={{ backgroundColor:ctaBg, border:`1px solid ${ctaBdr}`, padding:"16px 20px", boxShadow:ctaShdw, opacity:visible?1:0, transform:visible?"none":"translateY(14px)", transitionDelay:"0.22s" }}>
            {/* Chat icon circle */}
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor:ctaIconBg, border:`1.5px solid ${ctaIconBdr}`, color:ctaIconC, boxShadow:isDark?"0 0 14px rgba(74,222,128,0.2)":"none" }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"/>
              </svg>
            </div>
            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold mb-0.5 leading-tight" style={{ color:ctaTitleC }}>
                Still have questions?
              </p>
              <p className="text-xs leading-snug truncate" style={{ color:ctaSubC }}>
                Chat with our friendly support team.
              </p>
            </div>
            {/* Arrow — dispatches bloomora:open-chat */}
            <button onClick={openChat}
              className="w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 border-none cursor-pointer text-white transition-all duration-200"
              style={{ backgroundColor:DG, boxShadow:ctaBtnGlow }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor=G; e.currentTarget.style.boxShadow=isDark?"0 0 22px rgba(74,222,128,0.4), 0 6px 16px rgba(46,139,52,0.35)":"0 6px 16px rgba(46,139,52,0.35)" }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor=DG; e.currentTarget.style.boxShadow=ctaBtnGlow }}>
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
              </svg>
            </button>
          </div>
        </div>

      </div>
    </section>
  )
}