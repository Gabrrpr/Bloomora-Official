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

// ── Local persistence keys ───────────────────────────────────────────────────
const ACTIVE_ID_KEY  = "bloomora_active_ad_id"   // existing — which ad is live
const ACTIVE_SRC_KEY = "bloomora_active_ad_src"   // NEW — resolved image of the live ad (read this on the customer side)
const CUSTOM_ADS_KEY = "bloomora_custom_ads"      // NEW — admin-uploaded ads
const OVERRIDES_KEY  = "bloomora_ad_overrides"    // NEW — replacement images for the built-in slots

// Build the starting ad list: hardcoded defaults + any admin uploads / replacements saved locally
function buildInitialAds() {
  const builtin = ADS.map(a => ({ id: a.id, title: a.title, src: AD_SRCS[a.id], builtin: true }))
  try {
    const overrides = JSON.parse(localStorage.getItem(OVERRIDES_KEY) || "{}") || {}
    builtin.forEach(a => { if (overrides[a.id]) a.src = overrides[a.id] })
  } catch { /* ignore */ }
  let custom = []
  try {
    custom = (JSON.parse(localStorage.getItem(CUSTOM_ADS_KEY) || "[]") || [])
      .filter(a => a && a.id != null && a.src)
      .map(a => ({ id: Number(a.id), title: a.title || "Advertisement", src: a.src, builtin: false }))
  } catch { /* ignore */ }
  return [...builtin, ...custom]
}

// Downscale + compress an uploaded image so a few of them fit inside localStorage
function compressImage(file, maxDim = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          const scale = Math.min(maxDim / width, maxDim / height)
          width = Math.round(width * scale); height = Math.round(height * scale)
        }
        const canvas = document.createElement("canvas")
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext("2d")
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        try { resolve(canvas.toDataURL("image/jpeg", quality)) }
        catch (e) { reject(e) }
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function persistCustomAds(list) {
  try {
    const custom = list.filter(a => !a.builtin).map(a => ({ id: a.id, title: a.title, src: a.src }))
    localStorage.setItem(CUSTOM_ADS_KEY, JSON.stringify(custom))
    return true
  } catch { return false }
}

