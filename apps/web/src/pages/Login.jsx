import { useState, useEffect, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import FlowerPanel from "../components/FlowerPanel"
import Footer from "../components/Footer"
import estingsLogo from "../assets/Estings.svg"
import bgImg from "../assets/BG_LoginRegister.png"

// ── Constants ───────────────────────────────────────────────────────────────
const MAX_ATTEMPTS   = 5          // failed logins before lockout
const LOCKOUT_SECS   = 5 * 60    // 5-minute lockout in seconds
const STORAGE_PREFIX = "login_ratelimit_"

// ── Helpers ─────────────────────────────────────────────────────────────────
function getLockoutState(email) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + email)
    if (!raw) return { attempts: 0, lockedUntil: null }
    return JSON.parse(raw)
  } catch { return { attempts: 0, lockedUntil: null } }
}
function saveLockoutState(email, state) {
  localStorage.setItem(STORAGE_PREFIX + email, JSON.stringify(state))
}
function clearLockoutState(email) {
  localStorage.removeItem(STORAGE_PREFIX + email)
}

// Strict email validator — requires proper TLD (≥ 2 real alpha chars after last dot)
function isValidEmail(value) {
  // Must have exactly one @, valid domain, and TLD of 2+ letters
  return /^[^\s@]+@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(value.trim())
}

