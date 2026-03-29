export type FilterPeriod = "all" | "30d" | "month" | "year";

export function isWithinPeriod(dateValue: string | Date | null | undefined, period: FilterPeriod) {
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

  return true;
}
