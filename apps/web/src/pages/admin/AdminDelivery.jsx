import { useState, useEffect } from "react"
import { useTheme } from "../../context/ThemeContext"
import { DG, G, GreenCard, WhiteCard } from "./_adminShared"
import estingsWordmark from "../../assets/Estings.svg"

const SEARCH_SAMPLES = ["Juan Dela Cruz", "Mark Reyes", "Angelo Cruz", "Paolo Ramos"]

function FlowerLoader({ message = "Loading...", isDark = false }) {
  const petals = [
    { angle: 0,   color: "#f48fb1" },
    { angle: 60,  color: "#ec407a" },
    { angle: 120, color: "#e91e63" },
    { angle: 180, color: "#f06292" },
    { angle: 240, color: "#c2185b" },
    { angle: 300, color: "#f48fb1" },
  ]
  return (
    <>
      <style>{`
        @keyframes adminPetalBloom {
          0%, 100% { opacity: 0.2; }
          50%       { opacity: 1;   }
        }
      `}</style>
      <div className="flex flex-col items-center justify-center rounded-xl"
        style={{ minHeight: "60vh", backgroundColor: isDark ? "#0f172a" : "transparent" }}>
        <svg width="120" height="120" viewBox="0 0 100 100">
          {petals.map(({ angle, color }, i) => (
            <g key={i} transform={`rotate(${angle} 50 50)`}>
              <ellipse cx="50" cy="27" rx="9.5" ry="21" fill={color}
                style={{ animation: `adminPetalBloom 1.4s ease-in-out ${(i * 0.2).toFixed(2)}s infinite`, animationFillMode: "both" }} />
            </g>
          ))}
          <circle cx="50" cy="50" r="12" fill="#2E8B34" />
          <circle cx="50" cy="50" r="7"  fill="#f9c6d0" />
          <circle cx="50" cy="50" r="3.5" fill="#fff" opacity="0.7" />
        </svg>
        <p className="mt-4 text-sm font-medium tracking-wide" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>{message}</p>
      </div>
    </>
  )
}

function PrintBtn({ onClick }) {
  return (
    <button onClick={onClick}
      className="no-print flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all active:scale-95"
      style={{ borderColor: "#dde3ec", color: "#374151", backgroundColor: "white" }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f9fafb"}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = "white"}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Print
    </button>
  )
}

function ExportDeliveryBtn({ data = [], isDark }) {
  const handleExport = () => {
    const headers = ["Rider Name", "Assigned Area", "Assigned Orders", "Last Assigned", "Status", "Phone"]
    const rows = data.length
      ? data.map(r => headers.map(h => r[h] ?? "").join(","))
      : [headers.map(() => "—").join(",")]
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `delivery_riders_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <button onClick={handleExport}
      className="no-print flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all active:scale-95"
      style={{ borderColor: isDark ? "#374151" : "#dde3ec", color: isDark ? "#94a3b8" : "#6b7280", backgroundColor: isDark ? "#1e293b" : "white" }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#2d3f55" : "#f9fafb"}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "white"}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export CSV
    </button>
  )
}

function DeliveryPagination({ total = 0, isDark }) {
  const disabled = total === 0
  const toolbarBdr = isDark ? "#1e293b" : "#f1f5f9"
  const toolbarBg  = isDark ? "#111827" : "#fafbfc"
  return (
    <div className="flex items-center justify-between px-5 py-3 no-print" style={{ borderTop: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
      <p className="text-sm" style={{ color: isDark ? "#94a3b8" : "#9ca3af" }}>
        {disabled ? "Showing 0 delivery riders" : `Showing ${total} delivery rider${total !== 1 ? "s" : ""}`}
      </p>
      <div className="flex items-center gap-1">
        {["← Prev", "1", "2", "3", "Next →"].map(lbl => (
          <button key={lbl} disabled={disabled}
            className="px-3 py-1.5 text-xs font-semibold border rounded-md transition-all"
            style={{ borderColor: disabled ? (isDark ? "#2d3748" : "#e5e7eb") : (isDark ? "#374151" : "#dde3ec"), color: disabled ? (isDark ? "#4b5563" : "#d1d5db") : (isDark ? "#94a3b8" : "#374151"), backgroundColor: isDark ? "#1e293b" : "white", cursor: disabled ? "not-allowed" : "pointer" }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = isDark ? "#2d3f55" : "#f0fdf4" }}
            onMouseLeave={e => { if (!disabled) e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "white" }}>
            {lbl}
          </button>
        ))}
      </div>
    </div>
  )
}

function FDrop({ value, onChange, children, isDark, inputBg, inputBdr, inputTxt }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md cursor-pointer outline-none transition-all"
        style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.15)` }}
        onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none" }}>
        {children}
      </select>
      <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: isDark ? "#64748b" : "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  )
}

