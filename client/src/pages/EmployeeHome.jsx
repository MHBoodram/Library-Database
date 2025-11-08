import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  const { useApi, user } = useAuth();
  // obtain the api helper from context
  const apiWithAuth = useApi();
  const [tab, setTab] = useState("fines"); // "fines" | "checkout" | "activeLoans" | "reservations" | "addItem" | "removeItem"
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
              className={`tab-btn ${tab === "return" ? "active" : ""}`}
              onClick={() => setTab("return")}
            >
              Return Loan
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
              className={`tab-btn ${tab === "reports" ? "active" : ""}`}
              onClick={() => setTab("reports")}
            >
              Reports
            </button>
            <button
              className={`tab-btn ${tab === "addItem" ? "active" : ""}`}
              onClick={() => setTab("addItem")}
            >
              Add Item
            </button>
            <button
              className={`tab-btn ${tab === "editItem" ? "active" : ""}`}
              onClick={() => setTab("editItem")}
            >
              Edit Item
            </button>
            <button
              className={`tab-btn ${tab === "removeItem" ? "active" : ""}`}
              onClick={() => setTab("removeItem")}
            >
              Remove Item
            </button>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>
        {tab === "fines" && <FinesPanel api={apiWithAuth} />}
        {tab === "checkout" && <CheckoutPanel api={apiWithAuth} staffUser={user} />}
        {tab === "return" && <ReturnLoanPanel api={apiWithAuth} staffUser={user} />}
        {tab === "activeLoans" && <ActiveLoansPanel api={apiWithAuth} />}
        {tab === "reservations" && <ReservationsPanel api={apiWithAuth} staffUser={user} />}
        {tab === "reports" && <ReportsPanel api={apiWithAuth} />}
        {tab === "addItem" && <AddItemPanel api={apiWithAuth} />}
        {tab === "editItem" && <EditItemPanel api={apiWithAuth} />}
        {tab === "removeItem" && <RemoveItemPanel api={apiWithAuth} />}
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

