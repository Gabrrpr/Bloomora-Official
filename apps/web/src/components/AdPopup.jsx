import { useState, useEffect } from "react"

export default function AdPopup({ advertisement, onClose }) {
  const [hiding, setHiding] = useState(false)
  const [visible, setVisible] = useState(false)
  const [imageSrc, setImageSrc] = useState(null)

  useEffect(() => {
    if (advertisement?.image_url) {
      setImageSrc(advertisement.image_url)
      return
    }
    // Use the active ad image the admin selected/uploaded (saved by the admin panel).
    // No hardcoded fallback — if none is set, the popup simply doesn't show.
    setImageSrc(localStorage.getItem("bloomora_active_ad_src") || null)
  }, [advertisement])

  
  useEffect(() => {
    if (!imageSrc) return
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    return () => cancelAnimationFrame(id)
  }, [imageSrc])

  const dismiss = () => {
    setHiding(true)
    setTimeout(() => {
      if (onClose) onClose();
    }, 500)
  }

  if (!imageSrc) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 pt-20 sm:pt-28"
      style={{
        backgroundColor:        (visible && !hiding) ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)",
        backdropFilter:         (visible && !hiding) ? "blur(4px)" : "blur(0px)",
        WebkitBackdropFilter:   (visible && !hiding) ? "blur(4px)" : "blur(0px)",
        transition: "background-color 0.5s ease, backdrop-filter 0.5s ease, -webkit-backdrop-filter 0.5s ease",
      }}
      onClick={dismiss}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          opacity: (visible && !hiding) ? 1 : 0,
          transform: (visible && !hiding) ? "scale(1) translateY(0)" : "scale(0.96) translateY(16px)",
          transition: "opacity 0.5s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1)",
          position: "relative",
          maxWidth: "680px",
          width: "100%",
        }}
      >
        <button onClick={dismiss}
          className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg"
          style={{ backgroundColor: "white", border: "2px solid #e5e7eb" }}>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="rounded-2xl overflow-hidden shadow-2xl">
          <img 
            src={imageSrc} 
            alt="Advertisement"
            className="w-full h-auto block bg-white"
            style={{ maxHeight: "85vh", objectFit: "contain" }} 
          />
        </div>
        <p className="text-center text-white/60 text-xs mt-3">Click anywhere outside to close</p>
      </div>
    </div>
  )
}
