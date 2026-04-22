import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import estingsLogo from "../assets/EstingsLogo.svg";
import estingsText from "../assets/Estings.svg";

const SITE_GREEN = "#2E8B34";
const NAVY_GREEN = "#35530A";

const PROMOTIONS = [
  { text: "Get", highlight: "3% off your first order", cta: "SHOP NOW", page: "shop" },
  { text: "Free delivery on orders over", highlight: "₱2,000", cta: "ORDER NOW", page: "shop" },
  { text: "Custom bouquets made just for you!", highlight: "Make it Personal", cta: "TRY IT", page: "make-it-personal" },
  { text: "Visit us in", highlight: "Manila & Pampanga", cta: "GET DIRECTIONS", page: "contact" },
];

const NAV_LINKS = [
  { label: "Home", page: "home" },
  {
    label: "Shop", page: "shop", categorized: true,
    categories: [
      { heading: "Flowers", items: [{ label: "Best Sellers", page: "shop" }, { label: "Classic Collection", page: "shop" }, { label: "Gift Sets", page: "shop" }] },
      { heading: "Botanicals & Gifts", items: [{ label: "Vases & Containers", page: "shop" }, { label: "Pots & Planters", page: "shop" }, { label: "Floral Supplies", page: "shop" }, { label: "Wrapping & Accessories", page: "shop" }] },
    ],
  },
  {
    label: "Occasions", page: "occasions",
    dropdown: [
      { label: "Birthdays", page: "occasions" }, { label: "Anniversaries", page: "occasions" },
      { label: "Weddings", page: "occasions" }, { label: "Graduations", page: "occasions" },
      { label: "Sympathy", page: "occasions" }, { label: "Just Because", page: "occasions" },
      { label: "Openings", page: "occasions" },
    ],
  },
  { label: "About Us", page: "about" },
  { label: "Contact Us", page: "contact" },
  { label: "Help Center", page: null, dropdown: [{ label: "FAQs", page: "faq" }, { label: "Track My Order", page: "orders" }, { label: "Return Policy", page: "return-policy" }] },
];