function ReturnLoanPanel({ api, staffUser }) {
  const [form, setForm] = useState({ loan_id: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      setError("Please enter a loan ID, patron name, or item title to search");
      return;
    }

    setSearching(true);
    setError("");
    setSearchResults([]);

    try {
      const params = new URLSearchParams({ q: searchQuery.trim() });
      const data = await api(`staff/loans/active?${params.toString()}`);
      const list = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : [];
      setSearchResults(list);
      if (list.length === 0) {
        setError("No active loans found matching your search");
      }
    } catch (err) {
      setError(err.message || "Failed to search loans");
    } finally {
      setSearching(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const loan_id = Number(form.loan_id);
      if (!loan_id || loan_id <= 0) {
        throw new Error("Valid Loan ID is required.");
      }

      const body = {
        loan_id,
        ...(staffUser?.employee_id ? { employee_id: staffUser.employee_id } : {}),
      };

      await api("loans/return", { method: "POST", body });
      setMessage(`Successfully returned loan #${loan_id}.`);
      setForm({ loan_id: "" });
      setSearchResults([]);
      setSearchQuery("");
    } catch (err) {
      const code = err?.data?.error;
      const serverMessage = err?.data?.message;
      if (code === "loan_not_found") {
        setError(serverMessage || "Loan not found.");
      } else if (code === "already_returned") {
        setError(serverMessage || "This loan has already been returned.");
      } else if (err?.message) {
        setError(serverMessage || err.message);
      } else {
        setError("Return failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function selectLoan(loan) {
    setForm({ loan_id: String(loan.loan_id) });
    setError("");
    setMessage("");
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Return Loan</h2>
          <p className="text-sm text-gray-600">
            Search for an active loan and process the return.
          </p>
        </div>

        <div className="space-y-3">
          <Field label="Search Active Loans">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-md border px-3 py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Loan ID, patron name, or item title"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching}
                className="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </div>
          </Field>

          {searchResults.length > 0 && (
            <div className="rounded-lg border bg-gray-50 p-3 max-h-96 overflow-y-auto">
              <p className="text-xs font-medium text-gray-600 mb-2">
                Found {searchResults.length} active loan(s) - Click to select:
              </p>
              <div className="space-y-2">
                {searchResults.map((loan) => {
                  const borrower = [loan.user_first_name, loan.user_last_name]
                    .filter(Boolean)
                    .join(" ")
                    .trim();
                  return (
                    <button
                      key={loan.loan_id}
                      type="button"
                      onClick={() => selectLoan(loan)}
                      className="w-full text-left rounded-md border bg-white p-3 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            Loan #{loan.loan_id} - {loan.item_title}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Borrower: {borrower || "Unknown"} (#{loan.user_id})
                          </div>
                          <div className="text-xs text-gray-600">
                            Copy #{loan.copy_id} • Due: {formatDate(loan.due_date)}
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 font-medium">Select →</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Loan ID">
            <input
              className="w-full rounded-md border px-3 py-2"
              value={form.loan_id}
              onChange={(e) => update("loan_id", e.target.value)}
              placeholder="e.g., 123"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the loan ID manually or select from search results above
            </p>
          </Field>

          {message && (
            <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Processing Return..." : "Return Loan"}
          </button>
        </form>
      </div>
    </section>
  );
}

function ReportsPanel({ api }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeReport, setActiveReport] = useState("overdue"); // "overdue" | "balances" | "topItems" | "newPatrons"
  const [reportData, setReportData] = useState([]);
  const [monthFilter, setMonthFilter] = useState(() => new Date().toISOString().slice(0,7)); // YYYY-MM
  const [patronMode, setPatronMode] = useState("single"); // "single" | "window"
  const [monthsWindow, setMonthsWindow] = useState(12); // 6,12,24 etc

  const loadReport = useCallback(async (reportType) => {
    if (!api) return;
    setLoading(true);
    setError("");
    setReportData([]);

    try {
      let endpoint = reportType === "overdue" 
        ? "reports/overdue" 
        : reportType === "balances"
        ? "reports/balances"
        : reportType === "topItems"
        ? "reports/top-items"
        : "reports/new-patrons-monthly";
      if (reportType === "newPatrons") {
        if (patronMode === "single" && monthFilter) {
          endpoint += `?month=${encodeURIComponent(monthFilter)}`;
        } else if (patronMode === "window" && monthsWindow) {
          endpoint += `?months=${encodeURIComponent(monthsWindow)}`;
        }
      }
      
      const data = await api(endpoint);
      setReportData(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [api, monthFilter, patronMode, monthsWindow]);

  useEffect(() => {
    loadReport(activeReport);
  }, [activeReport, loadReport]);

  function handleRefresh() {
    loadReport(activeReport);
  }

  function handleExport() {
    // Simple CSV export
    if (reportData.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = Object.keys(reportData[0]);
    const csvContent = [
      headers.join(","),
      ...reportData.map(row => 
        headers.map(h => {
          const val = row[h];
          // Escape commas and quotes
          return typeof val === 'string' && (val.includes(',') || val.includes('"'))
            ? `"${val.replace(/"/g, '""')}"`
            : val ?? "";
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-gray-50 px-5 py-4">
          <h2 className="text-lg font-semibold">Reports</h2>
          <p className="text-sm text-gray-600 mt-1">
            Generate and view library reports
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 flex gap-2">
              <button
                onClick={() => setActiveReport("overdue")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeReport === "overdue"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Overdue Loans
              </button>
              <button
                onClick={() => setActiveReport("balances")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeReport === "balances"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                User Balances
              </button>
              <button
                onClick={() => setActiveReport("topItems")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeReport === "topItems"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Top Items
              </button>
              <button
                onClick={() => setActiveReport("newPatrons")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeReport === "newPatrons"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                New Patrons / Month
              </button>
            </div>

            <div className="flex items-end gap-2">
              {activeReport === "newPatrons" && (
                <div className="flex flex-wrap items-end gap-4">
                  <div className="space-y-1">
                    <span className="block text-xs font-medium text-gray-600">Mode</span>
                    <div className="flex gap-3 text-sm">
                      <label className="inline-flex items-center gap-1">
                        <input
                          type="radio"
                          name="patron-mode"
                          value="single"
                          checked={patronMode === "single"}
                          onChange={(e) => setPatronMode(e.target.value)}
                        />
                        Single Month
                      </label>
                      <label className="inline-flex items-center gap-1">
                        <input
                          type="radio"
                          name="patron-mode"
                          value="window"
                          checked={patronMode === "window"}
                          onChange={(e) => setPatronMode(e.target.value)}
                        />
                        Rolling Window
                      </label>
                    </div>
                  </div>
                  {patronMode === "single" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
                      <input
                        type="month"
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="rounded-md border bg-white px-3 py-2"
                      />
                    </div>
                  )}
                  {patronMode === "window" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Months</label>
                      <select
                        value={monthsWindow}
                        onChange={(e) => setMonthsWindow(Number(e.target.value))}
                        className="rounded-md border bg-white px-3 py-2"
                      >
                        {[6,12,18,24,30,36].map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}
            
            <div className="flex gap-2 ml-auto">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 rounded-md bg-gray-700 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
              <button
                onClick={handleExport}
                disabled={loading || reportData.length === 0}
                className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                Export CSV
              </button>
            </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="rounded-lg border overflow-hidden">
            {activeReport === "overdue" && <OverdueReportTable data={reportData} loading={loading} />}
            {activeReport === "balances" && <BalancesReportTable data={reportData} loading={loading} />}
            {activeReport === "topItems" && <TopItemsReportTable data={reportData} loading={loading} />}
            {activeReport === "newPatrons" && <NewPatronsReportTable data={reportData} loading={loading} />}
          </div>
        </div>
      </div>
    </section>
  );
}

function NewPatronsReportTable({ data, loading }) {
  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading report...</div>;
  }
  if (!data.length) {
    return <div className="p-8 text-center text-gray-500">No patron signups in the selected window</div>;
  }
  // data: [{ month: 'YYYY-MM', new_patrons: number }, ...]
  const total = data.reduce((sum, r) => sum + Number(r.new_patrons || 0), 0);
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <Th>Month</Th>
            <Th>New Patrons</Th>
            <Th>Cumulative</Th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            const monthLabel = new Date(row.month + '-01').toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
            const cumulative = data.slice(0, idx + 1).reduce((s, r) => s + Number(r.new_patrons || 0), 0);
            return (
              <tr key={row.month} className="border-t">
                <Td>{monthLabel}</Td>
                <Td>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${row.new_patrons > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}> 
                    {row.new_patrons} {row.new_patrons === 1 ? 'patron' : 'patrons'}
                  </span>
                </Td>
                <Td className="font-medium">{cumulative}</Td>
              </tr>
            );
          })}
          <tr className="bg-gray-50 border-t">
            <Td className="font-semibold">Total</Td>
            <Td className="font-semibold">{total}</Td>
            <Td className="font-semibold">—</Td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function OverdueReportTable({ data, loading }) {
  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading report...</div>;
  }

  if (data.length === 0) {
    return <div className="p-8 text-center text-gray-500">No overdue loans found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <Th>Borrower</Th>
            <Th>Item Title</Th>
            <Th>Media Type</Th>
            <Th>Due Date</Th>
            <Th>Days Overdue</Th>
            <Th>Est. Fine</Th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-t">
              <Td>{`${row.first_name} ${row.last_name}`}</Td>
              <Td className="max-w-[30ch] truncate" title={row.title}>{row.title}</Td>
              <Td>{(row.media_type || "book").toUpperCase()}</Td>
              <Td>{formatDate(row.due_date)}</Td>
              <Td>
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-xs font-medium">
                  {row.days_overdue} days
                </span>
              </Td>
              <Td className="font-medium">${Number(row.est_fine || 0).toFixed(2)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BalancesReportTable({ data, loading }) {
  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading report...</div>;
  }

  if (data.length === 0) {
    return <div className="p-8 text-center text-gray-500">No balances found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <Th>Patron</Th>
            <Th>Paid Total</Th>
            <Th>Open Balance</Th>
            <Th>Total</Th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            const paidTotal = Number(row.paid_total || 0);
            const openBalance = Number(row.open_balance || 0);
            const total = paidTotal + openBalance;
            return (
              <tr key={idx} className="border-t">
                <Td>{`${row.first_name} ${row.last_name}`}</Td>
                <Td className="text-green-700 font-medium">${paidTotal.toFixed(2)}</Td>
                <Td className={openBalance > 0 ? "text-red-700 font-medium" : "text-gray-500"}>
                  ${openBalance.toFixed(2)}
                </Td>
                <Td className="font-semibold">${total.toFixed(2)}</Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TopItemsReportTable({ data, loading }) {
  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading report...</div>;
  }

  if (data.length === 0) {
    return <div className="p-8 text-center text-gray-500">No loan activity in the last 30 days</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <Th>Rank</Th>
            <Th>Item Title</Th>
            <Th>Media Type</Th>
            <Th>Loans (30 days)</Th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-t">
              <Td className="font-medium">#{idx + 1}</Td>
              <Td className="max-w-[40ch] truncate" title={row.title}>{row.title}</Td>
              <Td>{(row.media_type || "book").toUpperCase()}</Td>
              <Td>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-xs font-medium">
                  {row.loans_30d} loans
                </span>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
  const [authors, setAuthors] = useState([{ name: "" }]);
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

  function updateAuthor(index, value) {
    setAuthors((list) =>
      list.map((author, i) => (i === index ? { name: value } : author))
    );
  }

  function addAuthorRow() {
    setAuthors((list) => [...list, { name: "" }]);
  }

  function removeAuthorRow(index) {
    setAuthors((list) => (list.length <= 1 ? list : list.filter((_, i) => i !== index)));
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

      // Validate authors for books
      const itemType = form.item_type;
      if (itemType === "book") {
        const authorNames = authors.map(a => a.name.trim()).filter(Boolean);
        if (authorNames.length === 0) {
          throw new Error("At least one author is required for books");
        }
      }

      const itemPayload = {
        title,
        subject: form.subject.trim() || undefined,
        classification: form.classification.trim() || undefined,
      };

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

      // Create authors if any
      const authorNames = authors.map(a => a.name.trim()).filter(Boolean);
      if (item_id && authorNames.length) {
        for (const authorName of authorNames) {
          try {
            if (api) {
              await api("authors", { method: "POST", body: { item_id, author_name: authorName } });
            } else {
              const res = await fetch(`${API_BASE}/authors`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ item_id, author_name: authorName }),
              });
              if (!res.ok && res.status !== 409) {
                // 409 means author already exists, which is fine
                const msg = await safeError(res);
                console.warn(`Author creation warning: ${msg}`);
              }
            }
          } catch (err) {
            // Non-fatal: log but continue
            console.warn("Author creation warning:", err);
          }
        }
      }

      setMessage(
        `Item created${createdCopies ? ` with ${createdCopies} ${createdCopies === 1 ? "copy" : "copies"}` : ""}${authorNames.length ? ` and ${authorNames.length} ${authorNames.length === 1 ? "author" : "authors"}` : ""} ✅`
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
      setAuthors([{ name: "" }]);
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
            <>
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

              {/* Authors section for books */}
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  Authors <span className="text-red-600">*</span>
                </h3>
                <p className="text-xs text-gray-500">
                  At least one author is required for books.
                </p>

                {authors.map((author, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-3 items-end">
                    <Field label={`Author ${authors.length > 1 ? `#${index + 1}` : ""}`}>
                      <input
                        className="w-full rounded-md border px-3 py-2"
                        value={author.name}
                        onChange={(e) => updateAuthor(index, e.target.value)}
                        placeholder="e.g., F. Scott Fitzgerald"
                        required={form.item_type === "book"}
                      />
                    </Field>
                    <div className="pb-2">
                      {authors.length > 1 && (
                        <button
                          type="button"
                          className="mt-6 text-xs text-red-600 hover:underline"
                          onClick={() => removeAuthorRow(index)}
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
                  onClick={addAuthorRow}
                >
                  + Add another author
                </button>
              </div>
            </>
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
      } else if (code === "outside_library_hours") {
        setSubmitError(msg || "Reservation is outside library operating hours.");
      } else {
        setSubmitError(msg || "Failed to create reservation.");
      }
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Create Room Reservation</h2>
        <div className="mb-4 p-3 bg-blue-50 rounded-md text-sm">
          <strong>Library Hours:</strong>
          <div className="mt-1 text-blue-900">
            Mon-Fri: 7:00 AM - 10:00 PM | Sat: 9:00 AM - 8:00 PM | Sun: 10:00 AM - 6:00 PM
          </div>
          <div className="mt-1 text-xs text-gray-600">
            Reservations must be within operating hours and cannot span multiple days.
          </div>
        </div>
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
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center">Loading reservations…</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-red-600">{error}</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-600">No reservations yet.</td>
                </tr>
              ) : (
                rows.map((r) => {
                  const displayStatus = r.computed_status || r.status;
                  return (
                    <tr key={r.reservation_id} className="border-t">
                      <Td>#{r.reservation_id}</Td>
                      <Td>Room {r.room_number || r.room_id}</Td>
                      <Td>
                        {r.first_name} {r.last_name}
                      </Td>
                      <Td>{formatDateTime(r.start_time)}</Td>
                      <Td>{formatDateTime(r.end_time)}</Td>
                      <Td>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                            displayStatus === 'completed' || displayStatus === 'cancelled'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {displayStatus}
                        </span>
                      </Td>
                      <Td>
                        {displayStatus === 'active' && (
                          <button
                            onClick={async () => {
                              if (!window.confirm(`Cancel reservation #${r.reservation_id}?`)) return;
                              try {
                                await api(`reservations/${r.reservation_id}/cancel`, { method: 'PATCH' });
                                setRefreshFlag((f) => f + 1);
                              } catch (err) {
                                console.error("Cancel error:", err);
                                const errCode = err.data?.error || err.error;
                                const errMsg = err.data?.message || err.message || 'Unknown error';
                                alert(`Failed to cancel (${errCode}): ${errMsg}`);
                              }
                            }}
                            className="text-xs px-2 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-700"
                          >
                            Cancel
                          </button>
                        )}
                        {' '}
                        <button
                          onClick={async () => {
                            if (!window.confirm(`Permanently delete reservation #${r.reservation_id}?`)) return;
                            try {
                              await api(`staff/reservations/${r.reservation_id}`, { method: 'DELETE' });
                              setRefreshFlag((f) => f + 1);
                            } catch (err) {
                              console.error("Delete error:", err);
                              const errCode = err.data?.error || err.error;
                              const errMsg = err.data?.message || err.message || 'Unknown error';
                              alert(`Failed to delete (${errCode}): ${errMsg}`);
                            }
                          }}
                          className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
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

function EditItemPanel({ api }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [existingAuthors, setExistingAuthors] = useState([]);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    classification: "",
    item_type: "book",
    isbn: "",
    publisher: "",
    publication_year: "",
  });
  const [authors, setAuthors] = useState([{ name: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search items
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setItems([]);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const data = await api(`items?q=${encodeURIComponent(debouncedQuery)}`);
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Search error:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [debouncedQuery, api]);

  async function selectItem(item) {
    setSelectedItem(item);
    setForm({
      title: item.title || "",
      subject: item.subject || "",
      classification: item.classification || "",
      item_type: item.item_type || "book",
      isbn: item.isbn || "",
      publisher: item.publisher || "",
      publication_year: item.publication_year || "",
    });

    // Fetch existing authors for this item
    if (item.item_type === "book") {
      try {
        const authorsData = await api(`items/${item.item_id}/authors`);
        if (authorsData && authorsData.length > 0) {
          setExistingAuthors(authorsData);
          setAuthors(authorsData.map(a => ({ name: a.author_name || a.full_name })));
        } else {
          setExistingAuthors([]);
          setAuthors([{ name: "" }]);
        }
      } catch (err) {
        console.error("Error fetching authors:", err);
        setExistingAuthors([]);
        setAuthors([{ name: "" }]);
      }
    } else {
      setExistingAuthors([]);
      setAuthors([{ name: "" }]);
    }
    setMessage("");
  }

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function updateAuthor(index, value) {
    setAuthors(list => list.map((author, i) => (i === index ? { name: value } : author)));
  }

  function addAuthorRow() {
    setAuthors(list => [...list, { name: "" }]);
  }

  function removeAuthorRow(index) {
    setAuthors(list => (list.length <= 1 ? list : list.filter((_, i) => i !== index)));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!selectedItem) return;

    setSubmitting(true);
    setMessage("");

    try {
      const title = form.title.trim();
      if (!title) {
        throw new Error("Title is required");
      }

      // Validate authors for books
      if (form.item_type === "book") {
        const authorNames = authors.map(a => a.name.trim()).filter(Boolean);
        if (authorNames.length === 0) {
          throw new Error("At least one author is required for books");
        }
      }

      const itemPayload = {
        title,
        subject: form.subject.trim() || undefined,
        classification: form.classification.trim() || undefined,
      };

      if (form.item_type === "book") {
        if (form.isbn.trim()) itemPayload.isbn = form.isbn.trim();
        if (form.publisher.trim()) itemPayload.publisher = form.publisher.trim();
        if (form.publication_year) itemPayload.publication_year = Number(form.publication_year);
      }

      // Update item
      await api(`items/${selectedItem.item_id}`, {
        method: "PUT",
        body: itemPayload,
      });

      // Update authors if book
      if (form.item_type === "book") {
        // Delete existing authors
        for (const existingAuthor of existingAuthors) {
          try {
            await api(`items/${selectedItem.item_id}/authors/${existingAuthor.author_id}`, {
              method: "DELETE",
            });
          } catch (err) {
            console.error("Error deleting author:", err);
          }
        }

        // Add new authors
        const authorNames = authors.map(a => a.name.trim()).filter(Boolean);
        for (const authorName of authorNames) {
          try {
            await api("authors", {
              method: "POST",
              body: { item_id: selectedItem.item_id, author_name: authorName },
            });
          } catch (err) {
            console.error("Error adding author:", err);
          }
        }
      }

      setMessage(`✓ Item "${title}" updated successfully.`);
      setSelectedItem(null);
      setSearchQuery("");
      setItems([]);
    } catch (err) {
      const msg = err?.data?.message || err.message || "Failed to update item";
      setMessage(`Failed: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-4">
      {!selectedItem ? (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Edit Item</h2>
          <p className="text-sm text-gray-600 mb-4">
            Search for an item by title, ISBN, or ID to edit its details.
          </p>

          <input
            type="text"
            className="w-full rounded-md border px-3 py-2 mb-4"
            placeholder="Search by title, ISBN, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {loading && <div className="text-sm text-gray-600">Searching...</div>}
          
          {!loading && items.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-3">ID</th>
                    <th className="text-left p-3">Title</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.item_id} className="border-t">
                      <td className="p-3">#{item.item_id}</td>
                      <td className="p-3">{item.title}</td>
                      <td className="p-3 capitalize">{item.item_type || "general"}</td>
                      <td className="p-3">
                        <button
                          onClick={() => selectItem(item)}
                          className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && debouncedQuery && items.length === 0 && (
            <div className="text-sm text-gray-600">No items found.</div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Edit Item: {selectedItem.title}</h2>
            <button
              onClick={() => {
                setSelectedItem(null);
                setSearchQuery("");
                setMessage("");
              }}
              className="text-sm text-gray-600 hover:underline"
            >
              ← Back to search
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Title">
              <input
                className="w-full rounded-md border px-3 py-2"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                required
              />
            </Field>

            <Field label="Subject">
              <input
                className="w-full rounded-md border px-3 py-2"
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
                placeholder="e.g., Literature"
              />
            </Field>

            <Field label="Classification / Call Number">
              <input
                className="w-full rounded-md border px-3 py-2"
                value={form.classification}
                onChange={(e) => update("classification", e.target.value)}
                placeholder="e.g., 813.52 FIT"
              />
            </Field>

            {form.item_type === "book" && (
              <>
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

                {/* Authors section for books */}
                <div className="space-y-2 pt-2">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Authors <span className="text-red-600">*</span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    At least one author is required for books.
                  </p>

                  {authors.map((author, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-3 items-end">
                      <Field label={`Author ${authors.length > 1 ? `#${index + 1}` : ""}`}>
                        <input
                          className="w-full rounded-md border px-3 py-2"
                          value={author.name}
                          onChange={(e) => updateAuthor(index, e.target.value)}
                          placeholder="e.g., F. Scott Fitzgerald"
                          required
                        />
                      </Field>
                      <div className="pb-2">
                        {authors.length > 1 && (
                          <button
                            type="button"
                            className="mt-6 text-xs text-red-600 hover:underline"
                            onClick={() => removeAuthorRow(index)}
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
                    onClick={addAuthorRow}
                  >
                    + Add another author
                  </button>
                </div>
              </>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-gray-900 text-white px-4 py-2 disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Update Item"}
              </button>
              {message && (
                <p className={`text-sm ${message.startsWith("Failed") ? "text-red-600" : "text-green-700"}`}>
                  {message}
                </p>
              )}
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function RemoveItemPanel({ api }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteStatus, setDeleteStatus] = useState({});

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(handle);
  }, [query]);

  const searchItems = useCallback(
    async (signal) => {
      if (!api || !debouncedQuery) {
        setItems([]);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ q: debouncedQuery, pageSize: "50" });
        const data = await api(`items?${params.toString()}`, { signal });
        const list = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : [];
        setItems(list);
      } catch (err) {
        if (signal?.aborted) return;
        setError(err.message || "Failed to search items");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [api, debouncedQuery]
  );

  useEffect(() => {
    const controller = new AbortController();
    searchItems(controller.signal);
    return () => controller.abort();
  }, [searchItems]);

  async function handleDelete(itemId, title) {
    const confirmed = window.confirm(
      `Are you sure you want to delete:\n\n"${title}" (ID: ${itemId})?\n\nThis action cannot be undone and will also delete all copies and related data.`
    );
    if (!confirmed) return;

    setDeleteStatus((prev) => ({ ...prev, [itemId]: "deleting" }));
    try {
      const result = await api(`items/${itemId}`, { method: "DELETE" });
      setDeleteStatus((prev) => ({ ...prev, [itemId]: "success" }));
      setItems((prev) => prev.filter((item) => item.item_id !== itemId));
      
      // Show success message
      const successMsg = result?.message || "Item deleted successfully";
      alert(`✓ ${successMsg}`);
      
      setTimeout(() => {
        setDeleteStatus((prev) => {
          const next = { ...prev };
          delete next[itemId];
          return next;
        });
      }, 2000);
    } catch (err) {
      setDeleteStatus((prev) => ({ ...prev, [itemId]: "error" }));
      
      // Extract detailed error message
      const errorCode = err?.data?.error || err?.error;
      const errorMessage = err?.data?.message || err?.message;
      
      let userMessage = "Failed to delete item";
      if (errorCode === "has_active_loans") {
        userMessage = `❌ Cannot delete: ${errorMessage}`;
      } else if (errorCode === "not_found") {
        userMessage = "❌ Item not found. It may have already been deleted.";
      } else if (errorMessage) {
        userMessage = `❌ ${errorMessage}`;
      } else {
        userMessage = `❌ Failed to delete item: ${errorCode || "Unknown error"}`;
      }
      
      alert(userMessage);
      setTimeout(() => {
        setDeleteStatus((prev) => {
          const next = { ...prev };
          delete next[itemId];
          return next;
        });
      }, 3000);
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border bg-white shadow-sm p-5">
        <h2 className="text-lg font-semibold mb-3">Remove Item</h2>
        <p className="text-sm text-gray-600 mb-4">
          Search for items by title, ISBN, or ID. 
        </p>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Search Items</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Enter title, ISBN, or item ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}
      </div>

      {debouncedQuery && (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b bg-gray-50 px-5 py-3 text-sm">
            <span className="font-medium text-gray-700">
              {loading ? "Searching..." : `Found ${items.length} item(s)`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <Th>ID</Th>
                  <Th>Title</Th>
                  <Th>Type</Th>
                  <Th>ISBN</Th>
                  <Th>Subject</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="p-4 text-center" colSpan={6}>
                      Loading...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="p-4 text-center text-gray-600" colSpan={6}>
                      No items found matching "{debouncedQuery}"
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const status = deleteStatus[item.item_id];
                    return (
                      <tr key={item.item_id} className="border-t">
                        <Td>#{item.item_id}</Td>
                        <Td className="max-w-[30ch] truncate" title={item.title}>
                          {item.title}
                        </Td>
                        <Td className="capitalize">{item.item_type || "—"}</Td>
                        <Td>{item.isbn || "—"}</Td>
                        <Td>{item.subject || "—"}</Td>
                        <Td>
                          {status === "success" ? (
                            <span className="text-green-600 text-xs font-medium">✓ Deleted</span>
                          ) : status === "error" ? (
                            <span className="text-red-600 text-xs font-medium">✗ Error</span>
                          ) : (
                            <button
                              onClick={() => handleDelete(item.item_id, item.title)}
                              disabled={status === "deleting"}
                              className="px-3 py-1 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {status === "deleting" ? "Deleting..." : "Delete"}
                            </button>
                          )}
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

