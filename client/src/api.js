// src/api.js
const RAW_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";
const API_BASE = RAW_BASE.replace(/\/+$/, ""); // strip trailing slashes

export function join(path) {
  const p = String(path || "").replace(/^\/+/, ""); // strip leading slashes
  return `${API_BASE}/${p}`;
}

// define the function first...
async function api(path, { method = "GET", body, token, headers, signal } = {}) {
  const url = join(path);
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    ...(signal ? { signal } : {}),
    body: body && typeof body === "object" ? JSON.stringify(body) : body,
  });

  let data = {};
  try { data = await res.json(); } catch { /* ignore non-JSON responses */ }
  if (!res.ok) {
    const err = new Error(data?.error || res.statusText || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ---- Feature helpers ----

// items
export const getItems = (token) =>
  api("/items", { token }); // GET /api/items → array

export const addItem = (token, payload) =>
  api("/items", {
    method: "POST",
    token,
    body: payload,
  });

export const updateItem = (token, id, patch) =>
  api(`/items/${id}`, { method: "PUT", token, body: patch });

export const deleteItem = (token, id) =>
  api(`/items/${id}`, { method: "DELETE", token });

// auth (example)
export const login = (email, password) =>
  api("/auth/login", { method: "POST", body: { email, password } });

export const createReservation = (token, payload) =>
  api("/staff/reservations", { method: "POST", token, body: payload });

export const listReservations = (token, params = {}) => {
  const qs = new URLSearchParams(params);
  const path = qs.toString() ? `/staff/reservations?${qs.toString()}` : "/staff/reservations";
  return api(path, { token });
};

export const createAdminManagedAccount = (token, payload) =>
  api("/admin/accounts", { method: "POST", token, body: payload });

export const updateManagedAccount = (token, accountId, payload) =>
  api(`/manage/accounts/${accountId}`, { method: "PATCH", token, body: payload });

export const flagManagedAccount = (token, accountId) =>
  api(`/manage/accounts/${accountId}/flag`, { method: "POST", token });

export const searchPatrons = (token, q) =>
  api(`/staff/patrons/search?q=${encodeURIComponent(q)}`, { token });

export const createRoom = (token, payload) =>
  api("/staff/rooms", { method: "POST", token, body: payload });

export const fetchProfile = (token) => api("/me", { token });

export const updateProfile = (token, payload) =>
  api("/me", { method: "PATCH", token, body: payload });

// copies per item
export const getItemCopies = (token, item_id) =>
  api(`/items/${item_id}/copies`, { token });

// my loans
export const getMyLoans = (token) => api("/loans/my", { token });

export const getAccounts = (token) => api("/manage/accounts", { token })

export default api;
export { api, API_BASE };
