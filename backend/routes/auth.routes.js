const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */

/** Generate a 6-digit OTP */
const genOTP = () => String(Math.floor(100000 + Math.random() * 900000));

/** "Send" OTP — in dev mode, log it and return it in the response.
 *  Replace this function with a real SMS API (Twilio, Dialog, etc.) in production.
 */
const sendSMS = async (phone, otp) => {
  console.log(`\n📱 [DEV OTP] Phone: ${phone}  →  OTP: ${otp}\n`);
  // TODO: integrate real SMS gateway here
  // e.g. await twilioClient.messages.create({ to: phone, body: `Your OTP is ${otp}`, from: '+1...' });
  return true;
};

/* ─────────────────────────────────────────
   STEP 1 — Customer Registration (self)
   POST /api/auth/register
   Body: { email, phone, password, preferred_lang }
   Returns: { userId, message, devOtp (dev mode only) }
───────────────────────────────────────── */
router.post(
  '/register',
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty().withMessage('Phone number is required for OTP verification'),
  body('password').isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, phone, password, preferred_lang } = req.body;
    const lang = ['si', 'en', 'ta'].includes(preferred_lang) ? preferred_lang : 'si';

    // Check existing email
    const [exists] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const otp  = genOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const [r] = await db.query(
      `INSERT INTO users
         (email, phone, password_hash, preferred_lang, is_verified, otp_code, otp_expires_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [email, phone, hash, lang, otp, expiresAt]
    );

    await sendSMS(phone, otp);

    res.status(201).json({
      userId: r.insertId,
      message: 'Registration successful. Please verify your mobile number with the OTP sent.',
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined, // only in dev!
    });
  }
);

/* ─────────────────────────────────────────
   STEP 2 — Verify Mobile OTP
   POST /api/auth/verify-otp
   Body: { userId, otp }
───────────────────────────────────────── */
router.post('/verify-otp', async (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) return res.status(400).json({ error: 'userId and otp required' });

  const [rows] = await db.query(
    'SELECT id, otp_code, otp_expires_at, is_verified FROM users WHERE id = ?',
    [userId]
  );
  const user = rows[0];
  if (!user)              return res.status(404).json({ error: 'User not found' });
  if (user.is_verified)   return res.status(200).json({ message: 'Already verified' });
  if (user.otp_code !== String(otp))
                          return res.status(400).json({ error: 'Invalid OTP' });
  if (new Date() > new Date(user.otp_expires_at))
                          return res.status(400).json({ error: 'OTP expired. Request a new one.' });

  await db.query(
    'UPDATE users SET is_verified = 1, otp_code = NULL, otp_expires_at = NULL WHERE id = ?',
    [userId]
  );
  res.json({ message: 'Mobile number verified successfully! You can now login.' });
});

/* ─────────────────────────────────────────
   Resend OTP
   POST /api/auth/resend-otp
   Body: { userId }
───────────────────────────────────────── */
router.post('/resend-otp', async (req, res) => {
  const { userId } = req.body;
  const [rows] = await db.query('SELECT id, phone, is_verified FROM users WHERE id = ?', [userId]);
  const user = rows[0];
  if (!user)            return res.status(404).json({ error: 'User not found' });
  if (user.is_verified) return res.status(200).json({ message: 'Already verified' });

  const otp = genOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db.query(
    'UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?',
    [otp, expiresAt, userId]
  );
  await sendSMS(user.phone, otp);

  res.json({
    message: 'New OTP sent.',
    devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
  });
});

/* ─────────────────────────────────────────
   Login (customers + admin — same endpoint)
   POST /api/auth/login
   Body: { email, password }
   - Customers: must be is_verified = 1
   - Admins: bypass OTP check (admin_created or role=admin)
───────────────────────────────────────── */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const queryEmail = (email === 'root' || email === 'admin') ? 'admin@youremail.com' : email;

  const [rows] = await db.query(
    'SELECT * FROM users WHERE email = ? AND is_active = 1',
    [queryEmail]
  );
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ error: 'Wrong email or password' });

  // Admins can always login (they are set up by DB directly)
  if (user.role !== 'admin' && !user.is_verified)
    return res.status(403).json({
      error: 'Mobile number not verified',
      needsVerification: true,
      userId: user.id,
    });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, role: user.role, preferred_lang: user.preferred_lang });
});

/* ─────────────────────────────────────────
   Admin Login (same endpoint, frontend enforces admin-only UI)
   POST /api/auth/admin-login
   Returns 403 if not admin
───────────────────────────────────────── */
router.post('/admin-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const queryEmail = (email === 'root' || email === 'admin') ? 'admin@youremail.com' : email;

  const [rows] = await db.query(
    "SELECT * FROM users WHERE email = ? AND role = 'admin' AND is_active = 1",
    [queryEmail]
  );
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ error: 'Invalid admin credentials' });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );
  res.json({ token, role: user.role, preferred_lang: user.preferred_lang });
});

/* ─────────────────────────────────────────
   Update preferred language
   PATCH /api/auth/language
───────────────────────────────────────── */
router.patch('/language', requireAuth, async (req, res) => {
  const lang = ['si', 'en', 'ta'].includes(req.body.preferred_lang)
    ? req.body.preferred_lang : 'si';
  await db.query('UPDATE users SET preferred_lang = ? WHERE id = ?', [lang, req.user.id]);
  res.json({ ok: true });
});

/* ─────────────────────────────────────────
   Get current user info
   GET /api/auth/me
───────────────────────────────────────── */
router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, email, phone, role, preferred_lang, is_verified, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

module.exports = router;
