import { useState, useRef, useEffect } from "react"
import { useTheme } from "../context/ThemeContext"

const G  = "#2E8B34"
const DG = "#0C573E"

const FAQS = [
  {
    category: "Products Related",
    items: [
      { q:"Will my order look exactly like the picture?", a:"Each arrangement is handcrafted, so minor variations in bloom shape and color may occur. However, we always stay true to the overall style, color palette, and size shown." },
      { q:"Do the flowers come in a vase?", a:"Most arrangements are delivered in a bouquet wrap. Vases are available as an add-on, just mention it when placing your order." },
      { q:"Can I include a gift message with my order?", a:"Yes! You can add a personalized message card during checkout. Just type your message in the provided field." },
      { q:"Can I customize my arrangement?", a:"Absolutely. Use our Make it Personal feature to describe your ideal bouquet, or build your own through Mix and Match." },
    ],
  },
  {
    category: "Order Related",
    items: [
      { q:"How do I place an order?", a:"Browse our shop, choose your arrangement, select your delivery date and address, then proceed to checkout. It's that simple." },
      { q:"What are your delivery hours?", a:"Manila Branch: 9:00 AM to 9:00 PM. Pampanga Branch: 7:30 AM to 5:00 PM. Orders placed late may be scheduled for next-day delivery." },
      { q:"Do you deliver outside Metro Manila?", a:"Yes, we deliver nationwide. Please ensure your delivery address is complete and accurate to avoid delays." },
      { q:"What is your cancellation policy?", a:"We don't accept cancellations after payment. However, your payment can be converted to store credit for a future order." },
    ],
  },
]

