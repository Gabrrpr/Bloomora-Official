import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [rates, setRates] = useState({ PHP: 1 });
  const auth = useAuth?.() || {};
  const user = auth.user || null;

  const [currency, setCurrency] = useState(() => {
    if (typeof window === "undefined") return "PHP";
    return localStorage.getItem("preferred_currency") || "PHP";
  });

  useEffect(() => {
    api.get("/config/exchange-rates")
      .then(res => {
        const data = res.data || res;
        if (data.success && data.rates) {
          setRates(data.rates);
        }
      })
      .catch(err => console.error("Failed to load exchange rates:", err));
  }, []);

  useEffect(() => {
    localStorage.setItem("preferred_currency", currency);
  }, [currency]);

  useEffect(() => {
    if (!user) {
      setCurrency("PHP");
    } else if (user.preferredCurrency) {
      setCurrency(user.preferredCurrency);
    }
  }, [user]);

  const formatPrice = (priceInPHP) => {
    const rate = rates[currency] || 1;
    const converted = priceInPHP * rate;
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency,
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
