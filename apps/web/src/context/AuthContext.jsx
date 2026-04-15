import { createContext, useContext, useState } from "react"

const AuthContext = createContext(null)

// Hardcoded users for testing
export const HARDCODED_USERS = [
  {
    id: 1,
    email: "customer@bloomora.com",
    password: "Customer@123",
    firstName: "Jane",
    middleName: "",
    lastName: "Doe",
    role: "customer",
  },
  {
    id: 2,
    email: "admin@bloomora.com",
    password: "Admin@123",
    firstName: "Admin",
    middleName: "",
    lastName: "User",
    role: "admin",
  },
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const login = (email, password) => {
    const found = HARDCODED_USERS.find(
      (u) => u.email === email && u.password === password
    )
    if (found) {
      setUser(found)
      return { success: true, role: found.role }
    }
    return { success: false }
  }

  const register = (userData) => {
    const newUser = { ...userData, id: Date.now(), role: "customer" }
    HARDCODED_USERS.push(newUser)
    setUser(newUser)
    return { success: true }
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
