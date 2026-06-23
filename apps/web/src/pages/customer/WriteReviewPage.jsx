import { useState, useEffect, useRef } from "react"
import { api } from "../../services/api"
import Footer from "../../components/Footer"

const G = "#2E8B34"
const DG = "#0C573E"

const RATING_LABELS = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very good", 5: "Excellent ✦" }

function StarIcon({ filled }) {
  return (
    <svg
      className="w-10 h-10"
      fill={filled ? "#f59e0b" : "none"}
      stroke={filled ? "#f59e0b" : "#d1d5db"}
      strokeWidth={1.2}
      viewBox="0 0 24 24"
    >
      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.123l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.123l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  )
}

export default function WriteReviewPage({ onNavigate, orderId }) {
  const [order, setOrder] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  
  // 🚀 NEW: State for the photo upload
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [reviewProducts, setReviewProducts] = useState([])
  const [selectedProductId, setSelectedProductId] = useState("")

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await api.get(`/orders/${orderId}`)
        setOrder(res.data ? res.data : res)
        const eligibility = await api.get(`/reviews/order/${orderId}/eligibility`)
        setReviewProducts(eligibility.products || [])
        setSelectedProductId((eligibility.products || []).find(product => !product.reviewed)?.id || "")
      } catch (err) {
        setError("Order not found")
      } finally {
        setLoading(false)
      }
    }
    if (orderId) fetchOrder()
    else setLoading(false)
  }, [orderId])

  // 🚀 NEW: Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("Image must be smaller than 5MB")
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setError("")
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    
    try {
      // 🚀 THE FIX: Use FormData instead of JSON so we can attach a file!
      const formData = new FormData()
      formData.append("order_id", orderId)
      formData.append("product_id", selectedProductId)
      formData.append("star_rating", rating)
      formData.append("comment", comment)
      if (imageFile) {
        formData.append("image", imageFile) // Matches backend 'image' field
      }

      await api.post("/reviews/submit", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit review")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f5f5f2" }}>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-sm w-full">
            <div
              className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#d1fae5" }}
            >
              <svg className="w-10 h-10" fill="none" stroke={G} viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Thank you!</h2>
            <p className="text-gray-400 text-sm mb-6">
              Your review has been submitted. It helps other customers choose better.
            </p>
            <button
              onClick={() => onNavigate?.("orders")}
              className="w-full py-3 text-white font-bold rounded-xl text-sm transition-all active:scale-95"
              style={{ backgroundColor: G }}
            >
              Back to Orders
            </button>
          </div>
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    )
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f5f5f2" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading your order…</p>
        </div>
      </div>
    )
  }

  // ── No order ──────────────────────────────────────────────────────────────
  if (!order) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f5f5f2" }}>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900 mb-2">Review not available</p>
            <p className="text-gray-400 text-sm mb-5">You need a valid order to leave a review.</p>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button onClick={() => onNavigate?.("orders")} className="text-sm font-semibold" style={{ color: G }}>
              Go to Orders
            </button>
          </div>
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    )
  }

  // ── Status guard ──────────────────────────────────────────────────────────
  const currentStatus = (order.status || "").toLowerCase()
  if (currentStatus !== "delivered" && currentStatus !== "completed") {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f5f5f2" }}>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900 mb-2">Not delivered yet</p>
            <p className="text-gray-400 text-sm mb-5">You can review once your order has been delivered.</p>
            <button onClick={() => onNavigate?.("orders")} className="text-sm font-semibold" style={{ color: G }}>
              View order status
            </button>
          </div>
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    )
  }

  // ── Already reviewed ──────────────────────────────────────────────────────
  if (order.has_reviewed || !selectedProductId) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f5f5f2" }}>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900 mb-2">Already reviewed</p>
            <p className="text-gray-400 text-sm mb-5">You've already submitted a review for this order.</p>
            <button onClick={() => onNavigate?.("orders")} className="text-sm font-semibold" style={{ color: G }}>
              Go to Orders
            </button>
          </div>
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    )
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f5f5f2" }}>
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8">

        {/* Back */}
        <button
          onClick={() => onNavigate?.("orders")}
          className="flex items-center gap-1.5 text-sm font-medium mb-6"
          style={{ color: G }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </button>

        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">How was your order?</h1>
        <p className="text-sm text-gray-400 mb-6">Your feedback helps other customers choose better.</p>

        {/* Product card */}
        {reviewProducts.filter(product => !product.reviewed).length > 1 && (
          <div className="flex gap-2 overflow-x-auto mb-4">
            {reviewProducts.filter(product => !product.reviewed).map(product => (
              <button
                type="button"
                key={product.id}
                onClick={() => setSelectedProductId(product.id)}
                className="px-3 py-2 rounded-full text-xs font-semibold border whitespace-nowrap"
                style={selectedProductId === product.id ? { backgroundColor: G, color: "white", borderColor: G } : { borderColor: "#d1d5db" }}
              >
                {product.name}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 mb-6">
          {(reviewProducts.find(product => product.id === selectedProductId)?.image_url || order.items?.[0]?.image_url) ? (
            <img
              src={reviewProducts.find(product => product.id === selectedProductId)?.image_url || order.items[0].image_url}
              alt={order.product_name}
              className="w-14 h-14 object-cover rounded-xl flex-shrink-0"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#d1fae5" }}
            >
              <svg className="w-7 h-7" fill="none" stroke={G} viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.5c1.5-3 5.5-3 5.5 0 0 3-5.5 7-5.5 7s-5.5-4-5.5-7c0-3 4-3 5.5 0z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{reviewProducts.find(product => product.id === selectedProductId)?.name || order.product_name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Order #{order.order_number || order.id?.slice(0, 8)}
            </p>
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold mt-1.5 px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "#d1fae5", color: "#065f46" }}
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Delivered
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Stars */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">Your Rating</p>
            <div className="flex gap-1.5 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 active:scale-95 rounded-lg"
                >
                  <StarIcon filled={star <= rating} />
                </button>
              ))}
            </div>
            <p className="text-sm font-semibold" style={{ color: G }}>
              {RATING_LABELS[rating]}
            </p>
          </div>

          <hr className="border-gray-100" />

          {/* Comment */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">Your Review</p>
            <div className="relative">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                placeholder="What made this order special? Quality of flowers, packaging, delivery speed…"
                rows={4}
                className="w-full px-4 py-3.5 border-2 rounded-xl resize-none text-sm text-gray-900 outline-none transition-colors placeholder-gray-300"
                style={{ borderColor: comment ? G : "#e5e7eb" }}
              />
              <span className="absolute bottom-3 right-4 text-xs text-gray-300">
                {comment.length} / 500
              </span>
            </div>
          </div>

          {/* 🚀 NEW: Add a Photo Section */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">Add a Photo <span className="text-gray-300 normal-case tracking-normal">(Optional)</span></p>
            
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-xl border border-gray-200 shadow-sm" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors hover:bg-gray-50"
                style={{ borderColor: "#e5e7eb" }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-10 h-10 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">Click to upload a photo</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
              </div>
            )}
            {/* Hidden Input */}
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/jpg, image/webp" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageChange}
            />
          </div>

          {/* Tips */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "#f0fdf4", border: "1px solid #d1fae5" }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: "#065f46" }}>
              💡 What makes a helpful review
            </p>
            <ul className="list-disc list-inside space-y-1">
              {[
                "How fresh and beautiful were the flowers?",
                "Was the packaging secure and presentation nice?",
                "Did the arrangement match the photo?",
              ].map((tip) => (
                <li key={tip} className="text-xs text-gray-500 leading-relaxed">{tip}</li>
              ))}
            </ul>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 text-white font-bold text-sm rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: submitting ? DG : G }}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Submit Review
              </>
            )}
          </button>
        </form>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  )
}
