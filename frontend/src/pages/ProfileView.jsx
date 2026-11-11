import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';

const API_BASE = 'http://localhost:5000';

export default function ProfileView() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language;

  const [profile, setProfile] = useState(null);
  const [myProfiles, setMyProfiles] = useState([]);
  const [contact, setContact] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    setLoading(true);
    api.get(`/profiles/${id}`)
      .then(r => setProfile(r.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));

    if (token) {
      api.get('/profiles/my/list').then(r => setMyProfiles(r.data)).catch(() => {});
    }
  }, [id, token]);

  const sendInterest = async (fromId) => {
    try {
      await api.post('/interests', { from_profile_id: fromId, to_profile_id: Number(id) });
      setMsg(t('profile.interestSent'));
    } catch (err) {
      setMsg(err.response?.data?.error || t('errors.serverError'));
    }
  };

  const showContact = async () => {
    try {
      const res = await api.get(`/profiles/${id}/contact`);
      setContact(res.data);
    } catch (err) {
      setMsg(err.response?.data?.error || t('profile.noContact'));
    }
  };

  const submitReport = async () => {
    if (!reportReason.trim()) return;
    const userId = /* decode from token */ null; // simplified
    await api.post('/reports', {
      profile_id: Number(id),
      reporter_id: userId,
      reason: reportReason,
    }).catch(() => {});
    setReportOpen(false);
    setMsg('Report submitted.');
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!profile) return (
    <div className="container" style={{ paddingTop: '3rem' }}>
      <div className="empty-state">
        <div className="icon">😔</div>
        <p>{t('errors.notFound')}</p>
        <button className="btn btn-ghost mt-3" onClick={() => navigate(-1)}>{t('common.back')}</button>
      </div>
    </div>
  );

  const district = profile[`district_${lang}`] || profile.district_en;
  const primaryPhoto = profile.photos?.find(p => p.is_primary) || profile.photos?.[0];

  return (
    <div className="profile-detail">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem' }}>
        ← {t('common.back')}
      </button>

      {msg && (
        <div className={`alert ${msg.includes('✓') || msg.includes('submitted') ? 'alert-success' : 'alert-error'}`}>
          {msg}
        </div>
      )}

      <div className="profile-detail__hero">
        {/* Photo */}
        <div>
          {primaryPhoto ? (
            <img
              className="profile-detail__photo"
              src={`${API_BASE}/uploads/${primaryPhoto.file_path}`}
              alt={profile.full_name}
            />
          ) : (
            <div
              className="profile-detail__photo"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-600)', fontSize: '6rem', borderRadius: 'var(--radius-md)',
              }}
            >
              {profile.gender === 'female' ? '👰' : '🤵'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="profile-detail__info">
          <h1 style={{ marginBottom: 0 }}>{profile.full_name}</h1>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <span className="chip chip-red">{t(`religion.${profile.religion}`)}</span>
            <span className="chip chip-gold">{district}</span>
            <span className={`status-badge status-${profile.status}`}>{t(`status.${profile.status}`)}</span>
          </div>

          <div className="detail-row">
            <span className="label">{t('profile.ref')}:</span>
            <span className="value" style={{ color: 'var(--text-400)', fontFamily: 'monospace' }}>{profile.ref_code}</span>
          </div>
          <div className="detail-row">
            <span className="label">{t('profile.age')}:</span>
            <span className="value">{profile.age} yrs</span>
          </div>
          {profile.height_cm && (
            <div className="detail-row">
              <span className="label">{t('profile.height')}:</span>
              <span className="value">{profile.height_cm} {t('common.cm')}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="label">{t('profile.marital')}:</span>
            <span className="value">{t(`marital.${profile.marital_status}`)}</span>
          </div>
          {profile.education && (
            <div className="detail-row">
              <span className="label">{t('profile.education')}:</span>
              <span className="value">{profile.education}</span>
            </div>
          )}
          {profile.occupation && (
            <div className="detail-row">
              <span className="label">{t('profile.occupation')}:</span>
              <span className="value">{profile.occupation}</span>
            </div>
          )}
          {profile.caste && (
            <div className="detail-row">
              <span className="label">{t('profile.caste')}:</span>
              <span className="value">{profile.caste}</span>
            </div>
          )}

          {/* Actions */}
          {token && myProfiles.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {myProfiles.map(mp => (
                mp.id !== profile.id && (
                  <button key={mp.id} className="btn btn-primary btn-sm" onClick={() => sendInterest(mp.id)}>
                    💌 {t('profile.sendInterest')} ({mp.full_name})
                  </button>
                )
              ))}
              <button className="btn btn-gold btn-sm" onClick={showContact}>
                📞 {t('profile.showContact')}
              </button>
            </div>
          )}

          {!token && (
            <div className="alert alert-info mt-2">
              <a href="/login" style={{ color: 'inherit', textDecoration: 'underline' }}>Login</a> to send interest or view contact.
            </div>
          )}

          {contact && (
            <div className="alert alert-success mt-2">
              📞 {contact.contact_phone} &nbsp;|&nbsp; ✉️ {contact.contact_email}
            </div>
          )}
        </div>
      </div>

      {/* About */}
      {profile.about && (
        <div className="glass mt-4" style={{ padding: '1.5rem' }}>
          <h3>{t('profile.about')}</h3>
          <div className="divider" />
          <p style={{ color: 'var(--text-200)', lineHeight: 1.8 }}>{profile.about}</p>
        </div>
      )}

      {/* Partner Preferences */}
      {profile.partner_pref && (
        <div className="glass mt-3" style={{ padding: '1.5rem' }}>
          <h3>{t('profile.partnerPref')}</h3>
          <div className="divider" />
          <p style={{ color: 'var(--text-200)', lineHeight: 1.8 }}>{profile.partner_pref}</p>
        </div>
      )}

      {/* Report */}
      {token && (
        <div className="mt-4">
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--clr-danger)' }}
            onClick={() => setReportOpen(!reportOpen)}
          >
            🚩 {t('report.title')}
          </button>
          {reportOpen && (
            <div className="glass mt-2" style={{ padding: '1.25rem' }}>
              <textarea
                className="textarea"
                style={{ width: '100%' }}
                placeholder={t('report.placeholder')}
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={submitReport}>{t('report.submit')}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setReportOpen(false)}>{t('common.cancel')}</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="safety-banner mt-4">
        <span>⚠️</span>
        <span>{t('safety')}</span>
      </div>
    </div>
  );
}
