// FinesPanel.jsx – Fines management for staff dashboard
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Th, Td, StatusPill } from "./shared/CommonComponents";
import FiltersBar from "./shared/FiltersBar";
import { formatDate } from "../../utils";

export default function FinesPanel({ api }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState("active");
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(handle);
  }, [query]);

  const fetchFines = useCallback(
    async (signal) => {
      if (!api) return;
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (debouncedQuery) params.set("q", debouncedQuery);
        if (status) params.set("status", status);
        params.set("pageSize", "200");

        const qs = params.toString();
        const data = await api(`staff/fines${qs ? `?${qs}` : ""}`, { signal });
        const list = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : [];
        setRows(list);
      } catch (err) {
        if (signal?.aborted) return;
        setError(err.message || "Failed to load fines");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [api, debouncedQuery, status]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchFines(controller.signal);
    return () => controller.abort();
  }, [fetchFines]);

  const filtered = useMemo(() => {
    const term = debouncedQuery.toLowerCase();
    return rows.filter((r) => {
      const matchesTerm =
        !term ||
        r.first_name?.toLowerCase().includes(term) ||
        r.last_name?.toLowerCase().includes(term) ||
        String(r.fine_id).includes(term) ||
        String(r.loan_id).includes(term) ||
        r.title?.toLowerCase().includes(term);

      const overdue = r.due_date ? new Date(r.due_date) < new Date() : false;
      const matchesOverdue = !onlyOverdue || overdue;

      return matchesTerm && matchesOverdue;
    });
  }, [rows, debouncedQuery, onlyOverdue]);

  const activeCount = useMemo(
    () =>
      rows.filter(
        (r) => !["paid", "waived"].includes(String(r.status || "").toLowerCase())
      ).length,
    [rows]
  );

  return (
    <section className="space-y-4">
      <FiltersBar
        q={query}
        setQ={setQuery}
        status={status}
        setStatus={setStatus}
        onlyOverdue={onlyOverdue}
        setOnlyOverdue={setOnlyOverdue}
      />

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b bg-gray-50 px-5 py-3 text-sm">
          <span className="font-medium text-gray-700">
            Showing {filtered.length} of {rows.length} results
          </span>
          <span className="text-gray-500">Active fines: {activeCount}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <Th>First</Th>
                <Th>Last</Th>
                <Th>Fine ID</Th>
                <Th>Status</Th>
                <Th>Loan ID</Th>
                <Th>Due Date</Th>
                <Th>Days Overdue</Th>
                <Th className="hidden md:table-cell">Returned?</Th>
                <Th>Assessed amount</Th>
                <Th className="hidden md:table-cell">Estimated now</Th>
                <Th>Item Title</Th>
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="p-4" colSpan={9}>
                    No fines match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const assessedRaw =
                    r.amount_assessed != null
                      ? Number(r.amount_assessed)
                      : r.current_fine != null
                      ? Number(r.current_fine)
                      : null;
                  const estRaw =
                    r.dynamic_est_fine != null
                      ? Number(r.dynamic_est_fine)
                      : assessedRaw;
                  const assessedDisplay =
                    assessedRaw != null ? `$${assessedRaw.toFixed(2)}` : "—";
                  const estDisplay =
                    estRaw != null ? `$${estRaw.toFixed(2)}` : "—";
                  const daysOverdue = r.days_overdue != null ? r.days_overdue : 
                    (r.due_date ? Math.max(0, Math.floor((new Date() - new Date(r.due_date)) / 86400000)) : '—');
                  
                  return (
                    <tr key={`${r.fine_id}-${r.loan_id}`} className="border-t">
                      <Td>{r.first_name}</Td>
                      <Td>{r.last_name}</Td>
                      <Td>#{r.fine_id}</Td>
                      <Td>
                        <StatusPill status={r.status} />
                      </Td>
                      <Td>#{r.loan_id}</Td>
                      <Td>{formatDate(r.due_date)}</Td>
                      <Td>{daysOverdue}</Td>
                      <Td className="hidden md:table-cell text-gray-500">
                        {Number(r.copy_returned) ? "Yes" : "No"}
                      </Td>
                      <Td>{assessedDisplay}</Td>
                      <Td className="hidden md:table-cell text-gray-500">
                        {estDisplay}
                      </Td>
                      <Td className="max-w-[24ch] truncate" title={r.title}>
                        {r.title}
                      </Td>
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
