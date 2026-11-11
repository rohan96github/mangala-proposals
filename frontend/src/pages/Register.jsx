import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';

const LANGS = [
  { code: 'si', label: 'සිංහල' },
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
];

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // step: 'form' | 'otp'
  const [step, setStep] = useState('form');
  const [userId, setUserId] = useState(null);
  const [devOtp, setDevOtp] = useState('');   // shown only in dev mode

  const [form, setForm] = useState({
    email: '', phone: '', password: '', confirmPassword: '', preferred_lang: 'si',
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  /* ── Step 1: Submit registration form ── */
  const submitForm = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword)
      return setError(t('errors.passwordMatch'));
    if (form.password.length < 8)
      return setError(t('errors.minPassword'));
    if (!form.phone.trim())
      return setError('Phone number is required for OTP verification.');

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        email: form.email,
        phone: form.phone,
        password: form.password,
        preferred_lang: form.preferred_lang,
      });
      setUserId(res.data.userId);
      setDevOtp(res.data.devOtp || '');   // dev only
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: Verify OTP ── */
  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { userId, otp });
      setSuccess('✅ Mobile verified! Redirecting to login…');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Resend OTP ── */
  const resendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      const res = await api.post('/auth/resend-otp', { userId });
      setDevOtp(res.data.devOtp || '');
      setSuccess('New OTP sent!');
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown(c => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; });
      }, 1000);
    } catch {
      setError('Failed to resend OTP.');
    }
  };

  /* ════════════════════════════════════
     STEP 1 — Registration form
  ════════════════════════════════════ */
  if (step === 'form') {
    return (
      <div className="auth-page">
        <div className="auth-box" style={{ maxWidth: 500 }}>
          <h2><span className="grad-text">{t('auth.registerTitle')}</span></h2>
          <p style={{ color: 'var(--text-300)', marginBottom: '1.75rem', fontSize: '0.9rem' }}>
            {t('auth.registerSub')}
          </p>

          {error && <div className="alert alert-error">{error}</div>}

          <form className="form-grid" onSubmit={submitForm}>
            <div className="form-group">
              <label htmlFor="reg-email">{t('auth.email')} *</label>
              <input id="reg-email" className="input" type="email" required
                value={form.email} onChange={e => set('email', e.target.value)} />
            </div>

            <div className="form-group">
              <label htmlFor="reg-phone">
                📱 {t('auth.phone')} * <span style={{ fontSize: '0.78rem', color: 'var(--text-400)' }}>(OTP verification)</span>
              </label>
              <input id="reg-phone" className="input" type="tel" required
                placeholder="+94 71 234 5678"
                value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>

            <div className="form-two-col">
              <div className="form-group">
                <label htmlFor="reg-pw">{t('auth.password')} *</label>
                <input id="reg-pw" className="input" type="password" required minLength={8}
                  value={form.password} onChange={e => set('password', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="reg-pw2">{t('auth.confirmPassword')} *</label>
                <input id="reg-pw2" className="input" type="password" required
                  value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>{t('auth.preferredLang')}</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {LANGS.map(l => (
                  <button key={l.code} type="button"
                    className={`btn btn-sm ${form.preferred_lang === l.code ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => set('preferred_lang', l.code)}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
              {loading ? t('common.loading') : `📱 ${t('auth.registerBtn')}`}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-300)' }}>
            {t('auth.haveAccount')}{' '}
            <Link to="/login" style={{ color: 'var(--clr-primary-lt)', fontWeight: 600 }}>
              {t('auth.loginBtn')}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════
     STEP 2 — OTP Verification
  ════════════════════════════════════ */
  return (
    <div className="auth-page">
      <div className="auth-box">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📱</div>
          <h2><span className="grad-text">Verify Your Mobile</span></h2>
          <p style={{ color: 'var(--text-300)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            OTP has been sent to <strong style={{ color: 'var(--text-100)' }}>{form.phone}</strong>
          </p>
        </div>

        {/* DEV MODE: show OTP on screen */}
        {devOtp && (
          <div className="alert alert-warning" style={{ textAlign: 'center', marginBottom: '1rem' }}>
            🛠️ <strong>Dev Mode OTP:</strong>
            <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '0.3em', marginTop: '0.4rem', fontFamily: 'monospace', color: 'var(--clr-gold)' }}>
              {devOtp}
            </div>
            <small style={{ color: 'var(--text-400)' }}>(This box will NOT appear in production)</small>
          </div>
        )}

        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={verifyOtp}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="otp-input" style={{ textAlign: 'center', display: 'block' }}>
              Enter 6-digit OTP
            </label>
            <input
              id="otp-input"
              className="input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              pattern="\d{6}"
              required
              placeholder="_ _ _ _ _ _"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              style={{
                textAlign: 'center',
                fontSize: '2rem',
                fontWeight: 800,
                letterSpacing: '0.4em',
                fontFamily: 'monospace',
              }}
              autoFocus
            />
          </div>

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? t('common.loading') : '✅ Verify & Continue'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.9rem', color: 'var(--text-400)' }}>
          Didn't receive the OTP?{' '}
          <button
            onClick={resendOtp}
            disabled={resendCooldown > 0}
            style={{ background: 'none', border: 'none', color: resendCooldown > 0 ? 'var(--text-400)' : 'var(--clr-primary-lt)', fontWeight: 600, cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setStep('form')}>
            ← Change details
          </button>
        </div>
      </div>
    </div>
  );
}
