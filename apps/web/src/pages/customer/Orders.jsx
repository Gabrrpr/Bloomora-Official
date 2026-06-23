import { useState, useEffect } from "react"
import { api } from "../../services/api.js"

const TABS = ["All", "Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"]

const STATUS_META = {
  delivered:        { color: "#2D5016", bg: "#EEF5E6", label: "Delivered" },
  completed:        { color: "#2D5016", bg: "#EEF5E6", label: "Delivered" },
  preparing:        { color: "#185FA5", bg: "#E8F0FA", label: "Preparing" },
  pending:          { color: "#8A6020", bg: "#FDF4E3", label: "Pending" },
  out_for_delivery: { color: "#7A3B1E", bg: "#FAEAE4", label: "Out for Delivery" },
  cancelled:        { color: "#7A2020", bg: "#FAE8E8", label: "Cancelled" },
}

const DEFAULT_STATUS = { color: "#8A6020", bg: "#FDF4E3", label: "Pending" }

function formatStatus(s) {
  if (!s) return "Pending"
  const normalized = s.toLowerCase()
  if (normalized === "completed") return "Delivered"
  return s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
}

function OrderCard({ order, onNavigate, idx = 0 }) {
  const statusKey = (order.status || "pending").toLowerCase()
  const meta = STATUS_META[statusKey] || DEFAULT_STATUS

  const isPending = ["pending", "preparing"].includes(statusKey)
  const isDelivered = ["delivered", "completed"].includes(statusKey)
  const isOutForDelivery = statusKey === "out_for_delivery"

  return (
    <div
      className="bg-white rounded-xl mb-3 overflow-hidden"
      style={{
        animation: `ordersRise 0.45s ease ${0.1 + idx * 0.06}s both`,
        border: "1px solid #E8EDE3",
        borderLeft: `3px solid ${meta.color}`,
        boxShadow: "0 1px 4px rgba(45,80,22,0.06)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid #F0F4EC" }}>
        <div className="flex items-center gap-2">
          {/* Leaf icon */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#8FAF6B" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 2C6.5 2 3 7 3 12c0 4 2.5 7.5 6 9l3-9 3 9c3.5-1.5 6-5 6-9 0-5-3.5-10-9-10z" />
          </svg>
          <span className="text-[13px] font-medium text-gray-700 tracking-tight">
            Esting's Flowers International
          </span>
        </div>
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full tracking-wide uppercase"
          style={{ color: meta.color, background: meta.bg, letterSpacing: "0.04em" }}
        >
          {meta.label}
        </span>
      </div>

      {/* Item */}
      <div className="px-5 py-4 flex items-start gap-4">
        <img
          src={order.image_url || "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?q=80&w=200&auto=format&fit=crop"}
          alt={order.product_name}
          className="w-[76px] h-[76px] rounded-lg object-cover flex-shrink-0"
          style={{ border: "1px solid #E8EDE3" }}
          onError={e => { e.target.src = "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?q=80&w=200&auto=format&fit=crop" }}
        />
        <div className="flex-1 min-w-0">
          {order.is_custom && (
            <span
              className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1.5 uppercase tracking-wider"
              style={{ background: "#F0EBF8", color: "#6B3FA0" }}
            >
              Custom Arrangement
            </span>
          )}
          <p className="text-[14px] text-gray-800 font-medium line-clamp-2 mb-1 leading-snug">
            {order.product_name}
          </p>
          <p className="text-[11px] text-gray-400 mb-3 font-mono tracking-wide">
            #{order.order_number}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-gray-800">
              ₱{(order.unit_price || 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
              qty {order.quantity}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3" style={{ borderTop: "1px solid #F0F4EC", background: "#FAFDF8" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400">Order total</span>
            <span
              className="text-[15px] font-bold"
              style={{ color: isDelivered ? "#2D5016" : "#5A3E28" }}
            >
              ₱{(order.total_amount || 0).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isDelivered && order.has_reviewed && (
              <span className="text-[11px] flex items-center gap-1 font-medium" style={{ color: "#2D5016" }}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Reviewed
              </span>
            )}

            <button
              className="px-3.5 py-1.5 text-[12px] font-medium rounded-lg transition"
              style={{ border: "1px solid #D6E4CC", color: "#4A6741", background: "white" }}
              onMouseEnter={e => e.currentTarget.style.background = "#F2F8EE"}
              onMouseLeave={e => e.currentTarget.style.background = "white"}
            >
              Contact shop
            </button>

            {isOutForDelivery && (
              <button
                className="px-3.5 py-1.5 text-[12px] font-semibold rounded-lg transition text-white"
                style={{ background: "#4A6741" }}
                onMouseEnter={e => e.currentTarget.style.background = "#3A5332"}
                onMouseLeave={e => e.currentTarget.style.background = "#4A6741"}
              >
                Track order
              </button>
            )}

            {isPending && (
              <button
                className="px-3.5 py-1.5 text-[12px] font-medium rounded-lg transition"
                style={{ border: "1px solid #D6E4CC", color: "#7A2020", background: "white" }}
                onMouseEnter={e => e.currentTarget.style.background = "#FAF0F0"}
                onMouseLeave={e => e.currentTarget.style.background = "white"}
              >
                Cancel
              </button>
            )}

            {isDelivered && (
              <>
                <button
                  onClick={() => onNavigate("shop")}
                  className="px-3.5 py-1.5 text-[12px] font-medium rounded-lg transition"
                  style={{ border: "1px solid #D6E4CC", color: "#4A6741", background: "white" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F2F8EE"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}
                >
                  Buy again
                </button>
                {!order.has_reviewed && (
                  <button
                    onClick={() => onNavigate("write-review", order.id)}
                    className="px-3.5 py-1.5 text-[12px] font-semibold rounded-lg transition text-white"
                    style={{ background: "#2D5016" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#1E3A0F"}
                    onMouseLeave={e => e.currentTarget.style.background = "#2D5016"}
                  >
                    Write a review
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Orders({ onNavigate }) {
  const [tab, setTab] = useState("All")
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null)
      try {
        const data = await api.getMyOrders(tab === "All" ? null : tab)
        setOrders(Array.isArray(data) ? data : [])
      } catch (e) {
        setError(e.message || "Failed to load orders")
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tab])

  const filtered = tab === "All"
    ? orders
    : orders.filter(o => formatStatus(o.status) === tab)

  return (
    <div className="min-h-screen" style={{ background: "#F5F8F2" }}>
      <style>{`
        @keyframes ordersRise {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Page heading */}
        <div className="mb-4" style={{ animation: "ordersRise 0.4s ease both" }}>
          <h1 className="text-[17px] font-semibold tracking-tight" style={{ color: "#1C2B14" }}>
            My Orders
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: "#8FAF6B" }}>
            Track and manage your flower orders
          </p>
        </div>

        {/* Tabs */}
        <div
          className="bg-white rounded-xl flex mb-4 overflow-x-auto"
          style={{
            border: "1px solid #E8EDE3",
            animation: "ordersRise 0.4s ease 0.05s both",
            boxShadow: "0 1px 3px rgba(45,80,22,0.05)",
            scrollbarWidth: "none",
          }}
        >
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-shrink-0 py-3 px-4 text-[12px] font-medium transition-all whitespace-nowrap relative"
              style={{
                color: tab === t ? "#2D5016" : "#9CA3AF",
                borderBottom: tab === t ? "2px solid #2D5016" : "2px solid transparent",
                background: "transparent",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {error && (
          <div
            className="rounded-xl p-3 text-[13px] mb-4"
            style={{ background: "#FAE8E8", color: "#7A2020", border: "1px solid #F0D0D0" }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div
            className="bg-white rounded-xl border p-16 text-center text-[13px]"
            style={{ border: "1px solid #E8EDE3", color: "#8FAF6B" }}
          >
            <svg className="w-6 h-6 mx-auto mb-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="#2D5016" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 2C6.5 2 3 7 3 12c0 4 2.5 7.5 6 9l3-9 3 9c3.5-1.5 6-5 6-9 0-5-3.5-10-9-10z" />
            </svg>
            Loading your orders…
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="bg-white rounded-xl p-16 text-center"
            style={{ border: "1px solid #E8EDE3", boxShadow: "0 1px 4px rgba(45,80,22,0.05)" }}
          >
            <p className="text-4xl mb-3">🌸</p>
            <p className="text-[14px] font-semibold mb-1" style={{ color: "#1C2B14" }}>No orders here</p>
            <p className="text-[12px] mb-5" style={{ color: "#9CAF8F" }}>
              You don't have any {tab.toLowerCase()} orders yet.
            </p>
            <button
              onClick={() => onNavigate("shop")}
              className="px-6 py-2 text-[13px] font-semibold text-white rounded-lg transition"
              style={{ background: "#2D5016" }}
              onMouseEnter={e => e.currentTarget.style.background = "#1E3A0F"}
              onMouseLeave={e => e.currentTarget.style.background = "#2D5016"}
            >
              Browse flowers
            </button>
          </div>
        ) : (
          filtered.map((order, idx) => (
            <OrderCard key={order.id} order={order} onNavigate={onNavigate} idx={idx} />
          ))
        )}

      </div>
    </div>
  )
}