import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../AuthContext";
import NavBar from "../components/NavBar";
import { formatDateTime, formatDate } from "../utils";
import "./ManageAccounts.css";

const ACCOUNT_ROLE_OPTIONS = ["student", "faculty", "staff", "admin"];
const EMPLOYEE_ROLE_OPTIONS = ["librarian", "clerk", "assistant", "admin"];

const PLACEHOLDERS = {
  all: "Search by name, email, or ID",
  fullname: "Enter full name (First Last)",
  firstname: "Enter first name",
  lastname: "Enter last name",
  email: "Enter email address",
  id: "Enter user ID",
};

export default function ManageAccounts() {
  const { useApi } = useAuth();
  const [debounced, setDebounced] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [flaggingId, setFlaggingId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        params.set("mode", mode);
        if (debounced) params.set("term", debounced);
        const data = await useApi(`manage/accounts?${params.toString()}`);
        if (!alive) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!alive) return;
        setError(err?.data?.error || err?.message || "Failed to load accounts.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [useApi, debounced, mode, refreshKey]);

  const placeholder = PLACEHOLDERS[mode] || PLACEHOLDERS.all;

  const startEdit = (row) => {
    setEditingId(row.account_id);
    setEditForm({
      first_name: row.first_name || "",
      last_name: row.last_name || "",
      role: row.role,
      is_active: row.is_active ? "1" : "0",
      employee_role: row.employee_role || "assistant",
    });
    setMessage({ type: "", text: "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleSave = async (row) => {
    if (!useApi) return;
    const payload = {};
    if (editForm.first_name && editForm.first_name !== row.first_name) payload.first_name = editForm.first_name.trim();
    if (editForm.last_name && editForm.last_name !== row.last_name) payload.last_name = editForm.last_name.trim();
    if (editForm.role && editForm.role !== row.role) payload.role = editForm.role;
    if (editForm.is_active !== undefined && (row.is_active ? "1" : "0") !== editForm.is_active) {
      payload.is_active = editForm.is_active === "1";
    }
    if (row.employee_id && editForm.employee_role && editForm.employee_role !== row.employee_role) {
      payload.employee_role = editForm.employee_role;
    }

    if (!Object.keys(payload).length) {
      setMessage({ type: "info", text: "No changes to save." });
      cancelEdit();
      return;
    }

    setSavingId(row.account_id);
    try {
      await useApi(`manage/accounts/${row.account_id}`, { method: "PATCH", body: payload });
      setMessage({ type: "success", text: "Account updated." });
      cancelEdit();
      refresh();
    } catch (err) {
      setMessage({ type: "error", text: err?.data?.error || err?.message || "Failed to update account." });
    } finally {
      setSavingId(null);
    }
  };

  const handleFlag = async (row) => {
    if (row.flagged_for_deletion) return;
    if (!window.confirm(`Flag ${row.email} for deletion?`)) return;
    setFlaggingId(row.account_id);
    try {
      await useApi(`manage/accounts/${row.account_id}/flag`, { method: "POST" });
      setMessage({ type: "success", text: "Account flagged for deletion." });
      refresh();
    } catch (err) {
      setMessage({ type: "error", text: err?.data?.error || err?.message || "Failed to flag account." });
    } finally {
      setFlaggingId(null);
    }
  };

  return (
    <div className="manage-accounts-page">
      <NavBar />
      <div className="manage-accounts-content">
        <header>
          <h1>Account Manager</h1>
          <p>Search, update, or flag patron and staff accounts.</p>
        </header>

        <section className="search-bar">
          <div className="mode-select">
            <label htmlFor="mode-dropdown">Search by</label>
            <select id="mode-dropdown" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="all">All</option>
              <option value="fullname">Full Name</option>
              <option value="firstname">First Name</option>
              <option value="lastname">Last Name</option>
              <option value="email">Email</option>
              <option value="id">ID</option>
            </select>
          </div>
          <input
            id="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
          />
        </section>

        {message.text && (
          <div className={`notice notice-${message.type || "info"}`}>
            {message.text}
          </div>
        )}
        {error && (
          <div className="notice notice-error">{error}</div>
        )}

        <div className="accounts-card">
          <div className="accounts-card__header">
            <span>{loading ? "Loading accounts…" : `${rows.length} account${rows.length === 1 ? "" : "s"}`}</span>
          </div>
          <div className="accounts-table-wrapper">
            <table className="accounts-table">
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                  <Th>Flag</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {!rows.length && !loading ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 12 }}>No accounts found.</td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const isEditing = editingId === row.account_id;
                    return (
                      <tr
                        key={row.account_id}
                        className={row.flagged_for_deletion ? "flagged-row" : ""}
                      >
                        <Td>#{row.account_id}</Td>
                        <Td>
                          {isEditing ? (
                            <div className="edit-name-fields">
                              <input
                                value={editForm.first_name || ""}
                                onChange={(e) => handleEditChange("first_name", e.target.value)}
                                placeholder="First"
                              />
                              <input
                                value={editForm.last_name || ""}
                                onChange={(e) => handleEditChange("last_name", e.target.value)}
                                placeholder="Last"
                              />
                            </div>
                          ) : (
                            <>
                              <div>{row.first_name} {row.last_name}</div>
                            </>
                          )}
                        </Td>
                        <Td>{row.email}</Td>
                        <Td>
                          {isEditing ? (
                            <select value={editForm.role} onChange={(e) => handleEditChange("role", e.target.value)}>
                              {ACCOUNT_ROLE_OPTIONS.map((role) => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          ) : (
                            <span>{row.role}</span>
                          )}
                          {row.employee_id && (
                            <div className="employee-role">
                              {isEditing ? (
                                <select
                                  value={editForm.employee_role}
                                  onChange={(e) => handleEditChange("employee_role", e.target.value)}
                                >
                                  {EMPLOYEE_ROLE_OPTIONS.map((role) => (
                                    <option key={role} value={role}>{role}</option>
                                  ))}
                                </select>
                              ) : (
                                <small>Employee: {row.employee_role || "—"}</small>
                              )}
                            </div>
                          )}
                        </Td>
                        <Td>
                          {isEditing ? (
                            <select
                              value={editForm.is_active}
                              onChange={(e) => handleEditChange("is_active", e.target.value)}
                            >
                              <option value="1">Active</option>
                              <option value="0">Inactive</option>
                            </select>
                          ) : (
                            <span className={row.is_active ? "status-badge active" : "status-badge inactive"}>
                              {row.is_active ? "Active" : "Inactive"}
                            </span>
                          )}
                        </Td>
                        <Td>{formatDateTime(row.created_at)}</Td>
                        <Td>
                          {row.flagged_for_deletion ? (
                            <span className="flagged-badge">
                              Flagged {formatDate(row.flagged_at)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </Td>
                        <Td>
                          {isEditing ? (
                            <div className="row-actions">
                              <button
                                className="action-btn primary"
                                onClick={() => handleSave(row)}
                                disabled={savingId === row.account_id}
                              >
                                {savingId === row.account_id ? "Saving…" : "Save"}
                              </button>
                              <button className="action-btn" onClick={cancelEdit} disabled={savingId === row.account_id}>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="row-actions">
                              <button className="action-btn" onClick={() => startEdit(row)}>
                                Edit
                              </button>
                              <button
                                className="action-btn danger"
                                disabled={row.flagged_for_deletion || flaggingId === row.account_id}
                                onClick={() => handleFlag(row)}
                              >
                                {row.flagged_for_deletion
                                  ? "Flagged"
                                  : flaggingId === row.account_id
                                  ? "Flagging…"
                                  : "Flag Delete"}
                              </button>
                            </div>
                          )}
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Th({ children }) {
  return <th>{children}</th>;
}

function Td({ children }) {
  return <td>{children}</td>;
}
