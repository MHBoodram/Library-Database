export function formatDate(due) {
  if (!due) return "—";
  const d = new Date(due);
  if (Number.isNaN(d.getTime())) return String(due);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}
