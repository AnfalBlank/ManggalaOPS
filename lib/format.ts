export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDocumentNumber = (prefix: string, id: number) => {
  return `${prefix}-${String(id).padStart(4, "0")}`;
};
