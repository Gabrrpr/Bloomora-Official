import { useState } from "react"

// Accept the adId and onClose props passed down from App.jsx!
export default function AdPopup({ adId = "1", onClose }) {
  const [hiding, setHiding]   = useState(false)

  const dismiss = () => {
    // 1. Trigger the fade-out CSS animation
    setHiding(true)
    
    // 2. Wait exactly 350ms for the animation to finish, then tell App.jsx to completely remove the popup
    setTimeout(() => {
      if (onClose) onClose();
    }, 350)
  }

  // 🚀 Dynamically load the image based on the Admin's selection!
  // Note: Ensure this path matches exactly where your ad images live. 
  // Based on your admin file, they might be in an 'ads' folder like: `../assets/ads/advertisement${adId}.png`
  const imageSrc = new URL(`../assets/ads/advertisement${adId}.png`, import.meta.url).href;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{
        backgroundColor: hiding ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.6)",
        backdropFilter:  hiding ? "blur(0px)" : "blur(4px)",
        transition: "background-color 0.35s ease, backdrop-filter 0.35s ease",
      }}
      onClick={dismiss}
    >
      <style>{`
        @keyframes adFadeIn  { from { opacity:0; transform:scale(0.92) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes adFadeOut { from { opacity:1; transform:scale(1); }                    to { opacity:0; transform:scale(0.94); } }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          animation: hiding ? "adFadeOut 0.35s ease forwards" : "adFadeIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
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
            alt="Esting's Flowers Promotion"
            className="w-full h-auto block bg-white"
            style={{ maxHeight: "85vh", objectFit: "contain" }} 
          />
        </div>

        <p className="text-center text-white/60 text-xs mt-3">Click anywhere outside to close</p>
      </div>
    </div>
  )
}