function formatCountdown(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0")
  const s = (secs % 60).toString().padStart(2, "0")
  return `${m}:${s}`
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

// ── Flower petal loader — full-page overlay ─────────────────────────────────
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

// ── Lockout banner ──────────────────────────────────────────────────────────
function LockoutBanner({ secondsLeft }) {
  return (
    <div className="mb-4 p-4 rounded-xl bg-orange-50 border border-orange-200 text-center">
      <div className="flex items-center justify-center gap-2 mb-1">
        {/* Lock icon */}
        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="text-orange-700 font-semibold text-sm">Account temporarily locked</span>
      </div>
      <p className="text-orange-600 text-sm">Too many failed attempts. Try again in</p>
      <p className="text-orange-700 font-bold text-2xl mt-1 tabular-nums">{formatCountdown(secondsLeft)}</p>
    </div>
  )
}

export default function Login({ onNavigate }) {
  const { login, googleLogin, facebookLogin } = useAuth()

  const [form, setForm] = useState(() => {
    const savedEmail    = sessionStorage.getItem("registerEmail")
    const savedPassword = sessionStorage.getItem("registerPassword")
    return { email: savedEmail || "", password: savedPassword || "" }
  })

  const [showPassword, setShowPassword]   = useState(false)
  const [rememberMe, setRememberMe]       = useState(false)
  const [error, setError]                 = useState("")
  const [emailError, setEmailError]       = useState("")   // inline email hint
  const [loading, setLoading]             = useState(false)
  const [splitting, setSplitting]         = useState(false)
  const [pendingRoute, setPendingRoute]   = useState(null)

  // ── Rate-limit state ──────────────────────────────────────────────────────
  const [lockoutSecs, setLockoutSecs]     = useState(0)   // 0 = not locked
  const [attempts, setAttempts]           = useState(0)
  const timerRef                          = useRef(null)

  // Restore lockout from localStorage on mount / when email changes
  useEffect(() => {
    if (!form.email) return
    const state = getLockoutState(form.email)
    if (state.lockedUntil) {
      const remaining = Math.ceil((state.lockedUntil - Date.now()) / 1000)
      if (remaining > 0) {
        setLockoutSecs(remaining)
        setAttempts(state.attempts)
        startCountdown(remaining)
      } else {
        clearLockoutState(form.email)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    sessionStorage.removeItem("registerEmail")
    sessionStorage.removeItem("registerPassword")
  }, [])

  useEffect(() => {
    if (!splitting || !pendingRoute) return
    const timer = setTimeout(() => onNavigate(pendingRoute), 850)
    return () => clearTimeout(timer)
  }, [splitting, pendingRoute])

  // ── Countdown timer ───────────────────────────────────────────────────────
  function startCountdown(seconds) {
    clearInterval(timerRef.current)
    setLockoutSecs(seconds)
    timerRef.current = setInterval(() => {
      setLockoutSecs(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          clearLockoutState(form.email)
          setAttempts(0)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  // ── Inline email validation on blur ──────────────────────────────────────
  const handleEmailBlur = () => {
    if (!form.email) { setEmailError(""); return }
    if (!isValidEmail(form.email)) {
      setEmailError("Please enter a valid email address (e.g. juan@gmail.com).")
    } else {
      setEmailError("")
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    // Block while locked out
    if (lockoutSecs > 0) return

    // Validate email format before hitting API
    if (!isValidEmail(form.email) && form.email.includes("@")) {
      setEmailError("Please enter a valid email address (e.g. juan@gmail.com).")
      return
    }

    setLoading(true)
    try {
      const result = await login(form.email, form.password)
      if (result.success) {
        clearLockoutState(form.email)
        const route = result.role?.toLowerCase() === "admin" ? "admin" : "home"
        setPendingRoute(route)
        setSplitting(true)
      } else {
        // Increment attempt counter
        const stored = getLockoutState(form.email)
        const newAttempts = (stored.attempts || 0) + 1
        setAttempts(newAttempts)

        if (newAttempts >= MAX_ATTEMPTS) {
          const lockedUntil = Date.now() + LOCKOUT_SECS * 1000
          saveLockoutState(form.email, { attempts: newAttempts, lockedUntil })
          startCountdown(LOCKOUT_SECS)
          setError("")
        } else {
          saveLockoutState(form.email, { attempts: newAttempts, lockedUntil: null })
          const remaining = MAX_ATTEMPTS - newAttempts
          setError(
            `Invalid username or password. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining before your account is temporarily locked.`
          )
        }
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const isLocked = lockoutSecs > 0

  const leftStyle  = { transition: "transform 0.85s cubic-bezier(0.7,0,0.3,1)", transform: splitting ? "translateX(-100%)" : "translateX(0)" }
  const rightStyle = { transition: "transform 0.85s cubic-bezier(0.7,0,0.3,1)", transform: splitting ? "translateX(100%)"  : "translateX(0)" }

  return (
    <>
      {loading && <FlowerLoader message="Signing you in..." />}

      <div className="min-h-screen overflow-hidden">
        <div className="min-h-screen flex">

          <div className="hidden lg:block lg:w-1/2 flex-shrink-0 sticky top-0 h-screen" style={leftStyle}>
            <FlowerPanel />
          </div>

          <div className="w-full lg:w-1/2 flex flex-col bg-gray-50 overflow-y-auto" style={rightStyle}>
            <MobileFlowerBanner />

            <div className="flex-1 flex items-center justify-center px-6 py-12">
              <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-gray-100 px-8 py-10">

                <div className="text-center mb-8">
                  <div className="hidden lg:inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 mb-4">
                    <img src="/EstingsLogo.svg" alt="Esting's Flowers" className="w-10 h-10" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800 mt-2 min-h-[2rem]">
                    <TypewriterText text="Welcome back" />
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">Log in to your account and pick up where you left off.</p>
                </div>

                {/* Lockout banner takes priority over regular error */}
                {isLocked
                  ? <LockoutBanner secondsLeft={lockoutSecs} />
                  : error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center">{error}</div>
                  )
                }

                {/* Warn when 1–2 attempts left */}
                {!isLocked && attempts >= MAX_ATTEMPTS - 2 && attempts < MAX_ATTEMPTS && (
                  <div className="mb-3 p-2 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs text-center">
                    ⚠️ Warning: Too many wrong attempts will lock your account for {LOCKOUT_SECS / 60} minutes.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email / Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Username or Email</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        value={form.email}
                        onChange={e => { setForm({ ...form, email: e.target.value }); setEmailError("") }}
                        onBlur={handleEmailBlur}
                        placeholder="juandelacruz or juan@gmail.com"
                        required
                        disabled={isLocked}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition bg-white
                          ${emailError ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-green-500"}
                          ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                    </div>
                    {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        placeholder="••••••••"
                        required
                        disabled={isLocked}
                        className={`w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                      <button type="button" onClick={() => setShowPassword(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword
                          ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        }
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-4 h-4 rounded accent-green-600" />
                      <span className="text-sm text-gray-600">Remember me</span>
                    </label>
                    <button type="button" onClick={() => onNavigate("forgot-password")} className="text-sm text-green-700 hover:text-green-800 font-medium">Forgot password?</button>
                  </div>

                  <button type="submit" disabled={loading || splitting || isLocked}
                    className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed">
                    {splitting ? "Entering..." : isLocked ? `Locked (${formatCountdown(lockoutSecs)})` : "Login"}
                  </button>
                </form>

                <div className="my-6 flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">or continue with</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={googleLogin}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-700">
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Google
                  </button>
                  <button type="button" onClick={facebookLogin}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-700">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </button>
                </div>

                <p className="text-center text-sm text-gray-500 mt-6">
                  Don't have an account?{" "}
                  <button onClick={() => onNavigate("register")} className="text-green-700 font-semibold hover:underline">Sign up</button>
                </p>
                <p className="text-center text-xs text-gray-400 mt-3">
                  By signing in, you agree to our{" "}
                  <button onClick={() => onNavigate("terms")} className="underline hover:text-gray-600">Terms & Conditions</button>
                </p>

              </div>
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}
