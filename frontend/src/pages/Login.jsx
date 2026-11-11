import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP re-entry if user registered but not yet verified
  const [needsOtp, setNeedsOtp] = useState(false);
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [otpMsg, setOtpMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      if (res.data.preferred_lang) i18n.changeLanguage(res.data.preferred_lang);
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to backend server. Please verify backend is running on http://localhost:5000.');
      } else {
        const data = err.response?.data;
        if (data?.needsVerification) {
          // User registered but didn't verify OTP
          setUserId(data.userId);
          // Resend OTP automatically
          const r2 = await api.post('/auth/resend-otp', { userId: data.userId }).catch(() => ({}));
          setDevOtp(r2?.data?.devOtp || '');
          setNeedsOtp(true);
          setError('');
        } else {
          setError(data?.error || t('errors.login'));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { userId, otp });
      setOtpMsg('✅ Verified! Please login now.');
      setNeedsOtp(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  /* ── Pending OTP verification screen ── */
  if (needsOtp) {
    return (
      <div className="auth-page">
        <div className="auth-box">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '3rem' }}>📱</div>
            <h2 style={{ marginTop: '0.5rem' }}>Verify Your Mobile</h2>
            <p style={{ color: 'var(--text-300)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
              Your account is not yet verified. Enter the OTP sent to your mobile.
            </p>
          </div>

          {devOtp && (
            <div className="alert alert-warning" style={{ textAlign: 'center', marginBottom: '1rem' }}>
              🛠️ <strong>Dev Mode OTP:</strong>
              <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '0.3em', marginTop: '0.4rem', fontFamily: 'monospace', color: 'var(--clr-gold)' }}>
                {devOtp}
              </div>
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={verifyOtp}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', textAlign: 'center' }}>Enter 6-digit OTP</label>
              <input
                className="input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                pattern="\d{6}"
                required
                autoFocus
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '0.4em', fontFamily: 'monospace' }}
              />
            </div>
            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
              {loading ? 'Verifying…' : '✅ Verify'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setNeedsOtp(false); setError(''); }}>
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Normal login screen ── */
  return (
    <div className="auth-page">
      <div className="auth-box">
        <h2><span className="grad-text">{t('auth.loginTitle')}</span></h2>
        <p style={{ color: 'var(--text-300)', marginBottom: '1.75rem', fontSize: '0.9rem' }}>
          {t('auth.loginSub')}
        </p>

        {otpMsg && <div className="alert alert-success">{otpMsg}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form className="form-grid" onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="login-email">{t('auth.email')}</label>
            <input id="login-email" className="input" type="text" required
              placeholder="Email or username"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">{t('auth.password')}</label>
            <input id="login-password" className="input" type="password" required
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? t('common.loading') : t('auth.loginBtn')}
          </button>
        </form>

        <div className="divider" />

        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-300)' }}>
          {t('auth.noAccount')}{' '}
          <Link to="/register" style={{ color: 'var(--clr-primary-lt)', fontWeight: 600 }}>
            {t('nav.register')}
          </Link>
        </p>

        {/* Admin login link */}
        <p style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.82rem' }}>
          <Link to="/admin/login" style={{ color: 'var(--text-400)' }}>
            ⚙️ Administrator login →
          </Link>
        </p>
      </div>
    </div>
  );
}
