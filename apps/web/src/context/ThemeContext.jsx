import { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext({ isDark: false, toggleDark: () => {} })

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("bloomora-theme") === "dark" }
    catch { return false }
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.setAttribute("data-theme", "dark")
    } else {
      root.removeAttribute("data-theme")
    }
    try { localStorage.setItem("bloomora-theme", isDark ? "dark" : "light") }
    catch {}
  }, [isDark])

  const toggleDark = () => setIsDark(p => !p)

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
