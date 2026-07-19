import { useCallback, useEffect, useMemo, useState } from "react";

import carAsset from "../../../assets/delivery/vehicles/car.webp";
import grabExpressLogo from "../../../assets/delivery/couriers/grabexpress.webp";
import jtExpressLogo from "../../../assets/delivery/couriers/jt-express.webp";
import lalamoveLogo from "../../../assets/delivery/couriers/lalamove.webp";
import lbcLogo from "../../../assets/delivery/couriers/lbc.webp";
import moveItLogo from "../../../assets/delivery/couriers/move-it.webp";
import motorcycleAsset from "../../../assets/delivery/vehicles/motorcycle.webp";
import truckAsset from "../../../assets/delivery/vehicles/truck.webp";
import vanAsset from "../../../assets/delivery/vehicles/van.webp";
import { useTheme } from "../../../context/ThemeContext";
import { api } from "../../../services/api";
import { DG, G } from "../_adminShared";
import DeliveryRouteMap from "./DeliveryRouteMap";

const BRANCHES = ["Pampanga", "Manila"];
const EXTERNAL_STATUSES = [
  "awaiting_booking",
  "booked",
  "picked_up",
  "in_transit",
  "delivered",
  "failed",
  "cancelled",
];
const PROVIDERS = [
  "standard",
  "lalamove",
  "grabexpress",
  "move_it",
  "lbc",
  "jt_express",
];
const PROVIDER_LOGOS = {
  lalamove: lalamoveLogo,
  grabexpress: grabExpressLogo,
  grab_express: grabExpressLogo,
  move_it: moveItLogo,
  lbc: lbcLogo,
  jt_express: jtExpressLogo,
};
const COURIER_PARTNERS = [
  ["lalamove", "Lalamove"],
  ["grabexpress", "GrabExpress"],
  ["move_it", "Move It"],
  ["lbc", "LBC"],
  ["jt_express", "J&T Express"],
];
const VEHICLE_ASSETS = {
  motorcycle: motorcycleAsset,
  car: carAsset,
  van: vanAsset,
  truck: truckAsset,
};
const DISPATCH_STEPS = [
  ["assigned", "Assigned"],
  ["picked_up", "Picked up"],
  ["in_transit", "On the way"],
  ["completed", "Completed"],
];
const EXTERNAL_STEPS = [
  ["awaiting_booking", "Pending"],
  ["booked", "Booked"],
  ["picked_up", "Picked up"],
  ["in_transit", "In transit"],
  ["delivered", "Delivered"],
];

const label = (value) =>
  String(value || "—")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
const errorMessage = (error, fallback) => error?.message || fallback;
const newIdempotencyKey = () =>
  globalThis.crypto?.randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const manilaDayNumber = (value) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(value);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  return Date.UTC(values.year, values.month - 1, values.day) / 86400000;
};

const deliveryDateMeta = (value) => {
  if (!value) {
    return {
      label: "No delivery date",
      badge: "Schedule needed",
      className:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
      rowClass: "border-l-slate-300",
    };
  }
  const deliveryDate = new Date(value);
  const days = manilaDayNumber(deliveryDate) - manilaDayNumber(new Date());
  if (days < 0) {
    const count = Math.abs(days);
    return {
      label: dateTime(value),
      badge: `${count} day${count === 1 ? "" : "s"} late`,
      className: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
      rowClass: "border-l-red-500",
    };
  }
  if (days === 0) {
    return {
      label: dateTime(value),
      badge: "Due today",
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
      rowClass: "border-l-amber-500",
    };
  }
  if (days === 1) {
    return {
      label: dateTime(value),
      badge: "Tomorrow",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
      rowClass: "border-l-blue-500",
    };
  }
  return {
    label: dateTime(value),
    badge: `In ${days} days`,
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    rowClass: "border-l-slate-300",
  };
};

function StatusBadge({ value, danger = false }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${danger ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"}`}
    >
      {label(value)}
    </span>
  );
}

