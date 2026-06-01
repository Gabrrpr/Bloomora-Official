import { useState, useEffect } from "react"
import { useTheme } from "../../context/ThemeContext"
import {
  RELATIONSHIP_OPTIONS, OCCASION_OPTIONS, TONE_OPTIONS,
  generateCardMessage, savePendingCard,
} from "../../utils/cardMessage.js"

const G  = "#2E8B34"
const DG = "#0C573E"

// Fun facts cycled through while the AI writes the message (matches DescribeArrangement).
const CARD_FACTS = [
  "The tradition of attaching a note to flowers dates back to the Victorian era.",
  "In the language of flowers, red roses mean love while yellow roses mean friendship.",
  "A handwritten card is often kept long after the flowers have faded.",
  "Sunflowers symbolize adoration, loyalty, and lasting happiness.",
  "Tulips are a classic way to say 'perfect love' to someone special.",
  "Lavender in a bouquet is a gentle wish for calm and serenity.",
  "The shortest, most sincere messages are often the ones remembered most.",
  "Pairing the right words with flowers makes a gift feel truly personal.",
]

export default function AICardComposer({ onNavigate }) {
  const { isDark } = useTheme()

  const [relationship, setRelationship] = useState("")
  const [occasion,     setOccasion]     = useState("")
  const [tone,         setTone]         = useState("warm")
  const [extra,        setExtra]        = useState("")
  const [loading,      setLoading]      = useState(false)
  const [generated,    setGenerated]    = useState("")
  const [edited,       setEdited]       = useState("")
  const [err,          setErr]          = useState("")
  const [copied,       setCopied]       = useState(false)

  // UI-only: loading progress + rotating facts (same pattern as DescribeArrangement)
  const [progress, setProgress] = useState(0)
  const [factIdx,  setFactIdx]  = useState(0)

  // tokens
  const cardBg   = isDark ? "#1e293b" : "rgba(255,255,255,0.92)"
  const cardBdr  = isDark ? "#334155" : "#d6ead8"
  const headerBg = isDark ? "#162032" : "#f4f9f1"
  const bodyTxt  = isDark ? "#f1f5f9" : "#111827"
  const subTxt   = isDark ? "#94a3b8" : "#6b7280"
  const mutedTxt = isDark ? "#64748b" : "#9ca3af"
  const inputBg  = isDark ? "#0f172a" : "white"
  const inputBdr = isDark ? "#334155" : "#e2e8f0"
  const accentG  = isDark ? "#4ade80" : G

  const selectStyle = { borderColor: inputBdr, backgroundColor: inputBg, color: bodyTxt }

  // ── Loading: animate progress bar + rotate facts ──
  useEffect(() => {
    if (!loading) { setProgress(0); return }
    setProgress(8)
    setFactIdx(Math.floor(Math.random() * CARD_FACTS.length))
    const prog = setInterval(() => {
      setProgress(p => (p >= 90 ? 90 : p + Math.max(1, (92 - p) * 0.08)))
    }, 280)
    const facts = setInterval(() => {
      setFactIdx(i => (i + 1) % CARD_FACTS.length)
    }, 3600)
    return () => { clearInterval(prog); clearInterval(facts) }
  }, [loading])

  const generate = async () => {
    if (!relationship || !occasion) { setErr("Please select a relationship and occasion."); return }
    setErr(""); setLoading(true); setGenerated(""); setEdited("")
    try {
      const text = await generateCardMessage({ relationship, occasion, tone, extra })
      setProgress(100)
      setGenerated(text); setEdited(text)
    } catch {
      setErr("Could not generate a message. Please try again.")
    }
    setLoading(false)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(edited)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable */ }
  }

  // Carry the message into shopping: stash it, then go to Shop.
  const shopWithMessage = () => {
    if (edited.trim()) savePendingCard(edited.trim())
    onNavigate?.("shop")
  }

  return (
    <>
    {/* Soft botanical gradient backdrop — matches DescribeArrangement */}
    <div
      className="min-h-screen flex items-start justify-center"
      style={{
        background: isDark
          ? "#0f172a"
          : "radial-gradient(1100px 600px at 50% -8%, #eaf6ec 0%, #f4f9f1 45%, #fbf7ef 100%)",
      }}
    >
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Page heading — centered with accent dots + two-tone title */}
        <div className="text-center mb-6">
          <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase mb-2" style={{ color: accentG }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#f472b6" }} />
            Make It Personal
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#fbbf24" }} />
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-2" style={{ color: isDark ? "#f1f5f9" : DG }}>
            AI <span style={{ color: "#db2777" }}>Card Composer</span>
          </h1>
          <p className="text-sm sm:text-base max-w-xl mx-auto" style={{ color: subTxt }}>
            Not sure what to write? Tell us about the occasion and we'll find the perfect words.
          </p>
        </div>

        {/* Composer card */}
        <div className="rounded-3xl overflow-hidden backdrop-blur-sm"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? "none" : "0 12px 40px rgba(12,87,62,0.08)" }}>
          <div className="px-6 py-4" style={{ borderBottom: `1px solid ${cardBdr}`, backgroundColor: headerBg }}>
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(46,139,52,0.1)", color: accentG }}>
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"/>
                </svg>
              </span>
              <p className="text-base font-bold" style={{ color: bodyTxt }}>Tell us about your message</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: mutedTxt }}>Relationship *</label>
                <select value={relationship} onChange={e => { setRelationship(e.target.value); setErr("") }}
                  className="w-full px-4 py-3 text-sm border rounded-xl outline-none cursor-pointer transition-all"
                  style={selectStyle}>
                  <option value="">Select...</option>
                  {RELATIONSHIP_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: mutedTxt }}>Occasion *</label>
                <select value={occasion} onChange={e => { setOccasion(e.target.value); setErr("") }}
                  className="w-full px-4 py-3 text-sm border rounded-xl outline-none cursor-pointer transition-all"
                  style={selectStyle}>
                  <option value="">Select...</option>
                  {OCCASION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: mutedTxt }}>Tone</label>
              <div className="flex gap-2 flex-wrap">
                {TONE_OPTIONS.map(t => {
                  const on = tone === t.value
                  return (
                    <button key={t.value} onClick={() => setTone(t.value)}
                      className="px-4 py-2 rounded-full text-sm transition-all"
                      style={{
                        fontWeight: on ? 600 : 400,
                        border: `1px solid ${on ? accentG : inputBdr}`,
                        background: on ? (isDark ? "rgba(74,222,128,0.12)" : "#f0fdf4") : "transparent",
                        color: on ? accentG : subTxt,
                      }}>
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: mutedTxt }}>
                Extra context <span className="normal-case tracking-normal font-normal" style={{ color: mutedTxt }}>(optional)</span>
              </label>
              <input value={extra} onChange={e => setExtra(e.target.value)}
                placeholder="e.g. She loves sunflowers, we have been friends for 10 years..."
                className="w-full px-4 py-3 text-sm border rounded-xl outline-none transition-all"
                style={selectStyle} />
            </div>

            {err && <p className="text-sm" style={{ color: "#ef4444" }}>{err}</p>}

            <button onClick={generate} disabled={loading}
              className="w-full py-3.5 rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-all hover:brightness-105 active:scale-[0.98]"
              style={{ background: loading ? (isDark ? "#334155" : "#e5e7eb") : `linear-gradient(135deg,${DG},${G})`, color: loading ? mutedTxt : "white" }}>
              {loading ? (
                <>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ animation: "cardspin 1s linear infinite" }}>
                    <circle cx="12" cy="12" r="10" stroke={isDark ? "#475569" : "#d1d5db"} strokeWidth="3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke={accentG} strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  {generated ? "Regenerate" : "Generate Message"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generated message */}
        {generated && (
          <div className="rounded-3xl overflow-hidden mt-5 backdrop-blur-sm"
            style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? "none" : "0 12px 40px rgba(12,87,62,0.08)" }}>
            <div className="px-6 py-3.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${cardBdr}`, background: isDark ? "rgba(74,222,128,0.06)" : "#f0fdf4" }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: accentG }}>Your message</p>
              <span className="text-xs" style={{ color: mutedTxt }}>Edit it below if you'd like</span>
            </div>
            <div className="p-6 space-y-4">
              <textarea value={edited} onChange={e => setEdited(e.target.value)} rows={4}
                className="w-full px-4 py-3 text-sm border rounded-xl outline-none transition-all resize-y leading-relaxed"
                style={selectStyle} />

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={copy}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold rounded-2xl border transition-all"
                  style={{ borderColor: inputBdr, color: copied ? accentG : subTxt, background: "transparent" }}>
                  {copied ? (
                    <><svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Copied</>
                  ) : (
                    <><svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>Copy message</>
                  )}
                </button>
                <button onClick={shopWithMessage}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 text-base font-bold text-white rounded-2xl transition-all hover:opacity-90 active:scale-[0.99]"
                  style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                  Pick flowers to send it with
                </button>
              </div>
              <p className="text-xs text-center" style={{ color: mutedTxt }}>
                We'll keep your message ready while you choose an arrangement.
              </p>
            </div>
          </div>
        )}

        {/* Empty-state hint when nothing generated yet */}
        {!generated && (
          <p className="text-xs text-center mt-5" style={{ color: mutedTxt }}>
            Fill in the details above and we'll write a heartfelt message you can edit, copy, or send with flowers.
          </p>
        )}
      </div>
    </div>

    {/* ── Loading overlay: blurred backdrop + centered progress + flower facts ── */}
    {loading && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(12,87,62,0.35)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
        <div className="w-full max-w-md bg-white rounded-3xl px-8 py-10 text-center shadow-2xl"
          style={{ animation: "cardPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}>
          {/* Bloom icon — same fuller blossom as DescribeArrangement */}
          <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(244,114,182,0.18), rgba(46,139,52,0.14))" }}>
            <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" style={{ animation: "cardBob 2.6s ease-in-out infinite" }}>
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

          <h3 className="text-xl font-bold mb-1.5" style={{ color: DG }}>Writing your message</h3>
          <p className="text-sm text-gray-400 mb-7">Finding the perfect words for you...</p>

          {/* Growing progress bar with a flower riding the leading edge */}
          <div className="relative w-full mb-2" style={{ paddingTop: "12px" }}>
            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f1ece6" }}>
              <div className="h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg, #f472b6, #fbbf24 55%, #2E8B34)" }} />
            </div>
            <div className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out"
              style={{ left: `${progress}%`, top: "17px" }}>
              <svg className="w-[30px] h-[30px]" viewBox="0 0 24 24" fill="none" style={{ animation: "cardspin 4s linear infinite", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>
                {[0,72,144,216,288].map(deg => (
                  <ellipse key={deg} cx="12" cy="6.5" rx="2.8" ry="4.2" fill="#f472b6"
                    transform={`rotate(${deg} 12 12)`} />
                ))}
                <circle cx="12" cy="12" r="3.4" fill="#fbbf24" />
                <circle cx="12" cy="12" r="1.6" fill="#f59e0b" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-400 mb-7">{Math.round(progress)}%</p>

          {/* Fun fact */}
          <div className="rounded-2xl px-5 py-4 text-left" style={{ backgroundColor: "#fdf2f8", border: "1px solid #fbcfe8" }}>
            <p className="text-xs font-bold tracking-wider uppercase mb-1.5" style={{ color: "#db2777" }}>Did you know?</p>
            <p key={factIdx} className="text-sm text-gray-600 leading-relaxed" style={{ animation: "cardFade 0.5s ease both" }}>
              {CARD_FACTS[factIdx]}
            </p>
          </div>
        </div>
      </div>
    )}

    <style>{`
      @keyframes cardspin { to { transform:rotate(360deg); } }
      @keyframes cardPop  { from { opacity:0; transform:scale(0.94) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
      @keyframes cardFade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      @keyframes cardBob  { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-3px); } }
    `}</style>
    </>
  )
}