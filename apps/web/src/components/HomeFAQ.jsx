import { useState, useRef, useEffect } from "react"
import { useTheme } from "../context/ThemeContext"

const G  = "#2E8B34"
const DG = "#0C573E"

const FAQS = [
  {
    category: "General",
    items: [
      {
        q: "How long has Esting's Flowers been in business?",
        a: "Esting's Flowers International Inc. was established in 1959, making us one of the longest-running floral businesses in the Philippines.",
      },
      {
        q: "Where are your branches located?",
        a: "We have two main branches: one in Sampaloc, Manila, and another in San Fernando, Pampanga.",
      },
      {
        q: "Do you accept international orders?",
        a: "Yes. While we deliver exclusively within the Philippines, we accept orders from customers residing anywhere in the world.",
      },
    ],
  },
  {
    category: "Ordering",
    items: [
      {
        q: "How does the two-way customization work?",
        a: "We offer two ways to personalize your arrangement. Mix and Match lets you manually select the arrangement type (bouquet, vase, or box), flower types, colors, and wrappers. Describe Your Arrangement lets you provide a text description of your vision, and our Flux Generative AI Model creates a high-fidelity visual preview based on our actual stock.",
      },
      {
        q: "Why is the customization feature sometimes unavailable?",
        a: "The administrator reserves the right to disable customization features during peak seasons, such as Valentine's Day or Mother's Day, to prioritize the high volume of orders during those periods.",
      },
      {
        q: "Can I see what my custom arrangement will look like before I pay?",
        a: "Yes. The AI Concept Preview generates an image of your arrangement so you can visualize the final product and reduce the imagination gap before finalizing your purchase.",
      },
      {
        q: "Can I order in bulk?",
        a: "Yes. The platform includes a Quotation Feature specifically designed for handling bulk arrangement inquiries and pricing.",
      },
      {
        q: "How do I determine which branch to order from?",
        a: "Our system automatically checks whether your delivery address is within range of the branch you are ordering from. As a standard practice, please order from the branch closest to your delivery address to avoid any confusion.",
      },
    ],
  },
  {
    category: "Payments",
    items: [
      {
        q: "Do you offer Cash on Delivery (COD)?",
        a: "No. We follow a strict pay-as-you-order policy. All transactions must be completed and recorded online before we begin preparing your arrangement.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We process secure payments via the PayMongo API, which supports GCash, Maya, and credit or debit cards.",
      },
      {
        q: "What is your refund policy?",
        a: "In accordance with our business policy, cancellations and refunds are not allowed once a product has been paid for. However, we do allow exchanges if the product arrives in poor condition.",
      },
    ],
  },
  {
    category: "Delivery",
    items: [
      {
        q: "What is the cutoff time for same-day delivery?",
        a: "Orders must be placed by 12:00 PM Philippine Standard Time to qualify for same-day delivery. Any orders received after this cutoff will be delivered the following day.",
      },
      {
        q: "What is the turnaround time for custom orders?",
        a: "If all required materials are available and the order was placed before the same-day delivery cutoff, it will be eligible for same-day delivery. Orders placed after the cutoff will arrive the following day. If materials are unavailable, turnaround time will vary.",
      },
      {
        q: "How is the delivery fee calculated?",
        a: "Delivery fees are distance-based and calculated in real time through our integration with the Lalamove API.",
      },
      {
        q: "How do I track my order?",
        a: "You can monitor your order in real time through the Order Tracking progress bar on our web and mobile platforms, which shows each stage from Order Placed to Delivered.",
      },
      {
        q: "I am ordering from abroad. How do I know if the shop is open?",
        a: "Purchases can only be made while the shop is open according to Philippine Standard Time. If the shop is closed, the system will automatically notify you before you attempt to make a purchase. To assist international customers, the system automatically checks your time zone against the shop's operational hours to determine if your order is eligible for same-day delivery.",
      },
    ],
  },
]

