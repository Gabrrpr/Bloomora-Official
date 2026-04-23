import { useState } from "react"
import { DG, G, GreenCard, WhiteCard, FilterBar, Pagination, TH, StatusBadge, EmptyRow, TableWrap, ExportBtn } from "./_adminShared"

export default function AdminTransactions() {
  const [search, setSearch] = useState("")

  const TodayFilter = () => (
    <div className="relative">
      <select className="appearance-none pl-8 pr-7 py-2 text-sm border rounded-md bg-white text-gray-700 cursor-pointer outline-none transition-all"
        style={{ borderColor: "#dde3ec" }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
        onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}>
        <option>Today</option>
        <option>This Week</option>
        <option>This Month</option>
      </select>
      <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <svg className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  )

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Customer Transactions</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <GreenCard label="Total Revenue Today" value="₱0" sub="↑ ₱0 vs yesterday" />
        <WhiteCard label="Net Sales Today" value="₱0" sub="↑ ₱0 vs yesterday" accentColor="#3b82f6" />
        <WhiteCard label="Total Transactions" value={0} sub="+0 vs yesterday" accentColor="#7c3aed" />
      </div>

      {/* Table */}
      <TableWrap>
        <div className="p-4" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
          <div className="flex items-center gap-2 flex-wrap">
            <TodayFilter />
            {["Type: All", "Method: All", "Status: Success"].map(d => (
              <div key={d} className="relative">
                <select className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md bg-white text-gray-700 cursor-pointer outline-none transition-all"
                  style={{ borderColor: "#dde3ec" }}
                  onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                  onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}>
                  <option>{d}</option>
                </select>
                <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            ))}
            <div className="relative flex-1" style={{ minWidth: "180px" }}>
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Transaction ID"
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-white outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }} />
            </div>
            <button className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>Filter</button>
            <ExportBtn />
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
        <Pagination />
      </TableWrap>
    </div>
  )
}
