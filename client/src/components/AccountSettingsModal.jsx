import { useEffect, useState } from "react";
import "./AccountSettingsModal.css";

const MIN_PASSWORD_LENGTH = 8;

export default function AccountSettingsModal({ open, onClose, onSubmit, user, submitting, error, success }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) return;
    setFirstName(user?.first_name || "");
    setLastName(user?.last_name || "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setLocalError("");
  }, [open, user]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError("");

    if (!firstName.trim() || !lastName.trim()) {
      setLocalError("First and last name are required.");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setLocalError("New passwords do not match.");
      return;
    }

    if (newPassword && newPassword.length < MIN_PASSWORD_LENGTH) {
      setLocalError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    const payload = { first_name: firstName.trim(), last_name: lastName.trim() };
    if (newPassword) payload.new_password = newPassword;
    if (newPassword) payload.current_password = currentPassword;

    onSubmit(payload);
  };

  return (
    <div className="account-modal-backdrop" role="dialog" aria-modal="true">
      <div className="account-modal">
        <div className="account-modal__header">
          <h2>Account Settings</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="account-modal__close">×</button>
        </div>
        <form onSubmit={handleSubmit} className="account-modal__body">
          <label>
            <span>First name</span>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </label>
          <label>
            <span>Last name</span>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </label>

          <div className="account-modal__password">
            <p className="hint">Change password</p>
            <label>
              <span>Current password</span>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Required if changing password" />
            </label>
            <label>
              <span>New password</span>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </label>
            <label>
              <span>Confirm new password</span>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </label>
          </div>

          {(localError || error) && <p className="error">{localError || error}</p>}
          {success && <p className="success">{success}</p>}

          <div className="account-modal__actions">
            <button type="button" onClick={onClose} className="secondary">Cancel</button>
            <button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