function AccordionItem({ q, a, isDark, isOpen, onToggle }) {
  const contentRef = useRef(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current) setHeight(isOpen ? contentRef.current.scrollHeight : 0)
  }, [isOpen])

  const cardBg    = isDark ? (isOpen ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.03)") : (isOpen ? "#ffffff" : "#F5FAF5")
  const cardBdr   = isOpen ? (isDark ? "rgba(74,222,128,0.45)" : "rgba(46,139,52,0.55)") : (isDark ? "rgba(74,222,128,0.12)" : "#dceadd")
  const ringShdw  = isOpen
    ? (isDark ? "0 0 0 1px rgba(74,222,128,0.35), 0 8px 28px rgba(0,0,0,0.35)" : "0 6px 22px rgba(12,87,62,0.12), 0 2px 6px rgba(12,87,62,0.06)")
    : (isDark ? "0 1px 0 rgba(255,255,255,0.02)" : "0 2px 8px rgba(12,87,62,0.05)")
  const qColor    = isDark ? (isOpen ? "#f0fdf4" : "#e2e8f0") : "#132015"
  const aColor    = isDark ? "#94a3b8" : "#4A7C59"
  const divColor  = isDark ? "rgba(74,222,128,0.12)" : "rgba(12,87,62,0.1)"
  const chevColor = isOpen ? (isDark ? "#4ade80" : DG) : (isDark ? "rgba(74,222,128,0.5)" : "rgba(12,87,62,0.45)")

  return (
    <div className="rounded-[20px] overflow-hidden transition-all duration-300"
      style={{ border:`1px solid ${cardBdr}`, background:cardBg, backdropFilter:isDark?"blur(12px)":"none", WebkitBackdropFilter:isDark?"blur(12px)":"none", boxShadow:ringShdw }}>
      <button onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left border-none cursor-pointer bg-transparent">
        <span className="text-[15px] font-medium leading-snug pr-2 transition-colors duration-200" style={{ color:qColor }}>{q}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={chevColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
          className="shrink-0 transition-transform duration-300"
          style={{ transform:isOpen?"rotate(180deg)":"rotate(0deg)" }}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      <div style={{ height:`${height}px`, overflow:"hidden", transition:"height 0.35s cubic-bezier(0.4,0,0.2,1)" }}>
        <div ref={contentRef} className="px-6 pb-6 pt-4" style={{ borderTop:`1px solid ${divColor}` }}>
          <p className="text-[14px] leading-[1.75] m-0" style={{ color:aColor }}>{a}</p>
        </div>
      </div>
    </div>
  )
}