function persistOverrides(list) {
  try {
    const overrides = {}
    list.filter(a => a.builtin && a.src && a.src !== AD_SRCS[a.id]).forEach(a => { overrides[a.id] = a.src })
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides))
    return true
  } catch { return false }
}

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
  const [ads,       setAds]       = useState(buildInitialAds)
  const [active,    setActive]    = useState(1)
  const [preview,   setPreview]   = useState(null)
  const [saved,     setSaved]     = useState(false)
  const [gridReady, setGridReady] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [renaming, setRenaming] = useState(null)   // ad being renamed, or null
  const [renameValue, setRenameValue] = useState("")

  const fileInputRef    = useRef(null)
  const uploadTargetRef = useRef(null) // null = add new ad, number = replace that ad's image

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
  const btnBdr    = isDark ? "#334155" : "#d1d5db"
  const btnTxt    = isDark ? "#e2e8f0" : "#374151"
  const btnBg     = isDark ? "#1e293b" : "white"

  const activeIndex = useMemo(() => ads.findIndex(a => a.id === active), [ads, active])
  const activeAd    = useMemo(() => ads.find(a => a.id === active) || ads[0], [ads, active])

  const handleSetActive = useCallback((id) => { setActive(id); setSaved(false) }, [])

  const handleSave = () => {
    // 1. Save the active Ad ID to the browser so the customer side can read it!
    localStorage.setItem(ACTIVE_ID_KEY, active)
    // 1b. Also save the resolved image of the active ad — read this on the customer
    //     side so uploaded/replaced ads display too (works for built-in ads as well).
    try { if (activeAd?.src) localStorage.setItem(ACTIVE_SRC_KEY, activeAd.src) } catch { /* ignore */ }
    // 2. Optional: If you have a backend route for this later, you would do:
    // api.updateSettings({ active_ad_id: active })

    // 3. Run your UI animation
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // Load the saved active ad when the page opens
  useEffect(() => {
    const savedAdId = localStorage.getItem(ACTIVE_ID_KEY)
    if (savedAdId) setActive(Number(savedAdId))
  }, [])

  // ── Upload / replace / delete ───────────────────────────────────────────────
  const triggerUpload = (targetId = null) => {
    uploadTargetRef.current = targetId
    setUploadError("")
    fileInputRef.current?.click()
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) { setUploadError("Please choose an image file (PNG or JPG)."); return }

    let dataUrl
    try { dataUrl = await compressImage(file) }
    catch { setUploadError("Sorry, that image couldn't be processed."); return }

    const targetId = uploadTargetRef.current

    if (targetId == null) {
      // Add a brand-new advertisement
      const newId = Date.now()
      const title = (file.name || "Advertisement").replace(/\.[^/.]+$/, "").slice(0, 40) || "Advertisement"
      const next = [...ads, { id: newId, title, src: dataUrl, builtin: false }]
      setAds(next)
      const ok = persistCustomAds(next)
      setUploadError(ok ? "" : "Added for this session, but local storage is full — it won't persist after reload.")
      setActive(newId)
      setSaved(false)
    } else {
      // Replace an existing ad's image
      const next = ads.map(a => a.id === targetId ? { ...a, src: dataUrl } : a)
      setAds(next)
      const target = next.find(a => a.id === targetId)
      const ok = target?.builtin ? persistOverrides(next) : persistCustomAds(next)
      setUploadError(ok ? "" : "Updated for this session, but local storage is full — it won't persist after reload.")
      setSaved(false)
    }
  }

  const handleDelete = (id) => {
    const next = ads.filter(a => a.id !== id)
    setAds(next)
    persistCustomAds(next)
    if (active === id) { setActive(next[0]?.id ?? 1); setSaved(false) }
    if (preview?.id === id) setPreview(null)
  }

  const startRename = (ad) => { setRenaming(ad); setRenameValue(ad.title) }

  const confirmRename = () => {
    const title = renameValue.trim()
    if (!renaming || !title) return
    const next = ads.map(a => a.id === renaming.id ? { ...a, title } : a)
    setAds(next)
    persistCustomAds(next)
    if (preview?.id === renaming.id) setPreview(p => ({ ...p, title }))
    setRenaming(null)
  }

  return (
    <div className="space-y-5">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>

      {/* Hidden file input drives every upload / replace action */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

      {/* ── Page header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: bodyTxt }}>Pop-up Advertisements</h1>
          <p className="text-sm mt-0.5" style={{ color: subTxt }}>
            Manage which advertisement is displayed as a pop-up on the customer site.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => triggerUpload(null)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all hover:opacity-90 active:scale-95"
            style={{ border: `1.5px solid ${btnBdr}`, color: btnTxt, background: btnBg }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 7.5L12 3m0 0L7.5 7.5M12 3v13.5"/>
            </svg>
            Upload New Ad
          </button>
          <button onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
            {saved
              ? <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Saved!</>
              : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>Save Changes</>
            }
          </button>
        </div>
      </div>

      {/* ── Upload notice ── */}
      {uploadError && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium"
          style={{ background: isDark ? "rgba(245,158,11,0.12)" : "#fffbeb", border: `1px solid ${isDark ? "rgba(245,158,11,0.3)" : "#fde68a"}`, color: isDark ? "#fde68a" : "#92400e" }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {uploadError}
        </div>
      )}

      {/* ── Active ad panel ── */}
      <div className="rounded-xl overflow-hidden"
        style={{ border: `1px solid ${cardBdr}`, boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.06)" }}>

        <div className="flex items-center justify-between px-5 py-2.5"
          style={{ background: `linear-gradient(90deg, ${DG}, #1a6b4a)` }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
            <p className="text-xs font-bold tracking-widest uppercase text-white/80">Currently Active Ad</p>
          </div>
          <p className="text-xs font-semibold text-white/60">Ad {Math.max(0, activeIndex) + 1} of {ads.length}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px]"
          style={{ backgroundColor: cardBg }}>

          {/* ── Active ad image — plain img so height is truly auto, no cropping ── */}
          <div className="flex items-center justify-center p-6"
            style={{ backgroundColor: imgBg, borderRight: `1px solid ${divider}` }}>
            <img
              src={activeAd.src}
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
                <p className="text-xs mt-1" style={{ color: mutedTxt }}>
                  {activeAd.builtin ? `advertisement${activeAd.id}.png` : "Uploaded image"}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md w-fit"
                  style={{ backgroundColor: isDark ? "rgba(34,197,94,0.12)" : "#f0fdf4", color: G, border: "1px solid #bbf7d0" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                  Live on customer site
                </span>
                <div className="flex flex-wrap gap-2">
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
                  <button onClick={() => triggerUpload(activeAd.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border transition-all w-fit"
                    style={{ borderColor: isDark ? "#334155" : "#e2e8f0", color: isDark ? "#94a3b8" : "#6b7280", backgroundColor: isDark ? "#1e293b" : "white" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#2d3f55" : "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "white"}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 7.5L12 3m0 0L7.5 7.5M12 3v13.5"/>
                    </svg>
                    Replace image
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: mutedTxt }}>All Slots</p>
                <div className="flex flex-wrap gap-1.5">
                  {ads.map((ad, idx) => (
                    <button key={ad.id} onClick={() => handleSetActive(ad.id)} title={ad.title}
                      className="w-7 h-7 rounded-md text-xs font-bold transition-all hover:scale-110"
                      style={{
                        backgroundColor: ad.id === active ? G : slotBg,
                        color: ad.id === active ? "white" : slotTxt,
                        border: `1px solid ${ad.id === active ? G : slotBdr}`,
                      }}>
                      {idx + 1}
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
            <span className="ml-2 text-xs font-normal" style={{ color: mutedTxt }}>{ads.length} total</span>
          </p>
          <p className="text-xs hidden sm:block" style={{ color: mutedTxt }}>Click a card to select · Eye to preview · Upload icon to replace</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-5">
          {!gridReady
            ? ads.map(ad => (
                <div key={ad.id} className="rounded-xl overflow-hidden" style={{ border: `2px solid ${cardBdr}` }}>
                  <div className="animate-pulse" style={{ aspectRatio: "4/3", background: isDark ? "#162032" : "#f1f5f9" }} />
                  <div className="px-3 py-2.5" style={{ backgroundColor: cardBg }}>
                    <div className="h-3 rounded animate-pulse mb-1" style={{ background: isDark ? "#1e293b" : "#e2e8f0", width: "70%" }} />
                    <div className="h-2.5 rounded animate-pulse" style={{ background: isDark ? "#1e293b" : "#e2e8f0", width: "30%" }} />
                  </div>
                </div>
              ))
            : (
              <>
                {ads.map((ad, idx) => {
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
                          src={ad.src}
                          alt={ad.title}
                          fit="cover"
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                        />

                        {!ad.builtin && (
                          <div className="absolute top-2 left-2 z-10 text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                            style={{ background: "rgba(0,0,0,0.6)" }}>
                            Uploaded
                          </div>
                        )}

                        {isActive && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white z-10"
                            style={{ backgroundColor: G, boxShadow: "0 2px 6px rgba(46,139,52,0.4)" }}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                            </svg>
                          </div>
                        )}

                        <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10"
                          style={{ background: "rgba(0,0,0,0.42)" }}>
                          <button onClick={e => { e.stopPropagation(); setPreview(ad) }}
                            className="w-8 h-8 rounded-md bg-white flex items-center justify-center shadow hover:scale-105 transition-transform" title="Preview">
                            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                          </button>
                          {!isActive && (
                            <button onClick={e => { e.stopPropagation(); handleSetActive(ad.id) }}
                              className="w-8 h-8 rounded-md flex items-center justify-center shadow hover:scale-105 transition-transform text-white"
                              style={{ backgroundColor: G }} title="Set active">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                              </svg>
                            </button>
                          )}
                          <button onClick={e => { e.stopPropagation(); triggerUpload(ad.id) }}
                            className="w-8 h-8 rounded-md bg-white flex items-center justify-center shadow hover:scale-105 transition-transform" title="Replace image">
                            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 7.5L12 3m0 0L7.5 7.5M12 3v13.5"/>
                            </svg>
                          </button>
                          {!ad.builtin && (
                            <button onClick={e => { e.stopPropagation(); handleDelete(ad.id) }}
                              className="w-8 h-8 rounded-md flex items-center justify-center shadow hover:scale-105 transition-transform text-white"
                              style={{ backgroundColor: "#ef4444" }} title="Delete advertisement">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
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
                        <div className="flex items-center gap-1 min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: bodyTxt }}>{ad.title}</p>
                          {!ad.builtin && (
                            <button onClick={e => { e.stopPropagation(); startRename(ad) }} title="Rename"
                              className="flex-shrink-0 p-0.5 rounded transition-colors"
                              style={{ color: mutedTxt }}
                              onMouseEnter={e => e.currentTarget.style.color = isDark ? "#4ade80" : G}
                              onMouseLeave={e => e.currentTarget.style.color = mutedTxt}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </button>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs" style={{ color: mutedTxt }}>Ad {idx + 1}</p>
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
                })}

                {/* Add-advertisement tile */}
                <button onClick={() => triggerUpload(null)}
                  className="rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                  style={{ border: `2px dashed ${isDark ? "#334155" : "#cbd5e1"}`, background: isDark ? "#0f172a" : "#fafbfc", color: isDark ? "#94a3b8" : "#6b7280", minHeight: 150 }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: isDark ? "rgba(34,197,94,0.12)" : "#f0fdf4" }}>
                    <svg className="w-5 h-5" fill="none" stroke={isDark ? "#4ade80" : G} strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                    </svg>
                  </div>
                  <p className="text-xs font-semibold m-0">Upload advertisement</p>
                  <p className="text-[10px] m-0" style={{ opacity: 0.8 }}>PNG or JPG</p>
                </button>
              </>
            )
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
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold" style={{ color: bodyTxt }}>{preview.title}</p>
                  {!preview.builtin && (
                    <button onClick={() => startRename(preview)} title="Rename"
                      className="p-1 rounded transition-colors" style={{ color: mutedTxt }}
                      onMouseEnter={e => e.currentTarget.style.color = isDark ? "#4ade80" : G}
                      onMouseLeave={e => e.currentTarget.style.color = mutedTxt}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: mutedTxt }}>
                  {preview.builtin ? `advertisement${preview.id}.png` : "Uploaded image"}
                </p>
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
                src={preview.src}
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
              <div className="flex items-center gap-2">
                <button onClick={() => triggerUpload(preview.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg border transition-all active:scale-95"
                  style={{ borderColor: isDark ? "#334155" : "#e2e8f0", color: isDark ? "#94a3b8" : "#6b7280", backgroundColor: isDark ? "#1e293b" : "white" }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 7.5L12 3m0 0L7.5 7.5M12 3v13.5"/>
                  </svg>
                  Replace
                </button>
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
        </div>
      )}

      {/* ── Rename modal ── */}
      {renaming && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}
          onClick={() => setRenaming(null)}>
          <div className="rounded-2xl overflow-hidden w-full"
            style={{ maxWidth: "380px", backgroundColor: isDark ? "#1a2332" : "white", border: `1px solid ${isDark ? "#2d3748" : "#e8edf2"}`, boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}
            onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${divider}` }}>
              <p className="text-sm font-bold" style={{ color: bodyTxt }}>Rename advertisement</p>
            </div>
            <div className="px-5 py-5">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: mutedTxt }}>Name</label>
              <input
                autoFocus
                value={renameValue}
                maxLength={40}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") confirmRename(); if (e.key === "Escape") setRenaming(null) }}
                className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all"
                style={{ border: `1.5px solid ${isDark ? "#334155" : "#e2e8f0"}`, backgroundColor: isDark ? "#0f172a" : "white", color: bodyTxt }}
                onFocus={e => e.target.style.borderColor = isDark ? "#4ade80" : G}
                onBlur={e => e.target.style.borderColor = isDark ? "#334155" : "#e2e8f0"}
              />
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3.5" style={{ borderTop: `1px solid ${divider}`, backgroundColor: headerBg }}>
              <button onClick={() => setRenaming(null)}
                className="px-4 py-2 text-sm font-semibold rounded-lg border transition-all active:scale-95"
                style={{ borderColor: isDark ? "#334155" : "#e2e8f0", color: isDark ? "#94a3b8" : "#6b7280", backgroundColor: isDark ? "#1e293b" : "white" }}>
                Cancel
              </button>
              <button onClick={confirmRename} disabled={!renameValue.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white rounded-lg transition-all active:scale-95"
                style={{ background: `linear-gradient(135deg, ${DG}, ${G})`, opacity: renameValue.trim() ? 1 : 0.5, cursor: renameValue.trim() ? "pointer" : "not-allowed" }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}