import { useState, useEffect, useRef } from "react"
import { addToCart } from "../utils/cart.js"

// Add-on images — place in src/assets/addons/
import ferrero8Img    from "../assets/addons/ferrero8pcs.png"
import ferrero12Img   from "../assets/addons/ferrero12pcs.png"
import ferrero24Img   from "../assets/addons/ferrero24pcs.png"
import hersheyOrgImg  from "../assets/addons/hersheyOriginal.png"
import herseyCncImg   from "../assets/addons/hersheyCnC.png"
import twixImg        from "../assets/addons/twix.png"

// Card choice images — place in src/assets/cards/
import withCardImg    from "../assets/cards/withCard.png"
import noCardImg      from "../assets/cards/noCard.png"

const G   = "#2E8B34"
const DG  = "#0C573E"
const ERR = "#ef4444"

const ALL_ADD_ONS = [
  { id:"ferrero8",   label:"Ferrero Rocher",     sub:"8 pieces",             price:199, img:ferrero8Img   },
  { id:"ferrero12",  label:"Ferrero Rocher",     sub:"12 pieces",            price:349, img:ferrero12Img  },
  { id:"ferrero24",  label:"Ferrero Rocher",     sub:"24 pieces",            price:599, img:ferrero24Img  },
  { id:"hersheyOrg", label:"Hershey's Original", sub:"Chocolate bar",        price:149, img:hersheyOrgImg },
  { id:"herseyCnC",  label:"Hershey's C&C",      sub:"Cookies & Cream",      price:149, img:herseyCncImg  },
  { id:"twix",       label:"Twix",               sub:"Caramel chocolate bar", price:149, img:twixImg       },
]

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

const pctOff      = (o,p) => Math.round((1-p/o)*100)
const pad         = (d)   => String(d).padStart(2,"0")
const toStr       = (d)   => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
const todayD      = ()    => { const d=new Date(); d.setHours(0,0,0,0); return d }
const tomorrowStr = ()    => { const d=new Date(); d.setDate(d.getDate()+1); return toStr(d) }
const fmtDate     = (s)   => { if(!s) return ""; const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("en-PH",{weekday:"short",month:"short",day:"numeric"}) }
const isTodayAvail= ()    => new Date().getHours() < 14

