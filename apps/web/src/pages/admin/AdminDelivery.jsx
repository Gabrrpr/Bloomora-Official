import { useState } from "react"
import { DG, G, GreenCard, WhiteCard, FilterBar, Pagination, TH, StatusBadge, EmptyRow, TableWrap, ExportBtn } from "./_adminShared"

export default function AdminDelivery() {
  const [search, setSearch] = useState("")

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Delivery Operations</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GreenCard label="Deliveries today" sublabel="Success" value={0} sub="↑ +0 this week" />
        <WhiteCard label="Out for delivery" sublabel="On the way" value={0} sub="↑ +0 vs last week" accentColor="#3b82f6" />
        <WhiteCard label="Available Riders" sublabel="Assign deliveries" value={0} sub="← 0 others out for delivery" accentColor="#22c55e" />
        <WhiteCard label="Failed deliveries" sublabel="Review Cases" value={0} sub="↑ +0 vs last week" subRed accentColor="#ef4444">
          <button className="text-xs font-semibold mt-1 text-red-400 hover:underline block">Review Cases</button>
        </WhiteCard>
      </div>

      {/* Table */}
      <TableWrap>
        <div className="p-4" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
          <FilterBar
            dropdowns={["As. Area: All", "Status: All", "As. Orders: Ascending"]}
            searchPlaceholder="Search Product ID or name"
            search={search}
            onSearch={setSearch}
            extra={<ExportBtn />}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "760px" }}>
            <thead style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
              <tr>
                <TH>Image</TH>
                <TH>Rider Name</TH>
                <TH>Assigned Area</TH>
                <TH>As. Orders</TH>
                <TH>Last Assigned</TH>
                <TH>Status</TH>
                <TH>Action</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <EmptyRow cols={7} message="Connect to the backend to load delivery rider data." />
            </tbody>
          </table>
        </div>
        <Pagination showing="0 delivery riders" />
      </TableWrap>
    </div>
  )
}
