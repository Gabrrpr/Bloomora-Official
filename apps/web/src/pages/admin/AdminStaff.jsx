import { useState, useEffect, useCallback } from "react"
import { api } from "../../services/api.js"
import { DG, G, GreenCard, WhiteCard, Pagination, TH, EmptyRow, TableWrap } from "./_adminShared"

// ── Reusable form primitives ──────────────────────────────────────────────────
function FInput({ placeholder, value, onChange, type = "text", hint }) {
  return (
    <div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm border rounded-md bg-white outline-none transition-all"
        style={{ borderColor: "#dde3ec" }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.10)` }}
        onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
      />
      {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  )
}

function FSel({ options, value, onChange, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none px-3 py-2.5 text-sm border rounded-md bg-white cursor-pointer outline-none transition-all"
        style={{ borderColor: "#dde3ec", color: value ? "#0f172a" : "#9ca3af" }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.10)` }}
        onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  )
}

function StepCard({ n, title, children }) {
  return (
    <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #e8edf2", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white"
          style={{ background: `linear-gradient(135deg,${DG},${G})` }}>{n}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function FL({ children }) {
  return <label className="block text-xs font-semibold text-gray-600 mb-1">{children}</label>
}

// ── Functional Export Button ──────────────────────────────────────────────────
function ExportStaffBtn({ data = [] }) {
  const handleExport = () => {
    const headers = ["User ID", "Username", "First Name", "Last Name", "Email", "Phone", "Role", "Branch", "Status", "Last Login"]
    const rows = data.length
      ? data.map(r => headers.map(h => r[h] ?? "").join(","))
      : [headers.map(() => "—").join(",")]
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `staff_export_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md hover:bg-gray-50 transition-all text-gray-600 active:scale-95"
      style={{ borderColor: "#dde3ec" }}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export
    </button>
  )
}

// ── Functional Pagination ─────────────────────────────────────────────────────
function StaffPagination({ total = 0 }) {
  const disabled = total === 0
  const btnBase = "px-3 py-1.5 text-xs font-semibold border rounded-md transition-all"
  const disabledStyle = { borderColor: "#e5e7eb", color: "#d1d5db", cursor: "not-allowed", backgroundColor: "#fafafa" }
  const activeStyle = { borderColor: "#dde3ec", color: "#374151", cursor: "pointer" }

  return (
    <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #f1f5f9" }}>
      <p className="text-xs text-gray-400">
        {disabled ? "Showing 0 staff accounts" : `Showing ${total} staff account${total !== 1 ? "s" : ""}`}
      </p>
      <div className="flex items-center gap-1">
        {["← Prev", "1", "2", "3", "Next →"].map(lbl => (
          <button
            key={lbl}
            disabled={disabled}
            className={btnBase}
            style={disabled ? disabledStyle : activeStyle}
            onMouseEnter={e => { if (!disabled) { e.currentTarget.style.backgroundColor = "#f0fdf4"; e.currentTarget.style.borderColor = G; e.currentTarget.style.color = G } }}
            onMouseLeave={e => { if (!disabled) { e.currentTarget.style.backgroundColor = ""; e.currentTarget.style.borderColor = "#dde3ec"; e.currentTarget.style.color = "#374151" } }}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Add Staff Form ────────────────────────────────────────────────────────────
function AddStaffForm({ onBack, onCreated }) {
  const [f, setF] = useState({ fn: "", mn: "", ln: "", un: "", role: "", branch: "", email: "", phone: "", pwd: "", force: true })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const s = k => v => setF(p => ({ ...p, [k]: v }))
  const gen = () => {
    const c = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$"
    s("pwd")(Array.from({ length: 12 }, () => c[Math.floor(Math.random() * c.length)]).join(""))
  }

  const handleSubmit = async () => {
    setFormError(null)
    if (!f.fn || !f.ln || !f.email || !f.role || !f.pwd) {
      setFormError("Please fill in all required fields.")
      return
    }
    setSubmitting(true)
    try {
      await api.createStaff({
        first_name: f.fn,
        middle_name: f.mn || undefined,
        last_name: f.ln,
        username: f.un || undefined,
        role: f.role.toLowerCase(),
        branch: f.branch || undefined,
        email: f.email,
        phone_number: f.phone || undefined,
        password: f.pwd,
        force_password_change: f.force,
      })
      onCreated()
      onBack()
    } catch (err) {
      setFormError(err.message || "Failed to create staff account.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GreenCard label="Total Staffs" value={0} />
        {["Admins", "Staffs", "Delivery Staffs"].map(l => <WhiteCard key={l} label={l} value={0} />)}
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Add New Staff</h2>
        <button onClick={onBack} className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md hover:bg-gray-50 transition-all text-gray-600" style={{ borderColor: "#dde3ec" }}>← Back to table</button>
      </div>

      {formError && (
        <div className="px-4 py-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StepCard n={1} title="Personal Information">
          <div><FL>First name</FL><FInput placeholder="Enter first name" value={f.fn} onChange={s("fn")} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><FL>Middle name</FL><FInput placeholder="Middle name" value={f.mn} onChange={s("mn")} /></div>
            <div><FL>Last name</FL><FInput placeholder="Last name" value={f.ln} onChange={s("ln")} /></div>
          </div>
        </StepCard>
        <StepCard n={2} title="Account Information">
          <div><FL>Username</FL><FInput placeholder="e.g. j.delacruz" value={f.un} onChange={s("un")} hint="First and middle initial, dot, last name. Example: j.delacruz" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><FL>Role</FL><FSel options={["Admin", "Staff", "Delivery"]} value={f.role} onChange={s("role")} placeholder="Select role" /></div>
            <div><FL>Branch</FL><FSel options={["Manila", "Pampanga"]} value={f.branch} onChange={s("branch")} placeholder="Select branch" /></div>
          </div>
        </StepCard>
        <StepCard n={3} title="Contact Details">
          <div><FL>Email address</FL><FInput type="email" placeholder="ex: jdelacruz@gmail.com" value={f.email} onChange={s("email")} /></div>
          <div><FL>Phone number</FL>
            <div className="flex gap-2">
              <select className="appearance-none px-2 py-2.5 text-sm border rounded-md bg-white outline-none" style={{ borderColor: "#dde3ec", width: "70px" }}><option>+63</option></select>
              <FInput placeholder="Phone number" value={f.phone} onChange={s("phone")} />
            </div>
          </div>
        </StepCard>
        <StepCard n={4} title="Security">
          <div><FL>Password</FL>
            <div className="flex gap-2">
              <input type="text" value={f.pwd} onChange={e => s("pwd")(e.target.value)} placeholder="Temporary Password"
                className="flex-1 px-3 py-2.5 text-sm border rounded-md bg-white outline-none transition-all"
                style={{ borderColor: "#dde3ec", fontFamily: f.pwd ? "monospace" : "inherit" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.10)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }} />
              <button onClick={gen} className="px-3 py-2 text-xs font-semibold border rounded-md hover:bg-gray-50 transition-all text-gray-700 flex-shrink-0" style={{ borderColor: "#dde3ec" }}>Generate</button>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <button onClick={() => s("force")(!f.force)} className="relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0" style={{ backgroundColor: f.force ? G : "#d1d5db" }}>
              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200" style={{ left: f.force ? "19px" : "2px" }} />
            </button>
            <span className="text-xs text-gray-600">Force password change on first login</span>
          </label>
        </StepCard>
      </div>
      <div className="flex justify-end">
        <button onClick={handleSubmit} disabled={submitting}
          className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
          style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          {submitting ? "Creating..." : "Create Staff"}
        </button>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminStaff() {
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState("")
  const [branchFilter, setBranchFilter] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [staff, setStaff] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [viewingStaff, setViewingStaff] = useState(null)
  const [editingStaff, setEditingStaff] = useState(null)

  const fetchStaff = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { role: "staff" }
      if (search.trim()) params.search = search.trim()
      if (branchFilter) params.branch = branchFilter.toLowerCase()
      if (roleFilter) params.role = roleFilter.toLowerCase()
      if (statusFilter) {
        const map = { Active: "active", Inactive: "inactive", Suspended: "inactive", "Pending Activation": "unverified" }
        params.status = map[statusFilter] || statusFilter.toLowerCase()
      }
      const data = await api.getUsers(params)
      setStaff(data.users || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err.message || "Failed to load staff")
    } finally {
      setLoading(false)
    }
  }, [search, branchFilter, roleFilter, statusFilter])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  const adminCount = staff.filter(s => s.role === "admin").length
  const staffCount = staff.filter(s => s.role === "staff").length
  const deliveryCount = staff.filter(s => s.role === "delivery").length

  const statusBadge = (s) => {
    if (!s.is_active) return { label: "Inactive", bg: "#fee2e2", color: "#dc2626" }
    if (!s.is_verified) return { label: "Pending", bg: "#fef9c3", color: "#92400e" }
    return { label: "Active", bg: "#dcfce7", color: "#15803d" }
  }

  const handleViewStaff = (s) => setViewingStaff(s)
  const handleEditStaff = (s) => setEditingStaff(s)
  const handleDeleteStaff = async (id) => {
    if (!window.confirm("Deactivate this staff account?")) return
    try {
      await api.updateUser(id, { is_active: false })
      fetchStaff()
    } catch (err) {
      alert(err.message || "Failed to deactivate staff")
    }
  }

  if (showForm) return <AddStaffForm onBack={() => setShowForm(false)} onCreated={fetchStaff} />

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Staffs</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GreenCard label="Total Staffs" value={total} sub="↑ +0 this week" action="Add Staff" onAction={() => setShowForm(true)} />
        <WhiteCard label="Admins" value={adminCount} sub="+0 this Week" accentColor="#7c3aed" />
        <WhiteCard label="Staffs" value={staffCount} sub="+0 this Week" accentColor="#0891b2" />
        <WhiteCard label="Delivery Staffs" value={deliveryCount} sub="+0 this Week" accentColor="#f59e0b" />
      </div>

      <TableWrap>
        <div className="p-4" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md bg-white text-gray-700 cursor-pointer outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
              >
                <option value="">Status: All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
                <option value="Pending Activation">Pending Activation</option>
              </select>
              <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {/* Branch */}
            <div className="relative">
              <select
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md bg-white text-gray-700 cursor-pointer outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
              >
                <option value="">All Branches</option>
                <option value="Manila">Manila</option>
                <option value="Pampanga">Pampanga</option>
              </select>
              <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {/* Role */}
            <div className="relative">
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md bg-white text-gray-700 cursor-pointer outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
              >
                <option value="">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
                <option value="Delivery">Delivery</option>
              </select>
              <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {/* Search */}
            <div className="relative flex-1" style={{ minWidth: "180px" }}>
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') fetchStaff() }}
                placeholder="User ID or username"
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-white outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
              />
            </div>

            <button
              onClick={fetchStaff}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border rounded-md hover:bg-gray-50 transition-all text-gray-600 active:scale-95 disabled:opacity-50"
              style={{ borderColor: "#dde3ec" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>

            <ExportStaffBtn data={staff} />
          </div>
        </div>

        {error && (
          <div className="px-5 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "700px" }}>
            <thead style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
              <tr><TH>User ID</TH><TH>Username</TH><TH>Name</TH><TH>Branch</TH><TH>Role</TH><TH>Status</TH><TH>Action</TH></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">Loading staff...</td></tr>
              ) : staff.length === 0 ? (
                <EmptyRow cols={7} message={search || statusFilter || branchFilter || roleFilter ? "No staff match your filters." : "Click '+ Add Staff' to create your first staff account."} />
              ) : (
                staff.map(s => {
                  const sb = statusBadge(s)
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-gray-500 font-mono">{s.id.slice(0, 8)}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-700 font-medium">{s.username}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-700">{s.first_name} {s.last_name}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{s.branch || "—"}</td>
                      <td className="px-5 py-3.5 text-sm">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold capitalize"
                          style={{
                            backgroundColor: s.role === "admin" ? "#f3e8ff" : s.role === "delivery" ? "#fef3c7" : "#e0f2fe",
                            color: s.role === "admin" ? "#7c3aed" : s.role === "delivery" ? "#b45309" : "#0891b2",
                          }}>
                          {s.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold"
                          style={{ backgroundColor: sb.bg, color: sb.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sb.color }} />
                          {sb.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleEditStaff(s)}
                            className="px-3 py-1.5 text-xs font-semibold text-white rounded-md transition-all hover:opacity-85 active:scale-95"
                            style={{ backgroundColor: DG }}>Edit</button>
                          <button onClick={() => handleViewStaff(s)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-md border transition-all hover:shadow-sm active:scale-95"
                            style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", color: DG }}>View</button>
                          <button onClick={() => handleDeleteStaff(s.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-md transition-all hover:bg-red-600 active:scale-95"
                            style={{ backgroundColor: "#1e293b" }}>
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <StaffPagination total={total} />
      </TableWrap>

      {/* View Staff Modal */}
      {viewingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(15,23,42,0.5)", backdropFilter: "blur(3px)" }}
          onClick={e => { if (e.target === e.currentTarget) setViewingStaff(null) }}>
          <div className="bg-white rounded-xl w-full overflow-hidden"
            style={{ maxWidth: "480px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", border: "1px solid #e8edf2" }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg, #f0fdf4, #fafff8)" }}>
              <p className="text-base font-bold text-gray-900">Staff Details</p>
              <button onClick={() => setViewingStaff(null)} className="p-2 rounded-lg hover:bg-gray-100 transition-all text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: "Full Name", value: `${viewingStaff.first_name} ${viewingStaff.middle_name || ""} ${viewingStaff.last_name}` },
                { label: "Username", value: viewingStaff.username },
                { label: "Email", value: viewingStaff.email },
                { label: "Phone", value: viewingStaff.phone_number || "—" },
                { label: "Role", value: viewingStaff.role },
                { label: "Branch", value: viewingStaff.branch || "—" },
                { label: "Status", value: viewingStaff.is_active ? (viewingStaff.is_verified ? "Active" : "Pending") : "Inactive" },
                { label: "User ID", value: viewingStaff.id },
              ].map(field => (
                <div key={field.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{field.label}</span>
                  <span className="font-medium text-gray-800">{field.value}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4" style={{ borderTop: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
              <button onClick={() => setViewingStaff(null)}
                className="px-4 py-2 text-sm font-semibold border rounded-md hover:bg-gray-50 transition-all text-gray-600"
                style={{ borderColor: "#dde3ec" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <EditStaffModal
          staff={editingStaff}
          onClose={() => setEditingStaff(null)}
          onSaved={fetchStaff}
        />
      )}
    </div>
  )
}

// ── Edit Staff Modal ─────────────────────────────────────────────────────────
function EditStaffModal({ staff, onClose, onSaved }) {
  const [form, setForm] = useState({
    first_name: staff.first_name || "",
    middle_name: staff.middle_name || "",
    last_name: staff.last_name || "",
    email: staff.email || "",
    phone_number: staff.phone_number || "",
    role: staff.role || "",
    branch: staff.branch || "",
    is_active: staff.is_active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    setErr(null)
    setSaving(true)
    try {
      await api.updateUser(staff.id, {
        first_name: form.first_name,
        middle_name: form.middle_name || undefined,
        last_name: form.last_name,
        email: form.email,
        phone_number: form.phone_number || undefined,
        role: form.role,
        branch: form.branch || undefined,
        is_active: form.is_active,
      })
      onSaved()
      onClose()
    } catch (e) {
      setErr(e.message || "Failed to update staff")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(15,23,42,0.5)", backdropFilter: "blur(3px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-xl w-full overflow-hidden"
        style={{ maxWidth: "520px", maxHeight: "90vh", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", border: "1px solid #e8edf2" }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg, #f0fdf4, #fafff8)" }}>
          <p className="text-base font-bold text-gray-900">Edit Staff</p>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-all text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight: "calc(90vh - 130px)" }}>
          {err && <div className="px-4 py-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">{err}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div><FL>First name</FL><FInput placeholder="First name" value={form.first_name} onChange={set("first_name")} /></div>
            <div><FL>Last name</FL><FInput placeholder="Last name" value={form.last_name} onChange={set("last_name")} /></div>
          </div>
          <div><FL>Middle name</FL><FInput placeholder="Middle name" value={form.middle_name} onChange={set("middle_name")} /></div>
          <div><FL>Email</FL><FInput type="email" placeholder="Email" value={form.email} onChange={set("email")} /></div>
          <div><FL>Phone</FL><FInput placeholder="Phone number" value={form.phone_number} onChange={set("phone_number")} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><FL>Role</FL><FSel options={["Admin", "Staff", "Delivery"]} value={form.role} onChange={set("role")} placeholder="Select role" /></div>
            <div><FL>Branch</FL><FSel options={["Manila", "Pampanga"]} value={form.branch} onChange={set("branch")} placeholder="Select branch" /></div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => set("is_active")(e.target.checked)}
              className="w-4 h-4 accent-green-600 rounded" />
            <span className="text-sm text-gray-700">Account active</span>
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-semibold border rounded-md hover:bg-gray-50 transition-all text-gray-600"
            style={{ borderColor: "#dde3ec" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}

