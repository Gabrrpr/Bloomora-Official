import { useState, useEffect } from "react"
import { api } from "../services/api.js"
import { getCart, clearCart } from "../utils/cart.js"

const G = "#2E8B34"

const DELIVERY_TIMES = ["Anytime (9PM–6PM)", "7AM–10AM", "10AM–1PM", "1PM–4PM", "4PM–8PM", "8PM–11PM"]

export default function Checkout({ onNavigate }) {
  const [cartItems, setCartItems] = useState([])
  const [deliveryTime, setDeliveryTime] = useState("Anytime (9PM–6PM)")
  const [paymentMethod, setPaymentMethod] = useState("qrph")
  const [voucher, setVoucher] = useState("")
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const items = getCart().filter(i => i.checked)
    setCartItems(items)
  }, [])

  const subtotal = cartItems.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0)
  const shipping = cartItems.length > 0 ? 100 : 0
  const total = subtotal + shipping

  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const fmt = (d) => d.toLocaleDateString("en-PH", { month: "long", day: "numeric" })
  const fmtDay = (d) => d.toLocaleDateString("en-PH", { weekday: "long" })

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      setError("Your cart is empty.")
      return
    }
    setPlacing(true)
    setError("")
    try {
      const res = await api.createOrder({
        items: cartItems.map(i => ({
          id: i.id,
          group: i.group,
          name: i.name,
          desc: i.desc,
          price: i.price,
          qty: i.qty,
          img: i.img,
        })),
        delivery_address: "60 Friendship Highway, Clark Freeport Zone, Pampanga, Angeles City, 2009",
        delivery_notes: `Delivery time: ${deliveryTime}`,
        scheduled_at: tomorrow.toISOString(),
      })

      // Store order details for confirmation page
      const orderData = {
        orderIds: res.order_ids || [],
        items: cartItems,
        subtotal,
        shipping,
        total,
        deliveryTime,
        deliveryAddress: "60 Friendship Highway, Clark Freeport Zone, Pampanga, Angeles City, 2009",
        scheduledDate: fmt(tomorrow),
        placedAt: new Date().toISOString(),
      }
      localStorage.setItem("bloomora_last_order", JSON.stringify(orderData))

      clearCart()
      onNavigate("confirmation")
    } catch (e) {
      setError(e.message || "Failed to place order. Please try again.")
    } finally {
      setPlacing(false)
    }
  }

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
              {cartItems.map((item, i) => (
                <div key={`${item.id}-${i}`} className="flex items-start gap-3 py-3 border-t border-gray-100 first:border-0">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-pink-50 to-rose-100 flex-shrink-0 flex items-center justify-center border border-gray-100 overflow-hidden">
                    {item.img ? (
                      <img src={item.img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400 text-center px-1 leading-tight">{item.name?.split(" ").slice(0, 2).join(" ")}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 mb-0.5">{item.name}</p>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{item.desc}</p>
                    <p className="text-xs text-gray-500 mt-1">Qty: {item.qty || 1}</p>
                  </div>
                  <div className="flex items-start gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-800">₱{((item.price || 0) * (item.qty || 1)).toLocaleString()}</span>
                  </div>
                </div>
              ))}

              {cartItems.length === 0 && (
                <div className="py-4 text-center">
                  <p className="text-sm text-gray-400">No items selected for checkout.</p>
                  <button onClick={() => onNavigate("cart")} className="mt-2 px-4 py-2 text-xs font-semibold text-white rounded-lg" style={{ backgroundColor: G }}>
                    Back to Cart
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-white border border-red-200 rounded-xl p-4 text-sm text-red-600">
                {error}
              </div>
            )}
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
                  <svg className="w-4 h-4" style={{ color: G }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
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
                <div className="flex justify-between text-gray-500"><span>Subtotal ({cartItems.length} item{cartItems.length !== 1 ? "s" : ""})</span><span className="font-medium text-gray-700">₱{subtotal.toLocaleString()}.00</span></div>
                <div className="flex justify-between text-gray-500"><span>Shipping Fee</span><span className="font-medium text-gray-700">₱{shipping}.00</span></div>
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between font-semibold text-gray-800"><span>Order total</span><span style={{ color: G }}>₱{total.toLocaleString()}.00</span></div>
                <p className="text-xs text-gray-400">VAT included, where applicable</p>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={placing || cartItems.length === 0}
                className="w-full py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: G }}
              >
                {placing ? "Placing order..." : "PLACE ORDER NOW"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

