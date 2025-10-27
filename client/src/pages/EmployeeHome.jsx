import React, { useEffect, useMemo, useState } from "react";

/**
 * EmployeeDashboard.jsx
 *
 * Drop this file anywhere under your React src/ (e.g., src/pages/EmployeeDashboard.jsx)
 * and add a route like <Route path="/staff" element={<EmployeeDashboard />} />.
 *
 * Assumptions
 * - You have an authenticated employee session (e.g., via cookies/JWT).
 * - Backend exposes GET /api/employee/fines to return joined fine rows (see expected shape below).
 * - Backend exposes POST /api/items to create a new library item (scaffolded form below).
 * - Vite env variable VITE_API_BASE points at your backend origin (e.g., http://localhost:3000/api).
 */

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || ""; // e.g., http://localhost:3000/api

function formatDate(due) {
  if (!due) return "—";
  const d = new Date(due);
  if (Number.isNaN(d.getTime())) return String(due);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function EmployeeDashboard() {
  const [tab, setTab] = useState("fines"); // "fines" | "addItem"
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Employee Dashboard</h1>
          <nav className="flex gap-2">
            <button
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                tab === "fines" ? "bg-gray-900 text-white" : "bg-gray-200 hover:bg-gray-300"
              }`}
              onClick={() => setTab("fines")}
            >
              Check Fines
            </button>
            <button
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                tab === "addItem" ? "bg-gray-900 text-white" : "bg-gray-200 hover:bg-gray-300"
              }`}
              onClick={() => setTab("addItem")}
            >
              Add Item
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab === "fines" ? <FinesPanel /> : <AddItemPanel />}
      </main>
    </div>
  );
}

/** =============================
 * FINES PANEL
 * ==============================*/
function FinesPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // simple client filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(""); // "paid" | "unpaid" | "waived" | ""
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch from backend
  async function fetchFines() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      if (onlyOverdue) params.set("overdue", "1");
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const url = `${API_BASE}/employee/fines?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const msg = await safeError(res);
        throw new Error(msg || `Request failed: ${res.status}`);
      }
      /** Expected response shape (array of rows):
       * [
       *   {
       *     first_name: string,
       *     last_name: string,
       *     fine_id: number,
       *     status: "paid" | "unpaid" | "waived",
       *     loan_id: number,
       *     due_date: string | Date,
       *     title: string
       *   },
       *   ...
       * ]
       */
      const data = await res.json();
      setRows(Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load fines");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesTerm = !term
        || r.first_name?.toLowerCase().includes(term)
        || r.last_name?.toLowerCase().includes(term)
        || String(r.fine_id).includes(term)
        || String(r.loan_id).includes(term)
        || r.title?.toLowerCase().includes(term);

      const matchesStatus = !status || r.status === status;

      const overdue = r.due_date ? new Date(r.due_date) < new Date() : false;
      const matchesOverdue = !onlyOverdue || overdue;

      return matchesTerm && matchesStatus && matchesOverdue;
    });
  }, [rows, q, status, onlyOverdue]);

  return (
    <section className="space-y-4">
      <FiltersBar
        q={q}
        setQ={setQ}
        status={status}
        setStatus={setStatus}
        onlyOverdue={onlyOverdue}
        setOnlyOverdue={setOnlyOverdue}
        onSearch={() => {
          setPage(1);
          fetchFines();
        }}
      />

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
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
                <Th>Item Title</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4" colSpan={7}>Loading…</td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="p-4 text-red-600" colSpan={7}>{error}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="p-4" colSpan={7}>No results.</td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={`${r.fine_id}-${r.loan_id}`} className="border-t">
                    <Td>{r.first_name}</Td>
                    <Td>{r.last_name}</Td>
                    <Td>#{r.fine_id}</Td>
                    <Td>
                      <StatusPill status={r.status} />
                    </Td>
                    <Td>#{r.loan_id}</Td>
                    <Td>{formatDate(r.due_date)}</Td>
                    <Td className="max-w-[24ch] truncate" title={r.title}>{r.title}</Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <label className="text-gray-600">Rows per page</label>
            <select
              className="rounded border bg-white px-2 py-1"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="rounded-md bg-white px-3 py-1.5 border disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <span>
              Page <strong>{page}</strong>
            </span>
            <button
              className="rounded-md bg-white px-3 py-1.5 border disabled:opacity-50"
              onClick={() => setPage((p) => p + 1)}
              disabled={filtered.length < pageSize}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}

function StatusPill({ status }) {
  const map = {
    paid: "bg-green-100 text-green-800",
    unpaid: "bg-amber-100 text-amber-800",
    waived: "bg-blue-100 text-blue-800",
  };
  const cls = map[status] || "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current"></span>
      {String(status || "unknown").toUpperCase()}
    </span>
  );
}

function FiltersBar({ q, setQ, status, setStatus, onlyOverdue, setOnlyOverdue, onSearch }) {
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
          <option value="">Any</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="waived">Waived</option>
        </select>
      </div>

      <div className="flex items-center gap-2 mt-6">
        <input id="overdue" type="checkbox" checked={onlyOverdue} onChange={(e) => setOnlyOverdue(e.target.checked)} />
        <label htmlFor="overdue" className="text-sm">Only overdue</label>
      </div>

      <button
        className="mt-6 rounded-md bg-gray-900 text-white px-4 py-2 hover:opacity-90"
        onClick={onSearch}
      >
        Refresh
      </button>
    </div>
  );
}

async function safeError(res) {
  try {
    const data = await res.json();
    return data?.error || data?.message || "";
  } catch (_) {
    return "";
  }
}

/** =============================
 * ADD-ITEM PANEL (scaffold)
 * ==============================*/
function AddItemPanel() {
  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    publication_year: "",
    category: "",
    copies_total: 1,
    shelf_location: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/items`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const msg = await safeError(res);
        throw new Error(msg || `Request failed: ${res.status}`);
      }
      setMessage("Item created ✔");
      setForm({ title: "", author: "", isbn: "", publication_year: "", category: "", copies_total: 1, shelf_location: "" });
    } catch (err) {
      setMessage(`Failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <form onSubmit={onSubmit} className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Add New Item</h2>

          <Field label="Title">
            <input className="w-full rounded-md border px-3 py-2" value={form.title} onChange={(e) => update("title", e.target.value)} required />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Author">
              <input className="w-full rounded-md border px-3 py-2" value={form.author} onChange={(e) => update("author", e.target.value)} />
            </Field>
            <Field label="ISBN">
              <input className="w-full rounded-md border px-3 py-2" value={form.isbn} onChange={(e) => update("isbn", e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Publication Year">
              <input type="number" className="w-full rounded-md border px-3 py-2" value={form.publication_year} onChange={(e) => update("publication_year", e.target.value)} />
            </Field>
            <Field label="Category">
              <input className="w-full rounded-md border px-3 py-2" value={form.category} onChange={(e) => update("category", e.target.value)} />
            </Field>
            <Field label="Copies (total)">
              <input type="number" min={1} className="w-full rounded-md border px-3 py-2" value={form.copies_total} onChange={(e) => update("copies_total", Number(e.target.value))} />
            </Field>
          </div>

          <Field label="Shelf Location">
            <input className="w-full rounded-md border px-3 py-2" value={form.shelf_location} onChange={(e) => update("shelf_location", e.target.value)} />
          </Field>

          {/* TODO: cover image upload, media type, call number, etc. */}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-gray-900 text-white px-4 py-2 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Create Item"}
            </button>
            {message && <p className={`text-sm ${message.startsWith("Failed") ? "text-red-600" : "text-green-700"}`}>{message}</p>}
          </div>
        </form>
      </div>

      <aside className="space-y-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="font-medium mb-2">API Contract (proposed)</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li><code>GET {API_BASE}/employee/fines</code> → array of rows with fields: first_name, last_name, fine_id, status, loan_id, due_date, title.</li>
            <li>Optional query params: <code>q</code>, <code>status</code>, <code>overdue=1</code>, <code>page</code>, <code>pageSize</code>.</li>
            <li><code>POST {API_BASE}/items</code> → create item with body: title, author, isbn, publication_year, category, copies_total, shelf_location.</li>
          </ul>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="font-medium mb-2">Next Steps</h3>
          <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>Wire the route: <code>/staff</code> → <code>&lt;EmployeeDashboard /&gt;</code>.</li>
            <li>Implement backend SQL join for fines (see sample below).</li>
            <li>Add server-side pagination/sorting if your fines table grows.</li>
            <li>Add optimistic updates for fine status changes (mark paid/waive) if desired.</li>
          </ol>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm text-xs text-gray-600">
          <h4 className="font-semibold mb-1">Sample SQL (backend idea)</h4>
          <pre className="whitespace-pre-wrap">
{`SELECT u.first_name, u.last_name,
       f.fine_id, f.status,
       l.loan_id, l.due_date,
       i.title
FROM FINE f
JOIN LOAN l   ON l.loan_id = f.loan_id
JOIN USER u   ON u.user_id = l.user_id
JOIN ITEM i   ON i.item_id = l.item_id
/* Optional filters */
/* WHERE (f.status = ? OR ? IS NULL) */
/*   AND (l.due_date < CURDATE()) -- overdue */
/* ORDER BY l.due_date DESC */
/* LIMIT ? OFFSET ? */`}
          </pre>
        </div>
      </aside>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
