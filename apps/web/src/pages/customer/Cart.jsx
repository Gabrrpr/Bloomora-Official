import { useState, useEffect } from "react"
import { useTheme } from "../../context/ThemeContext"
import { getCart, setCart, getCartCount } from "../../utils/cart.js"
import { validateVoucher, computeDiscount } from "../../utils/vouchers.js"
import { useAuth } from "../../context/AuthContext"

const G  = "#2E8B34"
const DG = "#0C573E"

function QtyControl({ qty, onDecrease, onIncrease, isDark }) {
  const bg  = isDark ? "#1e293b" : "white"
  const bdr = isDark ? "#334155" : "#e5e7eb"
  const tc  = isDark ? "#f1f5f9" : "#374151"
  const hov = isDark ? "#334155" : "#f3f4f6"
  const btn = { backgroundColor:bg, color:tc, border:"none", cursor:"pointer" }
  return (
    <div className="flex items-center rounded-lg overflow-hidden" style={{ border:`1px solid ${bdr}` }}>
      <button onClick={onDecrease} className="w-8 h-8 flex items-center justify-center text-lg leading-none transition-colors"
        style={btn} onMouseEnter={e=>e.currentTarget.style.backgroundColor=hov} onMouseLeave={e=>e.currentTarget.style.backgroundColor=bg}>−</button>
      <span className="w-8 text-center text-sm font-semibold" style={{ backgroundColor:bg, color:tc }}>{qty}</span>
      <button onClick={onIncrease} className="w-8 h-8 flex items-center justify-center text-lg leading-none transition-colors"
        style={btn} onMouseEnter={e=>e.currentTarget.style.backgroundColor=hov} onMouseLeave={e=>e.currentTarget.style.backgroundColor=bg}>+</button>
    </div>
  )
}

