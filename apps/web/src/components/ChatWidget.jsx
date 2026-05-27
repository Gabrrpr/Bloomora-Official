import { useState, useRef, useEffect, useCallback } from "react"
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { api } from '../services/api.js'

const G  = "#2E8B34"
const DG = "#0C573E"

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

const SIZES = {
  small:  { w: 300, h: 400 },
  medium: { w: 360, h: 500 },
  large:  { w: 440, h: 620 },
}

const CHAT_SESSION_KEY = 'bloomora_chat_session'

function UnsendModal({ isOpen, onClose, onUnsendEveryone, onUnsendForYou, isDark }) {
  if (!isOpen) return null

  const overlayBg   = isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)"
  const modalBg     = isDark ? "#1e293b"          : "white"
  const titleColor  = isDark ? "#f1f5f9"          : "#111827"
  const borderColor = isDark ? "#2d3748"          : "#e5e7eb"
  const cancelColor = isDark ? "#94a3b8"          : "#6b7280"

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        backgroundColor: overlayBg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: modalBg,
          borderRadius: "16px",
          padding: "20px",
          width: "260px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          border: `1px solid ${borderColor}`,
        }}
      >
        <p style={{ color: titleColor, fontWeight: 600, fontSize: "15px", marginBottom: "16px", textAlign: "center" }}>
          Unsend message?
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            onClick={onUnsendEveryone}
            style={{
              padding: "10px", borderRadius: "10px", border: "none",
              backgroundColor: "#ef4444", color: "white",
              fontWeight: 600, fontSize: "13px", cursor: "pointer",
            }}
          >
            Unsend for Everyone
          </button>

          <button
            onClick={onUnsendForYou}
            style={{
              padding: "10px", borderRadius: "10px",
              border: `1px solid ${borderColor}`,
              backgroundColor: "transparent", color: titleColor,
              fontWeight: 500, fontSize: "13px", cursor: "pointer",
            }}
          >
            Unsend for You
          </button>

          <button
            onClick={onClose}
            style={{
              padding: "8px", borderRadius: "10px", border: "none",
              backgroundColor: "transparent", color: cancelColor,
              fontSize: "13px", cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ChatWidget() {
  const { user } = useAuth()
  const { isDark } = useTheme()

  const [open, setOpen] = useState(false)
  const [size, setSize] = useState("medium")
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [unsendModal, setUnsendModal] = useState({ isOpen: false, msgId: null })
  const [sessionId, setSessionId] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_SESSION_KEY)
      return saved ? JSON.parse(saved).id : null
    } catch { return null }
  })
  const [attachedImage, setAttachedImage] = useState(null)
  const [sending, setSending] = useState(false)
  const bottomRef       = useRef(null)
  const fileInputRef    = useRef(null)
  const sentMessagesRef = useRef(new Set())
  const wsRef           = useRef(null)

  // ── Dark mode tokens ──────────────────────────────────────────────────────
  const chatBg        = isDark ? "#1a2332" : "white"
  const msgAreaBg     = isDark ? "#0f172a" : "#f7faf8"
  const botMsgBg      = isDark ? "#1e293b" : "white"
  const botMsgBdr     = isDark ? "#2d3748" : "#e9f5ea"
  const botMsgText    = isDark ? "#e5e7eb" : "#1f2937"
  const inputAreaBg   = isDark ? "#111827" : "white"
  const inputBdr      = isDark ? "#2d3748" : "#e9f5ea"
  const inputFieldBg  = isDark ? "#1a2332" : "#f7faf8"
  const inputFieldBdr = isDark ? "#2d3748" : "#d1fae5"
  const chatBorder    = isDark ? "#2d3748" : "#e0f0e8"
  const qrBg          = isDark ? "#1a2332" : "#f9fafb"
  const qrBdr         = isDark ? "#2d3748" : "#d1fae5"
  const qrText        = isDark ? "#d1d5db" : "#374151"
  const dotAvatarBg   = isDark ? "#1e293b" : "white"

  useEffect(() => {
    const handleOpenChat = () => setOpen(true)
    window.addEventListener("bloomora:open-chat", handleOpenChat)
    return () => window.removeEventListener("bloomora:open-chat", handleOpenChat)
  }, [])

  const createSession = useCallback(async () => {
    if (!user) return
    try {
      let currentSessionId = sessionId
      if (!currentSessionId) {
        const data = await api.createSession()
        currentSessionId = data.id
        setSessionId(currentSessionId)
        localStorage.setItem(CHAT_SESSION_KEY, JSON.stringify({ id: currentSessionId }))
      }
      try {
        const history = await api.getChatHistory(currentSessionId)
        if (history && history.length > 0) {
          const formatted = history.map(msg => ({
            id: msg.id,
            from: msg.sender === 'customer' ? 'user' : 'bot',
            text: msg.message,
            image: msg.image_url,
            time: msg.created_at,
          }))
          setMessages([WELCOME_MESSAGE, ...formatted])
        }
      } catch (histErr) {
        console.error('History load error:', histErr)
      }
      if (!wsRef.current) {
        const websocket = new WebSocket(`ws://localhost:8000/api/v1/chats/ws/${currentSessionId}`)
        wsRef.current = websocket
        websocket.onopen = () => console.log('WS connected')
        websocket.onmessage = (event) => {
          const data = JSON.parse(event.data)
          console.log("Raw Message Data from Backend:", data)
          if (data.sender === 'customer') return
          setMessages(prev => {
            const last = prev[prev.length - 1]
            if (last && last.from === 'bot' && last.text === data.message) return prev
            return [...prev, { id: data.id || Date.now(), from: 'bot', text: data.message, image: data.image_url }]
          })
        }
        websocket.onerror = (err) => console.error('WS error:', err)
        websocket.onclose = () => { wsRef.current = null }
      }
    } catch (err) {
      console.error('Session create error:', err)
      setMessages(prev => [...prev, { id: Date.now(), from: 'bot', text: 'Sorry, chat service temporarily unavailable.' }])
    }
  }, [user, sessionId])

  const handleUnsendEveryone = async () => {
    const msgId = unsendModal.msgId
    setUnsendModal({ isOpen: false, msgId: null })
    setMessages(prev => prev.filter(m => m.id !== msgId))
    try {
      await api.deleteChatMessage(msgId)
    } catch (err) {
      console.error(err)
    }
  }

  const handleUnsendForYou = () => {
    setMessages(prev => prev.filter(m => m.id !== unsendModal.msgId))
    setUnsendModal({ isOpen: false, msgId: null })
  }

  const sendMessage = useCallback(async (text, imageData = null) => {
    if ((!text.trim() && !imageData) || !sessionId || sending) return
    const trimmedText = text.trim()
    if (sentMessagesRef.current.has(trimmedText)) return
    sentMessagesRef.current.add(trimmedText)
    setTimeout(() => sentMessagesRef.current.delete(trimmedText), 2000)
    setSending(true)
    setMessages(prev => [...prev, { id: Date.now(), from: "user", text: text || null, image: imageData || null }])
    setInput("")
    setAttachedImage(null)
    setTyping(true)
    try {
      await api.sendMessage(sessionId, text, imageData)
      setTyping(false)
    } catch (err) {
      console.error('Message send error:', err)
      setTyping(false)
    } finally {
      setSending(false)
    }
  }, [sessionId, sending])

  const handleSend = async () => {
    if (!input.trim() && !attachedImage) return
    let imageUrl = null
    if (attachedImage?.file) {
      try {
        const result = await api.uploadChatImage(attachedImage.file)
        imageUrl = result.image_url
      } catch (err) {
        console.error('Image upload failed:', err)
        setMessages(prev => [...prev, { id: Date.now(), from: 'bot', text: 'Failed to upload image. Please try again.' }])
        return
      }
    }
    sendMessage(input, imageUrl)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) return
    setAttachedImage({ file, previewUrl: URL.createObjectURL(file) })
    e.target.value = ""
  }

  const removeAttachment = () => {
    if (attachedImage?.previewUrl) URL.revokeObjectURL(attachedImage.previewUrl)
    setAttachedImage(null)
  }

  useEffect(() => { if (open) createSession() }, [open, createSession])

  useEffect(() => {
    if (!user) {
      localStorage.removeItem(CHAT_SESSION_KEY)
      setSessionId(null)
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
    }
  }, [user])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, typing])

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const { w, h } = SIZES[size]

  return (
    <>
      <style>{`
        @keyframes chatBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
        @keyframes chatFadeUp { from{opacity:0;transform:translateY(20px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        .chat-open { animation: chatFadeUp 0.28s cubic-bezier(0.34,1.56,0.64,1) both; }
        .chat-size-active {
          background-color: white !important;
          color: #0C573E !important;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3) !important;
        }
        .chat-size-inactive {
          background-color: rgba(255,255,255,0.22) !important;
          color: rgba(255,255,255,0.95) !important;
        }
        .chat-size-inactive:hover {
          background-color: rgba(255,255,255,0.35) !important;
        }
      `}</style>

      <div className="fixed bottom-5 right-5 z-50 md:bottom-6 md:right-6 lg:bottom-8 lg:right-8">
        {open ? (
          <div
            className="chat-open flex flex-col rounded-2xl overflow-hidden"
            style={{
              width: `${w}px`, height: `${h}px`,
              backgroundColor: chatBg,
              transition: "width 0.3s cubic-bezier(0.4,0,0.2,1), height 0.3s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: isDark
                ? "0 24px 64px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)"
                : "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)",
              border: `1px solid ${chatBorder}`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${DG} 0%, ${G} 100%)` }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ backgroundColor: "white" }}>
                  <img src={estingsLogo} alt="Esting's" style={{ width: "26px", height: "26px", objectFit: "contain" }} />
                </div>
                <div>
                  <p className="text-white text-sm font-bold leading-tight">Esting's Support</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: sessionId ? "#4ade80" : "#fbbf24" }} />
                    <p className="text-xs leading-tight" style={{ color: "rgba(255,255,255,0.75)" }}>
                      {sessionId ? "Online" : "Connecting..."}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 rounded-lg px-1 py-1"
                  style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                  {["small", "medium", "large"].map(key => (
                    <button key={key} onClick={() => setSize(key)}
                      className={`w-6 h-6 rounded-md text-xs font-bold transition-all duration-200 ${size === key ? "chat-size-active" : "chat-size-inactive"}`}
                      style={{ WebkitTapHighlightColor: "transparent", border: "none", cursor: "pointer" }}
                      title={`${key.charAt(0).toUpperCase() + key.slice(1)} size`}>
                      {key === "small" ? "S" : key === "medium" ? "M" : "L"}
                    </button>
                  ))}
                </div>
                <button onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
                  style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.25)"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.12)"}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ backgroundColor: msgAreaBg }}>
              {messages.map(msg => (
                <div key={msg.id}
                  className={`group flex items-end gap-2 ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.from === "user" && (
                    <button
                      onClick={() => setUnsendModal({ isOpen: true, msgId: msg.id })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-red-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  <div style={{ maxWidth: "78%" }}>
                    {msg.image && (
                      <div className={`mb-1 ${msg.from === "user" ? "flex justify-end" : ""}`}>
                        <img src={msg.image} alt="Attached" className="rounded-xl object-cover"
                          style={{
                            maxWidth: "200px", maxHeight: "160px",
                            borderRadius: msg.from === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            border: msg.from === "bot" ? `1px solid ${botMsgBdr}` : "none",
                          }} />
                      </div>
                    )}
                    {msg.text && (
                      <div className="px-3.5 py-2.5 text-sm leading-relaxed"
                        style={{
                          borderRadius: msg.from === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          backgroundColor: msg.from === "user" ? DG : botMsgBg,
                          color: msg.from === "user" ? "white" : botMsgText,
                          boxShadow: msg.from === "bot" ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                          border: msg.from === "bot" ? `1px solid ${botMsgBdr}` : "none",
                        }}>
                        {msg.text}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {typing && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: dotAvatarBg, border: `1.5px solid ${chatBorder}` }}>
                    <img src={estingsLogo} alt="" style={{ width: "18px", height: "18px", objectFit: "contain" }} />
                  </div>
                  <div className="px-4 py-3 rounded-2xl flex gap-1.5 items-center"
                    style={{ backgroundColor: botMsgBg, border: `1px solid ${botMsgBdr}`, boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: isDark ? "#4ade80" : G, animation: `chatBounce 1s infinite ${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            {messages.length === 1 && size !== "small" && (
              <div className="px-4 py-2.5 flex flex-wrap gap-1.5 border-t"
                style={{ backgroundColor: inputAreaBg, borderColor: inputBdr }}>
                {QUICK_REPLIES.map(q => (
                  <button key={q} onClick={() => sendMessage(q)}
                    className="px-3 py-1.5 text-xs font-medium rounded-full border transition-all"
                    style={{ borderColor: qrBdr, color: qrText, backgroundColor: qrBg }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = isDark ? "#4ade80" : G
                      e.currentTarget.style.color = isDark ? "#4ade80" : G
                      e.currentTarget.style.backgroundColor = isDark ? "rgba(74,222,128,0.08)" : "#f0fdf4"
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = qrBdr
                      e.currentTarget.style.color = qrText
                      e.currentTarget.style.backgroundColor = qrBg
                    }}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Attachment preview */}
            {attachedImage && (
              <div className="px-3 pt-2 flex items-center gap-2 border-t"
                style={{ backgroundColor: inputAreaBg, borderColor: inputBdr }}>
                <div className="relative flex-shrink-0">
                  <img src={attachedImage.previewUrl} alt="Attachment preview"
                    className="rounded-lg object-cover" style={{ width: "52px", height: "52px" }} />
                  <button onClick={removeAttachment}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white shadow"
                    style={{ backgroundColor: "#ef4444" }}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs truncate" style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
                  {attachedImage.file.name}
                </p>
              </div>
            )}

            {/* Input row */}
            <div className="flex items-center gap-2 px-3 py-3 border-t"
              style={{ backgroundColor: inputAreaBg, borderColor: inputBdr }}>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <button onClick={() => fileInputRef.current?.click()} disabled={!user}
                className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 transition-all disabled:opacity-40"
                style={{ border: `1px solid ${inputFieldBdr}`, color: isDark ? "#4ade80" : G, backgroundColor: "transparent" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(74,222,128,0.1)" : "#f0fdf4"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                title="Attach a photo">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              </button>

              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={user ? "Type your message..." : "Please log in to chat"}
                disabled={!user}
                className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-all"
                style={{
                  borderColor: inputFieldBdr,
                  backgroundColor: inputFieldBg,
                  color: isDark ? "#e5e7eb" : "#111827",
                }}
                onFocus={e => e.target.style.borderColor = isDark ? "#4ade80" : G}
                onBlur={e => e.target.style.borderColor = inputFieldBdr} />

              <button onClick={handleSend}
                disabled={(!input.trim() && !attachedImage) || !user || !sessionId || sending}
                className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
                style={{
                  background: ((input.trim() || attachedImage) && user && sessionId && !sending)
                    ? `linear-gradient(135deg,${DG},${G})`
                    : (isDark ? "#1e293b" : "#e5e7eb"),
                }}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          // Floating button
          <button onClick={() => setOpen(true)}
            className="group flex items-center gap-3 px-4 py-3.5 text-white rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              background: `linear-gradient(135deg,${DG} 0%,${G} 100%)`,
              boxShadow: "0 8px 32px rgba(12,87,62,0.35)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 overflow-hidden"
              style={{ backgroundColor: "white" }}>
              <img src={estingsLogo} alt="Esting's" style={{ width: "28px", height: "28px", objectFit: "contain" }} />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm leading-tight">Live Support</p>
              <p className="text-xs leading-tight" style={{ color: "rgba(255,255,255,0.8)" }}>Chat with our team</p>
            </div>
          </button>
        )}

        <UnsendModal
          isOpen={unsendModal.isOpen}
          onClose={() => setUnsendModal({ isOpen: false, msgId: null })}
          onUnsendEveryone={handleUnsendEveryone}
          onUnsendForYou={handleUnsendForYou}
          isDark={isDark}
        />
      </div>
    </>
  )
}