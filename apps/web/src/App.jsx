import { useState } from "react"
import { AuthProvider, useAuth } from "./context/AuthContext"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"
import TermsAndConditions from "./pages/TermsAndConditions"
import AdminDashboard from "./pages/AdminDashboard"
import Cart from "./pages/Cart"
import Checkout from "./pages/Checkout"
import Confirmation from "./pages/Confirmation"
import Profile from "./pages/Profile"
import Orders from "./pages/Orders"
import Wishlist from "./pages/Wishlist"
import Settings from "./pages/Settings"
import AboutUs from "./pages/AboutUs"
import ContactUs from "./pages/ContactUs"
import MakeItPersonal from "./pages/MakeItPersonal"
import MixAndMatch from "./pages/MixAndMatch"
import DescribeArrangement from "./pages/DescribeArrangement"
import ChatWidget from "./components/ChatWidget"

const AUTH_PAGES = ["login", "register", "forgot-password", "terms"]

function AppContent() {
  const { user } = useAuth()
  const [page, setPage] = useState("login")
  const [cartCount, setCartCount] = useState(2) // demo: 2 items
  const [prevPage, setPrevPage] = useState("login")

  const navigate = (to) => {
    setPrevPage(page)
    setPage(to)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (page === "admin") return <AdminDashboard onNavigate={navigate} />

  if (AUTH_PAGES.includes(page)) {
    if (page === "login")           return <Login onNavigate={navigate} />
    if (page === "register")        return <Register onNavigate={navigate} />
    if (page === "forgot-password") return <ForgotPassword onNavigate={navigate} />
    if (page === "terms")           return <TermsAndConditions onNavigate={navigate} onBack={() => navigate(prevPage)} />
  }

  const renderPage = () => {
    switch (page) {
      case "home":                return <Home />
      case "cart":                return <Cart onNavigate={navigate} />
      case "checkout":            return <Checkout onNavigate={navigate} />
      case "confirmation":        return <Confirmation onNavigate={navigate} />
      case "profile":             return <Profile onNavigate={navigate} />
      case "orders":              return <Orders onNavigate={navigate} />
      case "wishlist":            return <Wishlist onNavigate={navigate} />
      case "settings":            return <Settings onNavigate={navigate} />
      case "about":               return <AboutUs onNavigate={navigate} />
      case "contact":             return <ContactUs onNavigate={navigate} />
      case "make-it-personal":    return <MakeItPersonal onNavigate={navigate} />
      case "mix-and-match":       return <MixAndMatch onNavigate={navigate} />
      case "describe-arrangement":return <DescribeArrangement onNavigate={navigate} />
      default:                    return <Home />
    }
  }

  return (
    <>
      <Navbar cartCount={cartCount} setCartCount={setCartCount} onNavigate={navigate} />
      {renderPage()}
      <ChatWidget />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
