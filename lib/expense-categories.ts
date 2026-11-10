export const expenseCategoryOptions = [
  "Operational",
  "Project",
  "Marketing",
  "Office",
  "Transport",
  "Utilities",
  "Maintenance",
  "Other",
] as const;

// Nilai kategori di database tetap bahasa Inggris; ini cuma label tampilannya.
const LABEL_KATEGORI: Record<string, string> = {
  Operational: "Operasional",
  Project: "Proyek",
  Marketing: "Marketing",
  Office: "Kantor",
  Transport: "Transportasi",
  Utilities: "Listrik, air & internet",
  Maintenance: "Perawatan",
  Other: "Lainnya",
};

export function labelKategori(category: string | null | undefined): string {
  if (!category) return "-";
  return LABEL_KATEGORI[category] ?? category;
}

export const LABEL_MODE_PPN: Record<string, string> = {
  none: "Tanpa PPN",
  exclude: "Belum termasuk PPN",
  include: "Sudah termasuk PPN",
};
