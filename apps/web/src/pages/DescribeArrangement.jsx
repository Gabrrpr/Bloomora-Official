import { useState, useEffect } from "react"
import { api } from "../services/api.js"
import { addToCart } from "../utils/cart.js"

const G = "#2E8B34"

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
  { key: "flower", label: "Flowers", icon: "🌸" },
  { key: "vase", label: "Vases", icon: "🏺" },
  { key: "wrapping", label: "Wrappings", icon: "🎁" },
  { key: "accessory", label: "Accessories", icon: "✨" },
]

export default function DescribeArrangement({ onNavigate }) {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [products, setProducts] = useState([])
  const [selectedMaterials, setSelectedMaterials] = useState({ flower: null, vase: null, wrapping: null, accessory: null })
  const [showMaterials, setShowMaterials] = useState(false)
  const [aiUsage, setAiUsage] = useState(null)
  const [unavailableItems, setUnavailableItems] = useState([])
  const [fetchingProducts, setFetchingProducts] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [customName, setCustomName] = useState("")
  const MAX = 500

  useEffect(() => {
    async function load() {
      try {
        const [productsRes, usageRes] = await Promise.all([
          api.getProducts(),
          api.getAiUsage().catch(() => ({ remaining: 5, limit: 5 })),
        ])
        setProducts(Array.isArray(productsRes) ? productsRes : productsRes.products || [])
        setAiUsage(usageRes)
      } catch (e) {
        console.error("Failed to load products", e)
      } finally {
        setFetchingProducts(false)
      }
    }
    load()
  }, [])

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
    if (!prompt.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    setUnavailableItems([])

    try {
      const payload = {
        prompt_text: prompt.trim(),
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
        // Enrich price_breakdown items with actual DB prices
        if (data.price_breakdown?.items) {
          data.price_breakdown.items = data.price_breakdown.items.map(item => {
            const dbPrice = getProductPrice(item.product_id)
            const qty = item.quantity || 1
            return {
              ...item,
              unit_price: dbPrice > 0 ? dbPrice : item.unit_price,
              subtotal: dbPrice > 0 ? dbPrice * qty : item.subtotal,
            }
          })
          // Recalculate total from actual DB prices
          data.price_breakdown.total_price = data.price_breakdown.items.reduce(
            (sum, item) => sum + item.subtotal, 0
          )
        }
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
      groupIcon: "✨",
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
    <div className="min-h-screen" style={{ backgroundColor: "#F7F8FA" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_280px] gap-5">

          {/* ── Left column ── */}
          <div className="space-y-4">

            {/* Prompt card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h2 className="text-sm font-semibold text-gray-700">Describe your arrangement</h2>
              </div>
              <p className="text-xs text-gray-400 ml-7 mb-4">Build your bouquet with just a prompt.</p>

              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value.slice(0, MAX))}
                placeholder="I'm ordering this for Valentine's Day. She likes pink and soft, romantic styles. I want it to look elegant and sweet, not too big, with light flowers around it and a ribbon. Something that feels special and classy."
                rows={5}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 transition resize-none placeholder-gray-300 leading-relaxed"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{prompt.length} / {MAX}</span>
                <button
                  onClick={() => setPrompt(EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)])}
                  className="text-xs font-medium hover:underline"
                  style={{ color: G }}
                >
                  Use an example
                </button>
              </div>

              {/* Optional Materials toggle */}
              <div className="mt-4 border-t border-gray-100 pt-3">
                <button
                  onClick={() => setShowMaterials(p => !p)}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-800 transition"
                >
                  <svg
                    className="w-3.5 h-3.5 transition-transform"
                    style={{ transform: showMaterials ? "rotate(180deg)" : "rotate(0)" }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                  {showMaterials ? "Hide" : "Add"} optional materials (flowers, vase, wrapping, accessories)
                </button>

                {showMaterials && (
                  <div className="mt-3 space-y-4">
                    {fetchingProducts ? (
                      <p className="text-xs text-gray-400">Loading products...</p>
                    ) : (
                      MATERIAL_CATEGORIES.map(({ key, label, icon }) => {
                        const categoryProducts = getProductsByCategory(key)
                        if (categoryProducts.length === 0) return null
                        return (
                          <div key={key}>
                            <p className="text-xs font-semibold text-gray-600 mb-2">{icon} {label}</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {categoryProducts.map(p => (
                                <button
                                  key={p.id}
                                  onClick={() => toggleMaterial(key, p.id)}
                                  className="relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-left"
                                  style={{
                                    borderColor: selectedMaterials[key] === p.id ? G : "#e5e7eb",
                                    backgroundColor: selectedMaterials[key] === p.id ? "#F0F7F1" : "white",
                                  }}
                                >
                                  {p.image_url ? (
                                    <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded object-cover" />
                                  ) : (
                                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">No img</div>
                                  )}
                                  <span className="text-[10px] font-medium text-gray-700 leading-tight text-center truncate w-full">{p.name}</span>
                                  <span className="text-[10px] text-gray-400">₱{(+p.price).toLocaleString()}</span>
                                  {selectedMaterials[key] === p.id && (
                                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: G }}>
                                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <div className="mt-3 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600">
                  You have reached your daily limit of {aiUsage.limit} AI generations. Please try again tomorrow.
                </div>
              )}
              {aiUsage && aiUsage.remaining > 0 && aiUsage.remaining <= 2 && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-700">
                  ⚠️ You have {aiUsage.remaining} AI generation{aiUsage.remaining !== 1 ? "s" : ""} left today.
                </div>
              )}

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" style={{ color: G }}>
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
                  disabled={!prompt.trim() || loading || (aiUsage?.remaining === 0)}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
                  style={{ background: prompt.trim() && aiUsage?.remaining !== 0 ? "linear-gradient(135deg, #e879a0, #f43f5e)" : "#d1d5db" }}
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      Create my bouquet
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-white border border-red-200 rounded-xl p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Unavailable items */}
            {unavailableItems.length > 0 && (
              <div className="bg-white border border-amber-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-gray-700">Some items are unavailable</h3>
                </div>
                <div className="space-y-3">
                  {unavailableItems.map(item => (
                    <div key={item.field} className="border border-gray-100 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">
                        <span className="font-medium text-gray-700">{item.product_name}</span> — {item.reason}
                      </p>
                      {item.alternatives && item.alternatives.length > 0 && (
                        <div className="mt-2">
                          <p className="text-[10px] text-gray-400 mb-1.5">Suggested alternatives:</p>
                          <div className="flex gap-2 flex-wrap">
                            {item.alternatives.map(alt => (
                              <button
                                key={alt.product_id}
                                onClick={() => handleTryAlternative(item.field, alt.product_id)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-all hover:bg-green-50"
                                style={{ borderColor: "#bbf7d0", color: G }}
                              >
                                {alt.image_url && <img src={alt.image_url} alt="" className="w-5 h-5 rounded object-cover" />}
                                <span className="font-medium">{alt.product_name}</span>
                                <span className="text-gray-400">₱{(+alt.price).toLocaleString()}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">Select an alternative above, then click "Create my bouquet" again.</p>
              </div>
            )}

            {/* Result card */}
            {result && result.success && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 pt-5 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-700">Final result</span>
                    <span className="text-xs text-gray-400">Preview and analysis</span>
                  </div>
                  <button
                    onClick={() => { setResult(null); setUnavailableItems([]) }}
                    className="p-1.5 hover:bg-gray-50 rounded-lg transition text-xs text-gray-400"
                  >
                    Reset
                  </button>
                </div>

                <div className="px-5 pb-5 flex gap-5">
                  {/* AI Generated Image */}
                  <div
                    className="w-44 h-52 rounded-xl flex-shrink-0 flex items-center justify-center border border-gray-100 overflow-hidden bg-gray-50 cursor-pointer hover:opacity-90 transition"
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
                        <p className="text-xs text-gray-300 mb-1">No image generated</p>
                        <p className="text-xs text-gray-400 font-medium">{arrangementName}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="mb-2">
                      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Arrangement Name</label>
                      <input
                        type="text"
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        className="w-full mt-1 px-3 py-2 text-sm font-semibold text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 transition"
                        placeholder="Name your arrangement"
                      />
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mb-4">{arrangementDesc}</p>

                    {/* Materials Used */}
                    {result.price_breakdown?.items?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Materials Used</p>
                        <div className="flex flex-wrap gap-2">
                          {result.price_breakdown.items.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs"
                              style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: G }} />
                              <span className="font-medium text-gray-700">{item.material_type}:</span>
                              <span className="text-gray-500">{item.product_name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {/* Cost Breakdown — actual DB prices */}
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2">Cost Breakdown</p>
                        <div className="space-y-1">
                          {result.price_breakdown?.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-gray-500">{item.product_name} × {item.quantity || 1}</span>
                              <span className="text-gray-700 font-medium">₱{(+item.subtotal).toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="border-t border-gray-100 pt-1.5 flex justify-between text-sm font-bold text-gray-800">
                            <span>Total</span>
                            <span>₱{(+result.price_breakdown?.total_price).toLocaleString()}.00</span>
                          </div>
                        </div>
                      </div>

                      {/* Availability info */}
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2">Flower Availability</p>
                        <div className="text-xs space-y-1 mb-3">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Generated</span>
                            <span className="text-green-600 font-medium">Available</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Remaining AI uses</span>
                            <span className="text-gray-700">{result.remaining_generations} today</span>
                          </div>
                        </div>
                        <div className="flex gap-3 text-xs">
                          {[{ l: "Availability", s: "10/10" }, { l: "Popular", s: "9/10" }, { l: "Easy to care", s: "9/10" }].map(({ l, s }) => (
                            <div key={l} className="text-center">
                              <svg className="w-4 h-4 mx-auto mb-0.5" style={{ color: G }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                              </svg>
                              <p className="font-semibold text-gray-700">{s}</p>
                              <p className="text-gray-400">{l}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      className="mt-4 w-full py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:brightness-105 active:scale-[0.98]"
                      style={{ backgroundColor: G }}
                    >
                      Add to shopping bag
                    </button>
                  </div>
                </div>

                <div className="px-5 pb-4 flex items-start gap-2 border-t border-gray-100 pt-3">
                  <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-gray-400 flex-1">
                    This is an AI-generated preview. Your bouquet will be prepared based on your selected options, and the price will remain the same.
                  </p>
                  <span className="text-xs font-bold text-gray-400 flex-shrink-0 ml-2">POWERED BY pollinations.ai</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Right column: Prompt Tips ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-24 self-start">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a7 7 0 00-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26A7 7 0 0019 9a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-sm font-semibold text-gray-700">Prompt Tips</h3>
            </div>
            <div className="space-y-5">
              {PROMPT_TIPS.map((tip, i) => (
                <div key={i}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-semibold text-gray-700">{tip.title}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed ml-5">{tip.content}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>

    {/* Lightbox modal for closer look */}
    {lightboxOpen && result?.generated_image_url && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
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
    </>
  )
}

