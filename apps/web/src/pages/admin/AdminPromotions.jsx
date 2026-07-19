import { useState, useEffect, useMemo, useRef } from "react"
import { useTheme } from "../../context/ThemeContext"
import { useBranch } from "../../context/BranchContext";
import { loadVouchers, saveVouchers } from "../../utils/vouchers.js"
import { api } from "../../services/api.js"
import SaveToast from "../../components/SaveToast"

const DG = "#0C573E"  
const G  = "#2E8B34"

// Customer notifications live here (read by the navbar bell).
const ANNOUNCE_KEY = "bloomora_announcements"
const ANNOUNCE_KEY_LEGACY = "bloomora_announcement" 

function loadAnnouncements() {
  try {
    const raw = localStorage.getItem(ANNOUNCE_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) return arr.map(a => ({ id: a.id ?? Date.now() + Math.random(), emoji: a.emoji || "", image: a.image || "", text: a.text || "", active: a.active !== false }))
    }
    const legacy = localStorage.getItem(ANNOUNCE_KEY_LEGACY)
    if (legacy) {
      const a = JSON.parse(legacy)
      if (a && a.text) return [{ id: Date.now(), emoji: "", image: "", text: a.text, active: !!a.enabled }]
    }
  } catch { /* ignore */ }
  return []
}

function compressImage(file, maxDim = 400, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          const scale = Math.min(maxDim / width, maxDim / height)
          width = Math.round(width * scale); height = Math.round(height * scale)
        }
        const canvas = document.createElement("canvas")
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext("2d")
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        try { resolve(canvas.toDataURL("image/jpeg", quality)) }
        catch (e) { reject(e) }
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const blankForm = { code: "", type: "percent", value: "", minSpend: "", expires: "", active: true }
const blankBundleForm = {
  name: "", category: "", minimumQuantity: "", discountPercent: "",
  startDate: new Date().toISOString().slice(0, 10), endDate: "", active: true,
}
const blankAnnForm = { emoji: "", image: "", text: "", active: true }
const EMOJI_CHOICES = ["🌸", "🌷", "💐", "🎁", "❤️", "🎉", "✨", "🚚", "⏰", "🏷️"]

