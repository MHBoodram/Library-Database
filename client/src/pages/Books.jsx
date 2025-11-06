import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import NavBar from "../components/NavBar";
import { getItemCopies } from "../api";

export default function Books() {
  const { token, useApi, user } = useAuth();
  const apiWithAuth = useMemo(()=>useApi(),[useApi]);
  const navigate = useNavigate();

  const [mode, setMode] = useState("title"); // "title" | "author"
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [rows, setRows] = useState([]);
  const [openItemId, setOpenItemId] = useState(null);
  const [copies, setCopies] = useState([]);
  const [copiesLoading, setCopiesLoading] = useState(false);
  const [copiesError, setCopiesError] = useState("");
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
      // If no query, show the first page of items to make browsing easier
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (debounced) {
          if (mode === "title") params.set("title", debounced);
          if (mode === "author") params.set("author", debounced);
        }
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
    if (mode === "author") return "Search by Author";
    return "Search by Title";
  }, [mode]);

  async function toggleCopies(item_id) {
    if (openItemId === item_id) {
      setOpenItemId(null);
      setCopies([]);
      setCopiesError("");
      return;
    }
    setOpenItemId(item_id);
    setCopies([]);
    setCopiesError("");
    setCopiesLoading(true);
    try {
      const data = await getItemCopies(token, item_id);
      setCopies(Array.isArray(data) ? data : []);
    } catch (err) {
      setCopiesError(err?.message || "Failed to load copies.");
    } finally {
      setCopiesLoading(false);
    }
  }

  async function checkoutCopy(copy_id) {
    try {
      await apiWithAuth("loans/checkout", {
        method: "POST",
        body: { copy_id, user_id: user?.user_id, identifier_type: "copy_id" },
      });
      alert("Checked out! Your loan will appear in the Loans page.");
    } catch (err) {
      const code = err?.data?.error;
      const msg = err?.data?.message || err?.message;
      console.error("Checkout failed:", err?.status, code, msg, err?.data);
      if (code === "loan_limit_exceeded") {
        alert(msg || "You've reached your loan limit.");
      } else if (code === "copy_not_available") {
        alert(msg || "That copy is not available.");
      } else {
        alert(msg || "Checkout failed.");
      }
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "2rem auto", padding: 24 }}>
      <NavBar />
      <h1>Find Books</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>
        Browse by Title or Author
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
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 6 }}>{titleText}</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === "author" ? "e.g. Jane Austen" : "e.g. Pride and Prejudice"}
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
                <Th>Title</Th>
                <Th>Authors</Th>
                <Th>ISBN</Th>
                <Th>Publisher</Th>
                <Th>Year</Th>
                <Th>Subject</Th>
                <Th>Class</Th>
                <Th>Copies</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 12 }}>No results.</td></tr>
              ) : (
                rows.map((r) => (
                  <>
                    <tr key={r.item_id} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <Td style={{ maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={r.title}>
                        <Link to={`/books/${r.item_id}`} style={{ textDecoration: "none", color: "#2563eb" }}>
                          {r.title}
                        </Link>
                      </Td>
                      <Td style={{ maxWidth: 280, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={(r.authors||[]).join(", ")}>{(r.authors||[]).join(", ")}</Td>
                      <Td>{r.isbn || "—"}</Td>
                      <Td>{r.publisher || "—"}</Td>
                      <Td>{r.publication_year || "—"}</Td>
                      <Td>{r.subject || "—"}</Td>
                      <Td>{r.classification || "—"}</Td>
                      <Td>
                        <button onClick={() => toggleCopies(r.item_id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #222", background: "#222", color: "#fff" }}>
                          {openItemId === r.item_id ? "Hide" : "View"}
                        </button>
                      </Td>
                    </tr>
                    {openItemId === r.item_id && (
                      <tr>
                        <td colSpan={8} style={{ padding: 12, background: "#fafafa" }}>
                          {copiesLoading ? (
                            <div>Loading copies…</div>
                          ) : copiesError ? (
                            <div style={{ color: "#b91c1c" }}>{copiesError}</div>
                          ) : copies.length === 0 ? (
                            <div>No copies found.</div>
                          ) : (
                            <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                <thead>
                                  <tr>
                                    <Th>Copy</Th>
                                    <Th>Status</Th>
                                    <Th>Shelf</Th>
                                    <Th>Action</Th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {copies.map((c) => (
                                    <tr key={c.copy_id} style={{ borderTop: "1px solid #eee" }}>
                                      <Td>#{c.copy_id}{c.barcode ? ` (${c.barcode})` : ""}</Td>
                                      <Td style={{ textTransform: "capitalize" }}>{c.status}</Td>
                                      <Td>{c.shelf_location || "—"}</Td>
                                      <Td>
                                        {c.status === "available" ? (
                                          <button onClick={() => checkoutCopy(c.copy_id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #0b7", background: "#10b981", color: "#fff" }}>Checkout</button>
                                        ) : (
                                          <span style={{ color: "#666" }}>Unavailable</span>
                                        )}
                                      </Td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
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
