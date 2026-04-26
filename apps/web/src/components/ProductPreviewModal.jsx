import { useState, useEffect } from "react"
import { addToCart } from "../utils/cart.js"

const G     = "#2E8B34"
const DG    = "#0C573E"
const CREAM = "#faf8f3"
const ERR   = "#ef4444"

const ADD_ONS = [
  { id:"ferrero8",  label:"Ferrero Rocher",  sub:"8 pieces",     price:199 },
  { id:"ferrero16", label:"Ferrero Rocher",  sub:"16 pieces",    price:349 },
  { id:"teddy",     label:"Teddy Bear",       sub:"Plush, 30cm",  price:399 },
  { id:"balloon",   label:"Mylar Balloon",    sub:"Helium-filled",price:149 },
]

const QTY_OPTIONS = ["1 pc","3 pcs","6 pcs","Dozen"]

const CATEGORY_COLORS = {
  Roses:        [{ name:"Red",    hex:"#e11d48" },{ name:"Pink",   hex:"#f472b6" },{ name:"White",  hex:"#e5e7eb", outline:true },{ name:"Yellow",hex:"#fbbf24" }],
  Bouquets:     [{ name:"Purple", hex:"#a78bfa" },{ name:"Pink",   hex:"#f9a8d4" },{ name:"Green",  hex:"#86efac" }],
  Tulips:       [{ name:"Pink",   hex:"#f9a8d4" },{ name:"Purple", hex:"#c084fc" },{ name:"White",  hex:"#e5e7eb", outline:true },{ name:"Red",   hex:"#e11d48" }],
  Arrangements: [{ name:"Natural",hex:"#fbbf24" },{ name:"Mixed",  hex:"#a78bfa" },{ name:"Warm",   hex:"#fb923c" }],
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const WDAYS  = ["S","M","T","W","T","F","S"]

const pctOff  = (o, p) => Math.round((1 - p / o) * 100)
const padDate = (d) => String(d).padStart(2,"0")
const toStr   = (d) => `${d.getFullYear()}-${padDate(d.getMonth()+1)}-${padDate(d.getDate())}`
const todayD  = () => { const d=new Date(); d.setHours(0,0,0,0); return d }
const tomorrowStr = () => { const d=new Date(); d.setDate(d.getDate()+1); return toStr(d) }
const fmtDate = (s) => {
  if (!s) return ""
  const [y,m,d] = s.split("-").map(Number)
  return new Date(y,m-1,d).toLocaleDateString("en-PH",{weekday:"short",month:"short",day:"numeric"})
}

// ── Required field label ───────────────────────────────────────────────────────
function ReqLabel({ children, error }) {
  return (
    <p style={{ fontSize:10, fontWeight:700, color:error?ERR:"#6b7280", letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 8px", display:"flex", alignItems:"center", gap:4 }}>
      {children}
      <span style={{ color:ERR, fontSize:11 }}>*</span>
      {error && <span style={{ fontSize:9, fontWeight:600, letterSpacing:"0.05em", color:ERR, textTransform:"none" }}>— required</span>}
    </p>
  )
}

// ── Mini Calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({ selected, onSelect }) {
  const now = todayD()
  const [vd, setVd] = useState({ y:now.getFullYear(), m:now.getMonth() })
  const prev = () => setVd(v => v.m===0?{y:v.y-1,m:11}:{...v,m:v.m-1})
  const next = () => setVd(v => v.m===11?{y:v.y+1,m:0}:{...v,m:v.m+1})
  const firstDow = new Date(vd.y, vd.m, 1).getDay()
  const dim      = new Date(vd.y, vd.m+1, 0).getDate()
  const cells    = [...Array(firstDow).fill(null), ...Array.from({length:dim},(_,i)=>i+1)]
  const cellD  = (d) => new Date(vd.y, vd.m, d)
  const isPast = (d) => cellD(d) < now
  const isTod  = (d) => cellD(d).toDateString() === now.toDateString()
  const isSel  = (d) => {
    if(!selected) return false
    const [y,m,dd]=selected.split("-").map(Number)
    return cellD(d).toDateString()===new Date(y,m-1,dd).toDateString()
  }
  const pick = (d) => { if(!isPast(d)) onSelect(toStr(cellD(d))) }

  return (
    <div style={{ background:"white", border:"1px solid #e8e3da", borderRadius:10, padding:"14px 16px", boxShadow:"0 4px 16px rgba(0,0,0,0.06)", marginTop:8 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <button onClick={prev} style={{ width:24,height:24,borderRadius:"50%",border:"1px solid #e5e7eb",background:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0 }}>
          <svg width="10" height="10" fill="none" stroke="#374151" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        </button>
        <span style={{ fontSize:12, fontWeight:700, color:"#1f2937" }}>{MONTHS[vd.m]} {vd.y}</span>
        <button onClick={next} style={{ width:24,height:24,borderRadius:"50%",border:"1px solid #e5e7eb",background:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0 }}>
          <svg width="10" height="10" fill="none" stroke="#374151" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:4 }}>
        {WDAYS.map((d,i) => (
          <div key={i} style={{ textAlign:"center", fontSize:10, fontWeight:600, color:"#9ca3af" }}>{d}</div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1 }}>
        {cells.map((d,i) => {
          if (!d) return <div key={i}/>
          const past=isPast(d), tod=isTod(d), sel=isSel(d)
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"2px 0" }}>
              <button onClick={() => pick(d)} disabled={past}
                style={{ width:26, height:26, borderRadius:"50%", border:"none", fontSize:11, fontWeight:sel||tod?700:400, cursor:past?"default":"pointer", color:sel?"white":past?"#d1d5db":tod?G:"#374151", background:sel?G:tod?"#f0fdf4":"transparent", outline:tod&&!sel?`1.5px solid ${G}`:"none", outlineOffset:-1, transition:"all 0.12s", flexShrink:0, padding:0 }}>
                {d}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Greeting Card Step ─────────────────────────────────────────────────────────
function CardStep({ deliveryLabel, destination, onClose, onNavigate }) {
  const [wants, setWants] = useState(null)
  const [form, setForm]   = useState({ msg:"", to:"", from:"" })
  const finish = () => { onClose(); setTimeout(() => onNavigate?.(destination==="checkout"?"checkout":"cart"), 260) }
  const inp = { width:"100%", border:"1px solid #e8e3da", borderRadius:8, padding:"9px 12px", fontSize:13, color:"#1f2937", outline:"none", background:"white", lineHeight:1.55, boxSizing:"border-box", transition:"border-color 0.15s" }

  return (
    <div style={{ width:"100%", display:"flex", flexDirection:"column", alignItems:"center", padding:"clamp(32px,5vw,52px) clamp(28px,6vw,64px)", boxSizing:"border-box", overflowY:"auto", maxHeight:"90vh" }}>
      <div style={{ width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${DG},${G})`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16,boxShadow:`0 8px 24px rgba(46,139,52,0.28)` }}>
        <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
      </div>
      <p style={{ fontSize:20, fontWeight:800, color:"#111827", marginBottom:4, textAlign:"center" }}>Added to cart!</p>
      <p style={{ fontSize:13, color:"#6b7280", textAlign:"center", lineHeight:1.65, maxWidth:300, marginBottom:deliveryLabel?10:22 }}>
        Would you like to include a greeting card with your order?
      </p>
      {deliveryLabel && (
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:50, background:"#f0fdf4", border:`1px solid ${G}30`, marginBottom:22 }}>
          <svg width="10" height="10" fill="none" stroke={DG} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          <span style={{ fontSize:11, fontWeight:700, color:DG }}>Delivery: {deliveryLabel}</span>
        </div>
      )}
      {wants === null && (
        <div style={{ display:"flex", gap:9, width:"100%", maxWidth:360 }}>
          <button onClick={() => setWants(true)}
            style={{ flex:1, padding:"11px 14px", borderRadius:9, border:`1.5px solid ${G}`, background:"white", color:G, fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"all 0.15s" }}
            onMouseEnter={e=>{e.currentTarget.style.background=G;e.currentTarget.style.color="white"}}
            onMouseLeave={e=>{e.currentTarget.style.background="white";e.currentTarget.style.color=G}}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            Yes, add a card
          </button>
          <button onClick={finish}
            style={{ flex:1, padding:"11px 14px", borderRadius:9, border:"1px solid #e5e7eb", background:"#f9fafb", color:"#4b5563", fontSize:13, fontWeight:600, cursor:"pointer", transition:"background 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.background="#f3f4f6"}
            onMouseLeave={e=>e.currentTarget.style.background="#f9fafb"}>
            No, thanks
          </button>
        </div>
      )}
      {wants === true && (
        <div style={{ width:"100%", maxWidth:420 }}>
          <div style={{ background:"linear-gradient(135deg,#fdf2f8,#f0fdf4)", border:"1px solid #e9d5ff", borderRadius:12, padding:"14px 18px", marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.2em", textTransform:"uppercase", color:"#7c3aed" }}>Preview</span>
              <svg width="11" height="11" fill="#f43f5e" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </div>
            <p style={{ fontSize:13, color:form.msg?"#1f2937":"#9ca3af", fontStyle:form.msg?"normal":"italic", lineHeight:1.65, minHeight:36, marginBottom:10 }}>
              {form.msg || "Your message will appear here..."}
            </p>
            <div style={{ display:"flex", justifyContent:"space-between", borderTop:"1px dashed #d8b4fe", paddingTop:8 }}>
              <span style={{ fontSize:11, color:"#6b7280" }}>To: <strong style={{ color:"#1f2937" }}>{form.to||"—"}</strong></span>
              <span style={{ fontSize:11, color:"#6b7280" }}>From: <strong style={{ color:"#1f2937" }}>{form.from||"—"}</strong></span>
            </div>
          </div>
          <div style={{ marginBottom:9 }}>
            <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#6b7280", marginBottom:4 }}>Message</label>
            <textarea rows={3} placeholder="Write your heartfelt message..." value={form.msg}
              onChange={e=>setForm(f=>({...f,msg:e.target.value}))} style={{...inp,resize:"none"}}
              onFocus={e=>e.target.style.borderColor=G} onBlur={e=>e.target.style.borderColor="#e8e3da"}/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:18 }}>
            <div>
              <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#6b7280", marginBottom:4 }}>To</label>
              <input type="text" placeholder="Recipient" value={form.to} onChange={e=>setForm(f=>({...f,to:e.target.value}))} style={inp}
                onFocus={e=>e.target.style.borderColor=G} onBlur={e=>e.target.style.borderColor="#e8e3da"}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#6b7280", marginBottom:4 }}>From</label>
              <input type="text" placeholder="Your name" value={form.from} onChange={e=>setForm(f=>({...f,from:e.target.value}))} style={inp}
                onFocus={e=>e.target.style.borderColor=G} onBlur={e=>e.target.style.borderColor="#e8e3da"}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:9, marginBottom:8 }}>
            <button onClick={finish}
              style={{ flex:1, padding:"12px", borderRadius:9, border:"none", background:`linear-gradient(135deg,${DG},${G})`, color:"white", fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:`0 4px 14px rgba(46,139,52,0.28)` }}>
              Confirm & View {destination==="checkout"?"Checkout":"Cart"}
            </button>
            <button onClick={onClose}
              style={{ padding:"12px 14px", borderRadius:9, border:"1px solid #e5e7eb", background:"white", color:"#6b7280", fontSize:13, fontWeight:600, cursor:"pointer" }}
              onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"}
              onMouseLeave={e=>e.currentTarget.style.background="white"}>
              Continue
            </button>
          </div>
          <button onClick={()=>setWants(null)} style={{ display:"block", width:"100%", textAlign:"center", background:"none", border:"none", color:"#9ca3af", fontSize:12, cursor:"pointer", paddingTop:2 }}>
            ← Back
          </button>
        </div>
      )}
    </div>
  )
}

// ── Reviews Tab ────────────────────────────────────────────────────────────────
function ReviewsTab({ rating }) {
  return (
    <div style={{ paddingBottom:20 }}>
      {/* Rating summary */}
      <div style={{ display:"flex", alignItems:"center", gap:20, padding:"16px 18px", background:"#f9fafb", borderRadius:10, border:"1px solid #f0ede6", marginBottom:20 }}>
        <div style={{ textAlign:"center", flexShrink:0 }}>
          <p style={{ fontSize:36, fontWeight:900, color:"#111827", lineHeight:1, margin:0 }}>{rating}</p>
          <div style={{ display:"flex", gap:2, justifyContent:"center", margin:"5px 0 3px" }}>
            {[1,2,3,4,5].map(i => (
              <svg key={i} width="11" height="11" fill={i<=Math.floor(rating)?"#f59e0b":"#e5e7eb"} viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            ))}
          </div>
          <p style={{ fontSize:10, color:"#9ca3af", margin:0 }}>out of 5</p>
        </div>
        <div style={{ flex:1 }}>
          {[5,4,3,2,1].map(star => (
            <div key={star} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
              <span style={{ fontSize:10, color:"#6b7280", width:6, textAlign:"right" }}>{star}</span>
              <svg width="9" height="9" fill="#f59e0b" viewBox="0 0 20 20" style={{ flexShrink:0 }}>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <div style={{ flex:1, height:5, background:"#f0ede6", borderRadius:3 }}>
                <div style={{ width:"0%", height:"100%", background:"#f59e0b", borderRadius:3 }}/>
              </div>
              <span style={{ fontSize:10, color:"#9ca3af", width:14, textAlign:"right" }}>0</span>
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"36px 20px", border:"1.5px dashed #e5e7eb", borderRadius:10, textAlign:"center" }}>
        <div style={{ width:48, height:48, borderRadius:"50%", background:"#f9fafb", border:"1px solid #f0ede6", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
          <svg width="22" height="22" fill="none" stroke="#d1d5db" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        </div>
        <p style={{ fontSize:13, fontWeight:700, color:"#374151", margin:"0 0 5px" }}>No reviews yet</p>
        <p style={{ fontSize:12, color:"#9ca3af", margin:0, lineHeight:1.55, maxWidth:260 }}>
          Be the first to share your experience with this arrangement.
        </p>
      </div>
    </div>
  )
}

// ── Main Modal ─────────────────────────────────────────────────────────────────
export default function ProductPreviewModal({ product, onClose, onNavigate }) {
  const [color,      setColor]      = useState(null)
  const [qty,        setQty]        = useState(null)
  const [addOns,     setAddOns]     = useState([])
  const [delivType,  setDelivType]  = useState(null)
  const [customDate, setCustomDate] = useState("")
  const [showCal,    setShowCal]    = useState(false)
  const [step,       setStep]       = useState("product")
  const [dest,       setDest]       = useState("cart")
  const [visible,    setVisible]    = useState(false)
  const [activeTab,  setActiveTab]  = useState("details")
  const [errors,     setErrors]     = useState({})

  const colors = CATEGORY_COLORS[product.category] || CATEGORY_COLORS.Roses

  useEffect(() => {
    setColor(colors[0])
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    document.body.style.overflow = "hidden"
    const onKey = (e) => { if (e.key==="Escape") close() }
    document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("keydown",onKey); document.body.style.overflow="" }
  }, [])

  const close = () => { setVisible(false); setTimeout(onClose, 260) }
  const toggleAddOn = (id) => setAddOns(p => p.includes(id) ? p.filter(i=>i!==id) : [...p,id])
  const addOnTotal  = addOns.reduce((s,id) => s+(ADD_ONS.find(a=>a.id===id)?.price||0), 0)
  const total       = product.price + addOnTotal

  const delivLabel = delivType==="today" ? "Today (before 2PM)"
    : delivType==="tomorrow" ? `Tomorrow, ${fmtDate(tomorrowStr())}`
    : delivType==="custom" && customDate ? fmtDate(customDate)
    : null

  const validate = () => {
    const e = {}
    if (!color)                                              e.color = true
    if (!qty)                                                e.qty   = true
    if (!delivType || (delivType==="custom" && !customDate)) e.date  = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const startFlow = (d) => {
    if (!validate()) return
    addToCart({id:product.id,name:product.name,price:product.price,qty:1,img:product.image,desc:product.category})
    window.dispatchEvent(new Event("bloomora:cart-updated"))
    setDest(d); setStep("card")
  }

  const isCard = step === "card"

  return (
    <>
      <style>{`
        .pm-scroll::-webkit-scrollbar{width:4px}.pm-scroll::-webkit-scrollbar-track{background:transparent}.pm-scroll::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:4px}
        @media(max-width:780px){.pm-shell{flex-direction:column!important}.pm-img-col{width:100%!important;height:56vw!important;min-height:240px!important}}
      `}</style>

      {/* Backdrop */}
      <div
        style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"clamp(8px,2vw,16px)", backgroundColor:visible?"rgba(0,0,0,0.38)":"rgba(0,0,0,0)", backdropFilter:visible?"blur(4px)":"blur(0)", WebkitBackdropFilter:visible?"blur(4px)":"blur(0)", transition:"background-color 0.24s ease, backdrop-filter 0.24s ease" }}
        onClick={close}
      >
        {/* Modal — up to 1200px wide */}
        <div
          className="pm-shell"
          style={{ position:"relative", background:"white", borderRadius:16, width:"100%", maxWidth:isCard?"480px":"min(1200px,97vw)", maxHeight:"94vh", display:"flex", flexDirection:"row", overflow:"hidden", boxShadow:"0 24px 60px rgba(0,0,0,0.18),0 0 0 1px rgba(0,0,0,0.05)", opacity:visible?1:0, transform:visible?"translateY(0) scale(1)":"translateY(20px) scale(0.98)", transition:"opacity 0.24s ease, transform 0.28s cubic-bezier(0.34,1.3,0.64,1), max-width 0.28s ease" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close */}
          <button onClick={close}
            style={{ position:"absolute", top:12, right:12, zIndex:40, width:30, height:30, borderRadius:"50%", border:"1px solid #e5e7eb", background:"white", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"background 0.14s" }}
            onMouseEnter={e => e.currentTarget.style.background="#f3f4f6"}
            onMouseLeave={e => e.currentTarget.style.background="white"}>
            <svg width="11" height="11" fill="none" stroke="#374151" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          {isCard && <CardStep deliveryLabel={delivLabel} destination={dest} onClose={close} onNavigate={onNavigate}/>}

          {!isCard && (
            <>
              {/* LEFT — large square image panel */}
              <div
                className="pm-img-col"
                style={{ flexShrink:0, width:"clamp(300px,46%,560px)", position:"relative", background:CREAM, alignSelf:"stretch", display:"flex", alignItems:"stretch" }}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", display:"block" }}
                />
                <div style={{ position:"absolute", top:14, left:14, background:DG, color:"white", fontSize:10, fontWeight:800, padding:"3px 9px", borderRadius:4, letterSpacing:"0.04em" }}>
                  -{pctOff(product.original, product.price)}% OFF
                </div>
                {product.ribbon && (
                  <div style={{ position:"absolute", top:40, left:0 }}>
                    <div style={{ fontSize:9, fontWeight:800, color:"white", padding:"3px 14px 3px 9px", background:product._ribbonColor||G, clipPath:"polygon(0 0,calc(100% - 5px) 0,100% 50%,calc(100% - 5px) 100%,0 100%)" }}>
                      {product.ribbon}
                    </div>
                  </div>
                )}
                <div style={{ position:"absolute", bottom:14, left:14, right:14, background:"rgba(255,255,255,0.92)", backdropFilter:"blur(6px)", borderRadius:8, padding:"9px 13px", display:"flex", alignItems:"center", gap:9 }}>
                  <svg width="13" height="13" fill="none" stroke={G} viewBox="0 0 24 24" style={{ flexShrink:0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
                  </svg>
                  <div>
                    <p style={{ fontSize:11, fontWeight:700, color:"#111827", margin:0 }}>Same-day delivery</p>
                    <p style={{ fontSize:10, color:"#6b7280", margin:0 }}>Before 2PM · Manila & Pampanga</p>
                  </div>
                </div>
              </div>

              {/* RIGHT — details */}
              <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>
                <div className="pm-scroll" style={{ flex:1, overflowY:"auto", padding:"26px 28px 0" }}>

                  <p style={{ fontSize:11, color:"#9ca3af", margin:"0 0 5px", letterSpacing:"0.03em" }}>
                    Flowers / <span style={{ color:G, fontWeight:600 }}>{product.category}</span>
                  </p>
                  <h2 style={{ fontSize:20, fontWeight:800, color:"#111827", lineHeight:1.2, margin:"0 0 9px", paddingRight:32 }}>
                    {product.name}
                  </h2>

                  {/* Rating */}
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
                    <div style={{ display:"flex", gap:2 }}>
                      {[1,2,3,4,5].map(i => (
                        <svg key={i} width="12" height="12" fill={i<=Math.floor(product.rating)?"#f59e0b":"#e5e7eb"} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      ))}
                    </div>
                    <span style={{ fontSize:12, fontWeight:600, color:"#374151" }}>{product.rating}</span>
                    <span style={{ fontSize:12, color:"#9ca3af" }}>({product.reviews} reviews)</span>
                    <span style={{ color:"#e5e7eb" }}>·</span>
                    <span style={{ fontSize:12, color:"#9ca3af" }}>{(product.reviews*2).toLocaleString()} sold</span>
                  </div>

                  {/* Price */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18, paddingBottom:18, borderBottom:"1px solid #f0ede6" }}>
                    <span style={{ fontSize:30, fontWeight:900, color:G, letterSpacing:"-0.02em", lineHeight:1 }}>₱{total.toLocaleString()}</span>
                    <span style={{ fontSize:13, color:"#9ca3af", textDecoration:"line-through" }}>₱{product.original.toLocaleString()}</span>
                    <span style={{ fontSize:10, fontWeight:700, color:DG, background:"#f0fdf4", border:`1px solid ${G}30`, padding:"2px 8px", borderRadius:4 }}>
                      Save ₱{(product.original - product.price).toLocaleString()}
                    </span>
                  </div>

                  {/* Tabs */}
                  <div style={{ display:"flex", borderBottom:"1px solid #f0ede6", marginBottom:18 }}>
                    {[["details","Product Details"],["care","Care Guide"],["reviews","Reviews"]].map(([k,l]) => (
                      <button key={k} onClick={() => setActiveTab(k)}
                        style={{ padding:"7px 14px", fontSize:12, fontWeight:activeTab===k?700:500, color:activeTab===k?G:"#6b7280", background:"none", border:"none", borderBottom:`2px solid ${activeTab===k?G:"transparent"}`, cursor:"pointer", marginBottom:-1, transition:"all 0.13s" }}>
                        {l}
                      </button>
                    ))}
                  </div>

                  {/* ── DETAILS ── */}
                  {activeTab === "details" && (
                    <>
                      {/* COLOR — required */}
                      <div style={{ marginBottom:18 }}>
                        <ReqLabel error={errors.color}>
                          Color {color && <span style={{ color:G, fontWeight:600, textTransform:"none", letterSpacing:0 }}>— {color.name}</span>}
                        </ReqLabel>
                        <div style={{ display:"flex", gap:8 }}>
                          {colors.map(c => (
                            <button key={c.name} onClick={() => { setColor(c); setErrors(e=>({...e,color:false})) }} title={c.name}
                              style={{ width:28, height:28, borderRadius:"50%", background:c.hex, border:c.outline?"1.5px solid #d1d5db":"1.5px solid transparent", outline:color?.name===c.name?`2.5px solid ${errors.color?ERR:G}`:"2.5px solid transparent", outlineOffset:2, cursor:"pointer", transition:"all 0.13s", transform:color?.name===c.name?"scale(1.1)":"scale(1)" }}/>
                          ))}
                        </div>
                      </div>

                      {/* SIZE / QUANTITY — required */}
                      <div style={{ marginBottom:18 }}>
                        <ReqLabel error={errors.qty}>Size / Quantity</ReqLabel>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {QTY_OPTIONS.map(q => (
                            <button key={q} onClick={() => { setQty(q); setErrors(e=>({...e,qty:false})) }}
                              style={{ padding:"7px 18px", borderRadius:6, fontSize:12, fontWeight:qty===q?700:500, border:`1.5px solid ${qty===q?G:errors.qty?"#fca5a5":"#e5e7eb"}`, background:qty===q?G:"white", color:qty===q?"white":"#374151", cursor:"pointer", transition:"all 0.13s" }}>
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ADD-ONS — optional */}
                      <div style={{ marginBottom:18, paddingBottom:18, borderBottom:"1px solid #f0ede6" }}>
                        <p style={{ fontSize:10, fontWeight:700, color:"#6b7280", letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 8px" }}>
                          Add-ons <span style={{ fontWeight:400, letterSpacing:0, textTransform:"none", color:"#9ca3af" }}>(optional)</span>
                        </p>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                          {ADD_ONS.map(a => {
                            const on = addOns.includes(a.id)
                            return (
                              <button key={a.id} onClick={() => toggleAddOn(a.id)}
                                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderRadius:8, border:`1px solid ${on?G:"#e8e3da"}`, background:on?"#f0fdf4":"white", cursor:"pointer", textAlign:"left", transition:"all 0.13s" }}
                                onMouseEnter={e => { if(!on){ e.currentTarget.style.borderColor=G; e.currentTarget.style.background="#f9fef9" }}}
                                onMouseLeave={e => { if(!on){ e.currentTarget.style.borderColor="#e8e3da"; e.currentTarget.style.background="white" }}}>
                                <div>
                                  <p style={{ fontSize:12, fontWeight:700, color:"#1f2937", margin:0 }}>{a.label}</p>
                                  <p style={{ fontSize:10, color:"#9ca3af", margin:"2px 0 0" }}>{a.sub}</p>
                                  <p style={{ fontSize:11, color:G, fontWeight:700, margin:"3px 0 0" }}>+₱{a.price}</p>
                                </div>
                                <div style={{ width:20,height:20,borderRadius:"50%",border:`1.5px solid ${on?G:"#d1d5db"}`,background:on?G:"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.13s" }}>
                                  {on
                                    ? <svg width="10" height="10" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                                    : <svg width="9" height="9" fill="none" stroke="#9ca3af" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                                  }
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* DELIVERY DATE — required */}
                      <div style={{ marginBottom:20 }}>
                        <ReqLabel error={errors.date}>Delivery Date</ReqLabel>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {[{k:"today",l:"Today",s:"Before 2:00 PM"},{k:"tomorrow",l:"Tomorrow",s:fmtDate(tomorrowStr())}].map(o => (
                            <button key={o.k} onClick={() => { setDelivType(o.k); setShowCal(false); setErrors(e=>({...e,date:false})) }}
                              style={{ padding:"7px 12px", borderRadius:6, border:`1.5px solid ${delivType===o.k?G:errors.date?"#fca5a5":"#e8e3da"}`, background:delivType===o.k?"#f0fdf4":"white", cursor:"pointer", textAlign:"left", transition:"all 0.13s" }}
                              onMouseEnter={e => { if(delivType!==o.k){ e.currentTarget.style.borderColor=G; e.currentTarget.style.background="#f9fef9" }}}
                              onMouseLeave={e => { if(delivType!==o.k){ e.currentTarget.style.borderColor=errors.date?"#fca5a5":"#e8e3da"; e.currentTarget.style.background="white" }}}>
                              <p style={{ fontSize:12, fontWeight:700, color:delivType===o.k?DG:"#374151", margin:0 }}>{o.l}</p>
                              <p style={{ fontSize:10, color:delivType===o.k?G:"#9ca3af", margin:0 }}>{o.s}</p>
                            </button>
                          ))}
                          <button onClick={() => { setDelivType("custom"); setShowCal(s=>!s); setErrors(e=>({...e,date:false})) }}
                            style={{ padding:"7px 12px", borderRadius:6, border:`1.5px solid ${delivType==="custom"?G:errors.date?"#fca5a5":"#e8e3da"}`, background:delivType==="custom"?"#f0fdf4":"white", cursor:"pointer", textAlign:"left", transition:"all 0.13s", display:"flex", alignItems:"center", gap:6 }}
                            onMouseEnter={e => { if(delivType!=="custom"){ e.currentTarget.style.borderColor=G; e.currentTarget.style.background="#f9fef9" }}}
                            onMouseLeave={e => { if(delivType!=="custom"){ e.currentTarget.style.borderColor=errors.date?"#fca5a5":"#e8e3da"; e.currentTarget.style.background="white" }}}>
                            <svg width="13" height="13" fill="none" stroke={delivType==="custom"?DG:"#6b7280"} viewBox="0 0 24 24" style={{ flexShrink:0 }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            <div>
                              <p style={{ fontSize:12, fontWeight:700, color:delivType==="custom"?DG:"#374151", margin:0 }}>
                                {customDate ? fmtDate(customDate) : "Pick a date"}
                              </p>
                              <p style={{ fontSize:10, color:delivType==="custom"?G:"#9ca3af", margin:0 }}>
                                {customDate ? "Tap to change" : "Open calendar"}
                              </p>
                            </div>
                          </button>
                        </div>
                        {showCal && delivType==="custom" && (
                          <MiniCalendar selected={customDate} onSelect={(d) => { setCustomDate(d); setShowCal(false); setErrors(e=>({...e,date:false})) }}/>
                        )}
                      </div>

                      <p style={{ fontSize:13, color:"#6b7280", lineHeight:1.75, margin:"0 0 20px" }}>
                        Hand-arranged by our skilled florists using the freshest blooms available. Perfect for gifting or adding beauty to any space. Each arrangement is made to order.
                      </p>
                    </>
                  )}

                  {/* ── CARE ── */}
                  {activeTab === "care" && (
                    <div style={{ paddingBottom:20 }}>
                      <p style={{ fontSize:13, color:"#374151", lineHeight:1.8, marginBottom:14 }}>
                        Hand-arranged by our skilled florists using the freshest blooms available. Perfect for gifting or adding beauty to any space. Each arrangement is made to order.
                      </p>
                      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        {[
                          { icon:"💧", title:"Water daily", desc:"Change water every 1–2 days to keep blooms fresh." },
                          { icon:"❄️", title:"Keep cool", desc:"Store away from direct sunlight and heat sources." },
                          { icon:"✂️", title:"Trim stems", desc:"Cut 1–2cm at an angle every few days for better absorption." },
                        ].map((tip,i) => (
                          <div key={i} style={{ display:"flex", gap:10, padding:"10px 12px", borderRadius:8, background:"#f9fafb", border:"1px solid #f0ede6" }}>
                            <span style={{ fontSize:16, flexShrink:0 }}>{tip.icon}</span>
                            <div>
                              <p style={{ fontSize:12, fontWeight:700, color:"#111827", margin:0 }}>{tip.title}</p>
                              <p style={{ fontSize:11, color:"#6b7280", margin:0 }}>{tip.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── REVIEWS ── */}
                  {activeTab === "reviews" && <ReviewsTab rating={product.rating}/>}
                </div>

                {/* Validation banner */}
                {Object.values(errors).some(Boolean) && (
                  <div style={{ margin:"8px 28px 0", padding:"9px 14px", borderRadius:8, background:"#fef2f2", border:"1px solid #fecaca", display:"flex", alignItems:"center", gap:8 }}>
                    <svg width="13" height="13" fill="none" stroke={ERR} viewBox="0 0 24 24" style={{ flexShrink:0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <p style={{ fontSize:12, color:ERR, fontWeight:600, margin:0 }}>
                      Please select: {[errors.color&&"color",errors.qty&&"size",errors.date&&"delivery date"].filter(Boolean).join(", ")}
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div style={{ flexShrink:0, padding:"12px 28px 20px", borderTop:"1px solid #f0ede6", background:"white", marginTop:8 }}>
                  {addOnTotal > 0 && (
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10, padding:"8px 0", borderBottom:"1px dashed #f0ede6" }}>
                      <span style={{ fontSize:11, color:"#9ca3af" }}>Base ₱{product.price.toLocaleString()} + extras ₱{addOnTotal}</span>
                      <span style={{ fontSize:12, fontWeight:800, color:DG }}>Total ₱{total.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display:"flex", gap:9 }}>
                    <button onClick={() => startFlow("cart")}
                      style={{ flex:1, padding:"12px 0", borderRadius:8, border:`1.5px solid ${G}`, background:"white", color:G, fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"all 0.15s" }}
                      onMouseEnter={e => {e.currentTarget.style.background=G;e.currentTarget.style.color="white"}}
                      onMouseLeave={e => {e.currentTarget.style.background="white";e.currentTarget.style.color=G}}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                      Add to Cart
                    </button>
                    <button onClick={() => startFlow("checkout")}
                      style={{ flex:1, padding:"12px 0", borderRadius:8, border:"none", background:`linear-gradient(135deg,${DG},${G})`, color:"white", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, boxShadow:"0 4px 14px rgba(46,139,52,0.28)", transition:"opacity 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.opacity="0.88"}
                      onMouseLeave={e => e.currentTarget.style.opacity="1"}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}