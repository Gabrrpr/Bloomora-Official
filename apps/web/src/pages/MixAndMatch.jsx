import { useState, useEffect } from "react"
import { api } from "../services/api.js"
import { addToCart } from "../utils/cart.js"

const G = "#2E8B34"

const STEPS = [
  { label: "Flowers", icon: "flower" },
  { label: "Vase", icon: "vase" },
  { label: "Wrapping", icon: "wrap" },
  { label: "Accessories", icon: "extra" },
]

const CATEGORY_MAP = { 0: "flower", 1: "vase", 2: "wrapping", 3: "accessory" }

function StockBadge({ status }) {
  if (status === "in_stock") return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">In Stock</span>
  if (status === "low_stock") return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">Low Stock</span>
  return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 font-medium">Out of Stock</span>
}

function ProductCard({ product, selected, onClick, disabled }) {
  return (
    <button
      onClick={() => !disabled && onClick()}
      disabled={disabled}
      className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 relative group text-left"
      style={{
        borderColor: selected ? G : disabled ? "#f3f4f6" : "#e5e7eb",
        backgroundColor: selected ? "#F0F7F1" : disabled ? "#fafafa" : "white",
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer"
      }}
    >
      <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-50 relative">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">No image</div>
        )}
        {selected && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: G }}>
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      <div className="w-full">
        <p className="text-xs font-semibold text-gray-700 leading-tight truncate">{product.name}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">P{(+product.price).toLocaleString()}</p>
        <div className="mt-1.5"><StockBadge status={product.stock_status} /></div>
      </div>
    </button>
  )
}

