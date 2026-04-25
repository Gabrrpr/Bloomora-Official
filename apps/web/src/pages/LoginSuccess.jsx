import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function LoginSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const role = searchParams.get("role");

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      navigate(role === "admin" ? "/admin" : "/home");
    } else {
      navigate("/login");
    }
  }, [token, role, navigate]);

  return <div className="min-h-screen flex items-center justify-center">Logging you in...</div>;
}
