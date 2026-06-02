import { useState, useEffect, useRef } from "react"
import { api } from "../../services/api.js"
import { addToCart } from "../../utils/cart.js"
import { useTheme } from "../../context/ThemeContext"

const G  = "#2E8B34"
const DG = "#0C573E"

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

export default function DescribeArrangement({ onNavigate }) {
  const { isDark } = useTheme()

  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [products, setProducts] = useState([])
  const [selectedMaterials, setSelectedMaterials] = useState({ flower: null, vase: null, wrapping: null, accessory: null })
  const [showMaterials, setShowMaterials] = useState(false)
  const [customizationEnabled, setCustomizationEnabled] = useState(true)
  const [aiUsage, setAiUsage] = useState(null)
  const [unavailableItems, setUnavailableItems] = useState([])
  const [fetchingProducts, setFetchingProducts] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [customName, setCustomName] = useState("")
  const MAX = 500

  // ── UI-only state: animated typing placeholder + loading progress/fact cycling ──
  const [typedPlaceholder, setTypedPlaceholder] = useState("")
  const [promptFocused, setPromptFocused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [factIdx, setFactIdx] = useState(0)

  // ── Dark-mode color tokens (only affect rendering, never logic) ──
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

  useEffect(() => {
    async function load() {
      try {
        const [toggleRes, productsRes, usageRes] = await Promise.all([
          api.isCustomizationEnabled().catch(() => ({ enabled: true })),
          api.getProducts(),
          api.getAiUsage().catch(() => ({ remaining: 5, limit: 5 })),
        ])
        setCustomizationEnabled(toggleRes.enabled)
        setProducts(Array.isArray(productsRes) ? productsRes : productsRes.products || [])
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

  // ── Animated typing placeholder (types + deletes example prompts) ──
  // Pauses while the user has focused or typed into the box, so it never
  // interferes with real input — purely a visual hint when the field is empty.
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
          timer = setTimeout(tick, 1800) // hold the full line before deleting
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

  // ── Loading: animate a growing progress bar and rotate fun facts ──
  useEffect(() => {
    if (!loading) { setProgress(0); return }
    setProgress(8)
    setFactIdx(Math.floor(Math.random() * FLOWER_FACTS.length))

    // Ease the bar upward toward ~90% while we wait for the real response.
    const prog = setInterval(() => {
      setProgress(p => (p >= 90 ? 90 : p + Math.max(1, (92 - p) * 0.08)))
    }, 280)
    // Rotate the fun fact every few seconds.
    const facts = setInterval(() => {
      setFactIdx(i => (i + 1) % FLOWER_FACTS.length)
    }, 3600)

    return () => { clearInterval(prog); clearInterval(facts) }
  }, [loading])


  const getProductsByCategory = (category) =>
    products.filter(p => p.category === category && p.is_available)

  // Look up a product's actual price from DB by id
  const getProductPrice = (productId) => {
    const p = products.find(p => p.id === productId)
    return p ? parseFloat(p.price) : 0
  }

  const getProductName = (productId) => {
    const p = products.find(p => p.id === productId)
    return p ? p.name : ""
  }

  const toggleMaterial = (category, productId) => {
    setSelectedMaterials(prev => ({
      ...prev,
      [category]: prev[category] === productId ? null : productId,
    }))
  }


  const handleGenerate = async () => {
    if (!customizationEnabled) {
      setError("AI Customization is temporarily disabled during peak seasons.")
      return
    }
    if (!prompt.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    setUnavailableItems([])

    try {
      // 🚀 THE FIX: Secretly supercharge the user's prompt!
      
      // 1. Gather all currently available inventory items from your React state
      const availableInventory = products
        .filter(p => p.is_available)
        .map(p => p.name)
        .join(", ");

      // 2. Inject strict camera rules and inventory constraints into the prompt
      const superchargedPrompt = `${prompt.trim()}. 
        Strict visual rules: Professional product photography, front-view, eye-level camera angle, standing upright. DO NOT use a top-down or bird's-eye view. 
        Strict inventory rules: You MUST ONLY utilize flowers, vases, and wrappings from this exact list: [${availableInventory}].`;

      // 3. Send the supercharged prompt to the backend
      const payload = {
        prompt_text: superchargedPrompt, 
        flower_id: selectedMaterials.flower || undefined,
        vase_id: selectedMaterials.vase || undefined,
        wrapping_id: selectedMaterials.wrapping || undefined,
        accessory_id: selectedMaterials.accessory || undefined,
      }
      
      const data = await api.checkAndGenerate(payload)

      if (data.unavailable_items && data.unavailable_items.length > 0) {
        setUnavailableItems(data.unavailable_items)
        setAiUsage(prev => prev ? { ...prev, remaining: data.remaining_generations } : prev)
      } else if (data.success) {
        // Enrich price_breakdown items with actual DB prices AND group duplicates!
        if (data.price_breakdown?.items) {

          // 1. Assign correct DB prices to each raw item
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

          // 2. 🚀 THE FIX: Group the items by name so we don't get "1x Sunflower" three times
          const groupedMap = pricedItems.reduce((acc, item) => {
            const key = item.product_name;
            if (!acc[key]) {
              acc[key] = { ...item }; // First time seeing it, add to list
            } else {
              // We've seen this flower before! Add to its quantity and subtotal
              acc[key].quantity += item.quantity;
              acc[key].subtotal += item.subtotal;
            }
            return acc;
          }, {});

          // 3. Convert our grouped object back into an array for the UI
          data.price_breakdown.items = Object.values(groupedMap);

          // 4. Recalculate the grand total
          data.price_breakdown.total_price = data.price_breakdown.items.reduce(
            (sum, item) => sum + item.subtotal, 0
          )
        }

        // Snap the progress bar to 100% before revealing the result.
        setProgress(100)
        setResult(data)
        setCustomName(data.price_breakdown?.items?.[0]?.product_name || "AI Arrangement")
        setAiUsage(prev => prev ? { ...prev, remaining: data.remaining_generations } : prev)
      } else {
        setError(data.message || "Generation failed. Please try again.")
      }
    } catch (e) {
      setError(e.message || "Failed to generate arrangement. Please try again.")
    } finally {
      setLoading(false)
    }
  }


  const handleAddToCart = () => {
    if (!result) return
    const breakdownNames = result.price_breakdown?.items?.map(i => i.product_name).join(", ") || "Custom arrangement"
    const cartItem = {
      id: result.arrangement_id || `arr-${Date.now()}`,
      group: "Describe your arrangement",
      groupIcon: "",
      name: customName || arrangementName,
      desc: `Custom arrangement: ${breakdownNames}. ${prompt.trim()}`,
      qty: 1,
      price: result.price_breakdown?.total_price || 0,
      checked: true,
      img: result.generated_image_url,
      imgLabel: null,
    }
    addToCart(cartItem)
    onNavigate("cart")
  }

  const handleTryAlternative = (field, productId) => {
    const catMap = { flower_id: "flower", vase_id: "vase", wrapping_id: "wrapping", accessory_id: "accessory" }
    const category = catMap[field]
    if (category) {
      setSelectedMaterials(prev => ({ ...prev, [category]: productId }))
      setUnavailableItems([])
    }
  }

  const arrangementName = result?.price_breakdown?.items?.[0]?.product_name || "AI Arrangement"
  const arrangementDesc = result
    ? `A custom arrangement featuring ${result.price_breakdown?.items?.map(i => i.product_name).join(", ") || "your selected materials"}.`
    : ""

  return (
    <>
    {/* Soft botanical gradient backdrop — replaces the flat grey/white */}
    <div
      className="min-h-screen flex items-start justify-center"
      style={{ background: pageBg }}
    >
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Page heading */}
        <div className="text-center mb-6">
          <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase mb-2" style={{ color: accentG }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#f472b6" }} />
            Make It Personal
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#fbbf24" }} />
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-2" style={{ color: accentDG }}>
            Describe Your <span style={{ color: accentPink }}>Dream Bouquet</span>
          </h1>
          <p className="text-sm sm:text-base max-w-xl mx-auto" style={{ color: bodyC }}>
            Tell us what you imagine, and our AI will bring it to life in seconds.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">

          {/* ── Left column ── */}
          <div className="space-y-5">

            {/* Prompt card */}
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

              {/* Optional Materials toggle */}
              <div className="mt-5 border-t pt-4" style={{ borderColor: dividerC }}>
                <button
                  onClick={() => setShowMaterials(p => !p)}
                  className="flex items-center gap-2 text-sm font-semibold transition"
                  style={{ color: subHeadC }}
                >
                  <svg
                    className="w-4 h-4 transition-transform"
                    style={{ transform: showMaterials ? "rotate(180deg)" : "rotate(0)" }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                  {showMaterials ? "Hide" : "Add"} optional materials (flowers, vase, wrapping, accessories)
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
                              {categoryProducts.map(p => (
                                <button
                                  key={p.id}
                                  onClick={() => toggleMaterial(key, p.id)}
                                  className="relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all text-left"
                                  style={{
                                    borderColor: selectedMaterials[key] === p.id ? accentG : tileBdr,
                                    backgroundColor: selectedMaterials[key] === p.id ? tileSelBg : tileBg,
                                  }}
                                >
                                  {p.image_url ? (
                                    <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xs" style={{ backgroundColor: tilePlaceBg, color: mutedC }}>No img</div>
                                  )}
                                  <span className="text-[11px] font-medium leading-tight text-center truncate w-full" style={{ color: subHeadC }}>{p.name}</span>
                                  <span className="text-[11px]" style={{ color: mutedC }}>₱{(+p.price).toLocaleString()}</span>
                                  {selectedMaterials[key] === p.id && (
                                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: accentG }}>
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke={isDark ? "#08120c" : "#ffffff"}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>

              {/* AI usage warnings */}
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
                  className="flex items-center gap-2 px-7 py-3.5 text-base font-bold text-white rounded-2xl transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
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

            {/* Error */}
            {error && (
              <div className="border rounded-2xl p-5 text-sm"
                style={{ backgroundColor: cardBg, borderColor: isDark ? "rgba(239,68,68,0.3)" : "#fecaca", color: isDark ? "#fca5a5" : "#dc2626" }}>
                {error}
              </div>
            )}

            {/* Unavailable items */}
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
                        <span className="font-medium" style={{ color: subHeadC }}>{item.product_name}</span> — {item.reason}
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

            {/* Result card */}
            {result && result.success && (
              <div className="border rounded-3xl overflow-hidden"
                style={{ backgroundColor: cardBg, borderColor: cardBdr, boxShadow: cardShadow }}>
                <div className="px-7 pt-6 flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <svg className="w-5 h-5" style={{ color: isDark ? "#f9a8d4" : "#f472b6" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-base font-bold" style={{ color: subHeadC }}>Final result</span>
                    <span className="text-sm" style={{ color: mutedC }}>Preview and analysis</span>
                  </div>
                  <button
                    onClick={() => { setResult(null); setUnavailableItems([]) }}
                    className="px-3 py-1.5 rounded-lg transition text-sm"
                    style={{ color: mutedC }}
                  >
                    Reset
                  </button>
                </div>

                <div className="px-7 pb-7 flex flex-col sm:flex-row gap-6">
                  {/* AI Generated Image */}
                  <div
                    className="w-full sm:w-52 h-64 rounded-2xl flex-shrink-0 flex items-center justify-center border overflow-hidden cursor-pointer hover:opacity-90 transition"
                    style={{ borderColor: dividerC, backgroundColor: tilePlaceBg }}
                    onClick={() => result.generated_image_url && setLightboxOpen(true)}
                    title="Click for a closer look"
                  >
                    {result.generated_image_url ? (
                      <img
                        src={result.generated_image_url}
                        alt={arrangementName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center px-3">
                        <p className="text-sm mb-1" style={{ color: faintC }}>No image generated</p>
                        <p className="text-sm font-medium" style={{ color: mutedC }}>{arrangementName}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
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
                              <span style={{ color: bodyC }}>
                                {item.product_name} 
                                {item.quantity > 1 && <span className="ml-1 text-xs font-semibold px-1.5 py-0.5 rounded-md" style={{ color: mutedC, backgroundColor: isDark ? "#0f172a" : "#f3f4f6" }}>× {item.quantity}</span>}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Cost Breakdown — bordered table with row lines */}
                      <div>
                        <p className="text-sm font-semibold mb-2.5" style={{ color: subHeadC }}>Cost Breakdown</p>
                        <div className="rounded-xl border overflow-hidden" style={{ borderColor: tileBdr }}>
                          <table className="w-full text-sm border-collapse">
                            <tbody>
                              {result.price_breakdown?.items?.map((item, idx) => (
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
                                <td className="px-3 py-3 text-right text-base font-bold whitespace-nowrap" style={{ color: accentDG }}>₱{(+result.price_breakdown?.total_price).toLocaleString()}.00</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Availability info — bordered card */}
                      <div>
                        <p className="text-sm font-semibold mb-2.5" style={{ color: subHeadC }}>Flower Availability</p>
                        <div className="rounded-xl border p-4" style={{ borderColor: tileBdr }}>
                          <div className="text-sm space-y-2 mb-4">
                            <div className="flex justify-between pb-2 border-b" style={{ borderColor: tableRowBdr }}>
                              <span style={{ color: bodyC }}>Generated</span>
                              <span className="font-medium" style={{ color: isDark ? "#4ade80" : "#16a34a" }}>Available</span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: bodyC }}>Remaining AI uses</span>
                              <span style={{ color: subHeadC }}>{result.remaining_generations} today</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm pt-1">
                            {[{ l: "Availability", s: "10/10" }, { l: "Popular", s: "9/10" }, { l: "Easy to care", s: "9/10" }].map(({ l, s }) => (
                              <div key={l} className="text-center">
                                <svg className="w-5 h-5 mx-auto mb-1" style={{ color: accentG }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                                </svg>
                                <p className="font-semibold" style={{ color: subHeadC }}>{s}</p>
                                <p className="text-xs leading-tight" style={{ color: mutedC }}>{l}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      className="mt-5 w-full py-3.5 text-base font-bold text-white rounded-xl transition-all hover:brightness-105 active:scale-[0.98]"
                      style={{ backgroundColor: accentG, color: isDark ? "#08120c" : "#ffffff" }}
                    >
                      Add to shopping bag
                    </button>
                  </div>
                </div>

                <div className="px-7 pb-5 flex items-start gap-2 border-t pt-4" style={{ borderColor: dividerC }}>
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: faintC }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm flex-1" style={{ color: mutedC }}>
                    This is an AI-generated preview. Your bouquet will be prepared based on your selected options, and the price will remain the same.
                  </p>
                  <span className="text-xs font-bold flex-shrink-0 ml-2" style={{ color: mutedC }}>POWERED BY pollinations.ai</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Right column: Prompt Tips ── */}
          <div className="backdrop-blur-sm border rounded-3xl p-7 self-start"
            style={{ backgroundColor: cardBg, borderColor: cardBdr, boxShadow: isDark ? "0 12px 40px rgba(0,0,0,0.4)" : "0 12px 40px rgba(12,87,62,0.06)" }}>
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

    {/* ── Loading overlay: blurred backdrop + centered progress + flower facts ── */}
    {loading && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ backgroundColor: isDark ? "rgba(8,15,10,0.6)" : "rgba(12,87,62,0.35)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
        <div className="w-full max-w-md rounded-3xl px-8 py-10 text-center shadow-2xl"
          style={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", animation: "daPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}>
          {/* Bloom icon — soft rose/green halo for the accent palette */}
          <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(244,114,182,0.18), rgba(46,139,52,0.14))" }}>
            <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" style={{ animation: "daBob 2.6s ease-in-out infinite" }}>
              {/* Stem */}
              <path d="M24 30V44" stroke="#2E8B34" strokeWidth="2.4" strokeLinecap="round" />
              {/* Leaves */}
              <path d="M24 38c-3.5 0-6.3-2-7-5.2 3.5-.6 6.3 1.2 7 5.2Z" fill="#34a853" />
              <path d="M24 34c3-.2 5.6-2 6.4-4.8-3.2-.4-5.8 1.4-6.4 4.8Z" fill="#2E8B34" />
              {/* Six rounded petals around the center */}
              {[0,60,120,180,240,300].map(deg => (
                <ellipse key={deg} cx="24" cy="12" rx="5.2" ry="8" fill="#f472b6"
                  transform={`rotate(${deg} 24 22)`} />
              ))}
              {/* Inner petal shading */}
              {[30,90,150,210,270,330].map(deg => (
                <ellipse key={deg} cx="24" cy="15" rx="3.2" ry="5" fill="#ec4899" opacity="0.45"
                  transform={`rotate(${deg} 24 22)`} />
              ))}
              {/* Flower center */}
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
            {/* Flower marker — centered on the bar, riding its leading edge */}
            <div className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out"
              style={{ left: `${progress}%`, top: "17px" }}>
              <svg className="w-[30px] h-[30px]" viewBox="0 0 24 24" fill="none" style={{ animation: "daSpin 4s linear infinite", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>
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
            <p key={factIdx} className="text-sm leading-relaxed" style={{ color: isDark ? "#cbd5e1" : "#4b5563", animation: "daFade 0.5s ease both" }}>
              {FLOWER_FACTS[factIdx]}
            </p>
          </div>
        </div>
      </div>
    )}

    {/* Lightbox modal for closer look */}
    {lightboxOpen && result?.generated_image_url && (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={() => setLightboxOpen(false)}
      >
        <button
          className="absolute top-4 right-4 text-white/80 hover:text-white transition"
          onClick={() => setLightboxOpen(false)}
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img
          src={result.generated_image_url}
          alt={arrangementName}
          className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
          onClick={e => e.stopPropagation()}
        />
      </div>
    )}

    {/* Keyframes for the loading overlay animations */}
    <style>{`
      @keyframes daPop  { from { opacity:0; transform:scale(0.94) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
      @keyframes daFade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      @keyframes daSpin { to { transform:rotate(360deg); } }
      @keyframes daBob  { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-3px); } }
    `}</style>
    </>
  )
}