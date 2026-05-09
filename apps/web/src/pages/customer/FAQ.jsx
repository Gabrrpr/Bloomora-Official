import { useState, useRef, useEffect } from "react"
import { useTheme } from "../../context/ThemeContext"
import pageBg5 from "../../assets/PageBG5.webp"
import Footer from "../../components/Footer"

const G  = "#2E8B34"
const DG = "#0C573E"

const FAQ_CATEGORIES = [
  {
    category: "Ordering & Delivery",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
      </svg>
    ),
    faqs: [
      { q: "What are your delivery hours?", a: "Our delivery hours vary by branch. The Manila Branch is open from 9:00 AM to 9:00 PM, while the Pampanga Branch runs from 7:30 AM to 5:00 PM. Orders placed late in the evening may be scheduled for the following day." },
      { q: "Do you deliver outside Metro Manila?", a: "Yes, we deliver nationwide. Just make sure to provide a complete and accurate address so there are no delays with your order." },
      { q: "How do I track my order?", a: "Once your order is confirmed, you can track it through the Orders section in your account. We will also send updates to the contact number you provided during checkout." },
      { q: "Can I schedule a specific delivery time?", a: "We do our best to accommodate preferred delivery windows. Just include your preferred time when placing your order and our team will try to meet it." },
    ],
  },
  {
    category: "Products & Customization",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"/>
      </svg>
    ),
    faqs: [
      { q: "Can I customize my arrangement?", a: "Yes. You can use our Make it Personal feature to describe your ideal bouquet, or build your own through Mix and Match. We love making something that feels personal to you and whoever you are sending it to." },
      { q: "Do you offer bulk orders?", a: "Yes, we accept bulk orders. Send us a message through our website and we will work through the details with you, including quantity and pricing." },
      { q: "Are all flowers fresh?", a: "Absolutely. We source only fresh-cut flowers and refresh our stock regularly so that every arrangement you receive is vibrant and long-lasting." },
      { q: "Can I include a personalized message?", a: "Yes. You can add a message card to any order at checkout. Just type what you want to say in the message field and we will include it with your arrangement." },
    ],
  },
  {
    category: "Payments & Cancellations",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 21Z"/>
      </svg>
    ),
    faqs: [
      { q: "What payment methods do you accept?", a: "We accept GCash, PayPal, BDO, BPI, Metrobank bank transfers, and Western Union for international orders." },
      { q: "What is your cancellation policy?", a: "We do not accept cancellations once payment has been made. However, the full amount paid can be converted into store credit that you can use on any future order at your convenience." },
      { q: "Is it safe to pay online?", a: "Yes. All transactions through our platform are secured and we do not store your payment details." },
    ],
  },
]

