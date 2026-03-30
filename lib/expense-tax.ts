export type ExpenseTaxMode = "none" | "exclude" | "include";

export function normalizeExpenseTaxMode(value: unknown): ExpenseTaxMode {
  return value === "exclude" || value === "include" ? value : "none";
}

export function normalizeExpenseTaxPercent(value: unknown, fallback = 11) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

export function computeExpenseTax(amount: number, taxMode: ExpenseTaxMode, taxPercent: number) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const safePercent = Number.isFinite(taxPercent) && taxPercent >= 0 ? taxPercent : 0;

  if (taxMode === "none" || safeAmount <= 0 || safePercent <= 0) {
    return {
      amount: safeAmount,
      baseAmount: safeAmount,
      taxAmount: 0,
      totalAmount: safeAmount,
    };
  }

  if (taxMode === "exclude") {
    const taxAmount = Math.round((safeAmount * safePercent) / 100);
    return {
      amount: safeAmount + taxAmount,
      baseAmount: safeAmount,
      taxAmount,
      totalAmount: safeAmount + taxAmount,
    };
  }

  const baseAmount = Math.round((safeAmount / (1 + safePercent / 100)) * 100) / 100;
  const taxAmount = Math.round((safeAmount - baseAmount) * 100) / 100;
  return {
    amount: safeAmount,
    baseAmount,
    taxAmount,
    totalAmount: safeAmount,
  };
}
