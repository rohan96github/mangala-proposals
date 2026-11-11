import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000';

export default function ProfileCard({ profile }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language;

  const district = profile[`district_${lang}`] || profile.district_en || '—';
  const photoSrc = profile.photo
    ? `${API_BASE}/uploads/${profile.photo}`
    : null;

  return (
    <article
      className="profile-card"
      onClick={() => navigate(`/profile/${profile.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/profile/${profile.id}`)}
    >
      {photoSrc ? (
        <img
          className="profile-card__photo"
          src={photoSrc}
          alt={profile.full_name}
          loading="lazy"
        />
      ) : (
        <div className="profile-card__photo-placeholder">
          {profile.gender === 'female' ? '👰' : '🤵'}
        </div>
      )}

      <div className="profile-card__body">
        <div className="profile-card__name">{profile.full_name}</div>
        <div className="profile-card__age">
          {t('profile.age', { count: profile.age })}
          {profile.height_cm ? ` · ${profile.height_cm} ${t('common.cm')}` : ''}
        </div>

        <div className="profile-card__chips">
          {district && <span className="chip chip-gold">{district}</span>}
          {profile.religion && (
            <span className="chip chip-red">{t(`religion.${profile.religion}`)}</span>
          )}
          {profile.education && (
            <span className="chip chip-gray" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.education}
            </span>
          )}
        </div>

        <div className="mt-2" style={{ fontSize: '0.78rem', color: 'var(--text-400)' }}>
          {t('profile.ref')}: {profile.ref_code}
        </div>
      </div>
    </article>
  );
}
