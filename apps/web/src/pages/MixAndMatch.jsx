import { useState } from "react"

import singleStemImg from "../assets/SingleStem.png"
import smallSizeImg from "../assets/SmallSize.png"
import mediumSizeImg from "../assets/MediumSize.png"
import largeSizeImg from "../assets/LargeSize.png"
import extraLargeSizeImg from "../assets/ExtraLargeSize.png"
import flowerBouquetImg from "../assets/FlowerBouquet.png"
import flowerBoxImg from "../assets/FlowerBox.png"
import flowerVaseImg from "../assets/FlowerVase.png"

const G = "#2E8B34"

const STEPS = [
  { label: "Size of Arrangement", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
  { label: "Type of Arrangement", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { label: "Flowers & Fillers", icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" },
  { label: "Finishing Touches", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
]

const SIZES = [
  { key: "single", label: "Single Stem", flowers: "1 focal", img: singleStemImg },
  { key: "small",  label: "Small",       flowers: "3 main flowers plus fillers", img: smallSizeImg },
  { key: "medium", label: "Medium",      flowers: "5 main flowers plus fillers", img: mediumSizeImg },
  { key: "large",  label: "Large",       flowers: "8 main flowers plus fillers", img: largeSizeImg },
  { key: "xl",     label: "Extra Large", flowers: "12+ main flowers", img: extraLargeSizeImg },
]

const TYPES = [
  { key: "wrapped", label: "Wrapped Arrangement", img: flowerBouquetImg },
  { key: "vase",    label: "Vase Arrangement",    img: flowerVaseImg },
  { key: "box",     label: "Flower in a Box",     img: flowerBoxImg },
]

const FOCAL_FLOWERS = [
  { key: "china_roses",    label: "China Roses",    color: "bg-red-50",    emoji: "🌹" },
  { key: "ecuador_roses",  label: "Ecuador Roses",  color: "bg-pink-50",   emoji: "🌸" },
  { key: "sunflower",      label: "Sunflower",      color: "bg-yellow-50", emoji: "🌻" },
  { key: "lilies",         label: "Lilies",         color: "bg-purple-50", emoji: "💐" },
  { key: "carnation",      label: "Pink Carnation", color: "bg-rose-50",   emoji: "🌷" },
]

const FILLERS = [
  { key: "babys_breath", label: "Baby's Breath", emoji: "🤍" },
  { key: "lavender",     label: "Lavender",      emoji: "💜" },
  { key: "wildflowers",  label: "Wildflowers",   emoji: "🌼" },
  { key: "eucalyptus",   label: "Eucalyptus",    emoji: "🌿" },
]

const TIPS = {
  0: [
    { title: "Small size guide", content: "This size creates a light and neat bouquet that feels balanced and easy to give.\n\nIt follows the 3-5-8 rule. You get 3 focal flowers to form the main shape, 5 greenery stems to build the structure, and 8 filler stems to add texture and detail.", icon: "info" },
    { title: "What you get", items: ["3 focal flowers", "5 greenery stems", "8 fillers flowers"], icon: "check" },
  ],
  1: [
    { title: "Wrapped arrangement", content: "Wrapped bouquets are best when you want something simple and flexible. The recipient can choose their own vase or rewrap it later.", icon: "info" },
    { title: "Vase arrangement", content: "Vase arrangements are great for homes, offices, or events where you want the flowers to be displayed right away.", icon: "info" },
    { title: "Flower in a box", content: "Box arrangements are ideal for formal gifts or special occasions. They also work well for delivery since the flowers are more stable.", icon: "info" },
  ],
  2: [
    { title: "Main or focal flower", content: "Roses feel romantic, sunflowers feel bright, lilies feel elegant, and carnations feel soft and sweet.", icon: "info" },
    { title: "Filler flowers", content: "Filler flowers support your focal flower and make the bouquet look full and complete. They add softness, movement, and depth.", icon: "info" },
  ],
  3: [
    { title: "Finishing touches", content: "Add a ribbon color and wrap style to complete the look of your bouquet.", icon: "info" },
  ],
}

function StepIndicator({ current }) {
  return (
    <div className="flex items-center mb-6">
      {STEPS.map((step, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all"
              style={{ borderColor: i <= current ? G : "#e5e7eb", backgroundColor: i < current ? G : "white" }}>
              {i < current ? (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-4 h-4" style={{ color: i === current ? G : "#d1d5db" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={step.icon} /></svg>
              )}
            </div>
            <span className="text-xs mt-1 text-center max-w-[70px] leading-tight" style={{ color: i === current ? G : i < current ? "#374151" : "#9ca3af" }}>{step.label}</span>
          </div>
          {i < STEPS.length - 1 && <div className="flex-1 h-0.5 mx-2 mb-4" style={{ backgroundColor: i < current ? G : "#e5e7eb" }} />}
        </div>
      ))}
    </div>
  )
}

function TipsPanel({ step }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-24">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a7 7 0 00-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26A7 7 0 0019 9a7 7 0 00-7-7z"/></svg>
        <h3 className="text-sm font-semibold text-gray-700">Floral Tips and Guides</h3>
      </div>
      <div className="space-y-4">
        {(TIPS[step] || []).map((tip, i) => (
          <div key={i}>
            <div className="flex items-center gap-1.5 mb-1.5">
              {tip.icon === "check"
                ? <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: G }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                : <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              }
              <span className="text-xs font-semibold text-gray-700">{tip.title}</span>
            </div>
            {tip.content && <p className="text-xs text-gray-500 leading-relaxed ml-5 whitespace-pre-line">{tip.content}</p>}
            {tip.items && <ul className="ml-5 space-y-0.5">{tip.items.map(it => <li key={it} className="text-xs text-gray-500 flex items-center gap-1"><span className="text-gray-300">-</span>{it}</li>)}</ul>}
          </div>
        ))}
      </div>
    </div>
  )
}

/* Reusable image selection card */
function SelectCard({ img, label, selected, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all duration-200 relative group"
      style={{
        borderColor: selected ? G : "#e5e7eb",
        backgroundColor: selected ? "#F0F7F1" : "white",
      }}
      onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = "#86efac"; e.currentTarget.style.backgroundColor = "#f9fefb"; } }}
      onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.backgroundColor = "white"; } }}
    >
      <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-50">
        <img src={img} alt={label} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
      </div>
      <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{label}</span>
      {badge && (
        <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: G }}>{badge}</span>
      )}
      {selected && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: G }}>
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
      )}
    </button>
  )
}

