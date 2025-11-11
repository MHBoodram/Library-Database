// ActiveLoansPanel.jsx – Active loans management for staff dashboard
import React, { useCallback, useEffect, useState } from "react";
import { Th, Td } from "./shared/CommonComponents";
import { formatDate } from "../../utils";

export default function ActiveLoansPanel({ api }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(handle);
  }, [query]);

  const fetchLoans = useCallback(
    async (signal) => {
      if (!api) return;
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (debouncedQuery) params.set("q", debouncedQuery);
        const qs = params.toString();
        const data = await api(`staff/loans/active${qs ? `?${qs}` : ""}`, { signal });
        const list = Array.isArray(data?.rows)
          ? data.rows
          : Array.isArray(data)
          ? data
          : [];
        setRows(list);
      } catch (err) {
        if (signal?.aborted) return;
        setError(err.message || "Failed to load active loans");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [api, debouncedQuery]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchLoans(controller.signal);
    return () => controller.abort();
  }, [fetchLoans, refreshTick]);

  const handleRefresh = () => setRefreshTick((n) => n + 1);
  const total = rows.length;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Name, email, item, loan #, copy #"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Matches borrower names, emails, item titles, loan IDs, or copy IDs.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center justify-center rounded-md btn-primary px-4 py-2 text-sm font-medium disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b bg-gray-50 px-5 py-3 text-sm">
          <span className="font-medium text-gray-700">Active loans: {total}</span>
          {debouncedQuery && <span className="text-gray-500">Filtered by "{debouncedQuery}"</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <Th>Patron ID</Th>
                <Th>Borrower</Th>
                <Th>Email</Th>
                <Th>Item Title</Th>
                <Th>Copy ID</Th>
                <Th>Loan ID</Th>
                <Th>Due Date</Th>
                <Th>Status</Th>
                <Th>Checked Out By</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4" colSpan={9}>
                    Loading…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="p-4 text-red-600" colSpan={9}>
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="p-4" colSpan={9}>
                    No active loans found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const borrower = [r.user_first_name, r.user_last_name].filter(Boolean).join(" ").trim();
                  const staff = [r.employee_first_name, r.employee_last_name].filter(Boolean).join(" ").trim();
                  return (
                    <tr key={r.loan_id} className="border-t">
                      <Td>{r.user_id ? `#${r.user_id}` : "—"}</Td>
                      <Td>{borrower || "—"}</Td>
                      <Td>{r.user_email || "—"}</Td>
                      <Td className="max-w-[24ch] truncate" title={r.item_title}>
                        {r.item_title || "—"}
                      </Td>
                      <Td>{r.copy_id ? `#${r.copy_id}` : "—"}</Td>
                      <Td>#{r.loan_id}</Td>
                      <Td>{formatDate(r.due_date)}</Td>
                      <Td>{(r.status || "").toUpperCase()}</Td>
                      <Td>{staff || "—"}</Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
