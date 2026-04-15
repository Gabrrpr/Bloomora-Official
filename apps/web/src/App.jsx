import { useState } from "react"
import { AuthProvider, useAuth } from "./context/AuthContext"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"
import TermsAndConditions from "./pages/TermsAndConditions"
import AdminDashboard from "./pages/AdminDashboard"
import ChatWidget from "./components/ChatWidget"

function AppContent() {
  const { user } = useAuth()
  const [page, setPage] = useState("login")
  const [cartCount, setCartCount] = useState(0)
  const [prevPage, setPrevPage] = useState("login")

  const navigate = (to) => {
    setPrevPage(page)
    setPage(to)
  }

  // If logged in as admin, show admin dashboard
  if (user?.role === "admin" && page === "admin") {
    return <AdminDashboard onNavigate={navigate} />
  }

  // If logged in as customer, show main app
  if (user?.role === "customer" && page === "home") {
    return (
      <>
        <Navbar cartCount={cartCount} setCartCount={setCartCount} onNavigate={navigate} />
        <Home />
        <ChatWidget />
      </>
    )
  }

  // Auth pages (no navbar)
  if (page === "login") return <Login onNavigate={navigate} />
  if (page === "register") return <Register onNavigate={navigate} />
  if (page === "forgot-password") return <ForgotPassword onNavigate={navigate} />
  if (page === "terms") return <TermsAndConditions onNavigate={navigate} onBack={() => navigate(prevPage)} />

  // Default fallback
  return <Login onNavigate={navigate} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
