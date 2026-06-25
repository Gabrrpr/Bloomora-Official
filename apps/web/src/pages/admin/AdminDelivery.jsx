import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { DG, G, GreenCard, WhiteCard } from "./_adminShared";
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

function PrintBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="no-print flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border rounded-lg transition-all hover:shadow-sm hover:bg-gray-50 active:scale-95"
      style={{ borderColor: "#dde3ec", color: "#374151", backgroundColor: "white" }}
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
    <div className="flex flex-col items-center justify-center py-16 text-center">
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

export default function AdminDeliveryFixed() {
  const { isDark } = useTheme();

  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ordersSort, setOrdersSort] = useState("");

  const [loading, setLoading] = useState(true);
  const [entered, setEntered] = useState(false);
  const [phText, setPhText] = useState("");

  const [riders, setRiders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);

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
      const orderQuery = `?branch=${encodeURIComponent(branchFilter)}&limit=100`;

      const [settingsData, ridersData, ordersData, vehiclesData] = await Promise.all([
        api.getCheckoutSettings().catch(() => ({})),
        api.get(`/deliveries/admin/riders${riderQuery}`),
        api.get(`/deliveries/admin/assignable-orders${orderQuery}`),
        api.getVehicles(branchFilter || null).catch(() => []),
      ]);

      const settings = settingsData.delivery || {};
      setDeliveryFee(String(settings.delivery_fee ?? 100));
      setMinOrder(String(settings.minimum_order ?? 0));
      setSameDayCutoff(settings.same_day_cutoff || "14:00");
      setRiders(Array.isArray(ridersData) ? ridersData : []);
      setPendingOrders(Array.isArray(ordersData) ? ordersData : []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
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
    if (loading) {
      setEntered(false);
      return;
    }
    const t = setTimeout(() => setEntered(true), 120);
    return () => clearTimeout(t);
  }, [loading]);

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
    () => riders.filter((r) => (r.isActive ?? r.is_active) && (r.isVerified ?? r.is_verified) && r.availability === "available"),
    [riders]
  );

  const assignableRiders = useMemo(
    () => riders.filter((r) => (r.isActive ?? r.is_active) && (r.isVerified ?? r.is_verified)),
    [riders]
  );

  const filteredRiders = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = riders.filter((r) => {
      const phone = r.phoneNumber || r.phone_number || "";
      const haystack = [r.name, r.email, phone, r.branch].filter(Boolean).join(" ").toLowerCase();
      const isActive = r.isActive ?? r.is_active;
      const isVerified = r.isVerified ?? r.is_verified;
      const status = !isActive ? "inactive" : !isVerified ? "unverified" : r.availability;
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

  const assignedDeliveries = riders.reduce((sum, rider) => sum + (Number(rider.activeDeliveries ?? rider.active_deliveries) || 0), 0);
  const inactiveRiders = riders.filter((r) => !(r.isActive ?? r.is_active) || !(r.isVerified ?? r.is_verified)).length;

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

  const assignOrder = async (order) => {
    const riderId = assignments[order.id];
    if (!riderId) return;

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

  const printDate = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
  const printTime = new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  const printScope = [
    branchFilter ? `Branch: ${branchFilter}` : "All branches",
    `${availableRiders.length} available rider${availableRiders.length === 1 ? "" : "s"}`,
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
    <div className="space-y-6">
      <style>{`
        .print-only { display: none; }
        @keyframes delivRise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .deliv-rise { animation: delivRise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
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

      <div className={`no-print flex items-center justify-between flex-wrap gap-4 ${entered ? "deliv-rise" : ""}`}>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>Delivery Operations</h1>
        <div className="flex items-center gap-3">
          <ExportDeliveryBtn riders={filteredRiders} orders={filteredOrders} isDark={isDark} />
          <PrintBtn onClick={() => window.print()} />
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <GreenCard label="Pending orders" sublabel="Needs rider" value={pendingOrders.length} sub="Ready to assign" />
        <WhiteCard label="Assigned deliveries" sublabel="Active rider load" value={assignedDeliveries} sub="Currently assigned" accentColor="#3b82f6" />
        <WhiteCard label="Available riders" sublabel="Verified and idle" value={availableRiders.length} sub={`${inactiveRiders} unavailable`} accentColor="#22c55e" />
        <WhiteCard label="Total riders" sublabel="Delivery accounts" value={riders.length} sub={branchFilter || "All branches"} accentColor="#f59e0b" />
      </div>

      <div className="no-print rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}` }}>
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
            <p className="label">Available Riders</p>
            <p className="value">{availableRiders.length}</p>
          </div>
          <div className="print-card">
            <p className="label">Assigned Deliveries</p>
            <p className="value">{assignedDeliveries}</p>
          </div>
        </div>

        <div className="no-print rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}` }}>
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

          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>Available Delivery Riders</h2>
                <p className="text-sm mt-1" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>Verified riders can receive pending delivery orders.</p>
              </div>
              <span className="text-sm font-bold px-3 py-1.5 rounded-full" style={{ color: isDark ? "#86efac" : DG, backgroundColor: isDark ? "rgba(34,197,94,0.12)" : "#f0fdf4" }}>
                {availableRiders.length} available
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

          <div className="no-print rounded-2xl overflow-hidden mt-6 shadow-sm" style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}` }}>
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
                                {assignableRiders.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
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

          <div className="no-print rounded-2xl overflow-hidden mt-6 shadow-sm" style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}` }}>
            <div className="px-6 py-5 flex items-center justify-between gap-4 flex-wrap" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>Pending Delivery Orders</h2>
                <p className="text-sm mt-1" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>Paid delivery orders that do not have a rider yet.</p>
              </div>
              <div className="flex items-center gap-3">
                {selectedOrders.size > 0 && (
                  <>
                    <span className="text-sm font-bold px-3 py-1.5 rounded-full" style={{ color: isDark ? "#bfdbfe" : "#1d4ed8", backgroundColor: isDark ? "rgba(59,130,246,0.12)" : "#eff6ff" }}>
                      {selectedOrders.size} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowBulkAssignModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95"
                      style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}
                    >
                      Bulk Assign
                    </button>
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
                    {["Order", "Recipient", "Branch", "Schedule", "Items", "Assign Rider", "Vehicle"].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isDark ? "#64748b" : "#6b7280" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState
                          title="No pending delivery orders"
                          subtitle="New paid delivery orders will appear here when they are ready for rider assignment."
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
                          <td className="px-6 py-4 text-sm font-medium" style={{ color: isDark ? "#cbd5e1" : "#4b5563", maxWidth: "320px" }}>{order.itemSummary || order.item_summary || "-"}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-2">
                              <select
                                value={assignments[order.id] || ""}
                                onChange={(e) => {
                                  const rId = e.target.value;
                                  setAssignments((current) => ({ ...current, [order.id]: rId }));
                                  
                                  const riderObj = riders.find(r => String(r.id) === String(rId));
                                  const riderVehicle = getVehicleForRider(vehicles, riderObj);
                                  if (riderVehicle) {
                                    setVehicleAssignments((current) => ({ ...current, [order.id]: riderVehicle.id }));
                                  } else {
                                     setVehicleAssignments((current) => {
                                       const next = {...current};
                                       delete next[order.id];
                                       return next;
                                     });
                                  }
                                }}
                                className="px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:border-green-500 focus:outline-none shadow-sm transition-all min-w-[180px]"
                                style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, outlineColor: "rgba(34,197,94,0.3)" }}
                              >
                                <option value="">Select rider</option>
                                {assignableRiders.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name} ({r.activeDeliveries ?? r.active_deliveries ?? 0} active)
                                  </option>
                                ))}
                              </select>

                              <select
                                value={vehicleAssignments[order.id] || ""}
                                onChange={(e) => setVehicleAssignments((current) => ({ ...current, [order.id]: e.target.value }))}
                                className="px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:border-green-500 focus:outline-none shadow-sm transition-all min-w-[180px]"
                                style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, outlineColor: "rgba(34,197,94,0.3)" }}
                              >
                                <option value="">Select vehicle</option>
                                {vehicles
                                  .filter((v) => v.isActive ?? v.is_active)
                                  .map((v) => (
                                    <option key={v.id} value={v.id}>
                                      {v.plateNumber || v.plate_number} ({v.vehicleType || v.vehicle_type})
                                    </option>
                                  ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => assignOrder(order)}
                                disabled={!assignments[order.id] || assigningOrder === order.id}
                                className="px-4 py-2 text-sm font-bold text-white rounded-lg transition-all hover:shadow-md active:scale-95 disabled:opacity-50 disabled:transform-none"
                                style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}
                              >
                                {assigningOrder === order.id ? "Assigning..." : "Assign Order"}
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

          <div className="print-only print-table">
            <h3>Available Riders</h3>
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
            <h3>Pending Delivery Orders</h3>
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
                      <EmptyState title="No pending delivery orders" subtitle="New paid delivery orders will appear here when they are ready for rider assignment." isDark={isDark} />
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