function Panel({ title, description, action, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function MetricCard({ label: cardLabel, detail, value, accent, featured }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-5 shadow-sm ${
        featured
          ? "border-transparent text-emerald-50"
          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
      }`}
      style={
        featured
          ? { background: `linear-gradient(135deg, ${DG}, ${G})` }
          : { borderTop: `3px solid ${accent}` }
      }
    >
      <p
        className={`text-xs font-bold uppercase tracking-wide ${
          featured ? "text-emerald-100" : "text-slate-400"
        }`}
      >
        {cardLabel}
      </p>
      <p
        className={`mt-1 text-xs ${featured ? "text-emerald-100" : "text-slate-400"}`}
      >
        {detail}
      </p>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
    </div>
  );
}

function TrackingStepper({ status, external = false }) {
  const steps = external ? EXTERNAL_STEPS : DISPATCH_STEPS;
  const normalizedStatus =
    status === "out_for_delivery" ? "in_transit" : status;
  const currentIndex = steps.findIndex(([value]) => value === normalizedStatus);
  const interrupted = ["failed", "cancelled", "issue_reported"].includes(
    status,
  );

  return (
    <div className="mt-4" aria-label={`Tracking status: ${label(status)}`}>
      <div className="flex items-start">
        {steps.map(([value, text], index) => {
          const reached = currentIndex >= index && !interrupted;
          const current = currentIndex === index && !interrupted;
          return (
            <div
              key={value}
              className="flex min-w-0 flex-1 items-start last:flex-none"
            >
              <div className="flex min-w-[54px] flex-col items-center text-center">
                <span
                  className={`relative z-10 h-3.5 w-3.5 rounded-full border-2 ${
                    reached
                      ? "border-green-600 bg-green-600 ring-4 ring-green-100 dark:border-green-400 dark:bg-green-400 dark:ring-green-950"
                      : "border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800"
                  } ${current ? "scale-110" : ""}`}
                />
                <span
                  className={`mt-2 text-[10px] font-semibold leading-tight ${
                    reached
                      ? "text-slate-800 dark:text-slate-200"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {text}
                </span>
              </div>
              {index < steps.length - 1 && (
                <span
                  className={`mt-1.5 h-0.5 min-w-3 flex-1 ${
                    currentIndex > index && !interrupted
                      ? "bg-green-500"
                      : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      {interrupted && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
          Progress paused: {label(status)}
        </p>
      )}
    </div>
  );
}

function CourierLogo({ provider, name, className = "h-8 w-28" }) {
  const logo = PROVIDER_LOGOS[provider];
  return logo ? (
    <img
      src={logo}
      alt={`${name || label(provider)} logo`}
      className={`${className} object-contain object-center`}
    />
  ) : (
    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
      {name || label(provider)}
    </span>
  );
}

function CourierBrand({ provider, name, compact = false }) {
  const displayName = name || label(provider);
  return (
    <div
      className={`flex min-w-0 flex-col items-center justify-center ${
        compact ? "w-36" : "w-full"
      }`}
      title={displayName}
    >
      <div className="flex h-10 w-full items-center justify-center rounded-lg bg-white px-3 ring-1 ring-slate-200">
        <CourierLogo
          provider={provider}
          name={displayName}
          className="max-h-7 w-full max-w-28"
        />
      </div>
      <span className="mt-1.5 max-w-full truncate text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {displayName}
      </span>
    </div>
  );
}

function VehicleAsset({ type, className = "h-full w-full" }) {
  const vehicleType = String(type || "motorcycle").toLowerCase();
  const asset = VEHICLE_ASSETS[vehicleType] || motorcycleAsset;
  return (
    <img
      src={asset}
      alt={`${label(vehicleType)} side view`}
      className={className}
      draggable="false"
    />
  );
}

function DeliveryDate({ value }) {
  const meta = deliveryDateMeta(value);
  return (
    <div>
      <p className="font-semibold text-slate-800 dark:text-slate-200">
        {meta.label}
      </p>
      <span
        className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}
      >
        {meta.badge}
      </span>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-green-700 dark:bg-emerald-950/40 dark:text-green-300">
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="5" cy="12" r="2" />
          <circle cx="19" cy="6" r="2" />
          <circle cx="19" cy="18" r="2" />
          <path d="M7 12h4a4 4 0 0 0 4-4V6m0 12v-4a2 2 0 0 0-2-2h-2" />
        </svg>
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-800 dark:text-slate-200">
        {title}
      </h3>
      <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

function Alert({ tone = "error", children }) {
  const style =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
      : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200";
  return (
    <div
      role="alert"
      className={`rounded-xl border px-4 py-3 text-sm font-medium ${style}`}
    >
      {children}
    </div>
  );
}

function Modal({
  title,
  description,
  onClose,
  children,
  footer,
  wide = false,
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900 ${wide ? "max-w-5xl" : "max-w-xl"}`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            Close
          </button>
        </header>
        <div className="p-6">{children}</div>
        {footer && (
          <footer className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-700">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

export default function AdminDeliveryPage() {
  useTheme();
  const [activeTab, setActiveTab] = useState("dispatches");
  const [branch, setBranch] = useState("Pampanga");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [orders, setOrders] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [riders, setRiders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [externalShipments, setExternalShipments] = useState([]);
  const [branchSettings, setBranchSettings] = useState([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardError, setWizardError] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdDispatch, setCreatedDispatch] = useState(null);
  const [dispatchForm, setDispatchForm] = useState({
    riderId: "",
    vehicleId: "",
    notes: "",
    idempotencyKey: newIdempotencyKey(),
  });
  const [routePreview, setRoutePreview] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeModal, setRouteModal] = useState(null);
  const [editingShipment, setEditingShipment] = useState(null);
  const [shipmentDraft, setShipmentDraft] = useState({
    status: "awaiting_booking",
    external_reference: "",
    tracking_url: "",
    message: "",
  });
  const [shipmentError, setShipmentError] = useState("");
  const [savingShipment, setSavingShipment] = useState("");
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [reviewProvider, setReviewProvider] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [deliveryConfig, setDeliveryConfig] = useState({
    delivery_fee: "",
    minimum_order: "",
    same_day_cutoff: "14:00",
  });
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [configError, setConfigError] = useState("");
  const [settingDraft, setSettingDraft] = useState({
    pickupAddress: "",
    pickupLat: "",
    pickupLng: "",
  });
  const [savingSetting, setSavingSetting] = useState(false);
  const [settingSearch, setSettingSearch] = useState("");
  const [settingSearchResults, setSettingSearchResults] = useState([]);
  const [settingSearching, setSettingSearching] = useState(false);
  const [settingSearchError, setSettingSearchError] = useState("");
  const [vehicleDraft, setVehicleDraft] = useState({
    plate_number: "",
    vehicle_type: "motorcycle",
    brand: "",
    model: "",
    color: "",
    capacity: "",
  });
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleEditDraft, setVehicleEditDraft] = useState(null);
  const [vehicleEditError, setVehicleEditError] = useState("");
  const [savingVehicleEdit, setSavingVehicleEdit] = useState(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    setError("");
    try {
      const schema = await api.get("/deliveries/admin/schema-status");
      if (!schema.ready) {
        setOrders([]);
        setDispatches([]);
        setRiders([]);
        setVehicles([]);
        setExternalShipments([]);
        setBranchSettings([]);
        setError(
          schema.message ||
            "The delivery database update must be applied before this page can be used.",
        );
        setRefreshing(false);
        return;
      }
    } catch (schemaError) {
      setError(
        errorMessage(schemaError, "Unable to verify the delivery database."),
      );
      setRefreshing(false);
      return;
    }
    const query = `?branch=${encodeURIComponent(branch)}&limit=200`;
    const results = await Promise.allSettled([
      api.get(`/deliveries/admin/assignable-orders${query}`),
      api.get(`/deliveries/admin/delivery-orders${query}`),
      api.get(`/deliveries/admin/riders?branch=${encodeURIComponent(branch)}`),
      api.getVehicles(branch, null),
      api.get(`/deliveries/admin/external-shipments${query}`),
      api.get("/deliveries/admin/branch-settings"),
    ]);
    const values = results.map((result, index) =>
      result.status === "fulfilled" ? result.value : index === 5 ? [] : [],
    );
    setOrders(Array.isArray(values[0]) ? values[0] : []);
    setDispatches(Array.isArray(values[1]) ? values[1] : []);
    setRiders(Array.isArray(values[2]) ? values[2] : []);
    setVehicles(Array.isArray(values[3]) ? values[3] : []);
    setExternalShipments(Array.isArray(values[4]) ? values[4] : []);
    setBranchSettings(Array.isArray(values[5]) ? values[5] : []);
    const failed = [
      "orders",
      "dispatches",
      "riders",
      "vehicles",
      "external shipments",
      "branch settings",
    ].filter((_, index) => results[index].status === "rejected");
    if (failed.length)
      setError(
        `Could not load ${failed.join(", ")}. ${errorMessage(results.find((result) => result.status === "rejected")?.reason, "Try again.")}`,
      );
    setRefreshing(false);
  }, [branch]);

  const loadConfiguration = useCallback(async () => {
    setConfigError("");
    try {
      const settings = await api.getCheckoutSettings();
      const delivery = settings?.delivery || {};
      setDeliveryConfig({
        delivery_fee: delivery.delivery_fee ?? 0,
        minimum_order: delivery.minimum_order ?? 0,
        same_day_cutoff: delivery.same_day_cutoff || "14:00",
      });
    } catch (configurationError) {
      setConfigError(
        errorMessage(
          configurationError,
          "Unable to load delivery configuration.",
        ),
      );
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData().finally(() => {
      setLoading(false);
      setRefreshing(false);
    });
  }, [loadData]);
  useEffect(() => {
    void loadConfiguration();
  }, [loadConfiguration]);
  useEffect(() => {
    const setting = branchSettings.find(
      (item) => item.branch?.toLowerCase() === branch.toLowerCase(),
    );
    setSettingDraft({
      pickupAddress: setting?.pickupAddress || "",
      pickupLat: setting?.pickupLat ?? "",
      pickupLng: setting?.pickupLng ?? "",
    });
  }, [branch, branchSettings]);

  const selectedOrders = useMemo(
    () =>
      selectedOrderIds
        .map((id) => orders.find((order) => order.id === id))
        .filter(Boolean),
    [orders, selectedOrderIds],
  );
  const branchSetting = branchSettings.find(
    (item) => item.branch?.toLowerCase() === branch.toLowerCase(),
  );
  const dispatchableRiders = riders.filter(
    (rider) =>
      (rider.isActive ?? rider.is_active) &&
      (rider.isVerified ?? rider.is_verified) &&
      (rider.riderIsAvailable ?? rider.rider_is_available ?? true),
  );
  const activeVehicles = vehicles.filter(
    (vehicle) => vehicle.isActive ?? vehicle.is_active,
  );

  const toggleOrder = (order) => {
    if (!order.dispatchEligible) {
      setError(
        order.blockingReasons?.join(" ") ||
          "This order is not eligible for in-house dispatch.",
      );
      return;
    }
    setSelectedOrderIds((current) =>
      current.includes(order.id)
        ? current.filter((id) => id !== order.id)
        : [...current, order.id],
    );
  };

  const openWizard = () => {
    setWizardError("");
    setCreatedDispatch(null);
    setWizardStep(1);
    setDispatchForm({
      riderId: "",
      vehicleId: "",
      notes: "",
      idempotencyKey: newIdempotencyKey(),
    });
    setWizardOpen(true);
  };

  const continueWizard = async () => {
    if (!selectedOrderIds.length)
      return setWizardError(
        "Select at least one eligible standard-delivery order.",
      );
    if (!branchSetting?.isVerified)
      return setWizardError(
        `Set the ${branch} delivery origin in Delivery Settings first.`,
      );
    setWizardError("");
    setWizardStep(2);
    setRouteLoading(true);
    try {
      setRoutePreview(
        await api.post("/deliveries/admin/routes/preview", {
          branch,
          order_ids: selectedOrderIds,
        }),
      );
    } catch (routeError) {
      setRoutePreview({
        available: false,
        markers: [],
        availabilityReason: errorMessage(
          routeError,
          "Route preview is unavailable.",
        ),
      });
    } finally {
      setRouteLoading(false);
    }
  };

  const createDispatch = async () => {
    if (!dispatchForm.riderId)
      return setWizardError("Select an available rider.");
    setCreating(true);
    setWizardError("");
    try {
      const response = await api.post("/deliveries/admin/delivery-orders", {
        branch,
        rider_id: dispatchForm.riderId,
        vehicle_id: dispatchForm.vehicleId,
        notes: dispatchForm.notes,
        order_ids: selectedOrderIds,
        idempotency_key: dispatchForm.idempotencyKey,
      });
      setCreatedDispatch(response);
      setWizardStep(3);
      setSelectedOrderIds([]);
      setSuccess(
        `${response.deliveryOrderNumber} was created and sent to ${response.riderName}.`,
      );
      await loadData();
    } catch (createError) {
      setWizardError(
        errorMessage(createError, "Unable to create the dispatch."),
      );
    } finally {
      setCreating(false);
    }
  };

  const moveSelectedOrder = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= selectedOrderIds.length) return;
    setSelectedOrderIds((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const openOrderReview = (order) => {
    setReviewingOrder(order);
    setReviewProvider("");
    setReviewError("");
  };

  const saveOrderReview = async () => {
    if (!reviewProvider) {
      setReviewError("Select the delivery method confirmed for this order.");
      return;
    }
    setSavingReview(true);
    setReviewError("");
    try {
      await api.patch(
        `/deliveries/admin/orders/${reviewingOrder.id}/delivery-method`,
        {
          provider: reviewProvider,
        },
      );
      setSuccess(
        `${reviewingOrder.orderNumber} is now classified as ${label(reviewProvider)}.`,
      );
      setReviewingOrder(null);
      await loadData();
    } catch (classificationError) {
      setReviewError(
        errorMessage(
          classificationError,
          "Unable to update the delivery method.",
        ),
      );
    } finally {
      setSavingReview(false);
    }
  };

  const showDispatchRoute = async (dispatch) => {
    setRouteModal({ dispatch, loading: true, preview: null, error: "" });
    try {
      const preview = await api.get(
        `/deliveries/admin/delivery-orders/${dispatch.id}/route`,
      );
      setRouteModal({ dispatch, loading: false, preview, error: "" });
    } catch (routeError) {
      setRouteModal({
        dispatch,
        loading: false,
        preview: null,
        error: errorMessage(routeError, "Unable to load route."),
      });
    }
  };

  const resolveIssue = async (delivery) => {
    const resolution = window.prompt("Describe how this issue was resolved:");
    if (!resolution?.trim()) return;
    try {
      await api.patch(
        `/deliveries/admin/deliveries/${delivery.id}/resolve-issue`,
        { resolution_note: resolution.trim() },
      );
      setSuccess(`${delivery.orderNumber} can continue its delivery workflow.`);
      await loadData();
    } catch (issueError) {
      setError(errorMessage(issueError, "Unable to resolve the issue."));
    }
  };

  const openShipmentEditor = (shipment) => {
    setEditingShipment(shipment);
    setShipmentDraft({
      status: shipment.status || "awaiting_booking",
      external_reference: shipment.externalReference || "",
      tracking_url: shipment.trackingUrl || "",
      message: "",
    });
    setShipmentError("");
  };

  const saveShipment = async () => {
    if (!editingShipment || editingShipment.provider === "lalamove") return;
    setSavingShipment(editingShipment.id);
    setShipmentError("");
    try {
      await api.patch(
        `/deliveries/admin/external-shipments/${editingShipment.id}`,
        {
          ...shipmentDraft,
        },
      );
      setSuccess(`${editingShipment.providerName} tracking was updated.`);
      setEditingShipment(null);
      await loadData();
    } catch (shipmentError) {
      setShipmentError(
        errorMessage(shipmentError, "Unable to update external tracking."),
      );
    } finally {
      setSavingShipment("");
    }
  };

  const saveConfiguration = async () => {
    setConfigSaving(true);
    setConfigSaved(false);
    setConfigError("");
    try {
      const response = await api.updateDeliverySettings({
        delivery_fee: Math.max(0, Number(deliveryConfig.delivery_fee) || 0),
        minimum_order: Math.max(0, Number(deliveryConfig.minimum_order) || 0),
        same_day_cutoff: deliveryConfig.same_day_cutoff || "14:00",
        timezone: "Asia/Manila",
      });
      const delivery = response?.delivery || deliveryConfig;
      setDeliveryConfig({
        delivery_fee: delivery.delivery_fee ?? 0,
        minimum_order: delivery.minimum_order ?? 0,
        same_day_cutoff: delivery.same_day_cutoff || "14:00",
      });
      setConfigSaved(true);
      setSuccess("Delivery fee, minimum order, and cutoff were saved.");
      window.setTimeout(() => setConfigSaved(false), 2500);
    } catch (configurationError) {
      setConfigError(
        errorMessage(
          configurationError,
          "Unable to save delivery configuration.",
        ),
      );
    } finally {
      setConfigSaving(false);
    }
  };

  const saveBranchSetting = async () => {
    setSavingSetting(true);
    try {
      await api.put(
        `/deliveries/admin/branch-settings/${encodeURIComponent(branch)}`,
        settingDraft,
      );
      setSuccess(`${branch} delivery origin was saved.`);
      await loadData();
    } catch (settingError) {
      setError(errorMessage(settingError, "Unable to save branch settings."));
    } finally {
      setSavingSetting(false);
    }
  };

  const searchBranchLocation = async (event) => {
    event.preventDefault();
    const query = settingSearch.trim();
    if (query.length < 5) {
      setSettingSearchError("Enter at least 5 characters to search.");
      setSettingSearchResults([]);
      return;
    }
    setSettingSearching(true);
    setSettingSearchError("");
    try {
      const response = await api.geocodeAddress(query);
      const results = Array.isArray(response?.results)
        ? response.results.slice(0, 5)
        : [];
      setSettingSearchResults(results);
      if (!results.length) {
        setSettingSearchError(
          "No matching location found. Add a street, barangay, city, or province.",
        );
      }
    } catch (searchError) {
      setSettingSearchResults([]);
      setSettingSearchError(
        errorMessage(searchError, "Location search is temporarily unavailable."),
      );
    } finally {
      setSettingSearching(false);
    }
  };

  const selectBranchLocation = (result) => {
    setSettingDraft((current) => ({
      ...current,
      pickupAddress: result.label || settingSearch.trim(),
      pickupLat: Number(result.lat).toFixed(7),
      pickupLng: Number(result.lng).toFixed(7),
    }));
    setSettingSearch(result.label || settingSearch.trim());
    setSettingSearchResults([]);
    setSettingSearchError("");
  };

  const addVehicle = async (event) => {
    event.preventDefault();
    setSavingVehicle(true);
    try {
      await api.post("/deliveries/vehicles", {
        ...vehicleDraft,
        branch,
        is_active: true,
      });
      setVehicleDraft({
        plate_number: "",
        vehicle_type: "motorcycle",
        brand: "",
        model: "",
        color: "",
        capacity: "",
      });
      setSuccess("Vehicle added successfully.");
      await loadData();
    } catch (vehicleError) {
      setError(errorMessage(vehicleError, "Unable to add vehicle."));
    } finally {
      setSavingVehicle(false);
    }
  };

  const openVehicleEditor = (vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleEditDraft({
      plate_number: vehicle.plateNumber || "",
      vehicle_type: vehicle.vehicleType || "motorcycle",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      color: vehicle.color || "",
      capacity: vehicle.capacity || "",
      assigned_rider_id: vehicle.assignedRiderId || "",
      is_active: vehicle.isActive ?? vehicle.is_active ?? true,
    });
    setVehicleEditError("");
  };

  const saveVehicleEdit = async (event) => {
    event.preventDefault();
    if (!editingVehicle || !vehicleEditDraft) return;
    setSavingVehicleEdit(true);
    setVehicleEditError("");
    try {
      await api.put(`/deliveries/vehicles/${editingVehicle.id}`, {
        ...vehicleEditDraft,
        branch,
      });
      setSuccess(`${vehicleEditDraft.plate_number.toUpperCase()} was updated.`);
      setEditingVehicle(null);
      setVehicleEditDraft(null);
      await loadData();
    } catch (vehicleError) {
      setVehicleEditError(
        errorMessage(vehicleError, "Unable to update the vehicle."),
      );
    } finally {
      setSavingVehicleEdit(false);
    }
  };

  const deleteVehicle = async (vehicle) => {
    if (
      !window.confirm(
        `Remove ${vehicle.plateNumber}? This is allowed only when it has no active deliveries.`,
      )
    )
      return;
    try {
      await api.delete(`/deliveries/vehicles/${vehicle.id}`);
      setSuccess(`${vehicle.plateNumber} was removed.`);
      setEditingVehicle(null);
      setVehicleEditDraft(null);
      await loadData();
    } catch (vehicleError) {
      setError(errorMessage(vehicleError, "Unable to remove the vehicle."));
    }
  };

  const tabs = [
    ["dispatches", "In-house Dispatches", dispatches.length],
    ["external", "External Shipments", externalShipments.length],
    ["fleet", "Riders & Vehicles", riders.length],
    [
      "settings",
      "Delivery Settings",
      branchSetting?.isVerified ? "Ready" : "Action needed",
    ],
  ];

  return (
    <div className="delivery-page space-y-5 text-slate-800 dark:text-slate-100">
      <style>{`
        .delivery-primary,
        .delivery-page .bg-emerald-700 { background: linear-gradient(135deg, ${DG}, ${G}) !important; }
        .delivery-primary:hover,
        .delivery-page .bg-emerald-700:hover { background: linear-gradient(135deg, ${DG}, ${DG}) !important; }
        .delivery-gradient { background: linear-gradient(135deg, ${DG}, ${G}) !important; }
        .dark .delivery-page button.border:not(.border-red-200) {
          background-color: #1e293b;
          border-color: #475569;
          color: #e2e8f0;
        }
        .dark .delivery-page button.border:not(.border-red-200):hover {
          background-color: #334155;
        }
        .dark .delivery-page input,
        .dark .delivery-page select,
        .dark .delivery-page textarea {
          color: #e2e8f0;
        }
        .dark .delivery-page input::placeholder,
        .dark .delivery-page textarea::placeholder {
          color: #94a3b8;
        }
      `}</style>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
          Delivery Operations
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={refreshing}
            className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold transition-all hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 disabled:opacity-60"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {error && <Alert>{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          featured
          label="Ready for dispatch"
          detail="Paid standard-delivery orders"
          value={orders.filter((order) => order.dispatchEligible).length}
        />
        <MetricCard
          label="Active dispatches"
          detail="In-house routes"
          value={dispatches.length}
          accent="#3b82f6"
        />
        <MetricCard
          label="Available riders"
          detail="Online and ready"
          value={dispatchableRiders.length}
          accent="#22c55e"
        />
        <MetricCard
          label="Assigned stops"
          detail={`Active rider load · ${branch}`}
          value={dispatches.reduce(
            (total, dispatch) => total + Number(dispatch.stopCount || 0),
            0,
          )}
          accent="#f59e0b"
        />
      </div>

      <Panel
        title="Delivery Configuration"
        description="Manage fees, minimums, cutoff time, and the branch shown below."
        action={
          <button
            type="button"
            onClick={saveConfiguration}
            disabled={configLoading || configSaving}
            className="delivery-gradient rounded-lg px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:opacity-60"
          >
            {configSaving
              ? "Saving…"
              : configSaved
                ? "Saved Successfully"
                : "Save Changes"}
          </button>
        }
      >
        <div className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Delivery Fee (PHP)
            <input
              type="number"
              min="0"
              value={deliveryConfig.delivery_fee}
              onChange={(event) =>
                setDeliveryConfig((current) => ({
                  ...current,
                  delivery_fee: event.target.value,
                }))
              }
              disabled={configLoading}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Minimum Order (PHP)
            <input
              type="number"
              min="0"
              value={deliveryConfig.minimum_order}
              onChange={(event) =>
                setDeliveryConfig((current) => ({
                  ...current,
                  minimum_order: event.target.value,
                }))
              }
              disabled={configLoading}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Same-Day Cutoff
            <input
              type="time"
              value={deliveryConfig.same_day_cutoff}
              onChange={(event) =>
                setDeliveryConfig((current) => ({
                  ...current,
                  same_day_cutoff: event.target.value,
                }))
              }
              disabled={configLoading}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:[color-scheme:dark]"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Branch Filter
            <select
              value={branch}
              onChange={(event) => {
                setBranch(event.target.value);
                setSelectedOrderIds([]);
              }}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              {BRANCHES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        {configError && (
          <div className="px-5 pb-5">
            <Alert>{configError}</Alert>
          </div>
        )}
      </Panel>

      <nav
        className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900"
        aria-label="Delivery sections"
      >
        {tabs.map(([id, text, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-bold transition-all active:scale-95 ${activeTab === id ? "delivery-primary text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
          >
            {text}
            <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs">
              {count}
            </span>
          </button>
        ))}
      </nav>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900">
          Loading delivery operations…
        </div>
      ) : null}

      {!loading && activeTab === "dispatches" && (
        <div className="space-y-5">
          <Panel
            title="Orders awaiting delivery planning"
            description="Customer pins are captured at checkout. Only eligible standard orders can be selected."
            action={
              <button
                type="button"
                onClick={openWizard}
                className="delivery-primary rounded-md px-4 py-2 text-sm font-bold text-white transition-all active:scale-95"
              >
                Create in-house dispatch{" "}
                {selectedOrderIds.length ? `(${selectedOrderIds.length})` : ""}
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/60">
                  <tr>
                    {[
                      "Select",
                      "Order",
                      "Recipient",
                      "Method",
                      "Destination pin",
                      "Schedule",
                      "Action",
                    ].map((text) => (
                      <th key={text} className="px-5 py-3">
                        {text}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const schedule = deliveryDateMeta(order.scheduledAt);
                    return (
                      <tr
                        key={order.id}
                        className={`border-l-4 border-t border-slate-100 dark:border-t-slate-800 ${schedule.rowClass}`}
                      >
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.includes(order.id)}
                            disabled={!order.dispatchEligible}
                            onChange={() => toggleOrder(order)}
                            className="h-4 w-4"
                            aria-label={`Select ${order.orderNumber}`}
                          />
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">
                          {order.orderNumber}
                          <p className="mt-1 text-xs font-normal text-slate-500">
                            {label(order.status)}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          {order.recipientName}
                          <p className="text-xs text-slate-500">
                            {order.recipientPhone}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge
                            value={order.deliveryMode}
                            danger={!order.dispatchEligible}
                          />
                          <p className="mt-2 max-w-xs text-xs text-slate-500">
                            {order.blockingReasons?.join(" ")}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge
                            value={
                              order.deliveryMode === "external"
                                ? "managed by courier"
                                : order.destinationPinVerified
                                  ? "customer pin confirmed"
                                  : "customer pin missing"
                            }
                            danger={
                              order.deliveryMode !== "external" &&
                              !order.destinationPinVerified
                            }
                          />
                        </td>
                        <td className="px-5 py-4">
                          <DeliveryDate value={order.scheduledAt} />
                        </td>
                        <td className="px-5 py-4">
                          {order.deliveryMode === "needs_review" ? (
                            <button
                              type="button"
                              onClick={() => openOrderReview(order)}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                            >
                              Review method
                            </button>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!orders.length && (
                <p className="p-8 text-center text-slate-500">
                  No paid delivery orders are waiting for planning in this
                  branch.
                </p>
              )}
            </div>
          </Panel>
          <Panel
            title="Active dispatches"
            description="Route progress and rider exceptions are managed here."
          >
            <div className="grid gap-4 p-5 lg:grid-cols-2">
              {dispatches.map((dispatch) => (
                <article
                  key={dispatch.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 dark:border-slate-700 dark:bg-slate-800/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-800 dark:text-slate-200">
                          {dispatch.deliveryOrderNumber}
                        </h3>
                        <StatusBadge value={dispatch.status} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {dispatch.riderName} ·{" "}
                        {dispatch.vehiclePlateNumber || "No vehicle"} ·{" "}
                        {dispatch.stopCount} stops
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => showDispatchRoute(dispatch)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-600"
                    >
                      View route
                    </button>
                  </div>
                  <TrackingStepper status={dispatch.status} />
                  <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {dispatch.deliveries?.map((delivery) => (
                      <div
                        key={delivery.id}
                        className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold">
                            {delivery.stopSequence}. {delivery.orderNumber}
                          </p>
                          <StatusBadge
                            value={delivery.status}
                            danger={["failed", "issue_reported"].includes(
                              delivery.status,
                            )}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {delivery.recipientName} · {delivery.address}
                        </p>
                        {delivery.status === "issue_reported" && (
                          <button
                            type="button"
                            onClick={() => resolveIssue(delivery)}
                            className="mt-3 rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white"
                          >
                            Resolve issue
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            {!dispatches.length && (
              <EmptyState
                title="No dispatch available"
                description={`There is no active in-house dispatch for ${branch}. Select ready orders above to create one.`}
              />
            )}
          </Panel>
        </div>
      )}

      {!loading && activeTab === "external" && (
        <Panel
          title="External shipments"
          description="Lalamove updates automatically. Other couriers can be updated from a focused edit window when their provider portal changes."
        >
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Connected courier partners
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {COURIER_PARTNERS.map(([provider, name]) => (
                <div
                  key={provider}
                  className="flex h-24 min-w-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/70"
                >
                  <CourierBrand provider={provider} name={name} />
                </div>
              ))}
            </div>
          </div>
          {externalShipments.length ? (
            <div className="grid gap-4 p-5 md:grid-cols-2 2xl:grid-cols-3">
              {externalShipments.map((shipment) => {
                const automatic = shipment.provider === "lalamove";
                return (
                  <article
                    key={shipment.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <CourierBrand
                        provider={shipment.provider}
                        name={shipment.providerName}
                        compact
                      />
                      <StatusBadge
                        value={shipment.status}
                        danger={["failed", "cancelled"].includes(
                          shipment.status,
                        )}
                      />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Order</p>
                        <p className="mt-1 font-bold text-slate-800 dark:text-slate-200">
                          {shipment.orderId?.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">
                          Courier reference
                        </p>
                        <p className="mt-1 font-semibold text-slate-700 dark:text-slate-300">
                          {shipment.externalReference || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Update source</p>
                        <p className="mt-1 font-semibold text-slate-700 dark:text-slate-300">
                          {automatic ? "Automatic webhook" : "Provider portal"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Last update</p>
                        <p className="mt-1 font-semibold text-slate-700 dark:text-slate-300">
                          {dateTime(shipment.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <TrackingStepper status={shipment.status} external />
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
                      <p className="text-xs text-slate-500">
                        {automatic
                          ? "Managed by Lalamove"
                          : "Update from official portal"}
                      </p>
                      <div className="flex items-center gap-3">
                        {shipment.trackingUrl && (
                          <a
                            href={shipment.trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-bold text-green-700 hover:underline dark:text-green-400"
                          >
                            Track
                          </a>
                        )}
                        {!automatic && (
                          <button
                            type="button"
                            onClick={() => openShipmentEditor(shipment)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No external shipments available"
              description={`Third-party deliveries for ${branch} will appear here automatically after checkout or courier booking.`}
            />
          )}
        </Panel>
      )}

      {!loading && activeTab === "fleet" && (
        <div className="space-y-5">
          <Panel
            title="Delivery riders"
            description="Only active, verified, online riders can receive a dispatch."
          >
            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
              {riders.map((rider) => (
                <article
                  key={rider.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-700 text-sm font-bold text-white">
                      {String(rider.name || "Rider")
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-800 dark:text-slate-200">
                        {rider.name}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {rider.phoneNumber || rider.email}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge
                      value={rider.availability}
                      danger={!(rider.riderIsAvailable ?? true)}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      {rider.activeDeliveries || 0} active stops
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </Panel>
          <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
            <Panel
              title="Add vehicle"
              description={`Register a vehicle for ${branch}.`}
            >
              <form
                onSubmit={addVehicle}
                className="grid gap-3 p-5 sm:grid-cols-2"
              >
                <div className="relative col-span-full h-44 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                  <span className="absolute left-3 top-3 z-10 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    {label(vehicleDraft.vehicle_type)} preview
                  </span>
                  <VehicleAsset
                    type={vehicleDraft.vehicle_type}
                    className="absolute inset-x-2 bottom-3 h-36 w-[calc(100%_-_1rem)] object-contain"
                  />
                </div>
                {[
                  ["plate_number", "Plate number"],
                  ["brand", "Brand"],
                  ["model", "Model"],
                  ["color", "Color"],
                  ["capacity", "Capacity"],
                ].map(([name, placeholder]) => (
                  <input
                    key={name}
                    required={name === "plate_number"}
                    value={vehicleDraft[name]}
                    onChange={(event) =>
                      setVehicleDraft((current) => ({
                        ...current,
                        [name]: event.target.value,
                      }))
                    }
                    placeholder={placeholder}
                    className="rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800"
                  />
                ))}
                <select
                  value={vehicleDraft.vehicle_type}
                  onChange={(event) =>
                    setVehicleDraft((current) => ({
                      ...current,
                      vehicle_type: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800"
                >
                  <option value="motorcycle">Motorcycle</option>
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                  <option value="truck">Truck</option>
                </select>
                <button
                  disabled={savingVehicle}
                  className="rounded-xl bg-emerald-700 px-4 py-2.5 font-bold text-white disabled:opacity-50"
                >
                  {savingVehicle ? "Adding…" : "Add vehicle"}
                </button>
              </form>
            </Panel>
            <Panel
              title="Registered vehicles"
              description="Visual fleet cards make vehicle type, rider assignment, and availability easy to scan."
            >
              <div className="grid gap-5 p-5 md:grid-cols-2 2xl:grid-cols-3">
                {vehicles.map((vehicle) => (
                  <button
                    type="button"
                    key={vehicle.id}
                    onClick={() => openVehicleEditor(vehicle)}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition-colors hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-700"
                    aria-label={`View or edit ${vehicle.plateNumber}`}
                  >
                    <div className="relative h-44 overflow-hidden border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                      <span className="absolute left-3 top-3 z-10 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                        {label(vehicle.vehicleType)}
                      </span>
                      <div className="absolute right-3 top-3 z-10">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                            (vehicle.isActive ?? vehicle.is_active)
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${(vehicle.isActive ?? vehicle.is_active) ? "bg-emerald-500" : "bg-slate-400"}`}
                          />
                          {(vehicle.isActive ?? vehicle.is_active)
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>
                      <VehicleAsset
                        type={vehicle.vehicleType}
                        className="absolute inset-x-2 bottom-3 h-36 w-[calc(100%_-_1rem)] object-contain"
                      />
                    </div>
                    <div className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-lg font-extrabold tracking-wide text-slate-800 dark:text-slate-200">
                            {vehicle.plateNumber}
                          </p>
                          <p className="mt-0.5 truncate text-sm font-semibold text-slate-600 dark:text-slate-300">
                            {[vehicle.brand, vehicle.model]
                              .filter(Boolean)
                              .join(" ") || "Model not provided"}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {vehicle.capacity
                            ? `${vehicle.capacity} capacity`
                            : branch}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                          {vehicle.color || "Color not set"}
                        </span>
                        <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                          {branch} fleet
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3 text-xs dark:border-slate-700">
                        <span className="truncate font-semibold text-slate-500 dark:text-slate-400">
                          {riders.find(
                            (rider) =>
                              String(rider.id) ===
                              String(vehicle.assignedRiderId || ""),
                          )?.name || "No rider assigned"}
                        </span>
                        <span className="shrink-0 font-bold text-emerald-700 dark:text-emerald-300">
                          View / Edit
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {!loading && activeTab === "settings" && (
        <Panel
          title={`${branch} delivery origin`}
          description="Set the store pickup point used for dispatch routes."
        >
          <div className="grid gap-5 p-5 lg:grid-cols-[380px_1fr]">
            <div className="space-y-3">
              <form onSubmit={searchBranchLocation} className="space-y-2">
                <label className="block text-sm font-bold">
                  Search for the branch location
                  <div className="mt-1 flex gap-2">
                    <input
                      value={settingSearch}
                      onChange={(event) => {
                        setSettingSearch(event.target.value);
                        setSettingSearchError("");
                      }}
                      placeholder="Street, barangay, city, or landmark"
                      className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800"
                    />
                    <button
                      type="submit"
                      disabled={settingSearching}
                      className="delivery-gradient rounded-xl px-4 py-2.5 font-bold text-white disabled:opacity-50"
                    >
                      {settingSearching ? "Searching…" : "Search"}
                    </button>
                  </div>
                </label>
                {settingSearchError && (
                  <p className="text-xs font-medium text-red-600 dark:text-red-300">
                    {settingSearchError}
                  </p>
                )}
                {settingSearchResults.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    {settingSearchResults.map((result, index) => (
                      <button
                        type="button"
                        key={`${result.place_id || result.label}-${index}`}
                        onClick={() => selectBranchLocation(result)}
                        className="block w-full border-b border-slate-100 px-3 py-2.5 text-left text-sm last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                      >
                        <span className="block font-semibold text-slate-700 dark:text-slate-200">
                          {result.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {Number(result.lat).toFixed(5)}, {Number(result.lng).toFixed(5)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </form>
              <label className="block text-sm font-bold">
                Pickup address
                <input
                  value={settingDraft.pickupAddress}
                  onChange={(event) =>
                    setSettingDraft((current) => ({
                      ...current,
                      pickupAddress: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-bold">
                  Latitude
                  <input
                    value={settingDraft.pickupLat}
                    onChange={(event) =>
                      setSettingDraft((current) => ({
                        ...current,
                        pickupLat: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800"
                  />
                </label>
                <label className="text-sm font-bold">
                  Longitude
                  <input
                    value={settingDraft.pickupLng}
                    onChange={(event) =>
                      setSettingDraft((current) => ({
                        ...current,
                        pickupLng: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800"
                  />
                </label>
              </div>
              <p className="text-xs text-slate-500">
                Click the map to position the branch marker, then save the
                delivery origin.
              </p>
              <button
                type="button"
                onClick={saveBranchSetting}
                disabled={savingSetting}
                className="delivery-gradient w-full rounded-xl px-4 py-3 font-bold text-white shadow-sm disabled:opacity-50"
              >
                {savingSetting ? "Saving…" : "Save delivery origin"}
              </button>
            </div>
            <DeliveryRouteMap
              height={430}
              markers={
                Number(settingDraft.pickupLat) && Number(settingDraft.pickupLng)
                  ? [
                      {
                        type: "origin",
                        label: `${branch} branch`,
                        latitude: Number(settingDraft.pickupLat),
                        longitude: Number(settingDraft.pickupLng),
                      },
                    ]
                  : []
              }
              onMapClick={({ latitude, longitude }) =>
                setSettingDraft((current) => ({
                  ...current,
                  pickupLat: latitude.toFixed(7),
                  pickupLng: longitude.toFixed(7),
                }))
              }
            />
          </div>
        </Panel>
      )}

      {editingVehicle && vehicleEditDraft && (
        <Modal
          title={editingVehicle.plateNumber}
          description="Review the vehicle first, then choose Edit details only when a change is needed."
          onClose={() => !savingVehicleEdit && setEditingVehicle(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => void deleteVehicle(editingVehicle)}
                disabled={savingVehicleEdit}
                className="mr-auto rounded-xl border border-red-200 px-4 py-2.5 font-bold text-red-700 disabled:opacity-50 dark:border-red-900 dark:text-red-300"
              >
                Remove vehicle
              </button>
              <button
                type="button"
                onClick={() => setEditingVehicle(null)}
                disabled={savingVehicleEdit}
                className="rounded-xl border border-slate-300 px-4 py-2.5 font-bold dark:border-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="vehicle-edit-form"
                disabled={savingVehicleEdit}
                className="delivery-gradient rounded-xl px-5 py-2.5 font-bold text-white disabled:opacity-50"
              >
                {savingVehicleEdit ? "Saving…" : "Save changes"}
              </button>
            </>
          }
        >
          <form
            id="vehicle-edit-form"
            onSubmit={saveVehicleEdit}
            className="space-y-5"
          >
            {vehicleEditError && <Alert>{vehicleEditError}</Alert>}
            <div className="relative h-48 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <span className="absolute left-4 top-4 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                {label(vehicleEditDraft.vehicle_type)}
              </span>
              <VehicleAsset
                type={vehicleEditDraft.vehicle_type}
                className="absolute inset-x-4 bottom-3 h-40 w-[calc(100%_-_2rem)] object-contain"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["plate_number", "Plate number", true],
                ["brand", "Brand"],
                ["model", "Model"],
                ["color", "Color"],
                ["capacity", "Capacity"],
              ].map(([name, text, required]) => (
                <label key={name} className="text-sm font-bold">
                  {text}
                  <input
                    required={required}
                    value={vehicleEditDraft[name]}
                    onChange={(event) =>
                      setVehicleEditDraft((current) => ({
                        ...current,
                        [name]: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800"
                  />
                </label>
              ))}
              <label className="text-sm font-bold">
                Vehicle type
                <select
                  value={vehicleEditDraft.vehicle_type}
                  onChange={(event) =>
                    setVehicleEditDraft((current) => ({
                      ...current,
                      vehicle_type: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800"
                >
                  <option value="motorcycle">Motorcycle</option>
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                  <option value="truck">Truck</option>
                </select>
              </label>
              <label className="text-sm font-bold">
                Assigned rider
                <select
                  value={vehicleEditDraft.assigned_rider_id}
                  onChange={(event) =>
                    setVehicleEditDraft((current) => ({
                      ...current,
                      assigned_rider_id: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800"
                >
                  <option value="">Not assigned to a rider</option>
                  {riders.map((rider) => (
                    <option key={rider.id} value={rider.id}>
                      {rider.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold dark:border-slate-700">
                Available for dispatch
                <input
                  type="checkbox"
                  checked={vehicleEditDraft.is_active}
                  onChange={(event) =>
                    setVehicleEditDraft((current) => ({
                      ...current,
                      is_active: event.target.checked,
                    }))
                  }
                  className="h-5 w-5 accent-emerald-700"
                />
              </label>
            </div>
          </form>
        </Modal>
      )}

      {wizardOpen && (
        <Modal
          wide
          title="Create in-house dispatch"
          description={`Standard delivery · ${branch}`}
          onClose={() => !creating && setWizardOpen(false)}
          footer={
            wizardStep === 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => setWizardOpen(false)}
                  className="rounded-xl border px-4 py-2.5 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={continueWizard}
                  className="rounded-xl bg-emerald-700 px-5 py-2.5 font-bold text-white"
                >
                  Review route and rider
                </button>
              </>
            ) : wizardStep === 2 ? (
              <>
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="rounded-xl border px-4 py-2.5 font-bold"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={creating}
                  onClick={createDispatch}
                  className="rounded-xl bg-emerald-700 px-5 py-2.5 font-bold text-white disabled:opacity-50"
                >
                  {creating ? "Creating dispatch…" : "Create dispatch"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setWizardOpen(false)}
                className="rounded-xl bg-emerald-700 px-5 py-2.5 font-bold text-white"
              >
                Done
              </button>
            )
          }
        >
          {wizardError && <Alert>{wizardError}</Alert>}
          {wizardStep === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Choose eligible orders in the table before opening this dialog.
                Reorder selected stops below.
              </p>
              {selectedOrders.map((order, index) => (
                <div
                  key={order.id}
                  draggable
                  onDragStart={(event) =>
                    event.dataTransfer.setData("text/plain", String(index))
                  }
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) =>
                    moveSelectedOrder(
                      Number(event.dataTransfer.getData("text/plain")),
                      index,
                    )
                  }
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 font-bold text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">
                      {order.orderNumber} · {order.recipientName}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {order.address}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveSelectedOrder(index, index - 1)}
                      className="rounded border px-2 py-1"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSelectedOrder(index, index + 1)}
                      className="rounded border px-2 py-1"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {wizardStep === 2 && (
            <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
              <div>
                {routeLoading ? (
                  <div className="flex h-[360px] items-center justify-center rounded-2xl bg-slate-100">
                    Calculating planned route…
                  </div>
                ) : (
                  <DeliveryRouteMap
                    geometry={routePreview?.geometry}
                    markers={routePreview?.markers || []}
                  />
                )}
                {routePreview?.availabilityReason && (
                  <p className="mt-2 text-sm text-amber-700">
                    {routePreview.availabilityReason}
                  </p>
                )}
                {routePreview?.available && (
                  <p className="mt-2 text-sm text-slate-500">
                    Approximately {(routePreview.distanceM / 1000).toFixed(1)}{" "}
                    km · {Math.round(routePreview.durationS / 60)} minutes
                    planned driving time
                  </p>
                )}
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-bold">
                  Rider
                  <select
                    value={dispatchForm.riderId}
                    onChange={(event) => {
                      const riderId = event.target.value;
                      const assigned = activeVehicles.find(
                        (vehicle) =>
                          String(vehicle.assignedRiderId) === riderId,
                      );
                      setDispatchForm((current) => ({
                        ...current,
                        riderId,
                        vehicleId: assigned?.id || "",
                      }));
                    }}
                    className="mt-1 w-full rounded-xl border px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800"
                  >
                    <option value="">Select rider</option>
                    {dispatchableRiders.map((rider) => (
                      <option key={rider.id} value={rider.id}>
                        {rider.name} · {rider.activeDeliveries || 0} active
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-bold">
                  Vehicle <span className="font-normal text-slate-400">(optional)</span>
                  <select
                    value={dispatchForm.vehicleId}
                    onChange={(event) =>
                      setDispatchForm((current) => ({
                        ...current,
                        vehicleId: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800"
                  >
                    <option value="">No vehicle assignment</option>
                    {activeVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.plateNumber} · {label(vehicle.vehicleType)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-bold">
                  Dispatch notes
                  <textarea
                    value={dispatchForm.notes}
                    onChange={(event) =>
                      setDispatchForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    rows={4}
                    className="mt-1 w-full rounded-xl border px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800"
                  />
                </label>
                <div className="rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800">
                  <p className="font-bold">Final review</p>
                  <p className="mt-1 text-slate-500">
                    {selectedOrders.length} ordered stops · {branch} ·
                    notifications sent after creation
                  </p>
                </div>
              </div>
            </div>
          )}
          {wizardStep === 3 && (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
                ✓
              </div>
              <h3 className="mt-4 text-2xl font-extrabold text-slate-800 dark:text-slate-200">
                Dispatch created
              </h3>
              <p className="mt-2 text-slate-500">
                {createdDispatch?.deliveryOrderNumber} is now visible to{" "}
                {createdDispatch?.riderName}.
              </p>
            </div>
          )}
        </Modal>
      )}

      {reviewingOrder && (
        <Modal
          title={`Review ${reviewingOrder.orderNumber}`}
          description="This is only for a legacy order that has no recorded delivery method."
          onClose={() => !savingReview && setReviewingOrder(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setReviewingOrder(null)}
                disabled={savingReview}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-bold hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveOrderReview}
                disabled={savingReview}
                className="delivery-gradient rounded-xl px-5 py-2.5 font-bold text-white disabled:opacity-50"
              >
                {savingReview ? "Saving…" : "Save delivery method"}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            {reviewError && <Alert>{reviewError}</Alert>}
            <div className="rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800">
              <p className="font-bold">{reviewingOrder.recipientName}</p>
              <p className="mt-1 text-slate-500">{reviewingOrder.address}</p>
            </div>
            <label className="block text-sm font-bold">
              Confirmed delivery method
              <select
                value={reviewProvider}
                onChange={(event) => setReviewProvider(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select delivery method</option>
                {PROVIDERS.map((provider) => (
                  <option key={provider} value={provider}>
                    {label(provider)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Modal>
      )}

      {editingShipment && (
        <Modal
          title={`Edit ${editingShipment.providerName} delivery`}
          description="Use the courier's official portal as the source of truth. Changes are recorded in the tracking timeline."
          onClose={() => !savingShipment && setEditingShipment(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setEditingShipment(null)}
                disabled={Boolean(savingShipment)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-bold hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveShipment}
                disabled={Boolean(savingShipment)}
                className="delivery-gradient rounded-xl px-5 py-2.5 font-bold text-white disabled:opacity-50"
              >
                {savingShipment ? "Saving…" : "Save delivery"}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            {shipmentError && <Alert>{shipmentError}</Alert>}
            <label className="block text-sm font-bold">
              Courier status
              <select
                value={shipmentDraft.status}
                onChange={(event) =>
                  setShipmentDraft((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                {EXTERNAL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {label(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold">
              Courier reference
              <input
                value={shipmentDraft.external_reference}
                onChange={(event) =>
                  setShipmentDraft((current) => ({
                    ...current,
                    external_reference: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <label className="block text-sm font-bold">
              Official tracking link
              <input
                type="url"
                value={shipmentDraft.tracking_url}
                onChange={(event) =>
                  setShipmentDraft((current) => ({
                    ...current,
                    tracking_url: event.target.value,
                  }))
                }
                placeholder="https://"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <label className="block text-sm font-bold">
              Update note
              <textarea
                value={shipmentDraft.message}
                onChange={(event) =>
                  setShipmentDraft((current) => ({
                    ...current,
                    message: event.target.value,
                  }))
                }
                rows={3}
                placeholder="Optional note for the tracking timeline"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </label>
          </div>
        </Modal>
      )}

      {routeModal && (
        <Modal
          wide
          title={routeModal.dispatch.deliveryOrderNumber}
          description="Planned dispatch route — not live rider location"
          onClose={() => setRouteModal(null)}
        >
          {routeModal.loading ? (
            <p className="py-20 text-center">Loading planned route…</p>
          ) : routeModal.error ? (
            <Alert>{routeModal.error}</Alert>
          ) : (
            <>
              <DeliveryRouteMap
                geometry={routeModal.preview?.geometry}
                markers={routeModal.preview?.markers || []}
                height={520}
              />
              {routeModal.preview?.availabilityReason && (
                <p className="mt-3 text-sm text-amber-700">
                  {routeModal.preview.availabilityReason}
                </p>
              )}
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
