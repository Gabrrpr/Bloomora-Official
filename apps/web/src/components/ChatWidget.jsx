import { useState, useRef, useEffect } from "react"

const QUICK_REPLIES = [
  "What flowers do you offer?",
  "How does delivery work?",
  "Can I customize a bouquet?",
  "What are your store hours?",
  "Do you deliver same day?",
]

const BOT_RESPONSES = {
  "What flowers do you offer?": "We offer a wide variety of fresh flowers including roses, tulips, sunflowers, lilies, and seasonal arrangements. You can browse our full catalog in the Shop section!",
  "How does delivery work?": "We deliver within Metro Manila and select nearby cities. Orders placed before 9:00 AM are eligible for same-day delivery. We also offer pickup at our Manila and Pampanga branches.",
  "Can I customize a bouquet?": "Absolutely! Use our 'Make it Personal' feature to either mix and match your preferred flowers or describe your dream arrangement and let our AI generate a preview for you.",
  "What are your store hours?": "Both our Manila and Pampanga branches are open from 9:00 AM to 9:00 PM daily.",
  "Do you deliver same day?": "Yes! Same-day delivery is available for orders placed before 9:00 AM. Please double-check your selected delivery date when placing your order.",
}

const WELCOME_MESSAGE = {
  id: 0,
  from: "bot",
  text: "Hi there! 👋 Welcome to Esting's Flowers. Same-day delivery is available for orders placed before 9:00 AM. We deliver within Metro Manila and select nearby cities, and offer pickup at our branches. How can we help you today?",
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open])

  const sendMessage = (text) => {
    if (!text.trim()) return
    const userMsg = { id: Date.now(), from: "user", text }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setTyping(true)
    setTimeout(() => {
      const reply = BOT_RESPONSES[text] || "Thank you for reaching out! Our team will get back to you as soon as possible. You may also contact us directly at +63 918 902 2401."
      setMessages(prev => [...prev, { id: Date.now() + 1, from: "bot", text: reply }])
      setTyping(false)
    }, 900)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const chatContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ backgroundColor: "#0C573E" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">Esting's Support</p>
            <p className="text-xs leading-tight" style={{ color: "rgba(255,255,255,0.7)" }}>Usually replies within minutes</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Expand / collapse */}
          <button onClick={() => setExpanded(e => !e)}
            className="w-7 h-7 flex items-center justify-center rounded transition-colors hover:bg-white hover:bg-opacity-20 text-white"
            title={expanded ? "Minimize" : "Expand"}>
            {expanded ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
          {/* Close */}
          <button onClick={() => { setOpen(false); setExpanded(false) }}
            className="w-7 h-7 flex items-center justify-center rounded transition-colors hover:bg-white hover:bg-opacity-20 text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3" style={{ backgroundColor: "#f9fafb" }}>
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
            {msg.from === "bot" && (
              <div className="w-6 h-6 rounded-full flex-shrink-0 mr-2 mt-0.5 flex items-center justify-center" style={{ backgroundColor: "#2E8B34" }}>
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C12 2 7 5 7 10C7 12.8 9.2 15 12 15C14.8 15 17 12.8 17 10C17 5 12 2 12 2Z" />
                </svg>
              </div>
            )}
            <div
              className="max-w-[75%] px-3 py-2 text-sm leading-relaxed"
              style={{
                borderRadius: msg.from === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                backgroundColor: msg.from === "user" ? "#2E8B34" : "white",
                color: msg.from === "user" ? "white" : "#374151",
                border: msg.from === "bot" ? "1px solid #e5e7eb" : "none",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full flex-shrink-0 mr-2 mt-0.5 flex items-center justify-center" style={{ backgroundColor: "#2E8B34" }}>
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C12 2 7 5 7 10C7 12.8 9.2 15 12 15C14.8 15 17 12.8 17 10C17 5 12 2 12 2Z" />
              </svg>
            </div>
            <div className="px-3 py-2 bg-white border border-gray-200 flex items-center gap-1" style={{ borderRadius: "12px 12px 12px 4px" }}>
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#9ca3af", animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies — only show if no user message yet */}
      {messages.length === 1 && (
        <div className="px-3 py-2 flex flex-wrap gap-1.5 flex-shrink-0" style={{ backgroundColor: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
          {QUICK_REPLIES.map(q => (
            <button key={q} onClick={() => sendMessage(q)}
              className="text-xs px-2.5 py-1 rounded-full border transition-all hover:shadow-sm"
              style={{ borderColor: "#2E8B34", color: "#2E8B34", backgroundColor: "white" }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#2E8B34"; e.currentTarget.style.color = "white" }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = "#2E8B34" }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-2.5 flex items-center gap-2 flex-shrink-0" style={{ backgroundColor: "white", borderTop: "1px solid #e5e7eb" }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim()}
          className="w-8 h-8 flex items-center justify-center rounded-full text-white transition-all flex-shrink-0"
          style={{ backgroundColor: input.trim() ? "#2E8B34" : "#d1d5db" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">

        {/* Chat window */}
        {open && (
          <div
            className="bg-white overflow-hidden shadow-2xl"
            style={{
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              width: expanded ? "min(680px, 90vw)" : "320px",
              height: expanded ? "min(600px, 85vh)" : "420px",
              transition: "width 0.3s ease, height 0.3s ease",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {chatContent}
          </div>
        )}

        {/* Bubble button */}
        <button
          onClick={() => { setOpen(o => !o); if (open) setExpanded(false) }}
          className="flex items-center gap-2 px-4 py-3 text-white font-semibold text-sm shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
          style={{ backgroundColor: "#0C573E", borderRadius: "24px" }}
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
          {open ? "Close" : "Chat with us"}
        </button>
      </div>
    </>
  )
}
