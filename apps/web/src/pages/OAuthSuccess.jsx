import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export default function OAuthSuccess() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")
    const role = params.get("role")

    if (token) {
      localStorage.setItem("access_token", token)
      localStorage.setItem("role", role)
      // Redirect based on role
      if (role === "admin" || role === "staff") {
        navigate("/admin/dashboard")
      } else {
        navigate("/") // landing page
      }
    } else {
      navigate("/login")
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Signing you in...</p>
    </div>
  )
}