export default function Cart({ onNavigate, cartCount, setCartCount }) {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const [items, setItems]         = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)

  // ── Voucher ──────────────────────────────────────────────────────────────
  const [voucher, setVoucher]               = useState("")
  const [appliedVoucher, setAppliedVoucher] = useState(null)
  const [voucherMsg, setVoucherMsg]         = useState(null) // { type:"error"|"success", text }

  useEffect(() => {
    let active = true
    getCart().then(nextItems => {
      if (!active) return
      setItems(nextItems)
      setCartCount(getCartCount(nextItems))
    }).catch(error => console.error("Failed to load cart:", error))
    return () => { active = false }
  }, [setCartCount])

  const persist = async (newItems) => {
    setItems(newItems)
    const savedItems = await setCart(newItems)
    setItems(savedItems)
    setCartCount(getCartCount(savedItems))
  }
  const checkedItems = items.filter(i => i.checked)
  const subtotal     = checkedItems.reduce((s,i) => s+(i.price||0)*(i.qty||1), 0)
  const shipping     = checkedItems.length > 0 ? 100 : 0
  const discount     = computeDiscount(appliedVoucher, subtotal)
  const total        = Math.max(0, subtotal + shipping - discount)

  const applyVoucher = () => {
    const result = validateVoucher(voucher, subtotal, checkedItems.length > 0)
    setVoucherMsg({ type: result.type, text: result.message })
    setAppliedVoucher(result.ok ? result.voucher : null)
  }
  const removeVoucher = () => { setAppliedVoucher(null); setVoucher(""); setVoucherMsg(null) }

  const toggleItem   = (id,group) => persist(items.map(i => (i.id===id&&i.group===group)?{...i,checked:!i.checked}:i))
  const toggleAll    = () => { const n=!selectAll; setSelectAll(n); persist(items.map(i=>({...i,checked:n}))) }
  const handleQty    = (id,group,delta) => persist(items.map(i => (i.id===id&&i.group===group)?{...i,qty:Math.max(1,(i.qty||1)+delta)}:i))
  const handleRemove = (id,group) => persist(items.filter(i=>!(i.id===id&&i.group===group)))

  const groups = items.reduce((acc,item) => { const g=item.group||"Others"; if(!acc[g])acc[g]=[]; acc[g].push(item); return acc }, {})

  // ── DARK MODE TOKENS — aggressive, clearly readable ─────────────────────
  const pageBg   = isDark ? "#0f172a" : "#F7F8FA"

  // Cards
  const cardBg   = isDark ? "#1a2332" : "white"
  const cardBdr  = isDark ? "#1e293b" : "#e5e7eb"

  // Header bar inside card (group name row, select-all row)
  const hdrBg    = isDark ? "#111827" : "#fafbfc"
  const hdrBdr   = isDark ? "#1e293b" : "#f0f0f0"

  // ALL TEXT — much brighter in dark mode
  const headingC = isDark ? "#f1f5f9" : "#1e293b"     // page title
  const labelC   = isDark ? "#e2e8f0" : "#374151"     // item names, primary text
  const subC     = isDark ? "#94a3b8" : "#6b7280"     // secondary text

  // Product image placeholder
  const imgBg    = isDark ? "#1e293b" : "linear-gradient(to bottom right,#fdf2f8,#ffe4e6)"

  // Price — neon in dark
  const priceC   = isDark ? "#4ade80" : G

  // Summary card
  const sumBg    = isDark ? "#1a2332" : "white"
  const divC     = isDark ? "#1e293b" : "#f0f0f0"

  // Voucher input
  const inBg     = isDark ? "#111827" : "white"
  const inBdr    = isDark ? "#334155" : "#e5e7eb"
  const inTxt    = isDark ? "#f1f5f9" : "#374151"

  // Voucher feedback colours
  const okC      = isDark ? "#4ade80" : G
  const errC     = isDark ? "#f87171" : "#dc2626"

  // Delete/remove button hover colour
  const delHov   = "#f87171"

  return (
    <div className="min-h-screen" style={{ backgroundColor:pageBg }}>
      <style>{`@keyframes cartRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-xl font-bold mb-6" style={{ color:headingC, animation:"cartRise 0.5s ease 0.05s both" }}>Shopping Cart</h1>

        <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">

          {/* ── Left column ── */}
          <div className="space-y-3" style={{ animation:"cartRise 0.5s ease 0.15s both" }}>

            {/* Select all bar */}
            <div className="rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ backgroundColor:cardBg, border:`1px solid ${cardBdr}` }}>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={selectAll} onChange={toggleAll}
                  className="w-4 h-4 rounded cursor-pointer" style={{ accentColor:G }}/>
                <span className="text-sm font-semibold" style={{ color:labelC }}>
                  SELECT ALL ({items.length} ITEM{items.length!==1?"S":""})
                </span>
              </label>
              <button onClick={() => persist(items.filter(i=>!i.checked))}
                className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
                style={{ color:subC }}
                onMouseEnter={e => e.currentTarget.style.color=delHov}
                onMouseLeave={e => e.currentTarget.style.color=subC}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                DELETE
              </button>
            </div>

            {/* Item groups */}
            {Object.entries(groups).map(([groupName, groupItems]) => (
              <div key={groupName} className="rounded-xl overflow-hidden"
                style={{ backgroundColor:cardBg, border:`1px solid ${cardBdr}` }}>
                {/* Group header */}
                <div className="px-4 py-3 flex items-center gap-2.5"
                  style={{ borderBottom:`1px solid ${hdrBdr}`, backgroundColor:hdrBg }}>
                  <input type="checkbox"
                    checked={groupItems.every(i=>i.checked)}
                    onChange={() => {
                      const all=groupItems.every(i=>i.checked)
                      persist(items.map(i=>groupItems.find(g=>g.id===i.id&&g.group===i.group)?{...i,checked:!all}:i))
                    }}
                    className="w-4 h-4 rounded cursor-pointer" style={{ accentColor:G }}/>
                  <span className="text-sm font-semibold" style={{ color:labelC }}>{groupName}</span>
                </div>

                {/* Items */}
                {groupItems.map(item => (
                  <div key={`${item.id}-${item.group}`}
                    className="px-4 py-4"
                    style={{ borderBottom:`1px solid ${hdrBdr}` }}>

                    {/* Top row: checkbox + image + details + (desktop controls) + remove */}
                    <div className="flex items-start gap-3 sm:gap-4">
                      <input type="checkbox" checked={item.checked} onChange={() => toggleItem(item.id,item.group)}
                        className="w-4 h-4 mt-1 rounded cursor-pointer flex-shrink-0" style={{ accentColor:G }}/>

                      {/* Image */}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
                        style={{ background:imgBg, border:`1px solid ${cardBdr}` }}>
                        {item.img
                          ? <img src={item.img} alt={item.name} className="w-full h-full object-cover"/>
                          : <span className="text-xs text-center px-1" style={{ color:subC }}>{item.name?.slice(0,10)||"Item"}</span>
                        }
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold mb-0.5 truncate" style={{ color:labelC }}>{item.name}</p>
                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color:subC }}>{item.desc}</p>
                      </div>

                      {/* Controls — desktop only (stacked at right) */}
                      <div className="hidden sm:flex flex-col items-end gap-2 flex-shrink-0">
                        <QtyControl qty={item.qty||1} onDecrease={()=>handleQty(item.id,item.group,-1)} onIncrease={()=>handleQty(item.id,item.group,1)} isDark={isDark}/>
                        <span className="text-sm font-bold" style={{ color:priceC }}>
                          ₱{((item.price||0)*(item.qty||1)).toLocaleString()}
                        </span>
                      </div>

                      {/* Remove */}
                      <button onClick={() => handleRemove(item.id,item.group)}
                        className="mt-0.5 flex-shrink-0 transition-colors"
                        style={{ color:subC }}
                        onMouseEnter={e => e.currentTarget.style.color=delHov}
                        onMouseLeave={e => e.currentTarget.style.color=subC}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>

                    {/* Controls — mobile only (full-width row below, so the name/desc keep the full width above) */}
                    <div className="flex sm:hidden items-center justify-between gap-3 mt-3">
                      <QtyControl qty={item.qty||1} onDecrease={()=>handleQty(item.id,item.group,-1)} onIncrease={()=>handleQty(item.id,item.group,1)} isDark={isDark}/>
                      <span className="text-sm font-bold" style={{ color:priceC }}>
                        ₱{((item.price||0)*(item.qty||1)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Empty */}
            {items.length === 0 && (
              <div className="rounded-xl p-8 text-center"
                style={{ backgroundColor:cardBg, border:`1px solid ${cardBdr}` }}>
                <p className="text-sm mb-3" style={{ color:subC }}>Your cart is empty.</p>
                <button onClick={() => onNavigate("shop")}
                  className="px-4 py-2 text-sm font-bold text-white rounded-lg"
                  style={{ backgroundColor:G }}>
                  Start Shopping
                </button>
              </div>
            )}

            {/* Catalog section */}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor:cardBg, border:`1px solid ${cardBdr}` }}>
              <button onClick={() => setCatalogOpen(p=>!p)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left transition-colors"
                onMouseEnter={e => e.currentTarget.style.backgroundColor=isDark?"rgba(74,222,128,0.04)":"#f8fffe"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor="transparent"}>
                <div className="flex items-center gap-2.5">
                  <input type="checkbox" className="w-4 h-4 rounded" style={{ accentColor:G }} onClick={e=>e.stopPropagation()}/>
                  <span className="text-sm font-semibold" style={{ color:labelC }}>From the catalog</span>
                </div>
                <div className="flex items-center gap-2" style={{ color:subC }}>
                  <span className="text-xs font-medium">3 ITEMS</span>
                  <svg className="w-4 h-4 transition-transform duration-200" style={{ transform:catalogOpen?"rotate(180deg)":"rotate(0)" }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
                  </svg>
                </div>
              </button>
              {catalogOpen && (
                <div className="px-4 pb-3" style={{ borderTop:`1px solid ${hdrBdr}` }}>
                  <p className="text-sm py-4 text-center" style={{ color:subC }}>Connect to backend to show catalog items</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Right — Order Summary ── */}
          <div className="rounded-xl p-5 lg:sticky lg:top-24"
            style={{ backgroundColor:sumBg, border:`1px solid ${cardBdr}`, animation:"cartRise 0.5s ease 0.25s both" }}>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4" style={{ color:subC }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              <h2 className="text-sm font-bold" style={{ color:headingC }}>Order Summary</h2>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span style={{ color:subC }}>Subtotal ({checkedItems.length} item{checkedItems.length!==1?"s":""})</span>
                <span className="font-semibold" style={{ color:labelC }}>₱{subtotal.toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color:subC }}>Shipping Fee</span>
                <span className="font-semibold" style={{ color:labelC }}>{shipping>0?`₱${shipping}.00`:"—"}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span style={{ color:okC }}>Voucher{appliedVoucher ? ` (${appliedVoucher.code})` : ""}</span>
                  <span className="font-semibold" style={{ color:okC }}>−₱{discount.toLocaleString()}.00</span>
                </div>
              )}
              <div className="h-px my-1" style={{ backgroundColor:divC }}/>
              <div className="flex justify-between font-bold text-sm">
                <span style={{ color:labelC }}>Order total</span>
                <span style={{ color:priceC }}>₱{total.toLocaleString()}.00</span>
              </div>
              <p className="text-xs" style={{ color:subC }}>VAT included, where applicable</p>
            </div>

            {/* 🚀 UPDATED CHECKOUT BUTTON */}
            <button
              onClick={() => {
                if (!user) {
                  alert("Please log in or create an account to proceed to checkout.");
                  onNavigate("login"); 
                } else {
                  onNavigate("checkout");
                }
              }}
              disabled={checkedItems.length===0}
              className="w-full mt-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor:G }}>
              Proceed to checkout ({checkedItems.length})
            </button>

            {/* Voucher */}
            <div className="mt-4 pt-4" style={{ borderTop:`1px solid ${divC}` }}>
              <label className="block text-xs font-semibold mb-2" style={{ color:subC }}>Voucher Code</label>

              {appliedVoucher ? (
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg"
                  style={{ border:`1px solid ${okC}`, backgroundColor:isDark?"rgba(74,222,128,0.08)":"#F0F7F1" }}>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color:okC }}>{appliedVoucher.code}</p>
                    <p className="text-[11px]" style={{ color:subC }}>
                      {appliedVoucher.type==="percent" ? `${appliedVoucher.value}% off` : `₱${appliedVoucher.value} off`} · −₱{discount.toLocaleString()}
                    </p>
                  </div>
                  <button onClick={removeVoucher}
                    className="text-xs font-bold flex-shrink-0 transition-colors"
                    style={{ color:subC }}
                    onMouseEnter={e => e.currentTarget.style.color=errC}
                    onMouseLeave={e => e.currentTarget.style.color=subC}>
                    REMOVE
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input placeholder="Enter voucher code"
                    value={voucher}
                    onChange={e => { setVoucher(e.target.value); if (voucherMsg) setVoucherMsg(null) }}
                    onKeyDown={e => { if (e.key==="Enter") applyVoucher() }}
                    className="flex-1 px-3 py-2 text-xs border rounded-lg outline-none transition-all uppercase placeholder:normal-case"
                    style={{ borderColor:inBdr, backgroundColor:inBg, color:inTxt }}
                    onFocus={e => { e.target.style.borderColor="#4ade80"; e.target.style.boxShadow="0 0 0 2px rgba(74,222,128,0.18)" }}
                    onBlur={e => { e.target.style.borderColor=inBdr; e.target.style.boxShadow="none" }}/>
                  <button onClick={applyVoucher}
                    className="px-3 py-2 text-xs font-bold rounded-lg border transition-all hover:opacity-80"
                    style={{ borderColor:isDark?"#4ade80":G, color:isDark?"#4ade80":G, backgroundColor:"transparent" }}>
                    APPLY
                  </button>
                </div>
              )}

              {voucherMsg && (
                <div className="mt-2 flex items-start gap-1.5 text-xs"
                  style={{ color: voucherMsg.type==="success" ? okC : errC }}>
                  {voucherMsg.type==="success" ? (
                    <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  )}
                  <span>{voucherMsg.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
