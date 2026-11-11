require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Security
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate-limit auth endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
app.use('/api/auth', authLimiter);

// Routes
app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/profiles',  require('./routes/profile.routes'));
app.use('/api/interests', require('./routes/interest.routes'));
app.use('/api/admin',     require('./routes/admin.routes'));

// Districts endpoint (trilingual)
app.get('/api/districts', async (req, res) => {
  try {
    const [rows] = await require('./config/db').query(
      'SELECT id, name_en, name_si, name_ta, province FROM districts ORDER BY id'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

// Submit a report
app.post('/api/reports', async (req, res) => {
  try {
    const { profile_id, reporter_id, reason } = req.body;
    await require('./config/db').query(
      'INSERT INTO reports (profile_id, reporter_id, reason) VALUES (?,?,?)',
      [profile_id, reporter_id, reason]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅  API running on http://localhost:${PORT}`)
);
