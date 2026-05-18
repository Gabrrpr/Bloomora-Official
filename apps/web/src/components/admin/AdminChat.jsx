import { useState, useRef, useEffect, useCallback } from "react"
import { useAuth } from "../../context/AuthContext"
import { api } from "../../services/api.js"

const DG = "#0C573E"
const G  = "#2E8B34"

// Should be customizable by admin in the future, but for now these are some common replies we can offer with one click to speed up response time and maintain consistency in communication
const QUICK_REPLIES = [
  "Thank you for reaching out! How can I help you today?",
  "Your order is being prepared and will be delivered soon.",
  "Same-day delivery is available for orders before 9AM.",
  "We'd love to help you customize a bouquet! What's the occasion?",
  "Our price range starts at ₱500 for small arrangements.",
]

function InitialsAvatar({ name = "?", size = 38 }) {
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center rounded-full text-white font-bold"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(135deg, ${DG}, ${G})` }}
    >
      {initials || "?"}
    </div>
  )
}

function ConvoItem({ convo, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
      style={{ backgroundColor: isActive ? "#f0fdf4" : "transparent", borderLeft: isActive ? `3px solid ${G}` : "3px solid transparent" }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = "#f9fafb" }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent" }}
    >
      <div className="relative flex-shrink-0">
        <InitialsAvatar name={convo.user_name} size={40} />
        {convo.unread_count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm font-semibold text-gray-800 truncate">{convo.user_name}</span>
          <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">{convo.time || ""}</span>
        </div>
        <p className="text-xs text-gray-400 truncate">
          {convo.last_message_from_staff && <span style={{ color: G }}>You: </span>}
          {convo.last_message || "No messages yet"}
        </p>
      </div>
      {convo.unread_count > 0 && (
        <span
          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
          style={{ backgroundColor: G }}
        >
          {convo.unread_count > 9 ? "9+" : convo.unread_count}
        </span>
      )}
    </button>
  )
}

export default function AdminChat() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [activeTab, setActiveTab] = useState("All")
  const [ws, setWs] = useState(null)
  const [loadingConvos, setLoadingConvos] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const wsRef = useRef(null)
  const activeIdRef = useRef(activeId)

  const activeConvo = conversations.find(c => c.customer_id === activeId)
  const filtered = conversations.filter(c => c.user_name?.toLowerCase().includes(searchQuery.toLowerCase()))

  // ── Load conversations ────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!user || !['admin', 'staff'].includes(user.role)) return
    setLoadingConvos(true)
    try {
      const data = await api.getConversations()
      const convos = data.conversations || []
      setConversations(convos)
    } catch (err) {
      console.error('Load conversations error:', err)
    } finally {
      setLoadingConvos(false)
    }
  }, [user])

  // ── Load messages for active conversation ─────────────────────────────────
  const loadMessages = useCallback(async (customerId) => {
    if (!customerId) return
    setLoadingMsgs(true)
    try {
      const data = await api.getChatHistory(customerId)
      const msgs = (data || []).map(msg => ({
        id: msg.id,
        sender: msg.sender === 'customer' ? 'customer' : 'staff',
        text: msg.message,
        time: msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : '',
      }))
      setMessages(msgs)
      // Mark as read
      await api.markRead(customerId)
      setConversations(prev => prev.map(c =>
        c.customer_id === customerId ? { ...c, unread_count: 0 } : c
      ))
    } catch (err) {
      console.error('Load messages error:', err)
    } finally {
      setLoadingMsgs(false)
    }
  }, [])

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    if (!text.trim() || !activeId) return
    const newMsg = {
      id: Date.now(),
      sender: "staff",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages(prev => [...prev, newMsg])
    setInput("")
    setShowQuickReplies(false)
    inputRef.current?.focus()
    
    // MOVE TO TOP LOGIC: Bump conversation to top when admin replies
    setConversations(prev => {
      const index = prev.findIndex(c => c.customer_id === activeId);
      if (index === -1) return prev;
      
      const newConvos = [...prev];
      const updatedConvo = { 
        ...newConvos[index], 
        last_message: text, 
        last_message_from_staff: true, 
        time: newMsg.time 
      };
      // Remove from old position and push to the very beginning
      newConvos.splice(index, 1);
      newConvos.unshift(updatedConvo);
      return newConvos;
    });

    try {
      await api.sendMessage(activeId, text)
    } catch (err) {
      console.error("Failed to send message:", err)
    }
  }

  // Sync activeIdRef
  useEffect(() => { activeIdRef.current = activeId }, [activeId])

  // ── WebSocket connection ──────────────────────────────────────────────────

  console.log("Current User Object:", user);

