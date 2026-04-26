import { useState, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { api } from "../services/api"

const G = "#2E8B34"
const DG = "#0C573E"

const FIELDS = [
  { label: "First Name", key: "firstName", span: 1 },
  { label: "Last Name", key: "lastName", span: 1 },
  { label: "Middle Name", key: "middleName", span: 1 },
  { label: "Email Address", key: "email", type: "email", span: 1 },
  { label: "Phone Number", key: "phone", type: "tel", placeholder: "+63 9XX XXX XXXX", span: 1 },
  { label: "Birthdate", key: "birthdate", type: "date", span: 1 },
  { label: "Delivery Address", key: "address", multiline: true, placeholder: "Street, Barangay, City", span: 2 },
]

export default function Profile({ onNavigate }) {
  const { user } = useAuth()

  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [avatarSrc, setAvatarSrc] = useState(null) // null = initials fallback
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    middleName: user?.middleName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phoneNumber || "",
    birthdate: "",
    address: user?.address || "",
  })

  // Keep a "saved" snapshot to allow cancel
  const [savedForm, setSavedForm] = useState({ ...form })

  const initials = [form.firstName?.[0], form.lastName?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || "U"

  const handlePhotoClick = () => {
    if (editing) fileInputRef.current?.click()
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarSrc(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleEdit = () => {
    setSaved(false)
    setEditing(true)
  }

  const handleCancel = () => {
    setForm({ ...savedForm })
    setEditing(false)
  }

  const handleSave = async () => {
    try {
      await api.updateProfile({
        first_name: form.firstName,
        middle_name: form.middleName,
        last_name: form.lastName,
        phone_number: form.phone,
        address: form.address,
      })
      setSavedForm({ ...form })
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error("Failed to save profile:", err)
      alert("Failed to save profile. Please try again.")
    }
  }

  const inputStyle = (active) => ({
    borderColor: active ? "#d1d5db" : "#f3f4f6",
    backgroundColor: active ? "white" : "#f9fafb",
    color: active ? "#111827" : "#6b7280",
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F8FA" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Back */}
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Success toast */}
        {saved && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 text-sm font-medium text-white shadow"
            style={{ backgroundColor: G }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Profile updated successfully!
          </div>
        )}

        {/* ── Avatar card ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-5">
          {/* Cover */}
          <div className="h-24" style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }} />

          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-12 mb-4">
              {/* Avatar with upload */}
              <div className="relative group">
                <div
                  onClick={handlePhotoClick}
                  className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                  style={{
                    background: avatarSrc ? "transparent" : `linear-gradient(135deg, ${G}, ${DG})`,
                    cursor: editing ? "pointer" : "default",
                  }}
                >
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>

                {/* Camera overlay — only when editing */}
                {editing && (
                  <div
                    onClick={handlePhotoClick}
                    className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-white"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              {/* Edit / Save / Cancel buttons */}
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition hover:brightness-105"
                      style={{ backgroundColor: G }}
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition hover:brightness-105"
                    style={{ backgroundColor: G }}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {[form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ") || "Your Name"}
              </h2>
              <p className="text-sm text-gray-400">{form.email || user?.email}</p>
              {editing && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Click your photo to change it
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Personal Information form ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-5">Personal Information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {FIELDS.map(({ label, key, type = "text", placeholder, multiline, span }) => (
              <div key={key} className={span === 2 ? "sm:col-span-2" : ""}>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
                {multiline ? (
                  <textarea
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder || ""}
                    disabled={!editing}
                    rows={2}
                    className="w-full px-3.5 py-2.5 text-sm border rounded-lg transition focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 resize-none"
                    style={inputStyle(editing)}
                  />
                ) : (
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder || ""}
                    disabled={!editing}
                    className="w-full px-3.5 py-2.5 text-sm border rounded-lg transition focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
                    style={inputStyle(editing)}
                  />
                )}
              </div>
            ))}
          </div>

          {editing && (
            <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
              <button
                onClick={handleCancel}
                className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-lg transition hover:brightness-105"
                style={{ backgroundColor: G }}
              >
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* ── Password section ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Password</h3>
              <p className="text-xs text-gray-400 mt-0.5">Change your account password</p>
            </div>
            <button
              onClick={() => onNavigate("forgot-password")}
              className="px-4 py-2 text-sm font-semibold border rounded-lg transition hover:bg-green-50"
              style={{ borderColor: G, color: G }}
            >
              Change Password
            </button>
          </div>
        </div>

        {/* ── Danger Zone ── */}
        <div className="bg-white border border-red-100 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-red-500 mb-1">Danger Zone</h3>
          <p className="text-xs text-gray-400 mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
          <button className="px-5 py-2 text-sm font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}
