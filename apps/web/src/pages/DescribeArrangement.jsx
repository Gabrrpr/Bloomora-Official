import { useState } from "react"

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

export default function DescribeArrangement({ onNavigate }) {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const MAX = 500

  const handleGenerate = () => {
    if (!prompt.trim()) return
    setLoading(true)
    setTimeout(() => { setLoading(false); setResult(RESULT) }, 1800)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F8FA" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_280px] gap-5">

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
                  className="text-xs font-medium hover:underline" style={{ color: G }}
                >
                  Use an example
                </button>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" style={{ color: G }}><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                  More than 1,000+ Images Generated
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || loading}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
                  style={{ background: prompt.trim() ? "linear-gradient(135deg, #e879a0, #f43f5e)" : "#d1d5db" }}
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      Create my bouquet
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Result card */}
            {result && (
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
                  <div className="w-44 h-52 rounded-xl bg-gradient-to-b from-pink-50 to-rose-100 flex-shrink-0 flex items-center justify-center border border-gray-100">
                    <div className="text-center px-3">
                      <p className="text-xs text-gray-300 mb-1">AI image placeholder</p>
                      <p className="text-xs text-gray-400 font-medium">{result.name}</p>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-800 mb-1">{result.name}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-4">{result.desc}</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2">Cost Breakdown</p>
                        <div className="space-y-1">
                          {result.breakdown.map(({ item, price }) => (
                            <div key={item} className="flex justify-between text-xs">
                              <span className="text-gray-500">{item}</span>
                              <span className="text-gray-700 font-medium">₱{price.toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="border-t border-gray-100 pt-1.5 flex justify-between text-sm font-bold text-gray-800">
                            <span>Total</span>
                            <span>₱ {result.price.toLocaleString()}.00</span>
                          </div>
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

                    <button onClick={() => onNavigate("cart")}
                      className="mt-4 w-full py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:brightness-105"
                      style={{ backgroundColor: G }}>
                      Add to shopping bag
                    </button>
                  </div>
                </div>

                <div className="px-5 pb-4 flex items-start gap-2 border-t border-gray-100 pt-3">
                  <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-xs text-gray-400 flex-1">This is an AI-generated preview. Your bouquet will be prepared based on your selected options, and the price will remain the same.</p>
                  <span className="text-xs font-bold text-gray-400 flex-shrink-0 ml-2">POWERED BY pollinations.ai</span>
                </div>
              </div>
            )}
          </div>

          {/* Prompt Tips */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a7 7 0 00-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26A7 7 0 0019 9a7 7 0 00-7-7z"/></svg>
              <h3 className="text-sm font-semibold text-gray-700">Prompt Tips</h3>
            </div>
            <div className="space-y-5">
              {PROMPT_TIPS.map((tip, i) => (
                <div key={i}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
  )
}
