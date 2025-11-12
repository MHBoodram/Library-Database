import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import NavBar from "../components/NavBar";
import { getItemCopies, placeHold } from "../api";
import "./Books.css";
import { getCustomCoverForTitle, DEFAULT_BOOK_PLACEHOLDER } from "../coverImages";

// Helper to generate cover image URL
function getCoverImage(item) {
  // Prioritize manual cover_image_url
  if (item.cover_image_url) {
    return item.cover_image_url;
  }
  // Fall back to Open Library if ISBN exists
  if (item.isbn) {
    return `https://covers.openlibrary.org/b/isbn/${item.isbn}-L.jpg`;
  }
  // Fallback placeholder based on item type
  const type = (item.item_type || 'book').toLowerCase();
  const emoji = type === 'device' ? '💻' : type === 'media' ? '🎬' : '📚';
  return `https://via.placeholder.com/200x300/187772/ffffff?text=${emoji}`;
}

// Enhanced cover resolver with local mapping and placeholder
function getCoverImageSmart(item) {
  const custom = getCustomCoverForTitle(item?.title);
  if (custom) return custom;
  if (item?.cover_image_url) return item.cover_image_url;
  if (item?.isbn) return `https://covers.openlibrary.org/b/isbn/${item.isbn}-L.jpg`;
  return DEFAULT_BOOK_PLACEHOLDER;
}

