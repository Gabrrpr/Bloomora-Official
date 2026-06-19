import { useState, useEffect, useMemo } from "react"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api.js"
import { DG, G, StatusBadge, ActionBtns } from "./_adminShared"

const DATE_OPTIONS   = ["All Time", "Today", "Yesterday", "This Week", "This Month"]
const TYPE_OPTIONS   = ["Type: All", "Sale", "Refund", "Void"]
const METHOD_OPTIONS = ["Method: All", "Cash", "GCash", "Maya", "Credit Card", "Bank Transfer"]
const STATUS_OPTIONS = ["Status: All", "Paid", "Pending", "Failed", "Refunded"]

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

function PrintBtn({ onClick }) {
  return (
    <button onClick={onClick}
      className="no-print flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all active:scale-95"
      style={{ borderColor: "#dde3ec", color: "#374151", backgroundColor: "white" }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f9fafb"}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = "white"}>
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

export default function AdminTransactions() {
  const { isDark } = useTheme()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(true)
  
  const [search, setSearch]             = useState("")
  const [dateFilter, setDateFilter]     = useState("All Time")
  const [typeFilter, setTypeFilter]     = useState("Type: All")
  const [methodFilter, setMethodFilter] = useState("Method: All")
  const [statusFilter, setStatusFilter] = useState("Status: All")

  const subTxt     = isDark ? "#94a3b8" : "#64748b"
  const toolbarBg  = isDark ? "#111827" : "#fafbfc"
  const toolbarBdr = isDark ? "#1e293b" : "#f1f5f9"
  const inputBg    = isDark ? "#1e293b" : "white"
  const inputBdr   = isDark ? "#374151" : "#dde3ec"
  const inputTxt   = isDark ? "#e2e8f0" : "#374151"
  const cardBg     = isDark ? "#1a2332" : "white"
  const cardBdr    = isDark ? "#1e293b" : "#e8edf2"
  const rowHover   = isDark ? "rgba(74,222,128,0.04)" : "#f8fffe"

  // 🚀 Fetch and NORMALIZE real transaction data
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminOrders();
      console.log("📦 Raw API Response:", res); // Check your F12 Console if it's still blank!
      console.log("DEBUG: First item status value:", res[0].payment_status);
      
      let rawData = res.data || res;
      let rawList = Array.isArray(rawData) ? rawData : (rawData.orders || rawData.transactions || rawData.data || []);

      const normalizedList = rawList.map(t => {
        // 1. Aggressively clean up the Payment Method
        const rawMethod = String(t.payment_method || t.method || t.payment_type || "N/A").toLowerCase();
        let cleanMethod = "Other";
        if (rawMethod.includes("maya")) cleanMethod = "Maya";
        else if (rawMethod.includes("gcash")) cleanMethod = "GCash";
        else if (rawMethod.includes("card") || rawMethod.includes("credit") || rawMethod.includes("debit")) cleanMethod = "Credit Card";
        else if (rawMethod.includes("bank") || rawMethod.includes("transfer")) cleanMethod = "Bank Transfer";
        else if (rawMethod.includes("cash")) cleanMethod = "Cash";

        // 2. Hunt for the Price
        const price = Number(t.total_price || t.total_amount || t.amount || t.grand_total || t.total || 0);
        // 3. 🚀 Normalize payment status (support both admin listing formats)
        // Admin listing endpoint: uses `status` (enum string) and `trn` for reference
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

        // 4. Map everything together
        return {
          id: t.id || t.order_id || `txn_${Math.floor(Math.random()*10000)}`,
          customer_name: t.customer_name || t.customer?.name || t.user?.name || t.billing_name || "Guest",
          payment_reference: t.payment_reference || t.reference_number || t.reference || t.trn || t.transaction_id || "",
          payment_method: cleanMethod,
          total_price: price,
          payment_status: cleanStatus,
          created_at: t.created_at || t.date || t.created || new Date().toISOString()
        };
      });

      // Sort newest first
      normalizedList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setTransactions(normalizedList);
    } catch (e) {
      console.error("Failed to load transactions", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTransactions() }, []);

  // 🚀 Calculate Live Revenue Stats
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    
    // Filter for successful payments today
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

  // 🚀 Advanced Filter Logic
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    
    // Date Helpers
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const todayStr = today.toISOString().slice(0, 10);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    return transactions.filter(t => {
      // 1. Search Filter
      const matchSearch = !q || t.id.toLowerCase().includes(q) || t.payment_reference.toLowerCase().includes(q) || t.customer_name.toLowerCase().includes(q);
      
      // 2. Status & Method Filters
      const matchStatus = statusFilter === "Status: All" || t.payment_status.toLowerCase() === statusFilter.replace("Status: ", "").toLowerCase();
      const cleanFilterMethod = methodFilter.replace("Method: ", "");
      const matchMethod = methodFilter === "Method: All" || t.payment_method.includes(cleanFilterMethod);
      
      // 3. Date Filter
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

  const handlePrint = () => window.print()
  const printDate   = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })

  const handleCSV = () => {
    const headers = COLS.slice(0, -1); // Exclude "Action"
    const rows = filtered.map(t => [
      t.id, t.customer_name, t.payment_reference || "N/A", t.payment_method, t.total_price, t.payment_status, new Date(t.created_at).toLocaleString()
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `transactions_${new Date().toISOString().slice(0,10)}.csv`
    })
    a.click(); URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-5">
      {/* ── Print styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #transactions-print-area, #transactions-print-area * { visibility: visible !important; }
          #transactions-print-area {
            position: absolute; top: 0; left: 0; width: 100%; padding: 24px; font-family: sans-serif;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          #transactions-print-area table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          #transactions-print-area th {
            background: #f0fdf4 !important; color: #0C573E !important;
            border: 1px solid #d1d5db; padding: 8px 10px;
            text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
          }
          #transactions-print-area td { border: 1px solid #e5e7eb; padding: 8px 10px; font-size: 12px; color: #111827; }
          #transactions-print-area tr:nth-child(even) td { background: #f9fafb !important; }
          .print-footer { margin-top: 20px; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px; }
        }
        .print-only { display: none; }
      `}</style>

      {/* ── Heading ── */}
      <div className="no-print flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-medium" style={{ color: subTxt }}>Revenue overview</p>
          <div className="flex items-baseline gap-3 mt-0.5">
            <span className="text-4xl font-bold" style={{ color: isDark ? "#4ade80" : DG }}>{stats.revenue}</span>
            <span className="text-sm font-semibold" style={{ color: subTxt }}>Today's Total</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportCSVBtn onClick={handleCSV} isDark={isDark} />
          <PrintBtn onClick={handlePrint} />
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
        {STAT_CARDS.map(c => (
          <div key={c.label} className="rounded-xl p-4 sm:p-5 transition-all"
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
        <div className="print-only" style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#0C573E", margin: 0 }}>Esting's Flower International Inc.</h1>
              <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#374151", margin: "4px 0 0" }}>Transactions Report</h2>
            </div>
            <div style={{ textAlign: "right", fontSize: "11px", color: "#6b7280" }}>
              <p style={{ margin: 0 }}>Generated: {printDate}</p>
              <p style={{ margin: "2px 0 0" }}>Period: {dateFilter} | Type: {typeFilter} | Method: {methodFilter}</p>
              <p style={{ margin: "2px 0 0" }}>Status: {statusFilter}</p>
            </div>
          </div>
          <div style={{ height: "2px", background: "linear-gradient(90deg,#0C573E,#2E8B34)", marginTop: "12px", borderRadius: "2px" }} />
        </div>

        {/* Table card */}
        <div className="rounded-xl overflow-hidden"
          style={{ border: `1px solid ${cardBdr}`, backgroundColor: cardBg, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)" }}>

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
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Reference or Customer"
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
                ) : filtered.length > 0 ? (
                  filtered.map((t, idx) => (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: idx % 2 === 0 ? cardBg : (isDark ? "#111827" : "#f9fafb") }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = rowHover}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? cardBg : (isDark ? "#111827" : "#f9fafb")}>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>#{t.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: subTxt }}>{t.customer_name}</td>
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
                        <ActionBtns onView={() => alert(`View details for ${t.id}`)} />
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

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 flex-wrap gap-2 no-print"
            style={{ borderTop: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
            <span className="text-sm" style={{ color: subTxt }}>Showing {filtered.length} transactions</span>
          </div>
        </div>
      </div>
    </div>
  )
}