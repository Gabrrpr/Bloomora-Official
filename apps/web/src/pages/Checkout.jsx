import { useState } from "react"

const G = "#2E8B34"

const DELIVERY_TIMES = ["Anytime (9PM–6PM)", "7AM–10AM", "10AM–1PM", "1PM–4PM", "4PM–8PM", "8PM–11PM"]

const MOCK_ORDER = [
  { name: "China Red Roses (Customized)", desc: "A medium wrapped bouquet of Ecuador roses with baby's breath, finished with white wrap and a soft pink ribbon.", qty: 1, price: 2300 },
  { name: "Blush Elegance Ecuador Roses (Customized)", desc: "A medium wrapped bouquet of Ecuador roses with baby's breath, finished with white wrap and a soft pink ribbon.", qty: 1, price: 2720 },
]

export default function Checkout({ onNavigate }) {
  const [deliveryTime, setDeliveryTime] = useState("Anytime (9PM–6PM)")
  const [paymentMethod, setPaymentMethod] = useState("qrph")
  const [voucher, setVoucher] = useState("")

  const subtotal = MOCK_ORDER.reduce((s, i) => s + i.price * i.qty, 0)
  const shipping = 100
  const total = subtotal + shipping

  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const fmt = (d) => d.toLocaleDateString("en-PH", { month: "long", day: "numeric" })
  const fmtDay = (d) => d.toLocaleDateString("en-PH", { weekday: "long" })

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F8FA" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <h1 className="text-xl font-semibold text-gray-800 mb-6">Checkout</h1>

        <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">

          {/* ── Left ── */}
          <div className="space-y-4">

            {/* Shipping Address */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <h2 className="text-sm font-semibold text-gray-700">Shipping Address</h2>
                </div>
                <button className="text-xs font-semibold hover:underline" style={{ color: G }}>EDIT</button>
              </div>
              <div className="flex items-start gap-4 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="font-semibold text-gray-800">Juan dela Cruz</span>
                    <span className="text-gray-500">09876543210</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: G }}>ADDRESS</span>
                    <span className="text-gray-600">60 Friendship Highway, Clark Freeport Zone, Pampanga, Angeles City, 2009</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Package */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-400 font-medium mb-4">Package 1 of 1</p>

              {/* Delivery option */}
              <p className="text-xs font-medium text-gray-500 mb-3">Choose your delivery option</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="border-2 rounded-lg p-3.5 cursor-pointer" style={{ borderColor: G }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: G }}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: G }} />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: G }}>₱100.00</span>
                  </div>
                  <p className="text-xs font-medium text-gray-700">Standard</p>
                  <p className="text-xs text-gray-400 mt-0.5">Guaranteed by {fmt(tomorrow)}<br />TOMORROW (Anytime)</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3.5 opacity-50 cursor-not-allowed">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    <span className="text-sm font-medium text-gray-400">Unavailable</span>
                  </div>
                  <p className="text-xs text-gray-400">Lalamove Delivery</p>
                  <p className="text-xs text-gray-300 mt-0.5">Within Metro Manila Only</p>
                </div>
              </div>

              {/* Order items */}
              {MOCK_ORDER.map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-3 border-t border-gray-100 first:border-0">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-pink-50 to-rose-100 flex-shrink-0 flex items-center justify-center border border-gray-100">
                    <span className="text-xs text-gray-400 text-center px-1 leading-tight">{item.name.split(" ").slice(0, 2).join(" ")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 mb-0.5">{item.name}</p>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{item.desc}</p>
                    <p className="text-xs text-gray-500 mt-1">Qty: {item.qty}</p>
                  </div>
                  <div className="flex items-start gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-800">₱{item.price.toLocaleString()}</span>
                    <button className="text-gray-300 hover:text-red-400 transition mt-0.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: delivery date + payment + summary ── */}
          <div className="space-y-4">

            {/* Delivery date */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <h2 className="text-sm font-semibold text-gray-700">Select delivery date & time</h2>
              </div>

              {/* Date row */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1 border border-gray-200 rounded-lg p-2.5 text-center opacity-50">
                  <p className="text-xs text-gray-400">Unavailable</p>
                  <p className="text-xs font-medium text-gray-500">{fmt(today)}</p>
                  <p className="text-xs text-gray-400">TODAY</p>
                </div>
                <div className="flex-1 border-2 rounded-lg p-2.5 text-center cursor-pointer" style={{ borderColor: G }}>
                  <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: G }} />
                  <p className="text-xs font-semibold" style={{ color: G }}>{fmt(tomorrow)}</p>
                  <p className="text-xs font-medium text-gray-600">{fmtDay(tomorrow).toUpperCase()}</p>
                </div>
                <div className="flex-1 border border-gray-200 rounded-lg p-2.5 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
              </div>

              {/* Timezone note */}
              <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: "#F0F7F1" }}>
                <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: G }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-xs text-gray-600">Delivery time zone: Philippine Time (GMT+8)</span>
              </div>

              {/* Time slots */}
              <div className="grid grid-cols-2 gap-1.5">
                {DELIVERY_TIMES.map(t => (
                  <button key={t} onClick={() => setDeliveryTime(t)}
                    className="py-2 px-2.5 text-xs rounded-lg border transition-all font-medium"
                    style={{
                      borderColor: deliveryTime === t ? G : "#e5e7eb",
                      backgroundColor: deliveryTime === t ? "#F0F7F1" : "white",
                      color: deliveryTime === t ? G : "#6b7280",
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  <h2 className="text-sm font-semibold text-gray-700">Select payment method</h2>
                </div>
                <button className="text-xs font-semibold hover:underline" style={{ color: G }}>View all →</button>
              </div>
              <div className="border-2 rounded-lg p-3 flex items-center gap-2" style={{ borderColor: G, backgroundColor: "#F0F7F1" }}>
                <div className="w-8 h-8 rounded bg-white flex items-center justify-center border border-gray-100 flex-shrink-0">
                  <svg className="w-4 h-4" style={{ color: G }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-800">QR Ph</p>
                  <p className="text-xs text-gray-400">Scan QR code & pay</p>
                </div>
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: G }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: G }} />
                </div>
              </div>

              {/* Voucher */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Voucher</label>
                <div className="flex gap-2">
                  <input value={voucher} onChange={e => setVoucher(e.target.value)} placeholder="Enter voucher code"
                    className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 transition placeholder-gray-400" />
                  <button className="px-3 py-2 text-xs font-semibold rounded-lg border transition hover:bg-green-50" style={{ borderColor: G, color: G }}>APPLY</button>
                </div>
              </div>
            </div>

            {/* Summary + Place Order */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="space-y-2.5 text-sm mb-4">
                <div className="flex justify-between text-gray-500"><span>Subtotal (2 items)</span><span className="font-medium text-gray-700">₱{subtotal.toLocaleString()}.00</span></div>
                <div className="flex justify-between text-gray-500"><span>Shipping Fee</span><span className="font-medium text-gray-700">₱{shipping}.00</span></div>
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between font-semibold text-gray-800"><span>Order total</span><span style={{ color: G }}>₱{total.toLocaleString()}.00</span></div>
                <p className="text-xs text-gray-400">VAT included, where applicable</p>
              </div>
              <button
                onClick={() => onNavigate("confirmation")}
                className="w-full py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:brightness-105 active:scale-[0.98]"
                style={{ backgroundColor: G }}
              >
                PLACE ORDER NOW
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
