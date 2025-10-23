const API_BASE = import.meta.env.VITE_API_BASE;

async function api(path, init = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    ...init,
  });
  // Try to read JSON either way
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error || res.statusText || "Request failed");
  }
  return body;
}

export async function getItems() {
  return api("/items");                   // returns array
}

export async function addItem(name) {
  return api("/items", {
    method: "POST",
    body: JSON.stringify({ name }),
  });                                     // returns created row
}

// (You can also export api for /auth routes elsewhere)
export { api };
