import { useState, useEffect, useCallback, Fragment } from "react"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api.js"
import { DG, G, StatusBadge } from "./_adminShared"
import { Pagination } from "./_adminShared"
import estingsWordmark from "../../assets/Estings.svg"
// 🚀 NEW: Import Fallback Image
import ImageNotFound from "../../assets/default-img/ImageNotFound.webp"

const ORDER_STATUSES = ["All", "Pending", "Confirmed", "Preparing", "Ready for Pickup", "Out for Delivery", "Delivered", "Cancelled"]
const MANUAL_ORDER_STATUSES = [
  { label: "Confirmed", value: "confirmed" },
  { label: "Preparing", value: "preparing" },
  { label: "Ready for Pickup", value: "ready_for_pickup" },
  { label: "Cancelled", value: "cancelled" },
]

const SEARCH_SAMPLES = ["John Dela Cruz", "ORD-5FA237AC", "Maria Santos", "ORD-9C4E1B07"]
const BRANCHES       = ["All Branches", "Manila", "Pampanga"]
const DATE_RANGES    = ["All Time", "Today", "This Week", "This Month", "Last 30 Days"]

const PRINT_STATUS_META = [
  { key: "Pending",         label: "Pending",         cls: "s-pending"   },
  { key: "Confirmed",       label: "Confirmed",       cls: "s-confirmed" },
  { key: "Preparing",       label: "Preparing",       cls: "s-preparing" },
  { key: "Out for Delivery", label: "Out for Delivery", cls: "s-ofd"       },
  { key: "Delivered",       label: "Delivered",       cls: "s-delivered" },
  { key: "Cancelled",       label: "Cancelled",       cls: "s-cancelled" },
]

function FlowerLoader({ message = "Loading...", isDark = false }) {
  const petals = [
    { angle: 0,   color: "#f48fb1" },
    { angle: 60,  color: "#ec407a" },
    { angle: 120, color: "#e91e63" },
    { angle: 180, color: "#f06292" },
    { angle: 240, color: "#c2185b" },
    { angle: 300, color: "#f48fb1" },
  ]
  return (
    <>
      <style>{`
        @keyframes adminPetalBloom {
          0%, 100% { opacity: 0.2; }
          50%        { opacity: 1;   }
        }
      `}</style>
      <div className="flex flex-col items-center justify-center rounded-xl"
        style={{ minHeight: "60vh", backgroundColor: isDark ? "#0f172a" : "transparent" }}>
        <svg width="120" height="120" viewBox="0 0 100 100">
          {petals.map(({ angle, color }, i) => (
            <g key={i} transform={`rotate(${angle} 50 50)`}>
              <ellipse cx="50" cy="27" rx="9.5" ry="21" fill={color}
                style={{ animation: `adminPetalBloom 1.4s ease-in-out ${(i * 0.2).toFixed(2)}s infinite`, animationFillMode: "both" }} />
            </g>
          ))}
          <circle cx="50" cy="50" r="12" fill="#2E8B34" />
          <circle cx="50" cy="50" r="7"  fill="#f9c6d0" />
          <circle cx="50" cy="50" r="3.5" fill="#fff" opacity="0.7" />
        </svg>
        <p className="mt-4 text-sm font-medium tracking-wide" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>{message}</p>
      </div>
    </>
  )
}