const SOCIAL_LINKS = [
  { name: "Facebook",  href: "https://www.facebook.com/profile.php?id=100063877087893", icon: (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>) },
  { name: "Instagram", href: "https://www.instagram.com/estingsflowershop/",             icon: (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>) },
  { name: "WhatsApp",  href: "#", icon: (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" /></svg>) },
  { name: "Gmail",     href: "#", icon: (<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 512 512"><path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" /></svg>) },
];

// ── Promo Carousel ─────────────────────────────────────────────────────────────
// Layout: [invisible spacer] | [← arrow · text · → arrow] centered | [social icons far right]
function PromoCarousel({ onNavigate }) {
  const [current, setCurrent]     = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState("next");
  const intervalRef = useRef(null);
  const total = PROMOTIONS.length;

  const go = (dir) => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(c => dir === "next" ? (c + 1) % total : (c - 1 + total) % total);
      setAnimating(false);
    }, 260);
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => go("next"), 4000);
    return () => clearInterval(intervalRef.current);
  }, [animating]);

  const promo = PROMOTIONS[current];

  const arrowBtn = (dir) => (
    <button
      onClick={() => { clearInterval(intervalRef.current); go(dir); }}
      style={{
        width: "26px", height: "26px",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: "50%", border: "none", background: "transparent",
        color: "rgba(255,255,255,0.85)", cursor: "pointer",
        flexShrink: 0, transition: "background 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d={dir === "prev" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );

  return (
    <div style={{ backgroundColor: "#0C573E", minHeight: "52px", display: "flex", alignItems: "center", padding: "0 16px" }}>

      {/* Left spacer — matches right socials width to keep center group truly centered */}
      <div className="hidden sm:flex items-center gap-1.5" style={{ visibility: "hidden", flexShrink: 0 }}>
        {SOCIAL_LINKS.map(s => <div key={s.name} style={{ width: "28px", height: "28px" }} />)}
      </div>

      {/* CENTER GROUP: left arrow + animated text + right arrow — all together */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
        {arrowBtn("prev")}

        <div style={{ overflow: "hidden" }}>
          <span
            className="text-xs sm:text-sm font-medium text-white"
            style={{
              display: "inline-block",
              whiteSpace: "nowrap",
              transition: animating ? "opacity 0.26s ease, transform 0.26s ease" : "none",
              opacity:    animating ? 0 : 1,
              transform:  animating
                ? direction === "next" ? "translateX(-14px)" : "translateX(14px)"
                : "translateX(0)",
            }}
          >
            {promo.text}&nbsp;
            <strong>{promo.highlight}</strong>
            {" — "}
            <button
              onClick={() => onNavigate?.(promo.page)}
              style={{
                fontWeight: 700, textDecoration: "underline", textUnderlineOffset: "2px",
                background: "none", border: "none", color: "white", cursor: "pointer",
                letterSpacing: "0.05em", padding: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              {promo.cta}
            </button>
          </span>
        </div>

        {arrowBtn("next")}
      </div>

      {/* RIGHT: social icons — far right */}
      <div className="hidden sm:flex items-center gap-1.5" style={{ flexShrink: 0 }}>
        {SOCIAL_LINKS.map(s => (
          <a key={s.name} href={s.href} title={s.name} target="_blank" rel="noopener noreferrer"
            className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.3)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"}
          >{s.icon}</a>
        ))}
      </div>
    </div>
  );
}

// ── Search Overlay ─────────────────────────────────────────────────────────────
function SearchOverlay({ onClose, onNavigate }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);
  const handleSubmit = (e) => { e.preventDefault(); if (query.trim()) { onNavigate?.("shop"); onClose(); } };
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <style>{`@keyframes searchSlideDown { from { opacity:0; transform:translateY(-24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
      <div className="w-full max-w-2xl" onClick={e => e.stopPropagation()}
        style={{ animation: "searchSlideDown 0.25s cubic-bezier(0.34,1.56,0.64,1) both" }}>
        <form onSubmit={handleSubmit}>
          <div className="flex items-stretch bg-white rounded-2xl overflow-hidden shadow-2xl" style={{ border: `2px solid ${SITE_GREEN}` }}>
            <div className="flex items-center px-4 flex-shrink-0">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
              </svg>
            </div>
            <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search for flowers, bouquets, occasions..."
              className="flex-1 py-4 text-base outline-none text-gray-800 placeholder-gray-400 bg-transparent" />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="px-3 text-gray-400 hover:text-gray-600 self-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
            <button type="submit" className="px-6 text-sm font-bold text-white transition-all hover:opacity-90 self-stretch flex items-center"
              style={{ backgroundColor: SITE_GREEN, borderRadius: "0 14px 14px 0" }}>Search</button>
          </div>
          <p className="text-center text-white/60 text-xs mt-3">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-white text-xs">Esc</kbd> to close
          </p>
        </form>
      </div>
    </div>
  );
}

function DropdownMenu({ items, categories, onNavigate, onClose }) {
  if (categories) {
    return (
      <div className="absolute top-full left-0 mt-2 bg-white z-50 overflow-hidden"
        style={{ border: "1px solid #e5e7eb", borderRadius: "12px", boxShadow: "0 12px 32px rgba(0,0,0,0.10)", animation: "dropIn 0.18s cubic-bezier(0.4,0,0.2,1) forwards", minWidth: "340px" }}>
        <div className="flex divide-x divide-gray-100">
          {categories.map(cat => (
            <div key={cat.heading} className="flex-1 py-3">
              <p className="px-4 pb-2 text-xs font-bold uppercase tracking-widest" style={{ color: SITE_GREEN }}>{cat.heading}</p>
              {cat.items.map(item => (
                <button key={item.label} onClick={() => { if (item.page && onNavigate) onNavigate(item.page); onClose?.(); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-600 transition-all duration-150"
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = SITE_GREEN; e.currentTarget.style.color = "white"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = ""; e.currentTarget.style.color = ""; }}
                >{item.label}</button>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="absolute top-full left-0 mt-2 bg-white z-50 min-w-[190px] overflow-hidden"
      style={{ border: "1px solid #e5e7eb", borderRadius: "12px", boxShadow: "0 12px 32px rgba(0,0,0,0.10)", animation: "dropIn 0.18s cubic-bezier(0.4,0,0.2,1) forwards" }}>
      {items.map((item) => (
        <button key={item.label} onClick={() => { if (item.page && onNavigate) onNavigate(item.page); onClose?.(); }}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-600 first:rounded-t-xl last:rounded-b-xl transition-all duration-150"
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = SITE_GREEN; e.currentTarget.style.color = "white"; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = ""; e.currentTarget.style.color = ""; }}
        >{item.label}</button>
      ))}
    </div>
  );
}

function CartDropdown({ cartCount, onNavigate }) {
  return (
    <div className="absolute top-full right-0 mt-2 bg-white z-50 w-72 overflow-hidden"
      style={{ border: "1px solid #e5e7eb", borderRadius: "14px", boxShadow: "0 12px 32px rgba(0,0,0,0.12)", animation: "dropIn 0.18s cubic-bezier(0.4,0,0.2,1) forwards" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-800">Your Cart</span>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: cartCount > 0 ? "#e11d48" : "#9ca3af" }}>{cartCount}</span>
      </div>
      {cartCount === 0 ? (
        <div className="px-4 py-8 text-center">
          <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Your cart is empty</p>
          <p className="text-xs text-gray-400">Browse our collection and add something you love.</p>
        </div>
      ) : (
        <div className="px-4 py-3 text-sm text-gray-500">{cartCount} item(s) in cart</div>
      )}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subtotal</span>
          <span className="text-sm font-bold text-gray-800">₱0.00</span>
        </div>
        <p className="text-xs text-gray-400 mb-3">Shipping and taxes calculated at checkout.</p>
        <button onClick={() => onNavigate?.("cart")} className="w-full py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90" style={{ backgroundColor: SITE_GREEN }}>View Cart</button>
      </div>
    </div>
  );
}

function UserHoverDropdown({ user, onNavigate, onLogout }) {
  if (!user) {
    return (
      <div className="absolute top-full right-0 mt-2 bg-white z-50 overflow-hidden"
        style={{ border: "1px solid #e5e7eb", borderRadius: "14px", boxShadow: "0 12px 32px rgba(0,0,0,0.12)", animation: "dropIn 0.18s cubic-bezier(0.4,0,0.2,1) forwards", minWidth: "200px" }}>
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">Welcome!</p>
          <p className="text-xs text-gray-400 mt-0.5">Sign in to manage your orders</p>
        </div>
        <div className="p-3 space-y-2">
          <button onClick={() => onNavigate("login")} className="w-full py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90" style={{ backgroundColor: SITE_GREEN }}>Login</button>
          <button onClick={() => onNavigate("register")} className="w-full py-2 text-sm font-semibold rounded-lg border transition-all hover:bg-gray-50" style={{ borderColor: SITE_GREEN, color: SITE_GREEN }}>Create Account</button>
        </div>
      </div>
    );
  }
  return (
    <div className="absolute top-full right-0 mt-2 bg-white z-50 overflow-hidden"
      style={{ border: "1px solid #e5e7eb", borderRadius: "14px", boxShadow: "0 12px 32px rgba(0,0,0,0.12)", animation: "dropIn 0.18s cubic-bezier(0.4,0,0.2,1) forwards", minWidth: "200px" }}>
      <div className="px-4 py-3 border-b border-gray-100" style={{ background: "linear-gradient(to right,#f0fdf4,white)" }}>
        <p className="text-xs text-gray-400">Signed in as</p>
        <p className="text-sm font-bold text-gray-800 truncate">{user.firstName} {user.lastName}</p>
      </div>
      <div className="py-1">
        {[{ label: "My Account", page: "account" }, { label: "My Orders", page: "orders" }, { label: "Wishlist", page: "wishlist" }].map(({ label, page }) => (
          <button key={label} onClick={() => onNavigate(page)}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-green-50 hover:text-green-800 transition-all">{label}</button>
        ))}
      </div>
      <div className="border-t border-gray-100">
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-all rounded-b-xl">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}

function LocationDropdown({ selected, onChange, onClose }) {
  return (
    <div className="absolute top-full left-0 mt-1.5 bg-white z-50 w-32 overflow-hidden"
      style={{ border: "1px solid #e5e7eb", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.10)", animation: "dropIn 0.18s cubic-bezier(0.4,0,0.2,1) forwards" }}>
      {["Manila", "Pampanga"].map((loc) => (
        <button key={loc} onClick={() => { onChange(loc); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-all first:rounded-t-xl last:rounded-b-xl"
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#f0fdf4"; e.currentTarget.style.color = SITE_GREEN; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = ""; e.currentTarget.style.color = ""; }}>
          {selected === loc && <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: SITE_GREEN }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
          <span className={selected === loc ? "font-semibold" : ""} style={{ color: selected === loc ? SITE_GREEN : "#374151", marginLeft: selected === loc ? 0 : "19px" }}>{loc}</span>
        </button>
      ))}
    </div>
  );
}

export default function Navbar({ cartCount = 0, onNavigate }) {
  const { user, logout } = useAuth();
  const [active, setActive]                     = useState("Home");
  const [locationOpen, setLocationOpen]         = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Manila");
  const [openMenu, setOpenMenu]                 = useState(null);
  const [mobileOpen, setMobileOpen]             = useState(false);
  const [cartOpen, setCartOpen]                 = useState(false);
  const [userOpen, setUserOpen]                 = useState(false);
  const [searchOpen, setSearchOpen]             = useState(false);
  const navRef = useRef(null), cartRef = useRef(null), userRef = useRef(null), locationRef = useRef(null);
  const menuCloseTimer = useRef(null), cartCloseTimer = useRef(null), userCloseTimer = useRef(null);

  const openMenuDelayed  = (l) => { clearTimeout(menuCloseTimer.current); setOpenMenu(l); };
  const closeMenuDelayed = ()  => { menuCloseTimer.current = setTimeout(() => setOpenMenu(null), 200); };
  const openCartDelayed  = ()  => { clearTimeout(cartCloseTimer.current); setCartOpen(true); };
  const closeCartDelayed = ()  => { cartCloseTimer.current = setTimeout(() => setCartOpen(false), 200); };
  const openUserDelayed  = ()  => { clearTimeout(userCloseTimer.current); setUserOpen(true); };
  const closeUserDelayed = ()  => { userCloseTimer.current = setTimeout(() => setUserOpen(false), 200); };

  const handleLogout       = () => { logout(); setUserOpen(false); onNavigate?.("login"); };
  const handleNavClick     = (link) => { setActive(link.label); if (link.page) onNavigate?.(link.page); setMobileOpen(false); };
  const handleAccountClick = () => { setUserOpen(false); onNavigate?.(user ? "account" : "login"); };

  useEffect(() => {
    const handleClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenMenu(null);
      if (cartRef.current && !cartRef.current.contains(e.target)) setCartOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
      if (locationRef.current && !locationRef.current.contains(e.target)) setLocationOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      <style>{`@keyframes dropIn { from { opacity:0; transform:translateY(-8px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} onNavigate={onNavigate} />}

      <div className="w-full sticky top-0 z-50" ref={navRef}>
        <PromoCarousel onNavigate={onNavigate} />

        <nav className="bg-white border-b px-4 sm:px-6 lg:px-8 py-3" style={{ borderColor: "#DAEDD5" }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => onNavigate?.("home")}>
              <img src={estingsLogo} alt="Esting's Logo" className="w-9 h-9 sm:w-10 sm:h-10 object-contain" />
              <img src={estingsText} alt="Esting's" className="h-6 sm:h-7 object-contain hidden sm:block" />
            </div>

            <div className="hidden lg:flex items-center gap-6 xl:gap-8">
              <div className="flex items-center gap-1.5" ref={locationRef}>
                <span className="text-xs uppercase tracking-wide font-medium" style={{ color: SITE_GREEN }}>Deliver to</span>
                <div className="relative">
                  <button onClick={() => setLocationOpen(p => !p)}
                    className="flex items-center gap-1.5 border rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:border-green-400 transition-all"
                    style={{ borderColor: locationOpen ? SITE_GREEN : "#e5e7eb" }}>
                    <svg className="w-3 h-3" style={{ color: SITE_GREEN }} fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742ZM12 13.5a3 3 0 100-6 3 3 0 000 6Z" clipRule="evenodd" />
                    </svg>
                    {selectedLocation}
                    <svg className="w-3 h-3 text-gray-400 transition-transform" style={{ transform: locationOpen ? "rotate(180deg)" : "rotate(0)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {locationOpen && <LocationDropdown selected={selectedLocation} onChange={setSelectedLocation} onClose={() => setLocationOpen(false)} />}
                </div>
              </div>

              <div className="flex items-center gap-5 xl:gap-7">
                {NAV_LINKS.map(link => (
                  <div key={link.label} className="relative"
                    onMouseEnter={() => (link.dropdown || link.categories) && openMenuDelayed(link.label)}
                    onMouseLeave={() => (link.dropdown || link.categories) && closeMenuDelayed()}>
                    <button onClick={() => handleNavClick(link)}
                      className="flex items-center gap-0.5 text-sm font-medium pb-1 whitespace-nowrap transition-colors"
                      style={{ color: active === link.label ? SITE_GREEN : "#4b5563", borderBottom: active === link.label ? `2px solid ${SITE_GREEN}` : "2px solid transparent" }}
                      onMouseEnter={e => { if (active !== link.label) e.currentTarget.style.color = NAVY_GREEN; }}
                      onMouseLeave={e => { if (active !== link.label) e.currentTarget.style.color = "#4b5563"; }}>
                      {link.label}
                      {(link.dropdown || link.categories) && (
                        <svg className="w-3 h-3 text-gray-400 ml-0.5 transition-transform" style={{ transform: openMenu === link.label ? "rotate(180deg)" : "rotate(0)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      )}
                    </button>
                    {(link.dropdown || link.categories) && openMenu === link.label && (
                      <div onMouseEnter={() => openMenuDelayed(link.label)} onMouseLeave={() => closeMenuDelayed()}>
                        <DropdownMenu items={link.dropdown} categories={link.categories} onNavigate={onNavigate} onClose={() => setOpenMenu(null)} />
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={() => onNavigate?.("make-it-personal")}
                  className="whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full text-white flex items-center gap-1 transition-all hover:shadow-md hover:scale-105"
                  style={{ background: "linear-gradient(135deg,#2E8B34,#0C573E)" }}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Make it Personal
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={() => setSearchOpen(true)} className="hidden lg:flex w-9 h-9 items-center justify-center rounded-full hover:bg-gray-50 transition-colors text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" /></svg>
              </button>
              <div className="relative" ref={cartRef}>
                <button onMouseEnter={openCartDelayed} onMouseLeave={closeCartDelayed} onClick={() => onNavigate?.("cart")}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors relative text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0Zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0Z" /></svg>
                  <span className="absolute -top-1 -right-1 flex items-center justify-center text-white font-bold rounded-full" style={{ backgroundColor: cartCount > 0 ? "#e11d48" : "#9ca3af", fontSize: "9px", width: "16px", height: "16px" }}>{cartCount}</span>
                </button>
                {cartOpen && <div onMouseEnter={openCartDelayed} onMouseLeave={closeCartDelayed}><CartDropdown cartCount={cartCount} onNavigate={onNavigate} /></div>}
              </div>
              <div className="relative" ref={userRef}>
                <button onMouseEnter={openUserDelayed} onMouseLeave={closeUserDelayed} onClick={handleAccountClick}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors text-gray-600">
                  {user
                    ? <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#2E8B34,#0C573E)" }}>{user.firstName?.[0]?.toUpperCase() || "U"}</div>
                    : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0ZM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                  }
                </button>
                {userOpen && <div onMouseEnter={openUserDelayed} onMouseLeave={closeUserDelayed}><UserHoverDropdown user={user} onNavigate={(p) => { onNavigate?.(p); setUserOpen(false); }} onLogout={handleLogout} /></div>}
              </div>
              <button className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors text-gray-600 ml-1" onClick={() => setMobileOpen(p => !p)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
                </svg>
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="lg:hidden mt-3 pt-3 border-t" style={{ borderColor: "#DAEDD5" }}>
              <div className="flex items-center gap-2 px-2 mb-3 flex-wrap">
                <span className="text-xs uppercase tracking-wide font-medium" style={{ color: SITE_GREEN }}>Deliver to</span>
                {["Manila", "Pampanga"].map(loc => (
                  <button key={loc} onClick={() => setSelectedLocation(loc)} className="text-sm px-2 py-0.5 rounded border transition-colors"
                    style={{ borderColor: selectedLocation === loc ? SITE_GREEN : "#e5e7eb", color: selectedLocation === loc ? SITE_GREEN : "#6b7280", fontWeight: selectedLocation === loc ? 600 : 400 }}>{loc}</button>
                ))}
              </div>
              {NAV_LINKS.map(link => (
                <div key={link.label}>
                  <button onClick={() => handleNavClick(link)} className="w-full text-left px-2 py-2.5 text-sm font-medium border-b transition-colors"
                    style={{ color: active === link.label ? SITE_GREEN : "#4b5563", borderColor: "#f3f4f6" }}>{link.label}</button>
                  {link.dropdown && (
                    <div className="pl-4 bg-gray-50">
                      {link.dropdown.map(sub => (
                        <button key={sub.label} onClick={() => { onNavigate?.(sub.page); setMobileOpen(false); }}
                          className="block w-full text-left px-2 py-2 text-xs text-gray-500 border-b hover:text-emerald-700 transition-colors" style={{ borderColor: "#f3f4f6" }}>{sub.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="px-2 py-3 border-t mt-1" style={{ borderColor: "#f3f4f6" }}>
                {user ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#2E8B34,#0C573E)" }}>{user.firstName?.[0]?.toUpperCase()}</div>
                      <div><p className="text-sm font-semibold text-gray-800">{user.firstName} {user.lastName}</p><p className="text-xs text-gray-400">{user.email}</p></div>
                    </div>
                    {[{ l: "My Account", p: "account" }, { l: "My Orders", p: "orders" }, { l: "Wishlist", p: "wishlist" }, { l: "Settings", p: "settings" }].map(({ l, p }) => (
                      <button key={p} onClick={() => { onNavigate?.(p); setMobileOpen(false); }} className="w-full text-left text-sm text-gray-600 px-2 py-1.5 rounded hover:bg-green-50 hover:text-green-800 transition-colors">{l}</button>
                    ))}
                    <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-500 font-medium px-2 py-1.5 rounded hover:bg-red-50 transition-colors w-full mt-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => { onNavigate?.("login"); setMobileOpen(false); }} className="flex-1 py-2 text-sm font-semibold text-white rounded-lg" style={{ backgroundColor: SITE_GREEN }}>Login</button>
                    <button onClick={() => { onNavigate?.("register"); setMobileOpen(false); }} className="flex-1 py-2 text-sm font-semibold rounded-lg border" style={{ borderColor: SITE_GREEN, color: SITE_GREEN }}>Sign Up</button>
                  </div>
                )}
              </div>
              <div className="px-2 pb-3">
                <button onClick={() => { onNavigate?.("make-it-personal"); setMobileOpen(false); }} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full text-white" style={{ background: "linear-gradient(135deg,#2E8B34,#0C573E)" }}>Make it Personal</button>
              </div>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}
