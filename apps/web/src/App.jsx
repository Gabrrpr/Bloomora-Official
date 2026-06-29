import { useState, useEffect, useRef } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CurrencyProvider } from "./context/CuurencyContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { BranchProvider } from "./context/BranchContext";

import { api } from "./services/api";
import Navbar from "./components/Navbar";
import Home from "./pages/customer/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import TermsAndConditions from "./pages/customer/TermsAndConditions";
import DataPrivacyPolicy from "./pages/customer/DataPrivacyPolicy";
import OrderingAndFulfillment from "./pages/customer/OrderingAndFulfillment";
import CookiePolicy from "./pages/customer/CookiePolicy";
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
import Shop from "./pages/customer/Shop";
import MakeItPersonal from "./pages/customer/MakeItPersonal";
import MixAndMatch from "./pages/customer/MixAndMatch";
import DescribeArrangement from "./pages/customer/DescribeArrangement";
import FAQ from "./pages/customer/FAQ";
import AIGalleryPage from "./pages/customer/AIGalleryPage";
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
    if (path.includes("/confirmation")) return "confirmation";
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
  const [activeAdvertisement, setActiveAdvertisement] = useState(null);
  const [authTransition, setAuthTransition] = useState(null);
  const pageRef = useRef(page);

  useEffect(() => {
    const handleAuthTransition = (event) => {
      const type = event.detail?.type || "auth"
      setAuthTransition(type)
      window.clearTimeout(window.__bloomoraAuthTransitionTimer)
      window.__bloomoraAuthTransitionTimer = window.setTimeout(() => setAuthTransition(null), 900)
    }
    window.addEventListener("bloomora:auth-transition", handleAuthTransition)
    return () => {
      window.removeEventListener("bloomora:auth-transition", handleAuthTransition)
      window.clearTimeout(window.__bloomoraAuthTransitionTimer)
    }
  }, [])

  useEffect(() => {
    api.getActiveAdvertisement()
      .then(data => {
        if (data.advertisement && !sessionStorage.getItem("bloomora_ad_seen")) {
          setActiveAdvertisement(data.advertisement)
          setActiveAdId(data.advertisement.id)
          setShowAdPopup(true)
        }
      })
      .catch(() => {})
  }, [])

  const handleCloseAd = () => {
    sessionStorage.setItem("bloomora_ad_seen", "1")
    setShowAdPopup(false)
  }

  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const data = await api.isCustomizationEnabled();
        setIsCustomizationEnabled(data.enabled);
      } catch (err) {
        console.error("Failed to fetch AI Customization setting:", err);
      }
    };
    fetchGlobalSettings();

    const handleToggled = () => fetchGlobalSettings();
    window.addEventListener("customization-toggled", handleToggled);
    return () => window.removeEventListener("customization-toggled", handleToggled);
  }, []);

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const hasCode = new URLSearchParams(window.location.search).has("code");
      if (path.includes("/oauth/callback") && hasCode) setPage("oauth-callback");
      else if (path.includes("/staff") || path.includes("admin")) {
        setPage("admin");
      } else if (path.includes("activate-staff")) setPage("activate-staff");
      else if (path.includes("/confirmation")) setPage("confirmation");
      else if (path === "/" || path === "") setPage("home");
    };
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // 🚀 THE FIX: Role-based routing lock
  useEffect(() => {
    if (loading || isPreview || page === "activate-staff") return; 

    const safeRole = user?.role?.toLowerCase()?.trim();
    const isAdminOrStaff = safeRole === "admin" || safeRole === "staff";

    // 1. If an Admin/Staff logs in, force them to the dashboard
    if (user && isAdminOrStaff) {
      if (page !== "admin") {
        setPage("admin");
        window.history.pushState({}, "", "/admin");
      }
    }

    // 2. 🛡️ SECURITY: If someone tries to access the admin page but IS NOT an admin, kick them out
    if (page === "admin" && !isAdminOrStaff) {
      console.warn("Access Denied: You do not have admin privileges.");

      // If they aren't logged in at all, send them to login.
      // If they are logged in as a customer, send them home.
      const redirectPage = user ? "home" : "login";
      setPage(redirectPage);
      window.history.pushState({}, "", redirectPage === "home" ? "/" : `/${redirectPage}`);
    }
  }, [user, page, loading]);

  const navigate = (to, passedData = null) => {
    if (to === "shop") setActiveShopCategory(passedData || "All");
    if ((to === "orders" || to === "write-review") && passedData) setSelectedOrderId(passedData);

    // Smooth flower-loader transition when entering the auth pages from elsewhere.
    if ((to === "login" || to === "register") && page !== to) {
      window.dispatchEvent(new CustomEvent("bloomora:auth-transition", { detail: { type: "auth" } }));
    }

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

    // Standalone legal pages (their own back bar, no customer navbar) — like Terms.
    if (page === "privacy") return <DataPrivacyPolicy onNavigate={navigate} onBack={() => navigate(prevPage)} />;
    if (page === "ordering-fulfillment") return <OrderingAndFulfillment onNavigate={navigate} onBack={() => navigate(prevPage)} />;
    if (page === "cookie-policy") return <CookiePolicy onNavigate={navigate} onBack={() => navigate(prevPage)} />;

    return (
      <>
        {/* Customer UI gets the Navbar */}
        <Navbar cartCount={cartCount} setCartCount={setCartCount} onNavigate={navigate} isCustomizationEnabled={isCustomizationEnabled} />
        {(() => {
          switch (page) {
            case "oauth-callback": return <OAuthCallback onNavigate={navigate} />;
            case "home": return <Home onNavigate={navigate} />;
            case "shop": return <Shop onNavigate={navigate} initialCategory={activeShopCategory} />;
            case "about": return <AboutUs onNavigate={navigate} />;
            case "contact": return <ContactUs onNavigate={navigate} />;
            case "faq": return <FAQ onNavigate={navigate} />;
            case "world-clock": return <WorldClock onNavigate={navigate} />;

            case "make-it-personal": return <MakeItPersonal onNavigate={navigate} />;
            case "mix-and-match": return <MixAndMatch onNavigate={navigate} />;
            case "describe-arrangement": return <DescribeArrangement onNavigate={navigate} />;
            case "ai-gallery": return <AIGalleryPage onNavigate={navigate} />;

            case "cart": return <Cart onNavigate={navigate} cartCount={cartCount} setCartCount={setCartCount} />;
            case "checkout": return <Checkout onNavigate={navigate} />;
            case "confirmation": return <Confirmation onNavigate={navigate} />;
            case "write-review": return <WriteReviewPage onNavigate={navigate} orderId={selectedOrderId} />;

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
      <style>{`
        @keyframes adminPetalBloom {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        @keyframes authOverlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .auth-overlay-enter {
          animation: authOverlayFadeIn 0.35s ease-out both;
        }
      `}</style>
      {authTransition && (
        <div
          className={`fixed inset-0 z-[99999] flex items-center justify-center bg-white/95 auth-overlay-enter`}
        >
          <div className="flex flex-col items-center gap-3">
            <svg width="96" height="96" viewBox="0 0 100 100">
              {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <g key={angle} transform={`rotate(${angle} 50 50)`}>
                  <ellipse cx="50" cy="27" rx="9.5" ry="21" fill={["#f48fb1", "#ec407a", "#e91e63", "#f06292", "#c2185b", "#f48fb1"][i]}
                    style={{ animation: `adminPetalBloom 1.4s ease-in-out ${(i * 0.2).toFixed(2)}s infinite`, animationFillMode: "both" }} />
                </g>
              ))}
              <circle cx="50" cy="50" r="12" fill="#2E8B34" />
              <circle cx="50" cy="50" r="7" fill="#f9c6d0" />
              <circle cx="50" cy="50" r="3.5" fill="#fff" opacity="0.7" />
            </svg>
            <p className="text-sm font-semibold" style={{ color: "#0C573E" }}>
              {authTransition === "logout" ? "Signing you out..." : "Just a moment..."}
            </p>
          </div>
        </div>
      )}
      {renderContent()}
      {!AUTH_PAGES.includes(page) && page !== "admin" && !isPreview && (
        <>
          {showCookieConsent && <CookieConsent onAccept={handleAcceptCookies} />}
          {showAdPopup && <AdPopup advertisement={activeAdvertisement} adId={activeAdId} onClose={handleCloseAd} />}
        </>
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <BranchProvider>
            <AppContent />
          </BranchProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
