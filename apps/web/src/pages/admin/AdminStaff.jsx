import { useState } from "react"
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
function AddStaffForm({ onBack }) {
  const [f, setF] = useState({ fn: "", mn: "", ln: "", un: "", role: "", branch: "", email: "", phone: "", pwd: "", force: true })
  const s = k => v => setF(p => ({ ...p, [k]: v }))
  const gen = () => {
    const c = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$"
    s("pwd")(Array.from({ length: 12 }, () => c[Math.floor(Math.random() * c.length)]).join(""))
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
        <button className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
          style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Create Staff
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

  if (showForm) return <AddStaffForm onBack={() => setShowForm(false)} />

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Staffs</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GreenCard label="Total Staffs" value={0} sub="↑ +0 this week" action="Add Staff" onAction={() => setShowForm(true)} />
        <WhiteCard label="Admins" value={0} sub="+0 this Week" accentColor="#7c3aed" />
        <WhiteCard label="Staffs" value={0} sub="+0 this Week" accentColor="#0891b2" />
        <WhiteCard label="Delivery Staffs" value={0} sub="+0 this Week" accentColor="#f59e0b" />
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
                <option value="Pending">Pending Activation</option>
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
                placeholder="User ID or username"
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-white outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
              />
            </div>

            <ExportStaffBtn data={[]} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "700px" }}>
            <thead style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
              <tr><TH>User ID</TH><TH>Username</TH><TH>Branch</TH><TH>Role</TH><TH>Status</TH><TH>Last Login</TH><TH>Action</TH></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <EmptyRow cols={7} message="Click '+ Add Staff' to create your first staff account." />
            </tbody>
          </table>
        </div>

        <StaffPagination total={0} />
      </TableWrap>
    </div>
  )
}
