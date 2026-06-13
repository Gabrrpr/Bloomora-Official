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

// 🚀 UPGRADED: Now supports actual images if they exist in your DB
function Avatar({ name = "?", imageUrl, size = 38 }) {
  if (imageUrl) {
    return (
      <img 
        src={imageUrl} 
        alt={name} 
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} 
        className="flex-shrink-0 border shadow-sm"
      />
    );
  }
  
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center rounded-full text-white font-bold shadow-sm"
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
        {/* 🚀 UPGRADED: Passes the image URL to the Avatar */}
        <Avatar name={convo.user_name} imageUrl={convo.user_avatar || convo.profile_picture} size={40} />
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
  const [enlargedImage, setEnlargedImage] = useState(null);

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
    if (!user || !user.token) return;

    let adminId = user.id || user.userId || user._id;

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

    if (!adminId) return;
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

  // 🚀 UPGRADED: Bulletproof Sorting (Latest First) & Advanced Searching
  const safeQuery = (searchQuery || "").toLowerCase().trim();
  const processedConversations = [...(conversations || [])]
    .filter(c => {
      if (!safeQuery) return true;
      const nameMatch = (c.user_name || "").toLowerCase().includes(safeQuery);
      const msgMatch = (c.last_message || "").toLowerCase().includes(safeQuery);
      return nameMatch || msgMatch;
    })
    .sort((a, b) => {
      // Sorts by the most recently updated message time
      const dateA = new Date(a.updated_at || a.last_message_time || a.created_at || 0).getTime();
      const dateB = new Date(b.updated_at || b.last_message_time || b.created_at || 0).getTime();
      return dateB - dateA;
    });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold" style={{ color: bodyTxt }}>Messages</h1>
      <div className="flex rounded-xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, height: "calc(100vh - 180px)" }}>
        
        {/* Sidebar */}
        <div className="w-72 border-r flex flex-col" style={{ borderColor: sidebarBdr }}>
          <input 
            className="m-3 p-2 text-xs border rounded outline-none" 
            style={{ backgroundColor: searchBg, borderColor: searchBdr, color: bodyTxt }} 
            placeholder="Search names or messages..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
          <div className="flex-1 overflow-y-auto">
            {loadingConvos ? (
              <div className="p-5 text-center text-xs" style={{ color: subTxt }}>Loading...</div>
            ) : processedConversations.length === 0 ? (
              <div className="p-5 text-center text-xs" style={{ color: subTxt }}>No conversations found.</div>
            ) : (
              // 🚀 UPGRADED: Maps over the sorted/filtered list
              processedConversations.map(c => (
                <ConvoItem 
                  key={c.customer_id} 
                  convo={c} 
                  isActive={activeId === c.customer_id} 
                  onClick={() => setActiveId(c.customer_id)} 
                  isDark={isDark} 
                />
              ))
            )}
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
                      {!isStaff && (
                        /* 🚀 UPGRADED: Passes image to chat bubbles */
                        <Avatar 
                          name={activeConvo?.user_name || "Customer"} 
                          imageUrl={activeConvo?.user_avatar || activeConvo?.profile_picture} 
                          size={30} 
                        />
                      )}
                      {isStaff && (
                        <button onClick={() => setUnsendModal({ isOpen: true, msgId: msg.id })} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-red-400 hover:text-red-600 mb-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                      <div style={{ maxWidth: "60%" }}>
                        {msg.image && (
                          <img 
                            src={msg.image} 
                            alt="Attachment" 
                            className="rounded-xl cursor-pointer hover:opacity-90 transition-opacity shadow-sm" 
                            style={{ maxWidth: "200px", maxHeight: "200px", objectFit: "cover" }} 
                            onClick={() => setEnlargedImage(msg.image)} /* 🚀 Opens the modal */
                            onError={(e) => e.target.style.display = 'none'} 
                          />
                        )}
                        {msg.text && <div className="px-4 py-2 text-sm shadow-sm" style={{ backgroundColor: isStaff ? DG : bubbleBg, color: isStaff ? "white" : bubbleTxt, borderRadius: "16px" }}>{msg.text}</div>}
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
                  <button onClick={() => fileInputRef.current?.click()} className="text-gray-500 hover:text-gray-700 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  </button>
                  <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }} className="flex-1 p-2.5 text-sm border rounded-lg outline-none" style={{ backgroundColor: inputBg, borderColor: inputBdr, color: bodyTxt }} placeholder="Type a message..." />
                  <button onClick={() => handleSend()} className="px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90 shadow-sm" style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>Send</button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500" style={{ backgroundColor: msgAreaBg }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6" }}>
                <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <p>Select a conversation to start chatting</p>
            </div>
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

      {enlargedImage && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[9999]"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(4px)" }}
          onClick={() => setEnlargedImage(null)} // Clicking background closes it
        >
          <div className="relative max-w-5xl max-h-screen p-4 flex flex-col items-center">
            {/* Close Button */}
            <button 
              className="absolute top-2 right-2 md:top-6 md:right-6 text-white hover:text-gray-300 p-2 rounded-full bg-black/50"
              onClick={(e) => { e.stopPropagation(); setEnlargedImage(null); }}
            >
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* The Image */}
            <img 
              src={enlargedImage} 
              alt="Enlarged" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()} // Clicking the image itself doesn't close it
            />
          </div>
        </div>
      )}
    </div>
  )
}