import { useState, useEffect } from "react"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api.js"

const DG = "#0C573E"
const G  = "#2E8B34"

function useTokens() {
  const { isDark } = useTheme()
  if (isDark) return {
    cardBg:     "#1e293b",
    cardBdr:    "#334155",
    cardShadow: "none",
    headerBg:   "#162032",
    headerBdr:  "#2d3f55",
    inputBg:    "#0f172a",
    inputBdr:   "#475569",
    inputTxt:   "#f1f5f9",
    inputDis:   "#162032",
    divider:    "#2d3f55",
    bodyTxt:    "#f1f5f9",
    labelTxt:   "#94a3b8",
    subTxt:     "#64748b",
    hintTxt:    "#64748b",
    toggleTxt:  "#cbd5e1",
    tagBg:      "rgba(34,197,94,0.1)",
    tagBdr:     "rgba(34,197,94,0.25)",
    tagTxt:     "#4ade80",
    dayOff:     "#1e293b",
    dayOffTxt:  "#94a3b8",
    dayOffBdr:  "#334155",
    isDark:     true,
  }
  return {
    cardBg:     "#ffffff",
    cardBdr:    "#e8edf2",
    cardShadow: "0 1px 3px rgba(0,0,0,0.04)",
    headerBg:   "#fafbfc",
    headerBdr:  "#f1f5f9",
    inputBg:    "#ffffff",
    inputBdr:   "#dde3ec",
    inputTxt:   "#111827",
    inputDis:   "#f9fafb",
    divider:    "#f1f5f9",
    bodyTxt:    "#111827",
    labelTxt:   "#374151",
    subTxt:     "#6b7280",
    hintTxt:    "#9ca3af",
    toggleTxt:  "#374151",
    tagBg:      "#f0fdf4",
    tagBdr:     "#bbf7d0",
    tagTxt:     DG,
    dayOff:     "#ffffff",
    dayOffTxt:  "#6b7280",
    dayOffBdr:  "#dde3ec",
    isDark:     false,
  }
}

