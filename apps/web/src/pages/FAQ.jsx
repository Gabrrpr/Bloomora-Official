import { useState } from "react"
import Footer from "../components/Footer"

const G = "#2E8B34"
const DG = "#0C573E"

const FAQ_CATEGORIES = [
  {
    category: "Ordering & Delivery",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    faqs: [
      { q: "What are your delivery hours?", a: "Our delivery hours vary by branch:\n\nManila Branch: 9:00 AM – 9:00 PM\nPampanga Branch: 7:30 AM – 5:00 PM\n\nOrders placed late in the evening may be scheduled for next-day delivery." },
      { q: "Do you deliver outside Metro Manila?", a: "Yes, we do. Please ensure you provide a complete and accurate delivery address to avoid any delays." },
      { q: "How do I track my order?", a: "Once your order is confirmed, you can track it through the Orders section in your account. You'll also receive updates via the contact number you provided." },
      { q: "Can I schedule a specific delivery time?", a: "We accommodate preferred delivery windows where possible. Please include your preferred time when placing your order, and our team will do their best to accommodate it." },
    ],
  },
  {
    category: "Products & Customization",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
      </svg>
    ),
    faqs: [
      { q: "Can I customize my arrangement?", a: "Yes. You can use our \"Make it Personal\" feature to describe your ideal bouquet, or create your own arrangement through our Mix and Match option." },
      { q: "Do you offer bulk orders?", a: "Yes, we accept bulk orders. Send us a message through our website so we can discuss your requirements, including quantity and pricing." },
      { q: "Are all flowers fresh?", a: "Absolutely. We take pride in sourcing only fresh-cut flowers. Our stock is refreshed regularly to ensure every arrangement you receive is vibrant and long-lasting." },
      { q: "Can I include a personalized message?", a: "Yes! You can add a message card to any order during checkout. Simply enter your message in the provided field." },
    ],
  },
  {
    category: "Payments & Cancellations",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 21Z" />
      </svg>
    ),
    faqs: [
      { q: "What payment methods do you accept?", a: "We accept GCash, PayPal, BDO, BPI, Metrobank bank transfers, and Western Union for international orders." },
      { q: "What is your cancellation policy?", a: "We do not accept cancellations once payment has been made. However, the amount paid can be converted into store credit, which you may use for a future order at your convenience." },
      { q: "Is it safe to pay online?", a: "Yes. All transactions through our platform are secured. We do not store your payment details." },
    ],
  },
]

export default function FAQ({ onNavigate }) {
  const [openItem, setOpenItem] = useState(null)

  const toggle = (key) => setOpenItem(openItem === key ? null : key)

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${DG} 0%, ${G} 100%)`, paddingTop: "64px", paddingBottom: "64px" }}>
        <div className="max-w-4xl mx-auto px-6 sm:px-10 text-center">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#86efac" }}>Help Center</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Frequently Asked<br />Questions</h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.75)" }}>
            Everything you need to know about ordering, delivery, and our products.
          </p>
        </div>
      </div>

      {/* FAQ content */}
      <div className="max-w-4xl mx-auto px-6 sm:px-10 py-16">
        <div className="flex flex-col gap-12">
          {FAQ_CATEGORIES.map((cat) => (
            <div key={cat.category}>
              {/* Category header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#e6f4ea", color: DG }}>
                  {cat.icon}
                </div>
                <h2 className="text-lg font-bold text-gray-800">{cat.category}</h2>
              </div>

              {/* Items */}
              <div className="flex flex-col gap-2">
                {cat.faqs.map((faq, i) => {
                  const key = `${cat.category}-${i}`
                  const isOpen = openItem === key
                  return (
                    <div
                      key={key}
                      className="rounded-2xl overflow-hidden transition-all duration-200"
                      style={{ border: isOpen ? `1.5px solid ${G}` : "1.5px solid #e5e7eb" }}
                    >
                      <button
                        onClick={() => toggle(key)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
                        style={{ backgroundColor: isOpen ? "#f2f9f3" : "white" }}
                      >
                        <span className="text-sm font-semibold text-gray-800 pr-4">{faq.q}</span>
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
                          style={{ backgroundColor: isOpen ? G : "#f3f4f6" }}
                        >
                          <svg
                            className="w-3.5 h-3.5 transition-transform duration-200"
                            style={{ color: isOpen ? "white" : "#9ca3af", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                          </svg>
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 text-sm text-gray-500 leading-relaxed whitespace-pre-line border-t" style={{ borderColor: "#e5e7eb" }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still need help CTA */}
        <div className="mt-16 rounded-3xl p-8 text-center" style={{ background: `linear-gradient(135deg, ${DG} 0%, ${G} 100%)` }}>
          <h3 className="text-xl font-bold text-white mb-2">Still have questions?</h3>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.72)" }}>Our team is happy to help. Reach out to us anytime.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onNavigate && onNavigate("contact")}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white border-2 border-white/40 hover:bg-white/10 transition"
            >
              Contact Us
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("bloomora:open-chat"))}
              className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:shadow-lg"
              style={{ backgroundColor: "white", color: DG }}
            >
              Open Live Chat
            </button>
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  )
}
