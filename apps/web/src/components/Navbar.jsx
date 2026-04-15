import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import estingsLogo from "../assets/EstingsLogo.svg";
import estingsText from "../assets/Estings.svg";

const NAV_LINKS = [
  { label: "Home", href: "#" },
  {
    label: "Shop", href: "#",
    dropdown: [
      { label: "Best Sellers", href: "#" },
      { label: "Classic Collection", href: "#" },
      { label: "Seasonal Picks", href: "#" },
      { label: "Gift Sets", href: "#" },
    ],
  },
  {
    label: "Occasions", href: "#",
    dropdown: [
      { label: "Birthdays", href: "#" },
      { label: "Anniversaries", href: "#" },
      { label: "Weddings", href: "#" },
      { label: "Graduations", href: "#" },
      { label: "Sympathy", href: "#" },
      { label: "Just Because", href: "#" },
    ],
  },
  { label: "About Us", href: "#" },
  { label: "Contact Us", href: "#" },
];

const NAVY_GREEN = "#35530A";
const SITE_GREEN = "#2E8B34";

const SOCIAL_LINKS = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=100063877087893",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/estingsflowershop/",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "WhatsApp",
    href: "#",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 448 512">
        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
      </svg>
    ),
  },
  {
    name: "Gmail",
    href: "#",
    icon: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 512 512">
        <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
      </svg>
    ),
  },
];

