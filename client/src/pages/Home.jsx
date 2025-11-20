import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import { useAuth } from '../AuthContext';
import NavBar from '../components/NavBar';
import './Home.css';

// Fallback books in case API is unavailable or returns no data
function getFallbackBooks() {
  return [
    {
      id: 1,
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      cover: "https://images.penguinrandomhouse.com/cover/9780061120084",
      genre: "Classic Literature",
      description: "A gripping tale of racial injustice and childhood innocence in the American South.",
      isbn: "9780061120084",
      available: 0,
      total: 0
    },
    {
      id: 2,
      title: "1984",
      author: "George Orwell",
      cover: "https://images.penguinrandomhouse.com/cover/9780452284234",
      genre: "Dystopian Fiction",
      description: "George Orwell's chilling prophecy about the future.",
      isbn: "9780452284234",
      available: 0,
      total: 0
    },
    {
      id: 3,
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      cover: "https://images.penguinrandomhouse.com/cover/9780743273565",
      genre: "Classic Literature",
      description: "A portrait of the Jazz Age in all its decadence and excess.",
      isbn: "9780743273565",
      available: 0,
      total: 0
    }
  ];
}

export default function Home() {
  const { user, useApi: api } = useAuth();
  const navigate = useNavigate();
  const [selectedBook, setSelectedBook] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [dynamicFeatured, setDynamicFeatured] = useState([]);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);
  const [preloadComplete, setPreloadComplete] = useState(false);

  // Fetch top books from the API
  useEffect(() => {
    if (preloadComplete || !api) return;
    let cancel = false;

    async function loadTopBooks() {
      try {
        // Get top items from last 90 days
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 3); // Last 3 months
        
        const params = new URLSearchParams({
          start_date: start.toISOString().slice(0, 10),
          end_date: end.toISOString().slice(0, 10)
        });
        
        // Use public endpoint that doesn't require authentication
        const response = await fetch(`${API_BASE}/public/top-items?${params}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const topItems = await response.json();
        const items = Array.isArray(topItems) ? topItems : [];
        
        console.log('Top items from API:', items.length);
        
        // Filter only books (not devices or media)
        const books = items.filter(item => item.media_type === 'book');
        
        console.log('Books filtered:', books.length);
        
        // Take top 5 books
        const topBooks = books.slice(0, 5);
        
        console.log('Top books to load:', topBooks.length, topBooks.map(b => b.title));
        
        // Load full details for each book
        const updated = [];
        for (const book of topBooks) {
          try {
            const params = new URLSearchParams({ title: book.title });
            const itemsResult = await api(`items?${params.toString()}`);
            const list = Array.isArray(itemsResult?.rows) ? itemsResult.rows : Array.isArray(itemsResult) ? itemsResult : [];
            const exact = list.find(it => (it.title || "").toLowerCase() === book.title.toLowerCase());
            const item = exact || list[0];
            
            if (item) {
              const copies = await api(`items/${item.item_id}/copies`);
              const copyList = Array.isArray(copies) ? copies : [];
              const totalInStock = copyList.filter(c => (c.status || '').toLowerCase() !== 'lost').length;
              const availableCount = copyList.filter(c => (c.status || '').toLowerCase() === 'available').length;
              
              // Generate a better fallback cover URL with book title
              const fallbackCover = `https://placehold.co/300x450/6366f1/white?text=${encodeURIComponent((item.title || 'Book').substring(0, 50))}`;
              
              // Validate cover_image_url - only use it if it's a valid URL
              let coverUrl = fallbackCover;
              if (item.cover_image_url && item.cover_image_url.trim() !== '') {
                try {
                  const url = new URL(item.cover_image_url);
                  if (url.protocol === 'http:' || url.protocol === 'https:') {
                    coverUrl = item.cover_image_url;
                  }
                } catch {
                  // Invalid URL, use fallback
                  console.warn(`Invalid cover URL for ${item.title}:`, item.cover_image_url);
                }
              }
              
              updated.push({
                id: item.item_id,
                title: item.title,
                author: item.authors || "Unknown Author",
                cover: coverUrl,
                genre: item.subject || "General",
                description: item.description || "No description available.",
                isbn: item.isbn || "",
                available: availableCount,
                total: totalInStock,
                item_id: item.item_id,
                loans_count: book.loans_count
              });
            }
          } catch (err) {
            console.error(`Failed to load details for ${book.title}:`, err);
          }
        }
        
        console.log('Successfully loaded books:', updated.length);
        console.log('Book details:', updated.map(b => ({ title: b.title, available: b.available, total: b.total })));
        
        if (!cancel && updated.length > 0) {
          setDynamicFeatured(updated);
          setPreloadComplete(true);
        } else if (!cancel && updated.length === 0) {
          // Fallback to static data if no top books found
          setDynamicFeatured(getFallbackBooks());
          setPreloadComplete(true);
        }
      } catch (err) {
        console.error('Failed to load top books:', err);
        if (!cancel) {
          // Fallback to static data on error
          setDynamicFeatured(getFallbackBooks());
          setPreloadComplete(true);
        }
      }
    }

    loadTopBooks();
    return () => { cancel = true; };
  }, [api, preloadComplete]);

  const handleBookClick = (book) => {
    // Reset modal state and initiate a fresh availability fetch
    setAvailabilityLoading(true);
    setAvailabilityError("");
    setAvailabilityLoaded(false);
  // setAvailableCopies([]);
    setSelectedBook({ ...book, available: undefined, total: undefined });
  };

  const closeModal = () => {
    setSelectedBook(null);
    setAvailabilityLoading(false);
    setAvailabilityError("");
    setAvailabilityLoaded(false);
  // setAvailableCopies([]);
  };

  // When a featured book is selected, refresh its availability from live data
  useEffect(() => {
    let cancelled = false;
    async function loadAvailability() {
      if (!selectedBook) return;
      // if we've already computed availability, skip
      if (availabilityLoaded) return;
      setAvailabilityLoading(true);
      setAvailabilityError("");
      try {
        // Find the item by title (prefer exact title match; fall back to first result)
        const params = new URLSearchParams({ title: selectedBook.title });
        const items = await api(`items?${params.toString()}`);
        const list = Array.isArray(items?.rows) ? items.rows : Array.isArray(items) ? items : [];
        if (list.length === 0) {
          if (!cancelled) {
            setAvailabilityError("Title not found in catalog");
            setAvailabilityLoaded(true);
          }
          return;
        }
        // Pick best match: exact title or first
        const exact = list.find(it => (it.title || "").toLowerCase() === selectedBook.title.toLowerCase());
        const item = exact || list[0];
        // Get copies and compute counts
        const copies = await api(`items/${item.item_id}/copies`);
        const copyList = Array.isArray(copies) ? copies : [];
        const totalInStock = copyList.filter(c => (c.status || '').toLowerCase() !== 'lost').length;
        const avail = copyList.filter(c => (c.status || '').toLowerCase() === 'available');
        const availableCount = avail.length;
        if (!cancelled) {
          // Merge back into selectedBook for display
          setSelectedBook(prev => prev ? { ...prev, available: availableCount, total: totalInStock, item_id: item.item_id } : prev);
          // setAvailableCopies(avail); // no longer used visually
          setAvailabilityLoaded(true);
        }
      } catch (err) {
        if (!cancelled) {
          setAvailabilityError(err?.message || 'Failed to load availability');
          setAvailabilityLoaded(true);
        }
      } finally {
        if (!cancelled) setAvailabilityLoading(false);
      }
    }
    loadAvailability();
    return () => { cancelled = true; };
  }, [selectedBook, availabilityLoaded, api]);

  const handleCheckout = async () => {
    if (!user) {
      alert('Please sign in to checkout books.');
      navigate('/login');
      return;
    }

    if (!selectedBook || !selectedBook.item_id) {
      alert('Book information not loaded. Please try again.');
      return;
    }

    setCheckoutLoading(true);
    try {
      // Get available copies using the item_id we already have
      const copies = await api(`items/${selectedBook.item_id}/copies`);
      const copyList = Array.isArray(copies) ? copies : [];
      const availableCopy = copyList.find(c => c.status === 'available');

      if (!availableCopy) {
        alert('No copies available right now. Please try again later.');
        setCheckoutLoading(false);
        return;
      }

      // Checkout the copy with user_id
      const checkoutData = { 
        copy_id: availableCopy.copy_id,
        user_id: user.user_id,
        identifier_type: 'copy_id'
      };
      
      await api('loans/checkout', {
        method: 'POST',
        body: checkoutData
      });

      const bookId = selectedBook?.id;
      if (bookId) {
        setDynamicFeatured((prev) =>
          prev.map((book) =>
            book.id === bookId
              ? { ...book, available: Math.max(0, Number(book.available || 0) - 1) }
              : book
          )
        );
      }
      setSelectedBook((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          available: Math.max(0, Number(prev.available || 0) - 1),
        };
      });

      alert(`"${selectedBook.title}" is now checked out to you. View it in My Loans.`);
      closeModal();
    } catch (err) {
      const msg = err?.data?.details || err?.data?.message || err?.message || 'Checkout failed';
      alert(`Checkout failed: ${msg}`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/books?title=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="home-page">
      <NavBar />
      
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to Our Library</h1>
          <p className="hero-subtitle">
            {user ? `Hello, ${user.first_name}!` : 'Discover, Learn, and Grow'}
          </p>
          <p className="hero-description">
            Explore thousands of books, journals, and digital resources. 
            Your gateway to knowledge and imagination.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hero-search">
            <input
              type="text"
              style = {{border:'none', borderRadius: '20px'}}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for books, authors, subjects..."
              className="search-input"
            />
            <button type="submit" className="search-button">
              🔍 Search
            </button>
          </form>

          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate('/books')}>
              Browse Collection
            </button>
            {user ? (
              <button className="btn-secondary" onClick={() => navigate('/loans')}>
                My Loans
              </button>
            ) : (
              <button className="btn-secondary" onClick={() => navigate('/login')}>
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Featured Books Section */}
      <div className="featured-section">
        <div className="container">
          <h2 className="section-title">Featured Books</h2>
          <p className="section-subtitle">Popular titles among students and faculty</p>
          
          <div className="books-grid">
            {dynamicFeatured.map((book) => (
              <div 
                key={book.id} 
                className="book-card"
                onClick={() => handleBookClick(book)}
                style={{ cursor: 'pointer' }}
              >
                <div className="book-cover-wrapper">
                  <img 
                    src={book.cover} 
                    alt={book.title}
                    className="book-cover"
                    onError={(e) => {
                      // Prevent infinite loop
                      if (!e.target.dataset.errored) {
                        e.target.dataset.errored = 'true';
                        e.target.src = `https://placehold.co/300x450/6366f1/white?text=${encodeURIComponent(book.title || 'Book')}`;
                      }
                    }}
                  />
                </div>
                <div className="book-info">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">{book.author}</p>
                  <span className="book-genre">{book.genre}</span>
                  <div style={{marginTop:4,fontSize:12,color:'#444'}}>
                    {book.available == null ? 'Loading copies…' : `${book.available} / ${book.total} available`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="services-section">
        <div className="container">
          <h2 className="section-title">Library Services</h2>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">📚</div>
              <h3>Browse Collection</h3>
              <p>Search through our extensive catalog of books, journals, and digital resources.</p>
              <button className="service-link" onClick={() => navigate('/books')}>
                Explore →
              </button>
            </div>
            
            <div className="service-card">
              <div className="service-icon">📖</div>
              <h3>Manage Loans</h3>
              <p>Check your current loans, due dates, and borrowing history.</p>
              <button className="service-link" onClick={() => navigate(user ? '/loans' : '/login')}>
                View Loans →
              </button>
            </div>
            
            <div className="service-card">
              <div className="service-icon">🏛️</div>
              <h3>Reserve Study Rooms</h3>
              <p>Book private study spaces for group work or individual study sessions.</p>
              <button className="service-link" onClick={() => navigate(user ? '/rooms' : '/login')}>
                Reserve →
              </button>
            </div>
            
            {user?.role === 'staff' && (
              <div className="service-card">
                <div className="service-icon">📊</div>
                <h3>Staff Dashboard</h3>
                <p>Access reports, manage loans, and oversee library operations.</p>
                <button className="service-link" onClick={() => navigate('/staff')}>
                  Dashboard →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Library Hours</h4>
              <p>Monday - Friday: 7:00 AM - 10:00 PM</p>
              <p>Saturday: 9:00 AM - 8:00 PM</p>
              <p>Sunday: 10:00 AM - 6:00 PM</p>
            </div>
            <div className="footer-section">
              <h4>Contact Us</h4>
              <p>Email: libraryTeam2@school.edu</p>
              <p>Phone: (555) 555-5555</p>
              <p>Location: Main Campus, Building SEC 104</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <p><a href="/books">Browse Books</a></p>
              <p><a href="/rooms">Reserve Rooms</a></p>
              {user && <p><a href="/loans">My Loans</a></p>}
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 School Library Team2. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Book Detail Modal */}
      {selectedBook && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            
            <div className="modal-body">
              <div className="modal-left">
                <img 
                  src={selectedBook.cover} 
                  alt={selectedBook.title}
                  className="modal-book-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x450/4a5568/ffffff?text=' + encodeURIComponent(selectedBook.title);
                  }}
                />
                <div className="availability-box">
                  <h4>Availability</h4>
                  <div className="availability-status">
                    {availabilityLoading ? (
                      <p>Loading availability…</p>
                    ) : availabilityError ? (
                      <p className="status-unavailable">{availabilityError}</p>
                    ) : (
                      <>
                        <span className={selectedBook.available > 0 ? 'status-available' : 'status-unavailable'}>
                          {selectedBook.available > 0 ? '✓ Available' : '✗ Unavailable'}
                        </span>
                        <p>{Number(selectedBook.available || 0)} of {Number(selectedBook.total || 0)} copies available</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-right">
                <h2 className="modal-title">{selectedBook.title}</h2>
                <p className="modal-author">by {selectedBook.author}</p>
                <span className="modal-genre">{selectedBook.genre}</span>
                
                <div className="modal-section">
                  <h3>Description</h3>
                  <p className="book-description">{selectedBook.description}</p>
                </div>

                <div className="modal-section">
                  <h3>Details</h3>
                  <p><strong>ISBN:</strong> {selectedBook.isbn}</p>
                </div>

                <div className="modal-actions">
                  {availabilityLoading ? (
                    <button className="btn-checkout" disabled>
                      Checking availability…
                    </button>
                  ) : (Number(selectedBook.available || 0) > 0 ? (
                    <button 
                      className="btn-checkout" 
                      onClick={handleCheckout}
                      disabled={checkoutLoading}
                    >
                      {checkoutLoading ? 'Processing...' : 'Check Out'}
                    </button>
                  ) : (
                    <button className="btn-checkout" disabled>
                      Currently Unavailable
                    </button>
                  ))}
                  <button className="btn-browse" onClick={() => navigate(`/books?title=${encodeURIComponent(selectedBook.title)}`)}>
                    Browse All Copies
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
