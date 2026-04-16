import { useState } from "react"
import pageBg5 from "../assets/PageBG5.png"
import Footer from "../components/Footer"

const G = "#2E8B34"
const DG = "#0C573E"

const FAQS = [
  {
    q: "What are your delivery hours?",
    a: "Our delivery hours vary by branch:\n\nManila Branch: 9:00 AM – 9:00 PM\nPampanga Branch: 7:30 AM – 5:00 PM\n\nOrders placed later in the evening may be scheduled for next-day delivery instead of same-day service.",
  },
  {
    q: "Do you deliver outside Metro Manila?",
    a: "Yes, we do. Please ensure that you provide a complete and accurate delivery address to avoid any delays.",
  },
  {
    q: "Can I customize my arrangement?",
    a: "Yes. You can use our \"Make it Personal\" feature to describe your ideal bouquet or create your own arrangement through our Mix and Match option.",
  },
  {
    q: "What is your cancellation policy?",
    a: "We do not accept cancellations once payment has been made. However, the amount paid can be converted into store credit, which you may use for a future order at your convenience.",
  },
  {
    q: "Do you offer bulk orders?",
    a: "Yes, we accept bulk orders. Kindly send us a message through our website so we can discuss your requirements, including quantity and pricing.",
  },
]

export default function ContactUs({ onNavigate }) {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [sent, setSent] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeMap, setActiveMap] = useState("manila")

  const handleSend = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => { setLoading(false); setSent(true) }, 800)
  }

  // Google Maps embed URLs for each branch
  const MAP_URLS = {
    manila: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.0!2d120.9946!3d14.6042!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b6f3e4c4a1c3%3A0x0!2s1605+Laon-Laan+St%2C+Sampaloc%2C+Manila!5e0!3m2!1sen!2sph!4v1",
    pampanga: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3853.0!2d120.6900!3d15.0300!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3396ef5aa0e14b4d%3A0x0!2sMcArthur+Hwy%2C+Dolores%2C+San+Fernando%2C+Pampanga!5e0!3m2!1sen!2sph!4v1",
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero with PageBG5 image ── */}
      <div className="relative overflow-hidden" style={{ minHeight: "280px" }}>
        <img src={pageBg5} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(12,87,62,0.90) 0%, rgba(12,87,62,0.70) 55%, rgba(12,87,62,0.35) 100%)" }} />
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 py-16">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#86efac" }}>Contact Esting's</p>
          <h1 className="text-4xl font-bold text-white mb-3">Need Assistance?</h1>
          <p className="text-base max-w-xl" style={{ color: "rgba(255,255,255,0.8)" }}>
            From product inquiries to delivery concerns, feel free to contact your nearest branch or send us a message below. We'll get back to you as soon as we can.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-16 space-y-16">

        {/* ── Contact cards — redesigned with branch tabs ── */}
        <div className="grid sm:grid-cols-3 gap-5">
          {/* Visit Us */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: "#F0F7F1" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "white" }}>
                <svg className="w-4 h-4" style={{ color: G }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold" style={{ color: DG }}>Visit Us</h3>
            </div>
            <div className="px-5 py-4 divide-y divide-gray-50">
              <div className="pb-4">
                <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: G }}>Manila</p>
                <p className="text-sm text-gray-600 leading-snug">1605 Laon-Laan Corner Dos Castillas Street, Sampaloc, Manila</p>
              </div>
              <div className="pt-4">
                <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: G }}>Pampanga</p>
                <p className="text-sm text-gray-600 leading-snug">McArthur Hi-way, Dolores, City of San Fernando, Pampanga C-2000</p>
              </div>
            </div>
          </div>

          {/* Call Us */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: "#F0F7F1" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "white" }}>
                <svg className="w-4 h-4" style={{ color: G }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold" style={{ color: DG }}>Call Us</h3>
            </div>
            <div className="px-5 py-4 divide-y divide-gray-50">
              <div className="pb-4">
                <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: G }}>Manila</p>
                <a href="tel:+639189022401" className="text-sm text-gray-600 hover:text-green-700 transition font-medium">+63 918 902 2401</a>
                <p className="text-xs text-gray-400 mt-0.5">9:00 AM – 9:00 PM daily</p>
              </div>
              <div className="pt-4">
                <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: G }}>Pampanga</p>
                <a href="tel:+630459615378" className="text-sm text-gray-600 hover:text-green-700 transition font-medium">+63 045 961 5378</a>
                <p className="text-xs text-gray-400 mt-0.5">7:30 AM – 5:00 PM daily</p>
              </div>
            </div>
          </div>

          {/* Email Us */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: "#F0F7F1" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "white" }}>
                <svg className="w-4 h-4" style={{ color: G }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold" style={{ color: DG }}>Email Us</h3>
            </div>
            <div className="px-5 py-4 divide-y divide-gray-50">
              <div className="pb-4">
                <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: G }}>Manila</p>
                <a href="mailto:estings_manila@yahoo.com" className="text-sm text-gray-600 hover:text-green-700 transition font-medium break-all">estings_manila@yahoo.com</a>
              </div>
              <div className="pt-4">
                <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: G }}>Pampanga</p>
                <a href="mailto:estings_pampanga@yahoo.com" className="text-sm text-gray-600 hover:text-green-700 transition font-medium break-all">estings_pampanga@yahoo.com</a>
              </div>
            </div>
          </div>
        </div>

        {/* ── Find Us — Google Map ── */}
        <div>
          <div className="mb-5">
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: G }}>Find Us</p>
            <h2 className="text-xl font-bold text-gray-800">Our Branches</h2>
          </div>

          {/* Branch tab switcher */}
          <div className="flex gap-2 mb-4">
            {[
              { key: "manila", label: "Manila Branch" },
              { key: "pampanga", label: "Pampanga Branch" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveMap(key)}
                className="px-4 py-2 text-sm font-semibold rounded-lg border transition-all"
                style={{
                  backgroundColor: activeMap === key ? G : "white",
                  borderColor: activeMap === key ? G : "#e5e7eb",
                  color: activeMap === key ? "white" : "#6b7280",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Address strip */}
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 flex-shrink-0" style={{ color: G }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <p className="text-sm text-gray-500">
              {activeMap === "manila"
                ? "1605 Laon-Laan Corner Dos Castillas Street, Sampaloc, Manila"
                : "McArthur Hi-way, Dolores, City of San Fernando, Pampanga C-2000"}
            </p>
          </div>

          {/* Map iframe */}
          <div className="w-full rounded-xl overflow-hidden border border-gray-200" style={{ height: "380px" }}>
            <iframe
              key={activeMap}
              src={MAP_URLS[activeMap]}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`${activeMap === "manila" ? "Manila" : "Pampanga"} Branch Location`}
            />
          </div>
        </div>

        {/* ── Form + FAQ ── */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-12">

          {/* Contact form */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6">Send us a message</h2>
            {sent ? (
              <div className="border border-gray-100 rounded-xl p-10 text-center">
                <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#F0F7F1" }}>
                  <svg className="w-6 h-6" style={{ color: G }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Message sent</h3>
                <p className="text-sm text-gray-400 mb-5">Thank you for reaching out. We'll get back to you shortly.</p>
                <button onClick={() => setSent(false)} className="text-sm font-semibold hover:underline" style={{ color: G }}>
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSend} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { key: "name", label: "Full Name", placeholder: "Juan dela Cruz" },
                    { key: "email", label: "Email Address", placeholder: "juandelacruz@gmail.com", type: "email" },
                  ].map(({ key, label, placeholder, type = "text" }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
                      <input
                        type={type}
                        value={form[key]}
                        onChange={e => setForm({ ...form, [key]: e.target.value })}
                        placeholder={placeholder}
                        required
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 transition placeholder-gray-300"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Subject</label>
                  <select
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 transition text-gray-600"
                  >
                    <option value="">Select a topic</option>
                    {["Order Inquiry", "Custom Arrangement", "Delivery Issue", "Bulk Order", "Feedback", "Other"].map(o => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Message</label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us how we can help..."
                    required
                    rows={5}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 transition resize-none placeholder-gray-300 leading-relaxed"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:brightness-105 disabled:opacity-60"
                  style={{ backgroundColor: G }}
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>

          {/* FAQs */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6">Frequently asked questions</h2>
            <div className="space-y-1">
              {FAQS.map((faq, i) => (
                <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition"
                  >
                    <span className="text-sm font-medium text-gray-800 pr-4">{faq.q}</span>
                    <svg
                      className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
                      style={{ transform: openFaq === i ? "rotate(180deg)" : "rotate(0)" }}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 pt-3 text-sm text-gray-500 leading-relaxed border-t border-gray-50 whitespace-pre-line">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Social */}
            <div className="mt-6 border border-gray-100 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Show Us Your Moment</h3>
              <p className="text-xs text-gray-400 mb-3">Got your flowers from us? Tag Esting’s, we’d love to see it.</p>
              <div className="flex gap-2">
                <a href="https://www.facebook.com/profile.php?id=100063877087893" target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-xs font-semibold transition hover:opacity-90"
                  style={{ backgroundColor: "#1877F2" }}>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>
                  Facebook
                </a>
                <a href="https://www.instagram.com/estingsflowershop/" target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-xs font-semibold transition hover:opacity-90"
                  style={{ backgroundColor: "#E1306C" }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
