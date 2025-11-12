import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import NavBar from "../components/NavBar";
import { formatDate, formatDateTime, formatCurrency } from "../utils";
import "./Loans.css";
import { listMyHolds, cancelMyHold, cancelMyRequest } from "../api";

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
  const [requests, setRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [reqError,setReqError] = useState("");
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const [histError, setHistError] = useState("");
  const [cancelingRequestId, setCancelingRequestId] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    let active = true;
    (async () => {
      setLoading(true);
      setHoldsLoading(true);
      setReqLoading(true);
      setError("");
      setHoldsError("");
      setReqError("");
      setHistError("");
      try {
        const [loansData, requestData, historyData, holdsData] = await Promise.all([
          callApi("loans/my"),
          callApi("loans/pending/my"),
          callApi("loans/myhist"),
          listMyHolds(token)
        ]);
        if (!active) return;
        const loans = Array.isArray(loansData?.rows) ? loansData.rows : Array.isArray(loansData) ? loansData : [];
        const reqRows = Array.isArray(requestData?.rows) ? requestData.rows : Array.isArray(requestData) ? requestData : [];
        const histRows = Array.isArray(historyData?.rows) ? historyData.rows : Array.isArray(historyData) ? historyData : [];
        const holdRows = Array.isArray(holdsData?.rows) ? holdsData.rows : Array.isArray(holdsData) ? holdsData : [];
        setRows(loans);
        setRequests(reqRows);
        setHistory(histRows);
        setHolds(holdRows);
        console.log("ROWS: ", reqRows);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load your loans.");
        setHoldsError(err?.message || "Failed to load your holds.");
        setReqError(err?.message || "Failed to load your checkout requests");
        setHistError(err?.message || "Failed to load your past loans.");
      } finally {
        if (active) {
          setLoading(false);
          setHoldsLoading(false);
          setReqLoading(false);
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

  const refreshRequests = async () => {
    setReqLoading(true);
    setReqError("");
    try {
      const data = await callApi("loans/pending/my");
      const list = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : [];
      setRequests(list);
    } catch (err) {
      setReqError(err?.message || "Failed to refresh requests.");
    } finally {
      setReqLoading(false);
    }
  };

  const handleCancelRequest = async (loanId) => {
    if (!window.confirm("Cancel this request?")) return;
    setCancelingRequestId(loanId);
    try {
      await cancelMyRequest(token, loanId);
      await refreshRequests();
    } catch (err) {
      setReqError(err?.message || err?.data?.error || "Failed to cancel request");
    } finally {
      setCancelingRequestId(null);
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

      <section style={{marginTop:10}}>
        <h1>Checkout Requests</h1>
        <p>View your current checkout requests.</p>
        <div className="loans-container">
          <div className="loans-header">
            <span>Requests: {requests.length}</span>
            {reqLoading && <span className="loading">Loading…</span>}
            {reqError && <span className="error">{reqError}</span>}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="loans-table">
              <thead>
                <tr>
                  <Th>Title</Th>
                  <Th>Requested</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr><td colSpan={4} className="loans-empty-state">{reqLoading ? "" : "No requests found."}</td></tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.loan_id}>
                      <Td title={r.item_title}>{r.item_title}</Td>
                      <Td>{formatDateTime(r.request_date)}</Td>
                      <Td>
                        <span className={`loans-status-badge ${r.status || 'pending'}`}>
                          {(r.status || 'pending') === 'rejected' ? 'denied' : (r.status || 'pending')}
                        </span>
                      </Td>
                      <Td>
                        <button
                          className="hold-cancel-btn"
                          onClick={() => handleCancelRequest(r.loan_id)}
                          disabled={cancelingRequestId === r.loan_id}
                        >
                          {cancelingRequestId === r.loan_id ? "Cancelling…" : "Cancel Request"}
                        </button>
                      </Td>
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
