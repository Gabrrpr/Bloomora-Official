import os

CONTENT = r'''import { useState, useRef, useEffect, useCallback } from "react"
import { useAuth } from "../../context/AuthContext"
import { api } from "../../services/api.js"

const DG = "#0C573E"
const G  = "#2E8B34"

const QUICK_REPLIES = [
  "Thank you for reaching out! How can I help you today?",
  "Your order is being prepared and will be delivered soon.",
  "Same-day delivery is available for orders before 9AM.",
  "We'd love to help you customize a bouquet! What's the occasion?",
  "Our price range starts at ₱500 for small arrangements.",
]

// ── Initials avatar ───────────────────────────────────────────────────────────
function InitialsAvatar({ name = "?", size = 38 }) {
  const initials = name
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className="flex-shrink-0 flex items-center justify-center rounded-full text-white font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, ${DG}, ${G})`,
      }}
    >
      {initials || "?"}
    </div>
  )
}

// ── Conversation list item ────────────────────────────────────────────────────
function ConvoItem({ convo, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
      style={{
        backgroundColor: isActive ? "#f0fdf4" : "transparent",
        borderLeft: isActive ? `3px solid ${G}` : "3px solid transparent",
      }}
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
          {convo.last_message_from_staff && (
            <span style={{ color: G }}>You: </span>
          )}
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
  const [activeId, setActiveId]           = useState(null)
  const [messages, setMessages]           = useState([])
  const [input, setInput]                 = useState("")
  const [typing, setTyping]               = useState(false)
  const [searchQuery, setSearchQuery]     = useState("")
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [activeTab, setActiveTab]         = useState("All")
  const [ws, setWs]                       = useState(null)
  const [loadingConvos, setLoadingConvos] = useState(false)
  const [loadingMsgs, setLoadingMsgs]     = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  const activeConvo = conversations.find(c => c.customer_id === activeId)
  const filtered = conversations.filter(c =>
    c.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ── Fetch conversations on mount ────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    setLoadingConvos(true)
    try {
      const data = await api.getConversations()
      const list = Array.isArray(data) ? data : data.conversations || []
      setConversations(list)
    } catch (err) {
      console.error("Failed to load conversations:", err)
    } finally {
      setLoadingConvos(false)
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // ── Fetch chat history when selecting a conversation ────────────────────────
  useEffect(() => {
    if (!activeId) {
      setMessages([])
      return
    }

    const load = async () => {
      setLoadingMsgs(true)
      try {
        const data = await api.getChatHistory(activeId)
        const history = Array.isArray(data)
          ? data.map(m => ({
              id: m.id ?? Date.now() + Math.random(),
              sender: m.sender === "admin" || m.sender === "staff" ? "staff" : "customer",
              text: m.message ?? m.text ?? "",
              time: m.time ?? (m.created_at
                ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })),
            }))
          : []
        setMessages(history)
        await api.markRead(activeId)
        setConversations(prev =>
          prev.map(c =>
            c.customer_id === activeId ? { ...c, unread_count: 0 } : c
          )
        )
      } catch (err) {
        console.error("Failed to load chat history:", err)
      } finally {
        setLoadingMsgs(false)
      }
    }

    load()
  }, [activeId])

  // ── WebSocket connection for real-time messages ────────────────────────────
  useEffect(() => {
    if (!user?.email) return

    const websocket = new WebSocket(`ws://localhost:8000/api/v1/chats/ws/${user.email}`)
    websocket.onopen = () => console.log("Admin WS connected")
    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        const incoming = {
          id: data.id ?? Date.now(),
          sender: data.sender === "admin" || data.sender === "staff" ? "staff" : "customer",
          text: data.message ?? data.text ?? "",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }

        const fromCustomerId = data.customer_id ?? data.user_id

        // If this message belongs to the currently active conversation, append it
        if (fromCustomerId === activeId) {
          setMessages(prev => [...prev, incoming])
        }

        // Update conversation list preview + unread count
        setConversations(prev => {
          const exists = prev.find(c => c.customer_id === fromCustomerId)
          if (exists) {
            return prev.map(c =>
              c.customer_id === fromCustomerId
                ? {
                    ...c,
                    last_message: incoming.text,
                    last_message_from_staff: incoming.sender === "staff",
                    unread_count: fromCustomerId === activeId ? 0 : (c.unread_count ?? 0) + 1,
                    time: incoming.time,
                  }
                : c
            )
          } else {
            // New conversation — add to top
            return [
              {
                customer_id: fromCustomerId,
                user_name: data.user_name ?? data.customer_name ?? "Customer",
                last_message: incoming.text,
                last_message_from_staff: incoming.sender === "staff",
                unread_count: 1,
                time: incoming.time,
              },
              ...prev,
            ]
          }
        })
      } catch (err) {
        console.error("WS message parse error:", err)
      }
    }
    websocket.onerror = (err) => console.error("Admin WS error:", err)
    websocket.onclose = () => console.log("Admin WS closed")
    setWs(websocket)

    return () => { websocket.close() }
  }, [user?.email, activeId])

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    if (!text.trim() || !activeId) return

    const newMsg = {
      id: Date.now(),
      sender: "staff",
      text,
