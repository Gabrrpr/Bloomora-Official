import { useEffect, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { api } from "../services/api.js" // Ensure this path matches your folder structure

export default function OAuthCallback({ onNavigate }) {
  const { loginWithToken } = useAuth()
  const hasFetched = useRef(false) // Prevents React StrictMode double-firing

  useEffect(() => {
    // If we already sent the request, don't send it again
    if (hasFetched.current) return;

    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    const error = params.get("error")

    if (error) {
      console.error("OAuth login failed:", error)
      onNavigate("login")
      return
    }

    if (code) {
      hasFetched.current = true;

      // Send the secure code to the backend to get the real JWT token
      api.exchangeOAuthCode(code)
        .then((data) => {
          // Success! Pass the real token to your existing auth function
          loginWithToken(data.access_token)

          // Note: If loginWithToken doesn't auto-redirect or refresh the page, 
          // you may need to add window.location.href = '/' here.
        })
        .catch((err) => {
          console.error("Token exchange failed:", err)
          onNavigate("login")
        })
    } else {
      onNavigate("login")
    }
  }, [loginWithToken, onNavigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      <p className="text-gray-600 text-sm font-medium">Securing your connection...</p>
    </div>
  )
}