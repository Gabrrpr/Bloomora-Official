import { useState, useEffect, useCallback } from "react"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api.js"
import { DG, G, Pagination } from "./_adminShared"


// ── Dark token hook ───────────────────────────────────────────────────────────
function useDark() {
  const { isDark } = useTheme()
  return {
    isDark,
    // Backgrounds — each level clearly distinct
    pageBg:   isDark ? "transparent" : "transparent",
    cardBg:   isDark ? "#1a2332"  : "white",
    cardBdr:  isDark ? "#2d3748"  : "#e8edf2",
    cardShdw: isDark ? "none"     : "0 1px 3px rgba(0,0,0,0.04)",
    hdrBg:    isDark ? "#111827"  : "#fafbfc",
    hdrBdr:   isDark ? "#1e293b"  : "#f1f5f9",
    rowEven:  isDark ? "#1a2332"  : "white",
    rowOdd:   isDark ? "#111827"  : "white",
    rowHov:   isDark ? "rgba(74,222,128,0.05)" : "#f8fffe",
    // Inputs
    inputBg:  isDark ? "#1e293b"  : "white",
    inputBdr: isDark ? "#475569"  : "#dde3ec",   // brighter border so clearly visible
    inputTxt: isDark ? "#f1f5f9"  : "#111827",
    // Text
    headC:    isDark ? "#ffffff"  : "#111827",    // pure white headings
    cellC:    isDark ? "#f1f5f9"  : "#1e293b",    // very bright primary cell text
    subC:     isDark ? "#cbd5e1"  : "#6b7280",    // much brighter secondary text
    labelC:   isDark ? "#94a3b8"  : "#4b5563",
    muted:    isDark ? "#64748b"  : "#9ca3af",
    // Accents
    accentG:  isDark ? "#4ade80"  : G,
    accentDG: isDark ? "#22c55e"  : DG,
    priceG:   isDark ? "#4ade80"  : DG,
    // Modal
    modalBg:  isDark ? "#1a2332"  : "white",
    modalBdr: isDark ? "#2d3748"  : "#e8edf2",
    modalHdr: isDark ? "#111827"  : "linear-gradient(135deg,#f0fdf4,#fafff8)",
    modalFtr: isDark ? "#0f172a"  : "#fafbfc",
    overlay:  "rgba(5,10,20,0.75)",
    // Step card
    stepBg:   isDark ? "#0f172a"  : "white",
    stepBdr:  isDark ? "#2d3748"  : "#e8edf2",
  }
}

// ── Form primitives ───────────────────────────────────────────────────────────
function FInput({ placeholder, value, onChange, type = "text", hint, error, d }) {
  const borderColor = error ? "#ef4444" : d.inputBdr;
  
  return (
    <div>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm border rounded-md outline-none transition-all"
        style={{ 
          borderColor: borderColor, 
          backgroundColor: d.inputBg, 
          color: d.inputTxt 
        }}
        onFocus={e => { 
          e.target.style.borderColor = error ? "#ef4444" : "#4ade80"; 
          e.target.style.boxShadow = error ? "0 0 0 2px rgba(239,68,68,0.2)" : "0 0 0 2px rgba(74,222,128,0.2)";
        }}
        onBlur={e => { 
          e.target.style.borderColor = borderColor; 
          e.target.style.boxShadow = "none"; 
        }}
      />
      {error ? (
        <p className="text-[10px] font-bold mt-1 text-red-500 animate-pulse">{error}</p>
      ) : hint ? (
        <p className="text-[10px] mt-0.5" style={{ color: d.muted }}>{hint}</p>
      ) : null}
    </div>
  )
}

function FSel({ options, value, onChange, placeholder, d }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full appearance-none px-3 py-2.5 text-sm border rounded-md cursor-pointer outline-none transition-all"
        style={{ borderColor:d.inputBdr, backgroundColor:d.inputBg, color:value?d.inputTxt:d.muted }}
        onFocus={e => { e.target.style.borderColor="#4ade80"; e.target.style.boxShadow="0 0 0 2px rgba(74,222,128,0.2)" }}
        onBlur={e => { e.target.style.borderColor=d.inputBdr; e.target.style.boxShadow="none" }}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:d.muted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
      </svg>
    </div>
  )
}

function FL({ children, d }) {
  return <label className="block text-xs font-bold mb-1" style={{ color:d.labelC }}>{children}</label>
}

