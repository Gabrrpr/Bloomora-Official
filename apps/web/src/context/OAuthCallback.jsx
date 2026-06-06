import { useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthContext";
import { API_BASE } from "../config/api";

export default function OAuthCallback({ onNavigate }) {
  const { setUserFromToken } = useAuth();
  const [status, setStatus] = useState("Authenticating...");
  const exchangeAttempted = useRef(false);

  useEffect(() => {
    if (exchangeAttempted.current) return;
    exchangeAttempted.current = true;

    const handleExchange = async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (!code) {
    onNavigate("home"); // Don't redirect to login
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/oauth/exchange?code=${code}`);
    const data = await response.json();

    if (response.ok && data.access_token) {
      await setUserFromToken(data.access_token);
      onNavigate("home");
    } else {
      // 🚀 CRITICAL: If server rejects code, do NOT redirect to login.
      // Just clear the status and stay on home.
      console.error("Auth rejected:", data.detail);
      onNavigate("home"); 
    }
  } catch (err) {
    onNavigate("home"); // Stay on home if network fails
  }
};

    handleExchange();
  }, [onNavigate, setUserFromToken]);

  return <div className="p-10 text-center">{status}</div>;
}
