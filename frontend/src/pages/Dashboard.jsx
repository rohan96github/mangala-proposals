import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [myProfiles, setMyProfiles]   = useState([]);
  const [received, setReceived]       = useState([]);
  const [sent, setSent]               = useState([]);
  const [activeTab, setActiveTab]     = useState('profiles');
  const [loading, setLoading]         = useState(true);

  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    Promise.all([
      api.get('/profiles/my/list'),
      api.get('/interests/received'),
      api.get('/interests/sent'),
    ]).then(([p, r, s]) => {
      setMyProfiles(p.data);
      setReceived(r.data);
      setSent(s.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token, navigate]);

  const respondInterest = async (id, status) => {
    await api.patch(`/interests/${id}`, { status }).catch(() => {});
    const res = await api.get('/interests/received');
    setReceived(res.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  const tabs = [
    { key: 'profiles', label: t('profile.myProfiles') },
    { key: 'received', label: `${t('interest.received')} (${received.length})` },
    { key: 'sent',     label: `${t('interest.sent')} (${sent.length})` },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1><span className="grad-text">{t('nav.dashboard')}</span></h1>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/profile/new" className="btn btn-primary btn-sm">+ {t('profile.createNew')}</Link>
          {role === 'admin' && <Link to="/admin" className="btn btn-gold btn-sm">⚙️ {t('nav.admin')}</Link>}
          <button className="btn btn-ghost btn-sm" onClick={logout}>{t('nav.logout')}</button>
        </div>
      </div>

      {/* Stats row */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-card__icon">👤</div>
          <div>
            <div className="stat-card__number">{myProfiles.length}</div>
            <div className="stat-card__label">{t('profile.myProfiles')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon">💌</div>
          <div>
            <div className="stat-card__number">{received.length}</div>
            <div className="stat-card__label">{t('interest.received')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon">📤</div>
          <div>
            <div className="stat-card__number">{sent.length}</div>
            <div className="stat-card__label">{t('interest.sent')}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* My Profiles */}
      {activeTab === 'profiles' && (
        <div>
          {myProfiles.length === 0
            ? (
              <div className="empty-state">
                <div className="icon">👤</div>
                <p>{t('common.noResults')}</p>
                <Link to="/profile/new" className="btn btn-primary mt-3">{t('profile.createNew')}</Link>
              </div>
            )
            : (
              <div className="profile-grid">
                {myProfiles.map(p => (
                  <div key={p.id} className="profile-card" style={{ cursor: 'default' }}>
                    {p.photo
                      ? <img className="profile-card__photo" src={`${API_BASE}/uploads/${p.photo}`} alt={p.full_name} />
                      : <div className="profile-card__photo-placeholder">{p.gender === 'female' ? '👰' : '🤵'}</div>
                    }
                    <div className="profile-card__body">
                      <div className="profile-card__name">{p.full_name}</div>
                      <div className="profile-card__age">{t('profile.age', { count: p.age })}</div>
                      <div className="profile-card__chips">
                        <span className={`status-badge status-${p.status}`}>{t(`status.${p.status}`)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <Link to={`/profile/${p.id}`} className="btn btn-ghost btn-sm">{t('common.viewProfile')}</Link>
                        <Link to={`/profile/edit/${p.id}`} className="btn btn-primary btn-sm">{t('profile.editProfile')}</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* Received interests */}
      {activeTab === 'received' && (
        <div>
          {received.length === 0
            ? <div className="empty-state"><div className="icon">💌</div><p>No interests received yet.</p></div>
            : received.map(i => (
              <div className="interest-row" key={i.id}>
                <div>
                  <strong>{i.from_name}</strong>
                  <span style={{ color: 'var(--text-400)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                    ({i.from_ref}) · {t('profile.age', { count: i.from_age })}
                  </span>
                  <span style={{ marginLeft: '0.5rem' }}>→ {i.to_name}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`status-badge status-${i.status}`}>{t(`interest.${i.status}`) || i.status}</span>
                  {i.status === 'sent' && (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => respondInterest(i.id, 'accepted')}>{t('interest.accept')}</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--clr-danger)' }} onClick={() => respondInterest(i.id, 'declined')}>{t('interest.decline')}</button>
                    </>
                  )}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Sent interests */}
      {activeTab === 'sent' && (
        <div>
          {sent.length === 0
            ? <div className="empty-state"><div className="icon">📤</div><p>No interests sent yet. Browse profiles and send one!</p></div>
            : sent.map(i => (
              <div className="interest-row" key={i.id}>
                <div>
                  <strong>{i.from_name}</strong>
                  <span style={{ color: 'var(--text-400)', marginInline: '0.35rem' }}>→</span>
                  <strong>{i.to_name}</strong>
                  <span style={{ color: 'var(--text-400)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                    ({i.to_ref}) · {t('profile.age', { count: i.to_age })}
                  </span>
                </div>
                <div>
                  <span className={`status-badge status-${i.status}`}>{t(`interest.${i.status}`) || i.status}</span>
                  <button className="btn btn-ghost btn-sm" style={{ marginLeft: '0.5rem' }} onClick={() => navigate(`/profile/${i.to_id}`)}>
                    {t('common.viewProfile')}
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
