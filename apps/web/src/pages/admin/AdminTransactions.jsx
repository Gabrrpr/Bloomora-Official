import { useState, useEffect, useMemo, Fragment } from "react"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api.js"
import { DG, G, ADMIN_PAGE_SIZE, StatusBadge, ActionBtns,BranchBadge } from "./_adminShared"
import estingsWordmark from "../../assets/Estings.svg"

const DATE_OPTIONS   = ["All Time", "Today", "Yesterday", "This Week", "This Month"]
const TYPE_OPTIONS   = ["Type: All", "Sale", "Refund", "Void"]
const METHOD_OPTIONS = ["Method: All", "Cash", "GCash", "Maya", "Credit Card", "Bank Transfer"]
const STATUS_OPTIONS = ["Status: All", "Paid", "Pending", "Failed", "Refunded"]
const ITEMS_PER_PAGE = ADMIN_PAGE_SIZE

const SEARCH_SAMPLES = ["John Dela Cruz", "Maria Santos", "Carlo Ramos", "Angela Cruz"]

const PRINT_STATUS_META = [
  { key: "Paid",     label: "Paid",     cls: "s-paid",     dot: "#16a34a" },
  { key: "Pending",  label: "Pending",  cls: "s-pending",  dot: "#d97706" },
  { key: "Failed",   label: "Failed",   cls: "s-failed",   dot: "#dc2626" },
  { key: "Refunded", label: "Refunded", cls: "s-refunded", dot: "#7c3aed" },
]

function SelectFilter({ value, onChange, options, minWidth = "130px", isDark, icon }) {
  const bg  = isDark ? "#1e293b" : "white"
  const bdr = isDark ? "#374151" : "#dde3ec"
  const tc  = isDark ? "#e2e8f0" : "#374151"
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>
          {icon}
        </span>
      )}
      <select value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none py-2 text-sm border rounded-md cursor-pointer outline-none transition-all"
        style={{ paddingLeft: icon ? "28px" : "12px", paddingRight: "28px", borderColor: bdr, minWidth, backgroundColor: bg, color: tc }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = "0 0 0 2px rgba(74,222,128,0.18)" }}
        onBlur={e => { e.target.style.borderColor = bdr; e.target.style.boxShadow = "none" }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: isDark ? "#64748b" : "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  )
}

