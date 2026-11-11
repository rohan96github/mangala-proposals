import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// Demo / Static Fallback Data for GitHub Pages & Preview
const MOCK_DISTRICTS = [
  { id: 1, name_en: 'Colombo', name_si: 'කොළඹ', name_ta: 'கொழும்பு' },
  { id: 2, name_en: 'Gampaha', name_si: 'ගම්පහ', name_ta: 'கம்பஹா' },
  { id: 3, name_en: 'Kalutara', name_si: 'කළුතර', name_ta: 'களுத்துறை' },
  { id: 4, name_en: 'Kandy', name_si: 'මහනුවර', name_ta: 'கண்டி' },
  { id: 5, name_en: 'Matale', name_si: 'මාතලේ', name_ta: 'மாத்தளை' },
  { id: 6, name_en: 'Nuwara Eliya', name_si: 'නුවරඑළිය', name_ta: 'நுவரெலியா' },
  { id: 7, name_en: 'Galle', name_si: 'ගාල්ල', name_ta: 'காலி' },
  { id: 8, name_en: 'Matara', name_si: 'මාතර', name_ta: 'மாத்தறை' },
  { id: 9, name_en: 'Hambantota', name_si: 'හම්බන්තොට', name_ta: 'அம்பாந்தோட்டை' },
  { id: 10, name_en: 'Jaffna', name_si: 'යාපනය', name_ta: 'யாழ்ப்பாணம்' },
  { id: 11, name_en: 'Kilinochchi', name_si: 'කිලිනොච්චි', name_ta: 'கிளிநொச்சி' },
  { id: 12, name_en: 'Mannar', name_si: 'මන්නාරම', name_ta: 'மன்னார்' },
  { id: 13, name_en: 'Vavuniya', name_si: 'වවුනියාව', name_ta: 'வவுனியா' },
  { id: 14, name_en: 'Mullaitivu', name_si: 'මුලතිව්', name_ta: 'முல்லைத்தீவு' },
  { id: 15, name_en: 'Batticaloa', name_si: 'මඩකලපුව', name_ta: 'மட்டக்களப்பு' },
  { id: 16, name_en: 'Ampara', name_si: 'අම්පාර', name_ta: 'அம்பாறை' },
  { id: 17, name_en: 'Trincomalee', name_si: 'ත්රිකුණාමලය', name_ta: 'திருகோணமலை' },
  { id: 18, name_en: 'Kurunegala', name_si: 'කුරුණෑගල', name_ta: 'குருணாகல்' },
  { id: 19, name_en: 'Puttalam', name_si: 'පුත්තලම', name_ta: 'புத்தளம்' },
  { id: 20, name_en: 'Anuradhapura', name_si: 'අනුරාධපුරය', name_ta: 'அனுராதபுரம்' },
  { id: 21, name_en: 'Polonnaruwa', name_si: 'පොළොන්නරුව', name_ta: 'பொலன்னறுவை' },
  { id: 22, name_en: 'Badulla', name_si: 'බදුල්ල', name_ta: 'பதுளை' },
  { id: 23, name_en: 'Monaragala', name_si: 'මොනරාගල', name_ta: 'மொணராகலை' },
  { id: 24, name_en: 'Ratnapura', name_si: 'රත්නපුර', name_ta: 'இரத்தினபுரி' },
  { id: 25, name_en: 'Kegalle', name_si: 'කෑගල්ල', name_ta: 'கேகாலை' },
];

