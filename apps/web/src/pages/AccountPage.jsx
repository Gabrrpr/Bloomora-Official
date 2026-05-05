import { useState, useRef, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import Footer from "../components/Footer"

const G  = "#2E8B34"
const DG = "#0C573E"
const API_BASE = "http://localhost:8000/api/v1"

const MENU_ITEMS = [
  { id: "overview", label: "Overview",         d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id: "orders",   label: "My Orders",        d: "M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" },
  { id: "wishlist", label: "Wishlist",          d: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" },
  { id: "details",  label: "Personal Details",  d: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" },
  { id: "address",  label: "Address Book",     d: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" },
  { id: "password", label: "Change Password",  d: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" },
  { id: "settings", label: "Preferences",      d: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z M15 12a3 3 0 11-6 0 3 3 0 016 0Z" },
]

// ── Reusable input ─────────────────────────────────────────────────────────────
function Field({ label, type = "text", value, onChange, placeholder, readOnly }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className="w-full px-4 py-2.5 text-sm text-gray-800 rounded-lg border outline-none transition-all"
        style={{ borderColor: readOnly ? "#f0f0f0" : "#e5e7eb", backgroundColor: readOnly ? "#fafafa" : "white" }}
        onFocus={e => { if (!readOnly) { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 3px ${G}18`; } }}
        onBlur={e => { e.target.style.borderColor = readOnly ? "#f0f0f0" : "#e5e7eb"; e.target.style.boxShadow = "none"; }}
      />
    </div>
  )
}

function SectionHeader({ title, description }) {
  return (
    <div className="mb-6 pb-4" style={{ borderBottom: "1px solid #f0f0f0" }}>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {description && <p className="text-sm text-gray-400 mt-0.5">{description}</p>}
    </div>
  )
}

function PrimaryBtn({ children, onClick, type = "button", disabled }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
      style={{ backgroundColor: DG }}>
      {children}
    </button>
  )
}

function GhostBtn({ children, onClick }) {
  return (
    <button onClick={onClick}
      className="px-6 py-2.5 text-sm font-semibold rounded-lg border transition-all hover:bg-gray-50"
      style={{ borderColor: "#e5e7eb", color: "#6b7280" }}>
      {children}
    </button>
  )
}

function useToast() {
  const [toast, setToast] = useState(null)
  const show = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }
  return [toast, show]
}

function Toast({ message }) {
  if (!message) return null
  return (
    <div className="fixed bottom-6 right-6 z-[9998] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium"
      style={{ backgroundColor: DG, animation: "fadeUp 0.3s ease both" }}>
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      {message}
    </div>
  )
}

// ── Overview panel ─────────────────────────────────────────────────────────────
function OverviewPanel({ user, setPanel }) {
  return (
    <div className="space-y-8">
      <SectionHeader title="Account Overview" description="Manage your personal information and preferences." />
      <div className="flex items-center gap-5 p-5 rounded-xl" style={{ backgroundColor: "#f8f9fa", border: "1px solid #efefef" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${G}, ${DG})` }}>
          {user?.firstName?.[0]?.toUpperCase() || "U"}
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
          <p className="text-sm text-gray-400">{user?.email}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "My Orders",        id: "orders",   icon: "M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" },
          { label: "Wishlist",         id: "wishlist", icon: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" },
          { label: "Address Book",     id: "address",  icon: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" },
          { label: "Personal Details", id: "details",  icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" },
          { label: "Change Password",  id: "password", icon: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" },
          { label: "Preferences",      id: "settings", icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z M15 12a3 3 0 11-6 0 3 3 0 016 0Z" },
        ].map(item => (
          <button key={item.id} onClick={() => setPanel(item.id)}
            className="flex items-center gap-3 p-4 rounded-xl text-left transition-all hover:shadow-sm"
            style={{ border: "1px solid #efefef", backgroundColor: "white" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${G}60`; e.currentTarget.style.backgroundColor = "#f8fffe"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#efefef"; e.currentTarget.style.backgroundColor = "white"; }}>
            <svg className="w-4 h-4 flex-shrink-0" style={{ color: G }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Orders panel ───────────────────────────────────────────────────────────────
function OrdersPanel({ onNavigate }) {
  return (
    <div>
      <SectionHeader title="My Orders" description="Track and manage your recent purchases." />
      <div className="flex flex-col items-center py-16 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: "#f3f4f6" }}>
          <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
          </svg>
        </div>
        <p className="text-base font-semibold text-gray-700 mb-1">No orders yet</p>
        <p className="text-sm text-gray-400 mb-6">When you place an order, it will appear here.</p>
        <PrimaryBtn onClick={() => onNavigate?.("shop")}>Browse Our Shop</PrimaryBtn>
      </div>
    </div>
  )
}

// ── Wishlist panel ─────────────────────────────────────────────────────────────
function WishlistPanel({ onNavigate }) {
  return (
    <div>
      <SectionHeader title="Wishlist" description="Items you've saved for later." />
      <div className="flex flex-col items-center py-16 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: "#f3f4f6" }}>
          <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
        </div>
        <p className="text-base font-semibold text-gray-700 mb-1">Your wishlist is empty</p>
        <p className="text-sm text-gray-400 mb-6">Save items you love by clicking the heart icon on any product.</p>
        <PrimaryBtn onClick={() => onNavigate?.("shop")}>Explore Products</PrimaryBtn>
      </div>
    </div>
  )
}

// ── Personal Details panel ─────────────────────────────────────────────────────
function DetailsPanel({ user, showToast }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName:  user?.lastName  || "",
    email:     user?.email     || "",
    phone:     user?.phoneNumber || "",
  })
  const fileRef = useRef(null)
  const [avatar, setAvatar] = useState(null)

  const handleSave = () => {
    setEditing(false)
    showToast("Details updated successfully")
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) setAvatar(URL.createObjectURL(file))
  }

  return (
    <div>
      <SectionHeader title="Personal Details" description="Update your name, email, and contact information." />
      <div className="flex items-center gap-5 mb-8 pb-6" style={{ borderBottom: "1px solid #f0f0f0" }}>
        <div className="relative">
          {avatar
            ? <img src={avatar} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
            : <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${G}, ${DG})` }}>
                {user?.firstName?.[0]?.toUpperCase() || "U"}
              </div>
          }
          <button onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white shadow"
            style={{ backgroundColor: DG }} title="Change photo">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{user?.firstName} {user?.lastName}</p>
          <button onClick={() => fileRef.current?.click()} className="text-xs mt-0.5 hover:underline" style={{ color: G }}>
            Change profile photo
          </button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Field label="First Name"    value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} readOnly={!editing} />
        <Field label="Last Name"     value={form.lastName}  onChange={e => setForm({ ...form, lastName: e.target.value })}  readOnly={!editing} />
        <Field label="Email Address" value={form.email}     onChange={e => setForm({ ...form, email: e.target.value })}     readOnly={!editing} type="email" />
        <Field label="Phone Number"  value={form.phone}     onChange={e => setForm({ ...form, phone: e.target.value })}     readOnly={!editing} placeholder="e.g. +63 900 000 0000" />
      </div>
      <div className="flex items-center gap-3">
        {editing ? (
          <>
            <PrimaryBtn onClick={handleSave}>Save Changes</PrimaryBtn>
            <GhostBtn onClick={() => setEditing(false)}>Cancel</GhostBtn>
          </>
        ) : (
          <PrimaryBtn onClick={() => setEditing(true)}>Edit Details</PrimaryBtn>
        )}
      </div>
    </div>
  )
}

// ── Address Book panel ─────────────────────────────────────────────────────────
function AddressPanel({ showToast }) {
  const { user } = useAuth()
  const token = user?.token

  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const emptyForm = {
    label: "", recipient_name: "", phone: "",
    street: "", barangay: "", city: "", province: "", zip_code: "", is_default: false,
  }
  const [form, setForm] = useState(emptyForm)

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  // Load addresses on mount
  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch(`${API_BASE}/addresses/`, { headers: authHeaders })
      .then(r => r.json())
      .then(data => setAddresses(data.addresses || []))
      .catch(() => showToast("Failed to load addresses"))
      .finally(() => setLoading(false))
  }, [token])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  const handleSave = async () => {
    if (!form.recipient_name || !form.street || !form.city || !form.province) {
      showToast("Please fill in all required fields")
      return
    }
    setSaving(true)
    try {
      const url = editingId
        ? `${API_BASE}/addresses/${editingId}`
        : `${API_BASE}/addresses/`
      const method = editingId ? "PATCH" : "POST"
      const res = await fetch(url, { method, headers: authHeaders, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Failed to save address")

      if (editingId) {
        setAddresses(prev => prev.map(a => a.id === editingId ? data.address : a))
        showToast("Address updated")
      } else {
        // If new address is default, clear others in local state too
        if (form.is_default) {
          setAddresses(prev => prev.map(a => ({ ...a, is_default: false })))
        }
        setAddresses(prev => [...prev, data.address])
        showToast("Address saved")
      }
      resetForm()
    } catch (e) {
      showToast(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (addr) => {
    setForm({
      label:          addr.label          || "",
      recipient_name: addr.recipient_name || "",
      phone:          addr.phone          || "",
      street:         addr.street         || "",
      barangay:       addr.barangay       || "",
      city:           addr.city           || "",
      province:       addr.province       || "",
      zip_code:       addr.zip_code       || "",
      is_default:     addr.is_default     || false,
    })
    setEditingId(addr.id)
    setShowForm(true)
  }

  const handleRemove = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/addresses/${id}`, { method: "DELETE", headers: authHeaders })
      if (!res.ok) throw new Error("Failed to delete address")
      setAddresses(prev => prev.filter(a => a.id !== id))
      showToast("Address removed")
    } catch {
      showToast("Failed to remove address")
    }
  }

  const handleSetDefault = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/addresses/${id}/set-default`, { method: "PATCH", headers: authHeaders })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Failed to set default")
      setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })))
      showToast("Default address updated")
    } catch {
      showToast("Failed to set default address")
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: "1px solid #f0f0f0" }}>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Address Book</h2>
          <p className="text-sm text-gray-400 mt-0.5">Manage your saved delivery addresses.</p>
        </div>
        {!showForm && (
          <button onClick={() => { resetForm(); setShowForm(true) }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: DG }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Address
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 p-5 rounded-xl" style={{ border: `1px solid ${G}40`, backgroundColor: "#f8fffe" }}>
          <p className="text-sm font-semibold text-gray-700 mb-4">
            {editingId ? "Edit Address" : "New Address"}
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <Field label="Label (e.g. Home, Office)"
              value={form.label}
              onChange={e => setForm({ ...form, label: e.target.value })}
              placeholder="Home" />
            <Field label="Recipient Name *"
              value={form.recipient_name}
              onChange={e => setForm({ ...form, recipient_name: e.target.value })}
              placeholder="Juan dela Cruz" />
            <Field label="Phone *"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="+63 900 000 0000" />
            <Field label="Street Address *"
              value={form.street}
              onChange={e => setForm({ ...form, street: e.target.value })}
              placeholder="123 Rizal St." />
            <Field label="Barangay"
              value={form.barangay}
              onChange={e => setForm({ ...form, barangay: e.target.value })}
              placeholder="Barangay 1" />
            <Field label="City / Municipality *"
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })}
              placeholder="Manila" />
            <Field label="Province *"
              value={form.province}
              onChange={e => setForm({ ...form, province: e.target.value })}
              placeholder="Metro Manila" />
            <Field label="ZIP Code"
              value={form.zip_code}
              onChange={e => setForm({ ...form, zip_code: e.target.value })}
              placeholder="1000" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 mb-4 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={e => setForm({ ...form, is_default: e.target.checked })}
              className="rounded"
              style={{ accentColor: G }}
            />
            Set as default address
          </label>
          <div className="flex gap-3">
            <PrimaryBtn onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Address"}
            </PrimaryBtn>
            <GhostBtn onClick={resetForm}>Cancel</GhostBtn>
          </div>
        </div>
      )}

      {/* Address list */}
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading addresses...</div>
      ) : addresses.length === 0 && !showForm ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "#f3f4f6" }}>
            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-600 mb-1">No saved addresses</p>
          <p className="text-xs text-gray-400">Add a delivery address for faster checkout.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {addresses.map(addr => (
            <div key={addr.id}
              className="flex items-start justify-between p-4 rounded-xl transition-all"
              style={{
                border: `1px solid ${addr.is_default ? G + "50" : "#efefef"}`,
                backgroundColor: addr.is_default ? "#f8fffe" : "white",
              }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {addr.label && (
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: G }}>
                      {addr.label}
                    </p>
                  )}
                  {addr.is_default && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white" style={{ backgroundColor: G }}>
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-800">{addr.recipient_name}</p>
                <p className="text-sm text-gray-500">{addr.phone}</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {addr.street}{addr.barangay ? `, ${addr.barangay}` : ""}
                </p>
                <p className="text-sm text-gray-500">
                  {addr.city}, {addr.province}{addr.zip_code ? ` ${addr.zip_code}` : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                <button onClick={() => handleEdit(addr)}
                  className="text-xs font-medium hover:underline transition-colors"
                  style={{ color: G }}>
                  Edit
                </button>
                {!addr.is_default && (
                  <button onClick={() => handleSetDefault(addr.id)}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    Set default
                  </button>
                )}
                <button onClick={() => handleRemove(addr.id)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Password panel ─────────────────────────────────────────────────────────────
function PasswordPanel({ showToast }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" })
  const [error, setError] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    setError("")
    if (!form.current) { setError("Please enter your current password."); return }
    if (form.next.length < 8) { setError("New password must be at least 8 characters."); return }
    if (form.next !== form.confirm) { setError("New passwords do not match."); return }
    setForm({ current: "", next: "", confirm: "" })
    showToast("Password updated successfully")
  }

  return (
    <div>
      <SectionHeader title="Change Password" description="Choose a strong password to protect your account." />
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <Field label="Current Password"     type="password" value={form.current}  onChange={e => setForm({ ...form, current: e.target.value })}  placeholder="Enter current password" />
        <Field label="New Password"         type="password" value={form.next}     onChange={e => setForm({ ...form, next: e.target.value })}     placeholder="At least 8 characters" />
        <Field label="Confirm New Password" type="password" value={form.confirm}  onChange={e => setForm({ ...form, confirm: e.target.value })}  placeholder="Repeat new password" />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="pt-1">
          <PrimaryBtn type="submit">Update Password</PrimaryBtn>
        </div>
      </form>
    </div>
  )
}

// ── Settings panel ─────────────────────────────────────────────────────────────
function SettingsPanel({ showToast }) {
  const [prefs, setPrefs] = useState({ orders: true, marketing: false, sms: false })
  const toggle = (key) => {
    setPrefs(p => ({ ...p, [key]: !p[key] }))
    showToast("Preferences saved")
  }
  const rows = [
    { key: "orders",    label: "Order notifications", desc: "Email updates about your orders and deliveries" },
    { key: "marketing", label: "Promotions & offers",  desc: "Be the first to know about deals and new arrivals" },
    { key: "sms",       label: "SMS alerts",           desc: "Receive delivery updates via text message" },
  ]
  return (
    <div>
      <SectionHeader title="Preferences" description="Manage your notification and communication settings." />
      <div className="divide-y" style={{ borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0" }}>
        {rows.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <button onClick={() => toggle(key)}
              className="relative flex-shrink-0 w-11 h-6 rounded-full ml-6 transition-colors duration-200"
              style={{ backgroundColor: prefs[key] ? G : "#d1d5db" }}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                style={{ left: prefs[key] ? "22px" : "2px" }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main AccountPage ───────────────────────────────────────────────────────────
export default function AccountPage({ onNavigate }) {
  const { user, logout } = useAuth()
  const [panel, setPanel] = useState("overview")
  const [toast, showToast] = useToast()

  const handleLogout = () => { logout(); onNavigate("login") }

  const renderPanel = () => {
    switch (panel) {
      case "overview": return <OverviewPanel user={user} setPanel={setPanel} onNavigate={onNavigate} />
      case "orders":   return <OrdersPanel onNavigate={onNavigate} />
      case "wishlist": return <WishlistPanel onNavigate={onNavigate} />
      case "details":  return <DetailsPanel user={user} showToast={showToast} />
      case "address":  return <AddressPanel showToast={showToast} />
      case "password": return <PasswordPanel showToast={showToast} />
      case "settings": return <SettingsPanel showToast={showToast} />
      default:         return <OverviewPanel user={user} setPanel={setPanel} onNavigate={onNavigate} />
    }
  }

  return (
    <>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div className="min-h-screen" style={{ backgroundColor: "#f7f7f7" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex gap-7 items-start">

            {/* ── Sidebar ── */}
            <aside className="w-56 flex-shrink-0 hidden md:flex flex-col gap-1 sticky top-28">
              <div className="px-4 py-3 mb-1">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Account</p>
                <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{user?.firstName} {user?.lastName}</p>
              </div>
              {MENU_ITEMS.map(item => (
                <button key={item.id} onClick={() => setPanel(item.id)}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm rounded-lg transition-all duration-150"
                  style={{
                    color:           panel === item.id ? DG : "#6b7280",
                    fontWeight:      panel === item.id ? 600 : 400,
                    backgroundColor: panel === item.id ? `${G}12` : "transparent",
                  }}
                  onMouseEnter={e => { if (panel !== item.id) e.currentTarget.style.backgroundColor = "#f3f4f6"; }}
                  onMouseLeave={e => { if (panel !== item.id) e.currentTarget.style.backgroundColor = "transparent"; }}>
                  <svg className="w-4 h-4 flex-shrink-0"
                    style={{ color: panel === item.id ? G : "#9ca3af" }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.6">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.d} />
                  </svg>
                  {item.label}
                </button>
              ))}
              <div className="mt-2 pt-3" style={{ borderTop: "1px solid #e9e9e9" }}>
                <button onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 rounded-lg transition-all hover:bg-red-50">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </aside>

            {/* ── Content ── */}
            <main className="flex-1 min-w-0">
              {/* Mobile tabs */}
              <div className="md:hidden mb-4 overflow-x-auto flex gap-2 pb-1">
                {MENU_ITEMS.map(item => (
                  <button key={item.id} onClick={() => setPanel(item.id)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={{ backgroundColor: panel === item.id ? DG : "#f3f4f6", color: panel === item.id ? "white" : "#6b7280" }}>
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-xl p-6 sm:p-8" style={{ border: "1px solid #ebebeb" }}>
                {renderPanel()}
              </div>
            </main>

          </div>
        </div>
      </div>
      <Footer onNavigate={onNavigate} />
      <Toast message={toast} />
    </>
  )
}