export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const ORDER_STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"];
export const MESSAGE_STATUSES = ["Unread", "Read", "Replied"];

export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

export const formatDate = (date) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getErrorMessage = async (response) => {
  try {
    const result = await response.json();
    return result.message || "Something went wrong.";
  } catch {
    return "Something went wrong. Please try again.";
  }
};

// Avoid showing the same product options multiple times.
export const getProductOptions = (item) => {
  if (item.optionSummary) return item.optionSummary;
  if (item.variantLabel) return item.variantLabel;

  if (item.selectedOptions && typeof item.selectedOptions === "object") {
    return Object.entries(item.selectedOptions)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => {
        const label = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (letter) => letter.toUpperCase());
        const displayValue = typeof value === "object" ? JSON.stringify(value) : String(value);
        return `${label}: ${displayValue}`;
      })
      .join(" | ");
  }
  return "";
};
