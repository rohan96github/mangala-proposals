import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';

/* ── Small modal helper ── */
function Modal({ title, onClose, maxWidth = 580, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: 'var(--bg-800)', borderRadius: 'var(--radius-lg)', width: '100%',
        maxWidth, padding: '2rem', border: '1px solid rgba(255,255,255,.1)',
        boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-300)', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Admin() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [stats, setStats]       = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [users, setUsers]       = useState([]);
  const [reports, setReports]   = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState('');

  // Modals
  const [showCreateUser, setShowCreateUser]       = useState(false);
  const [showEditProfile, setShowEditProfile]     = useState(null); // profile object
  const [showResetPw, setShowResetPw]             = useState(null); // user object
  const [showImportModal, setShowImportModal]     = useState(false);
  const [profileStatusFilter, setProfileStatusFilter] = useState('pending');

  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');

  useEffect(() => {
    if (!token || role !== 'admin') { navigate('/admin/login'); return; }
    loadAll();
  }, []); // eslint-disable-line

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, u, r] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/reports?status=open'),
      ]);
      setStats(s.data);
      setUsers(u.data);
      setReports(r.data);
      await loadProfiles(profileStatusFilter);
    } catch { navigate('/admin/login'); }
    finally { setLoading(false); }
  };

  const loadProfiles = async (status = profileStatusFilter) => {
    const res = await api.get(`/admin/profiles?status=${status}`);
    setProfiles(res.data);
  };

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  /* ── Profile actions ── */
  const updateProfileStatus = async (id, status) => {
    await api.patch(`/admin/profiles/${id}`, { status });
    flash(`Profile ${status}`);
    loadProfiles();
    loadAll();
  };
  const deleteProfile = async (id) => {
    if (!window.confirm('Delete this profile permanently?')) return;
    await api.delete(`/admin/profiles/${id}`);
    flash('Profile deleted');
    loadProfiles();
  };

  /* ── User actions ── */
  const toggleUser = async (user) => {
    await api.patch(`/admin/users/${user.id}`, { is_active: !user.is_active });
    setUsers(us => us.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
  };
  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user and ALL their data permanently?')) return;
    await api.delete(`/admin/users/${id}`);
    setUsers(us => us.filter(u => u.id !== id));
    flash('User deleted');
  };

  /* ── Report actions ── */
  const updateReport = async (id, status) => {
    await api.patch(`/admin/reports/${id}`, { status });
    setReports(rs => rs.filter(r => r.id !== id));
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  const TABS = [
    { key: 'pending',  label: `⏳ Pending (${stats?.pending || 0})` },
    { key: 'profiles', label: `📋 All Profiles` },
    { key: 'users',    label: `👥 Users (${stats?.users || 0})` },
    { key: 'reports',  label: `🚩 Reports (${stats?.openReports || 0})` },
  ];

  return (
    <div style={{ maxWidth: 1150, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1>
          <span style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ⚙️ {t('admin.title')}
          </span>
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreateUser(true)}>
            + Create Customer
          </button>
          <button className="btn btn-primary btn-sm" style={{ background: 'var(--clr-gold)' }} onClick={() => setShowImportModal(true)}>
            📥 Import Profiles
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            localStorage.removeItem('token'); localStorage.removeItem('role'); navigate('/admin/login');
          }}>
            🔐 Logout
          </button>
        </div>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {/* Stats */}
      {stats && (
        <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
          {[
            { icon: '👥', val: stats.users,       label: 'Total Users' },
            { icon: '✅', val: stats.verified,     label: 'Verified Users' },
            { icon: '🟢', val: stats.approved,     label: 'Live Profiles' },
            { icon: '⏳', val: stats.pending,      label: 'Pending Review' },
            { icon: '🚩', val: stats.openReports,  label: 'Open Reports' },
            { icon: '💌', val: stats.interests,    label: 'Interests Sent' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-card__icon">{s.icon}</div>
              <div>
                <div className="stat-card__number">{s.val}</div>
                <div className="stat-card__label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(tab => (
          <button key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Pending profiles ── */}
      {activeTab === 'pending' && (
        <ProfileTable
          profiles={profiles.filter(p => p.status === 'pending')}
          onApprove={id => updateProfileStatus(id, 'approved')}
          onReject={id => updateProfileStatus(id, 'rejected')}
          onHide={id => updateProfileStatus(id, 'hidden')}
          onDelete={deleteProfile}
          onEdit={p => setShowEditProfile(p)}
          t={t}
        />
      )}

      {/* ── TAB: All profiles ── */}
      {activeTab === 'profiles' && (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-300)', fontSize: '0.9rem' }}>Filter:</span>
            {['all','approved','pending','rejected','hidden'].map(s => (
              <button key={s}
                className={`btn btn-sm ${profileStatusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => { setProfileStatusFilter(s); loadProfiles(s); }}>
                {s}
              </button>
            ))}
          </div>
          <ProfileTable
            profiles={profiles}
            onApprove={id => updateProfileStatus(id, 'approved')}
            onReject={id => updateProfileStatus(id, 'rejected')}
            onHide={id => updateProfileStatus(id, 'hidden')}
            onDelete={deleteProfile}
            onEdit={p => setShowEditProfile(p)}
            t={t}
          />
        </>
      )}

      {/* ── TAB: Users ── */}
      {activeTab === 'users' && (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>Email</th><th>Phone</th>
                <th>Verified</th><th>Role</th><th>Status</th><th>Source</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--text-400)', fontSize: '0.8rem' }}>{u.id}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td>
                    {u.is_verified
                      ? <span className="chip chip-green">✅ Verified</span>
                      : <span className="chip chip-gray">⏳ Pending</span>}
                  </td>
                  <td>
                    <span className={`chip ${u.role === 'admin' ? 'chip-gold' : 'chip-blue'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.is_active
                      ? <span className="chip chip-green">Active</span>
                      : <span className="chip chip-red">Inactive</span>}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-400)' }}>
                    {u.admin_created ? '👤 Admin' : '🌐 Self'}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-400)' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <button className={`btn btn-sm ${u.is_active ? 'btn-ghost' : 'btn-primary'}`}
                        style={u.is_active ? { color: 'var(--clr-warning)' } : {}}
                        onClick={() => toggleUser(u)}>
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => setShowResetPw(u)}>
                        🔑 Reset PW
                      </button>
                      <button className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--clr-danger)' }}
                        onClick={() => deleteUser(u.id)}>
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB: Reports ── */}
      {activeTab === 'reports' && (
        <div>
          {reports.length === 0
            ? <div className="empty-state"><div className="icon">✅</div><p>No open reports!</p></div>
            : reports.map(r => (
              <div className="interest-row" key={r.id}>
                <div>
                  <strong>Profile:</strong> {r.profile_name} &nbsp;·&nbsp;
                  <strong>Reporter:</strong> {r.reporter_email}
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-400)', marginTop: '0.25rem' }}>{r.reason}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => updateReport(r.id, 'reviewed')}>Reviewed</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => updateReport(r.id, 'closed')}>Close</button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ════ MODAL: Create Customer ════ */}
      {showCreateUser && (
        <CreateCustomerModal
          onClose={() => setShowCreateUser(false)}
          onSuccess={() => { setShowCreateUser(false); loadAll(); flash('✅ Customer account created!'); }}
        />
      )}

      {/* ════ MODAL: Edit Profile ════ */}
      {showEditProfile && (
        <EditProfileModal
          profile={showEditProfile}
          onClose={() => setShowEditProfile(null)}
          onSuccess={() => { setShowEditProfile(null); loadProfiles(); flash('✅ Profile updated!'); }}
          t={t}
        />
      )}

      {/* ════ MODAL: Reset Password ════ */}
      {showResetPw && (
        <ResetPasswordModal
          user={showResetPw}
          onClose={() => setShowResetPw(null)}
          onSuccess={() => { setShowResetPw(null); flash('✅ Password reset!'); }}
        />
      )}

      {/* ════ MODAL: Import Profiles ════ */}
      {showImportModal && (
        <ImportProfilesModal
          onClose={() => setShowImportModal(false)}
          onSuccess={(msg) => { setShowImportModal(false); flash(msg); loadAll(); }}
        />
      )}
    </div>
  );
}

/* ── Profile table sub-component ── */
function ProfileTable({ profiles, onApprove, onReject, onHide, onDelete, onEdit, t }) {
  if (profiles.length === 0)
    return <div className="empty-state"><div className="icon">🎉</div><p>No profiles here.</p></div>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Ref</th><th>Name</th><th>Age</th><th>Gender</th>
            <th>Religion</th><th>District</th><th>Status</th><th>User</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map(p => (
            <tr key={p.id}>
              <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-400)' }}>{p.ref_code}</td>
              <td>
                <a href={`/profile/${p.id}`} target="_blank" rel="noreferrer"
                  style={{ color: 'var(--clr-primary-lt)' }}>{p.full_name}</a>
              </td>
              <td>{p.age}</td>
              <td>{t(`common.${p.gender}`)}</td>
              <td>{t(`religion.${p.religion}`)}</td>
              <td>{p.district_en || '—'}</td>
              <td><span className={`status-badge status-${p.status}`}>{p.status}</span></td>
              <td style={{ fontSize: '0.78rem', color: 'var(--text-400)' }}>{p.user_email}</td>
              <td>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {p.status !== 'approved' &&
                    <button className="btn btn-sm" style={{ background: 'var(--clr-success)', color: '#fff' }}
                      onClick={() => onApprove(p.id)}>✅</button>}
                  {p.status !== 'rejected' &&
                    <button className="btn btn-sm" style={{ background: 'var(--clr-danger)', color: '#fff' }}
                      onClick={() => onReject(p.id)}>✗</button>}
                  <button className="btn btn-ghost btn-sm" onClick={() => onHide(p.id)}>🙈</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => onEdit(p)}>✏️</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--clr-danger)' }}
                    onClick={() => onDelete(p.id)}>🗑</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Modal: Create Customer Account ── */
function CreateCustomerModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ email: '', phone: '', password: '', preferred_lang: 'si' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/admin/users', form);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="➕ Create Customer Account" onClose={onClose}>
      <div className="alert alert-info" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
        Admin-created accounts are <strong>auto-verified</strong> — no OTP needed.
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group">
          <label>Email *</label>
          <input className="input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input className="input" type="tel" placeholder="+94 71 234 5678" value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Password * (min 8 chars)</label>
          <input className="input" type="text" required minLength={8} value={form.password} onChange={e => set('password', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Language</label>
          <select className="select" value={form.preferred_lang} onChange={e => set('preferred_lang', e.target.value)}>
            <option value="si">සිංහල</option>
            <option value="en">English</option>
            <option value="ta">தமிழ்</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 1 }}>
            {loading ? 'Creating…' : '✅ Create Account'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Modal: Edit Profile ── */
function EditProfileModal({ profile, onClose, onSuccess, t }) {
  const [form, setForm] = useState({ ...profile });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/admin/profiles/${profile.id}`, form);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`✏️ Edit: ${profile.full_name}`} onClose={onClose}>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div className="form-two-col">
          <div className="form-group">
            <label>Full Name</label>
            <input className="input" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
              {['approved','pending','rejected','hidden'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="form-two-col">
          <div className="form-group">
            <label>Gender</label>
            <select className="select" value={form.gender} onChange={e => set('gender', e.target.value)}>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
          <div className="form-group">
            <label>Religion</label>
            <select className="select" value={form.religion} onChange={e => set('religion', e.target.value)}>
              {['buddhist','hindu','christian','catholic','muslim','other'].map(r =>
                <option key={r} value={r}>{t(`religion.${r}`)}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Education</label>
          <input className="input" value={form.education || ''} onChange={e => set('education', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Occupation</label>
          <input className="input" value={form.occupation || ''} onChange={e => set('occupation', e.target.value)} />
        </div>
        <div className="form-group">
          <label>About</label>
          <textarea className="textarea" rows={3} value={form.about || ''} onChange={e => set('about', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Contact Phone</label>
          <input className="input" value={form.contact_phone || ''} onChange={e => set('contact_phone', e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 1 }}>
            {loading ? 'Saving…' : '💾 Save Changes'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Modal: Import Profiles (XLSX Bulk Upload) ── */
function ImportProfilesModal({ onClose, onSuccess }) {
  const [file, setFile]             = useState(null);
  const [loading, setLoading]       = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError]           = useState('');
  const [preview, setPreview]       = useState(null);

  const ALL_FIELDS = [
    { name: 'Ref Code', req: false, note: 'e.g. M10001 (auto-generated if empty)' },
    { name: 'Profile For *', req: true, note: 'Self, Son, Daughter, Brother, Sister, Other' },
    { name: 'Gender *', req: true, note: 'Male, Female' },
    { name: 'Full Name *', req: true, note: 'Full name of candidate' },
    { name: 'Date of Birth * (YYYY-MM-DD)', req: true, note: 'e.g. 1998-05-14 or Excel date' },
    { name: 'Height (cm)', req: false, note: 'Number in cm (e.g. 162)' },
    { name: 'Marital Status *', req: true, note: 'Never Married, Divorced, Widowed' },
    { name: 'Religion *', req: true, note: 'Buddhist, Hindu, Christian, Catholic, Muslim, Other' },
    { name: 'Caste', req: false, note: 'e.g. Govigama, Karava, etc.' },
    { name: 'District', req: false, note: 'District name (Colombo, Kandy, etc.) or ID (1-25)' },
    { name: 'Education / Profession', req: false, note: 'e.g. BSc in IT, MBA' },
    { name: 'Occupation', req: false, note: 'e.g. Software Engineer, Doctor, Teacher' },
    { name: 'Income Range', req: false, note: 'e.g. LKR 100,000 – 200,000' },
    { name: 'About', req: false, note: 'Brief personal description' },
    { name: 'Partner Preferences', req: false, note: 'Expectations for the partner' },
    { name: 'Contact Phone', req: false, note: 'Phone number' },
    { name: 'Contact Email', req: false, note: 'Email address' },
    { name: 'Consent Given (Y/N) *', req: true, note: 'Must be Y (Yes) to publish profile' },
    { name: 'Status', req: false, note: 'approved, pending, rejected, hidden (default: approved)' },
  ];

  const handleFile = (e) => {
    const f = e.target.files[0];
    setFile(f || null);
    setPreview(null);
    setError('');
    if (f) setPreview(`📄 Selected: ${f.name} (${(f.size / 1024).toFixed(1)} KB)`);
  };

  const downloadTemplate = async () => {
    setDownloading(true);
    setError('');
    try {
      const res = await api.get('/admin/import-template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Profiles_Import_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Could not download template. Please ensure backend is running.');
    } finally {
      setDownloading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select an .xlsx file first');
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/admin/import-profiles', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { inserted, skipped, total } = res.data;
      onSuccess(`✅ ${inserted} profile(s) imported successfully! (${skipped || 0} skipped, total rows: ${total || inserted})`);
    } catch (err) {
      setError(err.response?.data?.error || 'Import failed. Please check the Excel format.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="📥 Bulk Import Profiles (Excel / XLSX)" onClose={onClose} maxWidth={680}>
      {/* Top Banner with Download Template Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        background: 'rgba(124,58,237,.1)',
        border: '1px solid rgba(124,58,237,.25)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.85rem 1rem',
        marginBottom: '1.25rem',
      }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Need the official template?</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-300)', marginTop: '0.15rem' }}>
            Download the pre-formatted 19-column Excel template with sample rows.
          </div>
        </div>
        <button
          type="button"
          className="btn btn-sm"
          style={{ background: 'var(--clr-gold)', color: '#111', fontWeight: 600 }}
          onClick={downloadTemplate}
          disabled={downloading}
        >
          {downloading ? '⏳ Downloading…' : '📥 Download Template (.xlsx)'}
        </button>
      </div>

      {/* Required & Supported Fields Reference Box */}
      <div style={{
        background: 'var(--bg-900)',
        border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 'var(--radius-sm)',
        padding: '1rem',
        marginBottom: '1.25rem',
        maxHeight: '220px',
        overflowY: 'auto',
      }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--clr-primary-lt)', marginBottom: '0.5rem' }}>
          📋 Template Fields & Column Specifications (19 Fields):
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.4rem', fontSize: '0.78rem' }}>
          {ALL_FIELDS.map((f, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,.03)',
              padding: '0.4rem 0.6rem',
              borderRadius: '4px',
              borderLeft: f.req ? '3px solid var(--clr-gold)' : '3px solid rgba(255,255,255,.2)'
            }}>
              <span style={{ fontWeight: f.req ? 700 : 500, color: f.req ? '#fbbf24' : 'var(--text-200)' }}>
                {f.name}
              </span>
              <div style={{ color: 'var(--text-400)', fontSize: '0.72rem', marginTop: '0.1rem' }}>
                {f.note}
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
      {preview && <div style={{ fontSize: '0.85rem', color: 'var(--clr-success)', marginBottom: '0.75rem', fontWeight: 500 }}>{preview}</div>}

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group">
          <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>Choose .xlsx file to upload</label>
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            required
            onChange={handleFile}
            style={{
              padding: '0.6rem',
              background: 'var(--bg-900)',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed rgba(255,255,255,.2)',
              color: 'var(--text-100)',
              width: '100%',
              cursor: 'pointer'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading || !file}
            style={{ flex: 1, fontWeight: 600 }}
          >
            {loading ? '⏳ Importing Profiles…' : '🚀 Import Profiles Now'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Modal: Reset Password ── */
function ResetPasswordModal({ user, onClose, onSuccess }) {  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8) return setError('Min 8 characters');
    setLoading(true);
    try {
      await api.patch(`/admin/users/${user.id}/password`, { password: pw });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`🔑 Reset Password: ${user.email}`} onClose={onClose}>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group">
          <label>New Password</label>
          <input className="input" type="text" minLength={8} required
            placeholder="Enter new password"
            value={pw} onChange={e => setPw(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 1 }}>
            {loading ? 'Resetting…' : '🔑 Reset Password'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}
