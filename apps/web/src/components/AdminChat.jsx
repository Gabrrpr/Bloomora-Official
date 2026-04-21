import { useState, useRef, useEffect, useCallback } from "react"
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api.js'

const QUICK_REPLIES_ADMIN = [
  "Thank you for reaching out! How can I help you today?",
  "Your order is being prepared and will be delivered soon.",
  "Same-day delivery is available for orders before 9AM.",
  "We'd love to help you customize a bouquet! What's the occasion?",
  "Our price range starts at ₱500 for small arrangements.",
]

export default function AdminChat() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [loading, setLoading] = useState(true)
  const [ws, setWs] = useState(null)
  const bottomRef = useRef(null)

  const filtered = conversations.filter(c =>
    c.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0)
  const activeConvo = conversations.find(c => c.customer_id === activeId)

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user || !['admin', 'staff'].includes(user.role)) return
    try {
      const data = await api.getConversations()
      setConversations(data.conversations)
    } catch (err) {
      console.error('Fetch conversations error:', err)
    }
  }, [user])

  // Fetch history and mark read
  const fetchHistory = useCallback(async (userId) => {
    try {
      const data = await api.getChatHistory(userId)
      setMessages(data)
      if (activeId !== userId) {
        await api.markRead(userId)
        setConversations(prev => prev.map(c => 
          c.customer_id === userId ? { ...c, unread_count: 0 } : c
        ))
      }
    } catch (err) {
      console.error('Fetch history error:', err)
    }
  }, [activeId])

  // Send message
  const sendMessage = async (text) => {
    if (!text.trim() || !activeId) return
    const userMsg = { 
      id: Date.now(), 
      from: "staff", 
      text, 
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      sender: 'staff'
    }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setShowQuickReplies(false)
    setTyping(true)

    try {
      await api.sendMessage(activeId, text)
      // Backend broadcasts, received via WS
    } catch (err) {
      console.error('Send message error:', err)
      setTyping(false)
    }
  }

  // WS connection
  useEffect(() => {
    if (!user || !user.token || ws) return

    const websocket = new WebSocket(`ws://localhost:8000/api/v1/chats/ws/${user.email}`)
    websocket.onopen = () => {
      console.log('Admin WS connected')
    }
  websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('Admin WS message:', data)
      // Add to active chat if matches
      if (activeId && data.user_id === activeId) {
        setMessages(prev => [...prev, {
          id: data.id,
          from: data.sender === 'customer' ? 'customer' : 'staff',
          text: data.message,
          time: new Date(data.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          sender: data.sender,
          message: data.message
        }])
      }
      // Refresh list
      fetchConversations()
    }
    websocket.onerror = (err) => console.error('WS error:', err)
    websocket.onclose = () => console.log('WS closed')

    setWs(websocket)
    return () => websocket.close()
  }, [user, activeId, fetchConversations, ws])

  // Load data on mount
  useEffect(() => {
    if (user && ['admin', 'staff'].includes(user.role)) {
      fetchConversations().then(() => {
        if (conversations.length === 0) {
          console.log('No conversations found - send test message to self?')
        }
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [fetchConversations, user, conversations])

  // Load history on active change
  useEffect(() => {
    if (activeId) {
      fetchHistory(activeId)
    }
  }, [activeId, fetchHistory])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const selectConversation = (customerId) => {
    setActiveId(customerId)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading conversations...</div>
  }

  if (!user || !['admin', 'staff'].includes(user.role)) {
    return <div className="text-center py-8 text-gray-500">Admin/Staff access required</div>
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col">
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
        <div className="flex-1 overflow-y-auto">
          {filtered.map(c => (
            <button
              key={c.customer_id}
              onClick={() => selectConversation(c.customer_id)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50 ${activeId === c.customer_id ? "bg-green-50" : "hover:bg-gray-50"}`}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" 
                   style={{ backgroundColor: "#0C573E", color: "white" }}>
                {c.user_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-xs font-semibold truncate ${activeId === c.customer_id ? "text-green-800" : "text-gray-800"}`}>{c.user_name}</span>
                  <span className="text-xs text-gray-400">Recent</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 truncate max-w-[140px]">{c.last_message}</p>
                  {c.unread_count > 0 && (
                    <span className="ml-1 flex-shrink-0 w-4 h-4 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">{c.unread_count}</span>
                  )}
                </div>
                {c.recent_orders.length > 0 && (
                  <div className="mt-1 text-xs text-gray-400">
                    Recent: {c.recent_orders[0]?.product || 'Custom'}
                  </div>
                )}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">No conversations match "{searchQuery}"</div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            {activeConvo && (
              <>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" 
                     style={{ backgroundColor: "#0C573E", color: "white" }}>
                  {activeConvo.user_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{activeConvo.user_name}</p>
                  <p className="text-xs text-gray-400">Recent orders: {activeConvo.recent_orders.length}</p>
                </div>
              </>
            )}
            {!activeConvo && <p className="text-sm text-gray-500">Select a conversation</p>}
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500" title="Phone">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3" style={{ backgroundColor: "#f9fafb" }}>
          {messages.map(msg => (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === "staff" ? "justify-end" : "justify-start"}`}>
              {msg.sender !== "staff" && (
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" 
                     style={{ backgroundColor: "#7c3aed" }}>
                  C
                </div>
              )}
              <div className="max-w-[68%]">
                <div
                  className="px-3.5 py-2.5 text-sm leading-relaxed"
                  style={{
                    borderRadius: msg.sender === "staff" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    backgroundColor: msg.sender === "staff" ? "#0C573E" : "white",
                    color: msg.sender === "staff" ? "white" : "#374151",
                    border: msg.sender !== "staff" ? "1px solid #e5e7eb" : "none",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                  }}
                >
                  {msg.message || msg.text}
                </div>
                <p className={`text-xs text-gray-400 mt-1 ${msg.sender === "staff" ? "text-right" : "text-left"}`}>{msg.time || msg.created_at}</p>
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex items-end gap-2 justify-start">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "#7c3aed" }}>
                C
              </div>
              <div className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-2xl rounded-bl-sm flex items-center gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {showQuickReplies && (
          <div className="px-4 py-2 border-t border-gray-100 bg-white flex flex-wrap gap-1.5">
            {QUICK_REPLIES_ADMIN.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-xs px-2.5 py-1 rounded-full border transition-all hover:shadow-sm truncate max-w-xs"
                style={{ borderColor: "#0C573E", color: "#0C573E", backgroundColor: "white" }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

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
            onKeyDown={handleKeyDown}
            placeholder={activeConvo ? `Reply to ${activeConvo.user_name}...` : "Select a conversation"}
            className="flex-1 text-sm outline-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition disabled:opacity-50"
            disabled={!activeId}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || !activeId}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white transition-all flex-shrink-0 disabled:opacity-50"
            style={{ backgroundColor: input.trim() && activeId ? "#0C573E" : "#d1d5db" }}
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
        .animate-bounce {
          animation: bounce 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
