import { useState, useRef, useEffect, useCallback } from "react"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api.js"
import { chatWsUrl } from "../../config/api.js"
import UnsendModal from "../../components/UnsendModal"

const DG = "#0C573E"
const G = "#2E8B34"

// Rotating reassurance messages shown while an image uploads.
const SENDING_MESSAGES = [
  "Sending image… please wait",
  "Still uploading… hang tight",
  "Almost there… just a moment",
  "Working on it… thanks for your patience",
  "Pushing your image through…",
  "Nearly done… please don't close this",
]

// Animated flower shown while the chat is loading.
function FlowerLoader({ message = "Loading...", isDark = false, size = 120, minHeight = "60vh" }) {
  const petals = [
    { angle: 0,   color: "#f48fb1" },
    { angle: 60,  color: "#ec407a" },
    { angle: 120, color: "#e91e63" },
    { angle: 180, color: "#f06292" },
    { angle: 240, color: "#c2185b" },
    { angle: 300, color: "#f48fb1" },
  ]
  return (
    <>
      <style>{`
        @keyframes adminPetalBloom {
          0%, 100% { opacity: 0.2; }
          50%       { opacity: 1;   }
        }
      `}</style>
      <div className="flex flex-col items-center justify-center rounded-xl"
        style={{ minHeight, backgroundColor: isDark ? "#0f172a" : "transparent" }}>
        <svg width={size} height={size} viewBox="0 0 100 100">
          {petals.map(({ angle, color }, i) => (
            <g key={i} transform={`rotate(${angle} 50 50)`}>
              <ellipse cx="50" cy="27" rx="9.5" ry="21" fill={color}
                style={{ animation: `adminPetalBloom 1.4s ease-in-out ${(i * 0.2).toFixed(2)}s infinite`, animationFillMode: "both" }} />
            </g>
          ))}
          <circle cx="50" cy="50" r="12" fill="#2E8B34" />
          <circle cx="50" cy="50" r="7"  fill="#f9c6d0" />
          <circle cx="50" cy="50" r="3.5" fill="#fff" opacity="0.7" />
        </svg>
        <p className="mt-4 text-sm font-medium tracking-wide" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>{message}</p>
      </div>
    </>
  )
}

// Compact circular spinner (distinct from the full-page flower).
function ConvoSpinner({ isDark, label = "Loading conversations…", minHeight = "40vh" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full" style={{ minHeight }}>
      <span style={{ width: 32, height: 32, borderRadius: "9999px", border: `3px solid ${isDark ? "#22324a" : "#e8edf2"}`, borderTopColor: G, display: "inline-block", animation: "convoSpin 0.7s linear infinite" }} />
      <p className="text-xs font-medium" style={{ color: isDark ? "#94a3b8" : "#9ca3af" }}>{label}</p>
    </div>
  )
}

// Rotating sample placeholders for the search box (typewriter effect).
const SEARCH_SAMPLES = ["Search names or messages…", "Find a customer…", "Search a conversation…", "Type a name or keyword…"]

const QUICK_REPLIES = [
  "Thank you for reaching out! How can I help you today?",
  "Your order is being prepared and will be delivered soon.",
  "Same-day delivery is available for orders before 9AM.",
  "We'd love to help you customize a bouquet! What's the occasion?",
  "Our price range starts at ₱500 for small arrangements.",
]

