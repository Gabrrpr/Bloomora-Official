import { useState, useEffect, useRef } from "react"
import { addToCart } from "../utils/cart.js"
import { useTheme } from "../context/ThemeContext"
import { useBranch } from "../context/BranchContext";
import { api } from "../services/api.js"
import { generateCardMessage, RELATIONSHIP_OPTIONS, OCCASION_OPTIONS, TONE_OPTIONS, getPendingCard, clearPendingCard } from "../utils/cardMessage.js"

import withCardImg from "../assets/productpreview/withCard.webp"
import noCardImg   from "../assets/productpreview/noCard.webp"
import letterImg   from "../assets/productpreview/Letter.png"
import writingImg  from "../assets/productpreview/WritingLetter.png"

const G   = "#2E8B34"
const DG  = "#0C573E"
const ERR = "#ef4444"

const INITIAL_ADDON_COUNT = 4
const QTY_OPTIONS = ["1 pc","3 pcs","6 pcs","Dozen"]
const CATEGORY_COLORS = {
  Roses:        [{name:"Red",hex:"#e11d48"},{name:"Pink",hex:"#f472b6"},{name:"White",hex:"#e5e7eb",outline:true},{name:"Yellow",hex:"#fbbf24"}],
  Bouquets:     [{name:"Purple",hex:"#a78bfa"},{name:"Pink",hex:"#f9a8d4"},{name:"Green",hex:"#86efac"}],
  Tulips:       [{name:"Pink",hex:"#f9a8d4"},{name:"Purple",hex:"#c084fc"},{name:"White",hex:"#e5e7eb",outline:true},{name:"Red",hex:"#e11d48"}],
  Arrangements: [{name:"Natural",hex:"#fbbf24"},{name:"Mixed",hex:"#a78bfa"},{name:"Warm",hex:"#fb923c"}],
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const WDAYS  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

const pctOff      = (o, p) => (o && o > p ? Math.round((1 - p / o) * 100) : 0)
const pad         = d      => String(d).padStart(2, "0")
const toStr       = d      => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
const todayD      = ()     => { const d = new Date(); d.setHours(0,0,0,0); return d }
const tomorrowStr = ()     => { const d = new Date(); d.setDate(d.getDate()+1); return toStr(d) }
const fmtDate     = s      => { if (!s) return ""; const [y,m,d] = s.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("en-PH",{weekday:"short",month:"short",day:"numeric"}) }
const isTodayAvail = ()    => new Date().getHours() < 14

/* ── Viewport hook ── */
function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  )
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [breakpoint])
  return isMobile
}

/* ── Mini Calendar ── */
const MAX_ORDER_DAYS = 30 // Customers can't schedule beyond this — flower prices fluctuate (e.g. holidays)

function MiniCalendar({ selected, onSelect }) {
  const now = todayD()
  const max = (() => { const d = todayD(); d.setDate(d.getDate() + MAX_ORDER_DAYS); return d })()
  const [vd, setVd] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const first = new Date(vd.y, vd.m, 1).getDay()
  const dim   = new Date(vd.y, vd.m+1, 0).getDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length: dim }, (_, i) => i+1)]
  const cd   = d => new Date(vd.y, vd.m, d)
  const past = d => cd(d) < now
  const far  = d => cd(d) > max
  const tod  = d => cd(d).toDateString() === now.toDateString()
  const sel  = d => {
    if (!selected) return false
    const [y,m,dd] = selected.split("-").map(Number)
    return cd(d).toDateString() === new Date(y,m-1,dd).toDateString()
  }
  const canPrev = !(vd.y === now.getFullYear() && vd.m === now.getMonth())
  const canNext = new Date(vd.y, vd.m+1, 1) <= max
  return (
    <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <button onClick={() => canPrev && setVd(v => v.m===0 ? {y:v.y-1,m:11} : {...v,m:v.m-1})} disabled={!canPrev}
          className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-30 disabled:cursor-default">
          <svg width="10" height="10" fill="none" stroke="#6b7280" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
        </button>
        <span className="text-sm font-semibold text-gray-800">{MONTHS[vd.m]} {vd.y}</span>
        <button onClick={() => canNext && setVd(v => v.m===11 ? {y:v.y+1,m:0} : {...v,m:v.m+1})} disabled={!canNext}
          className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-30 disabled:cursor-default">
          <svg width="10" height="10" fill="none" stroke="#6b7280" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-7 mb-1.5">
          {WDAYS.map((d,i) => <div key={i} className="text-center text-[10px] font-medium text-gray-400">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((d,i) => {
            if (!d) return <div key={i}/>
            const p = past(d), f = far(d), t = tod(d), s = sel(d)
            const disabled = p || f
            return (
              <button key={i} onClick={() => !disabled && onSelect(toStr(cd(d)))} disabled={disabled}
                title={f ? `Orders can only be scheduled within ${MAX_ORDER_DAYS} days` : undefined}
                className="h-8 rounded-lg text-xs transition-all"
                style={{
                  cursor: disabled ? "default" : "pointer",
                  color: s ? "white" : disabled ? "#d1d5db" : t ? G : "#374151",
                  background: s ? G : t ? "#f0fdf4" : "transparent",
                  fontWeight: s || t ? 600 : 400,
                  outline: t && !s ? `2px solid ${G}` : "none",
                  outlineOffset: -1
                }}>
                {d}
              </button>
            )
          })}
        </div>
        <div className="flex items-start gap-1.5 mt-2.5 pt-2.5 border-t border-gray-100">
          <svg width="13" height="13" fill="none" stroke="#9ca3af" strokeWidth={2} viewBox="0 0 24 24" className="flex-shrink-0 mt-px"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p className="text-[10px] leading-snug text-gray-400 m-0">
            Orders can be scheduled up to {MAX_ORDER_DAYS} days ahead. Beyond that, flower prices may change (e.g. holiday seasons).
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Confetti ── */
const CONFETTI_COLORS = ["#2E8B34","#f472b6","#fbbf24","#60a5fa","#a78bfa","#f87171","#34d399","#fb923c"]
const CONFETTI_PIECES = Array.from({ length: 72 }, (_, i) => {
  const angle = (i/72)*360 + (Math.random()-0.5)*18
  const dist  = 100 + Math.random()*140
  const rad   = angle * Math.PI / 180
  return {
    id: i,
    color: CONFETTI_COLORS[i%8],
    dx: Math.cos(rad)*dist,
    dy: Math.sin(rad)*dist,
    delay: Math.random()*0.16,
    dur: 1 + Math.random()*0.6,
    size: 6 + Math.random()*10,
    rot: (Math.random()-0.5)*720,
    type: i%3===0 ? "circle" : i%3===1 ? "rect" : "tri"
  }
})

function injectBurstCSS() {
  if (document.getElementById("bloomora-confetti-css")) return
  const s = document.createElement("style")
  s.id = "bloomora-confetti-css"
  s.textContent = `@keyframes cf-burst{0%{transform:translate(0,0) rotate(0deg) scale(0.3);opacity:0}10%{transform:translate(0,0) rotate(0deg) scale(1.1);opacity:1}60%{transform:translate(var(--dx),var(--dy)) rotate(calc(var(--r)*0.65)) scale(1);opacity:1}100%{transform:translate(calc(var(--dx)*1.25),calc(var(--dy)*1.35)) rotate(var(--r)) scale(0.2);opacity:0}}`
  document.head.appendChild(s)
}

function Confetti() {
  useEffect(() => { injectBurstCSS() }, [])
  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
      {CONFETTI_PIECES.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          width:  p.type==="rect" ? `${p.size*1.8}px` : `${p.size}px`,
          height: `${p.size}px`,
          background: p.type==="tri" ? "transparent" : p.color,
          borderRadius: p.type==="circle" ? "50%" : p.type==="rect" ? "2px" : "0",
          borderLeft:   p.type==="tri" ? `${p.size/2}px solid transparent` : "none",
          borderRight:  p.type==="tri" ? `${p.size/2}px solid transparent` : "none",
          borderBottom: p.type==="tri" ? `${p.size}px solid ${p.color}` : "none",
          "--dx": `${p.dx}px`,
          "--dy": `${p.dy}px`,
          "--r":  `${p.rot}deg`,
          animation: `cf-burst ${p.dur}s cubic-bezier(0.22,0.61,0.36,1) ${p.delay}s 1 forwards`
        }}/>
      ))}
    </div>
  )
}

