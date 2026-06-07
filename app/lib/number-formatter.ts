export const plnFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  maximumFractionDigits: 0,
});

export const plnCompactFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  notation: "compact",
  maximumFractionDigits: 0,
});