function StepDots({ current }) {
  return (
    <div className="flex items-center mb-6">
      {STEPS.map((s, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all"
              style={{ borderColor: i <= current ? G : "#e5e7eb", backgroundColor: i < current ? G : "white" }}
            >
              {i < current ? (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-xs font-bold" style={{ color: i === current ? G : "#d1d5db" }}>{i + 1}</span>
              )}
            </div>
            <span
              className="text-xs mt-1 text-center max-w-[70px] leading-tight"
              style={{ color: i === current ? G : i < current ? "#374151" : "#9ca3af" }}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="flex-1 h-0.5 mx-2 mb-4" style={{ backgroundColor: i < current ? G : "#e5e7eb" }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function MixAndMatch({ onNavigate }) {
  const [step, setStep] = useState(0)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selections, setSelections] = useState({ flower: null, vase: null, wrapping: null, accessory: null })
  const [completed, setCompleted] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")
  const [unavailableItems, setUnavailableItems] = useState([])
  const [aiUsage, setAiUsage] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, usageRes] = await Promise.all([
          api.getCustomizationProducts(),
          api.getAiUsage().catch(() => ({ remaining: 5, limit: 5 })),
        ])
        setProducts(Array.isArray(prodRes) ? prodRes : [])
        setAiUsage(usageRes)
      } catch (e) {
        console.error("Failed to load products", e)
        setError("Failed to load products. Please refresh.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getByCategory = (cat) => products.filter(p => p.category === cat)
  const selProd = (cat) => products.find(p => p.id === selections[cat])

  const toggle = (cat, id) => {
    setSelections(prev => ({ ...prev, [cat]: prev[cat] === id ? null : id }))
    setError("")
  }

  const canProceed = () => !!selections[CATEGORY_MAP[step]]

  const handleNext = () => {
    if (!canProceed()) {
      setError(`Please select a ${STEPS[step].label.toLowerCase()} to continue.`)
      return
    }
    if (step < STEPS.length - 1) { setStep(p => p + 1); setError("") }
    else handleGenerate()
  }

  const handleGenerate = async () => {
    setGenerating(true); setError(""); setUnavailableItems([])
    const parts = []
    const flower = selProd("flower"), vase = selProd("vase"), wrapping = selProd("wrapping"), accessory = selProd("accessory")
    if (flower) parts.push(`${flower.attrs?.quantity || 1} ${flower.attrs?.color || ""} ${flower.attrs?.style || ""} ${flower.name}`)
    if (vase) parts.push(`in a ${vase.attrs?.material || ""} ${vase.attrs?.style || ""} vase`)
    if (wrapping) parts.push(`wrapped with ${wrapping.attrs?.color || ""} ${wrapping.attrs?.style || ""} paper`)
    if (accessory) parts.push(`with ${accessory.attrs?.name || accessory.name}`)

    const promptText = parts.length > 0 ? `A custom floral arrangement: ${parts.join(", ")}` : "A beautiful custom floral arrangement"
    try {
      const data = await api.checkAndGenerate({
        prompt_text: promptText,
        flower_id: selections.flower || undefined,
        vase_id: selections.vase || undefined,
        wrapping_id: selections.wrapping || undefined,
        accessory_id: selections.accessory || undefined,
      })
      if (data.unavailable_items?.length > 0) {
        setUnavailableItems(data.unavailable_items)
        setAiUsage(prev => prev ? { ...prev, remaining: data.remaining_generations } : prev)
      } else if (data.success) {
        setResult(data)
        setAiUsage(prev => prev ? { ...prev, remaining: data.remaining_generations } : prev)
        setCompleted(true)
      } else {
        setError(data.message || "Generation failed.")
      }
    } catch (e) {
      setError(e.message || "Failed to generate.")
    } finally {
      setGenerating(false)
    }
  }

  const handleTryAlt = (field, id) => {
    const m = { flower_id: "flower", vase_id: "vase", wrapping_id: "wrapping", accessory_id: "accessory" }
    if (m[field]) { setSelections(p => ({ ...p, [m[field]]: id })); setUnavailableItems([]) }
  }

  const addToBag = () => {
    if (!result) return
    const names = result.price_breakdown?.items?.map(i => i.product_name).join(", ") || "Custom"
    addToCart({
      id: result.arrangement_id || `arr-${Date.now()}`,
      group: "Mix and Match", groupIcon: "", name: result.price_breakdown?.items?.[0]?.product_name || "Custom Arrangement",
      desc: `Mix & Match: ${names}`, qty: 1, price: result.price_breakdown?.total_price || 0,
      checked: true, img: result.generated_image_url, imgLabel: null,
    })
    onNavigate("cart")
  }

  if (completed && result) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F7F8FA" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

            {/* Header */}
            <div className="px-5 pt-5 flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Your Custom Arrangement</span>
                <span className="text-xs text-gray-400">AI preview</span>
              </div>
              <button
                onClick={() => { setCompleted(false); setResult(null); setStep(0); setUnavailableItems([]) }}
                className="p-1.5 hover:bg-gray-50 rounded-lg transition text-xs text-gray-400"
              >
                Start Over
              </button>
            </div>

            {/* Body */}
            <div className="px-5 pb-5 flex gap-5 flex-col sm:flex-row">
              <div className="w-full sm:w-52 h-60 rounded-xl flex-shrink-0 flex items-center justify-center border border-gray-100 overflow-hidden bg-gray-50">
                {result.generated_image_url
                  ? <img src={result.generated_image_url} alt="" className="w-full h-full object-cover" />
                  : <p className="text-xs text-gray-300">No image</p>
                }
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-800 mb-1">
                  {result.price_breakdown?.items?.[0]?.product_name || "Custom Arrangement"}
                </h3>

                {result.price_breakdown?.items?.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Materials Used</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {result.price_breakdown.items.map((item, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs" style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: G }} />
                          <span className="font-medium text-gray-700">{item.material_type}:</span>
                          <span className="text-gray-500">{item.product_name}</span>
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2">Cost Breakdown</p>
                        <div className="space-y-1">
                          {result.price_breakdown.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-gray-500">{item.product_name} x {item.quantity || 1}</span>
                              <span className="text-gray-700 font-medium">P{(+item.subtotal).toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="border-t border-gray-100 pt-1.5 flex justify-between text-sm font-bold text-gray-800">
                            <span>Total</span>
                            <span>P{(+result.price_breakdown.total_price).toLocaleString()}.00</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2">Availability</p>
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status</span>
                            <span className="text-green-600 font-medium">All available</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">AI uses left</span>
                            <span className="text-gray-700">{result.remaining_generations} today</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <button
                  onClick={addToBag}
                  className="mt-4 w-full py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:brightness-105"
                  style={{ backgroundColor: G }}
                >
                  Add to shopping bag
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-4 flex items-start gap-2 border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-400 flex-1">
                This is an AI-generated preview. Your bouquet will be prepared by our florists using the exact materials selected.
              </p>
              <span className="text-xs font-bold text-gray-400 flex-shrink-0 ml-2">POWERED BY pollinations.ai</span>
            </div>

          </div>
        </div>
      </div>
    )
  }

  const curCat = CATEGORY_MAP[step]
  const curProds = getByCategory(curCat)

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F8FA" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Step header */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Mix and Match</span>
              <span className="text-xs text-gray-400">Build your bouquet step by step</span>
            </div>
            <span className="text-xs text-gray-400">Step {step + 1} of {STEPS.length}</span>
          </div>
          <StepDots current={step} />
        </div>

        {/* AI usage warnings */}
        {aiUsage?.remaining === 0 && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
            Daily AI limit reached. Try again tomorrow.
          </div>
        )}
        {aiUsage && aiUsage.remaining > 0 && aiUsage.remaining <= 2 && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
            You have {aiUsage.remaining} AI generation{aiUsage.remaining !== 1 ? "s" : ""} left today.
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 bg-white border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>
        )}

        {/* Unavailable items */}
        {unavailableItems.length > 0 && (
          <div className="mb-4 bg-white border border-amber-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Some items are unavailable</h3>
            <div className="space-y-3">
              {unavailableItems.map(item => (
                <div key={item.field} className="border border-gray-100 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">
                    <span className="font-medium text-gray-700">{item.product_name}</span> - {item.reason}
                  </p>
                  {item.alternatives?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] text-gray-400 mb-1.5">Suggested alternatives:</p>
                      <div className="flex gap-2 flex-wrap">
                        {item.alternatives.map(alt => (
                          <button
                            key={alt.product_id}
                            onClick={() => handleTryAlt(item.field, alt.product_id)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-all hover:bg-green-50"
                            style={{ borderColor: "#bbf7d0", color: G }}
                          >
                            {alt.image_url && <img src={alt.image_url} alt="" className="w-5 h-5 rounded object-cover" />}
                            <span className="font-medium">{alt.product_name}</span>
                            <span className="text-gray-400">P{(+alt.price).toLocaleString()}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">Select an alternative above, then click Continue again.</p>
          </div>
        )}

        {/* Product selection */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ backgroundColor: G }}>
              {step + 1}
            </span>
            <h2 className="text-sm font-semibold text-gray-800">Choose your {STEPS[step].label.toLowerCase()}</h2>
          </div>
          <p className="text-xs text-gray-400 ml-8 mb-5">Select from available {STEPS[step].label.toLowerCase()} in stock.</p>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-green-600 rounded-full animate-spin mr-3" />
              <p className="text-sm text-gray-500">Loading products...</p>
            </div>
          ) : curProds.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-gray-400">No {STEPS[step].label.toLowerCase()} available right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {curProds.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  selected={selections[curCat] === p.id}
                  onClick={() => toggle(curCat, p.id)}
                  disabled={p.stock_status === "out_of_stock"}
                />
              ))}
            </div>
          )}

          {selections[curCat] && selProd(curCat) && (
            <div className="mt-4 px-4 py-2.5 rounded-lg text-sm" style={{ backgroundColor: "#F0F7F1" }}>
              <span className="font-medium" style={{ color: G }}>
                Selected: {selProd(curCat).name} - P{(+selProd(curCat).price).toLocaleString()}
              </span>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
            <button
              onClick={() => step === 0 ? onNavigate("make-it-personal") : setStep(s => s - 1)}
              className="px-5 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              {step === 0 ? "Return" : "Back"}
            </button>
            <button
              onClick={handleNext}
              disabled={generating || !canProceed() || (aiUsage?.remaining === 0 && step === STEPS.length - 1)}
              className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:brightness-105 disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: G }}
            >
              {generating ? "Generating..." : step === STEPS.length - 1 ? "Generate Arrangement ->" : "Continue ->"}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
