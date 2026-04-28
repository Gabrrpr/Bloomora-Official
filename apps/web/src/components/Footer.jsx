import { useEffect } from "react"
import paypalImg       from "../assets/PayPal.png"
import westernUnionImg from "../assets/WesternUnion.png"
import gcashImg        from "../assets/GCash.png"
import bdoImg          from "../assets/BDO.png"
import bpiImg          from "../assets/BPI.png"
import metrobankImg    from "../assets/Metrobank.png"
import lalamoveImg     from "../assets/Lalamove.png"

/* ─── Data ─────────────────────────────────────────────────────── */
const QUICK_LINKS = [
  { label: "Home",       page: "home" },
  { label: "Shop",       page: "shop" },
  { label: "Occasions",  page: "occasions" },
  { label: "About Us",   page: "about" },
  { label: "Contact Us", page: "contact" },
]
const FLOWERS = [
  { label: "Best Sellers",       page: "shop" },
  { label: "Classic Collection", page: "shop" },
  { label: "Gift Sets",          page: "shop" },
]
const BOTANICALS = [
  { label: "Vases & Containers",     page: "shop" },
  { label: "Pots & Planters",        page: "shop" },
  { label: "Floral Supplies",        page: "shop" },
  { label: "Wrapping & Accessories", page: "shop" },
]
const OCCASIONS = [
  { label: "Birthdays",     page: "occasions" },
  { label: "Anniversaries", page: "occasions" },
  { label: "Weddings",      page: "occasions" },
  { label: "Graduations",   page: "occasions" },
  { label: "Sympathy",      page: "occasions" },
  { label: "Just Because",  page: "occasions" },
  { label: "Openings",      page: "occasions" },
]
const MAKE_IT_PERSONAL = [
  { label: "Describe Arrangement", page: "make-it-personal" },
  { label: "Mix & Match",          page: "make-it-personal" },
  { label: "See Examples",         page: "make-it-personal" },
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

/* ─── Theme ─────────────────────────────────────────────────────── */
const C = {
  accent:      "#7daa91",
  accentLight: "#b8d4c2",
  text:        "rgba(255,255,255,0.95)",
  textMid:     "rgba(255,255,255,0.82)",
  textDim:     "rgba(255,255,255,0.50)",
  border:      "rgba(255,255,255,0.09)",
  cardBg:      "rgba(255,255,255,0.04)",
}

/* ─── CSS ────────────────────────────────────────────────────────── */
const FOOTER_CSS = `
  .ft-outer { max-width: 1400px; margin: 0 auto; padding: 36px 32px 0; }

  /* ── Brand row: logo + description + socials, full width ── */
  .ft-brand-row {
    display: flex;
    align-items: flex-start;
    gap: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(255,255,255,0.09);
    margin-bottom: 28px;
  }
  .ft-brand-text { flex: 0 0 280px; }
  .ft-brand-social-wrap { flex: 0 0 auto; }

  /* ── Nav row: 6 equal columns, always one row ── */
  .ft-nav-row {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 20px;
    align-items: start;
  }
  /* Quick Links gets extra left breathing room */
  .ft-nav-row > *:first-child { padding-left: 0; }

  /* ── Strip ── */
  .ft-strip {
    display: flex; align-items: stretch;
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 10px; overflow: hidden;
    margin-bottom: 24px;
  }
  .ft-strip-panel { flex: 1; padding: 15px 18px; border-right: 1px solid rgba(255,255,255,0.09); }
  .ft-strip-panel:last-child { border-right: none; }
  .ft-strip-panel--payment   { flex: 1.3; }
  .ft-strip-panel--logistics { flex: 0 0 auto; min-width: 115px; }

  /* ── Copyright ── */
  .ft-copyright {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 10px;
    max-width: 1400px; margin: 0 auto; padding: 11px 32px;
  }

  /* ── Tablet ≤1024px: nav wraps to 3+3 ── */
  @media (max-width: 1024px) {
    .ft-brand-row { flex-direction: column; gap: 16px; }
    .ft-brand-text { flex: none; }
    .ft-nav-row { grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .ft-strip { flex-wrap: wrap; }
    .ft-strip-panel { flex: 1 1 48%; min-width: 180px; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.09); }
    .ft-strip-panel:nth-child(odd) { border-right: 1px solid rgba(255,255,255,0.09); }
    .ft-strip-panel--logistics { flex: 1 1 48%; min-width: 180px; }
    .ft-strip-panel:last-child,
    .ft-strip-panel:nth-last-child(2):nth-child(odd) { border-bottom: none; }
  }

  /* ── Small tablet ≤640px ── */
  @media (max-width: 640px) {
    .ft-outer { padding: 28px 20px 0; }
    .ft-nav-row { grid-template-columns: repeat(2, 1fr); gap: 20px; }
    .ft-strip { flex-direction: column; }
    .ft-strip-panel,
    .ft-strip-panel:nth-child(odd) { flex: none; width: 100%; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.09); }
    .ft-strip-panel:last-child { border-bottom: none; }
    .ft-strip-panel--logistics { min-width: unset; }
    .ft-copyright { padding: 11px 20px; }
  }

  /* ── Interactions ── */
  .ft-navlink {
    background: none; border: none; cursor: pointer; padding: 0;
    font-size: 12.5px; text-align: left; display: block;
    transition: color 0.15s, padding-left 0.15s;
  }
  .ft-navlink:hover { color: white !important; padding-left: 5px; }

  .ft-social {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 7px; text-decoration: none;
    transition: background 0.18s, border-color 0.18s, color 0.18s;
  }
  .ft-social:hover {
    background: rgba(125,170,145,0.18) !important;
    border-color: #7daa91 !important;
    color: white !important;
  }

  .ft-logo-img { border-radius: 5px; opacity: 0.88; transition: opacity 0.15s, transform 0.15s; }
  .ft-logo-img:hover { opacity: 1 !important; transform: scale(1.08); }

  .ft-top-btn {
    width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 7px; cursor: pointer;
    transition: background 0.18s, border-color 0.18s, color 0.18s;
  }
  .ft-top-btn:hover {
    background: rgba(125,170,145,0.18) !important;
    border-color: #7daa91 !important;
    color: white !important;
  }
`

/* ─── Micro-components ───────────────────────────────────────────── */
const PinIcon   = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ color: C.accentLight, flexShrink: 0, marginTop: "2px" }}><path fillRule="evenodd" clipRule="evenodd" d="M11.54 22.351a.76.76 0 00.723 0C14.339 21.187 21 16.492 21 10.5a9 9 0 10-18 0c0 5.992 6.661 10.687 8.54 11.851zM12 13.5a3 3 0 100-6 3 3 0 000 6z"/></svg>
const ClockIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.accentLight, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
const PhoneIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.accentLight, flexShrink: 0 }}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>

