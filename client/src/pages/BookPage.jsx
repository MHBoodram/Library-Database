import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Book.css";

export default function BookPage({ fetchBookById, fetchRecommendations, onCheckout }) {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [recs, setRecs] = useState([]);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let alive = true;
    (async () => {
      const b = await fetchBookById(id);
      const r = await fetchRecommendations(id);
      if (!alive) return;
      setBook(b);
      setRecs(r || []);
    })();
    return () => { alive = false; };
  }, [id, fetchBookById, fetchRecommendations]);

  if (!book) {
    return <div className="book-page">
      <div className="book-hero">
        <div className="book-cover skeleton" />
        <div className="book-meta">
          <div className="skeleton" style={{ height: 26, width: 280, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 14, width: 420, marginTop: 10, borderRadius: 6 }} />
        </div>
      </div>
    </div>;
  }

  const imgOk = Boolean(book.coverUrl);

  return (
    <div className="book-page">
      <section className="book-hero">
        <div className={`book-cover ${imgOk ? "" : "placeholder"}`}>
          {imgOk ? (
            <img
              src={book.coverUrl}
              alt={`${book.title} cover`}
              onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement.classList.add("placeholder"); }}
            />
          ) : null}
        </div>

        <div className="book-meta">
          <h1>{book.title}</h1>

          <div className="book-submeta">
            <div className="book-stat"><strong>Author:</strong> <span>{book.author}</span></div>
            <div className="book-stat"><strong>Publisher:</strong> <span>{book.publisher}</span></div>
            <div className="book-stat"><strong>Published:</strong> <span>{book.publishedYear}</span></div>
            <div className="book-stat"><strong>Available:</strong> <span>{book.availableCount}</span></div>
          </div>

          <div className="book-rating" title="Average rating">
            ⭐ {book.rating?.toFixed?.(1) ?? "—"}
          </div>

          <div className="book-actions">
            <div className="qty-stepper" aria-label="Quantity selector">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease">−</button>
              <span aria-live="polite">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} aria-label="Increase">+</button>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => onCheckout?.(book.id, qty)}
              disabled={book.availableCount <= 0}
              title={book.availableCount <= 0 ? "Not available" : "Checkout"}
            >
              {book.availableCount <= 0 ? "Unavailable" : "Checkout"}
            </button>
          </div>
        </div>
      </section>

      <section className="book-summary">
        <h2>Summary</h2>
        <p>{book.summary || "No summary available."}</p>
      </section>

      <section className="recs">
        <h3>Recommended Books</h3>
        <div className="recs-row">
          {recs.map(r => {
            const ok = Boolean(r.coverUrl);
            return (
              <Link key={r.id} to={`/books/${r.id}`} className="rec-card" aria-label={`Open ${r.title}`}>
                <div className={`rec-cover ${ok ? "" : "placeholder"}`}>
                  {ok ? <img src={r.coverUrl} alt={`${r.title} cover`} onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement.classList.add("placeholder"); }} /> : null}
                </div>
                <div className="rec-title">{r.title}</div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
