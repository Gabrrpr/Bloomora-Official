import { useState, useEffect } from "react"
import { api } from "../../services/api.js"

const G = "#2E8B34"
const TABS = ["All", "Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"]

const STATUS_STYLE = {
  delivered:        { bg: "bg-green-100",  text: "text-green-700"  },
  preparing:        { bg: "bg-blue-100",   text: "text-blue-700"   },
  pending:          { bg: "bg-amber-100",  text: "text-amber-700"  },
  out_for_delivery: { bg: "bg-purple-100", text: "text-purple-700" },
  cancelled:        { bg: "bg-red-100",    text: "text-red-600"    },
}

function formatStatus(status) {
  if (!status) return "Pending"
  return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
}

export default function Orders({ onNavigate }) {
  const [tab, setTab] = useState("All")
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <button onClick={() => onNavigate("home")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Orders</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm mb-6 w-fit overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap"
              style={{ backgroundColor: tab === t ? G : "transparent", color: tab === t ? "white" : "#6b7280" }}>
              {t}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 mb-4">
            {error}
          </div>
        )}

        {/* Orders list */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <p className="text-sm text-gray-400">Loading your orders...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="font-semibold text-gray-700 mb-2">No orders here</h3>
            <p className="text-sm text-gray-400 mb-5">You don't have any {tab.toLowerCase()} orders yet.</p>
            <button onClick={() => onNavigate("shop")} className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl" style={{ backgroundColor: G }}>Start Shopping</button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => {
              const statusKey = (order.status || "pending").toLowerCase()
              const s = STATUS_STYLE[statusKey] || STATUS_STYLE.pending
              const dateStr = order.created_at
                ? new Date(order.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
                : "—"
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                  
                  {/* 🚀 FIXED IMAGE BLOCK: NO MORE LETTERS */}
                  <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
                    <img 
                      src={order.image_url || "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?q=80&w=250&auto=format&fit=crop"} 
                      alt={order.product_name} 
                      className="w-full h-full object-cover" 
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?q=80&w=250&auto=format&fit=crop" }}
                    />
                  </div>

                  

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-800">{order.order_number}</span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>{formatStatus(order.status)}</span>
                    </div>
                    
                    {/* 🚀 Name and Custom Badge */}
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-700 truncate">{order.product_name} × {order.quantity}</p>
                      {order.is_custom && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          Custom
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">{dateStr}</span>
                      <span className="text-sm font-bold text-gray-800">₱{(order.total_amount || 0).toLocaleString()}</span>
                    </div>
                    
                    {order.status === "delivered" && (
                      <div className="mt-2">
                        {order.has_reviewed ? (
                          <span className="text-xs text-green-600 font-medium">✓ You reviewed this order</span>
                        ) : (
                          <button
                            onClick={() => onNavigate("write-review", order.id)}
                            className="text-xs font-semibold hover:underline"
                            style={{ color: G }}
                          >
                            Write a Review →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}