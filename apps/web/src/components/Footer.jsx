import { useEffect } from "react"
import paypalImg       from "../assets/PayPal.png"
import westernUnionImg from "../assets/WesternUnion.png"
import gcashImg        from "../assets/GCash.png"
import bdoImg          from "../assets/BDO.png"
import bpiImg          from "../assets/BPI.png"
import metrobankImg    from "../assets/Metrobank.png"
import lalamoveImg     from "../assets/Lalamove.png"

/* ─── Data ───────────────────────────────────────────────────── */
const QUICK_LINKS = [
  { label: "Home",       page: "home" },
  { label: "Shop",       page: "shop" },
  { label: "Occasions",  page: "occasions" },
  { label: "About Us",   page: "about" },
  { label: "Contact Us", page: "contact" },
]
const CUSTOMER_CARE = [
  { label: "FAQs",           page: "faq" },
  { label: "Track My Order", page: "orders" },
  { label: "Return Policy",  page: "return-policy" },
]
const SOCIAL_LINKS = [
  { name: "Facebook",  href: "https://www.facebook.com/profile.php?id=100063877087893", icon: <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg> },
  { name: "Instagram", href: "https://www.instagram.com/estingsflowershop/",            icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg> },
  { name: "WhatsApp",  href: "#", icon: <svg width="16" height="16" fill="currentColor" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg> },
  { name: "Gmail",     href: "#", icon: <svg width="16" height="16" fill="currentColor" viewBox="0 0 512 512"><path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/></svg> },
]
const PAYMENT_METHODS = [
  { name: "PayPal",        img: paypalImg },
  { name: "Western Union", img: westernUnionImg },
  { name: "GCash",         img: gcashImg },
  { name: "BDO",           img: bdoImg },
  { name: "BPI",           img: bpiImg },
  { name: "Metrobank",     img: metrobankImg },
]

/* ─── Theme ──────────────────────────────────────────────────── */
const C = {
  accent:      "#7daa91",
  accentLight: "#b8d4c2",
  text:        "rgba(255,255,255,0.95)",
  textMid:     "rgba(255,255,255,0.75)",
  textDim:     "rgba(255,255,255,0.45)",
  divider:     "rgba(255,255,255,0.08)",
  cardBg:      "rgba(255,255,255,0.04)",
}

/* ─── CSS ────────────────────────────────────────────────────── */
const FOOTER_CSS = `
  .ft-navlink {
    background: none; border: none; cursor: pointer; padding: 0;
    font-size: 13px; text-align: left; display: block;
    transition: color 0.15s, padding-left 0.15s;
    font-family: var(--font-ui);
  }
  .ft-navlink:hover { color: white !important; padding-left: 5px; }

  .ft-social {
    width: 34px; height: 34px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 8px; text-decoration: none;
    transition: background 0.18s, border-color 0.18s, color 0.18s;
  }
  .ft-social:hover {
    background: rgba(125,170,145,0.18) !important;
    border-color: #7daa91 !important;
    color: white !important;
  }

  .ft-logo-img {
    border-radius: 4px; opacity: 0.82;
    transition: opacity 0.15s, transform 0.15s;
  }
  .ft-logo-img:hover { opacity: 1 !important; transform: scale(1.06); }

  .ft-top-btn {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 8px; cursor: pointer;
    transition: background 0.18s, border-color 0.18s, color 0.18s;
  }
  .ft-top-btn:hover {
    background: rgba(125,170,145,0.20) !important;
    border-color: #7daa91 !important;
    color: white !important;
  }
`

/* ─── Small helpers ──────────────────────────────────────────── */
const PinIcon   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: C.accentLight, flexShrink: 0, marginTop: "2px" }}><path fillRule="evenodd" clipRule="evenodd" d="M11.54 22.351a.76.76 0 00.723 0C14.339 21.187 21 16.492 21 10.5a9 9 0 10-18 0c0 5.992 6.661 10.687 8.54 11.851zM12 13.5a3 3 0 100-6 3 3 0 000 6z"/></svg>
const ClockIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.accentLight, flexShrink: 0, marginTop: "1px" }}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
const PhoneIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.accentLight, flexShrink: 0, marginTop: "1px" }}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>

const ColLabel = ({ children }) => (
  <p style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: C.accentLight, marginBottom: "14px", marginTop: 0 }}>
    {children}
  </p>
)

const InfoRow = ({ icon, children }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: "7px", marginBottom: "6px" }}>
    <span style={{ marginTop: "2px" }}>{icon}</span>
    <p style={{ fontSize: "12.5px", color: C.textMid, margin: 0, lineHeight: "1.5", fontFamily: "var(--font-ui)" }}>{children}</p>
  </div>
)

