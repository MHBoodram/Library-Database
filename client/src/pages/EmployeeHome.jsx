import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  const [countsLoaded, setCountsLoaded] = useState(false);
  const [manageItemsOpen, setManageItemsOpen] = useState(false);
  const [manageLoansOpen, setManageLoansOpen] = useState(false);
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
  {/* Fines moved under Reports tab */}
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
