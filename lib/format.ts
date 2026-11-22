export const formatINR = (amount: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount || 0);

export const formatDate = (value?: string | Date | null): string => {
  if (!value) {
    return "—";
  }
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

export const statusLabel = (status: string): string => {
  switch (status) {
    case "paid":
      return "Paid";
    case "partial":
      return "Partial";
    case "overdue":
      return "Overdue";
    case "pending":
      return "Due";
    default:
      return status;
  }
};
