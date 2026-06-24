import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

const CurrencyContext = createContext(null);

const userCurrencyKey = (user) => {
  const identity = user?.email || user?.id;
  return identity ? `preferred_currency:${String(identity).toLowerCase()}` : null;
};

export function CurrencyProvider({ children }) {
  const [rates, setRates] = useState({ PHP: 1 });
  const auth = useAuth?.() || {};
  const user = auth.user || null;

  const [currency, setCurrency] = useState(() => {
    return "PHP";
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
    if (typeof window === "undefined") return;
    const key = userCurrencyKey(user);
    if (key) localStorage.setItem(key, currency);
    localStorage.removeItem("preferredCurrency");
    if (!key) localStorage.removeItem("preferred_currency");
  }, [currency, user]);

  useEffect(() => {
    if (!user) {
      setCurrency("PHP");
      return;
    }
    const key = userCurrencyKey(user);
    const stored = key ? localStorage.getItem(key) : null;
    const legacy = localStorage.getItem("preferred_currency");
    const next = user.preferredCurrency || stored || legacy || "PHP";
    setCurrency(next);
    if (key && legacy && !stored) localStorage.setItem(key, legacy);
    localStorage.removeItem("preferred_currency");
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
