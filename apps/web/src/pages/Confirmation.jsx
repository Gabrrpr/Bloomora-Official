import { useState, useEffect } from "react"

const G = "#2E8B34"

export default function Confirmation({ onNavigate }) {
  const [order, setOrder] = useState(null)
  const [isPaid, setIsPaid] = useState(false)
  const [loading, setLoading] = useState(true)

  // 1. Load initial data
  useEffect(() => {
    try {
      const raw = localStorage.getItem("bloomora_last_order")
      if (raw) {
        const parsedOrder = JSON.parse(raw)
        setOrder(parsedOrder)
        
        // If it's already paid, skip loading
        if (parsedOrder.payment_status === 'paid') {
          setIsPaid(true)
          setLoading(false)
        } else if (parsedOrder.payment_method !== "paymongo") {
          // If it's manual (QRPH), don't show the "Verifying" loader
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    } catch {
      setOrder(null)
      setLoading(false)
    }
  }, [])

  // 2. Polling logic (Only if payment is pending)
  useEffect(() => {
    if (!order || !order.orderIds?.[0] || isPaid || order.payment_method !== "paymongo") return

    const orderId = order.orderIds[0]

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`)
        const data = await response.json()
        
        if (data.payment_status === 'paid') {
          setIsPaid(true)
          setLoading(false)
          clearInterval(interval)
        }
      } catch (err) {
        console.error("Polling failed", err)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [order, isPaid])

  // Initial State: No Order
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

  // Loading State: Waiting for Webhook
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F7F8FA" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  // Success State: Render Receipt
  const placedDate = order.placedAt
    ? new Date(order.placedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
    : "—"

  const getPaymentLabel = () => {
    if (order.payment_method === "paymongo") return "Online Payment (PayMongo)";
    if (order.payment_method === "qrph") return "Manual Transfer (QRPh)";
    return order.payment_method || "Payment";
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F8FA" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">

          {/* Left — Thank You */}
          <div>
            <h1 className="text-4xl font-bold text-gray-800 leading-tight mb-4">
              Thank you for your<br />purchase!
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Your order has been confirmed and is currently being processed.<br />
              It is scheduled for <strong className="text-gray-700">{order.scheduledDate}</strong>. 
              {order.payment_method === "qrph" && " We will verify your payment reference shortly."}
            </p>

            {/* Delivery Details */}
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Delivery Details</h2>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-[120px_1fr] gap-4">
                  <span className="text-gray-400 font-medium">Address</span>
                  <span className="text-gray-700">{order.deliveryAddress}</span>
                </div>
                {order.special_note && (
                  <div className="grid grid-cols-[120px_1fr] gap-4">
                    <span className="text-gray-400 font-medium">Note</span>
                    <span className="text-gray-700 italic">"{order.special_note}"</span>
                  </div>
                )}
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

          {/* Right — Receipt */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">Order Summary</h2>
            </div>

            <div className="px-5 py-3 grid grid-cols-2 gap-3 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Order Date</p>
                <p className="text-xs font-semibold text-gray-700">{placedDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Payment Method</p>
                <p className="text-xs font-semibold text-gray-700">{getPaymentLabel()}</p>
              </div>
            </div>

            <div className="px-5 divide-y divide-gray-100">
              {order.items?.map((item, i) => (
                <div key={i} className="py-3.5 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={item.img} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-tight">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Qty: {item.qty}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">₱{(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 space-y-2">
              <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>₱{(order.subtotal || 0).toLocaleString()}.00</span></div>
              <div className="flex justify-between text-base font-bold text-gray-800 pt-2 border-t border-gray-200 mt-2">
                <span>Total</span>
                <span>₱{(order.total || 0).toLocaleString()}.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}