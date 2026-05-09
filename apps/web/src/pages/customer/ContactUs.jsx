import { useState, useRef } from "react"
import { useTheme } from "../../context/ThemeContext"
import pageBg5 from "../../assets/PageBG5.webp"
import Footer  from "../../components/Footer"

const G  = "#2E8B34"
const DG = "#0C573E"

const MAP_URLS = {
  manila:   "https://maps.google.com/maps?q=Esting%27s+Flower+Shop+Laon-Laan+Dos+Castillas+Sampaloc+Manila&t=&z=17&ie=UTF8&iwloc=&output=embed",
  pampanga: "https://maps.google.com/maps?q=Esting%27s+Flower+Shop+MacArthur+Highway+Dolores+San+Fernando+Pampanga&t=&z=17&ie=UTF8&iwloc=&output=embed",
}

const CONTACT_INFO = {
  manila: {
    address:"1605 Laon-Laan Corner Dos Castillas Street, Sampaloc, Manila",
    phone:"+63 918 902 2401",
    email:"estings_manila@yahoo.com",
    hours:"9:00 AM – 9:00 PM daily",
  },
  pampanga: {
    address:"McArthur Hi-way, Dolores, City of San Fernando, Pampanga C-2000",
    phone:"+63 045 961 5378",
    email:"estings_pampanga@yahoo.com",
    hours:"7:30 AM – 5:00 PM daily",
  },
}

