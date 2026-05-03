import { useState, useRef, useEffect } from "react"
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
]

const EMPTY_ADDRESS = {
  label: "Home",
  recipient_name: "",
  phone: "",
  street: "",
  barangay: "",
  city: "",
  province: "",
  zip_code: "",
  is_default: false,
}

export default function Profile({ onNavigate }) {
  const { user } = useAuth()

  const setupMode = user && !user.is_profile_complete
  const [editing, setEditing] = useState(setupMode)
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
  })

  // Keep a "saved" snapshot to allow cancel
  const [savedForm, setSavedForm] = useState({ ...form })

  // ── Address Book ──────────────────────────────────────────────────────────
  const [addresses, setAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [addressForm, setAddressForm] = useState({ ...EMPTY_ADDRESS })
const [savingAddress, setSavingAddress] = useState(false)
  const [addressError, setAddressError] = useState("")

  useEffect(() => {
    loadAddresses()
  }, [])

  async function loadAddresses() {
    setLoadingAddresses(true)
    try {
      const res = await api.getAddresses()
      setAddresses(res.addresses || [])
    } catch (e) {
      console.error("Failed to load addresses:", e)
    } finally {
      setLoadingAddresses(false)
    }
  }

  const openAddAddress = () => {
    setEditingAddress(null)
    setAddressForm({ ...EMPTY_ADDRESS })
    setShowAddressModal(true)
  }

  const openEditAddress = (addr) => {
    setEditingAddress(addr)
    setAddressForm({
      label: addr.label,
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      street: addr.street,
      barangay: addr.barangay || "",
      city: addr.city,
      province: addr.province,
      zip_code: addr.zip_code || "",
      is_default: addr.is_default,
    })
    setShowAddressModal(true)
  }

const handleSaveAddress = async (e) => {
    e.preventDefault()
    setAddressError("")
    setSavingAddress(true)
    try {
      console.log("Saving address with data:", addressForm)
      if (editingAddress) {
        await api.updateAddress(editingAddress.id, addressForm)
      } else {
        await api.createAddress(addressForm)
      }
      await loadAddresses()
      setShowAddressModal(false)
    } catch (err) {
      console.error("Failed to save address:", err)
      const errorMsg = err.message || "Failed to save address. Please try again."
      setAddressError(errorMsg)
      alert(errorMsg)
    } finally {
      setSavingAddress(false)
    }
  }

  const handleDeleteAddress = async (addressId) => {
    if (!confirm("Are you sure you want to delete this address?")) return
    try {
      await api.deleteAddress(addressId)
      await loadAddresses()
    } catch (err) {
      console.error("Failed to delete address:", err)
      alert("Failed to delete address.")
    }
  }

  const handleSetDefault = async (addressId) => {
    try {
      await api.setDefaultAddress(addressId)
      await loadAddresses()
    } catch (err) {
      console.error("Failed to set default address:", err)
      alert("Failed to set default address.")
    }
  }

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
      if (setupMode) {
        setTimeout(() => onNavigate("home"), 1500)
      }
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
          onClick={setupMode ? undefined : () => onNavigate("home")}
          disabled={setupMode}
          className={`flex items-center gap-2 text-sm mb-6 transition ${setupMode ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {setupMode ? 'Complete setup first' : 'Back'}
        </button>

        {setupMode && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 text-sm font-semibold text-blue-800 bg-blue-50 border border-blue-200">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Complete your profile to start shopping
          </div>
        )}
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

        {/* ── Address Book ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Address Book</h3>
              <p className="text-xs text-gray-400 mt-0.5">Manage your saved delivery addresses</p>
            </div>
            <button
              onClick={openAddAddress}
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition hover:brightness-105"
              style={{ backgroundColor: G }}
            >
              + Add Address
            </button>
          </div>

          {loadingAddresses ? (
            <div className="py-8 text-center text-gray-400 text-sm">Loading addresses...</div>
          ) : addresses.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-gray-200 rounded-lg">
              <div className="text-3xl mb-2">📍</div>
              <p className="text-sm text-gray-500">No saved addresses yet</p>
              <p className="text-xs text-gray-400 mt-1">Add your first delivery address</p>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`border rounded-xl p-4 transition ${addr.is_default ? "border-green-300 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-800">{addr.label}</span>
                        {addr.is_default && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: G }}>
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 font-medium">{addr.recipient_name} — {addr.phone}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {addr.street}{addr.barangay ? `, ${addr.barangay}` : ""}, {addr.city}, {addr.province}{addr.zip_code ? ` ${addr.zip_code}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                      {!addr.is_default && (
                        <button
                          onClick={() => handleSetDefault(addr.id)}
                          className="p-1.5 text-gray-400 hover:text-green-600 transition"
                          title="Set as default"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => openEditAddress(addr)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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

      {/* ── Address Modal ── */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">
                {editingAddress ? "Edit Address" : "Add New Address"}
              </h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Label</label>
                <select
                  value={addressForm.label}
                  onChange={e => setAddressForm({ ...addressForm, label: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Recipient Name *</label>
                <input
                  type="text"
                  required
                  value={addressForm.recipient_name}
                  onChange={e => setAddressForm({ ...addressForm, recipient_name: e.target.value })}
                  placeholder="Full name of recipient"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={addressForm.phone}
                  onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })}
                  placeholder="+63 9XX XXX XXXX"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Street Address *</label>
                <textarea
                  required
                  rows={2}
                  value={addressForm.street}
                  onChange={e => setAddressForm({ ...addressForm, street: e.target.value })}
                  placeholder="House number, street name, building"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Barangay</label>
                  <input
                    type="text"
                    value={addressForm.barangay}
                    onChange={e => setAddressForm({ ...addressForm, barangay: e.target.value })}
                    placeholder="Barangay"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Zip Code</label>
                  <input
                    type="text"
                    value={addressForm.zip_code}
                    onChange={e => setAddressForm({ ...addressForm, zip_code: e.target.value })}
                    placeholder="ZIP"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">City *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Province *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.province}
                    onChange={e => setAddressForm({ ...addressForm, province: e.target.value })}
                    placeholder="Province"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addressForm.is_default}
                  onChange={e => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-600">Set as default address</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="flex-1 py-2.5 text-sm font-semibold text-white rounded-lg transition hover:brightness-105 disabled:opacity-50"
                  style={{ backgroundColor: G }}
                >
                  {savingAddress ? "Saving..." : (editingAddress ? "Update" : "Save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
