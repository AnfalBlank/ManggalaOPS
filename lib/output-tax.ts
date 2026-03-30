export function normalizeTaxPercent(value: unknown, fallback = 11) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

export function computeOutputTax(subtotal: number, taxPercent: number) {
  const safeSubtotal = Number.isFinite(subtotal) ? subtotal : 0;
  const safePercent = Number.isFinite(taxPercent) && taxPercent >= 0 ? taxPercent : 0;
  const tax = Math.round((safeSubtotal * safePercent) / 100);
  const total = safeSubtotal + tax;

  return {
    subtotal: safeSubtotal,
    taxPercent: safePercent,
    tax,
    total,
  };
}
