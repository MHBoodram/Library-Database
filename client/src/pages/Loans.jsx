import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import NavBar from "../components/NavBar";
import { formatDate, formatDateTime, formatCurrency } from "../utils";
import "./Loans.css";
import { listMyHolds, cancelMyHold } from "../api";

export default function Loans() {
  const { token, useApi: callApi } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [holds, setHolds] = useState([]);
  const [holdsLoading, setHoldsLoading] = useState(true);
  const [holdsError, setHoldsError] = useState("");
  const [cancelingHoldId, setCancelingHoldId] = useState(null);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const [histError, setHistError] = useState("");

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
      try {
        const [loansData, historyData, holdsData] = await Promise.all([
          callApi("loans/my"),
          callApi("loans/myhist"),
          listMyHolds(token)
        ]);
        if (!active) return;
        const loans = Array.isArray(loansData?.rows) ? loansData.rows : Array.isArray(loansData) ? loansData : [];
        const histRows = Array.isArray(historyData?.rows) ? historyData.rows : Array.isArray(historyData) ? historyData : [];
        const holdRows = Array.isArray(holdsData?.rows) ? holdsData.rows : Array.isArray(holdsData) ? holdsData : [];
        setRows(loans);
        setHistory(histRows);
        setHolds(holdRows);
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

  const refreshHolds = async () => {
    setHoldsLoading(true);
    setHoldsError("");
    try {
      const data = await listMyHolds(token);
      const list = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : [];
      setHolds(list);
    } catch (err) {
      setHoldsError(err?.message || "Failed to refresh holds.");
    } finally {
      setHoldsLoading(false);
    }
  };

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

  return (
    <div className="loans-page">
      <NavBar />
      <h1>Your Loans</h1>
      <p>View your current and past loans.</p>

      <div className="loans-container">
        <div className="loans-header">
          <span>Loans: {rows.length}</span>
          {loading && <span className="loading">Loading…</span>}
          {error && <span className="error">{error}</span>}
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
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="loans-empty-state">{loading ? "" : "No loans found."}</td></tr>
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
            {histLoading && <span className="loading">Loading…</span>}
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
            {holdsLoading && <span className="loading">Loading…</span>}
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
                        {(hold.status === "queued" || hold.status === "ready") ? (
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