function IconPin()   { return <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/></svg> }
function IconPhone() { return <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/></svg> }
function IconMail()  { return <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/></svg> }
function IconClock() { return <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg> }
function IconChat()  { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"/></svg> }

export default function ContactUs({ onNavigate }) {
  const { isDark } = useTheme()
  const [activeMap, setActiveMap] = useState("manila")
  const leftRef = useRef(null)
  const info = CONTACT_INFO[activeMap]

  const openChat = () => window.dispatchEvent(new CustomEvent("bloomora:open-chat"))

  // ── color tokens ──────────────────────────────────────────────────────────
  const pageBg      = isDark ? "#111827" : "white"
  const accentG     = isDark ? "#4ade80" : G
  const headingC    = isDark ? "#f3f4f6" : "#1f2937"
  const subC        = isDark ? "#9ca3af" : "#6b7280"

  // branch selector
  const branchActiveBg  = DG
  const branchInactiveBg = isDark ? "#1a2332" : "white"
  const branchInactiveBdr = isDark ? "#2d3748" : "#e5e7eb"
  const branchInactiveC = isDark ? "#9ca3af" : "#6b7280"

  // contact cards
  const cardBg    = isDark ? "#1a2332" : "#f8fffe"
  const cardBdr   = isDark ? "#2d3748" : "#e0f0e8"
  const iconBg    = isDark ? "rgba(74,222,128,0.1)" : "#e6f4ea"
  const iconColor = isDark ? "#4ade80" : DG
  const cardLabelC = isDark ? "#4ade80" : G
  const cardValueC = isDark ? "#e5e7eb" : "#1f2937"
  const cardSubC   = isDark ? "#6b7280" : "#9ca3af"

  // map section
  const mapBdr   = isDark ? "#2d3748" : "#e0f0e8"
  const mapCaptionC = isDark ? "#6b7280" : "#9ca3af"

  return (
    <div className="min-h-screen" style={{ backgroundColor: pageBg }}>

      {/* Hero — image-based */}
      <div className="relative overflow-hidden" style={{ minHeight:"280px" }}>
        <img src={pageBg5} alt="" className="absolute inset-0 w-full h-full object-cover"/>
        <div className="absolute inset-0" style={{ background:"linear-gradient(to right,rgba(12,87,62,0.92) 0%,rgba(12,87,62,0.72) 55%,rgba(12,87,62,0.38) 100%)" }}/>
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 py-16">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color:"#86efac" }}>Contact Esting's</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">Get In Touch</h1>
          <p className="text-base max-w-xl" style={{ color:"rgba(255,255,255,0.78)" }}>
            We're here to help. Visit us in store, give us a call, or shoot us an email. Two branches, one commitment to great service.
          </p>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-14">
        <div className="grid lg:grid-cols-[400px_1fr] gap-8 items-stretch">

          {/* LEFT */}
          <div ref={leftRef} className="flex flex-col gap-5">

            {/* Branch selector */}
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: accentG }}>Select Branch</p>
              <div className="flex gap-2">
                {[{ key:"manila", label:"Manila" }, { key:"pampanga", label:"Pampanga" }].map(({ key, label }) => (
                  <button key={key} onClick={() => setActiveMap(key)}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-xl border-2 transition-all duration-200"
                    style={{
                      backgroundColor: activeMap===key ? DG : branchInactiveBg,
                      borderColor: activeMap===key ? DG : branchInactiveBdr,
                      color: activeMap===key ? "white" : branchInactiveC,
                    }}>
                    {label} Branch
                  </button>
                ))}
              </div>
            </div>

            {/* Contact cards */}
            {[
              { icon:<IconPin/>,   label:"Visit Us",    value:info.address },
              { icon:<IconPhone/>, label:"Call Us",     value:info.phone,  sub:info.hours,                  href:`tel:${info.phone.replace(/\s/g,"")}` },
              { icon:<IconMail/>,  label:"Email Us",    value:info.email,  sub:"We reply within 24 hours",  href:`mailto:${info.email}` },
              { icon:<IconClock/>, label:"Store Hours", value:info.hours,  sub:"Open daily including holidays" },
            ].map(({ icon, label, value, sub, href }) => (
              <div key={label} className="rounded-2xl p-5 flex items-start gap-4 transition-all duration-200 hover:shadow-md"
                style={{ backgroundColor: cardBg, border:`1.5px solid ${cardBdr}` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: iconBg, color: iconColor }}>
                  {icon}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: cardLabelC }}>{label}</p>
                  {href ? (
                    <a href={href} className="text-sm font-semibold transition block break-all"
                      style={{ color: cardValueC }}
                      onMouseEnter={e => e.currentTarget.style.color = accentG}
                      onMouseLeave={e => e.currentTarget.style.color = cardValueC}>
                      {value}
                    </a>
                  ) : (
                    <p className="text-sm font-semibold leading-snug" style={{ color: cardValueC }}>{value}</p>
                  )}
                  {sub && <p className="text-xs mt-0.5" style={{ color: cardSubC }}>{sub}</p>}
                </div>
              </div>
            ))}

            {/* Chat CTA — always green gradient */}
            <div className="rounded-2xl p-6" style={{ background:`linear-gradient(135deg,${DG} 0%,${G} 100%)` }}>
              <p className="text-white font-bold text-base mb-1">Want to chat with us?</p>
              <p className="text-sm mb-4" style={{ color:"rgba(255,255,255,0.72)" }}>
                Our team is online and ready to answer any question — instantly.
              </p>
              <button onClick={openChat}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor:"white", color:DG }}>
                <IconChat/>
                Open Chat
              </button>
            </div>
          </div>

          {/* RIGHT — map */}
          <div className="flex flex-col">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: accentG }}>
              {activeMap==="manila"?"Manila":"Pampanga"} Branch — Location
            </p>
            <div className="flex-1 rounded-2xl overflow-hidden shadow-lg"
              style={{ border:`1.5px solid ${mapBdr}`, minHeight:"400px" }}>
              <iframe
                key={activeMap}
                src={MAP_URLS[activeMap]}
                width="100%" height="100%"
                style={{ border:0, display:"block", minHeight:"400px" }}
                allowFullScreen loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${activeMap==="manila"?"Manila":"Pampanga"} Branch Location`}
              />
            </div>
            <p className="text-xs mt-2 flex items-center gap-1" style={{ color: mapCaptionC }}>
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/>
              </svg>
              {info.address}
            </p>
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate}/>
    </div>
  )
}
