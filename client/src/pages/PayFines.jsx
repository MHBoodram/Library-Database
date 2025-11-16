import { useCallback, useEffect, useMemo, useState } from "react";
import NavBar from "../components/NavBar";
import { useAuth } from "../AuthContext";
import { formatCurrency, formatDate } from "../utils";
import { getMyFines, payFine } from "../api";
import "./PayFines.css";

export default function PayFines() {
  const { token } = useAuth();
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);
  const [message, setMessage] = useState("");

  const fetchFines = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await getMyFines(token);
      const rows = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : [];
      setFines(rows);
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to load fines.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  const outstandingTotal = useMemo(
    () => fines.reduce((sum, fine) => sum + Number(fine.outstanding || 0), 0),
    [fines]
  );

  const handlePay = async (fine) => {
    if (!fine?.fine_id || fine.outstanding <= 0) return;
    const confirmMsg = `Pay $${Number(fine.outstanding).toFixed(2)} for fine #${fine.fine_id}?`;
    if (!window.confirm(confirmMsg)) return;
    setPayingId(fine.fine_id);
    setMessage("");
    try {
      await payFine(token, fine.fine_id);
      setMessage(`Fine #${fine.fine_id} paid successfully.`);
      await fetchFines();
    } catch (err) {
      setError(err?.data?.error || err?.message || "Payment failed.");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="pay-fines-page">
      <NavBar />
      <main className="pay-fines-content">
        <header className="pay-fines-header">
          <div>
            <h1>Pay Fines</h1>
            <p>Review outstanding fines and pay them in full.</p>
          </div>
          <div className="pay-fines-summary">
            <span>Total outstanding</span>
            <strong>{formatCurrency(outstandingTotal)}</strong>
          </div>
        </header>

        {message && <div className="notice notice-success">{message}</div>}
        {error && <div className="notice notice-error">{error}</div>}

        <div className="pay-fines-card">
          <div className="pay-fines-table-wrapper">
            <table>
            <thead>
              <tr>
                <th>Fine ID</th>
                <th>Item</th>
                <th>Reason</th>
                <th>Assessed</th>
                <th>Status</th>
                <th>Outstanding</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="pay-fines-empty">Loading fines…</td>
                </tr>
              ) : fines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="pay-fines-empty">You have no fines.</td>
                </tr>
              ) : (
                fines.map((fine) => (
                  <tr key={fine.fine_id}>
                    <td>#{fine.fine_id}</td>
                    <td>
                      <div className="fine-item-title">{fine.item_title || "—"}</div>
                      <div className="fine-loan-meta">Loan #{fine.loan_id || "—"} · Due {formatDate(fine.due_date)}</div>
                    </td>
                    <td>{fine.reason || "—"}</td>
                    <td>{formatCurrency(fine.amount_assessed)}</td>
                    <td className={`status-chip status-${String(fine.status || "").toLowerCase()}`}>{fine.status}</td>
                    <td>{formatCurrency(fine.outstanding)}</td>
                    <td>
                      <button
                        className="pay-fines-btn"
                        disabled={!fine.payable || payingId === fine.fine_id}
                        onClick={() => handlePay(fine)}
                      >
                        {fine.payable
                          ? payingId === fine.fine_id
                            ? "Processing…"
                            : `Pay ${formatCurrency(fine.outstanding)}`
                          : "Settled"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
