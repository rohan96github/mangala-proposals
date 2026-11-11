const router = require('express').Router();
const db = require('../config/db');

const upload = require('../middleware/upload');

const { requireAuth, requireAdmin } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

/* ═══════════════════════════════
   DASHBOARD STATS
═══════════════════════════════ */
router.get('/stats', async (req, res) => {
  try {
    const [[users]]     = await db.query('SELECT COUNT(*) AS total FROM users');
    const [[verified]]  = await db.query('SELECT COUNT(*) AS total FROM users WHERE is_verified = 1');
    const [[pending]]   = await db.query("SELECT COUNT(*) AS total FROM profiles WHERE status = 'pending'");
    const [[approved]]  = await db.query("SELECT COUNT(*) AS total FROM profiles WHERE status = 'approved'");
    const [[reports]]   = await db.query("SELECT COUNT(*) AS total FROM reports WHERE status = 'open'");
    const [[interests]] = await db.query('SELECT COUNT(*) AS total FROM interests');
    res.json({
      users: users.total,
      verified: verified.total,
      pending: pending.total,
      approved: approved.total,
      openReports: reports.total,
      interests: interests.total,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ═══════════════════════════════
   USER MANAGEMENT
═══════════════════════════════ */

// List all users
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, email, phone, role, is_active, is_verified, preferred_lang,
              admin_created, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// CREATE a customer account (admin creates for customer)
router.post('/users', async (req, res) => {
  try {
    const { email, phone, password, preferred_lang } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const [exists] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const lang = ['si', 'en', 'ta'].includes(preferred_lang) ? preferred_lang : 'si';

    // Admin-created accounts are auto-verified (no OTP needed)
    const [r] = await db.query(
      `INSERT INTO users (email, phone, password_hash, preferred_lang, is_verified, admin_created, role)
       VALUES (?, ?, ?, ?, 1, 1, 'user')`,
      [email, phone || null, hash, lang]
    );
    res.status(201).json({ id: r.insertId, message: 'Customer account created (auto-verified)' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE a user
router.put('/users/:id', async (req, res) => {
  try {
    const { email, phone, preferred_lang, is_active, is_verified, role } = req.body;
    await db.query(
      `UPDATE users SET
         email = COALESCE(?, email),
         phone = COALESCE(?, phone),
         preferred_lang = COALESCE(?, preferred_lang),
         is_active = COALESCE(?, is_active),
         is_verified = COALESCE(?, is_verified),
         role = COALESCE(?, role)
       WHERE id = ?`,
      [email, phone, preferred_lang, is_active, is_verified, role, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset user password (admin action)
router.patch('/users/:id/password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const hash = await bcrypt.hash(password, 12);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Activate / Deactivate user
router.patch('/users/:id', async (req, res) => {
  try {
    const updates = {};
    if (req.body.is_active  !== undefined) updates.is_active  = req.body.is_active  ? 1 : 0;
    if (req.body.is_verified !== undefined) updates.is_verified = req.body.is_verified ? 1 : 0;
    if (req.body.role)                     updates.role        = req.body.role;

    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values     = [...Object.values(updates), req.params.id];
    await db.query(`UPDATE users SET ${setClauses} WHERE id = ?`, values);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE a user
router.delete('/users/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ═══════════════════════════════
   PROFILE MANAGEMENT
═══════════════════════════════ */

// List profiles by status
router.get('/profiles', async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const query = status === 'all'
      ? `SELECT p.*, u.email AS user_email, d.name_en AS district_en,
                TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) AS age
         FROM profiles p
         JOIN users u ON u.id = p.user_id
         LEFT JOIN districts d ON d.id = p.district_id
         ORDER BY p.created_at DESC`
      : `SELECT p.*, u.email AS user_email, d.name_en AS district_en,
                TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) AS age
         FROM profiles p
         JOIN users u ON u.id = p.user_id
         LEFT JOIN districts d ON d.id = p.district_id
         WHERE p.status = ?
         ORDER BY p.created_at ASC`;

    const [rows] = status === 'all'
      ? await db.query(query)
      : await db.query(query, [status]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// CREATE a profile (admin can create on behalf of user)
router.post('/profiles', async (req, res) => {
  try {
    const p = req.body;
    const refCode = 'M' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const [r] = await db.query(
      `INSERT INTO profiles
       (user_id, ref_code, profile_for, full_name, gender, birth_date, height_cm,
        marital_status, religion, caste, district_id, education, occupation, income_range,
        about, partner_pref, contact_phone, contact_email, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'approved')`,
      [
        p.user_id, refCode, p.profile_for || 'self', p.full_name, p.gender, p.birth_date,
        p.height_cm || null, p.marital_status || 'never_married', p.religion,
        p.caste || null, p.district_id || null, p.education || null, p.occupation || null,
        p.income_range || null, p.about || null, p.partner_pref || null,
        p.contact_phone || null, p.contact_email || null,
      ]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------------------------------------------------------------
// ------------------------------------------------------------------
// Download official XLSX import template
// ------------------------------------------------------------------
router.get('/import-template', (req, res) => {
  const path = require('path');
  const fs = require('fs');
  const templatePath = path.resolve(__dirname, '../uploads/Profiles_Import_Template.xlsx');
  if (!fs.existsSync(templatePath)) {
    return res.status(404).json({ error: 'Template file not found' });
  }
  res.download(templatePath, 'Profiles_Import_Template.xlsx');
});

// ------------------------------------------------------------------
// Bulk import profiles from XLSX (admin only)
// ------------------------------------------------------------------
router.post('/import-profiles', upload.xlsx.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const xlsx = require('xlsx');
    const workbook = xlsx.readFile(req.file.path, { cellDates: true });
    const sheetName = workbook.SheetNames.includes('Profiles') ? 'Profiles' : workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

    if (!rows.length) return res.status(400).json({ error: 'Empty spreadsheet or no data rows found' });

    // Pre-fetch districts lookup map
    const [distRows] = await db.query('SELECT id, name_en, name_si, name_ta FROM districts');
    const districtMap = new Map();
    for (const d of distRows) {
      districtMap.set(String(d.id), d.id);
      if (d.name_en) districtMap.set(d.name_en.trim().toLowerCase(), d.id);
      if (d.name_si) districtMap.set(d.name_si.trim().toLowerCase(), d.id);
      if (d.name_ta) districtMap.set(d.name_ta.trim().toLowerCase(), d.id);
    }

    const values = [];
    const placeholders = [];
    const DEFAULT_USER_ID = req.user?.id || 1;
    const generateRef = () => 'M' + Math.random().toString(36).slice(2, 8).toUpperCase();

    let skipped = 0;

    for (const rawRow of rows) {
      // Normalize object keys: lowercase and alphanumeric only
      const r = {};
      for (const [k, v] of Object.entries(rawRow)) {
        if (!k) continue;
        const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        r[cleanKey] = v;
      }

      // Helper to find value from key aliases
      const getVal = (...keys) => {
        for (const k of keys) {
          const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (r[cleanK] !== undefined && r[cleanK] !== null && String(r[cleanK]).trim() !== '') {
            return r[cleanK];
          }
        }
        return null;
      };

      // 1. Full Name *
      const fullName = getVal('Full Name *', 'Full Name', 'fullname', 'name');
      if (!fullName) {
        skipped++;
        continue;
      }

      // 2. Gender *
      let gender = getVal('Gender *', 'Gender', 'gender');
      if (gender) {
        const gLow = String(gender).trim().toLowerCase();
        if (gLow.startsWith('f') || gLow === 'female' || gLow === 'woman' || gLow === 'bride') gender = 'female';
        else if (gLow.startsWith('m') || gLow === 'male' || gLow === 'man' || gLow === 'groom') gender = 'male';
        else gender = null;
      }
      if (!gender) {
        skipped++;
        continue;
      }

      // 3. Date of Birth * (YYYY-MM-DD)
      const rawDob = getVal('Date of Birth * (YYYY-MM-DD)', 'Date of Birth', 'dateofbirth', 'birthdate', 'dob');
      let birthDate = null;
      if (rawDob instanceof Date && !isNaN(rawDob.getTime())) {
        birthDate = rawDob.toISOString().slice(0, 10);
      } else if (typeof rawDob === 'number') {
        const d = new Date(Math.round((rawDob - 25569) * 86400 * 1000));
        if (!isNaN(d.getTime())) birthDate = d.toISOString().slice(0, 10);
      } else if (rawDob) {
        const dStr = String(rawDob).trim();
        const d = new Date(dStr);
        if (!isNaN(d.getTime())) {
          birthDate = d.toISOString().slice(0, 10);
        }
      }
      if (!birthDate) {
        birthDate = '1995-01-01';
      }

      // 4. Consent Given (Y/N) *
      const consentRaw = getVal('Consent Given (Y/N) *', 'Consent Given', 'consent', 'consentgiven');
      let consentGiven = 1;
      if (consentRaw) {
        const cStr = String(consentRaw).trim().toLowerCase();
        if (cStr === 'n' || cStr === 'no' || cStr === '0' || cStr === 'false') {
          consentGiven = 0;
          skipped++;
          continue; // Consent is required
        }
      }

      // 5. Ref Code
      let refCode = getVal('Ref Code', 'refcode', 'ref');
      if (refCode) {
        refCode = String(refCode).trim().toUpperCase().slice(0, 12);
      } else {
        refCode = generateRef();
      }

      // 6. Profile For *
      let profileFor = getVal('Profile For *', 'Profile For', 'profilefor');
      if (profileFor) {
        const pf = String(profileFor).trim().toLowerCase();
        if (pf === 'myself' || pf === 'self') profileFor = 'self';
        else if (['son', 'daughter', 'brother', 'sister', 'other'].includes(pf)) profileFor = pf;
        else profileFor = 'self';
      } else {
        profileFor = 'self';
      }

      // 7. Height (cm)
      const rawHeight = getVal('Height (cm)', 'Height', 'height', 'heightcm');
      const heightCm = rawHeight && !isNaN(parseInt(rawHeight, 10)) ? parseInt(rawHeight, 10) : null;

      // 8. Marital Status *
      let maritalStatus = getVal('Marital Status *', 'Marital Status', 'maritalstatus');
      if (maritalStatus) {
        const ms = String(maritalStatus).trim().toLowerCase().replace(/[^a-z]/g, '');
        if (ms.includes('divorce')) maritalStatus = 'divorced';
        else if (ms.includes('widow')) maritalStatus = 'widowed';
        else maritalStatus = 'never_married';
      } else {
        maritalStatus = 'never_married';
      }

      // 9. Religion *
      let religion = getVal('Religion *', 'Religion', 'religion');
      if (religion) {
        const rel = String(religion).trim().toLowerCase();
        if (['buddhist', 'hindu', 'christian', 'catholic', 'muslim'].includes(rel)) religion = rel;
        else religion = 'other';
      } else {
        religion = 'buddhist';
      }

      // 10. Caste
      const caste = getVal('Caste', 'caste') ? String(getVal('Caste', 'caste')).trim().slice(0, 60) : null;

      // 11. District
      const rawDistrict = getVal('District', 'district', 'districtid');
      let districtId = null;
      if (rawDistrict) {
        const cleanDist = String(rawDistrict).trim().toLowerCase();
        if (districtMap.has(cleanDist)) {
          districtId = districtMap.get(cleanDist);
        }
      }

      // 12. Education / Profession
      const education = getVal('Education / Profession', 'Education', 'education', 'educationprofession')
        ? String(getVal('Education / Profession', 'Education', 'education', 'educationprofession')).trim().slice(0, 120)
        : null;

      // 13. Occupation
      const occupation = getVal('Occupation', 'occupation', 'profession', 'job')
        ? String(getVal('Occupation', 'occupation', 'profession', 'job')).trim().slice(0, 120)
        : null;

      // 14. Income Range
      const incomeRange = getVal('Income Range', 'incomerange', 'income')
        ? String(getVal('Income Range', 'incomerange', 'income')).trim().slice(0, 40)
        : null;

      // 15. About
      const about = getVal('About', 'about', 'bio', 'description')
        ? String(getVal('About', 'about', 'bio', 'description')).trim()
        : null;

      // 16. Partner Preferences
      const partnerPref = getVal('Partner Preferences', 'partnerpref', 'partnerpreference', 'preferences')
        ? String(getVal('Partner Preferences', 'partnerpref', 'partnerpreference', 'preferences')).trim()
        : null;

      // 17. Contact Phone
      const contactPhone = getVal('Contact Phone', 'Phone', 'contactphone', 'phone', 'mobile')
        ? String(getVal('Contact Phone', 'Phone', 'contactphone', 'phone', 'mobile')).trim().slice(0, 20)
        : null;

      // 18. Contact Email
      const contactEmail = getVal('Contact Email', 'Email', 'contactemail', 'email')
        ? String(getVal('Contact Email', 'Email', 'contactemail', 'email')).trim().slice(0, 150)
        : null;

      // 19. Status
      let status = getVal('Status', 'status');
      if (status) {
        const st = String(status).trim().toLowerCase();
        if (['pending', 'approved', 'rejected', 'hidden'].includes(st)) status = st;
        else status = 'approved';
      } else {
        status = 'approved';
      }

      values.push(
        DEFAULT_USER_ID,
        refCode,
        profileFor,
        String(fullName).trim().slice(0, 100),
        gender,
        birthDate,
        heightCm,
        maritalStatus,
        religion,
        caste,
        districtId,
        education,
        occupation,
        incomeRange,
        about,
        partnerPref,
        contactPhone,
        contactEmail,
        consentGiven,
        status
      );

      placeholders.push(`(${Array(20).fill('?').join(',')})`);
    }

    if (!values.length) {
      return res.status(400).json({ error: `No valid profiles could be imported (skipped: ${skipped})` });
    }

    const sql = `INSERT INTO profiles
      (user_id, ref_code, profile_for, full_name, gender, birth_date,
       height_cm, marital_status, religion, caste, district_id,
       education, occupation, income_range, about, partner_pref,
       contact_phone, contact_email, consent_given, status)
      VALUES ${placeholders.join(',')}`;

    const [result] = await db.query(sql, values);

    // Clean up temporary uploaded file
    try { require('fs').unlinkSync(req.file.path); } catch (e) {}

    res.json({
      ok: true,
      inserted: result.affectedRows,
      skipped,
      total: rows.length
    });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: err.message || 'Server error during import' });
  }
});

// UPDATE a profile (admin full update)
router.put('/profiles/:id', async (req, res) => {
  try {
    const p = req.body;
    await db.query(
      `UPDATE profiles SET
         profile_for=?, full_name=?, gender=?, birth_date=?, height_cm=?,
         marital_status=?, religion=?, caste=?, district_id=?, education=?,
         occupation=?, income_range=?, about=?, partner_pref=?,
         contact_phone=?, contact_email=?, status=?
       WHERE id = ?`,
      [
        p.profile_for, p.full_name, p.gender, p.birth_date, p.height_cm || null,
        p.marital_status, p.religion, p.caste || null, p.district_id || null,
        p.education || null, p.occupation || null, p.income_range || null,
        p.about || null, p.partner_pref || null, p.contact_phone || null,
        p.contact_email || null, p.status || 'approved', req.params.id,
      ]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve / reject / hide a profile (quick status change)
router.patch('/profiles/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'hidden', 'pending'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });
    await db.query('UPDATE profiles SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE a profile
router.delete('/profiles/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM profiles WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ═══════════════════════════════
   REPORTS MANAGEMENT
═══════════════════════════════ */

router.get('/reports', async (req, res) => {
  try {
    const status = req.query.status || 'open';
    const query = status === 'all'
      ? `SELECT r.*, u.email AS reporter_email, p.full_name AS profile_name
         FROM reports r JOIN users u ON u.id = r.reporter_id JOIN profiles p ON p.id = r.profile_id
         ORDER BY r.created_at DESC`
      : `SELECT r.*, u.email AS reporter_email, p.full_name AS profile_name
         FROM reports r JOIN users u ON u.id = r.reporter_id JOIN profiles p ON p.id = r.profile_id
         WHERE r.status = ? ORDER BY r.created_at ASC`;
    const [rows] = status === 'all' ? await db.query(query) : await db.query(query, [status]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/reports/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'reviewed', 'closed'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });
    await db.query('UPDATE reports SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/reports/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM reports WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ═══════════════════════════════
   DISTRICTS MANAGEMENT
═══════════════════════════════ */

router.get('/districts', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM districts ORDER BY id');
  res.json(rows);
});

router.post('/districts', async (req, res) => {
  const { name_en, name_si, name_ta, province } = req.body;
  const [r] = await db.query(
    'INSERT INTO districts (name_en, name_si, name_ta, province) VALUES (?,?,?,?)',
    [name_en, name_si, name_ta, province]
  );
  res.status(201).json({ id: r.insertId });
});

router.put('/districts/:id', async (req, res) => {
  const { name_en, name_si, name_ta, province } = req.body;
  await db.query(
    'UPDATE districts SET name_en=?, name_si=?, name_ta=?, province=? WHERE id=?',
    [name_en, name_si, name_ta, province, req.params.id]
  );
  res.json({ ok: true });
});

router.delete('/districts/:id', async (req, res) => {
  await db.query('DELETE FROM districts WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
