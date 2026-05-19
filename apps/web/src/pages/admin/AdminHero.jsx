import { useState, useEffect, useRef } from "react"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api.js"

import heroBg1 from "../../assets/hero/HeroBG1.png"
import heroBg2 from "../../assets/hero/HeroBG2.png"
import heroBg3 from "../../assets/hero/HeroBG3.png"
import heroBg4 from "../../assets/hero/HeroBG4.png"

const DG = "#0C573E"
const G  = "#2E8B34"

const IMAGE_OPTIONS = [
  { label: "HeroBG1.png", value: "HeroBG1.png" },
  { label: "HeroBG2.png", value: "HeroBG2.png" },
  { label: "HeroBG3.png", value: "HeroBG3.png" },
  { label: "HeroBG4.png", value: "HeroBG4.png" },
]

const IMAGE_MAP = {
  "HeroBG1.png": heroBg1,
  "HeroBG2.png": heroBg2,
  "HeroBG3.png": heroBg3,
  "HeroBG4.png": heroBg4,
}

const DEFAULT_SLIDES = [
  { id:1, tag:"Esting's Flower International Inc.", headline:"Fresh Blooms,\nSince 1959", description:"Since 1959, we've been part of countless moments big and small. Every arrangement is made by hand with fresh flowers and genuine care.", cta:"Shop Flowers", ctaSecondary:"View Occasions", accent:"#2E8B34", image:"HeroBG1.png" },
  { id:2, tag:"Made a mistake?", headline:"Let flowers\ndo the talking", description:'Whether it\'s an apology, a misunderstanding, or just a way to say "I care," sending flowers is sometimes the simplest way to fix things without saying too much.', cta:"Shop Flowers", ctaSecondary:"Explore Collection", accent:"#e11d48", image:"HeroBG2.png" },
  { id:3, tag:"Make It Personal", headline:"Flowers,\nMade Your Way", description:'Use our "Make it Personal" feature to describe your ideal bouquet, or build your own arrangement through our Mix and Match option. We\'ll turn your idea into something fresh and beautifully made.', cta:"Try It Now", ctaSecondary:"See Examples", accent:"#7c3aed", image:"HeroBG3.png" },
  { id:4, tag:"Fresh Flowers, For Any Moment", headline:"Simple Ways\nto Show You Care", description:"From everyday surprises to life's biggest moments, we create fresh arrangements that help you express what you feel in a simple and meaningful way.", cta:"Shop Flowers", ctaSecondary:"View Occasions", accent:"#d97706", image:"HeroBG4.png" },
]

