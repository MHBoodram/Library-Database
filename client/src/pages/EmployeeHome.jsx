import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import NavBar from "../components/NavBar";
import { Th, Td, StatusPill, Field, StatCard } from "../components/staff/shared/CommonComponents";
import { STATUS_OPTIONS, EMPLOYEE_ROLE_OPTIONS, ACCOUNT_ROLE_OPTIONS } from "../components/staff/shared/constants";
import FiltersBar from "../components/staff/shared/FiltersBar";
import FinesPanel from "../components/staff/FinesPanel";
import ActiveLoansPanel from "../components/staff/ActiveLoansPanel";
import { CheckoutPanel, ReturnLoanPanel } from "../components/staff/LoansManagement";
import HoldsPanel from "../components/staff/HoldsPanel";
import ReportsPanel from "../components/staff/ReportsPanel";
import { AddItemPanel, EditItemPanel, RemoveItemPanel } from "../components/staff/ItemsManagement";
import ReservationsPanel from "../components/staff/ReservationsPanel";
import AdminPanel from "../components/staff/AdminPanel";
import "./EmployeeHome.css";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || ""; // e.g., http://localhost:3000/api

export default function EmployeeDashboard() {
  // Alias context helper to avoid ESLint React Hooks rule false-positive on a function named `use*`
  const { useApi: api, user } = useAuth();
  const isAdmin = user?.employee_role === "admin";
  const [tab, setTab] = useState(() => {
    if (isAdmin){return "admin"}
    else{return "checkout"}
  }); 
  // valid states: "checkout" | "activeLoans" | "reservations" | "addItem" | "removeItem" | "admin" (only available to admins)
  const [counts, setCounts] = useState({ fines: 0, activeLoans: 0, reservations: 0 });
  const [countsLoading, setCountsLoading] = useState(false);
  // removed countsLoaded state (no longer needed)

  const loadCounts = React.useCallback(async () => {
    if (!api) return;
    setCountsLoading(true);
    try {
      const [finesRes, loansRes, resvRes] = await Promise.all([
        api('staff/fines?&pageSize=1000'),
        api('staff/loans/active?&pageSize=1000'),
        api('staff/reservations?&pageSize=1000'),
      ]);
      const finesList = Array.isArray(finesRes?.rows) ? finesRes.rows : Array.isArray(finesRes) ? finesRes : [];
      const loansList = Array.isArray(loansRes?.rows) ? loansRes.rows : Array.isArray(loansRes) ? loansRes : [];
      const resvList = Array.isArray(resvRes?.rows) ? resvRes.rows : Array.isArray(resvRes) ? resvRes : [];
      setCounts({ fines: finesList.length, activeLoans: loansList.length, reservations: resvList.length });
  // counts loaded
    } catch (err) {
      if (typeof console !== 'undefined') console.debug(err);
    } finally {
      setCountsLoading(false);
    }
  }, [api]);
  const [manageItemsOpen, setManageItemsOpen] = useState(false);
  const [manageLoansOpen, setManageLoansOpen] = useState(false);
  useEffect(() => {
    if (!api) return;
    loadCounts();
  }, [api, loadCounts]);

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
            <button
              className={`tab-btn ${tab === "pendingCheckouts" ? "active" : ""}`}
              onClick={() => setTab("pendingCheckouts")}
            >
              Pending Checkouts
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
  {tab === "checkout" && <CheckoutPanel api={api} staffUser={user} onChanged={loadCounts} />}
  {tab === "return" && <ReturnLoanPanel api={api} staffUser={user} onChanged={loadCounts} />}
  {tab === "activeLoans" && <ActiveLoansPanel api={api} />}
  {tab === "holds" && <HoldsPanel api={api} onChanged={loadCounts} />}
  {tab === "reservations" && <ReservationsPanel api={api} staffUser={user} onChanged={loadCounts} />}
  {tab === "reports" && <ReportsPanel api={api} />}
  {tab === "pendingCheckouts" && <PendingCheckoutsPanel api={api} onChanged={loadCounts} />}
  {tab === "addItem" && <AddItemPanel api={api} />}
  {tab === "editItem" && <EditItemPanel api={api} />}
  {tab === "removeItem" && <RemoveItemPanel api={api} />}
  {tab === "admin" && isAdmin && <AdminPanel api={api} />}
      </main>
    </div>
  );
}

function PendingCheckoutsPanel({ api, onChanged }) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api('staff/loans/pending');
      const list = Array.isArray(res?.rows) ? res.rows : Array.isArray(res) ? res : [];
      setRows(list);
    } catch (e) {
      setError(e?.message || 'Failed to load pending');
    } finally { setLoading(false); }
  }, [api]);

  React.useEffect(() => { load(); }, [load]);

  const approve = async (loan_id) => {
    if (!loan_id) return;
    try {
      await api('staff/loans/approve', { method: 'POST', body: { loan_id } });
      await load();
      if (typeof onChanged === 'function') {
        try { onChanged(); } catch { /* no-op */ }
      }
      alert('Approved');
    } catch (e) {
      alert(e?.data?.message || e?.message || 'Approval failed');
    }
  };

  const deny = async (loan_id) => {
    if (!loan_id) return;
    if (!window.confirm("Deny this checkout request?")) return;
    try {
      await api('staff/loans/deny', { method: 'POST', body: { loan_id } });
      await load();
      if (typeof onChanged === 'function') {
        try { onChanged(); } catch { /* no-op */ }
      }
      alert('Denied request');
    } catch (e) {
      alert(e?.data?.message || e?.message || 'Deny failed');
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-gray-50 px-5 py-3"><h2 className="text-lg font-semibold">Pending Checkouts</h2></div>
        <div className="p-4">
          {loading && <div>Loading…</div>}
          {error && <div className="text-red-700">{error}</div>}
          {!loading && rows.length === 0 && <div className="text-gray-600">No pending requests.</div>}
          {rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <Th>Patron</Th>
                    <Th>Patron ID</Th>
                    <Th>Copy ID</Th>
                    <Th>Loan ID</Th>
                    <Th>Requested</Th>
                    <Th>Item</Th>
                    <Th>Type</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.loan_id} className="border-t">
                      <Td>{r.first_name} {r.last_name}</Td>
                      <Td>{r.user_id}</Td>
                      <Td>{r.copy_id}</Td>
                      <Td>{r.loan_id || '—'}</Td>
                      <Td>{new Date(r.request_date).toLocaleString()}</Td>
                      <Td className="max-w-[30ch] truncate" title={r.item_title}>{r.item_title}</Td>
                      <Td>{(r.media_type || 'book').toUpperCase()}</Td>
                      <Td>
                        <div className="flex gap-2">
                          <button
                            className="inline-flex items-center rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-green-500"
                            onClick={() => approve(r.loan_id)}
                          >
                            Approve
                          </button>
                          <button
                            className="inline-flex items-center rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-red-500"
                            onClick={() => deny(r.loan_id)}
                          >
                            Deny
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
