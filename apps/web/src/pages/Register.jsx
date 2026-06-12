import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { sendOtp, verifyOtp, registerUser } from "../services/auth"
import { regions, getProvinces } from "../utils/philippines"
import FlowerPanel from "../components/FlowerPanel"
import TermsModal from "../components/TermsModal"
import estingsLogo from "../assets/Estings.svg"
import bgImg from "../assets/BG_LoginRegister.png"

// ── Supported Currencies ────────────────────────────────────────────────────
const SUPPORTED_REGIONS = [
  { code: "PH", country: "Philippines", currency: "PHP", symbol: "₱" },
  { code: "US", country: "United States", currency: "USD", symbol: "$" },
  { code: "GB", country: "United Kingdom", currency: "GBP", symbol: "£" },
  { code: "EU", country: "European Union", currency: "EUR", symbol: "€" },
  { code: "AU", country: "Australia", currency: "AUD", symbol: "A$" },
  { code: "CA", country: "Canada", currency: "CAD", symbol: "C$" },
  { code: "SG", country: "Singapore", currency: "SGD", symbol: "S$" },
]

// ── Validation helpers ──────────────────────────────────────────────────────

/** Strict email: local@domain.tld, TLD must be 2+ alpha chars, no consecutive dots, etc. */
function isValidEmail(v) {
  return /^[^\s@]+@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(v.trim())
}

/** PH phone: must be exactly +63 followed by 10 digits, second digit 9 (mobile prefix) */
function isValidPHPhone(v) {
  return /^\+639\d{9}$/.test(v)
}

/** Name: letters, spaces, hyphens, apostrophes only, no digits or symbols */
function isValidName(v) {
  return /^[a-zA-ZÀ-ÖØ-öø-ÿ\s'\-]+$/.test(v.trim()) && v.trim().length >= 2
}

/** ZIP: exactly 4 digits (PH standard) */
function isValidZip(v) {
  return /^\d{4}$/.test(v)
}

/** City / Municipality: letters, spaces, hyphens, periods, min 2 chars */
function isValidCity(v) {
  return /^[a-zA-ZÀ-ÖØ-öø-ÿ\s'.\-]+$/.test(v.trim()) && v.trim().length >= 2
}

/** Street address: at least 10 chars and contains at least one digit (house/unit number) */
function isValidStreet(v) {
  return v.trim().length >= 10 && /\d/.test(v)
}

/** Username: alphanumeric, underscores, dots, 3 to 30 chars */
function isValidUsername(v) {
  if (!v) return true // optional
  return /^[a-zA-Z0-9_.]{3,30}$/.test(v)
}

// ── Typewriter ──────────────────────────────────────────────────────────────
function TypewriterText({ text, typingSpeed = 100, deletingSpeed = 65, pauseAfterTyping = 2500, pauseAfterDeleting = 600 }) {
  const [state, setState] = useState({ displayed: "", phase: "typing" })
  useEffect(() => { setState({ displayed: "", phase: "typing" }) }, [text])
  useEffect(() => {
    const { displayed, phase } = state
    let delay
    if (phase === "typing") {
      delay = displayed.length < text.length
        ? setTimeout(() => setState({ displayed: text.slice(0, displayed.length + 1), phase: "typing" }), typingSpeed)
        : setTimeout(() => setState({ displayed, phase: "deleting" }), pauseAfterTyping)
    } else {
      delay = displayed.length > 0
        ? setTimeout(() => setState({ displayed: displayed.slice(0, -1), phase: "deleting" }), deletingSpeed)
        : setTimeout(() => setState({ displayed: "", phase: "typing" }), pauseAfterDeleting)
    }
    return () => clearTimeout(delay)
  }, [state, text, typingSpeed, deletingSpeed, pauseAfterTyping, pauseAfterDeleting])
  return <span>{state.displayed}<span className="inline-block w-[2px] h-[1em] bg-current align-middle ml-[2px] translate-y-[-1px] animate-pulse" /></span>
}

// ── Mobile banner ───────────────────────────────────────────────────────────
function MobileFlowerBanner() {
  return (
    <div className="lg:hidden relative h-48 sm:h-56 flex items-center justify-center overflow-hidden flex-shrink-0"
      style={{ background: "linear-gradient(135deg,#f9c6d0 0%,#e8a0b4 50%,#c97fa0 100%)" }}>
      <img src={bgImg} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
      <div className="absolute inset-0 bg-black/35" />
      <div className="relative z-10 text-center px-8">
        <div className="inline-flex flex-col items-center gap-2">
          <img src={estingsLogo} alt="Esting's" className="h-20 sm:h-24 brightness-0 invert drop-shadow-lg" />
          <p className="text-white font-bold text-xs sm:text-sm tracking-[0.22em] uppercase drop-shadow">Flower International Inc.</p>
        </div>
      </div>
    </div>
  )
}

// ── Flower petal loader ─────────────────────────────────────────────────────
function FlowerLoader({ message = "Please wait..." }) {
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
        @keyframes petalBloom {
          0%, 100% { opacity: 0.2; }
          50%       { opacity: 1;   }
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
        <svg width="120" height="120" viewBox="0 0 100 100">
          {petals.map(({ angle, color }, i) => (
            <g key={i} transform={`rotate(${angle} 50 50)`}>
              <ellipse cx="50" cy="27" rx="9.5" ry="21" fill={color}
                style={{ animation: `petalBloom 1.4s ease-in-out ${(i * 0.2).toFixed(2)}s infinite`, animationFillMode: "both" }} />
            </g>
          ))}
          <circle cx="50" cy="50" r="12" fill="#2E8B34" />
          <circle cx="50" cy="50" r="7"  fill="#f9c6d0" />
          <circle cx="50" cy="50" r="3.5" fill="#fff" opacity="0.7" />
        </svg>
        <p className="mt-4 text-sm font-medium text-gray-500 tracking-wide">{message}</p>
      </div>
    </>
  )
}

// ── Eye icons ───────────────────────────────────────────────────────────────
function EyeOpen() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
}
function EyeSlash() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
}

