import { useState, useRef, useEffect } from "react"

const G = "#2E8B34"
const DG = "#0C573E"

const FAQS = [
  {
    category: "Products Related",
    items: [
      { q: "Will my order look exactly like the picture?", a: "Each arrangement is handcrafted, so minor variations in bloom shape and color may occur. However, we always stay true to the overall style, color palette, and size shown." },
      { q: "Do the flowers come in a vase?", a: "Most arrangements are delivered in a bouquet wrap. Vases are available as an add-on — just mention it when placing your order." },
      { q: "Can I include a gift message with my order?", a: "Yes! You can add a personalized message card during checkout. Just type your message in the provided field." },
      { q: "Can I customize my arrangement?", a: "Absolutely. Use our Make it Personal feature to describe your ideal bouquet, or build your own through Mix and Match." },
    ],
  },
  {
    category: "Order Related",
    items: [
      { q: "How do I place an order?", a: "Browse our shop, choose your arrangement, select your delivery date and address, then proceed to checkout. It's that simple." },
      { q: "What are your delivery hours?", a: "Manila Branch: 9:00 AM – 9:00 PM. Pampanga Branch: 7:30 AM – 5:00 PM. Orders placed late may be scheduled for next-day delivery." },
      { q: "Do you deliver outside Metro Manila?", a: "Yes, we deliver nationwide. Please ensure your delivery address is complete and accurate to avoid delays." },
      { q: "What is your cancellation policy?", a: "We don't accept cancellations after payment. However, your payment can be converted to store credit for a future order." },
    ],
  },
]

// Smooth animated accordion item
function AccordionItem({ q, a, index }) {
  const [open, setOpen] = useState(false)
  const contentRef = useRef(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current) {
      setHeight(open ? contentRef.current.scrollHeight : 0)
    }
  }, [open])

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: open ? `1.5px solid ${G}` : "1.5px solid #e5e7eb", transition: "border-color 0.2s ease" }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors duration-200"
        style={{ backgroundColor: open ? "#f2f9f3" : "white" }}
      >
        {/* Flower icon */}
        <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: open ? "#e6f4ea" : "#f3f4f6" }}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={open ? DG : "#9ca3af"} strokeWidth="1.6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.5c0-1.5-1-2.5-2.5-2.5S7 5 7 6.5c0 1 .5 1.8 1.3 2.2C7.5 9.2 7 10 7 11c0 1.7 1.3 3 3 3h.5m1.5-7.5c0-1.5 1-2.5 2.5-2.5S17 5 17 6.5c0 1-.5 1.8-1.3 2.2.8.5 1.3 1.3 1.3 2.3 0 1.7-1.3 3-3 3H12" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v6" />
          </svg>
        </div>

        <span className="text-sm font-semibold text-gray-800 flex-1 pr-2">{q}</span>

        {/* Chevron — rotates smoothly */}
        <div
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
          style={{ backgroundColor: open ? G : "#f3f4f6", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke={open ? "white" : "#9ca3af"} strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {/* Smooth height animation */}
      <div
        style={{
          height: `${height}px`,
          overflow: "hidden",
          transition: "height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div ref={contentRef} className="px-5 pb-4 pt-1 border-t" style={{ borderColor: "#e5e7eb" }}>
          <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  )
}

export default function HomeFAQ({ onNavigate }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-16 px-4 sm:px-8" style={{ backgroundColor: "#f9fbf9" }}>
      <div className="max-w-4xl mx-auto"
        style={{ transition: "opacity 0.6s ease, transform 0.6s ease", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)" }}>

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: G }}>Got Questions?</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">Frequently Asked Questions</h2>
          <div className="w-12 h-0.5 mx-auto" style={{ backgroundColor: G }} />
        </div>

        {/* Categories */}
        <div className="flex flex-col gap-10">
          {FAQS.map((cat) => (
            <div key={cat.category}>
              <h3 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full inline-block" style={{ backgroundColor: G }} />
                {cat.category}
              </h3>
              <div className="flex flex-col gap-2">
                {cat.items.map((item, i) => (
                  <AccordionItem key={i} q={item.q} a={item.a} index={i} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-400 mb-3">Still have questions?</p>
          <button
            onClick={() => onNavigate && onNavigate("faq")}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:shadow-md"
            style={{ backgroundColor: DG }}
          >
            View All FAQs
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}