// 🚀 UPGRADED: Product Context UI Bubble
function ProductContextPreview({ contextId, products, onPreview }) {
  if (!contextId) return null;
  const product = (products || []).find(p => String(p.id) === String(contextId));

  if (!product) {
    return (
      <div className="flex items-center gap-3 p-2 mb-1.5 bg-gray-50 border border-gray-200 rounded-lg shadow-sm w-fit opacity-70">
        <div className="w-10 h-10 rounded bg-gray-200 animate-pulse dark:bg-gray-700" />
        <p className="text-xs font-bold text-gray-500 m-0 pr-2">Loading context...</p>
      </div>
    );
  }

  return (
    <button
      onClick={() => onPreview(product)} // 🚀 Triggers the new modal
      className="group flex items-center gap-2.5 p-1.5 pr-2.5 mb-1.5 w-fit max-w-[250px] rounded-xl text-left bg-green-50 border border-green-200 hover:border-green-400 hover:shadow-sm dark:bg-green-900/15 dark:border-green-800/50 dark:hover:border-green-600 transition-all cursor-pointer outline-none"
      title="Click to view product details">
      <img src={product.image_url || product.image} alt={product.name} className="w-11 h-11 rounded-lg object-cover flex-shrink-0 border border-green-200 dark:border-green-800" onError={(e) => { e.target.style.display = 'none' }} />
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-green-700 uppercase tracking-wider mb-0.5 dark:text-green-500">Asking about</p>
        <p className="text-xs font-bold text-green-900 truncate dark:text-green-300">{product.name}</p>
      </div>
      <span className="flex items-center gap-1 ml-1 flex-shrink-0 text-[10px] font-semibold text-green-700 dark:text-green-400 opacity-60 group-hover:opacity-100 transition-opacity">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1 1 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        <span className="hidden sm:inline">View</span>
      </span>
    </button>
  );
}

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
      style={{ width: size, height: size, fontSize: size * 0.36, backgroundColor: G }}
    >
      {initials || "?"}
    </div>
  )
}

function ConvoItem({ convo, isActive, onClick, isDark }) {
  const activeBg = isDark ? "rgba(74,222,128,0.10)" : "#f0fdf4"
  const hoverBg = isDark ? "#1e2d3d" : "#f6faf4"
  const nameTxt = isDark ? "#f1f5f9" : "#1f2937"
  const subTxt = isDark ? "#64748b" : "#9ca3af"
  const timeTxt = isDark ? "#64748b" : "#9ca3af"
  const unread = (convo.unread_count || 0) > 0

  return (
    <button
      onClick={onClick}
      className="group relative w-full flex items-center gap-3 px-3.5 py-2.5 mx-2 my-0.5 rounded-xl text-left transition-all"
      style={{ width: "calc(100% - 16px)", backgroundColor: isActive ? activeBg : "transparent" }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = hoverBg }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent" }}
    >
      {/* Active accent bar */}
      <span className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full transition-all"
        style={{ width: 3, height: isActive ? 26 : 0, backgroundColor: G }} />
      <div className="flex-shrink-0">
        <Avatar name={convo.user_name} imageUrl={convo.user_avatar || convo.profile_picture} size={42} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5 gap-2">
          <span className="text-sm truncate" style={{ color: nameTxt, fontWeight: 500 }}>{convo.user_name}</span>
          <span className="text-[11px] flex-shrink-0" style={{ color: unread ? G : timeTxt, fontWeight: 400 }}>{convo.time || ""}</span>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs truncate flex-1" style={{ color: unread ? nameTxt : subTxt, fontWeight: 400 }}>{convo.last_message || "No messages yet"}</p>
        </div>
      </div>
    </button>
  )
}

