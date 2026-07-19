import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { api } from "../../services/api.js"
import { useTheme } from "../../context/ThemeContext"
import Footer from "../../components/Footer.jsx"
import DeliveryRouteMap from "../../components/delivery/DeliveryRouteMap.jsx"

const TABS = ["All", "Pending", "Confirmed", "Preparing", "Ready for Pickup", "Out for Delivery", "Delivered", "Completed", "Cancelled"]
const ORDERS_PAGE_SIZE = 8

const STATUS_META = {
  delivered:        { color: "#2D5016", bg: "#EEF5E6", label: "Delivered" },
  completed:        { color: "#2D5016", bg: "#EEF5E6", label: "Completed" },
  confirmed:        { color: "#245B2A", bg: "#EAF7EC", label: "Confirmed" },
  preparing:        { color: "#185FA5", bg: "#E8F0FA", label: "Preparing" },
  ready_for_pickup: { color: "#5A3B9E", bg: "#F0EBF8", label: "Ready for Pickup" },
  pending:          { color: "#8A6020", bg: "#FDF4E3", label: "Pending" },
  pending_payment:  { color: "#8A6020", bg: "#FDF4E3", label: "Pending" },
  paid:             { color: "#8A6020", bg: "#FDF4E3", label: "Pending" },
  processing:       { color: "#185FA5", bg: "#E8F0FA", label: "Preparing" },
  out_for_delivery: { color: "#7A3B1E", bg: "#FAEAE4", label: "Out for Delivery" },
  cancelled:        { color: "#7A2020", bg: "#FAE8E8", label: "Cancelled" },
  payment_failed:   { color: "#7A2020", bg: "#FAE8E8", label: "Cancelled" },
}

const DEFAULT_STATUS = { color: "#8A6020", bg: "#FDF4E3", label: "Pending" }

function formatStatus(s) {
  if (!s) return "Pending"
  const key = String(s).toLowerCase()
  return (STATUS_META[key]?.label) || key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
}

function statusKey(status) {
  return String(status || "pending").toLowerCase()
}

function customerStatusLabel(status) {
  return formatStatus(statusKey(status))
}

