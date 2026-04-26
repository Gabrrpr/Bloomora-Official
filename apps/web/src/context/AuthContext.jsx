import { createContext, useContext, useState, useEffect } from "react"
import { loginUser, googleLogin as googleLoginApi, facebookLogin as facebookLoginApi } from "../services/auth"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user")
    return saved ? JSON.parse(saved) : null
  })

  const login = async (email, password) => {
    try {
      const data = await loginUser(email, password)
      console.log("LOGIN DATA:", data)
      const token = data.access_token
      const profileRes = await fetch("http://localhost:8000/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!profileRes.ok) throw new Error('Failed to fetch profile: ' + profileRes.status)
      const profile = await profileRes.json()
      const userData = {
        token,
        role: profile.role,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
      }
      localStorage.setItem("access_token", token)
      localStorage.setItem("user", JSON.stringify(userData))
      setUser(userData)
      console.log("USER SET with real role:", userData)
      return { success: true, role: profile.role }
    } catch (err) {
      console.error("LOGIN ERROR:", err)
      return { success: false, error: err.message }
    }
  }

  const setUserFromToken = async (token) => {
    if (!token || token === "null" || token === "undefined") {
      localStorage.removeItem("access_token")
      localStorage.removeItem("user")
      setUser(null)
      return null
    }
    try {
      const profileRes = await fetch("http://localhost:8000/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!profileRes.ok) {
        localStorage.removeItem("access_token")
        localStorage.removeItem("user")
        setUser(null)
        return null
      }
      const profile = await profileRes.json()
      const userData = {
        token,
        role: profile.role,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
      }
      localStorage.setItem("user", JSON.stringify(userData))
      setUser(userData)
      return userData
    } catch {
      localStorage.removeItem("access_token")
      localStorage.removeItem("user")
      setUser(null)
      return null
    }
  }

  const register = async (userData) => {
    const { registerUser } = await import("../services/auth")
    return await registerUser(userData)
  }

  const logout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("user")
    setUser(null)
  }

  const googleLogin = () => googleLoginApi()
  const facebookLogin = () => facebookLoginApi()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get("token")
    const urlRole = params.get("role")
    console.log("[AuthContext] OAuth redirect check — token in URL:", !!urlToken, "role:", urlRole)

    if (urlToken) {
      localStorage.setItem("access_token", urlToken)
      if (urlRole) localStorage.setItem("role", urlRole)
      console.log("[AuthContext] Storing OAuth token, calling setUserFromToken...")
      setUserFromToken(urlToken).then(result => {
        console.log("[AuthContext] setUserFromToken result:", result)
      })
      window.history.replaceState({}, document.title, window.location.pathname)
    } else {
      const existingToken = localStorage.getItem("access_token")
      const existingUser = localStorage.getItem("user")
      console.log("[AuthContext] No URL token. existingToken:", !!existingToken, "existingUser:", !!existingUser)
      if (existingToken && !existingUser) {
        console.log("[AuthContext] Restoring session from stored token...")
        setUserFromToken(existingToken).then(result => {
          console.log("[AuthContext] setUserFromToken result:", result)
        })
      }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout, googleLogin, facebookLogin, setUserFromToken }}>
      {children}
    </AuthContext.Provider>
  )
}
export function useAuth() {
  return useContext(AuthContext)
}
