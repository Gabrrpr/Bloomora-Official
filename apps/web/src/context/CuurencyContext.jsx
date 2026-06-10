import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children, userProfile }) {
  const [rates, setRates] = useState({ PHP: 1 });
  const [currency, setCurrency] = useState("PHP");

  // Sync state with logged-in user preference
  useEffect(() => {
    if (userProfile?.preferred_currency) {
      setCurrency(userProfile.preferred_currency);
    }
  }, [userProfile]);

  // Load live rates from your new FastAPI endpoint on boot
  useEffect(() => {
    api.get("/config/exchange-rates")
      .then(res => {
        if (res.success && res.rates) setRates(res.rates);
      })
      .catch(err => console.error("Failed to load exchange rates:", err));
  }, []);

  // Simple global conversion formatter
  const formatPrice = (priceInPHP) => {
    const rate = rates[currency] || 1;
    const converted = priceInPHP * rate;

    return new Intl.NumberFormat(currency === "PHP" ? "en-PH" : "en-US", {
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

// Backward-compatible alias for components that import the correct spelling
export const CurrencyContextAlias = CurrencyContext;
