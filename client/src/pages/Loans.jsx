import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import NavBar from "../components/NavBar";
import { formatDate, formatDateTime, formatCurrency } from "../utils";
import "./Loans.css";
import { listMyHolds, cancelMyHold, acceptReadyHold, declineReadyHold } from "../api";

const normalizeRows = (payload) => {
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload)) return payload;
  return [];
};

export default function Loans() {
  const { token, useApi: callApi } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [holds, setHolds] = useState([]);
  const [holdsLoading, setHoldsLoading] = useState(true);
  const [holdsError, setHoldsError] = useState("");
  const [cancelingHoldId, setCancelingHoldId] = useState(null);
  const [acceptingHoldId, setAcceptingHoldId] = useState(null);
  const [decliningHoldId, setDecliningHoldId] = useState(null);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const [histError, setHistError] = useState("");
  const [returningLoanId, setReturningLoanId] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    let active = true;
    (async () => {
      setLoading(true);
      setHoldsLoading(true);
      setError("");
      setHoldsError("");
      setHistError("");
      setActionError("");
      try {
        const [loansData, historyData, holdsData] = await Promise.all([
          callApi("loans/my"),
          callApi("loans/myhist"),
          listMyHolds(token)
        ]);
        if (!active) return;
        setRows(normalizeRows(loansData));
        setHistory(normalizeRows(historyData));
        setHolds(normalizeRows(holdsData));
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load your loans.");
        setHoldsError(err?.message || "Failed to load your holds.");
        setHistError(err?.message || "Failed to load your past loans.");
      } finally {
        if (active) {
          setLoading(false);
          setHoldsLoading(false);
          setHistLoading(false);
        }
      }
    })();
    return () => { active = false; };
  }, [token, callApi, navigate]);

  const refreshLoansAndHistory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setHistLoading(true);
    setError("");
    setHistError("");
    try {
      const [loansData, historyData] = await Promise.all([
        callApi("loans/my"),
        callApi("loans/myhist"),
      ]);
      setRows(normalizeRows(loansData));
      setHistory(normalizeRows(historyData));
    } catch (err) {
      setError(err?.message || "Failed to load your loans.");
      setHistError(err?.message || "Failed to load your past loans.");
    } finally {
      setLoading(false);
      setHistLoading(false);
    }
  }, [callApi, token]);

  const refreshHolds = useCallback(async () => {
    if (!token) return;
    setHoldsLoading(true);
    setHoldsError("");
    try {
      const data = await listMyHolds(token);
      setHolds(normalizeRows(data));
    } catch (err) {
      setHoldsError(err?.message || "Failed to refresh holds.");
    } finally {
      setHoldsLoading(false);
    }
  }, [token]);

  const handleCancelHold = async (holdId) => {
    if (!window.confirm("Cancel this hold?")) return;
    setCancelingHoldId(holdId);
    try {
      await cancelMyHold(token, holdId);
      await refreshHolds();
    } catch (err) {
      setHoldsError(err?.message || err?.data?.error || "Failed to cancel hold");
    } finally {
      setCancelingHoldId(null);
    }
  };

  const handleReturnLoan = async (loanId) => {
    const loan = rows.find((r) => r.loan_id === loanId);
    if (!loan) return;
    if (!window.confirm(`Return "${loan.item_title}"?`)) return;

    setReturningLoanId(loanId);
    setActionError("");
    try {
      await callApi("loans/return", {
        method: "POST",
        body: { loan_id: loanId },
      });

      const returnedLoan = {
        ...loan,
        status: "returned",
        return_date: new Date().toISOString(),
      };

      setRows((prev) => prev.filter((item) => item.loan_id !== loanId));
      setHistory((prev) => [returnedLoan, ...prev]);
    } catch (err) {
      setActionError(err?.message || err?.data?.error || "Failed to return loan.");
    } finally {
      setReturningLoanId(null);
    }
  };

  const handleAcceptHold = async (hold) => {
    if (!hold?.hold_id) return;
    setAcceptingHoldId(hold.hold_id);
    setHoldsError("");
    try {
      await acceptReadyHold(token, hold.hold_id);
      await Promise.all([refreshHolds(), refreshLoansAndHistory()]);
    } catch (err) {
      const msg = err?.data?.message || err?.message || "Failed to check out this hold.";
      setHoldsError(msg);
    } finally {
      setAcceptingHoldId(null);
    }
  };

  const handleDeclineHold = async (hold) => {
    if (!hold?.hold_id) return;
    setDecliningHoldId(hold.hold_id);
    setHoldsError("");
    try {
      await declineReadyHold(token, hold.hold_id);
      await refreshHolds();
    } catch (err) {
      const msg = err?.data?.message || err?.message || "Failed to decline this hold.";
      setHoldsError(msg);
    } finally {
      setDecliningHoldId(null);
    }
  };

  return (
    <div className="loans-page">
      <NavBar />
      <h1>Your Loans</h1>
      <p>View your current and past loans.</p>

      <div className="loans-container">
        <div className="loans-header">
          <span>Loans: {rows.length}</span>
          <div>
            {loading && <span className="loading">Loading...</span>}
            {(error || actionError) && (
              <span className="error">{error || actionError}</span>
            )}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="loans-table">
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Due Date</Th>
                <Th>Return Date</Th>
                <Th>Status</Th>
                <Th>Fine Amount</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="loans-empty-state">{loading ? "" : "No loans found."}</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.loan_id}>
                    <Td title={r.item_title}>{r.item_title}</Td>
                    <Td>{formatDate(r.due_date)}</Td>
                    <Td>{formatDate(r.return_date)}</Td>
                    <Td>
                      <span className={`loans-status-badge ${r.status}`}>
                        {r.status}
                      </span>
                    </Td>
                    <Td>{formatCurrency(r.outstanding_fine ?? 0)}</Td>
                    <Td>
                      <button
                        className="loan-return-btn"
                        onClick={() => handleReturnLoan(r.loan_id)}
                        disabled={returningLoanId === r.loan_id}
                      >
                        {returningLoanId === r.loan_id ? "Returning..." : "Return"}
                      </button>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>
    </div>

      <section style={{marginTop:10}}>
        <h1>Your past loans</h1>
        <p>Items you have returned.</p>
        <div className="loans-container">
          <div className="loans-header">
            <span>Loans: {history.length}</span>
            {histLoading && <span className="loading">Loading...</span>}
            {histError && <span className="error">{histError}</span>}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="loans-table">
              <thead>
                <tr>
                  <Th>Item</Th>
                  <Th>Return Date</Th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="loans-empty-state">{histLoading ? "" : "No past loans found."}</td>
                  </tr>
                ) : (
                  history.map((r) => (
                    <tr key={r.loan_id}>
                      <Td title={r.item_title}>{r.item_title}</Td>
                      <Td>{formatDate(r.return_date)}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      
      <section className="holds-section">
        <div className="holds-header">
          <div>
            <h2>Your Holds</h2>
            <p>Track queued and ready-for-pickup requests.</p>
          </div>
          <div>
            {holdsLoading && <span className="loading">Loading...</span>}
            {holdsError && <span className="error">{holdsError}</span>}
          </div>
        </div>
        <div className="holds-container">
          <div style={{ overflowX: "auto" }}>
            <table className="holds-table">
              <thead>
                <tr>
                  <Th>Title</Th>
                  <Th>Status</Th>
                  <Th>Queue</Th>
                  <Th>Ready Window</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {holds.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="holds-empty">
                      {holdsLoading ? "" : "No holds yet."}
                    </td>
                  </tr>
                ) : (
                  holds.map((hold) => (
                    <tr key={hold.hold_id}>
                      <Td>{hold.item_title}</Td>
                      <Td>
                        <span className={`hold-status ${hold.status}`}>{hold.status}</span>
                      </Td>
                      <Td>
                        {hold.status === "queued"
                          ? hold.queue_position
                          : hold.status === "ready"
                            ? "Ready"
                            : "—"}
                      </Td>
                      <Td>
                        {hold.status === "ready"
                          ? `${formatDateTime(hold.available_since)} – ${formatDateTime(hold.expires_at)}`
                          : "—"}
                      </Td>
                      <Td>
                        {hold.status === "ready" ? (
                          <div className="hold-action-group">
                            <button
                              className="hold-action-btn hold-action-btn--primary"
                              onClick={() => handleAcceptHold(hold)}
                              disabled={
                                acceptingHoldId === hold.hold_id ||
                                decliningHoldId === hold.hold_id
                              }
                            >
                              {acceptingHoldId === hold.hold_id ? "Checking out…" : "Check out"}
                            </button>
                            <button
                              className="hold-action-btn"
                              onClick={() => handleDeclineHold(hold)}
                              disabled={
                                decliningHoldId === hold.hold_id ||
                                acceptingHoldId === hold.hold_id
                              }
                            >
                              {decliningHoldId === hold.hold_id ? "Declining…" : "No thanks"}
                            </button>
                          </div>
                        ) : hold.status === "queued" ? (
                          <button
                            className="hold-cancel-btn"
                            onClick={() => handleCancelHold(hold.hold_id)}
                            disabled={cancelingHoldId === hold.hold_id}
                          >
                            {cancelingHoldId === hold.hold_id ? "Cancelling…" : "Cancel"}
                          </button>
                        ) : (
                          <span className="hold-action-placeholder">—</span>
                        )}
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function Th({ children }) {
  return <th>{children}</th>;
}
function Td({ children, ...props }) {
  return <td {...props}>{children}</td>;
}
