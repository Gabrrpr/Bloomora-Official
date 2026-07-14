import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { api } from "../../services/api.js"
import { addToCart } from "../../utils/cart.js"
import { generateCardMessage, RELATIONSHIP_OPTIONS, OCCASION_OPTIONS, TONE_OPTIONS } from "../../utils/cardMessage.js"
import { useTheme } from "../../context/ThemeContext"
import FallbackImage from "../../components/FallbackImage.jsx" // 🚀 ADDED THIS IMPORT
import arrangementBouquet from "../../assets/MakeItPersonal/arrangement_bouquet.webp"
import arrangementBox from "../../assets/MakeItPersonal/arrangement_box.webp"
import arrangementVase from "../../assets/MakeItPersonal/arrangement_vase.webp"
import acrylicContainer from "../../assets/MakeItPersonal/AcrylicContainer.webp"

const G  = "#2E8B34"
const DG = "#0C573E"
const GENERATION_PROBLEM_MESSAGE = "There is a problem generating this arrangement. Please try again."

function formatGenerationError(message, fallback = GENERATION_PROBLEM_MESSAGE) {
  const trimmedMessage = typeof message === "string" ? message.trim() : ""

  if (!trimmedMessage || /internal\s+server\s+error/i.test(trimmedMessage)) {
    return fallback
  }

  return trimmedMessage
}

const PLACEHOLDER_IMAGE = new URL("../../assets/default-img/ImageNotFound.webp", import.meta.url).href

// 1. STEPS: 4-phase flow — Arrangement → Flowers → Wrapper → Accessory
const STEPS = [
  { label: "Arrangement", icon: "box" },          // bouquet / box / vase presentation
  { label: "Flowers & Fillers", icon: "flower" },  // flowers (with stem counter) + fillers
  { label: "Container", icon: "wrap" },            // wrapper / vase / box
  { label: "Accessories", icon: "extra" },         // finishing ribbon
]

// Short per-step helper copy shown under the step heading.
const STEP_HINTS = [
  "Pick how you'd like your flowers presented.",
  "Choose your flowers and how many stems, then add any fillers.",
  "Select the wrapping for your arrangement.",
  "Add a finishing ribbon or accessory.",
]

// Phase 1 presentation types. These are styles (not stock items), so they feed
// the AI prompt rather than a product id.
// `image` is null for now (drop a URL/import in later); the icon is the placeholder.
// `maxStems` caps how many stems fit that presentation — enforced in phase 2.
const ARRANGEMENTS = [
  {
    key: "bouquet",
    label: "Bouquet",
    desc: "Hand-tied & wrapped",
    promptText: "arranged as a beautiful hand-tied bouquet, photographed from a direct side profile view at eye level, clearly showing the full length of the wrapping from the side",
    image: arrangementBouquet,
    maxStems: 24,
    path: "M12 3c2.5 2 2.5 5 0 7-2.5-2-2.5-5 0-7Zm6 3c.8 2.8-.8 5.3-3.6 6.1.8-2.8 2.4-5.3 3.6-6.1ZM6 6c1.2.8 2.8 3.3 3.6 6.1C6.8 11.3 5.2 8.8 6 6Zm6 7 4 8H8l4-8Z",
  },
  {
    key: "box",
    label: "Box",
    desc: "Arranged in a gift box",
    promptText: "arranged like a premium lidded acrylic flower gift box, similar to a transparent square cube box product photo. Use a low three-quarter top view looking across the clear lid and slightly down into the box. The selected flowers must be inside the closed clear acrylic box, visible through the transparent lid and side walls, with blooms packed below the lid/rim and short hidden stems inside the box. Add a clean satin ribbon crossing over the lid and down the front of the box. Do not make a bouquet rising out of the box, do not use wrapping paper, and do not place flowers outside, above, or around the exterior of the box",
    image: arrangementBox,
    maxStems: 9,
    path: "M3 8h18v3H3V8Zm1 3h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Zm8-7 3 4H9l3-4Z",
  },
  {
    key: "vase",
    label: "Vase",
    desc: "Arranged in a vase",
    promptText: "arranged in an elegant vase, photographed from a direct side profile view at eye level, ensuring the full height and side of the vase is completely visible",
    image: arrangementVase,
    maxStems: 12,
    path: "M8 3h8l-1 4c2 1.5 3 4 3 7 0 4-3 7-6 7s-6-3-6-7c0-3 1-5.5 3-7L8 3Z",
  },
]

// The only container offered for the Box arrangement — a clear acrylic box.
// It's a presentation choice (not a stocked product), so it isn't sent as a
// wrapping_id; it just drives the AI prompt and the step's completion state.
const ACRYLIC_BOX = {
  id: "acrylic-box",
  name: "Clear Acrylic Box",
  image_url: acrylicContainer,
  price: 0,
  stock: 999,
  stock_status: "in_stock",
}

// Fun facts cycled through while the AI generates the arrangement.
const FLOWER_FACTS = [
  "Roses can live for over a week with fresh water and a clean stem cut.",
  "Sunflowers turn to follow the sun across the sky, a habit called heliotropism.",
  "Tulips were once so prized in the 1600s that their bulbs were worth more than gold.",
  "Carnations are among the longest-lasting cut flowers, often blooming for two to three weeks.",
  "The fragrance of a flower is strongest just after it fully opens.",
  "Lavender has been used for centuries to bring a sense of calm and relaxation.",
  "Adding a little sugar to the vase water can help cut flowers stay fresh longer.",
  "Baby's breath symbolizes everlasting love, which is why it pairs so well with roses.",
]

// ── Stock badge (dark-mode aware) ──
function StockBadge({ status, isDark }) {
  const styles = {
    in_stock:  { bg: isDark ? "rgba(74,222,128,0.14)" : "#f0fdf4", fg: isDark ? "#4ade80" : "#16a34a", label: "In Stock" },
    low_stock: { bg: isDark ? "rgba(245,158,11,0.14)" : "#fffbeb", fg: isDark ? "#fcd34d" : "#d97706", label: "Low Stock" },
    out:       { bg: isDark ? "rgba(239,68,68,0.14)"  : "#fef2f2", fg: isDark ? "#fca5a5" : "#ef4444", label: "Out of Stock" },
  }
  const s = status === "in_stock" ? styles.in_stock : status === "low_stock" ? styles.low_stock : styles.out
  return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: s.bg, color: s.fg }}>{s.label}</span>
}

