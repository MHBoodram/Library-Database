import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import NavBar from '../components/NavBar';

export default function Login() {
  const location = useLocation();
  const { login, token, user } = useAuth();
  const [email, setEmail] = useState(() => location.state?.email ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (token && user) {
      navigate(user.employee_id ? '/staff' : '/');
    }
  }, [token, user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const signedIn = await login(email, password);
      navigate(signedIn?.employee_id ? '/staff' : '/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ margin: 0, padding: 0, minHeight: '100vh' }}>
      <NavBar />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        paddingTop: '120px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          maxWidth: 420,
          padding: 24,
          background: '#fff',
          border: '1px solid #eee',
          borderRadius: 8,
          boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
        }}>
      <h1 style={{ marginTop: 0, textAlign: 'center' }}>Login</h1>
      
      {error && (
        <div style={{ 
          padding: 12, 
          marginBottom: 16, 
          backgroundColor: '#fee', 
          color: '#c00',
          borderRadius: 4 
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 8, fontSize: 16 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8, fontSize: 16 }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            display: 'block',
            margin: '0 auto',
            width: 'auto',
            maxWidth: 260,
            padding: '12px 28px',
            fontSize: 16,
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
            textAlign: 'center'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

        <p style={{ marginTop: 16, textAlign: 'center', color: '#555', fontSize: 14 }}>
          Need an account? Please contact a library administrator.
        </p>
        </div>
      </div>
    </div>
  );
}
