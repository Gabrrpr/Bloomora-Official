import { useState } from "react"
import { DG, G, FilterBar, Pagination, TH, EmptyRow, TableWrap, ExportBtn } from "./_adminShared"

export default function AdminActivityLogs() {
  const [search, setSearch] = useState("")

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Activity Log</h1>

      {/* Subtle info strip */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg"
        style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
        <svg className="w-4 h-4 flex-shrink-0" style={{ color: DG }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs font-medium" style={{ color: DG }}>
          All admin and staff actions are logged here for security and audit purposes.
        </p>
      </div>

      {/* Table */}
      <TableWrap>
        <div className="p-4" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
          <FilterBar
            dropdowns={["All Actions", "All Users", "Date Range"]}
            searchPlaceholder="Search logs..."
            search={search}
            onSearch={setSearch}
            extra={<ExportBtn />}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "760px" }}>
            <thead style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
              <tr>
                <TH>Timestamp</TH>
                <TH>User</TH>
                <TH>Role</TH>
                <TH>Action</TH>
                <TH>IP Address</TH>
                <TH>Action</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <EmptyRow cols={6} message="No activity logs yet — connect to the backend." />
            </tbody>
          </table>
        </div>
        <Pagination />
      </TableWrap>
    </div>
  )
}
