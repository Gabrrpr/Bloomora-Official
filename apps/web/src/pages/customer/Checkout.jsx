import { useState, useEffect, useMemo } from "react"
import { api } from "../../services/api.js"
import { getCart, clearCart } from "../../utils/cart.js"
import { useAuth } from "../../context/AuthContext"
import { computeDiscount } from "../../utils/vouchers.js"
import { API_BASE } from "../../config/api.js"
import moveItLogo from "../../assets/shipping/Move-It-Logo_Red-Dirty.webp"
import lalamoveLogo from "../../assets/shipping/Lalamove-Logo.webp"
import grabExpressLogo from "../../assets/shipping/grabexpress.webp"
import lbcLogo from "../../assets/shipping/493-4939965_lbc-express-logo-png-removebg-preview.webp"
import jtExpressLogo from "../../assets/shipping/JT-Express-Logo.webp"
import OrderingFulfillmentModal from "../../components/OrderingFulfillmentModal.jsx"

const G = "#2E8B34"
const DG = "#0C573E"
const STANDARD_DELIVERY_ID = "standard"

const PICKUP_BRANCHES = {
  Manila: {
    label: "Manila Branch",
    address: "Laon-Laan Cor. Dos Castillas St., Sampaloc, Manila",
    hours: "Mon-Sat, 9:00 AM-9:00 PM",
  },
  Pampanga: {
    label: "Pampanga Branch",
    address: "McArthur Hi-way, Dolores, San Fernando, Pampanga",
    hours: "Mon-Sat, 7:30 AM-5:00 PM",
  },
}

const DEFAULT_DELIVERY_PINS = {
  Manila: { lat: 14.5995, lng: 120.9842, label: "Search for a Metro Manila delivery address" },
  Pampanga: { lat: 15.0343, lng: 120.6844, label: "Search for a Pampanga delivery address" },
}

const SHIPPING_METHOD_LOGOS = {
  move_it: moveItLogo,
  lalamove: lalamoveLogo,
  grabexpress: grabExpressLogo,
  lbc: lbcLogo,
  jt_express: jtExpressLogo,
}

const NCR_ADDRESS_MARKERS = [
  "metro manila",
  "national capital region",
  " ncr",
  "caloocan",
  "las pinas",
  "las piñas",
  "makati",
  "malabon",
  "mandaluyong",
  "manila",
  "marikina",
  "muntinlupa",
  "navotas",
  "paranaque",
  "parañaque",
  "pasay",
  "pasig",
  "pateros",
  "quezon city",
  "san juan",
  "taguig",
  "valenzuela",
]

