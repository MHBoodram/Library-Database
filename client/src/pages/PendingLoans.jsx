import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import NavBar from '../components/NavBar';

export default function PendingLoans() {
  const { useApi, token } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let alive = true;
    setLoading(true);
    setError('');
    useApi('loans/pending/my')
      .then((res) => {
        if (!alive) return;
        const list = Array.isArray(res?.rows) ? res.rows : Array.isArray(res) ? res : [];
        setRows(list);
      })
      .catch((e) => setError(e?.message || 'Failed to load pending loans'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [token, useApi]);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', paddingTop: 'var(--nav-height, 60px)' }}>
      <NavBar />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 12 }}>Pending Loans</h1>
        {loading && <div>Loading…</div>}
        {error && <div style={{ color: '#b00020' }}>{error}</div>}
        {!loading && rows.length === 0 && <div style={{ color: '#666' }}>You have no pending checkout requests.</div>}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="px-3 py-2">Patron</th>
                  <th className="px-3 py-2">Patron ID</th>
                  <th className="px-3 py-2">Copy ID</th>
                  <th className="px-3 py-2">Loan ID</th>
                  <th className="px-3 py-2">Requested</th>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.loan_id} className="border-t">
                    <td className="px-3 py-2">{r.first_name} {r.last_name}</td>
                    <td className="px-3 py-2">{r.user_id}</td>
                    <td className="px-3 py-2">{r.copy_id}</td>
                    <td className="px-3 py-2">{r.loan_id || '—'}</td>
                    <td className="px-3 py-2">{new Date(r.request_date).toLocaleString()}</td>
                    <td className="px-3 py-2">{r.item_title}</td>
                    <td className="px-3 py-2">{(r.media_type || 'book').toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
