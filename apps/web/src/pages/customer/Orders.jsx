import { useState, useEffect } from "react"
import { api } from "../../services/api.js"

const TABS = ["All", "Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"]

const STATUS_COLOR = {
  delivered:        "#3B6D11",
  preparing:        "#185FA5",
  pending:          "#854F0B",
  out_for_delivery: "#EE4D2D",
  cancelled:        "#A32D2D",
}

function formatStatus(s) {
  if (!s) return "Pending"
  return s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
}

function OrderCard({ order, onNavigate }) {
  const statusKey = (order.status || "pending").toLowerCase()
  const statusColor = STATUS_COLOR[statusKey] || STATUS_COLOR.pending
  const dateStr = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
    : "—"
  const isPending = ["pending", "preparing"].includes(statusKey)
  const isDelivered = statusKey === "delivered"
  const isOutForDelivery = statusKey === "out_for_delivery"

  return (
    <div className="bg-white border border-gray-200 rounded-md mb-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 9l9-7 9 7v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
          </svg>
          <span className="text-sm font-medium text-gray-800">Esting's Flowers International</span>
          <span className="text-[11px] border border-[#EE4D2D] text-[#EE4D2D] px-1.5 py-px rounded-sm">
            Official Store
          </span>
        </div>
        <span className="text-sm font-medium" style={{ color: statusColor }}>
          {formatStatus(order.status)}
        </span>
      </div>

      {/* Item */}
      <div className="px-4 py-4 flex items-start gap-3">
        <img
          src={order.image_url || "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?q=80&w=200&auto=format&fit=crop"}
          alt={order.product_name}
          className="w-[72px] h-[72px] rounded object-cover border border-gray-100 flex-shrink-0"
          onError={e => { e.target.src = "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?q=80&w=200&auto=format&fit=crop" }}
        />
        <div className="flex-1 min-w-0">
          {order.is_custom && (
            <span className="inline-block text-[11px] bg-purple-50 text-purple-700 px-1.5 py-px rounded-sm mb-1">
              Custom arrangement
            </span>
          )}
          <p className="text-sm text-gray-800 line-clamp-2 mb-1">{order.product_name}</p>
          <p className="text-xs text-gray-400 mb-2">Order: {order.order_number}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-800">₱{(order.unit_price || 0).toLocaleString()}</span>
            <span className="text-xs text-gray-400">x{order.quantity}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-center justify-end gap-1.5 mb-3">
          <span className="text-xs text-gray-400">Order total:</span>
          <span className="text-base font-semibold" style={{ color: isDelivered ? "#3B6D11" : "#EE4D2D" }}>
            ₱{(order.total_amount || 0).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-end gap-2">
          {isDelivered && order.has_reviewed && (
            <span className="text-xs text-green-700 flex items-center gap-1 mr-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Reviewed
            </span>
          )}

          <button className="px-4 py-1.5 text-sm border border-gray-200 rounded text-gray-700 hover:bg-gray-50 transition">
            Contact shop
          </button>

          {isOutForDelivery && (
            <button className="px-4 py-1.5 text-sm bg-[#EE4D2D] text-white rounded font-medium hover:bg-[#d9421f] transition">
              Track order
            </button>
          )}

          {isPending && (
            <button className="px-4 py-1.5 text-sm border border-gray-200 rounded text-gray-700 hover:bg-gray-50 transition">
              Cancel order
            </button>
          )}

          {isDelivered && (
            <>
              <button className="px-4 py-1.5 text-sm border border-gray-200 rounded text-gray-700 hover:bg-gray-50 transition">
                Buy again
              </button>
              {!order.has_reviewed && (
                <button
                  onClick={() => onNavigate("write-review", order.id)}
                  className="px-4 py-1.5 text-sm border border-[#EE4D2D] text-[#EE4D2D] rounded hover:bg-red-50 transition"
                >
                  Write a review
                </button>
              )}
            </>
          )}
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
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-md flex mb-4 overflow-hidden">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-3 text-[13px] font-medium transition whitespace-nowrap border-b-2"
              style={{
                color: tab === t ? "#EE4D2D" : "#6b7280",
                borderBottomColor: tab === t ? "#EE4D2D" : "transparent",
                background: "transparent",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded p-3 text-sm text-red-600 mb-4">{error}</div>
        )}

        {loading ? (
          <div className="bg-white rounded-md border border-gray-200 p-16 text-center text-sm text-gray-400">
            Loading your orders...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-md border border-gray-200 p-16 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-sm font-medium text-gray-700 mb-1">No orders here</p>
            <p className="text-xs text-gray-400 mb-4">You don't have any {tab.toLowerCase()} orders yet.</p>
            <button
              onClick={() => onNavigate("shop")}
              className="px-5 py-2 text-sm font-medium text-white rounded bg-[#EE4D2D] hover:bg-[#d9421f]"
            >
              Start shopping
            </button>
          </div>
        ) : (
          filtered.map(order => (
            <OrderCard key={order.id} order={order} onNavigate={onNavigate} />
          ))
        )}

      </div>
    </div>
  )
}