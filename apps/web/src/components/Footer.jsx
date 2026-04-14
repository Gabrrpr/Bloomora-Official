const FOOTER_LINKS = {
  "Quick Links": [
    { label: "Home", href: "#" },
    { label: "Shop", href: "#" },
    { label: "Occasions", href: "#" },
    { label: "About Us", href: "#" },
    { label: "Contact Us", href: "#" },
  ],
  "Our Products": [
    { label: "Best Sellers", href: "#" },
    { label: "Classic Collection", href: "#" },
    { label: "Seasonal Picks", href: "#" },
    { label: "Gift Sets", href: "#" },
    { label: "Make it Personal", href: "#" },
  ],
  "Customer Care": [
    { label: "FAQs", href: "#" },
    { label: "Delivery Information", href: "#" },
    { label: "Track My Order", href: "#" },
    { label: "Return Policy", href: "#" },
    { label: "Privacy Policy", href: "#" },
  ],
}

const SOCIAL_LINKS = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/estingsflowersinternational",
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
]

const BRANCHES = [
  {
    name: "Manila Branch",
    address: "123 Flower Street, Ermita, Manila",
    hours: "Mon–Sat: 8:00 AM – 7:00 PM",
    phone: "+63 2 8123 4567",
  },
  {
    name: "Pampanga Branch",
    address: "456 Bloom Avenue, San Fernando, Pampanga",
    hours: "Mon–Sat: 8:00 AM – 7:00 PM",
    phone: "+63 45 123 4567",
  },
]

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#0C573E", color: "white" }}>

      {/* Newsletter strip */}
      <div className="border-b px-8 py-6" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-base">Stay in bloom — subscribe to our newsletter</p>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>Get fresh arrivals, exclusive offers, and floral tips delivered to your inbox.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 md:w-64 px-4 py-2 text-sm text-gray-800 bg-white rounded outline-none focus:ring-2"
              style={{ borderRadius: "6px" }}
            />
            <button
              className="px-4 py-2 text-sm font-semibold text-white rounded transition-all duration-200 hover:opacity-90 whitespace-nowrap"
              style={{ backgroundColor: "#2E8B34", borderRadius: "6px" }}
            >
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Main footer body */}
      <div className="px-8 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand col */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src="/src/assets/EstingsLogo.svg" alt="Esting's" className="w-10 h-10 object-contain" onError={e => e.target.style.display = "none"} />
              <img src="/src/assets/Estings.svg" alt="Esting's" className="h-7 object-contain brightness-0 invert" onError={e => e.target.style.display = "none"} />
            </div>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.65)" }}>
              Esting's Flowers International Inc. — bringing fresh, handcrafted floral arrangements to your doorstep since 1998. From weddings to everyday moments, we make every bloom count.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map(s => (
                <a
                  key={s.name}
                  href={s.href}
                  title={s.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "6px" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.25)"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"}
                >
                  {s.icon}
                </a>
              ))}
            </div>

            {/* Branches */}
            <div className="mt-6 flex flex-col gap-4">
              {BRANCHES.map(branch => (
                <div key={branch.name}>
                  <p className="text-sm font-semibold" style={{ color: "#DAEDD5" }}>{branch.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>{branch.address}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{branch.hours}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{branch.phone}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <p className="text-sm font-semibold mb-4" style={{ color: "#DAEDD5" }}>{title}</p>
              <ul className="flex flex-col gap-2.5">
                {links.map(link => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm transition-colors duration-150 hover:text-white"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                      onMouseEnter={e => e.currentTarget.style.color = "white"}
                      onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-8 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
          <span>© {new Date().getFullYear()} Esting's Flowers International Inc. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>

    </footer>
  )
}