// ── Mini Calendar ──────────────────────────────────────────────────────────────
function MiniCalendar({ selected, onSelect }) {
  const now = todayD()
  const [vd,setVd] = useState({y:now.getFullYear(),m:now.getMonth()})
  const prev= ()=>setVd(v=>v.m===0?{y:v.y-1,m:11}:{...v,m:v.m-1})
  const next= ()=>setVd(v=>v.m===11?{y:v.y+1,m:0}:{...v,m:v.m+1})
  const first = new Date(vd.y,vd.m,1).getDay()
  const dim   = new Date(vd.y,vd.m+1,0).getDate()
  const cells = [...Array(first).fill(null),...Array.from({length:dim},(_,i)=>i+1)]
  const cd   = (d)=>new Date(vd.y,vd.m,d)
  const past = (d)=>cd(d)<now
  const tod  = (d)=>cd(d).toDateString()===now.toDateString()
  const sel  = (d)=>{ if(!selected) return false; const [y,m,dd]=selected.split("-").map(Number); return cd(d).toDateString()===new Date(y,m-1,dd).toDateString() }
  return (
    <div style={{marginTop:10,border:"1px solid #e5e7eb",borderRadius:10,overflow:"hidden",background:"white"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderBottom:"1px solid #f3f4f6",background:"#fafafa"}}>
        <button onClick={prev} style={{width:24,height:24,border:"1px solid #e5e7eb",borderRadius:6,background:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="10" height="10" fill="none" stroke="#6b7280" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
        </button>
        <span style={{fontSize:12,fontWeight:600,color:"#111827"}}>{MONTHS[vd.m]} {vd.y}</span>
        <button onClick={next} style={{width:24,height:24,border:"1px solid #e5e7eb",borderRadius:6,background:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="10" height="10" fill="none" stroke="#6b7280" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
      <div style={{padding:"10px 12px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:6}}>
          {WDAYS.map((d,i)=><div key={i} style={{textAlign:"center",fontSize:9,fontWeight:500,color:"#9ca3af",letterSpacing:"0.03em"}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
          {cells.map((d,i)=>{
            if(!d) return <div key={i}/>
            const p=past(d),t=tod(d),s=sel(d)
            return(
              <button key={i} onClick={()=>!p&&onSelect(toStr(cd(d)))} disabled={p}
                style={{height:28,borderRadius:6,border:"none",fontSize:11,fontWeight:s||t?600:400,cursor:p?"default":"pointer",color:s?"white":p?"#d1d5db":t?G:"#374151",background:s?G:t?"#f0fdf4":"transparent",outline:t&&!s?`1.5px solid ${G}`:"none",outlineOffset:-1,transition:"all 0.1s",padding:0}}>
                {d}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Confetti burst from center ────────────────────────────────────────────────
const CONFETTI_COLORS = ["#2E8B34","#f472b6","#fbbf24","#60a5fa","#a78bfa","#f87171","#34d399","#fb923c"]
const CONFETTI_COUNT  = 56

const CONFETTI_PIECES = Array.from({length:CONFETTI_COUNT},(_,i)=>{
  const angle = (i/CONFETTI_COUNT)*360 + (Math.random()-0.5)*18
  const dist  = 80+Math.random()*110
  const rad   = angle*Math.PI/180
  return {
    id:i, color:CONFETTI_COLORS[i%CONFETTI_COLORS.length],
    dx:Math.cos(rad)*dist, dy:Math.sin(rad)*dist,
    delay:Math.random()*0.14, dur:0.9+Math.random()*0.55,
    size:5+Math.random()*8, rot:(Math.random()-0.5)*680,
    type:i%3===0?"circle":i%3===1?"rect":"tri",
  }
})

const BURST_CSS_ID = "bloomora-confetti-css"
function injectBurstCSS() {
  if (document.getElementById(BURST_CSS_ID)) return
  const s = document.createElement("style"); s.id = BURST_CSS_ID
  s.textContent = `
    @keyframes cf-burst {
      0%   { transform:translate(0,0) rotate(0deg) scale(0.3); opacity:0; }
      10%  { transform:translate(0,0) rotate(0deg) scale(1.1); opacity:1; }
      60%  { transform:translate(var(--dx),var(--dy)) rotate(calc(var(--r)*0.65)) scale(1); opacity:1; }
      100% { transform:translate(calc(var(--dx)*1.25),calc(var(--dy)*1.35)) rotate(var(--r)) scale(0.2); opacity:0; }
    }
  `
  document.head.appendChild(s)
}

function Confetti() {
  useEffect(()=>{ injectBurstCSS() },[])
  return (
    <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
      {CONFETTI_PIECES.map(p=>(
        <div key={p.id} style={{
          position:"absolute",
          width:p.type==="rect"?`${p.size*1.8}px`:`${p.size}px`,
          height:`${p.size}px`,
          background:p.type==="tri"?"transparent":p.color,
          borderRadius:p.type==="circle"?"50%":p.type==="rect"?"2px":"0",
          borderLeft:p.type==="tri"?`${p.size/2}px solid transparent`:"none",
          borderRight:p.type==="tri"?`${p.size/2}px solid transparent`:"none",
          borderBottom:p.type==="tri"?`${p.size}px solid ${p.color}`:"none",
          "--dx":`${p.dx}px`,"--dy":`${p.dy}px`,"--r":`${p.rot}deg`,
          animation:`cf-burst ${p.dur}s cubic-bezier(0.22,0.61,0.36,1) ${p.delay}s 1 forwards`,
        }}/>
      ))}
    </div>
  )
}


// ── Card Choice Step ───────────────────────────────────────────────────────────
function CardStep({ delivLabel, dest, onClose, onNavigate }) {
  const [phase,   setPhase]   = useState("choice")   // "choice" | "form" | "done"
  const [form,    setForm]    = useState({ msg:"", to:"", from:"" })
  const [formErr, setFormErr] = useState({})
  const [hovered, setHovered] = useState(null)
  const [choice,  setChoice]  = useState(null)        // true = with card, false = without

  const inp = (err) => ({
    width:"100%", border:`1px solid ${err?"#fca5a5":"#e5e7eb"}`, borderRadius:8,
    padding:"9px 12px", fontSize:13, color:"#1f2937", outline:"none",
    background:"white", boxSizing:"border-box", transition:"border-color 0.15s", fontFamily:"inherit"
  })

  // User picks a card option
  const handleChoice = (withCard) => {
    setChoice(withCard)
    setPhase(withCard ? "form" : "done")
  }

  // Validate & confirm card form
  const handleConfirm = () => {
    const e = {}
    if (!form.msg.trim())  e.msg  = true
    if (!form.to.trim())   e.to   = true
    if (!form.from.trim()) e.from = true
    setFormErr(e)
    if (Object.keys(e).length > 0) return
    setPhase("done")
  }

  // Navigate away after confetti
  useEffect(()=>{
    if (phase==="done") {
      const t = setTimeout(()=>{ onClose(); onNavigate?.(dest==="checkout"?"checkout":"cart") }, 2600)
      return ()=>clearTimeout(t)
    }
  },[phase])

  // ── Done / confetti screen ──
  if (phase==="done") return (
    <div style={{width:"100%",position:"relative",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 40px",boxSizing:"border-box",minHeight:440,overflow:"hidden"}}>
      <Confetti/>
      <div style={{position:"relative",zIndex:11,display:"flex",flexDirection:"column",alignItems:"center",gap:0}}>
        {/* Big check */}
        <div style={{width:80,height:80,borderRadius:"50%",background:`linear-gradient(135deg,${DG},${G})`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:22,boxShadow:"0 12px 32px rgba(46,139,52,0.32)"}}>
          <svg width="38" height="38" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7"/></svg>
        </div>
        <p style={{fontSize:26,fontWeight:700,color:"#111827",marginBottom:10,textAlign:"center",fontFamily:"inherit",letterSpacing:"-0.01em"}}>Item added to cart!</p>
        <p style={{fontSize:15,color:"#6b7280",textAlign:"center",lineHeight:1.65,maxWidth:300,marginBottom:20,fontFamily:"inherit"}}>
          {choice ? "Your greeting card has been included." : "No greeting card added."}
        </p>
        {delivLabel&&(
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600,color:DG,background:"#f0fdf4",border:"1px solid #bbf7d0",padding:"8px 18px",borderRadius:24,marginBottom:20,fontFamily:"inherit"}}>
            <svg width="13" height="13" fill="none" stroke={DG} strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            Delivery: {delivLabel}
          </div>
        )}
        <p style={{fontSize:12,color:"#9ca3af",textAlign:"center",fontFamily:"inherit"}}>Redirecting you now...</p>
      </div>
    </div>
  )

  // ── Choice screen ──
  if (phase==="choice") return (
    <div style={{width:"100%",display:"flex",flexDirection:"column",alignItems:"center",padding:"40px 40px",boxSizing:"border-box",minHeight:440,overflowY:"auto",maxHeight:"90vh"}}>
      <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${DG},${G})`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,boxShadow:"0 6px 20px rgba(46,139,52,0.22)"}}>
        <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
      </div>
      <p style={{fontSize:16,fontWeight:700,color:"#111827",marginBottom:4,textAlign:"center",fontFamily:"inherit"}}>Added to cart!</p>
      <p style={{fontSize:13,color:"#6b7280",textAlign:"center",lineHeight:1.6,maxWidth:280,marginBottom:delivLabel?10:20,fontFamily:"inherit"}}>Would you like to include a greeting card with your order?</p>
      {delivLabel&&<div style={{fontSize:11,fontWeight:600,color:DG,background:"#f0fdf4",border:"1px solid #bbf7d0",padding:"4px 12px",borderRadius:20,marginBottom:20,fontFamily:"inherit"}}>Delivery: {delivLabel}</div>}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,width:"100%",maxWidth:380}}>
        {[
          { key:true,  img:withCardImg, label:"Yes, add a card", sub:"Include a greeting card" },
          { key:false, img:noCardImg,   label:"No thanks",       sub:"Continue without card"   },
        ].map(opt=>(
          <button key={String(opt.key)} onClick={()=>handleChoice(opt.key)}
            style={{border:`1.5px solid ${hovered===opt.key?G:"#e5e7eb"}`,borderRadius:12,overflow:"hidden",background:"white",cursor:"pointer",textAlign:"left",padding:0,transition:"border-color 0.15s,box-shadow 0.15s",boxShadow:hovered===opt.key?"0 4px 16px rgba(46,139,52,0.12)":"none"}}
            onMouseEnter={()=>setHovered(opt.key)}
            onMouseLeave={()=>setHovered(null)}>
            <div style={{height:120,background:"#f9fafb",overflow:"hidden"}}>
              <img src={opt.img} alt={opt.label} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} onError={e=>{e.target.style.display="none"}}/>
            </div>
            <div style={{padding:"10px 12px"}}>
              <p style={{fontSize:12,fontWeight:600,color:"#111827",margin:0,fontFamily:"inherit"}}>{opt.label}</p>
              <p style={{fontSize:11,color:"#9ca3af",margin:"2px 0 0",fontFamily:"inherit"}}>{opt.sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  // ── Card form (all fields required, no skip) ──
  const MSG_MAX  = 160
  const NAME_MAX = 30

  return (
    <div style={{width:"100%",display:"flex",flexDirection:"column",alignItems:"center",padding:"32px 40px",boxSizing:"border-box",minHeight:440,overflowY:"auto",maxHeight:"90vh"}}>
      <p style={{fontSize:15,fontWeight:700,color:"#111827",marginBottom:4,textAlign:"center",fontFamily:"inherit"}}>Write your greeting card</p>
      <p style={{fontSize:12,color:"#9ca3af",textAlign:"center",marginBottom:16,fontFamily:"inherit"}}>All fields are required.</p>

      {/* Friendly reminder */}
      <div style={{display:"flex",alignItems:"flex-start",gap:8,padding:"9px 13px",borderRadius:8,background:"#fffbeb",border:"1px solid #fde68a",marginBottom:16,width:"100%",maxWidth:400,boxSizing:"border-box"}}>
        <svg width="14" height="14" fill="none" stroke="#d97706" strokeWidth={2} viewBox="0 0 24 24" style={{flexShrink:0,marginTop:1}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <p style={{fontSize:11,color:"#92400e",margin:0,lineHeight:1.5,fontFamily:"inherit"}}>
          Please keep your message kind and respectful. Hateful, harmful, or inappropriate content will not be allowed.
        </p>
      </div>

      <div style={{width:"100%",maxWidth:400}}>
        {/* Live preview */}
        <div style={{border:"1px solid #e5e7eb",borderRadius:10,padding:"14px 16px",marginBottom:14,background:"#fafafa"}}>
          <p style={{fontSize:10,fontWeight:600,color:"#9ca3af",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8,fontFamily:"inherit"}}>Preview</p>
          <p style={{fontSize:13,color:form.msg?"#1f2937":"#d1d5db",fontStyle:form.msg?"normal":"italic",lineHeight:1.6,minHeight:36,marginBottom:10,fontFamily:"inherit",wordBreak:"break-word"}}>{form.msg||"Your message..."}</p>
          <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid #f3f4f6",paddingTop:8}}>
            <span style={{fontSize:11,color:"#6b7280",fontFamily:"inherit"}}>To: <strong style={{color:"#1f2937"}}>{form.to||"—"}</strong></span>
            <span style={{fontSize:11,color:"#6b7280",fontFamily:"inherit"}}>From: <strong style={{color:"#1f2937"}}>{form.from||"—"}</strong></span>
          </div>
        </div>

        {/* Message */}
        <div style={{marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <label style={{display:"flex",alignItems:"center",gap:4,fontSize:10,fontWeight:600,color:formErr.msg?"#ef4444":"#374151",letterSpacing:"0.06em",textTransform:"uppercase",fontFamily:"inherit"}}>
              Message <span style={{color:"#ef4444"}}>*</span>
              {formErr.msg&&<span style={{fontWeight:500,textTransform:"none",letterSpacing:0,fontSize:10}}>— required</span>}
            </label>
            <span style={{fontSize:10,color:form.msg.length>MSG_MAX*0.9?"#ef4444":"#9ca3af",fontFamily:"inherit"}}>{form.msg.length}/{MSG_MAX}</span>
          </div>
          <textarea rows={3} placeholder="Write a warm, kind message..." value={form.msg} maxLength={MSG_MAX}
            onChange={e=>{setForm(f=>({...f,msg:e.target.value}));setFormErr(e=>({...e,msg:false}))}}
            style={{...inp(formErr.msg),resize:"none"}}
            onFocus={e=>e.target.style.borderColor=formErr.msg?"#ef4444":G}
            onBlur={e=>e.target.style.borderColor=formErr.msg?"#fca5a5":"#e5e7eb"}/>
        </div>

        {/* To / From */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
          {[["to","e.g. Maria","To"],["from","e.g. Juan","From"]].map(([k,ph,l])=>(
            <div key={k}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                <label style={{display:"flex",alignItems:"center",gap:4,fontSize:10,fontWeight:600,color:formErr[k]?"#ef4444":"#374151",letterSpacing:"0.06em",textTransform:"uppercase",fontFamily:"inherit"}}>
                  {l} <span style={{color:"#ef4444"}}>*</span>
                  {formErr[k]&&<span style={{fontWeight:500,textTransform:"none",letterSpacing:0,fontSize:10}}>req.</span>}
                </label>
                <span style={{fontSize:10,color:form[k].length>NAME_MAX*0.85?"#ef4444":"#9ca3af",fontFamily:"inherit"}}>{form[k].length}/{NAME_MAX}</span>
              </div>
              <input placeholder={ph} value={form[k]} maxLength={NAME_MAX}
                onChange={e=>{setForm(f=>({...f,[k]:e.target.value}));setFormErr(e=>({...e,[k]:false}))}}
                style={inp(formErr[k])}
                onFocus={e=>e.target.style.borderColor=formErr[k]?"#ef4444":G}
                onBlur={e=>e.target.style.borderColor=formErr[k]?"#fca5a5":"#e5e7eb"}/>
            </div>
          ))}
        </div>

        {/* Confirm only — no skip */}
        <button onClick={handleConfirm}
          style={{width:"100%",padding:"12px",borderRadius:8,border:"none",background:`linear-gradient(135deg,${DG},${G})`,color:"white",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>
          Confirm & Add to Cart
        </button>
        <button onClick={()=>setPhase("choice")}
          style={{display:"block",width:"100%",textAlign:"center",background:"none",border:"none",color:"#9ca3af",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
          ← Back
        </button>
      </div>
    </div>
  )
}

// ── Section label (matches navbar style) ──────────────────────────────────────
const SectionLabel = ({ children, error, required }) => (
  <p style={{fontSize:11,fontWeight:600,color:error?ERR:"#374151",letterSpacing:"0.06em",textTransform:"uppercase",margin:"0 0 10px",display:"flex",alignItems:"center",gap:4,fontFamily:"inherit"}}>
    {children}
    {required && <span style={{color:ERR,fontSize:12,lineHeight:1}}>*</span>}
    {error    && <span style={{fontSize:10,fontWeight:500,color:ERR,textTransform:"none",letterSpacing:0}}>required</span>}
  </p>
)

// ── Image with cursor-follow zoom ─────────────────────────────────────────────
function ImgZoom({ product }) {
  const [pos, setPos]     = useState(null)   // {x,y} percentage 0-100
  const [active, setActive] = useState(false)
  const ref = useRef(null)

  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width)  * 100
    const y = ((e.clientY - rect.top)  / rect.height) * 100
    setPos({ x, y })
  }

  return (
    <div
      ref={ref}
      className="pm-img"
      onMouseMove={handleMove}
      onMouseEnter={()=>setActive(true)}
      onMouseLeave={()=>{ setActive(false); setPos(null) }}
      style={{
        flexShrink:0, width:"44%", position:"relative",
        background:"#f3f4f6", overflow:"hidden",
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor: active ? "crosshair" : "default",
      }}
    >
      <img
        src={product.image}
        alt={product.name}
        style={{
          width:"100%", height:"100%",
          objectFit:"cover", objectPosition:"center", display:"block",
          transition: active ? "transform 0.25s ease-out" : "transform 0.4s ease",
          transform: active && pos
            ? `scale(1.7)`
            : "scale(1)",
          transformOrigin: pos ? `${pos.x}% ${pos.y}%` : "center center",
          willChange: "transform",
        }}
      />

      {/* Badges — always on top */}
      <div style={{position:"absolute",top:14,left:14,background:DG,color:"white",fontSize:10,fontWeight:600,padding:"3px 10px",borderRadius:4,letterSpacing:"0.04em",pointerEvents:"none",zIndex:5}}>
        -{pctOff(product.original,product.price)}% OFF
      </div>
      {product.ribbon&&(
        <div style={{position:"absolute",top:38,left:0,pointerEvents:"none",zIndex:5}}>
          <div style={{fontSize:9,fontWeight:700,color:"white",padding:"3px 14px 3px 10px",background:product._ribbonColor||G,clipPath:"polygon(0 0,calc(100% - 6px) 0,100% 50%,calc(100% - 6px) 100%,0 100%)"}}>
            {product.ribbon}
          </div>
        </div>
      )}

      {/* Delivery badge */}
      <div style={{position:"absolute",bottom:14,left:12,right:12,background:"rgba(255,255,255,0.94)",borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",gap:8,boxShadow:"0 2px 8px rgba(0,0,0,0.07)",pointerEvents:"none",zIndex:5}}>
        <svg width="13" height="13" fill="none" stroke={G} strokeWidth={1.8} viewBox="0 0 24 24" style={{flexShrink:0}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
        </svg>
        <div>
          <p style={{fontSize:11,fontWeight:600,color:"#111827",margin:0,fontFamily:"inherit"}}>Same-day delivery</p>
          <p style={{fontSize:10,color:"#6b7280",margin:0,fontFamily:"inherit"}}>Before 2PM · Manila & Pampanga</p>
        </div>
      </div>

      {/* Zoom hint on first hover */}
      {active&&(
        <div style={{position:"absolute",top:12,right:12,background:"rgba(0,0,0,0.45)",color:"white",fontSize:9,fontWeight:600,padding:"3px 8px",borderRadius:20,pointerEvents:"none",zIndex:5,backdropFilter:"blur(4px)",letterSpacing:"0.04em"}}>
          ZOOM
        </div>
      )}
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function ProductPreviewModal({ product, onClose, onNavigate }) {
  const [color,      setColor]     = useState(null)
  const [qty,        setQty]       = useState(null)
  const [addOns,     setAddOns]    = useState([])
  const [delivType,  setDelivType] = useState(null)
  const [customDate, setCustDate]  = useState("")
  const [showCal,    setShowCal]   = useState(false)
  const [step,       setStep]      = useState("product")
  const [dest,       setDest]      = useState("cart")
  const [visible,    setVisible]   = useState(false)
  const [tab,        setTab]       = useState("details")
  const [errors,     setErrors]    = useState({})
  const [showAllAddons, setShowAllAddons] = useState(false)

  const todayOk = isTodayAvail()
  const colors  = CATEGORY_COLORS[product.category]||CATEGORY_COLORS.Roses
  const visibleAddons = showAllAddons ? ALL_ADD_ONS : ALL_ADD_ONS.slice(0, INITIAL_ADDON_COUNT)

  useEffect(()=>{
    setColor(colors[0])
    requestAnimationFrame(()=>requestAnimationFrame(()=>setVisible(true)))
    document.body.style.overflow="hidden"
    const onKey=(e)=>{if(e.key==="Escape") close()}
    document.addEventListener("keydown",onKey)
    return()=>{document.removeEventListener("keydown",onKey);document.body.style.overflow=""}
  },[])

  const close       = ()=>{setVisible(false);setTimeout(onClose,260)}
  const toggleAddOn = (id)=>setAddOns(p=>p.includes(id)?p.filter(i=>i!==id):[...p,id])
  const addOnTotal  = addOns.reduce((s,id)=>s+(ALL_ADD_ONS.find(a=>a.id===id)?.price||0),0)
  const total       = product.price+addOnTotal
  const delivLabel  = delivType==="today"?"Today (before 2PM)":delivType==="tomorrow"?`Tomorrow, ${fmtDate(tomorrowStr())}`:delivType==="custom"&&customDate?fmtDate(customDate):null

  const validate=()=>{
    const e={}
    if(!color) e.color=true
    if(!qty)   e.qty=true
    if(!delivType||(delivType==="custom"&&!customDate)) e.date=true
    setErrors(e); return Object.keys(e).length===0
  }
  const startFlow=(d)=>{
    if(!validate()) return
    addToCart({id:product.id,name:product.name,price:product.price,qty:1,img:product.image,desc:product.category})
    window.dispatchEvent(new Event("bloomora:cart-updated"))
    setDest(d);setStep("card")
  }

  const isCard = step==="card"

  return(
    <>
      <style>{`
        .pm-scroll::-webkit-scrollbar{width:4px}
        .pm-scroll::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:4px}
        .pm-scroll::-webkit-scrollbar-track{background:transparent}
        @media(max-width:760px){
          .pm-wrap{flex-direction:column!important;height:auto!important;max-height:95vh!important}
          .pm-img{width:100%!important;height:56vw!important;min-height:220px!important}
        }
      `}</style>

      <div onClick={close}
        style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backgroundColor:visible?"rgba(0,0,0,0.42)":"transparent",backdropFilter:visible?"blur(5px)":"none",WebkitBackdropFilter:visible?"blur(5px)":"none",transition:"background-color 0.22s,backdrop-filter 0.22s"}}>

        <div className="pm-wrap" onClick={e=>e.stopPropagation()}
          style={{position:"relative",display:"flex",flexDirection:"row",width:"100%",maxWidth:isCard?"480px":"min(1060px,97vw)",height:isCard?"auto":"min(88vh,680px)",background:"white",borderRadius:14,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.16)",opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(16px)",transition:"opacity 0.22s,transform 0.26s cubic-bezier(0.34,1.2,0.64,1)",fontFamily:"inherit"}}>

          {/* Close */}
          <button onClick={close}
            style={{position:"absolute",top:12,right:12,zIndex:50,width:28,height:28,borderRadius:"50%",border:"1px solid #e5e7eb",background:"white",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"background 0.12s"}}
            onMouseEnter={e=>e.currentTarget.style.background="#f3f4f6"}
            onMouseLeave={e=>e.currentTarget.style.background="white"}>
            <svg width="10" height="10" fill="none" stroke="#374151" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>

          {isCard&&<CardStep delivLabel={delivLabel} dest={dest} onClose={close} onNavigate={onNavigate}/>}

          {!isCard&&<>

            {/* ── Image panel with cursor-follow zoom ── */}
            <ImgZoom product={product}/>

            {/* ── Right panel ── */}
            <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>
              <div className="pm-scroll" style={{flex:1,overflowY:"auto",padding:"22px 24px 0"}}>

                {/* Breadcrumb */}
                <p style={{fontSize:11,color:"#9ca3af",margin:"0 0 6px",fontFamily:"inherit"}}>
                  {product.category}
                  <span style={{color:"#d1d5db",margin:"0 4px"}}>/</span>
                  <span style={{color:G,fontWeight:500}}>{product.name}</span>
                </p>

                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:8}}>
                  <h2 style={{fontSize:17,fontWeight:700,color:"#111827",margin:0,lineHeight:1.3,fontFamily:"inherit",flex:1}}>
                    {product.name}
                  </h2>
                  <a href="https://wa.me/639189022401" target="_blank" rel="noopener noreferrer"
                    title="Ask us about this product"
                    style={{display:"flex",alignItems:"center",gap:5,flexShrink:0,padding:"5px 10px",borderRadius:20,background:"#f0fdf4",border:"1px solid #bbf7d0",color:G,fontSize:11,fontWeight:600,textDecoration:"none",transition:"all 0.15s",whiteSpace:"nowrap"}}
                    onMouseEnter={e=>{e.currentTarget.style.background=G;e.currentTarget.style.color="white";e.currentTarget.style.borderColor=G}}
                    onMouseLeave={e=>{e.currentTarget.style.background="#f0fdf4";e.currentTarget.style.color=G;e.currentTarget.style.borderColor="#bbf7d0"}}>
                    <svg width="13" height="13" fill="currentColor" viewBox="0 0 448 512">
                      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                    </svg>
                    Ask us
                  </a>
                </div>

                {/* Rating */}
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:12}}>
                  {[1,2,3,4,5].map(i=>(
                    <svg key={i} width="12" height="12" fill={i<=Math.floor(product.rating)?"#f59e0b":"#e5e7eb"} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                  <span style={{fontSize:12,fontWeight:500,color:"#374151",fontFamily:"inherit"}}>{product.rating}</span>
                  <span style={{fontSize:12,color:"#9ca3af",fontFamily:"inherit"}}>({product.reviews} reviews)</span>
                  <span style={{color:"#e5e7eb",margin:"0 2px"}}>·</span>
                  <span style={{fontSize:12,color:"#9ca3af",fontFamily:"inherit"}}>{(product.reviews*2).toLocaleString()} sold</span>
                </div>

                {/* Price */}
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,paddingBottom:16,borderBottom:"1px solid #f3f4f6"}}>
                  <span style={{fontSize:24,fontWeight:700,color:"#111827",fontFamily:"inherit",letterSpacing:"-0.01em"}}>₱{total.toLocaleString()}</span>
                  <span style={{fontSize:13,color:"#9ca3af",textDecoration:"line-through",fontFamily:"inherit"}}>₱{product.original.toLocaleString()}</span>
                  <span style={{fontSize:10,fontWeight:600,color:G,background:"#f0fdf4",border:"1px solid #bbf7d0",padding:"2px 8px",borderRadius:4,fontFamily:"inherit"}}>
                    Save ₱{(product.original-product.price).toLocaleString()}
                  </span>
                </div>

                {/* Tabs — match navbar text-sm font-medium style */}
                <div style={{display:"flex",borderBottom:"1px solid #f3f4f6",marginBottom:18}}>
                  {[["details","Details"],["care","Care Guide"],["reviews","Reviews"]].map(([k,l])=>(
                    <button key={k} onClick={()=>setTab(k)}
                      style={{padding:"7px 14px",fontSize:13,fontWeight:tab===k?600:400,color:tab===k?G:"#6b7280",background:"none",border:"none",borderBottom:`2px solid ${tab===k?G:"transparent"}`,cursor:"pointer",marginBottom:-1,transition:"color 0.12s",fontFamily:"inherit"}}>
                      {l}
                    </button>
                  ))}
                </div>

                {/* ── Details ── */}
                {tab==="details"&&(
                  <div>
                    {/* Color */}
                    <div style={{marginBottom:20}}>
                      <SectionLabel error={errors.color} required>
                        Color{color&&<span style={{color:G,fontWeight:500,textTransform:"none",letterSpacing:0,marginLeft:4}}>— {color.name}</span>}
                      </SectionLabel>
                      <div style={{display:"flex",gap:12,alignItems:"center"}}>
                        {colors.map(c=>(
                          <button key={c.name} title={c.name} onClick={()=>{setColor(c);setErrors(e=>({...e,color:false}))}}
                            style={{width:26,height:26,borderRadius:"50%",background:c.hex,border:c.outline?"1.5px solid #d1d5db":"1.5px solid transparent",outline:color?.name===c.name?`2.5px solid ${errors.color?ERR:G}`:"2.5px solid transparent",outlineOffset:2,cursor:"pointer",transition:"transform 0.12s",transform:color?.name===c.name?"scale(1.15)":"scale(1)"}}/>
                        ))}
                      </div>
                    </div>

                    {/* Qty */}
                    <div style={{marginBottom:20}}>
                      <SectionLabel error={errors.qty} required>Size / Quantity</SectionLabel>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {QTY_OPTIONS.map(q=>(
                          <button key={q} onClick={()=>{setQty(q);setErrors(e=>({...e,qty:false}))}}
                            style={{padding:"6px 14px",borderRadius:6,fontSize:13,fontWeight:qty===q?600:400,border:`1px solid ${qty===q?G:errors.qty?"#fca5a5":"#e5e7eb"}`,background:qty===q?G:"white",color:qty===q?"white":"#374151",cursor:"pointer",transition:"all 0.12s",fontFamily:"inherit"}}>
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Add-ons — with images, show 4 + expand */}
                    <div style={{marginBottom:20,paddingBottom:20,borderBottom:"1px solid #f3f4f6"}}>
                      <p style={{fontSize:11,fontWeight:600,color:"#374151",letterSpacing:"0.06em",textTransform:"uppercase",margin:"0 0 10px",fontFamily:"inherit"}}>
                        Add-ons <span style={{fontWeight:400,color:"#9ca3af",letterSpacing:0,textTransform:"none"}}>(optional)</span>
                      </p>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                        {visibleAddons.map(a=>{
                          const on=addOns.includes(a.id)
                          return(
                            <button key={a.id} onClick={()=>toggleAddOn(a.id)}
                              style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:8,border:`1px solid ${on?G:"#e5e7eb"}`,background:on?"#f0fdf4":"white",cursor:"pointer",textAlign:"left",transition:"all 0.12s",fontFamily:"inherit"}}
                              onMouseEnter={e=>{if(!on){e.currentTarget.style.borderColor="#d1d5db"}}}
                              onMouseLeave={e=>{if(!on){e.currentTarget.style.borderColor="#e5e7eb"}}}>
                              {/* Product thumbnail */}
                              <div style={{width:40,height:40,borderRadius:6,overflow:"hidden",flexShrink:0,background:"#f3f4f6",border:"1px solid #e5e7eb"}}>
                                <img src={a.img} alt={a.label} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                                  onError={e=>{e.target.style.display="none"}}/>
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <p style={{fontSize:11,fontWeight:600,color:"#111827",margin:0,fontFamily:"inherit",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.label}</p>
                                <p style={{fontSize:10,color:"#9ca3af",margin:"1px 0 0",fontFamily:"inherit"}}>{a.sub}</p>
                                <p style={{fontSize:11,color:G,fontWeight:600,margin:"2px 0 0",fontFamily:"inherit"}}>+₱{a.price}</p>
                              </div>
                              <div style={{width:18,height:18,borderRadius:"50%",border:`1.5px solid ${on?G:"#d1d5db"}`,background:on?G:"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.12s"}}>
                                {on
                                  ?<svg width="9" height="9" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                                  :<svg width="8" height="8" fill="none" stroke="#9ca3af" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                                }
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      {/* See more / less */}
                      {ALL_ADD_ONS.length > INITIAL_ADDON_COUNT && (
                        <button onClick={()=>setShowAllAddons(p=>!p)}
                          style={{display:"flex",alignItems:"center",gap:5,marginTop:8,background:"none",border:"none",cursor:"pointer",color:G,fontSize:12,fontWeight:500,padding:0,fontFamily:"inherit"}}>
                          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showAllAddons?"M5 15l7-7 7 7":"M19 9l-7 7-7-7"}/>
                          </svg>
                          {showAllAddons ? "Show less" : `See all add-ons (${ALL_ADD_ONS.length - INITIAL_ADDON_COUNT} more)`}
                        </button>
                      )}
                    </div>

                    {/* Delivery date */}
                    <div style={{marginBottom:20}}>
                      <SectionLabel error={errors.date} required>Delivery Date</SectionLabel>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {/* Today */}
                        <button disabled={!todayOk} onClick={()=>{if(todayOk){setDelivType("today");setShowCal(false);setErrors(e=>({...e,date:false}))}}}
                          style={{padding:"7px 12px",borderRadius:6,border:`1px solid ${delivType==="today"?G:"#e5e7eb"}`,background:delivType==="today"?"#f0fdf4":!todayOk?"#fafafa":"white",cursor:todayOk?"pointer":"not-allowed",textAlign:"left",opacity:todayOk?1:0.5,transition:"all 0.12s"}}
                          onMouseEnter={e=>{if(todayOk&&delivType!=="today")e.currentTarget.style.borderColor="#d1d5db"}}
                          onMouseLeave={e=>{if(todayOk&&delivType!=="today")e.currentTarget.style.borderColor="#e5e7eb"}}>
                          <p style={{fontSize:12,fontWeight:600,color:delivType==="today"?DG:!todayOk?"#9ca3af":"#374151",margin:0,fontFamily:"inherit"}}>Today</p>
                          <p style={{fontSize:10,color:delivType==="today"?G:"#9ca3af",margin:0,fontFamily:"inherit"}}>{todayOk?"Before 2:00 PM":"Unavailable after 2PM"}</p>
                        </button>
                        {/* Tomorrow */}
                        <button onClick={()=>{setDelivType("tomorrow");setShowCal(false);setErrors(e=>({...e,date:false}))}}
                          style={{padding:"7px 12px",borderRadius:6,border:`1px solid ${delivType==="tomorrow"?G:"#e5e7eb"}`,background:delivType==="tomorrow"?"#f0fdf4":"white",cursor:"pointer",textAlign:"left",transition:"all 0.12s"}}
                          onMouseEnter={e=>{if(delivType!=="tomorrow")e.currentTarget.style.borderColor="#d1d5db"}}
                          onMouseLeave={e=>{if(delivType!=="tomorrow")e.currentTarget.style.borderColor="#e5e7eb"}}>
                          <p style={{fontSize:12,fontWeight:600,color:delivType==="tomorrow"?DG:"#374151",margin:0,fontFamily:"inherit"}}>Tomorrow</p>
                          <p style={{fontSize:10,color:delivType==="tomorrow"?G:"#9ca3af",margin:0,fontFamily:"inherit"}}>{fmtDate(tomorrowStr())}</p>
                        </button>
                        {/* Pick date */}
                        <button onClick={()=>{setDelivType("custom");setShowCal(s=>!s);setErrors(e=>({...e,date:false}))}}
                          style={{padding:"7px 12px",borderRadius:6,border:`1px solid ${delivType==="custom"?G:"#e5e7eb"}`,background:delivType==="custom"?"#f0fdf4":"white",cursor:"pointer",textAlign:"left",transition:"all 0.12s",display:"flex",alignItems:"center",gap:7}}
                          onMouseEnter={e=>{if(delivType!=="custom")e.currentTarget.style.borderColor="#d1d5db"}}
                          onMouseLeave={e=>{if(delivType!=="custom")e.currentTarget.style.borderColor="#e5e7eb"}}>
                          <svg width="13" height="13" fill="none" stroke={delivType==="custom"?DG:"#6b7280"} strokeWidth={1.8} viewBox="0 0 24 24" style={{flexShrink:0}}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                          <div>
                            <p style={{fontSize:12,fontWeight:600,color:delivType==="custom"?DG:"#374151",margin:0,fontFamily:"inherit"}}>{customDate?fmtDate(customDate):"Pick a date"}</p>
                            <p style={{fontSize:10,color:delivType==="custom"?G:"#9ca3af",margin:0,fontFamily:"inherit"}}>{customDate?"Tap to change":"Open calendar"}</p>
                          </div>
                        </button>
                      </div>
                      {showCal&&delivType==="custom"&&(
                        <MiniCalendar selected={customDate} onSelect={(d)=>{setCustDate(d);setShowCal(false);setErrors(e=>({...e,date:false}))}}/>
                      )}
                    </div>

                    <p style={{fontSize:12,color:"#6b7280",lineHeight:1.7,margin:"0 0 16px",fontFamily:"inherit"}}>
                      Hand-arranged by our skilled florists using the freshest blooms. Each arrangement is made to order.
                    </p>
                  </div>
                )}

                {/* ── Care ── */}
                {tab==="care"&&(
                  <div style={{paddingBottom:16}}>
                    <p style={{fontSize:13,color:"#6b7280",lineHeight:1.7,marginBottom:14,fontFamily:"inherit"}}>Proper care significantly extends the life of your arrangement.</p>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {[
                        {icon:<svg width="16" height="16" fill="none" stroke="#3b82f6" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6"/><ellipse cx="19" cy="5" rx="3" ry="3.5" fill="#bfdbfe" stroke="#3b82f6" strokeWidth={1.5}/></svg>,title:"Water daily",desc:"Replace water every 1–2 days with clean, room-temperature water.",bg:"#eff6ff",border:"#bfdbfe"},
                        {icon:<svg width="16" height="16" fill="none" stroke="#6366f1" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" fill="#e0e7ff"/></svg>,title:"Avoid direct sunlight",desc:"Keep away from heat sources and direct sun to slow wilting.",bg:"#eef2ff",border:"#c7d2fe"},
                        {icon:<svg width="16" height="16" fill="none" stroke="#10b981" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 3l4 4-4 4M20 12H4"/></svg>,title:"Trim stems",desc:"Cut 1–2cm at a 45° angle every few days for better absorption.",bg:"#f0fdf4",border:"#bbf7d0"},
                      ].map((t,i)=>(
                        <div key={i} style={{display:"flex",gap:10,padding:"11px 13px",borderRadius:8,background:t.bg,border:`1px solid ${t.border}`,alignItems:"flex-start"}}>
                          <div style={{flexShrink:0,marginTop:2}}>{t.icon}</div>
                          <div>
                            <p style={{fontSize:12,fontWeight:600,color:"#111827",margin:"0 0 2px",fontFamily:"inherit"}}>{t.title}</p>
                            <p style={{fontSize:11,color:"#6b7280",margin:0,lineHeight:1.55,fontFamily:"inherit"}}>{t.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Reviews ── */}
                {tab==="reviews"&&(
                  <div style={{paddingBottom:16}}>
                    <div style={{display:"flex",alignItems:"center",gap:16,padding:"14px 16px",background:"#fafafa",borderRadius:8,border:"1px solid #e5e7eb",marginBottom:16}}>
                      <div style={{textAlign:"center",flexShrink:0}}>
                        <p style={{fontSize:32,fontWeight:700,color:"#111827",lineHeight:1,margin:0,fontFamily:"inherit"}}>{product.rating}</p>
                        <div style={{display:"flex",gap:2,justifyContent:"center",margin:"4px 0 2px"}}>
                          {[1,2,3,4,5].map(i=><svg key={i} width="10" height="10" fill={i<=Math.floor(product.rating)?"#f59e0b":"#e5e7eb"} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}
                        </div>
                        <p style={{fontSize:10,color:"#9ca3af",margin:0,fontFamily:"inherit"}}>out of 5</p>
                      </div>
                      <div style={{flex:1}}>
                        {[5,4,3,2,1].map(s=>(
                          <div key={s} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                            <span style={{fontSize:10,color:"#6b7280",width:8,textAlign:"right",fontFamily:"inherit"}}>{s}</span>
                            <svg width="8" height="8" fill="#f59e0b" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                            <div style={{flex:1,height:4,background:"#f0f0f0",borderRadius:2}}><div style={{width:"0%",height:"100%",background:"#f59e0b",borderRadius:2}}/></div>
                            <span style={{fontSize:10,color:"#9ca3af",width:12,textAlign:"right",fontFamily:"inherit"}}>0</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"28px 20px",border:"1.5px dashed #e5e7eb",borderRadius:8,textAlign:"center"}}>
                      <div style={{width:40,height:40,borderRadius:"50%",background:"#f9fafb",border:"1px solid #e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10}}>
                        <svg width="18" height="18" fill="none" stroke="#d1d5db" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                      </div>
                      <p style={{fontSize:13,fontWeight:600,color:"#374151",margin:"0 0 4px",fontFamily:"inherit"}}>No reviews yet</p>
                      <p style={{fontSize:12,color:"#9ca3af",margin:0,lineHeight:1.5,maxWidth:240,fontFamily:"inherit"}}>Be the first to review this product after your purchase.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Validation error */}
              {Object.values(errors).some(Boolean)&&(
                <div style={{margin:"6px 24px 0",padding:"8px 12px",borderRadius:6,background:"#fef2f2",border:"1px solid #fecaca",display:"flex",alignItems:"center",gap:7}}>
                  <svg width="12" height="12" fill="none" stroke={ERR} strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  <p style={{fontSize:11,color:ERR,fontWeight:500,margin:0,fontFamily:"inherit"}}>
                    Please select: {[errors.color&&"color",errors.qty&&"size",errors.date&&"delivery date"].filter(Boolean).join(", ")}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div style={{flexShrink:0,padding:"12px 24px 16px",borderTop:"1px solid #f3f4f6",background:"white"}}>
                {addOnTotal>0&&(
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,paddingBottom:10,borderBottom:"1px dashed #f3f4f6"}}>
                    <span style={{fontSize:11,color:"#9ca3af",fontFamily:"inherit"}}>Base ₱{product.price.toLocaleString()} + extras ₱{addOnTotal}</span>
                    <span style={{fontSize:12,fontWeight:700,color:DG,fontFamily:"inherit"}}>Total ₱{total.toLocaleString()}</span>
                  </div>
                )}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>startFlow("cart")}
                    style={{flex:1,padding:"11px 0",borderRadius:8,border:`1.5px solid ${G}`,background:"white",color:G,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all 0.15s",fontFamily:"inherit"}}
                    onMouseEnter={e=>{e.currentTarget.style.background=G;e.currentTarget.style.color="white"}}
                    onMouseLeave={e=>{e.currentTarget.style.background="white";e.currentTarget.style.color=G}}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    Add to Cart
                  </button>
                  <button onClick={()=>startFlow("checkout")}
                    style={{flex:1,padding:"11px 0",borderRadius:8,border:"none",background:`linear-gradient(135deg,${DG},${G})`,color:"white",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"opacity 0.15s",fontFamily:"inherit"}}
                    onMouseEnter={e=>e.currentTarget.style.opacity="0.88"}
                    onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </>}
        </div>
      </div>
    </>
  )
}
