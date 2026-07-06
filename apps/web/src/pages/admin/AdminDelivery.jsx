import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { DG, G, ADMIN_PAGE_SIZE, GreenCard, WhiteCard } from "./_adminShared";
import estingsWordmark from "../../assets/Estings.svg";
import { api } from "../../services/api";

const SEARCH_SAMPLES = ["Juan Dela Cruz", "Mark Reyes", "Angelo Cruz", "Paolo Ramos"];
const BRANCHES = ["Pampanga"];

function FlowerLoader({ message = "Loading...", isDark = false }) {
  const petals = [
    { angle: 0, color: "#f48fb1" },
    { angle: 60, color: "#ec407a" },
    { angle: 120, color: "#e91e63" },
    { angle: 180, color: "#f06292" },
    { angle: 240, color: "#c2185b" },
    { angle: 300, color: "#f48fb1" },
  ];

  return (
    <>
      <style>{`
        @keyframes adminPetalBloom {
          0%, 100% { opacity: 0.2; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div
        className="flex flex-col items-center justify-center rounded-2xl"
        style={{ minHeight: "60vh", backgroundColor: isDark ? "#0f172a" : "transparent" }}
      >
        <svg width="120" height="120" viewBox="0 0 100 100">
          {petals.map(({ angle, color }, i) => (
            <g key={i} transform={`rotate(${angle} 50 50)`}>
              <ellipse
                cx="50"
                cy="27"
                rx="9.5"
                ry="21"
                fill={color}
                style={{
                  animation: `adminPetalBloom 1.6s ease-in-out ${(i * 0.15).toFixed(2)}s infinite`,
                  animationFillMode: "both",
                  transformOrigin: "50px 50px"
                }}
              />
            </g>
          ))}
          <circle cx="50" cy="50" r="12" fill="#2E8B34" />
          <circle cx="50" cy="50" r="7" fill="#f9c6d0" />
          <circle cx="50" cy="50" r="3.5" fill="#fff" opacity="0.7" />
        </svg>
        <p
          className="mt-6 text-sm font-medium tracking-wide animate-pulse"
          style={{ color: isDark ? "#94a3b8" : "#6b7280" }}
        >
          {message}
        </p>
      </div>
    </>
  );
}

function PrintBtn({ onClick, isDark }) {
  return (
    <button
      onClick={onClick}
      className="no-print flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border rounded-lg transition-all hover:shadow-sm active:scale-95"
      style={{ borderColor: isDark ? "#334155" : "#dde3ec", color: isDark ? "#e2e8f0" : "#374151", backgroundColor: isDark ? "#1e293b" : "white" }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = isDark ? "#22324a" : "#f9fafb" }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "white" }}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
        />
      </svg>
      Print
    </button>
  );
}

function ExportDeliveryBtn({ riders = [], orders = [], isDark }) {
  const csvCell = (value) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const handleExport = () => {
    const riderHeaders = ["Type", "Name", "Branch", "Active Deliveries", "Availability", "Phone", "Last Assigned"];
    const riderRows = riders.map((r) => [
      "Rider",
      r.name || "",
      r.branch || "",
      r.activeDeliveries ?? r.active_deliveries ?? 0,
      r.availability || "",
      r.phoneNumber || r.phone_number || "",
      r.lastAssignedAt || r.last_assigned_at || "",
    ]);

    const orderHeaders = ["Type", "Order", "Recipient", "Branch", "Status", "Schedule", "Items"];
    const orderRows = orders.map((o) => [
      "Pending Order",
      o.orderNumber || o.order_number || "",
      o.recipientName || o.recipient_name || "",
      o.branch || "",
      o.status || "",
      o.scheduledAt || o.scheduled_at || "",
      o.itemSummary || o.item_summary || "",
    ]);

    const csvRows = [
      riderHeaders.join(","),
      ...riderRows.map((row) => row.map(csvCell).join(",")),
      "",
      orderHeaders.join(","),
      ...orderRows.map((row) => row.map(csvCell).join(",")),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `delivery_operations_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="no-print flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border rounded-lg transition-all hover:shadow-sm active:scale-95"
      style={{
        borderColor: isDark ? "#374151" : "#dde3ec",
        color: isDark ? "#94a3b8" : "#6b7280",
        backgroundColor: isDark ? "#1e293b" : "white",
      }}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export CSV
    </button>
  );
}

function FDrop({ value, onChange, children, isDark, inputBg, inputBdr, inputTxt }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full pl-3 pr-9 py-2.5 text-sm border rounded-lg cursor-pointer transition-all focus:ring-2 focus:border-green-500 focus:outline-none shadow-sm"
        style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, outlineColor: "rgba(34,197,94,0.3)" }}
      >
        {children}
      </select>
      <svg
        className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: isDark ? "#64748b" : "#9ca3af" }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  );
}

