import { useState, useRef } from "react"
import { useTheme } from "../../context/ThemeContext"

const SITE_GREEN = "#2E8B34"
const DARK_GREEN = "#0C573E"

// Message character limit, matches the ProductPreviewModal's CardStep convention
const MESSAGE_LIMIT = 160
const NAME_LIMIT    = 30

const OCCASIONS = [
  { value: "birthday",     label: "Birthday",      emoji: "🎂" },
  { value: "anniversary",  label: "Anniversary",   emoji: "💕" },
  { value: "wedding",      label: "Wedding",       emoji: "💍" },
  { value: "graduation",   label: "Graduation",    emoji: "🎓" },
  { value: "sympathy",     label: "Sympathy",      emoji: "🕊️" },
  { value: "thank-you",    label: "Thank You",     emoji: "🙏" },
  { value: "get-well",     label: "Get Well Soon", emoji: "🌿" },
  { value: "congrats",     label: "Congrats",      emoji: "🎉" },
  { value: "just-because", label: "Just Because",  emoji: "🌸" },
]

const TONES = [
  { value: "heartfelt", label: "Heartfelt",  desc: "Warm and sincere"           },
  { value: "playful",   label: "Playful",    desc: "Light and fun"              },
  { value: "elegant",   label: "Elegant",    desc: "Refined and poetic"         },
  { value: "casual",    label: "Casual",     desc: "Friendly and easy-going"    },
  { value: "romantic",  label: "Romantic",   desc: "Affectionate and tender"    },
  { value: "funny",     label: "Funny",      desc: "Witty with a touch of humor"},
]

const RELATIONSHIPS = [
  "Partner", "Spouse", "Mother", "Father", "Sister", "Brother",
  "Friend", "Colleague", "Boss", "Daughter", "Son", "Other",
]

