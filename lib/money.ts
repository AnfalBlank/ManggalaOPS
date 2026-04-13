export function parseMoneyInput(value: string | number | null | undefined, isIdrFormat = false): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;

  const str = String(value);

  // If it's explicitly an IDR formatted string from user input (e.g., "1.000.000,50")
  if (isIdrFormat || str.includes(',')) {
    const normalized = str
      .replace(/Rp\s?/g, "") // Remove Rp symbol if exists
      .replace(/\./g, "")    // Remove thousand separators
      .replace(/,/g, ".")    // Convert comma to dot for valid JS float
      .replace(/[^\d.-]/g, ""); // Keep only digits, dot, and minus
      
    const num = Number(normalized);
    return Number.isNaN(num) ? 0 : num;
  }

  // If it's a raw numeric string from DB (e.g. "1000.50" or "1000")
  const normalizedRaw = str.replace(/[^\d.-]/g, "");
  const numRaw = Number(normalizedRaw);
  return Number.isNaN(numRaw) ? 0 : numRaw;
}

export function formatMoneyInput(value: string | number | null | undefined): string {
  const amount = parseMoneyInput(value, false);
  if (!amount && amount !== 0) return "";

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 3,
  }).format(amount);
}
