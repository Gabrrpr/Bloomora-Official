import { useState } from "react"

const G = "#2E8B34"
const DG = "#0C573E"

// Mock cart items matching the PDF structure
const MOCK_ITEMS = [
  {
    id: 1,
    group: "Mix and Match",
    groupIcon: "🌸",
    name: "China Red Roses",
    desc: "A medium wrapped bouquet of Ecuador roses with baby's breath, finished with white wrap and a soft pink ribbon.",
    qty: 1,
    price: 2300,
    checked: true,
    img: null,
    imgLabel: "China Red Roses",
  },
  {
    id: 2,
    group: "Describe your arrangement",
    groupIcon: "✨",
    name: "Blush Elegance Ecuador Roses",
    desc: "A medium wrapped bouquet of Ecuador roses with baby's breath, finished with white wrap and a soft pink ribbon.",
    qty: 1,
    price: 2720,
    checked: true,
    img: null,
    imgLabel: "Blush Ecuador Roses",
  },
]

function QtyControl({ qty, onDecrease, onIncrease }) {
  return (
    <div className="flex items-center gap-0 border border-gray-200 rounded-lg overflow-hidden">
      <button onClick={onDecrease} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition text-lg leading-none">−</button>
      <span className="w-8 text-center text-sm font-medium text-gray-800">{qty}</span>
      <button onClick={onIncrease} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition text-lg leading-none">+</button>
    </div>
  )
}

export default function Cart({ onNavigate }) {
  const [items, setItems] = useState(MOCK_ITEMS)
  const [selectAll, setSelectAll] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)

  const checkedItems = items.filter(i => i.checked)
  const subtotal = checkedItems.reduce((s, i) => s + i.price * i.qty, 0)
  const shipping = checkedItems.length > 0 ? 100 : 0
  const total = subtotal + shipping

  const toggleItem = (id) => setItems(prev => prev.map(i => i.id === id ? {...i, checked: !i.checked} : i))
  const toggleAll = () => { setSelectAll(p => !p); setItems(prev => prev.map(i => ({...i, checked: !selectAll}))) }
  const updateQty = (id, delta) => setItems(prev => prev.map(i => i.id === id ? {...i, qty: Math.max(1, i.qty + delta)} : i))
  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id))

  // Group items by group name
  const groups = items.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F8FA" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <h1 className="text-xl font-semibold text-gray-800 mb-6">Shopping Cart</h1>

        <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">

          {/* ── Left: Cart items ── */}
          <div className="space-y-3">

            {/* Select all / Delete bar */}
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={selectAll} onChange={toggleAll}
                  className="w-4 h-4 rounded accent-green-700 cursor-pointer" />
                <span className="text-sm text-gray-600 font-medium">
                  SELECT ALL ({items.length} ITEM{items.length !== 1 ? "S" : ""})
                </span>
              </label>
              <button
                onClick={() => setItems(prev => prev.filter(i => !i.checked))}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                DELETE
              </button>
            </div>

            {/* Item groups */}
            {Object.entries(groups).map(([groupName, groupItems]) => (
              <div key={groupName} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Group header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <input type="checkbox"
                    checked={groupItems.every(i => i.checked)}
                    onChange={() => {
                      const allChecked = groupItems.every(i => i.checked)
                      setItems(prev => prev.map(i => groupItems.find(g => g.id === i.id) ? {...i, checked: !allChecked} : i))
                    }}
                    className="w-4 h-4 rounded accent-green-700 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">{groupName}</span>
                </div>

                {/* Group items */}
                {groupItems.map(item => (
                  <div key={item.id} className="px-4 py-4 flex items-start gap-4 border-b border-gray-50 last:border-0">
                    <input type="checkbox" checked={item.checked} onChange={() => toggleItem(item.id)}
                      className="w-4 h-4 mt-1 rounded accent-green-700 cursor-pointer flex-shrink-0" />

                    {/* Image placeholder */}
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-pink-50 to-rose-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100">
                      <span className="text-xs text-gray-400 text-center leading-tight px-1">{item.imgLabel}</span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 mb-0.5">{item.name}</p>
                      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{item.desc}</p>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <QtyControl qty={item.qty} onDecrease={() => updateQty(item.id, -1)} onIncrease={() => updateQty(item.id, 1)} />
                      <span className="text-sm font-semibold text-gray-800">₱{(item.price * item.qty).toLocaleString()}</span>
                    </div>

                    <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 transition mt-0.5 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            ))}

            {/* From the catalog — collapsed section */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setCatalogOpen(p => !p)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <input type="checkbox" className="w-4 h-4 rounded accent-green-700" onClick={e => e.stopPropagation()} />
                  <span className="text-sm font-medium text-gray-700">From the catalog</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-xs">3 ITEMS</span>
                  <svg className="w-4 h-4 transition-transform duration-200" style={{ transform: catalogOpen ? "rotate(180deg)" : "rotate(0)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                </div>
              </button>
              {catalogOpen && (
                <div className="px-4 pb-3 border-t border-gray-100">
                  <p className="text-sm text-gray-400 py-4 text-center">Connect to backend to show catalog items</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <h2 className="text-sm font-semibold text-gray-700">Order Summary</h2>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal ({checkedItems.length} item{checkedItems.length !== 1 ? "s" : ""})</span>
                <span className="font-medium text-gray-700">₱{subtotal.toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Shipping Fee</span>
                <span className="font-medium text-gray-700">{shipping > 0 ? `₱${shipping}.00` : "—"}</span>
              </div>
              <div className="h-px bg-gray-100 my-1" />
              <div className="flex justify-between font-semibold text-gray-800 text-sm">
                <span>Order total</span>
                <span style={{ color: G }}>₱{total.toLocaleString()}.00</span>
              </div>
              <p className="text-xs text-gray-400">VAT included, where applicable</p>
            </div>

            <button
              onClick={() => onNavigate("checkout")}
              disabled={checkedItems.length === 0}
              className="w-full mt-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: G }}
            >
              Proceed to checkout ({checkedItems.length})
            </button>

            {/* Voucher */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <label className="block text-xs font-medium text-gray-500 mb-2">Voucher Code</label>
              <div className="flex gap-2">
                <input placeholder="Enter voucher code" className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 transition placeholder-gray-400" />
                <button className="px-3 py-2 text-xs font-semibold rounded-lg border transition hover:bg-green-50" style={{ borderColor: G, color: G }}>APPLY</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