function ExportCSVBtn({ onClick, isDark }) {
  return (
    <button
      onClick={onClick}
      className="no-print flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all active:scale-95"
      style={{ borderColor: isDark ? "#374151" : "#dde3ec", color: isDark ? "#94a3b8" : "#374151", backgroundColor: isDark ? "#1e293b" : "white" }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#2d3f55" : "#f9fafb"}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "white"}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export CSV
    </button>
  )
}

function PrintBtn({ onClick, isDark }) {
  return (
    <button onClick={onClick}
      className="no-print flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all active:scale-95"
      style={{ borderColor: isDark ? "#374151" : "#dde3ec", color: isDark ? "#94a3b8" : "#374151", backgroundColor: isDark ? "#1e293b" : "white" }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#2d3f55" : "#f9fafb"}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "white"}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Print
    </button>
  )
}

const CalendarIcon = (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

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

export default function AdminTransactions() {
  const { isDark } = useTheme()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(true)
  
  const [search, setSearch]             = useState("")
  const [dateFilter, setDateFilter]     = useState("All Time")
  const [typeFilter, setTypeFilter]     = useState("Type: All")
  const [methodFilter, setMethodFilter] = useState("Method: All")
  const [statusFilter, setStatusFilter] = useState("Status: All")
  
  // 🚀 New Pagination State
  const [currentPage, setCurrentPage]   = useState(1)

  const [entered, setEntered] = useState(false)
  const [phText, setPhText] = useState("")

  const subTxt     = isDark ? "#94a3b8" : "#64748b"
  const toolbarBg  = isDark ? "#111827" : "#fafbfc"
  const toolbarBdr = isDark ? "#1e293b" : "#f1f5f9"
  const inputBg    = isDark ? "#1e293b" : "white"
  const inputBdr   = isDark ? "#374151" : "#dde3ec"
  const inputTxt   = isDark ? "#e2e8f0" : "#374151"
  const cardBg     = isDark ? "#1a2332" : "white"
  const cardBdr    = isDark ? "#1e293b" : "#e8edf2"
  const rowHover   = isDark ? "rgba(74,222,128,0.04)" : "#f8fffe"

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminOrders();
      let rawData = res.data || res;
      let rawList = Array.isArray(rawData) ? rawData : (rawData.orders || rawData.transactions || rawData.data || []);

      const normalizedList = rawList.map(t => {
        const rawProvider = String(t.payment_provider || t.provider || t.transaction?.provider || "").toLowerCase();
        const isWalkInPos = Boolean(t.is_walk_in_pos) || String(t.delivery_notes || "").toLowerCase().includes("pos transaction");
        const rawMethod = String(t.payment_method || t.method || t.payment_type || "N/A").toLowerCase();
        let cleanMethod = "Other";
        if (rawMethod.includes("maya")) cleanMethod = "Maya";
        else if (rawMethod.includes("gcash")) cleanMethod = "GCash";
        else if (isWalkInPos && rawProvider.includes("paymongo") && rawMethod.includes("ewallet")) cleanMethod = "GCash";
        else if (rawMethod.includes("card") || rawMethod.includes("credit") || rawMethod.includes("debit") || rawMethod.includes("paymongo")) cleanMethod = "Online Payment";
        else if (rawMethod.includes("bank") || rawMethod.includes("transfer") || rawMethod.includes("qrph")) cleanMethod = "QRPh / Bank";
        else if (rawMethod.includes("cash")) cleanMethod = "Cash";

        const price = Number(t.total_price || t.total_amount || t.amount || t.grand_total || t.total || 0);
        
        const rawStatusRaw = t.payment_status ?? t.status ?? t.checkout_status ?? "pending";
        const rawStatus = String(rawStatusRaw).toLowerCase();

        let cleanStatus = "Pending";
        if (rawStatus === "paid" || rawStatus === "success" || rawStatus === "confirmed") {
          cleanStatus = "Paid";
        } else if (rawStatus === "pending") {
          cleanStatus = "Pending";
        } else if (rawStatus === "failed" || rawStatus.includes("fail") || rawStatus.includes("cancel")) {
          cleanStatus = "Failed";
        } else if (rawStatus === "refunded" || rawStatus.includes("refund")) {
          cleanStatus = "Refunded";
        } else if (rawStatus.includes("paid") || rawStatus.includes("success") || rawStatus.includes("complete")) {
          cleanStatus = "Paid";
        }

        // 🚀 THE FIX: Dig deeper to find the PayMongo Session ID if the regular reference is empty
        const referenceValue = t.transaction?.provider_checkout_session_id || 
                               t.transaction?.reference_number || 
                               t.provider_checkout_session_id ||
                               t.payment_reference || 
                               t.reference_number || 
                               t.reference || 
                               t.trn || 
                               t.transaction_id || 
                               "";

        return {
          id: t.id || t.order_id || `txn_${Math.floor(Math.random()*10000)}`,
          customer_name: t.customer_name || t.customer?.name || t.user?.name || t.billing_name || "Guest",
          is_walk_in_pos: isWalkInPos,
          payment_reference: referenceValue, // 🚀 Uses the new truffle-pig extraction method
          payment_method: cleanMethod,
          total_price: price,
          payment_status: cleanStatus,
          created_at: t.created_at || t.date || t.created || new Date().toISOString()
        };
      });

      normalizedList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setTransactions(normalizedList);
    } catch (e) {
      console.error("Failed to load transactions", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTransactions() }, []);

  // 🚀 Reset pagination to page 1 whenever any filter changes!
  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateFilter, typeFilter, methodFilter, statusFilter]);

  useEffect(() => {
    if (loading) { setEntered(false); return }
    const t = setTimeout(() => setEntered(true), 1300)
    return () => clearTimeout(t)
  }, [loading]);

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
  }, [search]);

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayTransactions = transactions.filter(t => 
      t.created_at.startsWith(todayStr) && 
      (t.payment_status.toLowerCase() === "paid" || t.payment_status.toLowerCase() === "success")
    );
    const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.total_price, 0);
    
    return {
      revenue: `₱${todayRevenue.toLocaleString()}`,
      count: todayTransactions.length,
      totalCount: transactions.length
    }
  }, [transactions]);

  const STAT_CARDS = [
    { label: "Total Revenue Today", sub: "All successful sales",  value: stats.revenue, note: "Live data", green: true  },
    { label: "Net Sales Today",     sub: "After refunds & voids", value: stats.revenue, note: "Live data", blue: true   },
    { label: "Total Transactions",  sub: "All time history",      value: stats.totalCount, note: "Overall volume", purple: true },
  ]

  const COLS = ["Transaction ID", "Customer", "Reference", "Method", "Total", "Status", "Date & Time", "Action"]

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const todayStr = today.toISOString().slice(0, 10);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    return transactions.filter(t => {
      const matchSearch = !q || t.id.toLowerCase().includes(q) || t.payment_reference.toLowerCase().includes(q) || t.customer_name.toLowerCase().includes(q);
      const matchStatus = statusFilter === "Status: All" || t.payment_status.toLowerCase() === statusFilter.replace("Status: ", "").toLowerCase();
      const cleanFilterMethod = methodFilter.replace("Method: ", "");
      const matchMethod = methodFilter === "Method: All" || t.payment_method.includes(cleanFilterMethod);
      
      let matchDate = true;
      const tDateStr = t.created_at.slice(0, 10);
      
      if (dateFilter === "Today") matchDate = tDateStr === todayStr;
      if (dateFilter === "Yesterday") matchDate = tDateStr === yesterdayStr;
      if (dateFilter === "This Week") {
        const oneWeekAgo = new Date(today); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        matchDate = new Date(t.created_at) >= oneWeekAgo;
      }
      if (dateFilter === "This Month") {
        matchDate = tDateStr.slice(0, 7) === todayStr.slice(0, 7);
      }

      return matchSearch && matchStatus && matchMethod && matchDate;
    });
  }, [transactions, search, statusFilter, methodFilter, dateFilter]);

  // 🚀 Paginate the filtered data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const handlePrint = () => window.print()
  const printDate   = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
  const printTime   = new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })

  const peso = n => `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const statusCounts = filtered.reduce((m, t) => {
    m[t.payment_status] = (m[t.payment_status] || 0) + 1
    return m
  }, {})
  const valueOf = status => filtered.filter(t => t.payment_status === status).reduce((s, t) => s + (Number(t.total_price) || 0), 0)
  const paidValue     = valueOf("Paid")
  const pendingValue  = valueOf("Pending")
  const refundedValue = valueOf("Refunded")
  const grossValue    = filtered.reduce((s, t) => s + (Number(t.total_price) || 0), 0)
  const knownTotal = PRINT_STATUS_META.reduce((s, m) => s + (statusCounts[m.key] || 0), 0)
  const otherCount = Math.max(0, filtered.length - knownTotal)
  const pct = n => (filtered.length ? (n / filtered.length) * 100 : 0)

  const printGroups = (() => {
    const map = new Map()
    filtered.forEach(t => {
      const k = t.payment_status
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(t)
    })
    const orderOf = k => {
      const i = PRINT_STATUS_META.findIndex(m => m.key === k)
      return i === -1 ? 99 : i
    }
    return Array.from(map.entries())
      .sort((a, b) => orderOf(a[0]) - orderOf(b[0]) || a[0].localeCompare(b[0]))
      .map(([key, items]) => ({
        label: PRINT_STATUS_META.find(m => m.key === key)?.label || key,
        items,
        value: items.reduce((s, t) => s + (Number(t.total_price) || 0), 0),
      }))
  })()

  const printScope = [
    dateFilter !== "All Time" ? `Period: ${dateFilter}` : "All Time",
    methodFilter !== "Method: All" ? `Method: ${methodFilter}` : "All Methods",
    statusFilter !== "Status: All" ? `Status: ${statusFilter}` : "All Statuses",
    search ? `Search: "${search}"` : null,
    `${filtered.length} transaction${filtered.length === 1 ? "" : "s"}`,
  ].filter(Boolean).join("   ·   ")

  const handleCSV = () => {
    const headers = COLS.slice(0, -1);
    const rows = filtered.map(t => [
      t.id,
      t.is_walk_in_pos ? `${t.customer_name} (Walk-in POS)` : t.customer_name,
      t.payment_reference || "N/A",
      t.payment_method,
      t.total_price,
      t.payment_status,
      new Date(t.created_at).toLocaleString()
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `transactions_${new Date().toISOString().slice(0,10)}.csv`
    })
    a.click(); URL.revokeObjectURL(a.href)
  }

  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const openTransactionDetail = (txn) => {
    setSelectedTransaction(txn)
    setShowDetailModal(true)
  }

  const closeTransactionDetail = () => {
    setShowDetailModal(false)
    setSelectedTransaction(null)
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-sm font-medium" style={{ color: subTxt }}>Revenue overview</p>
          <span className="text-4xl font-bold" style={{ color: isDark ? "#4ade80" : DG }}>—</span>
        </div>
        <FlowerLoader message="Loading transactions..." isDark={isDark} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <style>{`
        .print-only { display: none; }
        @keyframes txnRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes daPop { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
        .txn-rise { animation: txnRise 0.85s ease-out both; }
        @media print {
          @page { margin: 12mm 10mm; }
          body * { visibility: hidden !important; }
          #transactions-print-area, #transactions-print-area * { visibility: visible !important; }
          #transactions-print-area {
            position: absolute; top: 0; left: 0; width: 100%;
            font-family: "Helvetica Neue", Arial, sans-serif; color: #1f2937;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-letterhead, .print-doc-title, .print-summary, .print-health { break-inside: avoid; page-break-inside: avoid; }
          .print-letterhead {
            display: flex !important; align-items: center; justify-content: space-between; gap: 16px;
            padding: 13px 18px; border-radius: 12px;
            background: linear-gradient(135deg,#0C573E 0%,#15724B 55%,#2E8B34 100%) !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .print-logo-word {
            height: 34px; width: auto; max-width: 240px; display: block;
            object-fit: contain; filter: brightness(0) invert(1);
          }
          .print-tagline {
            margin: 5px 0 0; font-size: 8px; font-weight: 700;
            letter-spacing: 0.3em; text-transform: uppercase; color: rgba(255,255,255,0.82) !important;
          }
          .print-meta { text-align: right; flex-shrink: 0; }
          .print-meta .ref {
            display: inline-block; margin: 0; padding: 3px 10px; border-radius: 9999px;
            border: 1px solid rgba(255,255,255,0.35); background: rgba(255,255,255,0.12) !important;
            color: #ffffff !important; font-size: 8.5px; font-weight: 700;
            letter-spacing: 0.12em; text-transform: uppercase;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .print-meta .gen { margin: 6px 0 0; font-size: 9px; color: rgba(255,255,255,0.85) !important; }
          .print-meta .gen strong { color: #ffffff !important; font-weight: 700; }
          .print-doc-title { display: flex !important; flex-direction: column; align-items: center; margin: 16px 0 2px; }
          .print-doc-title .t {
            margin: 0; font-size: 15px; font-weight: 800;
            letter-spacing: 0.3em; text-transform: uppercase; color: #0C573E !important;
          }
          .print-doc-title .rule {
            width: 54px; height: 3px; border-radius: 9999px; margin: 7px 0 6px;
            background: linear-gradient(90deg,#0C573E,#2E8B34) !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .print-doc-title .scope { margin: 0; font-size: 9px; color: #6b7280 !important; letter-spacing: 0.02em; text-align: center; }
          .print-summary { display: grid !important; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 14px 0 0; }
          .print-summary-card {
            border: 1px solid #e5e7eb; border-top-width: 3px; border-radius: 9px; padding: 9px 12px 10px;
            background: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .print-summary-card.c-total   { border-top-color: #0C573E !important; }
          .print-summary-card.c-paid    { border-top-color: #2E8B34 !important; }
          .print-summary-card.c-pending { border-top-color: #d97706 !important; }
          .print-summary-card.c-refund  { border-top-color: #dc2626 !important; }
          .print-summary-card .label { margin: 0; font-size: 8.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af !important; }
          .print-summary-card .value { margin: 3px 0 0; font-size: 18px; font-weight: 800; color: #111827 !important; }
          .print-summary-card .value.green { color: #16a34a !important; }
          .print-summary-card .value.amber { color: #d97706 !important; }
          .print-summary-card .value.red   { color: #dc2626 !important; }
          .print-summary-card .cap { margin: 3px 0 0; font-size: 8px; color: #9ca3af !important; }
          .print-health {
            margin: 10px 0 0; border: 1px solid #e5e7eb; border-radius: 9px; padding: 10px 12px 11px;
            background: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .print-health .head { display: flex; align-items: baseline; justify-content: space-between; margin: 0 0 7px; }
          .print-health .hk { margin: 0; font-size: 8.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af !important; }
          .print-health .hv { margin: 0; font-size: 8.5px; color: #6b7280 !important; }
          .print-health .bar {
            display: flex; height: 10px; border-radius: 9999px; overflow: hidden;
            background: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .print-health .seg { display: block; height: 100%; }
          .print-health .s-paid     { background: #16a34a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-health .s-pending  { background: #d97706 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-health .s-failed   { background: #dc2626 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-health .s-refunded { background: #7c3aed !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-health .s-other    { background: #94a3b8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-health .legend { display: flex; flex-wrap: wrap; gap: 12px 16px; margin: 7px 0 0; }
          .print-health .li { display: flex; align-items: center; gap: 5px; font-size: 8.5px; color: #374151 !important; }
          .print-health .dot { width: 7px; height: 7px; border-radius: 9999px; flex-shrink: 0; }
          .print-detail { display: block !important; margin-top: 14px; }
          .print-section-head { display: flex; align-items: baseline; justify-content: space-between; margin: 0 0 7px; padding: 0 2px; }
          .print-section-title { margin: 0; font-size: 10.5px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #0C573E !important; }
          .print-section-sub { margin: 0; font-size: 8.5px; color: #9ca3af !important; }
          .print-detail .twrap { border: 1px solid #dbe3df; border-radius: 10px; overflow: hidden; }
          .print-detail table { width: 100%; max-width: 100%; border-collapse: collapse; table-layout: fixed; }
          .print-detail thead { display: table-header-group; }
          .print-detail tr { page-break-inside: avoid; }
          .print-detail th {
            background: #0C573E !important; color: #ffffff !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
            border: none; padding: 7px; text-align: left;
            font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.01em; line-height: 1.25;
          }
          .print-detail th.col-idx    { width: 4%; }
          .print-detail th.col-id     { width: 12%; }
          .print-detail th.col-cust   { width: 22%; }
          .print-detail th.col-ref    { width: 18%; }
          .print-detail th.col-method { width: 12%; }
          .print-detail th.col-date   { width: 18%; }
          .print-detail th.col-total  { width: 14%; }
          .print-detail td {
            border-bottom: 1px solid #eef1f4; padding: 6.5px 7px;
            font-size: 9.5px; color: #1f2937 !important; vertical-align: top;
            word-break: break-word; overflow-wrap: anywhere;
          }
          .print-detail .num { text-align: right; }
          .print-detail .nowrap { white-space: nowrap !important; }
          .print-detail .muted { color: #6b7280 !important; }
          .print-detail .mono { font-family: "Courier New", Courier, monospace; font-size: 8.5px; }
          .print-detail tr.alt td { background: #f7faf8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-detail tbody tr:last-child td { border-bottom: none; }
          .print-detail tr.cat-row { page-break-after: avoid; break-after: avoid; }
          .print-detail tr.cat-row td {
            background: #eaf5ee !important; color: #0C573E !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
            border-top: 1px solid #d8ebdd; border-bottom: 1px solid #d8ebdd;
            padding: 6px 8px; font-size: 8.5px; font-weight: 800;
            letter-spacing: 0.08em; text-transform: uppercase;
          }
          .print-detail tr.cat-row .cat-meta {
            float: right; font-weight: 600; letter-spacing: 0;
            text-transform: none; color: #15724B !important;
          }
          .print-detail tr.grand td {
            background: #0C573E !important; color: #ffffff !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
            border: none; padding: 8px 7px; font-size: 9.5px; font-weight: 800;
          }
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

      {/* ── Heading ── */}
      <div className={`no-print flex items-center justify-between flex-wrap gap-3 ${entered ? "" : "txn-rise"}`}>
        <div>
          <p className="text-sm font-medium" style={{ color: subTxt }}>Revenue overview</p>
          <div className="flex items-baseline gap-3 mt-0.5">
            <span className="text-4xl font-bold" style={{ color: isDark ? "#4ade80" : DG }}>{stats.revenue}</span>
            <span className="text-sm font-semibold" style={{ color: subTxt }}>Today's Total</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportCSVBtn onClick={handleCSV} isDark={isDark} />
          <PrintBtn onClick={handlePrint} isDark={isDark} />
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 no-print ${entered ? "" : "txn-rise"}`} style={{ animationDelay: "0.18s" }}>
        {STAT_CARDS.map(c => (
          <div key={c.label} className="rounded-xl p-4 sm:p-5 transition-transform duration-200 hover:scale-[1.02]"
            style={{
              background: c.green ? "linear-gradient(135deg,#0a4a34 0%,#1a7040 60%,#2E8B34 100%)" : isDark ? "#1a2332" : "white",
              border: c.green ? "none" : `1px solid ${isDark ? "#2d3748" : "#e8edf2"}`,
              boxShadow: c.green ? "0 4px 16px rgba(12,87,62,0.25)" : isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
            }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: c.green ? "rgba(255,255,255,0.65)" : isDark ? "#64748b" : "#94a3b8" }}>{c.label}</p>
            <p className="text-xs mb-2"
              style={{ color: c.green ? "rgba(255,255,255,0.5)" : isDark ? "#64748b" : "#94a3b8" }}>{c.sub}</p>
            <p className="text-3xl font-bold"
              style={{ color: c.green ? "white" : c.blue ? (isDark ? "#60a5fa" : "#3b82f6") : c.purple ? (isDark ? "#c084fc" : "#7c3aed") : isDark ? "#4ade80" : DG }}>
              {c.value}
            </p>
            <p className="text-xs mt-2"
              style={{ color: c.green ? "rgba(255,255,255,0.5)" : isDark ? "#64748b" : "#94a3b8" }}>{c.note}</p>
          </div>
        ))}
      </div>

      {/* ── Printable area ── */}
      <div id="transactions-print-area">

        {/* Print 1: letterhead brand band */}
        <div className="print-only print-letterhead">
          <div>
            <img className="print-logo-word" src={estingsWordmark} alt="Esting's Flower International Inc." />
            <p className="print-tagline">Flower International Inc.</p>
          </div>
          <div className="print-meta">
            <p className="ref">Ref: TXN-{new Date().toISOString().slice(0,10).replace(/-/g,"")}</p>
            <p className="gen">Generated <strong>{printDate}</strong> at <strong>{printTime}</strong></p>
          </div>
        </div>

        {/* Print 2: document title + report scope */}
        <div className="print-only print-doc-title">
          <p className="t">Transactions Report</p>
          <span className="rule" />
          <p className="scope">{printScope}</p>
        </div>

        {/* Print 3: summary cards (current view) */}
        <div className="print-only print-summary">
          <div className="print-summary-card c-total">
            <p className="label">Total Transactions</p>
            <p className="value">{filtered.length}</p>
            <p className="cap">Across {dateFilter === "All Time" ? "all time" : dateFilter.toLowerCase()}</p>
          </div>
          <div className="print-summary-card c-paid">
            <p className="label">Total Collected</p>
            <p className="value green">{peso(paidValue)}</p>
            <p className="cap">{statusCounts["Paid"] || 0} paid</p>
          </div>
          <div className="print-summary-card c-pending">
            <p className="label">Pending</p>
            <p className="value amber">{peso(pendingValue)}</p>
            <p className="cap">{statusCounts["Pending"] || 0} awaiting payment</p>
          </div>
          <div className="print-summary-card c-refund">
            <p className="label">Refunded</p>
            <p className="value red">{peso(refundedValue)}</p>
            <p className="cap">{statusCounts["Refunded"] || 0} reversed</p>
          </div>
        </div>

        {/* Print 4: payment status distribution */}
        {filtered.length > 0 && (
          <div className="print-only print-health">
            <div className="head">
              <p className="hk">Payment Status Distribution</p>
              <p className="hv">{peso(grossValue)} gross value</p>
            </div>
            <div className="bar">
              {PRINT_STATUS_META.map(m => {
                const n = statusCounts[m.key] || 0
                return n > 0 ? <span key={m.key} className={`seg ${m.cls}`} style={{ width: `${pct(n)}%` }} /> : null
              })}
              {otherCount > 0 && <span className="seg s-other" style={{ width: `${pct(otherCount)}%` }} />}
            </div>
            <div className="legend">
              {PRINT_STATUS_META.map(m => {
                const n = statusCounts[m.key] || 0
                return n > 0 ? (
                  <span key={m.key} className="li"><span className="dot" style={{ backgroundColor: m.dot }} />{m.label} · {n} ({pct(n).toFixed(0)}%)</span>
                ) : null
              })}
              {otherCount > 0 && (
                <span className="li"><span className="dot" style={{ backgroundColor: "#94a3b8" }} />Other · {otherCount} ({pct(otherCount).toFixed(0)}%)</span>
              )}
            </div>
          </div>
        )}

        {/* Screen table card (interactive; never printed) */}
        <div className={`no-print rounded-xl overflow-hidden ${entered ? "" : "txn-rise"}`}
          style={{ border: `1px solid ${cardBdr}`, backgroundColor: cardBg, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)", animationDelay: "0.36s" }}>

          {/* Toolbar */}
          <div className="p-3 sm:p-4 no-print" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
            <div className="flex items-center gap-2 flex-wrap">
              <SelectFilter value={dateFilter}   onChange={setDateFilter}   options={DATE_OPTIONS}   minWidth="130px" isDark={isDark} icon={CalendarIcon} />
              <SelectFilter value={typeFilter}   onChange={setTypeFilter}   options={TYPE_OPTIONS}   minWidth="120px" isDark={isDark} />
              <SelectFilter value={methodFilter} onChange={setMethodFilter} options={METHOD_OPTIONS} minWidth="140px" isDark={isDark} />
              <SelectFilter value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} minWidth="140px" isDark={isDark} />
              <div className="relative flex-1" style={{ minWidth: "180px" }}>
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isDark ? "#64748b" : "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z"/>
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={search ? "" : `${phText}|`}
                  className="w-full pl-9 pr-4 py-2 text-sm border rounded-md outline-none transition-all"
                  style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
                  onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = "0 0 0 2px rgba(74,222,128,0.18)" }}
                  onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none" }} />
              </div>
              <button onClick={fetchTransactions} className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
                style={{ background: `linear-gradient(135deg,${DG},${G})` }}>Refresh</button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: "820px" }}>
              <thead style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
                <tr>
                  {COLS.map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                      style={{ color: isDark ? "#64748b" : "#94a3b8" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ borderTop: `1px solid ${toolbarBdr}` }}>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm" style={{ color: subTxt }}>
                      Loading transactions...
                    </td>
                  </tr>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((t, idx) => (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: idx % 2 === 0 ? cardBg : (isDark ? "#111827" : "#f9fafb") }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = rowHover}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? cardBg : (isDark ? "#111827" : "#f9fafb")}>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>#{t.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: subTxt }}>
                        <span className="block font-medium" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>{t.customer_name}</span>
                        {t.is_walk_in_pos && (
                          <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                            style={{ backgroundColor: isDark ? "rgba(59,130,246,0.14)" : "#eff6ff", color: isDark ? "#93c5fd" : "#1d4ed8" }}>
                            Walk-in POS
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: isDark ? "#94a3b8" : "#4b5563" }}>
                        {t.payment_reference || <span className="italic opacity-50">None</span>}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: subTxt }}>{t.payment_method}</td>
                      <td className="px-4 py-3 text-sm font-bold" style={{ color: isDark ? "#4ade80" : DG }}>₱{(+t.total_price).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={t.payment_status} />
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: subTxt }}>{new Date(t.created_at).toLocaleString()}</td>
                       <td className="px-4 py-3 text-right">
                         <ActionBtns onView={() => openTransactionDetail(t)} />
                       </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm" style={{ color: subTxt }}>
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 sm:px-5 py-3 flex-wrap gap-2 no-print"
            style={{ borderTop: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
            <span className="text-sm" style={{ color: subTxt }}>
              Showing {paginatedData.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} to {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} transactions
            </span>
            
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-semibold border rounded-md disabled:opacity-50 transition-colors"
                  style={{ borderColor: inputBdr, color: inputTxt, backgroundColor: inputBg }}
                >
                  Previous
                </button>
                <span className="text-xs font-semibold px-2" style={{ color: subTxt }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-semibold border rounded-md disabled:opacity-50 transition-colors"
                  style={{ borderColor: inputBdr, color: inputTxt, backgroundColor: inputBg }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Print 5: full detail table, grouped by payment status. */}
        <div className="print-only print-detail">
          <div className="print-section-head">
            <p className="print-section-title">Transaction Detail</p>
            <p className="print-section-sub">Grouped by payment status · totals include all listed transactions</p>
          </div>
          <div className="twrap">
            <table>
              <thead>
                <tr>
                  <th className="col-idx num">#</th>
                  <th className="col-id">Transaction ID</th>
                  <th className="col-cust">Customer</th>
                  <th className="col-ref">Reference</th>
                  <th className="col-method">Method</th>
                  <th className="col-date">Date &amp; Time</th>
                  <th className="col-total num">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "18px 8px" }}>No transactions match the current filters.</td></tr>
                ) : (() => {
                  let n = 0
                  return printGroups.map(g => (
                    <Fragment key={g.label}>
                      <tr className="cat-row">
                        <td colSpan={7}>
                          <span>{g.label} ({g.items.length})</span>
                          <span className="cat-meta">{peso(g.value)}</span>
                        </td>
                      </tr>
                      {g.items.map((t, i) => {
                        n += 1
                        return (
                          <tr key={t.id} className={i % 2 === 1 ? "alt" : ""}>
                            <td className="num nowrap muted">{n}</td>
                            <td className="mono">#{String(t.id).slice(0, 8)}</td>
                            <td>{t.customer_name || "—"}{t.is_walk_in_pos ? " (Walk-in POS)" : ""}</td>
                            <td className="mono muted">{t.payment_reference || "—"}</td>
                            <td className="muted">{t.payment_method}</td>
                            <td className="muted nowrap">{new Date(t.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                            <td className="num nowrap">{peso(t.total_price)}</td>
                          </tr>
                        )
                      })}
                    </Fragment>
                  ))
                })()}
                {filtered.length > 0 && (
                  <tr className="grand">
                    <td colSpan={6}>Report Total · {filtered.length} transaction{filtered.length === 1 ? "" : "s"} (all statuses)</td>
                    <td className="num nowrap">{peso(grossValue)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

         {/* Print 6: footer + signature lines */}
         <div className="print-only print-footer">
           <p className="note">
             <strong>Esting's Flower International Inc.</strong> Confidential. This report is generated for internal use only and reflects transaction records as of the date and time indicated above. Figures are based on the filters applied at the time of printing.
           </p>
           <div className="print-signs">
             <div className="print-sign">
               <div className="line" />
               <p className="cap">Prepared by</p>
             </div>
             <div className="print-sign">
               <div className="line" />
               <p className="cap">Reviewed by</p>
             </div>
           </div>
         </div>
       </div>

       {showDetailModal && selectedTransaction && (
         <div
           className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
           style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
           onClick={closeTransactionDetail}
         >
           <div
             className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
             onClick={e => e.stopPropagation()}
             style={{ backgroundColor: isDark ? "#111827" : "#ffffff", border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`, animation: "daPop 0.25s ease both" }}
           >
             <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${isDark ? "#374151" : "#e5e7eb"}` }}>
               <div>
                 <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: isDark ? "#94a3b8" : "#9ca3af" }}>Payment Details</p>
                 <p className="text-sm font-bold font-mono" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>#{selectedTransaction.id.slice(0, 8)}</p>
               </div>
               <button
                 onClick={closeTransactionDetail}
                 className="w-8 h-8 flex items-center justify-center rounded-full transition active:scale-95"
                 style={{ color: isDark ? "#cbd5e1" : "#4b5563", backgroundColor: isDark ? "#1f2937" : "#f3f4f6" }}
               >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>
             <div className="px-6 py-5 space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>Customer</p>
                   <p className="text-sm font-semibold" style={{ color: isDark ? "#e2e8f0" : "#111827" }}>{selectedTransaction.customer_name}</p>
                   {selectedTransaction.is_walk_in_pos && (
                     <p className="text-[11px] font-bold uppercase tracking-wide mt-1" style={{ color: isDark ? "#93c5fd" : "#1d4ed8" }}>Walk-in POS</p>
                   )}
                 </div>
                 <div>
                   <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>Date & Time</p>
                   <p className="text-sm font-semibold" style={{ color: isDark ? "#e2e8f0" : "#111827" }}>{new Date(selectedTransaction.created_at).toLocaleString()}</p>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>Payment Method</p>
                   <p className="text-sm font-semibold" style={{ color: isDark ? "#e2e8f0" : "#111827" }}>{selectedTransaction.payment_method}</p>
                 </div>
                 <div>
                   <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>Reference / Transaction ID</p>
                   <p className="text-xs font-mono font-semibold break-all" style={{ color: isDark ? "#e2e8f0" : "#111827" }}>{selectedTransaction.payment_reference || "—"}</p>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>Status</p>
                   <StatusBadge status={selectedTransaction.payment_status} />
                 </div>
                 <div>
                   <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>Total Amount</p>
                   <p className="text-sm font-bold" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>₱{(+selectedTransaction.total_price).toLocaleString()}</p>
                 </div>
               </div>
             </div>
             <div className="px-6 py-4 flex justify-end" style={{ borderTop: `1px solid ${isDark ? "#374151" : "#e5e7eb" }`, backgroundColor: isDark ? "#0f172a" : "#f9fafb" }}>
               <button
                 onClick={closeTransactionDetail}
                 className="px-5 py-2.5 text-sm font-semibold rounded-xl border transition-all active:scale-95"
                 style={{ borderColor: isDark ? "#4b5563" : "#d1d5db", color: isDark ? "#e2e8f0" : "#111827", backgroundColor: isDark ? "#1e293b" : "#ffffff" }}
               >
                 Close
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   )
}
