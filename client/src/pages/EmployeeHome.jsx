import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import NavBar from "../components/NavBar";
import { STATUS_OPTIONS, EMPLOYEE_ROLE_OPTIONS, ACCOUNT_ROLE_OPTIONS } from "../components/staff/shared/constants";
import HoldsPanel from "../components/staff/HoldsPanel";
import ReportsPanel from "../components/staff/ReportsPanel";
import { formatDate, formatDateTime } from "../utils";
import "./EmployeeHome.css";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || ""; // e.g., http://localhost:3000/api

export default function EmployeeDashboard() {
  // Alias context helper to avoid ESLint React Hooks rule false-positive on a function named `use*`
  const { useApi: api, user } = useAuth();
  const [tab, setTab] = useState("fines"); // "fines" | "checkout" | "activeLoans" | "reservations" | "addItem" | "removeItem"
  const [counts, setCounts] = useState({ fines: 0, activeLoans: 0, reservations: 0 });
  const [countsLoading, setCountsLoading] = useState(false);
  const [countsLoaded, setCountsLoaded] = useState(false);
  const [manageItemsOpen, setManageItemsOpen] = useState(false);
  const [manageLoansOpen, setManageLoansOpen] = useState(false);
  const isAdmin = user?.employee_role === "admin";

  useEffect(() => {
  if (!api || countsLoaded) return;
    
    let alive = true;
    async function loadCounts() {
      setCountsLoading(true);
      try {
        const [finesRes, loansRes, resvRes] = await Promise.all([
          api('staff/fines?&pageSize=1000'),
          api('staff/loans/active?&pageSize=1000'),
          api('staff/reservations?&pageSize=1000'),
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
  }, [api, countsLoaded]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setManageItemsOpen(false);
        setManageLoansOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            
            {/* Manage Loans Dropdown */}
            <div className="dropdown-container">
              <button
                className={`tab-btn dropdown-btn ${["checkout", "return", "activeLoans"].includes(tab) ? "active" : ""}`}
                onClick={() => setManageLoansOpen(!manageLoansOpen)}
              >
                Manage Loans ▾
              </button>
              {manageLoansOpen && (
                <div className="dropdown-menu">
                  <button
                    className="dropdown-item"
                    onClick={() => { setTab("checkout"); setManageLoansOpen(false); }}
                  >
                    Checkout Loan
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => { setTab("return"); setManageLoansOpen(false); }}
                  >
                    Return Loan
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => { setTab("activeLoans"); setManageLoansOpen(false); }}
                  >
                    Active Loans
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => { setTab("holds"); setManageLoansOpen(false); }}
                  >
                    Holds
                  </button>
                </div>
              )}
            </div>

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
            
            {/* Manage Items Dropdown */}
            <div className="dropdown-container">
              <button
                className={`tab-btn dropdown-btn ${["addItem", "editItem", "removeItem"].includes(tab) ? "active" : ""}`}
                onClick={() => setManageItemsOpen(!manageItemsOpen)}
              >
                Manage Items ▾
              </button>
              {manageItemsOpen && (
                <div className="dropdown-menu">
                  <button
                    className="dropdown-item"
                    onClick={() => { setTab("addItem"); setManageItemsOpen(false); }}
                  >
                    Add Item
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => { setTab("editItem"); setManageItemsOpen(false); }}
                  >
                    Edit Item
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => { setTab("removeItem"); setManageItemsOpen(false); }}
                  >
                    Remove Item
                  </button>
                </div>
              )}
            </div>

            {isAdmin && (
              <button
                className={`tab-btn ${tab === "admin" ? "active" : ""}`}
                onClick={() => setTab("admin")}
              >
                Admin Tools
              </button>
            )}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>
  {tab === "fines" && <FinesPanel api={api} />}
  {tab === "checkout" && <CheckoutPanel api={api} staffUser={user} />}
  {tab === "return" && <ReturnLoanPanel api={api} staffUser={user} />}
  {tab === "activeLoans" && <ActiveLoansPanel api={api} />}
  {tab === "holds" && <HoldsPanel api={api} />}
  {tab === "reservations" && <ReservationsPanel api={api} staffUser={user} />}
  {tab === "reports" && <ReportsPanel api={api} />}
  {tab === "addItem" && <AddItemPanel api={api} />}
  {tab === "editItem" && <EditItemPanel api={api} />}
  {tab === "removeItem" && <RemoveItemPanel api={api} />}
  {tab === "admin" && isAdmin && <AdminPanel api={api} />}
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
                <Th>Days Overdue</Th>
                <Th>Amount</Th>
                <Th className="hidden md:table-cell">Est Now</Th>
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
                  const amount = r.amount_assessed != null ? `$${Number(r.amount_assessed).toFixed(2)}` : '—';
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
                      <Td>{r.current_fine != null ? `$${Number(r.current_fine).toFixed(2)}` : amount}</Td>
                      <Td className="hidden md:table-cell text-gray-500">
                        {r.amount_assessed != null && r.dynamic_est_fine != null && Number(r.dynamic_est_fine) > Number(r.amount_assessed) + 0.009
                          ? `$${Number(r.dynamic_est_fine).toFixed(2)}`
                          : '—'}
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
          className="inline-flex items-center justify-center rounded-md btn-primary px-4 py-2 text-sm font-medium disabled:opacity-50"
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
  const [patronQuery, setPatronQuery] = useState("");
  const [patronResults, setPatronResults] = useState([]);
  const [patronLoading, setPatronLoading] = useState(false);
  const [selectedPatron, setSelectedPatron] = useState(null);

  const [itemQuery, setItemQuery] = useState("");
  const [itemResults, setItemResults] = useState([]);
  const [itemLoading, setItemLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [copyOptions, setCopyOptions] = useState([]);
  const [selectedCopy, setSelectedCopy] = useState(null);
  const [copyLoading, setCopyLoading] = useState(false);

  const [manualForm, setManualForm] = useState({ user_id: "", identifier_type: "copy_id", identifier_value: "" });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canCheckout = Boolean(selectedPatron && selectedCopy && !submitting);

  const resetMessages = () => {
    setMessage("");
    setError("");
  };

  const searchPatrons = async () => {
    if (!patronQuery.trim()) {
      setPatronResults([]);
      return;
    }
    resetMessages();
    setPatronLoading(true);
    try {
      const results = await api(`staff/patrons/search?q=${encodeURIComponent(patronQuery.trim())}`);
      setPatronResults(Array.isArray(results) ? results : []);
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to search patrons.");
    } finally {
      setPatronLoading(false);
    }
  };

  const searchItems = async () => {
    if (!itemQuery.trim()) {
      setItemResults([]);
      return;
    }
    resetMessages();
    setItemLoading(true);
    try {
      const results = await api(`items?q=${encodeURIComponent(itemQuery.trim())}`);
      setItemResults(Array.isArray(results) ? results : []);
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to search items.");
    } finally {
      setItemLoading(false);
    }
  };

  const loadCopies = async (itemId) => {
    setCopyLoading(true);
    setCopyOptions([]);
    setSelectedCopy(null);
    try {
      const copies = await api(`items/${itemId}/copies`);
      setCopyOptions(Array.isArray(copies) ? copies.filter((c) => c.status === "available") : []);
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to load copies.");
    } finally {
      setCopyLoading(false);
    }
  };

  const startManual = () => {
    setSelectedPatron(null);
    setSelectedItem(null);
    setCopyOptions([]);
    setSelectedCopy(null);
    setPatronResults([]);
    setItemResults([]);
  };

  const submitCheckout = async (body) => {
    resetMessages();
    setSubmitting(true);
    try {
      await api("loans/checkout", { method: "POST", body });
      setMessage("Checkout successful.");
      setSelectedCopy(null);
      setSelectedItem(null);
      setCopyOptions([]);
      setManualForm({ user_id: "", identifier_type: manualForm.identifier_type, identifier_value: "" });
    } catch (err) {
      const code = err?.data?.error;
      const serverMessage = err?.data?.message;
      const fallback = err?.message || "Checkout failed.";
      const mapped =
        code === "loan_limit_exceeded"
          ? "The patron has reached their loan limit."
          : code === "copy_not_available"
            ? "That copy is not available."
            : code === "copy_not_found"
              ? "Copy not found."
              : code === "user_not_found"
                ? "User not found."
                : serverMessage || fallback;
      setError(mapped);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedPatron || !selectedCopy) return;
    const body = {
      user_id: selectedPatron.user_id,
      identifier_type: "copy_id",
      copy_id: selectedCopy.copy_id,
      ...(staffUser?.employee_id ? { employee_id: staffUser.employee_id } : {}),
    };
    await submitCheckout(body);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const user_id = Number(manualForm.user_id);
    const identifier = manualForm.identifier_value.trim();
    if (!user_id) {
      setError("Patron ID is required.");
      return;
    }
    if (!identifier) {
      setError(`Enter a ${manualForm.identifier_type === "barcode" ? "barcode" : "copy ID"}.`);
      return;
    }
    const body = {
      user_id,
      identifier_type: manualForm.identifier_type,
      ...(manualForm.identifier_type === "barcode"
        ? { barcode: identifier }
        : { copy_id: Number(identifier) }),
      ...(staffUser?.employee_id ? { employee_id: staffUser.employee_id } : {}),
    };
    await submitCheckout(body);
  };

  return (
    <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="rounded-xl border bg-white p-4 shadow-sm space-y-6">
        <header>
          <h2 className="text-lg font-semibold">Checkout Item</h2>
          <p className="text-sm text-gray-600">Search for a patron and choose an available copy.</p>
        </header>

        <Field label="Find Patron">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border px-3 py-2"
              value={patronQuery}
              onChange={(e) => setPatronQuery(e.target.value)}
              placeholder="Name, email, or ID"
              onKeyDown={(e) => e.key === "Enter" && searchPatrons()}
            />
            <button
              type="button"
              onClick={searchPatrons}
              disabled={patronLoading}
              className="rounded-md bg-gray-800 text-white px-4 py-2 disabled:opacity-50"
            >
              {patronLoading ? "Searching…" : "Search"}
            </button>
          </div>
        </Field>

        {patronResults.length > 0 && (
          <div className="search-results">
            {patronResults.map((patron) => (
              <button
                key={patron.user_id}
                type="button"
                onClick={() => {
                  setSelectedPatron(patron);
                  setPatronResults([]);
                }}
                className="result-item"
                disabled={!patron.is_active}
              >
                <div>
                  <div className="font-semibold text-sm">
                    {patron.first_name} {patron.last_name} (#{patron.user_id})
                  </div>
                  <div className="text-xs text-gray-600">{patron.email || "No email"}</div>
                </div>
                <div className="text-xs">
                  {patron.flagged_for_deletion && (
                    <span className="text-red-500 font-medium mr-2">Flagged</span>
                  )}
                  <span className={patron.is_active ? "status-badge active" : "status-badge inactive"}>
                    {patron.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedPatron && (
          <div className="selected-pill">
            <div>
              <div className="font-semibold text-sm">{selectedPatron.first_name} {selectedPatron.last_name}</div>
              <div className="text-xs text-gray-600">{selectedPatron.email || "No email"}</div>
            </div>
            <button type="button" onClick={() => setSelectedPatron(null)} className="text-xs text-red-500">
              Clear
            </button>
          </div>
        )}

        <Field label="Find Item">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border px-3 py-2"
              value={itemQuery}
              onChange={(e) => setItemQuery(e.target.value)}
              placeholder="Title or author"
              onKeyDown={(e) => e.key === "Enter" && searchItems()}
            />
            <button
              type="button"
              onClick={searchItems}
              disabled={itemLoading}
              className="rounded-md bg-gray-800 text-white px-4 py-2 disabled:opacity-50"
            >
              {itemLoading ? "Searching…" : "Search"}
            </button>
          </div>
        </Field>

        {itemResults.length > 0 && (
          <div className="search-results">
            {itemResults.map((item) => (
              <button
                key={item.item_id}
                type="button"
                onClick={() => {
                  setSelectedItem(item);
                  setItemResults([]);
                  loadCopies(item.item_id);
                }}
                className="result-item"
              >
                <div className="font-semibold text-sm">
                  {item.title} (#{item.item_id})
                </div>
                <div className="text-xs text-gray-500">
                  {Array.isArray(item.authors) && item.authors.length ? item.authors.join(", ") : "Unknown author"}
                </div>
              </button>
            ))}
          </div>
        )}

        {copyOptions.length > 0 && (
          <div className="copy-picker">
            <p className="text-xs font-medium text-gray-600 mb-2">
              Available copies ({copyOptions.length})
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {copyOptions.map((copy) => (
                <button
                  key={copy.copy_id}
                  type="button"
                  onClick={() => setSelectedCopy(copy)}
                  className={`copy-option ${selectedCopy?.copy_id === copy.copy_id ? "selected" : ""}`}
                >
                  <div className="text-sm font-medium">Copy #{copy.copy_id}</div>
                  <div className="text-xs text-gray-600">
                    Barcode: {copy.barcode || "—"} • Shelf: {copy.shelf_location || "—"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between border-t pt-4">
          <div>
            <div className="text-sm font-semibold">
              Patron: {selectedPatron ? `#${selectedPatron.user_id}` : "—"}
            </div>
            <div className="text-sm font-semibold">
              Copy: {selectedCopy ? `#${selectedCopy.copy_id}` : "—"}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={!canCheckout}
            className="rounded-md btn-primary px-4 py-2 disabled:opacity-50"
          >
            {submitting ? "Processing…" : "Checkout"}
          </button>
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

function ReportsPanelLegacy({ api }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeReport, setActiveReport] = useState("overdue"); // "overdue" | "balances" | "topItems" | "newPatrons" | "transactions"
  const [reportData, setReportData] = useState([]);
  
  // Date ranges for all reports
  const [overdueStartDate, setOverdueStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [overdueEndDate, setOverdueEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  
  const [balancesStartDate, setBalancesStartDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [balancesEndDate, setBalancesEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  
  const [topItemsStartDate, setTopItemsStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [topItemsEndDate, setTopItemsEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  
  const [newPatronsStartDate, setNewPatronsStartDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [newPatronsEndDate, setNewPatronsEndDate] = useState(() => new Date().toISOString().slice(0, 10));

    const [transactionsStartDate, setTransactionStartDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [transactionsEndDate, setTransactionsEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const loadReport = useCallback(async (reportType) => {
    if (!api) return;
    setLoading(true);
    setError("");
    setReportData([]);

    try {
      let endpoint = "";
      let params = new URLSearchParams();
      
      switch (reportType) {
        case "overdue":
          endpoint = "reports/overdue";
          params.set("start_date", overdueStartDate);
          params.set("end_date", overdueEndDate);
          break;
        case "balances":
          endpoint = "reports/balances";
          params.set("start_date", balancesStartDate);
          params.set("end_date", balancesEndDate);
          break;
        case "topItems":
          endpoint = "reports/top-items";
          params.set("start_date", topItemsStartDate);
          params.set("end_date", topItemsEndDate);
          break;
        case "newPatrons":
          endpoint = "reports/new-patrons-monthly";
          params.set("start_date", newPatronsStartDate);
          params.set("end_date", newPatronsEndDate);
          break;
        case "transactions":
          endpoint = "reports/transactions";
          params.set("start_date", transactionsStartDate);
          params.set("end_date", transactionsEndDate);
          break;
        default:
          throw new Error("Unknown report type");
      }
      const data = await api(`${endpoint}?${params.toString()}`);
      console.log("DATA: ", data);
      setReportData(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [api, overdueStartDate, overdueEndDate, balancesStartDate, balancesEndDate, topItemsStartDate, topItemsEndDate, newPatronsStartDate, newPatronsEndDate,transactionsStartDate,transactionsEndDate]);

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
                New Patrons
              </button>
              <button
                onClick={() => setActiveReport("transactions")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeReport === "transactions"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Transaction History
              </button>
            </div>

            <div className="flex items-end gap-4">
              {activeReport === "overdue" && (
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={overdueStartDate}
                      onChange={(e) => setOverdueStartDate(e.target.value)}
                      className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={overdueEndDate}
                      onChange={(e) => setOverdueEndDate(e.target.value)}
                      className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
                </div>
              )}
              {activeReport === "balances" && (
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={balancesStartDate}
                      onChange={(e) => setBalancesStartDate(e.target.value)}
                      className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={balancesEndDate}
                      onChange={(e) => setBalancesEndDate(e.target.value)}
                      className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
                </div>
              )}
              {activeReport === "topItems" && (
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={topItemsStartDate}
                      onChange={(e) => setTopItemsStartDate(e.target.value)}
                      className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={topItemsEndDate}
                      onChange={(e) => setTopItemsEndDate(e.target.value)}
                      className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
                </div>
              )}
              {activeReport === "newPatrons" && (
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={newPatronsStartDate}
                      onChange={(e) => setNewPatronsStartDate(e.target.value)}
                      className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={newPatronsEndDate}
                      onChange={(e) => setNewPatronsEndDate(e.target.value)}
                      className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
                </div>
              )}
              {activeReport === "transactions" && (
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={transactionsStartDate}
                      onChange={(e) => setTransactionStartDate(e.target.value)}
                      className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={transactionsEndDate}
                      onChange={(e) => setTransactionsEndDate(e.target.value)}
                      className="rounded-md border-2 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    />
                  </div>
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
            {activeReport === "transactions" && <TransactionReportTable data={reportData} loading={loading} />}
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
            <Th>Fine</Th>
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
              <Td className="font-medium">
                ${Number(row.dynamic_est_fine || row.est_fine || 0).toFixed(2)}
              </Td>
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
            const openBalance = Number(row.open_balance_current || row.open_balance || 0);
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
    return <div className="p-8 text-center text-gray-500">No loan activity in selected period</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <Th>Rank</Th>
            <Th>Item Title</Th>
            <Th>Media Type</Th>
            <Th>Loans</Th>
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
                  {row.loans_count || row.loans_30d} loans
                </span>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TransactionReportTable({data,loading}){
  if (loading) {
    return <div>Loading report...</div>;
  }
  if (data.length === 0) {
    return <div className="p-8 text-center text-gray-500">No loan activity in selected period</div>;
  }
  return (
    <div className="overflow-x-auto">
      <span className="transactions-table-label">Total Transactions: {data.length}</span>
      {loading && <span className="loading">Loading…</span>}
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <Th>Patron ID</Th>
            <Th>Patron</Th>
            <Th>Email</Th>
            <Th>Item Title</Th>
            <Th>Copy ID</Th>
            <Th>Loan ID</Th>
            <Th>Transaction</Th>
            <Th>Date</Th>
            <Th>Checked Out By</Th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              <Td>{row.user_id ? `#${row.user_id}` : "—"}</Td>
              <Td>{row.user_first_name && row.user_last_name? `${row.user_first_name} ${row.user_last_name}`: "—"}</Td>
              <Td>{row.user_email || "—"}</Td>
              <Td>{row.item_title || "—"}</Td>
              <Td>{row.copy_id ? `#${row.copy_id}` : "—"}</Td>
              <Td>#{row.loan_id}</Td>
              <Td>
                <span className={`td-action-label td-action-label-${row.type}`}>
                {(row.type || "").toUpperCase()}
                </span>
              </Td>
              <Td>{formatDate(row.date)}</Td>
              <Td>{row.employee_first_name && row.employee_last_name? `${row.employee_first_name} ${row.employee_last_name}`: "—"}</Td>
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
    description: "",
    cover_image_url: "",
    item_type: "book",
    isbn: "",
    publisher: "",
    publication_year: "",
    model: "",
    manufacturer: "",
    media_type: "DVD",
    length_minutes: "",
    use_same_shelf: false,
    same_shelf_location: "",
    number_of_copies: "1",
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

      // Determine item type (authors now optional for books)
      const itemType = form.item_type;

      const itemPayload = {
        title,
        subject: form.subject.trim() || undefined,
        description: form.description.trim() || undefined,
        cover_image_url: form.cover_image_url.trim() || undefined,
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
      
      // Determine how many copies to create
      const numCopies = parseInt(form.number_of_copies, 10) || 1;
      
      // Build copy payloads from explicit rows.
      // Accept either barcode OR shelf_location so users can set shelf without barcode
      const useSameShelf = !!form.use_same_shelf;
      const sameShelf = (form.same_shelf_location || "").trim();
      const copyPayloads = copies
        .map((copy) => ({
          barcode: (copy.barcode || "").trim(),
          shelf_location: (copy.shelf_location || "").trim(),
        }))
        .filter((copy) => copy.barcode || copy.shelf_location);

      let createdCopies = 0;
      if (item_id) {
        // First, create copies from the barcode rows if user provided them
        for (const copy of copyPayloads) {
          const shelf = useSameShelf ? sameShelf : copy.shelf_location;
          const body = {
            item_id,
            ...(copy.barcode ? { barcode: copy.barcode } : {}),
            ...(shelf ? { shelf_location: shelf } : {}),
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
        
        // Then, create additional copies if numCopies > copyPayloads.length
        // (auto-generate barcodes for the rest)
        const remaining = Math.max(0, numCopies - copyPayloads.length);
        for (let i = 0; i < remaining; i++) {
          const body = {
            item_id,
            ...(useSameShelf && sameShelf ? { shelf_location: sameShelf } : {}),
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
              console.warn(`Auto-copy creation warning: ${msg}`);
              break; // Stop on error but don't fail entire operation
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
        item_type: "general",
        isbn: "",
        publisher: "",
        publication_year: "",
        model: "",
        manufacturer: "",
        media_type: "DVD",
        length_minutes: "",
        use_same_shelf: false,
        same_shelf_location: "",
        number_of_copies: "1",
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

          <Field label="Description (optional)">
            <textarea
              className="w-full rounded-md border px-3 py-2"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Enter a description of this item..."
              rows="4"
            />
          </Field>

          <Field label="Cover Image URL (optional)">
            <input
              type="url"
              className="w-full rounded-md border px-3 py-2"
              value={form.cover_image_url}
              onChange={(e) => update("cover_image_url", e.target.value)}
              placeholder="e.g., https://example.com/cover.jpg"
            />
            <small className="text-xs text-gray-500 mt-1 block">
              Leave blank to use ISBN lookup or default placeholder
            </small>
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
                  Authors (optional)
                </h3>
                <p className="text-xs text-gray-500">
                  Add one or more authors. Leave blank if unknown.
                </p>

                {authors.map((author, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-3 items-end">
                    <Field label={`Author ${authors.length > 1 ? `#${index + 1}` : ""}`}>
                      <input
                        className="w-full rounded-md border px-3 py-2"
                        value={author.name}
                        onChange={(e) => updateAuthor(index, e.target.value)}
                        placeholder="e.g., F. Scott Fitzgerald"
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

          <Field label="Number of Copies">
            <input
              type="number"
              min="1"
              max="100"
              className="w-full rounded-md border px-3 py-2"
              value={form.number_of_copies}
              onChange={(e) => update("number_of_copies", e.target.value)}
              placeholder="e.g., 3"
            />
            <p className="text-xs text-gray-500 mt-1">
              Specify how many physical copies to create. Barcodes will be auto-generated if not provided below.
            </p>
          </Field>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Specific Barcodes (Optional)</h3>
            <p className="text-xs text-gray-500">
              If you want to assign custom barcodes or shelf locations, add them here. Otherwise, the system will auto-generate barcodes based on the number of copies above.
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
                {!form.use_same_shelf && (
                  <Field label="Shelf Location">
                    <input
                      className="w-full rounded-md border px-3 py-2"
                      value={copy.shelf_location}
                      onChange={(e) => updateCopy(index, "shelf_location", e.target.value)}
                      placeholder="Stacks A3"
                    />
                  </Field>
                )}
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
          {/* Shelf location controls */}
          <div className="space-y-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!form.use_same_shelf}
                onChange={(e) => update("use_same_shelf", e.target.checked)}
              />
              Use same shelf location for all copies
            </label>
            {form.use_same_shelf && (
              <Field label="Shelf Location for All Copies">
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={form.same_shelf_location}
                  onChange={(e) => update("same_shelf_location", e.target.value)}
                  placeholder="e.g., Shelf A-12"
                />
              </Field>
            )}
          </div>
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
              className="rounded-md btn-primary px-4 py-2 disabled:opacity-50"
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
  // Rooms management state
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState("");
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editRoomForm, setEditRoomForm] = useState({ room_number: "", capacity: "", features: "" });

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
    // also refresh rooms list
    (async () => {
      setRoomsLoading(true);
      setRoomsError("");
      try {
        const data = await api("rooms");
        setRooms(Array.isArray(data) ? data : []);
      } catch (err) {
        setRoomsError(err.message || "Failed to load rooms");
      } finally {
        setRoomsLoading(false);
      }
    })();
  }, [api, fetchReservations, refreshFlag]);

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
      } else if (code === "duration_exceeded") {
        setSubmitError(msg || "Reservations cannot exceed 2 hours.");
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
            Reservations must be within operating hours, cannot span multiple days, and are limited to a maximum of 2 hours.
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
            <button type="submit" className="rounded-md btn-primary px-4 py-2 disabled:opacity-50">
              Create Reservation
            </button>
            {submitMessage && <span className="text-sm text-green-700">{submitMessage}</span>}
            {submitError && <span className="text-sm text-red-600">{submitError}</span>}
          </div>
        </form>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="text-md font-semibold mb-2">Add Room</h3>
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
            <button type="submit" className="rounded-md btn-primary px-4 py-2">
              Add Room
            </button>
            {roomMessage && <span className="text-sm text-green-700">{roomMessage}</span>}
            {roomError && <span className="text-sm text-red-600">{roomError}</span>}
          </div>
        </form>
      </div>

      {/* Manage Rooms Section */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b bg-gray-50 px-5 py-3 text-sm">
          <span className="text-md font-semibold mb-2">Manage Rooms</span>
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
                <Th>Room Number</Th>
                <Th>Capacity</Th>
                <Th>Features</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {roomsLoading ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center">Loading rooms…</td>
                </tr>
              ) : roomsError ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-red-600">{roomsError}</td>
                </tr>
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-600">No rooms yet.</td>
                </tr>
              ) : (
                rooms.map((r) => {
                  const isEditing = editingRoomId === r.room_id;
                  return (
                    <tr key={r.room_id} className="border-t">
                      <Td>#{r.room_id}</Td>
                      <Td>
                        {isEditing ? (
                          <input
                            className="w-full rounded-md border px-2 py-1"
                            value={editRoomForm.room_number}
                            onChange={(e) => setEditRoomForm((p) => ({ ...p, room_number: e.target.value }))}
                          />
                        ) : (
                          r.room_number
                        )}
                      </Td>
                      <Td>
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            className="w-24 rounded-md border px-2 py-1"
                            value={editRoomForm.capacity ?? ""}
                            onChange={(e) => setEditRoomForm((p) => ({ ...p, capacity: e.target.value }))}
                          />
                        ) : (
                          r.capacity ?? "—"
                        )}
                      </Td>
                      <Td>
                        {isEditing ? (
                          <input
                            className="w-full rounded-md border px-2 py-1"
                            value={editRoomForm.features ?? ""}
                            onChange={(e) => setEditRoomForm((p) => ({ ...p, features: e.target.value }))}
                          />
                        ) : (
                          r.features ?? "—"
                        )}
                      </Td>
                      <Td className="whitespace-nowrap space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              className="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                              onClick={async () => {
                                try {
                                  const payload = {
                                    room_number: editRoomForm.room_number,
                                    capacity: editRoomForm.capacity === "" ? null : Number(editRoomForm.capacity),
                                    features: editRoomForm.features === "" ? null : editRoomForm.features,
                                  };
                                  await api(`staff/rooms/${r.room_id}`, { method: 'PUT', body: payload });
                                  setEditingRoomId(null);
                                  setRefreshFlag((f) => f + 1);
                                } catch (err) {
                                  const code = err?.data?.error;
                                  const msg = err?.data?.message || err.message;
                                  if (code === 'room_exists') alert(msg || 'That room number already exists.');
                                  else alert(msg || 'Failed to update room');
                                }
                              }}
                            >
                              Save
                            </button>
                            <button
                              className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                              onClick={() => setEditingRoomId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                              onClick={() => {
                                setEditingRoomId(r.room_id);
                                setEditRoomForm({
                                  room_number: r.room_number || "",
                                  capacity: r.capacity ?? "",
                                  features: r.features ?? "",
                                });
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                              onClick={async () => {
                                if (!window.confirm(`Permanently delete room ${r.room_number || r.room_id}?`)) return;
                                try {
                                  await api(`staff/rooms/${r.room_id}`, { method: 'DELETE' });
                                  setRefreshFlag((f) => f + 1);
                                } catch (err) {
                                  const code = err?.data?.error;
                                  const msg = err?.data?.message || err.message;
                                  if (code === 'room_in_use') alert(msg || 'Room has reservations and cannot be deleted.');
                                  else alert(msg || 'Failed to delete room');
                                }
                              }}
                            >
                              Delete
                            </button>
                          </>
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
    description: "",
    cover_image_url: "",
    item_type: "book",
    isbn: "",
    publisher: "",
    publication_year: "",
    model: "",
    manufacturer: "",
    media_type: "DVD",
    length_minutes: "",
    additional_copies: "0",
    bulk_shelf_location: "",
  });
  const [authors, setAuthors] = useState([{ name: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [existingCopies, setExistingCopies] = useState([]);
  const [loadingCopies, setLoadingCopies] = useState(false);

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
      description: item.description || "",
      cover_image_url: item.cover_image_url || "",
      item_type: item.item_type || "book",
      isbn: item.isbn || "",
      publisher: item.publisher || "",
      publication_year: item.publication_year || "",
      model: item.model || "",
      manufacturer: item.manufacturer || "",
      media_type: item.media_type || "DVD",
      length_minutes: item.length_minutes || "",
      additional_copies: "0",
      bulk_shelf_location: "",
    });

    // Fetch existing copies for this item
    setLoadingCopies(true);
    try {
      const copiesData = await api(`items/${item.item_id}/copies`);
      setExistingCopies(Array.isArray(copiesData) ? copiesData : []);
    } catch (err) {
      console.error("Error fetching copies:", err);
      setExistingCopies([]);
    } finally {
      setLoadingCopies(false);
    }

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

      // Authors are now optional for all types (including books)

      const itemPayload = {
        title,
        subject: form.subject.trim() || null,
        description: form.description.trim() || null,
        cover_image_url: form.cover_image_url.trim() || null,
      };

      console.log('[EditItem] Updating item with payload:', itemPayload);

      if (form.item_type === "book") {
        if (form.isbn.trim()) itemPayload.isbn = form.isbn.trim();
        if (form.publisher.trim()) itemPayload.publisher = form.publisher.trim();
        if (form.publication_year) itemPayload.publication_year = Number(form.publication_year);
      } else if (form.item_type === "device") {
        if (form.model.trim()) itemPayload.model = form.model.trim();
        if (form.manufacturer.trim()) itemPayload.manufacturer = form.manufacturer.trim();
      } else if (form.item_type === "media") {
        if (form.publisher.trim()) itemPayload.publisher = form.publisher.trim();
        if (form.publication_year) itemPayload.publication_year = Number(form.publication_year);
        if (form.length_minutes) itemPayload.length_minutes = Number(form.length_minutes);
        if (form.media_type) itemPayload.media_type = form.media_type;
      }

      // Update item
      console.log('[EditItem] Sending PUT request to items/' + selectedItem.item_id);
      const updateResult = await api(`items/${selectedItem.item_id}`, {
        method: "PUT",
        body: itemPayload,
      });
      console.log('[EditItem] Update result:', updateResult);

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

      // Add additional copies if requested
      const additionalCopies = parseInt(form.additional_copies, 10) || 0;
      let createdCopies = 0;
      if (additionalCopies > 0) {
        for (let i = 0; i < additionalCopies; i++) {
          try {
            await api("copies", {
              method: "POST",
              body: { item_id: selectedItem.item_id },
            });
            createdCopies += 1;
          } catch (err) {
            console.error("Error creating copy:", err);
            break;
          }
        }
      }

      setMessage(
        `✓ Item "${title}" updated successfully${createdCopies > 0 ? ` and ${createdCopies} ${createdCopies === 1 ? "copy" : "copies"} added` : ""}.`
      );
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

            <Field label="Description">
              <textarea
                className="w-full rounded-md border px-3 py-2"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Enter a description of this item..."
                rows="4"
              />
            </Field>

            <Field label="Cover Image URL">
              <input
                type="url"
                className="w-full rounded-md border px-3 py-2"
                value={form.cover_image_url}
                onChange={(e) => update("cover_image_url", e.target.value)}
                placeholder="e.g., https://example.com/cover.jpg"
              />
              <small className="text-xs text-gray-500 mt-1 block">
                Leave blank to use ISBN lookup or default placeholder
              </small>
            </Field>

              {/* Classification removed per request */}

            <Field label="Item Type">
              <select
                className="w-full rounded-md border px-3 py-2"
                value={form.item_type}
                onChange={(e) => update("item_type", e.target.value)}
              >
                <option value="general">General</option>
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
                    Authors 
                  </h3>
                  <p className="text-xs text-gray-500">
                    Add one or more authors. Leave blank if unknown.
                  </p>

                  {authors.map((author, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-3 items-end">
                      <Field label={`Author ${authors.length > 1 ? `#${index + 1}` : ""}`}>
                        <input
                          className="w-full rounded-md border px-3 py-2"
                          value={author.name}
                          onChange={(e) => updateAuthor(index, e.target.value)}
                          placeholder="e.g., F. Scott Fitzgerald"
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
                    placeholder="e.g., iPad Pro"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Media Type">
                  <select
                    className="w-full rounded-md border px-3 py-2"
                    value={form.media_type}
                    onChange={(e) => update("media_type", e.target.value)}
                  >
                    <option value="DVD">DVD</option>
                    <option value="CD">CD</option>
                    <option value="Blu-ray">Blu-ray</option>
                    <option value="VHS">VHS</option>
                  </select>
                </Field>
                <Field label="Length (minutes)">
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
                    placeholder="e.g., Warner Bros"
                  />
                </Field>
                <Field label="Publication Year">
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-md border px-3 py-2"
                    value={form.publication_year}
                    onChange={(e) => update("publication_year", e.target.value)}
                    placeholder="e.g., 2020"
                  />
                </Field>
              </div>
            )}

            {/* Existing Copies Management */}
            {selectedItem && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-800">
                  Active Copies ({existingCopies.filter(c => c.status !== 'lost').length})
                </h3>
                {loadingCopies ? (
                  <p className="text-sm text-gray-500">Loading copies...</p>
                ) : existingCopies.filter(c => c.status !== 'lost').length === 0 ? (
                  <p className="text-sm text-gray-500">No active copies found for this item.</p>
                ) : (
                  <div className="space-y-2">
                    {existingCopies
                      .filter(c => c.status !== 'lost')
                      .map((copy) => (
                        <CopyRow
                          key={copy.copy_id}
                          copy={copy}
                          api={api}
                          onUpdate={() => selectItem(selectedItem)}
                          onDelete={async () => {
                            const confirmed = window.confirm(
                              `Are you sure you want to delete copy ${copy.barcode}?\n\n` +
                              `This will permanently remove the copy if it has no loan history, ` +
                              `or mark it as "lost" if it has been loaned before.`
                            );
                            if (!confirmed) return;

                            try {
                              const result = await api(`copies/${copy.copy_id}`, { method: "DELETE" });
                              await selectItem(selectedItem);
                              if (result?.marked_lost) {
                                setMessage(`✓ Copy ${copy.barcode} marked as lost (has loan history).`);
                              } else {
                                setMessage(`✓ Copy ${copy.barcode} deleted successfully.`);
                              }
                            } catch (err) {
                              setMessage(`Failed to delete copy: ${err?.data?.error || err?.message || "Unknown error"}`);
                            }
                          }}
                        />
                      ))}
                  </div>
                )}

                {/* Lost Copies Section */}
                {existingCopies.filter(c => c.status === 'lost').length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">
                      Lost Copies ({existingCopies.filter(c => c.status === 'lost').length})
                    </h3>
                    <p className="text-xs text-gray-600 mb-3">
                      These copies are marked as lost. You can permanently remove them from the database.
                    </p>
                    <div className="space-y-2">
                      {existingCopies
                        .filter(c => c.status === 'lost')
                        .map((copy) => (
                          <div key={copy.copy_id} className="flex items-center gap-3 p-3 border rounded bg-red-50 border-red-200">
                            <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Barcode:</span>{" "}
                                <span className="text-gray-900">{copy.barcode}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Status:</span>{" "}
                                <span className="text-red-700 font-semibold">LOST</span>
                              </div>
                              <div className="col-span-2">
                                <span className="font-medium text-gray-700">Location:</span>{" "}
                                <span className="text-gray-900">{copy.shelf_location || "—"}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                const confirmed = window.confirm(
                                  `Permanently delete lost copy ${copy.barcode}?\n\n` +
                                  `This action cannot be undone. The copy will be removed from the database ` +
                                  `but loan history will be preserved.`
                                );
                                if (!confirmed) return;

                                try {
                                  await api(`copies/${copy.copy_id}?permanent=true`, { method: "DELETE" });
                                  await selectItem(selectedItem);
                                  setMessage(`✓ Lost copy ${copy.barcode} permanently deleted.`);
                                } catch (err) {
                                  setMessage(`Failed to delete copy: ${err?.data?.message || err?.message || "Unknown error"}`);
                                }
                              }}
                              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 whitespace-nowrap"
                            >
                              Permanently Delete
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bulk Shelf Update */}
            {selectedItem && existingCopies.filter(c => c.status !== 'lost').length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-semibold text-gray-800">Bulk Shelf Update</h3>
                <p className="text-xs text-gray-500">Set a new shelf location for all active copies below.</p>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Field label="New Shelf Location">
                      <input
                        className="w-full rounded-md border px-3 py-2"
                        value={form.bulk_shelf_location}
                        onChange={(e) => update("bulk_shelf_location", e.target.value)}
                        placeholder="e.g., Shelf B-4"
                      />
                    </Field>
                  </div>
                  <button
                    type="button"
                    disabled={!form.bulk_shelf_location.trim() || submitting}
                    onClick={async () => {
                      const shelf = form.bulk_shelf_location.trim();
                      if (!shelf) return;
                      const activeCopies = existingCopies.filter(c => c.status !== 'lost');
                      let updated = 0;
                      for (const copy of activeCopies) {
                        try {
                          await api(`copies/${copy.copy_id}`, { method: 'PUT', body: { shelf_location: shelf } });
                          updated++;
                        } catch (err) {
                          console.error('Bulk shelf update error:', err);
                        }
                      }
                      await selectItem(selectedItem); // refresh copies
                      setMessage(`✓ Updated shelf for ${updated} active ${updated === 1 ? 'copy' : 'copies'}.`);
                      update('bulk_shelf_location', '');
                    }}
                    className="h-[42px] px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-blue-700"
                  >
                    Apply to All
                  </button>
                </div>
              </div>
            )}

            {/* Additional Copies */}
            <Field label="Add Additional Copies" helper="Number of new copies to create (leave 0 to not add any)">
              <input
                type="number"
                min="0"
                value={form.additional_copies}
                onChange={(e) => setForm((f) => ({ ...f, additional_copies: e.target.value }))}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </Field>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md btn-primary px-4 py-2 disabled:opacity-50"
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

function CopyRow({ copy, api, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [location, setLocation] = useState(copy.shelf_location || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await api(`copies/${copy.copy_id}`, {
        method: "PUT",
        body: { shelf_location: location.trim() || null }
      });
      setEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(`Failed to update location: ${err?.data?.error || err?.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 border rounded bg-gray-50">
      <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="font-medium text-gray-700">Barcode:</span>{" "}
          <span className="text-gray-900">{copy.barcode}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Status:</span>{" "}
          <span className="text-gray-900 capitalize">{copy.status}</span>
        </div>
        <div className="col-span-2">
          <span className="font-medium text-gray-700">Location:</span>{" "}
          {editing ? (
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="ml-2 px-2 py-1 border rounded text-sm"
              placeholder="e.g., Shelf A-12"
            />
          ) : (
            <span className="text-gray-900">{copy.shelf_location || "—"}</span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {editing ? (
          <>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setLocation(copy.shelf_location || "");
                setEditing(false);
              }}
              className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit Location
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
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


const DEFAULT_ADMIN_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  account_type: "employee",
  account_role: "student",
  employee_role: "assistant",
};

function AdminPanel({ api }) {
  const [overview, setOverview] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState(DEFAULT_ADMIN_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState({ type: null, text: "" });

  const accountType = form.account_type;

  useEffect(() => {
    if (!api) return;
    let alive = true;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const [overviewRes, employeesRes] = await Promise.all([
          api("admin/overview"),
          api("admin/employees"),
        ]);
        if (!alive) return;
        setOverview(overviewRes || {});
        const employeeRows = Array.isArray(employeesRes?.rows)
          ? employeesRes.rows
          : Array.isArray(employeesRes)
            ? employeesRes
            : [];
        setEmployees(employeeRows);
      } catch (err) {
        if (!alive) return;
        const msg = err?.data?.error || err?.message || "Failed to load admin data";
        setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [api, refreshKey]);

  const triggerRefresh = () => setRefreshKey((key) => key + 1);

  const updateForm = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formStatus.type) setFormStatus({ type: null, text: "" });
  };

  const resetForm = () => setForm({ ...DEFAULT_ADMIN_FORM });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!api || submitting) return;
    setSubmitting(true);
    setFormStatus({ type: null, text: "" });
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        account_type: accountType,
        account_role: form.account_role,
      };
      if (accountType === "employee") payload.employee_role = form.employee_role;

      await api("admin/accounts", { method: "POST", body: payload });
      setFormStatus({ type: "success", text: "Account created successfully." });
      resetForm();
      triggerRefresh();
    } catch (err) {
      const msg = err?.data?.error || err?.message || "Failed to create account";
      setFormStatus({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !overview) {
    return <div style={{ padding: "1rem" }}>Loading admin data…</div>;
  }

  if (error && !overview) {
    return <div style={{ padding: "1rem", color: "var(--danger, #b91c1c)" }}>{error}</div>;
  }

  const roleCounts = Array.isArray(overview?.role_counts) ? overview.role_counts : [];
  const recentHires = Array.isArray(overview?.recent_hires) ? overview.recent_hires : [];
  const accountStats = overview?.account_stats || {};
  const fineStats = overview?.fine_stats || {};

  return (
    <section className="space-y-4">
      {error && overview && (
        <div style={{ padding: "0.75rem", borderRadius: 6, background: "#fef2f2", color: "#b91c1c" }}>
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="font-semibold mb-2">Create Account</h3>
          <p className="text-sm text-gray-500 mb-4">
            Provision a new user or staff account directly from the admin portal.
          </p>

          {formStatus.text && (
            <div
              style={{
                marginBottom: "0.75rem",
                padding: "0.5rem 0.75rem",
                borderRadius: 6,
                fontSize: "0.9rem",
                background: formStatus.type === "success" ? "#ecfdf5" : "#fef2f2",
                color: formStatus.type === "success" ? "#065f46" : "#b91c1c",
              }}
            >
              {formStatus.text}
            </div>
          )}

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-sm text-gray-600">
                First name
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={form.first_name}
                  onChange={(e) => updateForm("first_name", e.target.value)}
                  required
                />
              </label>
              <label className="text-sm text-gray-600">
                Last name
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={form.last_name}
                  onChange={(e) => updateForm("last_name", e.target.value)}
                  required
                />
              </label>
            </div>

            <label className="text-sm text-gray-600">
              Email
              <input
                type="email"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                required
              />
            </label>

            <label className="text-sm text-gray-600">
              Temporary password
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                type="text"
                value={form.password}
                onChange={(e) => updateForm("password", e.target.value)}
                required
              />
            </label>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Account type</p>
              <div className="flex items-center gap-4 text-sm">
                {[
                  { label: "User", value: "user" },
                  { label: "Employee", value: "employee" },
                ].map((opt) => (
                  <label key={opt.value} className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="accountType"
                      value={opt.value}
                      checked={accountType === opt.value}
                      onChange={(e) => updateForm("account_type", e.target.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {accountType === "user" && (
              <label className="text-sm text-gray-600">
                Patron role
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={form.account_role}
                  onChange={(e) => updateForm("account_role", e.target.value)}
                >
                  {ACCOUNT_ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {accountType === "employee" && (
              <label className="text-sm text-gray-600">
                Employee role
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={form.employee_role}
                  onChange={(e) => updateForm("employee_role", e.target.value)}
                >
                  {EMPLOYEE_ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button
              type="submit"
              className="w-full rounded-md bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "Creating…" : "Create Account"}
            </button>
          </form>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm flex flex-col">
          <h3 className="font-semibold mb-2">Account Directory</h3>
          <p className="text-sm text-gray-600 flex-1">
            Open the dedicated account manager to search, edit, or flag any patron or staff record.
          </p>
          <Link
            to="/manage/accounts"
            style={{
              marginTop: "1rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "#2563eb",
              color: "#fff",
              padding: "0.5rem 0.9rem",
              borderRadius: "999px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Open Account Manager →
          </Link>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="font-semibold mb-2">Employee Roles</h3>
          <ul className="divide-y divide-gray-100">
            {roleCounts.length === 0 && <li className="py-2 text-sm text-gray-600">No employees found.</li>}
            {roleCounts.map((row) => (
              <li key={row.role} className="py-2 flex items-center justify-between text-sm">
                <span className="capitalize text-gray-700">{row.role}</span>
                <span className="font-semibold">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total Accounts"
          value={accountStats.total_accounts ?? 0}
          sub={`Staff: ${accountStats.staff_accounts ?? 0}`}
        />
        <StatCard
          label="Patron Accounts"
          value={accountStats.patron_accounts ?? 0}
          sub="Students + Faculty"
        />
        <StatCard
          label="Open Fines"
          value={fineStats.open_fines ?? 0}
          sub={`$${Number(fineStats.open_fine_amount ?? 0).toFixed(2)}`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="font-semibold mb-2">Recent Hires</h3>
          <ul className="divide-y divide-gray-100">
            {recentHires.length === 0 && <li className="py-2 text-sm text-gray-600">No recent hires.</li>}
            {recentHires.map((emp) => (
              <li key={emp.employee_id} className="py-2">
                <div className="font-medium text-gray-800">
                  {emp.first_name} {emp.last_name}
                </div>
                <div className="text-xs text-gray-500">
                  {emp.role} • {emp.hire_date ? formatDate(emp.hire_date) : "Unknown date"}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="font-semibold mb-2">Employee Directory</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Hire Date</th>
                  <th className="px-3 py-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 && (
                  <tr>
                    <td className="px-3 py-3 text-center text-gray-500" colSpan={4}>
                      No employees found.
                    </td>
                  </tr>
                )}
                {employees.map((emp) => (
                  <tr key={emp.employee_id} className="border-t">
                    <td className="px-3 py-2 font-medium text-gray-800">
                      {emp.first_name} {emp.last_name}
                    </td>
                    <td className="px-3 py-2 capitalize text-gray-600">{emp.role}</td>
                    <td className="px-3 py-2">{emp.hire_date ? formatDate(emp.hire_date) : "—"}</td>
                    <td className="px-3 py-2">{emp.email || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-sm text-gray-500">{sub}</p>}
    </div>
  );
}