/* ── AI Panel ── */
function AIPanel({ onUse, onBack, isMobile }) {
  const [relationship, setRelationship] = useState("")
  const [occasion,     setOccasion]     = useState("")
  const [tone,         setTone]         = useState("warm")
  const [extra,        setExtra]        = useState("")
  const [loading,      setLoading]      = useState(false)
  const [generated,    setGenerated]    = useState("")
  const [err,          setErr]          = useState("")

  const generate = async () => {
    if (!relationship || !occasion) { setErr("Please select a relationship and occasion."); return }
    setErr(""); setLoading(true); setGenerated("")
    const start = Date.now()
    try {
      const text = await generateCardMessage({ relationship, occasion, tone, extra })
      const elapsed = Date.now() - start
      // keep the flower loader on screen long enough to read, so it never just flashes
      if (elapsed < 1000) await new Promise(r => setTimeout(r, 1000 - elapsed))
      setGenerated(text)
    } catch (e) {
      setErr("Could not generate message. Please try again.")
    }
    setLoading(false)
  }

  return (
    <div className={`pms-scroll pm-stagger flex-1 overflow-y-auto flex flex-col gap-4 ${isMobile ? "px-4 py-5" : "px-7 py-6"}`}>
      <div>
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none mb-4 p-0">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
          Back to card form
        </button>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
            <svg width="17" height="17" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          </div>
          <div>
            <p className="text-base font-bold text-gray-900 m-0">AI Message Writer</p>
            <p className="text-xs text-gray-400 m-0">Generate a heartfelt message in seconds</p>
          </div>
        </div>
      </div>

      <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
        {[["Relationship",relationship,setRelationship,RELATIONSHIP_OPTIONS],["Occasion",occasion,setOccasion,OCCASION_OPTIONS]].map(([l,val,setter,opts]) => (
          <div key={l}>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">{l} *</label>
            <select value={val} onChange={e => { setter(e.target.value); setErr("") }}
              className="w-full rounded-lg px-3 py-2.5 text-sm bg-white cursor-pointer outline-none transition-colors"
              style={{ border: "1.5px solid #e5e7eb", color: val ? "#1f2937" : "#9ca3af" }}
              onFocus={e => e.target.style.borderColor = G}
              onBlur={e  => e.target.style.borderColor = "#e5e7eb"}>
              <option value="">Select...</option>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Tone</label>
        <div className="flex gap-1.5 flex-wrap">
          {TONE_OPTIONS.map(t => (
            <button key={t.value} onClick={() => setTone(t.value)}
              className="px-3 py-1.5 rounded-full text-xs cursor-pointer transition-all"
              style={{
                fontWeight: tone===t.value ? 600 : 400,
                border: `1px solid ${tone===t.value ? G : "#e5e7eb"}`,
                background: tone===t.value ? "#f0fdf4" : "white",
                color: tone===t.value ? G : "#374151"
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
          Extra context <span className="normal-case tracking-normal font-normal text-gray-400">(optional)</span>
        </label>
        <input
          placeholder="e.g. She loves sunflowers, we have been friends for 10 years..."
          value={extra}
          onChange={e => setExtra(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm bg-white outline-none transition-colors"
          style={{ border: "1.5px solid #e5e7eb", color: "#1f2937" }}
          onFocus={e => e.target.style.borderColor = G}
          onBlur={e  => e.target.style.borderColor = "#e5e7eb"}/>
      </div>

      {err && <p className="text-xs text-red-500">{err}</p>}

      <button onClick={generate} disabled={loading}
        className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer border-none transition-opacity"
        style={{ background: loading ? "#e5e7eb" : `linear-gradient(135deg,${DG},${G})`, color: loading ? "#9ca3af" : "white" }}>
        {loading ? (
          <>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
              <circle cx="12" cy="12" r="10" stroke="#d1d5db" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke={G} strokeWidth="3" strokeLinecap="round"/>
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            {generated ? "Regenerate" : "Generate Message"}
          </>
        )}
      </button>

      {loading && (
        <div className="flex flex-col items-center justify-center text-center py-8" style={{ animationDelay: "0s" }}>
          <div style={{ animation: "qPulse 1.4s ease-in-out infinite" }}>
            <svg viewBox="0 0 64 64" className="w-14 h-14" style={{ animation: "qSpin 3.2s linear infinite", transformOrigin: "center" }}>
              {[0, 72, 144, 216, 288].map(a => (
                <ellipse key={a} cx="32" cy="17" rx="8.5" ry="13" fill={G} opacity="0.85" transform={`rotate(${a} 32 32)`}/>
              ))}
              <circle cx="32" cy="32" r="7.5" fill="#facc15"/>
            </svg>
          </div>
          <p className="text-sm font-semibold mt-4 mb-0.5 text-gray-700">Writing your message…</p>
          <p className="text-xs text-gray-400 m-0">Crafting something heartfelt</p>
        </div>
      )}

      {generated && !loading && (
        <div className="border rounded-xl overflow-hidden" style={{ borderColor: `${G}30`, animationDelay: "0s" }}>
          <div className="px-4 py-2.5 border-b" style={{ background: "#f0fdf4", borderColor: `${G}20` }}>
            <p className="text-xs font-semibold uppercase tracking-widest m-0" style={{ color: G }}>Generated Message</p>
          </div>
          <div className="p-4 bg-white">
            <p className="text-sm text-gray-600 leading-relaxed italic mb-3">"{generated}"</p>
            <div className="flex gap-2">
              <button onClick={() => onUse(generated)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white border-none cursor-pointer"
                style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
                Use this message
              </button>
              <button onClick={generate}
                className="px-4 py-2.5 rounded-lg text-sm border border-gray-200 bg-white text-gray-600 cursor-pointer">
                Try again
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

/* ── Card Step ── */
function CardStep({ delivLabel, dest, onClose, onNavigate, isMobile }) {
  const [phase,   setPhase]   = useState("choice")
  const [form,    setForm]    = useState(() => {
    const pending = getPendingCard()
    return { msg: pending?.message || "", to: "", from: "" }
  })
  const [formErr, setFormErr] = useState({})
  const [hovered, setHovered] = useState(null)
  const [choice,  setChoice]  = useState(null)
  const [showAI,  setShowAI]  = useState(false)

  const inp = err => ({
    width: "100%",
    border: `1.5px solid ${err ? "#fca5a5" : "#e5e7eb"}`,
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    color: "#1f2937",
    outline: "none",
    background: "white",
    boxSizing: "border-box",
    transition: "border-color 0.15s"
  })

  useEffect(() => {
    if (phase === "done") {
      const t = setTimeout(() => { onClose(); onNavigate?.(dest==="checkout" ? "checkout" : "cart") }, 2800)
      return () => clearTimeout(t)
    }
  }, [phase])

  const handleConfirm = () => {
    const e = {}
    if (!form.msg.trim())  e.msg  = true
    if (!form.to.trim())   e.to   = true
    if (!form.from.trim()) e.from = true
    setFormErr(e)
    if (Object.keys(e).length > 0) return
    clearPendingCard()
    setPhase("done")
  }

  if (phase === "done") return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-white">
      <Confetti/>
      <div className="relative z-10 flex flex-col items-center px-10 py-12 text-center">
        <div className="w-28 h-28 rounded-full flex items-center justify-center mb-8"
          style={{ background: `linear-gradient(135deg,${DG},${G})`, boxShadow: "0 20px 60px rgba(46,139,52,0.35)" }}>
          <svg width="54" height="54" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
        </div>
        <p className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Item added to cart!</p>
        <p className="text-lg text-gray-500 leading-relaxed max-w-sm mb-6">
          {choice ? "Your greeting card has been included." : "Your order has been added without a greeting card."}
        </p>
        {delivLabel && (
          <div className={`flex items-center gap-2 font-semibold rounded-full border-2 mb-6 max-w-full ${isMobile ? "text-sm px-4 py-2.5" : "text-base px-6 py-3"}`}
            style={{ color: DG, background: "#f0fdf4", borderColor: "#bbf7d0" }}>
            <svg width={isMobile?14:16} height={isMobile?14:16} fill="none" stroke={DG} strokeWidth={2} viewBox="0 0 24 24" className="flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span className="text-center">Delivery: {delivLabel}</span>
          </div>
        )}
        <p className="text-sm text-gray-400">Redirecting you now...</p>
      </div>
    </div>
  )

  if (phase === "choice") return (
    <div className={`w-full h-full flex flex-col items-center justify-center overflow-y-auto ${isMobile ? "px-4 py-6" : "px-12 py-10"}`}>
      <div className={`rounded-full flex items-center justify-center ${isMobile ? "w-14 h-14 mb-4" : "w-16 h-16 mb-5"}`}
        style={{ background: `linear-gradient(135deg,${DG},${G})`, boxShadow: "0 10px 32px rgba(46,139,52,0.25)" }}>
        <svg width={isMobile ? 26 : 30} height={isMobile ? 26 : 30} fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
      </div>
      <p className={`font-bold text-gray-900 mb-2 text-center ${isMobile ? "text-2xl" : "text-3xl"}`}>Added to cart!</p>
      <p className={`text-gray-500 text-center leading-relaxed max-w-sm mb-3 ${isMobile ? "text-base" : "text-lg"}`}>Would you like to include a greeting card with your order?</p>
      {delivLabel && (
        <div className={`font-semibold rounded-full border-2 max-w-full text-center ${isMobile ? "text-xs px-4 py-2 mb-6" : "text-sm px-5 py-2 mb-8"}`}
          style={{ color: DG, background: "#f0fdf4", borderColor: "#bbf7d0" }}>
          Delivery: {delivLabel}
        </div>
      )}
      <div className={`grid grid-cols-2 w-full ${isMobile ? "gap-3 max-w-md" : "gap-4 max-w-lg"}`}>
        {[
          { key: true,  img: withCardImg, label: "Yes, add a card", sub: "Include a greeting card" },
          { key: false, img: noCardImg,   label: "No thanks",       sub: "Continue without card" }
        ].map(opt => (
          <button key={String(opt.key)}
            onClick={() => { setChoice(opt.key); setPhase(opt.key ? "form" : "done") }}
            className="rounded-2xl overflow-hidden bg-white text-left p-0 cursor-pointer transition-all flex flex-col"
            style={{
              border: `2px solid ${hovered===opt.key ? G : "#e5e7eb"}`,
              boxShadow: hovered===opt.key ? "0 8px 28px rgba(46,139,52,0.16)" : "none"
            }}
            onMouseEnter={() => setHovered(opt.key)}
            onMouseLeave={() => setHovered(null)}>
            <div className="bg-gray-50 overflow-hidden w-full" style={{ aspectRatio: isMobile ? "4/3" : "auto", height: isMobile ? "auto" : 176 }}>
              <img src={opt.img} alt={opt.label} className="w-full h-full object-cover"
                onError={e => { e.target.style.display="none" }}/>
            </div>
            <div className={isMobile ? "p-3" : "p-4"}>
              <p className={`font-semibold text-gray-900 m-0 ${isMobile ? "text-sm" : "text-base"}`}>{opt.label}</p>
              <p className={`text-gray-400 mt-1 m-0 ${isMobile ? "text-xs" : "text-sm"}`}>{opt.sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  const MSG_MAX  = 160
  const NAME_MAX = 30
  const leftImg  = showAI ? writingImg : letterImg

  const Body = (
    showAI ? (
      <div key="ai" className="pm-step-anim flex-1 flex flex-col min-h-0">
        <AIPanel
          isMobile={isMobile}
          onUse={msg => { setForm(f => ({...f,msg})); setFormErr(e => ({...e,msg:false})); setShowAI(false) }}
          onBack={() => setShowAI(false)}/>
      </div>
    ) : (
      <div key="form" className={`pm-step-anim pm-stagger pm-scroll flex-1 overflow-y-auto flex flex-col ${isMobile ? "px-4 py-5" : "px-6 py-6"}`}>
        <p className="text-xl font-bold text-gray-900 mb-1">Write your greeting card</p>
        <p className="text-sm text-gray-400 mb-4">All fields are required.</p>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-4">
          <svg width="15" height="15" fill="none" stroke="#d97706" strokeWidth={2} viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          <p className="text-xs text-amber-800 leading-relaxed m-0">Please keep your message kind and respectful.</p>
        </div>

        <div className="border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Preview</p>
          <p className="text-sm leading-relaxed min-h-10 mb-3 break-words"
            style={{ color: form.msg ? "#1f2937" : "#d1d5db", fontStyle: form.msg ? "normal" : "italic" }}>
            {form.msg || "Your message..."}
          </p>
          <div className="flex justify-between border-t border-gray-100 pt-2">
            <span className="text-sm text-gray-500">To: <strong className="text-gray-800">{form.to || "..."}</strong></span>
            <span className="text-sm text-gray-500">From: <strong className="text-gray-800">{form.from || "..."}</strong></span>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <label className="text-xs font-semibold uppercase tracking-widest flex items-center gap-1 flex-shrink-0"
              style={{ color: formErr.msg ? "#ef4444" : "#374151" }}>
              Message <span className="text-red-400">*</span>
              {formErr.msg && <span className="normal-case tracking-normal font-normal">required</span>}
            </label>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button onClick={() => setShowAI(true)}
                className="flex items-center gap-1 text-xs font-semibold cursor-pointer bg-transparent border-none p-0 underline underline-offset-2 whitespace-nowrap"
                style={{ color: G }}>
                <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                {isMobile ? "Use AI" : "No idea what to write?"}
              </button>
              <span className="text-xs text-gray-400">{form.msg.length}/{MSG_MAX}</span>
            </div>
          </div>
          <textarea rows={3} placeholder="Write a warm, kind message..." value={form.msg} maxLength={MSG_MAX}
            onChange={e => { setForm(f => ({...f,msg:e.target.value})); setFormErr(e => ({...e,msg:false})) }}
            style={{ ...inp(formErr.msg), resize: "none" }}
            onFocus={e  => e.target.style.borderColor = formErr.msg ? "#ef4444" : G}
            onBlur={e   => e.target.style.borderColor = formErr.msg ? "#fca5a5" : "#e5e7eb"}/>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {[["to","e.g. Maria","To"],["from","e.g. Juan","From"]].map(([k,ph,l]) => (
            <div key={k}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest flex items-center gap-1"
                  style={{ color: formErr[k] ? "#ef4444" : "#374151" }}>
                  {l} <span className="text-red-400">*</span>
                  {formErr[k] && <span className="normal-case tracking-normal font-normal">req.</span>}
                </label>
                <span className="text-xs text-gray-400">{form[k].length}/{NAME_MAX}</span>
              </div>
              <input placeholder={ph} value={form[k]} maxLength={NAME_MAX}
                onChange={e => { setForm(f => ({...f,[k]:e.target.value})); setFormErr(e => ({...e,[k]:false})) }}
                style={inp(formErr[k])}
                onFocus={e => e.target.style.borderColor = formErr[k] ? "#ef4444" : G}
                onBlur={e  => e.target.style.borderColor = formErr[k] ? "#fca5a5" : "#e5e7eb"}/>
            </div>
          ))}
        </div>

        <button onClick={handleConfirm}
          className="w-full py-3.5 rounded-xl text-base font-semibold text-white border-none cursor-pointer mb-3"
          style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
          Confirm & Add to Cart
        </button>
        <button onClick={() => setPhase("choice")}
          className="w-full text-center bg-transparent border-none text-sm text-gray-400 cursor-pointer">
          Back
        </button>
      </div>
    )
  )

  if (isMobile) return (
    <div className="w-full h-full overflow-y-auto bg-gray-100">
      <div className="m-3 rounded-2xl bg-white overflow-hidden" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
        {Body}
      </div>
    </div>
  )

  return (
    <div className="pm-card-form w-full h-full flex flex-row overflow-hidden">
      <div className="pm-card-img flex-shrink-0 overflow-hidden bg-gray-50 flex items-center justify-center p-6" style={{ width: "50%" }}>
        <img src={leftImg} alt="" className="w-full h-full object-contain"/>
      </div>
      <div className="pm-card-right bg-gray-100 overflow-y-auto" style={{ width: "50%" }}>
        <div className="min-h-full flex flex-col justify-center">
          <div className="m-4 rounded-2xl bg-white overflow-hidden" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
            {Body}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Quote line row ── */
function QuoteLineRow({ label, unit, qty, txt, subTxt, addon }) {
  return (
    <div className="flex justify-between items-start mb-1.5">
      <div className="flex-1 min-w-0 pr-2">
        <span className="text-xs font-medium" style={{ color: txt }}>{addon ? `+ ${label}` : label}</span>
        <span className="text-[10px] block" style={{ color: subTxt }}>
          ₱{unit.toLocaleString()} × {qty.toLocaleString()}
        </span>
      </div>
      <span className="text-xs font-semibold whitespace-nowrap" style={{ color: txt }}>
        ₱{(unit * qty).toLocaleString()}
      </span>
    </div>
  )
}

/* ── Quote Step ── */
function QuoteStep({ product, color, sizeLabel, addOnObjects, addOnTotal, isDark, onBack, onClose, onOpenChat, isMobile }) {
  const [phase,  setPhase]  = useState("input")
  const [qtyStr, setQtyStr] = useState("")
  const [err,    setErr]    = useState("")
  const [copied, setCopied] = useState(false)
  const [meta,   setMeta]   = useState({ qty: 0, ref: "", date: "" })

  const unitPrice = product.price + addOnTotal
  const QUICK = [10, 25, 50, 100]

  const panelBg = isDark ? "#0f172a" : "#f3f4f6"
  const docBg   = isDark ? "#1e293b" : "white"
  const subBg   = isDark ? "#0f172a" : "#f9fafb"
  const txt     = isDark ? "#f8fafc" : "#111827"
  const subTxt  = isDark ? "#cbd5e1" : "#6b7280"
  const faint   = isDark ? "#94a3b8" : "#9ca3af"
  const bdr     = isDark ? "#475569" : "#e5e7eb"
  const lineBdr = isDark ? "#334155" : "#f3f4f6"
  const accent  = isDark ? "#4ade80" : G

  const generate = () => {
    const n = parseInt(qtyStr, 10)
    if (!n || n < 1) { setErr("Please enter how many you'd like to order."); return }
    const ref  = `BLM-${product.id}-${Date.now().toString().slice(-6)}`
    const date = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
    setMeta({ qty: n, ref, date })
    setErr("")
    setPhase("loading")
  }

  // After the flower loader plays, reveal the quotation
  useEffect(() => {
    if (phase !== "loading") return
    const t = setTimeout(() => setPhase("report"), 1600)
    return () => clearTimeout(t)
  }, [phase])

  const grand = unitPrice * meta.qty
  const quoteSummary = `${product.name} · ${meta.qty.toLocaleString()} pcs · ₱${grand.toLocaleString()}`

  const buildReportText = () => {
    const L = []
    L.push("BULK ORDER QUOTATION")
    L.push("Esting's Flower International Inc.")
    L.push(`Ref ${meta.ref}  ·  ${meta.date}`)
    L.push("")
    L.push(`Item: ${product.name}`)
    if (color?.name) L.push(`Color: ${color.name}`)
    if (sizeLabel)   L.push(`Variant: ${sizeLabel}`)
    L.push(`Quantity: ${meta.qty}`)
    L.push("")
    L.push(`Base: PHP ${product.price.toLocaleString()} x ${meta.qty} = PHP ${(product.price * meta.qty).toLocaleString()}`)
    addOnObjects.forEach(a =>
      L.push(`Add-on (${a.name}): PHP ${a.price.toLocaleString()} x ${meta.qty} = PHP ${(a.price * meta.qty).toLocaleString()}`)
    )
    L.push("")
    L.push(`Per-unit total: PHP ${unitPrice.toLocaleString()}`)
    L.push(`GRAND TOTAL: PHP ${grand.toLocaleString()}`)
    L.push("")
    L.push("This is a standard-rate estimate. Is a bulk discount available for this quantity?")
    return L.join("\n")
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildReportText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable */ }
  }

  const download = () => {
    try {
      const blob = new Blob([buildReportText()], { type: "text/plain;charset=utf-8" })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href = url
      a.download = `Quotation-${meta.ref}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch { /* download unavailable */ }
  }

  return (
    <div className={`pm-quote-form w-full h-full flex overflow-hidden ${isMobile ? "flex-col" : "flex-row"}`}>
      {!isMobile && (
        <div className="pm-quote-img flex-shrink-0 overflow-hidden flex items-center justify-center p-6"
          style={{ width: "50%", background: isDark ? "#0f172a" : "#f3f4f6" }}>
          <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain"
            onError={e => { e.target.style.display="none" }}/>
        </div>
      )}

      <div className={`pm-quote-right flex flex-col ${isMobile ? "overflow-y-auto" : "overflow-y-auto"}`}
        style={{ width: isMobile ? "100%" : "50%", flex: isMobile ? "1 1 auto" : undefined, minHeight: 0, background: panelBg }}>
        <div className={`flex flex-col rounded-2xl overflow-hidden ${isMobile ? "m-2" : "m-4 my-auto"}`}
          style={{ background: docBg, boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>

          {phase === "input" ? (
            <div className={`pm-scroll px-6 py-6 flex flex-col ${isMobile ? "" : "overflow-y-auto"}`}>
              <button onClick={onBack}
                className="flex items-center gap-1.5 text-sm cursor-pointer bg-transparent border-none mb-4 p-0"
                style={{ color: faint }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
                Back to product
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
                  <svg width="17" height="17" fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <div>
                  <p className="text-base font-bold m-0" style={{ color: txt }}>Bulk Order Quotation</p>
                  <p className="text-xs m-0" style={{ color: faint }}>Get an instant estimate for a large order</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl mb-5"
                style={{ background: subBg, border: `1px solid ${bdr}` }}>
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ border: `1px solid ${bdr}` }}>
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover"
                    onError={e => { e.target.style.display="none" }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate m-0" style={{ color: txt }}>{product.name}</p>
                  <p className="text-xs m-0" style={{ color: subTxt }}>
                    {[color?.name, sizeLabel].filter(Boolean).join(" · ") || "Standard"}
                  </p>
                  <p className="text-xs font-semibold mt-0.5 m-0" style={{ color: accent }}>
                    ₱{unitPrice.toLocaleString()} per unit{addOnTotal > 0 ? " (incl. add-ons)" : ""}
                  </p>
                </div>
              </div>

              <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: err ? "#ef4444" : subTxt }}>
                How many would you like to order? <span className="text-red-400">*</span>
              </label>
              <input
                type="number" min="1" inputMode="numeric" placeholder="e.g. 10"
                value={qtyStr}
                onChange={e => { setQtyStr(e.target.value.replace(/[^0-9]/g, "")); setErr("") }}
                onKeyDown={e => { if (e.key === "Enter") generate() }}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none mb-3"
                style={{
                  border: `1.5px solid ${err ? "#fca5a5" : bdr}`,
                  background: isDark ? "#0f172a" : "white",
                  color: txt
                }}
                onFocus={e => e.target.style.borderColor = err ? "#ef4444" : accent}
                onBlur={e  => e.target.style.borderColor = err ? "#fca5a5" : bdr}/>

              <div className="flex gap-2 flex-wrap">
                {QUICK.map(n => (
                  <button key={n} onClick={() => { setQtyStr(String(n)); setErr("") }}
                    className="px-3.5 py-1.5 rounded-full text-xs cursor-pointer transition-all"
                    style={{
                      fontWeight: qtyStr === String(n) ? 600 : 400,
                      border: `1px solid ${qtyStr === String(n) ? accent : bdr}`,
                      background: qtyStr === String(n) ? (isDark ? "rgba(74,222,128,0.12)" : "#f0fdf4") : "transparent",
                      color: qtyStr === String(n) ? accent : subTxt
                    }}>
                    {n} pcs
                  </button>
                ))}
              </div>

              {err && <p className="text-xs text-red-500 mt-2">{err}</p>}

              <button onClick={generate}
                className={`w-full py-3.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer flex items-center justify-center gap-2 ${isMobile ? "mt-6" : "mt-4"}`}
                style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Generate Quotation
              </button>
            </div>
          ) : phase === "loading" ? (
            <div className="px-6 py-16 flex flex-col items-center justify-center text-center" style={{ minHeight: 280 }}>
              <div style={{ animation: "qPulse 1.4s ease-in-out infinite" }}>
                <svg viewBox="0 0 64 64" className="w-20 h-20" style={{ animation: "qSpin 3.2s linear infinite", transformOrigin: "center" }}>
                  {[0, 72, 144, 216, 288].map(a => (
                    <ellipse key={a} cx="32" cy="17" rx="8.5" ry="13" fill={accent} opacity="0.85"
                      transform={`rotate(${a} 32 32)`}/>
                  ))}
                  <circle cx="32" cy="32" r="7.5" fill={isDark ? "#fde047" : "#facc15"}/>
                </svg>
              </div>
              <p className="text-base font-semibold mt-6 mb-1" style={{ color: txt }}>Preparing your quotation…</p>
              <p className="text-xs" style={{ color: faint }}>Crunching the numbers for {qtyStr} pcs</p>
              <style>{`
                @keyframes qSpin{to{transform:rotate(360deg)}}
                @keyframes qPulse{0%,100%{transform:scale(0.92)}50%{transform:scale(1.08)}}
                @keyframes qFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
                .q-report>*{animation:qFade 0.55s cubic-bezier(0.22,0.61,0.36,1) both}
                .q-report>*:nth-child(1){animation-delay:.05s}
                .q-report>*:nth-child(2){animation-delay:.22s}
                .q-report>*:nth-child(3){animation-delay:.42s}
                .q-report>*:nth-child(4){animation-delay:.6s}
                @media(prefers-reduced-motion:reduce){.q-report>*{animation:none}}
              `}</style>
            </div>
          ) : (
            <div className="pm-scroll px-6 py-6 q-report">
              <button onClick={() => setPhase("input")}
                className="flex items-center gap-1.5 text-sm cursor-pointer bg-transparent border-none mb-4 p-0"
                style={{ color: faint }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
                Change quantity
              </button>

              <div className="rounded-xl overflow-hidden mb-4" style={{ border: `1px solid ${bdr}` }}>
                <div className="px-4 py-3" style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white m-0" style={{ opacity: 0.85 }}>Bulk Order Quotation</p>
                  <p className="text-sm font-bold text-white m-0">Esting's Flower International Inc.</p>
                  <p className="text-[10px] text-white m-0 mt-0.5" style={{ opacity: 0.8 }}>Ref {meta.ref} · {meta.date}</p>
                </div>

                <div className="px-4 py-3" style={{ background: subBg, borderBottom: `1px solid ${lineBdr}` }}>
                  <div className="flex justify-between mb-1 gap-3">
                    <span className="text-xs flex-shrink-0" style={{ color: subTxt }}>Item</span>
                    <span className="text-xs font-semibold text-right" style={{ color: txt }}>{product.name}</span>
                  </div>
                  {color?.name && (
                    <div className="flex justify-between mb-1">
                      <span className="text-xs" style={{ color: subTxt }}>Color</span>
                      <span className="text-xs font-medium" style={{ color: txt }}>{color.name}</span>
                    </div>
                  )}
                  {sizeLabel && (
                    <div className="flex justify-between mb-1">
                      <span className="text-xs" style={{ color: subTxt }}>Variant</span>
                      <span className="text-xs font-medium" style={{ color: txt }}>{sizeLabel}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-xs" style={{ color: subTxt }}>Quantity</span>
                    <span className="text-xs font-semibold" style={{ color: accent }}>{meta.qty.toLocaleString()} pcs</span>
                  </div>
                </div>

                <div className="px-4 py-3" style={{ background: docBg }}>
                  <QuoteLineRow label={product.name} unit={product.price} qty={meta.qty} txt={txt} subTxt={subTxt}/>
                  {addOnObjects.map(a => (
                    <QuoteLineRow key={a.id} label={a.name} unit={a.price} qty={meta.qty} txt={txt} subTxt={subTxt} addon/>
                  ))}
                  <div className="flex justify-between pt-2 mt-1" style={{ borderTop: `1px dashed ${bdr}` }}>
                    <span className="text-xs" style={{ color: subTxt }}>Per-unit total</span>
                    <span className="text-xs font-semibold" style={{ color: txt }}>₱{unitPrice.toLocaleString()}</span>
                  </div>
                </div>

                <div className="px-4 py-3 flex items-center justify-between"
                  style={{ background: isDark ? "rgba(74,222,128,0.08)" : "#f0fdf4", borderTop: `1px solid ${lineBdr}` }}>
                  <span className="text-sm font-semibold" style={{ color: txt }}>Grand Total</span>
                  <span className="text-2xl font-bold tracking-tight" style={{ color: accent }}>₱{grand.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl mb-4"
                style={{ background: isDark ? "rgba(245,158,11,0.13)" : "#fffbeb", border: `1px solid ${isDark ? "rgba(245,158,11,0.35)" : "#fde68a"}` }}>
                <svg width="14" height="14" fill="none" stroke={isDark ? "#fbbf24" : "#d97706"} strokeWidth={2} viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <p className="text-xs leading-relaxed m-0" style={{ color: isDark ? "#fde68a" : "#92400e" }}>
                  This is a standard-rate estimate. Bulk discounts aren't applied automatically. Message us to discuss a better rate for this quantity.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex gap-2.5">
                  <button onClick={copy}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all"
                    style={{ border: `1.5px solid ${bdr}`, background: "transparent", color: copied ? accent : subTxt }}>
                    {copied ? (
                      <><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Copied</>
                    ) : (
                      <><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>Copy</>
                    )}
                  </button>
                  <button onClick={download}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all"
                    style={{ border: `1.5px solid ${bdr}`, background: "transparent", color: subTxt }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"/></svg>
                    Download
                  </button>
                </div>
                <button onClick={() => onOpenChat({ text: buildReportText(), summary: quoteSummary })}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white cursor-pointer flex items-center justify-center gap-2 border-none"
                  style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.3-3.9A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                  Discuss on chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Image Zoom ── */
function ImgZoom({ product, isDark }) {
  const [pos,    setPos]    = useState(null)
  const [active, setActive] = useState(false)
  const ref = useRef(null)

  const move = e => {
    const r = ref.current.getBoundingClientRect()
    setPos({ x: ((e.clientX-r.left)/r.width)*100, y: ((e.clientY-r.top)/r.height)*100 })
  }

  const originalPrice = product.original_price || product.original || 0
  const hasDisc = originalPrice > product.price

  return (
    <div ref={ref} className="pm-img flex-shrink-0 relative overflow-hidden"
      style={{ width: "42%", cursor: active ? "crosshair" : "default", background: isDark ? "#0f172a" : "#f3f4f6" }}
      onMouseMove={move}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => { setActive(false); setPos(null) }}>

      <img src={product.image} alt={product.name} className="pm-img-photo w-full h-full object-cover block"
        style={{
          transition: active ? "transform 0.25s ease-out" : "transform 0.4s ease",
          transform: active && pos ? "scale(1.7)" : "scale(1)",
          transformOrigin: pos ? `${pos.x}% ${pos.y}%` : "center",
          willChange: "transform"
        }}/>

      {hasDisc && (
        <div className="absolute top-4 left-4 text-white text-xs font-bold px-3 py-1 rounded-md z-10 pointer-events-none"
          style={{ background: DG }}>
          -{pctOff(originalPrice, product.price)}% OFF
        </div>
      )}

      {product.ribbon && (
        <div className="absolute top-11 left-0 z-10 pointer-events-none">
          <div className="text-[11px] font-bold text-white px-4 py-1"
            style={{ background: product._ribbonColor||G, clipPath: "polygon(0 0,calc(100% - 6px) 0,100% 50%,calc(100% - 6px) 100%,0 100%)" }}>
            {product.ribbon}
          </div>
        </div>
      )}

      {active && (
        <div className="absolute bottom-3 right-3 bg-black/45 text-white text-[10px] font-bold px-2.5 py-1 rounded-full pointer-events-none z-10 backdrop-blur-sm">
          ZOOM
        </div>
      )}

      {/* Persistent hint so users know the image is zoomable; fades out while hovering */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full pointer-events-none z-10 backdrop-blur-sm transition-opacity duration-300 whitespace-nowrap"
        style={{ background: "rgba(0,0,0,0.5)", opacity: active ? 0 : 1 }}>
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        Hover to zoom
      </div>
    </div>
  )
}

/* ── Review Summary ── */
function ReviewSummary({ reviews, isDark }) {
  const average = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.star_rating, 0) / reviews.length).toFixed(1)
    : "0.0"
  const rounded = Math.round(Number(average))

  const counts = {
    5: reviews.filter(r => r.star_rating === 5).length,
    4: reviews.filter(r => r.star_rating === 4).length,
    3: reviews.filter(r => r.star_rating === 3).length,
    2: reviews.filter(r => r.star_rating === 2).length,
    1: reviews.filter(r => r.star_rating === 1).length,
    media: reviews.filter(r => r.image_url).length,
  }

  const cardBg  = isDark ? "#0f172a" : "#f9fafb"
  const cardBdr = isDark ? "#334155" : "#eef2f0"
  const txt     = isDark ? "#f8fafc" : "#111827"
  const subTxt  = isDark ? "#94a3b8" : "#9ca3af"
  const starOff = isDark ? "#334155" : "#e5e7eb"
  const pillBdr = isDark ? "#334155" : "#d1fae5"
  const pillTxt = isDark ? "#cbd5e1" : "#374151"
  const accent  = isDark ? "#4ade80" : G

  const filters = [
    { label: "All",        n: reviews.length, showN: false },
    { label: "5 Star",     n: counts[5],      showN: true  },
    { label: "4 Star",     n: counts[4],      showN: true  },
    { label: "3 Star",     n: counts[3],      showN: true  },
    { label: "2 Star",     n: counts[2],      showN: true  },
    { label: "1 Star",     n: counts[1],      showN: true  },
    { label: "With Media", n: counts.media,   showN: true  },
  ]

  return (
    <div className="rounded-xl p-5 mb-6 flex flex-wrap gap-5 items-center"
      style={{ background: cardBg, border: `1px solid ${cardBdr}` }}>
      <div className="text-center pr-5" style={{ borderRight: `1px solid ${cardBdr}` }}>
        <p className="m-0 leading-none">
          <span className="text-4xl font-bold" style={{ color: txt }}>{average}</span>
          <span className="text-sm ml-1" style={{ color: subTxt }}>out of 5</span>
        </p>
        <div className="text-lg mt-1.5" style={{ letterSpacing: "1px" }}>
          {[1,2,3,4,5].map(i => (
            <span key={i} style={{ color: i <= rounded ? "#f59e0b" : starOff }}>★</span>
          ))}
        </div>
        <p className="text-[11px] mt-1.5 m-0" style={{ color: subTxt }}>
          {reviews.length} review{reviews.length === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {filters.map(f => (
          <button key={f.label}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer"
            style={{ border: `1px solid ${pillBdr}`, color: pillTxt, background: "transparent" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; e.currentTarget.style.background = isDark ? "rgba(74,222,128,0.08)" : "#f0fdf4" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = pillBdr; e.currentTarget.style.color = pillTxt; e.currentTarget.style.background = "transparent" }}>
            {f.label}{f.showN ? ` (${f.n})` : ""}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Shared sub-sections ── */
function DescriptionSection({ product, isDark }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-2"
        style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>Description</p>
      <p className="text-sm leading-relaxed"
        style={{ color: isDark ? "#cbd5e1" : "#374151" }}>
        {product.description || "No description provided for this arrangement."}
      </p>
    </div>
  )
}

function ColorSection({ colors, color, errors, setColor, setErrors, isDark }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-1"
        style={{ color: errors.color ? "#ef4444" : isDark ? "#94a3b8" : "#374151" }}>
        Color
        {color && <span className="normal-case tracking-normal font-medium ml-1" style={{ color: isDark ? "#4ade80" : G }}>{color.name}</span>}
        <span className="text-red-400">*</span>
        {errors.color && <span className="normal-case tracking-normal font-normal text-red-400">required</span>}
      </p>
      <div className="flex gap-3 items-center flex-wrap">
        {colors.map(c => (
          <button key={c.name} title={c.name}
            onClick={() => { setColor(c); setErrors(e => ({...e,color:false})) }}
            className="w-9 h-9 rounded-full transition-transform cursor-pointer"
            style={{
              background: c.hex,
              border: c.outline ? `1.5px solid ${isDark ? "#4b5563" : "#d1d5db"}` : "1.5px solid transparent",
              outline: color?.name===c.name ? `3px solid ${errors.color ? "#ef4444" : isDark ? "#4ade80" : G}` : "3px solid transparent",
              outlineOffset: 2,
              transform: color?.name===c.name ? "scale(1.12)" : "scale(1)"
            }}/>
        ))}
      </div>
    </div>
  )
}

function QtySection({ qty, errors, setQty, setErrors, isDark, onBulk }) {
  const G = "#2E8B34";
  const MAX_QTY = 99; // Prevents customers from accidentally ordering 10,000 items
  const BULK_HINT = 10; // Suggest a bulk quotation at/above this quantity
  const showBulkHint = Number(qty) >= BULK_HINT;

  const handleDecrement = () => {
    if (qty > 1) {
      setQty(qty - 1);
      setErrors(e => ({ ...e, qty: false }));
    }
  };

  const handleIncrement = () => {
    if (qty < MAX_QTY) {
      setQty((qty || 0) + 1);
      setErrors(e => ({ ...e, qty: false }));
    }
  };

  const handleInputChange = (e) => {
    const val = parseInt(e.target.value.replace(/\D/g, ''), 10);
    setQty(isNaN(val) ? "" : Math.min(val, MAX_QTY));
    setErrors(e => ({ ...e, qty: false }));
  };

  const handleBlur = () => {
    if (!qty || qty < 1) setQty(1);
  };

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-1"
        style={{ color: errors.qty ? "#ef4444" : isDark ? "#94a3b8" : "#374151" }}>
        Quantity <span className="text-red-400">*</span>
        {errors.qty && <span className="normal-case tracking-normal font-normal text-red-400">required</span>}
      </p>
      
      <div className="flex items-center rounded-lg border w-fit overflow-hidden transition-colors"
        style={{ 
          borderColor: errors.qty ? "#fca5a5" : isDark ? "#334155" : "#e5e7eb", 
          backgroundColor: isDark ? "#0f172a" : "white",
          boxShadow: errors.qty ? "0 0 0 1px #fee2e2" : "none"
        }}>
        
        {/* Minus Button */}
        <button 
          onClick={handleDecrement}
          disabled={qty <= 1}
          className="w-10 h-10 flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer"
          style={{ 
            color: isDark ? "#e2e8f0" : "#374151", 
            borderRight: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
            backgroundColor: isDark ? (qty <= 1 ? "transparent" : "rgba(255,255,255,0.05)") : (qty <= 1 ? "#f9fafb" : "transparent")
          }}
          onMouseEnter={e => { if (qty > 1) e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.1)" : "#f3f4f6" }}
          onMouseLeave={e => { if (qty > 1) e.currentTarget.style.backgroundColor = "transparent" }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4"/>
          </svg>
        </button>

        {/* Number Input */}
        <input 
          type="text" 
          inputMode="numeric"
          value={qty} 
          onChange={handleInputChange}
          onBlur={handleBlur}
          className="w-14 h-10 text-center text-sm font-bold bg-transparent outline-none m-0 p-0"
          style={{ color: isDark ? "#f1f5f9" : "#111827" }}
        />

        {/* Plus Button */}
        <button 
          onClick={handleIncrement}
          disabled={qty >= MAX_QTY}
          className="w-10 h-10 flex items-center justify-center transition-colors cursor-pointer"
          style={{ 
            color: isDark ? "#e2e8f0" : "#374151", 
            borderLeft: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
            backgroundColor: "transparent"
          }}
          onMouseEnter={e => { if (qty < MAX_QTY) e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.1)" : "#f3f4f6" }}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
        </button>
      </div>

      {showBulkHint && (
        <div className="flex items-center gap-3 mt-3 p-3 rounded-xl"
          style={{
            background: isDark ? "rgba(236,72,153,0.12)" : "#fdf2f8",
            border: `1px solid ${isDark ? "rgba(236,72,153,0.3)" : "#fbcfe8"}`
          }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: isDark ? "rgba(236,72,153,0.18)" : "#fce7f3" }}>
            <svg width="17" height="17" fill="none" stroke={isDark ? "#f9a8d4" : "#db2777"} strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold leading-snug m-0" style={{ color: isDark ? "#fbcfe8" : "#9d174d" }}>
              Buying {qty}+ pieces?
            </p>
            <p className="text-[11px] leading-snug m-0 mt-0.5" style={{ color: isDark ? "#f9a8d4" : "#be185d" }}>
              Get a bulk quotation for better rates.
            </p>
          </div>
          {onBulk && (
            <button onClick={onBulk}
              className="flex-shrink-0 text-xs font-bold text-white px-3 py-2 rounded-lg cursor-pointer border-none transition-opacity hover:opacity-90 whitespace-nowrap"
              style={{ background: "linear-gradient(135deg,#ec4899,#db2777)" }}>
              Get quote
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function AddOnsSection({ loadingAddOns, liveAddOns, visibleAddons, addOns, toggleAddOn, showAllAddons, setShowAllAddons, isDark }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3"
        style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>
        Add-ons <span className="normal-case tracking-normal font-normal" style={{ color: isDark ? "#4b5563" : "#9ca3af" }}>(optional)</span>
      </p>

      {loadingAddOns ? (
        <p className="text-xs text-gray-500 animate-pulse">Loading live add-ons...</p>
      ) : liveAddOns.length > 0 ? (
        <div className="grid grid-cols-2 gap-1.5">
          {visibleAddons.map(a => {
            const isUnavailable = a.stock <= 0 || a.is_available === false
            const on = addOns.includes(a.id) && !isUnavailable
            const addonBg  = isUnavailable ? (isDark ? "#0f172a" : "#f9fafb") : on ? (isDark ? "rgba(74,222,128,0.12)" : "#f0fdf4") : (isDark ? "#0f172a" : "white")
            const addonBdr = isUnavailable ? (isDark ? "#1e293b" : "#e5e7eb") : on ? (isDark ? "#4ade80" : G) : (isDark ? "#1e293b" : "#e5e7eb")
            return (
              <button key={a.id}
                disabled={isUnavailable}
                onClick={() => !isUnavailable && toggleAddOn(a.id)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all relative overflow-hidden"
                style={{
                  border: `1.5px solid ${addonBdr}`,
                  background: addonBg,
                  opacity: isUnavailable ? 0.5 : 1,
                  filter: isUnavailable ? "grayscale(100%)" : "none",
                  cursor: isUnavailable ? "not-allowed" : "pointer",
                  boxShadow: "none"
                }}
                onMouseEnter={e => { if (!on && !isUnavailable) e.currentTarget.style.borderColor = isDark ? "#334155" : "#d1d5db" }}
                onMouseLeave={e => { if (!on && !isUnavailable) e.currentTarget.style.borderColor = isDark ? "#1e293b" : "#e5e7eb" }}>

                {isUnavailable && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/10 backdrop-blur-[1px]">
                    <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">Out of Stock</span>
                  </div>
                )}

                <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 relative"
                  style={{ background: isDark ? "#1e293b" : "#f3f4f6", border: `1px solid ${isDark ? "#334155" : "#e5e7eb"}` }}>
                  <img src={a.image_url} alt={a.name} className="w-full h-full object-cover"
                    onError={e => { e.target.style.display="none" }}/>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate m-0" style={{ color: isDark ? "#e2e8f0" : "#111827" }}>{a.name}</p>
                  <p className="text-[10px] mt-0.5 m-0" style={{ color: isUnavailable ? "#ef4444" : isDark ? "#64748b" : "#9ca3af" }}>
                    {isUnavailable ? "Unavailable" : `${a.stock} available`}
                  </p>
                  <p className="text-xs font-semibold mt-0.5 m-0"
                    style={{ color: isUnavailable ? (isDark ? "#64748b" : "#9ca3af") : (isDark ? "#4ade80" : G) }}>
                    +₱{a.price}
                  </p>
                </div>

                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    border: `2px solid ${on ? (isDark ? "#4ade80" : G) : isDark ? "#334155" : "#d1d5db"}`,
                    background: on ? (isDark ? "rgba(74,222,128,0.2)" : G) : isDark ? "#1e293b" : "white"
                  }}>
                  {on
                    ? <svg width="9" height="9" fill="none" stroke={isDark ? "#4ade80" : "white"} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                    : <svg width="8" height="8" fill="none" stroke={isDark ? "#4b5563" : "#9ca3af"} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                  }
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-500">No add-ons available right now.</p>
      )}

      {liveAddOns.length > INITIAL_ADDON_COUNT && (
        <button onClick={() => setShowAllAddons(p => !p)}
          className="flex items-center gap-1.5 mt-2 text-xs font-medium cursor-pointer bg-transparent border-none p-0"
          style={{ color: isDark ? "#4ade80" : G }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showAllAddons ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}/>
          </svg>
          {showAllAddons ? "Show less" : `See all add-ons (${liveAddOns.length - INITIAL_ADDON_COUNT} more)`}
        </button>
      )}
    </div>
  )
}

function DeliverySection({ delivType, customDate, showCal, todayOk, errors, setDelivType, setShowCal, setCustDate, setErrors, isDark }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-1"
        style={{ color: errors.date ? "#ef4444" : isDark ? "#94a3b8" : "#6b7280" }}>
        Delivery Date <span className="text-red-400">*</span>
        {errors.date && <span className="normal-case tracking-normal font-normal">required</span>}
      </p>
      <div className="flex gap-2 flex-wrap">
        {[
          { key:"today",    label:"Today",    sub: todayOk ? "Before 2:00 PM" : "Unavailable after 2PM", disabled:!todayOk, onClick:()=>{ if(todayOk){ setDelivType("today"); setShowCal(false); setErrors(e=>({...e,date:false})) } } },
          { key:"tomorrow", label:"Tomorrow", sub: fmtDate(tomorrowStr()), disabled:false, onClick:()=>{ setDelivType("tomorrow"); setShowCal(false); setErrors(e=>({...e,date:false})) } },
        ].map(btn => (
          <button key={btn.key} disabled={btn.disabled} onClick={btn.onClick}
            className="px-3 py-2 rounded-xl text-left transition-all"
            style={{
              cursor: btn.disabled ? "not-allowed" : "pointer",
              opacity: btn.disabled ? 0.45 : 1,
              border: `1.5px solid ${delivType===btn.key ? (isDark ? "#4ade80" : G) : isDark ? "#334155" : "#e5e7eb"}`,
              background: delivType===btn.key ? (isDark ? "rgba(74,222,128,0.1)" : "#f0fdf4") : isDark ? "#0f172a" : "white",
              boxShadow: "none"
            }}>
            <p className="text-sm font-semibold m-0"
              style={{ color: delivType===btn.key ? (isDark ? "#4ade80" : DG) : isDark ? "#e2e8f0" : "#374151" }}>
              {btn.label}
            </p>
            <p className="text-[10px] m-0"
              style={{ color: delivType===btn.key ? (isDark ? "#4ade80" : G) : isDark ? "#64748b" : "#9ca3af" }}>
              {btn.sub}
            </p>
          </button>
        ))}
        <button
          onClick={() => { setDelivType("custom"); setShowCal(s=>!s); setErrors(e=>({...e,date:false})) }}
          className="px-3 py-2 rounded-xl text-left transition-all cursor-pointer flex items-center gap-2"
          style={{
            border: `1.5px solid ${delivType==="custom" ? (isDark ? "#4ade80" : G) : isDark ? "#334155" : "#e5e7eb"}`,
            background: delivType==="custom" ? (isDark ? "rgba(74,222,128,0.1)" : "#f0fdf4") : isDark ? "#0f172a" : "white",
            boxShadow: "none"
          }}>
          <svg width="13" height="13" fill="none" stroke={delivType==="custom" ? (isDark ? "#4ade80" : DG) : isDark ? "#64748b" : "#6b7280"} strokeWidth={1.8} viewBox="0 0 24 24" className="flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <div>
            <p className="text-sm font-semibold m-0"
              style={{ color: delivType==="custom" ? (isDark ? "#4ade80" : DG) : isDark ? "#e2e8f0" : "#374151" }}>
              {customDate ? fmtDate(customDate) : "Pick a date"}
            </p>
            <p className="text-[10px] m-0"
              style={{ color: delivType==="custom" ? (isDark ? "#4ade80" : G) : isDark ? "#64748b" : "#9ca3af" }}>
              {customDate ? "Tap to change" : "Open calendar"}
            </p>
          </div>
        </button>
      </div>
      {showCal && delivType==="custom" && (
        <MiniCalendar selected={customDate} onSelect={d => { setCustDate(d); setShowCal(false); setErrors(e=>({...e,date:false})) }}/>
      )}
    </div>
  )
}

/* ✅ FIX: accepts `similar` prop (not `suggestions`) to match what the main component passes */
function SuggestionsSection({ suggestions = [], isDark, onClose, onNavigate }) {
  // 🚀 FIX: Safely check if the array exists and has items before rendering
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="pt-6" style={{ borderTop: `1px solid ${isDark ? "#1e293b" : "#f3f4f6"}` }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-4"
        style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>You might also like</p>
      <div className="flex gap-3 overflow-x-auto pb-2 -mr-4 pr-4">
        {suggestions.map(s => (
          <button 
            key={s.id} 
            onClick={() => {
              if (onClose) onClose(); 
              if (onNavigate) onNavigate(`/product/${s.id}`); 
            }}
            className="flex-shrink-0 w-28 rounded-lg overflow-hidden border cursor-pointer text-left p-0 transition-transform hover:scale-105"
            style={{ borderColor: isDark ? "#334155" : "#e5e7eb", background: "transparent" }}>
            <img src={s.image_url || s.image} className="w-full h-20 object-cover" alt={s.name} />
            <div className="p-2">
              <p className="text-[10px] font-bold truncate" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>{s.name}</p>
              <p className="text-[10px]" style={{ color: "#2E8B34" }}>₱{(+s.price).toLocaleString()}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function ReviewsSection({ reviews, isDark }) {
  return (
    <div className="pb-4">
      <ReviewSummary reviews={reviews} isDark={isDark}/>
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="pb-4" style={{ borderBottom: `1px solid ${isDark ? "#1e293b" : "#f3f4f6"}` }}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>{review.user_name}</span>
                <span className="text-xs" style={{ color: "#f59e0b" }}>{"★".repeat(review.star_rating)}</span>
              </div>
              <p className="text-sm" style={{ color: isDark ? "#94a3b8" : "#4b5563" }}>{review.comment}</p>
              {review.image_url && (
              <img 
                src={review.image_url} 
                alt="Review photo" 
                className="w-20 h-20 rounded-lg object-cover mt-2" 
                onError={(e) => { e.target.style.display = 'none'; }} // Hides broken images
              />
            )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center p-8 rounded-xl text-center"
          style={{ border: `1.5px dashed ${isDark ? "#334155" : "#d1fae5"}`, background: isDark ? "#0f172a" : "#f9fafb" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
            style={{ background: isDark ? "rgba(74,222,128,0.1)" : "#f0fdf4" }}>
            <svg width="22" height="22" fill="none" stroke={isDark ? "#4ade80" : G} strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.048 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.977-2.888a1 1 0 00-1.176 0l-3.977 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.063 10.79c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
            </svg>
          </div>
          <p className="text-sm font-semibold m-0" style={{ color: isDark ? "#f8fafc" : "#111827" }}>No reviews yet</p>
          <p className="text-xs mt-1 m-0" style={{ color: isDark ? "#94a3b8" : "#9ca3af" }}>Be the first to share your experience.</p>
        </div>
      )}
    </div>
  )
}

function CareSection({ isDark, product }) {
  // Admin-authored care guide (one tip per line) shown when provided.
  const customTips = (product?.care_guide || "")
    .split("\n")
    .map(t => t.trim())
    .filter(Boolean)

  if (customTips.length > 0) {
    return (
      <div className="pb-4 space-y-2.5">
        <p className="text-sm leading-relaxed mb-2" style={{ color: isDark ? "#64748b" : "#6b7280" }}>
          Proper care significantly extends the life of your arrangement.
        </p>
        {customTips.map((tip, i) => (
          <div key={i} className="flex gap-3 p-3.5 rounded-xl items-start"
            style={{ background: isDark ? "rgba(74,222,128,0.06)" : "#f0fdf4", border: `1px solid ${isDark ? "rgba(74,222,128,0.2)" : "#bbf7d0"}` }}>
            <div className="flex-shrink-0 mt-0.5">
              <svg width="17" height="17" fill="none" stroke={isDark ? "#4ade80" : "#10b981"} strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <p className="text-sm leading-snug m-0" style={{ color: isDark ? "#e2e8f0" : "#111827" }}>{tip}</p>
          </div>
        ))}
      </div>
    )
  }

  const tips = [
    {
      lightBg:"#eff6ff", lightBdr:"#bfdbfe", darkBg:"rgba(59,130,246,0.08)", darkBdr:"rgba(59,130,246,0.2)",
      title:"Water daily", desc:"Replace water every 1-2 days with clean, room-temperature water.",
      icon:<svg width="17" height="17" fill="none" stroke={isDark?"#60a5fa":"#3b82f6"} strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6"/><ellipse cx="19" cy="5" rx="3" ry="3.5" fill={isDark?"rgba(59,130,246,0.3)":"#bfdbfe"} stroke={isDark?"#60a5fa":"#3b82f6"} strokeWidth={1.5}/></svg>
    },
    {
      lightBg:"#eef2ff", lightBdr:"#c7d2fe", darkBg:"rgba(99,102,241,0.08)", darkBdr:"rgba(99,102,241,0.2)",
      title:"Avoid direct sunlight", desc:"Keep away from heat sources and direct sun to slow wilting.",
      icon:<svg width="17" height="17" fill="none" stroke={isDark?"#818cf8":"#6366f1"} strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" fill={isDark?"rgba(99,102,241,0.2)":"#e0e7ff"}/></svg>
    },
    {
      lightBg:"#f0fdf4", lightBdr:"#bbf7d0", darkBg:"rgba(74,222,128,0.06)", darkBdr:"rgba(74,222,128,0.2)",
      title:"Trim stems", desc:"Cut 1-2cm at a 45° angle every few days for better absorption.",
      icon:<svg width="17" height="17" fill="none" stroke={isDark?"#4ade80":"#10b981"} strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
    },
  ]
  return (
    <div className="pb-4 space-y-2.5">
      <p className="text-sm leading-relaxed mb-2" style={{ color: isDark ? "#64748b" : "#6b7280" }}>
        Proper care significantly extends the life of your arrangement.
      </p>
      {tips.map((t,i) => (
        <div key={i} className="flex gap-3 p-3.5 rounded-xl items-start"
          style={{ background: isDark ? t.darkBg : t.lightBg, border: `1px solid ${isDark ? t.darkBdr : t.lightBdr}` }}>
          <div className="flex-shrink-0 mt-0.5">{t.icon}</div>
          <div>
            <p className="text-sm font-semibold mb-0.5 m-0" style={{ color: isDark ? "#e2e8f0" : "#111827" }}>{t.title}</p>
            <p className="text-xs leading-snug m-0" style={{ color: isDark ? "#64748b" : "#6b7280" }}>{t.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ════════════════════════════════════════════════════════════════ */
export default function ProductPreviewModal({ product, products = [], onClose, onNavigate }) {
  const [color,         setColor]         = useState(null)
  const [qty, setQty] = useState(1)
  const [addOns,        setAddOns]        = useState([])
  const [delivType,     setDelivType]     = useState(null)
  const [customDate,    setCustDate]      = useState("")
  const [showCal,       setShowCal]       = useState(false)
  const [step,          setStep]          = useState("product")
  const [dest,          setDest]          = useState("cart")
  const [visible,       setVisible]       = useState(false)
  const [tab,           setTab]           = useState("details")
  const [errors,        setErrors]        = useState({})
  const [reviews,       setReviews]       = useState([])
  const [liveAddOns,    setLiveAddOns]    = useState([])
  const [loadingAddOns, setLoadingAddOns] = useState(true)
  const [showAllAddons, setShowAllAddons] = useState(false)
  const [navH,          setNavH]          = useState(80)

  const todayOk  = isTodayAvail()
  const { isDark } = useTheme()
  const isMobile = useIsMobile(900)

  const modalBg = isDark ? "#1e293b" : "white"
  const rightBg = isDark ? "#0f172a" : "#f3f4f6"
  const cardBg  = isDark ? "#1e293b" : "white"
  const cardBdr = isDark ? "rgba(0,255,136,0.08)" : "rgba(0,0,0,0.08)"
  const colors  = CATEGORY_COLORS[product.category] || CATEGORY_COLORS.Roses

  // ✅ FIX: similarProducts derived directly from the products prop, no missing state, no dead API call
  const suggestedProducts = products
    .filter(p => {
      if (p.id === product.id) return false;
      if (p.category?.toLowerCase() !== product.category?.toLowerCase()) return false;
      if (p.status === "inactive" || !p.is_available || p.stock <= 0) return false;
      if (!Array.isArray(p.branches) || !p.branches.includes(branch)) return false;
      return true;
    })
    .slice(0, 4)

  const originalPrice = product.original_price || product.original || 0
  const hasDisc = originalPrice > product.price

  /* Fetch reviews */
  useEffect(() => {
    api.get(`/products/${product.id}/reviews`)
      .then(data => setReviews(Array.isArray(data) ? data : data?.data || []))
      .catch(err => console.error("Error fetching reviews:", err))
  }, [product.id])

  /* Fetch live add-ons */
  useEffect(() => {
    const fetchAddOns = async () => {
      try {
        const allProducts = await api.getProducts()
        const dbAddOns = allProducts.filter(p =>
          p.category?.toLowerCase() === "add-on" ||
          p.category?.toLowerCase() === "addon"
        )
        setLiveAddOns(dbAddOns)
      } catch (err) {
        console.error("Failed to load live add-ons:", err)
      } finally {
        setLoadingAddOns(false)
      }
    }
    fetchAddOns()
  }, [])

  const visibleAddons = showAllAddons ? liveAddOns : liveAddOns.slice(0, INITIAL_ADDON_COUNT)

  /* Mount */
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    document.body.style.overflow = "hidden"
    // Tell the floating chat launcher to hide so it doesn't cover the Buy Now button
    window.dispatchEvent(new Event("bloomora:modal-open"))

    if (!document.getElementById("bloomora-pm-step-css")) {
      const s = document.createElement("style")
      s.id = "bloomora-pm-step-css"
      s.textContent = `@keyframes pmStepIn{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}.pm-step-anim{animation:pmStepIn 0.32s cubic-bezier(0.22,0.61,0.36,1) both}@keyframes pmFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.pm-stagger>*{animation:pmFadeUp 0.5s cubic-bezier(0.22,0.61,0.36,1) both}.pm-stagger>*:nth-child(1){animation-delay:.05s}.pm-stagger>*:nth-child(2){animation-delay:.13s}.pm-stagger>*:nth-child(3){animation-delay:.21s}.pm-stagger>*:nth-child(4){animation-delay:.29s}.pm-stagger>*:nth-child(5){animation-delay:.37s}.pm-stagger>*:nth-child(6){animation-delay:.45s}.pm-stagger>*:nth-child(7){animation-delay:.53s}.pm-stagger>*:nth-child(8){animation-delay:.61s}.pm-stagger>*:nth-child(9){animation-delay:.69s}@keyframes qSpin{to{transform:rotate(360deg)}}@keyframes qPulse{0%,100%{transform:scale(0.92)}50%{transform:scale(1.08)}}@media(prefers-reduced-motion:reduce){.pm-step-anim,.pm-stagger>*{animation:none}}`
      document.head.appendChild(s)
    }

    const measureNav = () => {
      const candidates = Array.from(document.querySelectorAll(
        "nav, header, [data-navbar], [class*='navbar' i], [class*='header' i]"
      ))
      let h = 0
      for (const el of candidates) {
        const cs = window.getComputedStyle(el)
        if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity || "1") === 0) continue
        const r = el.getBoundingClientRect()
        // Anything pinned to the top of the viewport that could overlap the modal,
        // regardless of CSS position (fixed/sticky/relative all count if visually at top).
        if (r.top <= 4 && r.bottom > 24 && r.bottom < 200) {
          h = Math.max(h, r.bottom)
        }
      }
      // small buffer so the modal (and the image's "ZOOM" badge) clears the navbar edge
      setNavH(h > 0 ? Math.round(h) + 4 : (isMobile ? 64 : 80))
    }
    measureNav()
    // Re-measure after paint + settle (logo/fonts can grow the navbar after first frame)
    const raf = requestAnimationFrame(() => requestAnimationFrame(measureNav))
    const t1 = setTimeout(measureNav, 150)
    const t2 = setTimeout(measureNav, 450)
    window.addEventListener("resize", measureNav)
    window.addEventListener("scroll", measureNav, { passive: true })

    const esc = e => { if (e.key==="Escape") close() }
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("keydown", esc)
      window.removeEventListener("resize", measureNav)
      window.removeEventListener("scroll", measureNav)
      cancelAnimationFrame(raf)
      clearTimeout(t1)
      clearTimeout(t2)
      document.body.style.overflow = ""
      window.dispatchEvent(new Event("bloomora:modal-close"))
    }
  }, [])

  const close       = () => { setVisible(false); setTimeout(onClose, 260) }
  const toggleAddOn = id => setAddOns(p => p.includes(id) ? p.filter(i => i!==id) : [...p, id])

  const addOnTotal = addOns.reduce((s, id) => s + (liveAddOns.find(a => a.id===id)?.price || 0), 0)
  const total      = product.price + addOnTotal

  const delivLabel =
    delivType === "today"    ? "Today (before 2PM)" :
    delivType === "tomorrow" ? `Tomorrow, ${fmtDate(tomorrowStr())}` :
    delivType === "custom" && customDate ? fmtDate(customDate) : null

  const validate = () => {
    const e = {}
    if (!qty)     e.qty   = true
    if (!delivType || (delivType==="custom" && !customDate)) e.date = true
    // Reject custom dates beyond the booking window (prices may change too far out)
    if (delivType==="custom" && customDate) {
      const max = todayD(); max.setDate(max.getDate() + MAX_ORDER_DAYS)
      const [y,m,d] = customDate.split("-").map(Number)
      if (new Date(y, m-1, d) > max) e.date = true
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const startFlow = async d => {
    if (!validate()) return

    const selectedAddOnObjects = addOns.map(id => {
      const addon = liveAddOns.find(a => a.id===id)
      return { id: addon.id, name: addon.name, price: addon.price, qty: 1 }
    })

    await addToCart({
      id:           product.id,
      name:         product.name,
      price:        product.price,
      qty:          parseInt(qty) || 1,
      img:          product.image,
      desc:         product.category,
      color:        color?.name,
      size:         qty,
      deliveryDate: delivType==="custom" ? customDate : delivType,
      addOns:       selectedAddOnObjects,
      totalPrice:   total,
      
      // 🚀 THE FIX: Force the item to be "ticked" so Checkout can see it!
      checked:      true, 
    })

    window.dispatchEvent(new Event("bloomora:cart-updated"))
    setDest(d)
    setStep("card")
  }

  const isCard  = step === "card"
  const isQuote = step === "quote"

  const quoteAddOnObjects = addOns
    .map(id => liveAddOns.find(a => a.id === id))
    .filter(Boolean)
    .map(a => ({ id: a.id, name: a.name, price: a.price }))

  const openChatWithQuote   = (quote)   => window.dispatchEvent(new CustomEvent("bloomora:open-chat", { detail: { quote } }))
  const openChatWithProduct = () => {
  window.dispatchEvent(new CustomEvent("bloomora:open-chat", { 
    detail: { 
      product: { 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        image: product.image 
      } 
    } 
  }));
};

  /* Shared prop bundles */
  const colorProps    = { colors, color, errors, setColor, setErrors, isDark }
  const qtyProps      = { qty, errors, setQty, setErrors, isDark, onBulk: () => setStep("quote") }
  const addOnProps    = { loadingAddOns, liveAddOns, visibleAddons, addOns, toggleAddOn, showAllAddons, setShowAllAddons, isDark }
  const deliveryProps = { delivType, customDate, showCal, todayOk, errors, setDelivType, setShowCal, setCustDate, setErrors, isDark }

  /* ── Stars ── */
  const Stars = ({ size = 13 }) => (
    <>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} fill={i<=Math.floor(product.rating||0)?"#f59e0b":isDark?"#334155":"#e5e7eb"} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </>
  )

  /* ── Action pills ── */
  const ActionPills = ({ compact }) => (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button onClick={() => setStep("quote")}
        className="flex items-center gap-1.5 rounded-full font-bold text-white transition-all cursor-pointer border-none"
        style={{ padding: compact ? "8px 12px" : "6px 14px", fontSize: compact ? 13 : 12, background: "linear-gradient(135deg,#ec4899,#db2777)", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}>
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        Quote
      </button>
      <button onClick={openChatWithProduct}
        className="flex items-center gap-1.5 rounded-full font-bold text-white transition-all cursor-pointer border-none"
        style={{ padding: compact ? "8px 12px" : "6px 14px", fontSize: compact ? 13 : 12, background: "linear-gradient(135deg,#f59e0b,#d97706)", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}>
        <svg width="13" height="13" fill="currentColor" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
        Ask us
      </button>
    </div>
  )

  /* ── Error banner ── */
  const errorBanner = Object.values(errors).some(Boolean) && (
    <div className="px-3 py-2 rounded-lg flex items-center gap-2"
      style={{ background: isDark ? "rgba(239,68,68,0.1)" : "#fef2f2", border: `1px solid ${isDark ? "rgba(239,68,68,0.3)" : "#fecaca"}` }}>
      <svg width="13" height="13" fill="none" stroke="#ef4444" strokeWidth={2} viewBox="0 0 24 24" className="flex-shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <p className="text-xs font-medium text-red-500">
        Please select: {[errors.qty&&"size", errors.date&&"delivery date"].filter(Boolean).join(", ")}
      </p>
    </div>
  )

  /* ── Tabs ── */
  const Tabs = () => (
    <div className="flex" style={{ borderBottom: `1px solid ${isDark ? "#1e293b" : "#f3f4f6"}` }}>
      {[["details","Details"],["care","Care Guide"],["reviews","Reviews"]].map(([k,l]) => (
        <button key={k} onClick={() => setTab(k)}
          className="px-4 py-2 text-sm transition-colors"
          style={{
            color: tab===k ? G : isDark ? "#94a3b8" : "#6b7280",
            fontWeight: tab===k ? 600 : 400,
            background: "none", border: "none",
            borderBottom: `2.5px solid ${tab===k ? G : "transparent"}`,
            cursor: "pointer", marginBottom: -1
          }}>
          {l}
        </button>
      ))}
    </div>
  )

  /* ── Tab body ── */
  const TabBody = () => (
    <div>
      {tab === "details" && (
        <div className="pb-4 space-y-5">
          <DescriptionSection product={product} isDark={isDark}/>
          {/* ✅ FIX: pass `similar` prop matching SuggestionsSection's expected prop name */}
          <SuggestionsSection 
             suggestions={suggestedProducts} 
             isDark={isDark} 
             onClose={onClose} 
             onNavigate={onNavigate} 
          />
          <QtySection {...qtyProps}/>
          <div className="pb-5" style={{ borderBottom: `1px solid ${isDark ? "#1e293b" : "#f3f4f6"}` }}>
            <AddOnsSection {...addOnProps}/>
          </div>
          <DeliverySection {...deliveryProps}/>
        </div>
      )}
      {tab === "care"    && <CareSection isDark={isDark} product={product}/>}
      {tab === "reviews" && <ReviewsSection reviews={reviews} isDark={isDark}/>}
    </div>
  )

  /* ── Price block ── */
  const PriceBlock = () => (
    <div className="flex items-center gap-2 flex-wrap mb-5 pb-5"
      style={{ borderBottom: `1px solid ${isDark ? "#1e293b" : "#f3f4f6"}` }}>
      <span className="text-3xl font-bold tracking-tight"
        style={{ color: isDark ? "#4ade80" : "#111827", textShadow: "none" }}>
        ₱{total.toLocaleString()}
      </span>
      {hasDisc && (
        <>
          <span className="text-sm line-through" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>
            ₱{originalPrice.toLocaleString()}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded"
            style={{
              color: isDark ? "#00ff88" : G,
              background: isDark ? "rgba(0,255,136,0.1)" : "#f0fdf4",
              border: `1px solid ${isDark ? "rgba(0,255,136,0.25)" : "#bbf7d0"}`,
              textShadow: isDark ? "0 0 8px rgba(0,255,136,0.5)" : "none"
            }}>
            Save ₱{(originalPrice - product.price).toLocaleString()}
          </span>
        </>
      )}
    </div>
  )

  /* ── Meta row ── */
  const MetaRow = () => (
    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
      {Stars({})}
      <span className="text-sm font-medium" style={{ color: isDark ? "#cbd5e1" : "#374151" }}>{product.rating || "N/A"}</span>
      <span style={{ color: isDark ? "#334155" : "#e5e7eb", margin:"0 2px" }}>·</span>
      <span className="text-sm" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>{((product.reviews||0)*2).toLocaleString()} sold</span>
      <span style={{ color: isDark ? "#334155" : "#e5e7eb", margin:"0 2px" }}>·</span>
      <span className="text-sm font-semibold" style={{ color: product.stock > 0 ? (isDark ? "#4ade80" : G) : "#ef4444" }}>
        {product.stock > 0 ? `${product.stock} left in stock` : "Out of stock"}
      </span>
    </div>
  )

  /* ── Footer CTAs ── */
  const FooterCTAs = () => {
    // 🚀 THE FIX: Check if the item is legally allowed to be sold
    const isOutOfStock = product.stock <= 0 || !product.is_available || product.status === "inactive";

    if (isOutOfStock) {
      return (
        <button disabled
          className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{
            background: isDark ? "#1e293b" : "#f3f4f6",
            color: isDark ? "#64748b" : "#9ca3af",
            border: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
            cursor: "not-allowed"
          }}>
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          Currently Out of Stock
        </button>
      );
    }

    return (
      <div className="flex gap-2.5">
        <button onClick={() => startFlow("cart")}
          className="flex-1 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          style={{
            border: `2px solid ${isDark ? "#4ade80" : G}`,
            background: isDark ? "rgba(74,222,128,0.05)" : "white",
            color: isDark ? "#4ade80" : G,
            boxShadow: "none"
          }}>
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          Add to Cart
        </button>
        <button onClick={() => startFlow("checkout")}
          className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all cursor-pointer border-none"
          style={{ background: `linear-gradient(135deg,${DG},${G})`, boxShadow: "none" }}>
          Buy Now
        </button>
      </div>
    );
  }

  /* ══════════════════════════════════════════════
     MOBILE: FULL-PAGE SHEET
     ══════════════════════════════════════════════ */
  if (isMobile) {
    const pageBg = isDark ? "#0f172a" : "#ffffff"
    const goBack = () => { if (isCard || isQuote) { setStep("product") } else { close() } }
    const backLabel = (isCard || isQuote) ? "Back" : "Back to shop"

    return (
      <div className="fixed left-0 right-0 bottom-0 z-[40] flex flex-col"
        style={{
          top: `calc(${navH}px + env(safe-area-inset-top,0px))`,
          background: pageBg,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.22s, transform 0.26s cubic-bezier(0.34,1.1,0.64,1)"
        }}>

        {(isCard || isQuote) && (
          <div className="flex-shrink-0 flex items-center gap-2 px-3 z-20"
            style={{
              height: 52,
              background: isDark ? "rgba(15,23,42,0.96)" : "rgba(255,255,255,0.96)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderBottom: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}`
            }}>
            <button onClick={goBack} aria-label={backLabel}
              className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer border-none flex-shrink-0"
              style={{ background: isDark ? "#1e293b" : "#f3f4f6" }}>
              <svg width="16" height="16" fill="none" stroke={isDark ? "#e2e8f0" : "#374151"} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button onClick={goBack}
              className="flex items-center text-sm font-medium cursor-pointer bg-transparent border-none p-0 min-w-0 flex-1 truncate text-left"
              style={{ color: isDark ? "#94a3b8" : "#374151" }}>
              <span className="truncate">{backLabel}</span>
            </button>
            <button onClick={close} aria-label="Close"
              className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer border-none flex-shrink-0"
              style={{ background: isDark ? "#1e293b" : "#f3f4f6" }}>
              <svg width="14" height="14" fill="none" stroke={isDark ? "#e2e8f0" : "#374151"} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        )}

        {isCard ? (
          <div className="pm-step-anim flex-1 min-h-0 overflow-hidden">
            <CardStep delivLabel={delivLabel} dest={dest} onClose={close} onNavigate={onNavigate} isMobile/>
          </div>
        ) : isQuote ? (
          <div className="pm-step-anim flex-1 min-h-0 overflow-hidden">
            <QuoteStep
              product={product} color={color} sizeLabel={qty}
              addOnObjects={quoteAddOnObjects} addOnTotal={addOnTotal}
              isDark={isDark} onBack={() => setStep("product")} onClose={close}
              onOpenChat={openChatWithQuote} isMobile/>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between px-3"
              style={{ height: 48, background: isDark ? "#0f172a" : "#ffffff", borderBottom: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}` }}>
              <button onClick={close}
                className="flex items-center gap-1.5 text-sm font-semibold cursor-pointer bg-transparent border-none p-0"
                style={{ color: isDark ? "#e2e8f0" : "#374151" }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
                Back to shop
              </button>
              <button onClick={close} aria-label="Close"
                className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border-none"
                style={{ background: isDark ? "#1e293b" : "#f3f4f6" }}>
                <svg width="14" height="14" fill="none" stroke={isDark ? "#e2e8f0" : "#374151"} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="pm-scroll flex-1 min-h-0 overflow-y-auto" style={{ background: pageBg }}>
              <div className="relative w-full overflow-hidden" style={{ aspectRatio: "1/1", background: isDark ? "#0f172a" : "#f8fafc" }}>
                <img src={product.image} alt={product.name} className="w-full h-full object-contain"
                  onError={e => { e.target.style.display="none" }}/>
                {hasDisc && (
                  <div className="absolute top-3 left-3 text-white text-xs font-bold px-3 py-1 rounded-md z-10"
                    style={{ background: DG }}>
                    -{pctOff(originalPrice, product.price)}% OFF
                  </div>
                )}
                {product.ribbon && (
                  <div className="absolute top-11 left-0 z-10">
                    <div className="text-[11px] font-bold text-white px-4 py-1"
                      style={{ background: product._ribbonColor||G, clipPath: "polygon(0 0,calc(100% - 6px) 0,100% 50%,calc(100% - 6px) 100%,0 100%)" }}>
                      {product.ribbon}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-4 pt-4 pm-stagger">
                <p className="text-xs mb-1.5" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>
                  {product.category}
                  <span style={{ color: isDark ? "#334155" : "#d1d5db", margin:"0 4px" }}>/</span>
                  <span className="font-medium" style={{ color: G }}>{product.name}</span>
                </p>
                <h2 className="text-2xl font-bold leading-tight mb-3" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>
                  {product.name}
                </h2>
                <div className="mb-4">{ActionPills({ compact: true })}</div>
                {MetaRow()}
                {PriceBlock()}
                <div className="mb-5">{Tabs()}</div>
                {TabBody()}
              </div>
              <div style={{ height: 8 }}/>
            </div>

            <div className="flex-shrink-0 px-4 pt-3"
              style={{
                paddingBottom: "calc(12px + env(safe-area-inset-bottom,0px))",
                borderTop: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}`,
                background: isDark ? "#0f172a" : "#ffffff"
              }}>
              {addOnTotal > 0 && (
                <div className="flex justify-between mb-2.5 pb-2.5 border-b border-dashed"
                  style={{ borderColor: isDark ? "#1e293b" : "#f3f4f6" }}>
                  <span className="text-xs" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>Base ₱{product.price.toLocaleString()} + extras ₱{addOnTotal}</span>
                  <span className="text-sm font-bold" style={{ color: isDark ? "#4ade80" : DG }}>Total ₱{total.toLocaleString()}</span>
                </div>
              )}
              {errorBanner && <div className="mb-2.5">{errorBanner}</div>}
              {FooterCTAs()}
            </div>
          </div>
        )}

        <style>{`.pm-scroll::-webkit-scrollbar{width:0}`}</style>
      </div>
    )
  }

  /* ══════════════════════════════════════════════
     DESKTOP: FULL-PAGE CANVAS
     ══════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        .pm-scroll::-webkit-scrollbar{width:4px}
        .pm-scroll::-webkit-scrollbar-thumb{background:${isDark?"#4ade80":G};border-radius:4px}
        .pm-scroll::-webkit-scrollbar-thumb:hover{background:${isDark?"#22c55e":DG}}
      `}</style>

      <div className="pm-page fixed left-0 right-0 bottom-0 z-[40] flex flex-col box-border"
        style={{
          top: navH, paddingTop: 16, background: rightBg,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.25s ease"
        }}>

        <div className="pm-wrap relative flex flex-row overflow-hidden flex-1 min-h-0 mx-4 mb-4"
          style={{ background: modalBg, boxShadow: `0 4px 24px ${cardBdr}` }}>

          {isCard && (
            <div className="pm-step-anim w-full h-full overflow-hidden">
              <CardStep delivLabel={delivLabel} dest={dest} onClose={close} onNavigate={onNavigate}/>
            </div>
          )}

          {isQuote && (
            <div className="pm-step-anim w-full h-full overflow-hidden">
              <QuoteStep
                product={product} color={color} sizeLabel={qty}
                addOnObjects={quoteAddOnObjects} addOnTotal={addOnTotal}
                isDark={isDark} onBack={() => setStep("product")} onClose={close}
                onOpenChat={openChatWithQuote}/>
            </div>
          )}

          {!isCard && !isQuote && (
            <div className="flex flex-row w-full h-full">

              <ImgZoom product={product} isDark={isDark}/>

              <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: cardBg }}>
                <div className="pm-right flex-1 flex flex-col overflow-hidden">
                  <div className="pm-scroll pm-right-scroll pm-stagger flex-1 overflow-y-auto px-6 pt-12 pb-0">

                    <div className="flex items-center justify-end mb-4">
                      <button onClick={close} aria-label="Close"
                        className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer border-none transition-colors"
                        style={{ background: isDark ? "#1e293b" : "#f3f4f6", color: isDark ? "#e2e8f0" : "#374151" }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>

                    <p className="text-xs mb-1.5" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>
                      {product.category}
                      <span style={{ color: isDark ? "#334155" : "#d1d5db", margin:"0 4px" }}>/</span>
                      <span className="font-medium" style={{ color: G }}>{product.name}</span>
                    </p>

                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h2 className="text-2xl font-bold leading-tight flex-1" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>
                        {product.name}
                      </h2>
                      {ActionPills({})}
                    </div>

                    {MetaRow()}
                    {PriceBlock()}

                    <div className="flex mb-5" style={{ borderBottom: `1px solid ${isDark ? "#1e293b" : "#f3f4f6"}` }}>
                      {[["details","Details"],["care","Care Guide"],["reviews","Reviews"]].map(([k,l]) => (
                        <button key={k} onClick={() => setTab(k)}
                          className="px-4 py-2 text-sm transition-colors"
                          style={{
                            color: tab===k ? G : isDark ? "#94a3b8" : "#6b7280",
                            fontWeight: tab===k ? 600 : 400,
                            background: "none", border: "none",
                            borderBottom: `2.5px solid ${tab===k ? G : "transparent"}`,
                            cursor: "pointer", marginBottom: -1
                          }}>
                          {l}
                        </button>
                      ))}
                    </div>

                    {TabBody()}
                  </div>

                  {Object.values(errors).some(Boolean) && (
                    <div className="mx-5 mt-2">{errorBanner}</div>
                  )}

                  <div className="pm-footer flex-shrink-0 px-6 py-4 rounded-b-2xl"
                    style={{ borderTop: `1px solid ${isDark ? "#1e293b" : "#f3f4f6"}`, background: cardBg }}>
                    {addOnTotal > 0 && (
                      <div className="flex justify-between mb-2.5 pb-2.5 border-b border-dashed border-gray-100">
                        <span className="text-xs text-gray-400">Base ₱{product.price.toLocaleString()} + extras ₱{addOnTotal}</span>
                        <span className="text-sm font-bold" style={{ color: DG }}>Total ₱{total.toLocaleString()}</span>
                      </div>
                    )}
                    {FooterCTAs()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
