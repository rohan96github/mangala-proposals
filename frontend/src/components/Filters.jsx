import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';

export default function Filters({ filters, onChange, onSearch }) {
  const { t, i18n } = useTranslation();
  const [districts, setDistricts] = useState([]);
  const lang = i18n.language;

  useEffect(() => {
    api.get('/districts').then(r => setDistricts(r.data)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    onChange({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="filters-bar">
      {/* Gender */}
      <div className="form-group">
        <label>{t('filters.gender')}</label>
        <select className="select" name="gender" value={filters.gender} onChange={handleChange}>
          <option value="">{t('filters.allGenders')}</option>
          <option value="female">{t('filters.female')}</option>
          <option value="male">{t('filters.male')}</option>
        </select>
      </div>

      {/* Religion */}
      <div className="form-group">
        <label>{t('profile.religion')}</label>
        <select className="select" name="religion" value={filters.religion} onChange={handleChange}>
          <option value="">{t('filters.anyReligion')}</option>
          {['buddhist','hindu','christian','catholic','muslim','other'].map(r => (
            <option key={r} value={r}>{t(`religion.${r}`)}</option>
          ))}
        </select>
      </div>

      {/* District */}
      <div className="form-group">
        <label>{t('profile.district')}</label>
        <select className="select" name="district_id" value={filters.district_id} onChange={handleChange}>
          <option value="">{t('filters.allDistricts')}</option>
          {districts.map(d => (
            <option key={d.id} value={d.id}>{d[`name_${lang}`] || d.name_en}</option>
          ))}
        </select>
      </div>

      {/* Min age */}
      <div className="form-group">
        <label>{t('filters.minAge')}</label>
        <input
          className="input"
          type="number"
          name="min_age"
          min={18} max={80}
          placeholder="18"
          value={filters.min_age}
          onChange={handleChange}
          style={{ width: 80 }}
        />
      </div>

      {/* Max age */}
      <div className="form-group">
        <label>{t('filters.maxAge')}</label>
        <input
          className="input"
          type="number"
          name="max_age"
          min={18} max={80}
          placeholder="60"
          value={filters.max_age}
          onChange={handleChange}
          style={{ width: 80 }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        <button className="btn btn-primary" onClick={onSearch}>{t('filters.search')}</button>
        <button
          className="btn btn-ghost"
          onClick={() => {
            onChange({ gender: '', religion: '', district_id: '', min_age: '', max_age: '' });
            onSearch();
          }}
        >
          {t('filters.clear')}
        </button>
      </div>
    </div>
  );
}
