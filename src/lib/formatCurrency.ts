/** Formats whole rupees as "Rs. 1,250". Locale-independent so server and client always agree. */
export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  const grouped = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}Rs. ${grouped}`;
}