function OrderCard({ order, onNavigate, idx = 0 }) {
  const currentStatusKey = statusKey(order.status)
  const meta = STATUS_META[currentStatusKey] || DEFAULT_STATUS

  const isPending = customerStatusLabel(order.status) === "Pending"
  const isDelivered = ["delivered", "completed"].includes(currentStatusKey)
  const isOutForDelivery = currentStatusKey === "out_for_delivery"
  const tracking = order.delivery_tracking || {}
  const rider = tracking.rider
  const vehicle = tracking.vehicle
  const [trackingExpanded, setTrackingExpanded] = useState(false)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [trackingError, setTrackingError] = useState("")
  const [routePreview, setRoutePreview] = useState(null)
  const [streetPhotos, setStreetPhotos] = useState([])

  const openTracking = async () => {
    const nextOpen = !trackingExpanded
    setTrackingExpanded(nextOpen)
    if (!nextOpen || tracking.mode === "external" || !tracking.delivery_id || routePreview) return
    setTrackingLoading(true)
    setTrackingError("")
    const [routeResult, photosResult] = await Promise.allSettled([
      api.get(`/deliveries/${encodeURIComponent(tracking.delivery_id)}/route`),
      api.get(`/deliveries/${encodeURIComponent(tracking.delivery_id)}/street-photos`),
    ])
    if (routeResult.status === "fulfilled") setRoutePreview(routeResult.value)
    else setTrackingError(routeResult.reason?.message || "The planned route is temporarily unavailable.")
    if (photosResult.status === "fulfilled") setStreetPhotos(photosResult.value?.photos || [])
    setTrackingLoading(false)
  }

  const { isDark } = useTheme()
  const lineBdr  = isDark ? "#2d3748" : "#E8EDE3"
  const innerBdr = isDark ? "#2d3748" : "#F0F4EC"
  const footerBg = isDark ? "#162032" : "#FAFDF8"
  const btnBdr   = isDark ? "#374151" : "#D6E4CC"
  const btnBg    = isDark ? "#1a2332" : "white"
  const btnHovG  = isDark ? "#243042" : "#F2F8EE"
  const btnHovR  = isDark ? "#3a2326" : "#FAF0F0"
  const greenTxt = isDark ? "#86efac" : "#4A6741"
  const redTxt   = isDark ? "#fca5a5" : "#7A2020"

  return (
    <div
      className="bg-white rounded-2xl mb-4 overflow-hidden"
      style={{
        animation: `ordersRise 0.32s ease ${Math.min(0.18, idx * 0.025)}s both`,
        border: `1px solid ${lineBdr}`,
        borderLeft: `3px solid ${meta.color}`,
        boxShadow: "0 8px 22px rgba(45,80,22,0.07)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4" style={{ borderBottom: `1px solid ${innerBdr}` }}>
        <div className="flex items-center gap-2 min-w-0">
          {/* Leaf icon */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#8FAF6B" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 2C6.5 2 3 7 3 12c0 4 2.5 7.5 6 9l3-9 3 9c3.5-1.5 6-5 6-9 0-5-3.5-10-9-10z" />
          </svg>
          <span className="text-sm font-semibold text-gray-700 tracking-tight truncate">
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
      <div className="px-4 sm:px-6 py-5 flex items-start gap-4 sm:gap-5">
        <img
          src={order.image_url || "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?q=80&w=200&auto=format&fit=crop"}
          alt={order.product_name}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover flex-shrink-0"
          style={{ border: `1px solid ${lineBdr}` }}
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
          <p className="text-base text-gray-800 font-semibold line-clamp-2 mb-1 leading-snug">
            {order.product_name}
          </p>
          <p className="text-[11px] text-gray-400 mb-3 font-mono tracking-wide">
            #{order.order_number}
          </p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-base font-bold text-gray-800">
              ₱{(order.unit_price || 0).toLocaleString()}
            </span>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
              qty {order.quantity}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 py-4" style={{ borderTop: `1px solid ${innerBdr}`, background: footerBg }}>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(180px,1fr)_auto] gap-3 lg:gap-4 lg:items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Order total</span>
            <span
              className="text-lg font-bold"
              style={{ color: isDelivered ? (isDark ? "#86efac" : "#2D5016") : (isDark ? "#d6b89a" : "#5A3E28") }}
            >
              ₱{(order.total_amount || 0).toLocaleString()}
            </span>
          </div>

          <div className="orders-actions flex items-center gap-2 overflow-x-auto lg:overflow-visible lg:flex-wrap lg:justify-end pb-1 lg:pb-0">
            {isDelivered && order.has_reviewed && (
              <span className="text-xs flex items-center gap-1 font-medium flex-shrink-0" style={{ color: isDark ? "#86efac" : "#2D5016" }}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Reviewed
              </span>
            )}

            <button
              className="flex-shrink-0 min-w-max px-4 py-2 text-sm font-semibold rounded-lg transition"
              style={{ border: `1px solid ${btnBdr}`, color: greenTxt, background: btnBg }}
              onMouseEnter={e => e.currentTarget.style.background = btnHovG}
              onMouseLeave={e => e.currentTarget.style.background = btnBg}
            >
              Contact shop
            </button>

            {(tracking.tracking_url || tracking.lalamove_share_link) && (
              <button
                onClick={() => {
                  window.open(tracking.tracking_url || tracking.lalamove_share_link, "_blank", "noopener,noreferrer")
                }}
                className="flex-shrink-0 min-w-max px-4 py-2 text-sm font-semibold rounded-lg transition text-white"
                style={{ background: "#4A6741" }}
                onMouseEnter={e => e.currentTarget.style.background = "#3A5332"}
                onMouseLeave={e => e.currentTarget.style.background = "#4A6741"}
              >
                Track order
              </button>
            )}

            {(tracking.status || tracking.delivery_id || tracking.mode === "external") && (
              <button onClick={() => void openTracking()} className="flex-shrink-0 min-w-max px-4 py-2 text-sm font-semibold rounded-lg transition" style={{ border: `1px solid ${btnBdr}`, color: greenTxt, background: btnBg }}>
                {trackingExpanded ? "Hide tracking details" : "View tracking details"}
              </button>
            )}

            {isPending && (
              <button
                className="flex-shrink-0 min-w-max px-4 py-2 text-sm font-semibold rounded-lg transition"
                style={{ border: `1px solid ${btnBdr}`, color: redTxt, background: btnBg }}
                onMouseEnter={e => e.currentTarget.style.background = btnHovR}
                onMouseLeave={e => e.currentTarget.style.background = btnBg}
              >
                Cancel
              </button>
            )}

            {isDelivered && (
              <>
                <button
                  onClick={() => onNavigate("shop")}
                  className="flex-shrink-0 min-w-max px-4 py-2 text-sm font-semibold rounded-lg transition"
                  style={{ border: `1px solid ${btnBdr}`, color: greenTxt, background: btnBg }}
                  onMouseEnter={e => e.currentTarget.style.background = btnHovG}
                  onMouseLeave={e => e.currentTarget.style.background = btnBg}
                >
                  Buy again
                </button>
                {!order.has_reviewed && (
                  <button
                    onClick={() => onNavigate("write-review", order.id)}
                    className="flex-shrink-0 min-w-max px-4 py-2 text-sm font-semibold rounded-lg transition text-white"
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
        {(tracking.tracking_url || tracking.lalamove_share_link || rider || vehicle || tracking.lalamove_status || tracking.status) && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 text-xs">
            {(tracking.lalamove_status || tracking.status) && (
              <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                <span className="text-gray-400">Delivery status</span>
                <p className="font-semibold text-gray-700">{formatStatus(tracking.lalamove_status || tracking.status)}</p>
              </div>
            )}
            {rider && (
              <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                <span className="text-gray-400">Rider</span>
                <p className="font-semibold text-gray-700">{rider.name}</p>
                {rider.phone && <p className="text-gray-500">{rider.phone}</p>}
              </div>
            )}
            {vehicle && (
              <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                <span className="text-gray-400">Vehicle</span>
                <p className="font-semibold text-gray-700">
                  {[vehicle.color, vehicle.brand, vehicle.model].filter(Boolean).join(" ") || vehicle.vehicle_type}
                </p>
                {vehicle.plate_number && <p className="text-gray-500">{vehicle.plate_number}</p>}
              </div>
            )}
            {(tracking.tracking_url || tracking.lalamove_share_link) && (
              <a
                href={tracking.tracking_url || tracking.lalamove_share_link}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-[#D6E4CC] bg-white px-3 py-2 font-semibold"
                style={{ color: "#2D5016" }}
              >
                Open official courier tracking
              </a>
            )}
          </div>
        )}

        {trackingExpanded && (
          <div className="mt-4 space-y-4 rounded-xl border border-[#D6E4CC] bg-white p-4">
            <div>
              <p className="font-semibold text-gray-800">{tracking.mode === "external" ? `${tracking.provider_name || formatStatus(tracking.provider)} shipment` : "In-house delivery"}</p>
              <p className="mt-1 text-xs text-gray-500">{tracking.mode === "external" ? `Reference: ${tracking.external_reference || "Awaiting booking"}` : "Planned route — not live rider location"}</p>
            </div>
            {tracking.events?.length > 0 && <div className="grid gap-2 sm:grid-cols-2">{tracking.events.map((event, eventIndex) => <div key={`${event.status}-${eventIndex}`} className="rounded-lg bg-gray-50 px-3 py-2 text-xs"><p className="font-semibold text-gray-700">{formatStatus(event.status)}</p><p className="text-gray-400">{event.createdAt ? new Date(event.createdAt).toLocaleString("en-PH") : "Status recorded"}</p></div>)}</div>}
            {tracking.intervention_required && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">The courier reported an exception. Esting&apos;s staff will review or rebook this delivery.</div>}
            {trackingLoading && <p className="py-8 text-center text-sm text-gray-500">Loading planned route…</p>}
            {trackingError && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{trackingError}</p>}
            {routePreview && <><DeliveryRouteMap geometry={routePreview.geometry} markers={routePreview.markers || []} height={360} /><p className="text-xs text-gray-500">{routePreview.available ? `${((routePreview.distanceM || 0) / 1000).toFixed(1)} km · about ${Math.round((routePreview.durationS || 0) / 60)} minutes planned driving time` : routePreview.availabilityReason}</p></>}
            {tracking.mode !== "external" && <div><p className="mb-2 text-sm font-semibold text-gray-700">Nearby street photos</p>{streetPhotos.length ? <div className="flex gap-3 overflow-x-auto pb-2">{streetPhotos.map((photo) => <figure key={photo.id} className="w-56 flex-none overflow-hidden rounded-lg border"><img src={photo.imageUrl} alt="Nearby KartaView street imagery" className="h-32 w-full object-cover" /><figcaption className="p-2 text-[10px] text-gray-500">{photo.capturedAt ? `Captured ${new Date(photo.capturedAt).toLocaleDateString()}` : "Nearby KartaView imagery"}</figcaption></figure>)}</div> : <p className="text-xs text-gray-500">No street photos are available near this destination.</p>}<p className="mt-2 text-[10px] text-gray-400">Nearby imagery © KartaView contributors · May not show the exact property.</p></div>}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Orders({ onNavigate, embedded = false }) {
  const { isDark } = useTheme()
  const headingC = isDark ? "#f3f4f6" : "#1C2B14"
  const lineBdr  = isDark ? "#2d3748" : "#E8EDE3"
  const tabActive= isDark ? "#86efac" : "#2D5016"
  const tabIdle  = isDark ? "#94a3b8" : "#9CA3AF"
  const sageC    = isDark ? "#94a3b8" : "#8FAF6B"
  const mutedC   = isDark ? "#94a3b8" : "#9CAF8F"

  const [tab, setTab] = useState("All")
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState(null)
  const loadMoreRef = useRef(null)
  const nextOffsetRef = useRef(0)
  const loadingMoreRef = useRef(false)
  const hasMoreRef = useRef(true)

  const loadOrders = useCallback(async ({ reset = false } = {}) => {
    const offset = reset ? 0 : nextOffsetRef.current
    if (!reset && (loadingMoreRef.current || !hasMoreRef.current)) return

    if (reset) {
      setLoading(true)
      setError(null)
      setHasMore(true)
      hasMoreRef.current = true
      nextOffsetRef.current = 0
    } else {
      loadingMoreRef.current = true
      setLoadingMore(true)
    }

    try {
      const data = await api.getMyOrders(null, { limit: ORDERS_PAGE_SIZE, offset })
      const batch = Array.isArray(data) ? data : []

      setOrders(prev => reset ? batch : [...prev, ...batch])
      nextOffsetRef.current = offset + batch.length
      const more = batch.length === ORDERS_PAGE_SIZE
      setHasMore(more)
      hasMoreRef.current = more
    } catch (e) {
      setError(e.message || "Failed to load orders")
      if (reset) setOrders([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
      loadingMoreRef.current = false
    }
  }, [])

  useEffect(() => {
    loadOrders({ reset: true })
  }, [loadOrders])

  const filtered = useMemo(
    () => tab === "All" ? orders : orders.filter(o => customerStatusLabel(o.status) === tab),
    [orders, tab]
  )

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node || loading || loadingMore || !hasMore) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadOrders()
      },
      { rootMargin: "360px 0px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, loadOrders, tab])

  return (
    <>
    <div className={`${embedded ? "" : "min-h-screen"} orders-root`}>
      <style>{`
        @keyframes ordersRise {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes ordersSwap {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: none; }
        }
        .orders-root{background:#F5F8F2}
        [data-theme="dark"] .orders-root{background:#0f172a}
        [data-theme="dark"] .orders-root .bg-white{background-color:#1a2332 !important}
        [data-theme="dark"] .orders-root .bg-gray-50{background-color:#0f172a !important}
        [data-theme="dark"] .orders-root .text-gray-800{color:#e5e7eb !important}
        [data-theme="dark"] .orders-root .text-gray-700{color:#cbd5e1 !important}
        [data-theme="dark"] .orders-root .text-gray-400{color:#94a3b8 !important}
        [data-theme="dark"] .orders-root .border-gray-100{border-color:#2d3748 !important}
        .orders-actions{scrollbar-width:none;-ms-overflow-style:none}
        .orders-actions::-webkit-scrollbar{display:none}
      `}</style>

      <div className={embedded ? "max-w-5xl" : "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"}>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5" style={{ animation: "ordersRise 0.4s ease both" }}>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: headingC }}>
            {embedded ? "My Orders" : "Track My Order"}
          </h1>
          {!loading && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap"
              style={{ backgroundColor: isDark ? "#1a2332" : "white", color: mutedC, border: `1px solid ${lineBdr}` }}>
              {filtered.length} {filtered.length === 1 ? "order" : "orders"}
            </span>
          )}
        </div>

        {/* Tabs (pills) */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", animation: "ordersRise 0.4s ease 0.05s both" }}>
          {TABS.map(t => {
            const on = tab === t
            return (
              <button key={t} onClick={() => setTab(t)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap active:scale-95"
                style={{
                  backgroundColor: on ? "#2E8B34" : (isDark ? "#1a2332" : "white"),
                  color: on ? "#ffffff" : tabIdle,
                  border: `1px solid ${on ? "#2E8B34" : lineBdr}`,
                  boxShadow: on ? "0 2px 8px rgba(46,139,52,0.3)" : "none",
                }}>
                {t}
              </button>
            )
          })}
        </div>

        {error && (
          <div
            className="rounded-xl p-3 text-[13px] mb-4"
            style={{ background: "#FAE8E8", color: "#7A2020", border: "1px solid #F0D0D0" }}
          >
            {error}
          </div>
        )}

        <div key={tab} style={{ animation: "ordersSwap 0.35s ease both" }}>
        {loading ? (
          <div
            className="bg-white rounded-xl border p-16 text-center text-[13px]"
            style={{ border: `1px solid ${lineBdr}`, color: sageC }}
          >
            <svg className="w-6 h-6 mx-auto mb-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="#2D5016" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 2C6.5 2 3 7 3 12c0 4 2.5 7.5 6 9l3-9 3 9c3.5-1.5 6-5 6-9 0-5-3.5-10-9-10z" />
            </svg>
            Loading your orders…
          </div>
        ) : filtered.length === 0 && !hasMore ? (
          <div
            className="bg-white rounded-xl p-16 text-center"
            style={{ border: `1px solid ${lineBdr}`, boxShadow: "0 1px 4px rgba(45,80,22,0.05)" }}
          >
            <svg className="w-12 h-12 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24" style={{ color: isDark ? "#4ade80" : "#9cc1a8" }}>
              <path d="M18.7 12.4c-.28-.16-.57-.29-.86-.4.29-.11.58-.24.86-.4 1.92-1.11 2.99-3.12 3-5.19-1.79-1.03-4.07-1.11-5.99 0-.28.16-.54.35-.78.54.05-.31.08-.63.08-.95 0-2.22-1.21-4.15-3-5.19C10.21 1.85 9 3.78 9 6c0 .32.03.64.08.95-.24-.2-.49-.39-.78-.55-1.92-1.11-4.2-1.03-5.99 0 0 2.07 1.07 4.08 2.99 5.19.28.16.57.29.86.4-.29.11-.58.24-.86.4C3.39 13.9 2.32 15.91 2.31 17.98c1.79 1.03 4.07 1.11 5.99 0 .28-.16.54-.35.78-.54-.05.31-.08.63-.08.95 0 2.22 1.21 4.15 3 5.19 1.79-1.04 3-2.97 3-5.19 0-.32-.03-.64-.08-.95.24.2.49.39.78.55 1.92 1.11 4.2 1.03 5.99 0-.01-2.07-1.08-4.08-3-5.19zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
            </svg>
            <p className="text-[14px] font-semibold mb-1" style={{ color: headingC }}>No orders here</p>
            <p className="text-[12px] mb-5" style={{ color: mutedC }}>
              You don't have any {tab.toLowerCase()} orders yet.
            </p>
            <button
              onClick={() => onNavigate("shop")}
              className="px-6 py-2 text-[13px] font-semibold text-white rounded-lg transition"
              style={{ background: "#2E8B34" }}
              onMouseEnter={e => e.currentTarget.style.background = "#0C573E"}
              onMouseLeave={e => e.currentTarget.style.background = "#2E8B34"}
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

        {!loading && (
          <div
            ref={loadMoreRef}
            className="py-5 text-center"
            style={{ color: mutedC }}
          >
            {loadingMore ? (
              <div className="text-xs font-semibold">Loading more orders...</div>
            ) : hasMore ? (
              <button
                onClick={() => loadOrders()}
                className="px-5 py-2 text-xs font-semibold rounded-full transition active:scale-95"
                style={{ background: isDark ? "#1a2332" : "white", color: headingC, border: `1px solid ${lineBdr}` }}
              >
                Load more orders
              </button>
            ) : orders.length > 0 ? (
              <div className="text-xs font-semibold">You've reached the end</div>
            ) : null}
          </div>
        )}

      </div>
    </div>
    {!embedded && <Footer onNavigate={onNavigate} />}
    </>
  )
}
