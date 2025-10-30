import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [userBalances, setUserBalances] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const navigate = useNavigate();
  const { token, user, useApi } = useAuth();
  const apiWithAuth = useMemo(() => useApi(), [useApi]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (!user) {
      return;
    }

    if (user.role !== 'staff') {
      setError('Access Denied: You do not have permission to view reports.');
      setLoading(false);
      return;
    }

    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [overdueRes, balancesRes, topItemsRes] = await Promise.all([
          apiWithAuth('reports/overdue'),
          apiWithAuth('reports/balances'),
          apiWithAuth('reports/top-items'),
        ]);

        if (!active) return;
        setOverdueLoans(Array.isArray(overdueRes) ? overdueRes : []);
        setUserBalances(Array.isArray(balancesRes) ? balancesRes : []);
        setTopItems(Array.isArray(topItemsRes) ? topItemsRes : []);
      } catch (err) {
        if (!active) return;
        setError('Failed to load reports: ' + (err.message || 'Unknown error'));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [token, user, navigate, apiWithAuth]);

  if (loading) {
    return <div style={{ padding: 16 }}>Loading reports...</div>;
  }

  if (error) {
    return (
      <div style={{ maxWidth: 800, margin: '2rem auto', padding: 24 }}>
        <div style={{ 
          padding: 24, 
          backgroundColor: '#f8d7da', 
          color: '#721c24',
          borderRadius: 8,
          border: '1px solid #f5c6cb'
        }}>
          <h2>⚠️ {error}</h2>
          <p>Only staff members can access reports.</p>
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              backgroundColor: '#721c24',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '2rem auto', padding: 24 }}>
      <h1>📊 Library Reports</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>
        Viewing as: <strong>{user?.name}</strong> ({user?.role})
      </p>

      {/* Overdue Loans */}
      <div style={{ marginBottom: 32 }}>
        <h2>Overdue Loans</h2>
        {overdueLoans.length === 0 ? (
          <p style={{ color: '#666' }}>No overdue loans.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: 12, textAlign: 'left', border: '1px solid #dee2e6' }}>User</th>
                <th style={{ padding: 12, textAlign: 'left', border: '1px solid #dee2e6' }}>Media Type</th>
                <th style={{ padding: 12, textAlign: 'left', border: '1px solid #dee2e6' }}>Due Date</th>
                <th style={{ padding: 12, textAlign: 'right', border: '1px solid #dee2e6' }}>Days Overdue</th>
                <th style={{ padding: 12, textAlign: 'right', border: '1px solid #dee2e6' }}>Est. Fine</th>
              </tr>
            </thead>
            <tbody>
              {overdueLoans.map((loan, idx) => (
                <tr key={idx}>
                  <td style={{ padding: 12, border: '1px solid #dee2e6' }}>
                    {loan.first_name} {loan.last_name}
                  </td>
                  <td style={{ padding: 12, border: '1px solid #dee2e6' }}>{loan.media_type}</td>
                  <td style={{ padding: 12, border: '1px solid #dee2e6' }}>{loan.due_date}</td>
                  <td style={{ padding: 12, textAlign: 'right', border: '1px solid #dee2e6' }}>
                    {loan.days_overdue}
                  </td>
                  <td style={{ padding: 12, textAlign: 'right', border: '1px solid #dee2e6' }}>
                    ${parseFloat(loan.est_fine || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* User Balances */}
      <div style={{ marginBottom: 32 }}>
        <h2>User Balances</h2>
        {userBalances.length === 0 ? (
          <p style={{ color: '#666' }}>No outstanding balances.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: 12, textAlign: 'left', border: '1px solid #dee2e6' }}>User</th>
                <th style={{ padding: 12, textAlign: 'right', border: '1px solid #dee2e6' }}>Open Balance</th>
                <th style={{ padding: 12, textAlign: 'right', border: '1px solid #dee2e6' }}>Paid Total</th>
              </tr>
            </thead>
            <tbody>
              {userBalances.map((balance, idx) => (
                <tr key={idx}>
                  <td style={{ padding: 12, border: '1px solid #dee2e6' }}>
                    {balance.first_name} {balance.last_name}
                  </td>
                  <td style={{ padding: 12, textAlign: 'right', border: '1px solid #dee2e6' }}>
                    ${parseFloat(balance.open_balance || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: 12, textAlign: 'right', border: '1px solid #dee2e6' }}>
                    ${parseFloat(balance.paid_total || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Top Items */}
      <div style={{ marginBottom: 32 }}>
        <h2>Top Borrowed Items (Last 30 Days)</h2>
        {topItems.length === 0 ? (
          <p style={{ color: '#666' }}>No loan data available.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: 12, textAlign: 'left', border: '1px solid #dee2e6' }}>Title</th>
                <th style={{ padding: 12, textAlign: 'left', border: '1px solid #dee2e6' }}>Type</th>
                <th style={{ padding: 12, textAlign: 'right', border: '1px solid #dee2e6' }}>Loans</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ padding: 12, border: '1px solid #dee2e6' }}>{item.title}</td>
                  <td style={{ padding: 12, border: '1px solid #dee2e6' }}>{item.media_type}</td>
                  <td style={{ padding: 12, textAlign: 'right', border: '1px solid #dee2e6' }}>
                    {item.loans_30d}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
