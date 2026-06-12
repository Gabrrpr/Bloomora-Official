import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [rates, setRates] = useState({ PHP: 1 });
  
  // 1. Check local storage for their preferred currency, default to PHP
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem("preferred_currency") || "PHP";
  });

  // 2. Fetch live exchange rates from your new Python backend when app loads
  useEffect(() => {
    api.get("/config/exchange-rates")
      .then(res => {
        // Handle both raw axios responses or unpacked responses
        const data = res.data || res;
        if (data.success && data.rates) {
          setRates(data.rates);
        }
      })
      .catch(err => console.error("Failed to load exchange rates:", err));
  }, []);

  // 3. Whenever they change currency, remember it in their browser
  useEffect(() => {
    localStorage.setItem("preferred_currency", currency);
  }, [currency]);

  // 4. The global function that converts and formats the price
  const formatPrice = (priceInPHP) => {
    // If the API hasn't loaded yet, or rate is missing, default to 1
    const rate = rates[currency] || 1;
    const converted = priceInPHP * rate;

    // Automatically format with the correct symbol ($, £, ₱)
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