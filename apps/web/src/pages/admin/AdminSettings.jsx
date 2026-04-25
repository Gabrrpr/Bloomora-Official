import { useState } from "react"

const DG = "#0C573E"
const G  = "#2E8B34"

function SectionCard({ title, subtitle, icon, children }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #e8edf2", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>
          <svg className="w-4 h-4" style={{ color: DG }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = "text", disabled = false }) {
  return (
    <input type={type} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} disabled={disabled}
      className="w-full px-3 py-2.5 text-sm border rounded-md bg-white outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
      style={{ borderColor: "#dde3ec" }}
      onFocus={e => { if (!disabled) { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.10)` } }}
      onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }} />
  )
}

function Select({ value, onChange, options }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange?.(e.target.value)}
        className="w-full appearance-none px-3 py-2.5 text-sm border rounded-md bg-white cursor-pointer outline-none transition-all"
        style={{ borderColor: "#dde3ec" }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.10)` }}
        onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
      <svg className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  )
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <button onClick={() => onChange?.(!checked)}
        className="relative flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200"
        style={{ backgroundColor: checked ? G : "#d1d5db" }}>
        <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200"
          style={{ left: checked ? "22px" : "2px" }} />
      </button>
    </div>
  )
}

function Divider() {
  return <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "4px 0" }} />
}

function SaveBtn({ onClick, saved }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
      style={{ background: saved ? "#16a34a" : `linear-gradient(135deg, ${DG}, ${G})` }}>
      {saved ? (
        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Saved!</>
      ) : (
        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>Save Changes</>
      )}
    </button>
  )
}

export default function AdminSettings() {
  // Store info
  const [storeName, setStoreName] = useState("Esting's Flower International Inc.")
  const [storeEmail, setStoreEmail] = useState("estings@gmail.com")
  const [storePhone, setStorePhone] = useState("+63 9XX XXX XXXX")
  const [branch, setBranch] = useState("Manila")
  const [storeSaved, setStoreSaved] = useState(false)

  // Notifications
  const [notifEmail, setNotifEmail]     = useState(true)
  const [notifOrders, setNotifOrders]   = useState(true)
  const [notifLowStock, setNotifLowStock] = useState(true)
  const [notifMessages, setNotifMessages] = useState(true)
  const [notifSMS, setNotifSMS]         = useState(false)
  const [notifSaved, setNotifSaved]     = useState(false)

  // Business hours
  const [openTime, setOpenTime]   = useState("08:00")
  const [closeTime, setCloseTime] = useState("20:00")
  const [openDays, setOpenDays]   = useState(["Mon","Tue","Wed","Thu","Fri","Sat"])
  const [hoursSaved, setHoursSaved] = useState(false)

  // Delivery
  const [deliveryFee, setDeliveryFee]   = useState("150")
  const [minOrder, setMinOrder]         = useState("500")
  const [sameDayCutoff, setSameDayCutoff] = useState("09:00")
  const [delivSaved, setDelivSaved]     = useState(false)

  // Password
  const [curPwd, setCurPwd]     = useState("")
  const [newPwd, setNewPwd]     = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [pwdSaved, setPwdSaved] = useState(false)
  const [pwdError, setPwdError] = useState("")

  const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
  const toggleDay = (d) => setOpenDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])

  const save = (setter) => { setter(true); setTimeout(() => setter(false), 2000) }

  const savePassword = () => {
    if (!curPwd || !newPwd || !confirmPwd) { setPwdError("Please fill in all fields."); return }
    if (newPwd !== confirmPwd) { setPwdError("New passwords do not match."); return }
    if (newPwd.length < 8) { setPwdError("Password must be at least 8 characters."); return }
    setPwdError("")
    setCurPwd(""); setNewPwd(""); setConfirmPwd("")
    save(setPwdSaved)
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Store Information */}
        <SectionCard
          title="Store Information"
          subtitle="Basic details about your business"
          icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4">
          <Field label="Store Name">
            <Input value={storeName} onChange={setStoreName} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact Email">
              <Input type="email" value={storeEmail} onChange={setStoreEmail} />
            </Field>
            <Field label="Contact Phone">
              <Input value={storePhone} onChange={setStorePhone} />
            </Field>
          </div>
          <Field label="Primary Branch">
            <Select value={branch} onChange={setBranch} options={["Manila","Pampanga"]} />
          </Field>
          <Field label="Additional Branches">
            <div className="flex flex-wrap gap-2">
              {["Manila","Pampanga"].map(b => (
                <span key={b} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md"
                  style={{ backgroundColor: "#f0fdf4", color: DG, border: `1px solid #bbf7d0` }}>
                  {b}
                  <button className="w-3 h-3 text-green-400 hover:text-red-500 transition-colors">×</button>
                </span>
              ))}
            </div>
          </Field>
          <div className="flex justify-end pt-1">
            <SaveBtn onClick={() => save(setStoreSaved)} saved={storeSaved} />
          </div>
        </SectionCard>

        {/* Notifications */}
        <SectionCard
          title="Notification Settings"
          subtitle="Choose what alerts you receive"
          icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9">
          <Toggle checked={notifEmail} onChange={setNotifEmail} label="Email Notifications" hint="Receive updates via email" />
          <Divider />
          <Toggle checked={notifOrders} onChange={setNotifOrders} label="New Order Alerts" hint="Get notified when a new order is placed" />
          <Divider />
          <Toggle checked={notifLowStock} onChange={setNotifLowStock} label="Low Stock Alerts" hint="Notify when items fall below threshold" />
          <Divider />
          <Toggle checked={notifMessages} onChange={setNotifMessages} label="Customer Message Alerts" hint="Notify on new customer messages" />
          <Divider />
          <Toggle checked={notifSMS} onChange={setNotifSMS} label="SMS Notifications" hint="Send text message alerts (additional charges may apply)" />
          <div className="flex justify-end pt-1">
            <SaveBtn onClick={() => save(setNotifSaved)} saved={notifSaved} />
          </div>
        </SectionCard>

        {/* Business Hours */}
        <SectionCard
          title="Business Hours"
          subtitle="Set your store's operating hours"
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
                    backgroundColor: openDays.includes(d) ? DG : "white",
                    color: openDays.includes(d) ? "white" : "#6b7280",
                    border: openDays.includes(d) ? "none" : "1px solid #dde3ec",
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
        <SectionCard
          title="Delivery Settings"
          subtitle="Configure delivery fees and rules"
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
                  style={{ backgroundColor: "#f0fdf4", color: DG, border: "1px solid #bbf7d0" }}>
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

      {/* Change Password — full width */}
      <SectionCard
        title="Account Security"
        subtitle="Update your password to keep your account secure"
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
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {pwdError}
          </p>
        )}
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-gray-400">Use at least 8 characters with letters and numbers.</p>
          <SaveBtn onClick={savePassword} saved={pwdSaved} />
        </div>
      </SectionCard>

      {/* Danger zone */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #fecaca", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid #fecaca", backgroundColor: "#fff5f5" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#fee2e2" }}>
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-red-700">Danger Zone</p>
            <p className="text-xs text-red-400 mt-0.5">These actions are irreversible. Please proceed with caution.</p>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">Clear All Activity Logs</p>
            <p className="text-xs text-gray-400 mt-0.5">Permanently delete all audit logs from the system.</p>
          </div>
          <button className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-all">
            Clear Logs
          </button>
        </div>
      </div>
    </div>
  )
}
