import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { sendOtp, verifyOtp } from "../services/auth"
import { regions, getProvinces } from "../utils/philippines"
import FlowerPanel from "../components/FlowerPanel"

const STORAGE_KEY = "register_form_draft"

export default function Register({ onNavigate }) {
  const { register } = useAuth()
  const [step, setStep] = useState("form")
  const [otp, setOtp] = useState("")
  const [form, setForm] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      username: "",
      password: "",
      confirmPassword: "",
      address: {
        regionId: "",
        provinceId: "",
        city: "",
        street: "",
        zip_code: "",
      }
    }
  })
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Validation states
  const [phoneValid, setPhoneValid] = useState(true)
  const [passwordStrength, setPasswordStrength] = useState('empty')
  const [addressComplete, setAddressComplete] = useState(false)
  const [formValid, setFormValid] = useState(false)

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form))
  }, [form])

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.removeItem(STORAGE_KEY)
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  // Phone validation & formatting
  const handlePhoneChange = useCallback((e) => {
    let val = e.target.value.replace(/[^\d+]/g, '')
    if (val.startsWith('0')) val = '+63' + val.slice(1)
    if (!val.startsWith('+63')) val = '+63' + val.slice(0, 10)
    val = val.slice(0, 13) // +63xxxxxxxxx
    const isValid = /^\+63\d{10}$/.test(val)
    setPhoneValid(isValid)
    setForm({ ...form, phone: val })
  }, [form])

  // Password strength
  useEffect(() => {
    const pass = form.password
    let score = 0
    if (pass.length >= 8) score++
    if (/[A-Z]/.test(pass)) score++
    if (/[0-9]/.test(pass)) score++
    if (/[^A-Za-z0-9]/.test(pass)) score++
    const strength = score === 0 ? 'empty' : score < 2 ? 'weak' : score < 3 ? 'fair' : score < 4 ? 'good' : 'strong'
    setPasswordStrength(strength)
  }, [form.password])

  // Address validation
  useEffect(() => {
    const addr = form.address
    const complete = addr.regionId && addr.provinceId && addr.city.trim() && addr.street.trim() && addr.zip_code.trim()
    setAddressComplete(complete)
  }, [form.address])

  // Overall form valid
  useEffect(() => {

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    setFormValid(
      !!form.firstName.trim() &&
      !!form.lastName.trim() &&
      emailValid &&
      phoneValid &&
      passwordStrength === 'strong' &&
      form.password === form.confirmPassword &&
      agreeTerms &&
      addressComplete
    )

  }, [form, phoneValid, passwordStrength, agreeTerms, addressComplete])

  const validateForm = () => {
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.")
      return false
    }
    if (!phoneValid) {
      setError("Phone must be valid Philippine number (+63xxxxxxxxx).")
      return false
    }
    if (passwordStrength !== 'strong') {
      setError("Password must be strong (8+ chars, upper, number, special).")
      return false
    }
    if (!addressComplete) {
      setError("Please complete all address fields.")
      return false
    }
    if (!agreeTerms) {
      setError("Please agree to the Terms & Conditions.")
      return false
    }
    return true
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError("")
    if (!validateForm()) return

    setLoading(true)
    try {
      await sendOtp(form.email)
      setStep("otp")
      setError("")
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault()
    setError("")
    if (!otp || otp.length < 4) {
      setError("Please enter the OTP sent to your email.")
      return
    }

    setLoading(true)
    try {
      await verifyOtp(form.email, otp)
      const result = await register({
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone_number: form.phone,
        username: form.username || undefined,
        password: form.password,
        address: form.address // New field
      })
      if (result.success || result.status === "success") {
        sessionStorage.setItem("registerEmail", form.email)
        sessionStorage.setItem("registerPassword", form.password)
        onNavigate("login")
      } else {
        setError(result.message || "Registration failed. Please try again.")
      }
    } catch (err) {
      setError(err.message || "Invalid OTP or registration failed.")
    } finally {
      setLoading(false)
    }
  }

  const strengthColors = {
    empty: 'gray',
    weak: 'red',
    fair: 'orange',
    good: 'yellow',
    strong: 'green'
  }

  const strengthWidth = {
    empty: 0,
    weak: 25,
    fair: 50,
    good: 75,
    strong: 100
  }

  const updateAddressField = (field, value) => {
    const newAddress = { ...form.address, [field]: value }
    setForm({ ...form, address: newAddress })
  }

  return (
    <div className="min-h-screen flex">
      <FlowerPanel />

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 mb-4">
              <svg className="w-7 h-7 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {step === "otp" ? "Verify your email" : "Create an account"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {step === "otp"
                ? `Enter the OTP sent to ${form.email}`
                : "Join us and start ordering beautiful flowers today."}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center">{error}</div>
          )}

          {step === "form" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                  <input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="Juan" required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                  <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Dela Cruz" required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </span>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="juan@example.com" required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h.93a2 2 0 01.948.684l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 01.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                  </span>
                  <input type="tel" value={form.phone} onChange={handlePhoneChange} placeholder="+63 917 123 4567"
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${phoneValid ? '' : 'border-red-300 bg-red-50'}`} />
                  {!phoneValid && form.phone && (
                    <p className="text-xs text-red-600 mt-1">Invalid Philippine phone number</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </span>
                  <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="juandelacruz"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Leave blank to auto-generate from email.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </span>
                  <input type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required
                    className={`w-full pl-10 pr-10 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${passwordStrength === 'strong' ? 'border-green-300 ring-green-500' : passwordStrength === 'empty' ? '' : 'border-yellow-300'}`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
                {/* Password strength bar */}
                <div className="mt-2">
                  <div className="flex h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${strengthWidth[passwordStrength]}%`,
                        backgroundColor: strengthColors[passwordStrength]
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span>Weak</span>
                    <span>Fair</span>
                    <span>Good</span>
                    <span>Strong</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  8+ chars, 1 upper, 1 number, 1 special
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <input type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} placeholder="••••••••" required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
              </div>

              {/* Address Section */}
              <div className="border-y border-gray-100 py-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Delivery Address</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Region</label>
                    <select value={form.address.regionId} onChange={e => updateAddressField('regionId', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                      <option value="">Select Region</option>
                      {regions.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Province</label>
                    <select value={form.address.provinceId} onChange={e => updateAddressField('provinceId', e.target.value)} disabled={!form.address.regionId} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                      <option value="">Select Province</option>
                      {getProvinces(form.address.regionId).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City / Municipality</label>
                    <input type="text" value={form.address.city} onChange={e => updateAddressField('city', e.target.value)} placeholder="City" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input type="text" value={form.address.zip_code} onChange={e => updateAddressField('zip_code', e.target.value)} placeholder="ZIP" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Street Address</label>
                  <textarea rows="2" value={form.address.street} onChange={e => updateAddressField('street', e.target.value)} placeholder="House/Bldg No, Street, Subdivision/Village" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-vertical" />
                </div>
                {!addressComplete && (
                  <p className="text-xs text-red-600 mt-1">Please complete all address fields</p>
                )}
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="w-4 h-4 rounded accent-green-600 mt-0.5" />
                <span className="text-sm text-gray-600">
                  I agree to the{" "}
                  <button type="button" onClick={() => onNavigate("terms")} className="text-green-700 hover:underline font-medium">Terms & Conditions</button>
                </span>
              </label>

              <button type="submit" disabled={loading || !formValid}
                className="w-full py-3 bg-green-700 hover:bg-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                    Sending OTP...
                  </span>
                ) : "Create Account"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">OTP Code</label>
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otp[i] || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "")
                        if (!val) return
                        const newOtp = otp.split("")
                        newOtp[i] = val[val.length - 1]
                        const joined = newOtp.join("")
                        setOtp(joined)
                        if (i < 3 && val) {
                          document.getElementById(`otp-${i + 1}`)?.focus()
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !otp[i] && i > 0) {
                          const newOtp = otp.split("")
                          newOtp[i - 1] = ""
                          setOtp(newOtp.join(""))
                          document.getElementById(`otp-${i - 1}`)?.focus()
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault()
                        const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4)
                        setOtp(paste)
                        const focusIndex = Math.min(paste.length, 3)
                        setTimeout(() => document.getElementById(`otp-${focusIndex}`)?.focus(), 0)
                      }}
                      className="w-14 h-14 text-center text-2xl font-bold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">Check your email inbox for the verification code.</p>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl transition disabled:opacity-60">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                    Verifying...
                  </span>
                ) : "Verify & Create Account"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("form"); setOtp(""); setError("") }}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition"
              >
                ← Back to registration
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <button onClick={() => onNavigate("login")} className="text-green-700 font-semibold hover:underline">Log in</button>
          </p>
        </div>
      </div>
    </div>
  )
}

