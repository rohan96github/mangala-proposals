const router = require('express').Router();
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');

// Send interest
router.post('/', requireAuth, async (req, res) => {
  try {
    const { from_profile_id, to_profile_id } = req.body;
    if (!from_profile_id || !to_profile_id)
      return res.status(400).json({ error: 'from_profile_id and to_profile_id required' });

    // Verify the from_profile belongs to this user
    const [check] = await db.query(
      'SELECT id FROM profiles WHERE id = ? AND user_id = ?',
      [from_profile_id, req.user.id]
    );
    if (!check.length) return res.status(403).json({ error: 'Not your profile' });

    const [r] = await db.query(
      'INSERT INTO interests (from_profile_id, to_profile_id) VALUES (?,?)',
      [from_profile_id, to_profile_id]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Interest already sent' });
    res.status(500).json({ error: 'Server error' });
  }
});

// List interests received by my profiles
router.get('/received', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.id, i.status, i.created_at,
              fp.id AS from_id, fp.full_name AS from_name, fp.gender AS from_gender,
              fp.ref_code AS from_ref,
              TIMESTAMPDIFF(YEAR, fp.birth_date, CURDATE()) AS from_age,
              tp.id AS to_id, tp.full_name AS to_name, tp.ref_code AS to_ref
       FROM interests i
       JOIN profiles fp ON fp.id = i.from_profile_id
       JOIN profiles tp ON tp.id = i.to_profile_id AND tp.user_id = ?
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// List interests sent by my profiles
router.get('/sent', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.id, i.status, i.created_at,
              fp.id AS from_id, fp.full_name AS from_name, fp.ref_code AS from_ref,
              tp.id AS to_id, tp.full_name AS to_name, tp.ref_code AS to_ref,
              TIMESTAMPDIFF(YEAR, tp.birth_date, CURDATE()) AS to_age,
              tp.gender AS to_gender
       FROM interests i
       JOIN profiles fp ON fp.id = i.from_profile_id AND fp.user_id = ?
       JOIN profiles tp ON tp.id = i.to_profile_id
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept or decline interest
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'declined'].includes(status))
      return res.status(400).json({ error: 'status must be accepted or declined' });

    // Verify that the to_profile belongs to this user
    const [check] = await db.query(
      `SELECT i.id FROM interests i
       JOIN profiles p ON p.id = i.to_profile_id AND p.user_id = ?
       WHERE i.id = ?`,
      [req.user.id, req.params.id]
    );
    if (!check.length) return res.status(403).json({ error: 'Not authorised' });

    await db.query('UPDATE interests SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
