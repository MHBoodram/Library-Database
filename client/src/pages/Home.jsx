import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import NavBar from '../components/NavBar';

export default function Home() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
  }, [token, navigate]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (!user) {
    return <div style={{ padding: 16 }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: 24 }}>
      <NavBar />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1>Welcome, {user.first_name} {user.last_name}!</h1>
          <p style={{ color: '#666', marginTop: 4 }}>
            Role: {user.role} · User ID: <span style={{ fontFamily: 'monospace' }}>#{user.user_id}</span>
          </p>
        </div>
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
