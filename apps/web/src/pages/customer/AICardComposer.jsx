import { useState } from "react"
import { useTheme } from "../../context/ThemeContext"
import {
  RELATIONSHIP_OPTIONS, OCCASION_OPTIONS, TONE_OPTIONS,
  generateCardMessage, savePendingCard,
} from "../../utils/cardMessage.js"

const G  = "#2E8B34"
const DG = "#0C573E"

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

  // tokens
  const pageBg   = isDark ? "#0f172a" : "#F7F8FA"
  const cardBg   = isDark ? "#1e293b" : "white"
  const cardBdr  = isDark ? "#334155" : "#e8edf2"
  const headerBg = isDark ? "#162032" : "#fafbfc"
  const bodyTxt  = isDark ? "#f1f5f9" : "#111827"
  const subTxt   = isDark ? "#94a3b8" : "#6b7280"
  const mutedTxt = isDark ? "#64748b" : "#9ca3af"
  const inputBg  = isDark ? "#0f172a" : "white"
  const inputBdr = isDark ? "#334155" : "#e2e8f0"
  const accentG  = isDark ? "#4ade80" : G

  const selectStyle = { borderColor: inputBdr, backgroundColor: inputBg, color: bodyTxt }

  const generate = async () => {
    if (!relationship || !occasion) { setErr("Please select a relationship and occasion."); return }
    setErr(""); setLoading(true); setGenerated(""); setEdited("")
    try {
      const text = await generateCardMessage({ relationship, occasion, tone, extra })
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
    <div className="min-h-screen" style={{ backgroundColor: pageBg }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
            <svg className="w-6 h-6" fill="none" stroke="white" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: bodyTxt }}>AI Card Composer</h1>
            <p className="text-sm mt-0.5" style={{ color: subTxt }}>Not sure what to write? We'll help you find the words.</p>
          </div>
        </div>

        {/* Composer card */}
        <div className="rounded-xl overflow-hidden mt-6"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${cardBdr}`, backgroundColor: headerBg }}>
            <p className="text-sm font-semibold" style={{ color: bodyTxt }}>Tell us about your message</p>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: mutedTxt }}>Relationship *</label>
                <select value={relationship} onChange={e => { setRelationship(e.target.value); setErr("") }}
                  className="w-full px-3 py-2.5 text-sm border rounded-lg outline-none cursor-pointer transition-all"
                  style={selectStyle}>
                  <option value="">Select...</option>
                  {RELATIONSHIP_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: mutedTxt }}>Occasion *</label>
                <select value={occasion} onChange={e => { setOccasion(e.target.value); setErr("") }}
                  className="w-full px-3 py-2.5 text-sm border rounded-lg outline-none cursor-pointer transition-all"
                  style={selectStyle}>
                  <option value="">Select...</option>
                  {OCCASION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: mutedTxt }}>Tone</label>
              <div className="flex gap-1.5 flex-wrap">
                {TONE_OPTIONS.map(t => {
                  const on = tone === t.value
                  return (
                    <button key={t.value} onClick={() => setTone(t.value)}
                      className="px-3.5 py-1.5 rounded-full text-xs transition-all"
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
                className="w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-all"
                style={selectStyle} />
            </div>

            {err && <p className="text-xs" style={{ color: "#ef4444" }}>{err}</p>}

            <button onClick={generate} disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{ background: loading ? (isDark ? "#334155" : "#e5e7eb") : `linear-gradient(135deg,${DG},${G})`, color: loading ? mutedTxt : "white" }}>
              {loading ? (
                <>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" style={{ animation: "cardspin 1s linear infinite" }}>
                    <circle cx="12" cy="12" r="10" stroke={isDark ? "#475569" : "#d1d5db"} strokeWidth="3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke={accentG} strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  {generated ? "Regenerate" : "Generate Message"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generated message */}
        {generated && (
          <div className="rounded-xl overflow-hidden mt-5"
            style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${cardBdr}`, background: isDark ? "rgba(74,222,128,0.06)" : "#f0fdf4" }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: accentG }}>Your message</p>
              <span className="text-xs" style={{ color: mutedTxt }}>Edit it below if you'd like</span>
            </div>
            <div className="p-5 space-y-4">
              <textarea value={edited} onChange={e => setEdited(e.target.value)} rows={4}
                className="w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-all resize-y leading-relaxed"
                style={selectStyle} />

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button onClick={copy}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl border transition-all"
                  style={{ borderColor: inputBdr, color: copied ? accentG : subTxt, background: "transparent" }}>
                  {copied ? (
                    <><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Copied</>
                  ) : (
                    <><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>Copy message</>
                  )}
                </button>
                <button onClick={shopWithMessage}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 active:scale-[0.99]"
                  style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
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
      <style>{`@keyframes cardspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}