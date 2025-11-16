import { useEffect, useState } from "react";
import "./AccountSettingsModal.css";

const MIN_PASSWORD_LENGTH = 8;

export default function AccountSettingsModal({ open, onClose, onSubmit, user, submitting, error, success }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) return;
    setFirstName(user?.first_name || "");
    setLastName(user?.last_name || "");
    setPhone(user?.phone || "");
    setAddress(user?.address || "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setLocalError("");
  }, [open, user]);

  if (!open) return null;

  // Patrons (students and teachers/faculty) cannot change their names
  const isPatron = user?.role === 'student' || user?.role === 'teacher';

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

    const payload = {};
    // Only include name changes if user is not a patron
    if (!isPatron) {
      payload.first_name = firstName.trim();
      payload.last_name = lastName.trim();
    }
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();
    if (trimmedPhone !== (user?.phone || "")) {
      payload.phone = trimmedPhone;
    }
    if (trimmedAddress !== (user?.address || "")) {
      payload.address = trimmedAddress;
    }
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
            <input 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)} 
              required 
              disabled={isPatron}
              title={isPatron ? "Students and faculty cannot change their name" : ""}
            />
          </label>
          <label>
            <span>Last name</span>
            <input 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)} 
              required 
              disabled={isPatron}
              title={isPatron ? "Students and faculty cannot change their name" : ""}
            />
          </label>
          {isPatron && (
            <p className="hint" style={{ marginTop: '-8px', marginBottom: '12px', fontSize: '0.875rem', color: '#666' }}>
              Students and faculty cannot change their name. Please contact library staff if your name needs to be updated.
            </p>
          )}

          <div className="account-modal__contact">
            <p className="hint">Contact information</p>
            <label>
              <span>Phone number</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </label>
            <label>
              <span>Address</span>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, City, State, ZIP"
                rows={3}
              />
            </label>
          </div>

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
