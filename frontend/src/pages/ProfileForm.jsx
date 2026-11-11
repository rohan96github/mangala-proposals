import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';

export default function ProfileForm() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams(); // undefined = new profile
  const isEdit = Boolean(id);
  const lang = i18n.language;

  const [districts, setDistricts] = useState([]);
  const [form, setForm] = useState({
    profile_for: 'self',
    full_name: '',
    gender: 'female',
    birth_date: '',
    height_cm: '',
    marital_status: 'never_married',
    religion: 'buddhist',
    caste: '',
    district_id: '',
    education: '',
    occupation: '',
    income_range: '',
    about: '',
    partner_pref: '',
    contact_phone: '',
    contact_email: '',
  });
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState(id || null);

  useEffect(() => {
    api.get('/districts').then(r => setDistricts(r.data)).catch(() => {});
    if (isEdit) {
      // load existing profile
      api.get(`/profiles/my/list`).then(r => {
        const p = r.data.find(x => String(x.id) === id);
        if (p) {
          setForm({
            profile_for: p.profile_for,
            full_name: p.full_name,
            gender: p.gender,
            birth_date: p.birth_date?.slice(0, 10) || '',
            height_cm: p.height_cm || '',
            marital_status: p.marital_status,
            religion: p.religion,
            caste: p.caste || '',
            district_id: p.district_id || '',
            education: p.education || '',
            occupation: p.occupation || '',
            income_range: p.income_range || '',
            about: p.about || '',
            partner_pref: p.partner_pref || '',
            contact_phone: p.contact_phone || '',
            contact_email: p.contact_email || '',
          });
        }
      });
    }
  }, [isEdit, id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let pid = profileId;
      if (isEdit) {
        await api.put(`/profiles/${id}`, form);
        pid = id;
        setSuccess('Profile updated! Awaiting re-approval.');
      } else {
        const res = await api.post('/profiles', form);
        pid = res.data.id;
        setProfileId(pid);
        setSuccess('Profile created! Awaiting admin approval.');
      }

      // Upload photo if chosen
      if (photo && pid) {
        const fd = new FormData();
        fd.append('photo', photo);
        await api.post(`/profiles/${pid}/photo`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  };

  const RELIGIONS = ['buddhist','hindu','christian','catholic','muslim','other'];
  const MARITAL   = ['never_married','divorced','widowed'];
  const PROFILE_FOR = ['self','son','daughter','brother','sister','other'];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>
        <span className="grad-text">
          {isEdit ? t('profile.editProfile') : t('profile.createNew')}
        </span>
      </h1>
      <p style={{ color: 'var(--text-300)', marginBottom: '2rem', fontSize: '0.9rem' }}>
        {isEdit ? 'Update your profile. It will need re-approval.' : 'Fill in the details below. Admin will approve within 24h.'}
      </p>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={submit}>
        {/* Section 1: Basic */}
        <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>1. Basic Details</h3>
          <div className="form-two-col">
            <div className="form-group">
              <label>{t('profile.profileFor')}</label>
              <select className="select" value={form.profile_for} onChange={e => set('profile_for', e.target.value)}>
                {PROFILE_FOR.map(v => <option key={v} value={v}>{t(`profileFor.${v}`)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>{t('profile.gender')} *</label>
              <select className="select" required value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="female">{t('common.female')}</option>
                <option value="male">{t('common.male')}</option>
              </select>
            </div>
          </div>

          <div className="form-group mt-2">
            <label>{t('profile.age').replace('{{count}}','').trim() || 'Full Name'} — Full Name *</label>
            <input
              className="input"
              required
              placeholder="Full name as in NIC"
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
            />
          </div>

          <div className="form-two-col mt-2">
            <div className="form-group">
              <label>{t('profile.birthDate')} *</label>
              <input className="input" type="date" required value={form.birth_date} onChange={e => set('birth_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t('profile.height')} ({t('common.cm')})</label>
              <input className="input" type="number" min={100} max={250} placeholder="165" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section 2: Background */}
        <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>2. Background</h3>
          <div className="form-two-col">
            <div className="form-group">
              <label>{t('profile.marital')} *</label>
              <select className="select" required value={form.marital_status} onChange={e => set('marital_status', e.target.value)}>
                {MARITAL.map(v => <option key={v} value={v}>{t(`marital.${v}`)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>{t('profile.religion')} *</label>
              <select className="select" required value={form.religion} onChange={e => set('religion', e.target.value)}>
                {RELIGIONS.map(v => <option key={v} value={v}>{t(`religion.${v}`)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-two-col mt-2">
            <div className="form-group">
              <label>{t('profile.caste')}</label>
              <input className="input" placeholder="Optional" value={form.caste} onChange={e => set('caste', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t('profile.district')}</label>
              <select className="select" value={form.district_id} onChange={e => set('district_id', e.target.value)}>
                <option value="">{t('filters.allDistricts')}</option>
                {districts.map(d => <option key={d.id} value={d.id}>{d[`name_${lang}`] || d.name_en}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Education & Work */}
        <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>3. Education &amp; Work</h3>
          <div className="form-two-col">
            <div className="form-group">
              <label>{t('profile.education')}</label>
              <input className="input" placeholder="B.Sc. Engineering" value={form.education} onChange={e => set('education', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t('profile.occupation')}</label>
              <input className="input" placeholder="Software Engineer" value={form.occupation} onChange={e => set('occupation', e.target.value)} />
            </div>
          </div>
          <div className="form-group mt-2">
            <label>{t('profile.income')}</label>
            <select className="select" value={form.income_range} onChange={e => set('income_range', e.target.value)}>
              <option value="">Prefer not to say</option>
              <option value="<50k">Below LKR 50,000</option>
              <option value="50k-100k">LKR 50,000 – 100,000</option>
              <option value="100k-200k">LKR 100,000 – 200,000</option>
              <option value="200k+">Above LKR 200,000</option>
            </select>
          </div>
        </div>

        {/* Section 4: About */}
        <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>4. About &amp; Preferences</h3>
          <div className="form-group">
            <label>{t('profile.about')}</label>
            <textarea className="textarea" rows={4} placeholder="Write a short description about yourself…" value={form.about} onChange={e => set('about', e.target.value)} />
          </div>
          <div className="form-group mt-2">
            <label>{t('profile.partnerPref')}</label>
            <textarea className="textarea" rows={3} placeholder="Describe your ideal partner…" value={form.partner_pref} onChange={e => set('partner_pref', e.target.value)} />
          </div>
        </div>

        {/* Section 5: Contact */}
        <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>5. Contact Details</h3>
          <p style={{ color: 'var(--text-400)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Contact details are only shared with accepted matches.
          </p>
          <div className="form-two-col">
            <div className="form-group">
              <label>{t('profile.contactPhone')}</label>
              <input className="input" type="tel" placeholder="+94 71 234 5678" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t('profile.contactEmail')}</label>
              <input className="input" type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section 6: Photo */}
        <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>6. {t('profile.photos')}</h3>
          <label className="upload-zone" htmlFor="photo-input">
            {photo
              ? <><div style={{ fontSize: '2rem' }}>✅</div><p>{photo.name}</p></>
              : <><div style={{ fontSize: '2rem' }}>📷</div><p>{t('profile.uploadPhoto')} (max 3 MB · JPG / PNG / WebP)</p></>
            }
          </label>
          <input
            id="photo-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={e => setPhoto(e.target.files[0] || null)}
          />
        </div>

        <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
          {loading ? t('common.loading') : (isEdit ? t('common.save') : t('auth.registerBtn').replace('Account','Profile'))}
        </button>
      </form>
    </div>
  );
}
