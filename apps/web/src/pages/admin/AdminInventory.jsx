import { useState } from "react"
import { DG, GreenCard, WhiteCard, FilterBar, Pagination, TH, EmptyRow, TableWrap, ExportBtn } from "./_adminShared"
export default function AdminInventory() {
  const [s, setS] = useState("")
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GreenCard label="Total Items" value={0} sub="↑ +0 this week" action="Add Item" />
        <WhiteCard label="Total Inventory Value" value="₱0" sub="↑ +₱0 this week" accentColor="#3b82f6" />
        <WhiteCard label="Low Stock Items" value={0} accentColor="#f59e0b"><button className="text-xs font-semibold mt-2 block" style={{color:"#16a34a"}}>↑ Needs restock</button></WhiteCard>
        <WhiteCard label="Out of Stock Items" value={0} accentColor="#ef4444"><button className="text-xs font-semibold mt-2 text-red-500 block">↑ Action needed</button></WhiteCard>
      </div>
      <TableWrap>
        <div className="p-4" style={{borderBottom:"1px solid #f1f5f9",backgroundColor:"#fafbfc"}}><FilterBar dropdowns={["Status","All Branch","Data Range"]} searchPlaceholder="Item ID or name" search={s} onSearch={setS} extra={<ExportBtn />} /></div>
        <div className="overflow-x-auto"><table className="w-full" style={{minWidth:"680px"}}><thead style={{borderBottom:"1px solid #f1f5f9",backgroundColor:"#fafbfc"}}><tr><TH>Item Name</TH><TH>Category</TH><TH>Unit</TH><TH>Current Stock</TH><TH>Cost per Unit</TH><TH>Status</TH><TH>Action</TH></tr></thead><tbody className="divide-y divide-gray-50"><EmptyRow cols={7} message="Connect to the backend to load inventory data." /></tbody></table></div>
        <Pagination />
      </TableWrap>
    </div>
  )
}
