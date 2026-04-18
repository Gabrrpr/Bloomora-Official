import { createContext, useContext, useState } from "react"
import { loginUser, googleLogin as googleLoginApi, facebookLogin as facebookLoginApi } from "../services/auth"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user")
    return saved ? JSON.parse(saved) : null
  })

  const login = async (username, password) => {
  try {
    const data = await loginUser(username, password)
    console.log("Login data:", data)
    
    const userData = {
      token: data.access_token,
      role: "customer",
      firstName: username,
      lastName: "",
      email: username,
    }
    localStorage.setItem("access_token", data.access_token)
    localStorage.setItem("user", JSON.stringify(userData))
    setUser(userData)
    console.log("User set:", userData)
    return { success: true, role: "customer" }
  } catch (err) {
    console.error("Login error:", err)
    return { success: false, error: err.message }
  }
}

  const setUserFromToken = async (token) => {
    try {
      const profileRes = await fetch("http://localhost:8000/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!profileRes.ok) return null
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

  return (
    <AuthContext.Provider value={{ user, login, register, logout, googleLogin, facebookLogin, setUserFromToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}