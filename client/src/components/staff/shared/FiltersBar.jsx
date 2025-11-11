// FiltersBar.jsx – Shared filter bar for Fines/Loans/etc.
import React from "react";
import { STATUS_OPTIONS } from "./constants";

export default function FiltersBar({ q, setQ, status, setStatus, onlyOverdue, setOnlyOverdue }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[240px]">
        <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="Name, Fine ID, Loan ID, Title…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
        <select
          className="rounded-md border bg-white px-3 py-2"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 mt-6">
        <input id="overdue" type="checkbox" checked={onlyOverdue} onChange={(e) => setOnlyOverdue(e.target.checked)} />
        <label htmlFor="overdue" className="text-sm">Only overdue</label>
      </div>
    </div>
  );
}
