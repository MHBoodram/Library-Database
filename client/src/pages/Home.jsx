import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import NavBar from '../components/NavBar';
import './Home.css';

// Featured books data with placeholder covers
const featuredBooks = [
  {
    id: 1,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    cover: "https://images.penguinrandomhouse.com/cover/9780061120084",
    genre: "Classic Literature"
  },
  {
    id: 2,
    title: "1984",
    author: "George Orwell",
    cover: "https://images.penguinrandomhouse.com/cover/9780452284234",
    genre: "Dystopian Fiction"
  },
  {
    id: 3,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    cover: "https://images.penguinrandomhouse.com/cover/9780743273565",
    genre: "Classic Literature"
  },
  {
    id: 4,
    title: "Pride and Prejudice",
    author: "Jane Austen",
    cover: "https://images.penguinrandomhouse.com/cover/9780141439518",
    genre: "Romance"
  },
  {
    id: 5,
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    cover: "https://images.penguinrandomhouse.com/cover/9780316769174",
    genre: "Coming of Age"
  },
  {
    id: 6,
    title: "Animal Farm",
    author: "George Orwell",
    cover: "https://images.penguinrandomhouse.com/cover/9780452284241",
    genre: "Political Satire"
  }
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
            {featuredBooks.map((book) => (
              <div key={book.id} className="book-card">
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

      {/* Stats Section */}
      <div className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Books Available</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Active Members</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Online Access</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">15+</div>
              <div className="stat-label">Study Rooms</div>
            </div>
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
              <p>Email: library@school.edu</p>
              <p>Phone: (555) 123-4567</p>
              <p>Location: Main Campus, Building A</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <p><a href="/books">Browse Books</a></p>
              <p><a href="/rooms">Reserve Rooms</a></p>
              {user && <p><a href="/loans">My Loans</a></p>}
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 School Library. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
