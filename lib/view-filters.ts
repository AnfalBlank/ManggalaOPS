export type FilterPeriod = "all" | "30d" | "month" | "year" | "custom";

export type CustomRange = { start?: string | null; end?: string | null };

export function isWithinPeriod(
  dateValue: string | Date | null | undefined,
  period: FilterPeriod,
  customRange?: CustomRange,
) {
  if (period === "all") return true;
  if (!dateValue) return false;

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();

  if (period === "30d") {
    const start = new Date(now);
    start.setDate(now.getDate() - 30);
    return date >= start && date <= now;
  }

  if (period === "month") {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  if (period === "year") {
    return date.getFullYear() === now.getFullYear();
  }

  if (period === "custom") {
    const startStr = customRange?.start;
    const endStr = customRange?.end;
    if (startStr) {
      const start = new Date(`${startStr}T00:00:00`);
      if (!Number.isNaN(start.getTime()) && date < start) return false;
    }
    if (endStr) {
      const end = new Date(`${endStr}T23:59:59.999`);
      if (!Number.isNaN(end.getTime()) && date > end) return false;
    }
    return true;
  }

  return true;
}
