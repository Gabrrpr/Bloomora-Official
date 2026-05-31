import { useState, useEffect } from "react"
import { api } from "../../services/api"
import Footer from "../../components/Footer"

const G = "#2E8B34"
const DG = "#0C573E"

export default function WriteReviewPage({ onNavigate, orderId }) {
  const [order, setOrder] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Fetch order details
    async function fetchOrder() {
      try {
        console.log("Fetching order ID:", orderId);
        
        // Let's see exactly what your API returns!
        const res = await api.get(`/orders/${orderId}`);
        console.log("Raw API Response:", res); 

        // 🚀 THE FIX: Handle both Axios responses (res.data) and direct JSON responses (res)
        const orderData = res.data ? res.data : res;
        
        setOrder(orderData);
      } catch (err) {
        console.error("Failed to fetch order:", err);
        setError("Order not found")
      } finally {
        setLoading(false)
      }
    }
    
    if (orderId) {
        fetchOrder()
    } else {
        console.warn("No orderId was passed to WriteReviewPage!");
        setLoading(false)
    }
  }, [orderId])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      await api.post("/reviews/submit", {
        order_id: orderId,
        star_rating: rating,
        comment: comment,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit review")
    } finally {
      setSubmitting(false)
    }
  }

  // Show success message
  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "#d1fae5" }}>
              <svg className="w-10 h-10" fill="none" stroke={G} viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-500 mb-6">Your review has been submitted successfully.</p>
            <button
              onClick={() => onNavigate?.("orders")}
              className="px-6 py-2 text-white font-semibold rounded-lg"
              style={{ backgroundColor: G }}
            >
              View My Orders
            </button>
          </div>
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading order...</p>
        </div>
      </div>
    )
  }

  // No order
  if (!order) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Review Not Available</h2>
            <p className="text-gray-500 mb-4">You need a valid order to leave a review.</p>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <button
              onClick={() => onNavigate?.("orders")}
              className="text-green-600 font-semibold hover:underline"
            >
              Go to Orders
            </button>
          </div>
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    )
  }

  // Check if allowed to review
  if (!order.can_review || order.status !== 'delivered') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Cannot Review Yet</h2>
            <p className="text-gray-500 mb-4">You can only review orders after they are delivered.</p>
            <button
              onClick={() => onNavigate?.("orders")}
              className="text-green-600 font-semibold hover:underline"
            >
              View Order Status
            </button>
          </div>
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    )
  }

  // Already reviewed
  if (order.has_reviewed) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Already Reviewed</h2>
            <p className="text-gray-500 mb-4">You have already submitted a review for this order.</p>
            <button
              onClick={() => onNavigate?.("orders")}
              className="text-green-600 font-semibold hover:underline"
            >
              Go to Orders
            </button>
          </div>
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate?.("orders")}
            className="flex items-center gap-1 text-sm mb-4"
            style={{ color: G }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Write a Review</h1>
          <p className="text-gray-500">Share your experience with this product</p>
        </div>

        {/* 🚀 FIXED: Order Info Card using the new Backend mapping */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-6">
          {order.items && order.items.length > 0 && order.items[0].image_url && (
            <img
              src={order.items[0].image_url}
              alt={order.product_name}
              className="w-16 h-16 object-cover rounded-lg"
            />
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{order.product_name}</h3>
            <p className="text-sm text-gray-500">Order #{order.order_number || order.id?.slice(0, 8)}</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Review Form */}
        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">How would you rate this product?</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <svg
                    className="w-10 h-10"
                    fill={star <= rating ? "#f59e0b" : "none"}
                    stroke={star <= rating ? "#f59e0b" : "#d1d5db"}
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.123l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.123l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like or dislike about this product?"
              rows={4}
              className="w-full px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2"
              style={{ borderColor: "#d1d5db", focusRingColor: G }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 text-white font-semibold rounded-lg transition-all"
            style={{ backgroundColor: G }}
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  )
}