import { useState, useRef, useEffect } from "react"
import { useTheme } from "../../context/ThemeContext"
import { useAuth } from "../../context/AuthContext"
import Footer from "../../components/Footer"

import { api } from "../../services/api.js"
import { API_BASE } from "../../config/api.js"
import { regions, getProvinces } from "../../utils/philippines"

const G   = "#2E8B34"
const DG  = "#0C573E"

const MENU_ITEMS = [
  { id:"overview", label:"Overview",        d:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id:"orders",   label:"My Orders",       d:"M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" },
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

function GhostBtn({ children, onClick, isDark, type="button" }) {
  return (
    <button type={type} onClick={onClick}
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
function OverviewPanel({ user, setPanel, isDark, showToast }) {
  const { logout } = useAuth()
  const [showDelete, setShowDelete] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteConfirmName, setDeleteConfirmName] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [deleting, setDeleting] = useState(false)

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ")

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

  const handleDeleteAccount = async (e) => {
    e.preventDefault()
    if (!deletePassword) { setDeleteError("Please enter your password to confirm."); return }
    if (!deleteConfirmName || deleteConfirmName.trim() !== fullName) {
      setDeleteError(`Please type your full name exactly as "${fullName}" to confirm deletion.`); return }
    setDeleting(true)
    setDeleteError("")
    try {
      await api.deleteAccount(deletePassword, deleteConfirmName.trim())
      showToast("Account deleted successfully.")
      logout()
    } catch (err) {
      setDeleteError(err.message || "Failed to delete account.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionHeader title="Account Overview" description="Manage your personal information and preferences." isDark={isDark}/>

      {/* User info */}
      <div className="flex items-center gap-4 sm:gap-5 p-4 sm:p-5 rounded-xl"
        style={{ backgroundColor:infoBg, border:`1px solid ${infoBdr}` }}>

        {/* Check for the profile picture before showing initials */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0 overflow-hidden border border-gray-200"
          style={{ background: (user?.profilePictureUrl || user?.profile_picture_url) ? "transparent" : `linear-gradient(135deg,${G},${DG})` }}>
          {(user?.profilePictureUrl || user?.profile_picture_url) ? (
            <img src={user.profilePictureUrl || user.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            user?.firstName?.[0]?.toUpperCase()||"U"
          )}
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

      {/* Danger Zone */}
      <div className="p-5 sm:p-6 rounded-xl" style={{ backgroundColor: isDark ? "rgba(239,68,68,0.08)" : "#fff1f2", border: `1px solid ${isDark ? "rgba(239,68,68,0.25)" : "#fecdd3"}` }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-bold" style={{ color: isDark ? "#fca5a5" : "#991b1b" }}>Delete Account</p>
            <p className="text-xs mt-1" style={{ color: isDark ? "#f87171" : "#be123c" }}>
              Permanently remove your account, orders, and saved data. This action cannot be undone.
            </p>
          </div>
          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              className="px-4 py-2 text-xs font-bold text-white rounded-lg transition-all hover:opacity-90"
              style={{ backgroundColor: "#dc2626" }}>
              Delete Account
            </button>
          ) : (
            <form onSubmit={handleDeleteAccount} className="flex flex-col gap-2 w-full sm:w-auto">
              {deleteError && <p className="text-xs font-medium text-red-500">{deleteError}</p>}
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => { setDeletePassword(e.target.value); setDeleteError("") }}
                placeholder="Enter your password to confirm"
                className="px-3 py-2 text-sm rounded-lg border outline-none"
                style={{ borderColor: isDark ? "#7f1d1d" : "#fecdd3", backgroundColor: isDark ? "#1f1315" : "white", color: isDark ? "#fef2f2" : "#7f1d1d" }}
              />
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => { setDeleteConfirmName(e.target.value); setDeleteError("") }}
                placeholder={`Type your full name "${fullName}" to confirm`}
                className="px-3 py-2 text-sm rounded-lg border outline-none"
                style={{ borderColor: isDark ? "#7f1d1d" : "#fecdd3", backgroundColor: isDark ? "#1f1315" : "white", color: isDark ? "#fef2f2" : "#7f1d1d" }}
              />
              <div className="flex gap-2">
                <button type="submit" disabled={deleting} className="px-4 py-2 text-xs font-bold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#dc2626" }}>
                  {deleting ? "Deleting..." : "Confirm Delete"}
                </button>
                <button type="button" onClick={() => { setShowDelete(false); setDeletePassword(""); setDeleteConfirmName(""); setDeleteError("") }} className="px-4 py-2 text-xs font-bold rounded-lg border transition-all" style={{ borderColor: isDark ? "#7f1d1d" : "#fecdd3", color: isDark ? "#fca5a5" : "#be123c", backgroundColor: "transparent" }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
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

function DetailsPanel({ user, showToast, isDark }) {
  const { refreshUser, updateUserContext } = useAuth()

  // Fields whose change forces password re-verification. Only email is present
  // in this panel (username/password live in the Change Password panel).
  const SENSITIVE_KEYS = ["email"]

  const initialForm = {
    firstName: user?.firstName || "",
    lastName:  user?.lastName  || "",
    email:     user?.email     || "",
    phone:     user?.phoneNumber || "",
  }

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(initialForm)
  // Snapshot of the last saved values, used to detect sensitive changes.
  const [savedForm, setSavedForm] = useState(initialForm)
  const [savingDetails, setSavingDetails] = useState(false)
  const fileRef = useRef(null)

  // Verification modal state
  const [showVerify, setShowVerify] = useState(false)
  const [verifyPassword, setVerifyPassword] = useState("")
  const [verifyError, setVerifyError] = useState("")
  const [verifying, setVerifying] = useState(false)

  const [avatar, setAvatar] = useState(user?.profilePictureUrl || user?.profile_picture_url || null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadingPic, setUploadingPic] = useState(false)

  useEffect(() => {
    setAvatar(user?.profilePictureUrl || user?.profile_picture_url || null)
  }, [user?.profilePictureUrl, user?.profile_picture_url])

  // Keep form in sync if the user object changes (e.g. after refreshUser).
  useEffect(() => {
    const next = {
      firstName: user?.firstName || "",
      lastName:  user?.lastName  || "",
      email:     user?.email     || "",
      phone:     user?.phoneNumber || "",
    }
    setForm(next)
    setSavedForm(next)
  }, [user?.firstName, user?.lastName, user?.email, user?.phoneNumber])

  const divC = isDark ? "#1e293b" : "#f0f0f0"
  const nameC = isDark ? "#f1f5f9" : "#111827"
  const linkC = isDark ? "#4ade80" : G

  const modalCardBg  = isDark ? "#1a2332" : "#ffffff"
  const modalBdr     = isDark ? "#334155" : "#e5e7eb"
  const modalLabelC  = isDark ? "#94a3b8" : "#6b7280"
  const modalInputBg = isDark ? "#0f172a" : "white"
  const modalTextC   = isDark ? "#f1f5f9" : "#111827"

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0]
    if (f) {
      setSelectedFile(f)
      setAvatar(URL.createObjectURL(f))
    }
  }

  const handleSavePicture = async () => {
    if (!selectedFile) return
    setUploadingPic(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const res = await api.uploadProfilePicture(formData)

      // Instantly sync the new image to the Navbar
      if (updateUserContext) {
        updateUserContext({ profilePictureUrl: res.url });
      }

      showToast("Profile photo updated!")
      setSelectedFile(null)
      if (refreshUser) await refreshUser()
    } catch (err) {
      showToast("Failed to upload photo.")
    } finally {
      setUploadingPic(false)
    }
  }

  const handleCancelPicture = () => {
    setSelectedFile(null)
    setAvatar(user?.profilePictureUrl || user?.profile_picture_url || null)
  }

  const handleRemovePicture = async () => {
    if (!window.confirm("Are you sure you want to remove your profile photo?")) return;
    try {
      await api.removeProfilePicture();

      // Instantly remove image from the Navbar
      if (updateUserContext) {
        updateUserContext({ profilePictureUrl: null });
      }

      setAvatar(null);
      showToast("Profile photo removed.");
      if (refreshUser) await refreshUser();
    } catch (err) {
      showToast("Failed to remove photo.");
    }
  }

  // True when any sensitive field differs from the last saved value.
  const sensitiveChanged = () =>
    SENSITIVE_KEYS.some(k => (form[k] || "") !== (savedForm[k] || ""))

  // Actual save. Passes the re-entered current password when verifying a
  // sensitive change so the backend can confirm identity before applying it.
  const performSave = async (currentPassword) => {
    await api.updateProfile({
      first_name:  form.firstName,
      last_name:   form.lastName,
      email:       form.email,
      phone_number: form.phone,
      // NOTE FOR BACKEND: when current_password is present, verify it against
      // the stored hash before applying the email change.
      current_password: currentPassword || undefined,
    })
    setSavedForm({ ...form })
    setEditing(false)
    if (refreshUser) await refreshUser()
    showToast("Details updated successfully")
  }

  const handleSaveClick = async () => {
    // Sensitive field touched → require password confirmation first.
    if (sensitiveChanged()) {
      setVerifyPassword("")
      setVerifyError("")
      setShowVerify(true)
      return
    }
    // Only non-sensitive fields changed → save directly.
    setSavingDetails(true)
    try {
      await performSave()
    } catch (err) {
      showToast(err.message || "Failed to save details.")
    } finally {
      setSavingDetails(false)
    }
  }

  const handleConfirmVerify = async (e) => {
    e.preventDefault()
    if (!verifyPassword) {
      setVerifyError("Please enter your current password.")
      return
    }
    setVerifying(true)
    setVerifyError("")
    try {
      await performSave(verifyPassword)
      setShowVerify(false)
      setVerifyPassword("")
    } catch (err) {
      setVerifyError(err.message || "Incorrect password or save failed.")
    } finally {
      setVerifying(false)
    }
  }

  const handleCancelEdit = () => {
    setForm({ ...savedForm })
    setEditing(false)
  }

  return (
    <div>
      <SectionHeader title="Personal Details" description="Update your name, email, and contact information." isDark={isDark}/>
      <div className="flex items-start gap-4 sm:gap-5 mb-7 pb-6 flex-wrap" style={{ borderBottom:`1px solid ${divC}` }}>
        <div className="relative flex-shrink-0 mt-1">
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
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        </div>

        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color:nameC }}>{user?.firstName} {user?.lastName}</p>

          {!selectedFile ? (
            <div className="mt-1 flex items-center gap-3">
              <button onClick={() => fileRef.current?.click()} className="text-xs font-semibold hover:underline" style={{ color:linkC }}>
                Change photo
              </button>
              {(user?.profilePictureUrl || user?.profile_picture_url) && (
                <button onClick={handleRemovePicture} className="text-xs font-semibold hover:underline" style={{ color:"#f87171" }}>
                  Remove
                </button>
              )}
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={handleSavePicture} disabled={uploadingPic}
                className="text-xs px-3 py-1.5 rounded text-white font-bold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: DG }}>
                {uploadingPic ? "Saving..." : "Save Photo"}
              </button>
              <button
                onClick={handleCancelPicture} disabled={uploadingPic}
                className="text-xs font-bold transition-all hover:opacity-70 disabled:opacity-50"
                style={{ color: "#f87171" }}>
                Cancel
              </button>
            </div>
          )}

          <div className="mt-3 flex items-start gap-1.5 opacity-70">
            <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-[10px] leading-tight max-w-sm" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
              Your photo is securely stored to personalize your account and is only visible to you and our fulfillment team. You can remove it at any time.
            </p>
          </div>

        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Field label="First Name"    value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} readOnly={!editing} isDark={isDark}/>
        <Field label="Last Name"     value={form.lastName}  onChange={e=>setForm({...form,lastName:e.target.value})}  readOnly={!editing} isDark={isDark}/>
        <div>
          <Field label="Email Address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} readOnly={!editing} type="email" isDark={isDark}/>
          {editing && (
            <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: isDark ? "#94a3b8" : "#9ca3af" }}>
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
              Changing your email requires your password.
            </p>
          )}
        </div>
        <Field label="Phone Number"  value={form.phone}     onChange={e=>setForm({...form,phone:e.target.value})}     readOnly={!editing} placeholder="+63 900 000 0000" isDark={isDark}/>
      </div>

      {editing && sensitiveChanged() && (
        <div className="mb-5 flex items-start gap-2 px-4 py-3 rounded-lg text-xs"
          style={{ backgroundColor: isDark ? "rgba(251,191,36,0.1)" : "#fffbeb", border: `1px solid ${isDark ? "rgba(251,191,36,0.3)" : "#fde68a"}`, color: isDark ? "#fbbf24" : "#b45309" }}>
          <svg className="w-4 h-4 flex-shrink-0 mt-px" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-2.992l-6.93-12a2 2 0 00-3.48 0l-6.93 12A2 2 0 005.07 19z" /></svg>
          You changed your email address. We'll ask for your current password to confirm it's you.
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        {editing
          ? <><PrimaryBtn onClick={handleSaveClick} disabled={savingDetails}>{savingDetails ? "Saving..." : "Save Changes"}</PrimaryBtn><GhostBtn onClick={handleCancelEdit} isDark={isDark}>Cancel</GhostBtn></>
          : <PrimaryBtn onClick={() => setEditing(true)}>Edit Details</PrimaryBtn>
        }
      </div>

      {/* ── Verify password modal (sensitive change) ── */}
      {showVerify && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor:"rgba(0,0,0,0.45)" }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-sm" style={{ backgroundColor: modalCardBg }}>
            <div className="flex items-center justify-between px-5 sm:px-6 pt-6 pb-4 border-b" style={{ borderColor: modalBdr }}>
              <h3 className="text-base font-bold" style={{ color: nameC }}>Confirm it's you</h3>
              <button onClick={() => setShowVerify(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleConfirmVerify} className="px-5 sm:px-6 py-5 space-y-4">
              <p className="text-sm" style={{ color: modalLabelC }}>
                You're changing your email address. Enter your current password to save this change.
              </p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: modalLabelC }}>Current Password</label>
                <input
                  type="password"
                  autoFocus
                  value={verifyPassword}
                  onChange={(e) => { setVerifyPassword(e.target.value); setVerifyError("") }}
                  placeholder="Enter your current password"
                  className="w-full px-4 py-2.5 text-sm rounded-lg border outline-none transition-all"
                  style={{ borderColor: modalBdr, backgroundColor: modalInputBg, color: modalTextC }}
                  onFocus={e => { e.target.style.borderColor="#4ade80"; e.target.style.boxShadow="0 0 0 3px rgba(74,222,128,0.2)" }}
                  onBlur={e => { e.target.style.borderColor=modalBdr; e.target.style.boxShadow="none" }}
                />
                {verifyError && <p className="text-xs font-medium text-red-500 mt-1.5">{verifyError}</p>}
              </div>
              <div className="flex gap-3 pt-1">
                <PrimaryBtn type="submit" disabled={verifying}>{verifying ? "Verifying..." : "Confirm & Save"}</PrimaryBtn>
                <GhostBtn type="button" onClick={() => setShowVerify(false)} isDark={isDark}>Cancel</GhostBtn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ── PasswordPanel ─────────────────────────────────────────────────────────────
function PasswordPanel({ user, showToast, isDark }) {
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestOTP = async () => {
    if (!user?.email) return setError("User email not found.");
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/forgot-password/send-otp", { email: user.email });
      setStep(2);
      showToast(`A confirmation code was sent to ${user.email}`);
    } catch (err) {
      setError(err.message || "Failed to send code.");
    } finally {
      setLoading(false);
    }
  };

  const confirmAndChange = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp) return setError("Please enter the confirmation code.");
    if (newPassword.length < 8) return setError("New password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");

    setLoading(true);
    try {
      await api.post("/auth/forgot-password/reset", {
        email: user.email,
        otp: otp,
        new_password: newPassword
      });
      showToast("Password changed successfully!");
      setStep(1);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Invalid OTP or failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <SectionHeader title="Change Password" description="Secure your account with an OTP confirmation." isDark={isDark}/>

      <div className="max-w-md">
        {step === 1 ? (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>
              For your security, we will send a 6-digit confirmation code to <b>{user?.email}</b> before allowing a password change.
            </p>
            {error && <p className="text-xs font-medium text-red-500">{error}</p>}
            <PrimaryBtn onClick={requestOTP} disabled={loading}>
              {loading ? "Sending..." : "Send Confirmation Code"}
            </PrimaryBtn>
          </div>
        ) : (
          <form onSubmit={confirmAndChange} className="space-y-4">
            <div className="p-3 mb-4 rounded-lg text-sm" style={{ background: isDark?"rgba(74,222,128,0.1)":"#f0fdf4", color: isDark?"#4ade80":DG, border: `1px solid ${isDark?"rgba(74,222,128,0.2)":"#bbf7d0"}` }}>
              Code sent! Please check your email inbox (and spam folder).
            </div>

            <Field label="6-Digit OTP Code" type="text" value={otp} onChange={e=>setOtp(e.target.value)} placeholder="123456" isDark={isDark}/>
            <Field label="New Password" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="At least 8 characters" isDark={isDark}/>
            <Field label="Confirm New Password" type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Repeat new password" isDark={isDark}/>

            {error && <p className="text-xs font-medium text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <PrimaryBtn type="submit" disabled={loading}>
                {loading ? "Updating..." : "Verify & Update"}
              </PrimaryBtn>
              <GhostBtn type="button" onClick={() => setStep(1)} isDark={isDark}>Cancel</GhostBtn>
            </div>
          </form>
        )}
      </div>
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
  // regionId / provinceId drive the cascading dropdowns (like the register page);
  // province (text) is kept so the current backend payload keeps working.
  const emptyForm = { label:"", recipient_name:"", phone:"", regionId:"", provinceId:"", street:"", barangay:"", city:"", province:"", zip_code:"", is_default:false }
  const [form, setForm] = useState(emptyForm)
  const hdr = { "Content-Type":"application/json", Authorization:`Bearer ${token}` }

  // Resolve readable names from the selected IDs.
  const regionName   = (rid) => regions.find(r => String(r.id) === String(rid))?.name || ""
  const provinceName = (rid, pid) => getProvinces(rid).find(p => String(p.id) === String(pid))?.name || ""

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch(`${API_BASE}/addresses/`, { headers:hdr })
      .then(r=>r.json()).then(data=>setAddresses(data.addresses||[]))
      .catch(()=>showToast("Failed to load addresses")).finally(()=>setLoading(false))
  }, [token])

  const reset = () => { setForm(emptyForm); setEditingId(null); setShowForm(false) }

  const handleSave = async () => {
    if (!form.recipient_name || !form.street || !form.city || !form.regionId || !form.provinceId) {
      showToast("Please fill in all required fields"); return
    }
    setSaving(true)
    try {
      const rName = regionName(form.regionId)
      const pName = provinceName(form.regionId, form.provinceId)
      // Send the text payload the backend currently expects, PLUS the IDs and
      // resolved names so it can be wired either way later.
      // NOTE FOR BACKEND: pick region/province as IDs or names as needed.
      const payload = {
        label: form.label,
        recipient_name: form.recipient_name,
        phone: form.phone,
        street: form.street,
        barangay: form.barangay,
        city: form.city,
        province: pName || form.province,
        region: rName,
        region_id: form.regionId,
        province_id: form.provinceId,
        zip_code: form.zip_code,
        is_default: form.is_default,
      }
      const url  = editingId?`${API_BASE}/addresses/${editingId}`:`${API_BASE}/addresses/`
      const res  = await fetch(url, { method:editingId?"PATCH":"POST", headers:hdr, body:JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail||"Failed to save")
      if (editingId) setAddresses(p=>p.map(a=>a.id===editingId?data.address:a))
      else { if(form.is_default) setAddresses(p=>p.map(a=>({...a,is_default:false}))); setAddresses(p=>[...p,data.address]) }
      showToast(editingId?"Address updated":"Address saved"); reset()
    } catch (e) { showToast(e.message) } finally { setSaving(false) }
  }

  const handleEdit = addr => {
    // Map saved region/province (whether stored as id or name) back to IDs so
    // the dropdowns pre-select correctly.
    const rid = addr.region_id
      ? String(addr.region_id)
      : (regions.find(r => r.name === addr.region)?.id ?? "")
    const pid = addr.province_id
      ? String(addr.province_id)
      : (rid ? (getProvinces(rid).find(p => p.name === addr.province)?.id ?? "") : "")
    setForm({
      label:addr.label||"", recipient_name:addr.recipient_name||"", phone:addr.phone||"",
      regionId: rid ? String(rid) : "", provinceId: pid ? String(pid) : "",
      street:addr.street||"", barangay:addr.barangay||"", city:addr.city||"",
      province:addr.province||"", zip_code:addr.zip_code||"", is_default:addr.is_default||false
    })
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

  // Select styled to match Field (same border / bg / label / focus ring).
  const selLblC = isDark ? "#94a3b8" : "#6b7280"
  const selBdr  = isDark ? "#334155" : "#e5e7eb"
  const selBg   = isDark ? "#1e293b" : "white"
  const selTxt  = isDark ? "#f1f5f9" : "#1e293b"
  function SelectField({ label, value, onChange, disabled, children, required }) {
    return (
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:selLblC }}>
          {label}{required && " *"}
        </label>
        <select value={value} onChange={onChange} disabled={disabled}
          className="w-full pl-3 pr-8 py-2.5 text-sm rounded-lg border outline-none transition-all appearance-auto disabled:opacity-50"
          style={{ borderColor:selBdr, backgroundColor:selBg, color:selTxt }}
          onFocus={e => { if(!disabled){ e.target.style.borderColor="#4ade80"; e.target.style.boxShadow="0 0 0 3px rgba(74,222,128,0.2)" }}}
          onBlur={e => { e.target.style.borderColor=selBdr; e.target.style.boxShadow="none" }}>
          {children}
        </select>
      </div>
    )
  }

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

          {/* Label + Recipient + Phone */}
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <Field label="Label" value={form.label} onChange={e=>setForm({...form,label:e.target.value})} placeholder="Home" isDark={isDark}/>
            <Field label="Recipient Name *" value={form.recipient_name} onChange={e=>setForm({...form,recipient_name:e.target.value})} placeholder="Juan dela Cruz" isDark={isDark}/>
            <Field label="Phone *" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+63 900 000 0000" isDark={isDark}/>
            <Field label="Barangay" value={form.barangay} onChange={e=>setForm({...form,barangay:e.target.value})} placeholder="Barangay 1" isDark={isDark}/>
          </div>

          {/* Cascading Region -> Province (same as register) */}
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <SelectField label="Region" required
              value={form.regionId}
              onChange={e => setForm(f => ({ ...f, regionId: e.target.value, provinceId: "" }))}>
              <option value="">Select Region</option>
              {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </SelectField>
            <SelectField label="Province" required
              value={form.provinceId}
              disabled={!form.regionId}
              onChange={e => setForm(f => ({ ...f, provinceId: e.target.value }))}>
              <option value="">Select Province</option>
              {getProvinces(form.regionId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </SelectField>
          </div>

          {/* City + ZIP */}
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <Field label="City / Municipality *" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="Manila" isDark={isDark}/>
            <Field label="ZIP Code" value={form.zip_code} onChange={e=>setForm({...form,zip_code:e.target.value.replace(/\D/g,"").slice(0,4)})} placeholder="1000" isDark={isDark}/>
          </div>

          {/* Street */}
          <div className="mb-4">
            <Field label="Street Address *" value={form.street} onChange={e=>setForm({...form,street:e.target.value})} placeholder="123 Rizal St., Subdivision" isDark={isDark}/>
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
      case "details":  return <DetailsPanel {...props}/>
      case "address":  return <AddressPanel {...props}/>
      case "password": return <PasswordPanel {...props}/>
      case "settings": return <SettingsPanel {...props}/>
      default:
        return <OverviewPanel {...props}/>
    }
  }

  return (
    <>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes pageRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
      <div className="min-h-screen" style={{ backgroundColor:pageBg }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex gap-6 lg:gap-7 items-start">

            {/* Sidebar */}
            <aside className="w-52 flex-shrink-0 hidden md:flex flex-col gap-1 sticky top-28" style={{ animation: "pageRise 0.5s ease 0.05s both" }}>
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
              <div className="md:hidden mb-4 overflow-x-auto flex gap-2 pb-1" style={{ animation: "pageRise 0.5s ease 0.05s both" }}>
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

              <div key={panel} className="rounded-xl p-5 sm:p-8"
                style={{ backgroundColor:contentBg, border:`1px solid ${contentBdr}`, animation:"pageRise 0.45s ease 0.12s both" }}>
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