import { useEffect, useRef, useState } from "react"
import { useTheme } from "../context/ThemeContext"

const G    = "#2E8B34"
const G_DARK = "#4ade80"   // bright green for dark mode accents

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    title: "Same Day Delivery",
    subtitle: "Order before 2:00 PM",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    title: "Handled With Care",
    subtitle: "Every order inspected",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
    title: "65+ Years of Trust",
    subtitle: "Serving since 1959",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
      </svg>
    ),
    title: "Always Fresh",
    subtitle: "Blooms that last 7+ days",
  },
]

export default function TrustBar() {
  const { isDark } = useTheme()
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const iconColor  = isDark ? G_DARK : G
  const titleColor = isDark ? "#e5e7eb" : "#1f2937"
  const subColor   = isDark ? "#9ca3af" : "#6b7280"
  const bgColor    = isDark ? "#111827" : "white"
  const borderColor = isDark ? "#2d3748" : "#e9f5ea"
  const dividerColor = isDark ? "#2d3748" : "#e5e7eb"

  return (
    <div
      ref={ref}
      className="w-full py-4 px-4 sm:px-8"
      style={{
        backgroundColor: bgColor,
        borderBottom: `1px solid ${borderColor}`,
        borderTop:    `1px solid ${borderColor}`,
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="flex items-center gap-3 px-4 py-3 sm:py-2 justify-center sm:justify-start"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(12px)",
                transition: `opacity 0.5s ease ${i * 80}ms, transform 0.5s ease ${i * 80}ms`,
                borderRight: i < FEATURES.length - 1 ? `1px solid ${dividerColor}` : "none",
              }}
            >
              <div className="flex-shrink-0" style={{ color: iconColor }}>
                {f.icon}
              </div>
              <div>
                <p className="text-sm font-bold leading-tight" style={{ color: titleColor }}>
                  {f.title}
                </p>
                <p className="text-xs leading-tight" style={{ color: subColor }}>
                  {f.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}