const SectionLabel = ({ children }) => (
  <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accentLight, marginBottom: "8px" }}>{children}</p>
)
const InfoRow = ({ icon, children }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "4px" }}>
    <span style={{ marginTop: "1px" }}>{icon}</span>
    <p style={{ fontSize: "11.5px", color: C.textMid, margin: 0, lineHeight: "1.4" }}>{children}</p>
  </div>
)
const NavCol = ({ title, links, go }) => (
  <div>
    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accentLight, marginBottom: "14px" }}>{title}</p>
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "9px" }}>
      {links.map(link => (
        <li key={link.label}>
          <button className="ft-navlink" onClick={() => go(link.page)} style={{ color: C.textMid }}>
            {link.label}
          </button>
        </li>
      ))}
    </ul>
  </div>
)

/* ─── Footer ─────────────────────────────────────────────────────── */
export default function Footer({ onNavigate }) {
  const go = (page) => onNavigate?.(page)
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

      {/* Top accent */}
      <div style={{ height: "3px", background: "linear-gradient(90deg, transparent, #3d8a65 20%, #a8c5b2 50%, #3d8a65 80%, transparent)" }} />

      <div className="ft-outer">

        {/* ── Brand row: description + socials side by side, above nav ── */}
        <div className="ft-brand-row">
          <div className="ft-brand-text">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <img src="/src/assets/EstingsLogo.svg" alt="" style={{ width: "34px", height: "34px", objectFit: "contain" }} onError={e => e.target.style.display = "none"} />
              <img src="/src/assets/Estings.svg" alt="Esting's" style={{ height: "22px", objectFit: "contain", filter: "brightness(0) invert(1)" }} onError={e => e.target.style.display = "none"} />
            </div>
            <p style={{ fontSize: "12px", lineHeight: "1.75", color: C.textMid, margin: 0 }}>
              Since 1959, Esting's Flower International Inc. has been delivering fresh, quality flowers.
            </p>
          </div>

          <div className="ft-brand-social-wrap">
            <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accentLight, marginBottom: "8px" }}>
              Follow Us On
            </p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {SOCIAL_LINKS.map(s => (
                <a key={s.name} href={s.href} title={s.name} target="_blank" rel="noopener noreferrer"
                  className="ft-social"
                  style={{ background: C.cardBg, border: `1px solid ${C.border}`, color: C.textMid }}
                >{s.icon}</a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Nav: always 6 columns in one row ── */}
        <div className="ft-nav-row">
          <NavCol title="Quick Links"       links={QUICK_LINKS}      go={go} />
          <NavCol title="Flowers"            links={FLOWERS}          go={go} />
          <NavCol title="Botanicals & Gifts" links={BOTANICALS}       go={go} />
          <NavCol title="Occasions"          links={OCCASIONS}        go={go} />
          <NavCol title="Make it Personal"   links={MAKE_IT_PERSONAL} go={go} />
          <NavCol title="Customer Care"      links={CUSTOMER_CARE}    go={go} />
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: C.border, margin: "28px 0" }} />

        {/* ── Strip ── */}
        <div className="ft-strip">
          <div className="ft-strip-panel">
            <SectionLabel>Manila Branch</SectionLabel>
            <InfoRow icon={<PinIcon />}>Laon-Laan Cor. Dos Castillas St., Sampaloc</InfoRow>
            <InfoRow icon={<ClockIcon />}>Mon – Sat &nbsp;·&nbsp; 9:00 AM – 9:00 PM</InfoRow>
            <InfoRow icon={<PhoneIcon />}>+63 918 902 2401</InfoRow>
          </div>
          <div className="ft-strip-panel">
            <SectionLabel>Pampanga Branch</SectionLabel>
            <InfoRow icon={<PinIcon />}>McArthur Hi-way, Dolores, San Fernando</InfoRow>
            <InfoRow icon={<ClockIcon />}>Mon – Sat &nbsp;·&nbsp; 7:30 AM – 5:00 PM</InfoRow>
            <InfoRow icon={<PhoneIcon />}>+63 045 961 5378</InfoRow>
          </div>
          <div className="ft-strip-panel ft-strip-panel--payment">
            <SectionLabel>We Accept</SectionLabel>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
              {PAYMENT_METHODS.map(({ name, img }) => (
                <img key={name} src={img} alt={name} title={name} className="ft-logo-img"
                  style={{ height: "22px", width: "auto", maxWidth: "58px", objectFit: "contain" }} />
              ))}
            </div>
          </div>
          <div className="ft-strip-panel ft-strip-panel--logistics">
            <SectionLabel>Shipped Via</SectionLabel>
            <img src={lalamoveImg} alt="Lalamove" className="ft-logo-img"
              style={{ height: "24px", width: "auto", maxWidth: "90px", objectFit: "contain", display: "block" }} />
          </div>
        </div>
      </div>

      {/* ── Copyright ── */}
      <div style={{ borderTop: `1px solid ${C.border}`, background: "rgba(0,0,0,0.15)" }}>
        <div className="ft-copyright">
          <p style={{ fontSize: "11.5px", color: C.textDim, margin: 0 }}>
            © {new Date().getFullYear()} Esting's Flower International Inc. All rights reserved.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button onClick={() => go("terms")}
              style={{ fontSize: "11.5px", color: C.textDim, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = C.text}
              onMouseLeave={e => e.currentTarget.style.color = C.textDim}
            >Terms of Service</button>
            <button onClick={scrollToTop} title="Back to top" className="ft-top-btn"
              style={{ background: C.cardBg, border: `1px solid ${C.border}`, color: C.textMid }}>
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
