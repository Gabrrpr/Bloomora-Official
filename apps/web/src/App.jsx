import { useState, useEffect, useRef } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import Home from "./pages/customer/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import TermsAndConditions from "./pages/customer/TermsAndConditions";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/Checkout";
import Confirmation from "./pages/Confirmation";
import AccountPage from "./pages/customer/AccountPage";
import Orders from "./pages/Orders";
import Wishlist from "./pages/Wishlist";
import Settings from "./pages/Settings";
import AboutUs from "./pages/customer/AboutUs";
import ContactUs from "./pages/customer/ContactUs";
import AllOccasions from "./pages/customer/AllOccasions";
import Shop from "./pages/customer/Shop";
import MakeItPersonal from "./pages/MakeItPersonal";
import MixAndMatch from "./pages/MixAndMatch";
import DescribeArrangement from "./pages/DescribeArrangement";
import FAQ from "./pages/customer/FAQ";
import ReturnPolicy from "./pages/customer/ReturnPolicy";
import AIGalleryPage from "./pages/AIGalleryPage";
import ChatWidget from "./components/ChatWidget";
import CookieConsent from "./components/CookieConsent";
import AdPopup from "./components/AdPopup";
import WorldClock from "./pages/customer/WorldClock";
import VasesPage from "./pages/VasesPage";
import AddonsPage from "./pages/AddonsPage";
import WriteReviewPage from "./pages/WriteReviewPage";
import Profile from "./pages/Profile";

// ── Global dark-mode CSS ────────────────────────────────────────────────────
const DARK_CSS = `
  /* ── Base ── */
  [data-theme="dark"] body {
    background: #0f172a;
    color: #e5e7eb;
  }

  /* ── Tailwind bg overrides ── */
  [data-theme="dark"] .bg-white      { background-color: #1e293b !important; }
  [data-theme="dark"] .bg-gray-50    { background-color: #162032 !important; }
  [data-theme="dark"] .bg-gray-100   { background-color: #1e293b !important; }
  [data-theme="dark"] .min-h-screen  { background-color: #0f172a !important; }

  /* ── Tailwind text overrides ── */
  [data-theme="dark"] .text-gray-900,
  [data-theme="dark"] .text-gray-800,
  [data-theme="dark"] .text-gray-700 { color: #f1f5f9 !important; }

  [data-theme="dark"] .text-gray-600,
  [data-theme="dark"] .text-gray-500 { color: #cbd5e1 !important; }

  [data-theme="dark"] .text-gray-400 { color: #94a3b8 !important; }

  /* ── Tailwind border overrides ── */
  [data-theme="dark"] .border,
  [data-theme="dark"] .border-b,
  [data-theme="dark"] .border-t,
  [data-theme="dark"] .border-gray-100,
  [data-theme="dark"] .border-gray-200 { border-color: #334155 !important; }

  [data-theme="dark"] .divide-gray-100 > * + * { border-color: #334155 !important; }

  /* ── Inputs ── */
  [data-theme="dark"] input,
  [data-theme="dark"] textarea,
  [data-theme="dark"] select {
    background-color: #0f172a !important;
    color: #f1f5f9 !important;
    border-color: #475569 !important;
  }
  [data-theme="dark"] input::placeholder,
  [data-theme="dark"] textarea::placeholder { color: #64748b !important; }

  /* ── Smooth transitions ── */
  [data-theme="dark"] button,
  [data-theme="dark"] a,
  [data-theme="dark"] nav,
  [data-theme="dark"] input,
  [data-theme="dark"] textarea {
    transition: background-color 0.25s ease, border-color 0.25s ease, color 0.2s ease;
  }
`;

const AUTH_PAGES = ["login", "register", "forgot-password", "terms"];
const isPreview = new URLSearchParams(window.location.search).get("preview") === "true";

function injectDarkCSS() {
  if (document.getElementById("bloomora-dark-css")) return;
  const tag = document.createElement("style");
  tag.id = "bloomora-dark-css";
  tag.textContent = DARK_CSS;
  document.head.appendChild(tag);
}
injectDarkCSS();

