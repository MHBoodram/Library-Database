import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      navigate('/login');
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  if (!user) {
    return <div style={{ padding: 16 }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1>Welcome, {user.name}!</h1>
          <p style={{ color: '#666' }}>Role: {user.role}</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ 
        padding: 24, 
        backgroundColor: '#f8f9fa', 
        borderRadius: 8,
        marginBottom: 16 
      }}>
        <h2>Quick Actions</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: 8 }}>
            <a href="/books" style={{ color: '#007bff', textDecoration: 'none' }}>
              📚 Browse Books
            </a>
          </li>
          <li style={{ marginBottom: 8 }}>
            <a href="/loans" style={{ color: '#007bff', textDecoration: 'none' }}>
              📖 My Loans
            </a>
          </li>
            {user.role === 'staff' && (
              <li style={{ marginBottom: 8 }}>
                <a href="/reports" style={{ color: '#007bff', textDecoration: 'none' }}>
                  📊 Reports (Staff Only)
                </a>
              </li>
            )}
        </ul>
      </div>

      <div style={{ 
        padding: 16, 
        backgroundColor: '#d1ecf1', 
        borderLeft: '4px solid #0c5460',
        borderRadius: 4 
      }}>
        <p style={{ margin: 0, color: '#0c5460' }}>
          ℹ️ This is your library dashboard. Use the navigation above to access different features.
        </p>
      </div>
    </div>
  );
}