/* ─── Footer ─────────────────────────────────────────────────── */
export default function Footer({ onNavigate }) {
  const go          = (page) => onNavigate?.(page)
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" })

  useEffect(() => {
    if (document.getElementById("bloomora-footer-css")) return
    const tag = document.createElement("style")
    tag.id = "bloomora-footer-css"
    tag.textContent = FOOTER_CSS
    document.head.appendChild(tag)
    return () => document.getElementById("bloomora-footer-css")?.remove()
  }, [])

  return (
    <footer style={{ backgroundColor: "#0C5240", color: "white" }}>

      {/* Top accent line */}
      <div style={{ height: "3px", background: "linear-gradient(90deg, transparent, #3d8a65 20%, #a8c5b2 50%, #3d8a65 80%, transparent)" }} />

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 40px 0" }}>

        {/* ══ ROW 1: Logo + tagline on left · Socials on right ══ */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "32px",
          flexWrap: "wrap",
          paddingBottom: "36px",
          borderBottom: `1px solid ${C.divider}`,
          marginBottom: "40px",
        }}>
          {/* Logo + tagline */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
              <img
                src="/src/assets/EstingsLogo.svg"
                alt=""
                style={{ width: "46px", height: "46px", objectFit: "contain" }}
                onError={e => e.target.style.display = "none"}
              />
              <img
                src="/src/assets/Estings.svg"
                alt="Esting's"
                style={{ height: "38px", objectFit: "contain", filter: "brightness(0) invert(1)" }}
                onError={e => e.target.style.display = "none"}
              />
            </div>
            <p style={{ fontSize: "13px", color: C.textMid, margin: 0, lineHeight: "1.6", maxWidth: "280px", fontFamily: "var(--font-ui)" }}>
              Fresh flowers, handcrafted with care.<br />
              Serving Manila &amp; Pampanga since 1959.
            </p>
          </div>

          {/* Social icons */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
            <p style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: C.accentLight, margin: 0 }}>
              Follow Us On
            </p>
            <div style={{ display: "flex", gap: "7px" }}>
              {SOCIAL_LINKS.map(s => (
                <a
                  key={s.name}
                  href={s.href}
                  title={s.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ft-social"
                  style={{ background: C.cardBg, border: `1px solid ${C.divider}`, color: C.textMid }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ══ ROW 2: Nav links + Branch info + Payments ══ */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "160px 140px 1fr 1fr auto",
          gap: "40px",
          alignItems: "start",
          paddingBottom: "44px",
        }}
          className="ft-main-row"
        >

          {/* Quick Links */}
          <div>
            <ColLabel>Quick Links</ColLabel>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              {QUICK_LINKS.map(link => (
                <li key={link.label}>
                  <button className="ft-navlink" onClick={() => go(link.page)} style={{ color: C.textMid }}>
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <ColLabel>Customer Care</ColLabel>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              {CUSTOMER_CARE.map(link => (
                <li key={link.label}>
                  <button className="ft-navlink" onClick={() => go(link.page)} style={{ color: C.textMid }}>
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Manila Branch */}
          <div>
            <ColLabel>Manila Branch</ColLabel>
            <InfoRow icon={<PinIcon />}>Laon-Laan Cor. Dos Castillas St., Sampaloc</InfoRow>
            <InfoRow icon={<ClockIcon />}>Mon – Sat · 9:00 AM – 9:00 PM</InfoRow>
            <InfoRow icon={<PhoneIcon />}>+63 918 902 2401</InfoRow>
          </div>

          {/* Pampanga Branch */}
          <div>
            <ColLabel>Pampanga Branch</ColLabel>
            <InfoRow icon={<PinIcon />}>McArthur Hi-way, Dolores, San Fernando</InfoRow>
            <InfoRow icon={<ClockIcon />}>Mon – Sat · 7:30 AM – 5:00 PM</InfoRow>
            <InfoRow icon={<PhoneIcon />}>+63 045 961 5378</InfoRow>
          </div>

          {/* We Accept + Shipped Via — stacked vertically */}
          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div>
              <ColLabel>We Accept</ColLabel>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", maxWidth: "160px" }}>
                {PAYMENT_METHODS.map(({ name, img }) => (
                  <img
                    key={name}
                    src={img}
                    alt={name}
                    title={name}
                    className="ft-logo-img"
                    style={{ height: "22px", width: "auto", maxWidth: "54px", objectFit: "contain" }}
                  />
                ))}
              </div>
            </div>
            <div>
              <ColLabel>Shipped Via</ColLabel>
              <img
                src={lalamoveImg}
                alt="Lalamove"
                className="ft-logo-img"
                style={{ height: "24px", width: "auto", maxWidth: "90px", objectFit: "contain", display: "block" }}
              />
            </div>
          </div>
        </div>

        {/* Responsive overrides via injected style */}
        <style>{`
          @media (max-width: 1024px) {
            .ft-main-row {
              grid-template-columns: repeat(3, 1fr) !important;
            }
          }
          @media (max-width: 640px) {
            .ft-main-row {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 28px !important;
            }
          }
          @media (max-width: 400px) {
            .ft-main-row {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>

      {/* ══ Copyright bar ══ */}
      <div style={{ borderTop: `1px solid ${C.divider}`, background: "rgba(0,0,0,0.18)" }}>
        <div style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "14px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}>
          <p style={{ fontSize: "12px", color: C.textDim, margin: 0, fontFamily: "var(--font-ui)" }}>
            © {new Date().getFullYear()} Esting's Flower International Inc. All rights reserved.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button
              onClick={() => go("terms")}
              style={{ fontSize: "12px", color: C.textDim, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s", fontFamily: "var(--font-ui)" }}
              onMouseEnter={e => e.currentTarget.style.color = C.text}
              onMouseLeave={e => e.currentTarget.style.color = C.textDim}
            >
              Terms of Service
            </button>

            {/* Back to top */}
            <button
              onClick={scrollToTop}
              title="Back to top"
              className="ft-top-btn"
              style={{ background: C.cardBg, border: `1px solid ${C.divider}`, color: C.textMid }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 15l-6-6-6 6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

    </footer>
  )
}