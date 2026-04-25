import Footer from "../components/Footer"

const G = "#2E8B34"
const DG = "#0C573E"

const SECTIONS = [
  {
    title: "No-Cancellation Policy",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    content: `Once payment has been made, your order is considered confirmed and cannot be cancelled. We begin processing orders immediately after payment to ensure timely delivery and freshness.

If you need to make changes to your order (such as delivery address or preferred time), please contact us as soon as possible. We will do our best to accommodate last-minute adjustments before your order is dispatched.`,
  },
  {
    title: "Store Credit",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
      </svg>
    ),
    content: `If you are unable to proceed with your order after payment, the full amount will be converted into store credit.

Store credit can be used toward any future order and does not expire. It applies to the full order value including any delivery fees paid.

To request a store credit conversion, contact us via our website, phone, or live chat with your order reference number.`,
  },
  {
    title: "Quality Concerns",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    content: `We take great pride in the quality of every arrangement we deliver. If you receive flowers that are damaged, wilted, or significantly different from what was ordered, please contact us within 24 hours of delivery.

Please include:
• Your order reference number
• A photo of the arrangement as received
• A brief description of the concern

We will review your case promptly and offer an appropriate resolution, which may include a replacement or store credit.`,
  },
  {
    title: "Wrong or Incomplete Deliveries",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    content: `If you receive the wrong arrangement or an incomplete order, please get in touch with us immediately. We will arrange for the correct items to be delivered as quickly as possible at no additional charge.

Kindly do not discard any items received until the concern has been fully resolved, as we may request them to be returned.`,
  },
  {
    title: "Non-Returnable Items",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    ),
    content: `Due to the perishable nature of our products, the following items are non-returnable:

• Fresh flowers and arrangements already accepted upon delivery
• Custom or personalized arrangements that were made to order
• Any items that have been used, altered, or tampered with

We encourage all customers to inspect their delivery upon receipt and raise any concerns immediately.`,
  },
]

export default function ReturnPolicy({ onNavigate }) {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${DG} 0%, ${G} 100%)`, paddingTop: "64px", paddingBottom: "64px" }}>
        <div className="max-w-4xl mx-auto px-6 sm:px-10 text-center">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#86efac" }}>Policies</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Return Policy</h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.75)" }}>
            We want every experience with Esting's to be a great one. Here's what you need to know about our return and refund policies.
          </p>
          <p className="text-xs mt-5" style={{ color: "rgba(255,255,255,0.45)" }}>Last updated: January 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 sm:px-10 py-16">

        {/* Quick summary box */}
        <div className="rounded-2xl p-6 mb-12 flex items-start gap-4" style={{ backgroundColor: "#f2f9f3", border: `1.5px solid #c6e6cb` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#e6f4ea", color: DG }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 mb-1">Quick Summary</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              We do not accept cancellations after payment. Paid orders can be converted to store credit. Quality issues must be reported within 24 hours of delivery with photo evidence.
            </p>
          </div>
        </div>

        {/* Policy sections */}
        <div className="flex flex-col gap-8">
          {SECTIONS.map((section, i) => (
            <div key={i} className="rounded-2xl p-7" style={{ border: "1.5px solid #e5e7eb" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#e6f4ea", color: DG }}>
                  {section.icon}
                </div>
                <h2 className="text-base font-bold text-gray-800">{section.title}</h2>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{section.content}</p>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 rounded-3xl p-8 text-center" style={{ background: `linear-gradient(135deg, ${DG} 0%, ${G} 100%)` }}>
          <h3 className="text-xl font-bold text-white mb-2">Have a concern?</h3>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.72)" }}>
            Our team is here to help resolve any issues quickly and fairly.
          </p>
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
