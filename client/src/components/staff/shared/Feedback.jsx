import "./Feedback.css";

export function ToastBanner({ toast, onDismiss }) {
  if (!toast) return null;
  const tone = toast.type || "info";
  return (
    <div className={`staff-toast staff-toast--${tone}`}>
      <span className="staff-toast__text">{toast.text}</span>
      <button
        type="button"
        className="staff-toast__dismiss"
        aria-label="Dismiss message"
        onClick={onDismiss}
      >
        ×
      </button>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div className="staff-confirm" role="dialog" aria-modal="true">
      <div className="staff-confirm__backdrop" onClick={onCancel} />
      <div className="staff-confirm__card">
        <h3>{title}</h3>
        {message && <p>{message}</p>}
        <div className="staff-confirm__actions">
          <button type="button" className="staff-confirm__button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`staff-confirm__button staff-confirm__button--${tone}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
