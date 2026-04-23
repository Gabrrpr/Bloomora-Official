import { useState, useRef, useEffect, useCallback } from "react"
import { useAuth } from "../../context/AuthContext"

const DG = "#0C573E"
const G  = "#2E8B34"

const QUICK_REPLIES = [
  "Thank you for reaching out! How can I help you today?",
  "Your order is being prepared and will be delivered soon.",
  "Same-day delivery is available for orders before 9AM.",
  "We'd love to help you customize a bouquet! What's the occasion?",
  "Our price range starts at ₱500 for small arrangements.",
]

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name = "?", size = 40 }) {
  return (
    <div className="flex-shrink-0 flex items-center justify-center rounded-full"
      style={{ width: size, height: size, backgroundColor: DG }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="white">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
      </svg>
    </div>
  )
}

// ── Conversation list item ────────────────────────────────────────────────────
function ConvoItem({ convo, isActive, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b"
      style={{
        backgroundColor: isActive ? "#f3f4f6" : "transparent",
        borderColor: "#f3f4f6",
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = "#f9fafb" }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent" }}>
      <div className="relative flex-shrink-0">
        <Avatar name={convo.user_name} size={40} />
        {convo.unread_count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-800 truncate">{convo.user_name}</span>
          <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">{convo.time || "· 1m"}</span>
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5">{convo.last_message || "..."}</p>
      </div>
    </button>
  )
}

export default function AdminChat() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId]           = useState(null)
  const [messages, setMessages]           = useState([])
  const [input, setInput]                 = useState("")
  const [typing, setTyping]               = useState(false)
  const [searchQuery, setSearchQuery]     = useState("")
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [activeTab, setActiveTab]         = useState("All")
  const [loading, setLoading]             = useState(false)
  const bottomRef = useRef(null)

  const activeConvo = conversations.find(c => c.customer_id === activeId)
  const filtered = conversations.filter(c => c.user_name?.toLowerCase().includes(searchQuery.toLowerCase()))

  const sendMessage = (text) => {
    if (!text.trim() || !activeId) return
    setMessages(prev => [...prev, {
      id: Date.now(), sender: "staff", text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }])
    setInput("")
    setShowQuickReplies(false)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typing])

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Messages</h1>

      {/* Two-panel layout */}
      <div className="flex rounded-xl overflow-hidden bg-white" style={{ border: "1px solid #e8edf2", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", height: "calc(100vh - 180px)", minHeight: "560px" }}>

        {/* ── LEFT: Conversation list ── */}
        <div className="flex flex-col flex-shrink-0" style={{ width: "320px", borderRight: "1px solid #f1f5f9" }}>

          {/* Search */}
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
              </svg>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none transition-all"
                style={{ border: "1px solid #e8edf2", backgroundColor: "#f9fafb" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.10)`; e.target.style.backgroundColor = "white" }}
                onBlur={e => { e.target.style.borderColor = "#e8edf2"; e.target.style.boxShadow = "none"; e.target.style.backgroundColor = "#f9fafb" }} />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid #f1f5f9" }}>
            {[
              { label: "All", count: conversations.length },
              { label: "Open" },
              { label: "Pending", count: 2 },
            ].map(tab => (
              <button key={tab.label} onClick={() => setActiveTab(tab.label)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  backgroundColor: activeTab === tab.label ? "#1f2937" : "transparent",
                  color: activeTab === tab.label ? "white" : "#6b7280",
                  border: activeTab === tab.label ? "none" : "1px solid #e8edf2",
                }}>
                {tab.label}
                {tab.count !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: activeTab === tab.label ? "rgba(255,255,255,0.25)" : "#f1f5f9", color: activeTab === tab.label ? "white" : "#6b7280" }}>
                    {tab.count > 9 ? "9+" : tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map(c => (
                <ConvoItem key={c.customer_id} convo={c} isActive={activeId === c.customer_id} onClick={() => setActiveId(c.customer_id)} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto" style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>
                  <svg className="w-6 h-6" style={{ color: DG }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">No conversations yet</p>
                <p className="text-xs text-gray-400 mt-1">Customer messages will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Chat area ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeConvo ? (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
                style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "white" }}>
                <div className="flex items-center gap-3">
                  <Avatar name={activeConvo.user_name} size={44} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-gray-900">{activeConvo.user_name}</p>
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: "#dcfce7", color: "#15803d" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Open
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Customer ID: {activeConvo.customer_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-gray-100 transition-all text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ backgroundColor: "#f9fafb" }}>
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                    <p className="text-sm text-gray-400">No messages yet</p>
                    <p className="text-xs text-gray-400 mt-1">Start the conversation below</p>
                  </div>
                )}

                {messages.map((msg, i) => {
                  const isStaff = msg.sender === "staff"
                  return (
                    <div key={msg.id} className={`flex items-end gap-2.5 ${isStaff ? "justify-end" : "justify-start"}`}>
                      {!isStaff && <Avatar name={activeConvo.user_name} size={32} />}
                      <div style={{ maxWidth: "65%" }}>
                        <div className="px-4 py-2.5 text-sm leading-relaxed"
                          style={{
                            borderRadius: isStaff ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                            backgroundColor: isStaff ? DG : "white",
                            color: isStaff ? "white" : "#1f2937",
                            boxShadow: isStaff ? "0 2px 8px rgba(12,87,62,0.20)" : "0 1px 3px rgba(0,0,0,0.08)",
                          }}>
                          {msg.text}
                        </div>
                        <div className={`flex items-center gap-1.5 mt-1 ${isStaff ? "justify-end" : "justify-start"}`}>
                          <p className="text-[10px] text-gray-400">{msg.time}</p>
                          {isStaff && i === messages.length - 1 && (
                            <p className="text-[10px] text-gray-400">Seen</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {typing && (
                  <div className="flex items-end gap-2.5 justify-start">
                    <Avatar name={activeConvo.user_name} size={32} />
                    <div className="px-4 py-3 bg-white rounded-2xl rounded-bl-sm flex items-center gap-1.5"
                      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                      {[0,1,2].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full bg-gray-400"
                          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick replies */}
              {showQuickReplies && (
                <div className="px-4 py-2 flex flex-wrap gap-1.5" style={{ borderTop: "1px solid #f1f5f9", backgroundColor: "white" }}>
                  {QUICK_REPLIES.map(q => (
                    <button key={q} onClick={() => sendMessage(q)}
                      className="text-xs px-3 py-1.5 rounded-full border transition-all hover:shadow-sm truncate"
                      style={{ borderColor: G, color: G, backgroundColor: "#f0fdf4", maxWidth: "280px" }}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input area */}
              <div className="flex-shrink-0" style={{ borderTop: "1px solid #f1f5f9", backgroundColor: "white" }}>
                {/* Text input row */}
                <div className="flex items-center gap-2 px-4 py-3">
                  <button onClick={() => setShowQuickReplies(p => !p)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-all text-gray-400 flex-shrink-0"
                    title="Quick replies">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </button>
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Write a reply..."
                    className="flex-1 px-4 py-2.5 text-sm rounded-xl outline-none transition-all"
                    style={{ border: "1px solid #e8edf2", backgroundColor: "#f9fafb" }}
                    onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.10)`; e.target.style.backgroundColor = "white" }}
                    onBlur={e => { e.target.style.borderColor = "#e8edf2"; e.target.style.boxShadow = "none"; e.target.style.backgroundColor = "#f9fafb" }} />
                  <button onClick={() => sendMessage(input)} disabled={!input.trim()}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
                    style={{ background: input.trim() ? `linear-gradient(135deg, ${DG}, ${G})` : "#d1d5db", boxShadow: input.trim() ? "0 2px 8px rgba(12,87,62,0.25)" : "none" }}>
                    Send
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>

                {/* Action buttons row */}
                <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
                  <button className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-lg transition-all hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
                    View Order Details
                  </button>
                  <button className="px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all hover:bg-gray-50"
                    style={{ borderColor: "#e8edf2", color: "#374151" }}>
                    Mark as Resolved
                  </button>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-gray-400">Assign to</span>
                    <div className="relative">
                      <select className="appearance-none pl-3 pr-7 py-1.5 text-xs border rounded-lg bg-white cursor-pointer outline-none"
                        style={{ borderColor: "#e8edf2" }}>
                        <option>Employee</option>
                        <option>Manila Staff</option>
                        <option>Pampanga Staff</option>
                      </select>
                      <svg className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* No conversation selected */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>
                <svg className="w-8 h-8" style={{ color: DG }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-700">Select a conversation</p>
              <p className="text-sm text-gray-400 mt-1">Choose a customer from the list to view their messages</p>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>
    </div>
  )
}
