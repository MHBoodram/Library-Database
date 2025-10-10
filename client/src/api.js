const API_BASE = import.meta.env.VITE_API_BASE;

export async function getItems() {
  const res = await fetch(`${API_BASE}/items`);
  if (!res.ok) throw new Error("Failed to fetch items");
  return res.json();
}

export async function addItem(name) {
  const res = await fetch(`${API_BASE}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error("Failed to add item");
  return res.json();
}