/* ── Accordion item ─────────────────────────────────────────────── */
function AccordionItem({ q, a, isDark, isOpen, onToggle }) {
  const contentRef = useRef(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current) setHeight(isOpen ? contentRef.current.scrollHeight : 0)
  }, [isOpen])

  const cardBg = isDark
    ? (isOpen ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.03)")
    : (isOpen ? "#ffffff" : "#F5FAF5")
  const cardBdr = isOpen
    ? (isDark ? "rgba(74,222,128,0.45)" : "rgba(46,139,52,0.55)")
    : (isDark ? "rgba(74,222,128,0.12)" : "#dceadd")
  const ringShdw = isOpen
    ? (isDark
        ? "0 0 0 1px rgba(74,222,128,0.35), 0 8px 28px rgba(0,0,0,0.35)"
        : "0 6px 22px rgba(12,87,62,0.12), 0 2px 6px rgba(12,87,62,0.06)")
    : (isDark
        ? "0 1px 0 rgba(255,255,255,0.02)"
        : "0 2px 8px rgba(12,87,62,0.05)")
  const qColor   = isDark ? (isOpen ? "#f0fdf4" : "#e2e8f0") : "#132015"
  const aColor   = isDark ? "#94a3b8" : "#4A7C59"
  const divColor = isDark ? "rgba(74,222,128,0.12)" : "rgba(12,87,62,0.1)"
  const chevColor = isOpen
    ? (isDark ? "#4ade80" : DG)
    : (isDark ? "rgba(74,222,128,0.5)" : "rgba(12,87,62,0.45)")

  return (
    <div
      className="rounded-[20px] overflow-hidden transition-all duration-300"
      style={{
        border: `1px solid ${cardBdr}`,
        background: cardBg,
        backdropFilter: isDark ? "blur(12px)" : "none",
        WebkitBackdropFilter: isDark ? "blur(12px)" : "none",
        boxShadow: ringShdw,
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left border-none cursor-pointer bg-transparent"
      >
        <span
          className="text-[15px] font-medium leading-snug pr-2 transition-colors duration-200"
          style={{ color: qColor }}
        >
          {q}
        </span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={chevColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
          className="shrink-0 transition-transform duration-300"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      <div style={{ height: `${height}px`, overflow: "hidden", transition: "height 0.35s cubic-bezier(0.4,0,0.2,1)" }}>
        <div ref={contentRef} className="px-6 pb-6 pt-4" style={{ borderTop: `1px solid ${divColor}` }}>
          <p className="text-[14px] leading-[1.75] m-0" style={{ color: aColor }}>{a}</p>
        </div>
      </div>
    </div>
  )
}

/* ── Main ───────────────────────────────────────────────────────── */
export default function HomeFAQ({ onNavigate }) {
  const { isDark } = useTheme()
  const sectionRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [openIdx, setOpenIdx] = useState(0)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.06 }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => { setOpenIdx(0) }, [activeTab])

  const openChat = () => window.dispatchEvent(new CustomEvent("bloomora:open-chat"))

  /* palette */
  const accentG    = isDark ? "#4ade80" : G
  const accentGlow = isDark ? "0 0 10px rgba(74,222,128,0.5)" : "none"
  const sectionBg  = isDark ? "#0f1a14" : "#ffffff"
  const sectionBdr = isDark ? "#2d3748" : "#f3f4f6"
  const headingC   = isDark ? "#f0fdf4" : "#132015"
  const bodyC      = isDark ? "#9ca3af" : "#4A7C59"

  /* tab pill */
  const tabTrayBg     = isDark ? "rgba(255,255,255,0.04)" : "#F2F7F3"
  const tabTrayBdr    = isDark ? "rgba(74,222,128,0.15)" : "#dceadd"
  const tabActiveBg   = isDark ? "#4ade80" : DG
  const tabActiveColor = isDark ? "#0a1f0d" : "#ffffff"
  const tabIdleColor  = isDark ? "#cbd5e1" : "#4A7C59"

  /* CTA */
  const ctaBg       = isDark ? "#0C573E" : DG
  const ctaTitleC   = "#F2F7F3"
  const ctaSubC     = "rgba(242,247,243,0.7)"
  const ctaBtnBg    = isDark ? "#4ade80" : G
  const ctaBtnColor = isDark ? "#0a1f0d" : "#ffffff"

  const active = FAQS[activeTab]

  return (
    <section
      className="py-[clamp(56px,7vw,96px)] border-b"
      style={{ backgroundColor: sectionBg, borderColor: sectionBdr }}
    >
      <div ref={sectionRef} className="max-w-[880px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header (preserved) */}
        <div
          className="text-center mb-12 transition-all duration-500"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)" }}
        >
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: accentG }}>
            Got Questions?
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: headingC }}>
            Frequently Asked Questions
          </h2>
          <p className="text-sm mb-4" style={{ color: bodyC }}>
            Find quick answers to the most common questions about our flowers, orders, and delivery.
          </p>
          <div
            className="w-12 h-[3px] mx-auto rounded-full"
            style={{ backgroundColor: accentG, boxShadow: accentGlow }}
          />
        </div>

        {/* Segmented tabs */}
        <div className="flex justify-center mb-10">
          <div
            className="inline-flex p-1 rounded-full"
            style={{ backgroundColor: tabTrayBg, border: `1px solid ${tabTrayBdr}` }}
          >
            {FAQS.map((c, i) => {
              const isActive = i === activeTab
              return (
                <button
                  key={c.category}
                  onClick={() => setActiveTab(i)}
                  className="px-5 sm:px-6 py-2 rounded-full text-[13px] font-semibold transition-all duration-300 border-none cursor-pointer"
                  style={{
                    backgroundColor: isActive ? tabActiveBg : "transparent",
                    color: isActive ? tabActiveColor : tabIdleColor,
                    boxShadow: isActive && isDark ? "0 0 14px rgba(74,222,128,0.35)" : "none",
                  }}
                >
                  {c.category}
                </button>
              )
            })}
          </div>
        </div>

        {/* Accordion stack */}
        <div className="flex flex-col gap-3">
          {active.items.map((item, i) => (
            <div
              key={`${activeTab}-${i}`}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(12px)",
                transition: `opacity 0.5s ease ${i * 70}ms, transform 0.5s ease ${i * 70}ms`,
              }}
            >
              <AccordionItem
                q={item.q}
                a={item.a}
                isDark={isDark}
                isOpen={openIdx === i}
                onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
              />
            </div>
          ))}
        </div>

        {/* Support CTA */}
        <div
          className="mt-[clamp(32px,4vw,48px)] flex flex-col sm:flex-row items-center justify-between gap-5 rounded-[24px] p-6 sm:p-8 transition-all duration-500"
          style={{
            backgroundColor: ctaBg,
            boxShadow: isDark
              ? "0 0 0 1px rgba(74,222,128,0.15), 0 12px 40px rgba(0,0,0,0.4)"
              : "0 12px 32px rgba(12,87,62,0.18)",
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateY(14px)",
            transitionDelay: "0.22s",
          }}
        >
          <div className="text-center sm:text-left">
            <p className="text-lg font-bold mb-1" style={{ color: ctaTitleC }}>
              Still have questions?
            </p>
            <p className="text-sm" style={{ color: ctaSubC }}>
              Chat with our friendly support team, we'd love to help.
            </p>
          </div>
          <button
            onClick={openChat}
            className="flex items-center gap-2 py-3 pl-3 pr-5 rounded-full text-sm font-semibold border-none cursor-pointer whitespace-nowrap transition-transform duration-200 hover:scale-[1.03]"
            style={{
              backgroundColor: ctaBtnBg,
              color: ctaBtnColor,
              boxShadow: isDark ? "0 0 18px rgba(74,222,128,0.35)" : "0 6px 18px rgba(46,139,52,0.35)",
            }}
          >
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: isDark ? "rgba(10,31,13,0.25)" : "rgba(255,255,255,0.22)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </span>
            Chat with us
          </button>
        </div>

      </div>
    </section>
  )
}
