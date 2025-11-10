import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import NavBar from '../components/NavBar';
import './Home.css';

// Featured books metadata (availability loaded dynamically)
const featuredBooksSeed = [
  {
    id: 1,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    cover: "https://images.penguinrandomhouse.com/cover/9780061120084",
    genre: "Classic Literature",
    description: "A gripping tale of racial injustice and childhood innocence in the American South. Scout Finch narrates her father's courageous defense of a Black man falsely accused of assault.",
    isbn: "9780061120084",
    available: 5,
    total: 8
  },
  {
    id: 2,
    title: "1984",
    author: "George Orwell",
    cover: "https://images.penguinrandomhouse.com/cover/9780452284234",
    genre: "Dystopian Fiction",
    description: "George Orwell's chilling prophecy about the future. In a totalitarian regime where Big Brother watches everything, Winston Smith struggles to maintain his humanity and independent thought.",
    isbn: "9780452284234",
    available: 3,
    total: 6
  },
  {
    id: 3,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    cover: "https://images.penguinrandomhouse.com/cover/9780743273565",
    genre: "Classic Literature",
    description: "A portrait of the Jazz Age in all its decadence and excess. Jay Gatsby's obsessive quest for his lost love Daisy Buchanan reveals the corruption beneath the American Dream.",
    isbn: "9780743273565",
    available: 4,
    total: 7
  },
  {
    id: 4,
    title: "Pride and Prejudice",
    author: "Jane Austen",
    cover: "https://images.penguinrandomhouse.com/cover/9780141439518",
    genre: "Romance",
    description: "The classic romance that explores love, class, and personal growth in Regency England. Elizabeth Bennet must overcome her pride while Mr. Darcy confronts his prejudice.",
    isbn: "9780141439518",
    available: 6,
    total: 10
  },
  {
    id: 5,
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    cover: "https://images.penguinrandomhouse.com/cover/9780316769174",
    genre: "Coming of Age",
    description: "Holden Caulfield's odyssey through New York City after being expelled from prep school. A raw and honest portrayal of teenage angst, alienation, and the search for authenticity.",
    isbn: "9780316769174",
    available: 2,
    total: 5
  },
  {
    id: 6,
    title: "Animal Farm",
    author: "George Orwell",
    cover: "https://images.penguinrandomhouse.com/cover/9780452284241",
    genre: "Political Satire",
    description: "A brilliant satire of totalitarianism where farm animals rebel against their human farmer. This allegorical novella reveals how power corrupts and revolutionaries become oppressors.",
    isbn: "9780452284241",
    available: 7,
    total: 9
  },
  {
    id: 7,
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    cover: "https://images.penguinrandomhouse.com/cover/9780547928227",
    genre: "Fantasy",
    description: "Bilbo Baggins' unexpected journey from his comfortable hobbit-hole to the Lonely Mountain. A classic adventure tale filled with dragons, dwarves, and the discovery of courage.",
    isbn: "9780547928227",
    available: 8,
    total: 12
  },
  {
    id: 8,
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    cover: "https://images.penguinrandomhouse.com/cover/9780590353427",
    genre: "Fantasy",
    description: "The Boy Who Lived begins his magical education at Hogwarts. Harry Potter discovers his true heritage and faces the dark wizard who killed his parents in this beloved fantasy adventure.",
    isbn: "9780590353427",
    available: 10,
    total: 15
  },
  {
    id: 9,
    title: "The Lord of the Rings",
    author: "J.R.R. Tolkien",
    cover: "https://images.penguinrandomhouse.com/cover/9780544003415",
    genre: "Fantasy",
    description: "The epic quest to destroy the One Ring and defeat the Dark Lord Sauron. Frodo and the Fellowship journey through Middle-earth in this masterwork of fantasy literature.",
    isbn: "9780544003415",
    available: 4,
    total: 8
  },
  {
    id: 10,
    title: "Brave New World",
    author: "Aldous Huxley",
    cover: "https://images.penguinrandomhouse.com/cover/9780060850524",
    genre: "Dystopian Fiction",
    description: "A disturbing vision of a future where humans are genetically engineered and conditioned for a rigid caste system. Huxley explores the cost of stability and the loss of individuality.",
    isbn: "9780060850524",
    available: 3,
    total: 6
  }
];

export default function Home() {
  const { user, useApi } = useAuth();
  const navigate = useNavigate();
  const [selectedBook, setSelectedBook] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [dynamicFeatured, setDynamicFeatured] = useState(featuredBooksSeed.map(b => ({ ...b, available: null, total: null })));
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);
  const [preloadComplete, setPreloadComplete] = useState(false);
  // Removed per-user request (no longer listing individual copies in modal)
  // Keep placeholder state if future quick-checkout per copy is reintroduced.
  // const [availableCopies, setAvailableCopies] = useState([]);
  // Preload dynamic availability for featured books (best-effort; silent failures)
  useEffect(() => {
    if (preloadComplete) return; // Only run once
    let cancel = false;
    async function loadAll() {
      const updated = [];
      for (const book of featuredBooksSeed) {
        try {
          const params = new URLSearchParams({ title: book.title });
          const items = await useApi(`items?${params.toString()}`);
          const list = Array.isArray(items?.rows) ? items.rows : Array.isArray(items) ? items : [];
          const exact = list.find(it => (it.title || "").toLowerCase() === book.title.toLowerCase());
          const item = exact || list[0];
          if (item) {
            const copies = await useApi(`items/${item.item_id}/copies`);
            const copyList = Array.isArray(copies) ? copies : [];
            const totalInStock = copyList.filter(c => (c.status || '').toLowerCase() !== 'lost').length;
            const availableCount = copyList.filter(c => (c.status || '').toLowerCase() === 'available').length;
            updated.push({ ...book, available: availableCount, total: totalInStock, item_id: item.item_id });
          } else {
            updated.push({ ...book, available: 0, total: 0 });
          }
        } catch { // individual book load failure
          // Ignore individual book load errors; mark counts as zero
          updated.push({ ...book, available: 0, total: 0 });
        }
      }
      if (!cancel) {
        setDynamicFeatured(updated);
        setPreloadComplete(true);
      }
    }
    loadAll();
    return () => { cancel = true; };
  }, [useApi, preloadComplete]);

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
      // Guard: if we've already computed availability, skip
      if (availabilityLoaded) return;
      setAvailabilityLoading(true);
      setAvailabilityError("");
      try {
        // Find the item by title (prefer exact title match; fall back to first result)
        const params = new URLSearchParams({ title: selectedBook.title });
        const items = await useApi(`items?${params.toString()}`);
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
        const copies = await useApi(`items/${item.item_id}/copies`);
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
  }, [selectedBook, availabilityLoaded, useApi]);

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
      const copies = await useApi(`items/${selectedBook.item_id}/copies`);
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
      
      await useApi('loans/checkout', {
        method: 'POST',
        body: checkoutData
      });

      alert(`Successfully checked out "${selectedBook.title}"! View it in My Loans.`);
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
                      e.target.src = 'https://via.placeholder.com/200x300/4a5568/ffffff?text=' + encodeURIComponent(book.title);
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