function PromotionConfirmationModal({ confirmation, busy, error, isDark, onCancel, onConfirm }) {
  useEffect(() => {
    if (!confirmation || busy) return undefined
    const closeOnEscape = event => { if (event.key === "Escape") onCancel() }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [confirmation, busy, onCancel])

  if (!confirmation) return null

  const panelBg = isDark ? "#1e293b" : "#ffffff"
  const titleColor = isDark ? "#f8fafc" : "#111827"
  const copyColor = isDark ? "#cbd5e1" : "#6b7280"
  const borderColor = isDark ? "#334155" : "#e5e7eb"

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" role="presentation">
      <button type="button" aria-label="Close confirmation" onClick={busy ? undefined : onCancel}
        className="absolute inset-0 cursor-default border-none" style={{ background: "rgba(15,23,42,0.62)", backdropFilter: "blur(3px)" }} />
      <div role="alertdialog" aria-modal="true" aria-labelledby="promotion-confirm-title" aria-describedby="promotion-confirm-message"
        className="relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: panelBg, border: `1px solid ${borderColor}` }}>
        <div className="p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: isDark ? "rgba(239,68,68,0.14)" : "#fef2f2", color: isDark ? "#fca5a5" : "#dc2626" }}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16a2 2 0 001.73 3z" />
            </svg>
          </div>
          <h2 id="promotion-confirm-title" className="text-lg font-bold" style={{ color: titleColor }}>{confirmation.title}</h2>
          <p id="promotion-confirm-message" className="mt-2 text-sm leading-6" style={{ color: copyColor }}>{confirmation.message}</p>
          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg px-3 py-2 text-xs font-medium"
              style={{ background: isDark ? "rgba(239,68,68,0.12)" : "#fef2f2", border: `1px solid ${isDark ? "rgba(239,68,68,0.3)" : "#fecaca"}`, color: isDark ? "#fca5a5" : "#dc2626" }}>
              <span aria-hidden="true">!</span><span>{error}</span>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4" style={{ background: isDark ? "#162032" : "#f8fafc", borderTop: `1px solid ${borderColor}` }}>
          <button type="button" onClick={onCancel} disabled={busy}
            className="rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            style={{ color: copyColor, border: `1px solid ${borderColor}`, background: panelBg }}>Cancel</button>
          <button type="button" onClick={onConfirm} disabled={busy}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? "Deleting..." : confirmation.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPromotions() {
  const { isDark } = useTheme()
  const { branch, setBranch } = useBranch();

  const cardBg    = isDark ? "#1e293b" : "white"
  const cardBdr   = isDark ? "#334155" : "#e8edf2"
  const headerBg  = isDark ? "#162032" : "#fafbfc"
  const headerBdr = isDark ? "#2d3f55" : "#f1f5f9"
  const bodyTxt   = isDark ? "#f1f5f9" : "#111827"
  const subTxt    = isDark ? "#94a3b8" : "#9ca3af"
  const mutedTxt  = isDark ? "#64748b" : "#9ca3af"
  const divider   = isDark ? "#1e293b" : "#f1f5f9"
  const inputBg   = isDark ? "#0f172a" : "white"
  const inputBdr  = isDark ? "#334155" : "#e2e8f0"
  const tableHead = isDark ? "#162032" : "#fafbfc"
  const tableBdr  = isDark ? "#2d3f55" : "#f1f5f9"
  const rowAlt    = isDark ? "#162032" : "#fafbfc"
  const accentG   = isDark ? "#4ade80" : G

  const [vouchers, setVouchers]   = useState(() => loadVouchers())
  const [form, setForm]           = useState(blankForm)
  const [editingCode, setEditing] = useState(null) 
  const [formError, setFormError] = useState("")
  const [savedFlash, setSaved]    = useState(false)

  // ── Announcements (list) ──
  const [announcements, setAnnouncements] = useState(() => loadAnnouncements())
  const [annForm, setAnnForm]             = useState(blankAnnForm)
  const [annEditingId, setAnnEditing]     = useState(null)
  const [annError, setAnnError]           = useState("")
  const [annSaved, setAnnSaved]           = useState(false)
  const annIsEditing = annEditingId !== null
  const annFileRef = useRef(null)

  // Flash sale state
  const [products, setProducts] = useState([])
  const [promoCategory, setPromoCategory] = useState("All")
  const [selectedPromoIds, setSelectedPromoIds] = useState([])
  const [flashDiscount, setFlashDiscount] = useState("")
  const [bundlePromotions, setBundlePromotions] = useState([])
  const [bundleForm, setBundleForm] = useState(blankBundleForm)
  const [bundleError, setBundleError] = useState("")
  const [bundleSaving, setBundleSaving] = useState(false)

  const [flashSaleLoading, setFlashSaleLoading] = useState(false)
  const [flashSaleError, setFlashSaleError] = useState("")
  const [flashSaleSuccess, setFlashSaleSuccess] = useState("")
  const [confirmation, setConfirmation] = useState(null)
  const [confirmationBusy, setConfirmationBusy] = useState(false)
  const [confirmationError, setConfirmationError] = useState("")
  // Drives the one-time entrance animation; removed after it plays so it never replays.
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    api.getProducts({ limit: 100, branch })
       .then(data => {
         const list = data?.items || data?.data || data || []
         setProducts(list.filter(product =>
           product.is_visible !== false
           && product.status !== "inactive"
           && product.is_customization_material !== true
         ))
       })
       .catch(err => console.error("Failed to load products for flash sale", err))
  }, [branch])

  const loadBundlePromotions = () => api.getCampaigns()
    .then(data => {
      const list = data?.campaigns || data?.data || data || []
      setBundlePromotions((Array.isArray(list) ? list : []).filter(campaign => {
        const branches = campaign.branches || ["all"]
        return campaign.discount_type === "bundle_percent"
          && (branches.includes("all") || branches.includes(branch.toLowerCase()))
      }))
    })
    .catch(err => console.error("Failed to load bundle promotions", err))

  useEffect(() => { loadBundlePromotions() }, [branch])

  const loadBackendPromos = () => api.getPromos()
    .then(data => setVouchers((data || []).map(v => ({
      id: v.id,
      code: v.code,
      type: v.discount_type,
      value: Number(v.discount_value),
      minSpend: Number(v.min_spend || 0),
      expires: v.expires_at ? v.expires_at.slice(0, 10) : "",
      active: v.is_active !== false,
    }))))
    .catch(err => console.error("Failed to load promo codes", err))

  useEffect(() => {
    loadBackendPromos()
  }, [])

  // Play the entrance animation once on mount, then turn it off.
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 1500)
    return () => clearTimeout(t)
  }, [])

  // 🚀 NEW: Strict Branch Matcher Function for Promotions
  const matchesBranch = (p) => {
    if (!p) return false;
    const b = branch.toLowerCase();
    if (Array.isArray(p.branches)) return p.branches.length === 0 || p.branches.map(x => x.toLowerCase()).includes(b);
    if (p.branch) return p.branch.toLowerCase() === b;
    if (p.branch_name) return p.branch_name.toLowerCase() === b;
    return false;
  }

  // Category options for the filter dropdown
  const promoCategories = ["All", ...Array.from(new Set(products.map(p => {
    const c = p.category?.trim().toLowerCase();
    return c ? c.charAt(0).toUpperCase() + c.slice(1) : "";
  }).filter(Boolean)))];

  // Show only products that match the selected branch and category
  const filteredPromoProducts = products.filter(p => {
    const matchesCategory = promoCategory === "All" || p.category?.trim().toLowerCase() === promoCategory.toLowerCase();
    return matchesBranch(p) && matchesCategory;
  });

  const bundleCategoryProductCount = products.filter(product =>
    matchesBranch(product)
    && bundleForm.category
    && product.category?.trim().toLowerCase() === bundleForm.category.toLowerCase()
  ).length

  const branchSaleProducts = products.filter(p => {
    const currentPrice = Number(p.price || 0)
    const originalPrice = Number(p.original_price || 0)
    return matchesBranch(p) && originalPrice > currentPrice
  })

  const salePercent = (p) => {
    const currentPrice = Number(p.price || 0)
    const originalPrice = Number(p.original_price || 0)
    if (!originalPrice || originalPrice <= currentPrice) return 0
    return Math.round((1 - currentPrice / originalPrice) * 100)
  }

  const isEditing = editingCode !== null
  const set = (k) => (v) => { setForm(p => ({ ...p, [k]: v })); if (formError) setFormError("") }

  const persist = (list) => { setVouchers(list); saveVouchers(list) }

  const persistAnnouncements = (list) => {
    setAnnouncements(list)
    try {
      localStorage.setItem(ANNOUNCE_KEY, JSON.stringify(list))
      window.dispatchEvent(new Event("bloomora:announcement-updated"))
    } catch { /* ignore */ }
  }

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])
  const isExpired = (v) => v.expires && new Date(v.expires) < today

  const resetForm = () => { setForm(blankForm); setEditing(null); setFormError("") }

  const submitForm = async () => {
    const code = form.code.trim().toUpperCase()
    if (!code) return setFormError("Enter a promo code.")
    if (!/^[A-Z0-9]+$/.test(code)) return setFormError("Code can only contain letters and numbers (no spaces).")
    const num = Number(form.value)
    if (!form.value || isNaN(num) || num <= 0) return setFormError("Enter a discount value greater than 0.")
    if (form.type === "percent" && num > 100) return setFormError("A percentage discount can't exceed 100%.")
    const clash = vouchers.some(v => (v.code || "").toUpperCase() === code && (!isEditing || code !== editingCode.toUpperCase()))
    if (clash) return setFormError("A promo code with that name already exists.")

    const entry = {
      code,
      type: form.type,
      value: num,
      minSpend: form.minSpend ? Math.max(0, Number(form.minSpend) || 0) : 0,
      expires: form.expires || "",
      active: !!form.active,
    }

    const payload = {
      code: entry.code,
      discount_type: entry.type,
      discount_value: entry.value,
      min_spend: entry.minSpend,
      expires_at: entry.expires ? new Date(`${entry.expires}T23:59:59+08:00`).toISOString() : null,
      is_active: entry.active,
    }
    const current = vouchers.find(v => (v.code || "").toUpperCase() === editingCode?.toUpperCase())
    try {
      if (isEditing && current?.id) await api.updatePromo(current.id, payload)
      else await api.createPromo(payload)
      await loadBackendPromos()
    } catch (error) {
      setFormError(error.message || "Unable to save promo code.")
      return
    }
    setSaved(true); setTimeout(() => setSaved(false), 2000)
    resetForm()
  }

  const startEdit = (v) => {
    setEditing(v.code)
    setForm({
      code: v.code || "",
      type: v.type || "percent",
      value: String(v.value ?? ""),
      minSpend: v.minSpend ? String(v.minSpend) : "",
      expires: v.expires || "",
      active: v.active !== false,
    })
    setFormError("")
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const toggleActive = async (code) => {
    const voucher = vouchers.find(v => (v.code || "").toUpperCase() === code.toUpperCase())
    if (!voucher?.id) return
    await api.updatePromo(voucher.id, {
      code: voucher.code,
      discount_type: voucher.type,
      discount_value: voucher.value,
      min_spend: voucher.minSpend || 0,
      expires_at: voucher.expires ? new Date(`${voucher.expires}T23:59:59+08:00`).toISOString() : null,
      is_active: !(voucher.active !== false),
    })
    await loadBackendPromos()
  }
  const deleteVoucher = (code) => {
    const voucher = vouchers.find(v => (v.code || "").toUpperCase() === code.toUpperCase())
    setConfirmation({
      title: "Delete promo code?",
      message: `The promo code “${code}” will no longer be available to customers. This action cannot be undone.`,
      confirmLabel: "Delete promo code",
      action: async () => {
        if (voucher?.id) await api.deletePromo(voucher.id)
        await loadBackendPromos()
        if (isEditing && editingCode.toUpperCase() === code.toUpperCase()) resetForm()
      },
    })
    setConfirmationError("")
  }


  const annSet = (k) => (v) => { setAnnForm(p => ({ ...p, [k]: v })); if (annError) setAnnError("") }
  const resetAnnForm = () => { setAnnForm(blankAnnForm); setAnnEditing(null); setAnnError("") }
  const pickEmoji = (em) => setAnnForm(p => ({ ...p, emoji: p.emoji === em ? "" : em, image: "" }))

  const handleAnnImage = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) { setAnnError("Please choose an image file (PNG or JPG)."); return }
    try {
      const dataUrl = await compressImage(file)
      setAnnForm(p => ({ ...p, image: dataUrl, emoji: "" }))
      setAnnError("")
    } catch {
      setAnnError("Sorry, that image couldn't be processed.")
    }
  }

  const submitAnnouncement = () => {
    const text = annForm.text.trim()
    if (!text) return setAnnError("Enter the notification text.")
    const payload = { emoji: annForm.emoji, image: annForm.image, text, active: !!annForm.active }
    if (annIsEditing) {
      persistAnnouncements(announcements.map(a => a.id === annEditingId ? { ...a, ...payload } : a))
    } else {
      persistAnnouncements([{ id: Date.now(), ...payload }, ...announcements])
    }
    setAnnSaved(true); setTimeout(() => setAnnSaved(false), 2000)
    resetAnnForm()
  }

  const startAnnEdit = (a) => {
    setAnnEditing(a.id)
    setAnnForm({ emoji: a.emoji || "", image: a.image || "", text: a.text || "", active: a.active !== false })
    setAnnError("")
  }

  const toggleAnn = (id) => persistAnnouncements(announcements.map(a => a.id === id ? { ...a, active: !(a.active !== false) } : a))
  const deleteAnn = (id) => {
    const announcement = announcements.find(item => item.id === id)
    setConfirmation({
      title: "Delete customer notification?",
      message: `“${announcement?.text || "This notification"}” will be removed from the customer notification bar.`,
      confirmLabel: "Delete notification",
      action: async () => {
        persistAnnouncements(announcements.filter(a => a.id !== id))
        if (annIsEditing && annEditingId === id) resetAnnForm()
      },
    })
    setConfirmationError("")
  }

  const discountLabel = (v) => v.type === "percent" ? `${v.value}% off` : `₱${Number(v.value).toLocaleString()} off`

  const inputStyle = { border: `1.5px solid ${inputBdr}`, backgroundColor: inputBg, color: bodyTxt }
  const onFocusBorder = (e) => { e.target.style.borderColor = accentG; e.target.style.boxShadow = "0 0 0 2px rgba(46,139,52,0.15)" }
  const onBlurBorder  = (e) => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none" }


  // Add or remove a product from the selection
  const togglePromoProduct = (id) => {
    setSelectedPromoIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  }

  const handleSelectAll = () => {
    const visibleIds = filteredPromoProducts.map(p => p.id);
    const allSelected = visibleIds.every(id => selectedPromoIds.includes(id));
    
    if (allSelected) {
      setSelectedPromoIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedPromoIds(prev => [...new Set([...prev, ...visibleIds])]);
    }
  }

  // Apply the discount to every selected product
  const handleApplyFlashSale = async () => {
    if (selectedPromoIds.length === 0) {
      setFlashSaleError("Please select at least one product.");
      return;
    }
    if (flashDiscount === "") {
      setFlashSaleError("Please enter a discount percentage (0 to remove).");
      return;
    }
    
    setFlashSaleLoading(true);
    setFlashSaleError("");
    setFlashSaleSuccess("");

    try {
      // Process all selected products in parallel
      await Promise.all(selectedPromoIds.map(id => 
        api.post(`/products/admin/${id}/promote`, {
          discount_percent: Number(flashDiscount),
          branch: branch.toLowerCase(),
        })
      ));
      
      // Create a smart announcement based on count
      if (Number(flashDiscount) > 0) {
          let text = "";
          let image = "";

          if (selectedPromoIds.length === 1) {
              const promotedProduct = products.find(p => p.id === selectedPromoIds[0]);
              text = `Flash Sale! ${promotedProduct.name} is now ${flashDiscount}% OFF in our ${branch} branch! Shop now.`;
              image = promotedProduct.image_url || "";
          } else {
              text = `Massive Flash Sale! Up to ${flashDiscount}% OFF selected items in ${branch}! Grab them before they're gone.`;
          }

          const promoAnnouncement = { id: Date.now(), emoji: "🔥", image, text, active: true };
          persistAnnouncements([promoAnnouncement, ...announcements]);
      }
      
      setFlashSaleSuccess(`Successfully updated ${selectedPromoIds.length} product(s) for the ${branch} branch!`);
      setSelectedPromoIds([]); 
      setFlashDiscount(""); 
      setTimeout(() => setFlashSaleSuccess(""), 4000);
      
      // Refresh product list to get new prices
      const freshProducts = await api.getProducts({ limit: 100, branch });
      const freshList = freshProducts?.items || freshProducts?.data || freshProducts || [];
      setProducts(freshList.filter(product => product.is_customization_material !== true));

    } catch (err) {
      setFlashSaleError("Failed to apply promotion: " + (err.response?.data?.detail || err.message));
    } finally {
      setFlashSaleLoading(false);
    }
  }

  const submitBundlePromotion = async () => {
    const name = bundleForm.name.trim()
    const minimumQuantity = Number(bundleForm.minimumQuantity)
    const discountPercent = Number(bundleForm.discountPercent)
    if (!name) return setBundleError("Enter a bundle promotion name.")
    if (!bundleForm.category) return setBundleError("Select an eligible product category.")
    if (!bundleForm.startDate || !bundleForm.endDate) return setBundleError("Select the promotion start and end dates.")
    if (bundleForm.endDate < bundleForm.startDate) return setBundleError("The end date must be on or after the start date.")
    if (!Number.isInteger(minimumQuantity) || minimumQuantity < 2) return setBundleError("Minimum items must be at least 2.")
    if (!(discountPercent > 0 && discountPercent <= 100)) return setBundleError("Enter a percentage from 1 to 100.")
    if (bundleCategoryProductCount === 0) return setBundleError(`No customer-visible products are available in ${bundleForm.category} for ${branch}.`)

    setBundleSaving(true)
    setBundleError("")
    try {
      const payload = {
        name,
        campaign_key: `bundle_${Date.now()}`,
        start_at: new Date(`${bundleForm.startDate}T00:00:00+08:00`).toISOString(),
        end_at: new Date(`${bundleForm.endDate}T23:59:59+08:00`).toISOString(),
        is_active: bundleForm.active,
        discount_type: "bundle_percent",
        discount_value: discountPercent,
        minimum_quantity: minimumQuantity,
        eligible_category: bundleForm.category.trim().toLowerCase(),
        branches: [branch.toLowerCase()],
      }
      await api.createCampaign(payload)
      setBundleForm(blankBundleForm)
      await loadBundlePromotions()
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      setBundleError(error.message || "Unable to save bundle promotion.")
    } finally {
      setBundleSaving(false)
    }
  }

  const toggleBundlePromotion = async campaign => {
    await api.updateCampaign(campaign.id, { is_active: !campaign.is_active })
    await loadBundlePromotions()
  }

  const deleteBundlePromotion = campaign => {
    setConfirmation({
      title: "Delete bundle promotion?",
      message: `The automatic discount “${campaign.name}” will stop applying to eligible customer orders.`,
      confirmLabel: "Delete bundle discount",
      action: async () => {
        try {
          await api.deleteCampaign(campaign.id)
        } catch (error) {
          // A campaign may already have been deleted after an earlier 204
          // response was incorrectly treated as a JSON parsing failure.
          if (!/campaign not found/i.test(error.message || "")) throw error
        }
        await loadBundlePromotions()
      },
    })
    setConfirmationError("")
  }

  const closeConfirmation = () => {
    if (confirmationBusy) return
    setConfirmation(null)
    setConfirmationError("")
  }

  const confirmPromotionAction = async () => {
    if (!confirmation?.action || confirmationBusy) return
    setConfirmationBusy(true)
    setConfirmationError("")
    try {
      await confirmation.action()
      setConfirmation(null)
    } catch (error) {
      setConfirmationError(error.message || "The promotion could not be deleted. Please try again.")
    } finally {
      setConfirmationBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <SaveToast show={savedFlash || annSaved} isDark={isDark} message="Saved!" sub="Your promotion changes are now live." />
      <PromotionConfirmationModal confirmation={confirmation} busy={confirmationBusy} error={confirmationError}
        isDark={isDark} onCancel={closeConfirmation} onConfirm={confirmPromotionAction} />
      {/* Gentle fade + rise so content eases in once loaded instead of flashing. */}
      <style>{`
        @keyframes promoRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .promo-rise { animation: promoRise 0.85s ease-out both; }
      `}</style>

      {/* Page header */}
      <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 ${entered ? "" : "promo-rise"}`}>
        <div>
          <h1 className="text-xl font-bold" style={{ color: bodyTxt }}>Promotions & Flash Sales</h1>
          <p className="text-sm mt-0.5" style={{ color: subTxt }}>
            Manage global promo codes, apply direct product discounts, and send announcements.
          </p>
        </div>
        
        {/* Branch selector */}
        <div className="flex gap-2">
          {["Manila", "Pampanga"].map(b => (
            <button 
              key={b} 
              onClick={() => {
                setBranch(b);
                setSelectedPromoIds([]); // Clear selection to prevent cross-branch mistakes
                setBundleForm(form => ({ ...form, category: "" }));
              }}
              className="px-6 py-2 rounded-md font-bold transition-all text-sm"
              style={{
                backgroundColor: branch === b ? DG : "transparent",
                color: branch === b ? "white" : subTxt,
                border: `1px solid ${branch === b ? DG : inputBdr}`
              }}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Create / edit promo code */}
      <div className={`rounded-xl overflow-hidden ${entered ? "" : "promo-rise"}`}
        style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)", animationDelay: "0.1s" }}>
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${headerBdr}`, backgroundColor: headerBg }}>
          <p className="text-sm font-semibold" style={{ color: bodyTxt }}>
            {isEditing ? `Edit promo code · ${editingCode}` : "Create a promo code"}
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Code */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: mutedTxt }}>Promo code</label>
              <input value={form.code} onChange={e => set("code")(e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER20" maxLength={24}
                className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all uppercase"
                style={inputStyle} onFocus={onFocusBorder} onBlur={onBlurBorder} />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: mutedTxt }}>Discount type</label>
              <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: isDark ? "#0f172a" : "#f1f5f9", border: `1px solid ${inputBdr}` }}>
                {[["percent","Percent (%)"],["fixed","Fixed (₱)"]].map(([val,label]) => {
                  const on = form.type === val
                  return (
                    <button key={val} onClick={() => set("type")(val)}
                      className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-all"
                      style={{ backgroundColor: on ? cardBg : "transparent", color: on ? accentG : subTxt, boxShadow: on ? "0 1px 3px rgba(0,0,0,0.12)" : "none" }}>
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Value */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: mutedTxt }}>
                {form.type === "percent" ? "Percentage off" : "Amount off (₱)"}
              </label>
              <input value={form.value} onChange={e => set("value")(e.target.value.replace(/[^0-9.]/g, ""))}
                inputMode="decimal" placeholder={form.type === "percent" ? "10" : "100"}
                className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all"
                style={inputStyle} onFocus={onFocusBorder} onBlur={onBlurBorder} />
            </div>

            {/* Min spend */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: mutedTxt }}>Minimum spend (₱) <span className="font-normal">· optional</span></label>
              <input value={form.minSpend} onChange={e => set("minSpend")(e.target.value.replace(/[^0-9.]/g, ""))}
                inputMode="decimal" placeholder="0"
                className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all"
                style={inputStyle} onFocus={onFocusBorder} onBlur={onBlurBorder} />
            </div>

            {/* Expiry */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: mutedTxt }}>Expiry date <span className="font-normal">· optional</span></label>
              <input type="date" value={form.expires} onChange={e => set("expires")(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all"
                style={inputStyle} onFocus={onFocusBorder} onBlur={onBlurBorder} />
            </div>

            {/* Active */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: mutedTxt }}>Status</label>
              <button onClick={() => set("active")(!form.active)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all"
                style={inputStyle}>
                <span style={{ color: form.active ? accentG : subTxt, fontWeight: 600 }}>{form.active ? "Active" : "Inactive"}</span>
                <span className="relative inline-block" style={{ width: 36, height: 20, borderRadius: 999, backgroundColor: form.active ? accentG : (isDark ? "#334155" : "#cbd5e1"), transition: "background 0.2s" }}>
                  <span className="absolute top-0.5 rounded-full bg-white" style={{ width: 16, height: 16, left: form.active ? 18 : 2, transition: "left 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.3)" }} />
                </span>
              </button>
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
              style={{ background: isDark ? "rgba(239,68,68,0.12)" : "#fef2f2", border: `1px solid ${isDark ? "rgba(239,68,68,0.3)" : "#fecaca"}`, color: isDark ? "#fca5a5" : "#dc2626" }}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {formError}
            </div>
          )}

          <div className="flex items-center gap-2.5 flex-wrap">
            <button onClick={submitForm}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
              {savedFlash
                ? <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Saved!</>
                : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isEditing ? "M5 13l4 4L19 7" : "M12 4v16m8-8H4"}/></svg>{isEditing ? "Save changes" : "Add promo code"}</>
              }
            </button>
            {isEditing && (
              <button onClick={resetForm}
                className="px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all active:scale-95"
                style={{ borderColor: inputBdr, color: subTxt, backgroundColor: cardBg }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Flash sales: pick products and apply a discount per branch */}
      <div className={`rounded-xl overflow-hidden ${entered ? "" : "promo-rise"}`}
        style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)", animationDelay: "0.2s" }}>
        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${headerBdr}`, backgroundColor: headerBg }}>
          <div>
            <p className="text-sm font-semibold flex items-center gap-2" style={{ color: bodyTxt }}>
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              Flash Sales ({branch})
            </p>
            <p className="text-xs mt-0.5" style={{ color: mutedTxt }}>
              Select products to mark down instantly for the {branch} branch.
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-xl p-4"
            style={{ background: isDark ? "rgba(249,115,22,0.08)" : "#fff7ed", border: `1px solid ${isDark ? "rgba(251,146,60,0.25)" : "#fed7aa"}` }}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: isDark ? "#fdba74" : "#c2410c" }}>
                  On sale in {branch}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: mutedTxt }}>
                  Products already discounted for this branch.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ color: isDark ? "#fdba74" : "#c2410c", background: isDark ? "rgba(251,146,60,0.12)" : "#ffedd5" }}>
                {branchSaleProducts.length}
              </span>
            </div>

            {branchSaleProducts.length === 0 ? (
              <p className="text-xs" style={{ color: mutedTxt }}>No products are currently on sale in {branch}.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {branchSaleProducts.map(p => (
                  <button key={p.id}
                    onClick={() => togglePromoProduct(p.id)}
                    className="flex items-center gap-3 p-2.5 rounded-lg text-left transition-all"
                    style={{
                      background: selectedPromoIds.includes(p.id) ? (isDark ? "rgba(74,222,128,0.12)" : "#f0fdf4") : cardBg,
                      border: `1px solid ${selectedPromoIds.includes(p.id) ? accentG : inputBdr}`
                    }}>
                    <img src={p.image_url} alt="" className="w-11 h-11 rounded-md object-cover flex-shrink-0" style={{ border: `1px solid ${inputBdr}` }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate" style={{ color: bodyTxt }}>{p.name}</p>
                      <p className="text-[10px] truncate" style={{ color: mutedTxt }}>{p.category || "Uncategorized"}</p>
                      <p className="text-[11px] font-semibold mt-0.5" style={{ color: accentG }}>
                        ₱{Number(p.price || 0).toLocaleString()} <span className="line-through font-normal" style={{ color: mutedTxt }}>₱{Number(p.original_price || 0).toLocaleString()}</span>
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full text-white flex-shrink-0" style={{ background: "#f97316" }}>
                      -{salePercent(p)}%
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start">
            
            {/* Category Filter */}
            <div className="w-full md:w-1/3">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: mutedTxt }}>Filter Category</label>
              <select 
                value={promoCategory} 
                onChange={e => setPromoCategory(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all cursor-pointer"
                style={inputStyle} onFocus={onFocusBorder} onBlur={onBlurBorder}>
                {promoCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Discount Percentage and Apply Button */}
            <div className="w-full md:w-2/3">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: mutedTxt }}>Discount (%)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  min="0" max="99" 
                  value={flashDiscount} 
                  onChange={e => setFlashDiscount(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 20"
                  className="w-24 px-3 py-2.5 text-sm rounded-lg outline-none transition-all"
                  style={inputStyle} onFocus={onFocusBorder} onBlur={onBlurBorder} 
                />
                <button 
                  onClick={handleApplyFlashSale} 
                  disabled={flashSaleLoading}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
                  {flashSaleLoading ? "Applying..." : `Apply to ${selectedPromoIds.length} item(s)`}
                </button>
              </div>
              <p className="text-[10px] mt-1.5" style={{ color: mutedTxt }}>Set discount to 0 to remove an active promotion.</p>
            </div>
          </div>

          {/* Scrollable Multi-Select Product List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold" style={{ color: mutedTxt }}>Select Products to Promote</label>
              <button 
                onClick={handleSelectAll}
                className="text-xs font-bold hover:underline transition-colors"
                style={{ color: accentG }}>
                {filteredPromoProducts.every(p => selectedPromoIds.includes(p.id)) && filteredPromoProducts.length > 0 ? "Deselect All" : "Select All"}
              </button>
            </div>
            
            <div className="rounded-lg overflow-y-auto p-2 space-y-1.5" 
              style={{ maxHeight: "240px", border: `1px solid ${inputBdr}`, backgroundColor: isDark ? "rgba(0,0,0,0.1)" : "#f9fafb" }}>
              {filteredPromoProducts.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: mutedTxt }}>No products found in {branch} for this category.</p>
              ) : (
                filteredPromoProducts.map(p => (
                  <label key={p.id} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-black/5"
                    style={{ backgroundColor: selectedPromoIds.includes(p.id) ? (isDark ? "rgba(74,222,128,0.1)" : "#f0fdf4") : "transparent" }}>
                    <input 
                      type="checkbox" 
                      checked={selectedPromoIds.includes(p.id)}
                      onChange={() => togglePromoProduct(p.id)}
                      className="w-4 h-4 rounded text-green-600 focus:ring-green-500 cursor-pointer border-gray-300" 
                    />
                    <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover" style={{ border: `1px solid ${inputBdr}` }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: bodyTxt }}>{p.name}</p>
                      <p className="text-[10px]" style={{ color: mutedTxt }}>
                        Base: ₱{p.price} {p.original_price ? `(Currently on sale from ₱${p.original_price})` : ""}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Flash Sale Status Messages */}
          {flashSaleError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: isDark ? "rgba(239,68,68,0.12)" : "#fef2f2", border: `1px solid ${isDark ? "rgba(239,68,68,0.3)" : "#fecaca"}`, color: isDark ? "#fca5a5" : "#dc2626" }}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {flashSaleError}
            </div>
          )}
          {flashSaleSuccess && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: isDark ? "rgba(74,222,128,0.12)" : "#f0fdf4", border: `1px solid ${isDark ? "rgba(74,222,128,0.3)" : "#bbf7d0"}`, color: isDark ? "#4ade80" : G }}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              {flashSaleSuccess}
            </div>
          )}
        </div>
      </div>

      {/* Quantity-based bundle discounts */}
      <div className={`rounded-xl overflow-hidden ${entered ? "" : "promo-rise"}`}
        style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)", animationDelay: "0.3s" }}>
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${headerBdr}`, backgroundColor: headerBg }}>
          <p className="text-sm font-semibold" style={{ color: bodyTxt }}>Bundle Discounts ({branch})</p>
          <p className="text-xs mt-0.5" style={{ color: mutedTxt }}>
            Apply a percentage to the order subtotal once the customer buys the minimum quantity from one product category.
          </p>
        </div>

        <div className="p-5 space-y-4">
          {bundleError && (
            <div className="px-3 py-2 rounded-lg text-xs font-medium"
              style={{ background: isDark ? "rgba(239,68,68,0.12)" : "#fef2f2", border: `1px solid ${isDark ? "rgba(239,68,68,0.3)" : "#fecaca"}`, color: isDark ? "#fca5a5" : "#dc2626" }}>
              {bundleError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: mutedTxt }}>Promotion Name</label>
              <input value={bundleForm.name} onChange={e => setBundleForm(form => ({ ...form, name: e.target.value }))}
                placeholder="e.g. Buy 3 and Save" className="w-full px-3 py-2.5 text-sm rounded-lg outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: mutedTxt }}>Eligible Category</label>
              <select value={bundleForm.category}
                onChange={e => setBundleForm(form => ({ ...form, category: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm rounded-lg outline-none" style={inputStyle}>
                <option value="">Select a category</option>
                {promoCategories.filter(category => category !== "All").map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: mutedTxt }}>Minimum Items</label>
              <input type="number" min="2" value={bundleForm.minimumQuantity}
                onChange={e => setBundleForm(form => ({ ...form, minimumQuantity: e.target.value }))}
                placeholder="e.g. 3" className="w-full px-3 py-2.5 text-sm rounded-lg outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: mutedTxt }}>Percentage Off</label>
              <input type="number" min="1" max="100" value={bundleForm.discountPercent}
                onChange={e => setBundleForm(form => ({ ...form, discountPercent: e.target.value }))}
                placeholder="e.g. 15" className="w-full px-3 py-2.5 text-sm rounded-lg outline-none" style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: mutedTxt }}>Start Date</label>
              <input type="date" value={bundleForm.startDate}
                onChange={e => setBundleForm(form => ({ ...form, startDate: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm rounded-lg outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: mutedTxt }}>End Date</label>
              <input type="date" min={bundleForm.startDate} value={bundleForm.endDate}
                onChange={e => setBundleForm(form => ({ ...form, endDate: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm rounded-lg outline-none" style={inputStyle} />
            </div>
          </div>

          {bundleForm.category && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ color: subTxt, backgroundColor: isDark ? "rgba(74,222,128,0.08)" : "#f0fdf4" }}>
              {bundleCategoryProductCount} customer-visible {bundleForm.category.toLowerCase()} product(s) are currently available for {branch}. Raw materials are excluded.
            </p>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: subTxt }}>
              <input type="checkbox" checked={bundleForm.active} onChange={e => setBundleForm(form => ({ ...form, active: e.target.checked }))} />
              Activate immediately
            </label>
            <button type="button" onClick={submitBundlePromotion} disabled={bundleSaving}
              className="px-5 py-2.5 text-sm font-bold text-white rounded-lg disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
              {bundleSaving ? "Saving..." : "Create Bundle Discount"}
            </button>
          </div>

          {bundlePromotions.length > 0 && (
            <div className="space-y-2 pt-2" style={{ borderTop: `1px solid ${divider}` }}>
              {bundlePromotions.map(campaign => (
                <div key={campaign.id} className="flex items-center justify-between gap-3 p-3 rounded-lg" style={{ border: `1px solid ${inputBdr}` }}>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: bodyTxt }}>{campaign.name}</p>
                    <p className="text-xs" style={{ color: mutedTxt }}>
                      Buy {campaign.minimum_quantity}+ {campaign.eligible_category || "eligible items"} · {Number(campaign.discount_value)}% off
                    </p>
                    <p className="text-[11px]" style={{ color: mutedTxt }}>
                      {(campaign.branches || ["all"]).map(value => value === "all" ? "All branches" : value[0].toUpperCase() + value.slice(1)).join(", ")}
                      {" · "}{new Date(campaign.start_at).toLocaleDateString()}–{campaign.end_at ? new Date(campaign.end_at).toLocaleDateString() : "No end date"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => toggleBundlePromotion(campaign)} className="px-3 py-1.5 text-xs font-bold rounded-md"
                      style={{ color: campaign.is_active ? accentG : subTxt, border: `1px solid ${inputBdr}` }}>
                      {campaign.is_active ? "Active" : "Inactive"}
                    </button>
                    <button type="button" onClick={() => deleteBundlePromotion(campaign)} className="px-3 py-1.5 text-xs font-bold rounded-md text-red-500"
                      style={{ border: `1px solid ${inputBdr}` }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Existing promo codes */}
      <div className={`rounded-xl overflow-hidden ${entered ? "" : "promo-rise"}`}
        style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)", animationDelay: "0.3s" }}>
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${headerBdr}`, backgroundColor: headerBg }}>
          <p className="text-sm font-semibold" style={{ color: bodyTxt }}>
            Promo codes <span className="ml-2 text-xs font-normal" style={{ color: mutedTxt }}>{vouchers.length} total</span>
          </p>
        </div>

        {vouchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: isDark ? "rgba(34,197,94,0.1)" : "#f0fdf4", border: `1px solid ${isDark ? "rgba(34,197,94,0.2)" : "#bbf7d0"}` }}>
              <svg className="w-6 h-6" style={{ color: accentG }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z"/></svg>
            </div>
            <p className="text-sm font-medium" style={{ color: subTxt }}>No promo codes yet</p>
            <p className="text-xs mt-0.5" style={{ color: mutedTxt }}>Create one above to get started</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm hidden md:table">
              <thead style={{ borderBottom: `1px solid ${tableBdr}` }}>
                <tr style={{ backgroundColor: tableHead }}>
                  {["Code","Discount","Min spend","Expires","Status",""].map((h,i) => (
                    <th key={h || i} className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider ${i===5?"text-right":"text-left"}`} style={{ color: mutedTxt }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v, idx) => {
                  const expired = isExpired(v)
                  const inactive = v.active === false
                  return (
                    <tr key={v.code + idx} style={{ backgroundColor: idx % 2 === 0 ? cardBg : rowAlt }}>
                      <td className="px-5 py-3">
                        <span className="font-mono font-bold text-xs px-2 py-1 rounded" style={{ backgroundColor: isDark ? "rgba(34,197,94,0.1)" : "#f0fdf4", color: accentG }}>{v.code}</span>
                      </td>
                      <td className="px-5 py-3 font-medium" style={{ color: bodyTxt }}>{discountLabel(v)}</td>
                      <td className="px-5 py-3" style={{ color: subTxt }}>{v.minSpend ? `₱${Number(v.minSpend).toLocaleString()}` : "—"}</td>
                      <td className="px-5 py-3" style={{ color: expired ? "#f87171" : subTxt }}>{v.expires || "No expiry"}{expired ? " (expired)" : ""}</td>
                      <td className="px-5 py-3">
                        <button onClick={() => toggleActive(v.code)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-full transition-all"
                          style={inactive
                            ? { backgroundColor: isDark ? "#334155" : "#f1f5f9", color: subTxt }
                            : { backgroundColor: isDark ? "rgba(34,197,94,0.15)" : "#f0fdf4", color: accentG, border: `1px solid ${isDark ? "transparent" : "#bbf7d0"}` }}>
                          {inactive ? "Inactive" : "Active"}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => startEdit(v)} title="Edit" className="p-1.5 rounded-md transition-colors" style={{ color: subTxt }}
                            onMouseEnter={e => e.currentTarget.style.color = accentG} onMouseLeave={e => e.currentTarget.style.color = subTxt}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                          <button onClick={() => deleteVoucher(v.code)} title="Delete" className="p-1.5 rounded-md transition-colors" style={{ color: subTxt }}
                            onMouseEnter={e => e.currentTarget.style.color = "#f87171"} onMouseLeave={e => e.currentTarget.style.color = subTxt}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="md:hidden divide-y" style={{ borderColor: tableBdr }}>
              {vouchers.map((v, idx) => {
                const expired = isExpired(v)
                const inactive = v.active === false
                return (
                  <div key={v.code + idx} className="p-4" style={{ borderColor: tableBdr }}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono font-bold text-xs px-2 py-1 rounded" style={{ backgroundColor: isDark ? "rgba(34,197,94,0.1)" : "#f0fdf4", color: accentG }}>{v.code}</span>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => startEdit(v)} title="Edit" className="p-1.5 rounded-md" style={{ color: subTxt }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button onClick={() => deleteVoucher(v.code)} title="Delete" className="p-1.5 rounded-md" style={{ color: subTxt }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs" style={{ color: subTxt }}>
                      <span className="font-medium" style={{ color: bodyTxt }}>{discountLabel(v)}</span>
                      <span>·</span><span>Min {v.minSpend ? `₱${Number(v.minSpend).toLocaleString()}` : "—"}</span>
                      <span>·</span><span style={{ color: expired ? "#f87171" : subTxt }}>{v.expires || "No expiry"}{expired ? " (expired)" : ""}</span>
                    </div>
                    <button onClick={() => toggleActive(v.code)} className="mt-2 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={inactive ? { backgroundColor: isDark ? "#334155" : "#f1f5f9", color: subTxt } : { backgroundColor: isDark ? "rgba(34,197,94,0.15)" : "#f0fdf4", color: accentG }}>
                      {inactive ? "Inactive" : "Active"}
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Customer notifications */}
      <div className={`rounded-xl overflow-hidden ${entered ? "" : "promo-rise"}`}
        style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)", animationDelay: "0.4s" }}>
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${headerBdr}`, backgroundColor: headerBg }}>
          <p className="text-sm font-semibold" style={{ color: bodyTxt }}>Customer notifications</p>
          <p className="text-xs mt-0.5" style={{ color: mutedTxt }}>
            These appear in the notification bell on the customer site. Use them for promos, seasonal notices, pre-order reminders, or any update.
          </p>
        </div>

        <input ref={annFileRef} type="file" accept="image/*" onChange={handleAnnImage} style={{ display: "none" }} />

        <div className="p-5 space-y-5">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: mutedTxt }}>
              {annIsEditing ? "Edit notification" : "New notification"}
            </p>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: mutedTxt }}>Message</label>
              <input value={annForm.text} onChange={e => annSet("text")(e.target.value)}
                placeholder="e.g. Mother's Day is coming, pre-order now!" maxLength={120}
                onKeyDown={e => { if (e.key === "Enter") submitAnnouncement() }}
                className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all"
                style={inputStyle} onFocus={onFocusBorder} onBlur={onBlurBorder} />
              <p className="text-[11px] mt-1" style={{ color: mutedTxt }}>{annForm.text.length}/120</p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: mutedTxt }}>Icon <span className="font-normal">· optional, pick an emoji or upload an image</span></label>

              {annForm.image ? (
                <div className="flex items-center gap-3">
                  <img src={annForm.image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" style={{ border: `1px solid ${inputBdr}` }} />
                  <button onClick={() => annSet("image")("")}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all"
                    style={{ borderColor: inputBdr, color: subTxt, backgroundColor: cardBg }}>
                    Remove image
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <input value={annForm.emoji} onChange={e => setAnnForm(p => ({ ...p, emoji: e.target.value.slice(0, 2), image: "" }))}
                    placeholder="🌸" maxLength={2}
                    className="w-14 px-2 py-2.5 text-base text-center rounded-lg outline-none transition-all"
                    style={inputStyle} onFocus={onFocusBorder} onBlur={onBlurBorder} />
                  <div className="flex items-center gap-1 flex-wrap">
                    {EMOJI_CHOICES.map(em => (
                      <button key={em} onClick={() => pickEmoji(em)}
                        className="w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all hover:scale-110"
                        style={{ border: `1.5px solid ${annForm.emoji === em ? accentG : inputBdr}`, backgroundColor: annForm.emoji === em ? (isDark ? "rgba(34,197,94,0.12)" : "#f0fdf4") : inputBg }}>
                        {em}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs" style={{ color: mutedTxt }}>or</span>
                  <button onClick={() => annFileRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-all"
                    style={{ borderColor: inputBdr, color: subTxt, backgroundColor: cardBg }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 7.5L12 3m0 0L7.5 7.5M12 3v13.5"/></svg>
                    Upload image
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => annSet("active")(!annForm.active)}
              className="flex items-center gap-3 text-sm font-semibold transition-all" style={{ color: bodyTxt }}>
              <span className="relative inline-block" style={{ width: 40, height: 22, borderRadius: 999, backgroundColor: annForm.active ? accentG : (isDark ? "#334155" : "#cbd5e1"), transition: "background 0.2s" }}>
                <span className="absolute top-0.5 rounded-full bg-white" style={{ width: 18, height: 18, left: annForm.active ? 20 : 2, transition: "left 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.3)" }} />
              </span>
              Show to customers
            </button>

            {annForm.text.trim() && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: mutedTxt }}>Preview</p>
                <div className="flex items-start gap-3 px-4 py-3 rounded-lg" style={{ border: `1px solid ${inputBdr}`, backgroundColor: isDark ? "rgba(34,197,94,0.06)" : "#f0fdf4" }}>
                  {annForm.image
                    ? <img src={annForm.image} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    : <span className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: isDark ? "rgba(34,197,94,0.15)" : "#dcfce7" }}>{annForm.emoji || "📣"}</span>}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug" style={{ color: bodyTxt }}>{annForm.text}</p>
                    <p className="text-[11px] mt-1" style={{ color: mutedTxt }}>Just now</p>
                  </div>
                </div>
              </div>
            )}

            {annError && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
                style={{ background: isDark ? "rgba(239,68,68,0.12)" : "#fef2f2", border: `1px solid ${isDark ? "rgba(239,68,68,0.3)" : "#fecaca"}`, color: isDark ? "#fca5a5" : "#dc2626" }}>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {annError}
              </div>
            )}

            <div className="flex items-center gap-2.5 flex-wrap">
              <button onClick={submitAnnouncement}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 active:scale-95"
                style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
                {annSaved
                  ? <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Saved!</>
                  : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={annIsEditing ? "M5 13l4 4L19 7" : "M12 4v16m8-8H4"}/></svg>{annIsEditing ? "Save changes" : "Add notification"}</>
                }
              </button>
              {annIsEditing && (
                <button onClick={resetAnnForm}
                  className="px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all active:scale-95"
                  style={{ borderColor: inputBdr, color: subTxt, backgroundColor: cardBg }}>
                  Cancel
                </button>
              )}
            </div>
          </div>

          {announcements.length > 0 && (
            <div className="space-y-2 pt-1" style={{ borderTop: `1px solid ${divider}` }}>
              <p className="text-xs font-semibold uppercase tracking-wider pt-3" style={{ color: mutedTxt }}>
                All notifications <span className="font-normal">· {announcements.filter(a => a.active !== false).length} active</span>
              </p>
              {announcements.map(a => {
                const inactive = a.active === false
                return (
                  <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                    style={{ border: `1px solid ${inputBdr}`, backgroundColor: inactive ? (isDark ? "#0f172a" : "#fafbfc") : cardBg, opacity: inactive ? 0.7 : 1 }}>
                    {a.image
                      ? <img src={a.image} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      : <span className="text-lg leading-none flex-shrink-0 w-8 h-8 flex items-center justify-center">{a.emoji || "📣"}</span>}
                    <p className="flex-1 min-w-0 text-sm truncate" style={{ color: bodyTxt }}>{a.text}</p>
                    <button onClick={() => toggleAnn(a.id)}
                      className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full transition-all"
                      style={inactive
                        ? { backgroundColor: isDark ? "#334155" : "#f1f5f9", color: subTxt }
                        : { backgroundColor: isDark ? "rgba(34,197,94,0.15)" : "#f0fdf4", color: accentG, border: `1px solid ${isDark ? "transparent" : "#bbf7d0"}` }}>
                      {inactive ? "Hidden" : "Showing"}
                    </button>
                    <button onClick={() => startAnnEdit(a)} title="Edit" className="flex-shrink-0 p-1.5 rounded-md transition-colors" style={{ color: subTxt }}
                      onMouseEnter={e => e.currentTarget.style.color = accentG} onMouseLeave={e => e.currentTarget.style.color = subTxt}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button onClick={() => deleteAnn(a.id)} title="Delete" className="flex-shrink-0 p-1.5 rounded-md transition-colors" style={{ color: subTxt }}
                      onMouseEnter={e => e.currentTarget.style.color = "#f87171"} onMouseLeave={e => e.currentTarget.style.color = subTxt}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
