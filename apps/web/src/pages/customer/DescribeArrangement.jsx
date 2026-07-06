import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { api } from "../../services/api.js"
import { addToCart } from "../../utils/cart.js"
import { useTheme } from "../../context/ThemeContext"

import { generateCardMessage, RELATIONSHIP_OPTIONS, OCCASION_OPTIONS, TONE_OPTIONS } from "../../utils/cardMessage.js"

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

const PROMPT_TIPS = [
  { title: "Theme or occasion", content: "Specify a theme, occasion, or the vibe you want: e.g. 'A romantic Valentine's Day arrangement' or 'A cheerful birthday arrangement.'" },
  { title: "Colors you'd like", content: "Mention any specific colors or a color palette: e.g. 'Soft pink and cream' or 'Vibrant and colorful.'" },
  { title: "Tell your favorite flower", content: "This means the main flower you want to see the most in the bouquet. Example: 'I like roses. They look soft and romantic, with full petals and a gentle color.'" },
]

const EXAMPLE_PROMPTS = [
  "I'm ordering this for Valentine's Day. She likes pink and soft, romantic styles.",
  "Something cheerful and bright with sunflowers for a birthday.",
  "Elegant white and green arrangement for a wedding centerpiece.",
  "Soft lavender and cream bouquet for a graduation gift.",
]

const MATERIAL_CATEGORIES = [
  { key: "flower", label: "Flowers" },
  { key: "vase", label: "Vases" },
  { key: "wrapping", label: "Wrappings" },
  { key: "accessory", label: "Accessories" },
]

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

// ── Flower petal loader (matches the admin pages for a coherent loading look) ──
function FlowerLoader({ message = "Loading...", isDark = false, size = 120, minHeight = "60vh" }) {
  const petals = [
    { angle: 0,   color: "#f48fb1" },
    { angle: 60,  color: "#ec407a" },
    { angle: 120, color: "#e91e63" },
    { angle: 180, color: "#f06292" },
    { angle: 240, color: "#c2185b" },
    { angle: 300, color: "#f48fb1" },
  ]
  return (
    <>
      <style>{`
        @keyframes flrPetalBloom {
          0%, 100% { opacity: 0.2; }
          50%      { opacity: 1;   }
        }
      `}</style>
      <div className="flex flex-col items-center justify-center rounded-xl w-full"
        style={{ minHeight, backgroundColor: "transparent" }}>
        <svg width={size} height={size} viewBox="0 0 100 100">
          {petals.map(({ angle, color }, i) => (
            <g key={i} transform={`rotate(${angle} 50 50)`}>
              <ellipse cx="50" cy="27" rx="9.5" ry="21" fill={color}
                style={{ animation: `flrPetalBloom 1.4s ease-in-out ${(i * 0.2).toFixed(2)}s infinite`, animationFillMode: "both" }} />
            </g>
          ))}
          <circle cx="50" cy="50" r="12" fill="#2E8B34" />
          <circle cx="50" cy="50" r="7"  fill="#f9c6d0" />
          <circle cx="50" cy="50" r="3.5" fill="#fff" opacity="0.7" />
        </svg>
        <p className="mt-3 text-sm font-medium tracking-wide" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>{message}</p>
      </div>
    </>
  )
}

