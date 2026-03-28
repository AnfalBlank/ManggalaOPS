export function parseMoneyInput(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;

  const normalized = String(value).replace(/[^\d]/g, "");
  if (!normalized) return 0;

  return Number(normalized);
}

export function formatMoneyInput(value: string | number | null | undefined) {
  const amount = parseMoneyInput(value);
  if (!amount) return "";

  return new Intl.NumberFormat("id-ID").format(amount);
}
