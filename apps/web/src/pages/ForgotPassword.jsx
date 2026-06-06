import { useState, useEffect } from "react"
import FlowerPanel from "../components/FlowerPanel"
import { sendForgotPasswordOtp, resetPassword } from "../services/auth"
import estingsLogo from "../assets/Estings.svg"
import bgImg from "../assets/BG_LoginRegister.png"

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

const STEP_TITLES = ["Forgot Password", "Enter your code", "Set new password", "Password Changed!"]

export default function ForgotPassword({ onNavigate }) {
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState("")
const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const passwordChecks = {
    length: password.length >= 8, upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password), number: /[0-9]/.test(password),
  }
  const passScore = Object.values(passwordChecks).filter(Boolean).length
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][passScore]
  const strengthColor = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-600"][passScore]

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[i] = val; setOtp(next)
if (val && i < 5) document.getElementById(`fp-otp-${i + 1}`)?.focus()
  }

  const handleSendOtp = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) return setError("Enter a valid email address.")
    setLoading(true); setError("")
    try { await sendForgotPasswordOtp(email); setStep(1) }
    catch (err) { setError(err.message || "Failed to send OTP. Please try again.") }
    finally { setLoading(false) }
  }

  const handleVerifyOtp = () => {
if (otp.join("").length !== 6) return setError("Please enter the 6-digit OTP.")
    setStep(2); setError("")
  }

  const handleResetPassword = async () => {
    if (!passwordChecks.length || !passwordChecks.upper || !passwordChecks.lower || !passwordChecks.number)
      return setError("Password does not meet all requirements.")
    setLoading(true); setError("")
    try { await resetPassword(email, otp.join(""), password); setStep(3) }
    catch (err) { setError(err.message || "Failed to reset password. Please try again.") }
    finally { setLoading(false) }
  }

  const inputCls = "w-full py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white"

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 flex-shrink-0"><FlowerPanel /></div>

      {/* Right panel — gray bg */}
      <div className="w-full lg:w-1/2 flex flex-col bg-gray-50">
        <MobileFlowerBanner />

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          {/* Card */}
          <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-gray-100 px-8 py-10">

            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 ${step === 0 ? "bg-pink-50" : "bg-green-50"}`}>
                {step === 0 && <svg className="w-7 h-7 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>}
                {step === 1 && <svg className="w-7 h-7 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                {step === 2 && <svg className="w-7 h-7 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                {step === 3 && <svg className="w-7 h-7 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              </div>
              <h1 className="text-2xl font-bold text-gray-800 min-h-[2rem]">
                <TypewriterText text={STEP_TITLES[step]} />
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {step === 0 && "Enter your email to receive a verification code"}
                {step === 1 && <span>We sent a code to <span className="font-medium text-gray-700">{email}</span></span>}
                {step === 2 && "Must be at least 8 characters"}
                {step === 3 && "Your password has been successfully updated."}
              </p>
            </div>

            {error && <p className="mb-4 text-sm text-red-500 text-center bg-red-50 p-2 rounded-xl border border-red-100">{error}</p>}

            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </span>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                      className={`pl-10 pr-4 ${inputCls}`} />
                  </div>
                </div>
                <button onClick={handleSendOtp} disabled={loading} className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl transition disabled:opacity-60">
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
                <button onClick={() => onNavigate("login")} className="w-full py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition">Back to Login</button>
              </div>
            )}

            {step === 1 && (
              <>
                <div className="flex justify-center gap-3 mb-6">
 {otp.map((digit, i) => (
                    <input key={i} id={`fp-otp-${i}`} type="text" maxLength={1} value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => { if (e.key === "Backspace" && !digit && i > 0) document.getElementById(`fp-otp-${i - 1}`)?.focus() }}
                      className="w-14 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition bg-white" />
                  ))}
                </div>
                <p className="text-center text-sm text-gray-500 mb-4">
                  Didn't receive the email?{" "}
                  <button onClick={handleSendOtp} disabled={loading} className="text-green-700 font-semibold hover:underline disabled:opacity-60">{loading ? "Sending..." : "Resend"}</button>
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setStep(0)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition">Back</button>
                  <button onClick={handleVerifyOtp} className="flex-1 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl transition">Continue</button>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2V10a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </span>
                    <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                      className={`pl-10 pr-10 ${inputCls}`} />
                    <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword
                        ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4].map(i => <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= passScore ? strengthColor : "bg-gray-200"}`} />)}
                      </div>
                      <p className="text-xs text-right text-gray-500">{strengthLabel}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  {[{ key: "lower", label: "At least one lowercase letter" }, { key: "length", label: "Minimum 8 characters" }, { key: "upper", label: "At least one uppercase letter" }, { key: "number", label: "At least one number" }].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      {passwordChecks[key]
                        ? <svg className="w-3.5 h-3.5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        : <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>}
                      <span className={passwordChecks[key] ? "text-green-600" : "text-gray-400"}>{label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition">Back</button>
                  <button onClick={handleResetPassword} disabled={loading} className="flex-1 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl transition disabled:opacity-60">
                    {loading ? "Saving..." : "Set new password"}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <button onClick={() => onNavigate("login")} className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl transition">
                Back to Login
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
