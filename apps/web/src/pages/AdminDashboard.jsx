import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import AdminChat from "../components/AdminChat"

const navItems = [
  { icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: "Dashboard" },
  { icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z", label: "Orders" },
  { icon: "M4 6h16M4 10h16M4 14h16M4 18h16", label: "Products" },
  { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", label: "Customers" },
  { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", label: "Reports" },
  { icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", label: "Messages", badge: 3 },
  { icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", label: "Settings" },
]

const stats = [
  { label: "Total Orders", value: "1,284", change: "+12%", up: true, color: "bg-blue-50 text-blue-700", icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
  { label: "Revenue", value: "₱248,500", change: "+8.4%", up: true, color: "bg-green-50 text-green-700", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "New Customers", value: "348", change: "+5.2%", up: true, color: "bg-purple-50 text-purple-700", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { label: "Pending Orders", value: "42", change: "-3%", up: false, color: "bg-amber-50 text-amber-700", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
]

const recentOrders = [
  { id: "#ORD-001", customer: "Maria Santos", item: "Rose Bouquet", status: "Delivered", amount: "₱1,200", date: "Apr 15, 2025" },
  { id: "#ORD-002", customer: "Juan dela Cruz", item: "Sunflower Arrangement", status: "Processing", amount: "₱950", date: "Apr 15, 2025" },
  { id: "#ORD-003", customer: "Ana Reyes", item: "Wedding Centerpiece", status: "Pending", amount: "₱4,500", date: "Apr 14, 2025" },
  { id: "#ORD-004", customer: "Pedro Garcia", item: "Mixed Lilies", status: "Delivered", amount: "₱780", date: "Apr 14, 2025" },
  { id: "#ORD-005", customer: "Lisa Mendoza", item: "Tulip Bundle", status: "Cancelled", amount: "₱1,100", date: "Apr 13, 2025" },
]

const statusBadge = {
  Delivered: "bg-green-100 text-green-700",
  Processing: "bg-blue-100 text-blue-700",
  Pending: "bg-amber-100 text-amber-700",
  Cancelled: "bg-red-100 text-red-700",
}

export default function AdminDashboard({ onNavigate }) {
  const { user, logout } = useAuth()
  const [activeNav, setActiveNav] = useState("Dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
    onNavigate("login")
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-green-900 text-white flex flex-col transition-all duration-300 min-h-screen flex-shrink-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-green-800">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          {sidebarOpen && (
            <div>
              <p className="font-bold text-sm leading-tight">Esting's</p>
              <p className="text-green-300 text-xs">Admin Panel</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-sm font-medium relative ${
                activeNav === item.label ? "bg-white/20 text-white" : "text-green-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {item.icon.split(" M").map((d, i) => (
                  <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={(i === 0 ? "" : "M") + d} />
                ))}
              </svg>
              {sidebarOpen && <span>{item.label}</span>}
              {item.badge && sidebarOpen && (
                <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">{item.badge}</span>
              )}
              {item.badge && !sidebarOpen && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-green-800">
          {sidebarOpen && (
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="w-8 h-8 rounded-full bg-pink-300 flex items-center justify-center text-sm font-bold text-pink-800 flex-shrink-0">
                {user?.firstName?.[0] || "A"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.firstName || "Admin"} {user?.lastName || ""}</p>
                <p className="text-xs text-green-400 truncate">{user?.email || "admin@bloomora.com"}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-green-200 hover:bg-white/10 hover:text-white transition text-sm"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">{activeNav}</h1>
              <p className="text-xs text-gray-400">Bloomora Admin Panel · April 15, 2025</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveNav("Messages")}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>
            <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center text-sm font-bold text-pink-800">
              {user?.firstName?.[0] || "A"}
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 p-6 overflow-y-auto">

          {/* MESSAGES TAB */}
          {activeNav === "Messages" && <AdminChat />}

          {/* DASHBOARD TAB */}
          {activeNav === "Dashboard" && (
            <>
              <div className="mb-6 p-5 bg-gradient-to-r from-green-700 to-green-800 rounded-2xl text-white flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Welcome back, {user?.firstName || "Admin"}! 👋</h2>
                  <p className="text-green-200 text-sm mt-1">Here's what's happening with your floral business today.</p>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
                  <svg className="w-4 h-4 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-green-100">Apr 15, 2025</span>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map(({ label, value, change, up, color, icon }) => (
                  <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {icon.split(" M").map((d, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={(i === 0 ? "" : "M") + d} />)}
                        </svg>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${up ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{change}</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                    <p className="text-xs text-gray-400 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">Recent Orders</h3>
                  <button className="text-xs text-green-700 font-semibold hover:underline">View all</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        {["Order ID", "Customer", "Item", "Status", "Amount", "Date"].map(h => (
                          <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-mono text-xs text-gray-500">{order.id}</td>
                          <td className="px-6 py-4 font-medium text-gray-800">{order.customer}</td>
                          <td className="px-6 py-4 text-gray-600">{order.item}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge[order.status]}`}>{order.status}</span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-800">{order.amount}</td>
                          <td className="px-6 py-4 text-gray-500 text-xs">{order.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* OTHER TABS — coming soon */}
          {!["Dashboard", "Messages"].includes(activeNav) && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{activeNav}</h3>
                <p className="text-gray-500 text-sm">This section will be connected to your backend soon.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
