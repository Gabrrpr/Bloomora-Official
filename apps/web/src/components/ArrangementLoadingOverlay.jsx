import { useEffect, useState } from "react"
import estingsLogo from "../assets/EstingsLogo.svg"

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

export default function ArrangementLoadingOverlay({ loading, isDark }) {
  const [factIdx, setFactIdx] = useState(0)

  useEffect(() => {
    if (!loading) return
    setFactIdx(Math.floor(Math.random() * FLOWER_FACTS.length))

    const facts = setInterval(() => {
      setFactIdx(i => (i + 1) % FLOWER_FACTS.length)
    }, 3600)

    return () => clearInterval(facts)
  }, [loading])

  if (!loading) return null

  const accentG = isDark ? "#4ade80" : "#2E8B34"
  const accentPink = isDark ? "#f9a8d4" : "#db2777"
  const headingC = isDark ? "#f1f5f9" : "#1f2937"
  const bodyC = isDark ? "#94a3b8" : "#6b7280"

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: isDark ? "rgba(4,12,8,0.74)" : "rgba(8,47,32,0.48)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}>
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] px-6 py-7 text-center shadow-2xl sm:px-9 sm:py-9"
        style={{ background: isDark ? "linear-gradient(145deg,#14231b,#1e293b)" : "linear-gradient(145deg,#fffefb,#f3faf3)", border: `1px solid ${isDark ? "rgba(134,239,172,.18)" : "rgba(46,139,52,.18)"}`, animation: "daPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}>
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30 blur-3xl" style={{ backgroundColor: accentPink }} />
        <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full opacity-25 blur-3xl" style={{ backgroundColor: accentG }} />

        <div className="relative">
          <img src={estingsLogo} alt="Esting's Flowers" className="mx-auto mb-5 h-14 w-14 rounded-full shadow-lg" />

          <div className="da-arrangement-stage mx-auto mb-6 flex h-40 w-full max-w-sm items-end justify-center overflow-hidden rounded-3xl"
            style={{ background: isDark ? "linear-gradient(180deg,rgba(15,23,42,.15),rgba(74,222,128,.08))" : "linear-gradient(180deg,rgba(255,255,255,.2),rgba(220,252,231,.8))", border: `1px solid ${isDark ? "rgba(134,239,172,.12)" : "#dcfce7"}` }}>
            <div className="da-wrap" />
            {[0, 1, 2, 3, 4, 5, 6].map(index => <span key={index} className={`da-bloom da-bloom-${index + 1}`} />)}
          </div>

          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.24em]" style={{ color: accentPink }}>Your idea is blooming</p>
          <h3 className="mb-2 text-2xl font-extrabold tracking-tight" style={{ color: headingC }}>Creating your arrangement</h3>
          <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed" style={{ color: bodyC }}>
            Matching your flowers, checking the recipe, and rendering the final preview. It will appear the moment it is ready.
          </p>

          <div className="mb-6 flex items-center justify-center gap-2" aria-label="Generation in progress">
            {[0, 1, 2].map(index => <span key={index} className="da-status-dot h-2.5 w-2.5 rounded-full" style={{ backgroundColor: index === 1 ? accentPink : accentG, animationDelay: `${index * 180}ms` }} />)}
          </div>

          <div className="rounded-2xl px-5 py-4 text-left" style={{ backgroundColor: isDark ? "rgba(219,39,119,0.1)" : "rgba(253,242,248,.85)", border: `1px solid ${isDark ? "rgba(219,39,119,0.3)" : "#fbcfe8"}` }}>
            <p className="text-xs font-bold tracking-wider uppercase mb-1.5" style={{ color: isDark ? "#f9a8d4" : "#db2777" }}>While you wait</p>
            <p key={factIdx} className="text-sm leading-relaxed" style={{ color: isDark ? "#cbd5e1" : "#4b5563", animation: "daFade 0.5s ease both" }}>{FLOWER_FACTS[factIdx]}</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes daPop { from { opacity:0; transform:scale(0.94) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes daFade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes daPulse { 0%,100% { opacity:.35; transform:scale(.76); } 50% { opacity:1; transform:scale(1); } }
        @keyframes daBloomIn { 0% { opacity:0; transform:translate(-50%,-50%) scale(.2) rotate(-18deg); } 42%,100% { opacity:1; transform:translate(-50%,-50%) scale(1) rotate(0); } }
        @keyframes daWrapIn { 0% { opacity:0; transform:translateX(-50%) translateY(24px) scale(.84); } 35%,100% { opacity:1; transform:translateX(-50%) translateY(0) scale(1); } }
        .da-arrangement-stage { position:relative; isolation:isolate; }
        .da-wrap { position:absolute; left:50%; bottom:-28px; width:145px; height:128px; transform:translateX(-50%); background:linear-gradient(145deg,#fce7f3,#f9a8d4); clip-path:polygon(9% 0,91% 0,72% 100%,28% 100%); border-radius:18px; animation:daWrapIn 2.8s ease-in-out infinite; }
        .da-wrap::after { content:""; position:absolute; left:12%; right:12%; top:42%; height:9px; border-radius:99px; background:#2E8B34; box-shadow:0 2px 8px rgba(12,87,62,.2); }
        .da-bloom { position:absolute; left:50%; top:43%; width:47px; height:47px; border-radius:52% 48% 55% 45%; background:radial-gradient(circle at 48% 48%,#fef3c7 0 13%,#f472b6 15% 48%,#db2777 50% 100%); box-shadow:0 8px 16px rgba(219,39,119,.15); animation:daBloomIn 2.8s ease-in-out infinite; }
        .da-bloom::before,.da-bloom::after { content:""; position:absolute; inset:7px; border:2px solid rgba(255,255,255,.5); border-radius:60% 40% 55% 45%; transform:rotate(50deg); }
        .da-bloom::after { inset:14px; transform:rotate(-28deg); }
        .da-bloom-1 { margin:-45px 0 0 -58px; animation-delay:.05s; } .da-bloom-2 { margin:-53px 0 0 0; animation-delay:.15s; background:radial-gradient(circle at 48% 48%,#fef3c7 0 13%,#f9a8d4 15% 48%,#ec4899 50% 100%); } .da-bloom-3 { margin:-43px 0 0 58px; animation-delay:.25s; } .da-bloom-4 { margin:-8px 0 0 -80px; animation-delay:.32s; background:radial-gradient(circle at 48% 48%,#fef3c7 0 13%,#fbcfe8 15% 48%,#f472b6 50% 100%); } .da-bloom-5 { margin:0 0 0 -29px; animation-delay:.4s; } .da-bloom-6 { margin:-2px 0 0 28px; animation-delay:.48s; background:radial-gradient(circle at 48% 48%,#fef3c7 0 13%,#fde68a 15% 48%,#f59e0b 50% 100%); } .da-bloom-7 { margin:-8px 0 0 78px; animation-delay:.56s; }
        .da-status-dot { animation:daPulse 1.25s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .da-wrap,.da-bloom,.da-status-dot { animation:none; } }
      `}</style>
    </div>
  )
}
