import React, { useEffect, useMemo, useState } from "react";
import { Th, Td } from "./shared/CommonComponents";
import { formatDateTime } from "../../utils";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "ready", label: "Ready for pickup" },
  { value: "queued", label: "Queued" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

export default function HoldsPanel({ api }) {
  const [holds, setHolds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await api("staff/holds");
        if (!alive) return;
        const rows = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : [];
        setHolds(rows);
      } catch (err) {
        if (!alive) return;
        setError(err?.data?.error || err?.message || "Failed to load holds");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [api]);

  const filtered = useMemo(() => {
    if (!filter) return holds;
    return holds.filter((h) => h.status === filter);
  }, [holds, filter]);

  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Holds Queue</h2>
          <p className="text-sm text-gray-600">Monitor patron holds and pickup windows.</p>
        </div>
        <div className="flex gap-3 items-center">
          <label className="text-sm text-gray-600">
            Status:
            <select
              className="ml-2 rounded-md border px-2 py-1 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <span className="text-sm text-gray-500">
            {loading ? "Refreshing…" : `${filtered.length}/${holds.length} shown`}
          </span>
        </div>
      </header>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <Th>Patron</Th>
              <Th>Item</Th>
              <Th>Status</Th>
              <Th>Queue</Th>
              <Th>Ready Window</Th>
              <Th>Requested</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  {loading ? "Loading holds…" : "No holds match this filter."}
                </td>
              </tr>
            ) : (
              filtered.map((hold) => (
                <tr key={hold.hold_id} className="border-t">
                  <Td>
                    <div className="font-medium">{hold.first_name} {hold.last_name}</div>
                    <div className="text-xs text-gray-500">{hold.email || `User #${hold.user_id}`}</div>
                  </Td>
                  <Td>
                    <div className="font-medium">{hold.item_title}</div>
                    <div className="text-xs text-gray-500">Item #{hold.item_id}</div>
                  </Td>
                  <Td>
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs capitalize text-gray-700">
                      {hold.status}
                    </span>
                  </Td>
                  <Td>
                    {hold.status === "queued"
                      ? (hold.queue_display_position ?? hold.queue_position ?? "-")
                      : (hold.queue_display_position ?? hold.queue_position ?? "-")}
                  </Td>
                  <Td>
                    {hold.status === "ready" ? (
                      <>
                        <div>{formatDateTime(hold.available_since)}</div>
                        <div className="text-xs text-gray-500">until {formatDateTime(hold.expires_at)}</div>
                      </>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>{formatDateTime(hold.created_at)}</Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
