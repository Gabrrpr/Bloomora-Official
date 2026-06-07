import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { getCartCount, getCart } from "../utils/cart.js";
import { api } from "../services/api.js";
import estingsLogo from "../assets/EstingsLogo.svg";
import estingsText from "../assets/Estings.svg";

// Branch photos
import manilaBranchImg   from "../assets/homepage/ManilaBranch.png";
import pampangaBranchImg from "../assets/homepage/PampangaBranch.png";

const SITE_GREEN = "#2E8B34";
const NAVY_GREEN = "#35530A";
const DARK_GREEN = "#0C573E";
const VIBRANT_GREEN = "#16a34a"; // more vibrant hover green for light mode

const STANDARD_CATEGORIES = ["flower", "vase", "wrapping", "accessory", "arrangement", "add-on"];

// ── Admin announcements (created on the admin Promotions page, stored in localStorage) ──
const ANNOUNCE_KEY = "bloomora_announcements";
const ANNOUNCE_READ_KEY = "bloomora_announcements_read"; // ids the user has read

// Map stored announcements -> notification objects the bell can render.
function readAnnouncementNotifs() {
  try {
    const raw = localStorage.getItem(ANNOUNCE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    let readIds = [];
    try { readIds = JSON.parse(localStorage.getItem(ANNOUNCE_READ_KEY) || "[]") || []; } catch { readIds = []; }
    return arr
      .filter(a => a && a.active !== false && a.text && a.text.trim())
      .map(a => ({
        id: `ann-${a.id}`,
        title: a.text.trim(),
        message: "",
        emoji: a.emoji || "",
        image: a.image || "",
        created_at: typeof a.id === "number" ? new Date(a.id).toISOString() : new Date().toISOString(),
        is_read: readIds.includes(`ann-${a.id}`),
        _announcement: true,
      }));
  } catch {
    return [];
  }
}

function markAnnouncementsRead(notifs) {
  try {
    const ids = notifs.filter(n => n._announcement).map(n => n.id);
    localStorage.setItem(ANNOUNCE_READ_KEY, JSON.stringify(ids));
  } catch { /* ignore */ }
}

const PROMOTIONS = [
  { text: "Get", highlight: "3% off your first order", cta: "SHOP NOW", page: "shop" },
  { text: "Free delivery on orders over", highlight: "₱2,000", cta: "ORDER NOW", page: "shop" },
  { text: "Custom bouquets made just for you!", highlight: "Make it Personal", cta: "TRY IT", page: "make-it-personal" },
  { text: "Visit us in", highlight: "Manila & Pampanga", cta: "GET DIRECTIONS", page: "contact" },
];



const SOCIAL_LINKS = [
  { name: "Facebook",  href: "https://www.facebook.com/profile.php?id=100063877087893", icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg> },
  { name: "Instagram", href: "https://www.instagram.com/estingsflowershop/", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg> },
  { name: "WhatsApp",  href: "#", icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg> },
  { name: "Gmail",     href: "#", icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 512 512"><path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/></svg> },
];

const BRANCHES = {
  Manila:   { address: "Laon-Laan Cor. Dos Castillas St., Sampaloc, Manila", hours: "Mon – Sat, 9:00 AM – 9:00 PM",  phone: "+63 918 902 2401", image: manilaBranchImg },
  Pampanga: { address: "McArthur Hi-way, Dolores, San Fernando, Pampanga",   hours: "Mon – Sat, 7:30 AM – 5:00 PM", phone: "+63 045 961 5378", image: pampangaBranchImg },
};

// ── Floating Hearts ───────────────────────────────────────────────────────────
const HEART_CSS = `
  @keyframes hRise1 { 0%{opacity:0;transform:translateY(4px) translateX(0) scale(0.5) rotate(-20deg)} 25%{opacity:1} 100%{opacity:0;transform:translateY(-38px) translateX(-10px) scale(1) rotate(-20deg)} }
  @keyframes hRise2 { 0%{opacity:0;transform:translateY(4px) translateX(0) scale(0.4) rotate(15deg)} 30%{opacity:1} 100%{opacity:0;transform:translateY(-44px) translateX(5px) scale(0.85) rotate(15deg)} }
  @keyframes hRise3 { 0%{opacity:0;transform:translateY(4px) translateX(0) scale(0.6) rotate(-5deg)} 20%{opacity:1} 100%{opacity:0;transform:translateY(-40px) translateX(12px) scale(1.1) rotate(-5deg)} }
  @keyframes hRise4 { 0%{opacity:0;transform:translateY(4px) translateX(0) scale(0.45)} 25%{opacity:0.9} 100%{opacity:0;transform:translateY(-35px) translateX(-6px) scale(0.8)} }
  @keyframes hRise5 { 0%{opacity:0;transform:translateY(4px) translateX(0) scale(0.35) rotate(25deg)} 20%{opacity:1} 100%{opacity:0;transform:translateY(-42px) translateX(8px) scale(0.9) rotate(25deg)} }
  @keyframes hPulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
`;

const HEARTS_CONFIG = [
  { anim:"hRise1 2.4s ease-out infinite", delay:"0s",    left:"-14px", size:10, color:"#f43f5e" },
  { anim:"hRise2 2.9s ease-out infinite", delay:"0.55s", left:"8%",   size:8,  color:"#ec4899" },
  { anim:"hRise3 2.2s ease-out infinite", delay:"1.1s",  left:"30%",  size:12, color:"#f43f5e" },
  { anim:"hRise4 2.7s ease-out infinite", delay:"0.3s",  right:"12%", size:9,  color:"#fb7185" },
  { anim:"hRise5 2.5s ease-out infinite", delay:"0.85s", right:"-12px",size:8, color:"#ec4899" },
];

function FloatingHearts() {
  return (
    <>
      {HEARTS_CONFIG.map((h, i) => (
        <span key={i} style={{
          position:"absolute", bottom:"calc(100% - 2px)",
          left:h.left, right:h.right,
          animation:h.anim, animationDelay:h.delay,
          pointerEvents:"none", zIndex:10, lineHeight:1,
          display:"inline-block",
        }}>
          <svg width={h.size} height={h.size} viewBox="0 0 24 24" fill={h.color}>
            <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
          </svg>
        </span>
      ))}
    </>
  );
}

// ── Branch Modal — clean image left, all text right ──────────────────────────
function BranchModal({ branch, onClose }) {
  const { isDark } = useTheme();
  const info = BRANCHES[branch];
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const neonG = isDark ? "#4ade80" : SITE_GREEN;

  return (
    <>
      <style>{`@keyframes bmIn { from { opacity:0; transform:scale(0.93) translateY(-16px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
      <div
        className="fixed inset-0 z-[100000] flex items-center justify-center px-3 sm:px-4 py-6 sm:py-4 overflow-y-auto"
        style={{ backgroundColor: "rgba(0,0,0,0.50)", backdropFilter: "blur(5px)" }}
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-[340px] sm:max-w-[640px] rounded-2xl overflow-hidden shadow-2xl"
          style={{
            backgroundColor: isDark ? "#0f1f17" : "#ffffff",
            animation: "bmIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
            boxShadow: isDark
              ? "0 0 0 1px rgba(74,222,128,0.2), 0 32px 80px rgba(0,0,0,0.6)"
              : "0 32px 80px rgba(0,0,0,0.28)",
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full text-white transition-all"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.7)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.45)"; }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          <div className="flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-1/2 aspect-[16/10] sm:aspect-square flex-shrink-0 overflow-hidden bg-gray-100">
              {info.image && !imgError ? (
                <img
                  src={info.image}
                  alt={`${branch} branch storefront`}
                  className="w-full h-full object-cover block"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: `linear-gradient(150deg, ${DARK_GREEN} 0%, #1a6b3f 50%, ${SITE_GREEN} 100%)` }}
                >
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/[0.06]"/>
                  <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/[0.05]"/>
                  <svg className="w-20 h-20 text-white/40 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742ZM12 13.5a3 3 0 100-6 3 3 0 000 6Z" clipRule="evenodd"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 p-4 sm:p-6 flex flex-col min-w-0">
              <div className="mb-4 sm:mb-5">
                <p className="text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-1"
                  style={{ color: isDark ? "#6b7280" : "#9ca3af" }}>
                  You&apos;ve selected
                </p>
                <h2 className="text-xl sm:text-2xl font-extrabold leading-tight"
                  style={{ color: neonG, textShadow: isDark ? "0 0 18px rgba(74,222,128,0.45)" : "none" }}>
                  {branch} Branch
                </h2>
                <div className="w-10 h-[3px] rounded-sm mt-2"
                  style={{ backgroundColor: neonG, boxShadow: isDark ? "0 0 10px rgba(74,222,128,0.6)" : "none" }} />
              </div>
              <div className="space-y-3 sm:space-y-4 flex-1">
                {[
                  { label:"Address", icon:<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>, value: info.address },
                  { label:"Store Hours", icon:<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>, value: info.hours },
                  { label:"Phone", icon:<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>, value: info.phone },
                ].map(row => (
                  <div key={row.label} className="flex items-start gap-3">
                    <div
                      className="flex items-center justify-center flex-shrink-0 rounded-lg mt-px w-[34px] h-[34px]"
                      style={{
                        backgroundColor: isDark ? "rgba(74,222,128,0.12)" : "#f0fdf4",
                        color: neonG,
                        border: isDark ? "1px solid rgba(74,222,128,0.3)" : "none",
                      }}
                    >
                      {row.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold tracking-widest uppercase mb-0.5"
                        style={{ color: isDark ? "#6b7280" : "#9ca3af" }}>
                        {row.label}
                      </p>
                      <p className="text-[13px] leading-snug break-words"
                        style={{ color: isDark ? "#d1d5db" : "#374151" }}>
                        {row.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={onClose}
                className="w-full mt-5 sm:mt-6 py-3 font-semibold text-white text-sm rounded-xl transition-all"
                style={{
                  background: `linear-gradient(135deg, ${SITE_GREEN}, ${DARK_GREEN})`,
                  boxShadow: isDark ? "0 0 16px rgba(74,222,128,0.25)" : "none",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.92"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                Got it, start shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Make it Personal popout ───────────────────────────────────────────────────
const MIP_OPTIONS = [
  { page:"describe-arrangement", icon:<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"/><path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"/></svg>, label:"Describe Arrangement", desc:"Tell us what you have in mind and we'll bring it to life.", accent:"#7c3aed", accentBg:"#f5f3ff" },
  { page:"mix-and-match", icon:<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/></svg>, label:"Mix & Match", desc:"Pick your flowers and build your own bouquet your way.", accent:SITE_GREEN, accentBg:"#f0fdf4" },
  { page:"ai-card-composer", icon:<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z"/></svg>, label:"AI Card Composer", desc:"Let AI write the perfect card message for your bouquet.", accent:"#0ea5e9", accentBg:"#f0f9ff" },
  { page:"ai-gallery", icon:<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/></svg>, label:"See Examples", desc:"Browse arrangements made by our team for inspiration.", accent:"#d97706", accentBg:"#fffbeb" },
];

function MakeItPersonalPopout({ onNavigate, onClose, isCustomizationEnabled }) {
  const { isDark } = useTheme();
  const bg     = isDark ? "#1a2332" : "white";
  const bdr    = isDark ? "#2d3748" : "#e9f5ea";
  const divBdr = isDark ? "#2d3748" : "#f0fdf4";
  const hoverBg = (accent) =>
    isDark ? `${accent}22` : MIP_OPTIONS.find(o => o.accent === accent)?.accentBg || "#f9fafb";

  return (
    <>
      <style>{`@keyframes mipSlideDown { from { opacity:0; transform:translateY(-8px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
      {/* hover bridge below the button, closes the vertical gap */}
      <div className="absolute" style={{ top:"100%", left:0, right:0, height:"14px", zIndex:49 }}/>
      <div className="absolute z-50" style={{ top:"calc(100% + 10px)", right:0, animation:"mipSlideDown 0.22s cubic-bezier(0.34,1.56,0.64,1) both", filter:"drop-shadow(0 16px 40px rgba(0,0,0,0.13))" }}>
        {/* up-pointing arrow near the right, under the button */}
        <div className="absolute" style={{ right:"20px", top:"-7px", width:0, height:0, borderLeft:"7px solid transparent", borderRight:"7px solid transparent", borderBottom:`7px solid ${bg}`, filter:"drop-shadow(0 -2px 2px rgba(0,0,0,0.05))" }}/>
        <div className="overflow-hidden" style={{ borderRadius:"16px", border:`1px solid ${bdr}`, width:"280px", backgroundColor:bg }}>
          <div className="px-4 pt-4 pb-3" style={{ borderBottom:`1px solid ${divBdr}` }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background:"linear-gradient(135deg,#2E8B34,#0C573E)" }}>
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: isDark ? "#d1d5db" : "#374151" }}>Make it Personal</p>
            </div>
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: isDark ? "#9ca3af" : "#9ca3af" }}>Choose how you'd like to create your perfect arrangement.</p>
          </div>
          <div className="py-2">
            {MIP_OPTIONS.map((opt, i) => {
              const isOptionLocked = !isCustomizationEnabled && opt.page !== "ai-gallery";
              return (
                <button key={opt.page}
                  disabled={isOptionLocked}
                  onClick={(e) => { e.stopPropagation(); if (!isOptionLocked) { onNavigate(opt.page); onClose(); } }}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left transition-all group relative"
                  style={{
                    borderBottom: i < MIP_OPTIONS.length - 1 ? `1px solid ${divBdr}` : "none",
                    backgroundColor: "transparent",
                    opacity: isOptionLocked ? 0.45 : 1,
                    cursor: isOptionLocked ? "not-allowed" : "pointer"
                  }}
                  onMouseEnter={e => { if (!isOptionLocked) e.currentTarget.style.backgroundColor = hoverBg(opt.accent); }}
                  onMouseLeave={e => { if (!isOptionLocked) e.currentTarget.style.backgroundColor = "transparent"; }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-all group-hover:scale-110"
                    style={{ backgroundColor: isDark ? `${opt.accent}22` : opt.accentBg, color: isOptionLocked ? "#9ca3af" : opt.accent, border:`1.5px solid ${opt.accent}33` }}>{opt.icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug" style={{ color: isDark ? "#e5e7eb" : "#111827" }}>{opt.label}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>{opt.desc}</p>
                  </div>
                  {!isOptionLocked && <svg className="w-3.5 h-3.5 flex-shrink-0 mt-1.5 transition-all group-hover:translate-x-0.5" style={{ color:opt.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Promo Carousel ────────────────────────────────────────────────────────────
function PromoCarousel({ onNavigate, leftSlot }) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState("next");
  const intervalRef = useRef(null);
  const total = PROMOTIONS.length;
  const go = (dir) => {
    if (animating) return;
    setDirection(dir); setAnimating(true);
    setTimeout(() => { setCurrent(c => dir==="next"?(c+1)%total:(c-1+total)%total); setAnimating(false); }, 260);
  };
  useEffect(() => { intervalRef.current = setInterval(() => go("next"), 4000); return () => clearInterval(intervalRef.current); }, [animating]);
  const promo = PROMOTIONS[current];
  const arrowBtn = (dir) => (
    <button onClick={(e) => { e.stopPropagation(); clearInterval(intervalRef.current); go(dir); }}
      style={{ width:"26px", height:"26px", display:"flex", alignItems:"center", justifyItems:"center", borderRadius:"50%", border:"none", background:"transparent", color:"rgba(255,255,255,0.85)", cursor:"pointer", flexShrink:0, transition:"background 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.18)"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={dir==="prev"?"M15 19l-7-7 7-7":"M9 5l7 7-7 7"}/></svg>
    </button>
  );
  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-1.5 pb-3 lg:py-1 flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-0"
      style={{ backgroundColor:DARK_GREEN, minHeight:"52px" }}>

      {/* Advertisement (promo carousel) — top row on mobile, center on desktop */}
      <div className="order-1 lg:order-2 w-full lg:flex-1 flex items-center justify-center gap-1 min-w-0">
        {arrowBtn("prev")}
        <div style={{ overflow:"hidden", minWidth:0, flex:1, maxWidth:"560px", textAlign:"center" }}>
          <span className="font-medium text-white" style={{
            display:"block",
            transition:animating?"opacity 0.26s ease, transform 0.26s ease":"none",
            opacity:animating?0:1,
            transform:animating?(direction==="next"?"translateX(-14px)":"translateX(14px)"):"translateX(0)",
            lineHeight:1.4,
            whiteSpace:"nowrap",
            overflow:"hidden",
            textOverflow:"ellipsis",
            fontSize:"clamp(10px, 3vw, 14px)",
          }}>
            {promo.text}&nbsp;<strong>{promo.highlight}</strong>{" — "}
            <button onClick={(e) => { e.stopPropagation(); onNavigate?.(promo.page); }} style={{ fontWeight:700, textDecoration:"underline", textUnderlineOffset:"2px", background:"none", border:"none", color:"white", cursor:"pointer", letterSpacing:"0.05em", padding:0, display:"inline", whiteSpace:"nowrap" }}
              onMouseEnter={e => e.currentTarget.style.opacity="0.75"} onMouseLeave={e => e.currentTarget.style.opacity="1"}>{promo.cta}</button>
          </span>
        </div>
        {arrowBtn("next")}
      </div>

      {/* Store branch — second row on mobile (centered), left on desktop */}
      <div className="order-2 lg:order-1 flex items-center justify-center lg:justify-start flex-shrink-0 min-w-0">{leftSlot}</div>

      {/* Socials — desktop only, right */}
      <div className="hidden lg:flex items-center gap-1.5 order-3 flex-shrink-0">
        {SOCIAL_LINKS.map(s => (
          <a key={s.name} href={s.href} title={s.name} target="_blank" rel="noopener noreferrer"
            className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
            style={{ backgroundColor:"rgba(255,255,255,0.15)" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor="rgba(255,255,255,0.3)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor="rgba(255,255,255,0.15)"}>{s.icon}</a>
        ))}
      </div>
    </div>
  );
}

// ── Search suggestions ────────────────────────────────────────────────────────
const SEARCH_SUGGESTIONS = [
  "Red Roses", "Birthday Flowers", "Anniversary Bouquet",
  "Sunflowers", "Mixed Tulips", "Same-day Delivery",
];

// Words cycled through by the animated "typing" placeholder in the search box
const SEARCH_TYPING = ["Red Roses", "Sunflowers", "Birthday Flowers", "Mixed Tulips", "Anniversary Bouquet"];

// ── Search Overlay ────────────────────────────────────────────────────────────
function SearchOverlay({ onClose, onNavigate }) {
  const { isDark } = useTheme();
  const [query, setQuery] = useState("");
  const [typed, setTyped] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  // Animated "typing" placeholder — types each example, pauses, deletes, next.
  useEffect(() => {
    let w = 0, c = 0, deleting = false, t;
    const tick = () => {
      const word = SEARCH_TYPING[w];
      if (!deleting) {
        c++;
        setTyped(word.slice(0, c));
        if (c === word.length) { deleting = true; t = setTimeout(tick, 1500); return; }
        t = setTimeout(tick, 85);
      } else {
        c--;
        setTyped(word.slice(0, c));
        if (c === 0) { deleting = false; w = (w + 1) % SEARCH_TYPING.length; t = setTimeout(tick, 350); return; }
        t = setTimeout(tick, 40);
      }
    };
    t = setTimeout(tick, 500);
    return () => clearTimeout(t);
  }, []);

  const doSearch = (term) => {
    if (term && term.trim()) { onNavigate?.("shop"); onClose(); }
  };

  const fillSearch = (term) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  const surfaceBg = isDark ? "#1a2332" : "white";
  const textC     = isDark ? "#e5e7eb" : "#111827";
  const iconC     = isDark ? "#9ca3af" : "#9ca3af";
  const suggBdr   = isDark ? "#2d3748" : "#e5e7eb";
  const suggText  = isDark ? "#d1d5db" : "#374151";

  return (
    <div className="fixed inset-0 z-[100000] flex items-start justify-center px-3 sm:px-4"
      style={{ backgroundColor:"rgba(0,0,0,0.72)", backdropFilter:"blur(6px)", paddingTop:"clamp(52px,10vh,110px)" }}
      onClick={onClose}>
      <style>{`
        @keyframes ssDown { from{opacity:0;transform:translateY(-16px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .search-input {
          min-width: 0; flex: 1; outline: none;
          background: transparent !important; background-color: transparent !important;
          border: none !important; box-shadow: none !important;
          -webkit-appearance: none !important; appearance: none !important;
        }
        [data-theme="dark"] .search-input,
        [data-theme="light"] .search-input,
        [data-theme] .search-input {
          background: transparent !important; background-color: transparent !important;
          border: none !important; box-shadow: none !important;
        }
        .search-input::placeholder { color: ${isDark ? "#6b7280" : "#9ca3af"}; }
        @media (max-height: 500px) and (orientation: landscape) {
          .search-dialog { padding-top: 6px !important; }
        }
      `}</style>
      <div className="search-dialog w-full max-w-2xl" onClick={e => e.stopPropagation()}
        style={{ animation:"ssDown 0.22s cubic-bezier(0.34,1.56,0.64,1) both" }}>

        {/* Title */}
        <div className="text-center mb-4 px-2">
          <h2 className="text-white font-bold tracking-tight leading-tight" style={{ fontSize:"clamp(20px,5vw,26px)" }}>
            What are you looking for?
          </h2>
          <p className="text-white/55 text-xs sm:text-sm mt-1">
            Search our flowers, bouquets, and gifts
          </p>
        </div>

        {/* Search box */}
        <form onSubmit={e => { e.preventDefault(); doSearch(query); }}>
          <div className="flex items-center rounded-2xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: surfaceBg, border:`2px solid ${SITE_GREEN}`, height:"52px" }}>
            <div className="flex items-center pl-3 pr-2 flex-shrink-0" style={{ backgroundColor:"transparent" }}>
              <svg className="w-5 h-5" style={{ color:iconC }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z"/>
              </svg>
            </div>
            <input
              ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder={`Search ${typed}`} className="search-input py-3 text-sm sm:text-base"
              style={{ color: textC, caretColor: SITE_GREEN, WebkitAppearance:"none" }}
            />
            {query && (
              <button type="button" onClick={(e) => { e.stopPropagation(); setQuery(""); }}
                className="px-2 flex-shrink-0 transition-opacity hover:opacity-70"
                style={{ color: iconC, backgroundColor:"transparent", border:"none" }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            )}
            <button type="submit" onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 text-white font-bold self-stretch transition-all hover:opacity-90 flex-shrink-0"
              style={{ backgroundColor: SITE_GREEN, borderRadius:"0 16px 16px 0", padding:"0 12px", minWidth:"44px" }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z"/>
              </svg>
              <span className="hidden sm:inline text-sm">Search</span>
            </button>
          </div>
        </form>

        {/* Suggestions — one per row. Tap label to search; tap arrow to fill the box. */}
        <div className="mt-4">
          <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-2 px-1">Popular searches</p>
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: surfaceBg, border:`1px solid ${suggBdr}` }}>
            {SEARCH_SUGGESTIONS.map((s, i) => (
              <div key={s} className="flex items-stretch"
                style={{ borderBottom: i < SEARCH_SUGGESTIONS.length - 1 ? `1px solid ${suggBdr}` : "none" }}>
                {/* Label → search immediately */}
                <button type="button" onClick={(e) => { e.stopPropagation(); doSearch(s); }}
                  className="flex-1 flex items-center gap-3 px-4 py-3 text-left transition-colors min-w-0"
                  style={{ color: suggText, backgroundColor:"transparent" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.04)" : "#f9fafb"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                  <svg className="w-4 h-4 flex-shrink-0" style={{ color:iconC }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z"/>
                  </svg>
                  <span className="text-sm font-medium truncate">{s}</span>
                </button>
                {/* Arrow → drop into the search box for editing */}
                <button type="button" aria-label={`Use "${s}" in search box`}
                  onClick={(e) => { e.stopPropagation(); fillSearch(s); }}
                  className="flex items-center justify-center px-3.5 flex-shrink-0 transition-colors"
                  style={{ color:iconC, borderLeft:`1px solid ${suggBdr}`, backgroundColor:"transparent" }}
                  onMouseEnter={e => { e.currentTarget.style.color = isDark ? "#4ade80" : SITE_GREEN; e.currentTarget.style.backgroundColor = isDark ? "rgba(74,222,128,0.08)" : "#f0fdf4"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = iconC; e.currentTarget.style.backgroundColor = "transparent"; }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18 6 6m0 0h7m-7 0v7"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-white/50 text-xs mt-3">
          Press <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor:"rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.8)" }}>Esc</kbd> to close
        </p>
      </div>
    </div>
  );
}

function DropdownMenu({ items, categories, onNavigate, onClose }) {
  const { isDark } = useTheme();
  const dropStyle = {
    backgroundColor: isDark ? "#1a2332" : "white",
    border: `1px solid ${isDark ? "#2d3748" : "#e5e7eb"}`,
    borderRadius:"12px",
    boxShadow: isDark ? "0 12px 32px rgba(0,0,0,0.5)" : "0 12px 32px rgba(0,0,0,0.10)",
    animation:"dropIn 0.18s cubic-bezier(0.4,0,0.2,1) forwards",
  };
  const itemHover = (e, on) => {
    e.currentTarget.style.backgroundColor = on ? (isDark ? VIBRANT_GREEN : VIBRANT_GREEN) : "transparent";
    e.currentTarget.style.color = on ? "white" : (isDark ? "#d1d5db" : "#4b5563");
  };
  const headingGreen = isDark ? "#4ade80" : SITE_GREEN;

  if (categories) {
    return (
      <div className="absolute top-full left-0 mt-2 z-50 overflow-hidden" style={{ ...dropStyle, minWidth:"400px" }}>
        <div className="flex" style={{ borderTop:"none" }}>
          {categories.map((cat, ci) => (
            <div key={cat.heading} className="flex-1 py-3" style={{ borderRight: ci < categories.length-1 ? `1px solid ${isDark?"#2d3748":"#f3f4f6"}` : "none" }}>
              
              <button onClick={(e) => { e.stopPropagation(); if (cat.headingPage && onNavigate) onNavigate(cat.headingPage, cat.headingParam); onClose?.(); }}
                className="w-full text-left px-4 pb-2 text-xs font-bold uppercase tracking-widest transition-colors hover:underline"
                style={{ color:headingGreen, backgroundColor:"transparent", border:"none" }}>
                {cat.heading}
              </button>
              
              {cat.items.map(item => (
                <button key={item.label} onClick={(e) => { e.stopPropagation(); if (item.page && onNavigate) onNavigate(item.page, item.param); onClose?.(); }}
                  className="w-full text-left px-4 py-2 text-sm transition-all duration-150 capitalize"
                  style={{ color: isDark ? "#d1d5db" : "#4b5563" }}
                  onMouseEnter={e => itemHover(e, true)}
                  onMouseLeave={e => itemHover(e, false)}>{item.label}</button>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="absolute top-full left-0 mt-2 z-50 min-w-[190px] overflow-hidden" style={dropStyle}>
      {items.map(item => (
        <button key={item.label} onClick={(e) => { e.stopPropagation(); if (item.page && onNavigate) onNavigate(item.page, item.param); onClose?.(); }}
          className="w-full text-left px-4 py-2.5 text-sm first:rounded-t-xl last:rounded-b-xl transition-all duration-150 capitalize"
          style={{ color: isDark ? "#d1d5db" : "#4b5563" }}
          onMouseEnter={e => itemHover(e, true)}
          onMouseLeave={e => itemHover(e, false)}>{item.label}</button>
      ))}
    </div>
  );
}

function CartDropdown({ cartCount, onNavigate }) {
  const { isDark } = useTheme();
  const cartItems = getCart();
  const subtotal = cartItems.reduce((s, i) => s + (i.price||0)*(i.qty||1), 0);
  const bg  = isDark ? "#1a2332" : "white";
  const bdr = isDark ? "#2d3748" : "#e5e7eb";
  const textPrimary   = isDark ? "#e5e7eb" : "#111827";
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const footerBg = isDark ? "#0f172a" : "#f9fafb";
  return (
    <div className="absolute top-full right-0 mt-2 z-50 w-72 overflow-hidden"
      style={{ backgroundColor:bg, border:`1px solid ${bdr}`, borderRadius:"14px", boxShadow: isDark?"0 12px 32px rgba(0,0,0,0.4)":"0 12px 32px rgba(0,0,0,0.12)", animation:"dropIn 0.18s cubic-bezier(0.4,0,0.2,1) forwards" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom:`1px solid ${bdr}` }}>
        <span className="text-sm font-semibold" style={{ color:textPrimary }}>Your Cart</span>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor:cartCount>0?"#e11d48":"#9ca3af" }}>{cartCount}</span>
      </div>
      {cartCount===0?(
        <div className="px-4 py-8 text-center">
          <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: isDark?"#1e293b":"#f3f4f6" }}>
            <svg className="w-5 h-5" style={{ color:textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"/></svg>
          </div>
          <p className="text-sm font-medium mb-1" style={{ color:textPrimary }}>Your cart is empty</p>
          <p className="text-xs" style={{ color:textSecondary }}>Browse our collection and add something you love.</p>
        </div>
      ):(
        <div className="max-h-48 overflow-y-auto">
          {cartItems.slice(0,4).map((item,idx)=>(
            <div key={`${item.id}-${idx}`} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom:`1px solid ${isDark?"#374151":"#f9fafb"}` }}>
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ border:`1px solid ${bdr}` }}>{item.img?<img src={item.img} alt={item.name} className="w-full h-full object-cover"/>:<div className="w-full h-full" style={{ backgroundColor: isDark?"#374151":"#fdf2f8" }}/>}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color:textPrimary }}>{item.name}</p>
                <p className="text-[11px]" style={{ color:textSecondary }}>Qty: {item.qty||1}</p>
              </div>
              <span className="text-xs font-semibold" style={{ color:textPrimary }}>₱{((item.price||0)*(item.qty||1)).toLocaleString()}</span>
            </div>
          ))}
          {cartItems.length>4&&<p className="px-4 py-2 text-[11px] text-center" style={{ color:textSecondary }}>+{cartItems.length-4} more item(s)</p>}
        </div>
      )}
      <div className="px-4 py-3 rounded-b-xl" style={{ borderTop:`1px solid ${bdr}`, backgroundColor:footerBg }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-wide" style={{ color:textSecondary }}>Subtotal</span>
          <span className="text-sm font-bold" style={{ color:textPrimary }}>₱{subtotal.toLocaleString()}.00</span>
        </div>
        <p className="text-xs mb-3" style={{ color:textSecondary }}>Shipping and taxes calculated at checkout.</p>
        <button onClick={(e) => { e.stopPropagation(); onNavigate?.("cart"); }} className="w-full py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90" style={{ backgroundColor:SITE_GREEN }}>View Cart</button>
      </div>
    </div>
  );
}

function UserHoverDropdown({ user, onNavigate, onLogout }) {
  const { isDark } = useTheme();
  const bg  = isDark ? "#1a2332" : "white";
  const bdr = isDark ? "#2d3748" : "#e5e7eb";
  const tp  = isDark ? "#e5e7eb" : "#111827";
  const ts  = isDark ? "#9ca3af" : "#6b7280";
  const baseStyle = { backgroundColor:bg, border:`1px solid ${bdr}`, borderRadius:"14px", boxShadow: isDark?"0 12px 32px rgba(0,0,0,0.5)":"0 12px 32px rgba(0,0,0,0.12)", animation:"dropIn 0.18s cubic-bezier(0.4,0,0.2,1) forwards", minWidth:"200px" };
  const linkHover = (e, on) => { e.currentTarget.style.backgroundColor = on ? (isDark?"rgba(74,222,128,0.12)":"#f0fdf4") : "transparent"; e.currentTarget.style.color = on ? (isDark?"#4ade80":SITE_GREEN) : (isDark?"#d1d5db":"#4b5563"); };

  if (!user) return (
    <div className="absolute top-full right-0 mt-2 z-50 overflow-hidden" style={baseStyle}>
      <div className="px-4 py-3" style={{ borderBottom:`1px solid ${bdr}` }}>
        <p className="text-sm font-semibold" style={{ color:tp }}>Welcome!</p>
        <p className="text-xs mt-0.5" style={{ color:ts }}>Sign in to manage your orders</p>
      </div>
      <div className="p-3 space-y-2">
        <button onClick={(e) => { e.stopPropagation(); onNavigate?.("login"); }} className="w-full py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-all" style={{ backgroundColor:SITE_GREEN }}>Login</button>
        <button onClick={(e) => { e.stopPropagation(); onNavigate?.("register"); }} className="w-full py-2 text-sm font-semibold rounded-lg border hover:opacity-80 transition-all" style={{ borderColor:SITE_GREEN, color:SITE_GREEN, backgroundColor:"transparent" }}>Create Account</button>
      </div>
    </div>
  );
  return (
    <div className="absolute top-full right-0 mt-2 z-50 overflow-hidden" style={baseStyle}>
      <div className="px-4 py-3" style={{ borderBottom:`1px solid ${bdr}`, background: isDark?"linear-gradient(to right,rgba(46,139,52,0.12),transparent)":"linear-gradient(to right,#f0fdf4,white)" }}>
        <p className="text-xs" style={{ color:ts }}>Signed in as</p>
        <p className="text-sm font-bold truncate" style={{ color:tp }}>{user.firstName} {user.lastName}</p>
      </div>
      <div className="py-1">
        {[{label:"My Account",page:"account"},{label:"My Orders",page:"orders"},{label:"Wishlist",page:"wishlist"}].map(({label,page})=>(
          <button key={label} onClick={(e) => { e.stopPropagation(); onNavigate?.(page); }}
            className="w-full text-left px-4 py-2.5 text-sm transition-all"
            style={{ color: isDark?"#d1d5db":"#4b5563" }}
            onMouseEnter={e=>linkHover(e,true)} onMouseLeave={e=>linkHover(e,false)}>{label}</button>
        ))}
      </div>
      <div style={{ borderTop:`1px solid ${bdr}` }}>
        <button onClick={(e) => { e.stopPropagation(); onLogout(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 rounded-b-xl transition-all"
          style={{ backgroundColor:"transparent" }}
          onMouseEnter={e=>e.currentTarget.style.backgroundColor=isDark?"rgba(239,68,68,0.1)":"#fef2f2"}
          onMouseLeave={e=>e.currentTarget.style.backgroundColor="transparent"}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>
          Logout
        </button>
      </div>
    </div>
  );
}

function LocationDropdown({ selected, onChange, onClose }) {
  const { isDark } = useTheme();
  const bg  = isDark ? "#1a2332" : "white";
  const bdr = isDark ? "#2d3748" : "#e5e7eb";
  const brightG = isDark ? "#4ade80" : SITE_GREEN;
  return (
    <div className="absolute top-full left-0 mt-1.5 z-50 w-36 overflow-hidden"
      style={{ backgroundColor:bg, border:`1px solid ${bdr}`, borderRadius:"10px", boxShadow: isDark?"0 8px 24px rgba(0,0,0,0.5)":"0 8px 24px rgba(0,0,0,0.10)", animation:"dropIn 0.18s cubic-bezier(0.4,0,0.2,1) forwards" }}>
      {["Manila","Pampanga"].map(loc=>(
        <button key={loc} onClick={(e) => { e.stopPropagation(); onChange(loc); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-all first:rounded-t-xl last:rounded-b-xl"
          style={{ color: selected===loc ? brightG : (isDark?"#d1d5db":"#374151"), fontWeight: selected===loc?600:400 }}
          onMouseEnter={e=>{ e.currentTarget.style.backgroundColor=isDark?"rgba(74,222,128,0.12)":"#f0fdf4"; e.currentTarget.style.color=brightG; }}
          onMouseLeave={e=>{ e.currentTarget.style.backgroundColor=""; e.currentTarget.style.color=selected===loc?brightG:(isDark?"#d1d5db":"#374151"); }}>
          {selected===loc&&<svg className="w-3.5 h-3.5 flex-shrink-0" style={{color:brightG}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
          <span style={{ marginLeft:selected===loc?0:"19px" }}>{loc}</span>
        </button>
      ))}
    </div>
  );
}

// ── Branch Shipping Popup ─────────────────────────────────────────────────────
function BranchShippingPopup({ branch, onDismiss, onChangeBranch }) {
  const { isDark } = useTheme();
  const bg  = isDark ? "#1a2332" : "white";
  const bdr = isDark ? "#2d3748" : "#e5e7eb";
  const tp  = isDark ? "#d1d5db" : "#374151";
  const ts  = isDark ? "#9ca3af" : "#6b7280";

  return (
    <>
      <style>{`
        @keyframes bspIn {
          from { opacity:0; transform:translateY(-10px) scale(0.96); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }
      `}</style>
      <div
        className="absolute z-50"
        style={{
          top: "calc(100% + 10px)",
          left: 0,
          width: "min(290px, calc(100vw - 2rem))",
          backgroundColor: bg,
          border: `1px solid ${bdr}`,
          borderRadius: "14px",
          boxShadow: isDark
            ? "0 16px 40px rgba(0,0,0,0.55)"
            : "0 16px 40px rgba(0,0,0,0.14)",
          animation: "bspIn 0.24s cubic-bezier(0.34,1.56,0.64,1) both",
          padding: "16px",
        }}
      >
        <div style={{
          position:"absolute", top:"-7px", left:"18px",
          width:0, height:0,
          borderLeft:"7px solid transparent",
          borderRight:"7px solid transparent",
          borderBottom:`7px solid ${bdr}`,
        }}/>
        <div style={{
          position:"absolute", top:"-5.5px", left:"19px",
          width:0, height:0,
          borderLeft:"6px solid transparent",
          borderRight:"6px solid transparent",
          borderBottom:`6px solid ${bg}`,
          zIndex:1,
        }}/>
        <div className="flex items-start gap-2.5 mb-4">
          <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
            style={{ backgroundColor: isDark ? "rgba(46,139,52,0.18)" : "#f0fdf4" }}>
            <svg className="w-3.5 h-3.5" style={{ color: SITE_GREEN }} fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742ZM12 13.5a3 3 0 100-6 3 3 0 000 6Z" clipRule="evenodd"/>
            </svg>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: tp }}>
            We're showing you items available at our{" "}
            <strong style={{ color: isDark ? "#4ade80" : SITE_GREEN }}>{branch} branch</strong>.
            To see items from a different branch, change your store location.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            className="flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all"
            style={{ borderColor: bdr, color: ts, backgroundColor: "transparent" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "#f9fafb"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          >
            Dismiss
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onChangeBranch(); }}
            className="flex-1 py-1.5 text-xs font-semibold text-white rounded-lg transition-all"
            style={{ backgroundColor: SITE_GREEN }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            Change Branch
          </button>
        </div>
      </div>
    </>
  );
}

function useCartCount() {
  const [count, setCount] = useState(getCartCount);
  useEffect(() => {
    const update = () => setCount(getCartCount());
    window.addEventListener("bloomora:cart-updated", update);
    window.addEventListener("storage", update);
    return () => { window.removeEventListener("bloomora:cart-updated", update); window.removeEventListener("storage", update); };
  }, []);
  return count;
}

export default function Navbar({ cartCount: propCartCount, onNavigate, isCustomizationEnabled = true }) {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const liveCartCount = useCartCount();
  const cartCount = propCartCount ?? liveCartCount;

  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [dynamicShopCategories, setDynamicShopCategories] = useState([]);

  const [active, setActive]                     = useState("Home");
  const [locationOpen, setLocationOpen]         = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Manila");
  const [branchModal, setBranchModal]           = useState(null);
  const [openMenu, setOpenMenu]                 = useState(null);
  const [mobileOpen, setMobileOpen]             = useState(false);
  const [cartOpen, setCartOpen]                 = useState(false);
  const [userOpen, setUserOpen]                 = useState(false);
  const [searchOpen, setSearchOpen]             = useState(false);
  const [mipOpen, setMipOpen]                   = useState(false);

  const [notifOpen, setNotifOpen]               = useState(false);
  const [notifications, setNotifications]       = useState([]);
  const [unreadCount, setUnreadCount]           = useState(0);
  const [loadingNotifs, setLoadingNotifs]       = useState(false);

  useEffect(() => {
    const refresh = () => {
      const anns = readAnnouncementNotifs();
      setNotifications(anns);
      setUnreadCount(anns.filter(n => !n.is_read).length);
    };
    refresh();
    const onStorage = (e) => {
      if (!e || e.key === ANNOUNCE_KEY || e.key === ANNOUNCE_READ_KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("bloomora:announcement-updated", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("bloomora:announcement-updated", refresh);
    };
  }, []);

  const [showBranchPopup, setShowBranchPopup]   = useState(false);
  const [showLockTooltip, setShowLockTooltip]   = useState(false);

  const navRef=useRef(null), cartRef=useRef(null), userRef=useRef(null), locationRef=useRef(null), mipRef=useRef(null), notifRef=useRef(null);
  const menuTimer=useRef(null), cartTimer=useRef(null), userTimer=useRef(null), mipTimer=useRef(null);

  const openMenuD  = l => { clearTimeout(menuTimer.current); setOpenMenu(l); };
  const closeMenuD = ()  => { menuTimer.current = setTimeout(() => setOpenMenu(null), 200); };
  const openCartD  = ()  => { clearTimeout(cartTimer.current); setCartOpen(true); };
  const closeCartD = ()  => { cartTimer.current = setTimeout(() => setCartOpen(false), 200); };
  const openUserD  = ()  => { clearTimeout(userTimer.current); setUserOpen(true); };
  const closeUserD = ()  => { userTimer.current = setTimeout(() => setUserOpen(false), 200); };
  const openMipD   = ()  => { clearTimeout(mipTimer.current); setMipOpen(true); };
  const closeMipD  = ()  => { mipTimer.current = setTimeout(() => setMipOpen(false), 220); };

  const handleBranchSelect = loc => { setSelectedLocation(loc); setLocationOpen(false); setBranchModal(loc); };
  const handleLogout       = ()  => { logout(); setUserOpen(false); onNavigate?.("login"); };

  const handleDismissBranchPopup = () => {
    sessionStorage.setItem("bloomora_branch_popup_dismissed", "true");
    setShowBranchPopup(false);
  };

  const handleChangeBranch = () => {
    sessionStorage.setItem("bloomora_branch_popup_dismissed", "true");
    setShowBranchPopup(false);
    setLocationOpen(true);
  };

  const handleMarkAllRead = () => {
    markAnnouncementsRead(notifications);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleNotifClick = (n) => {
    setNotifications(prev => {
      const next = prev.map(x => x.id === n.id ? { ...x, is_read: true } : x);
      markAnnouncementsRead(next);
      setUnreadCount(next.filter(x => !x.is_read).length);
      return next;
    });
  };

  const NAV_LINKS = [
    { label: "Home", page: "home" },
    {
      label: "Shop", page: "shop", categorized: true,
      categories: dynamicShopCategories.map(cat => ({
        heading: cat.title,
        headingPage: "shop",
        headingParam: cat.title,
        items: (cat.items || []).map(subItem => ({
          label: subItem,
          page: "shop",
          param: subItem
        }))
      }))
    },
    {
      label: "Occasions", page: "occasions",
      dropdown: [
        { label: "Birthdays", page: "occasions" }, { label: "Anniversaries", page: "occasions" },
        { label: "Weddings", page: "occasions" }, { label: "Graduations", page: "occasions" },
        { label: "Sympathy", page: "occasions" }, { label: "Just Because", page: "occasions" },
        { label: "Openings", page: "occasions" }, { label: "Get Well Soon", page: "occasions" },
      ],
    },
    { label: "About Us", page: "about" },
    { label: "Contact Us", page: "contact" },
    { label: "Help Center", page: null, dropdown: [{ label: "FAQs", page: "faq" }, { label: "Track My Order", page: "orders" }, { label: "Return Policy", page: "return-policy" }, { label: "World Clock", page: "world-clock" }] },
  ];

  useEffect(() => {
    api.get("/products/categories/hierarchy") 
      .then(data => {
        if (data) setDynamicShopCategories(data);
      })
      .catch(err => console.error("Failed to load category hierarchy", err));
  }, []);

  useEffect(() => {
    api.get("/products/")
      .then(data => {
        if (data && data.length > 0) {
          const allCats = data.map(p => p.category?.toLowerCase().trim()).filter(Boolean);
          const uniqueCats = Array.from(new Set(allCats));
          const custom = uniqueCats.filter(c => !STANDARD_CATEGORIES.includes(c));
          setCustomCategories(custom);
        }
      })
      .catch(err => console.error("Failed to load nav categories", err));

    api.getActiveCampaigns()
      .then(data => setActiveCampaigns(data?.campaigns ? data.campaigns : data || []))
      .catch(err => console.error("Failed to load campaigns", err));

    api.get("/products/categories/hierarchy")
       .then(data => { if (data) setDynamicShopCategories(data); })
       .catch(err => console.error("Failed to load category hierarchy", err));

    if (!sessionStorage.getItem("bloomora_branch_popup_dismissed")) {
        setShowBranchPopup(true);
    }
  }, []);

  useEffect(() => {
    api.getActiveCampaigns()
      .then(data => {
        const list = data?.campaigns ? data.campaigns : data || [];
        setActiveCampaigns(Array.isArray(list) ? list : []);
      })
      .catch(err => console.error("Failed to load active campaigns", err));
  }, []);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("bloomora_branch_popup_dismissed");
    if (!dismissed) setShowBranchPopup(true);
  }, []);

  const generatedLinks = customCategories.map(cat => ({
    label: cat.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    page: "shop",
    isCustomCategory: true,
  }));

  const campaignLinks = activeCampaigns.map(c => ({
    label: c.name,
    page: "shop",
    isCampaign: true,
    campaignKey: c.campaign_key,
    highlight: true,
  }));

  const shopIndex = NAV_LINKS.findIndex(l => l.label === "Shop");
  const FINAL_NAV_LINKS = [
    ...NAV_LINKS.slice(0, shopIndex + 1),
    ...campaignLinks,
    ...NAV_LINKS.slice(shopIndex + 1)
  ];

  const handleNavClick = link => {
    setActive(link.label);

    if (link.page === 'shop' && link.param) {
      localStorage.setItem("bloomora_active_category", String(link.param).toLowerCase());
    } else if (link.isCustomCategory) {
      localStorage.setItem("bloomora_active_category", link.label.toLowerCase());
    } else {
      localStorage.removeItem("bloomora_active_category");
    }

    if (link.isCampaign) {
      localStorage.setItem("bloomora_active_campaign", link.campaignKey);
    } else {
      localStorage.removeItem("bloomora_active_campaign");
    }
    if (link.page) onNavigate?.(link.page);
    setMobileOpen(false);
  };

  const handleAccountClick = (e) => { 
    e.stopPropagation(); 
    setUserOpen(false); 
    onNavigate?.(user ? "account" : "login"); 
  };

  useEffect(() => {
    const h = e => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenMenu(null);
      if (cartRef.current && !cartRef.current.contains(e.target)) setCartOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
      if (locationRef.current && !locationRef.current.contains(e.target)) setLocationOpen(false);
      if (mipRef.current && !mipRef.current.contains(e.target)) setMipOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <>
      <style>{`
        @keyframes dropIn { from { opacity:0; transform:translateY(-8px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        ${HEART_CSS}
      `}</style>
      {branchModal && <BranchModal branch={branchModal} onClose={() => setBranchModal(null)} />}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} onNavigate={onNavigate} />}

      {/* 🚀 THE FIX: Forced z-index and pointer-events */}
      <div 
        className="w-full sticky top-0" 
        ref={navRef} 
        style={{ zIndex: 99999, pointerEvents: "auto", position: "sticky" }}
      >
        <PromoCarousel onNavigate={onNavigate} leftSlot={
          <div className="flex items-center gap-2 flex-shrink-0" ref={locationRef}>
            {/* "STORE BRANCH" label — now shown at all sizes (own row on mobile) */}
            <span className="text-[11px] uppercase tracking-wide font-semibold whitespace-nowrap" style={{ color: "rgba(255,255,255,0.65)" }}>Store Branch</span>
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setLocationOpen(p => !p); }}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-medium transition-all"
                style={{
                  border: `1px solid ${locationOpen ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.28)"}`,
                  color: "#ffffff",
                  backgroundColor: locationOpen ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.10)",
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.18)"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = locationOpen ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.10)"; }}>
                <svg className="w-3 h-3 flex-shrink-0" style={{ color:"#4ade80" }} fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742ZM12 13.5a3 3 0 100-6 3 3 0 000 6Z" clipRule="evenodd"/></svg>
                {selectedLocation}
                <svg className="w-3 h-3 flex-shrink-0 transition-transform" style={{ color:"rgba(255,255,255,0.7)", transform:locationOpen?"rotate(180deg)":"rotate(0)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5"/></svg>
              </button>
              {locationOpen && <LocationDropdown selected={selectedLocation} onChange={handleBranchSelect} onClose={() => setLocationOpen(false)} />}
              {showBranchPopup && !locationOpen && (
                <BranchShippingPopup
                  branch={selectedLocation}
                  onDismiss={handleDismissBranchPopup}
                  onChangeBranch={handleChangeBranch}
                />
              )}
            </div>
          </div>
        } />

        <nav className="border-b px-4 sm:px-6 lg:px-8 py-3" style={{
          backgroundColor: isDark ? "#111827" : "white",
          borderColor: isDark ? "#2d3748" : "#DAEDD5",
        }}>
          {/* ── Top row: logo + desktop nav + icons ── */}
          <div className="flex items-center justify-between gap-4">

            {/* Logo */}
            <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); onNavigate?.("home"); }}>
              <img src={estingsLogo} alt="Esting's Logo" className="w-9 h-9 sm:w-10 sm:h-10 object-contain"
                style={{ filter: isDark ? "brightness(1.15)" : "none" }}/>
              <div className="hidden sm:flex flex-col leading-none items-start">
                <img src={estingsText} alt="Esting's" className="h-6 sm:h-7 object-contain"
                  style={{ filter: isDark ? "brightness(0) invert(1)" : "none" }}/>
                <span className="text-[7px] sm:text-[8px] font-semibold uppercase tracking-[0.08em] mt-0.5 self-start text-left"
                  style={{ color: isDark ? "#ffffff" : SITE_GREEN }}>
                  Flower International Inc.
                </span>
              </div>
            </div>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-5 xl:gap-8 flex-1 justify-center">

              {/* Nav links */}
              {FINAL_NAV_LINKS.map(link => (
                <div key={link.label} className="relative"
                  onMouseEnter={() => (link.dropdown||link.categories) && openMenuD(link.label)}
                  onMouseLeave={() => (link.dropdown||link.categories) && closeMenuD()}>
                  <button onClick={(e) => { e.stopPropagation(); handleNavClick(link); }}
                    className="flex items-center gap-0.5 text-sm font-medium pb-1 whitespace-nowrap transition-colors relative"
                    style={{
                      color: active===link.label ? (isDark?"#4ade80":SITE_GREEN) : (link.highlight ? (isDark?"#ff6b81":"#f43f5e") : (isDark ? "#d1d5db" : "#4b5563")),
                      borderBottom: active===link.label ? `2px solid ${isDark?"#4ade80":SITE_GREEN}` : "2px solid transparent",
                    }}
                    onMouseEnter={e => { if (active!==link.label) e.currentTarget.style.color = link.highlight ? (isDark?"#ff4d6d":"#e11d48") : (isDark ? "#86efac" : VIBRANT_GREEN); }}
                    onMouseLeave={e => { if (active!==link.label) e.currentTarget.style.color = link.highlight ? (isDark?"#ff6b81":"#f43f5e") : (isDark ? "#d1d5db" : "#4b5563"); }}>
                    {link.highlight && <FloatingHearts />}
                    {link.label}
                    {(link.dropdown||link.categories) && <svg className="w-3 h-3 text-gray-400 ml-0.5 transition-transform" style={{ transform:openMenu===link.label?"rotate(180deg)":"rotate(0)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5"/></svg>}
                  </button>
                  {(link.dropdown||link.categories) && openMenu===link.label && (
                    <div onMouseEnter={() => openMenuD(link.label)} onMouseLeave={closeMenuD}>
                      <DropdownMenu items={link.dropdown} categories={link.categories} onNavigate={onNavigate} onClose={() => setOpenMenu(null)} />
                    </div>
                  )}
                </div>
              ))}

              {/* Make it Personal button */}
              <div className="relative" ref={mipRef}
                onMouseEnter={() => { openMipD(); if (!isCustomizationEnabled) setShowLockTooltip(true); }}
                onMouseLeave={() => { closeMipD(); setShowLockTooltip(false); }}>
                <button
                  disabled={!isCustomizationEnabled}
                  onClick={(e) => { e.stopPropagation(); if (isCustomizationEnabled) onNavigate?.("make-it-personal"); }}
                  className={`whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full text-white flex items-center gap-1 transition-all select-none ${
                    isCustomizationEnabled
                      ? "hover:shadow-md hover:scale-105 cursor-pointer active:scale-95"
                      : "opacity-40 cursor-not-allowed"
                  }`}
                  style={{ background: isCustomizationEnabled ? "linear-gradient(135deg,#2E8B34,#0C573E)" : "#6b7280" }}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
                  Make it Personal
                  <svg className="w-2.5 h-2.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
                </button>

                {mipOpen && isCustomizationEnabled && (
                  <div onMouseEnter={openMipD} onMouseLeave={closeMipD}>
                    <MakeItPersonalPopout onNavigate={onNavigate} isCustomizationEnabled={isCustomizationEnabled} onClose={() => setMipOpen(false)} />
                  </div>
                )}

                {showLockTooltip && !isCustomizationEnabled && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 rounded-xl shadow-xl text-xs z-50 text-white bg-gray-900 border border-gray-800">
                    <div className="font-bold text-amber-400 mb-1 flex items-center gap-1">⚠️ Customization Paused</div>
                    Due to high seasonal demand, we are temporarily unable to cater customized products. Please choose from our signature catalogs!
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
                  </div>
                )}
              </div>
            </div>{/* end desktop nav links */}

            {/* Right side icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search */}
              <button onClick={(e) => { e.stopPropagation(); setSearchOpen(true); }}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors"
                style={{ color: isDark ? "#e5e7eb" : "#4b5563" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#1a2332" : "#f9fafb"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z"/></svg>
              </button>

              {/* Cart */}
              <div className="relative" ref={cartRef}>
                <button onClick={(e) => { e.stopPropagation(); onNavigate?.("cart"); }}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors relative"
                  style={{ color: isDark ? "#e5e7eb" : "#4b5563" }}
                  onMouseEnter={e => { openCartD(); e.currentTarget.style.backgroundColor = isDark ? "#1a2332" : "#f9fafb"; }}
                  onMouseLeave={e => { closeCartD(); e.currentTarget.style.backgroundColor = "transparent"; }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0Zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0Z"/></svg>
                  <span className="absolute -top-1 -right-1 flex items-center justify-center text-white font-bold rounded-full" style={{ backgroundColor:cartCount>0?"#e11d48":"#9ca3af", fontSize:"9px", width:"16px", height:"16px" }}>{cartCount}</span>
                </button>
                {cartOpen && <div onMouseEnter={openCartD} onMouseLeave={closeCartD}><CartDropdown cartCount={cartCount} onNavigate={onNavigate} /></div>}
              </div>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setNotifOpen(p => !p); }}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors relative"
                  style={{ color: isDark ? "#e5e7eb" : "#4b5563" }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = isDark ? "#1a2332" : "#f9fafb"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  aria-label="Notifications"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center text-white font-bold rounded-full"
                      style={{ backgroundColor: "#e11d48", fontSize: "9px", minWidth: "16px", height: "16px", padding: "0 3px" }}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div
                    onMouseLeave={() => setNotifOpen(false)}
                    className="absolute top-full right-0 mt-2 z-50 overflow-hidden"
                    style={{
                      width: "min(320px, calc(100vw - 6rem))",
                      backgroundColor: isDark ? "#1a2332" : "white",
                      border: `1px solid ${isDark ? "#2d3748" : "#e5e7eb"}`,
                      borderRadius: "14px",
                      boxShadow: isDark ? "0 12px 32px rgba(0,0,0,0.5)" : "0 12px 32px rgba(0,0,0,0.12)",
                      animation: "dropIn 0.18s cubic-bezier(0.4,0,0.2,1) forwards",
                    }}
                  >
                    <div className="flex items-center justify-between px-4 py-3"
                      style={{ borderBottom: `1px solid ${isDark ? "#2d3748" : "#f3f4f6"}` }}>
                      <span className="text-sm font-semibold" style={{ color: isDark ? "#e5e7eb" : "#111827" }}>Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); handleMarkAllRead(); }} className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color: SITE_GREEN }}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                      {loadingNotifs ? (
                        <div className="py-8 text-center text-xs" style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>Loading...</div>
                      ) : notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <svg className="w-8 h-8 mx-auto mb-2" style={{ color: isDark ? "#4b5563" : "#d1d5db" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                          </svg>
                          <p className="text-sm" style={{ color: isDark ? "#6b7280" : "#9ca3af" }}>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <button key={n.id} onClick={(e) => { e.stopPropagation(); handleNotifClick(n); }}
                            className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                            style={{
                              borderBottom: `1px solid ${isDark ? "#1e2a3a" : "#f9fafb"}`,
                              backgroundColor: n.is_read ? "transparent" : (isDark ? "rgba(46,139,52,0.08)" : "#f0fdf4"),
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#1e2a3a" : "#f9fafb"}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = n.is_read ? "transparent" : (isDark ? "rgba(46,139,52,0.08)" : "#f0fdf4")}
                          >
                            <div className="flex-shrink-0 mt-0.5 relative">
                              {n.image
                                ? <img src={n.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                : <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                                    style={{ backgroundColor: isDark ? "rgba(46,139,52,0.15)" : "#dcfce7" }}>
                                    {n.emoji || "📣"}
                                  </span>}
                              {!n.is_read && (
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                                  style={{ backgroundColor: SITE_GREEN, borderColor: isDark ? "#1a2332" : "white" }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold leading-snug" style={{ color: isDark ? "#e5e7eb" : "#111827" }}>{n.title}</p>
                              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>{n.message}</p>
                              <p className="text-[10px] mt-1" style={{ color: isDark ? "#4b5563" : "#9ca3af" }}>
                                {new Date(n.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User */}
              <div className="relative" ref={userRef} onMouseEnter={openUserD} onMouseLeave={closeUserD}>
                <button onClick={handleAccountClick}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors relative overflow-hidden border"
                  style={{ 
                    borderColor: isDark ? "#334155" : "#e5e7eb",
                    backgroundColor: user?.profilePictureUrl ? "transparent" : (isDark ? "#1a2332" : "#f9fafb"),
                    color: isDark ? "#e5e7eb" : "#4b5563"
                  }}
                  onMouseEnter={e => { if (!user?.profilePictureUrl) e.currentTarget.style.backgroundColor = isDark ? "#2d3748" : "#f3f4f6"; }}
                  onMouseLeave={e => { if (!user?.profilePictureUrl) e.currentTarget.style.backgroundColor = isDark ? "#1a2332" : "#f9fafb"; }}>
                  
                  {user?.profilePictureUrl ? (
                    <img src={user.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  )}
                </button>
                {userOpen && <UserHoverDropdown user={user} onNavigate={onNavigate} onLogout={handleLogout} />}
              </div>

              {/* Mobile hamburger */}
              <button className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                style={{ color: isDark ? "#e5e7eb" : "#4b5563" }}
                onClick={(e) => { e.stopPropagation(); setMobileOpen(p => !p); }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#1a2332" : "#f9fafb"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                <svg className="w-5 h-5 transition-transform duration-300 ease-out" style={{ transform: mobileOpen ? "rotate(90deg)" : "rotate(0)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  {mobileOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>}
                </svg>
              </button>
            </div>{/* end right icons */}

          </div>{/* end top row */}

          {/* ── Mobile menu (animated open/close) ── */}
          <div
            className="lg:hidden grid overflow-hidden transition-all duration-300 ease-out"
            style={{ gridTemplateRows: mobileOpen ? "1fr" : "0fr", opacity: mobileOpen ? 1 : 0, pointerEvents: mobileOpen ? "auto" : "none" }}
          >
            <div className="min-h-0 overflow-hidden">
              <div
                className="mt-2 transition-transform duration-300 ease-out"
                style={{ borderTop: `1px solid ${isDark ? "#2d3748" : "#f3f4f6"}`, transform: mobileOpen ? "translateY(0)" : "translateY(-6px)" }}
              >

              {/* Make it Personal section */}
              <div className="px-2 py-3 border-b" style={{ borderColor: isDark ? "#2d3748" : "#f3f4f6" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: isDark ? "#4ade80" : SITE_GREEN }}>Make it Personal</p>
                  {!isCustomizationEnabled && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">Disabled</span>}
                </div>
                {!isCustomizationEnabled && (
                  <p className="text-[11px] leading-relaxed px-1 text-amber-600 font-medium mb-3">
                    ⚠️ Custom bouquet ordering pipelines are temporarily paused to secure on-time deliveries during peak seasonal rush blocks. Please pick an elegant arrangement from our standard storefront options!
                  </p>
                )}
                <div className="space-y-1">
                  {MIP_OPTIONS.map(opt => {
                    const isMobOptionLocked = !isCustomizationEnabled && opt.page !== "ai-gallery";
                    return (
                      <button key={opt.page}
                        disabled={isMobOptionLocked}
                        onClick={(e) => { e.stopPropagation(); if (!isMobOptionLocked) { onNavigate?.(opt.page); setMobileOpen(false); } }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                        style={{
                          color: isMobOptionLocked ? "#9ca3af" : (isDark ? "#d1d5db" : "#374151"),
                          opacity: isMobOptionLocked ? 0.4 : 1,
                          cursor: isMobOptionLocked ? "not-allowed" : "pointer",
                          backgroundColor: "transparent"
                        }}
                        onMouseEnter={e => { if (!isMobOptionLocked) e.currentTarget.style.backgroundColor = isDark ? "rgba(74,222,128,0.1)" : "#f0fdf4"; }}
                        onMouseLeave={e => { if (!isMobOptionLocked) e.currentTarget.style.backgroundColor = "transparent"; }}>
                        <span style={{ color: isMobOptionLocked ? "#9ca3af" : opt.accent }}>{opt.icon}</span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nav links */}
              {FINAL_NAV_LINKS.map(link => (
                <div key={link.label}>
                  <button onClick={(e) => { e.stopPropagation(); handleNavClick(link); }}
                    className="w-full flex items-center text-left px-2 py-2.5 text-sm font-medium border-b transition-colors"
                    style={{
                      color: active===link.label ? (isDark ? "#4ade80" : SITE_GREEN) : (link.highlight ? (isDark ? "#ff6b81" : "#f43f5e") : (isDark ? "#d1d5db" : "#4b5563")),
                      borderColor: isDark ? "#2d3748" : "#f3f4f6",
                    }}>
                    {link.highlight && <span className="mr-1">✨</span>}
                    {link.label}
                  </button>

                  {(link.dropdown || link.categories) && (
                    <div style={{ paddingLeft:"16px", backgroundColor: isDark ? "#0f172a" : "#f9fafb" }}>
                      
                      {link.dropdown && link.dropdown.map(sub => (
                        <button key={sub.label} onClick={(e) => { e.stopPropagation(); onNavigate?.(sub.page, sub.param); setMobileOpen(false); }}
                          className="block w-full text-left px-2 py-2 text-xs border-b transition-colors"
                          style={{ borderColor: isDark ? "#2d3748" : "#f3f4f6", color: isDark ? "#9ca3af" : "#6b7280" }}
                          onMouseEnter={e => e.currentTarget.style.color = isDark ? "#4ade80" : VIBRANT_GREEN}
                          onMouseLeave={e => e.currentTarget.style.color = isDark ? "#9ca3af" : "#6b7280"}>
                          {sub.label}
                        </button>
                      ))}

                      {link.categories && link.categories.map(cat => (
                        <div key={cat.heading} className="py-2 border-b last:border-b-0" style={{ borderColor: isDark ? "#2d3748" : "#f3f4f6" }}>
                          
                          <button onClick={(e) => { e.stopPropagation(); onNavigate?.(cat.headingPage || "shop", cat.headingParam || cat.heading); setMobileOpen(false); }}
                            className="block w-full text-left px-2 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors"
                            style={{ color: isDark ? "#4ade80" : SITE_GREEN }}>
                            {cat.heading}
                          </button>
                          
                          {cat.items.map(sub => (
                            <button key={sub.label} onClick={(e) => { e.stopPropagation(); onNavigate?.(sub.page, sub.param); setMobileOpen(false); }}
                              className="block w-full text-left pl-4 pr-2 py-2 text-xs transition-colors"
                              style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
                              onMouseEnter={e => e.currentTarget.style.color = isDark ? "#4ade80" : VIBRANT_GREEN}
                              onMouseLeave={e => e.currentTarget.style.color = isDark ? "#9ca3af" : "#6b7280"}>
                              {sub.label}
                            </button>
                          ))}
                          
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Auth section */}
              <div className="px-2 py-3 border-t" style={{ borderColor: isDark ? "#2d3748" : "#f3f4f6" }}>
                {user ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-3">
                      
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden border border-gray-200" 
                        style={{ background: user?.profilePictureUrl ? "transparent" : "linear-gradient(135deg,#2E8B34,#0C573E)" }}>
                        {user?.profilePictureUrl ? (
                          <img src={user.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          user?.firstName?.[0]?.toUpperCase() || "U"
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-semibold" style={{ color: isDark ? "#f3f4f6" : "#111827" }}>{user.firstName} {user.lastName}</p>
                        <p className="text-xs" style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>{user.email}</p>
                      </div>
                    </div>
                    {[{l:"My Account",p:"account"},{l:"My Orders",p:"orders"},{l:"Wishlist",p:"wishlist"},{l:"Settings",p:"settings"}].map(({l,p}) => (
                      <button key={p} onClick={(e) => { e.stopPropagation(); onNavigate?.(p); setMobileOpen(false); }}
                        className="w-full text-left text-sm px-2 py-1.5 rounded transition-colors"
                        style={{ color: isDark ? "#d1d5db" : "#4b5563" }}
                        onMouseEnter={e=>{e.currentTarget.style.backgroundColor=isDark?"rgba(74,222,128,0.1)":"#f0fdf4";e.currentTarget.style.color=isDark?"#4ade80":VIBRANT_GREEN;}}
                        onMouseLeave={e=>{e.currentTarget.style.backgroundColor="transparent";e.currentTarget.style.color=isDark?"#d1d5db":"#4b5563";}}>{l}</button>
                    ))}
                    <button onClick={(e) => { e.stopPropagation(); handleLogout(); }} className="flex items-center gap-2 text-sm text-red-500 font-medium px-2 py-1.5 rounded hover:bg-red-50 transition-colors w-full mt-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onNavigate?.("login"); setMobileOpen(false); }} className="flex-1 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90" style={{ backgroundColor:SITE_GREEN }}>Login</button>
                    <button onClick={(e) => { e.stopPropagation(); onNavigate?.("register"); setMobileOpen(false); }} className="flex-1 py-2 text-sm font-semibold rounded-lg border transition-all hover:opacity-80" style={{ borderColor:SITE_GREEN, color:SITE_GREEN }}>Sign Up</button>
                  </div>
                )}
              </div>

              </div>{/* end mobile menu content */}
            </div>{/* end mobile menu clip */}
          </div>{/* end mobile menu (animated) */}

        </nav>
      </div>
    </>
  );
}