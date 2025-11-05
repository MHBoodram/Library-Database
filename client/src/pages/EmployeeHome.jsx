import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import NavBar from "../components/NavBar";
import "./EmployeeHome.css";
import { formatDate,formatDateTime } from "../utils";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || ""; // e.g., http://localhost:3000/api

const STATUS_OPTIONS = [
  { value: "active", label: "Active only" },
  { value: "all", label: "All statuses" },
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "waived", label: "Waived" },
];

export default function EmployeeDashboard() {
  const { useApi, user, logout } = useAuth();
  // obtain the api helper from context
  const apiWithAuth = useApi();
  const [tab, setTab] = useState("fines"); // "fines" | "checkout" | "activeLoans" | "reservations" | "addItem"
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ fines: 0, activeLoans: 0, reservations: 0 });
  const [countsLoading, setCountsLoading] = useState(false);
  const [countsLoaded, setCountsLoaded] = useState(false);

  useEffect(() => {
    if (!apiWithAuth || countsLoaded) return;
    
    let alive = true;
    async function loadCounts() {
      setCountsLoading(true);
      try {
        const [finesRes, loansRes, resvRes] = await Promise.all([
          apiWithAuth('staff/fines?&pageSize=1000'),
          apiWithAuth('staff/loans/active?&pageSize=1000'),
          apiWithAuth('staff/reservations?&pageSize=1000'),
        ]);
        if (!alive) return;
        const finesList = Array.isArray(finesRes?.rows) ? finesRes.rows : Array.isArray(finesRes) ? finesRes : [];
        const loansList = Array.isArray(loansRes?.rows) ? loansRes.rows : Array.isArray(loansRes) ? loansRes : [];
        const resvList = Array.isArray(resvRes?.rows) ? resvRes.rows : Array.isArray(resvRes) ? resvRes : [];
        setCounts({ fines: finesList.length, activeLoans: loansList.length, reservations: resvList.length });
        setCountsLoaded(true);
      } catch (err) {
        if (typeof console !== 'undefined') console.debug(err);
      } finally {
        if (alive) setCountsLoading(false);
      }
    }
    loadCounts();
    return () => { alive = false; };
  }, [apiWithAuth, countsLoaded]);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', paddingTop: 'var(--nav-height, 60px)' }}>
      <NavBar />
      <header className="employee-dashboard-header">
        <div className="header-inner" style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Staff Dashboard</h1>
            <div className="eh-widgets">
              <button
                type="button"
                onClick={() => setTab('fines')}
                aria-label="View fines"
              >
                <span className="emoji">💸</span>
                <div>
                  <div className="count-label">Fines</div>
                  <div className="count-num">{countsLoading ? '…' : counts.fines}</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTab('activeLoans')}
                aria-label="View active loans"
              >
                <span className="emoji">📚</span>
                <div>
                  <div className="count-label">Active Loans</div>
                  <div className="count-num">{countsLoading ? '…' : counts.activeLoans}</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTab('reservations')}
                aria-label="View reservations"
              >
                <span className="emoji">🪑</span>
                <div>
                  <div className="count-label">Reservations</div>
                  <div className="count-num">{countsLoading ? '…' : counts.reservations}</div>
                </div>
              </button>
            </div>
          </div>
          <nav className="employee-tabs">
            <button
              className={`tab-btn ${tab === "fines" ? "active" : ""}`}
              onClick={() => setTab("fines")}
            >
              Check Fines
            </button>
            <button
              className={`tab-btn ${tab === "checkout" ? "active" : ""}`}
              onClick={() => setTab("checkout")}
            >
              Checkout Loan
            </button>
            <button
              className={`tab-btn ${tab === "activeLoans" ? "active" : ""}`}
              onClick={() => setTab("activeLoans")}
            >
              Active Loans
            </button>
            <button
              className={`tab-btn ${tab === "reservations" ? "active" : ""}`}
              onClick={() => setTab("reservations")}
            >
              Room Reservations
            </button>
            <button
              className={`tab-btn ${tab === "addItem" ? "active" : ""}`}
              onClick={() => setTab("addItem")}
            >
              Add Item
            </button>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>
        {tab === "fines" && <FinesPanel api={apiWithAuth} />}
        {tab === "checkout" && <CheckoutPanel api={apiWithAuth} staffUser={user} />}
        {tab === "activeLoans" && <ActiveLoansPanel api={apiWithAuth} />}
        {tab === "reservations" && <ReservationsPanel api={apiWithAuth} staffUser={user} />}
        {tab === "addItem" && <AddItemPanel api={apiWithAuth} />}
      </main>
    </div>
  );
}