export default function MixAndMatch({ onNavigate }) {
  const [step, setStep] = useState(0)
  const [selections, setSelections] = useState({ size: "small", type: "wrapped", focal: "ecuador_roses", filler: "babys_breath", ribbon: "pink", wrap: "White Paper" })
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState("")

  const sel = (key, val) => { setSelections(p => ({ ...p, [key]: val })); setError("") }

  const RESULT = {
    name: "Blush Elegance Ecuador Roses",
    desc: "A medium wrapped bouquet of Ecuador roses with baby's breath, finished with white wrap and a soft pink ribbon.",
    price: 2720,
    breakdown: [
      { item: "Ecuador roses × 6", price: 1800 },
      { item: "Baby's breath", price: 350 },
      { item: "Greenery", price: 150 },
      { item: "Pink ribbon", price: 50 },
      { item: "White wrapper", price: 60 },
      { item: "Labor and arrangement", price: 300 },
    ],
  }

  const handleNext = () => {
    if (step === 2 && !selections.filler) { setError("Please choose a filler flower."); return }
    if (step < STEPS.length - 1) setStep(p => p + 1)
    else setCompleted(true)
  }

  if (completed) return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F8FA" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_280px] gap-5">
          <div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" style={{ color: G }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                  <span className="text-sm font-semibold text-gray-700">Mix and Match</span>
                </div>
                <span className="text-xs font-semibold flex items-center gap-1" style={{ color: G }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  Completed!
                </span>
              </div>
              <StepIndicator current={4} />
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 pt-5 flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  <span className="text-sm font-semibold text-gray-700">Final result</span>
                  <span className="text-xs text-gray-400">Preview and analysis</span>
                </div>
                <div className="flex gap-2">
                  <button className="p-1.5 hover:bg-gray-50 rounded-lg transition"><svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg></button>
                  <button className="p-1.5 hover:bg-gray-50 rounded-lg transition"><svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                </div>
              </div>
              <div className="px-5 pb-5 flex gap-5">
                <div className="w-48 h-52 rounded-xl bg-gradient-to-b from-pink-50 to-rose-100 flex-shrink-0 flex items-center justify-center border border-gray-100">
                  <div className="text-center px-3"><p className="text-xs text-gray-300 mb-1">AI image placeholder</p><p className="text-xs text-gray-400 font-medium">{RESULT.name}</p></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-800 mb-1">{RESULT.name}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">{RESULT.desc}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-2">Cost Breakdown</p>
                      <div className="space-y-1">
                        {RESULT.breakdown.map(({ item, price }) => (
                          <div key={item} className="flex justify-between text-xs"><span className="text-gray-500">{item}</span><span className="text-gray-700 font-medium">₱{price.toLocaleString()}</span></div>
                        ))}
                        <div className="border-t border-gray-100 pt-1.5 flex justify-between text-sm font-bold text-gray-800"><span>Total</span><span>₱ {RESULT.price.toLocaleString()}.00</span></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-2">Flower Availability</p>
                      <div className="text-xs space-y-1 mb-3">
                        <div className="flex justify-between"><span className="text-gray-500">In season</span><span className="text-gray-700">Ecuador roses</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Out of season</span><span className="text-gray-400">—</span></div>
                      </div>
                      <div className="flex gap-3 text-xs">
                        {[{l:"Availability",s:"10/10"},{l:"Popular",s:"9/10"},{l:"Easy to care",s:"9/10"}].map(({l,s}) => (
                          <div key={l} className="text-center">
                            <svg className="w-4 h-4 mx-auto mb-0.5" style={{ color: G }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
                            <p className="font-semibold text-gray-700">{s}</p>
                            <p className="text-gray-400">{l}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => onNavigate("cart")} className="mt-4 w-full py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:brightness-105" style={{ backgroundColor: G }}>Add to shopping bag</button>
                </div>
              </div>
              <div className="px-5 pb-4 flex items-start gap-2 border-t border-gray-100 pt-3">
                <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-xs text-gray-400">This is an AI-generated preview. Your bouquet will be prepared based on your selected size and options, and the price will remain the same.</p>
                <span className="text-xs font-bold text-gray-400 flex-shrink-0 ml-2">POWERED BY pollinations.ai</span>
              </div>
            </div>
          </div>
          <TipsPanel step={3} />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F8FA" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_280px] gap-5">
          <div>
            {/* Header card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" style={{ color: G }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                  <span className="text-sm font-semibold text-gray-700">Mix and Match</span>
                  <span className="text-xs text-gray-400">Build your bouquet step by step</span>
                </div>
                <span className="text-xs text-gray-400">Step {step + 1} of {STEPS.length} →</span>
              </div>
              <StepIndicator current={step} />
            </div>

            {/* Step content */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">

              {/* ── Step 0: Size ── */}
              {step === 0 && (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ backgroundColor: G }}>1</span>
                    <h2 className="text-sm font-semibold text-gray-800">Choose size of the arrangement</h2>
                  </div>
                  <p className="text-xs text-gray-400 ml-8 mb-5">Pick a size for your custom arrangement.</p>
                  <div className="grid grid-cols-5 gap-3 mb-4">
                    {SIZES.map(size => (
                      <SelectCard key={size.key} img={size.img} label={size.label} selected={selections.size === size.key} badge={size.badge} onClick={() => sel("size", size.key)} />
                    ))}
                  </div>
                  {selections.size && (
                    <div className="px-4 py-2.5 rounded-lg text-sm" style={{ backgroundColor: "#F0F7F1" }}>
                      <span className="font-medium" style={{ color: G }}>Selected: {SIZES.find(s => s.key === selections.size)?.label} — {SIZES.find(s => s.key === selections.size)?.flowers}.</span>
                    </div>
                  )}
                </>
              )}

              {/* ── Step 1: Type ── */}
              {step === 1 && (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ backgroundColor: G }}>2</span>
                    <h2 className="text-sm font-semibold text-gray-800">Choose type of arrangement</h2>
                  </div>
                  <p className="text-xs text-gray-400 ml-8 mb-5">Pick a style for your custom arrangement.</p>
                  <div className="grid grid-cols-3 gap-4">
                    {TYPES.map(type => (
                      <SelectCard key={type.key} img={type.img} label={type.label} selected={selections.type === type.key} onClick={() => sel("type", type.key)} />
                    ))}
                  </div>
                </>
              )}

              {/* ── Step 2: Flowers & Fillers ── */}
              {step === 2 && (
                <>
                  {/* Focal */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ backgroundColor: G }}>2</span>
                    <h2 className="text-sm font-semibold text-gray-800">Choose your focal flower</h2>
                  </div>
                  <p className="text-xs text-gray-400 ml-8 mb-4">The main flower that defines your bouquet.</p>
                  <div className="grid grid-cols-5 gap-3 mb-6">
                    {FOCAL_FLOWERS.map(f => (
                      <button key={f.key} onClick={() => sel("focal", f.key)}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 relative group"
                        style={{ borderColor: selections.focal === f.key ? G : "#e5e7eb", backgroundColor: selections.focal === f.key ? "#F0F7F1" : "white" }}
                        onMouseEnter={e => { if (selections.focal !== f.key) { e.currentTarget.style.borderColor = "#86efac"; e.currentTarget.style.backgroundColor = "#f9fefb"; } }}
                        onMouseLeave={e => { if (selections.focal !== f.key) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.backgroundColor = "white"; } }}
                      >
                        <div className={`w-14 h-14 rounded-full ${f.color} flex items-center justify-center text-2xl border border-white transition-transform duration-200 group-hover:scale-110`}>{f.emoji}</div>
                        <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{f.label}</span>
                        {selections.focal === f.key && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: G }}>
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Filler — required */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 border-2" style={{ borderColor: G, color: G }}>3</span>
                    <h2 className="text-sm font-semibold text-gray-800">Choose your filler flower <span className="text-red-400 text-xs font-normal ml-1">*required</span></h2>
                  </div>
                  <p className="text-xs text-gray-400 ml-8 mb-4">This adds texture, shape, and volume to your bouquet.</p>
                  {error && <p className="text-xs text-red-500 mb-3 ml-8">{error}</p>}
                  <div className="grid grid-cols-4 gap-3">
                    {FILLERS.map(f => (
                      <button key={f.key} onClick={() => sel("filler", f.key)}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 relative group"
                        style={{ borderColor: selections.filler === f.key ? G : "#e5e7eb", backgroundColor: selections.filler === f.key ? "#F0F7F1" : "white" }}
                        onMouseEnter={e => { if (selections.filler !== f.key) { e.currentTarget.style.borderColor = "#86efac"; e.currentTarget.style.backgroundColor = "#f9fefb"; } }}
                        onMouseLeave={e => { if (selections.filler !== f.key) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.backgroundColor = "white"; } }}
                      >
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-2xl border border-gray-100 transition-transform duration-200 group-hover:scale-110">{f.emoji}</div>
                        <span className="text-xs font-semibold text-gray-700 text-center">{f.label}</span>
                        {selections.filler === f.key && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: G }}>
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* ── Step 3: Finishing ── */}
              {step === 3 && (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ backgroundColor: G }}>4</span>
                    <h2 className="text-sm font-semibold text-gray-800">Finishing touches</h2>
                  </div>
                  <p className="text-xs text-gray-400 ml-8 mb-5">Add the final details to complete your bouquet.</p>
                  <p className="text-xs font-semibold text-gray-600 mb-3">Ribbon color</p>
                  <div className="flex gap-3 mb-6">
                    {[{ key: "pink", label: "Pink", color: "#f9a8d4" }, { key: "white", label: "White", color: "#f9fafb", border: true }, { key: "green", label: "Green", color: "#86efac" }, { key: "gold", label: "Gold", color: "#fde68a" }].map(r => (
                      <button key={r.key} onClick={() => sel("ribbon", r.key)} className="flex flex-col items-center gap-1.5 group">
                        <div className="w-10 h-10 rounded-full border-2 transition-all duration-200 group-hover:scale-110"
                          style={{ backgroundColor: r.color, borderColor: selections.ribbon === r.key ? G : (r.border ? "#e5e7eb" : r.color), boxShadow: selections.ribbon === r.key ? `0 0 0 2px ${G}` : "none" }} />
                        <span className="text-xs text-gray-500">{r.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-gray-600 mb-3">Wrap style</p>
                  <div className="grid grid-cols-3 gap-3">
                    {["Kraft Paper", "White Paper", "Floral Mesh"].map(w => (
                      <button key={w} onClick={() => sel("wrap", w)}
                        className="py-3 px-3 rounded-xl border-2 text-sm font-medium transition-all duration-200"
                        style={{ borderColor: selections.wrap === w ? G : "#e5e7eb", backgroundColor: selections.wrap === w ? "#F0F7F1" : "white", color: selections.wrap === w ? G : "#374151" }}
                        onMouseEnter={e => { if (selections.wrap !== w) { e.currentTarget.style.borderColor = "#86efac"; e.currentTarget.style.backgroundColor = "#f9fefb"; } }}
                        onMouseLeave={e => { if (selections.wrap !== w) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.backgroundColor = "white"; } }}
                      >{w}</button>
                    ))}
                  </div>
                </>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
                <button onClick={() => step === 0 ? onNavigate("make-it-personal") : setStep(p => p - 1)}
                  className="px-5 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Return</button>
                <button onClick={handleNext} className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:brightness-105" style={{ backgroundColor: G }}>
                  Continue →
                </button>
              </div>
            </div>
          </div>
          <TipsPanel step={step} />
        </div>
      </div>
    </div>
  )
}
