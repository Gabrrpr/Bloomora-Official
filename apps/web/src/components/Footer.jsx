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
    href: "https://www.facebook.com/profile.php?id=100063877087893",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/estingsflowershop/",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
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
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 448 512">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
      </svg>
    ),
  },
  {
    name: "Gmail",
    href: "#",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 512 512">
                <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
      </svg>
    ),
  },
]

const BRANCHES = [
  {
    name: "Manila Branch",
    address: "1605 Laon-Laan Corner Dos Castillas Street, Sampaloc, Manila",
    hours: "9:00 AM – 9:00 PM",
    phone: "+63 918 902 2401",
  },
  {
    name: "Pampanga Branch",
    address: "McArthur Hi-way, Dolores, City of San Fernando, Pampanga C-2000",
    hours: "7:30 AM – 5:00 PM",
    phone: "+63 045 961 5378",
  },
]

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#0C573E", color: "white" }}>

      {/* Main footer body */}
      <div className="px-8 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand col */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <img src="/src/assets/EstingsLogo.svg" alt="Esting's" className="w-10 h-10 object-contain" onError={e => e.target.style.display = "none"} />
              <img src="/src/assets/Estings.svg" alt="Esting's" className="h-7 object-contain brightness-0 invert" onError={e => e.target.style.display = "none"} />
            </div>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.65)" }}>
              Since 1959, Esting's Flower International Inc. has been delivering fresh, quality flowers from San Fernando, Pampanga, and Manila.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2 mb-7">
              {SOCIAL_LINKS.map(s => (
                <a
                  key={s.name}
                  href={s.href}
                  title={s.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "6px" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.28)"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"}
                >
                  {s.icon}
                </a>
              ))}
            </div>

            {/* Branches */}
            <div className="flex flex-col gap-5">
              {BRANCHES.map(branch => (
                <div key={branch.name}>
                  <p className="text-sm font-semibold mb-1" style={{ color: "#DAEDD5" }}>{branch.name}</p>
                  <div className="flex items-start gap-1.5 mb-0.5">
                    <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style={{ color: "rgba(255,255,255,0.5)" }}>
                      <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742ZM12 13.5a3 3 0 100-6 3 3 0 000 6Z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{branch.address}</p>
                  </div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ color: "rgba(255,255,255,0.5)" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{branch.hours}</p>
                  </div>
                  {branch.phone && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ color: "rgba(255,255,255,0.5)" }}>
<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                      </svg>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{branch.phone}</p>
                    </div>
                  )}
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
                      className="text-sm transition-colors duration-150"
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
          <span>© {new Date().getFullYear()} Esting's Flower International Inc. All rights reserved.</span>
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
