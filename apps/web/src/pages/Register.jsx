import { useState } from "react"
import { useAuth } from "../context/AuthContext"
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

export default function Register({ onNavigate }) {
  const { register } = useAuth()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    email: "",
    otp: ["", "", "", ""],
    firstName: "",
    middleName: "",
    lastName: "",
    password: "",
    agreeTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const DEMO_OTP = "6789"

  const passwordChecks = {
    length: form.password.length >= 8,
    letter: /[a-zA-Z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    upper: /[A-Z]/.test(form.password),
    special: /[!@#$%^&*]/.test(form.password),
  }
  const passScore = Object.values(passwordChecks).filter(Boolean).length
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"][passScore]
  const strengthColor = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500", "bg-green-700"][passScore]

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const otp = [...form.otp]
    otp[i] = val
    setForm({ ...form, otp })
    if (val && i < 3) document.getElementById(`otp-${i + 1}`)?.focus()
  }

  const nextStep = () => {
    setError("")
    if (step === 0) {
      if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) return setError("Enter a valid email address.")
      setLoading(true)
      setTimeout(() => { setLoading(false); setStep(1) }, 800)
    } else if (step === 1) {
      if (form.otp.join("") !== DEMO_OTP) return setError("Invalid code. Try: 6789")
      setStep(2)
    } else if (step === 2) {
      if (!form.firstName || !form.lastName) return setError("First and last name are required.")
      setStep(3)
    } else if (step === 3) {
      if (!passwordChecks.length || !passwordChecks.letter || !passwordChecks.number)
        return setError("Password does not meet requirements.")
      if (!form.agreeTerms) return setError("You must agree to the Terms & Conditions.")
      setLoading(true)
      setTimeout(() => {
        register({
          email: form.email,
          firstName: form.firstName,
          middleName: form.middleName,
          lastName: form.lastName,
          password: form.password,
        })
        setLoading(false)
        setStep(4)
      }, 800)
    }
  }

  return (
    <div className="min-h-screen flex">
      <FlowerPanel />

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-8 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <ProgressBar currentStep={step} />

          {/* Step 0: Email */}
          {step === 0 && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 mb-4">
                  <svg className="w-7 h-7 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Create an account</h1>
                <p className="text-gray-500 text-sm mt-1">Enter your email to receive a verification code</p>
              </div>
              {error && <p className="mb-3 text-sm text-red-500 text-center bg-red-50 p-2 rounded-xl">{error}</p>}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    />
                  </div>
                </div>
                <button
                  onClick={nextStep}
                  disabled={loading}
                  className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl transition disabled:opacity-60"
                >
                  {loading ? "Sending code..." : "Verify email"}
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">or continue with</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-700">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-700">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </button>
                </div>
              </div>
              <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{" "}
                <button onClick={() => onNavigate("login")} className="text-green-700 font-semibold hover:underline">Log in</button>
              </p>
              <p className="text-center text-xs text-gray-400 mt-3">
                By registering, you agree to our{" "}
                <button onClick={() => onNavigate("terms")} className="underline hover:text-gray-600">Terms & Conditions</button>
              </p>
            </>
          )}

          {/* Step 1: OTP */}
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 mb-4">
                  <svg className="w-7 h-7 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Enter your code</h1>
                <p className="text-gray-500 text-sm mt-1">
                  We sent a code to <span className="font-medium text-gray-700">{form.email}</span>
                </p>
                <p className="text-xs text-green-600 mt-1">(Demo code: <strong>6789</strong>)</p>
              </div>
              {error && <p className="mb-3 text-sm text-red-500 text-center bg-red-50 p-2 rounded-xl">{error}</p>}
              <div className="flex justify-center gap-3 mb-6">
                {form.otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
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
                <button className="text-green-700 font-semibold hover:underline">Resend</button>
              </p>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition">Back</button>
                <button onClick={nextStep} className="flex-1 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl transition">Continue</button>
              </div>
            </>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 mb-4">
                  <svg className="w-7 h-7 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Complete your account</h1>
                <p className="text-gray-500 text-sm mt-1">Add your name to finish signing up</p>
              </div>
              {error && <p className="mb-3 text-sm text-red-500 text-center bg-red-50 p-2 rounded-xl">{error}</p>}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name <span className="text-red-400">*</span></label>
                  <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Juan"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Middle Name</label>
                    <input value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} placeholder="Santos"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name <span className="text-red-400">*</span></label>
                    <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="dela Cruz"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition">Back</button>
                  <button onClick={nextStep} className="flex-1 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl transition">Continue</button>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Password */}
          {step === 3 && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 mb-4">
                  <svg className="w-7 h-7 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Set new password</h1>
                <p className="text-gray-500 text-sm mt-1">Must be at least 8 characters</p>
              </div>
              {error && <p className="mb-3 text-sm text-red-500 text-center bg-red-50 p-2 rounded-xl">{error}</p>}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input type={showPassword ? "text" : "password"} value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= passScore ? strengthColor : "bg-gray-200"}`} />
                        ))}
                      </div>
                      <p className="text-xs text-right text-gray-500">{strengthLabel}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  {[
                    { key: "length", label: "Minimum 8 characters" },
                    { key: "upper", label: "At least one uppercase letter" },
                    { key: "letter", label: "At least one lowercase letter" },
                    { key: "number", label: "At least one number" },
                    { key: "special", label: "At least one special character (!@#$%^&*)" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      {passwordChecks[key] ? (
                        <svg className="w-3.5 h-3.5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={passwordChecks[key] ? "text-green-600" : "text-gray-400"}>{label}</span>
                    </div>
                  ))}
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.agreeTerms} onChange={(e) => setForm({ ...form, agreeTerms: e.target.checked })} className="mt-0.5 w-4 h-4 accent-green-600" />
                  <span className="text-xs text-gray-600">
                    I have read and agree to the{" "}
                    <button type="button" onClick={() => onNavigate("terms")} className="text-green-700 underline font-medium">Terms and Conditions</button>
                    {" "}and{" "}
                    <button type="button" onClick={() => onNavigate("terms")} className="text-green-700 underline font-medium">Privacy Policy</button>
                    {" "}of Bloomora.
                  </span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(2)} disabled={loading} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition">Back</button>
                  <button onClick={nextStep} disabled={loading} className="flex-1 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl transition disabled:opacity-60">
                    {loading ? "Creating..." : "Create an account"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Account Created!</h1>
              <p className="text-gray-500 text-sm mb-2">Welcome to Bloomora, <span className="font-semibold text-gray-700">{form.firstName}</span>!</p>
              <p className="text-gray-400 text-sm mb-8">Your account has been successfully created. You can now log in and start exploring our floral collections.</p>
              <button onClick={() => onNavigate("login")} className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl transition">
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