function StepCard({ n, title, children, d }) {
  return (
    <div className="rounded-xl p-5"
      style={{ backgroundColor:d.stepBg, border:`1px solid ${d.stepBdr}`, boxShadow:d.cardShdw }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold" style={{ color:d.headC }}>{title}</p>
        <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white"
          style={{ background:`linear-gradient(135deg,${DG},${G})` }}>{n}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

// ── Role color badges ─────────────────────────────────────────────────────────
function RoleBadge({ role, isDark }) {
  const map = {
    admin:    { bg:isDark?"rgba(167,139,250,0.15)":"#f3e8ff", color:isDark?"#c4b5fd":"#7c3aed" },
    staff:    { bg:isDark?"rgba(56,189,248,0.12)":"#e0f2fe",  color:isDark?"#7dd3fc":"#0891b2" },
    delivery: { bg:isDark?"rgba(251,191,36,0.12)":"#fef3c7",  color:isDark?"#fcd34d":"#b45309" },
  }
  const s = map[role?.toLowerCase()] || map.staff
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold capitalize"
      style={{ backgroundColor:s.bg, color:s.color }}>{role}</span>
  )
}

// 🚀 FIXED: Directly checking the clean 'staff_status' string from the backend
function StatusBadge({ status, isDark }) {
  const s = status === "inactive"
    ? { label:"Inactive", bg:isDark?"rgba(248,113,113,0.12)":"#fef2f2", color:isDark?"#f87171":"#dc2626" }
    : status === "pending"
      ? { label:"Pending",  bg:isDark?"rgba(251,191,36,0.12)":"#fef9c3",  color:isDark?"#fcd34d":"#92400e" }
      : { label:"Active",   bg:isDark?"rgba(74,222,128,0.12)":"#dcfce7",  color:isDark?"#4ade80":"#15803d" }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold"
      style={{ backgroundColor:s.bg, color:s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor:s.color }}/>
      {s.label}
    </span>
  )
}

// ── Export button ─────────────────────────────────────────────────────────────
function ExportStaffBtn({ data=[], d }) {
  const handleExport = () => {
    const headers = ["User ID","Username","First Name","Last Name","Email","Phone","Role","Branch","Status"]
    // 🚀 FIXED: Now uses the actual staff_status variable for CSV exports
    const rows = data.length ? data.map(r => [
      r.id, r.username, r.first_name, r.last_name, r.email, r.phone_number||"", r.role, r.branch||"",
      r.staff_status ? r.staff_status.charAt(0).toUpperCase() + r.staff_status.slice(1) : "Unknown"
    ].join(",")) : [headers.map(()=>"—").join(",")]
    const csv=[headers.join(","),...rows].join("\n"), blob=new Blob([csv],{type:"text/csv"}), url=URL.createObjectURL(blob), a=document.createElement("a")
    a.href=url; a.download=`staff_export_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url)
  }
  return (
    <button onClick={handleExport}
      className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all active:scale-95"
      style={{ borderColor:d.inputBdr, color:d.subC, backgroundColor:d.inputBg }}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
      Export
    </button>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
function StaffPagination({ total=0, d }) {
  const dis = total===0
  const base = "px-3 py-1.5 text-xs font-semibold border rounded-md transition-all"
  const ok   = { borderColor:d.inputBdr, color:d.cellC, cursor:"pointer", backgroundColor:d.inputBg }
  const off  = { borderColor:d.hdrBdr,  color:d.muted, cursor:"not-allowed", backgroundColor:d.hdrBg }
  return (
    <div className="flex items-center justify-between px-5 py-3" style={{ borderTop:`1px solid ${d.hdrBdr}` }}>
      <p className="text-xs" style={{ color:d.muted }}>
        {dis ? "Showing 0 staff accounts" : `Showing ${total} staff account${total!==1?"s":""}`}
      </p>
      <div className="flex items-center gap-1">
        {["← Prev","1","2","3","Next →"].map(lbl => (
          <button key={lbl} disabled={dis} className={base} style={dis?off:ok}
            onMouseEnter={e=>{if(!dis){e.currentTarget.style.borderColor="#4ade80";e.currentTarget.style.color="#4ade80"}}}
            onMouseLeave={e=>{if(!dis){e.currentTarget.style.borderColor=d.inputBdr;e.currentTarget.style.color=d.cellC}}}>{lbl}</button>
        ))}
      </div>
    </div>
  )
}

// ── Add Staff form section wrapper (module-scope so inputs don't lose focus) ──
function Section({ icon, title, subtitle, children, d }) {
  return (
    <div className="px-5 py-5" style={{ borderBottom:`1px solid ${d.hdrBdr}` }}>
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
          style={{ background:`linear-gradient(135deg,${DG},${G})` }}>{icon}</span>
        <div>
          <p className="text-sm font-bold leading-tight" style={{ color:d.headC }}>{title}</p>
          {subtitle && <p className="text-xs mt-0.5" style={{ color:d.muted }}>{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

// ── Add Staff Form ────────────────────────────────────────────────────────────
function AddStaffForm({ onBack, onCreated }) {
  const d = useDark();
  const [f, setF] = useState({ fn:"", mn:"", ln:"", un:"", role:"", branch:"", email:"", phone:"" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  
  const s = k => v => { 
    setF(p => ({ ...p, [k]: v })); 
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: null })); 
  };

  const validateForm = () => {
    const newErrors = {};
    const email = f.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{11}$/; 

    if (!f.fn.trim()) newErrors.fn = "First name is required.";
    if (!f.ln.trim()) newErrors.ln = "Last name is required.";
    if (!f.role) newErrors.role = "Role is required.";
    
    if (!email) newErrors.email = "Email is required.";
    else if (!emailRegex.test(email)) newErrors.email = "Invalid email format.";
    
    if (f.phone && !phoneRegex.test(f.phone)) newErrors.phone = "Must be 11 digits.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = async () => {
    setFormError(null);
    if (!validateForm()) {
      setFormError("Please fix the errors above.");
      return;
    }

    setSubmitting(true);
    try {
      await api.createStaff({ 
        first_name: f.fn, 
        middle_name: f.mn || undefined, 
        last_name: f.ln, 
        username: f.un || undefined, 
        role: f.role.toLowerCase(), 
        branch: f.branch === "" ? undefined : f.branch, 
        email: f.email, 
        phone_number: f.phone || undefined 
      });
      onCreated(); 
      onBack();
    } catch(err) {
      console.error("API Error Details:", err.response?.data || err.message);
      setFormError(err.response?.data?.detail || err.message || "Failed to create staff account.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── derived preview values ──
  const fullName = `${f.fn} ${f.mn} ${f.ln}`.replace(/\s+/g, " ").trim()
  const initials = ((f.fn?.[0] || "") + (f.ln?.[0] || "")).toUpperCase() || "?"
  const roleColors = {
    admin:    { bg:d.isDark?"rgba(167,139,250,0.15)":"#f3e8ff", color:d.isDark?"#c4b5fd":"#7c3aed" },
    staff:    { bg:d.isDark?"rgba(56,189,248,0.12)":"#e0f2fe",  color:d.isDark?"#7dd3fc":"#0891b2" },
    delivery: { bg:d.isDark?"rgba(251,191,36,0.12)":"#fef3c7",  color:d.isDark?"#fcd34d":"#b45309" },
  }
  const rc = roleColors[f.role.toLowerCase()] || null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold" style={{ color:d.headC }}>Add New Staff</h2>
          <p className="text-xs mt-0.5" style={{ color:d.muted }}>Create an account and send an email invite to set up their password.</p>
        </div>
        <button onClick={onBack}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all"
          style={{ borderColor:d.inputBdr, color:d.subC, backgroundColor:d.inputBg }}>
          ← Back to table
        </button>
      </div>

      {formError && (
        <div className="px-4 py-3 text-sm rounded-md border"
          style={{ color:"#f87171", backgroundColor:d.isDark?"rgba(248,113,113,0.1)":"#fef2f2", borderColor:d.isDark?"rgba(248,113,113,0.3)":"#fecaca" }}>
          {formError}
        </div>
      )}

      {/* Two-column: form (left) + live preview (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* ── Form card (spans 2 cols on desktop) ── */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden"
          style={{ backgroundColor:d.cardBg, border:`1px solid ${d.cardBdr}`, boxShadow:d.cardShdw }}>

          <Section
            d={d}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>}
            title="Personal Information"
            subtitle="The staff member's legal name">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><FL d={d}>First name <span style={{ color:"#f87171" }}>*</span></FL><FInput placeholder="First name" value={f.fn} onChange={s("fn")} error={errors.fn} d={d}/></div>
              <div><FL d={d}>Middle name</FL><FInput placeholder="Middle name" value={f.mn} onChange={s("mn")} d={d}/></div>
              <div><FL d={d}>Last name <span style={{ color:"#f87171" }}>*</span></FL><FInput placeholder="Last name" value={f.ln} onChange={s("ln")} error={errors.ln} d={d}/></div>
            </div>
          </Section>

          <Section
            d={d}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 014 0v2m-4 0h4"/></svg>}
            title="Account Information"
            subtitle="Login identity and access level">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <FL d={d}>Username</FL>
                <FInput placeholder="e.g. j.delacruz" value={f.un} onChange={s("un")} hint="first initial.last name" d={d}/>
              </div>
              <div><FL d={d}>Role <span style={{ color:"#f87171" }}>*</span></FL><FSel options={["Admin","Staff","Delivery"]} value={f.role} onChange={s("role")} placeholder="Select role" d={d}/>{errors.role && <p className="text-[10px] font-bold mt-1 text-red-500">{errors.role}</p>}</div>
              <div><FL d={d}>Branch</FL><FSel options={["Manila","Pampanga"]} value={f.branch} onChange={s("branch")} placeholder="Select branch" d={d}/></div>
            </div>
          </Section>

          <Section
            d={d}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>}
            title="Contact Details"
            subtitle="Where the invite will be sent">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><FL d={d}>Email address <span style={{ color:"#f87171" }}>*</span></FL><FInput type="email" placeholder="e.g. j.delacruz@gmail.com" value={f.email} onChange={s("email")} error={errors.email} d={d}/></div>
              <div>
                <FL d={d}>Phone number</FL>
                <div className="flex gap-2">
                  <select className="appearance-none px-2 py-2.5 text-sm border rounded-md outline-none flex-shrink-0"
                    style={{ borderColor:d.inputBdr, backgroundColor:d.inputBg, color:d.inputTxt, width:"70px" }}>
                    <option>+63</option>
                  </select>
                  <div className="flex-1"><FInput placeholder="Phone number" value={f.phone} onChange={s("phone")} error={errors.phone} d={d}/></div>
                </div>
              </div>
            </div>
          </Section>

          {/* last section: no bottom border */}
          <div className="px-5 py-5">
            <div className="flex items-start gap-3 p-4 rounded-lg border"
              style={{ backgroundColor: d.isDark ? "rgba(56,189,248,0.1)" : "#f0f9ff", borderColor: d.isDark ? "rgba(56,189,248,0.2)" : "#bae6fd" }}>
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: d.isDark ? "#38bdf8" : "#0284c7" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <p className="text-xs leading-relaxed" style={{ color: d.isDark ? "#bae6fd" : "#0369a1" }}>
                An invitation link will be emailed to <strong className="font-bold">{f.email || "this address"}</strong>. The staff member will use this link to verify their account and securely set their own password.
              </p>
            </div>
          </div>
        </div>

        {/* ── Live preview card (right column, sticky on desktop) ── */}
        <div className="lg:sticky lg:top-4">
          <div className="rounded-xl overflow-hidden"
            style={{ backgroundColor:d.cardBg, border:`1px solid ${d.cardBdr}`, boxShadow:d.cardShdw }}>
            <p className="px-5 pt-4 pb-3 text-[11px] font-bold uppercase tracking-wider" style={{ color:d.muted, borderBottom:`1px solid ${d.hdrBdr}` }}>
              Preview
            </p>

            {/* avatar + name banner */}
            <div className="px-5 py-6 flex flex-col items-center text-center"
              style={{ background: d.isDark ? "linear-gradient(135deg,#0f3326,#16432f)" : "linear-gradient(135deg,#f0fdf4,#fafff8)" }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3"
                style={{ background:`linear-gradient(135deg,${DG},${G})`, boxShadow:"0 6px 18px rgba(12,87,62,0.3)" }}>
                {initials}
              </div>
              <p className="text-base font-bold" style={{ color:d.headC }}>
                {fullName || "New Staff Member"}
              </p>
              <p className="text-xs mt-0.5" style={{ color:d.muted }}>
                {f.un ? `@${f.un}` : "username pending"}
              </p>
              <div className="mt-3 flex items-center gap-2">
                {rc
                  ? <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold capitalize" style={{ backgroundColor:rc.bg, color:rc.color }}>{f.role}</span>
                  : <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold" style={{ backgroundColor:d.isDark?"#1e293b":"#f1f5f9", color:d.muted }}>No role yet</span>}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold"
                  style={{ backgroundColor:d.isDark?"rgba(251,191,36,0.12)":"#fef9c3", color:d.isDark?"#fcd34d":"#92400e" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor:d.isDark?"#fcd34d":"#92400e" }}/>
                  Pending
                </span>
              </div>
            </div>

            {/* detail rows */}
            <div className="px-5 py-4 space-y-3">
              {[
                { label:"Email",  value:f.email,  icon:"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
                { label:"Phone",  value:f.phone ? `+63 ${f.phone}` : "", icon:"M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" },
                { label:"Branch", value:f.branch, icon:"M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3">
                  <svg className="w-4 h-4 flex-shrink-0" style={{ color:d.muted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={row.icon}/>
                  </svg>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color:d.muted }}>{row.label}</p>
                    <p className="text-sm font-medium truncate" style={{ color: row.value ? d.cellC : d.muted }}>
                      {row.value || "Not set"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* submit button lives in the preview footer so it feels like the final step */}
            <div className="px-5 py-4" style={{ borderTop:`1px solid ${d.hdrBdr}`, backgroundColor:d.modalFtr }}>
              <button onClick={handleSubmit} disabled={submitting}
                className="w-full flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                style={{ background:`linear-gradient(135deg,${DG},${G})`, boxShadow:"0 2px 8px rgba(12,87,62,0.3)" }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                {submitting?"Sending Invite...":"Send Invite"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── View Staff Modal ──────────────────────────────────────────────────────────
function ViewStaffModal({ staff, onClose }) {
  const d = useDark()
  const rows = [
    { label:"Full Name", value:`${staff.first_name} ${staff.middle_name||""} ${staff.last_name}`.replace(/\s+/g," ").trim() },
    { label:"Username",  value:staff.username },
    { label:"Email",     value:staff.email },
    { label:"Phone",     value:staff.phone_number||"—" },
    { label:"Role",      value:staff.role },
    { label:"Branch",    value:staff.branch||"—" },
    // 🚀 FIXED: Render correct staff_status text
    { label:"Status",    value:staff.staff_status ? staff.staff_status.charAt(0).toUpperCase() + staff.staff_status.slice(1) : "Unknown" },
    { label:"User ID",   value:staff.id, mono:true },
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor:d.overlay, backdropFilter:"blur(4px)" }}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="rounded-xl w-full overflow-hidden flex flex-col"
        style={{ maxWidth:"480px", maxHeight:"90vh", boxShadow:"0 24px 64px rgba(0,0,0,0.55)", border:`1px solid ${d.modalBdr}`, backgroundColor:d.modalBg }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom:`1px solid ${d.hdrBdr}`, background:d.modalHdr }}>
          <p className="text-base font-bold" style={{ color:d.headC }}>Staff Details</p>
          <button onClick={onClose} className="p-2 rounded-lg transition-all" style={{ color:d.muted }}
            onMouseEnter={e=>e.currentTarget.style.backgroundColor=d.hdrBg}
            onMouseLeave={e=>e.currentTarget.style.backgroundColor="transparent"}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-3 overflow-y-auto">
          {rows.map(row => (
            <div key={row.label} className="flex justify-between gap-4 text-sm">
              <span className="font-semibold flex-shrink-0" style={{ color:d.labelC }}>{row.label}</span>
              <span className="text-right" style={{ color:d.cellC, fontFamily:row.mono?"monospace":"inherit", fontSize:row.mono?"11px":"14px" }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 flex-shrink-0"
          style={{ borderTop:`1px solid ${d.hdrBdr}`, backgroundColor:d.modalFtr }}>
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-semibold border rounded-md transition-all"
            style={{ borderColor:d.inputBdr, color:d.subC, backgroundColor:d.inputBg }}
            onMouseEnter={e=>e.currentTarget.style.backgroundColor=d.hdrBg}
            onMouseLeave={e=>e.currentTarget.style.backgroundColor=d.inputBg}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Edit Staff Modal ──────────────────────────────────────────────────────────
function EditStaffModal({ staff, onClose, onSaved }) {
  const d = useDark()
  const [form, setForm] = useState({
    first_name:   staff.first_name||"",
    middle_name:  staff.middle_name||"",
    last_name:    staff.last_name||"",
    email:        staff.email||"",
    phone_number: staff.phone_number||"",
    role:         staff.role||"",
    branch:       staff.branch||"",
    is_active:    staff.is_active??true,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState(null)
  const set = key => val => setForm(f=>({...f,[key]:val}))

  const handleSave = async () => {
    setErr(null); setSaving(true)
    try {
      await api.updateUser(staff.id, { first_name:form.first_name, middle_name:form.middle_name||undefined, last_name:form.last_name, email:form.email, phone_number:form.phone_number||undefined, role:form.role, branch:form.branch||undefined, is_active:form.is_active })
      onSaved(); onClose()
    } catch(e){setErr(e.message||"Failed to update staff")} finally{setSaving(false)}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor:d.overlay, backdropFilter:"blur(4px)" }}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="rounded-xl w-full overflow-hidden"
        style={{ maxWidth:"520px", maxHeight:"90vh", boxShadow:"0 24px 64px rgba(0,0,0,0.55)", border:`1px solid ${d.modalBdr}`, backgroundColor:d.modalBg }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom:`1px solid ${d.hdrBdr}`, background:d.modalHdr }}>
          <div>
            <p className="text-base font-bold" style={{ color:d.headC }}>Edit Staff</p>
            <p className="text-xs mt-0.5" style={{ color:d.muted }}>Update {staff.first_name}'s account details</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-all" style={{ color:d.muted }}
            onMouseEnter={e=>e.currentTarget.style.backgroundColor=d.hdrBg}
            onMouseLeave={e=>e.currentTarget.style.backgroundColor="transparent"}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight:"calc(90vh - 130px)" }}>
          {err && (
            <div className="px-4 py-3 text-sm rounded-md border"
              style={{ color:"#f87171", backgroundColor:d.isDark?"rgba(248,113,113,0.1)":"#fef2f2", borderColor:d.isDark?"rgba(248,113,113,0.3)":"#fecaca" }}>
              {err}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><FL d={d}>First name</FL><FInput placeholder="First name" value={form.first_name} onChange={set("first_name")} d={d}/></div>
            <div><FL d={d}>Last name</FL><FInput placeholder="Last name" value={form.last_name} onChange={set("last_name")} d={d}/></div>
          </div>
          <div><FL d={d}>Middle name</FL><FInput placeholder="Middle name" value={form.middle_name} onChange={set("middle_name")} d={d}/></div>
          <div><FL d={d}>Email</FL><FInput type="email" placeholder="Email" value={form.email} onChange={set("email")} d={d}/></div>
          <div><FL d={d}>Phone</FL><FInput placeholder="Phone number" value={form.phone_number} onChange={set("phone_number")} d={d}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><FL d={d}>Role</FL><FSel options={["Admin","Staff","Delivery"]} value={form.role} onChange={set("role")} placeholder="Select role" d={d}/></div>
            <div><FL d={d}>Branch</FL><FSel options={["Manila","Pampanga"]} value={form.branch} onChange={set("branch")} placeholder="Select branch" d={d}/></div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button onClick={() => set("is_active")(!form.is_active)}
              className="relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0"
              style={{ backgroundColor:form.is_active?(d.isDark?"#4ade80":G):(d.isDark?"#334155":"#d1d5db") }}>
              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200"
                style={{ left:form.is_active?"19px":"2px" }}/>
            </button>
            <span className="text-sm font-medium" style={{ color:d.subC }}>Account active</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 flex-shrink-0"
          style={{ borderTop:`1px solid ${d.hdrBdr}`, backgroundColor:d.modalFtr }}>
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-semibold border rounded-md transition-all"
            style={{ borderColor:d.inputBdr, color:d.subC, backgroundColor:d.inputBg }}
            onMouseEnter={e=>e.currentTarget.style.backgroundColor=d.hdrBg}
            onMouseLeave={e=>e.currentTarget.style.backgroundColor=d.inputBg}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ background:`linear-gradient(135deg,${DG},${G})`, boxShadow:"0 2px 8px rgba(12,87,62,0.3)" }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
            {saving?"Saving...":"Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Deactivate Confirm ────────────────────────────────────────────────────────
function DeactivateModal({ staff, onClose, onConfirm }) {
  const d = useDark()
  const [confirmText, setConfirmText] = useState("")

  const isConfirmed = confirmText === staff.username

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor:d.overlay, backdropFilter:"blur(4px)" }}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="rounded-2xl p-6 w-full max-w-md"
        style={{ backgroundColor:d.modalBg, border:`1px solid ${d.modalBdr}`, boxShadow:"0 24px 64px rgba(0,0,0,0.55)" }}>
        
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor:d.isDark?"rgba(248,113,113,0.12)":"#fef2f2", border:`1px solid ${d.isDark?"rgba(248,113,113,0.25)":"#fecaca"}` }}>
            <svg className="w-6 h-6" style={{ color:"#f87171" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold mb-1" style={{ color:d.headC }}>Deactivate Staff Account?</h3>
            <p className="text-sm leading-relaxed" style={{ color:d.subC }}>
              This will prevent <strong style={{ color:d.cellC }}>{staff.first_name} {staff.last_name}</strong> from logging in. Their past data will remain intact in the database.
            </p>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: d.isDark ? "rgba(0,0,0,0.2)" : "#f8fafc", border: `1px solid ${d.cardBdr}` }}>
          <label className="block text-xs font-bold mb-2" style={{ color:d.labelC }}>
            To verify, type <span className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: d.isDark ? "#334155" : "#e2e8f0", color: "#ef4444" }}>{staff.username}</span> below:
          </label>
          <input 
            type="text" 
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={staff.username}
            className="w-full px-3 py-2.5 text-sm border rounded-md outline-none transition-all font-mono"
            style={{ borderColor:d.inputBdr, backgroundColor:d.inputBg, color:d.inputTxt }}
            onFocus={e => { e.target.style.borderColor = "#f87171"; e.target.style.boxShadow = "0 0 0 2px rgba(248,113,113,0.2)" }}
            onBlur={e => { e.target.style.borderColor = d.inputBdr; e.target.style.boxShadow = "none" }}
          />
        </div>

        <div className="flex gap-3 justify-end pt-4" style={{ borderTop:`1px solid ${d.hdrBdr}` }}>
          <button onClick={onClose}
            className="px-5 py-2 text-sm font-semibold border rounded-xl transition-all hover:opacity-75"
            style={{ borderColor:d.inputBdr, color:d.subC, backgroundColor:d.inputBg }}>
            Cancel
          </button>
          
          <button 
            onClick={onConfirm}
            disabled={!isConfirmed}
            className="px-5 py-2 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: "#dc2626", boxShadow: isConfirmed ? "0 2px 8px rgba(220,38,38,0.3)" : "none" }}>
            Deactivate
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminStaff() {
  const d = useDark()
  const { isDark } = d
  const [search, setSearch]           = useState("")
  const [showForm, setShowForm]       = useState(false)
  const [statusFilter, setStatus]     = useState("")
  const [branchFilter, setBranch]     = useState("")
  const [roleFilter, setRole]         = useState("")
  const [staff, setStaff]             = useState([])
  const [total, setTotal]             = useState(0)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const [viewingStaff, setViewing]    = useState(null)
  const [editingStaff, setEditing]    = useState(null)
  const [deactivating, setDeactivating] = useState(null)

  const fetchStaff = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = { role:"staff" }
      if (search.trim()) params.search = search.trim()
      if (branchFilter) params.branch = branchFilter.toLowerCase()
      if (roleFilter)   params.role   = roleFilter.toLowerCase()
      if (statusFilter) {
        const m = { Active:"active", Inactive:"inactive", Suspended:"inactive", "Pending Activation":"pending" }
        params.status = m[statusFilter]||statusFilter.toLowerCase()
      }
      const data = await api.getUsers(params)
      setStaff(data.users||[]); setTotal(data.total||0)
    } catch(err){setError(err.message||"Failed to load staff")} finally{setLoading(false)}
  }, [search,branchFilter,roleFilter,statusFilter])

  useEffect(() => { fetchStaff() }, [fetchStaff])

  const adminCount    = staff.filter(s => s.role==="admin").length
  const staffCount    = staff.filter(s => s.role==="staff").length
  const deliveryCount = staff.filter(s => s.role==="delivery").length

  const confirmDeactivate = async () => {
    if (!deactivating) return
    try { await api.updateUser(deactivating.id,{is_active:false}); fetchStaff() }
    catch(err){alert(err.message||"Failed to deactivate staff")}
    finally { setDeactivating(null) }
  }

  if (showForm) return <AddStaffForm onBack={() => setShowForm(false)} onCreated={fetchStaff}/>

  // Select style shorthand
  const sel = { borderColor:d.inputBdr, backgroundColor:d.inputBg, color:d.inputTxt }

  return (
    <div className="space-y-5">
      {viewingStaff  && <ViewStaffModal staff={viewingStaff} onClose={()=>setViewing(null)}/>}
      {editingStaff  && <EditStaffModal staff={editingStaff} onClose={()=>setEditing(null)} onSaved={fetchStaff}/>}
      {deactivating  && <DeactivateModal staff={deactivating} onClose={()=>setDeactivating(null)} onConfirm={confirmDeactivate}/>}

      <h1 className="text-xl font-bold" style={{ color:d.headC }}>Staffs</h1>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Green */}
        <div className="rounded-xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between transition-all duration-200"
          style={{ background:"linear-gradient(135deg,#0a4a34 0%,#1a7040 60%,#2E8B34 100%)", boxShadow:"0 4px 16px rgba(12,87,62,0.25)" }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color:"rgba(255,255,255,0.65)" }}>Total Staffs</p>
            <p className="text-3xl font-bold text-white mt-2">{total}</p>
            <p className="text-xs mt-1" style={{ color:"rgba(255,255,255,0.5)" }}>↑ +0 this week</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="mt-3 self-start text-xs font-bold px-3 py-1.5 rounded-md transition-all hover:scale-105"
            style={{ backgroundColor:"rgba(255,255,255,0.15)", color:"white", border:"1px solid rgba(255,255,255,0.2)" }}>
            + Add Staff
          </button>
        </div>
        {/* White cards */}
        {[
          { label:"Admins",         val:adminCount,    accent:"#a78bfa" },
          { label:"Staffs",         val:staffCount,    accent:"#38bdf8" },
          { label:"Delivery Staffs",val:deliveryCount, accent:"#fbbf24" },
        ].map(({ label, val, accent }) => (
          <div key={label} className="rounded-xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between transition-all duration-200"
            style={{ backgroundColor:d.cardBg, border:`1px solid ${d.cardBdr}`, boxShadow:d.cardShdw }}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-1px)"}
            onMouseLeave={e=>e.currentTarget.style.transform=""}>
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ backgroundColor:accent }}/>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color:d.muted }}>{label}</p>
              <p className="text-3xl font-bold mt-2" style={{ color:d.headC }}>{val}</p>
              <p className="text-xs mt-1 font-medium" style={{ color:d.muted }}>+0 this week</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="rounded-xl overflow-hidden"
        style={{ border:`1px solid ${d.cardBdr}`, backgroundColor:d.cardBg, boxShadow:d.cardShdw }}>

        {/* Toolbar */}
        <div className="p-3 sm:p-4" style={{ borderBottom:`1px solid ${d.hdrBdr}`, backgroundColor:d.hdrBg }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:flex-wrap">
            {/* Dropdowns — share a row on mobile, inline on desktop */}
            <div className="grid grid-cols-2 sm:flex gap-2">
              {[
                { val:statusFilter, set:setStatus, opts:["All Status","Active","Inactive","Suspended","Pending Activation"], min:"140px" },
                { val:branchFilter, set:setBranch, opts:["All Branches","Manila","Pampanga"], min:"130px" },
                { val:roleFilter,   set:setRole,   opts:["All Roles","Admin","Staff","Delivery"], min:"120px" },
              ].map(({ val, set: setVal, opts, min }, i) => (
                <div key={i} className="relative">
                  <select value={val}
                    onChange={e => setVal(e.target.value===opts[0]?"":e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2 text-sm border rounded-md cursor-pointer outline-none transition-all"
                    style={{ ...sel, minWidth:min }}
                    onFocus={e=>{e.target.style.borderColor="#4ade80";e.target.style.boxShadow="0 0 0 2px rgba(74,222,128,0.18)"}}
                    onBlur={e=>{e.target.style.borderColor=d.inputBdr;e.target.style.boxShadow="none"}}>
                    {opts.map(o=><option key={o} value={o===opts[0]?"":o}>{o}</option>)}
                  </select>
                  <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:d.muted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
                  </svg>
                </div>
              ))}
            </div>
            {/* Search */}
            <div className="relative flex-1" style={{ minWidth:"180px" }}>
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:d.muted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z"/>
              </svg>
              <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")fetchStaff()}}
                placeholder="User ID or username"
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-md outline-none transition-all"
                style={sel}
                onFocus={e=>{e.target.style.borderColor="#4ade80";e.target.style.boxShadow="0 0 0 2px rgba(74,222,128,0.18)"}}
                onBlur={e=>{e.target.style.borderColor=d.inputBdr;e.target.style.boxShadow="none"}}/>
            </div>
            {/* Refresh + Export — share a row on mobile */}
            <div className="flex gap-2">
              <button onClick={fetchStaff} disabled={loading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all active:scale-95 disabled:opacity-50"
                style={{ borderColor:d.inputBdr, color:d.subC, backgroundColor:d.inputBg }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Refresh
              </button>
              <div className="flex-1 sm:flex-none"><ExportStaffBtn data={staff} d={d}/></div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 py-3 text-sm border-b"
            style={{ color:"#f87171", backgroundColor:isDark?"rgba(248,113,113,0.08)":"#fef2f2", borderColor:isDark?"rgba(248,113,113,0.2)":"#fecaca" }}>
            {error}
          </div>
        )}

        {/* Table — desktop only */}
        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full" style={{ minWidth:"700px" }}>
            <thead style={{ borderBottom:`1px solid ${d.hdrBdr}`, backgroundColor:d.hdrBg }}>
              <tr>
                {["User ID","Username","Name","Branch","Role","Status","Action"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ color:d.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ borderTop:`1px solid ${isDark ? "#1e293b" : "#f1f5f9"}` }}>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color:d.muted }}>Loading staff...</td></tr>
              ) : staff.length===0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color:d.muted }}>
                  {search||statusFilter||branchFilter||roleFilter
                    ? "No staff match your filters."
                    : "Click '+ Add Staff' to create your first staff account."}
                </td></tr>
              ) : staff.map((s, idx) => (
                <tr key={s.id}
                  style={{ borderBottom:`1px solid ${d.hdrBdr}`, backgroundColor:idx%2===0?d.rowEven:d.rowOdd }}
                  onMouseEnter={e=>e.currentTarget.style.backgroundColor=d.rowHov}
                  onMouseLeave={e=>e.currentTarget.style.backgroundColor=idx%2===0?d.rowEven:d.rowOdd}>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs" style={{ color:d.muted }}>{s.id.slice(0,8)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-sm" style={{ color:d.cellC }}>{s.username}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm" style={{ color:d.cellC }}>{s.first_name} {s.last_name}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm" style={{ color:d.subC }}>{s.branch||"—"}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <RoleBadge role={s.role} isDark={isDark}/>
                  </td>
                  <td className="px-5 py-3.5">
                    {/* 🚀 FIXED: Directly passing the staff_status string */}
                    <StatusBadge status={s.staff_status} isDark={isDark}/>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setEditing(s)}
                        className="px-3 py-1.5 text-xs font-bold text-white rounded-md transition-all hover:opacity-85 active:scale-95"
                        style={{ backgroundColor:DG }}>
                        Edit
                      </button>
                      <button onClick={() => setViewing(s)}
                        className="px-3 py-1.5 text-xs font-bold rounded-md border transition-all hover:shadow-sm active:scale-95"
                        style={{ backgroundColor:isDark?"rgba(74,222,128,0.1)":"#f0fdf4", borderColor:isDark?"rgba(74,222,128,0.3)":"#bbf7d0", color:isDark?"#4ade80":DG }}>
                        View
                      </button>
                      <button onClick={() => setDeactivating(s)}
                        className="w-7 h-7 flex items-center justify-center rounded-md transition-all active:scale-95"
                        style={{ backgroundColor:isDark?"rgba(248,113,113,0.12)":"#fef2f2", border:`1px solid ${isDark?"rgba(248,113,113,0.25)":"#fecaca"}` }}
                        onMouseEnter={e=>e.currentTarget.style.backgroundColor=isDark?"rgba(248,113,113,0.25)":"#fee2e2"}
                        onMouseLeave={e=>e.currentTarget.style.backgroundColor=isDark?"rgba(248,113,113,0.12)":"#fef2f2"}>
                        <svg className="w-3.5 h-3.5" style={{ color:"#f87171" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card list — mobile only (all details, no horizontal scroll) */}
        <div className="sm:hidden">
          {loading ? (
            <p className="px-5 py-12 text-center text-sm" style={{ color:d.muted }}>Loading staff...</p>
          ) : staff.length===0 ? (
            <p className="px-5 py-12 text-center text-sm" style={{ color:d.muted }}>
              {search||statusFilter||branchFilter||roleFilter
                ? "No staff match your filters."
                : "Click '+ Add Staff' to create your first staff account."}
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor:d.hdrBdr }}>
              {staff.map(s => (
                <div key={s.id} className="p-4" style={{ borderColor:d.hdrBdr }}>
                  {/* top row: name + username, then status badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color:d.cellC }}>{s.first_name} {s.last_name}</p>
                      <p className="text-xs truncate" style={{ color:d.muted }}>@{s.username}</p>
                    </div>
                    <StatusBadge status={s.staff_status} isDark={isDark}/>
                  </div>

                  {/* detail chips */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3 text-xs" style={{ color:d.subC }}>
                    <span className="flex items-center gap-1.5">
                      <span className="font-bold uppercase tracking-wider" style={{ color:d.muted }}>Role</span>
                      <RoleBadge role={s.role} isDark={isDark}/>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="font-bold uppercase tracking-wider" style={{ color:d.muted }}>Branch</span>
                      <span style={{ color:d.cellC }}>{s.branch||"—"}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="font-bold uppercase tracking-wider" style={{ color:d.muted }}>ID</span>
                      <span className="font-mono" style={{ color:d.cellC }}>{s.id.slice(0,8)}</span>
                    </span>
                  </div>

                  {/* actions — full width, easy to tap */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditing(s)}
                      className="flex-1 px-3 py-2 text-xs font-bold text-white rounded-md transition-all active:scale-95"
                      style={{ backgroundColor:DG }}>
                      Edit
                    </button>
                    <button onClick={() => setViewing(s)}
                      className="flex-1 px-3 py-2 text-xs font-bold rounded-md border transition-all active:scale-95"
                      style={{ backgroundColor:isDark?"rgba(74,222,128,0.1)":"#f0fdf4", borderColor:isDark?"rgba(74,222,128,0.3)":"#bbf7d0", color:isDark?"#4ade80":DG }}>
                      View
                    </button>
                    <button onClick={() => setDeactivating(s)}
                      className="w-9 h-9 flex items-center justify-center rounded-md transition-all active:scale-95 flex-shrink-0"
                      style={{ backgroundColor:isDark?"rgba(248,113,113,0.12)":"#fef2f2", border:`1px solid ${isDark?"rgba(248,113,113,0.25)":"#fecaca"}` }}>
                      <svg className="w-4 h-4" style={{ color:"#f87171" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <StaffPagination total={total} d={d}/>
      </div>
    </div>
  )
}