useEffect(() => {
    // 1. Try to find the ID the normal way
    let adminId = user?.id || user?.userId || user?._id; 
    
    // 2. THE SILVER BULLET: If the ID is missing, crack open the JWT token and grab it!
    if (!adminId && user?.token) {
      try {
        // JWTs have 3 parts separated by dots. The middle part is the payload data.
        const base64Url = user.token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decodedToken = JSON.parse(jsonPayload);
        adminId = decodedToken.sub; // FastAPI stores the user ID in the "sub" field
        console.log("🔓 Successfully extracted Admin ID from token:", adminId);
      } catch (e) {
        console.error("Failed to extract ID from token:", e);
      }
    }

    // 3. Updated Guard Clause
    if (!adminId || !['admin', 'staff'].includes(user?.role)) {
        console.warn("WebSocket Connection Blocked: Missing ID or incorrect role.", { user, adminId });
        return;
    }
    
    // Prevent duplicate connections
    if (wsRef.current) return;

    // 4. Connect using the guaranteed ID
    // 4. Connect using the guaranteed ID AND the Token!
    console.log(`Attempting to connect Admin WS with ID: ${adminId}`);
    
    // Add the token to the URL so the Python backend lets you in!
    const wsUrl = `ws://localhost:8000/api/v1/chats/ws/${adminId}?token=${user.token}`;
    const websocket = new WebSocket(wsUrl);
    
    wsRef.current = websocket;

    websocket.onopen = () => console.log('✅ Admin WS connected to server!');
    websocket.onmessage = (event) => {
      // ... (keep your existing onmessage logic here) ...
      const data = JSON.parse(event.data);
      console.log('📬 Admin WS message received:', data);

      const incomingId = String(data.customer_id || data.user_id || data.sender_id);
      const currentActiveId = activeIdRef.current ? String(activeIdRef.current) : null;

      if (currentActiveId && incomingId === currentActiveId) {
        setMessages(prev => {
          if (prev.find(m => String(m.id) === String(data.id))) return prev;
          return [...prev, {
            id: data.id,
            sender: 'customer',
            text: data.message || data.text,
            time: new Date(data.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }];
        });
      }

      setConversations(prev => {
        const index = prev.findIndex(c => String(c.customer_id) === incomingId);
        if (index !== -1) {
          const newConvos = [...prev];
          const updatedConvo = {
            ...newConvos[index],
            last_message: data.message || data.text,
            last_message_from_staff: false,
            time: new Date(data.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            unread_count: incomingId === currentActiveId ? 0 : (newConvos[index].unread_count || 0) + 1
          };
          newConvos.splice(index, 1);
          newConvos.unshift(updatedConvo); 
          return newConvos;
        } else {
          loadConversations();
          return prev;
        }
      });
    };
    
    websocket.onerror = (err) => console.error('❌ Admin WS error:', err);
    websocket.onclose = (event) => { 
        console.log(`🚪 Admin WS Closed. Code: ${event.code}, Reason: ${event.reason}`);
        wsRef.current = null; 
    };

    setWs(websocket);
    
    // THE SAFE CLEANUP: Only close if it's completely open, otherwise let the browser drop it naturally
    return () => {
        if (websocket.readyState === WebSocket.OPEN) {
            websocket.close();
        }
    };
  }, [user, loadConversations]);
  // ── Load conversations on mount ───────────────────────────────────────────
  useEffect(() => {
    if (user && ['admin', 'staff'].includes(user.role)) {
      loadConversations()
    }
  }, [loadConversations, user])

  // ── Load messages when active conversation changes ────────────────────────
  useEffect(() => {
    if (activeId) {
      loadMessages(activeId)
    }
  }, [activeId, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typing])

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const TABS = [
    { label: "All", count: conversations.length },
    { label: "Unread", count: conversations.filter(c => c.unread_count > 0).length },
    { label: "Unassigned", count: 0 },
    { label: "Archived", count: 0 },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Messages</h1>
      <div
        className="flex rounded-xl overflow-hidden bg-white"
        style={{ border: "1px solid #e8edf2", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", height: "calc(100vh - 180px)", minHeight: "560px" }}
      >
        {/* Sidebar */}
        <div className="flex flex-col flex-shrink-0" style={{ width: "300px", borderRight: "1px solid #f1f5f9" }}>
          <div className="px-3 pt-3 pb-2" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <div className="relative mb-2.5">
              <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
              </svg>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg outline-none transition-all"
                style={{ border: "1px solid #e8edf2", backgroundColor: "#f9fafb" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.backgroundColor = "white" }}
                onBlur={e => { e.target.style.borderColor = "#e8edf2"; e.target.style.backgroundColor = "#f9fafb" }}
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              {TABS.map(tab => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(tab.label)}
                  className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
                  style={{ backgroundColor: activeTab === tab.label ? DG : "transparent", color: activeTab === tab.label ? "white" : "#6b7280" }}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className="px-1 rounded-full text-[9px] font-bold"
                      style={{ backgroundColor: activeTab === tab.label ? "rgba(255,255,255,0.25)" : "#e5e7eb", color: activeTab === tab.label ? "white" : "#6b7280" }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto relative">
            {loadingConvos && conversations.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
              </div>
            )}
            {filtered.length > 0 ? (
              filtered.map(c => (
                <ConvoItem
                  key={c.customer_id}
                  convo={c}
                  isActive={activeId === c.customer_id}
                  onClick={() => setActiveId(c.customer_id)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>
                  <svg className="w-6 h-6" style={{ color: DG }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">{searchQuery ? "No matches found" : "No conversations yet"}</p>
                <p className="text-xs text-gray-400 mt-1">{searchQuery ? "Try a different search term" : "Customer messages will appear here"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Main chat panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeConvo ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "white" }}>
                <div className="flex items-center gap-3">
                  <InitialsAvatar name={activeConvo.user_name} size={38} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">{activeConvo.user_name}</p>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: "#dcfce7", color: "#15803d" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        online
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">Customer #{activeConvo.customer_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4" style={{ backgroundColor: "#f9fafb" }}>
                {loadingMsgs && messages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
                  </div>
                )}
                {messages.length === 0 && !loadingMsgs && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-sm text-gray-400">No messages in this conversation yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Start the conversation below.</p>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isStaff = msg.sender === "staff"
                  const showSeen = isStaff && i === messages.length - 1
                  return (
                    <div key={msg.id} className={`flex items-end gap-2.5 ${isStaff ? "justify-end" : "justify-start"}`}>
                      {!isStaff && <InitialsAvatar name={activeConvo.user_name} size={30} />}
                      <div style={{ maxWidth: "60%" }}>
                        <div
                          className="px-4 py-2.5 text-sm leading-relaxed"
                          style={{
                            borderRadius: isStaff ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                            backgroundColor: isStaff ? DG : "white",
                            color: isStaff ? "white" : "#1f2937",
                            boxShadow: isStaff ? "0 2px 8px rgba(12,87,62,0.18)" : "0 1px 3px rgba(0,0,0,0.08)",
                          }}
                        >
                          {msg.text}
                        </div>
                        <div className={`flex items-center gap-1.5 mt-1 ${isStaff ? "justify-end" : "justify-start"}`}>
                          <p className="text-[10px] text-gray-400">{msg.time}</p>
                          {showSeen && <p className="text-[10px]" style={{ color: G }}>✓✓</p>}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {typing && (
                  <div className="flex items-end gap-2.5 justify-start">
                    <InitialsAvatar name={activeConvo.user_name} size={30} />
                    <div
                      className="px-4 py-3 bg-white rounded-2xl rounded-bl-sm flex items-center gap-1.5"
                      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
                    >
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-gray-400"
                          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick replies */}
              {showQuickReplies && (
                <div className="px-4 py-2.5 flex flex-wrap gap-1.5 border-t" style={{ backgroundColor: "white", borderColor: "#f1f5f9" }}>
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

              {/* Input bar */}
              <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid #f1f5f9", backgroundColor: "white" }}>
                <button
                  onClick={() => setShowQuickReplies(p => !p)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:bg-green-50 text-gray-400 hover:text-green-700 flex-shrink-0"
                  title="Quick replies"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Reply to ${activeConvo.user_name}...`}
                  className="flex-1 text-sm outline-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim()}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-white transition-all flex-shrink-0 disabled:opacity-50"
                  style={{ backgroundColor: input.trim() ? DG : "#d1d5db" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>
                <svg className="w-8 h-8" style={{ color: DG }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">Select a conversation</p>
              <p className="text-xs text-gray-400 mt-1">Choose a customer from the sidebar to start chatting</p>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>
    </div>
  )
}