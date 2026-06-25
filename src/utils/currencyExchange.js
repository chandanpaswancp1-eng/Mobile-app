// Utilities for currency conversion
// Uses open.er-api.com for live rates, with static fallbacks

const STATIC_RATES_USD_BASE = {
  "USD": 1,
  "AED": 3.67,
  "EUR": 0.92,
  "GBP": 0.79,
  "INR": 83.30,
  "NPR": 133.30, // Pegged to INR at 1.6
  "JPY": 151.20,
  "CAD": 1.36,
  "AUD": 1.52
};

export async function fetchExchangeRates() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    return data.rates;
  } catch (error) {
    console.error("Failed to fetch live exchange rates, using static fallbacks.", error);
    return STATIC_RATES_USD_BASE;
  }
}

/**
 * Converts an amount from one currency to another using USD-based rates.
 */
export function convertCurrency(amount, fromCode, toCode, rates) {
  if (!rates) return amount;
  if (fromCode === toCode) return amount;
  
  const fromRate = rates[fromCode];
  const toRate = rates[toCode];
  
  if (!fromRate || !toRate) return amount;
  
  // Convert from -> USD -> to
  const amountInUSD = amount / fromRate;
  const converted = amountInUSD * toRate;
  
  return converted;
}