export default function AICardComposerPage({ onNavigate }) {
  const { isDark } = useTheme()

  // Form state
  const [recipientName,  setRecipientName]  = useState("")
  const [senderName,     setSenderName]     = useState("")
  const [relationship,   setRelationship]   = useState("Friend")
  const [occasion,       setOccasion]       = useState("birthday")
  const [tone,           setTone]           = useState("heartfelt")
  const [extraContext,   setExtraContext]   = useState("")

  // Output state
  const [drafts,         setDrafts]         = useState([])
  const [selectedDraft,  setSelectedDraft]  = useState(null)
  const [editedMessage,  setEditedMessage]  = useState("")
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState("")
  const [copied,         setCopied]         = useState(false)

  const previewRef = useRef(null)

  // Theme-aware tokens — using inline styles for reliability across theme systems
  const pageBg        = isDark ? "#0f172a" : "#f9fafb"
  const surfaceBg     = isDark ? "#1a2332" : "#ffffff"
  const inputBg       = isDark ? "#0f172a" : "#ffffff"
  const borderC       = isDark ? "#2d3748" : "#e5e7eb"
  const textPrimary   = isDark ? "#f3f4f6" : "#111827"
  const textSecondary = isDark ? "#9ca3af" : "#6b7280"
  const textMuted     = isDark ? "#6b7280" : "#9ca3af"
  const labelC        = isDark ? "#d1d5db" : "#374151"
  const accentG       = isDark ? "#4ade80" : SITE_GREEN

  const inputStyle = {
    backgroundColor: inputBg,
    border: `1px solid ${borderC}`,
    color: textPrimary,
  }

  const inputClass = "w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition focus:border-[#2E8B34] focus:ring-2 focus:ring-[#2E8B34]/20"

  // ── Generate messages via Anthropic API ────────────────────────────────
  const handleGenerate = async () => {
    if (!recipientName.trim() || !senderName.trim()) {
      setError("Please enter both recipient and sender names.")
      return
    }
    setError("")
    setLoading(true)
    setDrafts([])
    setSelectedDraft(null)

    const occLabel  = OCCASIONS.find(o => o.value === occasion)?.label || occasion
    const toneLabel = TONES.find(t => t.value === tone)?.label || tone

    const prompt = `You are writing short, heartfelt greeting card messages for a floral arrangement.

Context:
- Occasion: ${occLabel}
- Tone: ${toneLabel}
- Recipient: ${recipientName.trim()} (${relationship})
- From: ${senderName.trim()}
${extraContext.trim() ? `- Additional context: ${extraContext.trim()}` : ""}

Write 3 distinct card message options. Each message MUST:
- Be under ${MESSAGE_LIMIT} characters (this is a strict hard limit)
- Address the recipient by name where natural
- Match the requested tone
- Feel personal and sincere, not generic
- NOT include the sender's name at the end (that's added separately)
- NOT use quotation marks around the message

Respond in this exact JSON format only, no other text:
{"drafts":["message1","message2","message3"]}`

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      })

      const data = await response.json()
      const text = data?.content?.[0]?.text || ""
      const clean = text.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(clean)

      if (Array.isArray(parsed.drafts) && parsed.drafts.length > 0) {
        const safe = parsed.drafts.map(d => String(d).slice(0, MESSAGE_LIMIT))
        setDrafts(safe)
        setSelectedDraft(0)
        setEditedMessage(safe[0])
        setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
      } else {
        setError("Could not generate messages. Please try again.")
      }
    } catch (err) {
      console.error("AI generation failed:", err)
      setError("Something went wrong. Please try again in a moment.")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectDraft = (i) => {
    setSelectedDraft(i)
    setEditedMessage(drafts[i])
  }

  const handleCopy = async () => {
    const fullText = `${editedMessage.trim()}\n\nFrom: ${senderName.trim()}\nTo: ${recipientName.trim()}`
    try {
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Could not copy to clipboard.")
    }
  }

  const handleUseInOrder = () => {
    sessionStorage.setItem("bloomora_ai_card_message", JSON.stringify({
      message:   editedMessage.trim(),
      to:        recipientName.trim(),
      from:      senderName.trim(),
      occasion,
      tone,
      timestamp: Date.now(),
    }))
    onNavigate?.("shop")
  }

  const charsLeft = MESSAGE_LIMIT - editedMessage.length

  return (
    <div className="min-h-screen" style={{ backgroundColor: pageBg }}>

      {/* ── Hero header ─────────────────────────────────────────────── */}
      <div style={{ backgroundColor: surfaceBg, borderBottom: `1px solid ${borderC}` }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <button
            onClick={() => onNavigate?.("home")}
            className="text-sm font-medium hover:text-[#2E8B34] transition"
            style={{ color: textSecondary }}
          >
            ← Back
          </button>

          <div className="mt-4 sm:mt-6 flex items-start gap-4">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${SITE_GREEN}, ${DARK_GREEN})` }}
            >
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"/>
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-xs font-bold uppercase tracking-widest mb-1"
                style={{ color: accentG }}
              >
                Make it Personal
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight" style={{ color: textPrimary }}>
                AI Card Composer
              </h1>
              <p className="text-sm sm:text-base mt-1.5 max-w-2xl" style={{ color: textSecondary }}>
                Lost for words? Tell us a little about the occasion and we'll write three thoughtful card messages for you to choose from.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Form column ─────────────────────────────────────────── */}
        <div
          className="lg:col-span-3 rounded-2xl p-5 sm:p-6 space-y-5"
          style={{ backgroundColor: surfaceBg, border: `1px solid ${borderC}` }}
        >
          <div className="flex items-center gap-2 pb-1">
            <div className="w-1 h-5 rounded-sm" style={{ backgroundColor: SITE_GREEN }} />
            <h2 className="text-base font-bold" style={{ color: textPrimary }}>Tell us about your message</h2>
          </div>

          {/* Recipient & Sender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: labelC }}>
                Recipient&apos;s Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value.slice(0, NAME_LIMIT))}
                placeholder="e.g. Maria"
                className={inputClass}
                style={inputStyle}
                maxLength={NAME_LIMIT}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: labelC }}>
                Your Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={senderName}
                onChange={e => setSenderName(e.target.value.slice(0, NAME_LIMIT))}
                placeholder="e.g. Juan"
                className={inputClass}
                style={inputStyle}
                maxLength={NAME_LIMIT}
              />
            </div>
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: labelC }}>Your Relationship</label>
            <select
              value={relationship}
              onChange={e => setRelationship(e.target.value)}
              className={inputClass}
              style={inputStyle}
            >
              {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Occasion */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: labelC }}>Occasion</label>
            <div className="grid grid-cols-3 gap-2">
              {OCCASIONS.map(o => {
                const selected = occasion === o.value
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setOccasion(o.value)}
                    className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-lg text-xs font-medium transition"
                    style={{
                      border: `1px solid ${selected ? SITE_GREEN : borderC}`,
                      backgroundColor: selected ? (isDark ? "rgba(46,139,52,0.15)" : "#f0fdf4") : inputBg,
                      color: selected ? accentG : textSecondary,
                    }}
                  >
                    <span className="text-lg leading-none">{o.emoji}</span>
                    <span className="leading-tight text-center">{o.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: labelC }}>Tone</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TONES.map(t => {
                const selected = tone === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTone(t.value)}
                    className="flex flex-col items-start gap-0.5 py-2.5 px-3 rounded-lg text-left transition"
                    style={{
                      border: `1px solid ${selected ? SITE_GREEN : borderC}`,
                      backgroundColor: selected ? (isDark ? "rgba(46,139,52,0.15)" : "#f0fdf4") : inputBg,
                    }}
                  >
                    <span
                      className="text-xs font-semibold"
                      style={{ color: selected ? accentG : textPrimary }}
                    >
                      {t.label}
                    </span>
                    <span className="text-[10px] leading-tight" style={{ color: textMuted }}>{t.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Optional context */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: labelC }}>
              Anything special to mention? <span className="font-normal" style={{ color: textMuted }}>(optional)</span>
            </label>
            <textarea
              rows={3}
              value={extraContext}
              onChange={e => setExtraContext(e.target.value.slice(0, 200))}
              placeholder="e.g. She just got promoted, inside jokes, shared memories…"
              className={`${inputClass} resize-none`}
              style={inputStyle}
            />
            <p className="text-[10px] mt-1" style={{ color: textMuted }}>{200 - extraContext.length} characters left</p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="px-3 py-2 rounded-lg text-xs"
              style={{
                backgroundColor: isDark ? "rgba(244,63,94,0.1)" : "#fef2f2",
                border: `1px solid ${isDark ? "rgba(244,63,94,0.3)" : "#fecaca"}`,
                color: isDark ? "#fb7185" : "#dc2626",
              }}
            >
              {error}
            </div>
          )}

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !recipientName.trim() || !senderName.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-px"
            style={{ background: `linear-gradient(135deg, ${SITE_GREEN}, ${DARK_GREEN})` }}
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                  <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Writing your message...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"/>
                </svg>
                {drafts.length > 0 ? "Generate New Options" : "Generate Card Message"}
              </>
            )}
          </button>
        </div>

        {/* ── Preview / Output column ─────────────────────────────── */}
        <div ref={previewRef} className="lg:col-span-2 space-y-4">

          {/* Drafts selector */}
          {drafts.length > 0 && (
            <div className="rounded-2xl p-4" style={{ backgroundColor: surfaceBg, border: `1px solid ${borderC}` }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: textSecondary }}>
                Choose your favorite
              </p>
              <div className="space-y-2">
                {drafts.map((draft, i) => {
                  const isSel = selectedDraft === i
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectDraft(i)}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-xs leading-relaxed transition"
                      style={{
                        border: `1px solid ${isSel ? SITE_GREEN : borderC}`,
                        backgroundColor: isSel ? (isDark ? "rgba(46,139,52,0.15)" : "#f0fdf4") : inputBg,
                        color: isSel ? accentG : textPrimary,
                        fontWeight: isSel ? 500 : 400,
                      }}
                    >
                      <span className="block font-bold mb-0.5 opacity-70 text-[10px] uppercase tracking-widest">
                        Option {i + 1}
                      </span>
                      {draft}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Card preview */}
          <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: surfaceBg, border: `1px solid ${borderC}` }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: textSecondary }}>
              Card Preview
            </p>

            <div
              className="relative rounded-xl p-5 sm:p-6 mb-4 min-h-[180px]"
              style={{
                background: isDark
                  ? "linear-gradient(135deg, #1f2e26, #0f1a14)"
                  : "linear-gradient(135deg, #fefdf8, #f9f7ed)",
                border: `1px solid ${isDark ? "#2d3748" : "#e8e4d0"}`,
                boxShadow: isDark
                  ? "0 4px 16px rgba(0,0,0,0.4)"
                  : "0 4px 16px rgba(180,160,100,0.12)",
              }}
            >
              <svg
                className="absolute top-2 right-2 w-8 h-8 opacity-30"
                style={{ color: SITE_GREEN }}
                fill="currentColor" viewBox="0 0 24 24"
              >
                <path d="M12 2c-1 5-4 8-9 9 5 1 8 4 9 9 1-5 4-8 9-9-5-1-8-4-9-9z"/>
              </svg>

              {drafts.length > 0 ? (
                <>
                  {recipientName && (
                    <p className="text-xs font-semibold mb-2" style={{ color: textSecondary }}>
                      To: <span style={{ color: textPrimary }}>{recipientName}</span>
                    </p>
                  )}
                  <p
                    className="text-sm leading-relaxed italic"
                    style={{ color: textPrimary, fontFamily: "Georgia, serif", minHeight: "60px" }}
                  >
                    {editedMessage || drafts[selectedDraft] || ""}
                  </p>
                  {senderName && (
                    <p className="text-xs font-semibold mt-3 text-right" style={{ color: textSecondary }}>
                      — <span style={{ color: textPrimary }}>{senderName}</span>
                    </p>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <svg className="w-10 h-10 mb-2" style={{ color: textMuted }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.357l4.97-.348c1.584-.233 2.707-1.626 2.707-3.225V6.741c0-1.6-1.123-2.994-2.708-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.372 3.747 2.25 5.14 2.25 6.741v6.018Z"/>
                  </svg>
                  <p className="text-xs" style={{ color: textMuted }}>Fill out the form to generate your card message</p>
                </div>
              )}
            </div>

            {drafts.length > 0 && (
              <>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: labelC }}>
                  Fine-tune the message
                </label>
                <textarea
                  rows={4}
                  value={editedMessage}
                  onChange={e => setEditedMessage(e.target.value.slice(0, MESSAGE_LIMIT))}
                  className={`${inputClass} resize-none`}
                  style={inputStyle}
                />
                <p
                  className="text-[10px] mt-1 text-right"
                  style={{ color: charsLeft < 20 ? "#f43f5e" : textMuted }}
                >
                  {charsLeft} characters left
                </p>

                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition hover:border-[#2E8B34] hover:text-[#2E8B34]"
                    style={{
                      backgroundColor: inputBg,
                      border: `1px solid ${borderC}`,
                      color: textPrimary,
                    }}
                  >
                    {copied ? (
                      <>
                        <svg className="w-3.5 h-3.5" style={{ color: SITE_GREEN }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"/>
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleUseInOrder}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-white rounded-lg transition hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, ${SITE_GREEN}, ${DARK_GREEN})` }}
                  >
                    Use in My Order
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Tips card */}
          <div className="rounded-2xl p-4" style={{ backgroundColor: surfaceBg, border: `1px solid ${borderC}` }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: textSecondary }}>
              💡 Tips
            </p>
            <ul className="text-xs space-y-1.5 leading-relaxed" style={{ color: textSecondary }}>
              <li>• Be specific in the &quot;special mention&quot; box for more personal results</li>
              <li>• Try different tones to find the right voice</li>
              <li>• You can edit any generated message before using it</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}