import { useState } from "react"
import { DG, G, GreenCard, WhiteCard, TH, EmptyRow, TableWrap } from "./_adminShared"

// ── Functional Export Button ──────────────────────────────────────────────────
function ExportTransactionsBtn({ data = [] }) {
  const handleExport = () => {
    const headers = ["Transaction ID", "Order ID", "Customer", "Type", "Method", "Amount (₱)", "Status", "Date & Time"]
    const rows = data.length
      ? data.map(r => headers.map(h => r[h] ?? "").join(","))
      : [headers.map(() => "—").join(",")]
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`
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
function TransactionPagination({ total = 0 }) {
  const disabled = total === 0
  const btnBase = "px-3 py-1.5 text-xs font-semibold border rounded-md transition-all"
  const disabledStyle = { borderColor: "#e5e7eb", color: "#d1d5db", cursor: "not-allowed", backgroundColor: "#fafafa" }
  const activeStyle = { borderColor: "#dde3ec", color: "#374151", cursor: "pointer" }

  return (
    <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #f1f5f9" }}>
      <p className="text-xs text-gray-400">
        {disabled ? "Showing 0 transactions" : `Showing ${total} transaction${total !== 1 ? "s" : ""}`}
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

// ── Dropdown helper ───────────────────────────────────────────────────────────
function FDrop({ value, onChange, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md bg-white text-gray-700 cursor-pointer outline-none transition-all"
        style={{ borderColor: "#dde3ec" }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
        onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
      >
        {children}
      </select>
      <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminTransactions() {
  const [search, setSearch] = useState("")
  const [dateFilter, setDateFilter] = useState("today")
  const [typeFilter, setTypeFilter] = useState("")
  const [methodFilter, setMethodFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("success")

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Customer Transactions</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <GreenCard label="Total Revenue Today" value="₱0" sub="↑ ₱0 vs yesterday" />
        <WhiteCard label="Net Sales Today" value="₱0" sub="↑ ₱0 vs yesterday" accentColor="#3b82f6" />
        <WhiteCard label="Total Transactions" value={0} sub="+0 vs yesterday" accentColor="#7c3aed" />
      </div>

      <TableWrap>
        <div className="p-4" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
          <div className="flex items-center gap-2 flex-wrap">

            {/* Date range — with calendar icon */}
            <div className="relative">
              <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="appearance-none pl-8 pr-8 py-2 text-sm border rounded-md bg-white text-gray-700 cursor-pointer outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
              <svg className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {/* Transaction Type */}
            <FDrop value={typeFilter} onChange={setTypeFilter}>
              <option value="">Type: All</option>
              <option value="sale">Sale</option>
              <option value="refund">Refund</option>
              <option value="partial_refund">Partial Refund</option>
              <option value="void">Void</option>
              <option value="adjustment">Adjustment</option>
            </FDrop>

            {/* Payment Method */}
            <FDrop value={methodFilter} onChange={setMethodFilter}>
              <option value="">Method: All</option>
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
              <option value="maya">Maya</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cod">Cash on Delivery</option>
            </FDrop>

            {/* Status */}
            <FDrop value={statusFilter} onChange={setStatusFilter}>
              <option value="success">Status: Success</option>
              <option value="">Status: All</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="voided">Voided</option>
            </FDrop>

            {/* Search */}
            <div className="relative flex-1" style={{ minWidth: "180px" }}>
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search Transaction ID"
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-white outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
              />
            </div>

            <button
              className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}
            >
              Filter
            </button>

            <ExportTransactionsBtn data={[]} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "800px" }}>
            <thead style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
              <tr>
                <TH>Transaction ID</TH>
                <TH>Order ID</TH>
                <TH>Customer</TH>
                <TH>Type</TH>
                <TH>Method</TH>
                <TH>Status</TH>
                <TH>Date & Time</TH>
                <TH>Action</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <EmptyRow cols={8} message="Connect to the backend to load transaction data." />
            </tbody>
          </table>
        </div>

        <TransactionPagination total={0} />
      </TableWrap>
    </div>
  )
}