export default function AdminDelivery() {
  const { isDark } = useTheme()
  const [search, setSearch]             = useState("")
  const [areaFilter, setAreaFilter]     = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [ordersSort, setOrdersSort]     = useState("")
  const [loading, setLoading]           = useState(true)
  const [entered, setEntered]           = useState(false)
  const [phText, setPhText]             = useState("")

  // 🚀 Integrated Delivery Settings State
  const [deliveryFee, setDeliveryFee]       = useState("150")
  const [minOrder, setMinOrder]             = useState("500")
  const [sameDayCutoff, setSameDayCutoff]   = useState("09:00")
  const [delivSaved, setDelivSaved]         = useState(false)

  const riders = []

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (loading) { setEntered(false); return }
    const t = setTimeout(() => setEntered(true), 1300)
    return () => clearTimeout(t)
  }, [loading])

  useEffect(() => {
    if (search) { setPhText(""); return }
    let sample = 0, ch = 0, deleting = false, timer
    const tick = () => {
      const full = SEARCH_SAMPLES[sample]
      ch += deleting ? -1 : 1
      setPhText(full.slice(0, ch))
      if (!deleting && ch === full.length) { deleting = true; timer = setTimeout(tick, 1400); return }
      if (deleting && ch === 0) { deleting = false; sample = (sample + 1) % SEARCH_SAMPLES.length }
      timer = setTimeout(tick, deleting ? 55 : 110)
    }
    timer = setTimeout(tick, 500)
    return () => clearTimeout(timer)
  }, [search])

  const toolbarBg  = isDark ? "#111827" : "#fafbfc"
  const toolbarBdr = isDark ? "#1e293b" : "#f1f5f9"
  const inputBg    = isDark ? "#1e293b" : "white"
  const inputBdr   = isDark ? "#374151" : "#dde3ec"
  const inputTxt   = isDark ? "#e2e8f0" : "#374151"
  const cardBg     = isDark ? "#1a2332" : "white"
  const cardBdr    = isDark ? "#1e293b" : "#e8edf2"

  const saveConfig = () => {
    setDelivSaved(true);
    setTimeout(() => setDelivSaved(false), 2000);
  }

  const handlePrint = () => window.print()
  const printDate   = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
  const printTime   = new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })

  const deliveriesToday  = 0
  const outForDelivery   = 0
  const availableRiders  = 0
  const failedDeliveries = 0

  const printScope = [
    areaFilter ? `Area: ${areaFilter.replace(/_/g, " ")}` : "All Areas",
    statusFilter ? `Status: ${statusFilter.replace(/_/g, " ")}` : "All Statuses",
    `${riders.length} rider${riders.length === 1 ? "" : "s"}`,
  ].join("   ·   ")

  if (loading) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>Delivery Operations</h1>
        <FlowerLoader message="Loading delivery operations..." isDark={isDark} />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      <style>{`
        .print-only { display: none; }

        @keyframes delivRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .deliv-rise { animation: delivRise 0.85s ease-out both; }

        @media print {
          @page { margin: 12mm 10mm; }
          body * { visibility: hidden !important; }
          #delivery-print-area, #delivery-print-area * { visibility: visible !important; }
          #delivery-print-area {
            position: absolute; top: 0; left: 0; width: 100%;
            font-family: "Helvetica Neue", Arial, sans-serif; color: #1f2937;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-letterhead, .print-doc-title, .print-summary { break-inside: avoid; page-break-inside: avoid; }

          .print-letterhead {
            display: flex !important; align-items: center; justify-content: space-between; gap: 16px;
            padding: 13px 18px; border-radius: 12px;
            background: linear-gradient(135deg,#0C573E 0%,#15724B 55%,#2E8B34 100%) !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .print-logo-word { height: 34px; width: auto; max-width: 240px; display: block; object-fit: contain; filter: brightness(0) invert(1); }
          .print-tagline { margin: 5px 0 0; font-size: 8px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(255,255,255,0.82) !important; }
          .print-meta { text-align: right; flex-shrink: 0; }
          .print-meta .ref { display: inline-block; margin: 0; padding: 3px 10px; border-radius: 9999px; border: 1px solid rgba(255,255,255,0.35); background: rgba(255,255,255,0.12) !important; color: #ffffff !important; font-size: 8.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-meta .gen { margin: 6px 0 0; font-size: 9px; color: rgba(255,255,255,0.85) !important; }
          .print-meta .gen strong { color: #ffffff !important; font-weight: 700; }

          .print-doc-title { display: flex !important; flex-direction: column; align-items: center; margin: 16px 0 2px; }
          .print-doc-title .t { margin: 0; font-size: 15px; font-weight: 800; letter-spacing: 0.3em; text-transform: uppercase; color: #0C573E !important; }
          .print-doc-title .rule { width: 54px; height: 3px; border-radius: 9999px; margin: 7px 0 6px; background: linear-gradient(90deg,#0C573E,#2E8B34) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-doc-title .scope { margin: 0; font-size: 9px; color: #6b7280 !important; letter-spacing: 0.02em; text-align: center; }

          .print-summary { display: grid !important; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 14px 0 0; }
          .print-summary-card { border: 1px solid #e5e7eb; border-top-width: 3px; border-radius: 9px; padding: 9px 12px 10px; background: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-summary-card.c-done { border-top-color: #2E8B34 !important; }
          .print-summary-card.c-ofd  { border-top-color: #3b82f6 !important; }
          .print-summary-card.c-avail{ border-top-color: #0C573E !important; }
          .print-summary-card.c-fail { border-top-color: #dc2626 !important; }
          .print-summary-card .label { margin: 0; font-size: 8.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af !important; }
          .print-summary-card .value { margin: 3px 0 0; font-size: 19px; font-weight: 800; color: #111827 !important; }
          .print-summary-card .value.green { color: #16a34a !important; }
          .print-summary-card .value.blue  { color: #2563eb !important; }
          .print-summary-card .value.red   { color: #dc2626 !important; }
          .print-summary-card .cap { margin: 3px 0 0; font-size: 8px; color: #9ca3af !important; }

          .print-detail { display: block !important; margin-top: 14px; }
          .print-section-head { display: flex; align-items: baseline; justify-content: space-between; margin: 0 0 7px; padding: 0 2px; }
          .print-section-title { margin: 0; font-size: 10.5px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #0C573E !important; }
          .print-section-sub { margin: 0; font-size: 8.5px; color: #9ca3af !important; }
          .print-detail .twrap { border: 1px solid #dbe3df; border-radius: 10px; overflow: hidden; }
          .print-detail table { width: 100%; max-width: 100%; border-collapse: collapse; table-layout: fixed; }
          .print-detail thead { display: table-header-group; }
          .print-detail tr { page-break-inside: avoid; }
          .print-detail th { background: #0C573E !important; color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; border: none; padding: 7px; text-align: left; font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.01em; line-height: 1.25; }
          .print-detail th.col-idx    { width: 5%; }
          .print-detail th.col-rider  { width: 24%; }
          .print-detail th.col-area   { width: 22%; }
          .print-detail th.col-orders { width: 14%; }
          .print-detail th.col-last   { width: 18%; }
          .print-detail th.col-status { width: 17%; }
          .print-detail td { border-bottom: 1px solid #eef1f4; padding: 6.5px 7px; font-size: 9.5px; color: #1f2937 !important; vertical-align: top; word-break: break-word; overflow-wrap: anywhere; }
          .print-detail .num { text-align: right; }
          .print-detail .muted { color: #6b7280 !important; }
          .print-detail .item-name { font-weight: 600; color: #0f172a !important; line-height: 1.3; }
          .print-detail .cap { text-transform: capitalize; }
          .print-detail tr.alt td { background: #f7faf8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-detail tbody tr:last-child td { border-bottom: none; }

          .print-footer {
            display: flex !important; align-items: flex-end; justify-content: space-between; gap: 24px;
            margin-top: 20px; padding-top: 11px; border-top: 2px solid #e5e7eb;
          }
          .print-footer .note { margin: 0; font-size: 8.5px; color: #9ca3af !important; max-width: 46%; line-height: 1.55; }
          .print-footer .note strong { color: #6b7280 !important; }
          .print-signs { display: flex; gap: 34px; }
          .print-sign { text-align: center; }
          .print-sign .line { width: 170px; border-top: 1px solid #6b7280; margin: 20px 0 5px; }
          .print-sign .cap { margin: 0; font-size: 8.5px; color: #6b7280 !important; text-transform: uppercase; letter-spacing: 0.1em; }
        }
      `}</style>

      {/* Heading row with Export + Print */}
      <div className={`no-print flex items-center justify-between flex-wrap gap-3 ${entered ? "" : "deliv-rise"}`}>
        <h1 className="text-xl font-bold" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>
          Delivery Operations
        </h1>
        <div className="flex items-center gap-2">
          <ExportDeliveryBtn data={[]} isDark={isDark} />
          <PrintBtn onClick={handlePrint} />
        </div>
      </div>

      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 no-print ${entered ? "" : "deliv-rise"}`} style={{ animationDelay: "0.18s" }}>
        <GreenCard label="Deliveries today" sublabel="Success" value={deliveriesToday} sub="↑ +0 this week" />
        <WhiteCard label="Out for delivery" sublabel="On the way" value={outForDelivery} sub="↑ +0 vs last week" accentColor="#3b82f6" />
        <WhiteCard label="Available Riders" sublabel="Assign deliveries" value={availableRiders} sub="← 0 others out for delivery" accentColor="#22c55e" />
        <WhiteCard label="Failed deliveries" sublabel="Review Cases" value={failedDeliveries} sub="↑ +0 vs last week" subRed accentColor="#ef4444">
          <button className="text-xs font-semibold mt-1 text-red-400 hover:underline block">Review Cases</button>
        </WhiteCard>
      </div>

      {/* 🚀 Delivery Settings Configuration (Moved from AdminSettings) */}
      <div className={`no-print rounded-xl overflow-hidden ${entered ? "" : "deliv-rise"}`}
        style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)", animationDelay: "0.27s" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: isDark ? "rgba(34,197,94,0.1)" : "linear-gradient(135deg,#f0fdf4,#dcfce7)" }}>
              <svg className="w-4 h-4" style={{ color: isDark ? "#4ade80" : DG }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>Delivery Configuration</p>
              <p className="text-xs mt-0.5" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>Manage fees, minimums, and cutoffs</p>
            </div>
          </div>
          
          <button onClick={saveConfig}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
            style={{ background: delivSaved ? "#16a34a" : `linear-gradient(135deg, ${DG}, ${G})` }}>
            {delivSaved
              ? <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Saved!</>
              : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>Save Changes</>
            }
          </button>
        </div>
        
        <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Delivery Fee (₱)</label>
            <input type="number" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} placeholder="150"
              className="w-full px-3 py-2 text-sm border rounded-md outline-none transition-all"
              style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
              onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
              onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none" }} />
            <p className="text-[11px] mt-1.5" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>Standard delivery fee</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Minimum Order (₱)</label>
            <input type="number" value={minOrder} onChange={e => setMinOrder(e.target.value)} placeholder="500"
              className="w-full px-3 py-2 text-sm border rounded-md outline-none transition-all"
              style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
              onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
              onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none" }} />
            <p className="text-[11px] mt-1.5" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>Minimum order for delivery</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Same-Day Cutoff</label>
            <input type="time" value={sameDayCutoff} onChange={e => setSameDayCutoff(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md outline-none transition-all"
              style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
              onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
              onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none" }} />
            <p className="text-[11px] mt-1.5" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>Orders placed before this time qualify</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Coverage Areas</label>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {["Pampanga"].map(a => (
                <span key={a} className="px-2.5 py-1.5 text-xs font-semibold rounded-md"
                  style={{ 
                    backgroundColor: isDark ? "rgba(34,197,94,0.1)" : "#f0fdf4", 
                    color: isDark ? "#4ade80" : DG, 
                    border: `1px solid ${isDark ? "rgba(34,197,94,0.25)" : "#bbf7d0"}` 
                  }}>
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Printable area */}
      <div id="delivery-print-area">

        {/* Print 1: letterhead brand band */}
        <div className="print-only print-letterhead">
          <div>
            <img className="print-logo-word" src={estingsWordmark} alt="Esting's Flower International Inc." />
            <p className="print-tagline">Flower International Inc.</p>
          </div>
          <div className="print-meta">
            <p className="ref">Ref: DEL-{new Date().toISOString().slice(0,10).replace(/-/g,"")}</p>
            <p className="gen">Generated <strong>{printDate}</strong> at <strong>{printTime}</strong></p>
          </div>
        </div>

        {/* Print 2: document title + report scope */}
        <div className="print-only print-doc-title">
          <p className="t">Delivery Operations Report</p>
          <span className="rule" />
          <p className="scope">{printScope}</p>
        </div>

        {/* Print 3: summary cards (today's snapshot) */}
        <div className="print-only print-summary">
          <div className="print-summary-card c-done">
            <p className="label">Deliveries Today</p>
            <p className="value green">{deliveriesToday}</p>
            <p className="cap">Completed successfully</p>
          </div>
          <div className="print-summary-card c-ofd">
            <p className="label">Out for Delivery</p>
            <p className="value blue">{outForDelivery}</p>
            <p className="cap">Currently on the way</p>
          </div>
          <div className="print-summary-card c-avail">
            <p className="label">Available Riders</p>
            <p className="value">{availableRiders}</p>
            <p className="cap">Ready for assignment</p>
          </div>
          <div className="print-summary-card c-fail">
            <p className="label">Failed Deliveries</p>
            <p className="value red">{failedDeliveries}</p>
            <p className="cap">Need review</p>
          </div>
        </div>

        {/* Screen table card (interactive; never printed) */}
        <div className={`no-print rounded-xl overflow-hidden ${entered ? "" : "deliv-rise"}`}
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)", animationDelay: "0.36s" }}>

          {/* Toolbar */}
          <div className="p-4 no-print" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
            <div className="flex items-center gap-2 flex-wrap">
              <FDrop value={areaFilter} onChange={setAreaFilter} isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt}>
                <option value="">As. Area: All</option>
                <option value="manila_north">Manila – North</option>
                <option value="manila_south">Manila – South</option>
                <option value="manila_central">Manila – Central</option>
                <option value="quezon_city">Quezon City</option>
                <option value="pampanga_city">Pampanga – City</option>
                <option value="pampanga_angeles">Pampanga – Angeles</option>
                <option value="pampanga_mabalacat">Pampanga – Mabalacat</option>
              </FDrop>
              <FDrop value={statusFilter} onChange={setStatusFilter} isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt}>
                <option value="">Status: All</option>
                <option value="available">Available</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="on_break">On Break</option>
                <option value="off_duty">Off Duty</option>
                <option value="inactive">Inactive</option>
              </FDrop>
              <FDrop value={ordersSort} onChange={setOrdersSort} isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt}>
                <option value="">As. Orders: All</option>
                <option value="asc">Ascending (fewest first)</option>
                <option value="desc">Descending (most first)</option>
                <option value="none">No orders assigned</option>
                <option value="max">At capacity</option>
              </FDrop>
              <div className="relative flex-1" style={{ minWidth: "180px" }}>
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isDark ? "#64748b" : "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={search ? "" : `${phText}|`}
                  className="w-full pl-9 pr-4 py-2 text-sm border rounded-md outline-none transition-all"
                  style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
                  onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.15)` }}
                  onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none" }} />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: "760px" }}>
              <thead style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
                <tr>
                  {["Image", "Rider Name", "Assigned Area", "As. Orders", "Last Assigned", "Status", "Action"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: isDark ? "#64748b" : "#94a3b8" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ borderTop: `1px solid ${toolbarBdr}` }}>
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-14">
                      <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-3"
                        style={{ background: isDark ? "rgba(34,197,94,0.1)" : "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: `1px solid ${isDark ? "rgba(34,197,94,0.2)" : "#bbf7d0"}` }}>
                        <svg className="w-5 h-5" style={{ color: isDark ? "#4ade80" : DG }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium" style={{ color: isDark ? "#cbd5e1" : "#6b7280" }}>No data yet</p>
                      <p className="text-xs mt-0.5" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>Connect to the backend to load delivery rider data.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <DeliveryPagination total={0} isDark={isDark} />
        </div>

        {/* Print 4: rider detail table */}
        <div className="print-only print-detail">
          <div className="print-section-head">
            <p className="print-section-title">Delivery Riders</p>
            <p className="print-section-sub">{riders.length} rider{riders.length === 1 ? "" : "s"} listed</p>
          </div>
          <div className="twrap">
            <table>
              <thead>
                <tr>
                  <th className="col-idx num">#</th>
                  <th className="col-rider">Rider Name</th>
                  <th className="col-area">Assigned Area</th>
                  <th className="col-orders num">Assigned Orders</th>
                  <th className="col-last">Last Assigned</th>
                  <th className="col-status">Status</th>
                </tr>
              </thead>
              <tbody>
                {riders.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "18px 8px" }}>No delivery riders to display.</td></tr>
                ) : riders.map((r, i) => (
                  <tr key={r.id || i} className={i % 2 === 1 ? "alt" : ""}>
                    <td className="num muted">{i + 1}</td>
                    <td><span className="item-name">{r.name || "—"}</span></td>
                    <td className="muted">{r.area || "—"}</td>
                    <td className="num">{r.assigned_orders ?? 0}</td>
                    <td className="muted">{r.last_assigned || "—"}</td>
                    <td className="muted cap">{String(r.status || "—").replace(/_/g, " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Print 5: footer + signature lines */}
        <div className="print-only print-footer">
          <p className="note">
            <strong>Esting's Flower International Inc.</strong> Confidential. This report is generated for internal use only and reflects delivery operations as of the date and time indicated above. Figures are based on the filters applied at the time of printing.
          </p>
          <div className="print-signs">
            <div className="print-sign">
              <div className="line" />
              <p className="cap">Prepared by</p>
            </div>
            <div className="print-sign">
              <div className="line" />
              <p className="cap">Approved by</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}