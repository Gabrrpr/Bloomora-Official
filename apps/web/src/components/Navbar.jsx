// src/components/Navbar.jsx
import { useState } from "react";

const NAV_LINKS = [
  { label: "Home", href: "#" },
  { label: "Shop", href: "#" },
  { label: "Occasions", href: "#" },
  { label: "About Us", href: "#" },
  { label: "Contact Us", href: "#" },
];

// Navy green hover (for links)
const NAVY_GREEN = "#35530A";

// Site green from your gradient
const SITE_GREEN = "#2E8B34";

export default function Navbar() {
  const [active, setActive] = useState("Home");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Manila");

  // Cart count (for now, simple state; you can later move this up or use context)
  const [cartCount, setCartCount] = useState(0);

  return (
    <div className="w-full">
      {/* Top announcement bar */}
      <div
        className="text-white text-xs py-2 px-4 sm:px-8 flex items-center justify-center whitespace-nowrap overflow-x-auto"
        style={{ backgroundColor: "#0C573E" }}
      >
        <span className="font-medium tracking-wide text-center">
          Sign up{" "}
          <a
            href="#"
            className="font-bold text-white hover:opacity-80 transition-opacity"
          >
            and let your first order bloom with 5% off
          </a>
        </span>
      </div>

      {/* Main navbar */}
      <nav
        className="bg-white border-b px-2 sm:px-4 md:px-8 py-2 md:py-3 flex flex-wrap items-center justify-between gap-4 sm:gap-6"
        style={{ borderColor: "#DAEDD5" }}
      >
        {/* Logo (left) */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Circle logo SVG */}
          <img
            src="/src/assets/EstingsLogo.svg"
            alt="Esting's Logo"
            className="w-10 h-10 sm:w-11 sm:h-11 object-contain"
          />

          {/* Letter logo SVG */}
          <img
            src="/src/assets/Estings.svg"
            alt="Esting's"
            className="h-6 sm:h-7 object-contain"
          />
        </div>

        {/* Centered part: Deliver to dropdown + nav links */}
        <div className="flex-1 flex flex-col lg:flex-row items-center gap-6 lg:gap-8 justify-center my-2 lg:my-0 text-sm sm:text-base">
          {/* Deliver to dropdown */}
          <div className="relative flex items-center gap-2">
            {/* Pin icon (bigger, same color as text) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
              style={{ color: SITE_GREEN }}
            >
              <path
                fillRule="evenodd"
                d="m11.54 22.351.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742ZM12 13.5a3 3 0 100-6 3 3 0 000 6Z"
                clipRule="evenodd"
              />
            </svg>

            {/* Deliver to (small, normal‑weight, same green) */}
            <span
              className="uppercase tracking-wide text-xs sm:text-sm"
              style={{ color: SITE_GREEN }}
            >
              Deliver to
            </span>

            {/* Button with Manila + down arrow (no arrow on options) */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center justify-between border border-gray-300 rounded-md px-3 py-[6px] text-sm text-gray-700 hover:border-gray-400 transition-colors"
                style={{ width: "130px" }}
              >
                <span>{selectedLocation}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-4 h-4 text-gray-400 ml-1"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>

              {/* Dropdown: options only (no arrow icons) */}
              {isDropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-3 bg-white border border-gray-200 rounded-md shadow-lg z-50 transition-all duration-150 min-w-[140px] max-w-[200px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {["Manila", "Pampanga"].map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setSelectedLocation(loc);
                        setIsDropdownOpen(false);
                      }}
                      className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 text-left transition-colors"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Nav links + Make it Personal */}
          <div className="flex items-center gap-4 sm:gap-5 lg:gap-6 flex-wrap justify-center">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setActive(link.label)}
                className="text-sm sm:text-base font-medium relative pb-1.5 transition-all duration-300 whitespace-nowrap"
                style={{
                  color: active === link.label ? SITE_GREEN : "#4b5563",
                  borderBottom:
                    active === link.label
                      ? "3px solid #2E8B34"
                      : "3px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (active !== link.label) {
                    e.currentTarget.style.color = NAVY_GREEN;
                    e.currentTarget.style.transform = "scale(1.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (active !== link.label) {
                    e.currentTarget.style.color = "#4b5563";
                    e.currentTarget.style.transform = "scale(1)";
                  }
                }}
              >
                {link.label}
              </a>
            ))}

            {/* Make it Personal */}
            <a
              href="#"
              onClick={() => setActive("Make it Personal")}
              className="relative whitespace-nowrap text-xs sm:text-sm font-semibold px-2 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-tr from-green-600 via-green-700 to-green-800 hover:from-green-700 hover:via-green-800 hover:to-green-900 transition-all duration-300 hover:scale-105 hover:shadow-md text-white"
            >
              <svg
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline-block mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              Make it Personal
            </a>
          </div>
        </div>

        {/* Right side: search + cart + user icons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Search icon */}
          <a
            href="#"
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 hover:text-gray-900"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </a>

          {/* Shopping cart icon with counter badge */}
          <a
            href="#"
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors relative"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 hover:text-gray-900"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>

            {/* Counter badge */}
            {cartCount > 0 && (
              <span
                className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-500 text-white"
                style={{ minWidth: "1rem", height: "1rem" }}
              >
                {cartCount}
              </span>
            )}
          </a>

          {/* User icon */}
          <a
            href="#"
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 hover:text-gray-900"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
          </a>
        </div>
      </nav>
    </div>
  );
}