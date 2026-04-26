import { useState, useEffect } from "react"
import { api } from "../../services/api.js"

const DG = "#0C573E"
const G  = "#2E8B34"

const IMAGE_OPTIONS = [
  { label: "HeroBG1.png", value: "HeroBG1.png" },
  { label: "HeroBG2.png", value: "HeroBG2.png" },
  { label: "HeroBG3.png", value: "HeroBG3.png" },
  { label: "HeroBG4.png", value: "HeroBG4.png" },
]

const DEFAULT_SLIDES = [
  {
    id: 1,
    tag: "Esting's Flower International Inc.",
    headline: "Fresh Blooms,\nSince 1959",
    description: "Since 1959, we've been part of countless moments big and small. Every arrangement is made by hand with fresh flowers and genuine care.",
    cta: "Shop Flowers",
    ctaSecondary: "View Occasions",
    accent: "#2E8B34",
    image: "HeroBG1.png",
  },
  {
    id: 2,
    tag: "Made a mistake?",
    headline: "Let flowers\ndo the talking",
    description: "Whether it's an apology, a misunderstanding, or just a way to say \"I care,\" sending flowers is sometimes the simplest way to fix things without saying too much.",
    cta: "Shop Flowers",
    ctaSecondary: "Explore Collection",
    accent: "#e11d48",
    image: "HeroBG2.png",
  },
  {
    id: 3,
    tag: "Make It Personal",
    headline: "Flowers,\nMade Your Way",
    description: "Use our \"Make it Personal\" feature to describe your ideal bouquet, or build your own arrangement through our Mix and Match option. We'll turn your idea into something fresh and beautifully made.",
    cta: "Try It Now",
    ctaSecondary: "See Examples",
    accent: "#7c3aed",
    image: "HeroBG3.png",
  },
  {
    id: 4,
    tag: "Fresh Flowers, For Any Moment",
    headline: "Simple Ways\nto Show You Care",
    description: "From everyday surprises to life's biggest moments, we create fresh arrangements that help you express what you feel in a simple and meaningful way.",
    cta: "Shop Flowers",
    ctaSecondary: "View Occasions",
    accent: "#d97706",
    image: "HeroBG4.png",
  },
]

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = "text", rows }) {
  const shared = "w-full px-3 py-2.5 text-sm border rounded-md bg-white outline-none transition-all"
  const style = { borderColor: "#dde3ec" }
  const handlers = {
    onFocus: (e) => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.10)` },
    onBlur: (e) => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" },
  }
  if (rows) {
    return (
      <textarea value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} rows={rows}
        className={shared} style={style} {...handlers} />
    )
  }
  return (
    <input type={type} value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder}
      className={shared} style={style} {...handlers} />
  )
}

function Select({ value, onChange, options }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange?.(e.target.value)}
        className="w-full appearance-none px-3 py-2.5 text-sm border rounded-md bg-white cursor-pointer outline-none transition-all"
        style={{ borderColor: "#dde3ec" }}
        onFocus={(e) => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.10)` }}
        onBlur={(e) => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  )
}

function SaveBtn({ onClick, saved, label = "Save Changes" }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
      style={{ background: saved ? "#16a34a" : `linear-gradient(135deg, ${DG}, ${G})` }}>
      {saved ? (
        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Saved!</>
      ) : (
        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>{label}</>
      )}
    </button>
  )
}

export default function AdminHero() {
  const [slides, setSlides] = useState(DEFAULT_SLIDES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    api.getHeroSlides()
      .then((data) => {
        if (data?.slides && Array.isArray(data.slides)) {
          setSlides(data.slides.map((s, i) => ({ ...DEFAULT_SLIDES[i], ...s })))
        }
      })
      .catch(() => {
        // keep defaults
      })
      .finally(() => setLoading(false))
  }, [])

  const updateSlide = (index, field, value) => {
    setSlides((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")
    try {
      await api.updateHeroSlides({ slides })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e.message || "Failed to save hero slides.")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm("Reset all slides to factory defaults?")) {
      setSlides(DEFAULT_SLIDES)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-gray-900">Hero Section</h1>
        <div className="bg-white rounded-xl p-10 text-center" style={{ border: "1px solid #e8edf2" }}>
          <div className="w-8 h-8 border-2 border-gray-200 border-t-green-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading hero slides...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Hero Section</h1>
        <div className="flex items-center gap-2">
          <button onClick={handleReset}
            className="px-3.5 py-2 text-sm font-semibold border rounded-md hover:bg-gray-50 transition-all text-gray-600"
            style={{ borderColor: "#dde3ec" }}>
            Reset to Defaults
          </button>
          <SaveBtn onClick={handleSave} saved={saved} label={saving ? "Saving..." : "Save Changes"} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {slides.map((slide, idx) => (
          <div key={slide.id} className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #e8edf2", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
                {idx + 1}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Slide {idx + 1}</p>
                <p className="text-xs text-gray-400">{slide.tag}</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <Field label="Tag / Badge">
                <Input value={slide.tag} onChange={(v) => updateSlide(idx, "tag", v)} placeholder="e.g. Fresh Flowers" />
              </Field>
              <Field label="Headline" hint="Use \\n for a line break">
                <Input value={slide.headline} onChange={(v) => updateSlide(idx, "headline", v)} placeholder="e.g. Fresh Blooms" />
              </Field>
              <Field label="Description">
                <Input value={slide.description} onChange={(v) => updateSlide(idx, "description", v)} rows={3} placeholder="Short description..." />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Primary CTA">
                  <Input value={slide.cta} onChange={(v) => updateSlide(idx, "cta", v)} placeholder="e.g. Shop Flowers" />
                </Field>
                <Field label="Secondary CTA">
                  <Input value={slide.ctaSecondary} onChange={(v) => updateSlide(idx, "ctaSecondary", v)} placeholder="e.g. View Occasions" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Accent Color" hint="Hex color code">
                  <div className="flex items-center gap-2">
                    <input type="color" value={slide.accent}
                      onChange={(e) => updateSlide(idx, "accent", e.target.value)}
                      className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                    />
                    <Input value={slide.accent} onChange={(v) => updateSlide(idx, "accent", v)} placeholder="#2E8B34" />
                  </div>
                </Field>
                <Field label="Background Image">
                  <Select value={slide.image} onChange={(v) => updateSlide(idx, "image", v)} options={IMAGE_OPTIONS} />
                </Field>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

