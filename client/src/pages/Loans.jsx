import { useEffect,useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import NavBar from "../components/NavBar";
import { formatDate } from "../utils";

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
    <div style={{ maxWidth: 1000, margin: "2rem auto", padding: 24 }}>
      <NavBar />
      <h1>Your Loans</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>View your current and past loans. Return actions are handled at the desk.</p>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: 12, background: "#f8fafc", display: "flex", justifyContent: "space-between", fontSize: 14 }}>
          <span>Loans: {rows.length}</span>
          {loading && <span>Loading…</span>}
          {error && <span style={{ color: "#b91c1c" }}>{error}</span>}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead style={{ background: "#f1f5f9" }}>
              <tr>
                <Th>Title</Th>
                <Th>Copy</Th>
                <Th>Due Date</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 12 }}>{loading ? "" : "No loans found."}</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.loan_id} style={{ borderTop: "1px solid #e5e7eb" }}>
                    <Td title={r.item_title}>{r.item_title}</Td>
                    <Td>{r.copy_barcode ? `#${r.copy_id} (${r.copy_barcode})` : `#${r.copy_id}`}</Td>
                    <Td>{formatDate(r.due_date)}</Td>
                    <Td style={{ textTransform: "capitalize" }}>{r.status}</Td>
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
  return (
    <th style={{ textAlign: "left", padding: 10, borderRight: "1px solid #e5e7eb" }}>{children}</th>
  );
}
function Td({ children }) {
  return (
    <td style={{ padding: 10, borderRight: "1px solid #f1f5f9" }}>{children}</td>
  );
}
