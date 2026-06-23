export const formatCOP = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null) return '$0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '$0';
  const rounded = Math.round(num);
  const parts = rounded.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `$${parts.join(",")}`;
};