export default function DescribeArrangement({ onNavigate }) {
  const { isDark } = useTheme()

  const currentBranch = localStorage.getItem("selectedBranch") || localStorage.getItem("branch") || "Manila"

  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [products, setProducts] = useState([])
  
  const [liveAddOns, setLiveAddOns] = useState([])
  const [selectedAddOns, setSelectedAddOns] = useState([])
  const [showAllAddons, setShowAllAddons] = useState(false)

  const [cardMessage, setCardMessage] = useState("")
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [aiCardState, setAiCardState] = useState({ relationship: "", occasion: "", tone: "warm", extra: "" })
  const [generatingCard, setGeneratingCard] = useState(false)
  const [generatedCardMsg, setGeneratedCardMsg] = useState("")
  const [cardError, setCardError] = useState("")

  const [selectedMaterials, setSelectedMaterials] = useState({ flower: null, vase: null, wrapping: null, accessory: null })
  const [showMaterials, setShowMaterials] = useState(false)
  const [customizationEnabled, setCustomizationEnabled] = useState(true)
  const [aiUsage, setAiUsage] = useState(null)
  const [unavailableItems, setUnavailableItems] = useState([])
  const [fetchingProducts, setFetchingProducts] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [customName, setCustomName] = useState("")
  const MAX = 500

  const [typedPlaceholder, setTypedPlaceholder] = useState("")
  const [promptFocused, setPromptFocused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [factIdx, setFactIdx] = useState(0)

  // ── Dark-mode color tokens ──
  const pageBg       = isDark ? "radial-gradient(1100px 600px at 50% -8%, #0f2018 0%, #0d1a14 45%, #0f172a 100%)" : "radial-gradient(1100px 600px at 50% -8%, #eaf6ec 0%, #f4f9f1 45%, #fbf7ef 100%)"
  const accentG      = isDark ? "#4ade80" : G
  const accentDG     = isDark ? "#4ade80" : DG
  const accentPink   = isDark ? "#f9a8d4" : "#db2777"
  const cardBg       = isDark ? "rgba(30,41,59,0.92)" : "rgba(255,255,255,0.9)"
  const cardBdr      = isDark ? "#334155" : "#dcfce7"
  const cardShadow   = isDark ? "0 12px 40px rgba(0,0,0,0.45)" : "0 12px 40px rgba(12,87,62,0.08)"
  const headingC     = isDark ? "#f1f5f9" : "#1f2937"
  const subHeadC     = isDark ? "#cbd5e1" : "#374151"
  const bodyC        = isDark ? "#94a3b8" : "#6b7280"
  const mutedC       = isDark ? "#64748b" : "#9ca3af"
  const faintC       = isDark ? "#475569" : "#d1d5db"
  const inputBg      = isDark ? "#0f172a" : "#ffffff"
  const inputBdr     = isDark ? "#475569" : "#e5e7eb"
  const inputText    = isDark ? "#f1f5f9" : "#1f2937"
  const tileBg       = isDark ? "#1e293b" : "white"
  const tileSelBg    = isDark ? "rgba(74,222,128,0.12)" : "#F0F7F1"
  const tileBdr      = isDark ? "#334155" : "#e5e7eb"
  const softBdr      = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"
  const tilePlaceBg  = isDark ? "#0f172a" : "#f3f4f6"
  const dividerC     = isDark ? "#334155" : "#f3f4f6"
  const iconCircleBg = isDark ? "rgba(74,222,128,0.12)" : "rgba(46,139,52,0.1)"
  const tableRowBdr  = isDark ? "#334155" : "#f3f4f6"
  const totalRowBg   = isDark ? "rgba(74,222,128,0.08)" : "#f4f9f1"
  const subtleBoxBg  = isDark ? "#1e293b" : "#f9fafb"

  useEffect(() => {
    async function load() {
      try {
        const [toggleRes, productsRes, usageRes] = await Promise.all([
          api.isCustomizationEnabled().catch(() => ({ enabled: true })),
          api.getCustomizationProducts(),
          api.getAiUsage().catch(() => ({ remaining: 5, limit: 5 })),
        ])
        setCustomizationEnabled(toggleRes.enabled)
        
        const allProds = Array.isArray(productsRes) ? productsRes : productsRes.products || []
        setProducts(allProds)
        
        setLiveAddOns(allProds.filter(p => p.category?.toLowerCase() === "add-on" || p.category?.toLowerCase() === "addon" || p.category?.toLowerCase() === "accessories"))
        setAiUsage(usageRes)
      } catch (e) {
        console.error("Failed to load", e)
        setCustomizationEnabled(true)
      } finally {
        setFetchingProducts(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [lightboxOpen])

  useEffect(() => {
    if (prompt || promptFocused) { setTypedPlaceholder(""); return }
    let exampleIdx = 0
    let charIdx = 0
    let deleting = false
    let timer

    const tick = () => {
      const full = EXAMPLE_PROMPTS[exampleIdx]
      if (!deleting) {
        charIdx++
        setTypedPlaceholder(full.slice(0, charIdx))
        if (charIdx === full.length) {
          deleting = true
          timer = setTimeout(tick, 1800)
          return
        }
        timer = setTimeout(tick, 38)
      } else {
        charIdx--
        setTypedPlaceholder(full.slice(0, charIdx))
        if (charIdx === 0) {
          deleting = false
          exampleIdx = (exampleIdx + 1) % EXAMPLE_PROMPTS.length
          timer = setTimeout(tick, 300)
          return
        }
        timer = setTimeout(tick, 20)
      }
    }
    timer = setTimeout(tick, 400)
    return () => clearTimeout(timer)
  }, [prompt, promptFocused])

  useEffect(() => {
    if (!loading) { setProgress(0); return }
    setProgress(8)
    setFactIdx(Math.floor(Math.random() * FLOWER_FACTS.length))

    const prog = setInterval(() => {
      setProgress(p => (p >= 99 ? 99 : p + Math.max(0.25, (99 - p) * (0.05 + Math.random() * 0.04))))
    }, 280)
    const facts = setInterval(() => {
      setFactIdx(i => (i + 1) % FLOWER_FACTS.length)
    }, 3600)

    return () => { clearInterval(prog); clearInterval(facts) }
  }, [loading])

  const getProductsByCategory = (category) => products.filter(p => {
    if (p.category !== category || p.status === "inactive") return false;
    const inBranch = p.branches?.includes(currentBranch) || !p.branches || p.branches.length === 0;
    return inBranch;
  });

  const getProductPrice = (productId) => {
    const p = products.find(p => p.id === productId)
    return p ? parseFloat(p.price) : 0
  }

  const toggleMaterial = (category, productId) => {
    setSelectedMaterials(prev => ({
      ...prev,
      [category]: prev[category] === productId ? null : productId,
    }))
  }

  const toggleAddOn = (id) => {
    setSelectedAddOns(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleGenerateCard = async () => {
    // 🚀 NEW: Redirect guests to login
    if (!localStorage.getItem('access_token')) {
      window.location.href = '/login';
      return;
    }

    if (!aiCardState.relationship || !aiCardState.occasion) {
      setCardError("Please select a relationship and occasion.");
      return;
    }
    setCardError("");
    setGeneratingCard(true);
    setGeneratedCardMsg("");
    try {
      const text = await generateCardMessage(aiCardState);
      setGeneratedCardMsg(text);
    } catch (e) {
      setCardError("Could not generate message. Please try again.");
    }
    setGeneratingCard(false);
  }

  const acceptGeneratedMessage = () => {
    setCardMessage(generatedCardMsg);
    setShowAIPanel(false);
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
    if (!prompt.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    setUnavailableItems([])
    setSelectedAddOns([])

    try {
      const availableInventory = products
        .filter(p => {
           if (!p.is_available || p.status === "inactive") return false;
           const branchStock = currentBranch === "Pampanga" ? p.stock_pampanga : (p.stock_manila ?? p.stock);
           const inBranch = p.branches?.includes(currentBranch) || !p.branches || p.branches.length === 0;
           return branchStock > 0 && inBranch;
        })
        .map(p => p.name)
        .join(", ");

      const superchargedPrompt = `Customer Request: "${prompt.trim()}". 
        If the request is vague (like just an occasion or color), act as an expert florist and invent a beautiful recipe that perfectly matches the vibe. 
        Strict inventory rules: You MUST ONLY pick flowers, vases, and wrappings from this exact list of available stock: [${availableInventory}]. 
        Strict visual rules for the image generator: Ultra-realistic 8k macro photography, studio lighting, hyper-detailed, elegant floral design, lifelike textures, natural lighting. NO artificial-looking gloss, NO cartoonish colors. Professional florist portfolio shot, eye-level, standing upright against a clean, neutral background. DO NOT use a top-down view.`;

      const payload = { prompt_text: superchargedPrompt }
      if (selectedMaterials.flower) payload.flower_id = selectedMaterials.flower;
      if (selectedMaterials.vase) payload.vase_id = selectedMaterials.vase;
      if (selectedMaterials.wrapping) payload.wrapping_id = selectedMaterials.wrapping;
      if (selectedMaterials.accessory) payload.accessory_id = selectedMaterials.accessory;
      
      const data = await api.checkAndGenerate(payload)

      if (data.unavailable_items && data.unavailable_items.length > 0) {
        setUnavailableItems(data.unavailable_items)
        setAiUsage(prev => prev ? { ...prev, remaining: data.remaining_generations } : prev)
      } else if (data.success) {
        if (data.price_breakdown?.items) {
          const pricedItems = data.price_breakdown.items.map(item => {
            const dbPrice = getProductPrice(item.product_id)
            const qty = item.quantity || 1
            return {
              ...item,
              quantity: qty,
              unit_price: dbPrice > 0 ? dbPrice : item.unit_price,
              subtotal: dbPrice > 0 ? dbPrice * qty : item.subtotal,
            }
          })

          const groupedMap = pricedItems.reduce((acc, item) => {
            const key = item.product_name;
            if (!acc[key]) {
              acc[key] = { ...item };
            } else {
              acc[key].quantity += item.quantity;
              acc[key].subtotal += item.subtotal;
            }
            return acc;
          }, {});

          data.price_breakdown.items = Object.values(groupedMap);
          data.price_breakdown.total_price = data.price_breakdown.items.reduce((sum, item) => sum + item.subtotal, 0)
        }

        setProgress(100)
        setResult(data)
        setCustomName(data.price_breakdown?.items?.[0]?.product_name || "AI Arrangement")
        setAiUsage(prev => prev ? { ...prev, remaining: data.remaining_generations } : prev)
      } else {
        setError(formatGenerationError(data.message, "Generation failed. Please try again."))
      }
    } catch (e) {
      setError(formatGenerationError(e.message))
    } finally {
      setLoading(false)
    }
  }

  const baseTotal = result?.price_breakdown?.total_price || 0;
  const addOnTotal = selectedAddOns.reduce((sum, id) => sum + (liveAddOns.find(a => a.id === id)?.price || 0), 0);
  const grandTotal = baseTotal + addOnTotal;

  const handleAddToCart = async (destination = "cart") => {
    if (!localStorage.getItem('access_token')) {
      window.location.href = '/login';
      return;
    }

    if (!result) return;
    
    const breakdownNames = result.price_breakdown?.items?.map(i => `${i.quantity}x ${i.product_name}`).join(", ") || "Custom arrangement";
    
    const compositionArray = result.price_breakdown?.items?.map(i => ({
      product_id: i.product_id,
      name: i.product_name,
      quantity: i.quantity
    })) || [];

    const selectedAddOnObjects = selectedAddOns.map(id => {
      const addon = liveAddOns.find(a => a.id === id);
      return { id: addon.id, name: addon.name, price: parseFloat(addon.price), qty: 1 };
    });

    const cartItem = {
      id: result.arrangement_id || `arr-${Date.now()}`,
      group: "Custom AI Arrangement",
      groupIcon: "",
      name: customName || arrangementName,
      desc: `Contains: ${breakdownNames}.`,
      qty: 1,
      price: baseTotal,
      totalPrice: grandTotal,
      addOns: selectedAddOnObjects,
      composition: compositionArray,
      cardMessage: cardMessage.trim() ? cardMessage.trim() : null,
      checked: true,
      img: result.generated_image_url,
      imgLabel: null,
      branch: currentBranch
    };
    
    // 🚀 THE FIX: Wrap the API call in try/catch so it doesn't fail silently
    try {
      console.log("Attempting to add to cart:", cartItem);
      await addToCart(cartItem);
      
      // If it succeeds, navigate to the cart/checkout!
      console.log("Success! Navigating to:", destination);
      onNavigate(destination);
      
    } catch (error) {
      console.error("Cart API Error:", error);
      alert("Something went wrong adding this to your cart. Please check the console.");
    }
  }

  const handleTryAlternative = (field, productId) => {
    const catMap = { flower_id: "flower", vase_id: "vase", wrapping_id: "wrapping", accessory_id: "accessory" }
    const category = catMap[field]
    if (category) {
      setSelectedMaterials(prev => ({ ...prev, [category]: productId }))
      setUnavailableItems([])
    }
  }

  const resetAll = () => {
    setResult(null); 
    setUnavailableItems([]); 
    setSelectedAddOns([]);
    setCardMessage("");
    setShowAIPanel(false);
    setGeneratedCardMsg("");
  }

  const arrangementName = result?.price_breakdown?.items?.[0]?.product_name || "AI Arrangement"
  const cleanProductName = (name) => (name || "").replace(/\s*-\s*[^-]+$/, "").trim()
  const arrangementDesc = (() => {
    if (!result) return ""
    const parts = (result.price_breakdown?.items || []).map(i => `${i.quantity} ${cleanProductName(i.product_name)}`)
    if (parts.length === 0) return "A custom arrangement featuring your selected materials."
    const list = parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`
    return `A custom arrangement featuring ${list}.`
  })()

  return (
    <>
    <div className="min-h-screen flex items-start justify-center" style={{ background: pageBg }}>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        <div className="text-center mb-6" style={{ animation: "daRise 0.6s ease 0.05s both" }}>
          <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase mb-2" style={{ color: accentG }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#f472b6" }} />
            Make It Personal
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#fbbf24" }} />
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-2" style={{ color: accentDG }}>
            <span className="shine-text" style={{ "--shine-base": accentDG }}>Describe Your</span> <span className="shine-text" style={{ "--shine-base": accentPink }}>Dream Bouquet</span>
          </h1>
          <p className="text-sm sm:text-base max-w-xl mx-auto" style={{ color: bodyC }}>
            Tell us what you imagine, and our AI will bring it to life in seconds.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">

          {/* ── Left column ── */}
          <div className="space-y-5" style={{ animation: "daRise 0.6s ease 0.16s both" }}>
            <div className="backdrop-blur-sm border rounded-3xl p-6 sm:p-7"
              style={{ backgroundColor: cardBg, borderColor: cardBdr, boxShadow: cardShadow }}>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: iconCircleBg, color: accentG }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </span>
                <h2 className="text-lg font-bold" style={{ color: headingC }}>Describe your arrangement</h2>
              </div>
              <p className="text-sm ml-11 mb-4" style={{ color: mutedC }}>Build your bouquet with just a prompt.</p>

              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value.slice(0, MAX))}
                onFocus={() => setPromptFocused(true)}
                onBlur={() => setPromptFocused(false)}
                placeholder={typedPlaceholder || "Describe the bouquet you have in mind..."}
                rows={4}
                className="w-full px-5 py-4 text-base border rounded-2xl focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 transition resize-none leading-relaxed"
                style={{ backgroundColor: inputBg, borderColor: inputBdr, color: inputText }}
              />

              {error && (
                <div className="mt-3 flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
                  style={{ backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "#fef2f2", border: `1px solid ${isDark ? "rgba(239,68,68,0.3)" : "#fecaca"}`, color: isDark ? "#fca5a5" : "#dc2626" }}>
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between mt-2.5">
                <span className="text-sm" style={{ color: mutedC }}>{prompt.length} / {MAX}</span>
                <button
                  onClick={() => setPrompt(EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)])}
                  className="text-sm font-semibold hover:underline"
                  style={{ color: accentG }}
                >
                  Use an example
                </button>
              </div>

              <div className="mt-5 border-t pt-4" style={{ borderColor: dividerC }}>
                <button
                  onClick={() => setShowMaterials(p => !p)}
                  className="flex items-center justify-start gap-2 text-sm font-semibold transition text-left w-full"
                  style={{ color: subHeadC }}
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0 transition-transform"
                    style={{ transform: showMaterials ? "rotate(180deg)" : "rotate(0)" }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                  <span className="text-left">{showMaterials ? "Hide" : "Add"} optional materials (flowers, vase, wrapping, accessories)</span>
                </button>

                {showMaterials && (
                  <div className="mt-4 space-y-5">
                    {fetchingProducts ? (
                      <p className="text-sm" style={{ color: mutedC }}>Loading products...</p>
                    ) : (
                      MATERIAL_CATEGORIES.map(({ key, label }) => {
                        const categoryProducts = getProductsByCategory(key)
                        if (categoryProducts.length === 0) return null
                        return (
                          <div key={key}>
                            <p className="text-sm font-semibold mb-2.5" style={{ color: subHeadC }}>{label}</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                              {categoryProducts.map(p => {
                                const branchStock = currentBranch === "Pampanga" ? p.stock_pampanga : (p.stock_manila ?? p.stock);
                                const isOutOfStock = branchStock <= 0 || !p.is_available;
                                return (
                                  <button
                                    key={p.id}
                                    disabled={isOutOfStock}
                                    onClick={() => !isOutOfStock && toggleMaterial(key, p.id)}
                                    className="relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all text-left overflow-hidden"
                                    style={{
                                      borderColor: selectedMaterials[key] === p.id ? accentG : tileBdr,
                                      backgroundColor: isOutOfStock ? (isDark ? "#0f172a" : "#f9fafb") : (selectedMaterials[key] === p.id ? tileSelBg : tileBg),
                                      opacity: isOutOfStock ? 0.6 : 1,
                                      cursor: isOutOfStock ? "not-allowed" : "pointer",
                                      filter: isOutOfStock ? "grayscale(100%)" : "none"
                                    }}
                                  >
                                    {isOutOfStock && (
                                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/10 backdrop-blur-[1px]">
                                        <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">Out of Stock</span>
                                      </div>
                                    )}

                                    {p.image_url ? (
                                      <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                                    ) : (
                                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xs" style={{ backgroundColor: tilePlaceBg, color: mutedC }}>No img</div>
                                    )}
                                    
                                    <span className="text-[11px] font-medium leading-tight text-center truncate w-full" style={{ color: subHeadC }}>{p.name}</span>
                                    
                                    <span className="text-[11px] font-semibold" style={{ color: isOutOfStock ? "#ef4444" : mutedC }}>
                                      {isOutOfStock ? "Unavailable" : `₱${(+p.price).toLocaleString()}`}
                                    </span>

                                    {selectedMaterials[key] === p.id && !isOutOfStock && (
                                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: accentG }}>
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke={isDark ? "#08120c" : "#ffffff"}>
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>

              {aiUsage && aiUsage.remaining === 0 && (
                <div className="mt-4 px-4 py-3 rounded-xl text-sm"
                  style={{ backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "#fef2f2", border: `1px solid ${isDark ? "rgba(239,68,68,0.3)" : "#fee2e2"}`, color: isDark ? "#fca5a5" : "#dc2626" }}>
                  You have reached your daily limit of {aiUsage.limit} AI generations. Please try again tomorrow.
                </div>
              )}
              {aiUsage && aiUsage.remaining > 0 && aiUsage.remaining <= 2 && (
                <div className="mt-4 px-4 py-3 rounded-xl text-sm"
                  style={{ backgroundColor: isDark ? "rgba(245,158,11,0.12)" : "#fffbeb", border: `1px solid ${isDark ? "rgba(245,158,11,0.3)" : "#fef3c7"}`, color: isDark ? "#fcd34d" : "#b45309" }}>
                  You have {aiUsage.remaining} AI generation{aiUsage.remaining !== 1 ? "s" : ""} left today.
                </div>
              )}

              <div className="flex items-center justify-between mt-5 gap-4">
                <div className="flex items-center gap-2 text-sm" style={{ color: bodyC }}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ color: accentG }}>
                    <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  {aiUsage ? (
                    <span>{aiUsage.remaining} / {aiUsage.limit} AI generations left today</span>
                  ) : (
                    <span>Loading AI usage...</span>
                  )}
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={!customizationEnabled || !prompt.trim() || loading || (aiUsage?.remaining === 0)}
                  className="flex items-center justify-center gap-2 px-7 py-3.5 text-base font-bold text-white rounded-2xl transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
                  style={{ background: customizationEnabled && prompt.trim() && aiUsage?.remaining !== 0 ? "linear-gradient(135deg, #e879a0, #f43f5e)" : (isDark ? "#475569" : "#d1d5db") }}
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      Create my bouquet
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>

            {unavailableItems.length > 0 && (
              <div className="border rounded-2xl p-6"
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
                        <span className="font-medium" style={{ color: subHeadC }}>{item.product_name}</span>: {item.reason}
                      </p>
                      {item.alternatives && item.alternatives.length > 0 && (
                        <div className="mt-2.5">
                          <p className="text-xs mb-2" style={{ color: mutedC }}>Suggested alternatives:</p>
                          <div className="flex gap-2 flex-wrap">
                            {item.alternatives.map(alt => (
                              <button
                                key={alt.product_id}
                                onClick={() => handleTryAlternative(item.field, alt.product_id)}
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
                <p className="text-sm mt-3" style={{ color: mutedC }}>Select an alternative above, then click "Create my bouquet" again.</p>
              </div>
            )}

            {result && result.success && (
              <div className="border rounded-3xl overflow-hidden"
                style={{ backgroundColor: cardBg, borderColor: cardBdr, boxShadow: cardShadow }}>

                {/* ── Header ── */}
                <div className="px-7 pt-6 flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <svg className="w-5 h-5" style={{ color: isDark ? "#f9a8d4" : "#f472b6" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-base font-bold" style={{ color: subHeadC }}>Your arrangement</span>
                    <span className="text-sm" style={{ color: mutedC }}>(preview & order)</span>
                  </div>
                  <button onClick={resetAll} className="px-3 py-1.5 rounded-lg text-sm transition hover:bg-gray-100 dark:hover:bg-slate-800" style={{ color: mutedC }}>
                    Reset
                  </button>
                </div>

                {/* ── Top zone: image + meta ── */}
                <div className="px-7 grid grid-cols-1 md:grid-cols-[380px_1fr] gap-6 mb-0">
                  {/* Image */}
                  <div
                    className="relative w-full h-[340px] md:h-[420px] rounded-2xl overflow-hidden border flex-shrink-0 cursor-zoom-in group"
                    style={{ borderColor: dividerC, backgroundColor: tilePlaceBg, boxShadow: cardShadow }}
                    onClick={() => result.generated_image_url && setLightboxOpen(true)}
                  >
                    {result.generated_image_url ? (
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
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center px-3">
                        <p className="text-sm mb-1" style={{ color: faintC }}>No image generated</p>
                        <p className="text-sm font-medium" style={{ color: mutedC }}>{arrangementName}</p>
                      </div>
                    )}
                  </div>

                  {/* Right meta */}
                  <div className="flex flex-col gap-5 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: mutedC }}>Arrangement name</label>
                      <input
                        type="text"
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        className="w-full px-4 py-2.5 text-base font-semibold border rounded-xl focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 transition"
                        style={{ backgroundColor: inputBg, borderColor: inputBdr, color: inputText }}
                        placeholder="Name your arrangement"
                      />
                    </div>

                    <p className="text-sm leading-relaxed" style={{ color: bodyC }}>{arrangementDesc}</p>

                    {result.price_breakdown?.items?.length > 0 && (
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: mutedC }}>Materials used</label>
                        <div className="grid gap-x-3 gap-y-1.5 p-3 rounded-xl border text-xs" style={{ gridTemplateColumns: "auto 1fr auto", borderColor: softBdr, backgroundColor: subtleBoxBg }}>
                          {result.price_breakdown.items.map((item, idx) => (
                            <div key={idx} className="contents">
                              <span className="inline-flex items-center gap-1.5 font-semibold whitespace-nowrap self-center" style={{ color: subHeadC }}>
                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: accentG }} />
                                {item.material_type}
                              </span>
                              <span className="min-w-0 truncate self-center" style={{ color: bodyC }}>{item.product_name}</span>
                              <span className="self-center text-right">
                                {item.quantity > 1 && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap" style={{ color: mutedC, backgroundColor: isDark ? "#1e293b" : "#f3f4f6" }}>×{item.quantity}</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Prominent Disclaimer Moved Right Under Image ── */}
                <div className="mx-7 mt-6 mb-2 p-4 flex items-start gap-3 rounded-2xl border" 
                     style={{ borderColor: isDark ? "rgba(59,130,246,0.2)" : "#bfdbfe", backgroundColor: isDark ? "rgba(59,130,246,0.05)" : "#eff6ff" }}>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5" 
                       style={{ backgroundColor: isDark ? "rgba(59,130,246,0.15)" : "#dbeafe", color: isDark ? "#60a5fa" : "#3b82f6" }}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold mb-1" style={{ color: isDark ? "#93c5fd" : "#1e40af" }}>AI Concept Preview</p>
                    <p className="text-xs leading-relaxed" style={{ color: isDark ? "#bfdbfe" : "#1e3a8a" }}>
                      This image is an AI-generated concept to show the overall color palette and vibe. Your final handcrafted arrangement will strictly follow the exact stem counts and materials listed below in your <strong>Cost breakdown</strong>.
                    </p>
                  </div>
                </div>

                {/* ── Sections ── */}
                <div className="px-7 pb-2 mt-3 flex flex-col divide-y" style={{ borderColor: softBdr }}>
                  <div style={{ borderTopColor: softBdr, borderTopWidth: 1 }} />

                  {/* Add-ons */}
                  <div className="py-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold" style={{ color: subHeadC }}>
                        Add-ons <span className="text-xs font-normal" style={{ color: mutedC }}>(optional)</span>
                      </p>
                    </div>
                    {liveAddOns.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          {(showAllAddons ? liveAddOns : liveAddOns.slice(0, 4)).map(a => {
                            const isUnavailable = a.stock <= 0 || a.is_available === false
                            const on = selectedAddOns.includes(a.id) && !isUnavailable
                            return (
                              <button key={a.id}
                                disabled={isUnavailable}
                                onClick={() => !isUnavailable && toggleAddOn(a.id)}
                                className="flex items-center gap-2.5 p-2 rounded-xl text-left transition-all relative overflow-hidden"
                                style={{
                                  border: `1.5px solid ${on ? accentG : (isDark ? "#1e293b" : "#e5e7eb")}`,
                                  background: on ? (isDark ? "rgba(74,222,128,0.12)" : "#f0fdf4") : (isDark ? "#0f172a" : "white"),
                                  opacity: isUnavailable ? 0.5 : 1,
                                  filter: isUnavailable ? "grayscale(100%)" : "none",
                                  cursor: isUnavailable ? "not-allowed" : "pointer"
                                }}>
                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: isDark ? "#1e293b" : "#f3f4f6" }}>
                                  <img src={a.image_url} alt={a.name} className="w-full h-full object-cover" onError={e => e.target.style.display = "none"} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold truncate" style={{ color: isDark ? "#e2e8f0" : "#111827" }}>{a.name}</p>
                                  <p className="text-[11px] font-semibold mt-0.5" style={{ color: isUnavailable ? mutedC : accentG }}>
                                    {isUnavailable ? "Unavailable" : `+₱${a.price}`}
                                  </p>
                                </div>
                                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mr-1"
                                  style={{
                                    border: `2px solid ${on ? accentG : (isDark ? "#334155" : "#d1d5db")}`,
                                    background: on ? accentG : "transparent"
                                  }}>
                                  {on && <svg width="8" height="8" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                        {liveAddOns.length > 4 && (
                          <button onClick={() => setShowAllAddons(!showAllAddons)} className="text-xs font-semibold mt-3 hover:underline" style={{ color: accentG }}>
                            {showAllAddons ? "Show less" : "See more options"}
                          </button>
                        )}
                      </>
                    ) : (
                      <p className="text-xs" style={{ color: mutedC }}>No add-ons available right now.</p>
                    )}
                  </div>

                  {/* Greeting card */}
                  <div className="py-5">
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
                        {generatingCard ? (
                          <div className="w-full rounded-lg border" style={{ borderColor: tileBdr, backgroundColor: subtleBoxBg }}>
                            <FlowerLoader message="Writing your message..." isDark={isDark} size={58} minHeight="130px" />
                          </div>
                        ) : (
                          <button onClick={handleGenerateCard}
                            className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 border-none text-white cursor-pointer hover:opacity-90 transition"
                            style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
                            Generate message
                          </button>
                        )}
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
                      <textarea
                        value={cardMessage}
                        onChange={e => setCardMessage(e.target.value.slice(0, 160))}
                        placeholder="Write a warm, kind message..."
                        rows={3}
                        className="w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-1 focus:ring-green-600 transition resize-none"
                        style={{ backgroundColor: inputBg, borderColor: inputBdr, color: inputText }}
                      />
                    )}
                    {!showAIPanel && <p className="text-[10px] text-right mt-1" style={{ color: mutedC }}>{cardMessage.length} / 160</p>}
                  </div>

                  {/* Cost breakdown */}
                  <div className="py-5">
                    <p className="text-sm font-semibold mb-3" style={{ color: subHeadC }}>Cost breakdown</p>
                    <div className="rounded-xl border overflow-hidden" style={{ borderColor: tileBdr }}>
                      <table className="w-full text-sm border-collapse">
                        <tbody>
                          {result.price_breakdown?.items?.map((item, idx) => (
                            <tr key={idx} className="border-b" style={{ borderColor: tableRowBdr }}>
                              <td className="px-3 py-2.5" style={{ color: bodyC }}>
                                {item.product_name}
                                {item.quantity > 1 && (
                                  <span className="ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-md" style={{ color: mutedC, backgroundColor: isDark ? "#0f172a" : "#f3f4f6" }}>×{item.quantity}</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-right font-medium whitespace-nowrap" style={{ color: subHeadC }}>₱{(+item.subtotal).toLocaleString()}</td>
                            </tr>
                          ))}
                          {selectedAddOns.map(id => {
                            const addon = liveAddOns.find(a => a.id === id)
                            if (!addon) return null
                            return (
                              <tr key={`addon-${id}`} className="border-b" style={{ borderColor: tableRowBdr }}>
                                <td className="px-3 py-2.5" style={{ color: bodyC }}>
                                  <span style={{ color: accentG }} className="font-bold mr-1">+</span>{addon.name}
                                  <span className="ml-1 text-xs" style={{ color: mutedC }}>(add-on)</span>
                                </td>
                                <td className="px-3 py-2.5 text-right font-medium whitespace-nowrap" style={{ color: subHeadC }}>₱{(+addon.price).toLocaleString()}</td>
                              </tr>
                            )
                          })}
                          <tr style={{ backgroundColor: totalRowBg }}>
                            <td className="px-3 py-3 text-base font-bold" style={{ color: headingC }}>Grand total</td>
                            <td className="px-3 py-3 text-right text-base font-bold whitespace-nowrap" style={{ color: accentDG }}>₱{grandTotal.toLocaleString()}.00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Status chips */}
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {[
                      { label: "Availability", value: "In stock" },
                      { label: "Popularity", value: "Top pick" },
                      { label: "Maintenance", value: "Easy care" },
                      { label: "AI uses left", value: `${result.remaining_generations} today` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col items-center py-2.5 px-2 rounded-xl border text-center"
                        style={{ borderColor: tileBdr, backgroundColor: subtleBoxBg }}>
                        <svg className="w-4 h-4 mb-1" style={{ color: accentG }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-xs font-semibold" style={{ color: subHeadC }}>{value}</p>
                        <p className="text-[11px] leading-tight mt-0.5" style={{ color: mutedC }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── CTA buttons ── */}
                <div className="flex gap-3 px-7 pb-6 mt-1">
                  <button onClick={() => handleAddToCart("cart")}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-white rounded-xl transition-all hover:brightness-110 active:scale-[0.98]"
                    style={{ background: `linear-gradient(135deg, ${DG}, ${G})`, boxShadow: "0 6px 18px rgba(46,139,52,0.32)" }}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add to cart
                  </button>
                  <button onClick={() => handleAddToCart("checkout")}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold rounded-xl transition-all hover:brightness-105 active:scale-[0.98]"
                    style={{ border: `2px solid ${accentG}`, color: accentG, backgroundColor: isDark ? "rgba(74,222,128,0.06)" : "transparent" }}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                    </svg>
                    Buy now
                  </button>
                </div>

                {/* ── Footer note ── */}
                <div className="px-7 pb-5 flex items-start justify-end gap-2 border-t pt-4" style={{ borderColor: dividerC }}>
                  <span className="text-[11px] font-bold flex-shrink-0 ml-2" style={{ color: mutedC }}>Powered by pollinations.ai</span>
                </div>

              </div>
            )}
          </div>

          {/* Prompt Tips Sidebar */}
          <div className="backdrop-blur-sm border rounded-3xl p-7 self-start"
            style={{ backgroundColor: cardBg, borderColor: cardBdr, boxShadow: isDark ? "0 12px 40px rgba(0,0,0,0.4)" : "0 12px 40px rgba(12,87,62,0.06)", animation: "daRise 0.6s ease 0.26s both" }}>
            <div className="flex items-center gap-2.5 mb-5">
              <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: iconCircleBg, color: accentG }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.5.37.85.92.95 1.55l.1.65h5.1l.1-.65c.1-.63.45-1.18.95-1.55A6 6 0 0 0 12 3Z" />
                </svg>
              </span>
              <h3 className="text-base font-bold" style={{ color: subHeadC }}>Prompt Tips</h3>
            </div>
            <div className="space-y-6">
              {PROMPT_TIPS.map((tip, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: isDark ? "rgba(74,222,128,0.14)" : "rgba(46,139,52,0.12)", color: accentG }}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: subHeadC }}>{tip.title}</span>
                  </div>
                  <p className="text-sm leading-relaxed ml-8" style={{ color: bodyC }}>{tip.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    {loading && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ backgroundColor: isDark ? "rgba(8,15,10,0.6)" : "rgba(12,87,62,0.35)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
        <div className="w-full max-w-md rounded-3xl px-8 py-10 text-center shadow-2xl"
          style={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", animation: "daPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}>
          <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(244,114,182,0.18), rgba(46,139,52,0.14))" }}>
            <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" style={{ animation: "daBob 2.6s ease-in-out infinite" }}>
              <path d="M24 30V44" stroke="#2E8B34" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M24 38c-3.5 0-6.3-2-7-5.2 3.5-.6 6.3 1.2 7 5.2Z" fill="#34a853" />
              <path d="M24 34c3-0.2 5.6-2 6.4-4.8-3.2-0.4-5.8 1.4-6.4 4.8Z" fill="#2E8B34" />
              {[0,60,120,180,240,300].map(deg => (
                <ellipse key={deg} cx="24" cy="12" rx="5.2" ry="8" fill="#f472b6" transform={`rotate(${deg} 24 22)`} />
              ))}
              {[30,90,150,210,270,330].map(deg => (
                <ellipse key={deg} cx="24" cy="15" rx="3.2" ry="5" fill="#ec4899" opacity="0.45" transform={`rotate(${deg} 24 22)`} />
              ))}
              <circle cx="24" cy="22" r="6" fill="#fbbf24" />
              <circle cx="24" cy="22" r="3.2" fill="#f59e0b" />
            </svg>
          </div>

          <h3 className="text-xl font-bold mb-1.5" style={{ color: accentDG }}>Creating your bouquet</h3>
          <p className="text-sm mb-7" style={{ color: mutedC }}>Arranging every petal just for you...</p>

          <div className="relative w-full mb-2" style={{ paddingTop: "12px" }}>
            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? "#0f172a" : "#f1ece6" }}>
              <div className="h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg, #f472b6, #fbbf24 55%, #2E8B34)" }} />
            </div>
            <div className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out" style={{ left: `${progress}%`, top: "17px" }}>
              <svg className="w-[30px] h-[30px]" viewBox="0 0 24 24" fill="none" style={{ animation: "daSpin 4s linear infinite", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>
                {[0,72,144,216,288].map(deg => (
                  <ellipse key={deg} cx="12" cy="6.5" rx="2.8" ry="4.2" fill="#f472b6" transform={`rotate(${deg} 12 12)`} />
                ))}
                <circle cx="12" cy="12" r="3.4" fill="#fbbf24" />
                <circle cx="12" cy="12" r="1.6" fill="#f59e0b" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-semibold mb-7" style={{ color: mutedC }}>{Math.round(progress)}%</p>

          <div className="rounded-2xl px-5 py-4 text-left" style={{ backgroundColor: isDark ? "rgba(219,39,119,0.1)" : "#fdf2f8", border: `1px solid ${isDark ? "rgba(219,39,119,0.3)" : "#fbcfe8"}` }}>
            <p className="text-xs font-bold tracking-wider uppercase mb-1.5" style={{ color: isDark ? "#f9a8d4" : "#db2777" }}>Did you know?</p>
            <p key={factIdx} className="text-sm leading-relaxed" style={{ color: isDark ? "#cbd5e1" : "#4b5563", animation: "daFade 0.5s ease both" }}>
              {FLOWER_FACTS[factIdx]}
            </p>
          </div>
        </div>
      </div>
    )}

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

    <style>{`
      @keyframes daPop  { from { opacity:0; transform:scale(0.94) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
      @keyframes daRise { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
      @keyframes daFade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      @keyframes daSpin { to { transform:rotate(360deg); } }
      @keyframes daBob  { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-3px); } }
      @keyframes titleShine { to { background-position: -200% 0; } }
      .shine-text { background-image: linear-gradient(110deg, var(--shine-base) 0%, var(--shine-base) 42%, #ffffff 50%, var(--shine-base) 58%, var(--shine-base) 100%); background-size: 200% 100%; background-position: 0% 0; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; will-change: background-position; animation: titleShine 3.5s linear infinite; }
      @media (prefers-reduced-motion: reduce) { .shine-text { animation: none; } }
    `}</style>
    </>
  )
}
