import { useState, useRef, useEffect, useCallback } from "react"
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api.js'

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

export default function ChatWidget() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [ws, setWs] = useState(null)
  const bottomRef = useRef(null)

  const createSession = useCallback(async () => {
    if (!user || sessionId) return
    try {
      console.log('Creating session for user', user.id)
      const response = await fetch('http://localhost:8000/api/v1/chats/sessions', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({})
      })
      const data = await response.json()
      const newSessionId = data.id
      setSessionId(newSessionId)
`ws://localhost:8000/api/v1/chats/ws/${user.email}`
      websocket.onopen = () => console.log('WS connected')
      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        console.log('WS message:', data)
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
    const userMsg = { id: Date.now(), from: "user", text }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setTyping(true)
    try {
      const response = await fetch('http://localhost:8000/api/v1/chats/messages', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
body: JSON.stringify({ user_id: sessionId, text })
      })
      if (!response.ok) throw new Error('Send failed')
      setTyping(false)
    } catch (err) {
      console.error('Message send error:', err)
      setTyping(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (open) {
      createSession()
    }
    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [open, createSession, ws])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const chatContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ backgroundColor: "#0C573E" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">Esting's Support</p>
            <p className="text-xs leading-tight" style={{ color: "rgba(255,255,255,0.7)" }}>
              {sessionId ? 'Connected' : 'Connecting...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded(e => !e)}
            className="w-7 h-7 flex items-center justify-center rounded transition-colors hover:bg-white hover:bg-opacity-20 text-white"
            title={expanded ? "Minimize" : "Expand"}>
            {expanded ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
          <button onClick={() => setOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded transition-colors hover:bg-white hover:bg-opacity-20 text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ backgroundColor: "#f9fafb" }}>
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
            {msg.from === "bot" && (
              <div className="w-8 h-8 rounded-full flex-shrink-0 mr-2 mt-1 flex items-center justify-center" style={{ backgroundColor: "#2E8B34" }}>
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C12 2 7 5 7 10C7 12.8 9.2 15 12 15C14.8 15 17 12.8 17 10C17 5 12 2 12 2Z" />
                </svg>
              </div>
            )}
            <div className={`px-4 py-2 rounded-2xl text-sm max-w-[80%] ${msg.from === "user" ? "bg-green-600 text-white" : "bg-white border shadow-sm"}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && (
        <div className="px-4 py-3 bg-gray-50 border-t flex flex-wrap gap-2">
          {QUICK_REPLIES.map(q => (
            <button key={q} onClick={() => sendMessage(q)}
              className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors shadow-sm">
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 border-t bg-white flex items-center gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          disabled={!user}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || !user || !sessionId}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md hover:shadow-lg transition-all flex-shrink-0 disabled:opacity-50"
          style={{ backgroundColor: input.trim() && user && sessionId ? "#0C573E" : "#e5e7eb" }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6 lg:right-8 lg:bottom-6" style={{ maxWidth: '380px' }}>
        {open ? (
          <div className={`bg-white shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ${expanded ? 'w-[380px] h-[500px]' : 'w-[340px] h-[480px]'}`} style={{ border: '1px solid #e5e7eb' }}>
            {chatContent}
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="group flex items-center gap-3 p-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 rounded-2xl border border-white/20 backdrop-blur-sm"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all group-hover:scale-110">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">Live Support</p>
              <p className="text-xs opacity-90">Chat with our team</p>
            </div>
          </button>
        )}
      </div>
    </>
  )
}

