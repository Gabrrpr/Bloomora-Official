import { useState, useRef, useEffect } from "react"
import { useTheme } from "../../context/ThemeContext"
import { useAuth } from "../../context/AuthContext"
import Footer from "../../components/Footer"

const G   = "#2E8B34"
const DG  = "#0C573E"
const API_BASE = "http://localhost:8000/api/v1"

const MENU_ITEMS = [
  { id:"overview", label:"Overview",        d:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id:"orders",   label:"My Orders",       d:"M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" },
  { id:"wishlist", label:"Wishlist",         d:"M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" },
  { id:"details",  label:"Personal Details", d:"M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" },
  { id:"address",  label:"Address Book",    d:"M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" },
  { id:"password", label:"Change Password", d:"M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" },
  { id:"settings", label:"Preferences",     d:"M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z M15 12a3 3 0 11-6 0 3 3 0 016 0Z" },
]

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, type="text", value, onChange, placeholder, readOnly, isDark }) {
  const bg  = readOnly ? (isDark?"#0f172a":"#fafafa")   : (isDark?"#1e293b":"white")
  const bdr = readOnly ? (isDark?"#1e293b":"#f0f0f0")   : (isDark?"#334155":"#e5e7eb")
  const tc  = isDark ? "#f1f5f9" : "#1e293b"
  const lbl = isDark ? "#94a3b8" : "#6b7280"
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:lbl }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
        className="w-full px-4 py-2.5 text-sm rounded-lg border outline-none transition-all"
        style={{ borderColor:bdr, backgroundColor:bg, color:tc }}
        onFocus={e => { if(!readOnly){ e.target.style.borderColor="#4ade80"; e.target.style.boxShadow="0 0 0 3px rgba(74,222,128,0.2)" }}}
        onBlur={e => { e.target.style.borderColor=bdr; e.target.style.boxShadow="none" }}/>
    </div>
  )
}

function SectionHeader({ title, description, isDark }) {
  return (
    <div className="mb-6 pb-4" style={{ borderBottom:`1px solid ${isDark?"#1e293b":"#f0f0f0"}` }}>
      <h2 className="text-lg font-bold" style={{ color:isDark?"#f1f5f9":"#111827" }}>{title}</h2>
      {description && <p className="text-sm mt-0.5" style={{ color:isDark?"#64748b":"#9ca3af" }}>{description}</p>}
    </div>
  )
}

function PrimaryBtn({ children, onClick, type="button", disabled }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className="px-6 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
      style={{ backgroundColor:DG }}>
      {children}
    </button>
  )
}

function GhostBtn({ children, onClick, isDark }) {
  return (
    <button onClick={onClick}
      className="px-6 py-2.5 text-sm font-semibold rounded-lg border transition-all"
      style={{ borderColor:isDark?"#334155":"#e5e7eb", color:isDark?"#94a3b8":"#6b7280", backgroundColor:"transparent" }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor=isDark?"#1e293b":"#f9fafb"}
      onMouseLeave={e => e.currentTarget.style.backgroundColor="transparent"}>
      {children}
    </button>
  )
}

function useToast() {
  const [toast, setToast] = useState(null)
  const show = msg => { setToast(msg); setTimeout(()=>setToast(null),3000) }
  return [toast, show]
}

function Toast({ message }) {
  if (!message) return null
  return (
    <div className="fixed bottom-6 right-6 z-[9998] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium"
      style={{ backgroundColor:DG, animation:"fadeUp 0.3s ease both" }}>
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
      </svg>
      {message}
    </div>
  )
}