// ── Smooth accordion item ─────────────────────────────────────────────────────
function AccordionItem({ faq, itemKey, openItem, toggle, isDark }) {
  const isOpen  = openItem === itemKey
  const bodyRef = useRef(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (bodyRef.current) {
      setHeight(isOpen ? bodyRef.current.scrollHeight : 0)
    }
  }, [isOpen])

  // Colors — answer text is noticeably bright/dark for real readability
  const cardBdr   = isOpen ? (isDark ? "#4ade80" : G) : (isDark ? "#2d3748" : "#e5e7eb")
  const btnBg     = isOpen ? (isDark ? "rgba(74,222,128,0.08)" : "#f0fdf4") : (isDark ? "#1a2332" : "white")
  const questionC = isDark ? "#f1f5f9" : "#111827"
  const answerC   = isDark ? "#e2e8f0" : "#374151"   // high-contrast — easy to read
  const answerBg  = isDark ? "#111827" : "#f9fafb"
  const chevBg    = isOpen ? (isDark ? "#4ade80" : G) : (isDark ? "#1e293b" : "#f3f4f6")
  const chevC     = isOpen ? "white" : (isDark ? "#94a3b8" : "#6b7280")
  const dividerC  = isDark ? "#2d3748" : "#e5e7eb"

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border:`1.5px solid ${cardBdr}`, transition:"border-color 0.25s ease" }}>

      {/* Question button */}
      <button onClick={() => toggle(itemKey)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
        style={{ backgroundColor:btnBg, transition:"background-color 0.25s ease" }}>
        <span className="text-sm font-semibold leading-snug flex-1 pr-2" style={{ color:questionC }}>
          {faq.q}
        </span>
        {/* Chevron — rotates smoothly */}
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: chevBg,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "background-color 0.25s ease, transform 0.38s cubic-bezier(0.4,0,0.2,1)",
          }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke={chevC} strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
          </svg>
        </div>
      </button>

      {/* Answer — smooth height animation */}
      <div style={{
        height: `${height}px`,
        overflow: "hidden",
        transition: "height 0.38s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <div ref={bodyRef} className="px-5 pt-3 pb-5 border-t"
          style={{ borderColor:dividerC, color:answerC, backgroundColor:answerBg, fontSize:"0.9rem", lineHeight:"1.8" }}>
          {faq.a}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FAQ({ onNavigate }) {
  const { isDark } = useTheme()
  const [openItem, setOpenItem] = useState(null)
  const toggle = (key) => setOpenItem(openItem === key ? null : key)

  const pageBg    = isDark ? "#111827" : "white"
  const catHeadC  = isDark ? "#f1f5f9" : "#1f2937"
  const catIconBg = isDark ? "rgba(74,222,128,0.12)" : "#e6f4ea"
  const catIconC  = isDark ? "#4ade80" : DG

  return (
    <div className="min-h-screen" style={{ backgroundColor: pageBg }}>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ minHeight:"280px" }}>
        <img src={pageBg5} alt="" className="absolute inset-0 w-full h-full object-cover"/>
        <div className="absolute inset-0"
          style={{ background:"linear-gradient(to right,rgba(12,87,62,0.92) 0%,rgba(12,87,62,0.72) 55%,rgba(12,87,62,0.38) 100%)" }}/>
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 py-16">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color:"#86efac" }}>Help Center</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">
            Frequently Asked<br className="hidden sm:block"/>Questions
          </h1>
          <p className="text-base max-w-xl" style={{ color:"rgba(255,255,255,0.78)" }}>
            Everything you need to know about ordering, delivery, and our products. Find your answer below or reach out if you need more help.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="flex flex-col gap-10 sm:gap-12">
          {FAQ_CATEGORIES.map(cat => (
            <div key={cat.category}>
              {/* Category heading */}
              <div className="flex items-center gap-3 mb-4 sm:mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor:catIconBg, color:catIconC }}>
                  {cat.icon}
                </div>
                <h2 className="text-base sm:text-lg font-bold" style={{ color:catHeadC }}>
                  {cat.category}
                </h2>
              </div>

              <div className="flex flex-col gap-2.5">
                {cat.faqs.map((faq, i) => {
                  const key = `${cat.category}-${i}`
                  return (
                    <AccordionItem
                      key={key}
                      faq={faq}
                      itemKey={key}
                      openItem={openItem}
                      toggle={toggle}
                      isDark={isDark}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 sm:mt-16 rounded-3xl p-7 sm:p-8 text-center"
          style={{ background:`linear-gradient(135deg,${DG} 0%,${G} 100%)` }}>
          <h3 className="text-xl font-bold text-white mb-2">Still have questions?</h3>
          <p className="text-sm mb-6" style={{ color:"rgba(255,255,255,0.72)" }}>
            Our team is happy to help. Reach out to us anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => onNavigate?.("contact")}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white border-2 border-white/40 hover:bg-white/10 transition">
              Contact Us
            </button>
            <button onClick={() => window.dispatchEvent(new CustomEvent("bloomora:open-chat"))}
              className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:shadow-lg"
              style={{ backgroundColor:"white", color:DG }}>
              Open Live Chat
            </button>
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate}/>
    </div>
  )
}