function AdminProductModal({ product, onClose, isDark }) {
  if (!product) return null;

  const modalBg = isDark ? "#1e293b" : "white";
  const titleColor = isDark ? "#f1f5f9" : "#111827";
  const subTxt = isDark ? "#94a3b8" : "#6b7280";
  const borderColor = isDark ? "#334155" : "#e5e7eb";
  const chipBg = isDark ? "#0f172a" : "#f0fdf4";
  const inStock = Number(product.stock) > 0;
  const chips = [
    ...(product.occasions || []).slice(0, 3).map(o => ({ key: `o-${o}`, label: o, accent: true })),
    ...(product.branches || []).slice(0, 2).map(b => ({ key: `b-${b}`, label: `📍 ${b}`, accent: false })),
  ];

  return (
    <div onClick={onClose} className="apm-overlay" style={{ position: "fixed", inset: 0, zIndex: 9999, backgroundColor: isDark ? "rgba(0,0,0,0.66)" : "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <style>{`
        @keyframes apmOverlayIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes apmPopIn { from { opacity: 0; transform: translateY(12px) scale(0.97) } to { opacity: 1; transform: none } }
        .apm-overlay { animation: apmOverlayIn 0.18s ease both; }
        .apm-card { animation: apmPopIn 0.22s cubic-bezier(0.2,0.7,0.3,1) both; }
        .apm-scroll::-webkit-scrollbar { width: 6px; }
        .apm-scroll::-webkit-scrollbar-thumb { background: ${isDark ? "#334155" : "#d1d5db"}; border-radius: 9999px; }
      `}</style>
      <div onClick={e => e.stopPropagation()} className="apm-card" style={{ backgroundColor: modalBg, borderRadius: "18px", width: "100%", maxWidth: "384px", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.4)", border: `1px solid ${borderColor}` }}>

        {/* Header & Image */}
        <div style={{ position: "relative", height: "210px", backgroundColor: isDark ? "#0f172a" : "#f3f4f6" }}>
          <img src={product.image_url || product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = 'none' }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent 45%)" }} />
          <button onClick={onClose} aria-label="Close" className="hover:bg-black/80 transition-colors" style={{ position: "absolute", top: "12px", right: "12px", width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.5)", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, backdropFilter: "blur(4px)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6" /></svg>
          </button>
          <span style={{ position: "absolute", left: "12px", bottom: "12px", fontSize: "11px", fontWeight: 700, color: "white", padding: "4px 10px", borderRadius: "9999px", backgroundColor: inStock ? "rgba(46,139,52,0.92)" : "rgba(239,68,68,0.92)", backdropFilter: "blur(4px)" }}>
            {inStock ? `${product.stock} in stock` : "Out of stock"}
          </span>
        </div>

        {/* Details Area */}
        <div style={{ padding: "20px" }}>
          <p style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: G, margin: "0 0 6px 0" }}>
            {product.category || "Product"}
          </p>
          <h2 style={{ fontSize: "19px", fontWeight: 800, color: titleColor, margin: "0 0 12px 0", lineHeight: "1.25" }}>
            {product.name}
          </h2>

          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "14px" }}>
            <span style={{ fontSize: "24px", fontWeight: 900, color: isDark ? "#4ade80" : DG }}>
              ₱{Number(product.price || 0).toLocaleString()}
            </span>
            {product.product_type && <span style={{ fontSize: "12px", color: subTxt }}>· {product.product_type}</span>}
          </div>

          {chips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
              {chips.map(c => (
                <span key={c.key} style={{ fontSize: "11px", fontWeight: 500, color: c.accent ? (isDark ? "#bbf7d0" : "#15803d") : subTxt, backgroundColor: chipBg, padding: "3px 9px", borderRadius: "9999px", border: `1px solid ${borderColor}` }}>
                  {c.label}
                </span>
              ))}
            </div>
          )}

          <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: "12px" }}>
            <p className="apm-scroll" style={{ fontSize: "13px", color: subTxt, lineHeight: "1.6", margin: 0, maxHeight: "108px", overflowY: "auto", whiteSpace: "pre-wrap" }}>
              {product.description || "No specific details provided for this item."}
            </p>
          </div>

          <button onClick={onClose} className="hover:opacity-90 transition-opacity" style={{ marginTop: "16px", width: "100%", padding: "10px", fontSize: "13px", fontWeight: 700, color: "white", backgroundColor: G, border: "none", borderRadius: "10px", cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
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
  const [sendingMsgIdx, setSendingMsgIdx] = useState(0)
  const [unsendModal, setUnsendModal] = useState({ isOpen: false, msgId: null });
  const [searchQuery, setSearchQuery] = useState("")
  const [searchPh, setSearchPh] = useState("")
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [loadingConvos, setLoadingConvos] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [typing, setTyping] = useState(false)
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);
  // Full-page flower loader on first load, then a gentle ease-in (played once).
  const [initialLoading, setInitialLoading] = useState(true);
  const [entered, setEntered] = useState(false);
  
  // 🚀 NEW: State for products to perform the lookup
  const [allProducts, setAllProducts] = useState([]);

  const fileInputRef = useRef(null)

  // Rotate the "sending" reassurance text every ~1.6s while an upload is in flight.
  useEffect(() => {
    if (!sending) { setSendingMsgIdx(0); return }
    const t = setInterval(() => {
      setSendingMsgIdx(i => (i + 1) % SENDING_MESSAGES.length)
    }, 1600)
    return () => clearInterval(t)
  }, [sending])

  // Typewriter placeholder in the search box: types a sample, pauses, deletes, then
  // the next one — looping while the box is empty. Stops once the user types.
  useEffect(() => {
    if (searchQuery) { setSearchPh(""); return }
    let sample = 0, ch = 0, deleting = false, timer
    const tick = () => {
      const full = SEARCH_SAMPLES[sample]
      ch += deleting ? -1 : 1
      setSearchPh(full.slice(0, ch))
      if (!deleting && ch === full.length) { deleting = true; timer = setTimeout(tick, 1600); return }
      if (deleting && ch === 0) { deleting = false; sample = (sample + 1) % SEARCH_SAMPLES.length }
      timer = setTimeout(tick, deleting ? 45 : 90)
    }
    timer = setTimeout(tick, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const wsRef = useRef(null)
  const activeIdRef = useRef(activeId)

  useEffect(() => { activeIdRef.current = activeId }, [activeId])

  // 🚀 NEW: Fetch all products on mount
  useEffect(() => {
    api.getAdminProducts()
      .then(data => setAllProducts(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

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
  const bubbleBdr = isDark ? "#334155" : "#eef2f0"
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
    if (sending) return;
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
        id: msg.id, 
        sender: msg.sender === 'customer' ? 'customer' : 'staff', 
        text: msg.message, 
        image: msg.image_url, 
        time: msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : '',
        context_id: msg.context_id // 🚀 ADDED mapping
      }))
      setMessages(msgs)
    } finally { setLoadingMsgs(false) }
  }, [])

  const loadConversations = useCallback(async () => {
    setLoadingConvos(true)
    try {
      const data = await api.getConversations()
      setConversations(data.conversations || [])
    } finally { setLoadingConvos(false); setInitialLoading(false) }
  }, [])

  // ── Effects ──
  useEffect(() => { if (activeId) loadMessages(activeId) }, [activeId, loadMessages])
  // When switching conversations, jump to the latest instantly (no visible scroll
  // travel). New messages within the open conversation still scroll smoothly.
  const justSwitchedRef = useRef(false)
  useEffect(() => { justSwitchedRef.current = true }, [activeId])
  useEffect(() => {
    if (!messages.length) return
    bottomRef.current?.scrollIntoView({ behavior: justSwitchedRef.current ? "auto" : "smooth" })
    justSwitchedRef.current = false
  }, [messages])
  useEffect(() => { if (user) loadConversations() }, [loadConversations, user])

  // Safety net: never leave the flower loader up for more than a moment.
  useEffect(() => {
    const t = setTimeout(() => setInitialLoading(false), 1500)
    return () => clearTimeout(t)
  }, [])

  // Play the entrance animation once loaded, then turn it off so it never replays.
  useEffect(() => {
    if (initialLoading) return
    const t = setTimeout(() => setEntered(true), 1100)
    return () => clearTimeout(t)
  }, [initialLoading])

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
            context_id: data.context_id // 🚀 ADDED mapping
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


  const safeQuery = (searchQuery || "").toLowerCase().trim();
  const processedConversations = [...(conversations || [])]
    .filter(c => {
      if (!safeQuery) return true;
      const nameMatch = (c.user_name || "").toLowerCase().includes(safeQuery);
      const msgMatch = (c.last_message || "").toLowerCase().includes(safeQuery);
      return nameMatch || msgMatch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || a.last_message_time || a.created_at || 0).getTime();
      const dateB = new Date(b.updated_at || b.last_message_time || b.created_at || 0).getTime();
      return dateB - dateA;
    });

  // While conversations are loading for the first time, show the flower loader.
  if (initialLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold" style={{ color: bodyTxt }}>Messages</h1>
        <FlowerLoader message="Loading messages..." isDark={isDark} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Gentle fade + rise so content eases in once loaded instead of flashing. */}
      <style>{`
        @keyframes chatRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .chat-rise { animation: chatRise 0.85s ease-out both; }
        @keyframes convoSpin { to { transform: rotate(360deg); } }
      `}</style>

      <h1 className={`text-xl font-bold ${entered ? "" : "chat-rise"}`} style={{ color: bodyTxt }}>Messages</h1>
      <div className={`flex rounded-2xl overflow-hidden shadow-sm ${entered ? "" : "chat-rise"}`} style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, height: "calc(100vh - 180px)", animationDelay: "0.18s" }}>

        {/* Sidebar — full width on mobile, hidden once a conversation is open */}
        <div className={`${activeId ? "hidden sm:flex" : "flex"} w-full sm:w-72 border-r flex-col`} style={{ borderColor: sidebarBdr }}>
          {/* Search */}
          <div className="p-3 pb-2">
            <div className="flex items-center gap-2 px-3 rounded-xl" style={{ backgroundColor: searchBg, border: `1px solid ${searchBdr}` }}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke={mutedTxt} strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m21 21-4.3-4.3" /></svg>
              <input
                className="flex-1 py-2.5 text-xs bg-transparent outline-none"
                style={{ color: bodyTxt }}
                placeholder={searchQuery ? "" : `${searchPh}|`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="flex-shrink-0 text-xs" style={{ color: mutedTxt }}>✕</button>
              )}
            </div>
          </div>
          <div className="px-4 pb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: mutedTxt }}>Conversations</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: subTxt, backgroundColor: isDark ? "#0f172a" : "#f1f5f9" }}>{conversations.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto pb-2">
            {loadingConvos && conversations.length === 0 ? (
              <ConvoSpinner isDark={isDark} />
            ) : processedConversations.length === 0 ? (
              <div className="p-5 text-center text-xs" style={{ color: subTxt }}>No conversations found.</div>
            ) : (
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

        {/* Chat Area — hidden on mobile until a conversation is selected */}
        <div className={`${activeId ? "flex" : "hidden sm:flex"} flex-1 flex-col min-w-0`}>
          {activeId ? (
            <>
              {/* Mobile-only header with a back button to the conversation list */}
              <div className="sm:hidden flex items-center gap-2 px-3 py-2.5 border-b flex-shrink-0" style={{ borderColor: headerBdr, backgroundColor: headerBg }}>
                <button onClick={() => setActiveId(null)} aria-label="Back to conversations" className="p-1.5 rounded-md" style={{ color: subTxt }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <Avatar name={activeConvo?.user_name || "Customer"} imageUrl={activeConvo?.user_avatar || activeConvo?.profile_picture} size={30} />
                <span className="text-sm font-semibold truncate" style={{ color: bodyTxt }}>{activeConvo?.user_name || "Customer"}</span>
              </div>
              {/* Desktop header showing the active conversation's name */}
              <div className="hidden sm:flex items-center gap-3 px-6 py-3 border-b flex-shrink-0" style={{ borderColor: headerBdr, backgroundColor: headerBg }}>
                <div className="flex-shrink-0">
                  <Avatar name={activeConvo?.user_name || "Customer"} imageUrl={activeConvo?.user_avatar || activeConvo?.profile_picture} size={40} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: bodyTxt }}>{activeConvo?.user_name || "Customer"}</p>
                  <p className="text-xs truncate" style={{ color: subTxt }}>{activeConvo?.user_email || "Customer"}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5" style={{ backgroundColor: msgAreaBg }}>
                {loadingMsgs ? (
                  <ConvoSpinner isDark={isDark} label="Loading messages…" minHeight="60vh" />
                ) : (
                <div className="space-y-4">
                {messages.map((msg) => {
                  const isStaff = msg.sender === "staff";
                  return (
                    <div key={msg.id} className={`group flex items-end gap-2.5 ${isStaff ? "justify-end" : "justify-start"}`}>
                      {!isStaff && (
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
                        {/* 🚀 UPGRADED: Renders the Context Bubble if an ID exists! */}
                        {msg.context_id && (
                          <div className={msg.from === "user" ? "flex justify-end" : "flex justify-start"}>
                            <ProductContextPreview 
                              contextId={msg.context_id} 
                              products={allProducts} 
                              onPreview={(selectedProduct) => setPreviewProduct(selectedProduct)} // 🚀 Add this!
                            />
                          </div>
                        )}
                        
                        {msg.image && (
                          <img 
                            src={msg.image} 
                            alt="Attachment" 
                            className="rounded-xl cursor-pointer hover:opacity-90 transition-opacity shadow-sm mb-1" 
                            style={{ maxWidth: "200px", maxHeight: "200px", objectFit: "cover" }} 
                            onClick={() => setEnlargedImage(msg.image)} 
                            onError={(e) => e.target.style.display = 'none'} 
                          />
                        )}
                        {msg.text && (
                          <div className="px-4 py-2.5 text-sm leading-relaxed"
                            style={{
                              backgroundColor: isStaff ? DG : bubbleBg,
                              color: isStaff ? "white" : bubbleTxt,
                              border: isStaff ? "none" : `1px solid ${bubbleBdr}`,
                              borderRadius: isStaff ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                            }}>
                            {msg.text}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 sm:p-4 border-t" style={{ backgroundColor: toolbarBg, borderColor: toolbarBdr }}>
                {attachedImage && (
                  <div className="mb-2.5 flex items-center gap-2">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-sm" style={{ border: `1px solid ${inputBdr}` }}>
                      <img src={attachedImage.previewUrl} className="w-full h-full object-cover" alt="Preview" />
                      {sending && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                          <svg className="w-6 h-6 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        </div>
                      )}
                      {!sending && (
                        <button onClick={removeAttachment} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-black/80 transition-colors">×</button>
                      )}
                    </div>
                    {sending && (
                      <span key={sendingMsgIdx} className="text-xs font-medium sending-msg-fade" style={{ color: subTxt }}>{SENDING_MESSAGES[sendingMsgIdx]}</span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} disabled={sending} />
                  <button onClick={() => fileInputRef.current?.click()} disabled={sending}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ color: G, backgroundColor: isDark ? "#0f172a" : "#f0fdf4" }}
                    onMouseEnter={e => { if (!sending) e.currentTarget.style.backgroundColor = isDark ? "#15233a" : "#dcfce7" }}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? "#0f172a" : "#f0fdf4"}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  </button>
                  <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }} disabled={sending} className="flex-1 px-4 py-2.5 text-sm rounded-full outline-none transition-all focus:ring-2 focus:ring-green-500/30 disabled:opacity-60" style={{ backgroundColor: inputBg, border: `1px solid ${inputBdr}`, color: bodyTxt }} placeholder="Type a message..." />
                  <button onClick={() => handleSend()} disabled={sending}
                    className="flex-shrink-0 px-5 py-2.5 text-sm font-bold text-white rounded-full transition-all hover:opacity-90 disabled:opacity-70 disabled:cursor-wait flex items-center gap-2"
                    style={{ backgroundColor: G }}>
                    {sending && (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: msgAreaBg }}>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: isDark ? "#0f172a" : "#f0fdf4", color: G }}>
                <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <p className="text-base font-semibold mb-1" style={{ color: bodyTxt }}>Your messages</p>
              <p className="text-sm" style={{ color: subTxt }}>Select a conversation to start chatting</p>
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
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-5xl max-h-screen p-4 flex flex-col items-center">
            <button 
              className="absolute top-2 right-2 md:top-6 md:right-6 text-white hover:text-gray-300 p-2 rounded-full bg-black/50"
              onClick={(e) => { e.stopPropagation(); setEnlargedImage(null); }}
            >
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={enlargedImage} 
              alt="Enlarged" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
      <AdminProductModal 
        product={previewProduct} 
        onClose={() => setPreviewProduct(null)} 
        isDark={isDark} 
      />
    </div>
  )
}
