// Local currency configuration for the hospital management system
// Update this to match your region's currency
export const LOCAL_CURRENCY_SYMBOL = "MWK"; // Malawian Kwacha
// Examples for other regions:
// export const LOCAL_CURRENCY_SYMBOL = "UGX"; // Uganda Shilling
// export const LOCAL_CURRENCY_SYMBOL = "TZS"; // Tanzania Shilling
// export const LOCAL_CURRENCY_SYMBOL = "ZMW"; // Zambia Kwacha
// export const LOCAL_CURRENCY_SYMBOL = "GHS"; // Ghana Cedi
// export const LOCAL_CURRENCY_SYMBOL = "NGN"; // Nigeria Naira
// export const LOCAL_CURRENCY_SYMBOL = "RWF"; // Rwanda Franc

/**
 * Format a currency amount with the local currency symbol
 * @param amount - The numerical amount to format
 * @returns Formatted string with currency symbol
 */
export const formatCurrency = (amount: number | string | undefined | null): string => {
  // Safely convert any value to a number before formatting
  const numericAmount = Number(amount) || 0;
  return `${LOCAL_CURRENCY_SYMBOL} ${numericAmount.toFixed(2)}`;
};