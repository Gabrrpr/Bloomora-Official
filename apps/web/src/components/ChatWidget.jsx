import { useState, useRef, useEffect, useCallback } from "react"
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api.js'

const G = "#2E8B34"
const DG = "#0C573E"

// Use the same import style as Navbar.jsx which works
import estingsLogo from '../assets/EstingsLogo.svg'

const QUICK_REPLIES = [
  "What flowers do you offer?",
  "How does delivery work?",
  "Can I customize a bouquet?",
  "What are your store hours?",
  "Do you deliver same day?",
]

const WELCOME_MESSAGE = {
  id: 'welcome',
  from: "bot",
  text: "Hi there! 👋 Welcome to Esting's Flowers. How can we help you today? Our team is here to assist you.",
}

// Size presets — width and height
const SIZES = {
  small:  { w: 300, h: 400 },
  medium: { w: 360, h: 500 },
  large:  { w: 440, h: 620 },
}

export default function ChatWidget() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [size, setSize] = useState("medium")
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [ws, setWs] = useState(null)
  const bottomRef = useRef(null)

  // Listen for external open-chat event
  useEffect(() => {
    const handleOpenChat = () => setOpen(true)
    window.addEventListener("bloomora:open-chat", handleOpenChat)
    return () => window.removeEventListener("bloomora:open-chat", handleOpenChat)
  }, [])

  const createSession = useCallback(async () => {
    if (!user || sessionId) return
    try {
      const data = await api.createSession()
      const newSessionId = data.id
      setSessionId(newSessionId)
      const websocket = new WebSocket(`ws://localhost:8000/api/v1/chats/ws/${user.email}`)
      websocket.onopen = () => console.log('WS connected')
      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setMessages(prev => [...prev, {
          id: data.id,
          from: data.sender === 'admin' ? 'bot' : 'user',
          text: data.message
        }])
      }
      websocket.onerror = (err) => console.error('WS error:', err)
      setWs(websocket)
    } catch (err) {
      console.error('Session create error:', err)
      setMessages(prev => [...prev, { id: Date.now(), from: 'bot', text: 'Sorry, chat service temporarily unavailable.' }])
    }
  }, [user, sessionId])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || !sessionId) return
    setMessages(prev => [...prev, { id: Date.now(), from: "user", text }])
    setInput("")
    setTyping(true)
    try {
      await api.sendMessage(sessionId, text)
      setTyping(false)
    } catch (err) {
      console.error('Message send error:', err)
      setTyping(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (open) createSession()
    return () => { if (ws) ws.close() }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typing])

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const { w, h } = SIZES[size]

  return (
    <>
      <style>{`
        @keyframes chatBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
        @keyframes chatFadeUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chat-open { animation: chatFadeUp 0.28s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>

      <div className="fixed bottom-5 right-5 z-50 md:bottom-6 md:right-6 lg:bottom-8 lg:right-8">
        {open ? (
          <div
            className="chat-open flex flex-col bg-white rounded-2xl overflow-hidden"
            style={{
              /* Smooth transition between sizes */
              width: `${w}px`,
              height: `${h}px`,
              transition: "width 0.3s cubic-bezier(0.4,0,0.2,1), height 0.3s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)",
              border: "1px solid #e0f0e8",
            }}
          >
            {/* ── Header ── */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${DG} 0%, ${G} 100%)` }}
            >
              {/* Logo + name */}
              <div className="flex items-center gap-2.5">
                {/* White circle so the SVG is always visible regardless of its fill color */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ backgroundColor: "white" }}
                >
                  <img
                    src={estingsLogo}
                    alt="Esting's"
                    style={{ width: "26px", height: "26px", objectFit: "contain" }}
                  />
                </div>
                <div>
                  <p className="text-white text-sm font-bold leading-tight">Esting's Support</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sessionId ? "#4ade80" : "#fbbf24" }} />
                    <p className="text-xs leading-tight" style={{ color: "rgba(255,255,255,0.75)" }}>
                      {sessionId ? "Online" : "Connecting..."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Size toggles + close */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 rounded-lg px-1 py-1" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                  {(["small", "medium", "large"]).map((key) => (
                    <button
                      key={key}
                      onClick={() => setSize(key)}
                      className="w-6 h-6 rounded-md text-xs font-bold transition-all duration-200"
                      style={{
                        backgroundColor: size === key ? "white" : "transparent",
                        color: size === key ? DG : "rgba(255,255,255,0.7)",
                      }}
                      title={`${key.charAt(0).toUpperCase() + key.slice(1)} size`}
                    >
                      {key === "small" ? "S" : key === "medium" ? "M" : "L"}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
                  style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.25)"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.12)"}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ backgroundColor: "#f7faf8" }}>
              {messages.map(msg => (
                <div key={msg.id} className={`flex items-end gap-2 ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.from === "bot" && (
                    <div
                      className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center mb-0.5 overflow-hidden"
                      style={{ backgroundColor: "white", border: `1.5px solid #e0f0e8` }}
                    >
                      <img
                        src={estingsLogo}
                        alt="Esting's"
                        style={{ width: "18px", height: "18px", objectFit: "contain" }}
                      />
                    </div>
                  )}
                  <div
                    className="px-3.5 py-2.5 text-sm max-w-[78%] leading-relaxed"
                    style={{
                      borderRadius: msg.from === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      backgroundColor: msg.from === "user" ? DG : "white",
                      color: msg.from === "user" ? "white" : "#1f2937",
                      boxShadow: msg.from === "bot" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                      border: msg.from === "bot" ? "1px solid #e9f5ea" : "none",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ backgroundColor: "white", border: "1.5px solid #e0f0e8" }}>
                    <img src={estingsLogo} alt="" style={{ width: "18px", height: "18px", objectFit: "contain" }} />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white flex gap-1.5 items-center" style={{ border: "1px solid #e9f5ea", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: G, animation: `chatBounce 1s infinite ${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* ── Quick replies — hidden on small size so welcome msg isn't buried ── */}
            {messages.length === 1 && size !== "small" && (
              <div className="px-4 py-2.5 flex flex-wrap gap-1.5 border-t" style={{ backgroundColor: "white", borderColor: "#e9f5ea" }}>
                {QUICK_REPLIES.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="px-3 py-1.5 text-xs font-medium rounded-full border transition-all hover:border-green-500 hover:text-green-700 hover:bg-green-50"
                    style={{ borderColor: "#d1fae5", color: "#374151", backgroundColor: "#f9fafb" }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* ── Input ── */}
            <div className="flex items-center gap-2 px-3 py-3 border-t" style={{ backgroundColor: "white", borderColor: "#e9f5ea" }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={user ? "Type your message..." : "Please log in to chat"}
                disabled={!user}
                className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-all"
                style={{ borderColor: "#d1fae5", backgroundColor: "#f7faf8" }}
                onFocus={e => e.target.style.borderColor = G}
                onBlur={e => e.target.style.borderColor = "#d1fae5"}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || !user || !sessionId}
                className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
                style={{ background: input.trim() && user && sessionId ? `linear-gradient(135deg, ${DG}, ${G})` : "#e5e7eb" }}
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>

        ) : (
          /* ── Trigger button ── */
          <button
            onClick={() => setOpen(true)}
            className="group flex items-center gap-3 px-4 py-3.5 text-white rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${DG} 0%, ${G} 100%)`,
              boxShadow: "0 8px 32px rgba(12,87,62,0.35)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 overflow-hidden"
              style={{ backgroundColor: "white" }}
            >
              <img
                src={estingsLogo}
                alt="Esting's"
                style={{ width: "28px", height: "28px", objectFit: "contain" }}
              />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm leading-tight">Live Support</p>
              <p className="text-xs leading-tight" style={{ color: "rgba(255,255,255,0.8)" }}>Chat with our team</p>
            </div>
          </button>
        )}
      </div>
    </>
  )
}