// ── OverviewPanel ─────────────────────────────────────────────────────────────
function OverviewPanel({ user, setPanel, isDark }) {
  // User info card — clearly distinct from page bg
  const infoBg  = isDark ? "#0f172a" : "#f8f9fa"
  const infoBdr = isDark ? "#334155" : "#efefef"
  const nameC   = isDark ? "#ffffff" : "#111827"    // pure white in dark
  const emailC  = isDark ? "#94a3b8" : "#9ca3af"

  // Quick nav cards — must be clearly visible and readable
  const cardBg  = isDark ? "#0f172a" : "white"       // very dark so text pops
  const cardBdr = isDark ? "#334155" : "#efefef"
  const cardTxt = isDark ? "#f1f5f9" : "#374151"     // very bright text
  const cardIcon= isDark ? "#4ade80" : G             // neon green icons

  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionHeader title="Account Overview" description="Manage your personal information and preferences." isDark={isDark}/>

      {/* User info */}
      <div className="flex items-center gap-4 sm:gap-5 p-4 sm:p-5 rounded-xl"
        style={{ backgroundColor:infoBg, border:`1px solid ${infoBdr}` }}>
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
          style={{ background:`linear-gradient(135deg,${G},${DG})` }}>
          {user?.firstName?.[0]?.toUpperCase()||"U"}
        </div>
        <div>
          <p className="text-base font-bold" style={{ color:nameC }}>{user?.firstName} {user?.lastName}</p>
          <p className="text-sm" style={{ color:emailC }}>{user?.email}</p>
        </div>
      </div>

      {/* Quick nav grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {MENU_ITEMS.filter(m => m.id !== "overview").map(item => (
          <button key={item.id} onClick={() => setPanel(item.id)}
            className="flex items-center gap-3 p-3 sm:p-4 rounded-xl text-left transition-all"
            style={{ border:`1px solid ${cardBdr}`, backgroundColor:cardBg }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = isDark ? "#4ade80" : `${G}80`
              e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "#f0fdf4"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = cardBdr
              e.currentTarget.style.backgroundColor = cardBg
            }}>
            <svg className="w-4 h-4 flex-shrink-0" style={{ color:cardIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d={item.d}/>
            </svg>
            <span className="text-sm font-semibold" style={{ color:cardTxt }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── OrdersPanel ───────────────────────────────────────────────────────────────
function OrdersPanel({ onNavigate, isDark }) {
  const iconBg = isDark ? "#1e293b" : "#f3f4f6"
  const iconC  = isDark ? "#334155" : "#d1d5db"
  const headC  = isDark ? "#f1f5f9" : "#374151"
  const subC   = isDark ? "#64748b" : "#9ca3af"
  return (
    <div>
      <SectionHeader title="My Orders" description="Track and manage your recent purchases." isDark={isDark}/>
      <div className="flex flex-col items-center py-12 sm:py-16 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor:iconBg }}>
          <svg className="w-7 h-7" style={{ color:iconC }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"/>
          </svg>
        </div>
        <p className="text-base font-semibold mb-1" style={{ color:headC }}>No orders yet</p>
        <p className="text-sm mb-6" style={{ color:subC }}>When you place an order, it will appear here.</p>
        <PrimaryBtn onClick={() => onNavigate?.("shop")}>Browse Our Shop</PrimaryBtn>
      </div>
    </div>
  )
}

// ── WishlistPanel ─────────────────────────────────────────────────────────────
function WishlistPanel({ onNavigate, isDark }) {
  const iconBg = isDark ? "#1e293b" : "#f3f4f6"
  const iconC  = isDark ? "#334155" : "#d1d5db"
  const headC  = isDark ? "#f1f5f9" : "#374151"
  const subC   = isDark ? "#64748b" : "#9ca3af"
  return (
    <div>
      <SectionHeader title="Wishlist" description="Items you've saved for later." isDark={isDark}/>
      <div className="flex flex-col items-center py-12 sm:py-16 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor:iconBg }}>
          <svg className="w-7 h-7" style={{ color:iconC }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
          </svg>
        </div>
        <p className="text-base font-semibold mb-1" style={{ color:headC }}>Your wishlist is empty</p>
        <p className="text-sm mb-6" style={{ color:subC }}>Save items you love by clicking the heart icon on any product.</p>
        <PrimaryBtn onClick={() => onNavigate?.("shop")}>Explore Products</PrimaryBtn>
      </div>
    </div>
  )
}

// ── DetailsPanel ──────────────────────────────────────────────────────────────
function DetailsPanel({ user, showToast, isDark }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ firstName:user?.firstName||"", lastName:user?.lastName||"", email:user?.email||"", phone:user?.phoneNumber||"" })
  const fileRef = useRef(null)
  const [avatar, setAvatar] = useState(null)
  const divC = isDark ? "#1e293b" : "#f0f0f0"
  const nameC = isDark ? "#f1f5f9" : "#111827"
  const linkC = isDark ? "#4ade80" : G
  return (
    <div>
      <SectionHeader title="Personal Details" description="Update your name, email, and contact information." isDark={isDark}/>
      <div className="flex items-center gap-4 sm:gap-5 mb-7 pb-6" style={{ borderBottom:`1px solid ${divC}` }}>
        <div className="relative">
          {avatar
            ? <img src={avatar} alt="Profile" className="w-16 h-16 rounded-full object-cover"/>
            : <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background:`linear-gradient(135deg,${G},${DG})` }}>
                {user?.firstName?.[0]?.toUpperCase()||"U"}
              </div>
          }
          <button onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white shadow"
            style={{ backgroundColor:DG }}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f=e.target.files?.[0]; if(f) setAvatar(URL.createObjectURL(f)) }}/>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color:nameC }}>{user?.firstName} {user?.lastName}</p>
          <button onClick={() => fileRef.current?.click()} className="text-xs mt-0.5 hover:underline" style={{ color:linkC }}>
            Change profile photo
          </button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Field label="First Name"    value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} readOnly={!editing} isDark={isDark}/>
        <Field label="Last Name"     value={form.lastName}  onChange={e=>setForm({...form,lastName:e.target.value})}  readOnly={!editing} isDark={isDark}/>
        <Field label="Email Address" value={form.email}     onChange={e=>setForm({...form,email:e.target.value})}     readOnly={!editing} type="email" isDark={isDark}/>
        <Field label="Phone Number"  value={form.phone}     onChange={e=>setForm({...form,phone:e.target.value})}     readOnly={!editing} placeholder="+63 900 000 0000" isDark={isDark}/>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {editing
          ? <><PrimaryBtn onClick={() => { setEditing(false); showToast("Details updated successfully") }}>Save Changes</PrimaryBtn><GhostBtn onClick={() => setEditing(false)} isDark={isDark}>Cancel</GhostBtn></>
          : <PrimaryBtn onClick={() => setEditing(true)}>Edit Details</PrimaryBtn>
        }
      </div>
    </div>
  )
}

// ── PasswordPanel ─────────────────────────────────────────────────────────────
function PasswordPanel({ showToast, isDark }) {
  const [form, setForm] = useState({ current:"", next:"", confirm:"" })
  const [error, setError] = useState("")
  const handleSubmit = (e) => {
    e.preventDefault(); setError("")
    if (!form.current) { setError("Please enter your current password."); return }
    if (form.next.length < 8) { setError("New password must be at least 8 characters."); return }
    if (form.next !== form.confirm) { setError("New passwords do not match."); return }
    setForm({ current:"", next:"", confirm:"" }); showToast("Password updated successfully")
  }
  return (
    <div>
      <SectionHeader title="Change Password" description="Choose a strong password to protect your account." isDark={isDark}/>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <Field label="Current Password"     type="password" value={form.current}  onChange={e=>setForm({...form,current:e.target.value})}  placeholder="Enter current password" isDark={isDark}/>
        <Field label="New Password"         type="password" value={form.next}     onChange={e=>setForm({...form,next:e.target.value})}     placeholder="At least 8 characters" isDark={isDark}/>
        <Field label="Confirm New Password" type="password" value={form.confirm}  onChange={e=>setForm({...form,confirm:e.target.value})}  placeholder="Repeat new password" isDark={isDark}/>
        {error && <p className="text-xs font-medium" style={{ color:"#f87171" }}>{error}</p>}
        <div className="pt-1"><PrimaryBtn type="submit">Update Password</PrimaryBtn></div>
      </form>
    </div>
  )
}

// ── SettingsPanel ─────────────────────────────────────────────────────────────
function SettingsPanel({ showToast, isDark }) {
  const [prefs, setPrefs] = useState({ orders:true, marketing:false, sms:false })
  const toggle = key => { setPrefs(p=>({...p,[key]:!p[key]})); showToast("Preferences saved") }
  const rows = [
    { key:"orders",    label:"Order notifications", desc:"Email updates about your orders and deliveries" },
    { key:"marketing", label:"Promotions & offers",  desc:"Be the first to know about deals and new arrivals" },
    { key:"sms",       label:"SMS alerts",           desc:"Receive delivery updates via text message" },
  ]
  const divC  = isDark ? "#1e293b" : "#f0f0f0"
  const lblC  = isDark ? "#e2e8f0" : "#1f2937"
  const descC = isDark ? "#64748b" : "#9ca3af"
  return (
    <div>
      <SectionHeader title="Preferences" description="Manage your notification and communication settings." isDark={isDark}/>
      <div style={{ borderTop:`1px solid ${divC}` }}>
        {rows.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-4" style={{ borderBottom:`1px solid ${divC}` }}>
            <div>
              <p className="text-sm font-semibold" style={{ color:lblC }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color:descC }}>{desc}</p>
            </div>
            <button onClick={() => toggle(key)}
              className="relative flex-shrink-0 w-11 h-6 rounded-full ml-6 transition-colors duration-200"
              style={{ backgroundColor:prefs[key]?(isDark?"#4ade80":G):(isDark?"#334155":"#d1d5db") }}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                style={{ left:prefs[key]?"22px":"2px" }}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── AddressPanel ──────────────────────────────────────────────────────────────
function AddressPanel({ showToast, isDark }) {
  const { user } = useAuth()
  const token = user?.token
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [showForm, setShowForm]   = useState(false)
  const [editingId, setEditingId] = useState(null)
  const emptyForm = { label:"", recipient_name:"", phone:"", street:"", barangay:"", city:"", province:"", zip_code:"", is_default:false }
  const [form, setForm] = useState(emptyForm)
  const hdr = { "Content-Type":"application/json", Authorization:`Bearer ${token}` }

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch(`${API_BASE}/addresses/`, { headers:hdr })
      .then(r=>r.json()).then(data=>setAddresses(data.addresses||[]))
      .catch(()=>showToast("Failed to load addresses")).finally(()=>setLoading(false))
  }, [token])

  const reset = () => { setForm(emptyForm); setEditingId(null); setShowForm(false) }
  const handleSave = async () => {
    if (!form.recipient_name||!form.street||!form.city||!form.province) { showToast("Please fill in all required fields"); return }
    setSaving(true)
    try {
      const url  = editingId?`${API_BASE}/addresses/${editingId}`:`${API_BASE}/addresses/`
      const res  = await fetch(url, { method:editingId?"PATCH":"POST", headers:hdr, body:JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail||"Failed to save")
      if (editingId) setAddresses(p=>p.map(a=>a.id===editingId?data.address:a))
      else { if(form.is_default) setAddresses(p=>p.map(a=>({...a,is_default:false}))); setAddresses(p=>[...p,data.address]) }
      showToast(editingId?"Address updated":"Address saved"); reset()
    } catch (e) { showToast(e.message) } finally { setSaving(false) }
  }
  const handleEdit = addr => {
    setForm({ label:addr.label||"", recipient_name:addr.recipient_name||"", phone:addr.phone||"", street:addr.street||"", barangay:addr.barangay||"", city:addr.city||"", province:addr.province||"", zip_code:addr.zip_code||"", is_default:addr.is_default||false })
    setEditingId(addr.id); setShowForm(true)
  }
  const handleRemove  = async id => { try { await fetch(`${API_BASE}/addresses/${id}`,{method:"DELETE",headers:hdr}); setAddresses(p=>p.filter(a=>a.id!==id)); showToast("Address removed") } catch { showToast("Failed to remove") } }
  const handleDefault = async id => { try { await fetch(`${API_BASE}/addresses/${id}/set-default`,{method:"PATCH",headers:hdr}); setAddresses(p=>p.map(a=>({...a,is_default:a.id===id}))); showToast("Default updated") } catch { showToast("Failed") } }

  const divC   = isDark ? "#1e293b" : "#f0f0f0"
  const headC  = isDark ? "#f1f5f9" : "#111827"
  const subC   = isDark ? "#64748b" : "#9ca3af"
  const formBg = isDark ? "#0f172a" : "#f8fffe"
  const formBdr= isDark ? "rgba(74,222,128,0.25)" : `${G}40`
  const addrBg = isD => isD ? (isDark?"rgba(74,222,128,0.06)":"#f8fffe") : (isDark?"#0f172a":"white")
  const addrBdr= isD => isD ? (isDark?"rgba(74,222,128,0.35)":`${G}50`) : (isDark?"#1e293b":"#efefef")
  const nameC  = isDark ? "#f1f5f9" : "#1f2937"
  const linkG  = isDark ? "#4ade80" : G
  const cbC    = isDark ? "#94a3b8" : "#6b7280"

  return (
    <div>
      <div className="flex items-center justify-between mb-6 pb-4 flex-wrap gap-3" style={{ borderBottom:`1px solid ${divC}` }}>
        <div>
          <h2 className="text-lg font-bold" style={{ color:headC }}>Address Book</h2>
          <p className="text-sm mt-0.5" style={{ color:subC }}>Manage your saved delivery addresses.</p>
        </div>
        {!showForm && (
          <button onClick={() => { reset(); setShowForm(true) }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ backgroundColor:DG }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Add Address
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-6 p-4 sm:p-5 rounded-xl" style={{ border:`1px solid ${formBdr}`, backgroundColor:formBg }}>
          <p className="text-sm font-bold mb-4" style={{ color:nameC }}>{editingId?"Edit Address":"New Address"}</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            {[
              ["Label","label","Home"], ["Recipient Name *","recipient_name","Juan dela Cruz"],
              ["Phone *","phone","+63 900 000 0000"], ["Street Address *","street","123 Rizal St."],
              ["Barangay","barangay","Barangay 1"], ["City *","city","Manila"],
              ["Province *","province","Metro Manila"], ["ZIP Code","zip_code","1000"],
            ].map(([label,key,ph]) => (
              <Field key={key} label={label} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={ph} isDark={isDark}/>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer select-none" style={{ color:cbC }}>
            <input type="checkbox" checked={form.is_default} onChange={e=>setForm({...form,is_default:e.target.checked})} className="rounded" style={{ accentColor:G }}/>
            Set as default address
          </label>
          <div className="flex gap-3 flex-wrap">
            <PrimaryBtn onClick={handleSave} disabled={saving}>{saving?"Saving...":"Save Address"}</PrimaryBtn>
            <GhostBtn onClick={reset} isDark={isDark}>Cancel</GhostBtn>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm" style={{ color:subC }}>Loading addresses...</div>
      ) : addresses.length===0&&!showForm ? (
        <div className="flex flex-col items-center py-12 text-center">
          <p className="text-sm font-semibold mb-1" style={{ color:nameC }}>No saved addresses</p>
          <p className="text-xs" style={{ color:subC }}>Add a delivery address for faster checkout.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {addresses.map(addr => (
            <div key={addr.id} className="flex items-start justify-between p-4 rounded-xl"
              style={{ border:`1px solid ${addrBdr(addr.is_default)}`, backgroundColor:addrBg(addr.is_default) }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {addr.label && <p className="text-xs font-bold uppercase tracking-widest" style={{ color:linkG }}>{addr.label}</p>}
                  {addr.is_default && <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor:G }}>Default</span>}
                </div>
                <p className="text-sm font-bold" style={{ color:nameC }}>{addr.recipient_name}</p>
                <p className="text-sm" style={{ color:subC }}>{addr.phone}</p>
                <p className="text-sm mt-0.5" style={{ color:isDark?"#94a3b8":"#4b5563" }}>{addr.street}{addr.barangay?`, ${addr.barangay}`:""}</p>
                <p className="text-sm" style={{ color:subC }}>{addr.city}, {addr.province}{addr.zip_code?` ${addr.zip_code}`:""}</p>
              </div>
              <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                <button onClick={() => handleEdit(addr)} className="text-xs font-semibold hover:underline" style={{ color:linkG }}>Edit</button>
                {!addr.is_default && <button onClick={() => handleDefault(addr.id)} className="text-xs" style={{ color:subC }}>Set default</button>}
                <button onClick={() => handleRemove(addr.id)} className="text-xs font-semibold" style={{ color:"#f87171" }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AccountPage({ onNavigate }) {
  const { isDark } = useTheme()
  const { user, logout } = useAuth()
  const [panel, setPanel] = useState("overview")
  const [toast, showToast] = useToast()
  const handleLogout = () => { logout(); onNavigate("login") }

  // Page
  const pageBg = isDark ? "#0f172a" : "#f7f7f7"

  // Sidebar
  const sidebarLblC  = isDark ? "#64748b" : "#9ca3af"
  const sidebarNameC = isDark ? "#f1f5f9" : "#111827"
  const sidebarDivC  = isDark ? "#1e293b" : "#e9e9e9"

  // Content panel
  const contentBg  = isDark ? "#1a2332" : "white"
  const contentBdr = isDark ? "#1e293b" : "#ebebeb"

  const props = { isDark, showToast, onNavigate, user, setPanel }

  const renderPanel = () => {
    switch(panel) {
      case "overview": return <OverviewPanel {...props}/>
      case "orders":   return <OrdersPanel {...props}/>
      case "wishlist": return <WishlistPanel {...props}/>
      case "details":  return <DetailsPanel {...props}/>
      case "address":  return <AddressPanel {...props}/>
      case "password": return <PasswordPanel {...props}/>
      case "settings": return <SettingsPanel {...props}/>
      default:         return <OverviewPanel {...props}/>
    }
  }

  return (
    <>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div className="min-h-screen" style={{ backgroundColor:pageBg }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex gap-6 lg:gap-7 items-start">

            {/* Sidebar */}
            <aside className="w-52 flex-shrink-0 hidden md:flex flex-col gap-1 sticky top-28">
              <div className="px-4 py-3 mb-1">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color:sidebarLblC }}>Account</p>
                <p className="text-sm font-bold truncate mt-0.5" style={{ color:sidebarNameC }}>{user?.firstName} {user?.lastName}</p>
              </div>
              {MENU_ITEMS.map(item => {
                const active = panel === item.id
                return (
                  <button key={item.id} onClick={() => setPanel(item.id)}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm rounded-lg transition-all duration-150"
                    style={{
                      color: active ? (isDark?"#4ade80":DG) : (isDark?"#94a3b8":"#6b7280"),
                      fontWeight: active ? 700 : 400,
                      backgroundColor: active ? (isDark?"rgba(74,222,128,0.1)":(`${G}14`)) : "transparent",
                    }}
                    onMouseEnter={e => { if(!active) e.currentTarget.style.backgroundColor=isDark?"rgba(255,255,255,0.05)":"#f3f4f6" }}
                    onMouseLeave={e => { if(!active) e.currentTarget.style.backgroundColor="transparent" }}>
                    <svg className="w-4 h-4 flex-shrink-0"
                      style={{ color:active?(isDark?"#4ade80":G):(isDark?"#475569":"#9ca3af") }}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.6">
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.d}/>
                    </svg>
                    {item.label}
                  </button>
                )
              })}
              <div className="mt-2 pt-3" style={{ borderTop:`1px solid ${sidebarDivC}` }}>
                <button onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all"
                  style={{ color:"#f87171" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor=isDark?"rgba(248,113,113,0.1)":"#fff1f2"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor="transparent"}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  Sign out
                </button>
              </div>
            </aside>

            {/* Content */}
            <main className="flex-1 min-w-0">
              {/* Mobile tab strip */}
              <div className="md:hidden mb-4 overflow-x-auto flex gap-2 pb-1">
                {MENU_ITEMS.map(item => (
                  <button key={item.id} onClick={() => setPanel(item.id)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                    style={{
                      backgroundColor: panel===item.id ? DG : (isDark?"#1e293b":"#f3f4f6"),
                      color: panel===item.id ? "white" : (isDark?"#94a3b8":"#6b7280"),
                    }}>
                    {item.label}
                  </button>
                ))}
                <button onClick={handleLogout}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ backgroundColor:isDark?"rgba(248,113,113,0.15)":"#fff1f2", color:"#f87171" }}>
                  Sign out
                </button>
              </div>

              <div className="rounded-xl p-5 sm:p-8"
                style={{ backgroundColor:contentBg, border:`1px solid ${contentBdr}` }}>
                {renderPanel()}
              </div>
            </main>
          </div>
        </div>
      </div>
      <Footer onNavigate={onNavigate}/>
      <Toast message={toast}/>
    </>
  )
}