const MOCK_PROFILES = [
  {
    id: 1,
    ref_code: 'M10001',
    profile_for: 'daughter',
    full_name: 'Thilini Pathirana',
    gender: 'female',
    age: 26,
    birth_date: '1998-05-14',
    height_cm: 162,
    marital_status: 'never_married',
    religion: 'buddhist',
    caste: 'Govigama',
    district_en: 'Colombo',
    district_si: 'කොළඹ',
    district_ta: 'கொழும்பு',
    education: 'BSc in IT (University of Colombo)',
    occupation: 'Software Engineer',
    income_range: 'LKR 100,000 – 200,000',
    about: 'Well-mannered, educated daughter looking for a suitable partner.',
    partner_pref: 'Educated professional from a respectable family.',
    status: 'approved',
  },
  {
    id: 2,
    ref_code: 'M10002',
    profile_for: 'son',
    full_name: 'Kavinda Jayasuriya',
    gender: 'male',
    age: 29,
    birth_date: '1995-11-20',
    height_cm: 175,
    marital_status: 'never_married',
    religion: 'buddhist',
    caste: 'Govigama',
    district_en: 'Gampaha',
    district_si: 'ගම්පහ',
    district_ta: 'கம்பஹா',
    education: 'CIMA Passed Finalist, MBA',
    occupation: 'Senior Financial Analyst',
    income_range: 'Above LKR 200,000',
    about: 'Kind-hearted son working at a reputed multinational firm.',
    partner_pref: 'Kind, understanding girl with good family values.',
    status: 'approved',
  },
  {
    id: 3,
    ref_code: 'M10003',
    profile_for: 'self',
    full_name: 'Praveena Wickramasinghe',
    gender: 'female',
    age: 27,
    birth_date: '1997-03-08',
    height_cm: 158,
    marital_status: 'never_married',
    religion: 'christian',
    caste: 'Karava',
    district_en: 'Kandy',
    district_si: 'මහනුවර',
    district_ta: 'கண்டி',
    education: 'BA (Hons) in English Literature',
    occupation: 'Lecturer',
    income_range: 'LKR 50,000 – 100,000',
    about: 'Passionate about literature, values mutual respect.',
    partner_pref: 'Educated professional who appreciates arts and harmony.',
    status: 'approved',
  },
  {
    id: 4,
    ref_code: 'M10004',
    profile_for: 'self',
    full_name: 'Roshan Senanayake',
    gender: 'male',
    age: 31,
    birth_date: '1993-08-25',
    height_cm: 180,
    marital_status: 'divorced',
    religion: 'buddhist',
    caste: 'Govigama',
    district_en: 'Kurunegala',
    district_si: 'කුරුණෑගල',
    district_ta: 'குருணாகல்',
    education: 'BSc Civil Engineering',
    occupation: 'Civil Engineer / Contractor',
    income_range: 'Above LKR 200,000',
    about: 'Seeking a fresh start with understanding partner.',
    partner_pref: 'Simple, caring partner from a good family background.',
    status: 'approved',
  },
];

// Fallback interceptor when backend is offline (e.g. GitHub Pages preview)
api.interceptors.response.use(
  res => res,
  err => {
    // Only handle when network is unreachable
    if (!err.response) {
      const url = (err.config?.url || '').replace(/^\/api/, '');
      const method = (err.config?.method || 'get').toLowerCase();

      if (url.includes('/districts')) {
        return Promise.resolve({ data: MOCK_DISTRICTS, status: 200 });
      }

      if (url.includes('/profiles') && method === 'get') {
        const params = err.config?.params || {};
        let filtered = [...MOCK_PROFILES];
        if (params.gender) filtered = filtered.filter(p => p.gender === params.gender);
        if (params.religion) filtered = filtered.filter(p => p.religion === params.religion);
        return Promise.resolve({ data: filtered, status: 200 });
      }

      if (url.includes('/auth/admin-login') && method === 'post') {
        try {
          const body = JSON.parse(err.config.data || '{}');
          if (
            (body.email === 'admin@youremail.com' || body.email === 'root' || body.email === 'admin') &&
            body.password === 'Rohan@123'
          ) {
            return Promise.resolve({
              data: { token: 'demo-admin-jwt-token', role: 'admin', preferred_lang: 'si' },
              status: 200,
            });
          }
        } catch (e) {}
      }

      if (url.includes('/admin/stats')) {
        return Promise.resolve({
          data: { users: 15, verified: 12, pending: 2, approved: 48, openReports: 0, interests: 24 },
          status: 200,
        });
      }

      if (url.includes('/admin/profiles')) {
        return Promise.resolve({ data: MOCK_PROFILES, status: 200 });
      }

      if (url.includes('/admin/users')) {
        return Promise.resolve({
          data: [
            { id: 1, email: 'admin@youremail.com', phone: '0712345678', role: 'admin', is_active: 1, is_verified: 1, created_at: new Date().toISOString() },
            { id: 2, email: 'thilini.p@example.com', phone: '0712345678', role: 'user', is_active: 1, is_verified: 1, created_at: new Date().toISOString() },
            { id: 3, email: 'kavinda.j@example.com', phone: '0776543210', role: 'user', is_active: 1, is_verified: 1, created_at: new Date().toISOString() },
          ],
          status: 200,
        });
      }

      if (url.includes('/admin/reports')) {
        return Promise.resolve({ data: [], status: 200 });
      }
    }
    return Promise.reject(err);
  }
);

export default api;
