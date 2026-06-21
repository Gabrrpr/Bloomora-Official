import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, googleLogin as googleLoginApi, facebookLogin as facebookLoginApi } from "../services/auth";
import { API_BASE } from "../config/api";
import { syncGuestCartToAccount } from "../utils/cart.js";

const AuthContext = createContext(null);
const isPreview = new URLSearchParams(window.location.search).get("preview") === "true";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setUserFromToken = async (token) => {
    // We do NOT set loading(true) here because initialization handles it
    if (!token || token === "null" || token === "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      setUser(null);
      return null;
    }

    try {
      const profileRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!profileRes.ok) throw new Error("Auth failed");
      
      const profile = await profileRes.json();
      const userData = {
        token,
        role: profile.role,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        phoneNumber: profile.phone_number,
        address: profile.address,
        is_profile_complete: profile.is_profile_complete,
        profilePictureUrl: profile.profile_picture_url,
      };
      
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      await syncGuestCartToAccount();
      return userData;
    } catch (err) {
      console.error("Auth Fetch Error:", err);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true); // Start loading
      
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get("token");
      const existingToken = localStorage.getItem("access_token");

      if (urlToken) {
        localStorage.setItem("access_token", urlToken);
        const userData = await setUserFromToken(urlToken);
        if (!isPreview && userData && !userData.is_profile_complete) {
            window.location.replace("/profile");
        }
        // Cleanup URL
        const remaining = new URLSearchParams(window.location.search);
        remaining.delete("token");
        window.history.replaceState({}, document.title, window.location.pathname + "?" + remaining.toString());
      } else if (existingToken) {
        await setUserFromToken(existingToken);
      }
      
      setLoading(false); // ALWAYS stop loading, no matter what happens above
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await loginUser(email, password);
      localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
      const userData = await setUserFromToken(data.access_token);
      return { success: true, role: userData?.role };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, googleLogin: googleLoginApi, facebookLogin: facebookLoginApi, setUserFromToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
