import { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext({
  isDark: false,
  toggleDark: () => {},
  setIsDark: () => {},
  forceMode: () => {},
  clearForce: () => {},
})

export function ThemeProvider({ children }) {
  // User's actual saved preference
  const [userPref, setUserPref] = useState(() => {
    try { return localStorage.getItem("bloomora-theme") === "dark" }
    catch { return false }
  })

  // Forced override: null = no override (use userPref), true/false = forced
  const [forcedDark, setForcedDark] = useState(null)

  // What components actually see
  const isDark = forcedDark !== null ? forcedDark : userPref

  // Apply to DOM
  useEffect(() => {
    const root = document.documentElement
    isDark
      ? root.setAttribute("data-theme", "dark")
      : root.removeAttribute("data-theme")
  }, [isDark])

  // Persist only the real user preference (not forced overrides)
  useEffect(() => {
    try { localStorage.setItem("bloomora-theme", userPref ? "dark" : "light") }
    catch {}
  }, [userPref])

  // On logout: clear everything and go light
  useEffect(() => {
    const handleLogout = () => {
      setUserPref(false)
      setForcedDark(null)
      try { localStorage.removeItem("bloomora-theme") } catch {}
    }
    window.addEventListener("bloomora:logout", handleLogout)
    return () => window.removeEventListener("bloomora:logout", handleLogout)
  }, [])

  // Toggle: if a force is active (e.g. admin), toggle within the forced context
  // so the button works. If no force, toggle the real user preference.
  const toggleDark = () => {
    if (forcedDark !== null) {
      setForcedDark(p => !p)
    } else {
      setUserPref(p => !p)
    }
  }

  const forceMode  = (dark) => setForcedDark(dark)
  const clearForce = () => setForcedDark(null)

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, setIsDark: setUserPref, forceMode, clearForce }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}