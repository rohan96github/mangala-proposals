const router = require('express').Router();
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const refCode = () => 'M' + Math.random().toString(36).slice(2, 8).toUpperCase();

// Create profile
router.post('/', requireAuth, async (req, res) => {
  try {
    const p = req.body;
    const [r] = await db.query(
      `INSERT INTO profiles
       (user_id, ref_code, profile_for, full_name, gender, birth_date, height_cm,
        marital_status, religion, caste, district_id, education, occupation, income_range,
        about, partner_pref, contact_phone, contact_email)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.user.id, refCode(), p.profile_for, p.full_name, p.gender, p.birth_date,
        p.height_cm || null, p.marital_status, p.religion, p.caste || null,
        p.district_id || null, p.education || null, p.occupation || null,
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

// Search / list (public, no contact details)
router.get('/', async (req, res) => {
  try {
    const { gender, religion, district_id, min_age, max_age, caste } = req.query;
    let sql = `
      SELECT p.id, p.ref_code, p.full_name, p.gender, p.religion, p.caste,
             p.education, p.occupation, p.height_cm, p.marital_status,
             d.name_en AS district_en, d.name_si AS district_si, d.name_ta AS district_ta,
             TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) AS age,
             (SELECT file_path FROM profile_photos ph WHERE ph.profile_id = p.id AND ph.is_primary = 1 LIMIT 1) AS photo
      FROM profiles p
      LEFT JOIN districts d ON d.id = p.district_id
      WHERE p.status = 'approved'`;
    const args = [];
    if (gender)      { sql += ' AND p.gender = ?';      args.push(gender); }
    if (religion)    { sql += ' AND p.religion = ?';    args.push(religion); }
    if (district_id) { sql += ' AND p.district_id = ?'; args.push(district_id); }
    if (caste)       { sql += ' AND p.caste LIKE ?';    args.push(`%${caste}%`); }
    if (min_age)     { sql += ' AND TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) >= ?'; args.push(Number(min_age)); }
    if (max_age)     { sql += ' AND TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) <= ?'; args.push(Number(max_age)); }
    sql += ' ORDER BY p.created_at DESC LIMIT 50';
    const [rows] = await db.query(sql, args);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single profile (public view - no contact)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, d.name_en AS district_en, d.name_si AS district_si, d.name_ta AS district_ta,
              TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) AS age
       FROM profiles p
       LEFT JOIN districts d ON d.id = p.district_id
       WHERE p.id = ? AND p.status = 'approved'`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Profile not found' });
    const profile = rows[0];
    // Strip contact info from public view
    delete profile.contact_phone;
    delete profile.contact_email;

    // Fetch photos
    const [photos] = await db.query(
      'SELECT id, file_path, is_primary FROM profile_photos WHERE profile_id = ?',
      [req.params.id]
    );
    profile.photos = photos;
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get contact details: only if viewer's profile has an accepted interest
router.get('/:id/contact', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.contact_phone, p.contact_email
       FROM profiles p
       JOIN interests i ON i.to_profile_id = p.id AND i.status = 'accepted'
       JOIN profiles me ON me.id = i.from_profile_id AND me.user_id = ?
       WHERE p.id = ?`,
      [req.user.id, req.params.id]
    );
    if (!rows.length) return res.status(403).json({ error: 'Contact not unlocked yet' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update own profile
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const [check] = await db.query(
      'SELECT id FROM profiles WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!check.length) return res.status(403).json({ error: 'Not your profile' });
    const p = req.body;
    await db.query(
      `UPDATE profiles SET profile_for=?, full_name=?, gender=?, birth_date=?, height_cm=?,
       marital_status=?, religion=?, caste=?, district_id=?, education=?, occupation=?,
       income_range=?, about=?, partner_pref=?, contact_phone=?, contact_email=?, status='pending'
       WHERE id = ?`,
      [
        p.profile_for, p.full_name, p.gender, p.birth_date, p.height_cm || null,
        p.marital_status, p.religion, p.caste || null, p.district_id || null,
        p.education || null, p.occupation || null, p.income_range || null,
        p.about || null, p.partner_pref || null, p.contact_phone || null,
        p.contact_email || null, req.params.id,
      ]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload photo for a profile
router.post('/:id/photo', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    const [check] = await db.query(
      'SELECT id FROM profiles WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!check.length) return res.status(403).json({ error: 'Not your profile' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // If it's the first photo, make it primary
    const [existing] = await db.query(
      'SELECT COUNT(*) AS cnt FROM profile_photos WHERE profile_id = ?',
      [req.params.id]
    );
    const isPrimary = existing[0].cnt === 0 ? 1 : 0;

    await db.query(
      'INSERT INTO profile_photos (profile_id, file_path, is_primary) VALUES (?,?,?)',
      [req.params.id, req.file.filename, isPrimary]
    );
    res.status(201).json({ file: req.file.filename, isPrimary });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// My profiles
router.get('/my/list', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, d.name_en AS district_en,
              TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) AS age,
              (SELECT file_path FROM profile_photos ph WHERE ph.profile_id = p.id AND ph.is_primary = 1 LIMIT 1) AS photo
       FROM profiles p
       LEFT JOIN districts d ON d.id = p.district_id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