function DropdownMenu({ items }) {
  return (
    <div
      className="absolute top-full left-0 mt-1 bg-white z-50 min-w-[180px]"
      style={{ border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
    >
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          className="block px-4 py-2.5 text-sm text-gray-600 first:rounded-t-lg last:rounded-b-lg transition-colors"
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = SITE_GREEN; e.currentTarget.style.color = "white"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#4b5563"; }}
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}

function CartDropdown({ cartCount }) {
  return (
    <div
      className="absolute top-full right-0 mt-2 bg-white z-50 w-72"
      style={{ border: "1px solid #e5e7eb", borderRadius: "12px", boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-800">Your Cart</span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: cartCount > 0 ? "#e11d48" : "#9ca3af" }}
        >
          {cartCount}
        </span>
      </div>

      {/* Empty state */}
      {cartCount === 0 ? (
        <div className="px-4 py-8 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">No products in the cart</p>
          <p className="text-xs text-gray-400">Add something beautiful 🌸</p>
        </div>
      ) : (
        <div className="px-4 py-3 text-sm text-gray-600">
          {/* Items would render here when connected to backend */}
          <p className="text-xs text-gray-400 italic">{cartCount} item(s) in cart</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</span>
          <span className="text-sm font-bold text-gray-800">₱0.00</span>
        </div>
        <p className="text-xs text-gray-400 mb-3">Taxes and shipping calculated at checkout</p>
        <button
          className="w-full py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90"
          style={{ backgroundColor: cartCount > 0 ? SITE_GREEN : "#d1d5db", cursor: cartCount > 0 ? "pointer" : "not-allowed" }}
          disabled={cartCount === 0}
        >
          {cartCount > 0 ? "Proceed to Checkout" : "Start Shopping"}
        </button>
      </div>
    </div>
  );
}

function UserDropdown({ user, onNavigate, onLogout }) {
  return (
    <div
      className="absolute top-full right-0 mt-2 bg-white z-50 w-56"
      style={{ border: "1px solid #e5e7eb", borderRadius: "12px", boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }}
    >
      {user ? (
        <>
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ backgroundColor: SITE_GREEN }}
              >
                {user.firstName?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          {[
            { label: "My Profile", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0ZM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632Z" },
            { label: "My Orders", icon: "M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" },
            { label: "Wishlist", icon: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" },
            { label: "Settings", icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z M15 12a3 3 0 11-6 0 3 3 0 016 0Z" },
          ].map(({ label, icon }) => (
            <button
              key={label}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors text-left"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
              {label}
            </button>
          ))}

          <div className="border-t border-gray-100 mt-1" />
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors rounded-b-xl"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Logout
          </button>
        </>
      ) : (
        <>
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">Welcome!</p>
            <p className="text-xs text-gray-400 mt-0.5">Sign in to manage your orders</p>
          </div>
          <div className="p-3 space-y-2">
            <button
              onClick={() => onNavigate("login")}
              className="w-full py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90"
              style={{ backgroundColor: SITE_GREEN }}
            >
              Login
            </button>
            <button
              onClick={() => onNavigate("register")}
              className="w-full py-2 text-sm font-semibold rounded-lg border transition-all hover:bg-gray-50"
              style={{ borderColor: SITE_GREEN, color: SITE_GREEN }}
            >
              Create Account
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Navbar({ cartCount = 0, onNavigate }) {
  const { user, logout } = useAuth();
  const [active, setActive] = useState("Home");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Manila");
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const navRef = useRef(null);
  const cartRef = useRef(null);
  const userRef = useRef(null);

  const handleLogout = () => {
    logout();
    setUserOpen(false);
    if (onNavigate) onNavigate("login");
  };

  useEffect(() => {
    function handleClick(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null);
        setIsDropdownOpen(false);
      }
      if (cartRef.current && !cartRef.current.contains(e.target)) setCartOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="w-full sticky top-0 z-50" ref={navRef}>

      {/* Top announcement bar */}
      <div className="text-white px-4 sm:px-8 py-2.5 flex items-center" style={{ backgroundColor: "#0C573E" }}>
        <div className="flex-1" />
        <span className="font-medium text-xs sm:text-sm text-center whitespace-nowrap">
          🌸 Get{" "}
          <span className="font-bold">5% off your first order</span>
          {" — "}
          <a
            href="#"
            className="font-bold underline underline-offset-2 hover:opacity-80 transition-opacity tracking-wide"
          >
            ORDER NOW
          </a>
        </span>
        <div className="flex-1 flex items-center justify-end gap-2">
          {SOCIAL_LINKS.map((s) => (
            <a
              key={s.name}
              href={s.href}
              title={s.name}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)")}
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>

      {/* Main navbar */}
      <nav className="bg-white border-b px-4 sm:px-6 lg:px-8 py-3" style={{ borderColor: "#DAEDD5" }}>
        <div className="flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <img src={estingsLogo} alt="Esting's Logo" className="w-9 h-9 sm:w-10 sm:h-10 object-contain" />
            <img src={estingsText} alt="Esting's" className="h-6 sm:h-7 object-contain hidden sm:block" />
          </div>

          {/* Desktop center */}
          <div className="hidden lg:flex items-center gap-5 xl:gap-7">
            {/* Deliver to */}
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style={{ color: SITE_GREEN }}>
                <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742ZM12 13.5a3 3 0 100-6 3 3 0 000 6Z" clipRule="evenodd" />
              </svg>
              <span className="text-xs uppercase tracking-wide font-medium" style={{ color: SITE_GREEN }}>Deliver to</span>
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen((p) => !p)}
                  className="flex items-center gap-1 border border-gray-200 rounded px-2.5 py-1 text-sm text-gray-700 hover:border-gray-400 transition-colors"
                >
                  {selectedLocation}
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[120px]">
                    {["Manila", "Pampanga"].map((loc) => (
                      <button
                        key={loc}
                        onClick={() => { setSelectedLocation(loc); setIsDropdownOpen(false); }}
                        className="block w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Nav links */}
            <div className="flex items-center gap-4 xl:gap-5">
              {NAV_LINKS.map((link) => (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => link.dropdown && setOpenMenu(link.label)}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <a
                    href={link.href}
                    onClick={() => setActive(link.label)}
                    className="flex items-center gap-0.5 text-sm font-medium pb-1 whitespace-nowrap transition-colors"
                    style={{
                      color: active === link.label ? SITE_GREEN : "#4b5563",
                      borderBottom: active === link.label ? `2px solid ${SITE_GREEN}` : "2px solid transparent",
                    }}
                    onMouseEnter={(e) => { if (active !== link.label) e.currentTarget.style.color = NAVY_GREEN; }}
                    onMouseLeave={(e) => { if (active !== link.label) e.currentTarget.style.color = "#4b5563"; }}
                  >
                    {link.label}
                    {link.dropdown && (
                      <svg className="w-3 h-3 text-gray-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    )}
                  </a>
                  {link.dropdown && openMenu === link.label && <DropdownMenu items={link.dropdown} />}
                </div>
              ))}

              {/* Make it Personal */}
              <a
                href="#"
                className="whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full text-white flex items-center gap-1 transition-all duration-200 hover:shadow-md hover:scale-105"
                style={{ background: "linear-gradient(135deg, #2E8B34, #0C573E)" }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Make it Personal
              </a>
            </div>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
              </svg>
            </button>

            {/* Cart with hover dropdown */}
            <div className="relative" ref={cartRef}>
              <button
                onMouseEnter={() => setCartOpen(true)}
                onMouseLeave={() => setCartOpen(false)}
                onClick={() => setCartOpen((p) => !p)}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors relative text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0Zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0Z" />
                </svg>
                <span
                  className="absolute -top-1 -right-1 flex items-center justify-center text-white font-bold rounded-full"
                  style={{ backgroundColor: cartCount > 0 ? "#e11d48" : "#9ca3af", fontSize: "9px", width: "16px", height: "16px" }}
                >
                  {cartCount}
                </span>
              </button>
              {cartOpen && (
                <div onMouseEnter={() => setCartOpen(true)} onMouseLeave={() => setCartOpen(false)}>
                  <CartDropdown cartCount={cartCount} />
                </div>
              )}
            </div>

            {/* User icon with dropdown */}
            <div className="relative" ref={userRef}>
              <button
                onMouseEnter={() => setUserOpen(true)}
                onMouseLeave={() => setUserOpen(false)}
                onClick={() => setUserOpen((p) => !p)}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors text-gray-600 relative"
              >
                {user ? (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: SITE_GREEN }}
                  >
                    {user.firstName?.[0]?.toUpperCase() || "U"}
                  </div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0ZM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                )}
              </button>
              {userOpen && (
                <div onMouseEnter={() => setUserOpen(true)} onMouseLeave={() => setUserOpen(false)}>
                  <UserDropdown user={user} onNavigate={onNavigate} onLogout={handleLogout} />
                </div>
              )}
            </div>

            {/* Hamburger */}
            <button
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors text-gray-600 ml-1"
              onClick={() => setMobileOpen((p) => !p)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t" style={{ borderColor: "#DAEDD5" }}>
            <div className="flex items-center gap-2 px-2 mb-3 flex-wrap">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ color: SITE_GREEN }}>
                <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742ZM12 13.5a3 3 0 100-6 3 3 0 000 6Z" clipRule="evenodd" />
              </svg>
              <span className="text-xs uppercase tracking-wide font-medium" style={{ color: SITE_GREEN }}>Deliver to</span>
              {["Manila", "Pampanga"].map((loc) => (
                <button
                  key={loc}
                  onClick={() => setSelectedLocation(loc)}
                  className="text-sm px-2 py-0.5 rounded border transition-colors"
                  style={{
                    borderColor: selectedLocation === loc ? SITE_GREEN : "#e5e7eb",
                    color: selectedLocation === loc ? SITE_GREEN : "#6b7280",
                    fontWeight: selectedLocation === loc ? 600 : 400,
                  }}
                >
                  {loc}
                </button>
              ))}
            </div>
            {NAV_LINKS.map((link) => (
              <div key={link.label}>
                <a
                  href={link.href}
                  onClick={() => { setActive(link.label); setMobileOpen(false); }}
                  className="block px-2 py-2.5 text-sm font-medium border-b transition-colors"
                  style={{ color: active === link.label ? SITE_GREEN : "#4b5563", borderColor: "#f3f4f6" }}
                >
                  {link.label}
                </a>
                {link.dropdown && (
                  <div className="pl-4 bg-gray-50">
                    {link.dropdown.map((sub) => (
                      <a
                        key={sub.label}
                        href={sub.href}
                        className="block px-2 py-2 text-xs text-gray-500 border-b hover:text-emerald-700 transition-colors"
                        style={{ borderColor: "#f3f4f6" }}
                      >
                        {sub.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Mobile auth section */}
            <div className="px-2 py-3 border-t mt-1" style={{ borderColor: "#f3f4f6" }}>
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: SITE_GREEN }}>
                      {user.firstName?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-red-500 font-medium px-2 py-1.5 rounded hover:bg-red-50 transition-colors w-full"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { onNavigate?.("login"); setMobileOpen(false); }}
                    className="flex-1 py-2 text-sm font-semibold text-white rounded-lg" style={{ backgroundColor: SITE_GREEN }}>
                    Login
                  </button>
                  <button onClick={() => { onNavigate?.("register"); setMobileOpen(false); }}
                    className="flex-1 py-2 text-sm font-semibold rounded-lg border" style={{ borderColor: SITE_GREEN, color: SITE_GREEN }}>
                    Sign Up
                  </button>
                </div>
              )}
            </div>

            <div className="px-2 pb-3">
              <a
                href="#"
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full text-white"
                style={{ background: "linear-gradient(135deg, #2E8B34, #0C573E)" }}
              >
                Make it Personal
              </a>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