export default function Books() {
  const { token, user } = useAuth();
  const apiWithAuth = useAuth().useApi;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selectedType, setSelectedType] = useState("all"); // all | book | device | media
  const [selectedSubject, setSelectedSubject] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [copies, setCopies] = useState([]);
  const [copiesLoading, setCopiesLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [holdLoading, setHoldLoading] = useState(false);
  const [holdMessage, setHoldMessage] = useState("");

  // Get unique subjects for filter
  const subjects = [...new Set(items.map(i => i.subject).filter(Boolean))].sort();

  // Initialize from URL
  useEffect(() => {
    const titleParam = searchParams.get('title');
    const qParam = searchParams.get('q');
    if (titleParam || qParam) {
      setSearchQuery(titleParam || qParam);
    }
  }, [searchParams]);

  // Auth check
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch items
  useEffect(() => {
    let active = true;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (debounced) params.set("q", debounced);
        const data = await apiWithAuth(`items?${params.toString()}`);
        const listRaw = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
        
        const list = listRaw.map(r => ({
          ...r,
          total_copies: r.total_copies || 0,
          available_copies: r.available_copies || 0,
        }));
        
        if (!active) return;
        setItems(list);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load items");
      } finally {
        if (active) setLoading(false);
      }
    }
    run();
    return () => { active = false; };
  }, [debounced, apiWithAuth]);

  // Filter items
  const filteredItems = items.filter(item => {
    if (selectedType !== "all" && item.item_type !== selectedType) return false;
    if (selectedSubject && item.subject !== selectedSubject) return false;
    return true;
  });

  // Open item modal
  async function openItemModal(item) {
    console.log('[Books] Opening modal for item:', item);
    console.log('[Books] Description:', item.description);
    setSelectedItem(item);
    setCopies([]);
    setCopiesLoading(true);
    try {
      const data = await getItemCopies(token, item.item_id);
      setCopies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load copies:", err);
    } finally {
      setCopiesLoading(false);
    }
  }

  function closeModal() {
    setSelectedItem(null);
    setCopies([]);
    setHoldMessage("");
    setHoldLoading(false);
  }

  async function checkoutCopy(copy_id) {
    setCheckoutLoading(true);
    try {
      await apiWithAuth("loans/request", {
        method: "POST",
        body: { copy_id, user_id: user?.user_id, identifier_type: "copy_id" },
      });
      alert(`Successfully requested "${selectedItem.title}"! View it in My Loans.`);
      closeModal();
    } catch (err) {
      const code = err?.data?.error;
      const msg = err?.data?.message || err?.message;
      if (code === "loan_limit_exceeded") {
        alert(msg || "You've reached your loan limit.");
      } else if (code === "copy_not_available") {
        alert(msg || "That copy is not available.");
      } else {
        alert(msg || "Checkout failed.");
      }
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function placeHoldForItem(item) {
    if (!item) return;
    setHoldLoading(true);
    setHoldMessage("");
    try {
      await placeHold(token, item.item_id);
      setHoldMessage("Hold placed! We'll notify you when a copy is ready.");
    } catch (err) {
      const msg = err?.data?.message || err?.message || "Failed to place hold.";
      setHoldMessage(msg);
    } finally {
      setHoldLoading(false);
    }
  }

  return (
    <div className="catalog-page">
      <NavBar />
      
      <div className="catalog-header">
        <div className="catalog-hero">
          <h1>Library Catalog</h1>
          <p>Discover books, devices, and media from our collection</p>
        </div>

        {/* Search Bar */}
        <div className="catalog-search-bar">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, author, or subject..."
            className="catalog-search-input"
          />
          <button className="catalog-search-btn">
            🔍 Search
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="catalog-filters">
        <div className="catalog-type-tabs">
          <button
            onClick={() => setSelectedType("all")}
            className={`catalog-tab ${selectedType === "all" ? "active" : ""}`}
          >
            All Items
          </button>
          <button
            onClick={() => setSelectedType("book")}
            className={`catalog-tab ${selectedType === "book" ? "active" : ""}`}
          >
            Books
          </button>
          <button
            onClick={() => setSelectedType("device")}
            className={`catalog-tab ${selectedType === "device" ? "active" : ""}`}
          >
            Devices
          </button>
          <button
            onClick={() => setSelectedType("media")}
            className={`catalog-tab ${selectedType === "media" ? "active" : ""}`}
          >
            Media
          </button>
        </div>

        {subjects.length > 0 && (
          <div className="catalog-subject-filter">
            <label>Genre/Subject:</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="catalog-select"
            >
              <option value="">All Subjects</option>
              {subjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="catalog-results">
        <div className="catalog-results-header">
          <span>{filteredItems.length} items found</span>
          {loading && <span className="catalog-loading">Loading...</span>}
          {error && <span className="catalog-error">{error}</span>}
        </div>

        {filteredItems.length === 0 && !loading ? (
          <div className="catalog-empty">
            <p>No items found. Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="catalog-grid">
            {filteredItems.map(item => (
              <div
                key={item.item_id}
                className="catalog-card"
                onClick={() => openItemModal(item)}
              >
                <div className="catalog-card-cover">
                  <img
                    src={getCoverImageSmart(item)}
                    alt={item.title}
                    onError={(e) => { e.target.src = DEFAULT_BOOK_PLACEHOLDER; }}
                  />
                  {item.available_copies > 0 ? (
                    <div className="catalog-card-status available">Available</div>
                  ) : (
                    <div className="catalog-card-status unavailable">Unavailable</div>
                  )}
                </div>
                <div className="catalog-card-body">
                  <h3 className="catalog-card-title">{item.title}</h3>
                  {item.authors && item.authors.length > 0 && (
                    <p className="catalog-card-author">{item.authors.join(", ")}</p>
                  )}
                  {item.subject && (
                    <span className="catalog-card-subject">{item.subject}</span>
                  )}
                  <div className="catalog-card-footer">
                    <span className="catalog-card-copies">
                      {item.available_copies}/{item.total_copies} available
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="catalog-modal-overlay" onClick={closeModal}>
          <div className="catalog-modal" onClick={(e) => e.stopPropagation()}>
            <button className="catalog-modal-close" onClick={closeModal}>×</button>
            
            <div className="catalog-modal-content">
              <div className="catalog-modal-left">
                <img
                  src={getCoverImageSmart(selectedItem)}
                  alt={selectedItem.title}
                  onError={(e) => { e.target.src = DEFAULT_BOOK_PLACEHOLDER; }}
                />
              </div>

              <div className="catalog-modal-right">
                <div className="catalog-modal-header">
                  <h2>{selectedItem.title}</h2>
                  {selectedItem.authors && selectedItem.authors.length > 0 && (
                    <p className="catalog-modal-author">by {selectedItem.authors.join(", ")}</p>
                  )}
                  {selectedItem.subject && (
                    <span className="catalog-modal-subject">{selectedItem.subject}</span>
                  )}
                </div>

                {selectedItem.description && (
                  <div className="catalog-modal-description">
                    <h3>Description</h3>
                    <p>{selectedItem.description}</p>
                  </div>
                )}

                <div className="catalog-modal-details">
                  <h3>Details</h3>
                  <div className="catalog-modal-details-grid">{selectedItem.isbn && (
                      <div><strong>ISBN:</strong> {selectedItem.isbn}</div>
                    )}
                    {selectedItem.publisher && (
                      <div><strong>Publisher:</strong> {selectedItem.publisher}</div>
                    )}
                    {selectedItem.publication_year && (
                      <div><strong>Year:</strong> {selectedItem.publication_year}</div>
                    )}
                    {selectedItem.item_type && (
                      <div><strong>Type:</strong> {selectedItem.item_type}</div>
                    )}
                    {selectedItem.model && (
                      <div><strong>Model:</strong> {selectedItem.model}</div>
                    )}
                    {selectedItem.manufacturer && (
                      <div><strong>Manufacturer:</strong> {selectedItem.manufacturer}</div>
                    )}
                    {selectedItem.media_type && (
                      <div><strong>Media Type:</strong> {selectedItem.media_type}</div>
                    )}
                  </div>
                </div>

                <div className="catalog-modal-copies">
                  <h3>Availability</h3>
                  {copiesLoading ? (
                    <p>Loading availability...</p>
                  ) : selectedItem.available_copies > 0 ? (
                    <div className="catalog-availability-section">
                      <p className="catalog-availability-text">
                        ✓ <strong>{selectedItem.available_copies}</strong> {selectedItem.available_copies === 1 ? 'copy' : 'copies'} available
                      </p>
                      <button
                        onClick={() => {
                          // Check out the first available copy
                          const availableCopy = copies.find(c => c.status === 'available');
                          if (availableCopy) checkoutCopy(availableCopy.copy_id);
                        }}
                        disabled={checkoutLoading}
                        className="catalog-checkout-btn-large"
                      >
                        {checkoutLoading ? 'Processing...' : 'Check Out'}
                      </button>
                    </div>
                  ) : (
                    <div className="catalog-availability-section">
                      <p className="catalog-unavailable-text">No copies currently available for checkout.</p>
                      <button
                        onClick={() => placeHoldForItem(selectedItem)}
                        disabled={holdLoading}
                        className="catalog-hold-btn"
                      >
                        {holdLoading ? "Placing hold..." : "Place Hold"}
                      </button>
                      {holdMessage && (
                        <p className="catalog-hold-message">{holdMessage}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
