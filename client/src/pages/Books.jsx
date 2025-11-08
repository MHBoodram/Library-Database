import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import NavBar from "../components/NavBar";
import { getItemCopies } from "../api";
import "./Books.css";

export default function Books() {
  const { token, useApi, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

  // Initialize search from URL parameters
  useEffect(() => {
    const titleParam = searchParams.get('title');
    const authorParam = searchParams.get('author');
    const qParam = searchParams.get('q');
    
    if (titleParam) {
      setMode('title');
      setQuery(titleParam);
    } else if (authorParam) {
      setMode('author');
      setQuery(authorParam);
    } else if (qParam) {
      setMode('title');
      setQuery(qParam);
    }
  }, [searchParams]);

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
        const data = await useApi(`items?${params.toString()}`);
        const listRaw = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
        // derive copy counts (active vs available) if backend returns copies array or counts
        const list = listRaw.map(r => {
          const copies = Array.isArray(r.copies) ? r.copies : [];
          const activeCopies = copies.filter(c => (c.status || '').toLowerCase() !== 'lost');
          const availableCopies = activeCopies.filter(c => (c.status || '').toLowerCase() === 'available');
          return {
            ...r,
            total_copies: activeCopies.length || r.total_copies || r.copy_count || 0,
            available_copies: availableCopies.length || r.available_copies || r.available_count || 0,
          };
        });
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
  }, [debounced, mode, useApi]);

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
      await useApi("loans/checkout", {
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
    <div className="books-page">
      <NavBar />
      <h1>Find Books</h1>
      <p>Browse by Title or Author</p>

      <div className="books-search-controls">
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 6 }}>Mode</label>
          <div className="books-mode-selector">
            <button
              onClick={() => setMode("title")}
              className={`books-mode-btn ${mode === "title" ? "active" : ""}`}
            >Title</button>
            <button
              onClick={() => setMode("author")}
              className={`books-mode-btn ${mode === "author" ? "active" : ""}`}
            >Author</button>
          </div>
        </div>
        <div className="books-search-input-wrapper">
          <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 6 }}>{titleText}</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === "author" ? "e.g. Jane Austen" : "e.g. Pride and Prejudice"}
            className="books-search-input"
          />
        </div>
      </div>

      <div className="books-results-container">
        <div className="books-results-header">
          <span>Results: {rows.length}</span>
          {loading && <span className="loading">Loading…</span>}
          {error && <span className="error">{error}</span>}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="books-table">
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Authors</Th>
                <Th>ISBN</Th>
                <Th>Publisher</Th>
                <Th>Year</Th>
                <Th>Subject</Th>
                {/* Classification removed per request */}
                <Th>Copies (Avail / Total)</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="books-empty-state">No results.</td></tr>
              ) : (
                rows.map((r) => (
                  <>
                    <tr key={r.item_id}>
                      <Td style={{ maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={r.title}>
                        <Link to={`/books/${r.item_id}`} className="book-title-link">
                          {r.title}
                        </Link>
                      </Td>
                      <Td style={{ maxWidth: 280, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={(r.authors||[]).join(", ")}>{(r.authors||[]).join(", ")}</Td>
                      <Td>{r.isbn || "—"}</Td>
                      <Td>{r.publisher || "—"}</Td>
                      <Td>{r.publication_year || "—"}</Td>
                      <Td>{r.subject || "—"}</Td>
                      {/* Classification column removed */}
                      <Td>
                        <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                          <span style={{fontSize:12,color:'#444'}}>{r.available_copies}/{r.total_copies}</span>
                          <button onClick={() => toggleCopies(r.item_id)} className="books-view-copies-btn">
                            {openItemId === r.item_id ? "Hide" : "View"}
                          </button>
                        </div>
                      </Td>
                    </tr>
                    {openItemId === r.item_id && (
                      <tr className="books-copies-row">
                        <td colSpan={7}>
                          {copiesLoading ? (
                            <div className="books-loading">Loading copies…</div>
                          ) : copiesError ? (
                            <div className="books-error">{copiesError}</div>
                          ) : copies.length === 0 ? (
                            <div className="books-empty-state">No copies found.</div>
                          ) : (
                            <div style={{ overflowX: "auto" }}>
                              <table className="books-copies-table">
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
                                    <tr key={c.copy_id}>
                                      <Td>#{c.copy_id}{c.barcode ? ` (${c.barcode})` : ""}</Td>
                                      <Td>
                                        <span className={`books-status-badge ${c.status}`}>
                                          {c.status}
                                        </span>
                                      </Td>
                                      <Td>{c.shelf_location || "—"}</Td>
                                      <Td>
                                        {c.status === "available" ? (
                                          <button onClick={() => checkoutCopy(c.copy_id)} className="books-checkout-btn">Checkout</button>
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
  return <th>{children}</th>;
}
function Td({ children, ...props }) {
  return <td {...props}>{children}</td>;
}
