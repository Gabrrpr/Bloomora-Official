import { useState } from "react"
import FlowerPanel from "../components/FlowerPanel"

export default function ForgotPassword({ onNavigate }) {
  const [step, setStep] = useState(0) // 0: email, 1: otp, 2: new password, 3: success
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState(["", "", "", ""])
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const DEMO_OTP = "6789"

  const passwordChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  }
  const passScore = Object.values(passwordChecks).filter(Boolean).length
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][passScore]
  const strengthColor = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-600"][passScore]

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 3) document.getElementById(`fp-otp-${i + 1}`)?.focus()
  }

  return (
    <div className="min-h-screen flex">
      <FlowerPanel />

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-md">

          {/* Step 0: Enter Email */}
          {step === 0 && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-pink-50 mb-4">
                  <svg className="w-7 h-7 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Forgot Password</h1>
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
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition" />
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!email || !/\S+@\S+\.\S+/.test(email)) return setError("Enter a valid email address.")
                    setLoading(true); setError("")
                    setTimeout(() => { setLoading(false); setStep(1) }, 800)
                  }}
                  disabled={loading}
                  className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl transition disabled:opacity-60"
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
                <button onClick={() => onNavigate("login")} className="w-full py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition">
                  Back to Login
                </button>
              </div>
            </>
          )}

          {/* Step 1: OTP */}
          {step === 1 && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 mb-4">
                  <svg className="w-7 h-7 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Enter your code</h1>
                <p className="text-gray-500 text-sm mt-1">We sent a code to <span className="font-medium text-gray-700">{email}</span></p>
                <p className="text-xs text-green-600 mt-1">(Demo code: <strong>6789</strong>)</p>
              </div>
              {error && <p className="mb-3 text-sm text-red-500 text-center bg-red-50 p-2 rounded-xl">{error}</p>}
              <div className="flex justify-center gap-3 mb-6">
                {otp.map((digit, i) => (
                  <input key={i} id={`fp-otp-${i}`} type="text" maxLength={1} value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Backspace" && !digit && i > 0) document.getElementById(`fp-otp-${i - 1}`)?.focus() }}
                    className="w-14 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:border-green-500 transition" />
                ))}
              </div>
              <p className="text-center text-sm text-gray-500 mb-4">
                Didn't receive the email? <button className="text-green-700 font-semibold hover:underline">Resend</button>
              </p>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition">Back</button>
                <button onClick={() => { if (otp.join("") !== DEMO_OTP) return setError("Invalid code. Try: 6789"); setError(""); setStep(2) }}
                  className="flex-1 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl transition">Continue</button>
              </div>
            </>
          )}

          {/* Step 2: New Password */}
          {step === 2 && (
            <>
              <div className="text-center mb-8">
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2V10a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= passScore ? strengthColor : "bg-gray-200"}`} />
                        ))}
                      </div>
                      <p className="text-xs text-right text-gray-500">{strengthLabel}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  {[
                    { key: "lower", label: "At least one lowercase letter" },
                    { key: "length", label: "Minimum 8 characters" },
                    { key: "upper", label: "At least one uppercase letter" },
                    { key: "number", label: "At least one number" },
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
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition">Back</button>
                  <button
                    onClick={() => {
                      if (!passwordChecks.length || !passwordChecks.upper || !passwordChecks.lower || !passwordChecks.number)
                        return setError("Password does not meet all requirements.")
                      setError(""); setLoading(true)
                      setTimeout(() => { setLoading(false); setStep(3) }, 800)
                    }}
                    disabled={loading}
                    className="flex-1 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl transition disabled:opacity-60"
                  >
                    {loading ? "Saving..." : "Set new password"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Password Changed!</h1>
              <p className="text-gray-500 text-sm mb-8">Your password has been successfully updated. You can now log in with your new password.</p>
              <button onClick={() => onNavigate("login")} className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl transition">
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
