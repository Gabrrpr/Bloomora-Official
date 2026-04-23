import { useState } from "react"
import { DG, G, GreenCard, WhiteCard, FilterBar, Pagination, TH, TD, StatusBadge, EmptyRow, TableWrap } from "./_adminShared"

export default function AdminCustomers() {
  const [search, setSearch] = useState("")

  const RefreshBtn = () => (
    <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border rounded-md hover:bg-gray-50 transition-all text-gray-600 active:scale-95"
      style={{ borderColor: "#dde3ec" }}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Refresh
    </button>
  )

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Customers</h1>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-3">
        <div style={{ flex: "1 0 220px", maxWidth: "300px" }}>
          <GreenCard label="Total customers" value={0} sub="↑ +0 this week" />
        </div>
        <div style={{ flex: "1 0 200px", maxWidth: "280px" }}>
          <WhiteCard label="Active Customers" value={0} sub="↑ 0% vs last week" accentColor="#22c55e" />
        </div>
      </div>

      {/* Table */}
      <TableWrap>
        <div className="p-4" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
          <FilterBar
            dropdowns={["Status: All", "Total Orders", "Last Order Date"]}
            searchPlaceholder="Find customer"
            search={search}
            onSearch={setSearch}
            extra={<RefreshBtn />}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "760px" }}>
            <thead style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
              <tr>
                <TH>Customer Name</TH>
                <TH>Email</TH>
                <TH>Phone</TH>
                <TH>Status</TH>
                <TH>Total Orders</TH>
                <TH>Last Order Date</TH>
                <TH>Action</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <EmptyRow cols={7} message="Connect to the backend to load customer data." />
            </tbody>
          </table>
        </div>
        <Pagination />
      </TableWrap>
    </div>
  )
}