function FinesPanel({ api }) {
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
                <Th>Item Title</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4" colSpan={7}>
                    Loading…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="p-4 text-red-600" colSpan={7}>
                    {error}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="p-4" colSpan={7}>
                    No fines match your search.
                  </td>
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
                    <Td className="max-w-[24ch] truncate" title={r.title}>
                      {r.title}
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ActiveLoansPanel({ api }) {
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
          className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b bg-gray-50 px-5 py-3 text-sm">
          <span className="font-medium text-gray-700">Active loans: {total}</span>
          {debouncedQuery && <span className="text-gray-500">Filtered by “{debouncedQuery}”</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
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
                  <td className="p-4" colSpan={8}>
                    Loading…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="p-4 text-red-600" colSpan={8}>
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="p-4" colSpan={8}>
                    No active loans found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const borrower = [r.user_first_name, r.user_last_name].filter(Boolean).join(" ").trim();
                  const staff = [r.employee_first_name, r.employee_last_name].filter(Boolean).join(" ").trim();
                  return (
                    <tr key={r.loan_id} className="border-t">
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

function CheckoutPanel({ api, staffUser }) {
  const [form, setForm] = useState({ user_id: "", copy_value: "", mode: "copy_id" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const user_id = Number(form.user_id);
      const copyValue = (form.copy_value || "").trim();
      const mode = form.mode === "barcode" ? "barcode" : "copy_id";
      if (!user_id) {
        throw new Error("Patron ID is required.");
      }
      if (!copyValue) {
        throw new Error(`Enter a ${mode === "barcode" ? "barcode" : "copy ID"}.`);
      }

      const body = {
        user_id,
        identifier_type: mode,
        ...(mode === "copy_id"
          ? { copy_id: Number(copyValue) }
          : { barcode: copyValue }),
        ...(staffUser?.employee_id ? { employee_id: staffUser.employee_id } : {}),
      };
      await api("loans/checkout", { method: "POST", body });
      const label =
        mode === "copy_id"
          ? `copy #${body.copy_id}`
          : `barcode ${copyValue}`;
      setMessage(`Checked out ${label} to user #${user_id}.`);
      setForm({ user_id: "", copy_value: "", mode });
    } catch (err) {
      const code = err?.data?.error;
      const serverMessage = err?.data?.message;
      if (code === "loan_limit_exceeded") {
        setError(serverMessage || "The patron has reached their loan limit.");
      } else if (code === "copy_not_available") {
        setError(serverMessage || "That copy is not available for checkout.");
      } else if (code === "copy_not_found") {
        setError(serverMessage || "Copy not found.");
      } else if (code === "user_not_found") {
        setError(serverMessage || "User not found.");
      } else if (err?.message) {
        setError(serverMessage || err.message);
      } else {
        setError("Checkout failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <form onSubmit={onSubmit} className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Checkout Item</h2>
          <p className="text-sm text-gray-600">
            Scan or enter a patron ID and copy barcode.
          </p>
        </div>

        <Field label="Patron ID">
          <input
            className="w-full rounded-md border px-3 py-2"
            value={form.user_id}
            onChange={(e) => update("user_id", e.target.value)}
            placeholder="e.g., 123"
          />
        </Field>

        <div className="space-y-2">
          <span className="block text-xs font-medium text-gray-600">Checkout By</span>
          <div className="flex items-center gap-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="checkout-mode"
                value="copy_id"
                checked={form.mode === "copy_id"}
                onChange={(e) => update("mode", e.target.value)}
              />
              Copy ID
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="checkout-mode"
                value="barcode"
                checked={form.mode === "barcode"}
                onChange={(e) => update("mode", e.target.value)}
              />
              Barcode
            </label>
          </div>
        </div>

        <Field label={form.mode === "barcode" ? "Barcode" : "Copy ID"}>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={form.copy_value}
            onChange={(e) => update("copy_value", e.target.value)}
            placeholder={form.mode === "barcode" ? "e.g., BC-000123" : "e.g., 456"}
          />
        </Field>

        {error && (
          <div className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-md bg-green-100 px-3 py-2 text-sm text-green-700">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-gray-900 text-white px-4 py-2 disabled:opacity-50"
        >
          {submitting ? "Processing…" : "Checkout"}
        </button>
      </form>

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

function FiltersBar({ q, setQ, status, setStatus, onlyOverdue, setOnlyOverdue }) {
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

async function safeError(res) {
  try {
    const data = await res.json();
    return data?.error || data?.message || "";
  } catch (e) {
    // best-effort: log then return empty message
    if (typeof console !== "undefined" && console.debug) console.debug('safeError parse error', e);
    return "";
  }
}

function AddItemPanel({ api }) {
  const [form, setForm] = useState({
    title: "",
    subject: "",
    classification: "",
    item_type: "general",
    isbn: "",
    publisher: "",
    publication_year: "",
    model: "",
    manufacturer: "",
    media_type: "DVD",
    length_minutes: "",
  });
  const [copies, setCopies] = useState([{ barcode: "", shelf_location: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateCopy(index, field, value) {
    setCopies((list) =>
      list.map((copy, i) => (i === index ? { ...copy, [field]: value } : copy))
    );
  }

  function addCopyRow() {
    setCopies((list) => [...list, { barcode: "", shelf_location: "" }]);
  }

  function removeCopyRow(index) {
    setCopies((list) => (list.length <= 1 ? list : list.filter((_, i) => i !== index)));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const title = form.title.trim();
      if (!title) {
        throw new Error("Title is required");
      }

      const itemPayload = {
        title,
        subject: form.subject.trim() || undefined,
        classification: form.classification.trim() || undefined,
      };

      const itemType = form.item_type;
      if (itemType && itemType !== "general") {
        itemPayload.item_type = itemType;
        if (itemType === "book") {
          if (form.isbn.trim()) itemPayload.isbn = form.isbn.trim();
          if (form.publisher.trim()) itemPayload.publisher = form.publisher.trim();
          if (form.publication_year.trim()) itemPayload.publication_year = form.publication_year.trim();
        } else if (itemType === "device") {
          if (form.model.trim()) itemPayload.model = form.model.trim();
          if (form.manufacturer.trim()) itemPayload.manufacturer = form.manufacturer.trim();
        } else if (itemType === "media") {
          if (form.publisher.trim()) itemPayload.publisher = form.publisher.trim();
          if (form.publication_year.trim()) itemPayload.publication_year = form.publication_year.trim();
          if (form.length_minutes.trim()) itemPayload.length_minutes = form.length_minutes.trim();
          if (form.media_type) itemPayload.media_type = form.media_type;
        }
      }

      let itemResponse;
      if (api) {
        itemResponse = await api("items", {
          method: "POST",
          body: itemPayload,
        });
      } else {
        const res = await fetch(`${API_BASE}/items`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemPayload),
        });
        if (!res.ok) {
          const msg = await safeError(res);
          throw new Error(msg || `Request failed: ${res.status}`);
        }
        itemResponse = await res.json();
      }

      const item_id = itemResponse?.item_id;
      const copyPayloads = copies
        .map((copy) => ({
          barcode: copy.barcode.trim(),
          shelf_location: copy.shelf_location.trim(),
        }))
        .filter((copy) => copy.barcode);

      let createdCopies = 0;
      if (item_id && copyPayloads.length) {
        for (const copy of copyPayloads) {
          const body = {
            item_id,
            barcode: copy.barcode,
            shelf_location: copy.shelf_location || undefined,
          };
          if (api) {
            await api("copies", { method: "POST", body });
          } else {
            const res = await fetch(`${API_BASE}/copies`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            if (!res.ok) {
              const msg = await safeError(res);
              throw new Error(msg || `Copy creation failed (${res.status})`);
            }
          }
          createdCopies += 1;
        }
      }

      setMessage(
        `Item created${createdCopies ? ` with ${createdCopies} ${createdCopies === 1 ? "copy" : "copies"}` : ""} ✅`
      );
      setForm({
        title: "",
        subject: "",
        classification: "",
        item_type: "general",
        isbn: "",
        publisher: "",
        publication_year: "",
        model: "",
        manufacturer: "",
        media_type: "DVD",
        length_minutes: "",
      });
      setCopies([{ barcode: "", shelf_location: "" }]);
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

          <Field label="Subject">
            <input className="w-full rounded-md border px-3 py-2" value={form.subject} onChange={(e) => update("subject", e.target.value)} placeholder="e.g., Literature" />
          </Field>

          <Field label="Classification / Call Number">
            <input className="w-full rounded-md border px-3 py-2" value={form.classification} onChange={(e) => update("classification", e.target.value)} placeholder="e.g., 813.52 FIT" />
          </Field>

          <Field label="Item Type">
            <select
              className="w-full rounded-md border px-3 py-2 bg-white"
              value={form.item_type}
              onChange={(e) => update("item_type", e.target.value)}
            >
              <option value="general">General item (no subtype)</option>
              <option value="book">Book</option>
              <option value="device">Device</option>
              <option value="media">Media</option>
            </select>
          </Field>

          {form.item_type === "book" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="ISBN">
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={form.isbn}
                  onChange={(e) => update("isbn", e.target.value)}
                  placeholder="e.g., 9780142407332"
                />
              </Field>
              <Field label="Publisher">
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={form.publisher}
                  onChange={(e) => update("publisher", e.target.value)}
                  placeholder="e.g., Penguin"
                />
              </Field>
              <Field label="Publication Year">
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-md border px-3 py-2"
                  value={form.publication_year}
                  onChange={(e) => update("publication_year", e.target.value)}
                  placeholder="e.g., 2006"
                />
              </Field>
            </div>
          )}

          {form.item_type === "device" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Model">
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={form.model}
                  onChange={(e) => update("model", e.target.value)}
                  placeholder="e.g., iPad 10th Gen"
                />
              </Field>
              <Field label="Manufacturer">
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={form.manufacturer}
                  onChange={(e) => update("manufacturer", e.target.value)}
                  placeholder="e.g., Apple"
                />
              </Field>
            </div>
          )}

          {form.item_type === "media" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Field label="Media Format">
                <select
                  className="w-full rounded-md border px-3 py-2 bg-white"
                  value={form.media_type}
                  onChange={(e) => update("media_type", e.target.value)}
                >
                  <option value="DVD">DVD</option>
                  <option value="Blu-ray">Blu-ray</option>
                  <option value="CD">CD</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field label="Run Time (minutes)">
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-md border px-3 py-2"
                  value={form.length_minutes}
                  onChange={(e) => update("length_minutes", e.target.value)}
                  placeholder="e.g., 120"
                />
              </Field>
              <Field label="Publisher">
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={form.publisher}
                  onChange={(e) => update("publisher", e.target.value)}
                  placeholder="e.g., Paramount"
                />
              </Field>
              <Field label="Release Year">
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-md border px-3 py-2"
                  value={form.publication_year}
                  onChange={(e) => update("publication_year", e.target.value)}
                  placeholder="e.g., 2023"
                />
              </Field>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Copies</h3>
            <p className="text-xs text-gray-500">
              Provide at least one barcode if you want to create physical copies now. Leave additional rows blank to skip.
            </p>

            {copies.map((copy, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-3 items-end">
                <Field label={`Barcode ${copies.length > 1 ? `#${index + 1}` : ""}`}>
                  <input
                    className="w-full rounded-md border px-3 py-2"
                    value={copy.barcode}
                    onChange={(e) => updateCopy(index, "barcode", e.target.value)}
                    placeholder="e.g., BC-000123"
                  />
                </Field>
                <Field label="Shelf Location">
                  <input
                    className="w-full rounded-md border px-3 py-2"
                    value={copy.shelf_location}
                    onChange={(e) => updateCopy(index, "shelf_location", e.target.value)}
                    placeholder="Stacks A3"
                  />
                </Field>
                <div className="pb-2">
                  {copies.length > 1 && (
                    <button
                      type="button"
                      className="mt-6 text-xs text-red-600 hover:underline"
                      onClick={() => removeCopyRow(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              className="text-xs font-medium text-gray-700 hover:underline"
              onClick={addCopyRow}
            >
              + Add another copy
            </button>
          </div>

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


function ReservationsPanel({ api, staffUser }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ user_id: "", room_id: "", start_time: "", end_time: "" });
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [roomForm, setRoomForm] = useState({ room_number: "", capacity: "", features: "" });
  const [roomMessage, setRoomMessage] = useState("");
  const [roomError, setRoomError] = useState("");
  const [refreshFlag, setRefreshFlag] = useState(0);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api("staff/reservations");
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load reservations");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations, refreshFlag]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    setSubmitMessage("");
    try {
      const payload = {
        user_id: Number(form.user_id),
        room_id: Number(form.room_id),
        start_time: form.start_time,
        end_time: form.end_time,
        employee_id: staffUser?.employee_id,
      };
      await api("staff/reservations", { method: "POST", body: payload });
      setSubmitMessage("Reservation created successfully.");
      setForm({ user_id: "", room_id: "", start_time: "", end_time: "" });
      setRefreshFlag((f) => f + 1);
    } catch (err) {
      const code = err?.data?.error;
      const msg = err?.data?.message || err.message;
      if (code === "reservation_conflict") {
        setSubmitError(msg || "That room is already booked for the selected time.");
      } else if (code === "invalid_payload" || code === "invalid_timespan") {
        setSubmitError(msg || "Please check the form inputs.");
      } else {
        setSubmitError(msg || "Failed to create reservation.");
      }
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Create Room Reservation</h2>
        <p className="text-sm text-gray-600 mb-4">
          Submitting overlapping times for the same room will surface the <code>prevent_overlap</code> trigger as a conflict.
        </p>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Patron ID">
            <input
              className="w-full rounded-md border px-3 py-2"
              value={form.user_id}
              onChange={(e) => update("user_id", e.target.value)}
              placeholder="e.g., 15"
              required
            />
          </Field>
          <Field label="Room ID">
            <input
              className="w-full rounded-md border px-3 py-2"
              value={form.room_id}
              onChange={(e) => update("room_id", e.target.value)}
              placeholder="e.g., 2"
              required
            />
          </Field>
          <Field label="Start Time">
            <input
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2"
              value={form.start_time}
              onChange={(e) => update("start_time", e.target.value)}
              required
            />
          </Field>
          <Field label="End Time">
            <input
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2"
              value={form.end_time}
              onChange={(e) => update("end_time", e.target.value)}
              required
            />
          </Field>
          <div className="md:col-span-2 flex items-center gap-3">
            <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2 disabled:opacity-50">
              Create Reservation
            </button>
            {submitMessage && <span className="text-sm text-green-700">{submitMessage}</span>}
            {submitError && <span className="text-sm text-red-600">{submitError}</span>}
          </div>
        </form>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="text-md font-semibold mb-2">Quick Add Room</h3>
        <p className="text-xs text-gray-600 mb-3">Creates a room entry that can be used for reservations.</p>
        <form
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setRoomMessage("");
            setRoomError("");
            try {
              await api("staff/rooms", {
                method: "POST",
                body: {
                  room_number: roomForm.room_number,
                  capacity: roomForm.capacity ? Number(roomForm.capacity) : undefined,
                  features: roomForm.features,
                },
              });
              setRoomMessage(`Room ${roomForm.room_number} added.`);
              setRoomForm({ room_number: "", capacity: "", features: "" });
              setRefreshFlag((f) => f + 1);
            } catch (err) {
              const code = err?.data?.error;
              const msg = err?.data?.message || err.message;
              if (code === "room_exists") {
                setRoomError(msg || "That room number already exists.");
              } else if (code === "invalid_payload") {
                setRoomError(msg || "Room number is required.");
              } else {
                setRoomError(msg || "Failed to add room.");
              }
            }
          }}
        >
          <Field label="Room Number">
            <input
              className="w-full rounded-md border px-3 py-2"
              value={roomForm.room_number}
              onChange={(e) => setRoomForm((prev) => ({ ...prev, room_number: e.target.value }))}
              placeholder="e.g., A201"
              required
            />
          </Field>
          <Field label="Capacity">
            <input
              type="number"
              min={0}
              className="w-full rounded-md border px-3 py-2"
              value={roomForm.capacity}
              onChange={(e) => setRoomForm((prev) => ({ ...prev, capacity: e.target.value }))}
              placeholder="Optional"
            />
          </Field>
          <Field label="Features">
            <input
              className="w-full rounded-md border px-3 py-2"
              value={roomForm.features}
              onChange={(e) => setRoomForm((prev) => ({ ...prev, features: e.target.value }))}
              placeholder="Optional description"
            />
          </Field>
          <div className="md:col-span-3 flex items-center gap-3">
            <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2">
              Add Room
            </button>
            {roomMessage && <span className="text-sm text-green-700">{roomMessage}</span>}
            {roomError && <span className="text-sm text-red-600">{roomError}</span>}
          </div>
        </form>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b bg-gray-50 px-5 py-3 text-sm">
          <span className="font-medium text-gray-700">Upcoming Reservations</span>
          <button
            onClick={() => setRefreshFlag((f) => f + 1)}
            className="text-xs font-medium text-gray-700 hover:underline"
          >
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <Th>ID</Th>
                <Th>Room</Th>
                <Th>Patron</Th>
                <Th>Start</Th>
                <Th>End</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center">Loading reservations…</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-red-600">{error}</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-600">No reservations yet.</td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.reservation_id} className="border-t">
                    <Td>#{r.reservation_id}</Td>
                    <Td>Room {r.room_number || r.room_id}</Td>
                    <Td>
                      {r.first_name} {r.last_name}
                    </Td>
                    <Td>{formatDateTime(r.start_time)}</Td>
                    <Td>{formatDateTime(r.end_time)}</Td>
                    <Td className="capitalize">{r.status}</Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

