import { useEffect, useState } from "react";
import { getItems, addItem } from "./api";

export default function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getItems();
        setItems(data);
      } catch (e) {
        setErr(e.message || "Error loading items");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const created = await addItem(trimmed);
      setItems(prev => [{ id: created.id, name: created.name }, ...prev]);
      setName("");
    } catch (e) {
      setErr(e.message || "Error adding item");
    }
  }

  if (loading) return <p style={{ padding: 16 }}>Loading…</p>;

  return (
    <div style={{ maxWidth: 560, margin: "2rem auto", padding: 16 }}>
      <h1>Items</h1>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <form onSubmit={onSubmit} style={{ marginBottom: 16 }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="New item name"
          style={{ padding: 8, marginRight: 8 }}
        />
        <button type="submit">Add</button>
      </form>

      <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>
    </div>
  );
}