function ShippingLogo({ method }) {
  const [failed, setFailed] = useState(false)
  const logoSrc = method?.logo_url || SHIPPING_METHOD_LOGOS[method?.code]
  const initials = String(method?.courier_name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase() || "S"

  return (
    <div className="w-9 h-9 rounded-md border border-gray-100 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
      {logoSrc && !failed ? (
        <img
          src={logoSrc}
          alt={`${method.courier_name} logo`}
          className="w-full h-full object-contain p-1"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-[11px] font-extrabold text-[#2E8B34]">{initials}</span>
      )}
    </div>
  )
}

export default function Checkout({ onNavigate }) {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const deliveryTime = "Anytime"
  const paymentMethod = "ewallet";
  const [fulfillmentMethod, setFulfillmentMethod] = useState("delivery");
  const [deliverySettings, setDeliverySettings] = useState({ delivery_fee: 100, minimum_order: 0, same_day_cutoff: "14:00" });
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState(STANDARD_DELIVERY_ID);
  const [voucher, setVoucher] = useState("")
  const [appliedVoucher, setAppliedVoucher] = useState(null)
  const [voucherMsg, setVoucherMsg] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState("")

  const [deliveryMode, setDeliveryMode] = useState("tomorrow")
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 1); return d
  })

  const [orderNote, setOrderNote] = useState("")
  const [customer, setCustomer] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const [recipientType, setRecipientType] = useState("myself")
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [loadingAddresses, setLoadingAddresses] = useState(true)

  const [showManualModal, setShowManualModal] = useState(false)
  const [mapFullscreenOpen, setMapFullscreenOpen] = useState(false)
  const [orderingPolicyOpen, setOrderingPolicyOpen] = useState(false)
  const [saveAddressToBook, setSaveAddressToBook] = useState(false)
  const [manualForm, setManualForm] = useState({
    recipient_name: "",
    phone: "",
    street: "",
    barangay: "",
    city: "",
    province: "",
    zip: "",
    latitude: null,
    longitude: null,
    geocode_precision: null,
  })
  const [deliveryPin, setDeliveryPin] = useState(null)
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState("")
  const [addressSearch, setAddressSearch] = useState("")
  const [addressSearchResults, setAddressSearchResults] = useState([])
  const [addressSearching, setAddressSearching] = useState(false)
  const [addressSearchError, setAddressSearchError] = useState("")

  useEffect(() => {
    api.getCheckoutSettings()
      .then(data => {
        setDeliverySettings(current => ({ ...current, ...(data.delivery || {}) }))
        setShippingMethods(Array.isArray(data.shipping_methods) ? data.shipping_methods : [])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("bloomora_applied_voucher") || "null")
      if (saved?.code) {
        setVoucher(saved.code)
        setAppliedVoucher(saved)
      }
    } catch {}
  }, [])

  useEffect(() => {
    let active = true
    getCart()
      .then(items => {
        if (active) setCartItems(items.filter(i => i.checked))
      })
      .catch(e => {
        console.error("Failed to load cart", e)
        if (active) setError("Unable to load your cart.")
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    async function fetchProfile() {
      const token = localStorage.getItem("access_token")
      if (!token) {
        setLoadingProfile(false)
        return
      }
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const profile = await res.json()
          setCustomer(profile)
        }
      } catch (e) {
        console.error("Failed to fetch profile", e)
      } finally {
        setLoadingProfile(false)
      }
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    if (!mapFullscreenOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMapFullscreenOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [mapFullscreenOpen])

  useEffect(() => {
    async function loadAddresses() {
      const token = localStorage.getItem("access_token")
      if (!token) {
        setLoadingAddresses(false)
        return
      }
      try {
        const res = await api.getAddresses()
        const addrs = res.addresses || []
        setAddresses(addrs)
        const defaultAddr = addrs.find(a => a.is_default)
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id)
        } else if (addrs.length > 0) {
          setSelectedAddressId(addrs[0].id)
        }
      } catch (e) {
        console.error("Failed to load addresses", e)
      } finally {
        setLoadingAddresses(false)
      }
    }
    loadAddresses()
  }, [])

  const subtotal = cartItems.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0)

  const applyVoucher = async () => {
    if (!cartItems.length) return setVoucherMsg({ type: "error", text: "Add products before applying a voucher." })
    try {
      const result = await api.post("/commerce/vouchers/validate", { code: voucher, subtotal })
      const next = {
        code: result.voucher.code,
        type: result.voucher.discount_type,
        value: Number(result.voucher.discount_value),
        minSpend: Number(result.voucher.min_spend || 0),
        discount: Number(result.discount || 0),
      }
      setAppliedVoucher(next)
      localStorage.setItem("bloomora_applied_voucher", JSON.stringify(next))
      setVoucherMsg({ type: "success", text: `Voucher applied — you saved ₱${Number(result.discount).toLocaleString()}.` })
    } catch (error) {
      setAppliedVoucher(null)
      localStorage.removeItem("bloomora_applied_voucher")
      setVoucherMsg({ type: "error", text: error.message || "Voucher is invalid." })
    }
  }

  useEffect(() => {
    if (appliedVoucher?.code && cartItems.length) void applyVoucher()
    // Revalidate only when checkout subtotal changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal])

  const removeVoucher = () => {
    setAppliedVoucher(null)
    setVoucher("")
    setVoucherMsg(null)
    localStorage.removeItem("bloomora_applied_voucher")
  }

  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const maximumDeliveryDate = new Date(today); maximumDeliveryDate.setDate(today.getDate() + 30)
  const [cutoffHour, cutoffMinute] = String(deliverySettings.same_day_cutoff || "14:00").split(":").map(Number)
  const isTodayUnavailable = today.getHours() > cutoffHour || (today.getHours() === cutoffHour && today.getMinutes() >= cutoffMinute)
  const fmt = (d) => d.toLocaleDateString("en-PH", { month: "long", day: "numeric" })
  const fmtDay = (d) => d.toLocaleDateString("en-PH", { weekday: "long" })
  const toInputDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

  const fullName = customer
    ? `${customer.first_name || ""} ${customer.last_name || ""}`.trim()
    : user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
    : "Guest"

  const rawStoreBranch = localStorage.getItem("bloomora_active_branch") || "Manila";
  const selectedStoreBranch = rawStoreBranch.charAt(0).toUpperCase() + rawStoreBranch.slice(1).toLowerCase();

  const selectedAddress = addresses.find(a => a.id === selectedAddressId)

  const formatAddress = (addr) => addr
    ? [addr.street, addr.barangay, addr.city, addr.province, addr.zip_code].filter(Boolean).join(", ")
    : ""

  const makeMapUrl = (pin) => {
    if (!pin?.lat || !pin?.lng) return ""
    const lat = Number(pin.lat)
    const lng = Number(pin.lng)
    const delta = 0.006
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lng}`
  }

  const provinceToBranch = (provinceOrAddress) => {
    const p = (provinceOrAddress || "").toLowerCase()
    if (!p) return null
    if (p.includes("pampanga") || p.includes("angeles") || p.includes("mabalacat") || p.includes("san fernando")) return "Pampanga"
    if (NCR_ADDRESS_MARKERS.some(marker => p.includes(marker))) return "Manila"
    return null
  }

  const pickupAddressSource = selectedAddress
    ? formatAddress(selectedAddress)
    : (customer?.address || user?.address || "")
  const pickupBranchName = provinceToBranch(selectedAddress?.province || pickupAddressSource) || selectedStoreBranch
  const pickupBranch = PICKUP_BRANCHES[pickupBranchName] || PICKUP_BRANCHES.Manila;
  const selectedAddressText = selectedAddress
    ? formatAddress(selectedAddress)
    : (customer?.address || user?.address || "")
  const manualAddressText = [manualForm.street, manualForm.barangay, manualForm.city, manualForm.province, manualForm.zip].filter(Boolean).join(", ")
  const deliveryAddressText = recipientType === "myself" ? selectedAddressText : manualAddressText
  const deliveryAddressBranch = provinceToBranch(
    recipientType === "myself"
      ? (selectedAddress ? [selectedAddress.street, selectedAddress.barangay, selectedAddress.city, selectedAddress.province, selectedAddressText].filter(Boolean).join(", ") : selectedAddressText)
      : [manualForm.street, manualForm.barangay, manualForm.city, manualForm.province, manualAddressText].filter(Boolean).join(", ")
  )
  const methodSupportsBranch = (method, branch) => {
    const area = String(method?.service_area || "nationwide").toLowerCase()
    if (area === "nationwide") return true
    if (!branch) return false
    return area === String(branch).toLowerCase()
  }
  const serviceAreaLabel = (method) => {
    const area = String(method?.service_area || "nationwide").toLowerCase()
    if (area === "manila") return "Metro Manila / NCR"
    if (area === "pampanga") return "Pampanga"
    return "supported areas"
  }
  const standardDeliveryMethod = useMemo(() => ({
    id: STANDARD_DELIVERY_ID,
    code: "standard",
    courier_name: "Esting's Delivery",
    delivery_type: "In-house standard delivery",
    description: "Handled directly by Esting's delivery riders.",
    service_area: "pampanga",
    base_rate: Number(deliverySettings.delivery_fee || 0),
    supports_live_booking: false,
  }), [deliverySettings.delivery_fee])
  const deliveryMethods = useMemo(
    () => [standardDeliveryMethod, ...shippingMethods],
    [shippingMethods, standardDeliveryMethod]
  )
  const availableShippingMethods = useMemo(
    () => deliveryMethods.filter(method => methodSupportsBranch(method, deliveryAddressBranch || selectedStoreBranch)),
    [deliveryMethods, deliveryAddressBranch, selectedStoreBranch]
  )
  const selectedShippingMethod = availableShippingMethods.find(method => method.id === selectedShippingMethodId) || null
  const shipping = cartItems.length > 0 && fulfillmentMethod === "delivery"
    ? Number(selectedShippingMethod?.base_rate ?? deliverySettings.delivery_fee ?? 0)
    : 0
  const discount = computeDiscount(appliedVoucher, subtotal)
  const total = Math.max(0, subtotal + shipping - discount)

  useEffect(() => {
    if (fulfillmentMethod !== "delivery") return
    if (availableShippingMethods.length === 0) {
      setSelectedShippingMethodId(null)
      return
    }
    if (!selectedShippingMethodId || !availableShippingMethods.some(method => method.id === selectedShippingMethodId)) {
      setSelectedShippingMethodId(availableShippingMethods[0].id)
    }
  }, [fulfillmentMethod, availableShippingMethods, selectedShippingMethodId])

  const getDeliveryDetails = () => {
    if (fulfillmentMethod === "pickup") {
      return {
        name: fullName,
        phone: customer?.phone_number || user?.phoneNumber || "",
        address: `Pickup - ${pickupBranch.label}: ${pickupBranch.address}`,
      }
    }
    if (recipientType === "myself") {
      if (selectedAddress) {
        return {
          name: selectedAddress.recipient_name,
          phone: selectedAddress.phone,
          address: formatAddress(selectedAddress),
        }
      }
      return {
        name: fullName,
        phone: customer?.phone_number || user?.phoneNumber || "",
        address: customer?.address || user?.address || "",
      }
    } else {
      return {
        name: manualForm.recipient_name,
        phone: manualForm.phone,
        address: manualAddressText,
      }
    }
  }

  const deliveryDetails = getDeliveryDetails()
  const savedAddressPin = selectedAddress?.latitude && selectedAddress?.longitude
    ? {
        lat: Number(selectedAddress.latitude),
        lng: Number(selectedAddress.longitude),
        label: formatAddress(selectedAddress),
        precision: selectedAddress.geocode_precision || "saved_address",
      }
    : null
  const activeDeliveryPin = deliveryPin || savedAddressPin
  const mapPreviewPin = activeDeliveryPin || DEFAULT_DELIVERY_PINS[selectedStoreBranch] || DEFAULT_DELIVERY_PINS.Manila

  const addressBranch = (fulfillmentMethod === "pickup")
    ? pickupBranchName
    : provinceToBranch(
        recipientType === "myself" 
          ? (selectedAddress ? [selectedAddress.street, selectedAddress.barangay, selectedAddress.city, selectedAddress.province, selectedAddressText].filter(Boolean).join(", ") : (customer?.address || user?.address)) 
          : [manualForm.street, manualForm.barangay, manualForm.city, manualForm.province, manualAddressText].filter(Boolean).join(", ")
      )
  
  const needsBranchConfirm = fulfillmentMethod === "delivery" && selectedStoreBranch && addressBranch && (selectedStoreBranch.toLowerCase() !== addressBranch.toLowerCase())
  const [branchConfirmOpen, setBranchConfirmOpen] = useState(false)

  useEffect(() => {
    setGeocodeError("")
    if (recipientType === "myself") {
      setDeliveryPin(null)
    } else if (manualForm.latitude && manualForm.longitude) {
      setDeliveryPin({
        lat: Number(manualForm.latitude),
        lng: Number(manualForm.longitude),
        label: manualAddressText,
        precision: manualForm.geocode_precision || "manual",
      })
    } else {
      setDeliveryPin(null)
    }
  }, [recipientType, selectedAddressId, manualAddressText, manualForm.latitude, manualForm.longitude, manualForm.geocode_precision])

  const geocodeDeliveryAddress = async () => {
    if (!deliveryAddressText) {
      setGeocodeError("Enter a complete delivery address first.")
      return
    }
    setGeocoding(true)
    setGeocodeError("")
    try {
      const res = await api.geocodeAddress(deliveryAddressText)
      const match = (res.results || [])[0]
      if (!match?.lat || !match?.lng) {
        setGeocodeError("We could not find a map pin for this address. Try adding the barangay, city, and province.")
        return
      }
      const nextPin = {
        lat: Number(match.lat),
        lng: Number(match.lng),
        label: match.label || deliveryAddressText,
        precision: match.type || "geocoded",
      }
      setDeliveryPin(nextPin)
      if (recipientType !== "myself") {
        setManualForm(current => ({
          ...current,
          latitude: nextPin.lat,
          longitude: nextPin.lng,
          geocode_precision: nextPin.precision,
        }))
      }
    } catch (e) {
      setGeocodeError(e.message || "Unable to check this address on the map.")
    } finally {
      setGeocoding(false)
    }
  }

  const searchOpenStreetMapAddress = async () => {
    const query = addressSearch.trim()
    if (query.length < 5) {
      setAddressSearchError("Enter at least 5 characters to search for an address.")
      setAddressSearchResults([])
      return
    }
    setAddressSearching(true)
    setAddressSearchError("")
    try {
      const response = await api.geocodeAddress(query)
      const results = Array.isArray(response?.results) ? response.results : []
      setAddressSearchResults(results)
      if (results.length === 0) {
        setAddressSearchError("No OpenStreetMap addresses matched your search. Add a street, barangay, or city and try again.")
      }
    } catch (error) {
      setAddressSearchResults([])
      setAddressSearchError(error.message || "OpenStreetMap address search is temporarily unavailable.")
    } finally {
      setAddressSearching(false)
    }
  }

  const selectOpenStreetMapAddress = (result, { populateForm = true } = {}) => {
    const address = result?.address || {}
    const streetName = address.road || address.pedestrian || address.footway || address.path || ""
    const street = [address.house_number, streetName].filter(Boolean).join(" ")
      || address.building
      || address.amenity
      || String(result?.label || "").split(",")[0].trim()
    const barangay = address.suburb
      || address.quarter
      || address.neighbourhood
      || address.village
      || address.city_district
      || ""
    const city = address.city
      || address.town
      || address.municipality
      || address.city_district
      || address.county
      || ""
    const province = address.state || address.province || address.region || ""
    const latitude = Number(result?.lat)
    const longitude = Number(result?.lng)

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      setDeliveryPin({
        lat: latitude,
        lng: longitude,
        label: result?.label || addressSearch,
        precision: result?.type || "openstreetmap_search",
      })
      setGeocodeError("")
    }

    if (populateForm) {
      setManualForm(current => ({
        ...current,
        street,
        barangay,
        city,
        province,
        zip: address.postcode || "",
        latitude: Number.isFinite(latitude) ? latitude : null,
        longitude: Number.isFinite(longitude) ? longitude : null,
        geocode_precision: result?.type || "openstreetmap_search",
      }))
    }
    setAddressSearch(result?.label || addressSearch)
    setAddressSearchResults([])
    setAddressSearchError("")
  }

  const renderDeliveryPinSearch = () => (
    <div className="absolute left-3 right-3 top-3 z-10">
      <div className="rounded-xl border border-gray-200 bg-white/95 p-2 shadow-lg backdrop-blur-sm">
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" /></svg>
            <input
              type="search"
              value={addressSearch}
              onChange={event => {
                setAddressSearch(event.target.value)
                setAddressSearchResults([])
                setAddressSearchError("")
              }}
              onKeyDown={event => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  searchOpenStreetMapAddress()
                }
              }}
              placeholder="Search delivery address"
              aria-label="Search delivery address on map"
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm focus:border-[#2E8B34] focus:outline-none focus:ring-1 focus:ring-[#2E8B34]"
            />
          </div>
          <button
            type="button"
            onClick={searchOpenStreetMapAddress}
            disabled={addressSearching}
            className="rounded-lg bg-[#2E8B34] px-3.5 py-2.5 text-xs font-bold text-white hover:bg-[#26772c] disabled:opacity-60"
          >
            {addressSearching ? "Searching..." : "Search"}
          </button>
        </div>
        {addressSearchError && <p className="px-1 pt-2 text-xs text-red-500">{addressSearchError}</p>}
        {addressSearchResults.length > 0 && (
          <div className="mt-2 max-h-40 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200 bg-white">
            {addressSearchResults.map((result, index) => (
              <button
                key={`${result.lat}-${result.lng}-${index}`}
                type="button"
                onClick={() => selectOpenStreetMapAddress(result, { populateForm: false })}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition hover:bg-[#F0F7F1]"
              >
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2E8B34]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21s6-5.686 6-11a6 6 0 1 0-12 0c0 5.314 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></svg>
                <span className="text-xs leading-relaxed text-gray-700">{result.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeocodeError("Your browser does not support location sharing.")
      return
    }
    setGeocoding(true)
    setGeocodeError("")
    navigator.geolocation.getCurrentPosition(
      position => {
        const nextPin = {
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude),
          label: "Current location",
          precision: `gps_${Math.round(position.coords.accuracy || 0)}m`,
        }
        setDeliveryPin(nextPin)
        if (recipientType !== "myself") {
          setManualForm(current => ({
            ...current,
            latitude: nextPin.lat,
            longitude: nextPin.lng,
            geocode_precision: nextPin.precision,
          }))
        }
        setGeocoding(false)
      },
      () => {
        setGeocodeError("Location permission was denied. You can still use the address lookup.")
        setGeocoding(false)
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    )
  }

  const buildDeliveryNotes = () =>
    `[BRANCH:${addressBranch || "Manila"}] ${fulfillmentMethod === "pickup" ? `Pickup at ${pickupBranch.label}` : `Delivery via ${selectedShippingMethod?.courier_name || "selected courier"} (${selectedShippingMethod?.delivery_type || deliveryTime})`} | Recipient: ${deliveryDetails.name} (${deliveryDetails.phone || "No phone provided"})${appliedVoucher ? ` | Voucher: ${appliedVoucher.code}` : ""}`

  const buildOrderData = (orderIds) => ({
    orderIds,
    payment_method: paymentMethod,
    payment_status: "pending",
    items: cartItems,
    subtotal,
    shipping,
    discount,
    voucherCode: appliedVoucher?.code || null,
    total,
    deliveryTime,
    deliveryAddress: deliveryDetails.address,
    scheduledDate: fmt(deliveryDate),
    placedAt: new Date().toISOString(),
    special_note: orderNote.trim() || null,
  })

  const executeOrderPlacement = async () => {
    setPlacing(true);
    setError("");

    try {
      if (saveAddressToBook && recipientType !== "myself" && manualForm.recipient_name && manualForm.phone && manualForm.street) {
        try {
          await api.createAddress({
            label: `To: ${manualForm.recipient_name}`,
            recipient_name: manualForm.recipient_name,
            phone: manualForm.phone,
            street: manualForm.street,
            barangay: manualForm.barangay || "",
            city: manualForm.city,
            province: manualForm.province,
            zip_code: manualForm.zip || "",
            latitude: activeDeliveryPin?.lat ?? null,
            longitude: activeDeliveryPin?.lng ?? null,
            geocode_precision: activeDeliveryPin?.precision || null,
            is_default: false,
          });
          const res = await api.getAddresses();
          setAddresses(res.addresses || []);
        } catch (addrErr) {
          console.error("Failed to save address to book:", addrErr);
        }
      }

      // 1. Create the base order
      const res = await api.createOrder({
        items: cartItems.map(i => ({
          id: i.id,
          group: i.group,
          name: i.name,
          desc: i.desc,
          price: i.price,
          qty: i.qty,
          img: i.img || i.image || i.image_url || i.generated_image_url || "",
          card_message: i.massCardContext
            ? `Mass card context: ${i.massCardContext}`
            : (i.cardMessage || i.card_message || null),
        })),
        delivery_address: deliveryDetails.address,
        delivery_notes: buildDeliveryNotes(),
        scheduled_at: deliveryDate.toISOString(),
        payment_method: paymentMethod,
        payment_reference: null,
        paymongo_success_url: `${window.location.origin}/confirmation?payment=success`,
        paymongo_cancel_url: `${window.location.origin}/checkout?payment=cancelled`,
        fulfillment_method: fulfillmentMethod,
        shipping_method_id: fulfillmentMethod === "delivery" && selectedShippingMethod?.code !== "standard" ? selectedShippingMethod?.id : null,
        shipping_method_code: fulfillmentMethod === "delivery" ? selectedShippingMethod?.code : null,
        delivery_provider: fulfillmentMethod === "delivery" ? selectedShippingMethod?.code : null,
        special_note: orderNote.trim() || null,
        delivery_lat: activeDeliveryPin?.lat ?? null,
        delivery_lng: activeDeliveryPin?.lng ?? null,
        delivery_geocode_precision: activeDeliveryPin?.precision || null,
        
        // 🚀 THE FIX: Force these to strictly lowercase so the Database Enum accepts them!
        branch_name: addressBranch.toLowerCase(),
        branch: addressBranch.toLowerCase(),
        voucher_code: appliedVoucher?.code || null,
      });

      const orderIds = res.order_ids || [];
      localStorage.setItem("bloomora_last_order", JSON.stringify(buildOrderData(orderIds)));
      await clearCart();

      if (res.checkout_url) {
        window.location.assign(res.checkout_url);
        return;
      }
      throw new Error("PayMongo did not return a checkout link. Please try again.");

    } catch (e) {
      console.error("Checkout Crash:", e);
      setError(e.message || "Failed to place order. Please try again.");
      setPlacing(false);
    }
  };

  const proceedAfterBranchConfirm = async () => {
    setBranchConfirmOpen(false);
    if (cartItems.length === 0) {
      setError("Your cart is empty. Please select items from your cart.");
      return;
    }

    // Pickup doesn't require an address
    if (fulfillmentMethod === "delivery") {
      if (!deliveryDetails.address || !deliveryDetails.phone) {
        setError("Please select or add a complete delivery address and phone number before placing an order.");
        return;
      }
      if (!selectedShippingMethod) {
        setError("Please select an available shipping option for this address.");
        return;
      }
      if ((selectedShippingMethod.supports_live_booking || selectedShippingMethod.code === "standard") && (!activeDeliveryPin?.lat || !activeDeliveryPin?.lng)) {
        setError(`Please confirm the delivery pin before using ${selectedShippingMethod.courier_name}.`);
        return;
      }
    } else {
      // pickup
      if (!deliveryDetails.phone) {
        setError("Please provide a phone number for pickup.");
        return;
      }
    }

    await executeOrderPlacement();
  };

  const handlePlaceOrder = async () => {
    setError(""); 
    if (!user) {
      onNavigate("login");
      return;
    }
    if (cartItems.length === 0) {
      setError("Your cart is empty! Please go back and select items to checkout.");
      return;
    }
    if (fulfillmentMethod === "delivery") {
      if (!deliveryDetails.address || !deliveryDetails.phone) {
        setError("Please select or add a complete delivery address and phone number.");
        return;
      }
      if (!selectedShippingMethod) {
        setError("Please select an available shipping option for this address.");
        return;
      }
      if ((selectedShippingMethod.supports_live_booking || selectedShippingMethod.code === "standard") && (!activeDeliveryPin?.lat || !activeDeliveryPin?.lng)) {
        setError(`Please confirm the delivery pin before using ${selectedShippingMethod.courier_name}.`);
        return;
      }
    } else if (!deliveryDetails.phone) {
      setError("Please provide a phone number for pickup.");
      return;
    }
    if (needsBranchConfirm) {
      setBranchConfirmOpen(true);
      return;
    }

    await executeOrderPlacement();
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <style>{`@keyframes coRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
      
      {/* Branch Confirmation Modal */}
      {branchConfirmOpen && needsBranchConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setBranchConfirmOpen(false)
          }}
        >
          <div className="bg-white rounded-xl w-full max-w-md p-5 sm:p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm your order branch</h3>
            <p className="text-sm text-gray-600 mb-4">
              You were shopping in the <b>{selectedStoreBranch}</b> store, but your delivery address is in <b>{addressBranch}</b>. 
              We will process this order under our <b>{addressBranch}</b> branch. Are you sure you want to proceed?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setBranchConfirmOpen(false)}
                className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
              >
                Go back
              </button>
              <button
                onClick={proceedAfterBranchConfirm}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-lg bg-[#2E8B34] hover:brightness-105"
              >
                Yes, proceed
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="mb-5 sm:mb-6" style={{ animation: "coRise 0.5s ease 0.05s both" }}>
          <button
            onClick={() => onNavigate("cart")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#2E8B34] transition mb-3"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to cart
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-sm text-gray-500 mt-1">Review your details and complete your order.</p>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 text-[#2E8B34]">
              <span className="w-5 h-5 rounded-full bg-[#2E8B34] text-white flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </span>
              <span className="hidden sm:inline">Cart</span>
            </span>
            <span className="w-5 sm:w-8 h-px bg-[#2E8B34]/40" />
            <span className="inline-flex items-center gap-1.5 text-[#2E8B34]">
              <span className="w-5 h-5 rounded-full bg-[#2E8B34] text-white flex items-center justify-center text-[10px]">2</span>
              Checkout
            </span>
            <span className="w-5 sm:w-8 h-px bg-gray-200" />
            <span className="inline-flex items-center gap-1.5 text-gray-400">
              <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px]">3</span>
              <span className="hidden sm:inline">Confirmation</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 lg:gap-5 items-start">

          {/* ── Left ── */}
          <div className="space-y-4 min-w-0" style={{ animation: "coRise 0.5s ease 0.15s both" }}>

            {/* Shipping Address */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-7 h-7 rounded-lg bg-[#F0F7F1] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#2E8B34]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </span>
                <h2 className="text-sm font-bold text-gray-800">Shipping Address</h2>
              </div>

              {/* Recipient type toggle */}
              <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setRecipientType("myself")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md transition ${recipientType !== "someone_else" ? "bg-white text-[#2E8B34] shadow-sm" : "bg-transparent text-gray-500"}`}
                >
                  For Myself
                </button>
                <button
                  onClick={() => setRecipientType("someone_else")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md transition ${recipientType === "someone_else" ? "bg-white text-[#2E8B34] shadow-sm" : "bg-transparent text-gray-500"}`}
                >
                  For Someone Else
                </button>
              </div>

              {recipientType === "myself" ? (
                <div>
                  {loadingAddresses ? (
                    <p className="text-sm text-gray-400">Loading addresses...</p>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 mb-2">No saved addresses yet</p>
                       <button
                         onClick={() => {
                           if (!user) return onNavigate("login")
                           setManualForm(current => ({
                             ...current,
                             recipient_name: current.recipient_name || fullName,
                             phone: current.phone || customer?.phone_number || user?.phoneNumber || "",
                           }))
                           setRecipientType("manual_self")
                           setShowManualModal(true)
                         }}
                         className="w-full py-2 text-xs font-semibold text-gray-500 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition"
                       >
                         + Enter a Delivery Address
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`border rounded-lg p-3 cursor-pointer transition ${selectedAddressId === addr.id ? "border-[#2E8B34] bg-[#F0F7F1]" : "border-gray-200 hover:border-gray-300"}`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 flex-shrink-0">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedAddressId === addr.id ? "border-[#2E8B34]" : "border-gray-300"}`}>
                                {selectedAddressId === addr.id && <div className="w-2 h-2 rounded-full bg-[#2E8B34]" />}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-semibold text-gray-800">{addr.label}</span>
                                {addr.is_default && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-white bg-[#2E8B34]">Default</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-700">{addr.recipient_name} · {addr.phone}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {addr.street}{addr.barangay ? `, ${addr.barangay}` : ""}, {addr.city}, {addr.province}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setManualForm(current => ({
                            ...current,
                            recipient_name: current.recipient_name || fullName,
                            phone: current.phone || customer?.phone_number || user?.phoneNumber || "",
                          }))
                          setRecipientType("manual_self")
                          setShowManualModal(true)
                        }}
                        className="w-full py-2 text-xs font-semibold text-gray-500 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        + Use a New Address
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {manualForm.recipient_name && manualForm.phone && manualForm.street ? (
                    <div className="border border-[#bbf7d0] bg-[#F0F7F1] rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{manualForm.recipient_name}</p>
                          <p className="text-xs text-gray-600">{manualForm.phone}</p>
                          <p className="text-xs text-gray-500">
                            {[manualForm.street, manualForm.barangay, manualForm.city, manualForm.province, manualForm.zip].filter(Boolean).join(", ")}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowManualModal(true)}
                          className="text-xs font-semibold text-[#2E8B34] hover:underline flex-shrink-0"
                        >
                          EDIT
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowManualModal(true)}
                      className="w-full py-3 text-sm font-semibold border-2 border-dashed border-gray-300 rounded-lg hover:border-[#2E8B34] hover:bg-[#F0F7F1] transition text-gray-500"
                    >
                      {recipientType === "manual_self" ? "+ Enter Delivery Address" : "+ Enter Recipient Details"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {fulfillmentMethod !== "pickup" && deliveryAddressText && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-[#F0F7F1] flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-[#2E8B34]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-gray-800">Delivery pin</h2>
                      <p className="text-xs text-gray-500 truncate">{activeDeliveryPin ? activeDeliveryPin.label : deliveryAddressText}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${activeDeliveryPin ? "bg-[#F0F7F1] text-[#2E8B34]" : "bg-amber-50 text-amber-700"}`}>
                    {activeDeliveryPin ? "PIN SET" : "NEEDED"}
                  </span>
                </div>

                <div className="relative rounded-xl border border-gray-100 bg-gray-50 mb-3 h-72">
                  <iframe
                    title="Delivery pin map"
                    src={makeMapUrl(mapPreviewPin)}
                    className="w-full h-full border-0 rounded-xl"
                    loading="lazy"
                  />
                  {renderDeliveryPinSearch()}
                  <button
                    type="button"
                    onClick={() => setMapFullscreenOpen(true)}
                    className="absolute right-2 bottom-2 z-10 px-2.5 py-1.5 text-[11px] font-bold rounded-md bg-white/95 text-gray-700 border border-gray-200 shadow-sm hover:bg-[#F0F7F1] hover:text-[#2E8B34]"
                  >
                    Full screen
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={geocodeDeliveryAddress}
                    disabled={geocoding}
                    className="flex-1 py-2.5 text-xs font-semibold rounded-lg border border-[#2E8B34] text-[#2E8B34] hover:bg-[#F0F7F1] disabled:opacity-60"
                  >
                    {geocoding ? "Checking..." : activeDeliveryPin ? "Refresh pin" : "Check address"}
                  </button>
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={geocoding}
                    className="flex-1 py-2.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                  >
                    Use current location
                  </button>
                </div>

                {activeDeliveryPin && (
                  <p className="text-[11px] text-gray-500 mt-2">
                    Coordinates: {Number(activeDeliveryPin.lat).toFixed(6)}, {Number(activeDeliveryPin.lng).toFixed(6)}
                  </p>
                )}
                {geocodeError && (
                  <p className="text-[11px] text-red-500 mt-2">{geocodeError}</p>
                )}
              </div>
            )}

            {/* Package */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
              <p className="text-xs text-gray-400 font-medium mb-4">Package 1 of 1</p>

              {/* Delivery option */}
              <p className="text-xs font-medium text-gray-500 mb-3">Fulfillment method</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {deliveryMethods.map(method => {
                  const isAvailable = methodSupportsBranch(method, deliveryAddressBranch || selectedStoreBranch)
                  const isSelected = fulfillmentMethod === "delivery" && selectedShippingMethodId === method.id
                  return (
                    <div
                      key={method.id}
                      onClick={() => {
                        if (!isAvailable) return
                        setFulfillmentMethod("delivery")
                        setSelectedShippingMethodId(method.id)
                      }}
                      className={`border-2 rounded-lg p-3.5 transition ${isAvailable ? "cursor-pointer hover:border-gray-300" : "cursor-not-allowed opacity-60"} ${isSelected ? "border-[#2E8B34] bg-[#F0F7F1]" : "border-gray-200"}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-[#2E8B34]" : "border-gray-300"}`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#2E8B34]" />}
                          </div>
                          <ShippingLogo method={method} />
                          <span className={`text-sm font-semibold truncate ${isSelected ? "text-[#2E8B34]" : "text-gray-700"}`}>{method.courier_name}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-700 flex-shrink-0">₱{Number(method.base_rate || 0).toLocaleString()}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                        {method.delivery_type}<br />
                        {isAvailable
                          ? (method.description || "Available for this address")
                          : `Available only within ${serviceAreaLabel(method)}`}
                      </p>
                    </div>
                  )
                })}

                <div
                  onClick={() => { setFulfillmentMethod("pickup") }}
                  className={`border-2 rounded-lg p-3.5 cursor-pointer transition ${fulfillmentMethod === "pickup" ? "border-[#2E8B34] bg-[#F0F7F1]" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${fulfillmentMethod === "pickup" ? "border-[#2E8B34]" : "border-gray-300"}`}>
                      {fulfillmentMethod === "pickup" && <div className="w-2.5 h-2.5 rounded-full bg-[#2E8B34]" />}
                    </div>
                    <span className={`text-sm font-semibold ${fulfillmentMethod === "pickup" ? "text-[#2E8B34]" : "text-gray-700"}`}>Pickup</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Collect from {pickupBranch.label}<br />{pickupBranch.hours}</p>
                </div>
              </div>

              {/* Order items */}
              {cartItems.map((item, i) => (
                <div key={`${item.id}-${i}`} className="flex items-start gap-3 py-3 border-t border-gray-100 first:border-0">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-pink-50 to-rose-100 flex-shrink-0 flex items-center justify-center border border-gray-100 overflow-hidden">
                    {item.img ? (
                      <img src={item.img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400 text-center px-1 leading-tight">{item.name?.split(" ").slice(0, 2).join(" ")}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 mb-0.5">{item.name}</p>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{item.desc}</p>
                    <p className="text-xs text-gray-500 mt-1">Qty: {item.qty || 1}</p>
                  </div>
                  <div className="flex items-start gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-800">₱{((item.price || 0) * (item.qty || 1)).toLocaleString()}</span>
                  </div>
                </div>
              ))}

              {cartItems.length === 0 && (
                <div className="py-4 text-center">
                  <p className="text-sm text-gray-400">No items selected for checkout.</p>
                  <button onClick={() => onNavigate("cart")} className="mt-2 px-4 py-2 text-xs font-semibold text-white rounded-lg bg-[#2E8B34] hover:brightness-105">
                    Back to Cart
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: delivery date + payment + summary ── */}
          <div className="space-y-4 min-w-0" style={{ animation: "coRise 0.5s ease 0.25s both" }}>

            {/* Delivery date */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-7 h-7 rounded-lg bg-[#F0F7F1] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#2E8B34]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </span>
                <h2 className="text-sm font-bold text-gray-800">Select delivery date</h2>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  type="button"
                  disabled={isTodayUnavailable}
                  onClick={() => { setDeliveryMode("today"); setDeliveryDate(today) }}
                  className={`h-[64px] flex flex-col items-center justify-center text-center rounded-lg p-2 ${isTodayUnavailable ? "border border-gray-200 opacity-50" : deliveryMode === "today" ? "border-2 border-[#2E8B34] bg-[#F0F7F1]" : "border border-gray-200 hover:border-gray-300"}`}
                >
                  <p className="text-xs font-medium text-gray-500">{fmt(today)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{isTodayUnavailable ? "Today · Unavailable" : "Today"}</p>
                </button>

                <button
                  type="button"
                  onClick={() => { setDeliveryMode("tomorrow"); setDeliveryDate(tomorrow) }}
                  className={`h-[64px] flex flex-col items-center justify-center text-center rounded-lg p-2 transition ${deliveryMode === "tomorrow" ? "border-2 border-[#2E8B34] bg-[#F0F7F1]" : "border border-gray-200 hover:border-gray-300"}`}
                >
                  <p className={`text-xs font-semibold ${deliveryMode === "tomorrow" ? "text-[#2E8B34]" : "text-gray-700"}`}>{fmt(tomorrow)}</p>
                  <p className="text-[10px] font-medium text-gray-500 mt-0.5">{fmtDay(tomorrow).toUpperCase()}</p>
                </button>

                <div
                  className={`relative h-[64px] flex flex-col items-center justify-center text-center rounded-lg p-2 transition cursor-pointer ${deliveryMode === "custom" ? "border-2 border-[#2E8B34] bg-[#F0F7F1]" : "border border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                >
                  {deliveryMode === "custom" ? (
                    <>
                      <p className="text-xs font-semibold text-[#2E8B34]">{fmt(deliveryDate)}</p>
                      <p className="text-[10px] font-medium text-gray-500 mt-0.5">{fmtDay(deliveryDate).toUpperCase()}</p>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <p className="text-[10px] text-gray-400 mt-0.5">Pick a date</p>
                    </>
                  )}
                  <input
                    type="date"
                    min={toInputDate(isTodayUnavailable ? tomorrow : today)}
                    max={toInputDate(maximumDeliveryDate)}
                    value={deliveryMode === "custom" ? toInputDate(deliveryDate) : ""}
                    onChange={e => {
                      if (!e.target.value) return
                      const [y, m, d] = e.target.value.split("-").map(Number)
                      const picked = new Date(y, m - 1, d); picked.setHours(0, 0, 0, 0)
                      setDeliveryDate(picked)
                      setDeliveryMode("custom")
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Pick a custom delivery date"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 rounded-lg bg-[#F0F7F1]">
                <svg className="w-3.5 h-3.5 flex-shrink-0 text-[#2E8B34]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-xs text-gray-600">Delivery time zone: Philippine Time (GMT+8)</span>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                Delivered anytime on <span className="font-semibold text-gray-700">{fmt(deliveryDate)}</span> during business hours (9 AM to 6 PM). Our team coordinates the exact timing with the recipient.
              </p>
              
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 mt-2">
                <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  <strong>Note:</strong> Your selected delivery date is not final and is subject to change depending on our daily order volume. You will receive a notification confirming your final delivery schedule.
                </p>
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-7 h-7 rounded-lg bg-[#F0F7F1] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#2E8B34]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                </span>
                <h2 className="text-sm font-bold text-gray-800">Payment notice</h2>
              </div>
              
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-3.5">
                  <p className="text-xs font-bold text-orange-900">Secure online payment</p>
                  <p className="text-[11px] text-orange-800 leading-relaxed mt-1">
                    After placing your order, you will continue to PayMongo to choose GCash, QRPh, or a debit or credit card.
                  </p>
                  <p className="text-[11px] text-orange-800 leading-relaxed mt-2">
                    Your order remains pending until PayMongo confirms the payment.
                </p>
              </div>

              {/* Voucher */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Voucher</label>
                {appliedVoucher ? (
                  <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-[#2E8B34] bg-[#F0F7F1]">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#2E8B34] truncate">{appliedVoucher.code}</p>
                      <p className="text-[11px] text-gray-500">
                        {appliedVoucher.type === "percent" ? `${appliedVoucher.value}% off` : `₱${appliedVoucher.value} off`} · −₱{discount.toLocaleString()}
                      </p>
                    </div>
                    <button onClick={removeVoucher} className="text-xs font-semibold text-gray-500 hover:text-red-500 flex-shrink-0">REMOVE</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={voucher}
                      onChange={e => { setVoucher(e.target.value); if (voucherMsg) setVoucherMsg(null) }}
                      onKeyDown={e => { if (e.key === "Enter") applyVoucher() }}
                      placeholder="Enter voucher code"
                      className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2E8B34] transition placeholder-gray-400 uppercase placeholder:normal-case"
                    />
                    <button onClick={applyVoucher} className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#2E8B34] text-[#2E8B34] transition hover:bg-[#F0F7F1]">APPLY</button>
                  </div>
                )}
                {voucherMsg && (
                  <div className={`mt-2 flex items-start gap-1.5 text-xs ${voucherMsg.type === "success" ? "text-[#2E8B34]" : "text-red-500"}`}>
                    {voucherMsg.type === "success" ? (
                      <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    <span>{voucherMsg.text}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Special Instructions */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Special Instructions
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Any specific requests? (e.g. ribbon color, delivery instructions)
              </p>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Leave your note here..."
                rows="3"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-[#F7F8FA] text-gray-700 transition resize-y focus:border-[#2E8B34] focus:ring-1 focus:ring-[#2E8B34]"
              />
            </div>

            {/* Summary + Place Order */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-2.5 text-sm mb-4">
                <div className="flex justify-between text-gray-500"><span>Subtotal ({cartItems.length} item{cartItems.length !== 1 ? "s" : ""})</span><span className="font-medium text-gray-700">₱{subtotal.toLocaleString()}.00</span></div>
                <div className="flex justify-between text-gray-500"><span>Shipping Fee</span><span className="font-medium text-gray-700">₱{shipping}.00</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#2E8B34]">
                    <span>Voucher{appliedVoucher ? ` (${appliedVoucher.code})` : ""}</span>
                    <span className="font-medium">−₱{discount.toLocaleString()}.00</span>
                  </div>
                )}
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-bold text-gray-800">Order total</span>
                  <span className="text-xl font-extrabold text-[#2E8B34]">₱{total.toLocaleString()}.00</span>
                </div>
                <p className="text-xs text-gray-400">VAT included, where applicable</p>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 text-center font-medium shadow-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="w-full py-3.5 text-sm font-bold text-white rounded-xl transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                style={{ background: `linear-gradient(135deg, ${DG}, ${G})`, boxShadow: "0 8px 20px rgba(46,139,52,0.22)" }}
              >
                {placing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                    Placing order...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Continue to PayMongo
                  </>
                )}
              </button>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-gray-500">
                By continuing to PayMongo, you acknowledge our{" "}
                <button
                  type="button"
                  onClick={() => setOrderingPolicyOpen(true)}
                  className="font-semibold text-[#2E8B34] underline underline-offset-2 hover:text-[#0C573E]"
                >
                  Ordering &amp; Fulfillment Policy
                </button>.
              </p>
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 mt-3">
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Secure payment powered by PayMongo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Preview Modal */}
      {mapFullscreenOpen && (
        <div
          className="fixed inset-0 z-[60] overflow-y-auto bg-black/75"
          onClick={() => setMapFullscreenOpen(false)}
        >
          <div className="flex min-h-full w-full items-center justify-center px-3 py-12 sm:px-5 sm:py-16">
            <div
              className="bg-white rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col"
              style={{ height: "min(720px, calc(100dvh - 6rem))", maxHeight: "calc(100dvh - 6rem)" }}
              onClick={event => event.stopPropagation()}
            >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-gray-800">Delivery pin</h3>
                <p className="text-xs text-gray-500 truncate">{activeDeliveryPin?.label || "Search for the exact delivery location"}</p>
              </div>
              <button
                type="button"
                onClick={() => setMapFullscreenOpen(false)}
                className="px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-gray-700 flex-shrink-0"
              >
                Close
              </button>
            </div>
            <div className="relative flex-1 min-h-0">
              <iframe
                title="Delivery pin full screen map"
                src={makeMapUrl(mapPreviewPin)}
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
              />
              {renderDeliveryPinSearch()}
            </div>
            <div className="px-4 py-2 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between gap-3">
              <span>{activeDeliveryPin ? `Coordinates: ${Number(activeDeliveryPin.lat).toFixed(6)}, ${Number(activeDeliveryPin.lng).toFixed(6)}` : "Search and select an address to set the delivery pin."}</span>
              <button
                type="button"
                onClick={() => setMapFullscreenOpen(false)}
                className="text-[11px] font-bold text-[#2E8B34] hover:underline flex-shrink-0"
              >
                Close map
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">{recipientType === "manual_self" ? "Delivery Address" : "Recipient Details"}</h3>
            <p className="text-sm text-gray-400 mb-4">Search for the location, confirm its map pin, and complete any missing details.</p>
            <form onSubmit={(e) => { e.preventDefault(); setShowManualModal(false); }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Search delivery address</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" /></svg>
                    <input
                      type="search"
                      value={addressSearch}
                      onChange={event => {
                        setAddressSearch(event.target.value)
                        setAddressSearchResults([])
                        setAddressSearchError("")
                      }}
                      onKeyDown={event => {
                        if (event.key === "Enter") {
                          event.preventDefault()
                          searchOpenStreetMapAddress()
                        }
                      }}
                      placeholder="Search street, building, barangay, or city"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2E8B34] focus:border-[#2E8B34]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={searchOpenStreetMapAddress}
                    disabled={addressSearching}
                    className="px-4 py-2.5 rounded-lg bg-[#2E8B34] text-white text-xs font-bold hover:bg-[#26772c] disabled:opacity-60"
                  >
                    {addressSearching ? "Searching..." : "Search"}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">Address data © OpenStreetMap contributors</p>
                {addressSearchError && <p className="text-xs text-red-500 mt-2">{addressSearchError}</p>}
                {addressSearchResults.length > 0 && (
                  <div className="mt-2 rounded-lg border border-gray-200 divide-y divide-gray-100 overflow-hidden max-h-52 overflow-y-auto">
                    {addressSearchResults.map((result, index) => (
                      <button
                        key={`${result.lat}-${result.lng}-${index}`}
                        type="button"
                        onClick={() => selectOpenStreetMapAddress(result)}
                        className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left bg-white hover:bg-[#F0F7F1] transition"
                      >
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#2E8B34]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21s6-5.686 6-11a6 6 0 1 0-12 0c0 5.314 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></svg>
                        <span className="text-xs leading-relaxed text-gray-700">{result.label}</span>
                      </button>
                    ))}
                  </div>
                )}
                {manualForm.latitude && manualForm.longitude && (
                  <>
                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#F0F7F1] px-3 py-2 text-xs font-semibold text-[#2E8B34]">
                      <span className="w-2 h-2 rounded-full bg-[#2E8B34]" />
                      Address and map pin fetched from OpenStreetMap
                    </div>
                    <div className="mt-2 h-44 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                      <iframe
                        title="Searched delivery location"
                        src={makeMapUrl({ lat: manualForm.latitude, lng: manualForm.longitude })}
                        className="w-full h-full border-0"
                      />
                    </div>
                  </>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Recipient Name *</label>
                <input
                  type="text"
                  value={manualForm.recipient_name}
                  onChange={e => setManualForm({ ...manualForm, recipient_name: e.target.value })}
                  placeholder="Full name of recipient"
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2E8B34] focus:border-[#2E8B34]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone Number *</label>
                <input
                  type="tel"
                  value={manualForm.phone}
                  onChange={e => setManualForm({ ...manualForm, phone: e.target.value })}
                  placeholder="0917 123 4567"
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2E8B34] focus:border-[#2E8B34]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Street Address *</label>
                <input
                  type="text"
                  value={manualForm.street}
                  onChange={e => setManualForm({ ...manualForm, street: e.target.value, latitude: null, longitude: null, geocode_precision: null })}
                  placeholder="123 Main St, Building Name"
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2E8B34] focus:border-[#2E8B34]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Barangay</label>
                  <input
                    type="text"
                    value={manualForm.barangay}
                    onChange={e => setManualForm({ ...manualForm, barangay: e.target.value, latitude: null, longitude: null, geocode_precision: null })}
                    placeholder="Barangay Malabanias"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2E8B34] focus:border-[#2E8B34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">City / Municipality *</label>
                  <input
                    type="text"
                    value={manualForm.city}
                    onChange={e => setManualForm({ ...manualForm, city: e.target.value, latitude: null, longitude: null, geocode_precision: null })}
                    placeholder="Angeles"
                    required
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2E8B34] focus:border-[#2E8B34]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Province *</label>
                  <input
                    type="text"
                  value={manualForm.province}
                  onChange={e => setManualForm({ ...manualForm, province: e.target.value, latitude: null, longitude: null, geocode_precision: null })}
                    placeholder="Pampanga"
                    required
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2E8B34] focus:border-[#2E8B34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">ZIP Code</label>
                  <input
                    type="text"
                  value={manualForm.zip}
                  onChange={e => setManualForm({ ...manualForm, zip: e.target.value, latitude: null, longitude: null, geocode_precision: null })}
                    placeholder="2009"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2E8B34] focus:border-[#2E8B34]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="saveToBook"
                  checked={saveAddressToBook}
                  onChange={e => setSaveAddressToBook(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 accent-[#2E8B34]"
                />
                <label htmlFor="saveToBook" className="text-xs text-gray-600">
                  Save to my address book for future orders
                </label>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-sm font-semibold text-white rounded-lg bg-[#2E8B34] transition hover:brightness-105"
                >
                  Save Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <OrderingFulfillmentModal
        open={orderingPolicyOpen}
        onClose={() => setOrderingPolicyOpen(false)}
      />
    </div>
  )
}
