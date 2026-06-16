import { useState, useEffect, useRef } from "react"
import { addToCart } from "../utils/cart.js"
import { useTheme } from "../context/ThemeContext"
import { useBranch } from "../context/branchContext"

const G  = "#2E8B34"
const DG = "#0C573E"

const MAX_QTY  = 10
const WARN_QTY = 5

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const WDAYS  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

const pctOff      = (o,p) => Math.round((1-p/o)*100)
const pad         = d     => String(d).padStart(2,"0")
const toStr       = d     => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
const todayD      = ()    => { const d=new Date(); d.setHours(0,0,0,0); return d }
const tomorrowStr = ()    => { const d=new Date(); d.setDate(d.getDate()+1); return toStr(d) }
const fmtDate     = s     => { if(!s)return""; const[y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("en-PH",{weekday:"short",month:"short",day:"numeric"}) }
const todayAvail  = ()    => new Date().getHours()<14

/* ── Sample product details per category ── */
const SAMPLE_DETAILS = {
  Vases: {
    description: "A beautifully crafted vase that elevates any space. Made from premium ceramic with a smooth glazed finish that catches the light beautifully.",
    bestFor: ["Home decor","Gift giving","Floral arrangements","Office spaces","Wedding centerpieces"],
    dimensions: {Height:"20 cm",Width:"12 cm",Depth:"10 cm"},
    material:"Premium ceramic",weight:"~350 g",
  },
  Pots: {
    description: "A sturdy, stylish pot perfect for indoor and outdoor plants. Designed to complement any interior while keeping your plants happy.",
    bestFor: ["Indoor plants","Succulents","Herb gardens","Desk decor","Patio styling"],
    dimensions: {Height:"15 cm",Diameter:"18 cm",Depth:"14 cm"},
    material:"Terracotta / ceramic",weight:"~500 g",
  },
  Default: {
    description: "A premium decorative piece handpicked for quality and style. Makes a wonderful gift or a lovely addition to your home.",
    bestFor: ["Home decor","Special occasions","Gift giving","Office styling"],
    dimensions: {Height:"18 cm",Width:"14 cm",Depth:"10 cm"},
    material:"Premium materials",weight:"~300 g",
  },
}

/* ── Confetti ── */
const CONFETTI_COLORS=["#2E8B34","#f472b6","#fbbf24","#60a5fa","#a78bfa","#f87171","#34d399","#fb923c"]
const CONFETTI_PIECES=Array.from({length:72},(_,i)=>{
  const angle=(i/72)*360+(Math.random()-0.5)*18,dist=100+Math.random()*140,rad=angle*Math.PI/180
  return{id:i,color:CONFETTI_COLORS[i%8],dx:Math.cos(rad)*dist,dy:Math.sin(rad)*dist,delay:Math.random()*0.16,dur:1+Math.random()*0.6,size:6+Math.random()*10,rot:(Math.random()-0.5)*720,type:i%3===0?"circle":i%3===1?"rect":"tri"}
})
function injectBurstCSS(){
  if(document.getElementById("bloomora-confetti-css"))return
  const s=document.createElement("style");s.id="bloomora-confetti-css"
  s.textContent=`@keyframes cf-burst{0%{transform:translate(0,0) rotate(0deg) scale(0.3);opacity:0}10%{transform:translate(0,0) rotate(0deg) scale(1.1);opacity:1}60%{transform:translate(var(--dx),var(--dy)) rotate(calc(var(--r)*0.65)) scale(1);opacity:1}100%{transform:translate(calc(var(--dx)*1.25),calc(var(--dy)*1.35)) rotate(var(--r)) scale(0.2);opacity:0}}`
  document.head.appendChild(s)
}
function Confetti(){
  useEffect(()=>{injectBurstCSS()},[])
  return(
    <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
      {CONFETTI_PIECES.map(p=>(
        <div key={p.id} style={{position:"absolute",width:p.type==="rect"?`${p.size*1.8}px`:`${p.size}px`,height:`${p.size}px`,background:p.type==="tri"?"transparent":p.color,borderRadius:p.type==="circle"?"50%":p.type==="rect"?"2px":"0",borderLeft:p.type==="tri"?`${p.size/2}px solid transparent`:"none",borderRight:p.type==="tri"?`${p.size/2}px solid transparent`:"none",borderBottom:p.type==="tri"?`${p.size}px solid ${p.color}`:"none","--dx":`${p.dx}px`,"--dy":`${p.dy}px`,"--r":`${p.rot}deg`,animation:`cf-burst ${p.dur}s cubic-bezier(0.22,0.61,0.36,1) ${p.delay}s 1 forwards`}}/>
      ))}
    </div>
  )
}

function MiniCalendar({selected,onSelect}){
  const now=todayD()
  const[vd,setVd]=useState({y:now.getFullYear(),m:now.getMonth()})
  const first=new Date(vd.y,vd.m,1).getDay()
  const dim=new Date(vd.y,vd.m+1,0).getDate()
  const cells=[...Array(first).fill(null),...Array.from({length:dim},(_,i)=>i+1)]
  const cd=d=>new Date(vd.y,vd.m,d)
  const past=d=>cd(d)<now
  const tod=d=>cd(d).toDateString()===now.toDateString()
  const sel=d=>{if(!selected)return false;const[y,m,dd]=selected.split("-").map(Number);return cd(d).toDateString()===new Date(y,m-1,dd).toDateString()}
  return(
    <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <button onClick={()=>setVd(v=>v.m===0?{y:v.y-1,m:11}:{...v,m:v.m-1})} className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg bg-white hover:bg-gray-50 cursor-pointer">
          <svg width="10" height="10" fill="none" stroke="#6b7280" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
        </button>
        <span className="text-sm font-semibold text-gray-800">{MONTHS[vd.m]} {vd.y}</span>
        <button onClick={()=>setVd(v=>v.m===11?{y:v.y+1,m:0}:{...v,m:v.m+1})} className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg bg-white hover:bg-gray-50 cursor-pointer">
          <svg width="10" height="10" fill="none" stroke="#6b7280" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-7 mb-1.5">
          {WDAYS.map((d,i)=><div key={i} className="text-center text-[10px] font-medium text-gray-400">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((d,i)=>{
            if(!d)return<div key={i}/>
            const p=past(d),t=tod(d),s=sel(d)
            return(
              <button key={i} onClick={()=>!p&&onSelect(toStr(cd(d)))} disabled={p}
                className="h-8 rounded-lg text-xs transition-all"
                style={{cursor:p?"default":"pointer",color:s?"white":p?"#d1d5db":t?G:"#374151",background:s?G:t?"#f0fdf4":"transparent",fontWeight:s||t?600:400,outline:t&&!s?`2px solid ${G}`:"none",outlineOffset:-1}}>
                {d}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AddedConfirmation({onClose,onNavigate,dest,delivLabel,isDark}){
  useEffect(()=>{
    const t=setTimeout(()=>{onClose();onNavigate?.(dest==="checkout"?"checkout":"cart")},2600)
    return()=>clearTimeout(t)
  },[])
  return(
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden" style={{background:isDark?"#0f172a":"white"}}>
      <Confetti/>
      <div className="relative z-10 flex flex-col items-center px-10 py-12 text-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-7"
          style={{background:`linear-gradient(135deg,${DG},${G})`,boxShadow:isDark?"0 16px 40px rgba(0,255,136,0.25)":"0 16px 40px rgba(46,139,52,0.3)"}}>
          <svg width="46" height="46" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
        </div>
        <p className="text-3xl font-extrabold mb-3 tracking-tight" style={{color:isDark?"#f1f5f9":"#111827"}}>Added to cart!</p>
        <p className="text-base leading-relaxed max-w-xs mb-5" style={{color:isDark?"#94a3b8":"#6b7280"}}>Your item has been added successfully.</p>
        {delivLabel&&(
          <div className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full border-2 mb-5"
            style={{color:isDark?"#4ade80":DG,background:isDark?"rgba(74,222,128,0.1)":"#f0fdf4",borderColor:isDark?"rgba(74,222,128,0.3)":"#bbf7d0"}}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            Delivery: {delivLabel}
          </div>
        )}
        <p className="text-sm" style={{color:isDark?"#64748b":"#9ca3af"}}>Redirecting you now...</p>
      </div>
    </div>
  )
}

function ImgZoom({product,isDark}){
  const[pos,setPos]=useState(null)
  const[active,setActive]=useState(false)
  const ref=useRef(null)
  const move=e=>{
    const r=ref.current.getBoundingClientRect()
    setPos({x:((e.clientX-r.left)/r.width)*100,y:((e.clientY-r.top)/r.height)*100})
  }
  return(
    <div ref={ref} className="pms-img flex-shrink-0 relative overflow-hidden"
      style={{width:"42%",cursor:active?"crosshair":"default",background:isDark?"#0f172a":"#f3f4f6"}}
      onMouseMove={move} onMouseEnter={()=>setActive(true)} onMouseLeave={()=>{setActive(false);setPos(null)}}>
      <img src={product.image} alt={product.name} className="w-full h-full object-cover block"
        style={{transition:active?"transform 0.25s ease-out":"transform 0.4s ease",transform:active&&pos?"scale(1.7)":"scale(1)",transformOrigin:pos?`${pos.x}% ${pos.y}%`:"center",willChange:"transform"}}/>
      <div className="absolute top-4 left-4 text-white text-xs font-bold px-3 py-1 rounded-md z-10 pointer-events-none"
        style={{background:DG}}>-{pctOff(product.original,product.price)}% OFF</div>
      {product.ribbon&&(
        <div className="absolute top-11 left-0 z-10 pointer-events-none">
          <div className="text-[11px] font-bold text-white px-4 py-1"
            style={{background:product._ribbonColor||G,clipPath:"polygon(0 0,calc(100% - 6px) 0,100% 50%,calc(100% - 6px) 100%,0 100%)"}}>
            {product.ribbon}
          </div>
        </div>
      )}
      <div className="absolute bottom-4 left-3 right-3 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 pointer-events-none z-10"
        style={{background:isDark?"rgba(15,23,42,0.92)":"rgba(255,255,255,0.95)",boxShadow:isDark?"0 0 12px rgba(0,255,136,0.08)":"0 2px 8px rgba(0,0,0,0.07)",border:isDark?"1px solid rgba(74,222,128,0.15)":"none"}}>
        <svg width="14" height="14" fill="none" stroke={isDark?"#4ade80":G} strokeWidth={1.8} viewBox="0 0 24 24" className="flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>
        <div>
          <p className="text-xs font-semibold m-0" style={{color:isDark?"#e2e8f0":"#111827"}}>Same-day delivery</p>
          <p className="text-[10px] m-0" style={{color:isDark?"#4ade80":"#6b7280"}}>Before 2PM · Manila & Pampanga</p>
        </div>
      </div>
      {active&&<div className="absolute top-3 right-3 bg-black/45 text-white text-[10px] font-bold px-2.5 py-1 rounded-full pointer-events-none z-10 backdrop-blur-sm">ZOOM</div>}
    </div>
  )
}

function QtyCounter({qty,setQty,error}){
  const atMax=qty>=MAX_QTY
  const warn=qty>=WARN_QTY&&!atMax
  return(
    <div>
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-xl overflow-hidden border border-gray-200">
          <button onClick={()=>setQty(q=>Math.max(1,q-1))}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer border-r border-gray-200 disabled:opacity-40"
            disabled={qty<=1}>
            <svg width="14" height="14" fill="none" stroke="#374151" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4"/></svg>
          </button>
          <span className="w-14 text-center text-base font-bold text-gray-900">{qty}</span>
          <button onClick={()=>setQty(q=>Math.min(MAX_QTY,q+1))}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer border-l border-gray-200 disabled:opacity-40"
            disabled={atMax}>
            <svg width="14" height="14" fill="none" stroke="#374151" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
          </button>
        </div>
        <span className="text-xs text-gray-400">Max {MAX_QTY} per order</span>
      </div>
      {warn&&<p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1"><span>⚠</span>Ordering a lot? Contact us for bulk pricing.</p>}
      {atMax&&<p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠</span>Maximum of {MAX_QTY} items per order reached.</p>}
      {error&&<p className="text-xs text-red-500 mt-1.5">Please select a quantity.</p>}
    </div>
  )
}

export default function ProductPreviewModalSimple({product,onClose,onNavigate}){
  const[qty,setQty]=useState(1)
  const[delivType,setDelivType]=useState(null)
  const[customDate,setCustDate]=useState("")
  const[showCal,setShowCal]=useState(false)
  const[done,setDone]=useState(false)
  const[dest,setDest]=useState("cart")
  const[visible,setVisible]=useState(false)
  const[tab,setTab]=useState("details")
  const[errors,setErrors]=useState({})

  const okToday=todayAvail()
  const{isDark}=useTheme()
  const modalBg = isDark?"#1e293b":"white"
  const rightBg = isDark?"#0f172a":"#f3f4f6"
  const cardBg  = isDark?"#1e293b":"white"
  const cardBdr = isDark?"rgba(0,255,136,0.08)":"rgba(0,0,0,0.08)"
  const total=product.price*qty
  const delivLabel=delivType==="today"?"Today (before 2PM)":delivType==="tomorrow"?`Tomorrow, ${fmtDate(tomorrowStr())}`:delivType==="custom"&&customDate?fmtDate(customDate):null

  const suggestedProducts = products
    .filter(p => {
      if (p.id === product.id) return false;
      if (p.category?.toLowerCase() !== product.category?.toLowerCase()) return false;
      if (p.status === "inactive" || !p.is_available || p.stock <= 0) return false;
      if (!Array.isArray(p.branches) || !p.branches.includes(branch)) return false;
      return true;
    })
    .slice(0, 4)

  useEffect(()=>{
    requestAnimationFrame(()=>requestAnimationFrame(()=>setVisible(true)))
    document.body.style.overflow="hidden"
    const esc=e=>{if(e.key==="Escape")close()}
    document.addEventListener("keydown",esc)
    return()=>{document.removeEventListener("keydown",esc);document.body.style.overflow=""}
  },[])

  const close=()=>{setVisible(false);setTimeout(onClose,260)}

  const validate=()=>{
    const e={}
    if(!delivType||(delivType==="custom"&&!customDate))e.date=true
    setErrors(e);return Object.keys(e).length===0
  }

  const handleAdd=d=>{
    if(!validate())return
    addToCart({id:product.id,name:product.name,price:product.price,qty,img:product.image,desc:product.category})
    window.dispatchEvent(new Event("bloomora:cart-updated"))
    setDest(d);setDone(true)
  }

  return(
    <>
      <style>{`
        .pms-scroll::-webkit-scrollbar{width:4px}
        .pms-scroll::-webkit-scrollbar-thumb{background:${isDark?"#334155":"#e5e7eb"};border-radius:4px}
        @media(max-width:900px){
          .pms-wrap{flex-direction:column!important;border-radius:14px!important}
          .pms-img{width:100%!important;height:auto!important;aspect-ratio:1/1!important;min-height:unset!important;max-height:none!important;flex-shrink:0!important}
          .pms-right{margin:8px!important}
          .pms-right-scroll{padding:14px 16px 0!important}
          .pms-footer{padding:10px 16px 14px!important}
        }
        @media(max-width:600px){
          .pms-overlay{padding:118px 14px 14px!important}
          .pms-wrap{width:100%!important;border-radius:12px!important;height:calc(100vh - 146px)!important}
        }
        @media(max-height:520px) and (orientation:landscape){
          .pms-overlay{padding:82px 12px 12px!important}
          .pms-img{width:40%!important;height:100%!important;aspect-ratio:unset!important;flex-shrink:0!important}
        }
      `}</style>

      <div className="pms-overlay fixed inset-0 z-[49] flex items-center justify-center box-border"
        style={{padding:"148px 28px 28px",backgroundColor:visible?"rgba(0,0,0,0.58)":"transparent",backdropFilter:visible?"blur(8px)":"none",WebkitBackdropFilter:visible?"blur(8px)":"none",transition:"background-color 0.22s,backdrop-filter 0.22s"}}
        onClick={close}>

        <div className="pms-wrap relative flex flex-row overflow-hidden w-[85vw] h-full"
          style={{borderRadius:18,background:modalBg,boxShadow:"0 28px 80px rgba(0,0,0,0.28)",opacity:visible?1:0,transform:visible?"scale(1)":"scale(0.97)",transition:"opacity 0.22s,transform 0.26s cubic-bezier(0.34,1.1,0.64,1)"}}
          onClick={e=>e.stopPropagation()}>

          <button onClick={close} className="absolute top-3.5 right-3.5 z-50 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors cursor-pointer"
            style={{border:`1px solid ${isDark?"#334155":"#e5e7eb"}`,background:isDark?"#334155":"white"}}
            onMouseEnter={e=>e.currentTarget.style.background=isDark?"#475569":"#f3f4f6"}
            onMouseLeave={e=>e.currentTarget.style.background=isDark?"#334155":"white"}>
            <svg width="11" height="11" fill="none" stroke={isDark?"#e2e8f0":"#374151"} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>

          {done&&<AddedConfirmation onClose={close} onNavigate={onNavigate} dest={dest} delivLabel={delivLabel} isDark={isDark}/>}

          {!done&&<>
            <ImgZoom product={product} isDark={isDark}/>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{background:rightBg}}>
              <div className="pms-right flex-1 flex flex-col m-4 rounded-2xl overflow-hidden" style={{background:cardBg,boxShadow:`0 2px 16px ${cardBdr}`}}>

                <div className="pms-scroll pms-right-scroll flex-1 overflow-y-auto px-6 pt-6 pb-0">

                  <p className="text-xs mb-1.5" style={{color:isDark?"#64748b":"#9ca3af"}}>
                    {product.category}<span style={{color:isDark?"#334155":"#d1d5db",margin:"0 4px"}}>/</span>
                    <span className="font-medium" style={{color:G}}>{product.name}</span>
                  </p>

                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h2 className="text-2xl font-bold leading-tight flex-1" style={{color:isDark?"#f1f5f9":"#111827"}}>{product.name}</h2>
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent("bloomora:open-chat", { 
                        detail: { product: { id: product.id, name: product.name, price: product.price, image: product.image } } 
                      }))}
                      className="flex items-center gap-1.5 flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold text-white transition-all cursor-pointer border-none"
                      style={{background:"linear-gradient(135deg,#25d366,#128c48)",boxShadow:"0 3px 10px rgba(37,211,102,0.35)"}}
                      onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 5px 18px rgba(37,211,102,0.5)";e.currentTarget.style.transform="translateY(-1px)"}}
                      onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 3px 10px rgba(37,211,102,0.35)";e.currentTarget.style.transform="none"}}>
                      <svg width="13" height="13" fill="currentColor" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
                      Ask us
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 mb-3">
                    {[1,2,3,4,5].map(i=>(
                      <svg key={i} width="13" height="13" fill={i<=Math.floor(product.rating)?"#f59e0b":isDark?"#334155":"#e5e7eb"} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                    <span className="text-sm font-medium" style={{color:isDark?"#cbd5e1":"#374151"}}>{product.rating}</span>
                    <span className="text-sm" style={{color:isDark?"#64748b":"#9ca3af"}}>({product.reviews} reviews)</span>
                    <span style={{color:isDark?"#334155":"#e5e7eb",margin:"0 2px"}}>·</span>
                    <span className="text-sm" style={{color:isDark?"#64748b":"#9ca3af"}}>{(product.reviews*2).toLocaleString()} sold</span>
                  </div>

                  <div className="flex items-center gap-2 mb-5 pb-5" style={{borderBottom:`1px solid ${isDark?"#1e293b":"#f3f4f6"}`}}>
                    <span className="text-3xl font-bold tracking-tight" style={{color:isDark?"#00ff88":"#111827",textShadow:isDark?"0 0 20px rgba(0,255,136,0.4)":"none"}}>₱{total.toLocaleString()}</span>
                    {qty>1&&<span className="text-xs" style={{color:isDark?"#64748b":"#9ca3af"}}>(₱{product.price.toLocaleString()} each)</span>}
                    <span className="text-sm line-through ml-1" style={{color:isDark?"#64748b":"#9ca3af"}}>₱{product.original.toLocaleString()}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{color:isDark?"#00ff88":G,background:isDark?"rgba(0,255,136,0.1)":"#f0fdf4",border:`1px solid ${isDark?"rgba(0,255,136,0.25)":"#bbf7d0"}`,textShadow:isDark?"0 0 8px rgba(0,255,136,0.5)":"none"}}>
                      -{pctOff(product.original,product.price)}%
                    </span>
                  </div>

                  <div className="flex mb-5" style={{borderBottom:`1px solid ${isDark?"#1e293b":"#f3f4f6"}`}}>
                    {[["details","Details"],["care","Care Guide"],["reviews","Reviews"]].map(([k,l])=>(
                      <button key={k} onClick={()=>setTab(k)} className="px-4 py-2 text-sm transition-colors"
                        style={{color:tab===k?G:isDark?"#94a3b8":"#6b7280",fontWeight:tab===k?600:400,background:"none",border:"none",borderBottom:`2.5px solid ${tab===k?G:"transparent"}`,cursor:"pointer",marginBottom:-1}}>
                        {l}
                      </button>
                    ))}
                  </div>

                  {tab==="details"&&<div className="pb-4 space-y-5">

                    {/* Product info card */}
                    {(()=>{
                      const details = product.description ? {
                        description: product.description,
                        bestFor: product.bestFor,
                        dimensions: product.dimensions,
                        material: product.material,
                        weight: product.weight,
                      } : (SAMPLE_DETAILS[product.category] || SAMPLE_DETAILS.Default)
                      return(
                        <div className="rounded-xl overflow-hidden" style={{border:`1px solid ${isDark?"#1e293b":"#e5e7eb"}`}}>
                          {/* Description */}
                          <div className="p-4" style={{background:isDark?"#0f172a":"#f8fafc"}}>
                            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:isDark?"#4ade80":G}}>About this product</p>
                            <p className="text-sm leading-relaxed" style={{color:isDark?"#94a3b8":"#6b7280"}}>{details.description}</p>
                          </div>

                          {/* Best For */}
                          {details.bestFor&&(
                            <div className="px-4 py-3" style={{borderTop:`1px solid ${isDark?"#1e293b":"#e5e7eb"}`,background:isDark?"#0a1929":"white"}}>
                              <p className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{color:isDark?"#4ade80":G}}>Best For</p>
                              <div className="flex flex-wrap gap-1.5">
                                {details.bestFor.map(b=>(
                                  <span key={b} className="text-xs px-2.5 py-1 rounded-full font-medium"
                                    style={{background:isDark?"rgba(74,222,128,0.1)":"#f0fdf4",color:isDark?"#4ade80":G,border:`1px solid ${isDark?"rgba(74,222,128,0.2)":"#bbf7d0"}`}}>
                                    {b}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Dimensions + Material */}
                          {details.dimensions&&(
                            <div className="px-4 py-3" style={{borderTop:`1px solid ${isDark?"#1e293b":"#e5e7eb"}`,background:isDark?"#0f172a":"#f8fafc"}}>
                              <p className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{color:isDark?"#4ade80":G}}>Specifications</p>
                              <div className="grid grid-cols-3 gap-2 mb-2">
                                {Object.entries(details.dimensions).map(([k,v])=>(
                                  <div key={k} className="text-center p-2 rounded-lg" style={{background:isDark?"#1e293b":"white",border:`1px solid ${isDark?"#334155":"#e5e7eb"}`}}>
                                    <p className="text-[10px] font-medium uppercase tracking-wide mb-0.5" style={{color:isDark?"#64748b":"#9ca3af"}}>{k}</p>
                                    <p className="text-sm font-bold" style={{color:isDark?"#f1f5f9":"#111827"}}>{v}</p>
                                  </div>
                                ))}
                              </div>
                              {details.material&&(
                                <div className="flex justify-between text-xs pt-2" style={{borderTop:`1px solid ${isDark?"#1e293b":"#f3f4f6"}`}}>
                                  <span style={{color:isDark?"#64748b":"#9ca3af"}}>Material</span>
                                  <span className="font-semibold" style={{color:isDark?"#cbd5e1":"#374151"}}>{details.material}</span>
                                </div>
                              )}
                              {details.weight&&(
                                <div className="flex justify-between text-xs pt-1.5">
                                  <span style={{color:isDark?"#64748b":"#9ca3af"}}>Weight</span>
                                  <span className="font-semibold" style={{color:isDark?"#cbd5e1":"#374151"}}>{details.weight}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* 🚀 ADDED SUGGESTIONS SECTION FOR SIMPLE MODAL */}
                    {suggestedProducts.length > 0 && (
                      <div className="mt-5 mb-5 pt-5" style={{ borderTop: `1px solid ${isDark ? "#1e293b" : "#f3f4f6"}` }}>
                        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: isDark ? "#4ade80" : DG }}>
                          You Might Also Like
                        </p>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mr-4 pr-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          {suggestedProducts.map(s => (
                            <button 
                              key={s.id} 
                              onClick={() => {
                                onClose(); 
                                onNavigate(`/product/${s.id}`); 
                              }}
                              className="flex-shrink-0 w-28 rounded-lg overflow-hidden border cursor-pointer text-left p-0 transition-transform hover:scale-105"
                              style={{ borderColor: isDark ? "#334155" : "#e5e7eb", background: "transparent" }}>
                              <img src={s.image_url || s.image || "/placeholder.webp"} className="w-full h-24 object-cover" alt={s.name} />
                              <div className="p-2">
                                <p className="text-[10px] font-bold truncate" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>{s.name}</p>
                                <p className="text-[10px] font-bold mt-0.5" style={{ color: isDark ? "#4ade80" : G }}>₱{(+s.price).toLocaleString()}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quantity */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{color:isDark?"#94a3b8":"#6b7280"}}>Quantity</p>
                      <QtyCounter qty={qty} setQty={setQty} error={errors.qty}/>
                    </div>

                    {/* Delivery */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-1"
                        style={{color:errors.date?"#ef4444":isDark?"#94a3b8":"#6b7280"}}>
                        Delivery Date <span className="text-red-400">*</span>
                        {errors.date&&<span className="normal-case tracking-normal font-normal ml-1">required</span>}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          {key:"today",label:"Today",sub:okToday?"Before 2:00 PM":"Unavailable after 2PM",disabled:!okToday,onClick:()=>{if(okToday){setDelivType("today");setShowCal(false);setErrors(e=>({...e,date:false}))}}},
                          {key:"tomorrow",label:"Tomorrow",sub:fmtDate(tomorrowStr()),disabled:false,onClick:()=>{setDelivType("tomorrow");setShowCal(false);setErrors(e=>({...e,date:false}))}},
                        ].map(btn=>(
                          <button key={btn.key} disabled={btn.disabled} onClick={btn.onClick}
                            className="px-3 py-2 rounded-xl text-left transition-all"
                            style={{cursor:btn.disabled?"not-allowed":"pointer",opacity:btn.disabled?0.45:1,
                              border:`1.5px solid ${delivType===btn.key?(isDark?"#4ade80":G):isDark?"#334155":"#e5e7eb"}`,
                              background:delivType===btn.key?(isDark?"rgba(74,222,128,0.1)":"#f0fdf4"):isDark?"#0f172a":"white",
                              boxShadow:delivType===btn.key&&isDark?"0 0 8px rgba(74,222,128,0.2)":"none"}}>
                            <p className="text-sm font-semibold m-0" style={{color:delivType===btn.key?(isDark?"#4ade80":DG):isDark?"#e2e8f0":"#374151"}}>{btn.label}</p>
                            <p className="text-[10px] m-0" style={{color:delivType===btn.key?(isDark?"#4ade80":G):isDark?"#64748b":"#9ca3af"}}>{btn.sub}</p>
                          </button>
                        ))}
                        <button onClick={()=>{setDelivType("custom");setShowCal(s=>!s);setErrors(e=>({...e,date:false}))}}
                          className="px-3 py-2 rounded-xl text-left transition-all cursor-pointer flex items-center gap-2"
                          style={{border:`1.5px solid ${delivType==="custom"?(isDark?"#4ade80":G):isDark?"#334155":"#e5e7eb"}`,
                            background:delivType==="custom"?(isDark?"rgba(74,222,128,0.1)":"#f0fdf4"):isDark?"#0f172a":"white",
                            boxShadow:delivType==="custom"&&isDark?"0 0 8px rgba(74,222,128,0.2)":"none"}}>
                          <svg width="13" height="13" fill="none" stroke={delivType==="custom"?(isDark?"#4ade80":DG):isDark?"#64748b":"#6b7280"} strokeWidth={1.8} viewBox="0 0 24 24" className="flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          <div>
                            <p className="text-sm font-semibold m-0" style={{color:delivType==="custom"?(isDark?"#4ade80":DG):isDark?"#e2e8f0":"#374151"}}>{customDate?fmtDate(customDate):"Pick a date"}</p>
                            <p className="text-[10px] m-0" style={{color:delivType==="custom"?(isDark?"#4ade80":G):isDark?"#64748b":"#9ca3af"}}>{customDate?"Tap to change":"Open calendar"}</p>
                          </div>
                        </button>
                      </div>
                      {showCal&&delivType==="custom"&&<MiniCalendar selected={customDate} onSelect={d=>{setCustDate(d);setShowCal(false);setErrors(e=>({...e,date:false}))}}/>}
                    </div>

                    {!product.description&&!product.dimensions&&(
                      <p className="text-sm leading-relaxed" style={{color:isDark?"#64748b":"#6b7280"}}>Each piece is carefully selected for quality. Perfect for any home or as a thoughtful gift.</p>
                    )}
                  </div>}

                  {tab==="care"&&<div className="pb-4 space-y-2.5">
                    <p className="text-sm leading-relaxed mb-2" style={{color:isDark?"#64748b":"#6b7280"}}>Follow these tips to keep your item in great condition.</p>
                    {[
                      {lightBg:"#eff6ff",lightBdr:"#bfdbfe",darkBg:"rgba(59,130,246,0.08)",darkBdr:"rgba(59,130,246,0.2)",title:"Clean gently",desc:"Wipe with a soft damp cloth. Avoid harsh chemicals.",icon:<svg width="17" height="17" fill="none" stroke={isDark?"#60a5fa":"#3b82f6"} strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6"/><ellipse cx="19" cy="5" rx="3" ry="3.5" fill={isDark?"rgba(59,130,246,0.3)":"#bfdbfe"} stroke={isDark?"#60a5fa":"#3b82f6"} strokeWidth={1.5}/></svg>},
                      {lightBg:"#eef2ff",lightBdr:"#c7d2fe",darkBg:"rgba(99,102,241,0.08)",darkBdr:"rgba(99,102,241,0.2)",title:"Avoid direct sunlight",desc:"Prolonged sun exposure may fade or damage over time.",icon:<svg width="17" height="17" fill="none" stroke={isDark?"#818cf8":"#6366f1"} strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" fill={isDark?"rgba(99,102,241,0.2)":"#e0e7ff"}/></svg>},
                      {lightBg:"#f0fdf4",lightBdr:"#bbf7d0",darkBg:"rgba(74,222,128,0.06)",darkBdr:"rgba(74,222,128,0.2)",title:"Store carefully",desc:"Keep in a cool, dry place when not in use.",icon:<svg width="17" height="17" fill="none" stroke={isDark?"#4ade80":"#10b981"} strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"/></svg>},
                    ].map((t,i)=>(
                      <div key={i} className="flex gap-3 p-3.5 rounded-xl items-start"
                        style={{background:isDark?t.darkBg:t.lightBg,border:`1px solid ${isDark?t.darkBdr:t.lightBdr}`}}>
                        <div className="flex-shrink-0 mt-0.5">{t.icon}</div>
                        <div>
                          <p className="text-sm font-semibold mb-0.5" style={{color:isDark?"#e2e8f0":"#111827"}}>{t.title}</p>
                          <p className="text-xs leading-snug" style={{color:isDark?"#64748b":"#6b7280"}}>{t.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>}

                  {tab==="reviews"&&<div className="pb-4">
                    <div className="flex items-center gap-5 p-4 rounded-xl border mb-4"
                      style={{background:isDark?"#0f172a":"#fafafa",borderColor:isDark?"#1e293b":"#e5e7eb"}}>
                      <div className="text-center flex-shrink-0">
                        <p className="text-4xl font-bold leading-none mb-1" style={{color:isDark?"#00ff88":"#111827",textShadow:isDark?"0 0 12px rgba(0,255,136,0.4)":"none"}}>{product.rating}</p>
                        <div className="flex gap-0.5 justify-center mb-1">
                          {[1,2,3,4,5].map(i=><svg key={i} width="11" height="11" fill={i<=Math.floor(product.rating)?"#f59e0b":isDark?"#1e293b":"#e5e7eb"} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}
                        </div>
                        <p className="text-xs" style={{color:isDark?"#64748b":"#9ca3af"}}>out of 5</p>
                      </div>
                      <div className="flex-1">{[5,4,3,2,1].map(s=><div key={s} className="flex items-center gap-1.5 mb-1"><span className="text-xs w-2 text-right" style={{color:isDark?"#64748b":"#6b7280"}}>{s}</span><svg width="9" height="9" fill="#f59e0b" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg><div className="flex-1 h-1 rounded-full" style={{background:isDark?"#1e293b":"#f0f0f0"}}/><span className="text-xs w-3 text-right" style={{color:isDark?"#64748b":"#9ca3af"}}>0</span></div>)}</div>
                    </div>
                    <div className="flex flex-col items-center p-7 rounded-xl text-center" style={{border:`2px dashed ${isDark?"#1e293b":"#e5e7eb"}`}}>
                      <div className="w-11 h-11 rounded-full flex items-center justify-center mb-3" style={{background:isDark?"#0f172a":"#f9fafb",border:`1px solid ${isDark?"#1e293b":"#e5e7eb"}`}}>
                        <svg width="20" height="20" fill="none" stroke={isDark?"#334155":"#d1d5db"} strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                      </div>
                      <p className="text-sm font-semibold mb-1" style={{color:isDark?"#e2e8f0":"#374151"}}>No reviews yet</p>
                      <p className="text-xs leading-snug max-w-[200px]" style={{color:isDark?"#64748b":"#9ca3af"}}>Be the first to review after your purchase.</p>
                    </div>
                  </div>}
                </div>

                {errors.date&&(
                  <div className="mx-5 mt-2 px-3 py-2 rounded-lg flex items-center gap-2" style={{background:isDark?"rgba(239,68,68,0.1)":"#fef2f2",border:`1px solid ${isDark?"rgba(239,68,68,0.3)":"#fecaca"}`}}>
                    <svg width="13" height="13" fill="none" stroke="#ef4444" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    <p className="text-xs font-medium text-red-500">Please select a delivery date.</p>
                  </div>
                )}

                <div className="pms-footer flex-shrink-0 px-5 py-4 rounded-b-2xl" style={{borderTop:`1px solid ${isDark?"#1e293b":"#f3f4f6"}`,background:cardBg}}>
                  {qty>1&&(
                    <div className="flex justify-between mb-2.5 pb-2.5" style={{borderBottom:`1px dashed ${isDark?"#1e293b":"#f3f4f6"}`}}>
                      <span className="text-xs" style={{color:isDark?"#64748b":"#9ca3af"}}>₱{product.price.toLocaleString()} x {qty} items</span>
                      <span className="text-sm font-bold" style={{color:isDark?"#4ade80":DG}}>₱{total.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex gap-2.5">
                    <button onClick={()=>handleAdd("cart")}
                      className="flex-1 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                      style={{border:`2px solid ${isDark?"#4ade80":G}`,background:isDark?"rgba(74,222,128,0.05)":"white",color:isDark?"#4ade80":G,boxShadow:isDark?"0 0 10px rgba(74,222,128,0.15)":"none"}}
                      onMouseEnter={e=>{e.currentTarget.style.background=isDark?"rgba(74,222,128,0.15)":G;e.currentTarget.style.color=isDark?"#4ade80":"white"}}
                      onMouseLeave={e=>{e.currentTarget.style.background=isDark?"rgba(74,222,128,0.05)":"white";e.currentTarget.style.color=isDark?"#4ade80":G}}>
                      <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                      Add to Cart
                    </button>
                    <button onClick={()=>handleAdd("checkout")}
                      className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all cursor-pointer border-none"
                      style={{background:`linear-gradient(135deg,${DG},${G})`,boxShadow:isDark?"0 0 20px rgba(0,255,136,0.3)":"none"}}
                      onMouseEnter={e=>e.currentTarget.style.boxShadow=isDark?"0 0 30px rgba(0,255,136,0.5)":"0 4px 12px rgba(46,139,52,0.3)"}
                      onMouseLeave={e=>e.currentTarget.style.boxShadow=isDark?"0 0 20px rgba(0,255,136,0.3)":"none"}>
                      <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>}
        </div>
      </div>
    </>
  )
}