function EmptyState({ title, subtitle, isDark }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
        style={{
          background: isDark ? "rgba(34,197,94,0.1)" : "linear-gradient(135deg,#f0fdf4,#dcfce7)",
          border: `1px solid ${isDark ? "rgba(34,197,94,0.2)" : "#bbf7d0"}`,
        }}
      >
        <svg className="w-6 h-6" style={{ color: isDark ? "#4ade80" : DG }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="text-base font-semibold" style={{ color: isDark ? "#cbd5e1" : "#4b5563" }}>{title}</p>
      <p className="text-sm mt-1 max-w-sm" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>{subtitle}</p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusLabel(value) {
  if (!value) return "-";
  return String(value).replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function riderInitials(name = "") {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "R"
  );
}

function branchSelectValue(branch) {
  if (!branch) return "";
  const normalized = String(branch).trim().toLowerCase();
  const match = BRANCHES.find((option) => option.toLowerCase() === normalized);
  return match || branch;
}

// Fallback logic to robustly connect the vehicle with the rider regardless of exact DB naming convention
const getVehicleForRider = (vehicles, rider) => {
  if (!rider) return null;
  const riderId = String(rider.id);
  
  // 1. Check if vehicle is already nested inside the rider object directly
  const embeddedVehicle = rider.assignedVehicle || rider.assigned_vehicle || rider.vehicle;
  if (embeddedVehicle && typeof embeddedVehicle === 'object' && embeddedVehicle.id) {
    return embeddedVehicle;
  }
  
  // 2. Check standalone vehicles array if it has an ID matching the rider
  const vId = rider.vehicle_id || rider.assignedVehicleId || rider.assigned_vehicle_id;
  if (vId) {
    const foundById = vehicles.find(v => String(v.id) === String(vId));
    if (foundById) return foundById;
  }
  
  // 3. Match the rider ID on the vehicle object backwards
  return vehicles.find(v => 
    String(v.assignedRiderId) === riderId || 
    String(v.assigned_rider_id) === riderId ||
    String(v.riderId) === riderId ||
    String(v.rider_id) === riderId
  ) || null;
};

const isRiderAccountAssignable = (rider) => Boolean((rider?.isActive ?? rider?.is_active) && (rider?.isVerified ?? rider?.is_verified));
const isRiderOnline = (rider) => Boolean(rider?.riderIsAvailable ?? rider?.rider_is_available ?? rider?.availability !== "offline");
const canDispatchToRider = (rider) => isRiderAccountAssignable(rider) && isRiderOnline(rider);

const riderStatusText = (rider) => {
  if (!(rider?.isActive ?? rider?.is_active)) return "Inactive";
  if (!(rider?.isVerified ?? rider?.is_verified)) return "Unverified";
  if (!isRiderOnline(rider)) return "Offline";
  return statusLabel(rider?.availability || "active");
};

const riderStatusTone = (rider, isDark) => {
  if (!isRiderAccountAssignable(rider) || !isRiderOnline(rider)) {
    return {
      color: isDark ? "#fca5a5" : "#b91c1c",
      backgroundColor: isDark ? "rgba(248,113,113,0.12)" : "#fff1f2",
    };
  }
  return {
    color: isDark ? "#86efac" : "#15803d",
    backgroundColor: isDark ? "rgba(34,197,94,0.12)" : "#f0fdf4",
  };
};

export default function AdminDeliveryFixed() {
  const { isDark } = useTheme();

  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ordersSort, setOrdersSort] = useState("");

  const [loading, setLoading] = useState(true);
  const [phText, setPhText] = useState("");

  const [riders, setRiders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [deliveryOrders, setDeliveryOrders] = useState([]);

  const [assignments, setAssignments] = useState({});
  const [vehicleAssignments, setVehicleAssignments] = useState({});
  const [assigningOrder, setAssigningOrder] = useState("");
  
  // Reassignment State
  const [reassignData, setReassignData] = useState({ show: false, order: null, riderId: "", vehicleId: "" });
  const [reassigning, setReassigning] = useState(false);

  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkRiderId, setBulkRiderId] = useState("");
  const [bulkVehicleId, setBulkVehicleId] = useState("");
  const [loadError, setLoadError] = useState("");
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [creatingDispatch, setCreatingDispatch] = useState(false);
  const [dispatchSearch, setDispatchSearch] = useState("");
  const [dispatchForm, setDispatchForm] = useState({
    branch: "Pampanga",
    rider_id: "",
    vehicle_id: "",
    notes: "",
  });

  const [vehicles, setVehicles] = useState([]);

  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({
    plate_number: "",
    vehicle_type: "motorcycle",
    brand: "",
    model: "",
    color: "",
    capacity: "",
    document_url: "",
    branch: "Pampanga",
    is_active: true,
  });
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [deletingVehicleId, setDeletingVehicleId] = useState(null);
  const [detailModal, setDetailModal] = useState({ type: "", item: null });
  const [savingRiderId, setSavingRiderId] = useState("");

  const [deliveryFee, setDeliveryFee] = useState("150");
  const [minOrder, setMinOrder] = useState("500");
  const [sameDayCutoff, setSameDayCutoff] = useState("09:00");
  const [delivSaved, setDelivSaved] = useState(false);

  const toolbarBg = isDark ? "#111827" : "#fafbfc";
  const toolbarBdr = isDark ? "#1e293b" : "#f1f5f9";
  const inputBg = isDark ? "#1e293b" : "white";
  const inputBdr = isDark ? "#374151" : "#dde3ec";
  const inputTxt = isDark ? "#e2e8f0" : "#374151";
  const cardBg = isDark ? "#1a2332" : "white";
  const cardBdr = isDark ? "#1e293b" : "#e8edf2";
  const hoverRowBg = isDark ? "#1e293b" : "#f8fafc";

  const loadDeliveryData = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const riderQuery = branchFilter ? `?branch=${encodeURIComponent(branchFilter)}` : "";
      const orderQuery = `?branch=${encodeURIComponent(branchFilter)}&limit=${ADMIN_PAGE_SIZE}`;

      const [settingsResult, ridersResult, ordersResult, deliveryOrdersResult, vehiclesResult] = await Promise.allSettled([
        api.getCheckoutSettings(),
        api.get(`/deliveries/admin/riders${riderQuery}`),
        api.get(`/deliveries/admin/assignable-orders${orderQuery}`),
        api.get(`/deliveries/admin/delivery-orders${orderQuery}`),
        api.getVehicles(branchFilter || null),
      ]);

      const settingsData = settingsResult.status === "fulfilled" ? settingsResult.value : {};
      const ridersData = ridersResult.status === "fulfilled" ? ridersResult.value : [];
      const ordersData = ordersResult.status === "fulfilled" ? ordersResult.value : [];
      const deliveryOrdersData = deliveryOrdersResult.status === "fulfilled" ? deliveryOrdersResult.value : [];
      const vehiclesData = vehiclesResult.status === "fulfilled" ? vehiclesResult.value : [];

      const settings = settingsData.delivery || {};
      setDeliveryFee(String(settings.delivery_fee ?? 100));
      setMinOrder(String(settings.minimum_order ?? 0));
      setSameDayCutoff(settings.same_day_cutoff || "14:00");
      setRiders(Array.isArray(ridersData) ? ridersData : []);
      setPendingOrders(Array.isArray(ordersData) ? ordersData : []);
      setDeliveryOrders(Array.isArray(deliveryOrdersData) ? deliveryOrdersData : []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);

      const failedSections = [
        ridersResult.status === "rejected" ? "riders" : null,
        ordersResult.status === "rejected" ? "ready orders" : null,
        deliveryOrdersResult.status === "rejected" ? "active dispatches" : null,
        vehiclesResult.status === "rejected" ? "vehicles" : null,
      ].filter(Boolean);
      if (failedSections.length > 0) {
        setLoadError(`Some delivery data could not load: ${failedSections.join(", ")}. Check the backend logs or database migration status.`);
      }
    } catch (err) {
      setLoadError(err?.message || "Unable to load delivery operations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchFilter]);

  useEffect(() => {
    if (search) {
      setPhText("");
      return;
    }
    let sample = 0;
    let ch = 0;
    let deleting = false;
    let timer;

    const tick = () => {
      const full = SEARCH_SAMPLES[sample];
      ch += deleting ? -1 : 1;
      setPhText(full.slice(0, ch));

      if (!deleting && ch === full.length) {
        deleting = true;
        timer = setTimeout(tick, 1400);
        return;
      }

      if (deleting && ch === 0) {
        deleting = false;
        sample = (sample + 1) % SEARCH_SAMPLES.length;
      }

      timer = setTimeout(tick, deleting ? 55 : 110);
    };

    timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const availableRiders = useMemo(
    () => riders.filter((r) => canDispatchToRider(r) && r.availability === "available"),
    [riders]
  );

  const assignableRiders = useMemo(
    () => riders.filter(canDispatchToRider),
    [riders]
  );

  const riderAccountOptions = useMemo(
    () => riders.filter(isRiderAccountAssignable),
    [riders]
  );

  const filteredRiders = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = riders.filter((r) => {
      const phone = r.phoneNumber || r.phone_number || "";
      const haystack = [r.name, r.email, phone, r.branch].filter(Boolean).join(" ").toLowerCase();
      const isActive = r.isActive ?? r.is_active;
      const isVerified = r.isVerified ?? r.is_verified;
      const status = !isActive ? "inactive" : !isVerified ? "unverified" : !isRiderOnline(r) ? "offline" : r.availability;
      return (!q || haystack.includes(q)) && (!statusFilter || status === statusFilter);
    });

    if (ordersSort === "asc") list = [...list].sort((a, b) => ((a.activeDeliveries ?? a.active_deliveries) || 0) - ((b.activeDeliveries ?? b.active_deliveries) || 0));
    if (ordersSort === "desc") list = [...list].sort((a, b) => ((b.activeDeliveries ?? b.active_deliveries) || 0) - ((a.activeDeliveries ?? a.active_deliveries) || 0));
    if (ordersSort === "none") list = list.filter((r) => ((r.activeDeliveries ?? r.active_deliveries) || 0) === 0);
    if (ordersSort === "max") list = list.filter((r) => ((r.activeDeliveries ?? r.active_deliveries) || 0) >= 3);

    return list;
  }, [riders, search, statusFilter, ordersSort]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pendingOrders.filter((order) => {
      const oNum = order.orderNumber || order.order_number;
      const rName = order.recipientName || order.recipient_name;
      const rPhone = order.recipientPhone || order.recipient_phone;
      const summary = order.itemSummary || order.item_summary;
      
      const haystack = [oNum, rName, rPhone, order.branch, summary].filter(Boolean).join(" ").toLowerCase();
      return !q || haystack.includes(q);
    });
  }, [pendingOrders, search]);

  const dispatchModalOrders = useMemo(() => {
    const q = dispatchSearch.trim().toLowerCase();
    return pendingOrders.filter((order) => {
      const oNum = order.orderNumber || order.order_number;
      const rName = order.recipientName || order.recipient_name;
      const rPhone = order.recipientPhone || order.recipient_phone;
      const summary = order.itemSummary || order.item_summary;
      const haystack = [oNum, rName, rPhone, order.branch, summary].filter(Boolean).join(" ").toLowerCase();
      return !q || haystack.includes(q);
    });
  }, [pendingOrders, dispatchSearch]);

  const assignedDeliveries = riders.reduce((sum, rider) => sum + (Number(rider.activeDeliveries ?? rider.active_deliveries) || 0), 0);
  const inactiveRiders = riders.filter((r) => !(r.isActive ?? r.is_active) || !(r.isVerified ?? r.is_verified)).length;
  const offlineRiders = riders.filter((r) => isRiderAccountAssignable(r) && !isRiderOnline(r)).length;

  const saveConfig = async () => {
    await api.updateDeliverySettings({
      delivery_fee: Math.max(0, Number(deliveryFee) || 0),
      minimum_order: Math.max(0, Number(minOrder) || 0),
      same_day_cutoff: sameDayCutoff,
      timezone: "Asia/Manila",
    });

    setDelivSaved(true);
    setTimeout(() => setDelivSaved(false), 2000);
  };

  const openDispatchModal = () => {
    setDispatchForm({
      branch: branchFilter || "Pampanga",
      rider_id: "",
      vehicle_id: "",
      notes: "",
    });
    setDispatchSearch("");
    setShowDispatchModal(true);
  };

  const createDispatch = async () => {
    if (!dispatchForm.rider_id) {
      setLoadError("Select a rider before creating a dispatch.");
      return;
    }
    const selectedRider = riders.find((r) => String(r.id) === String(dispatchForm.rider_id));
    if (!canDispatchToRider(selectedRider)) {
      setLoadError("Selected rider is offline or unavailable. Choose an active rider before dispatching.");
      return;
    }
    if (selectedOrders.size === 0) {
      setLoadError("Select at least one order to dispatch.");
      return;
    }

    setCreatingDispatch(true);
    setLoadError("");
    try {
      await api.post("/deliveries/admin/delivery-orders", {
        branch: dispatchForm.branch || branchFilter || "Pampanga",
        rider_id: dispatchForm.rider_id,
        vehicle_id: dispatchForm.vehicle_id || null,
        notes: dispatchForm.notes,
        order_ids: Array.from(selectedOrders),
      });
      setSelectedOrders(new Set());
      setDispatchForm({ branch: branchFilter || "Pampanga", rider_id: "", vehicle_id: "", notes: "" });
      setDispatchSearch("");
      setShowDispatchModal(false);
      await loadDeliveryData();
    } catch (err) {
      setLoadError(err?.message || "Unable to create dispatch.");
    } finally {
      setCreatingDispatch(false);
    }
  };

  const assignOrder = async (order) => {
    const riderId = assignments[order.id];
    if (!riderId) return;
    const selectedRider = riders.find((r) => String(r.id) === String(riderId));
    if (!canDispatchToRider(selectedRider)) {
      setLoadError("Selected rider is offline or unavailable. Choose an active rider before assigning.");
      return;
    }

    setAssigningOrder(order.id);
    setLoadError("");

    try {
      await api.post("/deliveries/admin/assign", {
        order_id: order.id,
        rider_id: riderId,
        vehicle_id: vehicleAssignments[order.id] || null,
        assigned_area: order.branch || branchFilter || null,
      });

      setAssignments((current) => {
        const next = { ...current };
        delete next[order.id];
        return next;
      });

      setVehicleAssignments((current) => {
        const next = { ...current };
        delete next[order.id];
        return next;
      });

      await loadDeliveryData();
    } catch (err) {
      setLoadError(err?.message || "Unable to assign this delivery.");
    } finally {
      setAssigningOrder("");
    }
  };

  // Reassign Logic Update
  const openReassignModal = (orderDetail, currentRiderId) => {
    // Find the rider object to accurately auto-populate their specific vehicle
    const rider = riders.find(r => String(r.id) === String(currentRiderId));
    const defaultVehicle = getVehicleForRider(vehicles, rider)?.id || "";
    
    setReassignData({
      show: true,
      order: orderDetail,
      riderId: currentRiderId, 
      vehicleId: defaultVehicle
    });
  };

  const handleReassign = async () => {
    if (!reassignData.riderId) return;
    const selectedRider = riders.find((r) => String(r.id) === String(reassignData.riderId));
    if (!canDispatchToRider(selectedRider)) {
      setLoadError("Selected rider is offline or unavailable. Choose an active rider before reassigning.");
      return;
    }
    setReassigning(true);
    setLoadError("");
    try {
      await api.post("/deliveries/admin/assign", {
        order_id: reassignData.order.id,
        rider_id: reassignData.riderId,
        vehicle_id: reassignData.vehicleId || null,
        is_reassign: true // Include flag just in case the backend requires it
      });
      setReassignData({ show: false, order: null, riderId: "", vehicleId: "" });
      await loadDeliveryData();
    } catch (err) {
      setLoadError(err?.message || "Unable to reassign order. Check connection or try again.");
    } finally {
      setReassigning(false);
    }
  };

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const clearSelection = () => {
    setSelectedOrders(new Set());
    setBulkRiderId("");
    setBulkVehicleId("");
  };

  const bulkAssignOrders = async () => {
    if (!bulkRiderId || selectedOrders.size === 0) return;
    const selectedRider = riders.find((r) => String(r.id) === String(bulkRiderId));
    if (!canDispatchToRider(selectedRider)) {
      setLoadError("Selected rider is offline or unavailable. Choose an active rider before assigning.");
      return;
    }

    setBulkAssigning(true);
    setLoadError("");

    try {
      const promises = Array.from(selectedOrders).map((orderId) => {
        const order = pendingOrders.find((o) => o.id === orderId);
        if (!order) return Promise.resolve();

        return api.post("/deliveries/admin/assign", {
          order_id: order.id,
          rider_id: bulkRiderId,
          vehicle_id: bulkVehicleId || null,
          assigned_area: order.branch || branchFilter || null,
        });
      });

      await Promise.all(promises);
      setSelectedOrders(new Set());
      setBulkRiderId("");
      setBulkVehicleId("");
      setShowBulkAssignModal(false);
      await loadDeliveryData();
    } catch (err) {
      setLoadError(err?.message || "Unable to assign some deliveries. Please try again.");
    } finally {
      setBulkAssigning(false);
    }
  };

  const resetVehicleForm = () => {
    setVehicleForm({
      plate_number: "",
      vehicle_type: "motorcycle",
      brand: "",
      model: "",
      color: "",
      capacity: "",
      document_url: "",
      branch: branchFilter || "Pampanga",
      is_active: true,
    });
    setEditingVehicle(null);
  };

  const openAddVehicle = () => {
    resetVehicleForm();
    setShowVehicleModal(true);
  };

  const openEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle.id);
    setVehicleForm({
      plate_number: vehicle.plateNumber || vehicle.plate_number || "",
      vehicle_type: vehicle.vehicleType || vehicle.vehicle_type || "motorcycle",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      color: vehicle.color || "",
      capacity: vehicle.capacity || "",
      document_url: vehicle.documentUrl || vehicle.document_url || "",
      branch: vehicle.branch || branchFilter || "Pampanga",
      is_active: vehicle.isActive ?? vehicle.is_active ?? true,
    });
    setShowVehicleModal(true);
  };

  const handleSaveVehicle = async () => {
    if (!vehicleForm.plate_number.trim()) {
      setLoadError("Plate number is required.");
      return;
    }

    setSavingVehicle(true);
    setLoadError("");

    try {
      if (editingVehicle) {
        await api.updateVehicle(editingVehicle, vehicleForm);
      } else {
        await api.createVehicle(vehicleForm);
      }
      setShowVehicleModal(false);
      resetVehicleForm();
      await loadDeliveryData();
    } catch (err) {
      setLoadError(err?.message || "Failed to save vehicle.");
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    setDeletingVehicleId(vehicleId);
    setLoadError("");

    try {
      await api.deleteVehicle(vehicleId);
      await loadDeliveryData();
    } catch (err) {
      setLoadError(err?.message || "Failed to delete vehicle.");
    } finally {
      setDeletingVehicleId(null);
    }
  };

  const handleAssignVehicleRider = async (vehicle, riderId) => {
    setLoadError("");
    try {
      await api.assignVehicleRider(vehicle.id, riderId);
      await loadDeliveryData();
    } catch (err) {
      setLoadError(err?.message || "Failed to assign vehicle to rider.");
    }
  };

  const handleUpdateRiderBranch = async (rider, branch) => {
    setSavingRiderId(rider.id);
    setLoadError("");
    try {
      await api.updateUser(rider.id, { branch });
      await loadDeliveryData();
    } catch (err) {
      setLoadError(err?.message || "Failed to update rider branch.");
    } finally {
      setSavingRiderId("");
    }
  };

  const handleUpdateRiderVehicle = async (rider, vehicleId) => {
    setSavingRiderId(rider.id);
    setLoadError("");
    try {
      const currentVehicle = getVehicleForRider(vehicles, rider);
      if (currentVehicle && String(currentVehicle.id) !== String(vehicleId || "")) {
        await api.assignVehicleRider(currentVehicle.id, null);
      }
      if (vehicleId) {
        await api.assignVehicleRider(vehicleId, rider.id);
      }
      await loadDeliveryData();
    } catch (err) {
      setLoadError(err?.message || "Failed to update rider vehicle.");
    } finally {
      setSavingRiderId("");
    }
  };

  const detailRow = (label, value) => (
    <div className="rounded-lg border px-4 py-3" style={{ borderColor: toolbarBdr, backgroundColor: isDark ? "#111827" : "#f8fafc" }}>
      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>{label}</p>
      <p className="text-sm font-semibold mt-1 break-words" style={{ color: isDark ? "#f8fafc" : "#111827" }}>{value || "-"}</p>
    </div>
  );

  const proofPanel = (delivery) => {
    const proofUrl = delivery?.proofPhotoUrl || delivery?.proof_photo_url;
    const proofNote = delivery?.proofNote || delivery?.proof_note;
    if (!proofUrl) return null;

    return (
      <div className="rounded-lg border p-3 flex gap-3 mt-3" style={{ borderColor: toolbarBdr, backgroundColor: isDark ? "#111827" : "#f8fafc" }}>
        <img src={proofUrl} alt="Proof of delivery" className="h-20 w-20 rounded-lg object-cover border" style={{ borderColor: toolbarBdr }} />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: isDark ? "#86efac" : "#15803d" }}>Proof of delivery</p>
          {proofNote ? <p className="text-sm mt-1 break-words" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>{proofNote}</p> : null}
          <a href={proofUrl} target="_blank" rel="noreferrer" className="text-xs font-bold mt-2 inline-block" style={{ color: "#2563eb" }}>Open full image</a>
        </div>
      </div>
    );
  };

  const renderDetailContent = () => {
    const item = detailModal.item;
    if (!item) return null;

    if (detailModal.type === "rider") {
      const vehicle = getVehicleForRider(vehicles, item);
      const active = item.activeDeliveryDetails || item.active_delivery_details || item.orders || item.activeOrders || item.active_orders || item.deliveries || [];
      return (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {detailRow("Name", item.name || "Unnamed Rider")}
            {detailRow("Email", item.email)}
            {detailRow("Phone", item.phoneNumber || item.phone_number)}
            {detailRow("Branch", item.branch)}
            {detailRow("Availability", riderStatusText(item))}
            {detailRow("Active Deliveries", item.activeDeliveries ?? item.active_deliveries ?? 0)}
            {detailRow("Assigned Vehicle", vehicle ? `${vehicle.plateNumber || vehicle.plate_number || "-"} (${statusLabel(vehicle.vehicleType || vehicle.vehicle_type)})` : "-")}
            {detailRow("Verification", (item.isVerified ?? item.is_verified) ? "Verified" : "Unverified")}
          </div>
          <div>
            <h4 className="text-sm font-bold mb-3" style={{ color: isDark ? "#f8fafc" : "#111827" }}>Current Assignments</h4>
            {active.length === 0 ? (
              <p className="text-sm" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>No current assignments.</p>
            ) : (
              <div className="space-y-2">
                {active.map((delivery) => (
                  <div key={delivery.id} className="rounded-lg border p-3 flex items-start justify-between gap-3" style={{ borderColor: toolbarBdr }}>
                    <div>
                      <p className="text-sm font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>{delivery.orderNumber || delivery.order_number}</p>
                      <p className="text-xs mt-1" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>{delivery.itemSummary || delivery.item_summary || "-"}</p>
                      {proofPanel(delivery)}
                    </div>
                    <button type="button" onClick={() => openReassignModal(delivery, item.id)} className="px-3 py-2 text-xs font-bold text-white rounded-lg" style={{ backgroundColor: "#2563eb" }}>
                      Reassign
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      );
    }

    if (detailModal.type === "vehicle") {
      const assignedRider = riders.find((r) => String(r.id) === String(item.assignedRiderId) || String(r.id) === String(item.assigned_rider_id));
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {detailRow("Plate Number", item.plateNumber || item.plate_number)}
          {detailRow("Type", statusLabel(item.vehicleType || item.vehicle_type))}
          {detailRow("Brand", item.brand)}
          {detailRow("Model", item.model)}
          {detailRow("Color", item.color)}
          {detailRow("Capacity", item.capacity)}
          {detailRow("Branch", item.branch)}
          {detailRow("Assigned Rider", assignedRider?.name)}
          {detailRow("Status", (item.isActive ?? item.is_active) ? "Active" : "Inactive")}
          {detailRow("Document URL", item.documentUrl || item.document_url)}
        </div>
      );
    }

    if (detailModal.type === "dispatch") {
      return (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {detailRow("Dispatch Number", item.deliveryOrderNumber || item.delivery_order_number)}
            {detailRow("Status", statusLabel(item.status))}
            {detailRow("Rider", item.riderName || item.rider_name)}
            {detailRow("Vehicle", `${item.vehiclePlateNumber || item.vehicle_plate_number || "-"}${item.vehicleType || item.vehicle_type ? ` (${statusLabel(item.vehicleType || item.vehicle_type)})` : ""}`)}
            {detailRow("Branch", item.branch)}
            {detailRow("Stop Count", item.stopCount ?? item.stop_count ?? item.deliveries?.length ?? 0)}
            {detailRow("Created", formatDate(item.createdAt || item.created_at))}
            {detailRow("Notes", item.notes)}
          </div>
          <div>
            <h4 className="text-sm font-bold mb-3" style={{ color: isDark ? "#f8fafc" : "#111827" }}>Included Orders</h4>
            <div className="space-y-2">
              {(item.deliveries || []).map((delivery) => (
                <div key={delivery.id} className="rounded-lg border p-3" style={{ borderColor: toolbarBdr }}>
                  <p className="text-sm font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>{delivery.orderNumber || delivery.order_number}</p>
                  <p className="text-xs mt-1" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>{delivery.itemSummary || delivery.item_summary || "-"}</p>
                  <span className="text-[11px] font-bold px-2 py-1 rounded inline-block mt-2" style={{ color: isDark ? "#86efac" : "#15803d", backgroundColor: isDark ? "rgba(34,197,94,0.12)" : "#f0fdf4" }}>
                    {statusLabel(delivery.status)}
                  </span>
                  {proofPanel(delivery)}
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {detailRow("Order Number", item.orderNumber || item.order_number)}
          {detailRow("Status", statusLabel(item.status))}
          {detailRow("Recipient", item.recipientName || item.recipient_name)}
          {detailRow("Phone", item.recipientPhone || item.recipient_phone)}
          {detailRow("Branch", item.branch)}
          {detailRow("Schedule", formatDate(item.scheduledAt || item.scheduled_at))}
          {detailRow("Items", item.itemSummary || item.item_summary)}
          {detailRow("Address", item.address || item.deliveryAddress || item.delivery_address)}
          {detailRow("Assigned", formatDate(item.assignedAt || item.assigned_at))}
          {detailRow("Picked Up", formatDate(item.pickedUpAt || item.picked_up_at))}
          {detailRow("Out For Delivery", formatDate(item.inTransitAt || item.in_transit_at))}
          {detailRow("Arrived", formatDate(item.arrivedAt || item.arrived_at))}
          {detailRow("Completed", formatDate(item.deliveredAt || item.delivered_at))}
        </div>
        {proofPanel(item)}
      </>
    );
  };

  const printDate = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
  const printTime = new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  const printScope = [
    branchFilter ? `Branch: ${branchFilter}` : "All branches",
    `${availableRiders.length} online idle rider${availableRiders.length === 1 ? "" : "s"}`,
    `${pendingOrders.length} pending order${pendingOrders.length === 1 ? "" : "s"}`,
  ].join(" - ");

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>Delivery Operations</h1>
        <FlowerLoader message="Loading delivery operations..." isDark={isDark} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <style>{`
        .print-only { display: none; }
        @keyframes delivRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .deliv-rise { animation: delivRise 0.85s ease-out both; }
        .hover-row { transition: background-color 0.15s ease-in-out; }
        .hover-row:hover { background-color: ${hoverRowBg} !important; }
        
        @media print {
          @page { margin: 12mm 10mm; }
          body * { visibility: hidden !important; }
          #delivery-print-area, #delivery-print-area * { visibility: visible !important; }
          #delivery-print-area { position: absolute; top: 0; left: 0; width: 100%; color: #1f2937; font-family: Arial, sans-serif; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-letterhead { display: flex !important; justify-content: space-between; align-items: center; padding: 14px 18px; border-radius: 12px; background: #0C573E !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-logo-word { height: 34px; filter: brightness(0) invert(1); }
          .print-meta { text-align: right; color: #fff !important; font-size: 9px; }
          .print-title { text-align: center; margin: 16px 0 12px; }
          .print-title h2 { margin: 0; color: #0C573E !important; font-size: 15px; letter-spacing: 0.2em; text-transform: uppercase; }
          .print-title p { margin: 6px 0 0; color: #6b7280 !important; font-size: 9px; }
          .print-grid { display: grid !important; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
          .print-card { border: 1px solid #dbe3df; border-top: 3px solid #2E8B34; border-radius: 8px; padding: 9px 11px; }
          .print-card p { margin: 0; }
          .print-card .label { color: #6b7280 !important; font-size: 8px; text-transform: uppercase; letter-spacing: 0.08em; }
          .print-card .value { color: #111827 !important; font-size: 18px; font-weight: 800; margin-top: 3px; }
          .print-table { margin-top: 12px; }
          .print-table h3 { color: #0C573E !important; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; }
          .print-table table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #dbe3df; }
          .print-table th { background: #0C573E !important; color: #fff !important; padding: 7px; text-align: left; font-size: 8px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-table td { border-top: 1px solid #eef1f4; padding: 7px; font-size: 9px; overflow-wrap: anywhere; }
        }
      `}</style>

      <div className={`no-print flex items-center justify-between flex-wrap gap-4 deliv-rise`}>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>Delivery Operations</h1>
        <div className="flex items-center gap-3">
          <ExportDeliveryBtn riders={filteredRiders} orders={filteredOrders} isDark={isDark} />
          <PrintBtn onClick={() => window.print()} isDark={isDark} />
        </div>
      </div>

      {loadError && (
        <div
          className="no-print rounded-xl px-5 py-4 text-sm font-semibold shadow-sm"
          style={{
            color: isDark ? "#fca5a5" : "#b91c1c",
            backgroundColor: isDark ? "rgba(248,113,113,0.08)" : "#fff1f2",
            border: `1px solid ${isDark ? "rgba(248,113,113,0.25)" : "#fecaca"}`,
          }}
        >
          {loadError}
        </div>
      )}

      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 no-print deliv-rise`} style={{ animationDelay: "0.18s" }}>
        <GreenCard label="Ready for dispatch" sublabel="Ready pickup orders" value={pendingOrders.length} sub="Needs dispatch" />
        <WhiteCard label="Active dispatches" sublabel="In-house routes" value={deliveryOrders.length} sub="Currently assigned" accentColor="#3b82f6" />
        <WhiteCard label="Rider management" sublabel="Online and idle" value={availableRiders.length} sub={`${offlineRiders} offline, ${inactiveRiders} unavailable`} accentColor="#22c55e" />
        <WhiteCard label="Assigned stops" sublabel="Active rider load" value={assignedDeliveries} sub={branchFilter || "All branches"} accentColor="#f59e0b" />
      </div>

      <div className={`no-print rounded-2xl overflow-hidden shadow-sm deliv-rise`} style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, animationDelay: "0.36s" }}>
        <div className="flex items-center justify-between px-6 py-5 gap-4 flex-wrap" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
          <div>
            <p className="text-base font-bold" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>Delivery Configuration</p>
            <p className="text-sm mt-1" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>Manage fees, minimums, and cutoffs</p>
          </div>
          <button
            onClick={saveConfig}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95"
            style={{ background: delivSaved ? "#16a34a" : `linear-gradient(135deg, ${DG}, ${G})` }}
          >
            {delivSaved ? "Saved Successfully" : "Save Changes"}
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Delivery Fee (PHP)</label>
            <input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} className="w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:border-green-500 focus:outline-none transition-all shadow-sm" style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, outlineColor: "rgba(34,197,94,0.3)" }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Minimum Order (PHP)</label>
            <input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} className="w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:border-green-500 focus:outline-none transition-all shadow-sm" style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, outlineColor: "rgba(34,197,94,0.3)" }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Same-Day Cutoff</label>
            <input type="time" value={sameDayCutoff} onChange={(e) => setSameDayCutoff(e.target.value)} className="w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:border-green-500 focus:outline-none transition-all shadow-sm" style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, outlineColor: "rgba(34,197,94,0.3)" }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Branch Filter</label>
            <FDrop value={branchFilter} onChange={setBranchFilter} isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt}>
              <option value="">All Branches</option>
              {BRANCHES.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </FDrop>
          </div>
        </div>
      </div>

      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl transform transition-all" style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}` }}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
              <h3 className="text-base font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>
                {editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowVehicleModal(false);
                  resetVehicleForm();
                }}
                className="p-1 rounded-md transition-all hover:bg-gray-100 dark:hover:bg-slate-700"
                style={{ color: inputTxt }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>
                  Plate Number *
                </label>
                <input
                  type="text"
                  value={vehicleForm.plate_number}
                  onChange={(e) => setVehicleForm((f) => ({ ...f, plate_number: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:border-green-500 focus:outline-none uppercase shadow-sm transition-all"
                  style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, outlineColor: "rgba(34,197,94,0.3)" }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Vehicle Type</label>
                <select
                  value={vehicleForm.vehicle_type}
                  onChange={(e) => setVehicleForm((f) => ({ ...f, vehicle_type: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:border-green-500 focus:outline-none shadow-sm transition-all"
                  style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, outlineColor: "rgba(34,197,94,0.3)" }}
                >
                  <option value="motorcycle">Motorcycle</option>
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                  <option value="truck">Truck</option>
                  <option value="bicycle">Bicycle</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Branch</label>
                <select
                  value={vehicleForm.branch}
                  onChange={(e) => setVehicleForm((f) => ({ ...f, branch: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:border-green-500 focus:outline-none shadow-sm transition-all"
                  style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, outlineColor: "rgba(34,197,94,0.3)" }}
                >
                  <option value="Pampanga">Pampanga</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Brand</label>
                <input
                  type="text"
                  value={vehicleForm.brand}
                  onChange={(e) => setVehicleForm((f) => ({ ...f, brand: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:border-green-500 focus:outline-none shadow-sm transition-all"
                  style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, outlineColor: "rgba(34,197,94,0.3)" }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Model</label>
                <input
                  type="text"
                  value={vehicleForm.model}
                  onChange={(e) => setVehicleForm((f) => ({ ...f, model: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:border-green-500 focus:outline-none shadow-sm transition-all"
                  style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, outlineColor: "rgba(34,197,94,0.3)" }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Color</label>
                <input
                  type="text"
                  value={vehicleForm.color}
                  onChange={(e) => setVehicleForm((f) => ({ ...f, color: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:border-green-500 focus:outline-none shadow-sm transition-all"
                  style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, outlineColor: "rgba(34,197,94,0.3)" }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Capacity</label>
                <input
                  type="text"
                  value={vehicleForm.capacity}
                  onChange={(e) => setVehicleForm((f) => ({ ...f, capacity: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:border-green-500 focus:outline-none shadow-sm transition-all"
                  style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, outlineColor: "rgba(34,197,94,0.3)" }}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Document URL</label>
                <input
                  type="text"
                  value={vehicleForm.document_url}
                  onChange={(e) => setVehicleForm((f) => ({ ...f, document_url: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:border-green-500 focus:outline-none shadow-sm transition-all"
                  style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, outlineColor: "rgba(34,197,94,0.3)" }}
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-3 mt-1">
                <input
                  type="checkbox"
                  id="vhActive"
                  checked={vehicleForm.is_active}
                  onChange={(e) => setVehicleForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded text-green-600 focus:ring-green-500 cursor-pointer"
                />
                <label htmlFor="vhActive" className="text-sm font-semibold cursor-pointer" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Vehicle is Active</label>
              </div>
            </div>

            <div className="px-6 py-5 flex items-center justify-end gap-3" style={{ borderTop: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
              <button
                type="button"
                onClick={() => {
                  setShowVehicleModal(false);
                  resetVehicleForm();
                }}
                className="px-5 py-2.5 text-sm font-semibold border rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-slate-800"
                style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVehicle}
                disabled={savingVehicle}
                className="px-6 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}
              >
                {savingVehicle ? "Saving..." : editingVehicle ? "Update Vehicle" : "Create Vehicle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.62)" }}>
          <div className="w-full max-w-6xl max-h-[92vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col" style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}` }}>
            <div className="px-6 py-5 flex items-center justify-between gap-4" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
              <div>
                <h3 className="text-base font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>Dispatch Orders</h3>
                <p className="text-sm mt-1" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>Create one in-house dispatch route for selected ready orders.</p>
              </div>
              <button type="button" onClick={() => setShowDispatchModal(false)} className="p-2 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-slate-700" style={{ color: inputTxt }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Branch</label>
                  <FDrop value={dispatchForm.branch} onChange={(value) => setDispatchForm((current) => ({ ...current, branch: value }))} isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt}>
                    {BRANCHES.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
                  </FDrop>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Rider *</label>
                  <FDrop
                    value={dispatchForm.rider_id}
                    onChange={(value) => {
                      const rider = riders.find((r) => String(r.id) === String(value));
                      const riderVehicle = getVehicleForRider(vehicles, rider);
                      setDispatchForm((current) => ({ ...current, rider_id: value, vehicle_id: riderVehicle?.id || current.vehicle_id }));
                    }}
                    isDark={isDark}
                    inputBg={inputBg}
                    inputBdr={inputBdr}
                    inputTxt={inputTxt}
                  >
                    <option value="">Select rider</option>
                    {assignableRiders.map((rider) => (
                      <option key={rider.id} value={rider.id}>{rider.name} ({rider.activeDeliveries ?? rider.active_deliveries ?? 0} active)</option>
                    ))}
                  </FDrop>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>In-house Vehicle</label>
                  <FDrop value={dispatchForm.vehicle_id} onChange={(value) => setDispatchForm((current) => ({ ...current, vehicle_id: value }))} isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt}>
                    <option value="">No vehicle</option>
                    {vehicles.filter((vehicle) => vehicle.isActive ?? vehicle.is_active).map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>{vehicle.plateNumber || vehicle.plate_number} ({statusLabel(vehicle.vehicleType || vehicle.vehicle_type)})</option>
                    ))}
                  </FDrop>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Notes</label>
                <textarea
                  value={dispatchForm.notes}
                  onChange={(e) => setDispatchForm((current) => ({ ...current, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:border-green-500 focus:outline-none transition-all shadow-sm resize-none"
                  style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, outlineColor: "rgba(34,197,94,0.3)" }}
                  placeholder="Optional route notes, packing instructions, or driver reminders"
                />
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>{selectedOrders.size} selected</p>
                  <p className="text-xs mt-0.5" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>Only paid orders marked ready for pickup are listed.</p>
                </div>
                <input
                  value={dispatchSearch}
                  onChange={(e) => setDispatchSearch(e.target.value)}
                  placeholder="Search ready orders"
                  className="px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:border-green-500 focus:outline-none transition-all shadow-sm"
                  style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, minWidth: 260, outlineColor: "rgba(34,197,94,0.3)" }}
                />
              </div>

              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: toolbarBdr }}>
                <table className="w-full" style={{ minWidth: "820px" }}>
                  <thead style={{ backgroundColor: toolbarBg, borderBottom: `1px solid ${toolbarBdr}` }}>
                    <tr>
                      {["", "Order", "Recipient", "Branch", "Schedule", "Items"].map((h) => (
                        <th key={h || "select"} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isDark ? "#64748b" : "#6b7280" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dispatchModalOrders.length === 0 ? (
                      <tr><td colSpan={6}><EmptyState title="No ready orders" subtitle="Mark paid delivery orders as ready for pickup before dispatching." isDark={isDark} /></td></tr>
                    ) : dispatchModalOrders.map((order) => {
                      const checked = selectedOrders.has(order.id);
                      return (
                        <tr key={order.id} className="hover-row" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: checked ? (isDark ? "rgba(34,197,94,0.08)" : "#f0fdf4") : "transparent" }}>
                          <td className="px-4 py-3"><input type="checkbox" checked={checked} onChange={() => toggleOrderSelection(order.id)} className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-gray-300 cursor-pointer" /></td>
                          <td className="px-4 py-3 text-sm font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>{order.orderNumber || order.order_number}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>{order.recipientName || order.recipient_name || "Recipient"}</p>
                            <p className="text-xs" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>{order.recipientPhone || order.recipient_phone || "-"}</p>
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: isDark ? "#cbd5e1" : "#4b5563" }}>{order.branch || "-"}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: isDark ? "#cbd5e1" : "#4b5563" }}>{formatDate(order.scheduledAt || order.scheduled_at)}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: isDark ? "#cbd5e1" : "#4b5563", maxWidth: 340 }}>{order.itemSummary || order.item_summary || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-5 flex items-center justify-between gap-3 flex-wrap" style={{ borderTop: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
              <button type="button" onClick={() => setSelectedOrders(new Set())} className="px-5 py-2.5 text-sm font-semibold border rounded-lg transition-all" style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}>Clear Selection</button>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setShowDispatchModal(false)} className="px-5 py-2.5 text-sm font-semibold border rounded-lg transition-all" style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}>Cancel</button>
                <button type="button" onClick={createDispatch} disabled={creatingDispatch || !dispatchForm.rider_id || selectedOrders.size === 0} className="px-6 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:shadow-md active:scale-95 disabled:opacity-50 disabled:transform-none" style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
                  {creatingDispatch ? "Creating..." : "Create Dispatch"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REASSIGN MODAL */}
      {reassignData.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl transform transition-all" style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}` }}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
              <h3 className="text-base font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>
                Reassign Order <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs ml-1">{reassignData.order?.orderNumber || reassignData.order?.order_number}</span>
              </h3>
              <button
                type="button"
                onClick={() => setReassignData({ show: false, order: null, riderId: "", vehicleId: "" })}
                className="p-1 rounded-md transition-all hover:bg-gray-100 dark:hover:bg-slate-700"
                style={{ color: inputTxt }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Select New Rider *</label>
                <select
                  value={reassignData.riderId}
                  onChange={(e) => {
                    const rId = e.target.value;
                    const riderObj = riders.find(r => String(r.id) === String(rId));
                    const rVeh = getVehicleForRider(vehicles, riderObj);
                    setReassignData(prev => ({ ...prev, riderId: rId, vehicleId: rVeh ? rVeh.id : "" }));
                  }}
                  className="w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:border-green-500 focus:outline-none shadow-sm transition-all"
                  style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, outlineColor: "rgba(34,197,94,0.3)" }}
                >
                  <option value="">Select rider</option>
                  {assignableRiders.map((rider) => (
                    <option key={rider.id} value={rider.id}>
                      {rider.name} ({rider.activeDeliveries ?? rider.active_deliveries ?? 0} active) - {rider.branch || "No branch"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Vehicle (Optional)</label>
                <select
                  value={reassignData.vehicleId}
                  onChange={(e) => setReassignData(prev => ({ ...prev, vehicleId: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:border-green-500 focus:outline-none shadow-sm transition-all"
                  style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, outlineColor: "rgba(34,197,94,0.3)" }}
                >
                  <option value="">No vehicle</option>
                  {vehicles.filter((v) => v.isActive ?? v.is_active).map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber || vehicle.plate_number} ({statusLabel(vehicle.vehicleType || vehicle.vehicle_type)})
                    </option>
                  ))}
                </select>
              </div>
              {!reassignData.riderId && (
                <p className="text-xs font-medium" style={{ color: isDark ? "#fca5a5" : "#ef4444" }}>* Please select a rider to reassign this order.</p>
              )}
            </div>
            <div className="px-6 py-5 flex items-center justify-end gap-3" style={{ borderTop: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
              <button
                type="button"
                onClick={() => setReassignData({ show: false, order: null, riderId: "", vehicleId: "" })}
                className="px-5 py-2.5 text-sm font-semibold border rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-slate-800"
                style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReassign}
                disabled={reassigning || !reassignData.riderId}
                className="px-6 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}
              >
                {reassigning ? "Reassigning..." : "Confirm Reassign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.62)" }}>
          <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col" style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}` }}>
            <div className="px-6 py-5 flex items-center justify-between gap-4" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
              <div>
                <h3 className="text-base font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>
                  {detailModal.type === "rider" ? "Rider Details" : detailModal.type === "vehicle" ? "Vehicle Details" : detailModal.type === "dispatch" ? "Dispatch Details" : "Order Details"}
                </h3>
                <p className="text-sm mt-1" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>Full delivery operation attributes.</p>
              </div>
              <button type="button" onClick={() => setDetailModal({ type: "", item: null })} className="p-2 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-slate-700" style={{ color: inputTxt }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              {renderDetailContent()}
            </div>
            <div className="px-6 py-5 flex items-center justify-end gap-3" style={{ borderTop: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
              {detailModal.type === "vehicle" && (
                <button
                  type="button"
                  onClick={() => {
                    const vehicle = detailModal.item;
                    setDetailModal({ type: "", item: null });
                    openEditVehicle(vehicle);
                  }}
                  className="px-5 py-2.5 text-sm font-semibold border rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-slate-800"
                  style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
                >
                  Edit Vehicle
                </button>
              )}
              <button
                type="button"
                onClick={() => setDetailModal({ type: "", item: null })}
                className="px-6 py-2.5 text-sm font-bold text-white rounded-lg transition-all"
                style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div id="delivery-print-area">
        <div className="print-only print-letterhead">
          <img className="print-logo-word" src={estingsWordmark} alt="Esting's Flower International Inc." />
          <div className="print-meta">
            <div>DEL-{new Date().toISOString().slice(0, 10).replace(/-/g, "")}</div>
            <div>
              {printDate} at {printTime}
            </div>
          </div>
        </div>
        <div className="print-only print-title">
          <h2>Delivery Operations Report</h2>
          <p>{printScope}</p>
        </div>
        <div className="print-only print-grid">
          <div className="print-card">
            <p className="label">Pending Orders</p>
            <p className="value">{pendingOrders.length}</p>
          </div>
          <div className="print-card">
            <p className="label">Active Riders</p>
            <p className="value">{availableRiders.length}</p>
          </div>
          <div className="print-card">
            <p className="label">Assigned Deliveries</p>
            <p className="value">{assignedDeliveries}</p>
          </div>
        </div>

        <div className={`no-print rounded-2xl overflow-hidden shadow-sm deliv-rise`} style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, animationDelay: "0.54s" }}>
          <div className="px-6 py-5 flex items-center justify-between gap-4 flex-wrap" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
            <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto">
              <FDrop value={branchFilter} onChange={setBranchFilter} isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt}>
                <option value="">Branch: All</option>
                {BRANCHES.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </FDrop>
              <FDrop value={statusFilter} onChange={setStatusFilter} isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt}>
                <option value="">Status: All</option>
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="offline">Offline</option>
                <option value="inactive">Inactive</option>
                <option value="unverified">Unverified</option>
              </FDrop>
              <FDrop value={ordersSort} onChange={setOrdersSort} isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt}>
                <option value="">Orders: Default</option>
                <option value="asc">Fewest first</option>
                <option value="desc">Most first</option>
                <option value="none">No active orders</option>
                <option value="max">At capacity</option>
              </FDrop>

              <div className="relative flex-1" style={{ minWidth: "220px" }}>
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isDark ? "#64748b" : "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={search ? "" : `${phText}|`}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:border-green-500 focus:outline-none transition-all shadow-sm"
                  style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, outlineColor: "rgba(34,197,94,0.3)" }}
                />
              </div>

              <button
                type="button"
                onClick={loadDeliveryData}
                className="px-4 py-2.5 text-sm font-semibold border rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-slate-800 shadow-sm"
                style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <section className="rounded-xl border overflow-hidden" style={{ borderColor: cardBdr, backgroundColor: cardBg }}>
                <div className="px-5 py-4 flex items-center justify-between gap-3" style={{ borderBottom: `1px solid ${isDark ? "#243142" : "#eef2f6"}`, backgroundColor: toolbarBg }}>
                  <div>
                    <h2 className="text-base font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>Delivery Riders</h2>
                    <p className="text-sm mt-1" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>View status, branch, and assigned vehicle.</p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ color: isDark ? "#cbd5e1" : "#475569", backgroundColor: isDark ? "#1f2937" : "#f3f6f8" }}>{availableRiders.length} active</span>
                </div>
                <div>
                  {filteredRiders.length === 0 ? (
                    <EmptyState title="No riders found" subtitle="Try another branch, status, or search term." isDark={isDark} />
                  ) : filteredRiders.map((rider, index) => {
                    const vehicle = getVehicleForRider(vehicles, rider);
                    const statusTone = riderStatusTone(rider, isDark);
                    const availableVehicles = vehicles.filter((v) => {
                      if (!(v.isActive ?? v.is_active)) return false;
                      const assignedRiderId = v.assignedRiderId || v.assigned_rider_id;
                      return !assignedRiderId || String(assignedRiderId) === String(rider.id);
                    });
                    return (
                      <div key={rider.id} className="px-5 py-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_150px_190px_140px] gap-3 items-center transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/40" style={{ borderTop: index === 0 ? "none" : `1px solid ${isDark ? "#243142" : "#eef2f6"}` }}>
                        <div className="min-w-0 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0" style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
                            {rider.profilePictureUrl || rider.profile_picture_url ? <img src={rider.profilePictureUrl || rider.profile_picture_url} alt={rider.name} className="w-full h-full object-cover" /> : riderInitials(rider.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: isDark ? "#f8fafc" : "#111827" }}>{rider.name || "Unnamed Rider"}</p>
                            <p className="text-xs mt-1 truncate" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>{rider.email || rider.phoneNumber || rider.phone_number || "-"}</p>
                          </div>
                        </div>
                        <FDrop value={branchSelectValue(rider.branch)} onChange={(value) => handleUpdateRiderBranch(rider, value)} isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt}>
                          <option value="">No branch</option>
                          {BRANCHES.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
                        </FDrop>
                        <FDrop value={vehicle?.id || ""} onChange={(value) => handleUpdateRiderVehicle(rider, value)} isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt}>
                          <option value="">No vehicle</option>
                          {availableVehicles.map((v) => <option key={v.id} value={v.id}>{v.plateNumber || v.plate_number}</option>)}
                        </FDrop>
                        <div className="flex items-center justify-end gap-2 shrink-0">
                          <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={statusTone}>
                            {savingRiderId === rider.id ? "Saving" : riderStatusText(rider)}
                          </span>
                          <button type="button" onClick={() => setDetailModal({ type: "rider", item: rider })} className="px-3 py-2 text-xs font-bold border rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-slate-800" style={{ borderColor: inputBdr, color: inputTxt, backgroundColor: inputBg }}>View</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-xl border overflow-hidden" style={{ borderColor: cardBdr, backgroundColor: cardBg }}>
                <div className="px-5 py-4 flex items-center justify-between gap-3" style={{ borderBottom: `1px solid ${isDark ? "#243142" : "#eef2f6"}`, backgroundColor: toolbarBg }}>
                  <div>
                    <h2 className="text-base font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>Vehicle Management</h2>
                    <p className="text-sm mt-1" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>In-house fleet and rider assignment.</p>
                  </div>
                  <button type="button" onClick={openAddVehicle} className="ml-auto px-4 py-2 text-sm font-bold text-white rounded-lg transition-all active:scale-95" style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>Add Vehicle</button>
                </div>
                <div>
                  {vehicles.length === 0 ? (
                    <EmptyState title="No vehicles found" subtitle="Add your first vehicle to start assigning it to riders." isDark={isDark} />
                  ) : vehicles.map((vehicle, index) => {
                    const assignedRider = riders.find((r) => String(r.id) === String(vehicle.assignedRiderId) || String(r.id) === String(vehicle.assigned_rider_id));
                    return (
                      <div key={vehicle.id} className="px-5 py-4 flex items-center justify-between gap-4 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/40" style={{ borderTop: index === 0 ? "none" : `1px solid ${isDark ? "#243142" : "#eef2f6"}` }}>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: isDark ? "#f8fafc" : "#111827" }}>{vehicle.plateNumber || vehicle.plate_number || "No plate"}</p>
                          <p className="text-xs mt-1 truncate" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>{statusLabel(vehicle.vehicleType || vehicle.vehicle_type)} - {[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "No model"} - {assignedRider?.name || "Unassigned"}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button type="button" onClick={() => setDetailModal({ type: "vehicle", item: vehicle })} className="px-3 py-2 text-xs font-bold border rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-slate-800" style={{ borderColor: inputBdr, color: inputTxt, backgroundColor: inputBg }}>View</button>
                          <button type="button" onClick={() => openEditVehicle(vehicle)} className="px-3 py-2 text-xs font-bold border rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-slate-800" style={{ borderColor: inputBdr, color: inputTxt, backgroundColor: inputBg }}>Edit</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-xl border overflow-hidden" style={{ borderColor: cardBdr, backgroundColor: cardBg }}>
                <div className="px-5 py-4 flex items-center justify-between gap-3" style={{ borderBottom: `1px solid ${isDark ? "#243142" : "#eef2f6"}`, backgroundColor: toolbarBg }}>
                  <div>
                    <h2 className="text-base font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>Active Dispatches</h2>
                    <p className="text-sm mt-1" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>Routes already assigned to riders.</p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ color: isDark ? "#cbd5e1" : "#475569", backgroundColor: isDark ? "#1f2937" : "#f3f6f8" }}>{deliveryOrders.length} active</span>
                </div>
                <div>
                  {deliveryOrders.length === 0 ? (
                    <EmptyState title="No active dispatches" subtitle="Create a dispatch after orders are paid and ready for pickup." isDark={isDark} />
                  ) : deliveryOrders.map((dispatch, index) => (
                    <div key={dispatch.id} className="px-5 py-4 flex items-center justify-between gap-4 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/40" style={{ borderTop: index === 0 ? "none" : `1px solid ${isDark ? "#243142" : "#eef2f6"}` }}>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: isDark ? "#f8fafc" : "#111827" }}>{dispatch.deliveryOrderNumber || dispatch.delivery_order_number}</p>
                        <p className="text-xs mt-1 truncate" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>{dispatch.riderName || dispatch.rider_name || "No rider"} - {dispatch.vehiclePlateNumber || dispatch.vehicle_plate_number || "No vehicle"} - {dispatch.stopCount ?? dispatch.stop_count ?? dispatch.deliveries?.length ?? 0} stops</p>
                      </div>
                      <button type="button" onClick={() => setDetailModal({ type: "dispatch", item: dispatch })} className="px-3 py-2 text-xs font-bold border rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-slate-800 shrink-0" style={{ borderColor: inputBdr, color: inputTxt, backgroundColor: inputBg }}>View</button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border overflow-hidden" style={{ borderColor: cardBdr, backgroundColor: cardBg }}>
                <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${isDark ? "#243142" : "#eef2f6"}`, backgroundColor: toolbarBg }}>
                  <div>
                    <h2 className="text-base font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>Ready for Dispatch</h2>
                    <p className="text-sm mt-1" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>Paid orders marked ready for pickup.</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ color: isDark ? "#cbd5e1" : "#475569", backgroundColor: isDark ? "#1f2937" : "#f3f6f8" }}>{selectedOrders.size || filteredOrders.length} {selectedOrders.size ? "selected" : "pending"}</span>
                    {selectedOrders.size > 0 ? <button type="button" onClick={clearSelection} className="px-3 py-2 text-xs font-bold border rounded-lg" style={{ borderColor: inputBdr, color: inputTxt, backgroundColor: inputBg }}>Clear</button> : null}
                    <button type="button" onClick={openDispatchModal} className="px-4 py-2 text-sm font-bold text-white rounded-lg transition-all active:scale-95" style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>Dispatch Orders</button>
                  </div>
                </div>
                <div>
                  {filteredOrders.length === 0 ? (
                    <EmptyState title="No pending delivery orders" subtitle="Paid delivery orders appear here after they are marked ready for pickup." isDark={isDark} />
                  ) : (
                    <>
                      <label className="px-5 py-3 flex items-center gap-3 text-xs font-bold uppercase tracking-wider" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>
                        <input type="checkbox" checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer" />
                        Select all ready orders
                      </label>
                      {filteredOrders.map((order, index) => {
                        const selected = selectedOrders.has(order.id);
                        return (
                          <div key={order.id} className="px-5 py-4 flex items-center justify-between gap-4 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/40" style={{ borderTop: index === 0 ? "none" : `1px solid ${isDark ? "#243142" : "#eef2f6"}`, backgroundColor: selected ? (isDark ? "rgba(34,197,94,0.08)" : "#f5fbf7") : "transparent" }}>
                            <div className="min-w-0 flex items-start gap-3">
                              <input type="checkbox" checked={selected} onChange={() => toggleOrderSelection(order.id)} className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate" style={{ color: isDark ? "#f8fafc" : "#111827" }}>{order.orderNumber || order.order_number}</p>
                                <p className="text-xs mt-1 truncate" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>{order.recipientName || order.recipient_name || "Recipient"} - {order.branch || "-"} - {formatDate(order.scheduledAt || order.scheduled_at)}</p>
                              </div>
                            </div>
                            <button type="button" onClick={() => setDetailModal({ type: "order", item: order })} className="px-3 py-2 text-xs font-bold border rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-slate-800 shrink-0" style={{ borderColor: inputBdr, color: inputTxt, backgroundColor: inputBg }}>View</button>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </section>
            </div>
          </div>

          <div className="hidden">
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>Delivery Riders</h2>
                <p className="text-sm mt-1" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>View rider status, branch, assigned vehicle, and current work.</p>
              </div>
              <span className="text-sm font-bold px-3 py-1.5 rounded-full" style={{ color: isDark ? "#86efac" : DG, backgroundColor: isDark ? "rgba(34,197,94,0.12)" : "#f0fdf4" }}>
                {availableRiders.length} active
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: "820px" }}>
              <thead style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
                <tr>
                  {["Rider", "Branch", "Phone", "Vehicle", "Active Deliveries", "Current Assignments", "Status"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isDark ? "#64748b" : "#6b7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRiders.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState title="No riders found" subtitle="Try another branch, status, or search term." isDark={isDark} />
                    </td>
                  </tr>
                ) : (
                  filteredRiders.map((rider) => {
                    // Forcefully locate the vehicle across different API structures
                    const assignedVehicle = getVehicleForRider(vehicles, rider);
                    const plate = assignedVehicle ? (assignedVehicle.plateNumber || assignedVehicle.plate_number || assignedVehicle.plate) : null;
                    const vType = assignedVehicle ? (assignedVehicle.vehicleType || assignedVehicle.vehicle_type) : null;
                    const rActiveDeliveries = rider.activeDeliveryDetails || rider.active_delivery_details || rider.orders || rider.activeOrders || rider.active_orders || rider.deliveries || [];

                    return (
                      <tr key={rider.id} className="hover-row" style={{ borderBottom: `1px solid ${toolbarBdr}` }}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white overflow-hidden shadow-sm" style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
                              {rider.profilePictureUrl || rider.profile_picture_url ? (
                                <img src={rider.profilePictureUrl || rider.profile_picture_url} alt={rider.name} className="w-full h-full object-cover" />
                              ) : (
                                riderInitials(rider.name)
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>{rider.name || "Unnamed Rider"}</p>
                              <p className="text-xs mt-0.5" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>{rider.email || "-"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium" style={{ color: isDark ? "#cbd5e1" : "#4b5563" }}>{rider.branch || "-"}</td>
                        <td className="px-6 py-4 text-sm font-medium" style={{ color: isDark ? "#cbd5e1" : "#4b5563" }}>{rider.phoneNumber || rider.phone_number || "-"}</td>
                        <td className="px-6 py-4 text-sm">
                          {plate ? (
                            <div>
                              <span className="font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>{plate}</span>
                              <span className="text-xs ml-1.5" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>({statusLabel(vType)})</span>
                            </div>
                          ) : (
                            <span style={{ color: isDark ? "#64748b" : "#9ca3af" }}>-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-center">
                          <span className="px-3 py-1.5 rounded-full" style={{ backgroundColor: isDark ? "#334155" : "#e5e7eb", color: isDark ? "#f8fafc" : "#111827" }}>
                            {rider.activeDeliveries ?? rider.active_deliveries ?? 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: isDark ? "#cbd5e1" : "#374151" }}>
                          {rActiveDeliveries.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {rActiveDeliveries.map((d) => (
                                <div key={d.id} className="flex flex-col border-b last:border-b-0 pb-2 last:pb-0" style={{ borderColor: isDark ? "#334155" : "#e5e7eb" }}>
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="font-bold text-xs" style={{ color: isDark ? "#f8fafc" : "#111827" }}>{d.orderNumber || d.order_number}</span>
                                    <button 
                                      onClick={() => openReassignModal(d, rider.id)}
                                      className="text-[10px] uppercase font-bold px-2 py-1 rounded transition-all shadow-sm active:scale-95"
                                      style={{ backgroundColor: isDark ? "#2563eb" : "#2563eb", color: "#ffffff" }}
                                    >
                                      Reassign
                                    </button>
                                  </div>
                                  <span className="text-xs mt-0.5" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>
                                    {(d.itemSummary || d.item_summary)?.split(",").slice(0, 2).join(", ")}
                                    {(d.itemSummary || d.item_summary)?.includes(",") ? "..." : ""}
                                  </span>
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-block mt-1" style={{ color: isDark ? "#93c5fd" : "#1d4ed8", backgroundColor: isDark ? "rgba(59,130,246,0.12)" : "#eff6ff", width: "fit-content" }}>{statusLabel(d.status)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: isDark ? "#64748b" : "#9ca3af" }}>-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="px-3 py-1.5 text-xs font-bold rounded-full"
                            style={{
                              color: (!(rider.isActive ?? rider.is_active) || !(rider.isVerified ?? rider.is_verified)) ? (isDark ? "#fca5a5" : "#b91c1c") : (isDark ? "#86efac" : "#15803d"),
                              backgroundColor: (!(rider.isActive ?? rider.is_active) || !(rider.isVerified ?? rider.is_verified)) ? (isDark ? "rgba(248,113,113,0.12)" : "#fff1f2") : (isDark ? "rgba(34,197,94,0.12)" : "#f0fdf4"),
                            }}
                          >
                            {(!(rider.isActive ?? rider.is_active) || !(rider.isVerified ?? rider.is_verified)) ? "Unavailable" : statusLabel(rider.availability)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="no-print rounded-2xl overflow-hidden mt-4 shadow-sm" style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}` }}>
            <div className="px-6 py-5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>Vehicle Management</h2>
                <p className="text-sm mt-1" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>Add, edit, and assign vehicles to riders.</p>
              </div>
              <button type="button" onClick={openAddVehicle} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95" style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Vehicle
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: "920px" }}>
                <thead style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
                  <tr>
                    {["Plate", "Type", "Brand/Model", "Color", "Branch", "Assigned Rider", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isDark ? "#64748b" : "#6b7280" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vehicles.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState title="No vehicles found" subtitle="Add your first vehicle to start assigning it to riders." isDark={isDark} />
                      </td>
                    </tr>
                  ) : (
                    vehicles.map((vehicle) => {
                      const assignedRider = riders.find((r) => String(r.id) === String(vehicle.assignedRiderId) || String(r.id) === String(vehicle.assigned_rider_id));
                      return (
                        <tr key={vehicle.id} className="hover-row" style={{ borderBottom: `1px solid ${toolbarBdr}` }}>
                          <td className="px-6 py-4 text-sm font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>{vehicle.plateNumber || vehicle.plate_number || "-"}</td>
                          <td className="px-6 py-4 text-sm font-medium" style={{ color: isDark ? "#cbd5e1" : "#4b5563" }}>{statusLabel(vehicle.vehicleType || vehicle.vehicle_type)}</td>
                          <td className="px-6 py-4 text-sm font-medium" style={{ color: isDark ? "#cbd5e1" : "#4b5563" }}>{[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "-"}</td>
                          <td className="px-6 py-4 text-sm font-medium" style={{ color: isDark ? "#cbd5e1" : "#4b5563" }}>{vehicle.color || "-"}</td>
                          <td className="px-6 py-4 text-sm font-medium" style={{ color: isDark ? "#cbd5e1" : "#4b5563" }}>{vehicle.branch || "-"}</td>
                          <td className="px-6 py-4 text-sm font-medium" style={{ color: isDark ? "#cbd5e1" : "#4b5563" }}>
                            {assignedRider ? (
                              <span className="font-semibold">{assignedRider.name}</span>
                            ) : (
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) handleAssignVehicleRider(vehicle, e.target.value);
                                }}
                                className="px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:border-green-500 focus:outline-none transition-all shadow-sm"
                                style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
                              >
                                <option value="">Assign Rider</option>
                                {riderAccountOptions.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name} ({riderStatusText(r)})
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="px-3 py-1.5 text-xs font-bold rounded-full"
                              style={{
                                color: (vehicle.isActive ?? vehicle.is_active) ? (isDark ? "#86efac" : "#15803d") : (isDark ? "#fca5a5" : "#b91c1c"),
                                backgroundColor: (vehicle.isActive ?? vehicle.is_active) ? (isDark ? "rgba(34,197,94,0.12)" : "#f0fdf4") : (isDark ? "rgba(248,113,113,0.12)" : "#fff1f2"),
                              }}
                            >
                              {(vehicle.isActive ?? vehicle.is_active) ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => openEditVehicle(vehicle)} className="px-3 py-2 text-xs font-semibold border rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-slate-800" style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}>
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVehicle(vehicle.id)}
                                disabled={deletingVehicleId === vehicle.id || !!vehicle.assignedRiderId || !!vehicle.assigned_rider_id}
                                className="px-3 py-2 text-xs font-bold text-white rounded-lg transition-all disabled:opacity-50 hover:bg-red-700"
                                style={{ background: "#dc2626" }}
                              >
                                {deletingVehicleId === vehicle.id ? "Deleting" : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="no-print rounded-2xl overflow-hidden mt-4 shadow-sm" style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}` }}>
            <div className="px-6 py-5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>Active Dispatches</h2>
                <p className="text-sm mt-1" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>In-house delivery orders already assigned to riders.</p>
              </div>
              <span className="text-sm font-bold px-3 py-1.5 rounded-full" style={{ color: isDark ? "#bfdbfe" : "#1d4ed8", backgroundColor: isDark ? "rgba(59,130,246,0.12)" : "#eff6ff" }}>
                {deliveryOrders.length} active
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: "980px" }}>
                <thead style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
                  <tr>
                    {["Dispatch", "Rider", "Vehicle", "Branch", "Stops", "Status", "Orders"].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isDark ? "#64748b" : "#6b7280" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deliveryOrders.length === 0 ? (
                    <tr><td colSpan={7}><EmptyState title="No active dispatches" subtitle="Create a dispatch after orders are paid and ready for pickup." isDark={isDark} /></td></tr>
                  ) : deliveryOrders.map((dispatch) => (
                    <tr key={dispatch.id} className="hover-row" style={{ borderBottom: `1px solid ${toolbarBdr}` }}>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>{dispatch.deliveryOrderNumber || dispatch.delivery_order_number}</p>
                        {dispatch.notes ? <p className="text-xs mt-1" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>{dispatch.notes}</p> : null}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold" style={{ color: isDark ? "#cbd5e1" : "#374151" }}>{dispatch.riderName || dispatch.rider_name || "-"}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: isDark ? "#cbd5e1" : "#4b5563" }}>
                        {dispatch.vehiclePlateNumber || dispatch.vehicle_plate_number || "-"}
                        {(dispatch.vehicleType || dispatch.vehicle_type) ? <span className="text-xs ml-1.5" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>({statusLabel(dispatch.vehicleType || dispatch.vehicle_type)})</span> : null}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: isDark ? "#cbd5e1" : "#4b5563" }}>{dispatch.branch || "-"}</td>
                      <td className="px-6 py-4 text-sm font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>{dispatch.stopCount ?? dispatch.stop_count ?? dispatch.deliveries?.length ?? 0}</td>
                      <td className="px-6 py-4"><span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: isDark ? "#86efac" : "#15803d", backgroundColor: isDark ? "rgba(34,197,94,0.12)" : "#f0fdf4" }}>{statusLabel(dispatch.status)}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {(dispatch.deliveries || []).slice(0, 6).map((delivery) => (
                            <span key={delivery.id} className="text-[11px] font-bold px-2 py-1 rounded" style={{ color: isDark ? "#cbd5e1" : "#374151", backgroundColor: isDark ? "#334155" : "#f3f4f6" }}>{delivery.orderNumber || delivery.order_number}</span>
                          ))}
                          {(dispatch.deliveries || []).length > 6 ? <span className="text-[11px] font-bold px-2 py-1 rounded" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>+{(dispatch.deliveries || []).length - 6}</span> : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {showBulkAssignModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
              <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl transform transition-all" style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}` }}>
                <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
                  <h3 className="text-base font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>
                    Bulk Assign Orders <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs ml-1">{selectedOrders.size}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkAssignModal(false);
                      clearSelection();
                    }}
                    className="p-1 rounded-md transition-all hover:bg-gray-100 dark:hover:bg-slate-700"
                    style={{ color: inputTxt }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="p-6 flex flex-col gap-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Assign to Rider *</label>
                    <select
                      value={bulkRiderId}
                      onChange={(e) => {
                        const rId = e.target.value;
                        setBulkRiderId(rId);
                        const riderObj = riders.find(r => String(r.id) === String(rId));
                        const rVeh = getVehicleForRider(vehicles, riderObj);
                        if (rVeh) setBulkVehicleId(rVeh.id);
                        else setBulkVehicleId("");
                      }}
                      className="w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:border-green-500 focus:outline-none shadow-sm transition-all"
                      style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, outlineColor: "rgba(34,197,94,0.3)" }}
                    >
                      <option value="">Select rider</option>
                      {assignableRiders.map((rider) => (
                        <option key={rider.id} value={rider.id}>
                          {rider.name} ({rider.activeDeliveries ?? rider.active_deliveries ?? 0} active) - {rider.branch || "No branch"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Vehicle (Optional)</label>
                    <select
                      value={bulkVehicleId}
                      onChange={(e) => setBulkVehicleId(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:border-green-500 focus:outline-none shadow-sm transition-all"
                      style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, outlineColor: "rgba(34,197,94,0.3)" }}
                    >
                      <option value="">No vehicle</option>
                      {vehicles.filter((v) => v.isActive ?? v.is_active).map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.plateNumber || vehicle.plate_number} ({statusLabel(vehicle.vehicleType || vehicle.vehicle_type)})
                        </option>
                      ))}
                    </select>
                  </div>
                  {!bulkRiderId && (
                    <p className="text-xs font-medium" style={{ color: isDark ? "#fca5a5" : "#ef4444" }}>* Please select a rider before assigning.</p>
                  )}
                </div>
                <div className="px-6 py-5 flex items-center justify-end gap-3" style={{ borderTop: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkAssignModal(false);
                      clearSelection();
                    }}
                    className="px-5 py-2.5 text-sm font-semibold border rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-slate-800"
                    style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={bulkAssignOrders}
                    disabled={bulkAssigning || !bulkRiderId}
                    className="px-6 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                    style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}
                  >
                    {bulkAssigning ? "Assigning..." : `Assign ${selectedOrders.size} Order${selectedOrders.size === 1 ? "" : "s"}`}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="no-print rounded-2xl overflow-hidden mt-4 shadow-sm" style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}` }}>
            <div className="px-6 py-5 flex items-center justify-between gap-4 flex-wrap" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>Ready for Dispatch</h2>
                <p className="text-sm mt-1" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>Paid orders marked ready for pickup, waiting for dispatch.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={openDispatchModal}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95"
                  style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}
                >
                  Dispatch Orders
                </button>
                {selectedOrders.size > 0 && (
                  <>
                    <span className="text-sm font-bold px-3 py-1.5 rounded-full" style={{ color: isDark ? "#bfdbfe" : "#1d4ed8", backgroundColor: isDark ? "rgba(59,130,246,0.12)" : "#eff6ff" }}>
                      {selectedOrders.size} selected
                    </span>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="px-4 py-2.5 text-sm font-semibold border rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-slate-800"
                      style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
                    >
                      Clear
                    </button>
                  </>
                )}
                <span className="text-sm font-bold px-3 py-1.5 rounded-full" style={{ color: isDark ? "#bfdbfe" : "#1d4ed8", backgroundColor: isDark ? "rgba(59,130,246,0.12)" : "#eff6ff" }}>
                  {filteredOrders.length} pending
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: "980px" }}>
                <thead style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isDark ? "#64748b" : "#6b7280", width: "48px" }}>
                      <input
                        type="checkbox"
                        checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                      />
                    </th>
                    {["Order", "Recipient", "Branch", "Schedule", "Items"].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isDark ? "#64748b" : "#6b7280" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          title="No pending delivery orders"
                          subtitle="Paid delivery orders appear here after they are marked ready for pickup."
                          isDark={isDark}
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isSelected = selectedOrders.has(order.id);
                      return (
                        <tr
                          key={order.id}
                          className="hover-row transition-all"
                          style={{
                            borderBottom: `1px solid ${toolbarBdr}`,
                            backgroundColor: isSelected ? (isDark ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.04)") : "transparent",
                          }}
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleOrderSelection(order.id)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                            />
                          </td>

                          <td className="px-6 py-4">
                            <p className="text-sm font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>{order.orderNumber || order.order_number}</p>
                            <span className="text-xs px-2 py-0.5 mt-1 rounded inline-block font-semibold" style={{ color: isDark ? "#cbd5e1" : "#4b5563", backgroundColor: isDark ? "#334155" : "#f3f4f6" }}>{statusLabel(order.status)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>{order.recipientName || order.recipient_name || "Recipient"}</p>
                            <p className="text-xs font-medium mt-0.5" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>{order.recipientPhone || order.recipient_phone || "-"}</p>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium" style={{ color: isDark ? "#cbd5e1" : "#4b5563" }}>{order.branch || "-"}</td>
                          <td className="px-6 py-4 text-sm font-medium" style={{ color: isDark ? "#cbd5e1" : "#4b5563" }}>{formatDate(order.scheduledAt || order.scheduled_at)}</td>
                          <td className="px-6 py-4 text-sm font-medium" style={{ color: isDark ? "#cbd5e1" : "#4b5563", maxWidth: "420px" }}>{order.itemSummary || order.item_summary || "-"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          </div>

          <div className="print-only print-table">
            <h3>Delivery Riders</h3>
            <table>
              <thead>
                <tr>
                  <th>Rider</th>
                  <th>Branch</th>
                  <th>Active Orders</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRiders.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No riders listed.</td>
                  </tr>
                ) : (
                  filteredRiders.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.branch || "-"}</td>
                      <td>{r.activeDeliveries ?? r.active_deliveries ?? 0}</td>
                      <td>{statusLabel(r.availability)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="print-only print-table">
            <h3>Ready for Dispatch</h3>
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Recipient</th>
                  <th>Branch</th>
                  <th>Items</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState title="No pending delivery orders" subtitle="Paid delivery orders appear here after they are marked ready for pickup." isDark={isDark} />
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.id}>
                      <td>{o.orderNumber || o.order_number}</td>
                      <td>{o.recipientName || o.recipient_name}</td>
                      <td>{o.branch || "-"}</td>
                      <td>{o.itemSummary || o.item_summary || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

