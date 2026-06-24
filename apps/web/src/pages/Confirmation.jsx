import { useEffect, useMemo, useState } from "react"
import { api } from "../services/api.js"

const G = "#2E8B34"
const DG = "#0C573E"

function peso(value) {
  return `PHP ${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function isPaidStatus(status) {
  return String(status || "").toLowerCase() === "paid"
}

export default function Confirmation({ onNavigate }) {
  const [order, setOrder] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState("pending")
  const [verifying, setVerifying] = useState(true)
  const [statusMessage, setStatusMessage] = useState("")

  const query = useMemo(() => new URLSearchParams(window.location.search), [])
  const returnedFromPayMongo = query.get("payment") === "success"
  const queryOrderId = query.get("order_id")

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bloomora_last_order")
      const parsed = raw ? JSON.parse(raw) : null
      setOrder(parsed)
      setPaymentStatus(parsed?.payment_status || (parsed?.payment_method === "paymongo" ? "pending" : "paid"))
      if (!parsed?.orderIds?.length && !queryOrderId) setVerifying(false)
    } catch {
      setOrder(null)
      setVerifying(false)
    }
  }, [queryOrderId])

  useEffect(() => {
    const orderId = queryOrderId || order?.orderIds?.[0]
    if (isPaidStatus(order?.payment_status)) {
      setPaymentStatus("paid")
      setVerifying(false)
      return
    }
    if (!orderId || order?.payment_method !== "paymongo") {
      setVerifying(false)
      return
    }

    let active = true
    let attempts = 0

    const verify = async () => {
      attempts += 1
      try {
        const data = await api.get(`/payments/paymongo/status/${orderId}`)
        if (!active) return
        const nextStatus = data.payment_status || "pending"
        setPaymentStatus(nextStatus)
        if (isPaidStatus(nextStatus)) {
          const updatedOrder = {
            ...(order || {}),
            payment_status: "paid",
            paidAt: data.paid_at || new Date().toISOString(),
          }
          setOrder(updatedOrder)
          localStorage.setItem("bloomora_last_order", JSON.stringify(updatedOrder))
          setVerifying(false)
          return
        }
        setStatusMessage("Payment is still being confirmed. This usually updates within a few seconds.")
        if (attempts >= 8) setVerifying(false)
      } catch (error) {
        if (!active) return
        setStatusMessage(error.message || "We could not verify the payment yet.")
        if (attempts >= 3) setVerifying(false)
      }
    }

    verify()
    const timer = setInterval(verify, 2500)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [order, queryOrderId])

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F7F8FA" }}>
        <div className="max-w-md w-full text-center bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#f0fdf4", color: G }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18M8 7h8m-9 4h10m-8 4h6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No recent order found</h1>
          <p className="text-sm text-gray-500 mb-5">Your payment may have returned in a new session. You can still check your orders from your account.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={() => onNavigate("orders")} className="flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-lg" style={{ backgroundColor: G }}>
              View Orders
            </button>
            <button onClick={() => onNavigate("shop")} className="flex-1 px-4 py-2.5 text-sm font-bold rounded-lg border border-gray-200 text-gray-600">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  const paid = isPaidStatus(paymentStatus) || (returnedFromPayMongo && !verifying && order.payment_method === "paymongo" && !statusMessage)
  const placedDate = order.placedAt
    ? new Date(order.placedAt).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })
    : "Today"
  const orderNumbers = (order.orderIds || []).map(id => String(id).slice(0, 8).toUpperCase()).join(", ")

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg,#f0fdf4 0%,#f8fafc 38%,#ffffff 100%)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
          <section className="rounded-3xl overflow-hidden bg-white border border-green-100 shadow-sm">
            <div className="relative px-6 sm:px-8 py-8 sm:py-10" style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 18% 20%,white 0,white 12%,transparent 13%),radial-gradient(circle at 80% 10%,white 0,white 9%,transparent 10%)" }} />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mb-5">
                  {verifying ? (
                    <div className="w-8 h-8 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : (
                    <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70 mb-2">
                  {verifying ? "Confirming Payment" : paid ? "Payment Successful" : "Order Received"}
                </p>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
                  {verifying ? "Almost done..." : "Thank you for your purchase!"}
                </h1>
                <p className="text-sm sm:text-base text-white/80 mt-4 max-w-2xl leading-relaxed">
                  {verifying
                    ? "We are checking PayMongo for the final payment confirmation. Keep this page open for a moment."
                    : paid
                      ? "Your payment was successful and your order is now being prepared by our team."
                      : statusMessage || "Your order has been received and is being processed."}
                </p>
              </div>
            </div>

            <div className="px-6 sm:px-8 py-6">
              {statusMessage && !paid && (
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {statusMessage}
                </div>
              )}

              <div className="grid sm:grid-cols-3 gap-3 mb-6">
                <InfoTile label="Order Date" value={placedDate} />
                <InfoTile label="Order Ref" value={orderNumbers || "Processing"} />
                <InfoTile label="Payment" value={paid ? "Paid via PayMongo" : order.payment_method === "qrph" ? "Manual Transfer" : "Pending"} />
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Fulfillment Details</h2>
                <div className="space-y-3 text-sm">
                  <Detail label="Address" value={order.deliveryAddress || "To be confirmed"} />
                  <Detail label="Schedule" value={order.scheduledDate || "To be confirmed"} />
                  {order.special_note && <Detail label="Note" value={order.special_note} />}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button onClick={() => onNavigate("orders")} className="px-5 py-3 text-sm font-bold text-white rounded-xl transition hover:brightness-105" style={{ backgroundColor: G }}>
                  Track Your Order
                </button>
                <button onClick={() => onNavigate("shop")} className="px-5 py-3 text-sm font-bold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition">
                  Continue Shopping
                </button>
              </div>
            </div>
          </section>

          <aside className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Order Summary</h2>
              <p className="text-xs text-gray-500 mt-0.5">{(order.items || []).length} item{(order.items || []).length === 1 ? "" : "s"}</p>
            </div>

            <div className="px-5 divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
              {(order.items || []).map((item, i) => (
                <div key={`${item.id || item.name}-${i}`} className="py-4 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {item.img ? <img src={item.img} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-gray-400">Item</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-1">Qty: {item.qty || 1}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{peso((item.price || 0) * (item.qty || 1))}</span>
                </div>
              ))}
            </div>

            <div className="px-5 py-5 bg-gray-50 border-t border-gray-100 space-y-2 text-sm">
              <SummaryLine label="Subtotal" value={peso(order.subtotal)} />
              <SummaryLine label="Delivery Fee" value={Number(order.shipping || 0) > 0 ? peso(order.shipping) : "Free"} />
              {Number(order.discount || 0) > 0 && <SummaryLine label="Discount" value={`-${peso(order.discount)}`} accent />}
              <div className="pt-3 mt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-base font-extrabold text-gray-900">Total Paid</span>
                <span className="text-lg font-extrabold" style={{ color: G }}>{peso(order.total)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-900 break-words">{value}</p>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-3">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-700">{value}</span>
    </div>
  )
}

function SummaryLine({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className={accent ? "text-green-700 font-semibold" : "text-gray-500"}>{label}</span>
      <span className={accent ? "text-green-700 font-bold" : "text-gray-700 font-semibold"}>{value}</span>
    </div>
  )
}
