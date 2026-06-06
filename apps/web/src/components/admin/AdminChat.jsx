import { useState, useRef, useEffect, useCallback } from "react"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api.js"
import { chatWsUrl } from "../../config/api.js"
import UnsendModal from "../../components/UnsendModal"

const DG = "#0C573E"
const G = "#2E8B34"

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

function ConvoItem({ convo, isActive, onClick, isDark }) {
  const activeBg = isDark ? "rgba(74,222,128,0.08)" : "#f0fdf4"
  const activeBdr = isDark ? "#4ade80" : G
  const hoverBg = isDark ? "#1e2d3d" : "#f9fafb"
  const nameTxt = isDark ? "#f1f5f9" : "#1f2937"
  const subTxt = isDark ? "#64748b" : "#9ca3af"
  const timeTxt = isDark ? "#64748b" : "#9ca3af"

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
      style={{ backgroundColor: isActive ? activeBg : "transparent", borderLeft: isActive ? `3px solid ${activeBdr}` : "3px solid transparent" }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = hoverBg }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent" }}
    >
      <div className="relative flex-shrink-0">
        <InitialsAvatar name={convo.user_name} size={40} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm font-semibold truncate" style={{ color: nameTxt }}>{convo.user_name}</span>
          <span className="text-[11px] flex-shrink-0 ml-2" style={{ color: timeTxt }}>{convo.time || ""}</span>
        </div>
        <p className="text-xs truncate" style={{ color: subTxt }}>{convo.last_message || "No messages yet"}</p>
      </div>
    </button>
  )
}