function SectionCard({ title, subtitle, icon, children, danger, className = "", style }) {
  const t = useTokens()
  return (
    <div className={`rounded-xl overflow-hidden ${className}`}
      style={{
        backgroundColor: danger ? (t.isDark ? "#1a0f0f" : "#ffffff") : t.cardBg,
        border: `1px solid ${danger ? (t.isDark ? "#7f1d1d" : "#fecaca") : t.cardBdr}`,
        boxShadow: t.cardShadow,
        ...style,
      }}>
      <div className="flex items-center gap-3 px-5 py-4"
        style={{
          borderBottom: `1px solid ${danger ? (t.isDark ? "#7f1d1d" : "#fecaca") : t.headerBdr}`,
          backgroundColor: danger ? (t.isDark ? "#2a1010" : "#fff5f5") : t.headerBg,
        }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: danger ? (t.isDark ? "#450a0a" : "#fee2e2") : (t.isDark ? "rgba(34,197,94,0.1)" : "linear-gradient(135deg,#f0fdf4,#dcfce7)") }}>
          <svg className="w-4 h-4" style={{ color: danger ? "#f87171" : (t.isDark ? "#4ade80" : DG) }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: danger ? (t.isDark ? "#f87171" : "#b91c1c") : t.bodyTxt }}>{title}</p>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: danger ? (t.isDark ? "#f87171" : "#ef4444") : t.subTxt }}>{subtitle}</p>}
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }) {
  const t = useTokens()
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5" style={{ color: t.labelTxt }}>{label}</label>
      {children}
      {hint && <p className="text-xs mt-1" style={{ color: t.hintTxt }}>{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = "text", disabled = false }) {
  const t = useTokens()
  return (
    <input
      type={type} value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2.5 text-sm border rounded-md outline-none transition-all"
      style={{
        borderColor: t.inputBdr,
        backgroundColor: disabled ? t.inputDis : t.inputBg,
        color: disabled ? t.subTxt : t.inputTxt,
        cursor: disabled ? "not-allowed" : "text",
      }}
      onFocus={e => { if (!disabled) { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` } }}
      onBlur={e => { e.target.style.borderColor = t.inputBdr; e.target.style.boxShadow = "none" }}
    />
  )
}

function Select({ value, onChange, options }) {
  const t = useTokens()
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange?.(e.target.value)}
        className="w-full appearance-none px-3 py-2.5 text-sm border rounded-md cursor-pointer outline-none transition-all"
        style={{ borderColor: t.inputBdr, backgroundColor: t.inputBg, color: t.inputTxt }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
        onBlur={e => { e.target.style.borderColor = t.inputBdr; e.target.style.boxShadow = "none" }}>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
      <svg className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: t.subTxt }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  )
}

function Toggle({ checked, onChange, label, hint }) {
  const t = useTokens()
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div>
        <p className="text-sm font-medium" style={{ color: t.toggleTxt }}>{label}</p>
        {hint && <p className="text-xs mt-0.5" style={{ color: t.hintTxt }}>{hint}</p>}
      </div>
      <button onClick={() => onChange?.(!checked)}
        className="relative flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200"
        style={{ backgroundColor: checked ? G : (t.isDark ? "#334155" : "#d1d5db") }}>
        <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200"
          style={{ left: checked ? "22px" : "2px" }} />
      </button>
    </div>
  )
}

function Divider() {
  const t = useTokens()
  return <div style={{ height: "1px", backgroundColor: t.divider, margin: "4px 0" }} />
}

function SaveBtn({ onClick, saved }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
      style={{ background: saved ? "#16a34a" : `linear-gradient(135deg, ${DG}, ${G})` }}>
      {saved
        ? <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Saved!</>
        : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>Save Changes</>
      }
    </button>
  )
}

export default function AdminSettings() {
  const t = useTokens()
  // Drives the one-time entrance animation; removed after it plays so it never replays.
  const [entered, setEntered] = useState(false)

  const [storeName, setStoreName]   = useState("Esting's Flower International Inc.")
  const [storeEmail, setStoreEmail] = useState("estings@gmail.com")
  const [storePhone, setStorePhone] = useState("")
  const [branch, setBranch]         = useState("Manila")
  const [storeSaved, setStoreSaved] = useState(false)

  const [notifEmail, setNotifEmail]       = useState(true)
  const [notifOrders, setNotifOrders]     = useState(true)
  const [notifLowStock, setNotifLowStock] = useState(true)
  const [notifMessages, setNotifMessages] = useState(true)
  const [notifSMS, setNotifSMS]           = useState(false)
  const [notifSaved, setNotifSaved]       = useState(false)

  const [openTime, setOpenTime]     = useState("08:00")
  const [closeTime, setCloseTime]   = useState("20:00")
  const [openDays, setOpenDays]     = useState(["Mon","Tue","Wed","Thu","Fri","Sat"])
  const [hoursSaved, setHoursSaved] = useState(false)

  const [deliveryFee, setDeliveryFee]       = useState("150")
  const [minOrder, setMinOrder]             = useState("500")
  const [sameDayCutoff, setSameDayCutoff]   = useState("09:00")
  const [delivSaved, setDelivSaved]         = useState(false)

  const [customizationEnabled, setCustomizationEnabled] = useState(true)
  const [toggleSaved, setToggleSaved]   = useState(false)
  const [toggleLoading, setToggleLoading] = useState(false)

  const [curPwd, setCurPwd]         = useState("")
  const [newPwd, setNewPwd]         = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [pwdSaved, setPwdSaved]     = useState(false)
  const [pwdError, setPwdError]     = useState("")

  const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
  const toggleDay = d => setOpenDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  const save = setter => { setter(true); setTimeout(() => setter(false), 2000) }

  const savePassword = () => {
    if (!curPwd || !newPwd || !confirmPwd) { setPwdError("Please fill in all fields."); return }
    if (newPwd !== confirmPwd) { setPwdError("New passwords do not match."); return }
    if (newPwd.length < 8) { setPwdError("Password must be at least 8 characters."); return }
    setPwdError("")
    setCurPwd(""); setNewPwd(""); setConfirmPwd("")
    save(setPwdSaved)
  }

  useEffect(() => {
    api.isCustomizationEnabled()
      .then(data => setCustomizationEnabled(data.enabled))
      .catch(() => setCustomizationEnabled(true))
  }, [])

  // Play the entrance animation once on mount, then turn it off.
  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleToggleCustomization = async () => {
    setToggleLoading(true)
    try {
      await api.setCustomizationEnabled(!customizationEnabled)
      setCustomizationEnabled(!customizationEnabled)
      setToggleSaved(true)
      setTimeout(() => setToggleSaved(false), 2000)
    } catch (e) {
      alert("Failed to update toggle: " + e.message)
    } finally {
      setToggleLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Gentle fade + rise so content eases in once loaded instead of flashing. */}
      <style>{`
        @keyframes settingsRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .settings-rise { animation: settingsRise 0.85s ease-out both; }
      `}</style>

      <h1 className={`text-xl font-bold ${entered ? "" : "settings-rise"}`} style={{ color: t.bodyTxt }}>Settings</h1>

      <div className={`grid grid-cols-1 xl:grid-cols-2 gap-5 ${entered ? "" : "settings-rise"}`} style={{ animationDelay: "0.12s" }}>

        {/* Store Information */}
        <SectionCard title="Store Information" subtitle="Basic details about your business"
          icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4">
          <Field label="Store Name">
            <Input value={storeName} onChange={setStoreName} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact Email">
              <Input type="email" value={storeEmail} onChange={setStoreEmail} />
            </Field>
            <Field label="Contact Phone">
              <Input value={storePhone} onChange={setStorePhone} placeholder="+63 9XX XXX XXXX" />
            </Field>
          </div>
          <Field label="Primary Branch">
            <Select value={branch} onChange={setBranch} options={["Manila","Pampanga"]} />
          </Field>
          <Field label="Additional Branches">
            <div className="flex flex-wrap gap-2">
              {["Manila","Pampanga"].map(b => (
                <span key={b} className="px-3 py-1.5 text-xs font-semibold rounded-md"
                  style={{ backgroundColor: t.tagBg, color: t.tagTxt, border: `1px solid ${t.tagBdr}` }}>
                  {b}
                </span>
              ))}
            </div>
          </Field>
          <div className="flex justify-end pt-1">
            <SaveBtn onClick={() => save(setStoreSaved)} saved={storeSaved} />
          </div>
        </SectionCard>

        {/* Notifications */}
        <SectionCard title="Notification Settings" subtitle="Choose what alerts you receive"
          icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9">
          <Toggle checked={notifEmail}    onChange={setNotifEmail}    label="Email Notifications"       hint="Receive updates via email" />
          <Divider />
          <Toggle checked={notifOrders}   onChange={setNotifOrders}   label="New Order Alerts"          hint="Get notified when a new order is placed" />
          <Divider />
          <Toggle checked={notifLowStock} onChange={setNotifLowStock} label="Low Stock Alerts"          hint="Notify when items fall below threshold" />
          <Divider />
          <Toggle checked={notifMessages} onChange={setNotifMessages} label="Customer Message Alerts"  hint="Notify on new customer messages" />
          <Divider />
          <Toggle checked={notifSMS}      onChange={setNotifSMS}      label="SMS Notifications"         hint="Send text message alerts (additional charges may apply)" />
          <div className="flex justify-end pt-1">
            <SaveBtn onClick={() => save(setNotifSaved)} saved={notifSaved} />
          </div>
        </SectionCard>

        {/* Business Hours */}
        <SectionCard title="Business Hours" subtitle="Set your store's operating hours"
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Opening Time">
              <Input type="time" value={openTime} onChange={setOpenTime} />
            </Field>
            <Field label="Closing Time">
              <Input type="time" value={closeTime} onChange={setCloseTime} />
            </Field>
          </div>
          <Field label="Open Days">
            <div className="flex flex-wrap gap-2 mt-1">
              {DAYS.map(d => (
                <button key={d} onClick={() => toggleDay(d)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md transition-all"
                  style={{
                    backgroundColor: openDays.includes(d) ? DG : t.dayOff,
                    color: openDays.includes(d) ? "white" : t.dayOffTxt,
                    border: openDays.includes(d) ? "none" : `1px solid ${t.dayOffBdr}`,
                  }}>
                  {d}
                </button>
              ))}
            </div>
          </Field>
          <div className="flex justify-end pt-1">
            <SaveBtn onClick={() => save(setHoursSaved)} saved={hoursSaved} />
          </div>
        </SectionCard>

        {/* Delivery Settings */}
        <SectionCard title="Delivery Settings" subtitle="Configure delivery fees and rules"
          icon="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Delivery Fee (₱)" hint="Standard delivery fee">
              <Input type="number" value={deliveryFee} onChange={setDeliveryFee} placeholder="150" />
            </Field>
            <Field label="Minimum Order (₱)" hint="Minimum order for delivery">
              <Input type="number" value={minOrder} onChange={setMinOrder} placeholder="500" />
            </Field>
          </div>
          <Field label="Same-Day Delivery Cutoff" hint="Orders placed before this time qualify">
            <Input type="time" value={sameDayCutoff} onChange={setSameDayCutoff} />
          </Field>
          <Field label="Delivery Coverage">
            <div className="flex flex-wrap gap-2">
              {["Manila","Pampanga"].map(a => (
                <span key={a} className="px-3 py-1.5 text-xs font-semibold rounded-md"
                  style={{ backgroundColor: t.tagBg, color: t.tagTxt, border: `1px solid ${t.tagBdr}` }}>
                  {a}
                </span>
              ))}
            </div>
          </Field>
          <div className="flex justify-end pt-1">
            <SaveBtn onClick={() => save(setDelivSaved)} saved={delivSaved} />
          </div>
        </SectionCard>
      </div>

      {/* Site Features */}
      <SectionCard title="Site Features" subtitle="Control which features are available to customers"
        className={entered ? "" : "settings-rise"} style={{ animationDelay: "0.24s" }}
        icon="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z">
        <Toggle
          checked={customizationEnabled}
          onChange={handleToggleCustomization}
          label="AI Customization (Describe & Mix/Match)"
          hint={toggleLoading ? "Saving..." : toggleSaved ? "Saved!" : "Disable during peak seasons to manage workload"}
        />
        <p className="text-sm mt-2" style={{ color: t.subTxt }}>
          When disabled, customers will see a message and grayed-out buttons on DescribeArrangement and MixAndMatch pages.
        </p>
      </SectionCard>

      {/* Account Security */}
      <SectionCard title="Account Security" subtitle="Update your password to keep your account secure"
        className={entered ? "" : "settings-rise"} style={{ animationDelay: "0.36s" }}
        icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Current Password">
            <Input type="password" value={curPwd} onChange={setCurPwd} placeholder="Enter current password" />
          </Field>
          <Field label="New Password">
            <Input type="password" value={newPwd} onChange={setNewPwd} placeholder="Enter new password" />
          </Field>
          <Field label="Confirm New Password">
            <Input type="password" value={confirmPwd} onChange={setConfirmPwd} placeholder="Confirm new password" />
          </Field>
        </div>
        {pwdError && (
          <p className="text-sm flex items-center gap-1.5 text-red-500">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {pwdError}
          </p>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <p className="text-sm" style={{ color: t.subTxt }}>Use at least 8 characters with letters and numbers.</p>
          <SaveBtn onClick={savePassword} saved={pwdSaved} />
        </div>
      </SectionCard>

      {/* Danger Zone */}
      <SectionCard danger title="Danger Zone" subtitle="These actions are irreversible. Please proceed with caution."
        className={entered ? "" : "settings-rise"} style={{ animationDelay: "0.48s" }}
        icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: t.bodyTxt }}>Clear All Activity Logs</p>
            <p className="text-xs mt-0.5" style={{ color: t.subTxt }}>Permanently delete all audit logs from the system.</p>
          </div>
          <button
            className="px-4 py-2 text-sm font-semibold border rounded-md transition-all"
            style={{ color: "#f87171", borderColor: t.isDark ? "#7f1d1d" : "#fecaca", backgroundColor: "transparent" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = t.isDark ? "rgba(239,68,68,0.1)" : "#fef2f2"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            Clear Logs
          </button>
        </div>
      </SectionCard>
    </div>
  )
}