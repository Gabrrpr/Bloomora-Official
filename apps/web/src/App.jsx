import { useState, useEffect, useRef } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { api } from "./services/api";
import Navbar from "./components/Navbar";
import Home from "./pages/customer/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import TermsAndConditions from "./pages/customer/TermsAndConditions";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ActivateStaff from "./pages/admin/ActivateStaff";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import Confirmation from "./pages/Confirmation";
import AccountPage from "./pages/customer/AccountPage";
import Orders from "./pages/customer/Orders";
import Wishlist from "./pages/customer/Wishlist";
import Settings from "./pages/customer/Settings";
import AboutUs from "./pages/customer/AboutUs";
import ContactUs from "./pages/customer/ContactUs";
import AllOccasions from "./pages/customer/AllOccasions";
import Shop from "./pages/customer/Shop";
import MakeItPersonal from "./pages/customer/MakeItPersonal";
import MixAndMatch from "./pages/customer/MixAndMatch";
import DescribeArrangement from "./pages/customer/DescribeArrangement";
import FAQ from "./pages/customer/FAQ";
import ReturnPolicy from "./pages/customer/ReturnPolicy";
import AIGalleryPage from "./pages/customer/AIGalleryPage";
import AICardComposer from "./pages/customer/AICardComposer";
import ChatWidget from "./components/ChatWidget";
import CookieConsent from "./components/CookieConsent";
import AdPopup from "./components/AdPopup";
import WorldClock from "./pages/customer/WorldClock";
import WriteReviewPage from "./pages/customer/WriteReviewPage";
import Profile from "./pages/customer/Profile";
import OAuthCallback from "./context/OAuthCallback";

const DARK_CSS = `
  [data-theme="dark"] body { background: #0f172a; color: #e5e7eb; }
  [data-theme="dark"] .bg-white { background-color: #1e293b !important; }
  [data-theme="dark"] .bg-gray-50 { background-color: #162032 !important; }
  [data-theme="dark"] .min-h-screen { background-color: #0f172a !important; }
`;

const AUTH_PAGES = ["login", "register", "forgot-password", "terms", "activate-staff"];
const isPreview = new URLSearchParams(window.location.search).get("preview") === "true";