function SelectFilter({ value, onChange, options, minWidth = "130px", isDark }) {
  const bg  = isDark ? "#1e293b" : "white"
  const bdr = isDark ? "#374151" : "#dde3ec"
  const tc  = isDark ? "#e2e8f0" : "#374151"
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md cursor-pointer outline-none transition-all"
        style={{ borderColor: bdr, minWidth, backgroundColor: bg, color: tc }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(74,222,128,0.18)` }}
        onBlur={e => { e.target.style.borderColor = bdr; e.target.style.boxShadow = "none" }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: isDark ? "#64748b" : "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  )
}

function ExportCSVBtn({ onClick, isDark }) {
  return (
    <button
      onClick={onClick}
      className="no-print flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all active:scale-95"
      style={{ borderColor: isDark ? "#374151" : "#dde3ec", color: isDark ? "#94a3b8" : "#374151", backgroundColor: isDark ? "#1e293b" : "white" }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#2d3f55" : "#f9fafb"}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "white"}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export CSV
    </button>
  )
}

function PrintBtn({ onClick, isDark }) {
  return (
    <button onClick={onClick}
      className="no-print flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all active:scale-95"
      style={{ borderColor: isDark ? "#374151" : "#dde3ec", color: isDark ? "#94a3b8" : "#374151", backgroundColor: isDark ? "#1e293b" : "white" }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#2d3f55" : "#f9fafb"}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "white"}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Print
    </button>
  )
}

function formatStatus(status) {
  if (!status) return "Pending"
  const normalized = String(status).toLowerCase()
  if (normalized === "ready_for_pickup") return "Ready for Pickup"
  if (normalized === "out_for_delivery") return "Out for Delivery"
  if (normalized === "pending_payment") return "Pending Payment"
  if (normalized === "payment_failed") return "Payment Failed"
  return normalized.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
}

function statusToApi(status) {
  return String(status).toLowerCase().replace(/ /g, "_")
}

export default function AdminOrders() {
  const { isDark } = useTheme()

  const PAGE_SIZE = 35;
  const [search, setSearch]         = useState("")
  const [statusFilter, setStatus]   = useState("All")
  const [branch, setBranch]         = useState("All Branches")
  const [dateRange, setDateRange]   = useState("All Time")
  const [orders, setOrders]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [viewingOrder, setViewingOrder] = useState(null)
  const [viewingOrderLoading, setViewingOrderLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [page, setPage] = useState(1);
  const [entered, setEntered] = useState(false)
  const [phText, setPhText] = useState("")

  // 🚀 WALK-IN POS STATE
  const [posOpen, setPosOpen] = useState(false)
  const [posClosing, setPosClosing] = useState(false)
  const [posProducts, setPosProducts] = useState([])
  const [posCatalogLoading, setPosCatalogLoading] = useState(false)
  const [posCart, setPosCart] = useState([])
  const [posBranch, setPosBranch] = useState("Manila")
  const [posPayMethod, setPosPayMethod] = useState("cash")
  const [posRef, setPosRef] = useState("")
  const [posLoading, setPosLoading] = useState(false)
  const [posSearch, setPosSearch] = useState("")
  
  // 🚀 NEW: POS Resizer State
  const [posWidth, setPosWidth] = useState(1152); // Default max-w-6xl size

  const [posCategory, setPosCategory] = useState("All")
  const [posToast, setPosToast] = useState(null)
  const [posSuccess, setPosSuccess] = useState(false)

  const [fulfillmentMethod, setFulfillmentMethod] = useState("pickup");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [pickupMode, setPickupMode] = useState("walkin");
  const [pickupDate, setPickupDate] = useState("");

  const openImagePreview = (src, title) => {
    setImagePreview({ src: src || ImageNotFound, title: title || "Order image" })
  }

  // Fetch full order details (includes items + recipe/materials for AI orders)
  const openOrderDetail = async (o) => {
    setViewingOrder(o)
    setViewingOrderLoading(true)
    try {
      const full = await api.get(`/orders/${o.id}`)
      if (full && full.id) setViewingOrder(full)
    } catch (e) {
      console.error("Failed to load full order details", e)
    } finally {
      setViewingOrderLoading(false)
    }
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await api.getAdminOrders({ status: statusFilter, search: search.trim() || undefined, branch, date_range: dateRange })
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) { setError(e?.message || "Failed to load orders"); setOrders([]) }
    finally { setLoading(false) }
  }, [statusFilter, search, branch, dateRange])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  useEffect(() => {
    if (posOpen && posProducts.length === 0) {
      const loadCatalog = async () => {
        setPosCatalogLoading(true);
        try {
          const [adminRes, customizationRes] = await Promise.all([
            api.getAdminProducts ? api.getAdminProducts() : api.get("/products/admin/all"),
            api.getCustomizationProducts ? api.getCustomizationProducts() : api.get("/products/customization/all"),
          ]);
          const adminList = Array.isArray(adminRes) ? adminRes : (adminRes.data || []);
          const customizationList = Array.isArray(customizationRes) ? customizationRes : (customizationRes.data || []);
          const byId = new Map();
          [...adminList, ...customizationList].forEach(item => {
            if (!item?.id || item.is_available === false || item.status === "inactive") return;
            const previous = byId.get(item.id) || {};
            byId.set(item.id, { ...previous, ...item });
          });
          setPosProducts([...byId.values()]);
        } catch (e) {
          console.warn("Failed to load POS catalog:", e);
        } finally {
          setPosCatalogLoading(false);
        }
      }
      loadCatalog();
    }
  }, [posOpen])

  // Animate the drawer out before unmounting (smooth slide back to the right).
  const closePos = () => {
    setPosClosing(true)
    setTimeout(() => { setPosOpen(false); setPosClosing(false) }, 280)
  }

  useEffect(() => {
    if (loading) { setEntered(false); return }
    const t = setTimeout(() => setEntered(true), 1300)
    return () => clearTimeout(t)
  }, [loading])

  useEffect(() => {
    if (search) { setPhText(""); return }
    let sample = 0, ch = 0, deleting = false, timer
    const tick = () => {
      const full = SEARCH_SAMPLES[sample]
      ch += deleting ? -1 : 1
      setPhText(full.slice(0, ch))
      if (!deleting && ch === full.length) { deleting = true; timer = setTimeout(tick, 1400); return }
      if (deleting && ch === 0) { deleting = false; sample = (sample + 1) % SEARCH_SAMPLES.length }
      timer = setTimeout(tick, deleting ? 55 : 110)
    }
    timer = setTimeout(tick, 500)
    return () => clearTimeout(timer)
  }, [search])

  const counts = {
    "Out for Delivery": orders.filter(o => formatStatus(o.status) === "Out for Delivery").length,
    Pending:   orders.filter(o => formatStatus(o.status) === "Pending").length,
    Preparing: orders.filter(o => formatStatus(o.status) === "Preparing").length,
    Cancelled: orders.filter(o => formatStatus(o.status) === "Cancelled").length,
  }

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === "All" || formatStatus(o.status) === statusFilter;
    const matchBranch = branch === "All Branches" || (o.branch || "").toLowerCase() === branch.toLowerCase();
    const matchSearch = !search ||
      (o.order_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_name || "").toLowerCase().includes(search.toLowerCase());
      
    return matchStatus && matchBranch && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paginatedOrders = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const subTxt   = isDark ? "#94a3b8" : "#64748b"
  const toolbarBg  = isDark ? "#111827" : "#fafbfc"
  const toolbarBdr = isDark ? "#1e293b" : "#f1f5f9"
  const inputBg    = isDark ? "#1e293b" : "white"
  const inputBdr   = isDark ? "#374151" : "#dde3ec"
  const inputTxt   = isDark ? "#e2e8f0" : "#374151"
  const errBg      = isDark ? "rgba(239,68,68,0.1)" : "#fef2f2"
  const errBdr     = isDark ? "rgba(239,68,68,0.3)" : "#fecaca"
  const errTxt     = isDark ? "#f87171" : "#dc2626"

  const STAT_CARDS = [
    { label: "Out for Delivery", sub: "On the way",        key: "Out for Delivery", green: true },
    { label: "Pending",          sub: "Need action today", key: "Pending" },
    { label: "Preparing",        sub: "In progress",       key: "Preparing" },
    { label: "Cancelled",        sub: "Review cases",      key: "Cancelled", red: true },
  ]

  const modalD = {
    overlayBg: "rgba(15,23,42,0.72)",
    modalBg:   isDark ? "#1a2332" : "white",
    modalBdr:  isDark ? "#2d3748" : "#e8edf2",
    modalHdr:  isDark ? "#111827" : "linear-gradient(135deg,#f0fdf4,#fafff8)",
    modalHdrBdr: isDark ? "#1e293b" : "#f1f5f9",
    modalFtr:  isDark ? "#0f172a" : "#fafbfc",
    modalFtrBdr: isDark ? "#1e293b" : "#f1f5f9",
  }

  const posItemCategory = (p) => {
    const raw = String(p?.product_group || p?.product_type || p?.category_name || p?.category || "Other").toLowerCase();
    if (raw.includes("flower") || raw.includes("rose") || raw.includes("tulip") || raw.includes("carnation")) return "Flowers";
    if (raw.includes("vase")) return "Vases";
    if (raw.includes("wrap")) return "Wrapping";
    if (raw.includes("accessor") || raw.includes("add")) return "Add-ons";
    if (raw.includes("arrangement") || raw.includes("bouquet") || raw.includes("floral")) return "Arrangements";
    return raw ? raw.replace(/(^|\s|-)\w/g, c => c.toUpperCase()).replace(/-/g, " ") : "Other";
  };

  const posItemKind = (p) => ["Flowers", "Vases", "Wrapping", "Add-ons"].includes(posItemCategory(p)) ? "Material" : "Product";

  // 🚀 NEW: Get Strictly Branch-based Stock from adminInventory/inventory Array
  // Format a Philippine mobile number as the user types: "+63 917 123 4567".
  const formatPhPhone = (raw) => {
    let d = (raw || "").replace(/\D/g, "");
    if (d.startsWith("63")) d = d.slice(2);
    if (d.startsWith("0")) d = d.slice(1);
    d = d.slice(0, 10); // PH mobile is 10 digits after the +63 country code
    if (!d) return "";
    let out = "+63 " + d.slice(0, 3);
    if (d.length > 3) out += " " + d.slice(3, 6);
    if (d.length > 6) out += " " + d.slice(6, 10);
    return out;
  };

  const getBranchStock = (p) => {
    const checkBranch = posBranch.toLowerCase();

    // Flat per-branch stock fields (e.g. stock_manila / stock_pampanga) — primary source.
    const flat = p[`stock_${checkBranch}`] ?? p[`stock${checkBranch.charAt(0).toUpperCase()}${checkBranch.slice(1)}`];
    if (flat != null) return flat;

    // Check if there is an adminInventory or inventory array
    const invArray = p.adminInventory || p.inventory;
    if (invArray && Array.isArray(invArray)) {
        const branchStockObj = invArray.find(i => 
            (i.branch && i.branch.toLowerCase() === checkBranch) || 
            (i.branch_name && i.branch_name.toLowerCase() === checkBranch)
        );
        if (branchStockObj) {
            return branchStockObj.stock ?? branchStockObj.quantity ?? 0;
        }
    }
    
    // Fallback if stock is stored flat but tied strictly to a specific branch property
    if ((p.branch && p.branch.toLowerCase() === checkBranch) || 
        (p.branch_name && p.branch_name.toLowerCase() === checkBranch)) {
        return p.stock ?? p.current_stock ?? p.quantity ?? 0;
    }

    // Default return 0 if no specific stock for this branch is found to ensure strict distinction
    return 0;
  }

  // Handle Drag / Resize logic for the POS Drawer
  const startResizing = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = posWidth;

    const onMouseMove = (moveEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const newWidth = Math.min(window.innerWidth * 0.95, Math.max(700, startWidth + deltaX));
      setPosWidth(newWidth);
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [posWidth]);

  const posCategories = ["All", ...new Set(posProducts.map(p => {
    return posItemCategory(p);
  }))].filter(Boolean);

  const filteredPosProducts = posProducts.filter(p => {
    const matchSearch = !posSearch || p.name?.toLowerCase().includes(posSearch.toLowerCase());
    const pCat = posItemCategory(p);
    const matchCategory = posCategory === "All" || pCat === posCategory;
    
    return matchSearch && matchCategory;
  });

  const handleAddToCart = (prod) => {
    setPosCart(prev => {
      const existing = prev.find(i => i.id === prod.id);
      if (existing) return prev.map(i => i.id === prod.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: prod.id, name: prod.name, price: parseFloat(prod.price || 500), qty: 1, category: posItemCategory(prod), kind: posItemKind(prod) }];
    });
  }

  const handleUpdateQty = (id, delta) => {
    setPosCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = i.qty + delta;
        return newQty > 0 ? { ...i, qty: newQty } : i;
      }
      return i;
    }));
  }

  const handleRemoveFromCart = (id) => {
    setPosCart(prev => prev.filter(i => i.id !== id));
  }

  const showPosToast = (type, message) => {
    setPosToast({ type, message })
    setTimeout(() => setPosToast(null), 3200)
  }

  const handlePOSCheckout = async () => {
    if (posCart.length === 0) return showPosToast("warning", "Add at least one item before checking out.");
    if (!customerName.trim()) return showPosToast("warning", "Customer name is required.");
    if (fulfillmentMethod === "delivery" && !deliveryAddress.trim()) return showPosToast("warning", "Delivery address is required.");
    if (fulfillmentMethod === "pickup" && pickupMode === "scheduled" && !pickupDate) return showPosToast("warning", "Select a pickup date.");
    
    setPosLoading(true);
    try {
      const isPickup = fulfillmentMethod === "pickup";
      const scheduleValue = isPickup
        ? (pickupMode === "walkin" ? new Date().toISOString() : pickupDate)
        : (deliveryDate || undefined);
      const pickupLabel = isPickup
        ? (pickupMode === "walkin" ? "Walk-in / on-the-spot pickup" : `Scheduled pickup: ${pickupDate}`)
        : "Delivery";
      const payload = {
        items: posCart.map(i => ({ id: i.id, qty: i.qty })),
        customer_name: customerName,
        customer_phone: customerPhone.replace(/\s/g, ""),
        fulfillment_method: fulfillmentMethod,
        delivery_address: fulfillmentMethod === "delivery" ? deliveryAddress : "PICKUP",
        delivery_notes: `[BRANCH:${posBranch}] POS Transaction | ${pickupLabel}`,
        scheduled_at: scheduleValue,
        recipient_name: recipientName || customerName,
        payment_method: posPayMethod,
        payment_reference: posPayMethod === "cash" ? "CASH-WALK-IN" : "PAYMONGO-PENDING", 
        branch_name: posBranch
      };

      let responseData;
      if (api.createOrder) {
        responseData = await api.createOrder(payload);
      } else if (api.post) {
        const res = await api.post("/orders/", payload);
        responseData = res.data || res;
      } else {
        responseData = await api.request({ method: "POST", url: "/orders/", data: payload });
      }

      if (posPayMethod !== "cash" && responseData && responseData.checkout_url) {
        window.location.href = responseData.checkout_url;
        return; 
      }

      setPosSuccess(true);
      fetchOrders();
      setTimeout(() => {
        setPosCart([]);
        setPosRef("");
        setCustomerName("");
        setCustomerPhone("");
        setDeliveryAddress("");
        setDeliveryDate("");
        setPickupMode("walkin");
        setPickupDate("");
        setRecipientName("");
        setPosSuccess(false);
        setPosOpen(false);
      }, 1500);
    } catch (err) {
      showPosToast("error", err.message || "Checkout failed. Please try again.");
    } finally {
      setPosLoading(false);
    }
  }

  const handlePrint = () => window.print()
  const printDate   = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
  const printTime   = new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })


  const statusCounts = filtered.reduce((m, o) => {
    const k = formatStatus(o.status)
    m[k] = (m[k] || 0) + 1
    return m
  }, {})
  const knownTotal  = PRINT_STATUS_META.reduce((s, d) => s + (statusCounts[d.key] || 0), 0)
  const otherCount  = Math.max(0, filtered.length - knownTotal)
  const pct = n => (filtered.length ? (n / filtered.length) * 100 : 0)

  const deliveredCount  = statusCounts["Delivered"] || 0
  const cancelledCount  = statusCounts["Cancelled"] || 0
  const openOrders      = (statusCounts["Pending"] || 0) + (statusCounts["Confirmed"] || 0) + (statusCounts["Preparing"] || 0) + (statusCounts["Ready for Pickup"] || 0) + (statusCounts["Out for Delivery"] || 0)
  const filteredValue   = filtered.reduce((s, o) => s + (parseFloat(o.total_amount || 0) || 0), 0)
  const salesValue      = filtered.filter(o => formatStatus(o.status) !== "Cancelled")
    .reduce((s, o) => s + (parseFloat(o.total_amount || 0) || 0), 0)

  const printGroups = (() => {
    const map = new Map()
    filtered.forEach(o => {
      const k = formatStatus(o.status)
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(o)
    })
    const orderOf = k => {
      const i = PRINT_STATUS_META.findIndex(d => d.key === k)
      return i === -1 ? 99 : i
    }
    return Array.from(map.entries())
      .sort((a, b) => orderOf(a[0]) - orderOf(b[0]) || a[0].localeCompare(b[0]))
      .map(([key, items]) => ({
        label: PRINT_STATUS_META.find(d => d.key === key)?.label || key,
        items,
        value: items.reduce((s, o) => s + (parseFloat(o.total_amount || 0) || 0), 0),
      }))
  })()

  const printScope = [
    statusFilter !== "All" ? `Status: ${statusFilter}` : "All Statuses",
    branch !== "All Branches" ? `Branch: ${branch}` : "All Branches",
    dateRange !== "All Time" ? `Period: ${dateRange}` : "All Time",
    search ? `Search: "${search}"` : null,
    `${filtered.length} order${filtered.length === 1 ? "" : "s"}`,
  ].filter(Boolean).join("   ·   ")

  const payPill = p => {
    const v = (p || "pending").toLowerCase()
    if (["paid", "completed", "success", "successful"].includes(v)) return "active"
    if (["pending", "processing", "unpaid"].includes(v)) return "low"
    if (["failed", "refunded", "declined", "cancelled"].includes(v)) return "out"
    return "neutral"
  }

  const handleCSV = () => {
    const headers = ["Order ID", "Customer", "Email", "Payment Status", "Status", "Total (₱)", "Date", "Branch"]
    const rows = filtered.map(o => [
      o.order_number || "—", o.customer_name || "—", o.customer_email || "—",
      o.payment_status || "—", formatStatus(o.status),
      o.total_amount || 0,
      o.created_at ? new Date(o.created_at).toLocaleDateString("en-PH") : "—",
      o.branch || "—",
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `orders_${new Date().toISOString().slice(0,10)}.csv`
    })
    a.click(); URL.revokeObjectURL(a.href)
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-sm font-medium" style={{ color: subTxt }}>Your total orders</p>
          <span className="text-4xl font-bold" style={{ color: isDark ? "#4ade80" : DG }}>—</span>
        </div>
        <FlowerLoader message="Loading orders..." isDark={isDark} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <style>{`
        .print-only { display: none; }
        @media print {
          @page { size: A4 portrait; margin: 12mm 10mm; }
          html, body { background: #ffffff !important; }
          body * { visibility: hidden !important; }
          #orders-print-area, #orders-print-area * { visibility: visible !important; }
          #orders-print-area { position: absolute; top: 0; left: 0; width: 100%; font-family: "Helvetica Neue", Arial, sans-serif; color: #1f2937; box-sizing: border-box; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .op-letterhead, .op-doc-title, .op-summary { break-inside: avoid; page-break-inside: avoid; }
          .op-letterhead { display: flex !important; align-items: center; justify-content: space-between; gap: 18px; min-height: 62px; padding: 12px 18px; border-radius: 12px; background: linear-gradient(135deg,#0C573E 0%,#15724B 55%,#2E8B34 100%) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .op-logo-word { height: 32px; width: auto; max-width: 260px; display: block; object-fit: contain; filter: brightness(0) invert(1); }
          .op-tagline { margin: 5px 0 0; font-size: 8px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(255,255,255,0.82) !important; }
          .op-meta { text-align: right; flex-shrink: 0; }
          .op-meta .ref { display: inline-block; margin: 0; padding: 3px 10px; border-radius: 9999px; border: 1px solid rgba(255,255,255,0.35); background: rgba(255,255,255,0.12) !important; color: #fff !important; font-size: 8.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .op-meta .gen { margin: 6px 0 0; font-size: 9px; color: rgba(255,255,255,0.85) !important; }
          .op-meta .gen strong { color: #fff !important; font-weight: 700; }
          .op-doc-title { display: flex !important; flex-direction: column; align-items: center; margin: 16px 0 2px; }
          .op-doc-title .t { margin: 0; font-size: 15px; font-weight: 800; letter-spacing: 0.3em; text-transform: uppercase; color: #0C573E !important; }
          .op-doc-title .rule { width: 54px; height: 3px; border-radius: 9999px; margin: 7px 0 6px; background: linear-gradient(90deg,#0C573E,#2E8B34) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .op-doc-title .scope { margin: 0; font-size: 9px; color: #6b7280 !important; text-align: center; }
          .op-summary { display: grid !important; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 14px 0 0; }
          .op-card { min-width: 0; border: 1px solid #e5e7eb; border-top-width: 3px; border-radius: 9px; padding: 9px 12px 10px; background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .op-card.c-total { border-top-color: #0C573E !important; }
          .op-card.c-sales { border-top-color: #2E8B34 !important; }
          .op-card.c-open  { border-top-color: #d97706 !important; }
          .op-card.c-cancel{ border-top-color: #dc2626 !important; }
          .op-card .label { margin: 0; font-size: 8.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af !important; }
          .op-card .value { margin: 3px 0 0; font-size: 19px; font-weight: 800; color: #111827 !important; }
          .op-card .value.green { color: #16a34a !important; }
          .op-card .value.amber { color: #d97706 !important; }
          .op-card .value.red { color: #dc2626 !important; }
          .op-card .cap { margin: 3px 0 0; font-size: 8px; color: #9ca3af !important; }
          .op-detail { display: block !important; margin-top: 6px; }
          .op-section-head { display: flex; align-items: baseline; justify-content: space-between; margin: 14px 0 7px; padding: 0 2px; }
          .op-section-title { margin: 0; font-size: 10.5px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #0C573E !important; }
          .op-section-sub { margin: 0; font-size: 8.5px; color: #9ca3af !important; }
          .op-detail .twrap { border: 1px solid #dbe3df; border-radius: 10px; overflow: hidden; }
          .op-detail table { width: 100%; max-width: 100%; border-collapse: collapse; table-layout: fixed; }
          .op-detail thead { display: table-header-group; }
          .op-detail tr { page-break-inside: avoid; }
          .op-detail th { background: #0C573E !important; color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; border: none; padding: 7px 6px; text-align: left; font-size: 8.3px; font-weight: 700; text-transform: uppercase; line-height: 1.25; }
          .op-detail th.c-idx { width: 6%; } .op-detail th.c-id { width: 18%; } .op-detail th.c-cust { width: 30%; } .op-detail th.c-pay { width: 13%; } .op-detail th.c-date { width: 16%; } .op-detail th.c-total { width: 17%; }
          .op-detail td { border-bottom: 1px solid #eef1f4; padding: 6px; font-size: 9px; color: #1f2937 !important; vertical-align: top; overflow-wrap: anywhere; }
          .op-detail .num { text-align: right; }
          .op-detail .muted { color: #6b7280 !important; }
          .op-detail .strong { font-weight: 700; color: #0f172a !important; }
          .op-detail tr.alt td { background: #f7faf8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .op-detail tbody tr:last-child td { border-bottom: none; }
        }
        @keyframes ordersRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .orders-rise { animation: ordersRise 0.85s ease-out both; }

        @keyframes posSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .pos-drawer { animation: posSlideIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes posSlideOut {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
        .pos-drawer-out { animation: posSlideOut 0.28s cubic-bezier(0.4, 0, 1, 1) forwards; }
        @keyframes posBackdropIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes posBackdropOut { from { opacity: 1; } to { opacity: 0; } }
        .pos-backdrop-in { animation: posBackdropIn 0.28s ease both; }
        .pos-backdrop-out { animation: posBackdropOut 0.28s ease both; }
        @keyframes posSpin { to { transform: rotate(360deg); } }

        @keyframes posItemIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        .pos-item-in { animation: posItemIn 0.25s ease-out both; }

        @keyframes posToastIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
        .pos-toast-in { animation: posToastIn 0.22s ease-out both; }

        @keyframes posFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .pos-success-in { animation: posFadeIn 0.2s ease-out both; }

        @keyframes posSuccessPop { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } }
        .pos-success-circle { animation: posSuccessPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── Image Preview Modal ── */}
      {imagePreview && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 no-print"
          style={{ backgroundColor: "rgba(2,6,23,0.86)", backdropFilter: "blur(6px)" }}
          onClick={e => { if (e.target === e.currentTarget) setImagePreview(null) }}>
          <div className="w-full flex flex-col gap-3" style={{ maxWidth: "min(920px, 96vw)" }}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold truncate" style={{ color: "#e5e7eb" }}>{imagePreview.title}</p>
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105"
                style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "white", border: "1px solid rgba(255,255,255,0.18)" }}
                aria-label="Close image preview">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="rounded-xl overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: "#020617", border: "1px solid rgba(255,255,255,0.16)", maxHeight: "82vh" }}>
              <img
                src={imagePreview.src || ImageNotFound}
                alt={imagePreview.title || "Order image preview"}
                className="w-full h-full object-contain"
                style={{ maxHeight: "82vh" }}
                onError={e => { e.currentTarget.src = ImageNotFound }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Order Detail Modal ── */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 no-print"
          style={{ backgroundColor: modalD.overlayBg, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setViewingOrder(null) }}>
          <div className="rounded-xl w-full overflow-hidden flex flex-col"
            style={{ maxWidth: "560px", maxHeight: "90vh", boxShadow: "0 24px 64px rgba(0,0,0,0.5)", border: `1px solid ${modalD.modalBdr}`, backgroundColor: modalD.modalBg }}>
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: `1px solid ${modalD.modalHdrBdr}`, background: modalD.modalHdr }}>
              <div>
                <p className="text-base font-bold" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>Order Details</p>
                <p className="text-sm mt-0.5 font-mono" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>#{viewingOrder.order_number}</p>
              </div>
              <button onClick={() => setViewingOrder(null)} className="p-2 rounded-lg transition-all" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 space-y-6 overflow-y-auto">

              {/* Loading indicator while fetching full order */}
              {viewingOrderLoading && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: isDark ? "rgba(74,222,128,0.08)" : "#f0fdf4", color: isDark ? "#4ade80" : DG }}>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Loading full order details…
                </div>
              )}

              <div className="rounded-xl overflow-hidden border" style={{ borderColor: isDark ? "#334155" : "#e2e8f0", backgroundColor: isDark ? "#0f172a" : "#f8fafc" }}>
                <button
                  type="button"
                  onClick={() => openImagePreview(viewingOrder.image_url || ImageNotFound, viewingOrder.product_name)}
                  className="relative block w-full group cursor-zoom-in"
                  title="View larger image"
                  aria-label="View order image larger">
                <img
                  src={viewingOrder.image_url || ImageNotFound}
                  alt={viewingOrder.product_name || "Order image"}
                  className="w-full object-cover"
                  style={{ height: "220px" }}
                  onError={e => { e.currentTarget.src = ImageNotFound }}
                />
                  <span className="absolute right-3 bottom-3 px-2.5 py-1 rounded-md text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: "rgba(15,23,42,0.82)", color: "white" }}>
                    Click to zoom
                  </span>
                </button>
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold truncate" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>
                    {viewingOrder.product_name}
                  </p>
                  <p className="text-sm font-bold whitespace-nowrap" style={{ color: isDark ? "#4ade80" : DG }}>
                    ₱{Number(viewingOrder.total_amount || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl" style={{ backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: subTxt }}>Customer Profile</p>
                <div className="space-y-1">
                  <p className="text-sm font-bold" style={{ color: isDark ? "#f8fafc" : "#0f172a" }}>{viewingOrder.customer_name}</p>
                  <p className="text-xs" style={{ color: subTxt }}>Email: {viewingOrder.customer_email}</p>
                  <p className="text-xs" style={{ color: subTxt }}>Phone: {viewingOrder.customer_phone || "Not provided"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: subTxt }}>Order Information</p>
                
                <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: isDark ? "#334155" : "#e2e8f0" }}>
                  <p className="text-sm" style={{ color: isDark ? "#e2e8f0" : "#334155" }}>{viewingOrder.product_name}</p>
                  <p className="text-sm font-semibold" style={{ color: isDark ? "#4ade80" : DG }}>₱{viewingOrder.total_amount.toLocaleString()}</p>
                </div>

                {Array.isArray(viewingOrder.items) && viewingOrder.items.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: subTxt }}>Items & Card Notes</p>
                    <div className="space-y-2">
                      {viewingOrder.items.map((item, index) => {
                        
                        // 🚀 NEW: Aggressive JSON Extraction
                        let parsedCD = null;
                        try { parsedCD = typeof item.customization_data === 'string' ? JSON.parse(item.customization_data) : item.customization_data; } catch(e){}
                        
                        let parsedPB = null;
                        try { parsedPB = typeof item.price_breakdown === 'string' ? JSON.parse(item.price_breakdown) : item.price_breakdown; } catch(e){}

                        // Try to find the array of materials in every possible location
                        let matArray = [];
                        if (Array.isArray(item.materials) && item.materials.length > 0) matArray = item.materials;
                        else if (Array.isArray(parsedPB?.items)) matArray = parsedPB.items;
                        else if (Array.isArray(parsedPB?.materials)) matArray = parsedPB.materials;
                        else if (Array.isArray(parsedCD?.price_breakdown?.items)) matArray = parsedCD.price_breakdown.items;
                        else if (Array.isArray(parsedCD?.materials)) matArray = parsedCD.materials;
                        else if (Array.isArray(parsedCD?.items)) matArray = parsedCD.items;

                        const aiTotal = parsedPB?.total_price || parsedCD?.price_breakdown?.total_price || 0;
                        const isAI = !!(item.is_custom || parsedCD || item.arrangement_prompt);

                        // 🚀 PROMPT SANITIZER: Extract just the user intent
                        let cleanRequest = "";
                        const rawPrompt = item.arrangement_description || item.arrangement_prompt || "";
                        if (rawPrompt.includes('Customer Request:')) {
                          const match = rawPrompt.match(/Customer Request:\s*"([^"]+)"/);
                          if (match && match[1]) cleanRequest = match[1];
                        } else if (rawPrompt) {
                          cleanRequest = rawPrompt.split(/If the request is vague|Strict inventory rules/i)[0].replace(/['"]/g, '').trim();
                        }

                        return (
                          <div key={item.id || index} className="p-3 rounded-lg border"
                            style={{ borderColor: isDark ? "#334155" : "#e2e8f0", background: isDark ? "#0f172a" : "#f8fafc" }}>
                            <div className="flex items-center justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => openImagePreview(item.image_url || viewingOrder.image_url || ImageNotFound, item.product_name)}
                                className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 cursor-zoom-in transition-transform hover:scale-[1.03]"
                                title="View larger image"
                                aria-label={`View ${item.product_name || "order item"} image larger`}
                                style={{ border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`, backgroundColor: isDark ? "#111827" : "white" }}>
                                <img
                                  src={item.image_url || viewingOrder.image_url || ImageNotFound}
                                  alt={item.product_name || "Order item"}
                                  className="w-full h-full object-cover"
                                  onError={e => { e.currentTarget.src = ImageNotFound }}
                                />
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>{item.product_name}</p>
                                {isAI && (
                                  <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold"
                                    style={{ backgroundColor: isDark ? "rgba(168,85,247,0.15)" : "#faf5ff", color: isDark ? "#c084fc" : "#7e22ce" }}>
                                    ✦ AI Customized
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-semibold flex-shrink-0" style={{ color: subTxt }}>x{item.quantity}</p>
                            </div>
                            
                            <div className="mt-1 flex items-center justify-between gap-3 text-xs" style={{ color: subTxt }}>
                              <span>Unit: ₱{Number(item.unit_price || 0).toLocaleString()}</span>
                              <span className="font-semibold">Line: ₱{Number(item.line_total || 0).toLocaleString()}</span>
                            </div>
                            
                            {/* SANITIZED CUSTOMER REQUEST */}
                            {cleanRequest && (
                              <div className="mt-2 mb-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: subTxt }}>Customer Request</p>
                                <p className="text-xs italic" style={{ color: isDark ? "#cbd5e1" : "#475569" }}>"{cleanRequest}"</p>
                              </div>
                            )}

                            {/* COST BREAKDOWN AND RECIPE BLOCK */}
                            {matArray.length > 0 ? (
                              <div className="mt-2 p-3 rounded-md" style={{ background: isDark ? (isAI ? "rgba(168,85,247,0.08)" : "#111827") : (isAI ? "#faf5ff" : "white"), border: `1px solid ${isDark ? (isAI ? "rgba(168,85,247,0.25)" : "#334155") : (isAI ? "#e9d5ff" : "#e2e8f0")}` }}>
                                <div className="flex items-center justify-between mb-2 pb-2 border-b" style={{ borderColor: isDark ? (isAI ? "rgba(168,85,247,0.15)" : "#1e293b") : (isAI ? "#e9d5ff" : "#f1f5f9") }}>
                                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isAI ? (isDark ? "#c084fc" : "#7e22ce") : subTxt }}>
                                    {isAI ? "✦ AI Custom Breakdown & Materials" : "Recipe / Materials Needed"}
                                  </p>
                                  {aiTotal > 0 && (
                                    <p className="text-[10px] font-bold" style={{ color: isDark ? "#4ade80" : DG }}>
                                      TOTAL: ₱{Number(aiTotal).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  {matArray.map((mat, mIdx) => {
                                    const mName = mat.product_name || mat.name || "Unknown Material";
                                    const mQty = mat.quantity || 1;
                                    const mSub = mat.subtotal;
                                    return (
                                      <div key={mIdx} className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                          <p className="text-xs font-semibold truncate" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>{mName}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                          <p className="text-xs font-bold" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>x{Number(mQty).toLocaleString()}</p>
                                          {mSub !== undefined && (
                                            <p className="text-[10px] font-bold mt-0.5" style={{ color: isDark ? "#4ade80" : DG }}>₱{Number(mSub).toLocaleString()}</p>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            ) : (
                              isAI && (
                                <div className="mt-2 p-3 rounded-md border" style={{ borderColor: isDark ? "#334155" : "#e2e8f0", background: isDark ? "#111827" : "#f8fafc" }}>
                                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: subTxt }}>AI Custom Arrangement</p>
                                  <p className="text-xs italic" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>No specific material breakdown saved for this order.</p>
                                </div>
                              )
                            )}

                            {item.card_message && (
                              <div className="mt-2 p-2.5 rounded-md"
                                style={{ background: isDark ? "rgba(74,222,128,0.1)" : "#f0fdf4", border: `1px solid ${isDark ? "rgba(74,222,128,0.25)" : "#bbf7d0"}` }}>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: isDark ? "#86efac" : DG }}>
                                  {String(item.card_message).toLowerCase().includes("mass card") ? "Mass Card Context" : "Greeting Card"}
                                </p>
                                <p className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: isDark ? "#d1fae5" : "#14532d" }}>
                                  {item.card_message}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: subTxt }}>Delivery To</p>
                  <p className="text-sm font-medium" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>{viewingOrder.delivery_address}</p>
                </div>

                <div className="flex gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: subTxt }}>Payment</p>
                    <StatusBadge status={viewingOrder.payment_status || "pending"} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: subTxt }}>Status</p>
                    <StatusBadge status={formatStatus(viewingOrder.status)} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t flex flex-col gap-2" style={{ borderColor: modalD.modalFtrBdr, backgroundColor: modalD.modalFtr }}>
              <button onClick={() => setViewingOrder(null)}
                className="w-full py-2 text-sm font-semibold border rounded-lg transition-all"
                style={{ borderColor: modalD.modalBdr, color: isDark ? "#94a3b8" : "#64748b", backgroundColor: modalD.modalBg }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 WALK-IN POS DRAWER */}
      {posOpen && (
        <div className={`fixed inset-0 z-[60] flex justify-end no-print ${posClosing ? "pos-backdrop-out" : "pos-backdrop-in"}`} style={{ backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(2px)" }}>
          <div className="absolute inset-0" onClick={closePos} />

          <div className={`relative flex flex-col h-full shadow-2xl ml-auto ${posClosing ? "pos-drawer-out" : "pos-drawer"}`}
            style={{ width: `${posWidth}px`, maxWidth: '100%', backgroundColor: isDark ? "#0f172a" : "#f8fafc", borderLeft: `1px solid ${isDark ? "#334155" : "#e2e8f0"}` }}>
            
            {/* 🚀 NEW: Resizer Handle */}
            <div 
              onMouseDown={startResizing} 
              className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize z-[70] flex flex-col justify-center items-center hover:bg-green-500/10 group transition-colors"
            >
              <div className="h-16 w-1 bg-gray-300 dark:bg-gray-600 rounded-full group-hover:bg-green-500" />
            </div>

            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b pl-8"
              style={{ backgroundColor: isDark ? "#1e293b" : "white", borderColor: isDark ? "#334155" : "#e2e8f0" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: isDark ? "#f8fafc" : "#0f172a" }}>Walk-In POS</h2>
                  <p className="text-xs" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Quick inventory checkout</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {posCart.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                    style={{ backgroundColor: isDark ? "rgba(74,222,128,0.12)" : "#f0fdf4", color: isDark ? "#4ade80" : DG, border: `1px solid ${isDark ? "rgba(74,222,128,0.25)" : "#bbf7d0"}` }}>
                    ₱{posCart.reduce((sum, i) => sum + (i.price * i.qty), 0).toLocaleString()}
                  </div>
                )}
                <button onClick={closePos} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                  <svg className="w-5 h-5" style={{ color: isDark ? "#94a3b8" : "#64748b" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden pl-3">
              
              <div className="flex-1 flex flex-col border-r min-w-0" style={{ borderColor: isDark ? "#334155" : "#e2e8f0", backgroundColor: isDark ? "#0f172a" : "#f1f5f9" }}>
                
                {/* Search & Branch Bar */}
                <div className="p-4 flex gap-3 flex-shrink-0 bg-white dark:bg-slate-800" style={{ borderBottom: `1px solid ${isDark ? "#1e293b" : "#eef1f4"}` }}>
                  <div className="relative flex-1">
                    <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" placeholder="Search products..." value={posSearch} onChange={e => setPosSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 bg-gray-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white" />
                  </div>
                  <select value={posBranch} onChange={e => setPosBranch(e.target.value)}
                    className="px-3 py-2 text-sm font-semibold border border-slate-200 rounded-lg bg-gray-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white outline-none">
                    <option value="Manila">Manila Branch</option>
                    <option value="Pampanga">Pampanga Branch</option>
                  </select>
                </div>

                {/* Categories Scroll Bar */}
                <div className="px-4 py-3 bg-white dark:bg-slate-800 overflow-x-auto whitespace-nowrap flex gap-2 no-scrollbar flex-shrink-0" style={{ borderBottom: `1px solid ${isDark ? "#1e293b" : "#eef1f4"}` }}>
                  {posCategories.map(c => (
                    <button key={c} onClick={() => setPosCategory(c)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all border ${
                        posCategory === c 
                          ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-500 dark:text-green-400" 
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-300"
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                  {posCatalogLoading && posProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-20">
                      <span style={{ width: 34, height: 34, borderRadius: "9999px", border: `3px solid ${isDark ? "#22324a" : "#e2e8f0"}`, borderTopColor: G, display: "inline-block", animation: "posSpin 0.7s linear infinite" }} />
                      <p className="text-sm font-medium" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Loading products…</p>
                    </div>
                  ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredPosProducts.map(p => {
                      const inCartQty = posCart.find(i => i.id === p.id)?.qty || 0
                      const itemCategory = posItemCategory(p)
                      const itemKind = posItemKind(p)
                      const currentBranchStock = getBranchStock(p)

                      return (
                        <button key={p.id} onClick={() => handleAddToCart(p)}
                          className="relative flex flex-col items-center p-3 rounded-xl border transition-all active:scale-95"
                          style={{
                            borderColor: inCartQty > 0 ? (isDark ? "#4ade80" : G) : (isDark ? "#334155" : "#e2e8f0"),
                            backgroundColor: isDark ? "#1e293b" : "white",
                            boxShadow: inCartQty > 0 ? `0 0 0 2px ${isDark ? "rgba(74,222,128,0.18)" : "rgba(46,139,52,0.12)"}` : "none",
                          }}
                          onMouseEnter={e => { if (!inCartQty) e.currentTarget.style.borderColor = isDark ? "#4ade80" : G }}
                          onMouseLeave={e => { if (!inCartQty) e.currentTarget.style.borderColor = isDark ? "#334155" : "#e2e8f0" }}>
                          {inCartQty > 0 && (
                            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center text-white shadow-md z-10"
                              style={{ background: `linear-gradient(135deg,${DG},${G})` }}>{inCartQty}</span>
                          )}
                          <div className="relative w-full aspect-square rounded-md mb-2 flex items-center justify-center overflow-hidden group"
                            style={{ backgroundColor: isDark ? "#0f172a" : "#f1f5f9" }}>
                            <img src={p.image_url || p.image || ImageNotFound} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <p className="text-xs font-bold text-center leading-tight line-clamp-2 w-full" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>{p.name}</p>
                          <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
                              style={{ backgroundColor: isDark ? "#0f172a" : "#f1f5f9", color: isDark ? "#94a3b8" : "#64748b" }}>
                              {itemCategory}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
                              style={{ backgroundColor: itemKind === "Material" ? (isDark ? "rgba(59,130,246,0.14)" : "#eff6ff") : (isDark ? "rgba(74,222,128,0.14)" : "#f0fdf4"), color: itemKind === "Material" ? (isDark ? "#93c5fd" : "#1d4ed8") : (isDark ? "#4ade80" : DG) }}>
                              {itemKind}
                            </span>
                          </div>
                          <p className="text-[10px] mt-1" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                            Stock: {currentBranchStock}
                          </p>
                          <p className="text-sm font-semibold mt-1" style={{ color: isDark ? "#4ade80" : DG }}>₱{(p.price || 500).toLocaleString()}</p>
                        </button>
                      )
                    })}
                    {filteredPosProducts.length === 0 && <p className="col-span-3 text-center text-sm mt-10 text-gray-500">No items found in this category.</p>}
                  </div>
                  )}
                </div>
              </div>

              {/* Right Column: Cart, Details & Checkout */}
              <div className="w-[380px] flex flex-col flex-shrink-0 relative overflow-hidden" style={{ backgroundColor: isDark ? "#111827" : "white" }}>
                
                {/* Toast and Success layers */}
                {posToast && (
                  <div className="absolute top-3 left-3 right-3 z-20 pos-toast-in">
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-sm font-semibold"
                      style={{
                        backgroundColor: posToast.type === "error" ? "#fef2f2" : posToast.type === "warning" ? "#fffbeb" : "#f0fdf4",
                        color: posToast.type === "error" ? "#b91c1c" : posToast.type === "warning" ? "#b45309" : "#15803d",
                        border: `1px solid ${posToast.type === "error" ? "#fecaca" : posToast.type === "warning" ? "#fde68a" : "#bbf7d0"}`,
                      }}>
                      {posToast.type === "error" ? (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
                      ) : posToast.type === "warning" ? (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                      ) : (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      )}
                      <span className="flex-1">{posToast.message}</span>
                      <button onClick={() => setPosToast(null)} className="opacity-60 hover:opacity-100">×</button>
                    </div>
                  </div>
                )}
                
                {posSuccess && (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pos-success-in"
                    style={{ backgroundColor: isDark ? "rgba(17,24,39,0.97)" : "rgba(255,255,255,0.97)" }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 pos-success-circle"
                      style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.5 12.75l6 6 9-13.5"/></svg>
                    </div>
                    <p className="font-bold text-base" style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>Order placed!</p>
                    <p className="text-xs mt-1" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Walk-in transaction recorded successfully</p>
                  </div>
                )}

                {/* Header */}
                <div className="px-5 py-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: isDark ? "#1e293b" : "#e2e8f0" }}>
                  <h3 className="font-bold text-base" style={{ color: isDark ? "#f8fafc" : "#0f172a" }}>Order Checkout</h3>
                  {posCart.length > 0 && <button onClick={() => setPosCart([])} className="text-xs text-red-400 font-semibold">Clear Cart</button>}
                </div>

                {/* Scroll area: cart items + fulfillment details scroll together */}
                <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-3 space-y-2">
                  {/* Cart items */}
                  {posCart.length === 0 ? (
                     <p className="text-center text-gray-400 text-xs mt-10">Cart is empty</p>
                  ) : (
                     posCart.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg border pos-item-in"
                        style={{ borderColor: isDark ? "#1e293b" : "#eef1f4", backgroundColor: isDark ? "#0f172a" : "#fafbfc" }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>{item.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>₱{item.price.toLocaleString()} each</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button onClick={() => handleUpdateQty(item.id, -1)}
                            className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm transition-all active:scale-90"
                            style={{ backgroundColor: isDark ? "#1e293b" : "white", border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`, color: isDark ? "#94a3b8" : "#64748b" }}>−</button>
                          <span className="text-xs font-bold w-5 text-center" style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>{item.qty}</span>
                          <button onClick={() => handleUpdateQty(item.id, 1)}
                            className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm transition-all active:scale-90"
                            style={{ backgroundColor: isDark ? "#1e293b" : "white", border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`, color: isDark ? "#94a3b8" : "#64748b" }}>+</button>
                        </div>
                        <div className="text-right flex-shrink-0" style={{ minWidth: "64px" }}>
                          <p className="text-xs font-bold" style={{ color: isDark ? "#4ade80" : DG }}>₱{(item.price * item.qty).toLocaleString()}</p>
                        </div>
                        <button onClick={() => handleRemoveFromCart(item.id)}
                          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                          style={{ color: isDark ? "#64748b" : "#cbd5e1" }}
                          onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.backgroundColor = isDark ? "rgba(248,113,113,0.1)" : "#fef2f2" }}
                          onMouseLeave={e => { e.currentTarget.style.color = isDark ? "#64748b" : "#cbd5e1"; e.currentTarget.style.backgroundColor = "transparent" }}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                     ))
                  )}
                </div>

                <div className="p-5 space-y-5 border-t" style={{ borderColor: isDark ? "#1e293b" : "#e2e8f0" }}>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: subTxt }}>Fulfillment Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["delivery", "pickup"].map((m) => (
                        <button key={m} onClick={() => setFulfillmentMethod(m)}
                          className="py-2 text-xs font-bold rounded-lg border transition-all"
                          style={{
                            backgroundColor: fulfillmentMethod === m ? G : "transparent",
                            borderColor: fulfillmentMethod === m ? G : (isDark ? "#334155" : "#e2e8f0"),
                            color: fulfillmentMethod === m ? "#ffffff" : (isDark ? "#94a3b8" : "#64748b"),
                          }}>
                          {m.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: subTxt }}>Customer Info</p>
                    <input placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg outline-none" style={{ borderColor: isDark ? "#334155" : "#e2e8f0", backgroundColor: isDark ? "#1e293b" : "white", color: isDark ? "#e2e8f0" : "#1e293b" }} />
                    <input placeholder="+63 917 123 4567" inputMode="numeric" value={customerPhone} onChange={e => setCustomerPhone(formatPhPhone(e.target.value))}
                      className="w-full px-3 py-2 text-sm border rounded-lg outline-none" style={{ borderColor: isDark ? "#334155" : "#e2e8f0", backgroundColor: isDark ? "#1e293b" : "white", color: isDark ? "#e2e8f0" : "#1e293b" }} />
                  </div>

                  {fulfillmentMethod === "delivery" && (
                    <div className="space-y-3 border-t pt-4" style={{ borderColor: isDark ? "#1e293b" : "#e2e8f0" }}>
                      <input placeholder="Delivery Address" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
                        className="w-full px-3 py-2 text-sm border rounded-lg outline-none" style={{ borderColor: isDark ? "#334155" : "#e2e8f0", backgroundColor: isDark ? "#1e293b" : "white", color: isDark ? "#e2e8f0" : "#1e293b" }} />
                      <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border rounded-lg outline-none" style={{ borderColor: isDark ? "#334155" : "#e2e8f0", backgroundColor: isDark ? "#1e293b" : "white", color: isDark ? "#e2e8f0" : "#1e293b" }} />
                      <input placeholder="Recipient Name" value={recipientName} onChange={e => setRecipientName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border rounded-lg outline-none" style={{ borderColor: isDark ? "#334155" : "#e2e8f0", backgroundColor: isDark ? "#1e293b" : "white", color: isDark ? "#e2e8f0" : "#1e293b" }} />
                    </div>
                  )}

                  {fulfillmentMethod === "pickup" && (
                    <div className="space-y-3 border-t pt-4" style={{ borderColor: isDark ? "#1e293b" : "#e2e8f0" }}>
                      <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: subTxt }}>Pickup Timing</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPickupMode("walkin")}
                          className="py-2.5 px-2 text-xs font-bold rounded-lg border transition-all"
                          style={{
                            backgroundColor: pickupMode === "walkin" ? (isDark ? "rgba(74,222,128,0.12)" : "#f0fdf4") : "transparent",
                            borderColor: pickupMode === "walkin" ? (isDark ? "#4ade80" : G) : (isDark ? "#334155" : "#e2e8f0"),
                            color: pickupMode === "walkin" ? (isDark ? "#4ade80" : DG) : (isDark ? "#94a3b8" : "#64748b"),
                          }}
                        >
                          Walk-in / On the spot
                        </button>
                        <button
                          type="button"
                          onClick={() => setPickupMode("scheduled")}
                          className="py-2.5 px-2 text-xs font-bold rounded-lg border transition-all"
                          style={{
                            backgroundColor: pickupMode === "scheduled" ? (isDark ? "rgba(74,222,128,0.12)" : "#f0fdf4") : "transparent",
                            borderColor: pickupMode === "scheduled" ? (isDark ? "#4ade80" : G) : (isDark ? "#334155" : "#e2e8f0"),
                            color: pickupMode === "scheduled" ? (isDark ? "#4ade80" : DG) : (isDark ? "#94a3b8" : "#64748b"),
                          }}
                        >
                          Schedule Pickup
                        </button>
                      </div>
                      {pickupMode === "scheduled" ? (
                        <input
                          type="date"
                          value={pickupDate}
                          min={new Date().toISOString().slice(0, 10)}
                          onChange={e => setPickupDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
                          style={{ borderColor: isDark ? "#334155" : "#e2e8f0", backgroundColor: isDark ? "#1e293b" : "white", color: isDark ? "#e2e8f0" : "#1e293b" }}
                        />
                      ) : (
                        <p className="text-[11px] leading-relaxed" style={{ color: subTxt }}>
                          Use this for customers taking their order immediately from the store.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                </div>

                {/* Footer (Payment & Submit) — pinned at the bottom */}
                <div className="p-5 border-t bg-gray-50 dark:bg-slate-900 flex-shrink-0" style={{ borderColor: isDark ? "#1e293b" : "#e2e8f0" }}>
                  <div className="flex justify-between items-center mb-4">
                     <span className="text-sm font-semibold text-gray-500">Total Due</span>
                     <span className="text-2xl font-bold text-green-600">₱{posCart.reduce((sum, i) => sum + (i.price * i.qty), 0).toLocaleString()}</span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: subTxt }}>Payment Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setPosPayMethod("cash")}
                        className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-lg border transition-all"
                        style={{
                          backgroundColor: posPayMethod === "cash" ? (isDark ? "rgba(74,222,128,0.12)" : "#f0fdf4") : (isDark ? "#1e293b" : "white"),
                          borderColor: posPayMethod === "cash" ? (isDark ? "#4ade80" : G) : (isDark ? "#334155" : "#e2e8f0"),
                          color: posPayMethod === "cash" ? (isDark ? "#4ade80" : DG) : (isDark ? "#94a3b8" : "#64748b"),
                        }}>
                        Cash
                      </button>
                      <button onClick={() => setPosPayMethod("gcash")}
                        className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-lg border transition-all"
                        style={{
                          backgroundColor: posPayMethod === "gcash" ? (isDark ? "rgba(59,130,246,0.12)" : "#eff6ff") : (isDark ? "#1e293b" : "white"),
                          borderColor: posPayMethod === "gcash" ? "#3b82f6" : (isDark ? "#334155" : "#e2e8f0"),
                          color: posPayMethod === "gcash" ? (isDark ? "#93c5fd" : "#1d4ed8") : (isDark ? "#94a3b8" : "#64748b"),
                        }}>
                        GCash via PayMongo
                      </button>
                    </div>
                    {posPayMethod === "gcash" && (
                      <p className="text-[11px] leading-relaxed mt-2" style={{ color: subTxt }}>
                        Checkout opens a PayMongo payment page. Use this when the walk-in customer wants to pay with GCash.
                      </p>
                    )}
                  </div>

                  <button onClick={handlePOSCheckout} disabled={posLoading || posCart.length === 0}
                    className="w-full py-3.5 rounded-lg text-white font-bold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
                    style={{ background: `linear-gradient(135deg, ${DG}, ${G})`, boxShadow: posCart.length > 0 ? "0 4px 14px rgba(46,139,52,0.3)" : "none" }}>
                    {posLoading ? "Processing..." : posPayMethod === "gcash" ? "Create PayMongo Checkout" : "Complete Cash Checkout"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Heading ── */}
      <div className={`no-print flex items-center justify-between flex-wrap gap-3 ${entered ? "" : "orders-rise"}`}>
        <div>
          <p className="text-sm font-medium" style={{ color: subTxt }}>Your total orders</p>
          <div className="flex items-baseline gap-3 mt-0.5">
            <span className="text-4xl font-bold" style={{ color: isDark ? "#4ade80" : DG }}>{orders.length}</span>
            <span className="text-sm font-semibold text-green-500">↑ 0% vs last week</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportCSVBtn onClick={handleCSV} isDark={isDark} />
          <PrintBtn onClick={handlePrint} isDark={isDark} />
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 no-print ${entered ? "" : "orders-rise"}`} style={{ animationDelay: "0.18s" }}>
        {STAT_CARDS.map(c => (
          <button key={c.key} onClick={() => setStatus(statusFilter === c.key ? "All" : c.key)}
            className="rounded-xl p-4 sm:p-5 text-left transition-all duration-200 hover:scale-[1.03]"
            style={{
              background: c.green ? "linear-gradient(135deg,#0a4a34 0%,#1a7040 60%,#2E8B34 100%)" : isDark ? "#1a2332" : "white",
              border: c.green ? "none" : statusFilter === c.key ? `2px solid ${isDark ? "#4ade80" : DG}` : `1px solid ${isDark ? "#2d3748" : "#e8edf2"}`,
              boxShadow: c.green ? "0 4px 16px rgba(12,87,62,0.25)" : statusFilter === c.key ? `0 0 0 3px rgba(74,222,128,0.15)` : isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
            }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: c.green ? "rgba(255,255,255,0.65)" : c.red ? "#f87171" : isDark ? "#64748b" : "#94a3b8" }}>{c.label}</p>
            <p className="text-xs mb-2"
              style={{ color: c.green ? "rgba(255,255,255,0.5)" : c.red ? "#f87171" : isDark ? "#64748b" : "#94a3b8" }}>{c.sub}</p>
            <p className="text-3xl font-bold"
              style={{ color: c.green ? "white" : c.red ? "#f87171" : isDark ? "#4ade80" : DG }}>{counts[c.key]}</p>
          </button>
        ))}
      </div>

      <div className={`no-print rounded-xl overflow-hidden ${entered ? "" : "orders-rise"}`}
        style={{ border: `1px solid ${isDark ? "#1e293b" : "#e8edf2"}`, backgroundColor: isDark ? "#1a2332" : "white", boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)", animationDelay: "0.36s" }}>
        
        {/* Toolbar */}
        <div className="p-3 sm:p-4" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
          <div className="flex items-center gap-2 flex-wrap">
            <SelectFilter value={statusFilter} onChange={setStatus} options={ORDER_STATUSES} minWidth="140px" isDark={isDark} />
            <SelectFilter value={branch}       onChange={setBranch}  options={BRANCHES}       minWidth="130px" isDark={isDark} />
            <SelectFilter value={dateRange}    onChange={setDateRange} options={DATE_RANGES}  minWidth="130px" isDark={isDark} />
            <div className="relative flex-1" style={{ minWidth: "180px" }}>
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isDark ? "#64748b" : "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={search ? "" : `${phText}|`}
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-md outline-none transition-all"
                style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(74,222,128,0.18)` }}
                onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none" }} />
            </div>
            
            <button onClick={fetchOrders}
              className="px-4 py-2 text-sm font-semibold rounded-md transition-all active:scale-95"
              style={{ border: `1px solid ${inputBdr}`, backgroundColor: inputBg, color: inputTxt }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#2d3f55" : "#f9fafb"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = inputBg}>
              Refresh
            </button>
            <button onClick={() => setPosOpen(true)} className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-all hover:opacity-90 active:scale-95 flex items-center gap-1.5"
              style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
              Walk-In POS
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "700px" }}>
            <thead style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
              <tr>
                {["Order ID", "Customer", "Payment Status", "Status", "Total", "Order Date", "Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ color: isDark ? "#64748b" : "#94a3b8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ borderTop: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}` }}>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: subTxt }}>Loading orders...</td></tr>
              ) : paginatedOrders.length > 0 ? paginatedOrders.map((o, idx) => (
                <tr key={o.id}
                  style={{ borderBottom: `1px solid ${isDark ? "#1e293b" : "#f8fafc"}`, backgroundColor: isDark ? (idx % 2 === 0 ? "#1a2332" : "#111827") : "white" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(74,222,128,0.04)" : "#f8fffe"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? (idx % 2 === 0 ? "#1a2332" : "#111827") : "white"}>
                  <td className="px-4 py-3"><span className="font-mono text-xs" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>{o.order_number}</span></td>
                  <td className="px-4 py-3">
                    <span className="font-medium block" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>{o.customer_name || "—"}</span>
                    <span className="text-xs" style={{ color: subTxt }}>{o.customer_email || "—"}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={o.payment_status || "pending"} /></td>
                  <td className="px-4 py-3"><StatusBadge status={formatStatus(o.status)} /></td>
                  <td className="px-4 py-3"><span className="font-semibold" style={{ color: isDark ? "#4ade80" : DG }}>₱{(o.total_amount || 0).toLocaleString()}</span></td>
                  <td className="px-4 py-3"><span style={{ color: subTxt }}>{o.created_at ? new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span></td>
                  <td className="px-4 py-3 no-print">
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 text-xs font-semibold rounded-md border transition-all hover:shadow-sm active:scale-95"
                        style={{ backgroundColor: isDark ? "rgba(74,222,128,0.1)" : "#f0fdf4", borderColor: isDark ? "rgba(74,222,128,0.3)" : "#bbf7d0", color: isDark ? "#4ade80" : DG }}
                        onClick={() => openOrderDetail(o)}>View</button>
                      <select value={statusToApi(o.status)}
                        onChange={async e => {
                          const nextKey = e.target.value;
                          try {
                            await api.updateAdminOrderStatus(o.id, nextKey);
                            await fetchOrders(); 
                          } catch (err) {
                            console.error("Update error:", err);
                            setError(err?.message || "Failed to update status");
                          }
                        }}
                        className="text-xs font-semibold border rounded-md px-2 py-1 outline-none"
                        style={{ borderColor: isDark ? "#374151" : "#e2e8f0", color: isDark ? "#e2e8f0" : "#0f172a", backgroundColor: isDark ? "#1e293b" : "white" }}>
                        {!MANUAL_ORDER_STATUSES.some(status => status.value === statusToApi(o.status)) && (
                          <option value={statusToApi(o.status)}>{formatStatus(o.status)}</option>
                        )}
                        {MANUAL_ORDER_STATUSES.map(status => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color: subTxt }}>No orders match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 sm:px-5 py-3" style={{ borderTop: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
          <span className="text-sm" style={{ color: subTxt }}>Showing {paginatedOrders.length} of {filtered.length} entries</span>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all disabled:opacity-50"
              style={{ background: isDark ? "#1e293b" : "white", color: isDark ? "#94a3b8" : "#6b7280", border: `1px solid ${isDark ? "#374151" : "#e2e8f0"}` }}>←</button>
            <span className="px-2 text-sm font-semibold" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>{page}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all disabled:opacity-50"
              style={{ background: isDark ? "#1e293b" : "white", color: isDark ? "#94a3b8" : "#6b7280", border: `1px solid ${isDark ? "#374151" : "#e2e8f0"}` }}>→</button>
          </div>
        </div>
      </div>

      {/* ── Printable report ── */}
      <div id="orders-print-area">
        <div className="print-only op-letterhead">
          <div>
            <img className="op-logo-word" src={estingsWordmark} alt="Esting's Flower International Inc." />
            <p className="op-tagline">Flower International Inc.</p>
          </div>
          <div className="op-meta">
            <p className="ref">Ref: ORD-{new Date().toISOString().slice(0, 10).replace(/-/g, "")}</p>
            <p className="gen">Generated <strong>{printDate}</strong> at <strong>{printTime}</strong></p>
          </div>
        </div>

        <div className="print-only op-doc-title">
          <p className="t">Orders Report</p>
          <span className="rule" />
          <p className="scope">{printScope}</p>
        </div>

        <div className="print-only op-summary">
          <div className="op-card c-total">
            <p className="label">Total Orders</p>
            <p className="value">{filtered.length}</p>
            <p className="cap">{printGroups.length} status group{printGroups.length === 1 ? "" : "s"}</p>
          </div>
          <div className="op-card c-sales">
            <p className="label">Sales Value</p>
            <p className="value green">₱{salesValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="cap">Excludes cancelled</p>
          </div>
          <div className="op-card c-open">
            <p className="label">Open Orders</p>
            <p className="value amber">{openOrders}</p>
            <p className="cap">Pending → out for delivery</p>
          </div>
          <div className="op-card c-cancel">
            <p className="label">Cancelled</p>
            <p className="value red">{cancelledCount}</p>
            <p className="cap">{deliveredCount} delivered</p>
          </div>
        </div>

        <div className="print-only op-detail">
          {printGroups.map(group => (
            <div key={group.label}>
              <div className="op-section-head">
                <p className="op-section-title">{group.label}</p>
                <p className="op-section-sub">{group.items.length} order{group.items.length === 1 ? "" : "s"} · ₱{group.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="twrap">
                <table>
                  <thead>
                    <tr>
                      <th className="c-idx">#</th>
                      <th className="c-id">Order ID</th>
                      <th className="c-cust">Customer</th>
                      <th className="c-pay">Payment</th>
                      <th className="c-date">Order Date</th>
                      <th className="c-total num">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((o, i) => (
                      <tr key={o.id} className={i % 2 ? "alt" : ""}>
                        <td className="muted">{i + 1}</td>
                        <td className="strong">{o.order_number}</td>
                        <td>{o.customer_name || "—"}{o.customer_email ? <><br /><span className="muted">{o.customer_email}</span></> : null}</td>
                        <td>{o.payment_status || "pending"}</td>
                        <td className="muted">{o.created_at ? new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}</td>
                        <td className="num strong">₱{(o.total_amount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
