import { useState, useRef, useEffect } from "react"

// Simulated incoming customer messages
const INITIAL_CONVERSATIONS = [
  {
    id: 1,
    customer: "Maria Santos",
    avatar: "MS",
    avatarColor: "#e11d48",
    lastMessage: "Hi, I'd like to customize a bouquet for my mom's birthday 🌸",
    time: "2m ago",
    unread: 2,
    online: true,
    messages: [
      { id: 1, from: "customer", text: "Hi! I'd like to order flowers for my mom's birthday.", time: "10:21 AM" },
      { id: 2, from: "customer", text: "Hi, I'd like to customize a bouquet for my mom's birthday 🌸", time: "10:22 AM" },
    ],
  },
  {
    id: 2,
    customer: "Juan dela Cruz",
    avatar: "JD",
    avatarColor: "#7c3aed",
    lastMessage: "Is same-day delivery available today?",
    time: "15m ago",
    unread: 1,
    online: true,
    messages: [
      { id: 1, from: "customer", text: "Hello! Is same-day delivery still available?", time: "10:08 AM" },
      { id: 2, from: "customer", text: "Is same-day delivery available today?", time: "10:09 AM" },
    ],
  },
  {
    id: 3,
    customer: "Ana Reyes",
    avatar: "AR",
    avatarColor: "#d97706",
    lastMessage: "Thank you so much! The flowers were perfect 💐",
    time: "1h ago",
    unread: 0,
    online: false,
    messages: [
      { id: 1, from: "admin", text: "Hi Ana! Your order is on its way 🌸", time: "9:00 AM" },
      { id: 2, from: "customer", text: "Thank you so much! The flowers were perfect 💐", time: "9:45 AM" },
    ],
  },
  {
    id: 4,
    customer: "Pedro Garcia",
    avatar: "PG",
    avatarColor: "#0C573E",
    lastMessage: "What's the price range for wedding arrangements?",
    time: "3h ago",
    unread: 0,
    online: false,
    messages: [
      { id: 1, from: "customer", text: "Good morning! Planning a wedding next month.", time: "7:30 AM" },
      { id: 2, from: "customer", text: "What's the price range for wedding arrangements?", time: "7:31 AM" },
    ],
  },
]

const QUICK_REPLIES_ADMIN = [
  "Thank you for reaching out! How can I help you today?",
  "Your order is being prepared and will be delivered soon.",
  "Same-day delivery is available for orders before 9AM.",
  "We'd love to help you customize a bouquet! What's the occasion?",
  "Our price range starts at ₱500 for small arrangements.",
]

export default function AdminChat() {
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS)
  const [activeId, setActiveId] = useState(1)
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const bottomRef = useRef(null)

  const active = conversations.find(c => c.id === activeId)
  const filtered = conversations.filter(c =>
    c.customer.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [active?.messages])

  const sendMessage = (text) => {
    if (!text.trim()) return
    setConversations(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, messages: [...c.messages, { id: Date.now(), from: "admin", text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }], lastMessage: text, time: "Just now", unread: 0 }
        : c
    ))
    setInput("")
    setShowQuickReplies(false)

    // Simulate customer reply
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setConversations(prev => prev.map(c =>
        c.id === activeId
          ? {
              ...c,
              messages: [...c.messages, {
                id: Date.now() + 1,
                from: "customer",
                text: ["Got it, thank you! 😊", "That's helpful, thanks!", "Perfect! I'll place my order now.", "Thank you for the quick response!"][Math.floor(Math.random() * 4)],
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              }],
              lastMessage: "Customer replied",
              time: "Just now",
            }
          : c
      ))
    }, 1800)
  }

  const selectConversation = (id) => {
    setActiveId(id)
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c))
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Sidebar — conversation list */}
      <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 text-sm">Customer Messages</h2>
            {totalUnread > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white bg-red-500">{totalUnread}</span>
            )}
          </div>
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
            </svg>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search customers..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => selectConversation(c.id)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50 ${activeId === c.id ? "bg-green-50" : "hover:bg-gray-50"}`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: c.avatarColor }}>
                  {c.avatar}
                </div>
                {c.online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-xs font-semibold truncate ${activeId === c.id ? "text-green-800" : "text-gray-800"}`}>{c.customer}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{c.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 truncate">{c.lastMessage}</p>
                  {c.unread > 0 && (
                    <span className="ml-1 flex-shrink-0 w-4 h-4 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">{c.unread}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: active?.avatarColor }}>
                {active?.avatar}
              </div>
              {active?.online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{active?.customer}</p>
              <p className="text-xs text-gray-400">{active?.online ? "Online now" : "Last seen 1h ago"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3" style={{ backgroundColor: "#f9fafb" }}>
          {active?.messages.map(msg => (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.from === "admin" ? "justify-end" : "justify-start"}`}>
              {msg.from === "customer" && (
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mb-0.5" style={{ backgroundColor: active.avatarColor }}>
                  {active.avatar[0]}
                </div>
              )}
              <div className="max-w-[68%]">
                <div
                  className="px-3.5 py-2.5 text-sm leading-relaxed"
                  style={{
                    borderRadius: msg.from === "admin" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    backgroundColor: msg.from === "admin" ? "#0C573E" : "white",
                    color: msg.from === "admin" ? "white" : "#374151",
                    border: msg.from === "customer" ? "1px solid #e5e7eb" : "none",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                  }}
                >
                  {msg.text}
                </div>
                <p className={`text-xs text-gray-400 mt-1 ${msg.from === "admin" ? "text-right" : "text-left"}`}>{msg.time}</p>
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: active?.avatarColor }}>
                {active?.avatar[0]}
              </div>
              <div className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-2xl rounded-bl-sm flex items-center gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400" style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick replies */}
        {showQuickReplies && (
          <div className="px-4 py-2 border-t border-gray-100 bg-white flex flex-wrap gap-1.5">
            {QUICK_REPLIES_ADMIN.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-xs px-2.5 py-1 rounded-full border transition-all hover:shadow-sm truncate max-w-xs"
                style={{ borderColor: "#0C573E", color: "#0C573E", backgroundColor: "white" }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#0C573E"; e.currentTarget.style.color = "white" }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = "#0C573E" }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center gap-2">
          <button
            onClick={() => setShowQuickReplies(p => !p)}
            className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-green-700 flex-shrink-0"
            title="Quick replies"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder={`Reply to ${active?.customer}...`}
            className="flex-1 text-sm outline-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white transition-all flex-shrink-0"
            style={{ backgroundColor: input.trim() ? "#0C573E" : "#d1d5db" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}
