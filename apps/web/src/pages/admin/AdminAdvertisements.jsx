import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { useTheme } from "../../context/ThemeContext"

const DG = "#0C573E"
const G  = "#2E8B34"

const ADS = [
  { id: 1, title: "Happy Mother's Day" },
  { id: 2, title: "Happy Father's Day" },
  { id: 3, title: "Happy Valentine's Day" },
  { id: 4, title: "Birthday" },
  { id: 5, title: "Happy Valentine's Day" },
  { id: 6, title: "Happy Chinese New Year" },
  { id: 7, title: "Happy Teacher's Day" },
  { id: 8, title: "Ribbon Cutting Ceremony" },
  { id: 9, title: "Graduation Day" },
]

const AD_SRCS = Object.fromEntries(
  ADS.map(ad => [
    ad.id,
    new URL(`../../assets/ads/advertisement${ad.id}.png`, import.meta.url).href,
  ])
)

// ── LazyImage ────────────────────────────────────────────────────────────────
function LazyImage({ src, alt, style, eager = false, onClick, fit = "cover" }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(eager)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (eager) return
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { rootMargin: "120px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [eager])

  return (
    <div ref={ref} style={{ position: "relative", overflow: "hidden", ...style }}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse"
          style={{ background: "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      )}
      {inView && (
        <img
          src={src} alt={alt} decoding="async"
          onLoad={() => setLoaded(true)}
          onClick={onClick}
          style={{
            width: "100%", height: "100%",
            objectFit: fit,
            objectPosition: "center",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.35s ease",
            cursor: onClick ? "pointer" : undefined,
            display: "block",
          }}
        />
      )}
    </div>
  )
}

export default function AdminAdvertisements() {
  const { isDark } = useTheme()
  const [active,    setActive]    = useState(1)
  const [preview,   setPreview]   = useState(null)
  const [saved,     setSaved]     = useState(false)
  const [gridReady, setGridReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setGridReady(true), 80)
    return () => clearTimeout(t)
  }, [])

  const cardBg    = isDark ? "#1e293b" : "white"
  const cardBdr   = isDark ? "#334155" : "#e8edf2"
  const headerBg  = isDark ? "#162032" : "#fafbfc"
  const headerBdr = isDark ? "#2d3f55" : "#f1f5f9"
  const imgBg     = isDark ? "#0f172a" : "#f8fafc"
  const subTxt    = isDark ? "#94a3b8" : "#9ca3af"
  const bodyTxt   = isDark ? "#f1f5f9" : "#111827"
  const mutedTxt  = isDark ? "#64748b" : "#9ca3af"
  const divider   = isDark ? "#1e293b" : "#f1f5f9"
  const slotBg    = isDark ? "#1e293b" : "#f1f5f9"
  const slotTxt   = isDark ? "#94a3b8" : "#6b7280"
  const slotBdr   = isDark ? "#334155" : "#e2e8f0"

  const activeAd = useMemo(() => ADS.find(a => a.id === active), [active])
  const handleSetActive = useCallback((id) => { setActive(id); setSaved(false) }, [])
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  return (
    <div className="space-y-5">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>

      {/* ── Page header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: bodyTxt }}>Pop-up Advertisements</h1>
          <p className="text-sm mt-0.5" style={{ color: subTxt }}>
            Manage which advertisement is displayed as a pop-up on the customer site.
          </p>
        </div>
        <button onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 active:scale-95"
          style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
          {saved
            ? <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Saved!</>
            : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>Save Changes</>
          }
        </button>
      </div>

      {/* ── Active ad panel ── */}
      <div className="rounded-xl overflow-hidden"
        style={{ border: `1px solid ${cardBdr}`, boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.06)" }}>

        <div className="flex items-center justify-between px-5 py-2.5"
          style={{ background: `linear-gradient(90deg, ${DG}, #1a6b4a)` }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
            <p className="text-xs font-bold tracking-widest uppercase text-white/80">Currently Active Ad</p>
          </div>
          <p className="text-xs font-semibold text-white/60">Ad {active} of {ADS.length}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px]"
          style={{ backgroundColor: cardBg }}>

          {/* ── Active ad image — plain img so height is truly auto, no cropping ── */}
          <div className="flex items-center justify-center p-6"
            style={{ backgroundColor: imgBg, borderRight: `1px solid ${divider}` }}>
            <img
              src={AD_SRCS[activeAd.id]}
              alt={activeAd.title}
              decoding="async"
              onClick={() => setPreview(activeAd)}
              className="w-full rounded-xl cursor-pointer hover:scale-[1.01] transition-transform duration-200"
              style={{ display: "block", height: "auto", maxHeight: "480px", objectFit: "contain", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}
            />
          </div>

          {/* ── Active ad info ── */}
          <div className="flex flex-col justify-between px-6 py-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-1.5" style={{ color: G }}>
                  Active Advertisement
                </p>
                <p className="text-xl font-bold leading-tight" style={{ color: bodyTxt }}>{activeAd.title}</p>
                <p className="text-xs mt-1" style={{ color: mutedTxt }}>advertisement{activeAd.id}.png</p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md w-fit"
                  style={{ backgroundColor: isDark ? "rgba(34,197,94,0.12)" : "#f0fdf4", color: G, border: "1px solid #bbf7d0" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                  Live on customer site
                </span>
                <button onClick={() => setPreview(activeAd)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border transition-all w-fit"
                  style={{ borderColor: isDark ? "#334155" : "#e2e8f0", color: isDark ? "#94a3b8" : "#6b7280", backgroundColor: isDark ? "#1e293b" : "white" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#2d3f55" : "#f9fafb"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "white"}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  Preview Full Size
                </button>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: mutedTxt }}>All Slots</p>
                <div className="flex flex-wrap gap-1.5">
                  {ADS.map(ad => (
                    <button key={ad.id} onClick={() => handleSetActive(ad.id)} title={ad.title}
                      className="w-7 h-7 rounded-md text-xs font-bold transition-all hover:scale-110"
                      style={{
                        backgroundColor: ad.id === active ? G : slotBg,
                        color: ad.id === active ? "white" : slotTxt,
                        border: `1px solid ${ad.id === active ? G : slotBdr}`,
                      }}>
                      {ad.id}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-xs mt-4 pt-4" style={{ borderTop: `1px solid ${divider}`, color: mutedTxt }}>
              Select a slot above or click a card below, then hit{" "}
              <span className="font-semibold" style={{ color: isDark ? "#cbd5e1" : "#374151" }}>Save Changes</span>.
            </p>
          </div>
        </div>
      </div>

      {/* ── All ads grid ── */}
      <div className="rounded-xl overflow-hidden"
        style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)" }}>

        <div className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: `1px solid ${headerBdr}`, backgroundColor: headerBg }}>
          <p className="text-sm font-semibold" style={{ color: bodyTxt }}>
            All Advertisements{" "}
            <span className="ml-2 text-xs font-normal" style={{ color: mutedTxt }}>{ADS.length} total</span>
          </p>
          <p className="text-xs hidden sm:block" style={{ color: mutedTxt }}>Click a card to select · Eye icon for full preview</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-5">
          {!gridReady
            ? ADS.map(ad => (
                <div key={ad.id} className="rounded-xl overflow-hidden" style={{ border: `2px solid ${cardBdr}` }}>
                  <div className="animate-pulse" style={{ aspectRatio: "4/3", background: isDark ? "#162032" : "#f1f5f9" }} />
                  <div className="px-3 py-2.5" style={{ backgroundColor: cardBg }}>
                    <div className="h-3 rounded animate-pulse mb-1" style={{ background: isDark ? "#1e293b" : "#e2e8f0", width: "70%" }} />
                    <div className="h-2.5 rounded animate-pulse" style={{ background: isDark ? "#1e293b" : "#e2e8f0", width: "30%" }} />
                  </div>
                </div>
              ))
            : ADS.map(ad => {
                const isActive = ad.id === active
                return (
                  <div key={ad.id} onClick={() => handleSetActive(ad.id)}
                    className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
                    style={{
                      border: isActive ? `2px solid ${G}` : `2px solid ${cardBdr}`,
                      boxShadow: isActive ? `0 0 0 3px rgba(46,139,52,0.15), 0 4px 12px rgba(0,0,0,0.12)` : isDark ? "none" : "0 1px 4px rgba(0,0,0,0.04)",
                      transform: isActive ? "translateY(-2px)" : "translateY(0)",
                    }}>

                    {/* Grid thumbnails use cover — they're small so cropping is fine */}
                    <div className="relative" style={{ aspectRatio: "4/3", backgroundColor: imgBg }}>
                      <LazyImage
                        src={AD_SRCS[ad.id]}
                        alt={ad.title}
                        fit="cover"
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                      />

                      {isActive && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white z-10"
                          style={{ backgroundColor: G, boxShadow: "0 2px 6px rgba(46,139,52,0.4)" }}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                          </svg>
                        </div>
                      )}

                      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10"
                        style={{ background: "rgba(0,0,0,0.42)" }}>
                        <button onClick={e => { e.stopPropagation(); setPreview(ad) }}
                          className="w-8 h-8 rounded-md bg-white flex items-center justify-center shadow hover:scale-105 transition-transform">
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </button>
                        {!isActive && (
                          <button onClick={e => { e.stopPropagation(); handleSetActive(ad.id) }}
                            className="w-8 h-8 rounded-md flex items-center justify-center shadow hover:scale-105 transition-transform text-white"
                            style={{ backgroundColor: G }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="px-3 py-2.5"
                      style={{
                        backgroundColor: isActive ? (isDark ? "rgba(34,197,94,0.08)" : "#f0fdf4") : cardBg,
                        borderTop: `1px solid ${isActive ? "rgba(46,139,52,0.15)" : divider}`,
                      }}>
                      <p className="text-xs font-semibold truncate" style={{ color: bodyTxt }}>{ad.title}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs" style={{ color: mutedTxt }}>Ad {ad.id}</p>
                        {isActive && (
                          <span className="flex items-center gap-1 text-xs font-bold" style={{ color: G }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>

      {/* ── Preview modal ── */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}
          onClick={() => setPreview(null)}>
          <div className="rounded-2xl overflow-hidden w-full"
            style={{ maxWidth: "600px", backgroundColor: isDark ? "#1a2332" : "white", border: `1px solid ${isDark ? "#2d3748" : "#e8edf2"}`, boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${divider}` }}>
              <div>
                <p className="text-sm font-bold" style={{ color: bodyTxt }}>{preview.title}</p>
                <p className="text-xs mt-0.5" style={{ color: mutedTxt }}>advertisement{preview.id}.png</p>
              </div>
              <button onClick={() => setPreview(null)} className="p-1.5 rounded-lg transition-all" style={{ color: mutedTxt }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#2d3f55" : "#f1f5f9"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Modal image — plain img so full ad is always visible */}
            <div className="p-4 flex items-center justify-center" style={{ backgroundColor: imgBg }}>
              <img
                src={AD_SRCS[preview.id]}
                alt={preview.title}
                decoding="async"
                style={{ display: "block", width: "100%", height: "auto", maxHeight: "480px", objectFit: "contain", borderRadius: "10px" }}
              />
            </div>

            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ borderTop: `1px solid ${divider}`, backgroundColor: headerBg }}>
              {active === preview.id
                ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md"
                    style={{ backgroundColor: isDark ? "rgba(34,197,94,0.12)" : "#f0fdf4", color: G, border: "1px solid #bbf7d0" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                    Currently Active
                  </span>
                : <p className="text-xs" style={{ color: mutedTxt }}>Not currently active</p>
              }
              {active !== preview.id && (
                <button onClick={() => { handleSetActive(preview.id); setPreview(null) }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white rounded-lg hover:opacity-90 transition-all active:scale-95"
                  style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                  Set as Active
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}