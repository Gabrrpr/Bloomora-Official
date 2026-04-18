import { createContext, useContext, useState, useEffect } from "react"
import { loginUser, registerUser, googleLogin as googleLoginService, facebookLogin as facebookLoginService } from '../services/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      // Decode token to get user info or validate
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (username, password) => {
    try {
      const data = await loginUser(username, password)
      localStorage.setItem('token', data.access_token)
      setToken(data.access_token)
      // TODO: Fetch user info with token
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const register = async (userData) => {
    try {
      const data = await registerUser(userData)
      // Auto login after register? Or direct to login
      return { success: true, userId: data.user_id }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const googleLogin = () => googleLoginService()
  const facebookLogin = () => facebookLoginService()

  if (loading) return <div>Loading...</div>

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, googleLogin, facebookLogin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