export default function AdminChat() {
  const { user } = useAuth()
  const { isDark } = useTheme()

  // ── State ──
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [attachedImage, setAttachedImage] = useState(null)
  const [sending, setSending] = useState(false)
  const [unsendModal, setUnsendModal] = useState({ isOpen: false, msgId: null });
  const [searchQuery, setSearchQuery] = useState("")
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [activeTab, setActiveTab] = useState("All")
  const [loadingConvos, setLoadingConvos] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [typing, setTyping] = useState(false)

  const fileInputRef = useRef(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const wsRef = useRef(null)
  const activeIdRef = useRef(activeId)

  useEffect(() => { activeIdRef.current = activeId }, [activeId])

  // ── UI Tokens ──
  const cardBg = isDark ? "#1a2332" : "white"
  const cardBdr = isDark ? "#1e293b" : "#e8edf2"
  const sidebarBdr = isDark ? "#1e293b" : "#f1f5f9"
  const headerBg = isDark ? "#1e293b" : "white"
  const headerBdr = isDark ? "#1e293b" : "#f1f5f9"
  const bodyTxt = isDark ? "#f1f5f9" : "#111827"
  const subTxt = isDark ? "#94a3b8" : "#6b7280"
  const mutedTxt = isDark ? "#64748b" : "#9ca3af"
  const msgAreaBg = isDark ? "#0f172a" : "#f9fafb"
  const bubbleBg = isDark ? "#1e293b" : "white"
  const bubbleTxt = isDark ? "#e2e8f0" : "#1f2937"
  const inputBg = isDark ? "#0f172a" : "#f9fafb"
  const inputBdr = isDark ? "#334155" : "#e5e7eb"
  const toolbarBg = isDark ? "#1e293b" : "white"
  const toolbarBdr = isDark ? "#1e293b" : "#f1f5f9"
  const searchBg = isDark ? "#111827" : "#f9fafb"
  const searchBdr = isDark ? "#334155" : "#e8edf2"

  const activeConvo = conversations.find(c => c.customer_id === activeId);

  // ── Handlers ──
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) return
    setAttachedImage({ file, previewUrl: URL.createObjectURL(file) })
  }

  const removeAttachment = () => {
    if (attachedImage?.previewUrl) URL.revokeObjectURL(attachedImage.previewUrl)
    setAttachedImage(null)
  }

  const handleUnsendEveryone = async () => {
    const msgId = unsendModal.msgId;
    setUnsendModal({ isOpen: false, msgId: null });
    setMessages(prev => prev.filter(m => m.id !== msgId));
    try { await api.deleteChatMessage(msgId); } catch (err) { console.error(err); }
  }

  const handleUnsendForYou = () => {
    setMessages(prev => prev.filter(m => m.id !== unsendModal.msgId));
    setUnsendModal({ isOpen: false, msgId: null });
  }

  const handleSend = async (quickReplyText = null) => {
    const textToSend = typeof quickReplyText === 'string' ? quickReplyText : input;
    if (!textToSend.trim() && !attachedImage) return;
    if (!activeId) return;

    setSending(true);
    let imageUrl = null;
    if (attachedImage?.file) {
      try {
        const result = await api.uploadChatImage(attachedImage.file);
        imageUrl = result.image_url;
      } catch (err) { alert("Failed to upload image."); setSending(false); return; }
    }

    const newMsg = { id: Date.now(), sender: "staff", text: textToSend, image: imageUrl, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages(prev => [...prev, newMsg]);
    setInput(""); setAttachedImage(null); setShowQuickReplies(false);
    try { await api.sendMessage(activeId, textToSend, imageUrl); } catch (err) { console.error(err); } finally { setSending(false); }
  }

  const loadMessages = useCallback(async (customerId) => {
    if (!customerId) return
    setLoadingMsgs(true)
    try {
      const data = await api.getChatHistory(customerId)
      const msgs = (data || []).map(msg => ({
        id: msg.id, sender: msg.sender === 'customer' ? 'customer' : 'staff', text: msg.message, image: msg.image_url, time: msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : '',
      }))
      setMessages(msgs)
    } finally { setLoadingMsgs(false) }
  }, [])

  const loadConversations = useCallback(async () => {
    setLoadingConvos(true)
    try {
      const data = await api.getConversations()
      setConversations(data.conversations || [])
    } finally { setLoadingConvos(false) }
  }, [])

  // ── Effects ──
  useEffect(() => { if (activeId) loadMessages(activeId) }, [activeId, loadMessages])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])
  useEffect(() => { if (user) loadConversations() }, [loadConversations, user])

  // WebSocket Logic
  useEffect(() => {
    // 1. Don't run if user or token is missing
    if (!user || !user.token) {
      return;
    }

    // 2. Identify ID from standard locations
    let adminId = user.id || user.userId || user._id;

    // 3. Fallback: Try to decode from token if ID isn't in user object
    if (!adminId) {
      try {
        const base64Url = user.token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = JSON.parse(window.atob(base64));
        adminId = jsonPayload.sub || jsonPayload.id;
      } catch (e) {
        console.error("Failed to decode token for WebSocket:", e);
      }
    }

    // 4. CRITICAL: Stop here if we still don't have an ID
    if (!adminId) {
      console.warn("WebSocket aborted: Could not find user ID in:", user);
      return;
    }

    // 5. Only connect if we have an ID and aren't already connected
    if (wsRef.current) return;

    const wsUrl = chatWsUrl(adminId, user.token);
    const websocket = new WebSocket(wsUrl);
    wsRef.current = websocket;

    websocket.onopen = () => console.log("WebSocket Connected");
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const incomingId = String(data.customer_id || data.user_id || data.sender_id);
      
      if (activeIdRef.current && incomingId === String(activeIdRef.current)) {
        setMessages(prev => [...prev, {
            id: data.id,
            sender: 'customer',
            text: data.message || data.text,
            image: data.image_url,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }]);
      }
      loadConversations();
    };

    websocket.onerror = (err) => console.error('Admin WS error:', err);
    websocket.onclose = () => { wsRef.current = null; };

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, [user, loadConversations]);

  const TABS = [
    { label: "All", count: conversations.length },
    { label: "Unread", count: conversations.filter(c => c.unread_count > 0).length },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold" style={{ color: bodyTxt }}>Messages</h1>
      <div className="flex rounded-xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, height: "calc(100vh - 180px)" }}>
        
        {/* Sidebar */}
        <div className="w-72 border-r flex flex-col" style={{ borderColor: sidebarBdr }}>
          <input className="m-3 p-2 text-xs border rounded" style={{ backgroundColor: searchBg, borderColor: searchBdr, color: bodyTxt }} placeholder="Search..." onChange={(e) => setSearchQuery(e.target.value)} />
          <div className="flex-1 overflow-y-auto">
            {conversations.filter(c => c.user_name?.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
              <ConvoItem key={c.customer_id} convo={c} isActive={activeId === c.customer_id} onClick={() => setActiveId(c.customer_id)} isDark={isDark} />
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeId ? (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4" style={{ backgroundColor: msgAreaBg }}>
                {messages.map((msg) => {
                  const isStaff = msg.sender === "staff";
                  return (
                    <div key={msg.id} className={`group flex items-end gap-2.5 ${isStaff ? "justify-end" : "justify-start"}`}>
                      {!isStaff && <InitialsAvatar name={activeConvo?.user_name || "Customer"} size={30} />}
                      {isStaff && (
                        <button onClick={() => setUnsendModal({ isOpen: true, msgId: msg.id })} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-red-400 hover:text-red-600 mb-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                      <div style={{ maxWidth: "60%" }}>
                        {msg.image && (
                          <img src={msg.image} alt="" className="rounded-xl" 
                            style={{ maxWidth: "200px", maxHeight: "200px", objectFit: "cover" }} 
                            onError={(e) => e.target.style.display = 'none'} />
                        )}
                        {msg.text && <div className="px-4 py-2 text-sm" style={{ backgroundColor: isStaff ? DG : bubbleBg, color: isStaff ? "white" : bubbleTxt, borderRadius: "16px" }}>{msg.text}</div>}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t" style={{ backgroundColor: toolbarBg, borderColor: toolbarBdr }}>
                {attachedImage && (
                  <div className="mb-2 relative w-16 h-16 border rounded-lg overflow-hidden">
                    <img src={attachedImage.previewUrl} className="w-full h-full object-cover" alt="Preview" />
                    <button onClick={removeAttachment} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs">×</button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
                  <button onClick={() => fileInputRef.current?.click()}>📎</button>
                  <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} className="flex-1 p-2 border rounded" placeholder="Type a message..." />
                  <button onClick={() => handleSend()} className="px-4 py-2 bg-green-700 text-white rounded">Send</button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">Select a conversation</div>
          )}
        </div>
      </div>

      <UnsendModal 
        isOpen={unsendModal.isOpen}
        onClose={() => setUnsendModal({ isOpen: false, msgId: null })}
        onUnsendEveryone={handleUnsendEveryone}
        onUnsendForYou={handleUnsendForYou}
        isDark={isDark}
      />
    </div>
  )
}
