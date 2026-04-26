import { useState, useEffect } from "react"

const G = "#2E8B34"

export default function Confirmation({ onNavigate }) {
  const [order, setOrder] = useState(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bloomora_last_order")
      if (raw) setOrder(JSON.parse(raw))
    } catch {
      setOrder(null)
    }
  }, [])

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F7F8FA" }}>
        <div className="text-center">
          <p className="text-gray-500 mb-4">No recent order found.</p>
          <button onClick={() => onNavigate("shop")} className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ backgroundColor: G }}>
            Start Shopping
          </button>
        </div>
      </div>
    )
  }

  const placedDate = order.placedAt
    ? new Date(order.placedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
    : "—"

  const txnId = order.orderIds?.[0]
    ? `TRX-${order.orderIds[0].slice(0, 8).toUpperCase()}`
    : "TRX-000000"

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F8FA" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">

          {/* Left — thank you */}
          <div>
            <h1 className="text-4xl font-bold text-gray-800 leading-tight mb-4">
              Thank you for your<br />purchase!
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Your order has been confirmed and is currently in preparation.<br />
              It will be delivered on <strong className="text-gray-700">{order.scheduledDate} (GMT+8)</strong>, {order.deliveryTime?.toLowerCase() || "anytime within the day"}.
            </p>

            {/* Billing */}
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Delivery Address</h2>
              <div className="space-y-2 text-sm">
                {[
                  { label: "Name", value: "Juan dela Cruz" },
                  { label: "Address", value: order.deliveryAddress },
                  { label: "Phone no.", value: "+63 0987 654 3210" },
                  { label: "Email", value: "juandelacruz@gmail.com" },
                ].map(({ label, value }) => (
                  <div key={label} className="grid grid-cols-[120px_1fr] gap-4">
                    <span className="text-gray-400 font-medium">{label}</span>
                    <span className="text-gray-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => onNavigate("orders")}
              className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:brightness-105"
              style={{ backgroundColor: G }}
            >
              Track Your Order
            </button>
          </div>

          {/* Right — receipt style */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">Order Summary</h2>
            </div>

            {/* Meta row */}
            <div className="px-5 py-3 grid grid-cols-3 gap-3 border-b border-gray-100">
              {[
                { label: "Order date", value: placedDate },
                { label: "Transaction number", value: txnId },
                { label: "Payment Method", value: "QR Ph" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="text-xs font-semibold text-gray-700">{value}</p>
                </div>
              ))}
            </div>

            {/* Items */}
            <div className="px-5 divide-y divide-gray-100">
              {order.items?.map((item, i) => (
                <div key={i} className="py-3.5 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-50 to-rose-100 flex-shrink-0 flex items-center justify-center border border-gray-100 overflow-hidden">
                    {item.img ? (
                      <img src={item.img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400 text-center leading-tight px-1">{item.name?.split(" ").slice(0, 2).join(" ")}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-tight">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Qty: {item.qty || 1}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 flex-shrink-0">₱{((item.price || 0) * (item.qty || 1)).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="px-5 py-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm text-gray-500"><span>Subtotal ({order.items?.length || 0} items)</span><span>₱{(order.subtotal || 0).toLocaleString()}.00</span></div>
              <div className="flex justify-between text-sm text-gray-500"><span>Shipping Fee</span><span>₱{order.shipping || 0}.00</span></div>
              <div className="flex justify-between text-base font-bold text-gray-800 pt-1 border-t border-gray-100 mt-1">
                <span>Order total</span>
                <span>₱{(order.total || 0).toLocaleString()}.00</span>
              </div>
              <p className="text-xs text-gray-400">VAT included, where applicable</p>
            </div>

            {/* Receipt tear edge decoration */}
            <div className="px-5">
              <div className="border-t border-dashed border-gray-200 relative overflow-hidden">
                <div className="flex justify-between -mx-5">
                  {Array.from({length: 14}).map((_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-gray-100 -mt-1.5 flex-shrink-0" />
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 py-4" />
          </div>
        </div>
      </div>
    </div>
  )
}