export default function HomeFAQ({ onNavigate }) {
  const { isDark } = useTheme()
  const sectionRef = useRef(null)
  const [visible, setVisible]     = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [openIdx, setOpenIdx]     = useState(0)

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

  const accentG    = isDark ? "#4ade80" : G
  const accentGlow = isDark ? "0 0 10px rgba(74,222,128,0.5)" : "none"
  const sectionBg  = isDark ? "#0f1a14" : "#ffffff"
  const sectionBdr = isDark ? "#2d3748" : "#f3f4f6"
  const headingC   = isDark ? "#f0fdf4" : "#132015"
  const bodyC      = isDark ? "#9ca3af" : "#4A7C59"

  const tabTrayBg      = isDark ? "rgba(255,255,255,0.04)" : "#F2F7F3"
  const tabTrayBdr     = isDark ? "rgba(74,222,128,0.15)" : "#dceadd"
  const tabActiveBg    = isDark ? "#4ade80" : DG
  const tabActiveColor = isDark ? "#0a1f0d" : "#ffffff"
  const tabIdleColor   = isDark ? "#cbd5e1" : "#4A7C59"

  // ── Support CTA — redesigned to remove green-on-green ──
  // Light: clean neutral card (cream/white) so the green button reads as a sharp accent.
  // Dark:  green-tinted dark panel (matches the review cards / trust bar) with a neon button.
  const ctaBg        = isDark ? "#0f1f17" : "#F2F7F3"
  const ctaBdr       = isDark ? "rgba(74,222,128,0.22)" : "#dceadd"
  const ctaShdw      = isDark
    ? "0 0 0 1px rgba(74,222,128,0.12), 0 12px 40px rgba(0,0,0,0.4)"
    : "0 8px 28px rgba(12,87,62,0.08)"
  const ctaTitleC    = isDark ? "#f0fdf4" : "#132015"
  const ctaSubC      = isDark ? "#9ca3af" : "#4A7C59"
  const ctaIconWrapBg= isDark ? "rgba(74,222,128,0.12)" : "rgba(46,139,52,0.1)"
  const ctaIconColor = isDark ? "#4ade80" : DG
  const ctaBtnBg     = isDark ? "#4ade80" : DG
  const ctaBtnColor  = isDark ? "#0a1f0d" : "#ffffff"
  const ctaBtnGlow   = isDark ? "0 0 18px rgba(74,222,128,0.4)" : "0 6px 18px rgba(12,87,62,0.3)"
  const ctaBtnIconBg = isDark ? "rgba(10,31,13,0.22)" : "rgba(255,255,255,0.22)"

  const active = FAQS[activeTab]

  return (
    <section className="py-[clamp(56px,7vw,96px)] border-b" style={{ backgroundColor:sectionBg, borderColor:sectionBdr }}>
      <div ref={sectionRef} className="max-w-[880px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12 transition-all duration-500"
          style={{ opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(24px)" }}>
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color:accentG }}>Got Questions?</p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color:headingC }}>Frequently Asked Questions</h2>
          <p className="text-sm mb-4" style={{ color:bodyC }}>
            Find quick answers to the most common questions about our flowers, orders, and delivery.
          </p>
          <div className="w-12 h-[3px] mx-auto rounded-full" style={{ backgroundColor:accentG, boxShadow:accentGlow }} />
        </div>

        {/* Segmented tabs — balanced 2x2 grid on mobile, single pill row on larger screens */}
        <div className="flex justify-center mb-10">
          <div className="grid grid-cols-2 sm:inline-flex w-full max-w-[320px] sm:w-auto sm:max-w-none gap-1 p-1 rounded-2xl sm:rounded-full justify-center"
            style={{ backgroundColor:tabTrayBg, border:`1px solid ${tabTrayBdr}` }}>
            {FAQS.map((c, i) => {
              const isActive = i === activeTab
              return (
                <button key={c.category} onClick={() => setActiveTab(i)}
                  className="px-4 sm:px-6 py-2 rounded-full text-[13px] font-semibold transition-all duration-300 border-none cursor-pointer text-center"
                  style={{
                    backgroundColor: isActive ? tabActiveBg : "transparent",
                    color: isActive ? tabActiveColor : tabIdleColor,
                    boxShadow: isActive && isDark ? "0 0 14px rgba(74,222,128,0.35)" : "none",
                  }}>
                  {c.category}
                </button>
              )
            })}
          </div>
        </div>

        {/* Accordion */}
        <div className="flex flex-col gap-3">
          {active.items.map((item, i) => (
            <div key={`${activeTab}-${i}`}
              style={{
                opacity: visible?1:0,
                transform: visible?"translateY(0)":"translateY(12px)",
                transition: `opacity 0.5s ease ${i*70}ms, transform 0.5s ease ${i*70}ms`,
              }}>
              <AccordionItem
                q={item.q} a={item.a} isDark={isDark}
                isOpen={openIdx===i}
                onToggle={() => setOpenIdx(openIdx===i?-1:i)}
              />
            </div>
          ))}
        </div>

        {/* Support CTA — neutral surface so the button is a clean accent (no green-on-green) */}
        <div className="mt-[clamp(32px,4vw,48px)] flex flex-col sm:flex-row items-center justify-between gap-5 rounded-[24px] p-6 sm:p-8 transition-all duration-500"
          style={{
            backgroundColor: ctaBg,
            border: `1px solid ${ctaBdr}`,
            boxShadow: ctaShdw,
            opacity: visible?1:0,
            transform: visible?"none":"translateY(14px)",
            transitionDelay: "0.22s",
          }}>
          <div className="flex items-center gap-4 text-center sm:text-left">
            {/* Leading chat glyph in a soft tinted circle — ties the block together */}
            <span className="hidden sm:flex w-11 h-11 rounded-full items-center justify-center shrink-0"
              style={{ backgroundColor:ctaIconWrapBg, color:ctaIconColor }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"/>
              </svg>
            </span>
            <div>
              <p className="text-lg font-bold mb-1" style={{ color:ctaTitleC }}>Still have questions?</p>
              <p className="text-sm" style={{ color:ctaSubC }}>Chat with our friendly support team, we would love to help.</p>
            </div>
          </div>
          <button onClick={openChat}
            className="flex items-center gap-2 py-3 pl-3 pr-5 rounded-full text-sm font-semibold border-none cursor-pointer whitespace-nowrap transition-transform duration-200 hover:scale-[1.03]"
            style={{ backgroundColor:ctaBtnBg, color:ctaBtnColor, boxShadow:ctaBtnGlow }}>
            <span className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor:ctaBtnIconBg }}>
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