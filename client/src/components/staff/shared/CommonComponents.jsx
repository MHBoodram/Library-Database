// Shared UI components for Staff Dashboard

export function Th({ children }) {
  return (
    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
      {children}
    </th>
  );
}

export function Td({ children, className = "", colSpan = 1 }) {
  return (
    <td colSpan={colSpan} className={`px-4 py-3 align-top ${className}`}>
      {children}
    </td>
  );
}

export function StatusPill({ status }) {
  const map = {
    paid: "bg-green-100 text-green-800",
    unpaid: "bg-amber-100 text-amber-800",
    open: "bg-amber-100 text-amber-800",
    waived: "bg-blue-100 text-blue-800",
    overdue: "bg-orange-100 text-orange-800",
  };
  const cls = map[String(status || "").toLowerCase()] || "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current"></span>
      {String(status || "unknown").toUpperCase()}
    </span>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  );
}

export function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-sm text-gray-500">{sub}</p>}
    </div>
  );
}
