import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/admin-login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      navigate('/admin');
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to backend server. Please verify backend is running on http://localhost:5000.');
      } else {
        setError(err.response?.data?.error || 'Invalid admin credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(100,0,200,.14) 0%, transparent 65%), var(--bg-900)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          padding: '2.5rem',
          background: 'var(--bg-800)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(150,100,255,.2)',
          boxShadow: '0 0 40px rgba(100,0,255,.12), var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚙️</div>
          <h2 style={{
            background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Admin Portal
          </h2>
          <p style={{ color: 'var(--text-400)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
            Mangala Proposals — Administrator Access
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="form-group">
            <label htmlFor="admin-email">Admin Email / Username</label>
            <input
              id="admin-email"
              className="input"
              type="text"
              required
              autoComplete="username"
              placeholder="admin@youremail.com or root"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              className="input"
              type="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-lg btn-full"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(124,58,237,.4)',
              marginTop: '0.5rem',
            }}
          >
            {loading ? 'Signing in…' : '🔐 Admin Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a href="/" style={{ color: 'var(--text-400)', fontSize: '0.85rem' }}>
            ← Back to main site
          </a>
        </div>

        {/* Security note */}
        <div style={{
          marginTop: '1.5rem',
          padding: '0.75rem',
          background: 'rgba(124,58,237,.07)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(124,58,237,.15)',
          fontSize: '0.78rem',
          color: 'var(--text-400)',
          textAlign: 'center',
        }}>
          🛡️ Admin access is logged and monitored. Unauthorised access will be reported.
        </div>
      </div>
    </div>
  );
}
