import { useState, useRef, useEffect } from "react";

const NAV_LINKS = [
  { label: "Home", href: "#" },
  {
    label: "Shop",
    href: "#",
    dropdown: [
      { label: "Best Sellers", href: "#" },
      { label: "Classic Collection", href: "#" },
      { label: "Seasonal Picks", href: "#" },
      { label: "Gift Sets", href: "#" },
    ],
  },
  {
    label: "Occasions",
    href: "#",
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
    href: "#",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "#",
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
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.878-1.427A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
      </svg>
    ),
  },
  {
    name: "Viber",
    href: "#",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.4 0C5.5 0 1 4.3 1 9.8c0 2.8 1.2 5.4 3.2 7.2v4l3.7-2c1.1.3 2.3.5 3.5.5 5.9 0 10.4-4.3 10.4-9.8C21.8 4.3 17.3 0 11.4 0zm5.2 14.9c-.3.8-1.5 1.5-2.1 1.6-.5.1-1.2.1-3.8-.8-3.2-1.2-5.3-4.4-5.4-4.6-.2-.2-1.3-1.7-1.3-3.3 0-1.6.8-2.3 1.1-2.7.3-.3.7-.4 1-.4h.7c.3 0 .5.1.8.6.3.6 1 2.4 1.1 2.6.1.2.1.4 0 .6-.1.2-.2.3-.3.5-.2.1-.3.3-.5.5-.1.2-.3.3-.1.7.2.3.9 1.4 1.9 2.3 1.3 1.1 2.4 1.5 2.7 1.6.3.1.5.1.7-.1.2-.2.8-.9 1-1.2.2-.3.4-.2.7-.1.3.1 1.8.9 2.1 1 .3.2.5.3.6.4.1.4-.1 1-.9 1.8z" />
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
          className="block px-4 py-2.5 text-sm text-gray-600 hover:text-white transition-colors first:rounded-t-lg last:rounded-b-lg"
          style={{ transition: "background 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = SITE_GREEN; e.currentTarget.style.color = "white"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#4b5563"; }}
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}

export default function Navbar({ cartCount = 0 }) {
  const [active, setActive] = useState("Home");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Manila");
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null);
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="w-full sticky top-0 z-50" ref={navRef}>
      {/* Top announcement bar */}
      <div
        className="text-white px-4 sm:px-8 py-3 flex items-center justify-between gap-4"
        style={{ backgroundColor: "#0C573E" }}
      >
        <span className="font-medium tracking-wide text-xs sm:text-sm whitespace-nowrap">
          Sign up{" "}
          <a href="#" className="font-bold underline underline-offset-2 hover:opacity-80 transition-opacity">
            and let your first order bloom with 5% off
          </a>
        </span>

        {/* Social icons */}
        <div className="flex items-center gap-2 flex-shrink-0">
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
      <nav
        className="bg-white border-b px-4 sm:px-6 lg:px-8 py-3"
        style={{ borderColor: "#DAEDD5" }}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <img src="/src/assets/EstingsLogo.svg" alt="Esting's Logo" className="w-9 h-9 sm:w-10 sm:h-10 object-contain" />
            <img src="/src/assets/Estings.svg" alt="Esting's" className="h-6 sm:h-7 object-contain hidden sm:block" />
          </div>

          {/* Desktop center */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
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
                      <button key={loc} onClick={() => { setSelectedLocation(loc); setIsDropdownOpen(false); }}
                        className="block w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">
                        {loc}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Nav links */}
            <div className="flex items-center gap-5 xl:gap-6">
              {NAV_LINKS.map((link) => (
                <div key={link.label} className="relative" onMouseEnter={() => link.dropdown && setOpenMenu(link.label)} onMouseLeave={() => setOpenMenu(null)}>
                  <a
                    href={link.href}
                    onClick={() => setActive(link.label)}
                    className="flex items-center gap-0.5 text-sm font-medium pb-1 transition-all duration-200 whitespace-nowrap"
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
                className="whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full text-white transition-all duration-200 hover:shadow-md hover:scale-105 flex items-center gap-1"
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
            {/* Search */}
            <button className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </button>

            {/* Cart */}
            <button className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors relative text-gray-600 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <span
                className="absolute -top-1 -right-1 flex items-center justify-center text-white font-bold rounded-full"
                style={{
                  backgroundColor: cartCount > 0 ? "#e11d48" : "#9ca3af",
                  fontSize: "9px",
                  width: "16px",
                  height: "16px",
                }}
              >
                {cartCount}
              </span>
            </button>

            {/* User */}
            <button className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </button>

            {/* Mobile hamburger */}
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
            {/* Deliver to mobile */}
            <div className="flex items-center gap-2 px-2 mb-3">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ color: SITE_GREEN }}>
                <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742ZM12 13.5a3 3 0 100-6 3 3 0 000 6Z" clipRule="evenodd" />
              </svg>
              <span className="text-xs uppercase tracking-wide font-medium" style={{ color: SITE_GREEN }}>Deliver to</span>
              {["Manila", "Pampanga"].map((loc) => (
                <button key={loc} onClick={() => setSelectedLocation(loc)}
                  className="text-sm px-2 py-0.5 rounded border transition-colors"
                  style={{ borderColor: selectedLocation === loc ? SITE_GREEN : "#e5e7eb", color: selectedLocation === loc ? SITE_GREEN : "#6b7280", fontWeight: selectedLocation === loc ? 600 : 400 }}>
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
                      <a key={sub.label} href={sub.href}
                        className="block px-2 py-2 text-xs text-gray-500 border-b hover:text-emerald-700 transition-colors"
                        style={{ borderColor: "#f3f4f6" }}>
                        {sub.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="px-2 py-3">
              <a href="#"
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full text-white"
                style={{ background: "linear-gradient(135deg, #2E8B34, #0C573E)" }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Make it Personal
              </a>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
