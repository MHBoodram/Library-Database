import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Books() {
  const { token, useApi } = useAuth();
  const apiWithAuth = useApi();
  const navigate = useNavigate();

  const [mode, setMode] = useState("title"); // "id" | "title" | "author"
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // redirect if not logged in
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let active = true;
    async function run() {
      if (!debounced) { setRows([]); setError(""); return; }
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (mode === "id") params.set("id", debounced);
        if (mode === "title") params.set("title", debounced);
        if (mode === "author") params.set("author", debounced);
        const data = await apiWithAuth(`items?${params.toString()}`);
        const list = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
        if (!active) return;
        setRows(list);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to search items");
      } finally {
        if (active) setLoading(false);
      }
    }
    run();
    return () => { active = false; };
  }, [debounced, mode, apiWithAuth]);

  const titleText = useMemo(() => {
    if (mode === "id") return "Search by Item ID";
    if (mode === "author") return "Search by Author";
    return "Search by Title";
  }, [mode]);

  return (
    <div style={{ maxWidth: 1000, margin: "2rem auto", padding: 24 }}>
      <h1>Find Books</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>
        Search by Item ID, Title, or Author's full name.
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 6 }}>Mode</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setMode("title")}
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", background: mode === "title" ? "#222" : "#f3f4f6", color: mode === "title" ? "#fff" : "#111" }}
            >Title</button>
            <button
              onClick={() => setMode("author")}
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", background: mode === "author" ? "#222" : "#f3f4f6", color: mode === "author" ? "#fff" : "#111" }}
            >Author</button>
            <button
              onClick={() => setMode("id")}
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", background: mode === "id" ? "#222" : "#f3f4f6", color: mode === "id" ? "#fff" : "#111" }}
            >Item ID</button>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 6 }}>{titleText}</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === "id" ? "e.g. 123" : mode === "author" ? "e.g. Jane Austen" : "e.g. Pride and Prejudice"}
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
          />
        </div>
      </div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: 12, background: "#f8fafc", display: "flex", justifyContent: "space-between", fontSize: 14 }}>
          <span>Results: {rows.length}</span>
          {loading && <span>Loading…</span>}
          {error && <span style={{ color: "#b91c1c" }}>{error}</span>}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead style={{ background: "#f1f5f9" }}>
              <tr>
                <Th>Item ID</Th>
                <Th>Title</Th>
                <Th>Authors</Th>
                <Th>ISBN</Th>
                <Th>Publisher</Th>
                <Th>Year</Th>
                <Th>Subject</Th>
                <Th>Class</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 12 }}>No results.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.item_id} style={{ borderTop: "1px solid #e5e7eb" }}>
                    <Td>#{r.item_id}</Td>
                    <Td style={{ maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={r.title}>{r.title}</Td>
                    <Td style={{ maxWidth: 280, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={(r.authors||[]).join(", ")}>{(r.authors||[]).join(", ")}</Td>
                    <Td>{r.isbn || "—"}</Td>
                    <Td>{r.publisher || "—"}</Td>
                    <Td>{r.publication_year || "—"}</Td>
                    <Td>{r.subject || "—"}</Td>
                    <Td>{r.classification || "—"}</Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children }) {
  return (
    <th style={{ textAlign: "left", padding: 10, borderRight: "1px solid #e5e7eb" }}>{children}</th>
  );
}
function Td({ children }) {
  return (
    <td style={{ padding: 10, borderRight: "1px solid #f1f5f9" }}>{children}</td>
  );
}

