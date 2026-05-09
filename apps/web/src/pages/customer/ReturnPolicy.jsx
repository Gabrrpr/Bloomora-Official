import { useTheme } from "../../context/ThemeContext"
import pageBg5 from "../../assets/PageBG5.webp"
import Footer  from "../../components/Footer"

const G  = "#2E8B34"
const DG = "#0C573E"

const SECTIONS = [
  {
    title: "No-Cancellation Policy",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"/></svg>,
    content: "Once payment has been made, your order is confirmed and we start processing it right away to ensure timely delivery and freshness. We are unable to cancel at that stage, but if you need to adjust your delivery address or preferred time, please contact us as soon as possible and we will do our best to help before dispatch.",
  },
  {
    title: "Store Credit",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>,
    content: "If you are unable to go through with your order after payment, the full amount will be converted into store credit. It never expires, covers delivery fees, and can be applied to any future order. To request a conversion, reach out to us through the website, phone, or live chat with your order reference number.",
  },
  {
    title: "Quality Concerns",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>,
    content: "If your flowers arrive damaged, wilted, or noticeably different from what you ordered, let us know within 24 hours of delivery. Send us your order reference number, a clear photo of the arrangement as received, and a short description of the issue. We review every case promptly and will offer a replacement or store credit depending on what happened.",
  },
  {
    title: "Wrong or Incomplete Deliveries",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>,
    content: "If the wrong arrangement or an incomplete order is delivered, contact us right away and we will arrange for the correct items to arrive as soon as possible at no extra charge. Please hold onto everything you received until the concern is fully resolved, as we may need it as part of the review.",
  },
  {
    title: "Non-Returnable Items",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/></svg>,
    items: [
      "Fresh flowers and arrangements already accepted upon delivery",
      "Custom or personalized arrangements made specifically to your request",
      "Any items that have been used, altered, or tampered with after delivery",
    ],
    footer: "Because flowers are perishable, we cannot accept returns based on personal preference once delivery is completed. We encourage you to inspect your order right when it arrives and reach out immediately if anything looks off.",
  },
]

export default function ReturnPolicy({ onNavigate }) {
  const { isDark } = useTheme()

  const pageBg     = isDark ? "#111827" : "white"
  const titleC     = isDark ? "#e5e7eb" : "#1f2937"
  const bodyC      = isDark ? "#9ca3af" : "#6b7280"
  const cardBg     = isDark ? "#1a2332" : "white"
  const cardBdr    = isDark ? "#2d3748" : "#e5e7eb"
  const iconBg     = isDark ? "rgba(74,222,128,0.1)" : "#e6f4ea"
  const iconC      = isDark ? "#4ade80" : DG
  const bulletC    = isDark ? "#4ade80" : G
  const noteC      = isDark ? "#6b7280" : "#9ca3af"
  const noteBdr    = isDark ? "#2d3748" : "#e5e7eb"
  const summaryBg  = isDark ? "rgba(74,222,128,0.07)" : "#f2f9f3"
  const summaryBdr = isDark ? "rgba(74,222,128,0.25)" : "#c6e6cb"

  return (
    <div className="min-h-screen" style={{ backgroundColor: pageBg }}>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ minHeight:"280px" }}>
        <img src={pageBg5} alt="" className="absolute inset-0 w-full h-full object-cover"/>
        <div className="absolute inset-0"
          style={{ background:"linear-gradient(to right,rgba(12,87,62,0.92) 0%,rgba(12,87,62,0.72) 55%,rgba(12,87,62,0.38) 100%)" }}/>
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 py-16">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color:"#86efac" }}>Policies</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">Return Policy</h1>
          <p className="text-base max-w-xl" style={{ color:"rgba(255,255,255,0.78)" }}>
            We want every experience with Esting's to be a good one. Here is what you need to know about our return and refund process.
          </p>
          <p className="text-xs mt-4" style={{ color:"rgba(255,255,255,0.45)" }}>Last updated: January 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">

        {/* Quick summary */}
        <div className="rounded-2xl p-5 sm:p-6 mb-10 flex items-start gap-4"
          style={{ backgroundColor: summaryBg, border:`1.5px solid ${summaryBdr}` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: iconBg, color: iconC }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold mb-1" style={{ color: titleC }}>Quick Summary</p>
            <p className="text-sm leading-relaxed" style={{ color: bodyC }}>
              No cancellations after payment. Paid amounts can be converted to store credit that never expires. Quality issues must be reported within 24 hours of delivery with a photo.
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-5">
          {SECTIONS.map((section, i) => (
            <div key={i} className="rounded-2xl p-5 sm:p-7"
              style={{ backgroundColor: cardBg, border:`1.5px solid ${cardBdr}` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: iconBg, color: iconC }}>
                  {section.icon}
                </div>
                <h2 className="text-base font-bold" style={{ color: titleC }}>{section.title}</h2>
              </div>
              {section.content && (
                <p className="text-sm leading-relaxed" style={{ color: bodyC }}>{section.content}</p>
              )}
              {section.items && (
                <>
                  <ul className="space-y-2.5 mb-4">
                    {section.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm" style={{ color: bodyC }}>
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke={bulletC} strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                  {section.footer && (
                    <p className="text-xs leading-relaxed mt-3 pl-3" style={{ color: noteC, borderLeft:`2px solid ${noteBdr}` }}>
                      {section.footer}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-3xl p-7 sm:p-8 text-center"
          style={{ background:`linear-gradient(135deg,${DG} 0%,${G} 100%)` }}>
          <h3 className="text-xl font-bold text-white mb-2">Have a concern about your order?</h3>
          <p className="text-sm mb-6" style={{ color:"rgba(255,255,255,0.72)" }}>
            Our team is here to help resolve any issues quickly and fairly.
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