function AppContent() {
  const { user } = useAuth();
  const { forceMode, clearForce } = useTheme();
  const [page, setPage] = useState("home");
  const [cartCount, setCartCount] = useState(0);
  const [prevPage, setPrevPage] = useState("login");
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // 🚀 NEW: State for Pop-up Orchestration
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [activeAdId, setActiveAdId] = useState("1");

  const pageRef = useRef(page);
  useEffect(() => { pageRef.current = page; }, [page]);

  // 🚀 NEW: The Traffic Cop logic for Pop-ups
  useEffect(() => {
    // Only run this logic on customer storefront pages
    if (isPreview || page === "admin" || AUTH_PAGES.includes(page)) return;

    // 1. Find out which Ad the Admin wants to show
    const adminAdId = localStorage.getItem("bloomora_active_ad_id") || "1";
    setActiveAdId(adminAdId);

    // 2. Check if cookies have been accepted
    const hasAcceptedCookies = localStorage.getItem("bloomora_cookies_accepted");
    
    if (!hasAcceptedCookies) {
      // Stop! Show cookies first. DO NOT show the ad yet.
      setShowCookieConsent(true);
    } else {
      // Cookies are handled, safe to trigger the Ad!
      triggerAd(adminAdId);
    }
  }, [page]); // Re-run if page changes, but sessionStorage keeps it to 1 pop-up per visit

  const triggerAd = (adId) => {
    // We use sessionStorage so the ad pops up once per browser session. 
    // If we used localStorage, they would only ever see an ad ONCE in their entire life!
    const hasSeenAd = sessionStorage.getItem(`bloomora_seen_ad_${adId}`);
    
    if (!hasSeenAd) {
      // A smooth 2-second delay so the user isn't immediately bombarded
      setTimeout(() => setShowAdPopup(true), 2000);
    }
  };

  const handleAcceptCookies = () => {
    localStorage.setItem("bloomora_cookies_accepted", "true");
    setShowCookieConsent(false);
    // Now that cookies are out of the way, trigger the Ad!
    triggerAd(activeAdId);
  };

  const handleCloseAd = () => {
    setShowAdPopup(false);
    sessionStorage.setItem(`bloomora_seen_ad_${activeAdId}`, "true");
  };

  useEffect(() => {
    if (isPreview) return;
    if (user && (user.role === "admin" || user.role === "staff")) {
      if (pageRef.current === "login") {
        const t = setTimeout(() => setPage("admin"), 950);
        return () => clearTimeout(t);
      } else {
        setPage("admin");
      }
    }
  }, [user]);

  useEffect(() => {
    if (AUTH_PAGES.includes(page)) {
      forceMode(false);
    } else {
      clearForce();
    }
  }, [page]);

  const navigate = (to, orderId = null) => {
    if (orderId) setSelectedOrderId(orderId);
    setPrevPage(page);
    setPage(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderContent = () => {
    if (isPreview) {
      return (
        <>
          <Navbar cartCount={cartCount} setCartCount={setCartCount} onNavigate={navigate} />
          <Home onNavigate={navigate} />
          <ChatWidget />
        </>
      );
    }

    if (page === "admin") return <AdminDashboard onNavigate={navigate} />;

    if (AUTH_PAGES.includes(page)) {
      if (page === "login")           return <Login onNavigate={navigate} />;
      if (page === "register")        return <Register onNavigate={navigate} />;
      if (page === "forgot-password") return <ForgotPassword onNavigate={navigate} />;
      if (page === "terms")           return <TermsAndConditions onNavigate={navigate} onBack={() => navigate(prevPage)} />;
    }

    return (
      <>
        <Navbar cartCount={cartCount} setCartCount={setCartCount} onNavigate={navigate} />
        {(() => {
          switch (page) {
            case "home":                 return <Home onNavigate={navigate} />;
            case "shop":                 return <Shop onNavigate={navigate} />;
            case "cart":                 return <Cart onNavigate={navigate} cartCount={cartCount} setCartCount={setCartCount} />;
            case "checkout":             return <Checkout onNavigate={navigate} />;
            case "confirmation":         return <Confirmation onNavigate={navigate} />;
            case "account":              return <AccountPage onNavigate={navigate} />;
            case "orders":               return <Orders onNavigate={navigate} selectedOrderId={selectedOrderId} />;
            case "wishlist":             return <Wishlist onNavigate={navigate} />;
            case "settings":             return <Settings onNavigate={navigate} />;
            case "about":                return <AboutUs onNavigate={navigate} />;
            case "contact":              return <ContactUs onNavigate={navigate} />;
            case "occasions":            return <AllOccasions onNavigate={navigate} />;
            case "make-it-personal":     return <MakeItPersonal onNavigate={navigate} />;
            case "mix-and-match":        return <MixAndMatch onNavigate={navigate} />;
            case "describe-arrangement": return <DescribeArrangement onNavigate={navigate} />;
            case "faq":                  return <FAQ onNavigate={navigate} />;
            case "return-policy":        return <ReturnPolicy onNavigate={navigate} />;
            case "ai-gallery":           return <AIGalleryPage onNavigate={navigate} />;
            case "world-clock":          return <WorldClock onNavigate={navigate} />;
            case "vases":                return <VasesPage onNavigate={navigate} />;
            case "addons":               return <AddonsPage onNavigate={navigate} />;
            case "write-review":         return <WriteReviewPage onNavigate={navigate} />;
            case "profile":              return <Profile onNavigate={navigate} />;
            default:                     return <Home onNavigate={navigate} />;
          }
        })()}
        <ChatWidget />
      </>
    );
  };

  return (
    <>
      {renderContent()}

      {/* 🚀 NEW: The Orchestrated Pop-ups */}
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