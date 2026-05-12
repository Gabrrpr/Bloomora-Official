import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { useTheme } from "../context/ThemeContext.jsx";

const G = "#2E8B34";
const DG = "#0C573E";

const FIELDS = [
  { label: "Username", key: "username", span: 1 },
  { label: "First Name", key: "firstName", span: 1 },
  { label: "Last Name", key: "lastName", span: 1 },
  { label: "Middle Name", key: "middleName", span: 1 },
  { label: "Email Address", key: "email", type: "email", span: 1 },
  { label: "Phone Number", key: "phone", type: "tel", placeholder: "+63 9XX XXX XXXX", span: 1 },
  { label: "Password", key: "password", type: "password", span: 1 },
  { label: "Confirm Password", key: "confirmPassword", type: "password", span: 1 },
  { label: "Address", key: "address", multiline: true, span: 2 },
  { label: "Birthdate", key: "birthdate", type: "date", span: 1 },
];

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
};

export default function Profile({ onNavigate }) {
  const { user } = useAuth();

  const setupMode = user && !user.is_profile_complete;
  const [editing, setEditing] = useState(setupMode);
  const [saved, setSaved] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [usernameCheck, setUsernameCheck] = useState("");
  const [passwordMatch, setPasswordMatch] = useState(true);
  const fileInputRef = useRef(null);
  const { isDark } = useTheme();

  const [form, setForm] = useState({
    username: user?.username || "",
    firstName: user?.firstName || "",
    middleName: user?.middleName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phoneNumber || "",
    password: "",
    confirmPassword: "",
    address: user?.address || "",
    birthdate: "",
  });

  const [savedForm, setSavedForm] = useState({ ...form });

  // Address book state
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({ ...EMPTY_ADDRESS });
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || "",
        firstName: user.firstName || "",
        middleName: user.middleName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
        password: "",
        confirmPassword: "",
        address: user.address || "",
        birthdate: "",
      });
      setSavedForm({ ...form });
    }
    loadAddresses();
  }, [user]);

  async function loadAddresses() {
    setLoadingAddresses(true);
    try {
      const res = await api.getAddresses();
      setAddresses(res.addresses || []);
    } catch (e) {
      console.error("Failed to load addresses:", e);
    } finally {
      setLoadingAddresses(false);
    }
  }

  const openAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({ ...EMPTY_ADDRESS });
    setShowAddressModal(true);
  };

  const openEditAddress = (addr) => {
    setEditingAddress(addr);
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
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddressError("");
    setSavingAddress(true);
    try {
      if (editingAddress) {
        await api.updateAddress(editingAddress.id, addressForm);
      } else {
        await api.createAddress(addressForm);
      }
      await loadAddresses();
      setShowAddressModal(false);
    } catch (err) {
      console.error("Failed to save address:", err);
      setAddressError(err.message || "Failed to save address.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await api.deleteAddress(addressId);
      await loadAddresses();
    } catch (err) {
      console.error("Failed to delete address:", err);
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await api.setDefaultAddress(addressId);
      await loadAddresses();
    } catch (err) {
      console.error("Failed to set default address:", err);
    }
  };

  const initials = [form.firstName?.[0], form.lastName?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || "U";

  const handlePhotoClick = () => {
    if (editing) fileInputRef.current?.click();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarSrc(ev.target.result);
    reader.readAsDataURL(file);
  };

  const checkUsername = async (username) => {
    if (!username) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/users/?search=${username}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      setUsernameCheck(data.total > 0 ? "taken" : "available");
    } catch {
      setUsernameCheck("error");
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, username: value });
    checkUsername(value);
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, password: value });
    setPasswordMatch(form.confirmPassword === value);
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, confirmPassword: value });
    setPasswordMatch(form.password === value);
  };

  const handleEdit = () => {
    setSaved(false);
    setEditing(true);
  };

  const handleCancel = () => {
    setForm({ ...savedForm });
    setEditing(false);
  };

  const handleSave = async () => {
    if (setupMode) {
      if (!form.username || !form.password || form.password !== form.confirmPassword) {
        alert("Please fill username, password, and confirm password match.");
        return;
      }
    }

    try {
      await api.updateProfile({
        username: form.username || undefined,
        password: form.password || undefined,
        first_name: form.firstName,
        middle_name: form.middleName,
        last_name: form.lastName,
        phone_number: form.phone,
        address: form.address,
      });
      setSavedForm({ ...form });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (setupMode) {
        setTimeout(() => onNavigate("home"), 1500);
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert(err.message || "Failed to save.");
    }
  };

  const inputStyle = (active) => ({
    borderColor: active ? "#d1d5db" : "#f3f4f6",
    backgroundColor: active ? "white" : "#f9fafb",
    color: active ? "#111827" : "#6b7280",
  });

  const getUsernameStatusColor = () => {
    if (usernameCheck === "taken") return "text-red-500";
    if (usernameCheck === "available") return "text-green-500";
    return "text-gray-400";
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F8FA" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <button
          onClick={setupMode ? undefined : () => onNavigate("home")}
          disabled={setupMode}
          className={`flex items-center gap-2 text-sm mb-6 transition ${setupMode ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-gray-700"}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {setupMode ? "Complete setup first" : "Back"}
        </button>

        {setupMode && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 text-sm font-semibold text-blue-800 bg-blue-50 border border-blue-200">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Complete your profile with username and password to continue.
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 text-sm font-medium text-white shadow" style={{ backgroundColor: G }}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Profile updated successfully!
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-5">
          <div className="h-24" style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }} />
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-12 mb-4">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-2xl font-bold text-white flex-shrink-0" style={{
                  background: avatarSrc ? "transparent" : `linear-gradient(135deg, ${G}, ${DG})`,
                  cursor: editing ? "pointer" : "default",
                }}>
                  {avatarSrc ? <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" /> : initials}
                </div>
                {editing && (
                  <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-white">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <button onClick={handleCancel} className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-600">
                      Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition hover:brightness-105" style={{ backgroundColor: G }}>
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button onClick={handleEdit} className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition hover:brightness-105" style={{ backgroundColor: G }}>
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
            </div>
          </div>
        </div>

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
                    onChange={key === "username" ? handleUsernameChange : key === "password" ? handlePasswordChange : key === "confirmPassword" ? handleConfirmPasswordChange : e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder || ""}
                    disabled={!editing}
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-lg transition focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 ${key === "username" && usernameCheck === "taken" ? "border-red-300" : key === "confirmPassword" && !passwordMatch ? "border-red-300" : ""}`}
                    style={inputStyle(editing)}
                  />
                )}
                {key === "username" && editing && (
                  <p className={`text-xs mt-1 ${getUsernameStatusColor()}`}>
                    {usernameCheck === "taken" ? "Username taken" : usernameCheck === "available" ? "Username available" : "Checking..."}
                  </p>
                )}
                {key === "confirmPassword" && editing && !passwordMatch && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
            ))}
          </div>
          {editing && (
            <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
              <button onClick={handleCancel} className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-600">
                Cancel
              </button>
              <button onClick={handleSave} className="flex-1 py-2.5 text-sm font-semibold text-white rounded-lg transition hover:brightness-105" style={{ backgroundColor: G }}>
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Address Book */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Address Book</h3>
              <p className="text-xs text-gray-400 mt-0.5">Manage your saved delivery addresses</p>
            </div>
            <button onClick={openAddAddress} className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition hover:brightness-105" style={{ backgroundColor: G }}>
              + Add Address
            </button>
          </div>
          {loadingAddresses ? (
            <div className="py-8 text-center text-gray-400 text-sm">Loading...</div>
          ) : addresses.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-gray-200 rounded-lg">
              <div className="text-3xl mb-2">📍</div>
              <p className="text-sm text-gray-500">No saved addresses yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div key={addr.id} className={`border rounded-xl p-4 transition ${addr.is_default ? "border-green-300 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
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
                        {addr.street}, {addr.city}, {addr.province}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                      {!addr.is_default && (
                        <button onClick={() => handleSetDefault(addr.id)} className="p-1.5 text-gray-400 hover:text-green-600 transition" title="Set as default">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                      )}
                      <button onClick={() => openEditAddress(addr)} className="p-1.5 text-gray-400 hover:text-blue-600 transition" title="Edit">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDeleteAddress(addr.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition" title="Delete">
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
                {/* Preferences */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Preferences</h3>
          <p className="text-xs text-gray-400 mb-5">Manage your theme and notification settings</p>

          {/* Theme */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Appearance</p>
          <div className="flex gap-2 mb-6">
            {[
              {
                value: false, label: "Light",
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
              },
              {
                value: true, label: "Dark",
                icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
              },
            ].map(({ value, label, icon }) => {
              const active = isDark === value;
              return (
                <button key={label} onClick={() => !active && toggleDark()}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-all"
                  style={{
                    borderColor: active ? G : "#e5e7eb",
                    color: active ? G : "#6b7280",
                    fontWeight: active ? 600 : 400,
                    backgroundColor: active ? "#f0fdf4" : "transparent",
                  }}>
                  {icon}{label}
                </button>
              );
            })}
          </div>

          {/* Notifications */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Notifications</p>
          {loadingPrefs ? (
            <div className="text-xs text-gray-400">Loading...</div>
          ) : (
            <div className="space-y-3">
              {[
                { key: "order_updates", label: "Order updates", desc: "Confirmed, preparing, out for delivery, delivered" },
                { key: "promotions",    label: "Promotions",    desc: "Discounts, campaigns, and special offers" },
                { key: "chat_messages", label: "Chat messages", desc: "Replies from our team in support chat" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => handleTogglePref(key)}
                    className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200"
                    style={{ backgroundColor: prefs[key] ? G : "#d1d5db" }}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                      style={{ transform: prefs[key] ? "translateX(20px)" : "translateX(0)" }}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Password</h3>
              <p className="text-xs text-gray-400 mt-0.5">Change your account password</p>
            </div>
            <button onClick={() => onNavigate("forgot-password")} className="px-4 py-2 text-sm font-semibold border rounded-lg transition hover:bg-green-50" style={{ borderColor: G, color: G }}>
              Change Password
            </button>
          </div>
        </div>

        <div className="bg-white border border-red-100 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-red-500 mb-1">Danger Zone</h3>
          <p className="text-xs text-gray-400 mb-4">Permanently delete your account. This cannot be undone.</p>
          <button className="px-5 py-2 text-sm font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">
            Delete Account
          </button>
        </div>
      </div>

      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">
                {editingAddress ? "Edit Address" : "Add New Address"}
              </h3>
              <button onClick={() => setShowAddressModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSaveAddress} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Label</label>
                <select value={addressForm.label} onChange={e => setAddressForm({ ...addressForm, label: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600">
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Recipient Name *</label>
                <input type="text" required value={addressForm.recipient_name} onChange={e => setAddressForm({ ...addressForm, recipient_name: e.target.value })} placeholder="Full name" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Phone *</label>
                <input type="tel" required value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} placeholder="+63" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Street *</label>
                <textarea required rows={2} value={addressForm.street} onChange={e => setAddressForm({ ...addressForm, street: e.target.value })} placeholder="House, street" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Barangay</label>
                  <input type="text" value={addressForm.barangay} onChange={e => setAddressForm({ ...addressForm, barangay: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Zip</label>
                  <input type="text" value={addressForm.zip_code} onChange={e => setAddressForm({ ...addressForm, zip_code: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">City *</label>
                  <input type="text" required value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Province *</label>
                  <input type="text" required value={addressForm.province} onChange={e => setAddressForm({ ...addressForm, province: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={addressForm.is_default} onChange={e => setAddressForm({ ...addressForm, is_default: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span className="text-sm text-gray-600">Default</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddressModal(false)} className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition">
                  Cancel
                </button>
                <button type="submit" disabled={savingAddress} className="flex-1 py-2.5 text-sm font-semibold text-white rounded-lg transition hover:brightness-105 disabled:opacity-50" style={{ backgroundColor: G }}>
                  {savingAddress ? "Saving..." : editingAddress ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

