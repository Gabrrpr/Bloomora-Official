import { useState, useEffect } from "react"
import { api } from "../../services/api.js"
import { getCart, clearCart } from "../../utils/cart.js"
import { useAuth } from "../../context/AuthContext"
import { computeDiscount } from "../../utils/vouchers.js"
import { API_BASE } from "../../config/api.js"

const G = "#2E8B34"
const DG = "#0C573E"

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

export default function Checkout({ onNavigate }) {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const deliveryTime = "Anytime"
  const [paymentMethod, setPaymentMethod] = useState("paymongo");
  const [fulfillmentMethod, setFulfillmentMethod] = useState("delivery");
  const [lalamoveEnabled, setLalamoveEnabled] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState({ delivery_fee: 100, minimum_order: 0, same_day_cutoff: "14:00" });
  const [referenceNumber, setReferenceNumber] = useState("")
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
  const [saveAddressToBook, setSaveAddressToBook] = useState(false)
  const [manualForm, setManualForm] = useState({
    recipient_name: "",
    phone: "",
    street: "",
    barangay: "",
    city: "",
    province: "",
    zip: "",
  })

  useEffect(() => {
    api.getCheckoutSettings()
      .then(data => setDeliverySettings(current => ({ ...current, ...(data.delivery || {}) })))
      .catch(() => {})
  }, [])

  useEffect(() => {
    api.getLalamoveEnabled()
      .then(data => setLalamoveEnabled(Boolean(data.enabled)))
      .catch(() => setLalamoveEnabled(false))
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
 	const shipping = cartItems.length > 0 && (fulfillmentMethod === "delivery" || fulfillmentMethod === "lalamove") ? Number(deliverySettings.delivery_fee || 0) : 0
  const discount = computeDiscount(appliedVoucher, subtotal)
  const total = Math.max(0, subtotal + shipping - discount)

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

  const provinceToBranch = (provinceOrAddress) => {
    const p = (provinceOrAddress || "").toLowerCase()
    if (!p) return null
    if (p.includes("pampanga") || p.includes("angeles") || p.includes("mabalacat") || p.includes("san fernando")) return "Pampanga"
    if (p.includes("manila") || p.includes("ncr") || p.includes("quezon") || p.includes("makati") || p.includes("pasig") || p.includes("taguig") || p.includes("caloocan") || p.includes("paranaque") || p.includes("valenzuela") || p.includes("muntinlupa") || p.includes("mandaluyong") || p.includes("marikina") || p.includes("pasay")) return "Manila"
    return null
  }

  const pickupAddressSource = selectedAddress
    ? [selectedAddress.street, selectedAddress.barangay, selectedAddress.city, selectedAddress.province, selectedAddress.zip_code].filter(Boolean).join(", ")
    : (customer?.address || user?.address || "")
  const pickupBranchName = provinceToBranch(selectedAddress?.province || pickupAddressSource) || selectedStoreBranch
  const pickupBranch = PICKUP_BRANCHES[pickupBranchName] || PICKUP_BRANCHES.Manila;
  const selectedAddressText = selectedAddress
    ? [selectedAddress.street, selectedAddress.barangay, selectedAddress.city, selectedAddress.province, selectedAddress.zip_code].filter(Boolean).join(", ")
    : (customer?.address || user?.address || "")
  const manualAddressText = [manualForm.street, manualForm.barangay, manualForm.city, manualForm.province, manualForm.zip].filter(Boolean).join(", ")
  const deliveryAddressText = recipientType === "myself" ? selectedAddressText : manualAddressText
  const deliveryAddressBranch = provinceToBranch(
    recipientType === "myself"
      ? (selectedAddress ? selectedAddress.province || selectedAddressText : selectedAddressText)
      : manualForm.province || manualAddressText
  )
  const isManilaAddress = deliveryAddressBranch === "Manila"
  const isLalamoveAvailable = lalamoveEnabled && isManilaAddress
  const showStandardDelivery = !isLalamoveAvailable

  useEffect(() => {
    if (fulfillmentMethod === "lalamove" && !isLalamoveAvailable) {
      setFulfillmentMethod("pickup")
    } else if (fulfillmentMethod === "delivery" && isLalamoveAvailable) {
      setFulfillmentMethod("lalamove")
    }
  }, [fulfillmentMethod, isLalamoveAvailable])

  const getDeliveryDetails = () => {
    if (fulfillmentMethod === "pickup") {
      return {
        name: fullName,
        phone: customer?.phone_number || user?.phoneNumber || "",
        address: `Pickup - ${pickupBranch.label}: ${pickupBranch.address}`,
      }
    }
    if (fulfillmentMethod === "lalamove") {
      return {
        name: fullName,
        phone: customer?.phone_number || user?.phoneNumber || "",
        address: deliveryAddressText,
      }
    }
    if (recipientType === "myself") {
      if (selectedAddress) {
        return {
          name: selectedAddress.recipient_name,
          phone: selectedAddress.phone,
          address: [selectedAddress.street, selectedAddress.barangay, selectedAddress.city, selectedAddress.province, selectedAddress.zip_code].filter(Boolean).join(", "),
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

  const addressBranch = (fulfillmentMethod === "pickup")
    ? pickupBranchName
    : (fulfillmentMethod === "lalamove")
      ? deliveryAddressBranch
      : provinceToBranch(
        recipientType === "myself" 
          ? (selectedAddress ? selectedAddress.province : (customer?.address || user?.address)) 
          : manualForm.province
      )
  
  const needsBranchConfirm = fulfillmentMethod === "delivery" && selectedStoreBranch && addressBranch && (selectedStoreBranch.toLowerCase() !== addressBranch.toLowerCase())
  const [branchConfirmOpen, setBranchConfirmOpen] = useState(false)

  const buildDeliveryNotes = () =>
    `[BRANCH:${addressBranch || "Manila"}] ${fulfillmentMethod === "pickup" ? `Pickup at ${pickupBranch.label}` : `Delivery time: ${deliveryTime}`} | Recipient: ${deliveryDetails.name} (${deliveryDetails.phone || "No phone provided"})${appliedVoucher ? ` | Voucher: ${appliedVoucher.code}` : ""}`

  const buildOrderData = (orderIds) => ({
    orderIds,
    payment_method: paymentMethod,
    payment_status: paymentMethod === "paymongo" ? "pending" : "pending",
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
      if (saveAddressToBook && recipientType === "someone_else" && manualForm.recipient_name && manualForm.phone && manualForm.street) {
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
        payment_reference: referenceNumber.trim(),
        fulfillment_method: fulfillmentMethod,
        special_note: orderNote.trim() || null,
        
        // 🚀 THE FIX: Force these to strictly lowercase so the Database Enum accepts them!
        branch_name: addressBranch.toLowerCase(),
        branch: addressBranch.toLowerCase(),
        voucher_code: appliedVoucher?.code || null,
      });

      const orderIds = res.order_ids || [];
      localStorage.setItem("bloomora_last_order", JSON.stringify(buildOrderData(orderIds)));
      await clearCart();

      // 2. Fetch PayMongo link directly if selected
      if (paymentMethod === "paymongo" && orderIds.length > 0) {
        const token = localStorage.getItem("access_token");
        const pmReq = await fetch(`${API_BASE}/payments/paymongo/checkout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            order_ids: orderIds,
            success_url: `${window.location.origin}/confirmation?payment=success&order_id=${encodeURIComponent(orderIds[0])}`,
            cancel_url: `${window.location.origin}/checkout?payment=cancelled`
          })
        });

        const pmData = await pmReq.json();

        if (!pmReq.ok) {
           const errorMsg = typeof pmData.detail === 'string' ? pmData.detail : JSON.stringify(pmData.detail) || "Unknown backend error.";
           throw new Error(`PayMongo Error: ${errorMsg}`);
        }

        if (pmData.checkout_url) {
          window.location.href = pmData.checkout_url;
          return; 
        } else {
          throw new Error("PayMongo succeeded but did not return a checkout URL.");
        }
      }

      // 3. Fallback for manual transfer or fallback URL
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
      } else {
        onNavigate("confirmation");
      }

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
        setError("Please provide a complete delivery address and phone number before placing an order.");
        return;
      }
      if (!addressBranch) {
        setError("Sorry, we currently only deliver to Metro Manila and Pampanga areas. Please provide a valid address within our coverage.");
        return;
      }
    } else if (fulfillmentMethod === "lalamove") {
      if (!deliveryDetails.address || !deliveryDetails.phone) {
        setError("Please provide a complete delivery address and phone number for Lalamove delivery.");
        return;
      }
      if (!isLalamoveAvailable) {
        setError("Lalamove is only available within Metro Manila. Please provide a valid Manila address.");
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
    if (paymentMethod === "qrph" && !referenceNumber.trim()) {
      setError("Please enter your Transaction Reference Number (TRN) to verify your manual payment.");
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
      if (!addressBranch) {
        setError("Sorry, we only deliver to Metro Manila and Pampanga. Please provide a valid address within our coverage.");
        return;
      }
    } else if (fulfillmentMethod === "lalamove") {
      if (!deliveryDetails.address || !deliveryDetails.phone) {
        setError("Please provide a complete delivery address and phone number for Lalamove delivery.");
        return;
      }
      if (!isLalamoveAvailable) {
        setError("Lalamove is only available within Metro Manila. Please provide a valid Manila address.");
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
                  className={`flex-1 py-2 text-xs font-semibold rounded-md transition ${recipientType === "myself" ? "bg-white text-[#2E8B34] shadow-sm" : "bg-transparent text-gray-500"}`}
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
                          if (!user) {
                            onNavigate("login"); 
                          } else {
                            onNavigate("profile");
                          }
                        }}
                        className="w-full py-2 text-xs font-semibold text-gray-500 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        + Manage Addresses
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
                        onClick={() => onNavigate("profile")}
                        className="w-full py-2 text-xs font-semibold text-gray-500 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        + Manage Addresses
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
                      + Enter Recipient Details
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Package */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
              <p className="text-xs text-gray-400 font-medium mb-4">Package 1 of 1</p>

              {/* Delivery option */}
              <p className="text-xs font-medium text-gray-500 mb-3">Fulfillment method</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {showStandardDelivery && (
                  <div
                    onClick={() => { setFulfillmentMethod("delivery") }}
                    className={`border-2 rounded-lg p-3.5 cursor-pointer transition ${fulfillmentMethod === "delivery" ? "border-[#2E8B34] bg-[#F0F7F1]" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${fulfillmentMethod === "delivery" ? "border-[#2E8B34]" : "border-gray-300"}`}>
                        {fulfillmentMethod === "delivery" && <div className="w-2.5 h-2.5 rounded-full bg-[#2E8B34]" />}
                      </div>
                      <span className={`text-sm font-semibold ${fulfillmentMethod === "delivery" ? "text-[#2E8B34]" : "text-gray-700"}`}>Standard</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Metro Manila or Pampanga coverage<br />Scheduled by branch team</p>
                  </div>
                )}

                {lalamoveEnabled && (
                  <div
                    onClick={() => { if (isLalamoveAvailable) setFulfillmentMethod("lalamove") }}
                    className={`border-2 rounded-lg p-3.5 transition ${isLalamoveAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-60"} ${fulfillmentMethod === "lalamove" ? "border-[#2E8B34] bg-[#F0F7F1]" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${fulfillmentMethod === "lalamove" ? "border-[#2E8B34]" : "border-gray-300"}`}>
                        {fulfillmentMethod === "lalamove" && <div className="w-2.5 h-2.5 rounded-full bg-[#2E8B34]" />}
                      </div>
                      <span className={`text-sm font-semibold ${fulfillmentMethod === "lalamove" ? "text-[#2E8B34]" : "text-gray-700"}`}>Lalamove</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      {isLalamoveAvailable ? "Manila eligible address" : "Available only for Manila addresses"}<br />Fast same-day delivery
                    </p>
                  </div>
                )}

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
                <h2 className="text-sm font-bold text-gray-800">Select payment method</h2>
              </div>
              
              <div className="space-y-3">
                <div 
                  onClick={() => { setPaymentMethod("paymongo"); setReferenceNumber(""); }} 
                  className={`border-2 rounded-lg p-3 flex items-center gap-3 cursor-pointer transition-colors ${paymentMethod === "paymongo" ? "border-[#2E8B34] bg-[#F0F7F1]" : "border-gray-200"}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === "paymongo" ? "border-[#2E8B34]" : "border-gray-300"}`}>
                    {paymentMethod === "paymongo" && <div className="w-2 h-2 rounded-full bg-[#2E8B34]" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-800">Online Payment</p>
                    <p className="text-[10px] text-gray-500">GCash, Maya, or Card (Auto-Verified via PayMongo)</p>
                  </div>
                </div>

                <div 
                  onClick={() => setPaymentMethod("qrph")} 
                  className={`border-2 rounded-lg p-3 flex items-center gap-3 cursor-pointer transition-colors ${paymentMethod === "qrph" ? "border-[#2E8B34] bg-[#F0F7F1]" : "border-gray-200"}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === "qrph" ? "border-[#2E8B34]" : "border-gray-300"}`}>
                    {paymentMethod === "qrph" && <div className="w-2 h-2 rounded-full bg-[#2E8B34]" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-800">Manual Transfer (QRPh / Bank)</p>
                    <p className="text-[10px] text-gray-500">Scan our QR and enter your Reference Number below</p>
                  </div>
                </div>
              </div>

              {paymentMethod === "qrph" && (
                <div className="mt-3 p-3.5 bg-gray-50 border border-gray-200 rounded-lg">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Transaction Reference Number (TRN) <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[10px] text-gray-500 mb-2.5 leading-relaxed">
                    Please transfer the exact amount using our QR code. After paying, input the 13-digit Reference Number from your receipt.
                  </p>
                  <input
                    value={referenceNumber}
                    onChange={e => { setReferenceNumber(e.target.value); setError(""); }}
                    placeholder="e.g. 0001234567890"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-md outline-none focus:border-[#2E8B34] focus:ring-1 focus:ring-[#2E8B34] transition-all"
                  />
                </div>
              )}

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
                    Place Order
                  </>
                )}
              </button>
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 mt-3">
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Secure checkout · your payment details are encrypted
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Recipient Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Recipient Details</h3>
            <p className="text-sm text-gray-400 mb-4">Enter the delivery details for the recipient.</p>
            <form onSubmit={(e) => { e.preventDefault(); setShowManualModal(false); }} className="space-y-4">
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
                  onChange={e => setManualForm({ ...manualForm, street: e.target.value })}
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
                    onChange={e => setManualForm({ ...manualForm, barangay: e.target.value })}
                    placeholder="Barangay Malabanias"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2E8B34] focus:border-[#2E8B34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">City / Municipality *</label>
                  <input
                    type="text"
                    value={manualForm.city}
                    onChange={e => setManualForm({ ...manualForm, city: e.target.value })}
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
                    onChange={e => setManualForm({ ...manualForm, province: e.target.value })}
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
                    onChange={e => setManualForm({ ...manualForm, zip: e.target.value })}
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
    </div>
  )
}
