import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { sendOtp, verifyOtp, registerUser } from "../services/auth.js"
import FlowerPanel from "../components/FlowerPanel"

const STEPS = ["Email", "Verify", "Details", "Password", "Done"]

function ProgressBar({ currentStep }) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                i < currentStep
                  ? "bg-green-700 border-green-700 text-white"
                  : i === currentStep
                  ? "bg-white border-green-700 text-green-700"
                  : "bg-white border-gray-200 text-gray-400"
              }`}
            >
              {i < currentStep ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className={`text-xs mt-1 ${i === currentStep ? "text-green-700 font-semibold" : "text-gray-400"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="relative h-1.5 bg-gray-100 rounded-full mt-1 mx-4">
        <div
          className="absolute left-0 top-0 h-full bg-green-700 rounded-full transition-all duration-500"
          style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  )
}

export default function Register({ onNavigate, initalStep = 0 }) {
  const { register } = useAuth()
  const [step, setStep] = useState(initalStep)
  const [form, setForm] = useState({
    email: "",
    otp: ["", "", "", ""],
    firstName: "",
    middleName: "",
    lastName: "",
    password: "",
    phoneNumber: "",
    agreeTerms: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const passwordChecks = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    lower: /[a-z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[!@#$%^&*]/.test(form.password),
  }
  const passScore = Object.values(passwordChecks).filter(Boolean).length

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const otp = [...form.otp]
    otp[i] = val
    setForm({ ...form, otp })
    if (val && i < 3) document.getElementById(`otp-${i + 1}`)?.focus()
  }

  const nextStep = async () => {
    setError("")
    setLoading(true)

    try {
      if (step === 0) {
        // Send OTP
        await sendOtp(form.email)
        setMessage("OTP sent! Check your email.")
        setStep(1)
      } else if (step === 1) {
        // Verify OTP
        const otpCode = form.otp.join("")
        if (otpCode.length !== 4) throw new Error("Enter full 4-digit code")
        await verifyOtp(form.email, otpCode)
        setStep(2)
      } else if (step === 2) {
        // Check names
        if (!form.firstName || !form.lastName) throw new Error("First and last name required")
        setStep(3)
      } else if (step === 3) {
        // Register
        if (Object.values(passwordChecks).some(v => !v)) throw new Error("Password must meet requirements")
        if (!form.agreeTerms) throw new Error("Agree to terms")
        
        await register({
          email: form.email,
          first_name: form.firstName,
          middle_name: form.middleName || "",
          last_name: form.lastName,
          password: form.password,
          phone_number: form.phoneNumber || null,
        })
        setStep(4)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resendOtp = async () => {
    setLoading(true)
    try {
      await sendOtp(form.email)
      setMessage("OTP resent!")
      setError("")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Step renders (same UI as before, just logic changed)
  const renderStep = () => {
  if (step === 0) return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Create Account</h1>
        <p className="text-gray-500">Enter email for verification code</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full p-3 border rounded-lg"
          placeholder="your@email.com"
        />
      </div>
      <button onClick={nextStep} disabled={loading || !form.email} className="w-full p-3 bg-green-600 text-white rounded-lg disabled:opacity-50">
        {loading ? 'Sending...' : 'Send Code'}
      </button>
      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <button onClick={() => onNavigate("login")} className="text-green-700 font-semibold hover:underline">Log in</button>
      </p>
    </div>
  )

  if (step === 1) return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Enter your code</h1>
        <p className="text-gray-500">We sent a code to <span className="font-medium text-gray-700">{form.email}</span></p>
      </div>
      <div className="flex justify-center gap-3 mb-6">
        {form.otp.map((digit, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digit && i > 0)
                document.getElementById(`otp-${i - 1}`)?.focus()
            }}
            className="w-14 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:border-green-500 transition"
          />
        ))}
      </div>
      <p className="text-center text-sm text-gray-500 mb-4">
        Didn't receive the email?{" "}
        <button onClick={resendOtp} disabled={loading} className="text-green-700 font-semibold hover:underline">Resend</button>
      </p>
      <div className="flex gap-3">
        <button onClick={() => setStep(0)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50">Back</button>
        <button onClick={nextStep} disabled={loading || form.otp.join("").length !== 4} className="flex-1 py-3 bg-green-700 text-white font-semibold rounded-xl disabled:opacity-50">
          {loading ? "Verifying..." : "Continue"}
        </button>
      </div>
    </div>
  )

  if (step === 2) return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Complete your account</h1>
        <p className="text-gray-500">Add your name to finish signing up</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">First Name <span className="text-red-400">*</span></label>
        <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          placeholder="Juan" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">Middle Name</label>
          <input value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })}
            placeholder="Santos" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Last Name <span className="text-red-400">*</span></label>
          <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            placeholder="dela Cruz" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50">Back</button>
        <button onClick={nextStep} disabled={loading} className="flex-1 py-3 bg-green-700 text-white font-semibold rounded-xl disabled:opacity-50">Continue</button>
      </div>
    </div>
  )

  if (step === 3) return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Set your password</h1>
        <p className="text-gray-500">Must be at least 8 characters</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Password</label>
        <input type="password" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="••••••••"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <div className="space-y-1.5">
        {[
          { key: "length", label: "Minimum 8 characters" },
          { key: "upper", label: "At least one uppercase letter" },
          { key: "lower", label: "At least one lowercase letter" },
          { key: "number", label: "At least one number" },
          { key: "special", label: "At least one special character (!@#$%^&*)" },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            <span className={passwordChecks[key] ? "text-green-600" : "text-gray-400"}>
              {passwordChecks[key] ? "✓" : "✗"} {label}
            </span>
          </div>
        ))}
      </div>
      <label className="flex items-start gap-2 cursor-pointer">
        <input type="checkbox" checked={form.agreeTerms}
          onChange={(e) => setForm({ ...form, agreeTerms: e.target.checked })}
          className="mt-0.5 w-4 h-4 accent-green-600" />
        <span className="text-xs text-gray-600">
          I agree to the{" "}
          <button type="button" onClick={() => onNavigate("terms")} className="text-green-700 underline">Terms and Conditions</button>
        </span>
      </label>
      <div className="flex gap-3 pt-2">
        <button onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50">Back</button>
        <button onClick={nextStep} disabled={loading} className="flex-1 py-3 bg-green-700 text-white font-semibold rounded-xl disabled:opacity-50">
          {loading ? "Creating..." : "Create Account"}
        </button>
      </div>
    </div>
  )

  if (step === 4) return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Account Created!</h1>
      <p className="text-gray-500 text-sm mb-2">Welcome to Bloomora, <span className="font-semibold">{form.firstName}</span>!</p>
      <p className="text-gray-400 text-sm mb-8">Your account has been successfully created.</p>
      <button onClick={() => onNavigate("login")} className="w-full py-3 bg-green-700 text-white font-semibold rounded-xl">
        Go to Login
      </button>
    </div>
  )
}

  return (
    <div className="min-h-screen flex">
      <FlowerPanel />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <ProgressBar currentStep={step} />
          {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4">{error}</div>}
          {message && <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg mb-4">{message}</div>}
          {renderStep()}
        </div>
      </div>
    </div>
  )
}