// ── Product tile (dark-mode aware) ──
function ProductCard({ product, selected, onClick, disabled, tokens }) {
  const { accentG, tileBdr, tileBg, tileSelBg, tilePlaceBg, subHeadC, mutedC, isDark } = tokens

  return (
    <button
      onClick={() => !disabled && onClick()}
      disabled={disabled}
      className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 relative group text-left"
      style={{
        borderColor: selected ? accentG : disabled ? tileBdr : tileBdr,
        backgroundColor: selected ? tileSelBg : disabled ? (isDark ? "#0f172a" : "#fafafa") : tileBg,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <div className="w-full aspect-square rounded-lg overflow-hidden relative" style={{ backgroundColor: tilePlaceBg }}>
        {/* 🚀 CHANGED: Using FallbackImage to handle missing images safely */}
        <FallbackImage
          src={product.image_url || PLACEHOLDER_IMAGE}
          alt={product.name}
          fallbackSrc={PLACEHOLDER_IMAGE}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
        {selected && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: accentG }}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke={isDark ? "#08120c" : "#ffffff"}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      <div className="w-full">
        <p className="text-xs font-semibold leading-tight truncate" style={{ color: subHeadC }}>{product.name}</p>
        <p className="text-[10px] mt-0.5" style={{ color: mutedC }}>₱{(+product.price).toLocaleString()}</p>
        <div className="mt-1.5"><StockBadge status={product.stock_status} isDark={isDark} /></div>
      </div>
    </button>
  )
}

// ── Flower tile with a +/- stem stepper (dark-mode aware) ──
function FlowerCard({ product, qty, onInc, onDec, disabled, incDisabled, tokens }) {
  const { accentG, tileBdr, tileBg, tileSelBg, tilePlaceBg, subHeadC, mutedC, isDark } = tokens
  const selected = qty > 0

  return (
    <div
      className="flex flex-col gap-2 p-3 rounded-xl border-2 transition-all duration-200 relative text-left"
      style={{
        borderColor: selected ? accentG : tileBdr,
        backgroundColor: selected ? tileSelBg : disabled ? (isDark ? "#0f172a" : "#fafafa") : tileBg,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div className="w-full aspect-square rounded-lg overflow-hidden relative" style={{ backgroundColor: tilePlaceBg }}>
        {/* 🚀 CHANGED: Using FallbackImage here as well */}
        <FallbackImage
          src={product.image_url || PLACEHOLDER_IMAGE}
          alt={product.name}
          fallbackSrc={PLACEHOLDER_IMAGE}
          className="w-full h-full object-cover"
        />
        {selected && (
          <div className="absolute top-2 right-2 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ backgroundColor: accentG, color: isDark ? "#08120c" : "#ffffff" }}>
            {qty}
          </div>
        )}
      </div>
      <div className="w-full">
        <p className="text-xs font-semibold leading-tight truncate" style={{ color: subHeadC }}>{product.name}</p>
        <p className="text-[10px] mt-0.5" style={{ color: mutedC }}>₱{(+product.price).toLocaleString()}</p>
        <div className="mt-1.5"><StockBadge status={product.stock_status} isDark={isDark} /></div>
      </div>

      {/* Stem stepper */}
      <div className="flex items-center justify-between mt-1 rounded-lg border" style={{ borderColor: tileBdr }}>
        <button
          type="button"
          onClick={onDec}
          disabled={qty <= 0}
          className="w-8 h-8 flex items-center justify-center text-lg font-bold rounded-l-lg transition disabled:opacity-30"
          style={{ color: accentG }}
          aria-label={`Remove a stem of ${product.name}`}
        >
          −
        </button>
        <span className="text-sm font-semibold tabular-nums" style={{ color: subHeadC }}>{qty}</span>
        <button
          type="button"
          onClick={onInc}
          disabled={disabled || incDisabled}
          className="w-8 h-8 flex items-center justify-center text-lg font-bold rounded-r-lg transition disabled:opacity-30"
          style={{ color: accentG }}
          aria-label={`Add a stem of ${product.name}`}
        >
          +
        </button>
      </div>
    </div>
  )
}

// ── Step indicator (dark-mode aware) ──
function StepDots({ current, tokens }) {
  const { accentG, subHeadC, mutedC, faintC, tileBdr, tileBg, isDark } = tokens
  return (
    <div className="flex items-center mb-2">
      {STEPS.map((s, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all"
              style={{ borderColor: i <= current ? accentG : tileBdr, backgroundColor: i < current ? accentG : tileBg }}
            >
              {i < current ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={isDark ? "#08120c" : "#ffffff"}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-xs font-bold" style={{ color: i === current ? accentG : faintC }}>{i + 1}</span>
              )}
            </div>
            <span
              className="text-xs mt-1 text-center max-w-[70px] leading-tight"
              style={{ color: i === current ? accentG : i < current ? subHeadC : mutedC }}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="flex-1 h-0.5 mx-2 mb-4" style={{ backgroundColor: i < current ? accentG : tileBdr }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function MixAndMatch({ onNavigate }) {
  const { isDark } = useTheme()

  const [step, setStep] = useState(0)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Phase 1: presentation style (bouquet / box / vase)
  const [arrangementType, setArrangementType] = useState(null)

  // Phase 2: flowers keyed by product id → stem count; fillers are a set of ids (no qty)
  const [flowerQty, setFlowerQty] = useState({})   // { [productId]: number }
  const [fillerIds, setFillerIds] = useState([])   // [productId, ...]

  // Phases 3 & 4: single-select wrapper + accessory
  const [selections, setSelections] = useState({ wrapping: null, ribbon: null })
  const [completed, setCompleted] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")
  const [unavailableItems, setUnavailableItems] = useState([])
  const [aiUsage, setAiUsage] = useState(null)
  const [customName, setCustomName] = useState("")
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Greeting card (optional) — write it yourself or let the AI writer draft one
  const [cardTo, setCardTo] = useState("")
  const [cardFrom, setCardFrom] = useState("")
  const [cardMessage, setCardMessage] = useState("")
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [aiCardState, setAiCardState] = useState({ relationship: "", occasion: "", tone: "warm", extra: "" })
  const [generatingCard, setGeneratingCard] = useState(false)
  const [generatedCardMsg, setGeneratedCardMsg] = useState("")
  const [cardError, setCardError] = useState("")

  const handleGenerateCard = async () => {
    if (!aiCardState.relationship || !aiCardState.occasion) {
      setCardError("Please select a relationship and occasion.")
      return
    }
    setCardError("")
    setGeneratingCard(true)
    setGeneratedCardMsg("")
    try {
      const text = await generateCardMessage(aiCardState)
      setGeneratedCardMsg(text)
    } catch {
      setCardError("Could not generate message. Please try again.")
    }
    setGeneratingCard(false)
  }

  const acceptGeneratedMessage = () => {
    setCardMessage(generatedCardMsg)
    setShowAIPanel(false)
  }

  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [lightboxOpen])

  const [customizationEnabled, setCustomizationEnabled] = useState(true)

  // ── Loading overlay progress + fun-fact cycling (UI only) ──
  const [progress, setProgress] = useState(0)
  const [factIdx, setFactIdx] = useState(0)

  // ── Dark-mode color tokens (rendering only, never logic) ──
  const pageBg     = isDark
    ? "radial-gradient(1100px 600px at 50% -8%, #0f2018 0%, #0d1a14 45%, #0f172a 100%)"
    : "radial-gradient(1100px 600px at 50% -8%, #eaf6ec 0%, #f4f9f1 45%, #fbf7ef 100%)"
  const accentG    = isDark ? "#4ade80" : G
  const accentDG   = isDark ? "#4ade80" : DG
  const accentPink = isDark ? "#f9a8d4" : "#db2777"

  const cardBg     = isDark ? "rgba(30,41,59,0.92)" : "rgba(255,255,255,0.9)"
  const cardBdr    = isDark ? "#334155" : "#dcfce7"
  const cardShadow = isDark ? "0 12px 40px rgba(0,0,0,0.45)" : "0 12px 40px rgba(12,87,62,0.08)"

  const headingC   = isDark ? "#f1f5f9" : "#1f2937"
  const subHeadC   = isDark ? "#cbd5e1" : "#374151"
  const bodyC      = isDark ? "#94a3b8" : "#6b7280"
  const mutedC     = isDark ? "#64748b" : "#9ca3af"
  const faintC     = isDark ? "#475569" : "#d1d5db"

  const inputBg    = isDark ? "#0f172a" : "#ffffff"
  const inputBdr   = isDark ? "#475569" : "#e5e7eb"
  const inputText  = isDark ? "#f1f5f9" : "#1f2937"

  const tileBg       = isDark ? "#1e293b" : "white"
  const tileSelBg    = isDark ? "rgba(74,222,128,0.12)" : "#F0F7F1"
  const tileBdr      = isDark ? "#334155" : "#e5e7eb"
  const tilePlaceBg  = isDark ? "#0f172a" : "#f3f4f6"
  const dividerC     = isDark ? "#334155" : "#f3f4f6"
  const iconCircleBg = isDark ? "rgba(74,222,128,0.12)" : "rgba(46,139,52,0.1)"

  const tableRowBdr  = isDark ? "#334155" : "#f3f4f6"
  const totalRowBg   = isDark ? "rgba(74,222,128,0.08)" : "#f4f9f1"
  const subtleBoxBg  = isDark ? "#1e293b" : "#f9fafb"
  const toggleTrackBg = isDark ? "#0f172a" : "#f3f4f6"
  const toggleActiveBg = isDark ? "#1e293b" : "#ffffff"

  // Bundle tokens for the child components.
  const tokens = {
    accentG, subHeadC, mutedC, faintC, tileBdr, tileBg, tileSelBg, tilePlaceBg, isDark,
  }

  useEffect(() => {
    async function load() {
      try {
        const [toggleRes, prodRes, usageRes] = await Promise.all([
          api.isCustomizationEnabled().catch(() => ({ enabled: true })),
          api.getCustomizationProducts(),
          api.getAiUsage().catch(() => ({ remaining: 5, limit: 5 })),
        ])

        setCustomizationEnabled(toggleRes.enabled)
        
        // 🚀 FIX: Safely extract products so we don't accidentally wipe the array
        const allProds = Array.isArray(prodRes) ? prodRes : (prodRes.products || prodRes.data || []);
        setProducts(allProds)
        setAiUsage(usageRes)
      } catch (e) {
        console.error("Failed to load products", e)
        setError("Failed to load products. Please refresh.")
        setCustomizationEnabled(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Loading overlay: animate progress bar + rotate facts (UI only) ──
  useEffect(() => {
    if (!generating) { setProgress(0); return }
    setProgress(8)
    setFactIdx(Math.floor(Math.random() * FLOWER_FACTS.length))

    const prog = setInterval(() => {
      setProgress(p => (p >= 99 ? 99 : p + Math.max(0.25, (99 - p) * (0.05 + Math.random() * 0.04))))
    }, 280)
    const facts = setInterval(() => {
      setFactIdx(i => (i + 1) % FLOWER_FACTS.length)
    }, 3600)

    return () => { clearInterval(prog); clearInterval(facts) }
  }, [generating])

  // 🚀 FIX: Smart Category Checker
  const getCat = (p) => {
    if (typeof p.category === 'string') return p.category.toLowerCase().trim();
    if (typeof p.category_name === 'string') return p.category_name.toLowerCase().trim();
    if (p.category && p.category.name) return p.category.name.toLowerCase().trim();
    return "";
  };

  const getByCategory = (catTarget) => products.filter(p => {
    const c = getCat(p);
    const target = catTarget.toLowerCase().trim();

    // For the accessory step, also match ribbons
    if (target === "accessory") {
      return c === "accessory" || c === "accessories" ||
            c === "ribbon"    || c === "ribbons";
    }

    return c === target || c === target + "s" || c + "s" === target;
  });

  const selProd = (cat) => {
    if (selections[cat] === ACRYLIC_BOX.id) return ACRYLIC_BOX
    return products.find(p => p.id === selections[cat])
  };

  // 🚀 FIX: Strictly block "pot fillers", but accept genuine fillers
  const isFiller = (p) => {
    const c = getCat(p);
    const n = (p.name || "").toLowerCase();
    const t = (p.product_type || "").toLowerCase();
    
    if (c.includes("pot filler") || n.includes("pot filler") || t.includes("pot filler")) return false;
    
    return c.includes("filler") || n.includes("filler") || t.includes("filler");
  };

  // Mix and Match main flowers must be loose customization materials, not bouquet catalog products.
  const flowerList = products.filter(p => {
    if (isFiller(p)) return false;

    const c = getCat(p);

    return c === "flower" || c === "flowers";
  });

  const fillerList = products.filter(isFiller);

  const selectedFlowers = flowerList.filter(p => (flowerQty[p.id] || 0) > 0)
  const totalStems = selectedFlowers.reduce((sum, p) => sum + (flowerQty[p.id] || 0), 0)

  const maxStems = ARRANGEMENTS.find(a => a.key === arrangementType)?.maxStems ?? 24
  const atStemLimit = totalStems >= maxStems

  // Phase 3 ("container") depends on the chosen arrangement style: a bouquet is
  // wrapped, a vase arrangement picks a vase, a box arrangement picks a box.
  // The selection is always stored under `selections.wrapping` so the generate
  // payload (wrapping_id) stays the same regardless of container type.
  const CONTAINER_INFO = {
    bouquet: { cat: "wrapping", label: "Wrapper", plural: "wrappers", hint: "Select the wrapping for your arrangement." },
    vase:    { cat: "vase",     label: "Vase",    plural: "vases",    hint: "Choose the vase for your arrangement." },
    box:     { cat: "box",      label: "Box",     plural: "boxes",    hint: "Choose the box for your arrangement." },
  }
  const container = CONTAINER_INFO[arrangementType] || CONTAINER_INFO.bouquet

  // 🚀 FIX: Stop relying on 'stock_status' and check actual stock to bypass storefront rules
  const incFlower = (p) => {
    if (p.stock <= 0 || p.status === "inactive") return // Only block if TRULY empty or deleted
    if (atStemLimit) { 
      const label = ARRANGEMENTS.find(a => a.key === arrangementType)?.label || "arrangement"
      setError(`A ${label.toLowerCase()} fits up to ${maxStems} stems. Remove a stem to add a different flower.`)
      return
    }
    setFlowerQty(prev => {
      const cur = prev[p.id] || 0
      if (p.stock && cur >= p.stock) return prev 
      return { ...prev, [p.id]: cur + 1 }
    })
    setError("")
  }

  const decFlower = (p) => {
  setFlowerQty(prev => {
    const cur = prev[p.id] || 0
    if (cur <= 0) return prev
    const next = { ...prev, [p.id]: cur - 1 }
    if (next[p.id] === 0) delete next[p.id]
    return next
  })
  setError("")
}

  const toggleFiller = (id) => {
    setFillerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    setError("")
  }

  // Single-select toggle for wrapper / accessory.
  const toggleProduct = (cat, id) => {
    setSelections(prev => ({ ...prev, [cat]: prev[cat] === id ? null : id }))
    setError("")
  }

  const canProceed = () => {
    if (step === 0) return !!arrangementType;
    if (step === 1) return selectedFlowers.length > 0;
    // Box always offers the acrylic container; for others, allow skipping when none exist.
    if (step === 2) {
      if (arrangementType === "box") return selections.wrapping === ACRYLIC_BOX.id;
      return !!selections.wrapping || getByCategory(container.cat).length === 0;
    }
    if (step === 3) return !!selections.ribbon;
    return false;
  }

  const handleNext = () => {
    if (!canProceed()) {
      setError(`Please make a selection to continue.`)
      return
    }
    if (step < STEPS.length - 1) { setStep(p => p + 1); setError("") }
    else handleGenerate()
  }

  const handleGenerate = async () => {
    // 🚀 NEW: Redirect guests to login
    if (!localStorage.getItem('access_token')) {
      window.location.href = '/login';
      return;
    }

    if (!customizationEnabled) {
      setError("AI Customization is temporarily disabled during peak seasons.")
      return
    }
    setGenerating(true); setError(""); setUnavailableItems([])

    const arrangement = ARRANGEMENTS.find(a => a.key === arrangementType)
    const wrapping  = selProd("wrapping")
    const accessory = selProd("ribbon")
    const fillers   = fillerList.filter(p => fillerIds.includes(p.id))

    // Describe every selected flower with its chosen stem count so the AI image
    // (and Gemini's price extraction) reflect the full bouquet.
    const flowerDesc = selectedFlowers.map(p => {
      const qty = flowerQty[p.id]
      return `${qty} ${p.attrs?.color || ""} ${p.attrs?.style || ""} ${p.name}`.replace(/\s+/g, " ").trim()
    })

    const parts = []
    if (flowerDesc.length) parts.push(flowerDesc.join(", "))
    if (arrangement) parts.push(arrangement.promptText)
    if (fillers.length) parts.push(`accented with ${fillers.map(p => p.name).join(", ")}`)
    if (wrapping) {
      // The box's acrylic container is already described by the arrangement prompt.
      if (arrangementType === "vase") parts.push(`arranged in a ${wrapping.attrs?.color || ""} ${wrapping.name}`.replace(/\s+/g, " ").trim())
      else if (arrangementType === "bouquet") parts.push(`wrapped with ${wrapping.attrs?.color || ""} ${wrapping.attrs?.style || ""} paper`.replace(/\s+/g, " ").trim())
    }
    if (accessory) parts.push(`finished with ${accessory.attrs?.name || accessory.name}`)

    const promptText = parts.length > 0 ? `A custom floral arrangement: ${parts.join(", ")}` : "A beautiful custom floral arrangement"

    // Send the most-used flower as the explicit flower_id for the stock check.
    const primaryFlower = selectedFlowers.reduce(
      (best, p) => (best && (flowerQty[best.id] || 0) >= (flowerQty[p.id] || 0) ? best : p),
      null
    )

    try {
      const data = await api.checkAndGenerate({
        prompt_text: promptText,
        arrangement_type: arrangementType,
        flower_id: primaryFlower?.id || undefined,
        // The acrylic box isn't a stocked product, so never send it as a wrapping_id.
        wrapping_id: (selections.wrapping && selections.wrapping !== ACRYLIC_BOX.id) ? selections.wrapping : undefined,
        accessory_id: selections.ribbon || undefined,
      })
      if (data.unavailable_items?.length > 0) {
        setUnavailableItems(data.unavailable_items)
        setAiUsage(prev => prev ? { ...prev, remaining: data.remaining_generations } : prev)
      } else if (data.success) {
        setProgress(100)
        setResult(data)
        setCustomName(data.price_breakdown?.items?.[0]?.product_name || "Custom Arrangement")
        setAiUsage(prev => prev ? { ...prev, remaining: data.remaining_generations } : prev)
        setCompleted(true)
      } else {
        setError(formatGenerationError(data.message, "Generation failed."))
      }
    } catch (e) {
      setError(formatGenerationError(e.message))
    } finally {
      setGenerating(false)
    }
  }

  const handleTryAlt = (field, id) => {
    if (field === "flower_id") {
      // Swap the unavailable flower for the suggested alternative, keeping 1 stem.
      setFlowerQty(prev => ({ ...prev, [id]: prev[id] || 1 }))
      setUnavailableItems([])
      return
    }
    const m = { wrapping_id: "wrapping", accessory_id: "accessory" }
    if (m[field]) { setSelections(p => ({ ...p, [m[field]]: id })); setUnavailableItems([]) }
  }

  // Compose the To / message / From lines into a single greeting string for the cart.
  const composedCard = [
    cardTo.trim() && `To: ${cardTo.trim()}`,
    cardMessage.trim(),
    cardFrom.trim() && `From: ${cardFrom.trim()}`,
  ].filter(Boolean).join("\n")

  const addToBag = async () => {
    if (!result) return
    const names = result.price_breakdown?.items?.map(i => i.product_name).join(", ") || "Custom"
    await addToCart({
      id: result.arrangement_id || `arr-${Date.now()}`,
      group: "Mix and Match", groupIcon: "", name: customName || "Custom Arrangement",
      desc: `Mix & Match: ${names}`, qty: 1, price: result.price_breakdown?.total_price || 0,
      checked: true, img: result.generated_image_url, imgLabel: null,
      cardMessage: composedCard || null,
      cardTo: cardTo.trim() || null,
      cardFrom: cardFrom.trim() || null,
    })
    onNavigate("cart")
  }

  const arrangementDesc = result
    ? `A custom arrangement featuring ${result.price_breakdown?.items?.map(i => i.product_name).join(", ") || "your selected materials"}.`
    : ""
  const arrangementName = result?.price_breakdown?.items?.[0]?.product_name || "Custom Arrangement"

  // ─────────────────────────────────────────────────────────────────────────
  // COMPLETED RESULT VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (completed && result) {
    return (
      <>
        <div className="min-h-screen flex items-start justify-center" style={{ background: pageBg }}>
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">

            {/* Page heading */}
            <div className="text-center mb-6">
              <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase mb-2" style={{ color: accentG }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#f472b6" }} />
                Make It Personal
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#fbbf24" }} />
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-2" style={{ color: accentDG }}>
                Your <span style={{ color: accentPink }}>Custom Arrangement</span>
              </h1>
              <p className="text-sm sm:text-base max-w-xl mx-auto" style={{ color: bodyC }}>
                Here's the bouquet you built, ready to add to your bag.
              </p>
            </div>

            {/* Result card */}
            <div className="border rounded-3xl overflow-hidden"
              style={{ backgroundColor: cardBg, borderColor: cardBdr, boxShadow: cardShadow }}>
              <div className="px-7 pt-6 flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <svg className="w-5 h-5" style={{ color: isDark ? "#f9a8d4" : "#f472b6" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="text-base font-bold" style={{ color: subHeadC }}>Your Custom Arrangement</span>
                  <span className="text-sm" style={{ color: mutedC }}>AI preview</span>
                </div>
                <button
                  onClick={() => {
                    setCompleted(false); setResult(null); setStep(0); setUnavailableItems([])
                    setArrangementType(null); setFlowerQty({}); setFillerIds([]); setSelections({ wrapping: null, ribbon: null })
                    setCardTo(""); setCardFrom(""); setCardMessage(""); setShowAIPanel(false); setGeneratedCardMsg(""); setCardError("")
                  }}
                  className="px-3 py-1.5 rounded-lg transition text-sm"
                  style={{ color: mutedC }}
                >
                  Start Over
                </button>
              </div>

              {/* AI disclaimer banner */}
              <div className="mx-7 mb-5 px-4 py-3 rounded-xl flex items-start gap-3"
                style={{
                  backgroundColor: isDark ? "rgba(251,191,36,0.08)" : "#fffbeb",
                  border: `1px solid ${isDark ? "rgba(251,191,36,0.25)" : "#fde68a"}`,
                }}>
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: isDark ? "#fcd34d" : "#d97706" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: isDark ? "#fcd34d" : "#b45309" }}>
                    AI-Generated Preview
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: isDark ? "#94a3b8" : "#78716c" }}>
                    This image is generated by AI and is for visualization purposes only. Colors, proportions, and details may vary from the actual arrangement prepared by our florists. The final product will use the exact materials you selected.
                  </p>
                </div>
              </div>

              <div className="px-7 pb-7 flex flex-col lg:flex-row gap-6">
                {/* AI Generated Image */}
                <div
                  className="relative w-full lg:w-[520px] xl:w-[560px] aspect-square rounded-2xl flex-shrink-0 flex items-center justify-center border overflow-hidden cursor-zoom-in group"
                  style={{ borderColor: dividerC, backgroundColor: tilePlaceBg }}
                  onClick={() => result.generated_image_url && setLightboxOpen(true)}
                  title="Click for a closer look"
                >
                  {result.generated_image_url
                    ? (
                      <>
                        <img src={result.generated_image_url} alt={arrangementName} className="w-full h-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.06]" />
                        {/* Always-visible zoom pill */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full backdrop-blur-md transition-all opacity-90 group-hover:opacity-100 group-hover:scale-105"
                          style={{ backgroundColor: "rgba(0,0,0,0.45)", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <span className="text-[11px] font-semibold text-white">Click to zoom</span>
                        </div>
                      </>
                    )
                    : (
                      <div className="text-center px-3">
                        <p className="text-sm mb-1" style={{ color: faintC }}>No image generated</p>
                        <p className="text-sm font-medium" style={{ color: mutedC }}>{arrangementName}</p>
                      </div>
                    )
                  }
                </div>

                <div className="flex-1 min-w-0 flex flex-col lg:h-[560px]">
                  {/* Scrollable details — keeps the row the height of the square image */}
                  <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pr-2">
                  <div className="mb-3">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: mutedC }}>Arrangement Name</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      className="w-full mt-1.5 px-4 py-2.5 text-base font-semibold border rounded-xl focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 transition"
                      style={{ backgroundColor: inputBg, borderColor: inputBdr, color: inputText }}
                      placeholder="Name your arrangement"
                    />
                  </div>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: bodyC }}>{arrangementDesc}</p>

                  {/* Materials Used */}
                  {result.price_breakdown?.items?.length > 0 && (
                    <div className="mb-5">
                      <p className="text-sm font-semibold mb-2.5" style={{ color: subHeadC }}>Materials Used</p>
                      <div className="flex flex-wrap gap-2 rounded-xl border p-3.5" style={{ borderColor: tileBdr }}>
                        {result.price_breakdown.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm"
                            style={{ borderColor: tileBdr, backgroundColor: subtleBoxBg }}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentG }} />
                            <span className="font-medium" style={{ color: subHeadC }}>{item.material_type}:</span>
                            <span style={{ color: bodyC }}>{item.product_name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.price_breakdown?.items?.length > 0 && (
                    <div className="grid grid-cols-1 gap-5">
                      {/* Cost Breakdown — bordered table */}
                      <div>
                        <p className="text-sm font-semibold mb-2.5" style={{ color: subHeadC }}>Cost Breakdown</p>
                        <div className="rounded-xl border overflow-hidden" style={{ borderColor: tileBdr }}>
                          <table className="w-full text-sm border-collapse">
                            <tbody>
                              {result.price_breakdown.items.map((item, idx) => (
                                <tr key={idx} className="border-b" style={{ borderColor: tableRowBdr }}>
                                  <td className="px-3 py-2.5 align-top" style={{ color: bodyC }}>
                                    {item.product_name}
                                    {item.quantity > 1 && <span className="ml-1 text-xs font-semibold px-1.5 py-0.5 rounded-md" style={{ color: mutedC, backgroundColor: isDark ? "#0f172a" : "#f3f4f6" }}>× {item.quantity}</span>}
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-medium whitespace-nowrap" style={{ color: subHeadC }}>₱{(+item.subtotal).toLocaleString()}</td>
                                </tr>
                              ))}
                              <tr style={{ backgroundColor: totalRowBg }}>
                                <td className="px-3 py-3 text-base font-bold" style={{ color: headingC }}>Total</td>
                                <td className="px-3 py-3 text-right text-base font-bold whitespace-nowrap" style={{ color: accentDG }}>₱{(+result.price_breakdown.total_price).toLocaleString()}.00</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Availability info — bordered card */}
                      <div>
                        <p className="text-sm font-semibold mb-2.5" style={{ color: subHeadC }}>Availability</p>
                        <div className="rounded-xl border p-4" style={{ borderColor: tileBdr }}>
                          <div className="text-sm space-y-2">
                            <div className="flex justify-between pb-2 border-b" style={{ borderColor: tableRowBdr }}>
                              <span style={{ color: bodyC }}>Status</span>
                              <span className="font-medium" style={{ color: isDark ? "#4ade80" : "#16a34a" }}>All available</span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: bodyC }}>AI uses left</span>
                              <span style={{ color: subHeadC }}>{result.remaining_generations} today</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Greeting card (optional) */}
                  <div className="mt-6 pt-5 border-t" style={{ borderColor: dividerC }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold" style={{ color: subHeadC }}>
                        Greeting card <span className="text-xs font-normal" style={{ color: mutedC }}>(optional)</span>
                      </p>
                      <button onClick={() => setShowAIPanel(!showAIPanel)} className="text-xs font-semibold flex items-center gap-1 hover:underline" style={{ color: accentG }}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        {showAIPanel ? "Write it myself" : "Use AI writer"}
                      </button>
                    </div>

                    {/* To / From */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: mutedC }}>To</label>
                        <input type="text" value={cardTo} onChange={e => setCardTo(e.target.value.slice(0, 40))}
                          placeholder="Recipient's name"
                          className="w-full rounded-lg px-3 py-2 text-sm border outline-none transition focus:ring-1 focus:ring-green-600"
                          style={{ backgroundColor: inputBg, borderColor: inputBdr, color: inputText }} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: mutedC }}>From</label>
                        <input type="text" value={cardFrom} onChange={e => setCardFrom(e.target.value.slice(0, 40))}
                          placeholder="Your name"
                          className="w-full rounded-lg px-3 py-2 text-sm border outline-none transition focus:ring-1 focus:ring-green-600"
                          style={{ backgroundColor: inputBg, borderColor: inputBdr, color: inputText }} />
                      </div>
                    </div>

                    {showAIPanel ? (
                      <div className="p-4 rounded-xl border" style={{ borderColor: tileBdr, backgroundColor: subtleBoxBg }}>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: mutedC }}>Relationship *</label>
                            <select value={aiCardState.relationship}
                              onChange={e => { setAiCardState(s => ({ ...s, relationship: e.target.value })); setCardError("") }}
                              className="w-full rounded-lg px-3 py-2 text-sm border outline-none transition"
                              style={{ backgroundColor: inputBg, borderColor: inputBdr, color: inputText }}>
                              <option value="">Select...</option>
                              {RELATIONSHIP_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: mutedC }}>Occasion *</label>
                            <select value={aiCardState.occasion}
                              onChange={e => { setAiCardState(s => ({ ...s, occasion: e.target.value })); setCardError("") }}
                              className="w-full rounded-lg px-3 py-2 text-sm border outline-none transition"
                              style={{ backgroundColor: inputBg, borderColor: inputBdr, color: inputText }}>
                              <option value="">Select...</option>
                              {OCCASION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: mutedC }}>Tone</label>
                          <div className="flex gap-1.5 flex-wrap">
                            {TONE_OPTIONS.map(t => (
                              <button key={t.value} onClick={() => setAiCardState(s => ({ ...s, tone: t.value }))}
                                className="px-2.5 py-1 rounded-full text-xs border transition-all"
                                style={{
                                  fontWeight: aiCardState.tone === t.value ? 600 : 400,
                                  borderColor: aiCardState.tone === t.value ? accentG : tileBdr,
                                  backgroundColor: aiCardState.tone === t.value ? (isDark ? "rgba(74,222,128,0.12)" : "#f0fdf4") : inputBg,
                                  color: aiCardState.tone === t.value ? accentG : subHeadC
                                }}>
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: mutedC }}>
                            Extra context <span className="normal-case tracking-normal font-normal opacity-70">(optional)</span>
                          </label>
                          <input type="text" placeholder="e.g. She loves sunflowers, it's our 10th anniversary..."
                            value={aiCardState.extra}
                            onChange={e => setAiCardState(s => ({ ...s, extra: e.target.value }))}
                            className="w-full rounded-lg px-3 py-2 text-sm border outline-none transition"
                            style={{ backgroundColor: inputBg, borderColor: inputBdr, color: inputText }} />
                        </div>
                        {cardError && <p className="text-xs text-red-500 mb-3">{cardError}</p>}
                        <button onClick={handleGenerateCard} disabled={generatingCard}
                          className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 border-none text-white cursor-pointer hover:opacity-90 transition disabled:opacity-70"
                          style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
                          {generatingCard ? "Writing your message..." : "Generate message"}
                        </button>
                        {!generatingCard && generatedCardMsg && (
                          <div className="mt-4 border rounded-xl overflow-hidden" style={{ borderColor: isDark ? "rgba(74,222,128,0.3)" : "#bbf7d0" }}>
                            <div className="p-3" style={{ backgroundColor: isDark ? "rgba(74,222,128,0.06)" : "#f0fdf4" }}>
                              <p className="text-sm italic leading-relaxed" style={{ color: subHeadC }}>"{generatedCardMsg}"</p>
                            </div>
                            <div className="flex border-t" style={{ borderColor: isDark ? "rgba(74,222,128,0.3)" : "#bbf7d0" }}>
                              <button onClick={() => setGeneratedCardMsg("")} className="flex-1 py-2 text-xs font-semibold border-r hover:opacity-80"
                                style={{ borderColor: isDark ? "rgba(74,222,128,0.3)" : "#bbf7d0", color: bodyC, backgroundColor: isDark ? "#0f172a" : "white" }}>
                                Try again
                              </button>
                              <button onClick={acceptGeneratedMessage} className="flex-1 py-2 text-xs font-bold hover:opacity-80"
                                style={{ color: accentG, backgroundColor: isDark ? "#0f172a" : "white" }}>
                                Use this message
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <textarea
                          value={cardMessage}
                          onChange={e => setCardMessage(e.target.value.slice(0, 160))}
                          placeholder="Write a warm, kind message..."
                          rows={3}
                          className="w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-1 focus:ring-green-600 transition resize-none"
                          style={{ backgroundColor: inputBg, borderColor: inputBdr, color: inputText }}
                        />
                        <p className="text-[10px] text-right mt-1" style={{ color: mutedC }}>{cardMessage.length} / 160</p>
                      </>
                    )}

                    {/* Live preview of the card — consistent with the product preview design */}
                    <div className="mt-4 border rounded-xl p-4" style={{ borderColor: tileBdr, backgroundColor: subtleBoxBg }}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: mutedC }}>Preview</p>
                      <p className="text-sm leading-relaxed min-h-10 mb-3 break-words whitespace-pre-line"
                        style={{ color: cardMessage.trim() ? subHeadC : faintC, fontStyle: cardMessage.trim() ? "normal" : "italic" }}>
                        {cardMessage.trim() || "Your message..."}
                      </p>
                      <div className="flex justify-between border-t pt-2" style={{ borderColor: tableRowBdr }}>
                        <span className="text-sm" style={{ color: mutedC }}>To: <strong style={{ color: subHeadC }}>{cardTo.trim() || "..."}</strong></span>
                        <span className="text-sm" style={{ color: mutedC }}>From: <strong style={{ color: subHeadC }}>{cardFrom.trim() || "..."}</strong></span>
                      </div>
                    </div>
                  </div>
                  </div>

                  <button
                    onClick={addToBag}
                    className="mt-4 w-full py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors flex-shrink-0"
                    style={{ backgroundColor: accentG, color: isDark ? "#08120c" : "#ffffff" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = accentDG)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = accentG)}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add to shopping bag
                  </button>
                </div>
              </div>

              <div className="px-7 pb-5 flex items-center justify-end border-t pt-4" style={{ borderColor: dividerC }}>
                <span className="text-xs font-bold" style={{ color: mutedC }}>POWERED BY pollinations.ai</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lightbox modal for closer look */}
        {result?.generated_image_url && createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center p-3 sm:p-6"
            style={{
              top: 0, left: 0, width: "100vw", height: "100vh",
              zIndex: 99999,
              backgroundColor: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              opacity: lightboxOpen ? 1 : 0,
              pointerEvents: lightboxOpen ? "auto" : "none",
              transition: "opacity 0.35s ease",
            }}
            onClick={() => setLightboxOpen(false)}
          >
            <button
              aria-label="Close"
              className="absolute z-10 flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full text-white transition active:scale-95"
              style={{
                top: "max(0.75rem, env(safe-area-inset-top))",
                right: "max(0.75rem, env(safe-area-inset-right))",
                backgroundColor: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                border: "1px solid rgba(255,255,255,0.2)",
                opacity: lightboxOpen ? 1 : 0,
                transition: "opacity 0.35s ease 0.05s, transform 0.1s ease",
              }}
              onClick={() => setLightboxOpen(false)}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={result.generated_image_url}
              alt={arrangementName}
              className="max-w-full max-h-[85vh] sm:max-h-[88vh] w-auto h-auto rounded-xl sm:rounded-2xl shadow-2xl object-contain"
              style={{
                transform: lightboxOpen ? "scale(1)" : "scale(0.9)",
                opacity: lightboxOpen ? 1 : 0,
                transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
              }}
              onClick={e => e.stopPropagation()}
            />
          </div>,
          document.body
        )}
      </>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BUILDER VIEW (steps)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
    <div className="min-h-screen flex items-start justify-center" style={{ background: pageBg }}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">

        {/* Page heading */}
        <div className="text-center mb-6" style={{ animation: "mmEnter 0.6s ease 0.05s both" }}>
          <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase mb-2" style={{ color: accentG }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#f472b6" }} />
            Make It Personal
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#fbbf24" }} />
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-2" style={{ color: accentDG }}>
            <span className="shine-text" style={{ "--shine-base": accentDG }}>Mix &amp;</span> <span className="shine-text" style={{ "--shine-base": accentPink }}>Match</span>
          </h1>
          <p className="text-sm sm:text-base max-w-xl mx-auto" style={{ color: bodyC }}>
            Build your own bouquet step by step, exactly the way you want it.
          </p>
        </div>

        {/* Steps card */}
        <div className="backdrop-blur-sm border rounded-3xl p-6 sm:p-7 mb-5"
          style={{ backgroundColor: cardBg, borderColor: cardBdr, boxShadow: cardShadow, animation: "mmEnter 0.6s ease 0.18s both" }}>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: iconCircleBg, color: accentG }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </span>
              <div>
                <h2 className="text-lg font-bold" style={{ color: headingC }}>Mix and Match</h2>
                <p className="text-sm" style={{ color: mutedC }}>Build your bouquet step by step</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: bodyC }}>
                {aiUsage ? `${aiUsage.remaining} / ${aiUsage.limit} AI left` : "Loading AI usage..."}
              </span>
              <span className="text-xs" style={{ color: mutedC }}>Step {step + 1} of {STEPS.length}</span>
            </div>
          </div>
          <StepDots current={step} tokens={tokens} />
        </div>

        {/* AI usage warnings */}
        {aiUsage && aiUsage.remaining === 0 && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "#fef2f2", border: `1px solid ${isDark ? "rgba(239,68,68,0.3)" : "#fee2e2"}`, color: isDark ? "#fca5a5" : "#dc2626" }}>
            You have reached your daily limit of {aiUsage.limit} AI generations. Please try again tomorrow.
          </div>
        )}
        {aiUsage && aiUsage.remaining > 0 && aiUsage.remaining <= 2 && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: isDark ? "rgba(245,158,11,0.12)" : "#fffbeb", border: `1px solid ${isDark ? "rgba(245,158,11,0.3)" : "#fef3c7"}`, color: isDark ? "#fcd34d" : "#b45309" }}>
            You have {aiUsage.remaining} AI generation{aiUsage.remaining !== 1 ? "s" : ""} left today.
          </div>
        )}

        {/* Unavailable items */}
        {unavailableItems.length > 0 && (
          <div className="mb-5 border rounded-2xl p-6"
            style={{ backgroundColor: cardBg, borderColor: isDark ? "rgba(245,158,11,0.3)" : "#fde68a" }}>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5" style={{ color: "#f59e0b" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-base font-semibold" style={{ color: subHeadC }}>Some items are unavailable</h3>
            </div>
            <div className="space-y-3">
              {unavailableItems.map(item => (
                <div key={item.field} className="border rounded-xl p-4" style={{ borderColor: dividerC }}>
                  <p className="text-sm mb-1" style={{ color: bodyC }}>
                    <span className="font-medium" style={{ color: subHeadC }}>{item.product_name}</span> — {item.reason}
                  </p>
                  {item.alternatives && item.alternatives.length > 0 && (
                    <div className="mt-2.5">
                      <p className="text-xs mb-2" style={{ color: mutedC }}>Suggested alternatives:</p>
                      <div className="flex gap-2 flex-wrap">
                        {item.alternatives.map(alt => (
                          <button
                            key={alt.product_id}
                            onClick={() => handleTryAlt(item.field, alt.product_id)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all"
                            style={{ borderColor: isDark ? "rgba(74,222,128,0.4)" : "#bbf7d0", color: accentG, backgroundColor: isDark ? "rgba(74,222,128,0.06)" : "transparent" }}
                          >
                            {alt.image_url && <img src={alt.image_url} alt="" className="w-6 h-6 rounded object-cover" />}
                            <span className="font-medium">{alt.product_name}</span>
                            <span style={{ color: mutedC }}>₱{(+alt.price).toLocaleString()}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selection card */}
        <div className="backdrop-blur-sm border rounded-3xl p-6 sm:p-7"
          style={{ backgroundColor: cardBg, borderColor: cardBdr, boxShadow: cardShadow, animation: "mmEnter 0.6s ease 0.3s both" }}>
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accentG, color: isDark ? "#08120c" : "#ffffff" }}>
                {step + 1}
              </span>
              <h2 className="text-base font-bold" style={{ color: headingC }}>Choose your {(step === 2 ? container.label : STEPS[step].label).toLowerCase()}</h2>
            </div>
            <p className="text-sm ml-8" style={{ color: mutedC }}>{step === 2 ? container.hint : STEP_HINTS[step]}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 rounded-full animate-spin mr-3" style={{ borderColor: tileBdr, borderTopColor: accentG }} />
              <p className="text-sm" style={{ color: mutedC }}>Loading products...</p>
            </div>
          ) : (
            <div key={step} style={{ animation: "mmFade 0.4s ease both" }}>
              {/* ── Phase 1: Arrangement type ── */}
              {step === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ARRANGEMENTS.map(a => {
                    const sel = arrangementType === a.key
                    return (
                      <button
                        key={a.key}
                        onClick={() => { setArrangementType(a.key); setError("") }}
                        className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all hover:brightness-[1.02]"
                        style={{ borderColor: sel ? accentG : tileBdr, backgroundColor: sel ? tileSelBg : tileBg }}
                      >
                        {/* Image placeholder — swap in a.image when artwork is ready */}
                        <div className="w-full aspect-square rounded-xl overflow-hidden flex items-center justify-center relative" style={{ backgroundColor: tilePlaceBg }}>
                          {a.image ? (
                            <img src={a.image} alt={a.label} className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor" style={{ color: sel ? accentG : faintC }}><path d={a.path} /></svg>
                          )}
                          {sel && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: accentG }}>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke={isDark ? "#08120c" : "#ffffff"}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <span className="block text-sm font-bold" style={{ color: sel ? accentG : subHeadC }}>{a.label}</span>
                          <span className="block text-xs mt-0.5" style={{ color: mutedC }}>{a.desc}</span>
                          <span className="block text-[11px] mt-1" style={{ color: mutedC }}>Up to {a.maxStems} stems</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* ── Phase 2: Flowers (stem stepper) + Fillers ── */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: subHeadC }}>
                        Flowers <span className="font-normal" style={{ color: mutedC }}>— use + / − to set how many stems</span>
                      </p>
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: atStemLimit ? (isDark ? "rgba(245,158,11,0.16)" : "#fffbeb") : tileSelBg,
                          color: atStemLimit ? (isDark ? "#fcd34d" : "#b45309") : accentG,
                        }}
                      >
                        {totalStems} / {maxStems} stems
                      </span>
                    </div>
                    {atStemLimit && (
                      <p className="text-xs mb-3" style={{ color: isDark ? "#fcd34d" : "#b45309" }}>
                        You've reached the maximum for a {ARRANGEMENTS.find(a => a.key === arrangementType)?.label.toLowerCase()}. Remove a stem to add more.
                      </p>
                    )}
                    {flowerList.length === 0 ? (
                      <p className="text-sm py-6 text-center" style={{ color: mutedC }}>No flowers available right now.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                        {flowerList.map(p => (
                          <FlowerCard
                            key={p.id}
                            product={p}
                            qty={flowerQty[p.id] || 0}
                            onInc={() => incFlower(p)}
                            onDec={() => decFlower(p)}
                            disabled={p.stock <= 0 || p.status === "inactive"} // 🚀 FIX
                            incDisabled={atStemLimit}
                            tokens={tokens}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {fillerList.length > 0 && (
                    <div className="pt-5 border-t" style={{ borderColor: dividerC }}>
                      <p className="text-sm font-semibold mb-3" style={{ color: subHeadC }}>
                        Fillers <span className="font-normal" style={{ color: mutedC }}>(optional)</span>
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3">
                        {fillerList.map(p => (
                          <ProductCard
                            key={p.id}
                            product={p}
                            selected={fillerIds.includes(p.id)}
                            onClick={() => toggleFiller(p.id)}
                            disabled={p.stock <= 0 || p.status === "inactive"} // 🚀 FIX
                            tokens={tokens}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Phase 3: Container (wrapper / vase / box) / Phase 4: Accessory ── */}
              {(step === 2 || step === 3) && (() => {
                // selKey stays "wrapping" so the generate payload is unchanged;
                // the category we filter by depends on the arrangement type.
                const selKey = step === 2 ? "wrapping" : "ribbon"
                const filterCat = step === 2 ? container.cat : "ribbon"
                const emptyLabel = step === 2 ? container.plural : "ribbons"
                // Box arrangement offers a single clear acrylic box (not a stocked product).
                const list = (step === 2 && arrangementType === "box")
                  ? [ACRYLIC_BOX]
                  : getByCategory(filterCat)
                return list.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm" style={{ color: mutedC }}>No {emptyLabel} available right now.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3">
                    {list.map(p => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        selected={selections[selKey] === p.id}
                        onClick={() => toggleProduct(selKey, p.id)}
                        disabled={p.stock <= 0 || p.status === "inactive"} // 🚀 FIX
                        tokens={tokens}
                      />
                    ))}
                  </div>
                )
              })()}
            </div>
          )}

          {/* Selection summary (per step) */}
          {step === 0 && arrangementType && (
            <div className="mt-4 px-4 py-2.5 rounded-xl text-sm" style={{ backgroundColor: tileSelBg }}>
              <span className="font-medium" style={{ color: accentG }}>
                Arrangement: {ARRANGEMENTS.find(a => a.key === arrangementType)?.label}
              </span>
            </div>
          )}
          {step === 1 && selectedFlowers.length > 0 && (
            <div className="mt-4 px-4 py-2.5 rounded-xl text-sm" style={{ backgroundColor: tileSelBg }}>
              <span className="font-medium" style={{ color: accentG }}>
                {totalStems} stem{totalStems !== 1 ? "s" : ""} across {selectedFlowers.length} flower{selectedFlowers.length !== 1 ? "s" : ""}
                {fillerIds.length > 0 ? ` · ${fillerIds.length} filler${fillerIds.length !== 1 ? "s" : ""}` : ""}
              </span>
            </div>
          )}
          {(step === 2 || step === 3) && selProd(step === 2 ? "wrapping" : "ribbon") && (
            <div className="mt-4 px-4 py-2.5 rounded-xl text-sm" style={{ backgroundColor: tileSelBg }}>
              <span className="font-medium" style={{ color: accentG }}>
                Selected: {selProd(step === 2 ? "wrapping" : "ribbon").name} — ₱{(+selProd(step === 2 ? "wrapping" : "ribbon").price).toLocaleString()}
              </span>
            </div>
          )}

          {/* Inline validation / error — shown directly under the selection grid */}
          {error && (
            <div className="mt-4 flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
              style={{
                backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "#fef2f2",
                border: `1px solid ${isDark ? "rgba(239,68,68,0.3)" : "#fecaca"}`,
                color: isDark ? "#fca5a5" : "#dc2626",
              }}>
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="leading-snug">{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-5 border-t" style={{ borderColor: dividerC }}>
            <button
              onClick={() => step === 0 ? onNavigate("make-it-personal") : setStep(s => s - 1)}
              className="px-5 py-2.5 text-sm font-medium border rounded-xl transition"
              style={{ color: subHeadC, borderColor: inputBdr, backgroundColor: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "#f9fafb"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
            >
              {step === 0 ? "Return" : "Back"}
            </button>
            <button
              onClick={handleNext}
              disabled={generating || !canProceed() || (aiUsage?.remaining === 0 && step === STEPS.length - 1)}
              className="flex items-center gap-2 px-7 py-3 text-base font-bold rounded-2xl transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
              style={{
                background: (!generating && canProceed() && !(aiUsage?.remaining === 0 && step === STEPS.length - 1))
                  ? (step === STEPS.length - 1 ? "linear-gradient(135deg, #e879a0, #f43f5e)" : accentG)
                  : (isDark ? "#475569" : "#d1d5db"),
                color: "#ffffff",
              }}
            >
              {generating ? (
                <>
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Generating...
                </>
              ) : step === STEPS.length - 1 ? (
                <>
                  Generate Arrangement
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </>
              ) : (
                <>
                  Continue
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>

    {/* ── Loading overlay: blurred backdrop + centered progress + flower facts ── */}
    {generating && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ backgroundColor: isDark ? "rgba(8,15,10,0.6)" : "rgba(12,87,62,0.35)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
        <div className="w-full max-w-md rounded-3xl px-8 py-10 text-center shadow-2xl"
          style={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", animation: "mmPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}>
          {/* Bloom icon */}
          <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(244,114,182,0.18), rgba(46,139,52,0.14))" }}>
            <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" style={{ animation: "mmBob 2.6s ease-in-out infinite" }}>
              <path d="M24 30V44" stroke="#2E8B34" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M24 38c-3.5 0-6.3-2-7-5.2 3.5-.6 6.3 1.2 7 5.2Z" fill="#34a853" />
              <path d="M24 34c3-.2 5.6-2 6.4-4.8-3.2-.4-5.8 1.4-6.4 4.8Z" fill="#2E8B34" />
              {[0,60,120,180,240,300].map(deg => (
                <ellipse key={deg} cx="24" cy="12" rx="5.2" ry="8" fill="#f472b6"
                  transform={`rotate(${deg} 24 22)`} />
              ))}
              {[30,90,150,210,270,330].map(deg => (
                <ellipse key={deg} cx="24" cy="15" rx="3.2" ry="5" fill="#ec4899" opacity="0.45"
                  transform={`rotate(${deg} 24 22)`} />
              ))}
              <circle cx="24" cy="22" r="6" fill="#fbbf24" />
              <circle cx="24" cy="22" r="3.2" fill="#f59e0b" />
            </svg>
          </div>

          <h3 className="text-xl font-bold mb-1.5" style={{ color: accentDG }}>Creating your bouquet</h3>
          <p className="text-sm mb-7" style={{ color: mutedC }}>Arranging every petal just for you...</p>

          {/* Growing progress bar with a flower riding the leading edge */}
          <div className="relative w-full mb-2" style={{ paddingTop: "12px" }}>
            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? "#0f172a" : "#f1ece6" }}>
              <div className="h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg, #f472b6, #fbbf24 55%, #2E8B34)" }} />
            </div>
            <div className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out"
              style={{ left: `${progress}%`, top: "17px" }}>
              <svg className="w-[30px] h-[30px]" viewBox="0 0 24 24" fill="none" style={{ animation: "mmSpin 4s linear infinite", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>
                {[0,72,144,216,288].map(deg => (
                  <ellipse key={deg} cx="12" cy="6.5" rx="2.8" ry="4.2" fill="#f472b6"
                    transform={`rotate(${deg} 12 12)`} />
                ))}
                <circle cx="12" cy="12" r="3.4" fill="#fbbf24" />
                <circle cx="12" cy="12" r="1.6" fill="#f59e0b" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-semibold mb-7" style={{ color: mutedC }}>{Math.round(progress)}%</p>

          {/* Fun fact */}
          <div className="rounded-2xl px-5 py-4 text-left"
            style={{ backgroundColor: isDark ? "rgba(219,39,119,0.1)" : "#fdf2f8", border: `1px solid ${isDark ? "rgba(219,39,119,0.3)" : "#fbcfe8"}` }}>
            <p className="text-xs font-bold tracking-wider uppercase mb-1.5" style={{ color: isDark ? "#f9a8d4" : "#db2777" }}>Did you know?</p>
            <p key={factIdx} className="text-sm leading-relaxed" style={{ color: isDark ? "#cbd5e1" : "#4b5563", animation: "mmFade 0.5s ease both" }}>
              {FLOWER_FACTS[factIdx]}
            </p>
          </div>
        </div>
      </div>
    )}

    {/* Keyframes for the loading overlay animations */}
    <style>{`
      @keyframes mmPop  { from { opacity:0; transform:scale(0.94) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
      @keyframes mmEnter { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      @keyframes mmFade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      @keyframes mmSpin { to { transform:rotate(360deg); } }
      @keyframes mmBob  { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-3px); } }
      @keyframes titleShine { to { background-position: -200% 0; } }
      .shine-text { background-image: linear-gradient(110deg, var(--shine-base) 0%, var(--shine-base) 42%, #ffffff 50%, var(--shine-base) 58%, var(--shine-base) 100%); background-size: 200% 100%; background-position: 0% 0; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; will-change: background-position; animation: titleShine 3.5s linear infinite; }
      @media (prefers-reduced-motion: reduce) { .shine-text { animation: none; } }
    `}</style>
    </>
  )
}
