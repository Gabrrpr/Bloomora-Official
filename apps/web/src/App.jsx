 import { useState } from "react"
import { AuthProvider, useAuth } from "./context/AuthContext"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"
import TermsAndConditions from "./pages/TermsAndConditions"
import AdminDashboard from "./pages/admin/AdminDashboard"
import Cart from "./pages/Cart"
import Checkout from "./pages/Checkout"
import Confirmation from "./pages/Confirmation"
import AccountPage from "./pages/AccountPage"
import Orders from "./pages/Orders"
import Wishlist from "./pages/Wishlist"
import Settings from "./pages/Settings"
import AboutUs from "./pages/AboutUs"
import ContactUs from "./pages/ContactUs"
import AllOccasions from "./pages/AllOccasions"
import Shop from "./pages/Shop"
import MakeItPersonal from "./pages/MakeItPersonal"
import MixAndMatch from "./pages/MixAndMatch"
import DescribeArrangement from "./pages/DescribeArrangement"
import FAQ from "./pages/FAQ"
import ReturnPolicy from "./pages/ReturnPolicy"
import AIGalleryPage from "./pages/AIGalleryPage"
import ChatWidget from "./components/ChatWidget"
import CookieConsent from "./components/CookieConsent"
import AdPopup from "./components/AdPopup"
import WorldClock    from "./pages/WorldClock"    
import VasesPage from "./pages/VasesPage"
import AddonsPage from "./pages/AddonsPage"
import WriteReviewPage from "./pages/WriteReviewPage"

const AUTH_PAGES = ["login", "register", "forgot-password", "terms"]

function AppContent() {
  const { user } = useAuth()
  const [page, setPage] = useState("home")
  const [cartCount, setCartCount] = useState(0)
  const [prevPage, setPrevPage] = useState("login")
  const [selectedOrderId, setSelectedOrderId] = useState(null)

const navigate = (to, orderId = null) => {
    if (orderId) setSelectedOrderId(orderId)
    setPrevPage(page)
    setPage(to)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const renderContent = () => {
    if (page === "admin") return <AdminDashboard onNavigate={navigate} />

    if (AUTH_PAGES.includes(page)) {
      if (page === "login")           return <Login onNavigate={navigate} />
      if (page === "register")        return <Register onNavigate={navigate} />
      if (page === "forgot-password") return <ForgotPassword onNavigate={navigate} />
      if (page === "terms")           return <TermsAndConditions onNavigate={navigate} onBack={() => navigate(prevPage)} />
    }

    return (
      <>
        <Navbar cartCount={cartCount} setCartCount={setCartCount} onNavigate={navigate} />
        {(() => {
          switch (page) {
            case "home":                 return <Home onNavigate={navigate} />
            case "shop":                 return <Shop onNavigate={navigate} />
            case "cart":                 return <Cart onNavigate={navigate} cartCount={cartCount} setCartCount={setCartCount} />
            case "checkout":             return <Checkout onNavigate={navigate} />
            case "confirmation":         return <Confirmation onNavigate={navigate} />
            case "account":              return <AccountPage onNavigate={navigate} />
            case "orders":              return <Orders onNavigate={navigate} />
            case "wishlist":             return <Wishlist onNavigate={navigate} />
            case "settings":             return <Settings onNavigate={navigate} />
            case "about":                return <AboutUs onNavigate={navigate} />
            case "contact":              return <ContactUs onNavigate={navigate} />
            case "occasions":            return <AllOccasions onNavigate={navigate} />
            case "make-it-personal":     return <MakeItPersonal onNavigate={navigate} />
            case "mix-and-match":        return <MixAndMatch onNavigate={navigate} />
            case "describe-arrangement": return <DescribeArrangement onNavigate={navigate} />
            case "faq":                  return <FAQ onNavigate={navigate} />
            case "return-policy":        return <ReturnPolicy onNavigate={navigate} />
            case "ai-gallery":           return <AIGalleryPage onNavigate={navigate} />
            default:                     return <Home onNavigate={navigate} />
            case "world-clock":   return <WorldClock onNavigate={navigate} />  
case "vases": return <VasesPage onNavigate={navigate} />
            case "addons": return <AddonsPage onNavigate={navigate} />
case "write-review": return <WriteReviewPage onNavigate={navigate} orderId={selectedOrderId} />
          }
        })()}
        <ChatWidget />
      </>
    )
  }

  return (
    <>
      {renderContent()}
      {!AUTH_PAGES.includes(page) && page !== "admin" && <>
        <CookieConsent />
        <AdPopup />
      </>}
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
