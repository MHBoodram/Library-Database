import { useEffect,useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import NavBar from "../components/NavBar";
import { formatDate } from "../utils";
import "./Loans.css";

export default function Loans() {
  const { token, useApi } = useAuth();
  const apiWithAuth = useMemo(()=>useApi(),[useApi]);
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiWithAuth("loans/my");
        const list = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : [];
        if (!active) return;
        setRows(list);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load your loans.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [token, apiWithAuth, navigate]);

  return (
    <div className="loans-page">
      <NavBar />
      <h1>Your Loans</h1>
      <p>View your current and past loans. Return actions are handled at the desk.</p>

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
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={4} className="loans-empty-state">{loading ? "" : "No loans found."}</td></tr>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children }) {
  return <th>{children}</th>;
}
function Td({ children, ...props }) {
  return <td {...props}>{children}</td>;
}