// ── Live Hero Preview ─────────────────────────────────────────────────────────
function HeroPreview({ slide, isDark }) {
  const bg = IMAGE_MAP[slide.image] || heroBg1
  const overlay = isDark
    ? "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.54) 55%, rgba(0,0,0,0.22) 100%)"
    : "linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.36) 50%, rgba(0,0,0,0.08) 100%)"

  const lines = (slide.headline || "").split("\n")

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{
        height: "540px",
        boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.5)" : "0 4px 24px rgba(0,0,0,0.15)",
      }}
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage:`url(${bg})`, backgroundSize:"cover", backgroundPosition:"center" }}
      />

      {/* Overlay */}
      <div className="absolute inset-0" style={{ background: overlay }} />

      {/* Live badge */}
      <div
        className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white"
        style={{ backgroundColor:"rgba(0,0,0,0.45)", backdropFilter:"blur(6px)", border:"1px solid rgba(255,255,255,0.2)" }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        Live Preview
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center pl-20 sm:pl-28 pr-10">
        <div className="max-w-lg">
          {/* Tag */}
          <span
            className="inline-block text-sm font-bold tracking-[0.16em] uppercase px-3.5 py-1.5 rounded-full mb-5 text-white"
            style={{ backgroundColor: (slide.accent||"#2E8B34")+"55", border:`1px solid ${(slide.accent||"#2E8B34")}99` }}
          >
            {slide.tag || "Tag / Badge"}
          </span>

          {/* Headline */}
          <h1
            className="font-bold text-white leading-tight mb-5"
            style={{ fontSize:"clamp(36px,4.5vw,56px)", textShadow:"0 2px 20px rgba(0,0,0,0.55)" }}
          >
            {lines.length > 0
              ? lines.map((line, i) => <span key={i} className="block">{line || "\u00A0"}</span>)
              : <span className="block opacity-40">Headline</span>
            }
          </h1>

          {/* Description */}
          <p
            className="leading-relaxed mb-7"
            style={{ fontSize:"clamp(15px,1.6vw,18px)", color:"rgba(255,255,255,0.90)", maxWidth:"420px" }}
          >
            {slide.description || <span className="opacity-40">Description text will appear here.</span>}
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="px-7 py-3 text-base font-bold text-white rounded-full shadow-lg transition-all"
              style={{ backgroundColor: slide.accent||"#2E8B34" }}
            >
              {slide.cta || "Primary CTA"}
            </button>
            <button
              className="px-7 py-3 text-base font-semibold text-white rounded-full border transition-all"
              style={{ borderColor:"rgba(255,255,255,0.4)", backgroundColor:"rgba(255,255,255,0.08)", backdropFilter:"blur(4px)" }}
            >
              {slide.ctaSecondary || "Secondary CTA"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Field + Input + Select ────────────────────────────────────────────────────
function Field({ label, hint, children, isDark }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5" style={{ color:isDark?"#94a3b8":"#374151" }}>
        {label}
      </label>
      {children}
      {hint && <p className="text-xs mt-1" style={{ color:isDark?"#64748b":"#9ca3af" }}>{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type="text", rows, isDark, inputBg, inputBdr, inputTxt }) {
  const shared = "w-full px-3 py-2.5 text-sm border rounded-md outline-none transition-all"
  if (rows) {
    return (
      <textarea value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} rows={rows}
        className={shared} style={{ borderColor:inputBdr, backgroundColor:inputBg, color:inputTxt }}
        onFocus={e => { e.target.style.borderColor=G; e.target.style.boxShadow=`0 0 0 2px rgba(46,139,52,0.12)` }}
        onBlur={e => { e.target.style.borderColor=inputBdr; e.target.style.boxShadow="none" }} />
    )
  }
  return (
    <input type={type} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder}
      className={shared} style={{ borderColor:inputBdr, backgroundColor:inputBg, color:inputTxt }}
      onFocus={e => { e.target.style.borderColor=G; e.target.style.boxShadow=`0 0 0 2px rgba(46,139,52,0.12)` }}
      onBlur={e => { e.target.style.borderColor=inputBdr; e.target.style.boxShadow="none" }} />
  )
}

function Select({ value, onChange, options, isDark, inputBg, inputBdr, inputTxt }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange?.(e.target.value)}
        className="w-full appearance-none px-3 py-2.5 text-sm border rounded-md cursor-pointer outline-none transition-all"
        style={{ borderColor:inputBdr, backgroundColor:inputBg, color:inputTxt }}
        onFocus={e => { e.target.style.borderColor=G; e.target.style.boxShadow=`0 0 0 2px rgba(46,139,52,0.12)` }}
        onBlur={e => { e.target.style.borderColor=inputBdr; e.target.style.boxShadow="none" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color:isDark?"#64748b":"#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  )
}

function SaveBtn({ onClick, saved, label="Save Changes" }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
      style={{ background:saved?"#16a34a":`linear-gradient(135deg, ${DG}, ${G})` }}>
      {saved
        ? <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Saved!</>
        : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>{label}</>
      }
    </button>
  )
}

// ── Flower Icon (proper rose) ─────────────────────────────────────────────────
function FlowerIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
      {/* Petals — 6 rounded petals radiating outward */}
      <ellipse cx="20" cy="10" rx="4.5" ry="8" fill="#f472b6" opacity="0.95"/>
      <ellipse cx="20" cy="10" rx="4.5" ry="8" fill="#f472b6" opacity="0.95"
        transform="rotate(60 20 20)"/>
      <ellipse cx="20" cy="10" rx="4.5" ry="8" fill="#ec4899" opacity="0.90"
        transform="rotate(120 20 20)"/>
      <ellipse cx="20" cy="10" rx="4.5" ry="8" fill="#f472b6" opacity="0.95"
        transform="rotate(180 20 20)"/>
      <ellipse cx="20" cy="10" rx="4.5" ry="8" fill="#ec4899" opacity="0.90"
        transform="rotate(240 20 20)"/>
      <ellipse cx="20" cy="10" rx="4.5" ry="8" fill="#f472b6" opacity="0.95"
        transform="rotate(300 20 20)"/>
      {/* Inner petal layer (smaller, rotated 30°) */}
      <ellipse cx="20" cy="12" rx="3" ry="6" fill="#fda4c8" opacity="0.80"
        transform="rotate(30 20 20)"/>
      <ellipse cx="20" cy="12" rx="3" ry="6" fill="#fda4c8" opacity="0.80"
        transform="rotate(90 20 20)"/>
      <ellipse cx="20" cy="12" rx="3" ry="6" fill="#fda4c8" opacity="0.80"
        transform="rotate(150 20 20)"/>
      <ellipse cx="20" cy="12" rx="3" ry="6" fill="#fda4c8" opacity="0.80"
        transform="rotate(210 20 20)"/>
      <ellipse cx="20" cy="12" rx="3" ry="6" fill="#fda4c8" opacity="0.80"
        transform="rotate(270 20 20)"/>
      <ellipse cx="20" cy="12" rx="3" ry="6" fill="#fda4c8" opacity="0.80"
        transform="rotate(330 20 20)"/>
      {/* Center */}
      <circle cx="20" cy="20" r="5.5" fill="#fbbf24"/>
      <circle cx="20" cy="20" r="3.5" fill="#f59e0b"/>
      {/* Center dots */}
      <circle cx="20" cy="18.5" r="0.8" fill="#92400e" opacity="0.6"/>
      <circle cx="21.3" cy="20.8" r="0.8" fill="#92400e" opacity="0.6"/>
      <circle cx="18.7" cy="20.8" r="0.8" fill="#92400e" opacity="0.6"/>
    </svg>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminHero() {
  const { isDark } = useTheme()
  const [slides,    setSlides]    = useState(DEFAULT_SLIDES)
  const [activeIdx, setActiveIdx] = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState("")

  const [rosesEnabled, setRosesEnabled] = useState(() =>
    localStorage.getItem("bloomora-falling-roses") !== "false"
  )

  const inputBg   = isDark ? "#0f172a" : "white"
  const inputBdr  = isDark ? "#475569" : "#dde3ec"
  const inputTxt  = isDark ? "#f1f5f9" : "#111827"
  const cardBg    = isDark ? "#1e293b" : "white"
  const cardBdr   = isDark ? "#334155" : "#e8edf2"
  const headerBg  = isDark ? "#162032" : "#fafbfc"
  const headerBdr = isDark ? "#2d3f55" : "#f1f5f9"
  const subTxt    = isDark ? "#94a3b8" : "#64748b"
  const bodyTxt   = isDark ? "#f1f5f9" : "#111827"
  const tabBg     = isDark ? "#1e293b" : "#f1f5f9"
  const tabBdr    = isDark ? "#334155" : "#e2e8f0"

  useEffect(() => {
    api.getHeroSlides()
      .then(data => {
        if (data?.slides && Array.isArray(data.slides)) {
          setSlides(data.slides.map((s, i) => ({ ...DEFAULT_SLIDES[i], ...s })))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const updateSlide = (field, value) => {
    setSlides(prev => prev.map((s, i) => i === activeIdx ? { ...s, [field]: value } : s))
  }

  const handleSave = async () => {
    setSaving(true); setError("")
    try {
      await api.updateHeroSlides({ slides })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e.message || "Failed to save hero slides.")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm("Reset all slides to factory defaults?")) setSlides(DEFAULT_SLIDES)
  }

  const toggleRoses = () => {
    const next = !rosesEnabled
    setRosesEnabled(next)
    localStorage.setItem("bloomora-falling-roses", next ? "true" : "false")
    window.dispatchEvent(new CustomEvent("bloomora:roses-toggle", { detail: { enabled: next } }))
  }

  const activeSlide = slides[activeIdx]

  if (loading) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold" style={{ color: bodyTxt }}>Hero Section</h1>
        <div className="rounded-xl p-10 text-center" style={{ backgroundColor:cardBg, border:`1px solid ${cardBdr}` }}>
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor:isDark?"#334155":"#e5e7eb", borderTopColor:isDark?"#4ade80":"#16a34a" }} />
          <p className="text-sm" style={{ color:subTxt }}>Loading hero slides...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color:bodyTxt }}>Hero Section</h1>
          <p className="text-sm mt-0.5" style={{ color:subTxt }}>Edit and preview hero slides in real time</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset}
            className="px-3.5 py-2 text-sm font-semibold border rounded-md transition-all"
            style={{ borderColor:isDark?"#374151":"#dde3ec", color:isDark?"#94a3b8":"#6b7280", backgroundColor:isDark?"#1e293b":"white" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor=isDark?"#2d3f55":"#f9fafb"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor=isDark?"#1e293b":"white"}>
            Reset to Defaults
          </button>
          <SaveBtn onClick={handleSave} saved={saved} label={saving?"Saving...":"Save Changes"} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
          style={{ backgroundColor:isDark?"rgba(239,68,68,0.1)":"#fef2f2", border:`1px solid ${isDark?"rgba(239,68,68,0.3)":"#fecaca"}`, color:isDark?"#f87171":"#dc2626" }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {error}
        </div>
      )}

      {/* Slide tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {slides.map((slide, idx) => {
          const isActive = idx === activeIdx
          return (
            <button key={slide.id} onClick={() => setActiveIdx(idx)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: isActive ? (isDark?"rgba(74,222,128,0.12)":"#f0fdf4") : tabBg,
                color: isActive ? (isDark?"#4ade80":DG) : subTxt,
                border: isActive ? `1.5px solid ${isDark?"rgba(74,222,128,0.4)":"#bbf7d0"}` : `1px solid ${tabBdr}`,
              }}>
              <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background:`linear-gradient(135deg,${DG},${G})` }}>
                {idx+1}
              </span>
              <span className="hidden sm:block truncate" style={{ maxWidth:"120px" }}>
                {slide.tag || `Slide ${idx+1}`}
              </span>
            </button>
          )
        })}
      </div>

      {/* Live preview */}
      <div className="rounded-xl overflow-hidden"
        style={{ border:`1px solid ${cardBdr}`, boxShadow:isDark?"none":"0 2px 12px rgba(0,0,0,0.08)" }}>
        <div className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom:`1px solid ${headerBdr}`, backgroundColor:headerBg }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-sm font-semibold" style={{ color:bodyTxt }}>
              Live Preview: Slide {activeIdx+1}
            </p>
          </div>
          <p className="text-xs" style={{ color:subTxt }}>Updates as you type</p>
        </div>
        <HeroPreview slide={activeSlide} isDark={isDark} />
      </div>

      {/* Falling Roses toggle */}
      <div className="rounded-xl overflow-hidden"
        style={{ backgroundColor:cardBg, border:`1px solid ${cardBdr}`, boxShadow:isDark?"none":"0 1px 3px rgba(0,0,0,0.04)" }}>

        <div className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom:`1px solid ${headerBdr}`, backgroundColor:headerBg }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background:isDark?"rgba(244,114,182,0.1)":"linear-gradient(135deg,#fdf2f8,#fce7f3)", border:`1px solid ${isDark?"rgba(244,114,182,0.2)":"#fbcfe8"}` }}>
            <FlowerIcon />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color:bodyTxt }}>Falling Roses Effect</p>
            <p className="text-xs mt-0.5" style={{ color:subTxt }}>Controls the animated falling roses on the customer home page</p>
          </div>
        </div>

        <div className="px-5 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium" style={{ color:bodyTxt }}>Show falling roses on homepage</p>
            <p className="text-xs mt-1" style={{ color:subTxt }}>
              When off, the decorative rose animation will be hidden for all customers.
              {!rosesEnabled && (
                <span className="ml-1 font-semibold" style={{ color:"#f87171" }}>Currently hidden.</span>
              )}
              {rosesEnabled && (
                <span className="ml-1 font-semibold" style={{ color:isDark?"#4ade80":"#16a34a" }}>Currently visible.</span>
              )}
            </p>
          </div>
          <button
            onClick={toggleRoses}
            className="relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200"
            style={{ backgroundColor: rosesEnabled ? (isDark?"#f472b6":"#db2777") : (isDark?"#334155":"#d1d5db") }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
              style={{ left: rosesEnabled ? "26px" : "2px" }}
            />
          </button>
        </div>
      </div>

      {/* Edit form for active slide */}
      <div className="rounded-xl overflow-hidden"
        style={{ backgroundColor:cardBg, border:`1px solid ${cardBdr}`, boxShadow:isDark?"none":"0 1px 3px rgba(0,0,0,0.04)" }}>

        <div className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom:`1px solid ${headerBdr}`, backgroundColor:headerBg }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background:`linear-gradient(135deg,${DG},${G})` }}>
            {activeIdx+1}
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color:bodyTxt }}>Editing Slide {activeIdx+1}</p>
            <p className="text-xs mt-0.5" style={{ color:subTxt }}>Changes reflect instantly in the preview above</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <Field label="Tag / Badge" isDark={isDark}>
            <Input value={activeSlide.tag} onChange={v => updateSlide("tag", v)} placeholder="e.g. Fresh Flowers"
              isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt} />
          </Field>

          <Field label="Headline" hint='Use \n for a line break (e.g. "Fresh Blooms,\nSince 1959")' isDark={isDark}>
            <Input value={activeSlide.headline} onChange={v => updateSlide("headline", v)} placeholder="e.g. Fresh Blooms"
              isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt} />
          </Field>

          <Field label="Description" isDark={isDark}>
            <Input value={activeSlide.description} onChange={v => updateSlide("description", v)} rows={3} placeholder="Short description..."
              isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Primary CTA" isDark={isDark}>
              <Input value={activeSlide.cta} onChange={v => updateSlide("cta", v)} placeholder="e.g. Shop Flowers"
                isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt} />
            </Field>
            <Field label="Secondary CTA" isDark={isDark}>
              <Input value={activeSlide.ctaSecondary} onChange={v => updateSlide("ctaSecondary", v)} placeholder="e.g. View Occasions"
                isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Accent Color" hint="Controls the tag background and primary button color" isDark={isDark}>
              <div className="flex items-center gap-2">
                <input type="color" value={activeSlide.accent}
                  onChange={e => updateSlide("accent", e.target.value)}
                  className="w-10 h-10 p-0 border-0 rounded cursor-pointer flex-shrink-0" />
                <Input value={activeSlide.accent} onChange={v => updateSlide("accent", v)} placeholder="#2E8B34"
                  isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt} />
              </div>
            </Field>
            <Field label="Background Image" isDark={isDark}>
              <Select value={activeSlide.image} onChange={v => updateSlide("image", v)} options={IMAGE_OPTIONS}
                isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt} />
            </Field>
          </div>

          <div className="flex items-center justify-between pt-2" style={{ borderTop:`1px solid ${headerBdr}` }}>
            <button
              onClick={() => setActiveIdx(i => Math.max(0, i-1))}
              disabled={activeIdx===0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor:isDark?"#334155":"#dde3ec", color:subTxt, backgroundColor:isDark?"#1e293b":"white" }}>
              Previous Slide
            </button>
            <span className="text-xs" style={{ color:subTxt }}>Slide {activeIdx+1} of {slides.length}</span>
            <button
              onClick={() => setActiveIdx(i => Math.min(slides.length-1, i+1))}
              disabled={activeIdx===slides.length-1}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor:isDark?"#334155":"#dde3ec", color:subTxt, backgroundColor:isDark?"#1e293b":"white" }}>
              Next Slide
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}