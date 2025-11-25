import { useCallback, useEffect, useMemo, useState } from "react";
import NavBar from "../components/NavBar";
import { useAuth } from "../AuthContext";
import { formatCurrency, formatDate } from "../utils";
import { getMyFines, payFine } from "../api";
import { ToastBanner } from "../components/staff/shared/Feedback";
import "./PayFines.css";

export default function PayFines() {
  const { token } = useAuth();
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState(null);
  const [paymentFine, setPaymentFine] = useState(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardName, setCardName] = useState("");

  const showToast = useCallback((payload) => {
    if (!payload) return;
    setToast({ id: Date.now(), ...payload });
  }, []);

  const closeToast = useCallback(() => setToast(null), []);

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

  const resetPaymentForm = () => {
    setCardNumber("");
    setCardCvv("");
    setCardExpiry("");
    setCardName("");
  };

  const handlePay = (fine) => {
    if (!fine?.fine_id || fine.outstanding <= 0) return;
    setPaymentFine(fine);
    resetPaymentForm();
  };

  const formatCardNumber = (value = "") => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 16);
    const groups = digitsOnly.match(/.{1,4}/g) || [];
    return groups.join(" ");
  };

  const formatExpiry = (value = "") => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const isExpiryCurrentOrFuture = (value = "") => {
    const match = value.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/);
    if (!match) return false;
    const month = Number(match[1]);
    const year = Number(match[2]);
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;
    return true;
  };

  const sanitizedCardNumber = cardNumber.replace(/\D/g, "");
  const isCardValid = sanitizedCardNumber.length === 16;
  const isCvvValid = /^[0-9]{3,4}$/.test(cardCvv.trim());
  const isExpiryValid = isExpiryCurrentOrFuture(cardExpiry.trim());
  const isNameValid = cardName.trim().length > 1;
  const canSubmitPayment = paymentFine && isCardValid && isCvvValid && isExpiryValid && isNameValid && !payingId;

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!paymentFine) return;
    if (!isCardValid) {
      showToast({ type: "error", text: "Enter a valid 16-digit card number." });
      return;
    }
    if (!isCvvValid) {
      showToast({ type: "error", text: "CVV must be 3 or 4 digits." });
      return;
    }
    if (!isExpiryValid) {
      showToast({ type: "error", text: "Use MM/YY for a current or future expiry date." });
      return;
    }
    if (!isNameValid) {
      showToast({ type: "error", text: "Card holder name is required." });
      return;
    }

    const amount = Number(paymentFine.outstanding).toFixed(2);
    setPayingId(paymentFine.fine_id);
    setMessage("");
    try {
      await payFine(token, paymentFine.fine_id);
      setMessage(`Fine #${paymentFine.fine_id} paid successfully.`);
      showToast({ type: "success", text: `Paid $${amount} for fine #${paymentFine.fine_id}.` });
      setPaymentFine(null);
      resetPaymentForm();
      await fetchFines();
    } catch (err) {
      const msg = err?.data?.error || err?.message || "Payment failed.";
      setError(msg);
      showToast({ type: "error", text: msg });
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="pay-fines-page">
      <NavBar />
      <main className="pay-fines-content">
        <ToastBanner toast={toast} onDismiss={closeToast} />
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
      {paymentFine && (
        <div className="pay-fines-modal">
          <div className="pay-fines-modal__backdrop" onClick={() => setPaymentFine(null)} />
          <div className="pay-fines-modal__card">
            <header className="pay-fines-modal__header">
              <div>
                <p className="pay-fines-modal__eyebrow">Pay fine #{paymentFine.fine_id}</p>
                <h3>{formatCurrency(paymentFine.outstanding)}</h3>
                <p className="pay-fines-modal__item">{paymentFine.item_title || "Library item"}</p>
              </div>
              <button type="button" className="pay-fines-modal__close" onClick={() => setPaymentFine(null)}>
                ✕
              </button>
            </header>
            <form onSubmit={submitPayment} className="pay-fines-modal__form" autoComplete="off">
              <label className="pay-fines-field">
                <span>Card number</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder=""
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  autoComplete="off"
                  required
                />
                {!isCardValid && cardNumber && <small className="pay-fines-field__error">Enter exactly 16 digits.</small>}
              </label>
              <div className="pay-fines-modal__row">
                <label className="pay-fines-field">
                  <span>CVV</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder=""
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    maxLength={4}
                    autoComplete="off"
                    required
                  />
                  {!isCvvValid && cardCvv && <small className="pay-fines-field__error">3-4 digits.</small>}
                </label>
                <label className="pay-fines-field">
                  <span>Expiry (MM/YY)</span>
                  <input
                    type="text"
                    placeholder=""
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    maxLength={5}
                    pattern="(0[1-9]|1[0-2])/[0-9]{2}"
                    autoComplete="off"
                  required
                />
                {!isExpiryValid && cardExpiry && <small className="pay-fines-field__error">Use MM/YY for a current or future date.</small>}
                </label>
              </div>
              <label className="pay-fines-field">
                <span>Card holder name</span>
                <input
                  type="text"
                  placeholder=""
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  autoComplete="off"
                  required
                />
                {!isNameValid && cardName && <small className="pay-fines-field__error">Required.</small>}
              </label>
              <div className="pay-fines-modal__actions">
                <button type="button" className="pay-fines-modal__btn pay-fines-modal__btn--ghost" onClick={() => setPaymentFine(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pay-fines-modal__btn pay-fines-modal__btn--primary"
                  disabled={!canSubmitPayment}
                >
                  {payingId === paymentFine.fine_id ? "Processing…" : `Pay ${formatCurrency(paymentFine.outstanding)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
