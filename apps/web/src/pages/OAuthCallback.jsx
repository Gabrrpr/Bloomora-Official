import { useEffect } from "react"
import { useAuth } from "../context/AuthContext"

export default function OAuthCallback({ onNavigate }) {
  const { loginWithToken } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")
    if (token) {
      loginWithToken(token)
      onNavigate("home")
    } else {
      onNavigate("login")
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500 text-sm">Signing you in...</p>
    </div>
  )
}