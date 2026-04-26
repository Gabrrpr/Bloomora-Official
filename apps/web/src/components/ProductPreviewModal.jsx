import { useState, useEffect } from "react"
import { addToCart } from "../utils/cart.js"

const G   = "#2E8B34"
const DG  = "#0C573E"
const CREAM = "#faf8f3"

const ADD_ONS = [
  { id:"ferrero8",  label:"Ferrero Rocher",  sub:"8 pieces",  price:199 },
  { id:"ferrero16", label:"Ferrero Rocher",  sub:"16 pieces", price:349 },
  { id:"teddy",     label:"Teddy Bear",       sub:"Plush, 30cm",price:399 },
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
  const isSel  = (d) => { if(!selected)return false; const [y,m,dd]=selected.split("-").map(Number); return cellD(d).toDateString()===new Date(y,m-1,dd).toDateString() }
  const pick   = (d) => { if(!isPast(d)) onSelect(toStr(cellD(d))) }

  return (
    <div style={{ background:"white", border:"1.5px solid #efe9de", borderRadius:14, padding:"16px 18px", boxShadow:"0 8px 24px rgba(0,0,0,0.08)", marginTop:10 }}>
      {/* Month nav */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <button onClick={prev} style={{ width:28,height:28,borderRadius:"50%",border:"1px solid #e5e7eb",background:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <svg width="11" height="11" fill="none" stroke="#374151" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        </button>
        <span style={{ fontSize:13, fontWeight:700, color:"#1f2937", letterSpacing:"-0.01em" }}>{MONTHS[vd.m]} {vd.y}</span>
        <button onClick={next} style={{ width:28,height:28,borderRadius:"50%",border:"1px solid #e5e7eb",background:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <svg width="11" height="11" fill="none" stroke="#374151" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:6 }}>
        {WDAYS.map((d,i) => (
          <div key={i} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:"#9ca3af", paddingBottom:4 }}>{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
        {cells.map((d,i) => {
          if (!d) return <div key={i}/>
          const past=isPast(d), tod=isTod(d), sel=isSel(d)
          return (
            <button key={i} onClick={() => pick(d)} disabled={past}
              style={{ aspectRatio:"1/1", width:"100%", borderRadius:"50%", border:"none", fontSize:12, fontWeight:sel||tod?700:400, cursor:past?"default":"pointer", color:sel?"white":past?"#d1d5db":tod?G:"#374151", background:sel?G:tod?"#f0fdf4":"transparent", outline:tod&&!sel?`2px solid ${G}`:"none", outlineOffset:-1, transition:"all 0.14s ease" }}>
              {d}
            </button>
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

  const inp = { width:"100%", border:"1.5px solid #e8e3da", borderRadius:9, padding:"10px 12px", fontSize:13, color:"#1f2937", outline:"none", background:"white", lineHeight:1.55, boxSizing:"border-box", transition:"border-color 0.16s" }

  return (
    <div style={{ width:"100%", display:"flex", flexDirection:"column", alignItems:"center", padding:"clamp(32px,5vw,52px) clamp(28px,6vw,64px)", boxSizing:"border-box", overflowY:"auto", maxHeight:"90vh" }}>

      {/* Check icon */}
      <div style={{ width:60,height:60,borderRadius:"50%",background:`linear-gradient(135deg,${DG},${G})`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:18,boxShadow:`0 10px 28px rgba(46,139,52,0.3)` }}>
        <svg width="28" height="28" fill="none" stroke="white" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
        </svg>
      </div>

      <p style={{ fontSize:22, fontWeight:800, color:"#111827", marginBottom:6, textAlign:"center" }}>Added to cart!</p>
      <p style={{ fontSize:14, color:"#6b7280", textAlign:"center", lineHeight:1.7, maxWidth:320, marginBottom: deliveryLabel?12:24 }}>
        Would you like to include a heartfelt greeting card with your order?
      </p>

      {deliveryLabel && (
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:50, background:"#f0fdf4", border:`1px solid ${G}30`, marginBottom:24 }}>
          <svg width="11" height="11" fill="none" stroke={DG} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span style={{ fontSize:11, fontWeight:700, color:DG }}>Delivery: {deliveryLabel}</span>
        </div>
      )}

      {wants === null && (
        <div style={{ display:"flex", gap:10, width:"100%", maxWidth:380 }}>
          <button onClick={() => setWants(true)}
            style={{ flex:1, padding:"12px 16px", borderRadius:10, border:`2px solid ${G}`, background:"white", color:G, fontSize:14, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, transition:"all 0.18s" }}
            onMouseEnter={e=>{e.currentTarget.style.background=G;e.currentTarget.style.color="white"}}
            onMouseLeave={e=>{e.currentTarget.style.background="white";e.currentTarget.style.color=G}}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            Yes, add a card
          </button>
          <button onClick={finish}
            style={{ flex:1, padding:"12px 16px", borderRadius:10, border:"1.5px solid #e5e7eb", background:"#f9fafb", color:"#4b5563", fontSize:14, fontWeight:600, cursor:"pointer", transition:"background 0.16s" }}
            onMouseEnter={e=>e.currentTarget.style.background="#f3f4f6"}
            onMouseLeave={e=>e.currentTarget.style.background="#f9fafb"}>
            No, thanks
          </button>
        </div>
      )}

      {wants === true && (
        <div style={{ width:"100%", maxWidth:440 }}>
          {/* Card preview */}
          <div style={{ background:"linear-gradient(135deg,#fdf2f8,#f0fdf4)", border:"1.5px solid #e9d5ff", borderRadius:14, padding:"16px 20px", marginBottom:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.22em", textTransform:"uppercase", color:"#7c3aed" }}>Greeting Card Preview</span>
              <svg width="12" height="12" fill="#f43f5e" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </div>
            <p style={{ fontSize:13, color:form.msg?"#1f2937":"#9ca3af", fontStyle:form.msg?"normal":"italic", lineHeight:1.7, minHeight:40, marginBottom:12 }}>
              {form.msg || "Your message will appear here..."}
            </p>
            <div style={{ display:"flex", justifyContent:"space-between", borderTop:"1px dashed #d8b4fe", paddingTop:10 }}>
              <span style={{ fontSize:11, color:"#6b7280" }}>To: <strong style={{ color:"#1f2937" }}>{form.to||"—"}</strong></span>
              <span style={{ fontSize:11, color:"#6b7280" }}>From: <strong style={{ color:"#1f2937" }}>{form.from||"—"}</strong></span>
            </div>
          </div>

          {/* Fields */}
          <div style={{ marginBottom:10 }}>
            <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:"#6b7280", marginBottom:5 }}>Message</label>
            <textarea rows={3} placeholder="Write your heartfelt message..." value={form.msg}
              onChange={e=>setForm(f=>({...f,msg:e.target.value}))} style={{...inp,resize:"none"}}
              onFocus={e=>e.target.style.borderColor=G} onBlur={e=>e.target.style.borderColor="#e8e3da"}/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
            <div>
              <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:"#6b7280", marginBottom:5 }}>To</label>
              <input type="text" placeholder="Recipient" value={form.to}
                onChange={e=>setForm(f=>({...f,to:e.target.value}))} style={inp}
                onFocus={e=>e.target.style.borderColor=G} onBlur={e=>e.target.style.borderColor="#e8e3da"}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:"#6b7280", marginBottom:5 }}>From</label>
              <input type="text" placeholder="Your name" value={form.from}
                onChange={e=>setForm(f=>({...f,from:e.target.value}))} style={inp}
                onFocus={e=>e.target.style.borderColor=G} onBlur={e=>e.target.style.borderColor="#e8e3da"}/>
            </div>
          </div>

          <div style={{ display:"flex", gap:10, marginBottom:10 }}>
            <button onClick={finish}
              style={{ flex:1, padding:"13px", borderRadius:10, border:"none", background:`linear-gradient(135deg,${DG},${G})`, color:"white", fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:`0 6px 18px rgba(46,139,52,0.3)` }}>
              Confirm & View {destination==="checkout"?"Checkout":"Cart"}
            </button>
            <button onClick={onClose}
              style={{ padding:"13px 16px", borderRadius:10, border:"1.5px solid #e5e7eb", background:"white", color:"#6b7280", fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}
              onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"}
              onMouseLeave={e=>e.currentTarget.style.background="white"}>
              Continue Shopping
            </button>
          </div>
          <button onClick={()=>setWants(null)} style={{ display:"block", width:"100%", textAlign:"center", background:"none", border:"none", color:"#9ca3af", fontSize:12, cursor:"pointer", paddingTop:4 }}>
            — Back
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main Modal ─────────────────────────────────────────────────────────────────
export default function ProductPreviewModal({ product, onClose, onNavigate }) {
  const [color,       setColor]       = useState(null)
  const [qty,         setQty]         = useState("1 pc")
  const [addOns,      setAddOns]      = useState([])
  const [delivType,   setDelivType]   = useState(null)
  const [customDate,  setCustomDate]  = useState("")
  const [showCal,     setShowCal]     = useState(false)
  const [step,        setStep]        = useState("product")
  const [dest,        setDest]        = useState("cart")
  const [visible,     setVisible]     = useState(false)

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
  const toggleAddOn = (id) => setAddOns(p=>p.includes(id)?p.filter(i=>i!==id):[...p,id])
  const addOnTotal  = addOns.reduce((s,id)=>s+(ADD_ONS.find(a=>a.id===id)?.price||0),0)
  const total       = product.price + addOnTotal

  const delivLabel = delivType==="today" ? "Today (before 2PM)"
    : delivType==="tomorrow" ? `Tomorrow, ${fmtDate(tomorrowStr())}`
    : delivType==="custom"&&customDate ? fmtDate(customDate)
    : null

  const startFlow = (d) => {
    addToCart({id:product.id,name:product.name,price:product.price,qty:1,img:product.image,desc:product.category})
    window.dispatchEvent(new Event("bloomora:cart-updated"))
    setDest(d); setStep("card")
  }

  const isCard = step==="card"

  return (
    <>
      <style>{`
        .pm-scroll::-webkit-scrollbar{width:4px}.pm-scroll::-webkit-scrollbar-track{background:transparent}.pm-scroll::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:4px}
        .pm-addon:hover{border-color:${G}!important;background:#f0fdf4!important}
        .pm-deliv:hover{border-color:${G}!important;background:#f6fef6!important}
        @media(max-width:640px){.pm-wrap{flex-direction:column!important}.pm-left{width:100%!important;min-width:unset!important}.pm-left-img{width:100%!important}}
      `}</style>

      {/* Backdrop */}
      <div
        style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"clamp(8px,2vw,20px)", backgroundColor:visible?"rgba(6,12,6,0.55)":"rgba(6,12,6,0)", backdropFilter:visible?"blur(6px)":"blur(0)", WebkitBackdropFilter:visible?"blur(6px)":"blur(0)", transition:"background-color 0.26s ease, backdrop-filter 0.26s ease" }}
        onClick={close}
      >
        {/* Modal */}
        <div
          className="pm-wrap"
          style={{ position:"relative", background:"white", borderRadius:20, width:"100%", maxWidth:isCard?"500px":"min(1100px,97vw)", maxHeight:"95vh", display:"flex", flexDirection:"row", overflow:"hidden", boxShadow:"0 40px 100px rgba(0,0,0,0.26),0 0 0 1px rgba(0,0,0,0.04)", opacity:visible?1:0, transform:visible?"translateY(0) scale(1)":"translateY(28px) scale(0.97)", transition:"opacity 0.28s ease, transform 0.32s cubic-bezier(0.34,1.56,0.64,1), max-width 0.3s ease" }}
          onClick={e=>e.stopPropagation()}
        >
          {/* Close */}
          <button onClick={close}
            style={{ position:"absolute", top:14, right:14, zIndex:40, width:32, height:32, borderRadius:"50%", border:"1.5px solid rgba(0,0,0,0.08)", background:"rgba(255,255,255,0.9)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all 0.16s" }}
            onMouseEnter={e=>{e.currentTarget.style.background="#f3f4f6";e.currentTarget.style.borderColor="#d1d5db"}}
            onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.9)";e.currentTarget.style.borderColor="rgba(0,0,0,0.08)"}}>
            <svg width="12" height="12" fill="none" stroke="#374151" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          {/* ── Card step ── */}
          {isCard && <CardStep deliveryLabel={delivLabel} destination={dest} onClose={close} onNavigate={onNavigate}/>}

          {/* ── Product view ── */}
          {!isCard && (
            <>
              {/* LEFT: Cream image panel */}
              <div
                className="pm-left"
                style={{ flexShrink:0, width:"clamp(260px,40%,420px)", background:CREAM, display:"flex", flexDirection:"column", justifyContent:"center", position:"relative", overflow:"hidden" }}
              >
                {/* Subtle botanical watermark */}
                <svg style={{ position:"absolute", bottom:-40, right:-40, width:220, height:220, opacity:0.045, pointerEvents:"none" }} viewBox="0 0 100 100" fill="none">
                  <path d="M50 5 Q65 25 50 50 Q35 25 50 5Z" fill={G}/>
                  <path d="M30 20 Q55 30 50 55 Q25 45 30 20Z" fill={G}/>
                  <path d="M70 20 Q75 45 50 55 Q45 30 70 20Z" fill={G}/>
                  <path d="M50 55 Q35 75 50 95 Q65 75 50 55Z" fill={G}/>
                </svg>

                {/* Square image centered */}
                <div className="pm-left-img" style={{ width:"100%", aspectRatio:"1/1", position:"relative", overflow:"hidden" }}>
                  <img src={product.image} alt={product.name}
                    style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center" }}
                  />
                  {/* Discount */}
                  <div style={{ position:"absolute", top:12, left:12, background:DG, color:"white", fontSize:10, fontWeight:800, padding:"4px 10px", borderRadius:50, letterSpacing:"0.05em" }}>
                    -{pctOff(product.original,product.price)}% OFF
                  </div>
                  {product.ribbon && (
                    <div style={{ position:"absolute", top:42, left:0 }}>
                      <div style={{ fontSize:10, fontWeight:800, color:"white", padding:"4px 16px 4px 10px", background:product._ribbonColor||G, clipPath:"polygon(0 0,calc(100% - 6px) 0,100% 50%,calc(100% - 6px) 100%,0 100%)" }}>
                        {product.ribbon}
                      </div>
                    </div>
                  )}
                </div>

                {/* Product label below image */}
                <div style={{ padding:"20px 24px 24px", borderTop:`1px solid #ede8e0`, position:"relative", zIndex:1 }}>
                  <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.22em", textTransform:"uppercase", color:G, display:"block", marginBottom:5 }}>{product.category}</span>
                  <p style={{ fontSize:15, fontWeight:700, color:"#1f2937", lineHeight:1.3, margin:"0 0 14px" }}>{product.name}</p>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <svg width="13" height="13" fill="none" stroke={G} viewBox="0 0 24 24" style={{ flexShrink:0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
                    </svg>
                    <div>
                      <p style={{ fontSize:11, fontWeight:700, color:"#374151", margin:0 }}>Same-day delivery</p>
                      <p style={{ fontSize:10, color:"#9ca3af", margin:0 }}>Before 2PM · Manila & Pampanga</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: Details */}
              <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>
                <div className="pm-scroll" style={{ flex:1, overflowY:"auto", padding:"clamp(22px,3vw,36px)" }}>

                  {/* Price block */}
                  <div style={{ paddingBottom:20, borderBottom:"1px solid #f0ede6", marginBottom:20 }}>
                    <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:8 }}>
                      <span style={{ fontSize:34, fontWeight:900, color:G, lineHeight:1, letterSpacing:"-0.02em" }}>₱{total.toLocaleString()}</span>
                      <span style={{ fontSize:14, color:"#9ca3af", textDecoration:"line-through" }}>₱{product.original.toLocaleString()}</span>
                      <span style={{ fontSize:10, fontWeight:800, color:"white", background:DG, padding:"3px 8px", borderRadius:6 }}>
                        Save ₱{(product.original-product.price).toLocaleString()}
                      </span>
                    </div>
                    {/* Stars */}
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ display:"flex", gap:2 }}>
                        {[1,2,3,4,5].map(i=>(
                          <svg key={i} width="13" height="13" fill={i<=Math.floor(product.rating)?"#f59e0b":"#e5e7eb"} viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        ))}
                      </div>
                      <span style={{ fontSize:12, fontWeight:600, color:"#374151" }}>{product.rating}</span>
                      <span style={{ fontSize:12, color:"#9ca3af" }}>({product.reviews} reviews)</span>
                      <span style={{ color:"#e5e7eb", margin:"0 2px" }}>·</span>
                      <span style={{ fontSize:12, color:"#9ca3af" }}>{(product.reviews*2).toLocaleString()} sold</span>
                    </div>
                  </div>

                  {/* Color */}
                  <div style={{ marginBottom:18 }}>
                    <p style={{ fontSize:11, fontWeight:700, color:"#374151", letterSpacing:"0.04em", textTransform:"uppercase", marginBottom:9 }}>
                      Color — <span style={{ color:G, textTransform:"none", letterSpacing:0 }}>{color?.name}</span>
                    </p>
                    <div style={{ display:"flex", gap:9 }}>
                      {colors.map(c=>(
                        <button key={c.name} onClick={()=>setColor(c)} title={c.name}
                          style={{ width:30,height:30,borderRadius:"50%",background:c.hex,border:c.outline?"1.5px solid #d1d5db":"1.5px solid transparent",outline:color?.name===c.name?`2.5px solid ${G}`:"2.5px solid transparent",outlineOffset:2,cursor:"pointer",transition:"all 0.15s ease",transform:color?.name===c.name?"scale(1.12)":"scale(1)" }}/>
                      ))}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div style={{ marginBottom:18 }}>
                    <p style={{ fontSize:11, fontWeight:700, color:"#374151", letterSpacing:"0.04em", textTransform:"uppercase", marginBottom:9 }}>Quantity</p>
                    <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                      {QTY_OPTIONS.map(q=>(
                        <button key={q} onClick={()=>setQty(q)}
                          style={{ padding:"7px 18px", borderRadius:50, fontSize:12, fontWeight:qty===q?700:500, border:`1.5px solid ${qty===q?G:"#ddd6c8"}`, background:qty===q?G:"white", color:qty===q?"white":"#4b5563", cursor:"pointer", transition:"all 0.15s ease" }}>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Add-ons */}
                  <div style={{ marginBottom:18, paddingBottom:18, borderBottom:"1px solid #f0ede6" }}>
                    <p style={{ fontSize:11, fontWeight:700, color:"#374151", letterSpacing:"0.04em", textTransform:"uppercase", marginBottom:9 }}>
                      Add-ons <span style={{ fontWeight:400, letterSpacing:0, textTransform:"none", color:"#9ca3af" }}>(optional)</span>
                    </p>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      {ADD_ONS.map(a=>{
                        const on=addOns.includes(a.id)
                        return (
                          <button key={a.id} onClick={()=>toggleAddOn(a.id)}
                            className="pm-addon"
                            style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 13px", borderRadius:12, border:`1.5px solid ${on?G:"#e8e3da"}`, background:on?"#f0fdf4":"white", cursor:"pointer", textAlign:"left", transition:"all 0.15s ease" }}>
                            <div>
                              <p style={{ fontSize:12, fontWeight:700, color:"#1f2937", margin:0, lineHeight:1.2 }}>{a.label}</p>
                              <p style={{ fontSize:10, color:"#9ca3af", margin:"2px 0 0" }}>{a.sub}</p>
                              <p style={{ fontSize:11, color:G, fontWeight:700, margin:"3px 0 0" }}>+₱{a.price}</p>
                            </div>
                            <div style={{ width:22,height:22,borderRadius:"50%",border:`1.5px solid ${on?G:"#ddd6c8"}`,background:on?G:"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s" }}>
                              {on
                                ? <svg width="11" height="11" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                                : <svg width="10" height="10" fill="none" stroke="#9ca3af" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                              }
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Delivery Date */}
                  <div style={{ marginBottom:18, paddingBottom:18, borderBottom:"1px solid #f0ede6" }}>
                    <p style={{ fontSize:11, fontWeight:700, color:"#374151", letterSpacing:"0.04em", textTransform:"uppercase", marginBottom:9 }}>
                      Delivery Date <span style={{ fontWeight:400, letterSpacing:0, textTransform:"none", color:"#9ca3af" }}>(optional)</span>
                    </p>
                    <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                      {[{k:"today",l:"Today",s:"Before 2:00 PM"},{k:"tomorrow",l:"Tomorrow",s:fmtDate(tomorrowStr())}].map(o=>(
                        <button key={o.k} onClick={()=>{setDelivType(o.k);setShowCal(false)}}
                          className="pm-deliv"
                          style={{ padding:"8px 14px", borderRadius:10, border:`1.5px solid ${delivType===o.k?G:"#e8e3da"}`, background:delivType===o.k?"#f0fdf4":"white", cursor:"pointer", textAlign:"left", transition:"all 0.15s ease" }}>
                          <p style={{ fontSize:12, fontWeight:700, color:delivType===o.k?DG:"#374151", margin:0 }}>{o.l}</p>
                          <p style={{ fontSize:10, color:delivType===o.k?G:"#9ca3af", margin:0 }}>{o.s}</p>
                        </button>
                      ))}
                      {/* Calendar button */}
                      <button onClick={()=>{setDelivType("custom");setShowCal(s=>!s)}}
                        className="pm-deliv"
                        style={{ padding:"8px 14px", borderRadius:10, border:`1.5px solid ${delivType==="custom"?G:"#e8e3da"}`, background:delivType==="custom"?"#f0fdf4":"white", cursor:"pointer", textAlign:"left", transition:"all 0.15s ease", display:"flex", alignItems:"center", gap:7 }}>
                        <svg width="14" height="14" fill="none" stroke={delivType==="custom"?DG:"#6b7280"} viewBox="0 0 24 24" style={{ flexShrink:0 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <div>
                          <p style={{ fontSize:12, fontWeight:700, color:delivType==="custom"?DG:"#374151", margin:0 }}>
                            {customDate?fmtDate(customDate):"Pick a date"}
                          </p>
                          <p style={{ fontSize:10, color:delivType==="custom"?G:"#9ca3af", margin:0 }}>
                            {customDate?"Tap to change":"Open calendar"}
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* Inline calendar */}
                    {showCal && delivType==="custom" && (
                      <MiniCalendar
                        selected={customDate}
                        onSelect={(d)=>{setCustomDate(d);setShowCal(false)}}
                      />
                    )}
                  </div>

                  {/* Description */}
                  <p style={{ fontSize:13, color:"#6b7280", lineHeight:1.75, margin:0 }}>
                    Hand-arranged by our skilled florists using the freshest blooms available. Perfect for gifting or adding beauty to any space. Each arrangement is made to order.
                  </p>
                </div>

                {/* Footer */}
                <div style={{ flexShrink:0, padding:"14px clamp(22px,3vw,36px) clamp(18px,2.5vw,26px)", borderTop:"1px solid #f0ede6", background:"white" }}>
                  {addOnTotal>0 && (
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                      <span style={{ fontSize:11, color:"#9ca3af" }}>Base ₱{product.price.toLocaleString()} + extras ₱{addOnTotal}</span>
                      <span style={{ fontSize:12, fontWeight:800, color:DG }}>Total ₱{total.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display:"flex", gap:10 }}>
                    <button onClick={()=>startFlow("cart")}
                      style={{ flex:1, padding:"13px 0", borderRadius:11, border:`2px solid ${G}`, background:"white", color:G, fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, transition:"all 0.18s" }}
                      onMouseEnter={e=>{e.currentTarget.style.background=G;e.currentTarget.style.color="white"}}
                      onMouseLeave={e=>{e.currentTarget.style.background="white";e.currentTarget.style.color=G}}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                      Add to Cart
                    </button>
                    <button onClick={()=>startFlow("checkout")}
                      style={{ flex:1, padding:"13px 0", borderRadius:11, border:"none", background:`linear-gradient(135deg,${DG},${G})`, color:"white", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, boxShadow:"0 6px 18px rgba(46,139,52,0.3)", transition:"opacity 0.18s" }}
                      onMouseEnter={e=>e.currentTarget.style.opacity="0.88"}
                      onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
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