function AppContent() {
  const { user, loading } = useAuth();
  const { forceMode, clearForce } = useTheme();

  // 1. ALL HOOKS
  const [page, setPage] = useState(() => {
    const path = window.location.pathname;
    const hasCode = new URLSearchParams(window.location.search).has("code");
    
    if (path.includes("/oauth/callback") && hasCode) return "oauth-callback";
    if (path.includes("activate-staff")) return "activate-staff";
    
    if (path.includes("/login")) return "login";
    if (path.includes("/register")) return "register";
    if (path.includes("/staff") || path.includes("/admin")) return "admin";
    
    return "home";
  });
  
  const [cartCount, setCartCount] = useState(0);
  const [prevPage, setPrevPage] = useState("login");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [activeShopCategory, setActiveShopCategory] = useState("All");
  const [isCustomizationEnabled, setIsCustomizationEnabled] = useState(true);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [activeAdId, setActiveAdId] = useState("1");
  const pageRef = useRef(page);

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const hasCode = new URLSearchParams(window.location.search).has("code");
      if (path.includes("/oauth/callback") && hasCode) setPage("oauth-callback");
      else if (path.includes("/staff") || path.includes("admin")) {
        setPage("admin");
      } else if (path.includes("activate-staff")) setPage("activate-staff");
      else if (path === "/" || path === "") setPage("home");
    };
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // 🚀 THE FIX: Role-based routing lock
  useEffect(() => {
    if (loading || isPreview || page === "activate-staff") return; 
    
    // Normalize the role string to lowercase and remove accidental spaces
    const safeRole = user?.role?.toLowerCase()?.trim();
    
    if (user && (safeRole === "admin" || safeRole === "staff")) {
      // Force admin/staff to the dashboard if they land anywhere else
      if (page !== "admin") {
        setPage("admin");
      }
    }
  }, [user, page, loading]);

  const navigate = (to, passedData = null) => {
    if (to === "shop") setActiveShopCategory(passedData || "All");
    if ((to === "orders" || to === "write-review") && passedData) setSelectedOrderId(passedData);
    
    setPrevPage(page);
    setPage(to);

    // 🚀 THE FIX: Force the browser address bar to update so refreshes work perfectly
    const newUrl = to === "home" ? "/" : `/${to}`;
    window.history.pushState({}, "", newUrl);
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 2. LOADING GUARD
  const protectedPages = ["admin", "profile", "checkout", "account", "orders"];
  const isProtectedPage = protectedPages.includes(page);

  if (loading && isProtectedPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">Loading your profile...</p>
      </div>
    );
  }

  // 3. RENDER CONTENT
  const renderContent = () => {
    if (isPreview) {
      return (
        <>
          <Navbar cartCount={cartCount} setCartCount={setCartCount} onNavigate={navigate} isCustomizationEnabled={isCustomizationEnabled} />
          <Home onNavigate={navigate} />
          <ChatWidget />
        </>
      );
    }

    // 🚀 CRITICAL FIX: Return early for Admin/Staff so they don't get the customer Navbar!
    if (page === "admin") {
      return <AdminDashboard onNavigate={navigate} />;
    }

    // Early return for auth pages so they don't get the customer Navbar either
    if (AUTH_PAGES.includes(page)) {
      if (page === "login") return <Login onNavigate={navigate} />;
      if (page === "register") return <Register onNavigate={navigate} />;
      if (page === "forgot-password") return <ForgotPassword onNavigate={navigate} />;
      if (page === "terms") return <TermsAndConditions onNavigate={navigate} />;
      if (page === "activate-staff") return <ActivateStaff onNavigate={navigate} />;
    }

    return (
      <>
        {/* Customer UI gets the Navbar */}
        <Navbar cartCount={cartCount} setCartCount={setCartCount} onNavigate={navigate} isCustomizationEnabled={isCustomizationEnabled} />
        {(() => {
          switch (page) {
            case "oauth-callback": return <OAuthCallback onNavigate={navigate} />;
            case "home": return <Home onNavigate={navigate} />;
            case "shop": return <Shop onNavigate={navigate} activeCategory={activeShopCategory} />;
            case "occasions": return <AllOccasions onNavigate={navigate} />;
            case "about": return <AboutUs onNavigate={navigate} />;
            case "contact": return <ContactUs onNavigate={navigate} />;
            case "faq": return <FAQ onNavigate={navigate} />;
            case "return-policy": return <ReturnPolicy onNavigate={navigate} />;
            case "world-clock": return <WorldClock onNavigate={navigate} />;

            case "make-it-personal": return <MakeItPersonal onNavigate={navigate} />;
            case "mix-and-match": return <MixAndMatch onNavigate={navigate} />;
            case "describe-arrangement": return <DescribeArrangement onNavigate={navigate} />;
            case "ai-gallery": return <AIGalleryPage onNavigate={navigate} />;
            case "ai-card-composer": return <AICardComposer onNavigate={navigate} />;

            case "cart": return <Cart onNavigate={navigate} cartCount={cartCount} setCartCount={setCartCount} />;
            case "checkout": return <Checkout onNavigate={navigate} />;
            case "confirmation": return <Confirmation onNavigate={navigate} />;
            case "write-review": return <WriteReviewPage onNavigate={navigate} selectedOrderId={selectedOrderId} />;

            case "account": return <AccountPage onNavigate={navigate} />;
            case "orders": return <Orders onNavigate={navigate} selectedOrderId={selectedOrderId} />;
            case "wishlist": return <Wishlist onNavigate={navigate} />;
            case "settings": return <Settings onNavigate={navigate} />;
            case "profile": return <Profile onNavigate={navigate} />;

            default: return <Home onNavigate={navigate} />;
          }
        })()}
        <ChatWidget />
      </>
    );
  };

  return (
    <>
      {renderContent()}
      {!AUTH_PAGES.includes(page) && page !== "admin" && !isPreview && (
        <>
          {showCookieConsent && <CookieConsent onAccept={handleAcceptCookies} />}
          {showAdPopup && <AdPopup adId={activeAdId} onClose={handleCloseAd} />}
        </>
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}