// ── Inline field error ──────────────────────────────────────────────────────
function FieldError({ msg }) {
  if (!msg) return null
  return <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span>{msg}</p>
}

// ── Section header (replaces the old phase steps) ───────────────────────────
function SectionHeader({ label }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-green-700">{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

// ── Input class constants ───────────────────────────────────────────────────
const iBase  = "w-full py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition bg-white"
const iOk    = "border-gray-200 focus:ring-green-500"
const iErr   = "border-red-400 focus:ring-red-400"
const iPlain = (err) => `px-4 ${iBase} ${err ? iErr : iOk}`
const iIcon  = (err) => `pl-10 pr-4 ${iBase} ${err ? iErr : iOk}`
const iIconR = (err) => `pl-10 pr-10 ${iBase} ${err ? iErr : iOk}`
const iSel   = "w-full pl-3 pr-8 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white appearance-auto"

const STORAGE_KEY = "register_form_draft"

// ── Load persisted draft ────────────────────────────────────────────────────
function loadDraft() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    const parsed = JSON.parse(saved)
    return parsed && typeof parsed === "object" ? parsed : null
  } catch { return null }
}

export default function Register({ onNavigate }) {
  const [step, setStep]   = useState("form")
  const [otp, setOtp]     = useState("")
  const [showTerms, setShowTerms] = useState(false)

  // ── Init form from sessionStorage (single source of truth) ──────────────
  const initial = loadDraft()

  const [form, setForm] = useState(() => initial?.form ?? {
    firstName: "", lastName: "", email: "", phone: "", username: "",
    password: "", confirmPassword: "", preferred_currency: "PHP",
    address: { regionId: "", provinceId: "", city: "", street: "", zip_code: "" }
  })

  // ── Per-field touched & error state ──────────────────────────────────────
  const [touched, setTouched]   = useState({})
  const [fieldErr, setFieldErr] = useState({})

  const touch  = (field) => setTouched(t => ({ ...t, [field]: true }))
  const setErr = (field, msg) => setFieldErr(e => ({ ...e, [field]: msg }))
  const clearErr = (field) => setFieldErr(e => ({ ...e, [field]: "" }))

  // Validate a single field and update fieldErr
  const validateField = useCallback((field, value, formSnapshot) => {
    switch (field) {
      case "firstName":
        if (!value.trim()) return setErr("firstName", "First name is required.")
        if (!isValidName(value)) return setErr("firstName", "Name can only contain letters, spaces, hyphens, or apostrophes.")
        return clearErr("firstName")

      case "lastName":
        if (!value.trim()) return setErr("lastName", "Last name is required.")
        if (!isValidName(value)) return setErr("lastName", "Name can only contain letters, spaces, hyphens, or apostrophes.")
        return clearErr("lastName")

      case "email":
        if (!value.trim()) return setErr("email", "Email is required.")
        if (!isValidEmail(value)) return setErr("email", "Enter a valid email (e.g. juan@gmail.com).")
        return clearErr("email")

      case "phone":
        if (!value) return setErr("phone", "Phone number is required.")
        if (!isValidPHPhone(value)) return setErr("phone", "Enter a valid PH mobile number (+639XXXXXXXXX).")
        return clearErr("phone")

      case "username":
        if (value && !isValidUsername(value)) return setErr("username", "3–30 characters: letters, numbers, _ or . only.")
        return clearErr("username")

      case "password":
        if (!value) return setErr("password", "Password is required.")
        if (value.length < 8) return setErr("password", "Must be at least 8 characters.")
        return clearErr("password")

      case "confirmPassword": {
        const pw = formSnapshot?.password ?? form.password
        if (!value) return setErr("confirmPassword", "Please confirm your password.")
        if (value !== pw) return setErr("confirmPassword", "Passwords do not match.")
        return clearErr("confirmPassword")
      }

      case "zip_code":
        if (!value) return setErr("zip_code", "ZIP code is required.")
        if (!isValidZip(value)) return setErr("zip_code", "ZIP must be exactly 4 digits.")
        return clearErr("zip_code")

      case "city":
        if (!value.trim()) return setErr("city", "City is required.")
        if (!isValidCity(value)) return setErr("city", "City can only contain letters, spaces, hyphens, or periods.")
        return clearErr("city")

      case "street":
        if (!value.trim()) return setErr("street", "Street address is required.")
        if (!isValidStreet(value)) return setErr("street", "Enter full address with house/unit number (min. 10 characters).")
        return clearErr("street")

      default: break
    }
  }, [form.password])

  const [showPassword, setShowPassword]   = useState(false)
  const [agreeTerms, setAgreeTerms]       = useState(false)
  const [error, setError]                 = useState("")
  const [loading, setLoading]             = useState(false)
  const [loadingMsg, setLoadingMsg]       = useState("Please wait...")
  const [passwordStrength, setPasswordStrength] = useState("empty")

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ form }))
  }, [form])

  useEffect(() => {
    const clean = () => sessionStorage.removeItem(STORAGE_KEY)
    window.addEventListener("beforeunload", clean)
    return () => window.removeEventListener("beforeunload", clean)
  }, [])

  const handlePhoneChange = useCallback((e) => {
    let val = e.target.value.replace(/[^\d+]/g, "")
    if (val.startsWith("0")) val = "+63" + val.slice(1)
    if (!val.startsWith("+63")) val = "+63" + val.replace(/^\+?63?/, "")
    val = val.slice(0, 13)
    setForm(f => ({ ...f, phone: val }))
    if (touched.phone) validateField("phone", val, null)
  }, [touched.phone, validateField])

  useEffect(() => {
    const p = form.password; let s = 0
    if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++
    setPasswordStrength(s === 0 ? "empty" : s < 2 ? "weak" : s < 3 ? "fair" : s < 4 ? "good" : "strong")
  }, [form.password])

  const updateAddr = (field, value) => {
    setForm(f => ({ ...f, address: { ...f.address, [field]: value } }))
    if (touched[field]) validateField(field, value, null)
  }

  const handleZipChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4)
    updateAddr("zip_code", val)
  }

  // ── Single-page submit gate (was canProceed per phase) ──────────────────
  const canSubmit =
    isValidName(form.firstName) && isValidName(form.lastName) &&
    isValidEmail(form.email) && isValidPHPhone(form.phone) &&
    isValidUsername(form.username) &&
    passwordStrength === "strong" && form.password === form.confirmPassword &&
    form.address.regionId && form.address.provinceId &&
    isValidCity(form.address.city) && isValidZip(form.address.zip_code) &&
    isValidStreet(form.address.street) && agreeTerms

  // ── Full-form validation (was validatePhase 1-4) ─────────────────────────
  const validateAll = () => {
    setError("")
    ;["firstName","lastName","email","phone","username","password","confirmPassword","city","street","zip_code"].forEach(touch)
    validateField("firstName", form.firstName, null)
    validateField("lastName", form.lastName, null)
    validateField("email", form.email, null)
    validateField("phone", form.phone, null)
    validateField("username", form.username, null)
    validateField("password", form.password, null)
    validateField("confirmPassword", form.confirmPassword, null)
    validateField("city", form.address.city, null)
    validateField("street", form.address.street, null)
    validateField("zip_code", form.address.zip_code, null)

    if (!isValidName(form.firstName) || !isValidName(form.lastName)) { setError("Please enter a valid first and last name."); return false }
    if (!isValidEmail(form.email)) { setError("Please enter a valid email address (e.g. juan@gmail.com)."); return false }
    if (!isValidPHPhone(form.phone)) { setError("Please enter a valid PH mobile number (+639XXXXXXXXX)."); return false }
    if (form.username && !isValidUsername(form.username)) { setError("Username must be 3–30 characters (letters, numbers, _ or .)."); return false }
    if (passwordStrength !== "strong") { setError("Password must be strong (8+ chars, uppercase, number, special)."); return false }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return false }
    if (!form.address.regionId || !form.address.provinceId) { setError("Please select your region and province."); return false }
    if (!isValidCity(form.address.city)) { setError("Please enter a valid city name."); return false }
    if (!isValidZip(form.address.zip_code)) { setError("ZIP code must be exactly 4 digits."); return false }
    if (!isValidStreet(form.address.street)) { setError("Please enter your full street address including a house/unit number (min. 10 characters)."); return false }
    if (!agreeTerms) { setError("Please agree to the Terms & Conditions."); return false }
    return true
  }

  const handleSendOtp = async () => {
    if (!validateAll()) return
    setLoadingMsg("Sending verification code...")
    setLoading(true)
    try { await sendOtp(form.email); setStep("otp") }
    catch (err) { setError(err.message || "Failed to send OTP. Please try again.") }
    finally { setLoading(false) }
  }

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault(); setError("")
    if (!otp || otp.length < 6) return setError("Please enter the complete 6-digit OTP.")
    setLoadingMsg("Creating your account...")
    setLoading(true)
    try {
      await verifyOtp(form.email, otp)
      const addressStr = form.address.street
        ? `${form.address.street}, ${form.address.city}, ${form.address.provinceId || ""} ${form.address.zip_code || ""}`.trim()
        : undefined

      const result = await registerUser({
        first_name: form.firstName, last_name: form.lastName, email: form.email,
        phone_number: form.phone, username: form.username || undefined,
        password: form.password, address: addressStr,
        preferred_currency: form.preferred_currency
      })

      if (result.success || result.status === "success") {
        sessionStorage.removeItem(STORAGE_KEY)
        sessionStorage.setItem("registerEmail", form.email)
        sessionStorage.setItem("registerPassword", form.password)
        localStorage.setItem("preferredCurrency", form.preferred_currency) // Remember their currency choice for the login step
        onNavigate("login")
      } else { setError(result.message || "Registration failed. Please try again.") }
    } catch (err) { setError(err.message || "Invalid OTP or registration failed.") }
    finally { setLoading(false) }
  }

  const strengthColors = { empty: "gray", weak: "#ef4444", fair: "#f97316", good: "#eab308", strong: "#22c55e" }
  const strengthWidth  = { empty: 0, weak: 25, fair: 50, good: 75, strong: 100 }
  const strengthLabel  = { empty: "", weak: "Weak", fair: "Fair", good: "Good", strong: "Strong" }

  const currentTitle = step === "otp" ? "Verify your email" : "Create your account"
  const currentSub   = step === "otp" ? `Enter the OTP sent to ${form.email}` : "Fill in your details below. It only takes a minute."

  return (
    <div className="min-h-screen flex">
      {loading && <FlowerLoader message={loadingMsg} />}

      <TermsModal
        open={showTerms}
        onClose={() => setShowTerms(false)}
        onAgree={() => setAgreeTerms(true)}
      />

      <div className="hidden lg:block lg:w-1/2 flex-shrink-0 sticky top-0 h-screen">
        <FlowerPanel />
      </div>

      <div className="w-full lg:w-1/2 flex flex-col bg-gray-50 overflow-y-auto">
        <MobileFlowerBanner />

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-md border border-gray-100 px-8 py-10">

            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 mb-4">
                <svg className="w-7 h-7 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d={step === "otp"
                      ? "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      : "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"} />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 min-h-[2rem]"><TypewriterText text={currentTitle} /></h1>
              <p className="text-gray-500 text-sm mt-1">{currentSub}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center">{error}</div>
            )}

            {/* ══ SINGLE-PAGE FORM ═══════════════════════════════════════ */}
            {step === "form" && (
              <div className="space-y-4">

                {/* ── Personal details ──────────────────────────────────── */}
                <SectionHeader label="Personal Details" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                    <input type="text" value={form.firstName} autoFocus
                      onChange={e => { setForm(f => ({ ...f, firstName: e.target.value })); if (touched.firstName) validateField("firstName", e.target.value, null) }}
                      onBlur={() => { touch("firstName"); validateField("firstName", form.firstName, null) }}
                      placeholder="Juan"
                      className={iPlain(touched.firstName && fieldErr.firstName)} />
                    <FieldError msg={touched.firstName && fieldErr.firstName} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                    <input type="text" value={form.lastName}
                      onChange={e => { setForm(f => ({ ...f, lastName: e.target.value })); if (touched.lastName) validateField("lastName", e.target.value, null) }}
                      onBlur={() => { touch("lastName"); validateField("lastName", form.lastName, null) }}
                      placeholder="Dela Cruz"
                      className={iPlain(touched.lastName && fieldErr.lastName)} />
                    <FieldError msg={touched.lastName && fieldErr.lastName} />
                  </div>
                </div>
                <p className="text-xs text-gray-400">Letters, spaces, hyphens, and apostrophes only.</p>

                {/* ── Contact ───────────────────────────────────────────── */}
                <SectionHeader label="Contact" />
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </span>
                      <input type="email" value={form.email}
                        onChange={e => { setForm(f => ({ ...f, email: e.target.value })); if (touched.email) validateField("email", e.target.value, null) }}
                        onBlur={() => { touch("email"); validateField("email", form.email, null) }}
                        placeholder="juan@gmail.com"
                        className={iIcon(touched.email && fieldErr.email)} />
                    </div>
                    <FieldError msg={touched.email && fieldErr.email} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h.93a2 2 0 01.948.684l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 01.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                      </span>
                      <input type="tel" value={form.phone}
                        onChange={handlePhoneChange}
                        onBlur={() => { touch("phone"); validateField("phone", form.phone, null) }}
                        placeholder="+63 917 123 4567"
                        className={iIcon(touched.phone && fieldErr.phone)} />
                    </div>
                    <FieldError msg={touched.phone && fieldErr.phone} />
                    <p className="text-xs text-gray-400 mt-1">Tip: typing 09xx auto-converts to +639xx.</p>
                  </div>
                </div>

                {/* ── Account security ──────────────────────────────────── */}
                <SectionHeader label="Account Security" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Username <span className="text-gray-400 font-normal">(optional)</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </span>
                    <input type="text" value={form.username}
                      onChange={e => { setForm(f => ({ ...f, username: e.target.value })); if (touched.username) validateField("username", e.target.value, null) }}
                      onBlur={() => { touch("username"); validateField("username", form.username, null) }}
                      placeholder="juandelacruz"
                      className={iIcon(touched.username && fieldErr.username)} />
                  </div>
                  <FieldError msg={touched.username && fieldErr.username} />
                  <p className="text-xs text-gray-400 mt-1">3–30 chars. Letters, numbers, underscores, or dots. Auto-generated if blank.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </span>
                      <input type={showPassword ? "text" : "password"} value={form.password}
                        onChange={e => {
                          setForm(f => ({ ...f, password: e.target.value }))
                          if (touched.password) validateField("password", e.target.value, null)
                          if (touched.confirmPassword) validateField("confirmPassword", form.confirmPassword, { password: e.target.value })
                        }}
                        onBlur={() => { touch("password"); validateField("password", form.password, null) }}
                        placeholder="••••••••"
                        className={iIconR(touched.password && fieldErr.password)} />
                      <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOpen /> : <EyeSlash />}
                      </button>
                    </div>
                    <FieldError msg={touched.password && fieldErr.password} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} value={form.confirmPassword}
                        onChange={e => {
                          setForm(f => ({ ...f, confirmPassword: e.target.value }))
                          if (touched.confirmPassword) validateField("confirmPassword", e.target.value, null)
                        }}
                        onBlur={() => { touch("confirmPassword"); validateField("confirmPassword", form.confirmPassword, null) }}
                        placeholder="••••••••"
                        className={`w-full px-4 pr-10 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition bg-white ${(touched.confirmPassword && fieldErr.confirmPassword) ? iErr : iOk}`} />
                      <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOpen /> : <EyeSlash />}
                      </button>
                    </div>
                    <FieldError msg={touched.confirmPassword && fieldErr.confirmPassword} />
                  </div>
                </div>

                {/* Strength bar */}
                <div>
                  <div className="flex h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full transition-all duration-300 rounded-full"
                      style={{ width: `${strengthWidth[passwordStrength]}%`, backgroundColor: strengthColors[passwordStrength] }} />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs font-medium" style={{ color: strengthColors[passwordStrength] || "#9ca3af" }}>
                      {strengthLabel[passwordStrength]}
                    </span>
                    <span className="text-xs text-gray-400">8+ chars, 1 upper, 1 number, 1 special</span>
                  </div>
                </div>

                {/* ── Delivery & billing ────────────────────────────────── */}
                <SectionHeader label="Delivery & Billing" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Billing Currency / Region</label>
                  <select
                    value={form.preferred_currency}
                    onChange={e => setForm(f => ({ ...f, preferred_currency: e.target.value }))}
                    className={iSel}
                  >
                    {SUPPORTED_REGIONS.map(r => (
                      <option key={r.code} value={r.currency}>{r.country} ({r.currency})</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Product prices will be displayed in this currency worldwide.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Region (PH)</label>
                    <select value={form.address.regionId}
                      onChange={e => { updateAddr("regionId", e.target.value); updateAddr("provinceId", "") }}
                      className={iSel}>
                      <option value="">Select Region</option>
                      {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Province</label>
                    <select value={form.address.provinceId}
                      onChange={e => updateAddr("provinceId", e.target.value)}
                      disabled={!form.address.regionId}
                      className={`${iSel} disabled:opacity-50`}>
                      <option value="">Select Province</option>
                      {getProvinces(form.address.regionId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City / Municipality</label>
                    <input type="text" value={form.address.city}
                      onChange={e => updateAddr("city", e.target.value)}
                      onBlur={() => { touch("city"); validateField("city", form.address.city, null) }}
                      placeholder="City"
                      className={iPlain(touched.city && fieldErr.city)} />
                    <FieldError msg={touched.city && fieldErr.city} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ZIP Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.address.zip_code}
                      onChange={handleZipChange}
                      onBlur={() => { touch("zip_code"); validateField("zip_code", form.address.zip_code, null) }}
                      placeholder="4 digits"
                      maxLength={4}
                      className={iPlain(touched.zip_code && fieldErr.zip_code)} />
                    <FieldError msg={touched.zip_code && fieldErr.zip_code} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Street Address</label>
                  <textarea rows="2" value={form.address.street}
                    onChange={e => updateAddr("street", e.target.value)}
                    onBlur={() => { touch("street"); validateField("street", form.address.street, null) }}
                    placeholder="House/Bldg No, Street, Subdivision/Village (e.g. 123 Rizal St, Barangay)"
                    style={{ maxHeight: "6rem" }}
                    className={`w-full px-4 py-3 border rounded-xl text-sm resize-y focus:outline-none focus:ring-2 focus:border-transparent transition bg-white ${touched.street && fieldErr.street ? iErr : iOk}`} />
                  <FieldError msg={touched.street && fieldErr.street} />
                  <p className="text-xs text-gray-400 mt-1">Must include a house/unit number and be at least 10 characters.</p>
                </div>

                <label className="flex items-start gap-2 cursor-pointer mt-4">
                  <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="w-4 h-4 rounded accent-green-600 mt-0.5" />
                  <span className="text-sm text-gray-600">I agree to the{" "}
                    <button type="button" onClick={() => setShowTerms(true)} className="text-green-700 hover:underline font-medium">Terms &amp; Conditions</button>
                  </span>
                </label>

                <button onClick={handleSendOtp} disabled={!canSubmit}
                  className="w-full py-3 bg-green-700 hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition">
                  Create Account
                </button>
              </div>
            )}

            {/* ══ OTP STEP ═══════════════════════════════════════════════ */}
            {step === "otp" && (
              <form onSubmit={handleVerifyAndRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-center">OTP Code</label>
                  <div className="flex justify-center gap-3">
                    {[0,1,2,3,4,5].map(i => (
                      <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={otp[i] || ""}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, ""); if (!val) return
                          const arr = otp.split(""); arr[i] = val[val.length - 1]; setOtp(arr.join(""))
                          if (i < 5) document.getElementById(`otp-${i + 1}`)?.focus()
                        }}
                        onKeyDown={e => {
                          if (e.key === "Backspace" && !otp[i] && i > 0) {
                            const arr = otp.split(""); arr[i - 1] = ""; setOtp(arr.join(""))
                            document.getElementById(`otp-${i - 1}`)?.focus()
                          }
                        }}
                        onPaste={e => {
                          e.preventDefault()
                          const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
                          setOtp(paste)
                          setTimeout(() => document.getElementById(`otp-${Math.min(paste.length - 1, 5)}`)?.focus(), 0)
                        }}
                        className="w-14 h-14 text-center text-2xl font-bold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white" />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-3 text-center">Check your email inbox for the verification code.</p>
                </div>
                <button type="submit" disabled={loading || otp.length < 6}
                  className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl transition disabled:opacity-60">
                  Verify &amp; Create Account
                </button>
                <button type="button" onClick={() => { setStep("form"); setOtp(""); setError("") }}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition">← Back to registration</button>
              </form>
            )}

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{" "}
              <button onClick={() => onNavigate("login")} className="text-green-700 font-semibold hover:underline">Log in</button>
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}