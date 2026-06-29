import { useEffect, useRef, useState } from "react"
import { useAuth } from "./AuthContext"
import { API_BASE } from "../config/api"

export default function OAuthCallback({ onNavigate }) {
  const { setUserFromToken } = useAuth()
  const [status, setStatus] = useState("Authenticating...")
  const exchangeAttempted = useRef(false)

  useEffect(() => {
    if (exchangeAttempted.current) return
    exchangeAttempted.current = true

    const handleExchange = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get("code")

      if (!code) {
        setStatus("Missing authentication code.")
        onNavigate("login")
        return
      }

      try {
        const response = await fetch(`${API_BASE}/auth/oauth/exchange?code=${encodeURIComponent(code)}`)
        const data = await response.json()

        if (response.ok && data.access_token) {
          localStorage.setItem("access_token", data.access_token)
          if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token)
          const userData = await setUserFromToken(data.access_token)
          if (!userData) {
            setStatus("Social login could not be completed.")
            onNavigate("login")
            return
          }
          window.history.replaceState({}, "", "/")
          onNavigate("home")
          return
        }

        console.error("OAuth rejected:", data.detail)
        setStatus("Social login could not be completed.")
        onNavigate("login")
      } catch (err) {
        console.error("OAuth exchange failed:", err)
        setStatus("Social login could not be completed.")
        onNavigate("login")
      }
    }

    handleExchange()
  }, [onNavigate, setUserFromToken])

  return <div className="p-10 text-center">{status}</div>
}
