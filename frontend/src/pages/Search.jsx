import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import ProfileCard from '../components/ProfileCard';
import Filters from '../components/Filters';

export default function Search() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    gender: searchParams.get('gender') || '',
    religion: '',
    district_id: '',
    min_age: '',
    max_age: '',
  });
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      );
      const res = await api.get('/profiles', { params });
      setProfiles(res.data);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-search on mount
  useEffect(() => { doSearch(); }, []); // eslint-disable-line

  const genderTitle = filters.gender === 'female'
    ? t('nav.brides')
    : filters.gender === 'male'
      ? t('nav.grooms')
      : `${t('nav.brides')} & ${t('nav.grooms')}`;

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div className="page-header">
        <div className="container">
          <h1>{genderTitle}</h1>
        </div>
      </div>

      <div className="container" style={{ marginTop: '2rem' }}>
        <Filters filters={filters} onChange={setFilters} onSearch={doSearch} />

        {loading && (
          <div className="loader"><div className="spinner" /></div>
        )}

        {!loading && searched && profiles.length === 0 && (
          <div className="empty-state">
            <div className="icon">🔍</div>
            <p>{t('common.noResults')}</p>
          </div>
        )}

        {!loading && profiles.length > 0 && (
          <>
            <p style={{ marginBottom: '1rem', color: 'var(--text-300)', fontSize: '0.9rem' }}>
              {profiles.length} {profiles.length === 1 ? 'profile' : 'profiles'} found
            </p>
            <div className="profile-grid">
              {profiles.map((p) => (
                <ProfileCard key={p.id} profile={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
